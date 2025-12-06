# 🚀 QUICK DEPLOYMENT REFERENCE

## ✅ Everything Is Ready!

All code changes are done. Just follow these steps:

---

## 📝 DEPLOYMENT STEPS (5 Minutes)

### 1️⃣ Push to GitHub
```bash
git add .
git commit -m "Production ready - Retell AI + n8n integration"
git push origin main
```

### 2️⃣ Deploy on Render
1. Go to https://dashboard.render.com/
2. Click **"New +"** → **"Blueprint"**
3. Select your `Aivors` repository
4. Click **"Apply"** (render.yaml will auto-configure everything)

### 3️⃣ Add Secret Environment Variables
After deployment starts, add these in Render Dashboard:

**Backend Service:**
- `MONGO_URI` = (your MongoDB connection - already in server/.env)
- `STRIPE_SECRET_KEY` = (your Stripe key - already in server/.env)
- `STRIPE_PUBLISHABLE_KEY` = (your Stripe key - already in server/.env)
- `STRIPE_WEBHOOK_SECRET` = (your Stripe webhook - already in server/.env)

**Frontend Service:**
- Wait for backend to deploy first
- Then add: `VITE_API_URL` = (your backend URL from step 4)

### 4️⃣ Get Your URLs
After ~5 minutes, you'll see:
- Backend: `https://aivors-backend-xxxxx.onrender.com`
- Frontend: `https://aivors-frontend-xxxxx.onrender.com`

### 5️⃣ Update n8n Workflow
1. Go to: https://n8n.srv971061.hstgr.cloud
2. Open your workflow
3. Update HTTP Request node URL to your backend URL
4. Keep header: `x-n8n-webhook-secret: aivors-secret`
5. Save

---

## 🎯 THAT'S IT!

Everything else is auto-configured:
- ✅ Port 5000
- ✅ n8n webhook secret
- ✅ Retell API key
- ✅ All routes and endpoints
- ✅ CSRF exemptions
- ✅ CORS settings

---

## 🧪 TEST IT

1. Login to your frontend
2. Go to Call Analytics
3. Make a test call via Retell AI
4. Call should appear in dashboard!

---

## 📚 Need Details?
See `DEPLOY.md` for complete guide with troubleshooting.

---

**Time to deploy: ~10 minutes total** ⏱️
