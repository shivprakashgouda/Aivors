# Email Verification with OTP - Setup Guide

## 🎉 What's Been Added

Your Aivors platform now has **email verification with OTP (One-Time Password)** functionality! Users must verify their email address before accessing the platform.

## ✨ Features

- ✅ **6-digit OTP** sent to user email upon signup
- ✅ **Email verification required** before login
- ✅ **Resend OTP** functionality with 60-second cooldown
- ✅ **OTP expiration** (10 minutes)
- ✅ **Beautiful email templates** with your branding
- ✅ **Welcome email** sent after successful verification
- ✅ **Test mode** for development (emails logged to console)

## 📋 Backend Changes

### Modified Files:
1. **`server/models/User.js`** - Added email verification fields
2. **`server/routes/auth.js`** - Updated auth flow with OTP verification
3. **`server/utils/emailService.js`** - NEW: Email sending service
4. **`server/package.json`** - Added nodemailer dependency

### New API Endpoints:
- `POST /api/auth/signup` - Now sends OTP instead of auto-login
- `POST /api/auth/verify-otp` - Verify email with OTP code
- `POST /api/auth/resend-otp` - Resend OTP to email
- `POST /api/auth/login` - Now checks email verification

## 🎨 Frontend Changes

### Modified Files:
1. **`src/components/SignInModal.tsx`** - Added OTP verification UI
2. **`src/components/OTPInput.tsx`** - NEW: Custom OTP input component
3. **`src/services/api.ts`** - Added OTP API methods

### New Features:
- OTP input with auto-focus and paste support
- Countdown timer for resend button
- Back to login option
- Beautiful verification UI

## 🚀 Setup Instructions for Render

### Step 1: Install Dependencies

On Render, the build will automatically run:
```bash
cd server
npm install
```

This will install nodemailer and all dependencies.

### Step 2: Configure Email Service

You have **2 options** for sending emails:

#### **Option A: Gmail (Easiest for Testing)**

1. Go to your Google Account settings
2. Enable 2-Factor Authentication
3. Generate an App Password:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and generate a password
4. Add to Render environment variables:
   ```
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-16-digit-app-password
   EMAIL_FROM_NAME=Aivors
   ```

#### **Option B: Professional SMTP (Recommended for Production)**

Use services like SendGrid, AWS SES, Mailgun, etc.

**SendGrid Example:**
```
EMAIL_SERVICE=smtp
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
EMAIL_FROM_NAME=Aivors
```

**AWS SES Example:**
```
EMAIL_SERVICE=smtp
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-aws-access-key-id
SMTP_PASSWORD=your-aws-secret-key
EMAIL_FROM_NAME=Aivors
```

### Step 3: Render Environment Variables

Add these to your Render dashboard (Web Service → Environment):

**Required:**
```
EMAIL_SERVICE=gmail (or smtp)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM_NAME=Aivors
CLIENT_URL=https://www.aivors.com
```

**Optional (if using custom SMTP):**
```
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-username
SMTP_PASSWORD=your-smtp-password
```

### Step 4: Deploy

1. Commit and push all changes to GitHub
2. Render will automatically redeploy
3. Check deployment logs for any errors

## 🧪 Testing

### Development Mode (No Email Service Configured)

If you don't configure email settings, the system will run in **TEST MODE**:
- OTPs will be logged to the console/terminal
- No actual emails will be sent
- Perfect for local development

**Look for this in the server logs:**
```
📧 ============ EMAIL OTP (TEST MODE) ============
To: user@example.com
Name: John Doe
OTP: 123456
============================================
```

### Production Mode

Once email service is configured:
- Real emails will be sent to users
- Check spam folder if emails don't arrive
- Monitor email delivery in your email service dashboard

## 📧 Email Templates

The system sends 2 types of emails:

### 1. OTP Verification Email
- Beautiful gradient header
- Large, easy-to-read OTP code
- 10-minute expiration notice
- Professional styling

### 2. Welcome Email (After Verification)
- Celebration message
- Quick start guide
- Dashboard link
- Support information

## 🔒 Security Features

- ✅ OTP expires after 10 minutes
- ✅ Password hashed with bcrypt
- ✅ Rate limiting on authentication endpoints
- ✅ Email verification required before login
- ✅ Audit logs for all verification attempts
- ✅ Secure cookie-based sessions

## 🎯 User Flow

1. **User signs up** → Receives OTP via email
2. **User enters OTP** → Email verified
3. **Welcome email sent** → Account activated
4. **User can login** → Access granted

## 🔧 Troubleshooting

### Emails Not Sending?

1. **Check Render logs** for email errors
2. **Verify environment variables** are set correctly
3. **Check spam folder** for test emails
4. **Gmail App Password** - Make sure 2FA is enabled
5. **SMTP settings** - Verify host, port, and credentials

### OTP Not Working?

- Check if OTP is expired (10 minutes)
- Verify email address is correct
- Try resending OTP
- Check server logs for errors

### Cannot Login?

- Make sure email is verified first
- Check if account exists
- Verify password is correct
- Look for "requiresVerification" error

## 📊 Monitoring

Check these in your database:
- `isEmailVerified` field should be `true` for verified users
- `emailVerificationOTP` should be `null` after verification
- `otpExpiresAt` should be `null` after verification

## 🎨 Customization

### Change OTP Length
In `server/utils/emailService.js`:
```javascript
const generateOTP = () => {
  // Change to 4-digit: 1000 + Math.random() * 9000
  return Math.floor(100000 + Math.random() * 900000).toString();
};
```

### Change OTP Expiration
In `server/routes/auth.js`:
```javascript
// Change from 10 minutes to 5 minutes
const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
```

### Customize Email Template
Edit `server/utils/emailService.js` → `sendOTPEmail()` function

## 📝 Next Steps

1. ✅ Set up email service in Render
2. ✅ Test signup flow with real email
3. ✅ Verify OTP delivery
4. ✅ Test resend functionality
5. ✅ Check welcome email
6. ✅ Monitor delivery rates

## 🆘 Support

If you encounter any issues:
1. Check Render deployment logs
2. Verify all environment variables
3. Test in development mode first
4. Check email service status/quota

---

**Made with ❤️ for Aivors**
