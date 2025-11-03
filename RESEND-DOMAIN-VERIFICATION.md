# 🌐 Resend Domain Verification Guide

## Current Issue
Your Resend account can only send to: **tanmaybari01@gmail.com**  
To send to other emails (like customers), you need to verify a domain.

---

## ✅ Quick Solution (For Testing Now)

**Sign up with your registered email:**
- Go to: https://www.aivors.com
- Sign up with: `tanmaybari01@gmail.com` (instead of tanmay9623bari)
- You'll receive the OTP email instantly! ✅

---

## 🚀 Permanent Solution (Verify Domain)

### Step 1: Add Domain to Resend

1. Login to Resend: https://resend.com/login
2. Go to Domains: https://resend.com/domains
3. Click **"Add Domain"**
4. Enter: `aivors.com`
5. Click **Add Domain**

### Step 2: Get DNS Records

Resend will show you 3 DNS records to add:

```
Type: TXT
Name: _resend
Value: resend-verify=abc123xyz...

Type: MX
Name: aivors.com
Value: feedback-smtp.resend.com
Priority: 10

Type: TXT
Name: aivors.com
Value: v=spf1 include:spf.resend.com ~all
```

### Step 3: Add DNS Records

**Where to add them:**
- Go to your domain registrar (where you bought aivors.com)
- Common providers: GoDaddy, Namecheap, Cloudflare, etc.
- Find "DNS Management" or "DNS Settings"
- Add all 3 records exactly as shown

**Example for Cloudflare:**
1. Login to Cloudflare
2. Select `aivors.com`
3. Click **DNS** → **Records**
4. Click **Add record**
5. Add each record one by one

### Step 4: Verify

1. Go back to Resend: https://resend.com/domains
2. Click **Verify** on your domain
3. Wait for verification (usually 5-10 minutes, can take up to 24 hours)
4. Once verified, you'll see ✅ green checkmark

### Step 5: Update Render

Once domain is verified:

1. Go to Render: https://dashboard.render.com
2. Select your service → Environment
3. Update:
   ```
   EMAIL_USER=noreply@aivors.com
   ```
4. Save changes and redeploy

---

## 🎯 After Domain Verification

**What changes:**
- ✅ Can send to ANY email address
- ✅ Professional "from" address: `noreply@aivors.com`
- ✅ Better email deliverability
- ✅ No more "via resend.dev" in email headers

**Before:**
```
From: Aivors <onboarding@resend.dev>
To: anyone@example.com ❌ (Not allowed)
```

**After:**
```
From: Aivors <noreply@aivors.com>
To: anyone@example.com ✅ (Allowed!)
```

---

## ⚡ Quick Testing (Without Domain)

If you don't have access to DNS settings right now:

**Test Method 1:** Use your registered email
- Sign up with: `tanmaybari01@gmail.com`
- Emails will work! ✅

**Test Method 2:** Use OTP from logs
1. Sign up with any email
2. Check Render logs for OTP
3. Copy the OTP code
4. Enter it manually

---

## 🆘 Troubleshooting

**"Domain not verified after 24 hours"**
- Double-check DNS records are exact (no extra spaces)
- Use DNS checker: https://dnschecker.org
- Contact your domain registrar support

**"Can't find DNS settings"**
- Check who manages your domain's DNS
- It might be different from domain registrar
- Common: Cloudflare, Route53, etc.

**"Don't own aivors.com"**
- Use a domain you own
- Or use subdomain: `mail.yourdomain.com`
- Or continue with test email: `tanmaybari01@gmail.com`

---

## 📊 Summary

| Scenario | Solution | Email Limit |
|----------|----------|-------------|
| Testing now | Use `tanmaybari01@gmail.com` | 1 email only |
| Production | Verify `aivors.com` domain | Unlimited ✅ |
| No DNS access | Use OTP from logs | Manual only |

**Recommended:** Verify domain for production use! 🚀
