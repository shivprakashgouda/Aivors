# 🎯 Quick Reference - Elite Render Engine

## 🚀 Start Commands

```bash
# Frontend (Terminal 1)
npm run dev

# Backend (Terminal 2)
cd server
npm run dev
```

## 🌐 URLs

| Page | URL | Description |
|------|-----|-------------|
| Landing | http://localhost:8080/ | Original marketing page |
| Pricing | http://localhost:8080/pricing | 3 subscription plans |
| Dashboard | http://localhost:8080/dashboard | Customer dashboard |
| Admin | http://localhost:8080/admin | User management |
| API Health | http://localhost:3001/api/health | Backend status |

## 💳 Test Cards

| Card | Result |
|------|--------|
| 4242 4242 4242 4242 | ✅ Success |
| 4000 0000 0000 0002 | ❌ Decline |

Use any future date (12/25) and any CVC (123)

## 💰 Pricing Plans

| Plan | Price | Credits | Stripe Price ID |
|------|-------|---------|----------------|
| Free | ₹0 | 10 | price_free |
| Pro | ₹999 | 500 | price_pro_monthly |
| Enterprise | ₹1999 | 2000 | price_enterprise_monthly |

## 📡 API Endpoints

```
POST /api/create-checkout-session  → Create Stripe checkout
POST /api/webhook                  → Handle Stripe events
GET  /api/subscription/:customerId → Get subscription
POST /api/cancel-subscription      → Cancel subscription
```

## 🎨 Color Palette

```css
--primary: hsl(333, 100%, 54%)     /* Pink/Magenta */
--secondary: hsl(271, 70%, 65%)    /* Purple */
--background: hsl(0, 0%, 0%)       /* Black */
--success: hsl(142, 71%, 45%)      /* Green */
```

## 📂 New Files Created

**Pages:**
- `src/pages/Pricing.tsx`
- `src/pages/CustomerDashboard.tsx`
- `src/pages/AdminDashboard.tsx`

**Backend:**
- `server/index.js`
- `server/package.json`
- `server/.env.example`
- `server/README.md`

**Utilities:**
- `src/lib/mockData.ts`

**Documentation:**
- `SETUP.md`
- `INSTALLATION.md`
- `CHANGES.md`
- `.env.example`

## 🔑 Environment Variables

**Frontend (.env):**
```
VITE_STRIPE_PUBLIC_KEY=pk_test_...
VITE_API_URL=http://localhost:3001
```

**Backend (server/.env):**
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
CLIENT_URL=http://localhost:8080
PORT=3001
```

## 🛠️ Install Dependencies

```bash
# Frontend
npm install

# Backend
cd server
npm install
```

## 📊 Mock User Data

Default user in localStorage:
- Name: Tanmay Bari
- Email: tanmay@restaurant.com
- Plan: Pro
- Credits: 342 / 500
- Status: Active

## 🎯 Key Features

✅ Stripe checkout integration  
✅ Customer dashboard with credit tracking  
✅ Admin panel with user management  
✅ Search & filter functionality  
✅ Add/remove credits  
✅ Upgrade/downgrade plans  
✅ Toast notifications  
✅ Responsive design  
✅ Dark glassy theme  
✅ LocalStorage persistence  

## 🐛 Troubleshooting

**Backend won't start:**
```bash
cd server
npm install
npm run dev
```

**Stripe checkout fails:**
- Check backend is running
- Verify Stripe keys in `server/.env`

**Pages don't load:**
- Clear browser cache
- Check console for errors
- Verify routes in `App.tsx`

## 📞 Support

- Email: info@restaurant-ai.com
- Phone: (409) 960-2907

---

**Made with ❤️ using React + TypeScript + Vite + Stripe**
