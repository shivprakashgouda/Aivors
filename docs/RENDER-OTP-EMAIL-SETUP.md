# 🔧 Render OTP Email Setup Guide

## ❌ Problem: "Verification code sent!" but no email arrives

Your app is working correctly — the issue is **SMTP configuration** on Render.

---

## ✅ Solution: Set Up Gmail App Password

### Step 1: Generate Gmail App Password

1. Go to: **https://myaccount.google.com/apppasswords**
2. Sign in with `tanmay9623bari@gmail.com`
3. Under "Select app" → choose **Mail**
4. Under "Select device" → choose **Other (Custom name)**
5. Type: `Render Backend`
6. Click **Generate**
7. Copy the **16-character password** (e.g., `abcd efgh ijkl mnop`)

⚠️ **Important:** 
- Remove all spaces when copying (should be: `abcdefghijklmnop`)
- This is NOT your Gmail login password
- You must have 2FA enabled on your Gmail account

---

### Step 2: Set Environment Variables on Render

Go to your **Render Dashboard** → **Backend Service** → **Environment** tab

Add these **exact** variables:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tanmay9623bari@gmail.com
SMTP_PASS=<paste your 16-char app password here, no spaces>
```

**Optional (recommended):**
```bash
EMAIL_FROM_NAME=Aivors
```

---

### Step 3: Save and Redeploy

1. Click **Save Changes** in Render
2. Render will automatically redeploy (takes ~3-5 minutes)
3. Wait for the deployment to complete

---

### Step 4: Check Render Logs

Once redeployed:

1. Go to **Render → Your Backend Service → Logs** tab
2. Look for these lines on startup:

```
🔧 ========== EMAIL CONFIGURATION CHECK ==========
  SMTP_HOST: smtp.gmail.com
  SMTP_PORT: 587
  SMTP_USER: tanmay9623bari@gmail.com
  SMTP_PASS: abcd****
================================================

📧 Creating SMTP transporter with:
   Host: smtp.gmail.com
   Port: 587
   Secure: false (STARTTLS)
   User: tanmay9623bari@gmail.com

✅ ========== SMTP CONNECTION VERIFIED ==========
   Server is ready to send emails!
=================================================
```

✅ If you see **"SMTP CONNECTION VERIFIED"** → You're all set!

❌ If you see **"SMTP CONNECTION FAILED"** → See troubleshooting below

---

### Step 5: Test Signup

1. Go to your app signup page
2. Enter your email: `tanmay9623bari@gmail.com`
3. Click signup
4. Check your **Gmail inbox** (or **Spam/Promotions/All Mail**)

---

## 🐛 Troubleshooting

### Error: `EAUTH - Invalid login`

**Cause:** Wrong App Password or using regular Gmail password

**Fix:**
1. Regenerate App Password from https://myaccount.google.com/apppasswords
2. Make sure you copied it without spaces
3. Make sure 2FA is enabled on Gmail
4. Update `SMTP_PASS` on Render with the new password

---

### Error: `ENOTFOUND smtp.gmail.com`

**Cause:** Cannot reach Gmail's SMTP server

**Fix:**
1. Check `SMTP_HOST=smtp.gmail.com` (no typos)
2. Verify Render server has internet access
3. Check if port 587 is blocked by firewall

---

### Error: `ETIMEDOUT` or `ECONNECTION`

**Cause:** Connection timeout or refused

**Fix:**
1. Try changing `SMTP_PORT=465` instead of `587`
2. If using 465, the connection uses SSL/TLS (more reliable)
3. Update Render environment variables and save

---

### Still no email?

**Check Gmail Filters:**
1. Search for `"Your OTP code"` in Gmail
2. Check **Spam**, **Promotions**, **All Mail** tabs
3. Add `tanmay9623bari@gmail.com` (your sender) to contacts

---

## 📊 Understanding the Logs

When you trigger OTP, you should see in **Render Logs**:

```
📤 ========== SENDING OTP EMAIL ==========
To: tanmay9623bari@gmail.com
OTP: 123456
Name: Tanmay
=========================================

📤 Attempting to send OTP email...
   From: "Aivors" <tanmay9623bari@gmail.com>
   To: tanmay9623bari@gmail.com
   Subject: Verify Your Email - Aivors

✅ ========== EMAIL SENT SUCCESSFULLY ==========
   Message ID: <some-id@gmail.com>
   Response: 250 2.0.0 OK
   Accepted: [ 'tanmay9623bari@gmail.com' ]
   Rejected: []
================================================
```

✅ **"EMAIL SENT SUCCESSFULLY"** = Email was sent by Render to Gmail servers
⏳ Check your Gmail inbox within 1-2 minutes

---

## 🎯 Quick Reference Card

| Variable | Value | Notes |
|----------|-------|-------|
| `SMTP_HOST` | `smtp.gmail.com` | Gmail's SMTP server |
| `SMTP_PORT` | `587` or `465` | 587=STARTTLS, 465=SSL/TLS |
| `SMTP_USER` | `tanmay9623bari@gmail.com` | Your Gmail address |
| `SMTP_PASS` | 16-char App Password | NOT your login password |
| `EMAIL_FROM_NAME` | `Aivors` (optional) | Sender name in email |

---

## ✅ Success Checklist

- [ ] 2FA enabled on Gmail
- [ ] App Password generated
- [ ] All 4 environment variables set on Render
- [ ] Render redeployed successfully
- [ ] Logs show "SMTP CONNECTION VERIFIED"
- [ ] Test signup triggers "EMAIL SENT SUCCESSFULLY"
- [ ] OTP email received in Gmail

---

## 🔄 If You Still Don't Receive Emails

1. **Copy the exact error from Render Logs** (starting with `Error:`)
2. The improved `emailService.js` now shows detailed diagnostics
3. Share the error message for specific troubleshooting

---

## 📞 Support

If emails still fail after following this guide:
1. Check **Render Logs** → Copy any `❌ EMAIL SENDING FAILED` errors
2. Verify all 4 environment variables are correctly set
3. Confirm App Password is valid (try regenerating it)

---

**Last Updated:** November 2025  
**Your Email:** `tanmay9623bari@gmail.com`  
**Backend Platform:** Render
