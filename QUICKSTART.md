# 🚀 Quick Start - Run These Commands

## Step 1: Install Frontend Dependencies
```powershell
npm install
```

## Step 2: Install Backend Dependencies
```powershell
cd server
npm install
cd ..
```

## Step 3: Start MongoDB
```powershell
# If using local MongoDB
net start MongoDB

# If using MongoDB Atlas, skip this step and use your Atlas connection string in server/.env
```

## Step 4: Seed Admin Account
```powershell
cd server
npm run seed
cd ..
```

## Step 5: Start Backend Server (Terminal 1)
```powershell
cd server
npm run dev
```

## Step 6: Start Frontend (Terminal 2)
```powershell
npm run dev
```

## Step 7: Start Stripe Webhook Listener (Terminal 3)
```powershell
# Install Stripe CLI first: https://stripe.com/docs/stripe-cli
stripe login
stripe listen --forward-to localhost:3001/api/webhook
```

---

## 📋 Default Credentials

**Admin Login** (http://localhost:8080/admin/login):
- Email: `admin@eliterender.com`
- Password: `admin123`

**Test User** (Create your own via Sign Up)

**Stripe Test Card**:
- Card: `4242 4242 4242 4242`
- Expiry: Any future date
- CVC: Any 3 digits

---

## ✅ Verify Setup

1. Frontend: http://localhost:8080
2. Backend: http://localhost:3001/api/health
3. MongoDB: Should show connected in backend console
4. Stripe: Copy webhook secret to server/.env

---

**See SETUP_GUIDE.md for detailed documentation**
