# Authentication 401 Error - Troubleshooting Guide

## Overview
This guide helps diagnose and fix the intermittent 401 Unauthorized errors on the `/api/auth/me` endpoint that prevent users from accessing the dashboard after login.

## Recent Fixes Applied

### 1. Enhanced Logging
- **authGuard**: Added comprehensive debug logging showing cookies, headers, environment, and failure reasons
- **Frontend API**: Added detailed request/response logging with error categorization
- **Cookie Setting**: Added logging when cookies are set with full configuration details
- **CORS**: Added origin checking logs to identify CORS-related failures

### 2. Cookie Configuration Improvements
- Added explicit `path: '/'` to all auth cookies (access_token, refresh_token)
- Ensured consistent cookie settings across all auth endpoints (signup, login, verify-otp, refresh)
- Added cookie debugging information to responses
- Exposed Set-Cookie headers in CORS configuration

### 3. Automatic Token Refresh
- Implemented automatic token refresh on 401 errors in frontend
- Added request queuing during token refresh to prevent race conditions
- Token refresh now happens transparently without user intervention

### 4. Environment Validation
- Created `envValidator.js` to validate all critical environment variables on startup
- Server now exits with clear error message if critical variables are missing
- Validates JWT secrets, MongoDB URI, CLIENT_URL, and CORS configuration
- Checks for placeholder values that need to be replaced

### 5. Debug Endpoint
- Added `/api/debug/auth-status` endpoint to check authentication state
- Shows cookies, environment, request details, and troubleshooting steps
- Helps identify whether issues are from CORS, cookies, or configuration

## Common Causes and Solutions

### Issue 1: Cookie Domain Mismatch
**Symptoms**: Cookies are set but not sent with subsequent requests

**Diagnosis**:
```bash
# Check browser DevTools > Application > Cookies
# Verify domain matches exactly between cookie and current page
```

**Solution**:
- Ensure `CLIENT_URL` in server `.env` matches frontend URL exactly
- In production, both must use HTTPS
- Cookie domain is automatically set by browser based on server domain

### Issue 2: CORS Configuration
**Symptoms**: 401 errors only in production, works locally

**Diagnosis**: Check server logs for "CORS blocked" messages

**Solution**:
```env
# In server/.env
CLIENT_URL=https://your-frontend-domain.com
CORS_ORIGINS=https://your-frontend-domain.com,https://www.your-domain.com
```

### Issue 3: Missing Environment Variables
**Symptoms**: Server works but auth fails intermittently

**Diagnosis**: Server logs will show environment validation errors on startup

**Solution**:
```env
# Required in server/.env
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_secure_secret_here  # NOT "fallback_secret_change_me"
JWT_REFRESH_SECRET=your_refresh_secret_here
CLIENT_URL=https://your-frontend.com
NODE_ENV=production  # In production
```

### Issue 4: HTTPS/HTTP Mismatch
**Symptoms**: Works on HTTP locally, fails on HTTPS production

**Solution**:
- In production, BOTH frontend and backend must use HTTPS
- Cookies with `secure: true` only work over HTTPS
- Cookie `sameSite: 'none'` requires secure: true

### Issue 5: SameSite Cookie Blocking
**Symptoms**: Cookies work same-domain, fail cross-domain

**Solution**:
- Production uses `sameSite: 'none'` for cross-domain
- Requires `secure: true` (HTTPS only)
- Development uses `sameSite: 'lax'` for easier testing

## Debugging Workflow

### Step 1: Check Auth Status
```bash
# Visit this endpoint to see current auth state
curl https://your-api.com/api/debug/auth-status \
  -H "Cookie: access_token=...; refresh_token=..." \
  -v
```

### Step 2: Check Server Logs
Look for these log patterns:
```
🔐 [timestamp] ========== AUTH GUARD ==========
```

This shows:
- Request details (method, path, origin)
- Cookie presence and names
- Environment configuration
- Specific failure reason

### Step 3: Check Browser DevTools

**Network Tab**:
1. Look for `/api/auth/me` request
2. Check Request Headers > Cookie (should include access_token)
3. Check Response Headers > Set-Cookie (on login)
4. Verify status code and error message

