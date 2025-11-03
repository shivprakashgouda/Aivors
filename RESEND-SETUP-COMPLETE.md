# ✅ Resend Email Setup - Complete Guide

## 🚨 URGENT: Security Actions Required

### 1. Revoke Exposed Gmail Credentials **IMMEDIATELY**

Your Gmail app password was detected on GitHub. You MUST revoke it now:

1. Go to: https://myaccount.google.com/apppasswords
2. Find the app password you created for Aivors
3. Click the **REMOVE** or **REVOKE** button
4. Confirm the revocation

**DO THIS NOW** before continuing with Resend setup.

---

## 🎯 What Was Fixed

### Problem
- Gmail SMTP connection timeout on Render
- SMTP ports (587, 465) are blocked by cloud hosting providers
- Exposed credentials on GitHub (security risk)

### Solution
- Switched to **Resend API** (uses HTTPS, not SMTP ports)
- Works reliably on Render, Vercel, and all cloud platforms
- Professional email delivery with better tracking

---

## 📧 Resend Setup Steps

### Step 1: Create Resend Account

1. Go to: **https://resend.com**
2. Sign up for free account
3. Verify your email address

### Step 2: Get Your API Key

1. Login to Resend dashboard: https://resend.com/api-keys
2. Click **"Create API Key"**
3. Name it: `Aivors Production`
4. Select permission: **Sending access**
5. Click **Create**
6. **COPY THE API KEY** (starts with `re_`)
   - Example: `re_123456789abcdefghijklmnop`
   - ⚠️ Save it securely - you won't see it again!

### Step 3: Add Domain (Recommended for Production)

**Option A: Use Your Own Domain** (Professional)
1. Go to: https://resend.com/domains
2. Click **"Add Domain"**
3. Enter your domain: `aivors.com`
4. Add the DNS records to your domain registrar
5. Wait for verification (usually 5-10 minutes)

**Option B: Use Resend's Shared Domain** (Testing)
- Free tier allows sending from: `onboarding@resend.dev`
- Limited to your verified email addresses only
- Good for testing, but use your own domain for production

### Step 4: Configure Environment Variables on Render

1. Go to your Render dashboard: https://dashboard.render.com
2. Select your **Aivors** web service
3. Go to **Environment** tab
4. Add these variables:

```bash
# ✅ ADD THESE - Resend API (Primary)
RESEND_API_KEY=re_your_actual_api_key_here
EMAIL_USER=noreply@aivors.com
EMAIL_FROM_NAME=Aivors

# ❌ REMOVE OR COMMENT OUT - Gmail SMTP (No longer needed)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@gmail.com
# SMTP_PASS=your-app-password

# 📧 Demo notifications (where to send demo booking emails)
DEMO_EMAIL=tanmay9623bari@gmail.com
```

5. Click **"Save Changes"**
6. Render will automatically redeploy your service

---

## 🧪 Testing the Email Service

### Test 1: Check Logs After Deployment

After Render redeploys, check your logs for:

```
✅ Using Resend API for email delivery
```

### Test 2: Try Signup

1. Go to your website: https://www.aivors.com
2. Sign up with a new test email
3. Check for OTP email delivery

### Test 3: Check Resend Dashboard

1. Go to: https://resend.com/emails
2. You should see your sent emails
3. Check delivery status

---

## 🔒 Security Best Practices

### ✅ DO:
- Use Resend API keys (they're meant to be server-side)
- Store API keys in Render environment variables
- Use your own verified domain for production
- Revoke old Gmail credentials from GitHub

### ❌ DON'T:
- Commit API keys to GitHub
- Share API keys in documentation
- Use Gmail SMTP on cloud hosting (ports blocked)
- Leave exposed credentials active

---

## 📊 How the Hybrid System Works

The updated `emailService.js` now works like this:

```
1. Check if RESEND_API_KEY is set
   ↓ YES → Use Resend API (✅ Works on Render)
   ↓ NO → Check SMTP credentials
      ↓ YES → Use SMTP (for local development)
      ↓ NO → Test mode (logs only, doesn't send)
```

**Benefits:**
- Production (Render): Uses Resend API automatically
- Local Development: Can still use SMTP or Resend
- Graceful fallback: Won't crash if misconfigured

---

## 🚀 Deployment Checklist

- [x] ✅ Resend package installed (`npm install resend`)
- [x] ✅ Email service updated to hybrid version
- [ ] ⚠️ **Revoke exposed Gmail credentials**
- [ ] 🔑 Create Resend account and get API key
- [ ] 🌐 Add verified domain to Resend (optional but recommended)
- [ ] ⚙️ Add `RESEND_API_KEY` to Render environment
- [ ] 🔄 Deploy to Render
- [ ] ✉️ Test email delivery

---

## 💰 Resend Pricing (as of 2024)

- **Free Tier**: 3,000 emails/month, 100 emails/day
- **Pay as you go**: $1 per 1,000 emails
- **No credit card required** for free tier

Perfect for startup/testing phase!

---

## 🆘 Troubleshooting

### Issue: "RESEND_API_KEY not set"
**Solution:** Add the API key to Render environment variables

### Issue: "Resend SDK not installed"
**Solution:** Run in server directory:
```bash
npm install resend
```

### Issue: Emails not sending with own domain
**Solution:** Verify DNS records are correct in Resend dashboard

### Issue: Can't add domain (free tier limit)
**Solution:** Use `onboarding@resend.dev` for testing, or upgrade Resend plan

---

## 📚 Additional Resources

- Resend Docs: https://resend.com/docs
- Resend API Reference: https://resend.com/docs/api-reference
- Resend Node.js SDK: https://resend.com/docs/send-with-nodejs
- DNS Setup Guide: https://resend.com/docs/knowledge-base/dns-records

---

## 🎉 What's Next?

Once emails are working:
1. Monitor email delivery in Resend dashboard
2. Set up email templates for better branding
3. Configure webhooks for bounce handling (optional)
4. Consider custom domain for professional appearance

---

**Status:** Email service is now configured for Resend API! Just add your API key to Render and you're done! 🚀
