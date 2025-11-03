# 🔑 How to Get Your Stripe API Keys

## Quick Setup (5 minutes)

### Step 1: Create a Stripe Account
1. Go to https://stripe.com
2. Click "Start now" or "Sign up"
3. Create your free account

### Step 2: Access Test Keys
1. Once logged in, go to https://dashboard.stripe.com/test/apikeys
2. You'll see two keys:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`)

### Step 3: Copy Keys to Your Project

**For Frontend (.env in root folder):**
```env
VITE_STRIPE_PUBLIC_KEY=pk_test_51ABC...XYZ
VITE_API_URL=http://localhost:3001
```

**For Backend (server/.env):**
```env
STRIPE_SECRET_KEY=sk_test_51ABC...XYZ
STRIPE_WEBHOOK_SECRET=whsec_... (optional for now)
CLIENT_URL=http://localhost:8080
PORT=3001
```

### Step 4: Restart Your Servers

**Stop both servers (Ctrl+C) and restart:**

Terminal 1 - Frontend:
```bash
npm run dev
```

Terminal 2 - Backend:
```bash
cd server
node index.js
```

## 📝 Where to Find Each Key

| Key | Location | Format | Where to Put It |
|-----|----------|--------|----------------|
| **Publishable key** | [Dashboard → API Keys](https://dashboard.stripe.com/test/apikeys) | `pk_test_...` | Frontend `.env` → `VITE_STRIPE_PUBLIC_KEY` |
| **Secret key** | [Dashboard → API Keys](https://dashboard.stripe.com/test/apikeys) | `sk_test_...` | Backend `server/.env` → `STRIPE_SECRET_KEY` |
| **Webhook secret** | [Dashboard → Webhooks](https://dashboard.stripe.com/test/webhooks) | `whsec_...` | Backend `server/.env` → `STRIPE_WEBHOOK_SECRET` |

## ✅ Verify Setup

After adding keys, test the setup:

1. Navigate to http://localhost:8080/pricing
2. Click "Subscribe Now" on any plan
3. You should be redirected to Stripe Checkout
4. Use test card: `4242 4242 4242 4242`
5. Any future date (e.g., 12/25) and any CVC (e.g., 123)

## 🎴 Test Cards

| Card Number | Scenario |
|-------------|----------|
| 4242 4242 4242 4242 | Success |
| 4000 0000 0000 0002 | Card declined |
| 4000 0025 0000 3155 | Requires 3D Secure |
| 4000 0000 0000 9995 | Insufficient funds |

## 🔒 Security Notes

- ✅ Test keys (start with `pk_test_` and `sk_test_`) are safe for development
- ✅ Never commit `.env` files to Git (already in `.gitignore`)
- ❌ Never expose secret keys in frontend code
- ⚠️ For production, use live keys (`pk_live_` and `sk_live_`)

## 🐛 Troubleshooting

**Error: "Stripe not configured"**
- Make sure `STRIPE_SECRET_KEY` in `server/.env` is set
- Restart the backend server after changing `.env`

**Error: "No checkout URL received"**
- Check backend terminal for error messages
- Verify backend is running on port 3001
- Make sure you're using the correct API key format

**Checkout page doesn't load**
- Verify both keys are from the same Stripe account
- Make sure you're using TEST keys (not live keys)
- Check browser console for errors

## 📞 Need Help?

- Stripe Documentation: https://stripe.com/docs
- Test Mode Guide: https://stripe.com/docs/testing
- API Keys Guide: https://stripe.com/docs/keys

---

**Once configured, you'll be able to accept test payments and subscriptions! 🎉**
