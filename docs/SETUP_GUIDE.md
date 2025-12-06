# Elite Render Engine - AI Voice SaaS Platform

## 🚀 Production Setup Guide

### Prerequisites
- Node.js 18+ installed
- MongoDB installed and running locally or MongoDB Atlas account
- Stripe account with API keys

---

## 📦 Installation

### 1. Install Dependencies

**Frontend:**
```powershell
npm install
```

**Backend:**
```powershell
cd server
npm install
```

---

## ⚙️ Configuration

### 2. Backend Environment Variables

Create/update `server/.env`:

```env
# MongoDB
MONGO_URI=mongodb://localhost:27017/eliteRenderDB
# Or use MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/eliteRenderDB

# JWT Secret (generate a random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Stripe Keys (get from https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY=sk_live_your_live_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Client URL
CLIENT_URL=http://localhost:8080

# Server Port
PORT=3001

# Admin Account (for seeding)
ADMIN_EMAIL=admin@eliterender.com
ADMIN_PASSWORD=admin123
ADMIN_NAME=Admin User
```

### 3. Frontend Environment Variables

Create `/.env`:

```env
VITE_API_URL=http://localhost:3001
```

---

## 🗄️ Database Setup

### 4. Start MongoDB

**Option A: Local MongoDB**
```powershell
# Start MongoDB service (if installed locally)
net start MongoDB
```

**Option B: MongoDB Atlas**
- Create a free cluster at https://www.mongodb.com/cloud/atlas
- Get connection string and update MONGO_URI in server/.env

### 5. Seed Admin Account

```powershell
cd server
npm run seed
```

This creates an admin user with credentials from your .env file (default: admin@eliterender.com / admin123)

---

## 🏃 Running the Application

### 6. Start Backend Server

```powershell
cd server
npm run dev
```

Server runs on http://localhost:3001

### 7. Start Frontend Development Server

```powershell
# In project root
npm run dev
```

Frontend runs on http://localhost:8080

---

## 🔐 Authentication System

### User Flow:
1. **Sign Up** → Creates user with `status: 'pending_payment'`
2. **Choose Plan** → Redirects to pricing
3. **Checkout** → Stripe payment
4. **Webhook** → Activates subscription → `status: 'active'`
5. **Login** → Access dashboard

### Admin Flow:
1. Visit `/admin/login`
2. Sign in with admin credentials
3. Access admin panel at `/admin`

---

## 💳 Stripe Integration

### 8. Configure Stripe Webhooks

1. **Install Stripe CLI:** https://stripe.com/docs/stripe-cli
2. **Login to Stripe:**
   ```powershell
   stripe login
   ```
3. **Forward webhooks to local server:**
   ```powershell
   stripe listen --forward-to localhost:3001/api/webhook
   ```
4. **Copy webhook secret** and update `STRIPE_WEBHOOK_SECRET` in server/.env

### Webhook Events Handled:
- `checkout.session.completed` - Activates subscription
- `invoice.payment_succeeded` - Renews minutes
- `invoice.payment_failed` - Marks past_due
- `customer.subscription.updated` - Updates status
- `customer.subscription.deleted` - Cancels subscription

---

## 📊 API Endpoints

### Auth Routes
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Admin Routes
- `POST /api/admin/login` - Admin login (separate from user)
- `GET /api/admin/users` - List all users
- `PUT /api/admin/users/:id/subscription` - Modify subscription
- `PUT /api/admin/users/:id/status` - Update user status
- `GET /api/admin/audit-logs` - View audit logs

### Stripe Routes
- `POST /api/create-checkout-session` - Create payment session
- `POST /api/activate-subscription` - Activate after payment
- `POST /api/webhook` - Stripe webhook handler
- `POST /api/cancel-subscription` - Cancel subscription

### Subscription Routes
- `GET /api/subscription/me` - Get my subscription

---

## 🔒 Security Features

