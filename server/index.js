// Load environment variables FIRST
require('dotenv').config();

// Log critical environment variables (for debugging)
console.log('🔧 Environment Check:');
console.log('  NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('  MONGO_URI:', process.env.MONGO_URI ? '✅ Set' : '❌ Missing');
console.log('  JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Missing (using fallback)');
console.log('  CLIENT_URL:', process.env.CLIENT_URL || 'http://localhost:8080 (default)');
console.log('  CORS_ORIGINS:', process.env.CORS_ORIGINS ? '✅ Set' : 'Using defaults');

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const csrf = require('csurf');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_your_secret_key_here');

const connectDB = require('./config/db');
const User = require('./models/User');
const AuditLog = require('./models/AuditLog');
const WebhookEvent = require('./models/WebhookEvent');
const { authGuard } = require('./utils/jwt');
const { apiLimiter, authLimiter } = require('./middleware/rateLimiter');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const subscriptionRoutes = require('./routes/subscription');
const dashboardRoutes = require('./routes/dashboard');
const n8nRoutes = require('./routes/n8n');
const demoRoutes = require('./routes/demo');

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy - REQUIRED for deployment platforms like Render, Heroku, etc.
// This allows Express to trust X-Forwarded-* headers for rate limiting and IP detection
app.set('trust proxy', 1);

// Connect to MongoDB
connectDB();

// Security & Core Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
// CORS with allowed origins list (supports Vite defaults)
const defaultClient = process.env.CLIENT_URL || 'http://localhost:8080';
const allowed = (process.env.CORS_ORIGINS || `${defaultClient},https://www.aivors.com,https://aivors-1.onrender.com,https://aivors-5hvj.onrender.com,http://localhost:8080,http://127.0.0.1:8080,http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000`)
  .split(',')
  .map(origin => origin.trim());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow non-browser tools
    if (allowed.includes(origin)) return callback(null, true);
    console.log(`❌ CORS blocked for origin: ${origin}. Allowed origins:`, allowed);
    return callback(new Error(`CORS not allowed for origin: ${origin}`));
  },
  credentials: true,
}));
app.use(cookieParser());
// Stripe webhook needs raw body BEFORE express.json
app.use('/api/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// CSRF Protection (cookie-based). Exempt auth entry points that handle their own security
const csrfProtection = csrf({ 
  cookie: { 
    httpOnly: true, 
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production' 
  } 
});
app.use((req, res, next) => {
  // Allow preflight without CSRF
  if (req.method === 'OPTIONS') return next();
  
  // Skip CSRF for these routes:
  // - /api/webhook: Stripe webhooks use signature verification instead
  // - /api/health: Public health check endpoint
  // - /api/auth/refresh: Called on page load before CSRF token exists
  // - /api/auth/logout: Protected by authGuard (JWT cookie), CSRF would block logout
  // - /api/auth/login: Protected by password verification, CSRF adds friction
  // - /api/auth/signup: New user registration, no prior session
  // - /api/auth/verify-otp: OTP verification for new users
  // - /api/auth/resend-otp: OTP resend for new users
  // - /api/demo/*: Demo booking with OTP verification
  // - /api/admin/*: All admin endpoints protected by authGuard + adminGuard
  // - /api/dashboard: Protected by authGuard
  // - Stripe endpoints: Already protected by authGuard, CSRF adds unnecessary friction
  const ignored = req.path.startsWith('/api/webhook') 
    || req.path === '/api/health'
    || req.path === '/api/auth/refresh'
    || req.path === '/api/auth/logout'
    || req.path === '/api/auth/login'
    || req.path === '/api/auth/signup'
    || req.path === '/api/auth/verify-otp'
    || req.path === '/api/auth/resend-otp'
    || req.path.startsWith('/api/demo')
    || req.path.startsWith('/api/admin')
    || req.path.startsWith('/api/dashboard')
    || req.path === '/api/create-checkout-session'
    || req.path === '/api/activate-subscription'
    || req.path === '/api/cancel-subscription'
    || req.path === '/api/create-portal-session';
  
  return ignored ? next() : csrfProtection(req, res, next);
});

// Provide CSRF token for clients (GET);
app.get('/api/csrf-token', (req, res) => {
  const token = req.csrfToken();
  res.cookie('XSRF-TOKEN', token, { 
    httpOnly: false, 
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production' 
  });
  res.json({ csrfToken: token });
});

// Rate limiting
app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter);

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/n8n', n8nRoutes);
app.use('/api/demo', demoRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    mongodb: require('mongoose').connection.readyState === 1 ? 'connected' : 'disconnected',
    email: process.env.EMAIL_SERVICE ? 'configured' : 'not configured'
  });
});

