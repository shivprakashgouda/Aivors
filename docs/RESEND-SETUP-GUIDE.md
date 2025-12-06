# 🚀 Quick Fix: Switch to Resend API (5 Minutes)

## Why Resend?
- ✅ **Free**: 3,000 emails/month
- ✅ **Works on Render**: No port blocking issues
- ✅ **Simple**: Just one API key needed
- ✅ **Fast**: Setup in 5 minutes
- ✅ **Reliable**: Better deliverability than SMTP

---

## Step-by-Step Setup

### 1. Sign Up for Resend (2 min)
1. Go to https://resend.com/signup
2. Sign up with your email or GitHub
3. Verify your email

### 2. Get API Key (1 min)
1. Go to https://resend.com/api-keys
2. Click **"Create API Key"**
3. Name it: `Aivors Production`
4. **Copy the key** (starts with `re_`) - you'll only see it once!

### 3. Install Resend SDK (1 min)
```bash
cd "c:\Users\Tanmay Bari\Videos\Aivors-main (1) OTP\Aivors-main\server"
npm install resend
```

### 4. Replace emailService.js (30 sec)
```bash
# Backup current file
mv utils/emailService.js utils/emailService-smtp-backup.js

# Use the new Resend-enabled version
mv utils/emailService-resend.js utils/emailService.js
```

Or manually:
- Delete `server/utils/emailService.js`
- Rename `server/utils/emailService-resend.js` to `server/utils/emailService.js`

### 5. Update Render Environment Variables (1 min)
1. Go to https://dashboard.render.com
2. Select your Aivors service
3. Click **Environment** tab
4. **Add** new variable:
   - Key: `RESEND_API_KEY`
   - Value: `re_...` (paste your API key from step 2)
5. Click **Save Changes**

Render will auto-redeploy.

### 6. (Optional) Set From Email
For testing, Resend uses a shared domain. To use your own domain:

**Option A: Use Resend's onboarding domain (immediate)**
- No setup needed
- From email will be: `onboarding@resend.dev`
- Good for testing

**Option B: Verify your domain (production)**
1. Go to https://resend.com/domains
2. Click **Add Domain**
3. Enter `aivors.com`
4. Add DNS records (shown in Resend dashboard)
5. Wait for verification
6. Set `EMAIL_USER=noreply@aivors.com` in Render

---

## Quick Commands

```bash
# In your project root
cd "c:\Users\Tanmay Bari\Videos\Aivors-main (1) OTP\Aivors-main"

# Install Resend
cd server
npm install resend

# Go back to root
cd ..

# Backup old file
git mv server/utils/emailService.js server/utils/emailService-smtp-backup.js

# Use new file
git mv server/utils/emailService-resend.js server/utils/emailService.js

# Update package.json
cd server
npm install

# Commit
cd ..
git add .
git commit -m "Switch to Resend API for email delivery on Render"
git push origin main
```

---

## Verify It Works

1. Wait for Render deployment to finish
2. Go to your signup page
3. Try signing up with a test email
4. Check Render logs - you should see:
   ```
   ✅ Using Resend API for email delivery
   ✅ ========== EMAIL SENT VIA RESEND ==========
      Email ID: xxxxx-xxxxx-xxxxx
   ```
5. Check your inbox for the OTP email!

---

## Rollback Plan (if needed)

If something goes wrong:
```bash
# Restore old SMTP version
git mv server/utils/emailService.js server/utils/emailService-resend-failed.js
git mv server/utils/emailService-smtp-backup.js server/utils/emailService.js
git commit -m "Rollback to SMTP"
git push origin main
```

---

## Cost Comparison

| Service | Free Tier | After Free Tier |
|---------|-----------|-----------------|
| **Resend** | 3,000 emails/month | $20/month for 50k emails |
| SendGrid | 100 emails/day | $15/month for 40k emails |
| Gmail SMTP | Free | Rate limited, unreliable |

**Recommendation**: Start with Resend free tier. You get 3,000 emails/month which is plenty for early stage.

---

## Need Help?

If you encounter issues:
1. Check Render logs: `https://dashboard.render.com/YOUR_SERVICE/logs`
2. Verify `RESEND_API_KEY` is set correctly
3. Check Resend dashboard: https://resend.com/emails
4. Make sure `resend` package is installed: `npm list resend`

---

**Total Time**: ~5 minutes  
**Cost**: $0 (free tier)  
**Emails**: 3,000/month  
**Deliverability**: Excellent ✅
