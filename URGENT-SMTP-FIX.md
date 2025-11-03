# 🚨 URGENT: Fix SMTP Configuration on Render

## Critical Issue Found

Your logs show: `getaddrinfo ENOTFOUND render.gmail.com`

**Problem**: The SMTP_HOST environment variable is set to `render.gmail.com` instead of `smtp.gmail.com`

## Immediate Fix Required

### Step 1: Fix SMTP_HOST in Render Dashboard

1. Go to your Render dashboard: https://dashboard.render.com
2. Select your Aivors web service
3. Click **Environment** tab
4. Find the `SMTP_HOST` variable
5. **Change from**: `render.gmail.com`  
   **Change to**: `smtp.gmail.com`
6. Click **Save Changes**
7. Render will automatically redeploy

### Step 2: Verify Environment Variables

Your current config (from logs):
```
✅ EMAIL_SERVICE: gmail
✅ EMAIL_USER: tanmaybari01@gmail.com
✅ EMAIL_PASSWORD: kqgf**** (set)
❌ SMTP_HOST: render.gmail.com  <-- WRONG!
✅ SMTP_PORT: 465
❌ SMTP_USER: NOT SET  <-- Should be set
❌ SMTP_PASS: NOT SET  <-- Should be set
```

**Required environment variables on Render**:
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=tanmaybari01@gmail.com
SMTP_PASS=<your-gmail-app-password>
EMAIL_SERVICE=gmail
EMAIL_USER=tanmaybari01@gmail.com
EMAIL_PASSWORD=<your-gmail-app-password>
EMAIL_FROM_NAME=Aivors
```

**Note**: The code supports both naming conventions (EMAIL_* and SMTP_*), but it's best to set both for compatibility.

## Secondary Issue: AuditLog Enum Error

The logs also show:
```
❌ Audit log error: `OTP_RESENT` is not a valid enum value for path `eventType`
```

This is a code issue that needs to be fixed.

### Fix Option 1: Add OTP_RESENT to AuditLog Enum (Recommended)

Edit `server/models/AuditLog.js` and add `'OTP_RESENT'` to the enum array:

```javascript
enum: [
  'USER_CREATED',
  'USER_LOGIN',
  'USER_LOGOUT',
  'OTP_RESENT',           // <-- ADD THIS
  'CHECKOUT_CREATED',
  'SUBSCRIPTION_ACTIVATED',
  'PAYMENT_SUCCEEDED',
  'PAYMENT_FAILED',
  'SUBSCRIPTION_MODIFIED',
  'SUBSCRIPTION_CANCELLED',
  'ADMIN_ACTION',
  'IMPERSONATION_START',
  'IMPERSONATION_END',
  'WEBHOOK_RECEIVED',
],
```

### Fix Option 2: Remove Audit Log Call (Quick Fix)

If audit logging for resend-OTP is not critical, comment out the audit log creation in `server/routes/auth.js` around line 270-276.

## Testing After Fix

Once SMTP_HOST is corrected:

1. Try signing up with a test email
2. Check Render logs for:
   ```
   ✅ ========== SMTP CONNECTION VERIFIED ==========
      Server is ready to send emails!
   ```
3. Check your Gmail inbox for the OTP email
4. If using Gmail App Password, ensure:
   - 2FA is enabled on your Google account
   - App Password has no spaces
   - Format: 16 characters like `abcd efgh ijkl mnop` → use as `abcdefghijklmnop`

## Generate Gmail App Password

If you don't have a Gmail App Password yet:

1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and "Other (Custom name)"
3. Name it "Aivors Render"
4. Click Generate
5. Copy the 16-character password
6. Use it for both `SMTP_PASS` and `EMAIL_PASSWORD` in Render

## Summary of Actions

- [ ] Fix `SMTP_HOST` to `smtp.gmail.com` in Render environment variables
- [ ] Set `SMTP_USER` to `tanmaybari01@gmail.com`
- [ ] Set `SMTP_PASS` to your Gmail App Password
- [ ] Wait for Render to redeploy
- [ ] Test OTP signup flow
- [ ] (Optional) Fix AuditLog enum to include `OTP_RESENT`

---

**The SMTP_HOST fix is the critical blocker preventing emails from sending!**