// Root endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString()
  });
});

// Create Stripe Checkout Session
app.post('/api/create-checkout-session', authGuard, async (req, res, next) => {
  try {
    const { priceId, planName, credits } = req.body;

    console.log('💳 Checkout session request:', {
      priceId,
      planName,
      userId: req.user.userId,
      origin: req.get('origin'),
    });

    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_your_secret_key_here') {
      console.log('❌ Stripe not configured');
      return res.status(500).json({ 
        error: 'Stripe not configured',
        message: 'Please set your STRIPE_SECRET_KEY in server/.env file. Get it from https://dashboard.stripe.com/test/apikeys',
        url: null
      });
    }

    // Get user
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Price and minutes mapping
    // const pricingMap = {
    //   price_free: { amount: 0, minutes: 0 },
    //   price_pro_monthly: { amount: 99900, minutes: 500 }, // ₹999 for 500 minutes
    //   price_enterprise_monthly: { amount: 199900, minutes: 1500 }, // ₹1999 for 1500 minutes
    //   price_credits_addon: { amount: 19900, minutes: 100 }, // ₹199 for 100 minutes
    // };

    // const pricing = pricingMap[priceId] || pricingMap.price_pro_monthly;
    // --- Updated Pricing Map (USD-based) ---
// 1 USD = ₹83
// --- Updated Pricing Map (USD-based) ---
// 1 USD = ₹83
const pricingMap = {
  price_starter_monthly: { amount: 49 * 100, minutes: 50, plan: 'Starter Monthly' },
  price_starter_yearly: { amount: 290 * 100  , minutes: 600, plan: 'Starter Yearly' },

  price_pro_monthly: { amount: 375  * 100, minutes: 2000, plan: 'Pro Monthly' },
  price_pro_yearly: { amount: 3750* 100 , minutes: 24000, plan: 'Pro Yearly' },

  price_growth_monthly: { amount: 750 * 100 , minutes: 4000, plan: 'Growth Monthly' },
  price_growth_yearly: { amount: 7500 * 100 , minutes: 48000, plan: 'Growth Yearly' },

  price_agency_monthly: { amount: 1250 * 100 , minutes: 6000, plan: 'Agency Monthly' },
  price_agency_yearly: { amount: 12500 * 100 , minutes: 72000, plan: 'Agency Yearly' },

  price_enterprise_custom: { amount: 0, minutes: 0, plan: 'Enterprise Custom' },
  price_enterprise_custom_yearly: { amount: 0, minutes: 0, plan: 'Enterprise Custom Yearly' },
};

const pricing = pricingMap[priceId] || pricingMap.price_starter_monthly;

    

    // For free plan, don't create checkout session
    if (priceId === 'price_free') {
      return res.json({ 
        success: true, 
        message: 'Free plan selected',
        url: null 
      });
    }

    // Create or get Stripe customer
    let customerId = user.subscription.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: user._id.toString(),
        },
      });
      customerId = customer.id;
      user.subscription.stripeCustomerId = customerId;
      await user.save();
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: planName || 'AI Voice Subscription',
              description: `${pricing.minutes} minutes of AI voice calls`,
            },
            unit_amount: pricing.amount,
            recurring: priceId.includes('addon') ? undefined : {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: priceId.includes('addon') ? 'payment' : 'subscription',
      success_url: `${process.env.CLIENT_URL || 'http://localhost:8080'}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL || 'http://localhost:8080'}/pricing`,
      metadata: {
        userId: user._id.toString(),
        priceId,
        planName,
        minutes: pricing.minutes.toString(),
      },
    });

    // Create audit log
    await AuditLog.create({
      userId: user._id,
      eventType: 'CHECKOUT_CREATED',
      payload: { priceId, planName, sessionId: session.id },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({ url: session.url });
  } catch (error) {
    error.status = 500;
    next(error);
  }
});

