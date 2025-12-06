# 🚀 Render Deployment & Email Setup Guide

## Problem: Signup Timeout & No Email OTP

### Root Cause:
1. ✅ Code is fixed and pushed to GitHub
2. ❌ Render hasn't auto-deployed the latest changes
3. ❌ Email environment variables not configured in Render

---

## Step 1: Trigger Render Deployment

### Option A: Manual Deploy (Fastest)
1. Go to https://dashboard.render.com/
2. Find your backend service: **aivors-5hvj** (or similar name)
3. Click **"Manual Deploy"** → **"Deploy latest commit"**
4. Wait 2-3 minutes for deployment to complete

### Option B: Auto-Deploy (If enabled)
- Render will automatically deploy when you push to GitHub
- Check deployment status in Render dashboard
- Current latest commit: `48413c6` (Fix: Make email sending non-blocking)

---

## Step 2: Configure Email Environment Variables

### A. Get Gmail App Password (Recommended)

1. **Go to your Gmail account:**
   - Visit: https://myaccount.google.com/security

2. **Enable 2-Factor Authentication** (required for App Passwords)
   - If not enabled, enable it first

3. **Generate App Password:**
   - Search for "App passwords" in Google Account settings
   - Or visit: https://myaccount.google.com/apppasswords
   - Select App: **Mail**
   - Select Device: **Other (Custom name)** → Type "Aivors"
   - Click **Generate**
   - Copy the 16-character password (format: `xxxx xxxx xxxx xxxx`)

### B. Add Environment Variables in Render

1. **Go to Render Dashboard:**
   - https://dashboard.render.com/

2. **Select your backend service** (aivors-5hvj or similar)

3. **Go to "Environment" tab**

4. **Add these environment variables:**

   ```
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-actual-email@gmail.com
   EMAIL_PASSWORD=your-16-digit-app-password
   EMAIL_FROM_NAME=Aivors
   DEMO_EMAIL=your-actual-email@gmail.com
   ```

   **Replace:**
   - `your-actual-email@gmail.com` → Your Gmail address
   - `your-16-digit-app-password` → The App Password from Step 2.A.3

5. **Click "Save Changes"**

6. **Render will automatically redeploy** after saving env vars

---

## Step 3: Verify Deployment

### Check Backend Logs:
1. Go to Render Dashboard → Your backend service
2. Click **"Logs"** tab
3. Look for:
   ```
   ✅ MongoDB connected successfully
   🚀 Server running on port 3001
   ⚠️  Email service not configured (if email not set up)
   ```

### Test Signup:
1. Go to https://www.aivors.com/
2. Click **"Sign Up"**
3. Fill form and submit
4. **Should see OTP screen immediately** (no 30-second wait)
5. Check your email for OTP code
6. Enter OTP → Success!

### Test Demo Booking:
1. Click **"Book Demo"** on homepage
2. Fill form and submit
3. Should see OTP screen immediately
4. Check email for OTP
5. After verification → Admin email receives demo booking notification

---

## Step 4: Environment Variables Checklist

Make sure these are set in Render:

### Required (Already Set):
- ✅ `MONGO_URI` - MongoDB connection string
- ✅ `JWT_SECRET` - Random secret key
- ✅ `JWT_REFRESH_SECRET` - Random secret key
- ✅ `STRIPE_SECRET_KEY` - Stripe secret key
- ✅ `CLIENT_URL` - https://www.aivors.com
- ✅ `CORS_ORIGINS` - https://www.aivors.com,https://aivors-5hvj.onrender.com
- ✅ `NODE_ENV` - production

### Need to Add (Email):
- ❌ `EMAIL_SERVICE` - gmail
- ❌ `EMAIL_USER` - your-email@gmail.com
- ❌ `EMAIL_PASSWORD` - your-app-password
- ❌ `EMAIL_FROM_NAME` - Aivors
- ❌ `DEMO_EMAIL` - your-email@gmail.com

---

## Troubleshooting

### Still Getting Timeout After Deploy?

1. **Clear browser cache:**
   - Press `Ctrl + Shift + Delete`
   - Clear cached images and files
   - Or use Incognito mode

2. **Check Render deployment status:**
   - Should show "Live" with green dot
   - Latest commit should be `48413c6` or later

3. **Check backend logs for errors:**
   - Look for MongoDB connection errors
   - Look for email service warnings

### Not Receiving OTP Emails?

1. **Check email configuration in Render:**
   - All 5 email variables must be set correctly
   - App Password should be 16 characters (no spaces)

2. **Check spam/junk folder** in your email

3. **Check backend logs:**
   - Should see: `✅ OTP email sent to: user@example.com`
   - Or: `⚠️ Email service not configured` (means env vars not set)

4. **Test mode (no email configured):**
   - OTP will be logged to Render console
   - Check logs and manually copy OTP

### Demo Booking Fails?

1. **Check that email is configured** (same as signup)
2. **Check `DEMO_EMAIL` is set** in Render environment variables
3. **Check logs** for demo booking errors

---

## Quick Email Setup (Copy-Paste Ready)

### For Render Environment Variables:

```bash
# Copy these and paste in Render Environment tab
EMAIL_SERVICE=gmail
EMAIL_USER=youremail@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop
EMAIL_FROM_NAME=Aivors
DEMO_EMAIL=youremail@gmail.com
```

**Remember to replace:**
- `youremail@gmail.com` with your actual Gmail
- `abcd efgh ijkl mnop` with your App Password (remove spaces)

---

## Expected Behavior After Fix

### ✅ Signup Flow:
```
Fill Form → Submit → Instant Response (0.5s) → OTP Screen
→ Email arrives (5-10s) → Enter OTP → Verified → Dashboard
```

### ✅ Demo Booking Flow:
```
Fill Form → Submit → Instant Response (0.5s) → OTP Screen
→ Email arrives (5-10s) → Enter OTP → Verified
→ Admin receives demo notification email
```

### ❌ Old Behavior (Before Fix):
```
Fill Form → Submit → Wait... → Wait... → 30s → TIMEOUT ERROR ❌
```

---

## Need Help?

1. **Check Render logs** for specific error messages
2. **Check browser console** for API errors
3. **Verify all environment variables** are set correctly
4. **Try in Incognito mode** to rule out cache issues
5. **Check MongoDB connection** (most common issue)

---

## Summary

**What you need to do RIGHT NOW:**

1. ✅ Go to Render Dashboard
2. ✅ Find backend service (aivors-5hvj)
3. ✅ Click "Manual Deploy" → "Deploy latest commit"
4. ✅ While deploying, go to "Environment" tab
5. ✅ Add all 5 email environment variables
6. ✅ Save (will trigger auto-redeploy)
7. ✅ Wait 2-3 minutes
8. ✅ Test signup at www.aivors.com
9. ✅ Test demo booking
10. ✅ Check email for OTP

**Total time: 5 minutes** ⏱️
