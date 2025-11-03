# 🔧 Deployment Authentication Fix Guide

## Issues Fixed

✅ **CORS Configuration Error** - Removed malformed quotes in CORS origins array
✅ **Cookie SameSite Settings** - Updated for cross-origin deployment compatibility
✅ **Missing Environment Variables** - Created .env files with proper configuration
✅ **Frontend API URL** - Configured to point to deployed backend

---

## 🚨 Critical Changes Made

### 1. **Fixed CORS Configuration** (`server/index.js`)
**Problem**: The CORS origins had quotes inside the string causing parsing issues.

**Fixed**: Cleaned up the origins array and added proper trimming.

```javascript
const allowed = (process.env.CORS_ORIGINS || `${defaultClient},https://aivors-1.onrender.com,https://aivors-5hvj.onrender.com,http://localhost:8080,http://127.0.0.1:8080,http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000`)
  .split(',')
  .map(origin => origin.trim());
```

### 2. **Fixed Cookie Settings for Cross-Origin** (`server/routes/auth.js`)
**Problem**: Cookies with `sameSite: 'lax'` don't work across different domains in production.

**Fixed**: Changed to `sameSite: 'none'` in production (requires `secure: true`).

```javascript
const cookieBase = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
};
```

### 3. **Created Frontend `.env`**
**Problem**: Frontend was defaulting to `http://localhost:3001` instead of production URL.

**Fixed**: Created `.env` file with deployed backend URL:
```bash
VITE_API_URL=https://aivors-5hvj.onrender.com
```

### 4. **Created Server `.env`**
**Problem**: Missing environment variables for deployment.

**Fixed**: Created `server/.env` template with all required variables.

---

## 📋 Deployment Checklist

### For Render.com Deployment

#### **Backend (server/) on Render**

1. **Set Environment Variables** in Render Dashboard:
   ```
   NODE_ENV=production
   MONGO_URI=<your-mongodb-atlas-connection-string>
   JWT_SECRET=<generate-random-string-32-chars>
   JWT_REFRESH_SECRET=<generate-different-random-string-32-chars>
   STRIPE_SECRET_KEY=<your-stripe-secret-key>
   STRIPE_WEBHOOK_SECRET=<your-stripe-webhook-secret>
   CLIENT_URL=<your-frontend-url>
   CORS_ORIGINS=<your-frontend-url>,https://aivors-5hvj.onrender.com
   PORT=3001
   ```

2. **Generate Random Secrets** (use one of these):
   ```bash
   # PowerShell
   -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
   
   # Or use: https://randomkeygen.com/
   ```

3. **Build Command**: `npm install`
4. **Start Command**: `node index.js`

#### **Frontend (root/) on Render or Vercel**

1. **Set Environment Variables**:
   ```
   VITE_API_URL=https://aivors-5hvj.onrender.com
   ```

2. **Build Command**: `npm install && npm run build`
3. **Publish Directory**: `dist`

---

## 🔍 Testing the Fix Locally

1. **Update your local `.env` files**:
   
   **Frontend `.env`**:
   ```bash
   VITE_API_URL=http://localhost:3001
   ```
   
   **Server `server/.env`**:
   ```bash
   NODE_ENV=development
   MONGO_URI=mongodb://localhost:27017/aivors
   JWT_SECRET=local_dev_secret_change_in_production
   JWT_REFRESH_SECRET=local_dev_refresh_secret_change_in_production
   STRIPE_SECRET_KEY=sk_test_your_key_here
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
   CLIENT_URL=http://localhost:5173
   PORT=3001
   ```

2. **Start Backend**:
   ```bash
   cd server
   npm install
   node index.js
   ```

3. **Start Frontend** (in new terminal):
   ```bash
   npm install
   npm run dev
   ```

4. **Test Login Flow**:
   - Open http://localhost:5173
   - Try signing up/logging in
   - Check browser console for errors
   - Check Network tab to see cookies being set

---

## 🐛 Troubleshooting

### Issue: Still getting 401 errors

**Check**:
1. ✅ `NODE_ENV=production` is set on Render
2. ✅ `CORS_ORIGINS` includes your exact frontend URL
3. ✅ Browser cookies are enabled
4. ✅ No browser extensions blocking cookies (disable ad blockers)

**Debug Steps**:
```bash
# Check server logs on Render for CORS errors
# Look for: "❌ CORS blocked for origin: ..."
```

### Issue: Cookies not being sent

**Check**:
1. ✅ Both frontend and backend use HTTPS in production
2. ✅ `sameSite: 'none'` requires `secure: true`
3. ✅ `withCredentials: true` is set in axios config (already done in `api.ts`)

### Issue: CORS errors in production

**Check Render Environment Variables**:
```bash
# Make sure CORS_ORIGINS includes your EXACT frontend URL
# Example:
CORS_ORIGINS=https://your-app.onrender.com,https://aivors-5hvj.onrender.com
```

### Issue: Token refresh failing

**Check**:
1. ✅ `/api/auth/refresh` is in the CSRF exemption list (already done)
2. ✅ Refresh token cookie has proper settings
3. ✅ `JWT_REFRESH_SECRET` is set correctly

---

## 🔐 Security Notes

### Production Checklist:
- [ ] Strong JWT secrets (32+ random characters)
- [ ] `NODE_ENV=production` set on server
- [ ] HTTPS enabled on both frontend and backend
- [ ] `secure: true` for all cookies in production
- [ ] `sameSite: 'none'` for cross-origin cookies
- [ ] CORS origins whitelist only your domains
- [ ] MongoDB connection string is secure (use environment variable)

### Cookie Settings Explained:
```javascript
{
  httpOnly: true,        // Prevents JavaScript access (XSS protection)
  secure: true,          // Only sent over HTTPS in production
  sameSite: 'none',      // Required for cross-origin in production
}
```

---

## 📞 Next Steps

1. **Update Render Environment Variables** with the values from `server/.env`
2. **Redeploy Backend** on Render
3. **Update Frontend** `.env` with backend URL
4. **Redeploy Frontend**
5. **Test Authentication Flow**:
   - Sign up new user
   - Log in
   - Check dashboard access
   - Test token refresh (wait 15 minutes or force it)

---

## 📚 Additional Resources

- [Render Environment Variables](https://render.com/docs/environment-variables)
- [MDN: SameSite Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite)
- [Stripe Webhook Setup](https://stripe.com/docs/webhooks)
- [MongoDB Atlas Setup](https://www.mongodb.com/cloud/atlas)

---

## ⚠️ Important Notes

1. **Never commit `.env` files** - They're already in `.gitignore`
2. **Use different secrets** for development and production
3. **Keep Stripe keys secure** - Never expose secret keys in frontend
4. **Test locally first** before deploying to production
5. **Monitor server logs** on Render for any CORS or authentication errors

---

## 🎯 Expected Behavior After Fix

✅ Frontend can connect to deployed backend
✅ Login/signup sets cookies correctly
✅ Dashboard loads user data
✅ Token refresh works automatically
✅ No CORS errors in browser console
✅ Authentication persists across page refreshes

---

**Questions or Issues?** Check the server logs on Render dashboard for detailed error messages.
