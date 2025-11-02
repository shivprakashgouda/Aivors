# Elite Render Engine - Restaurant AI SaaS Platform

A modern, full-stack subscription-based SaaS platform for Restaurant AI phone management system with Stripe integration.

## 🎯 Project Overview

**Elite Render Engine** is a complete subscription platform featuring:
- 💳 Stripe payment integration with 3 pricing tiers
- 📊 Customer dashboard with credit tracking
- 👨‍💼 Admin panel for user management
- 🎨 Modern glassy UI with dark theme
- ⚡ Built with React + TypeScript + Vite

## 🏗️ Tech Stack

### Frontend
- **React 18.3.1** - UI framework
- **TypeScript 5.8.3** - Type safety
- **Vite 5.4.19** - Build tool
- **Tailwind CSS** - Styling
- **Shadcn/UI** - Component library
- **React Router v6** - Routing
- **React Query** - State management
- **Lucide Icons** - Icon library

### Backend
- **Express.js** - Server framework
- **Stripe API** - Payment processing
- **CORS** - Cross-origin requests
- **Dotenv** - Environment variables

## 📁 Project Structure

```
elite-render-engine-main/
├── src/
│   ├── pages/
│   │   ├── Index.tsx              # Landing page
│   │   ├── Pricing.tsx            # Pricing page with 3 tiers
│   │   ├── CustomerDashboard.tsx  # User dashboard
│   │   ├── AdminDashboard.tsx     # Admin panel
│   │   └── NotFound.tsx           # 404 page
│   │
│   ├── components/
│   │   ├── Navigation.tsx         # Header with navigation
│   │   ├── HeroSection.tsx        # Hero section
│   │   ├── FeaturesSection.tsx    # Features grid
│   │   ├── FAQSection.tsx         # FAQ accordion
│   │   ├── Footer.tsx             # Footer
│   │   ├── SignInModal.tsx        # Sign-in modal
│   │   ├── BookDemoModal.tsx      # Demo booking modal
│   │   └── ui/                    # Shadcn UI components
│   │
│   ├── lib/
│   │   ├── utils.ts               # Utility functions
│   │   └── mockData.ts            # Mock data & helpers
│   │
│   └── hooks/                     # React hooks
│
├── server/
│   ├── index.js                   # Express server
│   ├── package.json               # Backend dependencies
│   └── README.md                  # Backend documentation
│
└── public/                        # Static assets
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (with npm)
- Stripe account (for payment testing)

### 1. Clone & Install

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd elite-render-engine-main

# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 2. Configure Environment Variables

**Frontend (.env):**
```bash
cp .env.example .env
```

Edit `.env`:
```env
VITE_STRIPE_PUBLIC_KEY=pk_test_your_key_here
VITE_API_URL=http://localhost:3001
```

**Backend (server/.env):**
```bash
cd server
cp .env.example .env
```

Edit `server/.env`:
```env
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
CLIENT_URL=http://localhost:8080
PORT=3001
```

Get your Stripe keys from: https://dashboard.stripe.com/test/apikeys

### 3. Start Development Servers

**Terminal 1 - Frontend:**
```bash
npm run dev
```
Frontend runs on: http://localhost:8080

**Terminal 2 - Backend:**
```bash
cd server
npm run dev
```
Backend runs on: http://localhost:3001

### 4. Test the Application

1. Navigate to http://localhost:8080
2. Click "Pricing" to view subscription plans
3. Try subscribing (use Stripe test card: 4242 4242 4242 4242)
4. Visit `/dashboard` to see customer dashboard
5. Visit `/admin` to see admin panel

## 💳 Pricing Tiers

| Plan | Price | Credits | Features |
|------|-------|---------|----------|
| **Free** | ₹0/month | 10 credits | Basic features |
| **Pro** | ₹999/month | 500 credits | Advanced AI, POS integration |
| **Enterprise** | ₹1999/month | 2000 credits | Custom training, multilingual |

## 📊 Features

### Customer Dashboard (`/dashboard`)
- View current plan and subscription status
- Track credit usage with progress bar
- See renewal date
- Upgrade plan or buy additional credits
- Manage account settings

### Admin Dashboard (`/admin`)
- View all subscribers in a table
- Search and filter users (All/Free/Paid)
- Add credits to user accounts
- Downgrade user plans
- Delete users
- View revenue statistics

### Pricing Page (`/pricing`)
- Three beautiful pricing cards
- Stripe checkout integration
- Responsive design
- Popular plan highlighting

## 🎨 Design System

### Colors
- **Primary:** Pink/Magenta `hsl(333, 100%, 54%)`
- **Secondary:** Purple `hsl(271, 70%, 65%)`
- **Background:** Black `hsl(0, 0%, 0%)`
- **Success:** Green `hsl(142, 71%, 45%)`

### UI Style
- Dark theme with glassy cards
- Backdrop blur effects
- Smooth animations
- Gradient accents
- Border radius: 0.75rem

## 🔧 Development

### Available Scripts

**Frontend:**
```bash
npm run dev        # Start dev server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint
```

**Backend:**
```bash
npm start          # Start production server
npm run dev        # Start with nodemon (auto-reload)
```

### Testing Stripe Integration

**Test Cards:**
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0025 0000 3155`

**Webhook Testing:**
Install Stripe CLI:
```bash
stripe listen --forward-to localhost:3001/api/webhook
```

## 🗄️ Mock Data

The application uses localStorage for demo purposes:
- User data stored in `localStorage.userData`
- Mock users generated via `generateMockUsers()`
- Credit tracking and plan management utilities in `lib/mockData.ts`

## 📡 API Endpoints

### POST `/api/create-checkout-session`
Create Stripe checkout session

**Request:**
```json
{
  "priceId": "price_pro_monthly",
  "planName": "Pro"
}
```

**Response:**
```json
{
  "url": "https://checkout.stripe.com/..."
}
```

### POST `/api/webhook`
Handle Stripe webhook events

### GET `/api/subscription/:customerId`
Get subscription details

### POST `/api/cancel-subscription`
Cancel subscription

## 🚢 Deployment

### Frontend (Vercel/Netlify)
```bash
npm run build
# Deploy dist/ folder
```

### Backend (Heroku/Railway)
```bash
cd server
# Deploy with environment variables set
```

### Environment Variables for Production
- Set Stripe live keys (not test keys)
- Update `CLIENT_URL` to production domain
- Configure webhook endpoint in Stripe dashboard

## 📝 TODO for Production

- [ ] Add real authentication (JWT/OAuth)
- [ ] Integrate database (MongoDB/PostgreSQL)
- [ ] Add email notifications (SendGrid)
- [ ] Implement analytics tracking
- [ ] Add rate limiting
- [ ] Set up logging (Winston)
- [ ] Add automated testing
- [ ] Implement CI/CD pipeline
- [ ] Add data encryption
- [ ] GDPR compliance features

## 🤝 Contributing

This project was generated with Lovable.dev and can be edited:
1. Via Lovable platform: https://lovable.dev/projects/2c63f15d-dd23-461c-b037-edbbc857b56a
2. Via local IDE (push changes to sync)
3. Via GitHub directly

## 📄 License

This project is private and proprietary.

## 🆘 Support

For issues or questions:
- Email: info@restaurant-ai.com
- Investment: invest@restaurant-ai.com
- Phone: (409) 960-2907

---

**Built with ❤️ using React, TypeScript, Vite, and Stripe**
