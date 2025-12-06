# Authentication Quick Reference Card

## Quick Diagnosis Commands

### Check Server Auth Status
```bash
curl http://localhost:3001/api/debug/auth-status -H "Cookie: $(cat cookies.txt)" | jq
```

### Check Server Health
```bash
curl http://localhost:3001/api/health | jq
```

### Test Login Flow
```bash
# 1. Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}' \
  -c cookies.txt -v

# 2. Check user (with cookies)
curl http://localhost:3001/api/auth/me \
  -b cookies.txt -v

# 3. Refresh token
curl -X POST http://localhost:3001/api/auth/refresh \
  -b cookies.txt -c cookies.txt -v
```

## Common Issues - Quick Fixes

| Issue | Check | Fix |
|-------|-------|-----|
| **401 on /api/auth/me** | Cookies present? | Check DevTools > Application > Cookies |
| **CORS error** | Origin in CORS_ORIGINS? | Add to `CORS_ORIGINS` env var |
| **Cookie not sent** | Domain match? | Verify `CLIENT_URL` matches frontend |
| **Works locally, fails production** | HTTPS enabled? | Both frontend & backend need HTTPS |
| **Intermittent failures** | JWT_SECRET consistent? | Same secret across all server instances |

## Environment Variables Checklist

### Server (.env)
```bash
# Required
MONGO_URI=mongodb+srv://...
JWT_SECRET=strong_random_secret_not_placeholder
CLIENT_URL=https://your-frontend.com

# Important
JWT_REFRESH_SECRET=different_strong_secret
NODE_ENV=production
CORS_ORIGINS=https://frontend1.com,https://frontend2.com
PORT=3001
```

### Frontend (.env)
```bash
VITE_API_URL=https://your-backend.com
```

## Server Logs - What to Look For

### ✅ Successful Auth
```
🔐 [timestamp] ========== AUTH GUARD ==========
✅ AUTH SUCCESS: Token verified
   → User ID: 507f...
```

### ❌ Failed - No Cookie
```
❌ AUTH FAILED: No token found in cookies
   → Cookie header: MISSING
```

### ❌ Failed - Expired Token
```
❌ AUTH FAILED: Token verification failed
   → Token expired (TTL: 15 minutes)
```

### 🌍 CORS Issue
```
🌍 CORS Check - Origin: https://example.com
   ❌ BLOCKED: Origin not in whitelist
```

## Browser DevTools Checks

### 1. Network Tab (for /api/auth/me request)
- **Request Headers**: Should have `Cookie: access_token=...`
- **Response**: Check status code (200 OK or 401 Unauthorized)
- **Response Headers**: On login, check for `Set-Cookie` headers

### 2. Application Tab
- **Cookies**: Should see `access_token` and `refresh_token`
- **Domain**: Should match current page domain
- **Path**: Should be `/`
- **Secure**: `true` in production, `false` in dev
- **HttpOnly**: `true` (always)
- **SameSite**: `None` in production, `Lax` in dev

### 3. Console Tab
Look for:
```
🔐 Initializing authentication...
✅ Token refresh successful
✅ User data received: user@example.com
```

## Production Deployment - Fast Checklist

### Before Deploy
- [ ] Set `NODE_ENV=production` in server env vars
- [ ] Set `JWT_SECRET` to strong unique value (not placeholder)
- [ ] Set `CLIENT_URL` to exact frontend HTTPS URL
- [ ] Set `VITE_API_URL` in frontend build to backend HTTPS URL
- [ ] Verify HTTPS enabled on both frontend & backend

### After Deploy
- [ ] Visit `/api/health` - should return 200 OK
- [ ] Visit `/api/debug/auth-status` - check configuration
- [ ] Test login flow end-to-end
- [ ] Check server logs for AUTH GUARD messages
- [ ] Verify cookies are being set (DevTools)

## Automatic Recovery Features

### Token Auto-Refresh
- 401 errors trigger automatic `/api/auth/refresh` call
- Original request retried after successful refresh
- Transparent to user - no manual action needed

### Request Queuing
- Multiple 401s don't cause multiple refresh attempts
- Requests wait for single refresh operation
- All queued requests proceed after refresh

## Debug Endpoints

### GET /api/debug/auth-status
Shows:
- Cookie presence and configuration
- Environment settings
- CORS configuration
- Common issues and next steps

### GET /api/health
Shows:
- Server status
- MongoDB connection
- Environment mode
- Email configuration

## Log Interpretation

### Server Startup
```
🔍 ========== ENVIRONMENT VALIDATION ==========
   ✅ JWT_SECRET: Set
   ✅ MONGO_URI: Set
   ✅ CLIENT_URL: Set
📊 Validation Summary:
   ✅ All environment variables configured correctly!
```

### Login Success
```
🔑 Login attempt: { email: 'user@example.com' }
✅ User found: { userId: '507f...' }
✅ Password valid
🍪 Login: Setting cookies with config: { secure: true, sameSite: 'none' }
```

### Auth Check
```
🔐 ========== AUTH GUARD ==========
Cookies: { hasAccessToken: true, hasRefreshToken: true }
✅ Token verified
   → User ID: 507f1f77bcf86cd799439011
   → Role: user
```

## Contact & Support

For persistent issues:
1. Collect server logs (AUTH GUARD sections)
2. Collect browser console output
3. Run `/api/debug/auth-status` and save output
4. Check `AUTH-401-TROUBLESHOOTING.md` for detailed guide
