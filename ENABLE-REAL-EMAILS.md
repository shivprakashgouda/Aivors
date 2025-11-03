# 🔑 Enable Real Email Sending - Step by Step

## What You Need to Do

To get **real OTP emails** in your inbox, follow these steps:

---

## Step 1: Generate Gmail App Password (3 minutes)

1. **Go to Google Account:**
   - Visit: https://myaccount.google.com/apppasswords
   - Sign in with: `tanmay9623bari@gmail.com`

2. **If you see "App Passwords" option:**
   - Click "Select app" → Choose "Mail"
   - Click "Select device" → Choose "Other (Custom name)"
   - Type: "Aivors"
   - Click "Generate"
   - **YOU'LL SEE A 16-DIGIT PASSWORD** like: `abcd efgh ijkl mnop`
   - **COPY IT** (remove spaces): `abcdefghijklmnop`

3. **If you DON'T see "App Passwords":**
   - You need to enable 2-Step Verification first
   - Go to: https://myaccount.google.com/security
   - Find "2-Step Verification"
   - Turn it ON
   - Then go back to step 1

---

## Step 2: Update Render Environment Variables (2 minutes)

1. **Go to Render Dashboard:**
   - Visit: https://dashboard.render.com
   - Click on: **aivors-5hvj** service

2. **Click "Environment" Tab:**
   - You'll see a list of environment variables

3. **Find and UPDATE these 3 variables:**

   | Variable | Current Value | NEW Value |
   |----------|---------------|-----------|
   | `EMAIL_SERVICE` | `gmail` | `gmail` ✅ (keep same) |
   | `EMAIL_USER` | `Info@aiactivesolutions.com` | `tanmay9623bari@gmail.com` |
   | `EMAIL_PASSWORD` | `Aivors@123` | `[paste 16-digit app password]` |

4. **Click "Save Changes"**

---

## Step 3: Redeploy (2 minutes)

Render will automatically redeploy when you save environment variables.

**OR manually trigger:**
- Click the **"Manual Deploy"** button
- Select branch: **main**
- Wait 5-7 minutes for deployment

---

## Step 4: Test (1 minute)

1. **Wait for deployment to complete** (green checkmark in Render)

2. **Clear browser cache:**
   - Press: `Ctrl + Shift + Delete`
   - Clear "Cached images and files"
   - Close and reopen browser

3. **Test Signup:**
   - Go to: https://www.aivors.com
   - Click "Sign Up"
   - Enter: `tanmay9623bari@gmail.com`
   - Submit

4. **Check your Gmail inbox:**
   - You should receive an email from "Aivors"
   - Subject: "Verify Your Email - Aivors"
   - Contains: 6-digit OTP code

5. **Enter OTP and verify!**

---

## Step 5: Test Demo Booking

1. **Go to:** https://www.aivors.com
2. **Click "Book a Demo"**
3. **Fill the form:**
   - Name: Your name
   - Email: `tanmay9623bari@gmail.com`
   - Phone: Your phone
   - Business name: Test Business
4. **Submit**
5. **Check Gmail for OTP**
6. **Enter OTP to verify**

---

## 🎯 Quick Reference

**Gmail App Password Generator:**
https://myaccount.google.com/apppasswords

**Render Dashboard:**
https://dashboard.render.com

**Environment Variables to Update:**
```
EMAIL_USER = tanmay9623bari@gmail.com
EMAIL_PASSWORD = [16-digit app password without spaces]
```

---

## ⚠️ Important Notes

1. **Remove spaces from App Password:**
   - Gmail shows: `abcd efgh ijkl mnop`
   - You enter: `abcdefghijklmnop`

2. **Don't use your regular Gmail password:**
   - Must be the 16-digit App Password
   - Regular passwords won't work with nodemailer

3. **After updating environment:**
   - Wait for auto-redeploy (5-7 minutes)
   - OR manually deploy
   - Don't test until deployment completes

4. **Clear browser cache before testing:**
   - Old cached data might interfere

---

## 🆘 Troubleshooting

### "I don't see App Passwords option"
- Enable 2-Step Verification first at: https://myaccount.google.com/security
- Then App Passwords will appear

### "Still getting test mode logs"
- Check Render environment variables saved correctly
- Check deployment completed (green checkmark)
- Wait 2 more minutes after deployment
- Try in incognito window

### "Authentication failed" in Render logs
- Double-check the 16-digit password (no spaces)
- Make sure you copied it correctly
- Generate a new App Password and try again

### "Still not receiving emails"
- Check Gmail spam folder
- Check Render logs for errors
- Verify EMAIL_USER is `tanmay9623bari@gmail.com`

---

## ✅ Success Indicators

When it's working, you'll see in Render logs:
```
✅ Email sent successfully: <message-id>
✅ OTP email sent to: tanmay9623bari@gmail.com
```

**NOT this:**
```
📧 ============ EMAIL OTP (TEST MODE) ============
```

---

## 📞 Summary

1. ✅ Generate Gmail App Password (16 digits)
2. ✅ Update EMAIL_USER and EMAIL_PASSWORD in Render
3. ✅ Wait for redeploy (5-7 minutes)
4. ✅ Clear browser cache
5. ✅ Test signup → Check Gmail → Enter OTP
6. ✅ Test demo → Check Gmail → Enter OTP

**After this setup, ALL emails will be sent to real inboxes!**

---

*Last Updated: November 2, 2025*
