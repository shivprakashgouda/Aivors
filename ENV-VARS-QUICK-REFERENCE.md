# 🔐 Render Environment Variables - Quick Copy

## ✅ Required Variables for OTP Email

Copy these into **Render Dashboard → Your Service → Environment**:

```bash
# SMTP Configuration (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tanmay9623bari@gmail.com
SMTP_PASS=<PASTE_YOUR_16_CHAR_APP_PASSWORD_HERE>
```

## 📋 Optional Variables

```bash
# Email Sender Name
EMAIL_FROM_NAME=Aivors

# Test Email (for test-email.js script)
TEST_EMAIL=tanmay9623bari@gmail.com
```

## 🔑 How to Get Gmail App Password

1. Visit: https://myaccount.google.com/apppasswords
2. Sign in with: `tanmay9623bari@gmail.com`
3. Select: **Mail** + **Other (Custom name)** = "Render Backend"
4. Click: **Generate**
5. Copy: 16-character password (e.g., `abcd efgh ijkl mnop`)
6. Remove spaces: `abcdefghijklmnop`
7. Paste into `SMTP_PASS` above

## ⚠️ Important Notes

- **DO NOT** use your Gmail login password
- **MUST** have 2FA enabled on Gmail
- **NO SPACES** in the App Password
- **SAVE CHANGES** on Render after adding variables
- **WAIT 5 MIN** for auto-redeploy

## ✅ Verification

After deploying, check Render logs for:

```
✅ ========== SMTP CONNECTION VERIFIED ==========
   Server is ready to send emails!
```

If you see this ✅ → Emails will work!

If you see ❌ → Check the error message in logs for specific fix.

---

**Total Variables Needed:** 4 (required) + 2 (optional)  
**Setup Time:** ~5 minutes  
**Deploy Time:** ~5 minutes
