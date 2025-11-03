# 🚀 Quick Installation Guide - Elite Render Engine

## Step-by-Step Setup

### 1️⃣ Install Frontend Dependencies
```powershell
npm install
```

### 2️⃣ Install Backend Dependencies
```powershell
cd server
npm install
cd ..
```

### 3️⃣ Setup Environment Variables

**Create `.env` in root folder:**
```env
VITE_STRIPE_PUBLIC_KEY=pk_test_51ABC...
VITE_API_URL=http://localhost:3001
```

**Create `server/.env`:**
```env
STRIPE_SECRET_KEY=sk_test_51ABC...
STRIPE_WEBHOOK_SECRET=whsec_...
CLIENT_URL=http://localhost:8080
PORT=3001
```

### 4️⃣ Get Stripe Test Keys

1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy **Publishable key** → Frontend `.env` as `VITE_STRIPE_PUBLIC_KEY`
3. Copy **Secret key** → Backend `server/.env` as `STRIPE_SECRET_KEY`

### 5️⃣ Start Both Servers

**Terminal 1 - Frontend:**
```powershell
npm run dev
```
Opens at: http://localhost:8080

**Terminal 2 - Backend:**
```powershell
cd server
npm run dev
```
Opens at: http://localhost:3001

### 6️⃣ Test the App

1. Open http://localhost:8080
2. Navigate to **Pricing** page
3. Click "Subscribe Now" on any plan
4. Use test card: `4242 4242 4242 4242`
5. Visit `/dashboard` to see your subscription
6. Visit `/admin` to manage users

## ✅ Quick Verification Checklist

- [ ] Frontend running on port 8080
- [ ] Backend running on port 3001
- [ ] Stripe keys configured in both `.env` files
- [ ] Can navigate between pages
- [ ] Can click subscribe (redirects to Stripe)
- [ ] Dashboard shows mock user data
- [ ] Admin panel displays user table

## 🎯 New Pages Available

| Route | Description |
|-------|-------------|
| `/` | Landing page (original) |
| `/pricing` | Subscription plans with Stripe |
| `/dashboard` | Customer dashboard with credits |
| `/admin` | Admin panel for user management |

## 💳 Test Credit Cards

Use these in Stripe checkout:

| Card Number | Result |
|-------------|--------|
| `4242 4242 4242 4242` | ✅ Success |
| `4000 0000 0000 0002` | ❌ Decline |
| `4000 0025 0000 3155` | 🔐 3D Secure |

Any future expiry date (e.g., 12/25) and any 3-digit CVC works.

## 🐛 Troubleshooting

**Backend won't start:**
```powershell
cd server
npm install express stripe cors dotenv
npm run dev
```

**Frontend can't reach backend:**
- Check backend is running on port 3001
- Verify `VITE_API_URL=http://localhost:3001` in `.env`

**Stripe checkout doesn't work:**
- Ensure Stripe keys are set in `server/.env`
- Check backend console for errors
- Verify backend endpoint: http://localhost:3001/api/health

## 📦 What Was Added

### New Pages
✅ `src/pages/Pricing.tsx` - Subscription pricing page
✅ `src/pages/CustomerDashboard.tsx` - User dashboard
✅ `src/pages/AdminDashboard.tsx` - Admin management panel

### Backend
✅ `server/index.js` - Express server with Stripe
✅ `server/package.json` - Backend dependencies
✅ `server/README.md` - Backend documentation

### Utilities
✅ `src/lib/mockData.ts` - Mock user data & helpers
✅ `.env.example` - Environment template
✅ `SETUP.md` - Complete documentation

### Updates
✅ `src/App.tsx` - Added new routes
✅ `src/components/Navigation.tsx` - Updated navigation links

## 🎨 Features Implemented

### Pricing Page
- 3 tiers: Free (₹0), Pro (₹999), Enterprise (₹1999)
- Stripe checkout integration
- Credit display per plan
- Responsive cards with hover effects

### Customer Dashboard
- Plan status and credits display
- Credit usage progress bar
- Upgrade/buy credits buttons
- Mock subscription management

### Admin Dashboard
- User table with search & filters
- Add credits to users
- Downgrade user plans
- Delete users
- Revenue statistics

## 🎁 Bonus Features

- Dark glassy UI maintained throughout
- Responsive design (mobile-friendly)
- Toast notifications for all actions
- LocalStorage for mock data persistence
- Comprehensive error handling

## 📚 Next Steps

1. **Set Real Stripe Keys** - Replace test keys with live keys for production
2. **Add Database** - Connect MongoDB or PostgreSQL
3. **Add Auth** - Implement JWT or OAuth authentication
4. **Deploy** - Use Vercel (frontend) + Railway/Heroku (backend)

---

**🎉 You're all set! Start developing your SaaS platform!**
