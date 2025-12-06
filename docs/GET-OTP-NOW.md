# 🔑 How to Get Your OTP Right Now

## Current Situation
✅ Backend is UP and running  
✅ Signup/Demo forms work instantly (no timeout)  
⚠️ Emails are in TEST MODE (not sending to inbox)  
📋 OTPs are being logged to Render console

---

## Option 1: Get OTP from Render Logs (Quick - 2 minutes)

### Step-by-Step:

1. **Go to Render Dashboard:**
   - Visit: https://dashboard.render.com
   - Click on: **aivors-5hvj** service

2. **Open Logs Tab:**
   - Click the **"Logs"** tab at the top
   - You'll see real-time server logs

3. **Try Signup Again:**
   - Go to: https://www.aivors.com
   - Click "Sign Up"
   - Enter your details:
     - Email: `tanmay9623bari@gmail.com`
     - Name: Your name
     - Password: Your password
   - Click "Sign Up"

4. **Find OTP in Logs:**
   - Immediately go back to Render logs
   - Look for this pattern:
   ```
   📧 ============ EMAIL OTP (TEST MODE) ============
   To: tanmay9623bari@gmail.com
   Name: [Your Name]
   OTP: 123456  ← YOUR 6-DIGIT CODE
   ============================================
   ```

5. **Copy and Enter OTP:**
   - Copy the 6-digit code
   - Enter it in the verification screen on www.aivors.com
   - Click "Verify Email"

---

## Option 2: Enable Real Email Sending (10 minutes)

### Choose ONE method:

### Method A: Use Gmail (Recommended)

**You already have Gmail (tanmay9623bari@gmail.com)!**

1. **Generate Gmail App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Sign in with: `tanmay9623bari@gmail.com`
   - Select app: "Mail"
   - Select device: "Other (Custom name)" → Type "Aivors"
   - Click "Generate"
   - **COPY THE 16-DIGIT PASSWORD** (example: `abcd efgh ijkl mnop`)
   - Remove spaces: `abcdefghijklmnop`

2. **Update Render Environment Variables:**
   - Go to: https://dashboard.render.com → aivors-5hvj
   - Click: **"Environment"** tab
   - Find and UPDATE these variables:
   
   ```
   EMAIL_SERVICE = gmail
   EMAIL_USER = tanmay9623bari@gmail.com
   EMAIL_PASSWORD = [paste the 16-digit app password]
   EMAIL_FROM_NAME = Aivors
   ```

3. **Save and Redeploy:**
   - Render will auto-deploy (wait 5 minutes)
   - OR click "Manual Deploy" to deploy now

4. **Test:**
   - Try signup again
   - OTP will arrive in your Gmail inbox!

---

### Method B: Use Custom SMTP (for Info@aiactivesolutions.com)

1. **Get SMTP Settings:**
   - Contact your email provider (GoDaddy, Office 365, etc.)
   - Ask for: SMTP host, port, username, password

2. **Common SMTP Settings:**

   **For Office 365 / Microsoft:**
   ```
   EMAIL_SERVICE = smtp
   SMTP_HOST = smtp.office365.com
   SMTP_PORT = 587
   SMTP_SECURE = false
   SMTP_USER = Info@aiactivesolutions.com
   SMTP_PASSWORD = [your email password]
   EMAIL_FROM_NAME = Aivors
   ```

   **For cPanel / Generic:**
   ```
   EMAIL_SERVICE = smtp
   SMTP_HOST = mail.aiactivesolutions.com
   SMTP_PORT = 587
   SMTP_SECURE = false
   SMTP_USER = Info@aiactivesolutions.com
   SMTP_PASSWORD = [your email password]
   EMAIL_FROM_NAME = Aivors
   ```

3. **Update in Render and Redeploy**

---

## Quick Test Right Now (1 minute)

**Let's test with Render logs:**

1. Open two browser tabs:
   - Tab 1: https://dashboard.render.com (Logs tab)
   - Tab 2: https://www.aivors.com

2. In Tab 2:
   - Click "Sign Up"
   - Enter: `tanmay9623bari@gmail.com`
   - Submit

3. In Tab 1:
   - Watch the logs
   - Look for: `📧 ============ EMAIL OTP (TEST MODE)`
   - Copy the 6-digit OTP

4. In Tab 2:
   - Paste OTP
   - Verify!

---

## For Demo Booking (Same Process)

1. Open Render logs
2. Fill demo form on www.aivors.com
3. Submit
4. Check Render logs for OTP
5. Enter OTP to verify

---

## Why Emails Don't Arrive Yet

**Current Render Config:**
```
EMAIL_SERVICE = gmail
EMAIL_USER = Info@aiactivesolutions.com  ← NOT a Gmail address!
EMAIL_PASSWORD = Aivors@123  ← NOT a Gmail App Password!
```

**This config is incompatible, so the app falls back to TEST MODE.**

---

## ✅ Quick Summary

**RIGHT NOW (Test Mode):**
- ✅ Everything works
- ✅ No timeouts
- ⚠️ Get OTP from Render logs
- ⚠️ No emails sent

**After Fixing Email:**
- ✅ Everything works
- ✅ No timeouts
- ✅ OTP arrives in inbox
- ✅ Production ready!

---

## 🎯 I Recommend: Option 1 First

1. **Test with Render logs NOW** (proves it works)
2. **Set up Gmail App Password later** (for convenience)

This way you can use the app immediately!

---

*Need help? The OTP is valid for 10 minutes. If expired, just signup again to get a new one.*
