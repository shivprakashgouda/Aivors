# Password Reset Feature - Integration Guide

## ✅ Files Generated

- `server/utils/email.js` - Email utility
- `server/routes/authReset.js` - Password reset routes
- `src/pages/ForgotPasswordStandalone.tsx` - Request reset page
- `src/pages/ResetPasswordStandalone.tsx` - Reset password page

## 📋 Integration Steps

### 1. Update User Model (already done ✓)
Your `server/models/User.js` already has:
```javascript
resetPasswordToken: { type: String, default: null },
resetPasswordExpires: { type: Date, default: null },
```

### 2. Mount Routes in server/index.js

Add this line with your other route mounts:
```javascript
app.use('/api/auth', require('./routes/authReset'));
```

### 3. Update App.tsx Routes

Add these imports:
```typescript
import ForgotPasswordStandalone from "./pages/ForgotPasswordStandalone";
import ResetPasswordStandalone from "./pages/ResetPasswordStandalone";
```

Add these routes (before the "*" catch-all):
```typescript
<Route path="/forgot-password" element={<ForgotPasswordStandalone />} />
<Route path="/reset-password" element={<ResetPasswordStandalone />} />
```

## 🔧 Environment Variables Required

### Backend (.env)
```env
# Already configured:
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
PORT=3001

# Required for password reset:
CLIENT_URL=http://localhost:8080
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_PASS=your_resend_api_key_or_smtp_password
EMAIL_USER=noreply@yourdomain.com
EMAIL_FROM_NAME=Aivors
```

### Frontend (.env or .env.local)
```env
VITE_API_URL=http://localhost:3001
```

## 🧪 Testing Locally

### 1. Set up test SMTP:
**Option A: Resend (recommended)**
- Get free API key at https://resend.com/api-keys
- Set `SMTP_PASS=re_your_api_key`

**Option B: Mailtrap (for testing)**
- Create free account at https://mailtrap.io
- Use their SMTP credentials

**Option C: Gmail (for development only)**
- Enable 2FA on Gmail
- Generate App Password
- Set credentials in .env

### 2. Start servers:
```bash
# Backend
cd server
npm run dev

# Frontend (in another terminal)
npm run dev
```

### 3. Test the flow:
1. Go to `http://localhost:8080/forgot-password`
2. Enter registered email
3. Check email inbox for reset link
4. Click link → redirects to `/reset-password?token=xxx&email=xxx`
5. Enter new password
6. Sign in with new password

## 🔒 Security Features

✅ Tokens expire after 1 hour
✅ Tokens are one-time use (cleared after reset)
✅ No email enumeration (always returns success)
✅ Password hashed with bcrypt (10 rounds)
✅ Min 8 character password requirement
✅ HTTPS links in production (set CLIENT_URL to https://)
✅ TODO: Add rate-limiting to prevent abuse

## 📝 Production Checklist

- [ ] Set `CLIENT_URL` to production HTTPS URL
- [ ] Configure production SMTP service (Resend/SendGrid)
- [ ] Add rate-limiting middleware (`express-rate-limit`)
- [ ] Test email delivery end-to-end
- [ ] Monitor reset request logs
- [ ] Set up email alerts for failures

## 🎨 UI/UX Features

✅ Clean, minimal forms
✅ Password visibility toggle
✅ Loading states
✅ Success/error toasts
✅ Auto-redirect on success
✅ Validation (email format, password length, matching passwords)
✅ Dark theme matching existing design

## 📧 Email Templates

Both plain text and HTML versions included:
- Beautiful HTML email with gradient header
- Clear call-to-action button
- Fallback plain text link
- Expiry time shown
- Company branding

---

**All code is production-safe with no hardcoded secrets!**
