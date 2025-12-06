# 🚨 SMTP Port Blocked on Render - Solution Required

## Current Issue

```
Error Message: Connection timeout
Error Code: ETIMEDOUT
Failed Command: CONN
```

**Root Cause**: Render (and most PaaS providers) **block outbound SMTP ports 25, 465, and 587** to prevent spam and abuse. Your Gmail SMTP connection times out because port 465 is blocked.

## Solutions (Pick One)

### ✅ Solution 1: Use Resend API (RECOMMENDED - Free & Easy)

Resend is a modern email API that's free for 3,000 emails/month and works perfectly on Render.

#### Setup Steps:

1. **Sign up at Resend**: https://resend.com/signup
2. **Get API Key**:
   - Go to https://resend.com/api-keys
   - Click "Create API Key"
   - Name it "Aivors Production"
   - Copy the key (starts with `re_`)

3. **Install Resend SDK**:
   ```bash
   cd server
   npm install resend
   ```

4. **Update `server/utils/emailService.js`**:
   I'll create a version that uses Resend instead of SMTP.

5. **Set Render Environment Variable**:
   - `RESEND_API_KEY` = your API key from step 2
   - Remove or ignore SMTP_* variables

6. **Verify domain (optional but recommended)**:
   - Go to https://resend.com/domains
   - Add `aivors.com` (or use Resend's shared domain for testing)

---

### Solution 2: Use SendGrid API (Also Free Tier)

SendGrid offers 100 emails/day free.

1. Sign up: https://signup.sendgrid.com
2. Create API Key
3. Install: `npm install @sendgrid/mail`
4. Set env: `SENDGRID_API_KEY`

---

### Solution 3: Use Gmail via OAuth2 (Complex, Not Recommended)

Requires OAuth2 setup with Google Cloud Console - too complex for this use case.

---

## Immediate Action: Switch to Resend

Let me update your `emailService.js` to support both SMTP (for local dev) and Resend (for production):

### Updated Architecture:
- **Local Dev**: Uses SMTP (your local machine can connect to Gmail SMTP)
- **Production (Render)**: Uses Resend API

Would you like me to:
1. Update `emailService.js` to use Resend when `RESEND_API_KEY` is set?
2. Create a Resend account setup guide?

## Why This Happened

Most cloud platforms block SMTP ports to prevent:
- Spam/abuse from compromised servers
- Unauthorized mass mailing
- Email deliverability issues

**Industry standard**: Use transactional email APIs (Resend, SendGrid, Postmark, AWS SES) instead of direct SMTP on cloud platforms.

## Quick Test

You can test if SMTP ports are blocked:
```bash
# On your Render service, run:
curl -v telnet://smtp.gmail.com:465
# If it times out, port is blocked
```

---

**RECOMMENDATION**: Switch to Resend. It's the easiest, most reliable solution for your use case.