// Stripe Webhook Handler
app.post('/api/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Idempotency: skip if already processed
  const exists = await WebhookEvent.findOne({ eventId: event.id });
  if (exists) {
    return res.json({ received: true, duplicate: true });
  }
  await WebhookEvent.create({ eventId: event.id, type: event.type, raw: event });

  // Log webhook receipt
  console.log(`Webhook received: ${event.type}`);

  try {
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata.userId;
        const minutes = parseInt(session.metadata.minutes || '0');
        const planName = session.metadata.planName;

        const user = await User.findById(userId);
        if (user) {
          // Update subscription
          user.subscription.status = 'active';
          user.subscription.plan = planName;
          user.subscription.minutesPurchased += minutes;
          user.subscription.minutesRemaining += minutes;
          user.subscription.stripeCustomerId = session.customer;
          user.subscription.stripeSubscriptionId = session.subscription || session.id;
          user.subscription.startDate = new Date();
          
          // Calculate next billing date (30 days from now for subscriptions)
          if (session.mode === 'subscription') {
            const nextBilling = new Date();
            nextBilling.setDate(nextBilling.getDate() + 30);
            user.subscription.nextBillingDate = nextBilling;
          }

          // Update user status
          user.status = 'active';
          await user.save();

          // Create audit log
          await AuditLog.create({
            userId: user._id,
            eventType: 'SUBSCRIPTION_ACTIVATED',
            payload: { 
              sessionId: session.id,
              plan: planName,
              minutes,
              amount: session.amount_total,
            },
          });

          console.log(`✅ Subscription activated for user ${user.email}`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const user = await User.findOne({ 'subscription.stripeSubscriptionId': subscription.id });
        
        if (user) {
          user.subscription.status = subscription.status;
          await user.save();

          await AuditLog.create({
            userId: user._id,
            eventType: 'SUBSCRIPTION_MODIFIED',
            payload: { 
              subscriptionId: subscription.id,
              status: subscription.status,
            },
          });

          console.log(`✅ Subscription updated for user ${user.email}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const user = await User.findOne({ 'subscription.stripeSubscriptionId': subscription.id });
        
        if (user) {
          user.subscription.status = 'cancelled';
          user.status = 'cancelled';
          await user.save();

          await AuditLog.create({
            userId: user._id,
            eventType: 'SUBSCRIPTION_CANCELLED',
            payload: { 
              subscriptionId: subscription.id,
              reason: 'customer_cancelled',
            },
          });

          console.log(`✅ Subscription cancelled for user ${user.email}`);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const user = await User.findOne({ 'subscription.stripeCustomerId': invoice.customer });
        
        if (user && invoice.billing_reason === 'subscription_cycle') {
          // Renew minutes for the new billing cycle
          const plan = user.subscription.plan;
          const minutesToAdd = plan === 'Pro' ? 500 : plan === 'Enterprise' ? 1500 : 0;
          
          user.subscription.minutesPurchased += minutesToAdd;
          user.subscription.minutesRemaining += minutesToAdd;
          
          // Update next billing date
          const nextBilling = new Date();
          nextBilling.setDate(nextBilling.getDate() + 30);
          user.subscription.nextBillingDate = nextBilling;
          
          await user.save();

          await AuditLog.create({
            userId: user._id,
            eventType: 'PAYMENT_SUCCEEDED',
            payload: { 
              invoiceId: invoice.id,
              amount: invoice.amount_paid,
              minutesAdded: minutesToAdd,
            },
          });

          console.log(`✅ Payment succeeded for user ${user.email}, added ${minutesToAdd} minutes`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const user = await User.findOne({ 'subscription.stripeCustomerId': invoice.customer });
        
        if (user) {
          user.subscription.status = 'past_due';
          await user.save();

          await AuditLog.create({
            userId: user._id,
            eventType: 'PAYMENT_FAILED',
            payload: { 
              invoiceId: invoice.id,
              amount: invoice.amount_due,
            },
          });

          console.log(`❌ Payment failed for user ${user.email}`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Always log webhook event
    await AuditLog.create({
      eventType: 'WEBHOOK_RECEIVED',
      payload: { 
        type: event.type,
        id: event.id,
      },
    });

  } catch (error) {
    console.error('Error processing webhook:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }

  res.json({ received: true });
});

// Get subscription details
app.get('/api/subscription/:customerId', async (req, res, next) => {
  try {
    const { customerId } = req.params;

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return res.json({ subscription: null });
    }

    res.json({ subscription: subscriptions.data[0] });
  } catch (error) {
    error.status = 500;
    next(error);
  }
});

// Activate subscription after successful payment
app.post('/api/activate-subscription', authGuard, async (req, res, next) => {
  try {
    const { sessionId } = req.body;

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return res.status(400).json({ 
        error: 'Payment not completed',
        message: 'Payment must be completed before activating subscription' 
      });
    }

    // Get user
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already activated
    if (user.status === 'active' && user.subscription.stripeSubscriptionId === session.subscription) {
      return res.json({ 
        success: true,
        message: 'Subscription already active',
        user: user.toSafeObject(),
      });
    }

    // Extract plan details from metadata
    const { planName, minutes } = session.metadata;
    const minutesInt = parseInt(minutes || '0');

    // Update user subscription
    user.subscription.status = 'active';
    user.subscription.plan = planName;
    user.subscription.minutesPurchased += minutesInt;
    user.subscription.minutesRemaining += minutesInt;
    user.subscription.stripeCustomerId = session.customer;
    user.subscription.stripeSubscriptionId = session.subscription || session.id;
    user.subscription.startDate = new Date();
    
    if (session.mode === 'subscription') {
      const nextBilling = new Date();
      nextBilling.setDate(nextBilling.getDate() + 30);
      user.subscription.nextBillingDate = nextBilling;
    }

    user.status = 'active';
    await user.save();

    // Create audit log
    await AuditLog.create({
      userId: user._id,
      eventType: 'SUBSCRIPTION_ACTIVATED',
      payload: { 
        sessionId,
        plan: planName,
        minutes: minutesInt,
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({ 
      success: true,
      message: 'Subscription activated successfully',
      user: user.toSafeObject(),
    });
  } catch (error) {
    error.status = 500;
    next(error);
  }
});

// Cancel subscription
app.post('/api/cancel-subscription', authGuard, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const subscriptionId = user.subscription.stripeSubscriptionId;
    if (!subscriptionId) {
      return res.status(400).json({ error: 'No active subscription found' });
    }

    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    // Create audit log
    await AuditLog.create({
      userId: user._id,
      eventType: 'SUBSCRIPTION_CANCELLED',
      payload: { 
        subscriptionId,
        cancelAtPeriodEnd: true,
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({ 
      success: true, 
      subscription,
      message: 'Subscription will be cancelled at the end of the billing period' 
    });
  } catch (error) {
    error.status = 500;
    next(error);
  }
});

// Create a Stripe Customer Portal session
app.post('/api/create-portal-session', authGuard, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || !user.subscription.stripeCustomerId) {
      return res.status(400).json({ error: 'Missing Stripe customer id' });
    }
    const session = await stripe.billingPortal.sessions.create({
      customer: user.subscription.stripeCustomerId,
      return_url: `${process.env.CLIENT_URL || 'http://localhost:8080'}/dashboard`,
    });
    res.json({ url: session.url });
  } catch (error) {
    error.status = 500;
    next(error);
  }
});

// Start server
// Not found and error handlers
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🌐 CORS allowed origins: ${allowed.join(', ')}`);
  console.log(`📝 API Endpoints:`);
  console.log(`\n   Auth:`);
  console.log(`   - POST http://localhost:${PORT}/api/auth/signup`);
  console.log(`   - POST http://localhost:${PORT}/api/auth/login`);
  console.log(`   - POST http://localhost:${PORT}/api/auth/logout`);
  console.log(`   - GET  http://localhost:${PORT}/api/auth/me`);
  console.log(`\n   Admin:`);
  console.log(`   - POST http://localhost:${PORT}/api/admin/login`);
  console.log(`   - GET  http://localhost:${PORT}/api/admin/users`);
  console.log(`   - PUT  http://localhost:${PORT}/api/admin/users/:id/subscription`);
  console.log(`   - PUT  http://localhost:${PORT}/api/admin/users/:id/status`);
  console.log(`   - GET  http://localhost:${PORT}/api/admin/audit-logs`);
  console.log(`\n   Stripe:`);
  console.log(`   - POST http://localhost:${PORT}/api/create-checkout-session`);
  console.log(`   - POST http://localhost:${PORT}/api/activate-subscription`);
  console.log(`   - POST http://localhost:${PORT}/api/webhook`);
  console.log(`   - POST http://localhost:${PORT}/api/cancel-subscription`);
  console.log(`\n   Subscription:`);
  console.log(`   - GET  http://localhost:${PORT}/api/subscription/me`);
  console.log(`\n   Dashboard:`);
  console.log(`   - GET  http://localhost:${PORT}/api/dashboard`);
  console.log(`   - GET  http://localhost:${PORT}/api/dashboard/:userId`);
  console.log('');
  console.log('⚠️  Environment variables:');
  console.log('   - MONGO_URI:', process.env.MONGO_URI ? '✅ Set' : '❌ Missing');
  console.log('   - JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Missing');
  console.log('   - STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? '✅ Set' : '❌ Missing');
  console.log('   - STRIPE_WEBHOOK_SECRET:', process.env.STRIPE_WEBHOOK_SECRET ? '✅ Set' : '❌ Missing');
  console.log('   - CLIENT_URL:', process.env.CLIENT_URL || 'http://localhost:8080 (default)');
});