✅ JWT Authentication with httpOnly cookies
✅ Password hashing with bcrypt
✅ Role-based access control (user/admin)
✅ Stripe webhook signature verification
✅ Audit logging for all actions
✅ Separate admin authentication

---

## 🧪 Testing the Flow

### Complete Purchase Flow:

1. **Create Account**
   - Visit http://localhost:8080
   - Click "Sign In" → "Sign Up" tab
   - Register with email/password

2. **Select Plan**
   - You'll be redirected to /pricing
   - Click "Get Started" on Pro or Enterprise plan

3. **Complete Payment**
   - Enter Stripe test card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits

4. **Activation**
   - Webhook activates subscription
   - Redirected to /checkout-success
   - See minutes added to account

5. **Access Dashboard**
   - Navigate to Business Dashboard
   - See subscription details, minutes remaining

### Admin Testing:

1. **Login as Admin**
   - Visit http://localhost:8080/admin/login
   - Use admin credentials (admin@eliterender.com / admin123)

2. **Manage Users**
   - View all users
   - Search by email/name
   - Filter by status
   - Modify subscriptions
   - Update user status

3. **View Audit Logs**
   - See all events (logins, payments, modifications)
   - Filter by event type
   - Track admin actions

---

## 📁 Project Structure

```
elite-render-engine-main/
├── server/
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── models/
│   │   ├── User.js               # User schema
│   │   ├── AuditLog.js          # Audit log schema
│   │   └── Plan.js              # Plan schema
│   ├── routes/
│   │   ├── auth.js              # User auth routes
│   │   ├── admin.js             # Admin routes
│   │   └── subscription.js      # Subscription routes
│   ├── utils/
│   │   └── jwt.js               # JWT utilities & middleware
│   ├── index.js                 # Express server
│   ├── seed.js                  # Admin seed script
│   └── .env                     # Environment variables
│
├── src/
│   ├── components/
│   │   ├── Navigation.tsx       # Auth-aware navigation
│   │   └── SignInModal.tsx      # Login/signup modal
│   ├── context/
│   │   └── AuthContext.tsx      # Auth state management
│   ├── services/
│   │   └── api.ts               # API client (axios)
│   ├── pages/
│   │   ├── AdminLogin.tsx       # Admin login page
│   │   ├── CheckoutSuccess.tsx  # Post-payment activation
│   │   └── ...
│   └── .env                     # Frontend env vars
│
└── README.md
```

---

## 🚨 Important Notes

1. **Change Admin Password** after first login!
2. **Use Stripe Test Mode** during development
3. **Set Strong JWT_SECRET** in production
4. **Enable MongoDB authentication** in production
5. **Use HTTPS** in production (required for cookies)
6. **Keep webhook secret secure**

---

## 🐛 Troubleshooting

### MongoDB Connection Failed
- Ensure MongoDB is running: `net start MongoDB`
- Check MONGO_URI in server/.env
- Verify MongoDB port (default: 27017)

### Stripe Webhook Not Working
- Run `stripe listen --forward-to localhost:3001/api/webhook`
- Copy webhook secret to server/.env
- Check Stripe CLI is logged in

### CORS Errors
- Ensure CLIENT_URL matches frontend URL
- Check withCredentials: true in axios config

### 401 Unauthorized
- Clear browser cookies
- Check JWT_SECRET is set
- Verify token expiration (7 days default)

---

## 📞 Support

For issues or questions, check:
- MongoDB Docs: https://docs.mongodb.com
- Stripe Docs: https://stripe.com/docs
- Express Docs: https://expressjs.com

---

## ✅ Production Checklist

Before deploying:
- [ ] Change all default passwords
- [ ] Use production Stripe keys
- [ ] Enable MongoDB authentication
- [ ] Set secure JWT_SECRET (64+ chars)
- [ ] Configure HTTPS/SSL
- [ ] Set NODE_ENV=production
- [ ] Configure production CORS origins
- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Configure backup strategy for MongoDB
- [ ] Test webhook delivery in production

---

**Elite Render Engine** - Production-Ready AI Voice SaaS Platform
