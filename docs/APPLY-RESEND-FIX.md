# 🚀 APPLY RESEND FIX - QUICK GUIDE

## ⚡ The Problem
Demo booking emails are failing because Resend's test domain can only send to your registered email address.

**Error:**
```
You can only send testing emails to your own email address (info@aiactivesolutions.com). 
To send emails to other recipients, please verify a domain.
```

---

## ✅ QUICK FIX (5 Minutes) - For Immediate Testing

### Step 1: Update Environment Variable on Render

1. **Go to Render Dashboard:**
   - Visit: https://dashboard.render.com/
   - Login with your account

2. **Select Your Service:**
   - Click on your backend service (e.g., `aivors-backend` or similar)

3. **Navigate to Environment Tab:**
   - Click **Environment** in the left sidebar

4. **Update DEMO_EMAIL:**
   - Find the `DEMO_EMAIL` variable
   - **Change from:** `tanmay9623bari@gmail.com`
   - **Change to:** `info@aiactivesolutions.com`
   - ⚠️ **Important:** Must match **exactly** (case-sensitive)

5. **Save Changes:**
   - Click **Save Changes** button
   - Render will automatically redeploy your service

### Step 2: Wait for Deployment
- Wait 2-3 minutes for the service to redeploy
- Watch the **Logs** tab for confirmation
- Look for: `Live ✅`

### Step 3: Test
1. Go to your website: https://www.aivors.com
2. Submit a demo booking request
3. Enter your email to receive OTP
4. Verify OTP
5. ✅ Demo notification should now be sent to `info@aiactivesolutions.com`

---

## 🏆 PRODUCTION FIX (30 Minutes) - For Sending to Any Email

If you want to send demo notifications to `tanmay9623bari@gmail.com` or any other email, you need to verify your domain on Resend.

**See detailed guide:** [RESEND-DOMAIN-FIX.md](./RESEND-DOMAIN-FIX.md)

**Quick Overview:**
1. Login to Resend: https://resend.com/login
2. Add domain: `aivors.com` or `aiactivesolutions.com`
3. Copy DNS records provided by Resend
4. Add DNS records to your domain provider (GoDaddy, Namecheap, Cloudflare, etc.)
5. Wait 5-10 minutes for verification
6. Update `EMAIL_USER` on Render to use verified domain:
   ```
   EMAIL_USER=noreply@aivors.com
   ```
7. Now you can set `DEMO_EMAIL` to **any** email address

---

## 📋 Environment Variables Summary

### Current Setup (After Quick Fix):
```bash
RESEND_API_KEY=re_Jzo****
EMAIL_USER=info@aivors.com
EMAIL_FROM_NAME=Aivors
DEMO_EMAIL=info@aiactivesolutions.com  ← Updated to match Resend account
```

### After Domain Verification (Production):
```bash
RESEND_API_KEY=re_Jzo****
EMAIL_USER=noreply@aivors.com  ← Using verified domain
EMAIL_FROM_NAME=Aivors
DEMO_EMAIL=tanmay9623bari@gmail.com  ← Can be ANY email now
```

---

## 🔍 Verification Checklist

After applying the fix, verify:

- [ ] `DEMO_EMAIL` updated on Render
- [ ] Service redeployed successfully
- [ ] Website loads without errors
- [ ] Demo form accepts submission
- [ ] OTP email received
- [ ] OTP verification works
- [ ] Demo notification email received at `info@aiactivesolutions.com`

---

## 🆘 Troubleshooting

### Issue: Still getting the same error

**Solution 1: Check Email Match**
```bash
# On Render, verify DEMO_EMAIL is EXACTLY:
DEMO_EMAIL=info@aiactivesolutions.com

# NOT:
DEMO_EMAIL=Info@aiactivesolutions.com  ❌ (wrong case)
DEMO_EMAIL=tanmay9623bari@gmail.com    ❌ (different email)
```

**Solution 2: Force Redeploy**
1. Go to Render dashboard
2. Click **Manual Deploy** → **Deploy latest commit**
3. Wait for completion

**Solution 3: Check Logs**
1. Go to **Logs** tab on Render
2. Submit a demo booking
3. Look for the error message
4. The logs will now show detailed instructions

### Issue: Not receiving emails at all

**Check Resend API Key:**
1. Go to: https://resend.com/api-keys
2. Verify your API key is active
3. Copy the key
4. Update `RESEND_API_KEY` on Render
5. Redeploy

### Issue: Want to send to a different email

**You have two options:**

**Option A:** Update `DEMO_EMAIL` to match Resend account email
```bash
DEMO_EMAIL=info@aiactivesolutions.com
```

**Option B:** Verify your domain (see [RESEND-DOMAIN-FIX.md](./RESEND-DOMAIN-FIX.md))

---

## 📝 What Changed?

### Files Updated:
1. **`.env.render.example`**
   - Updated `DEMO_EMAIL` from `tanmay9623bari@gmail.com` to `info@aiactivesolutions.com`
   - Added warning comment about domain verification

2. **`server/utils/emailService.js`**
   - Improved error messages
   - Added domain verification guidance
   - Better debugging for Resend errors

3. **`RESEND-DOMAIN-FIX.md`** (NEW)
   - Complete guide for domain verification
   - Step-by-step instructions
   - Troubleshooting tips

---

## 🎯 Next Steps

### Immediate (Choose One):

**Option 1: Testing Mode**
- [ ] Update `DEMO_EMAIL` to `info@aiactivesolutions.com` on Render
- [ ] Test demo booking flow
- [ ] Check emails at `info@aiactivesolutions.com`

**Option 2: Production Mode**
- [ ] Follow [RESEND-DOMAIN-FIX.md](./RESEND-DOMAIN-FIX.md)
- [ ] Verify domain on Resend
- [ ] Update environment variables
- [ ] Send to any email address

---

## 📞 Need Help?

- **Resend Support:** support@resend.com
- **Resend Docs:** https://resend.com/docs
- **Resend Discord:** https://resend.com/discord

---

**Last Updated:** November 4, 2025  
**Status:** Ready to deploy ✅