**Application Tab**:
1. Navigate to Cookies section
2. Check for `access_token` and `refresh_token`
3. Verify Domain, Path, Secure, HttpOnly, SameSite
4. Ensure not expired

**Console Tab**:
- Look for authentication initialization logs
- Check for automatic refresh attempts
- Note any CORS errors

### Step 4: Test Authentication Flow

```javascript
// In browser console
// 1. Check current auth status
fetch('/api/debug/auth-status', { credentials: 'include' })
  .then(r => r.json())
  .then(console.log);

// 2. Try to refresh token
fetch('/api/auth/refresh', { 
  method: 'POST', 
  credentials: 'include' 
})
  .then(r => r.json())
  .then(console.log);

// 3. Try to get user
fetch('/api/auth/me', { credentials: 'include' })
  .then(r => r.json())
  .then(console.log);
```

## Production Deployment Checklist

### Backend (server/.env)
- [ ] `NODE_ENV=production` is set
- [ ] `MONGO_URI` points to production database
- [ ] `JWT_SECRET` is strong, unique, not a placeholder
- [ ] `JWT_REFRESH_SECRET` is different from JWT_SECRET
- [ ] `CLIENT_URL` is exact production frontend URL (with HTTPS)
- [ ] `CORS_ORIGINS` includes all frontend domains
- [ ] Server is accessible via HTTPS

### Frontend (.env)
- [ ] `VITE_API_URL` points to production backend (with HTTPS)
- [ ] Frontend is served over HTTPS
- [ ] Domain matches cookie domain

### Platform Configuration
- [ ] Trust proxy enabled (`app.set('trust proxy', 1)`)
- [ ] HTTPS enforced on hosting platform
- [ ] Environment variables set in platform dashboard
- [ ] Cookie settings compatible with platform

## Automatic Recovery Features

### Token Auto-Refresh
When a 401 error occurs:
1. Frontend automatically calls `/api/auth/refresh`
2. If refresh succeeds, original request is retried
3. If refresh fails, user is prompted to login
4. Other pending requests wait for refresh to complete

### Retry Logic
- Failed requests due to expired tokens are automatically retried
- Prevents "stuck" state where user is logged in but can't access data
- Transparent to user - no manual refresh needed

## Logging Guide

### Server Logs to Monitor

**Successful Auth**:
```
🔐 [timestamp] ========== AUTH GUARD ==========
✅ AUTH SUCCESS: Token verified
   → User ID: 507f1f77bcf86cd799439011
   → Role: user
```

**Failed Auth - No Cookie**:
```
🔐 [timestamp] ========== AUTH GUARD ==========
❌ AUTH FAILED: No token found in cookies
   → Cookie header: MISSING
   → Possible causes:
     1. Cookie not sent by browser (domain/path mismatch)
```

**Failed Auth - Expired Token**:
```
🔐 [timestamp] ========== AUTH GUARD ==========
❌ AUTH FAILED: Token verification failed
   → Possible causes:
     1. Token expired (TTL: 15 minutes)
```

### Frontend Logs to Monitor

**Successful Flow**:
```
🔐 Initializing authentication...
✅ CSRF token obtained
✅ Token refresh successful
🔍 Fetching current user...
✅ User data received: user@example.com
✅ Auth initialization complete
```

**Failed Flow**:
```
🔐 Initializing authentication...
❌ Failed to fetch user: 401 Unauthorized
ℹ️  User not authenticated (401) - this is expected when not logged in
```

## Support Information

If issues persist after following this guide:

1. **Collect Information**:
   - Server logs (especially AUTH GUARD sections)
   - Browser console output
   - Network tab screenshots
   - Output of `/api/debug/auth-status`

2. **Check Recent Changes**:
   - Environment variable changes
   - Domain or URL changes
   - Platform configuration updates

3. **Verify Basics**:
   - Can you login? (Does /api/auth/login work?)
   - Are cookies being set? (Check DevTools)
   - Is CORS working? (No CORS errors in console?)
   - Is server accessible? (Check /api/health)

## Additional Resources

- [MDN: HTTP Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)
- [MDN: CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [JWT.io](https://jwt.io/) - Decode and inspect JWT tokens
- [Chrome DevTools: Debug Progressive Web Apps](https://developer.chrome.com/docs/devtools/progressive-web-apps/)
