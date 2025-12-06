# Authentication Fix - Deployment Checklist

## Pre-Deployment Verification

### Local Testing
- [ ] Server starts without errors
- [ ] Environment validation passes
- [ ] Can complete signup flow
- [ ] Can verify email with OTP
- [ ] Can login successfully
- [ ] Can access /api/auth/me
- [ ] Cookies are set (check DevTools)
- [ ] Can access dashboard
- [ ] Automatic token refresh works
- [ ] Server logs show detailed auth info

### Code Review
- [ ] All files compile without errors
- [ ] No console.error in production code
- [ ] TypeScript types are correct
- [ ] No sensitive data in logs
- [ ] Error messages are user-friendly

## Staging Deployment

### Backend Deployment
```bash
# 1. Update environment variables in staging
NODE_ENV=production
MONGO_URI=<staging_mongodb>
JWT_SECRET=<strong_secret>
JWT_REFRESH_SECRET=<different_strong_secret>
CLIENT_URL=<staging_frontend_url>
CORS_ORIGINS=<staging_frontend_url>

# 2. Deploy backend
git push staging main

# 3. Verify deployment
curl https://staging-api.com/api/health
# Should return: { status: 'ok', environment: 'production' }

# 4. Check server logs
# Look for: ✅ All environment variables configured correctly!

# 5. Test debug endpoint
curl https://staging-api.com/api/debug/auth-status
# Should show all configuration details
```

### Frontend Deployment
```bash
# 1. Update .env for staging
VITE_API_URL=<staging_backend_url>

# 2. Build frontend
npm run build

# 3. Deploy frontend
# (Platform specific)

# 4. Verify API connection
# Open browser console, should see:
# 🌐 API Configuration: { baseURL: '<staging_backend_url>' }
```

### Staging Tests
- [ ] Can access staging frontend
- [ ] Can signup new user
- [ ] OTP email arrives
- [ ] Can verify email
- [ ] Can login
- [ ] Dashboard loads correctly
- [ ] /api/auth/me returns user data
- [ ] Cookies persist across refreshes
- [ ] Automatic token refresh works
- [ ] No CORS errors in console
- [ ] Server logs show successful auth

## Production Deployment

### Pre-Production Checklist
- [ ] All staging tests passed
- [ ] Backup current production database
- [ ] Prepare rollback plan
- [ ] Notify team of deployment
- [ ] Have monitoring ready

### Backend Production Deployment
```bash
# 1. Verify production environment variables
# Critical - MUST be set:
NODE_ENV=production
MONGO_URI=<production_mongodb>
JWT_SECRET=<strong_unique_secret>  # NOT placeholder!
JWT_REFRESH_SECRET=<different_strong_secret>
CLIENT_URL=<production_frontend_https_url>
CORS_ORIGINS=<production_frontend_https_url>

# Optional but recommended:
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
PORT=3001

# 2. Deploy backend
git push production main

# 3. Immediate verification
curl https://api.aivors.com/api/health
# Must return 200 OK with:
# { 
#   status: 'ok',
#   environment: 'production',
#   mongodb: 'connected'
# }

# 4. Check environment validation in logs
# Must see: ✅ All environment variables configured correctly!
# If not, rollback immediately

# 5. Test debug endpoint
curl https://api.aivors.com/api/debug/auth-status
# Verify all settings are correct
```

### Frontend Production Deployment
```bash
# 1. Update .env.production
VITE_API_URL=https://api.aivors.com  # Must be HTTPS!

# 2. Build production bundle
npm run build

# 3. Verify build includes correct API URL
grep -r "api.aivors.com" dist/

# 4. Deploy frontend
# (Platform specific - Vercel, Netlify, etc.)

# 5. Clear CDN cache if applicable
```

### Post-Deployment Verification (within 5 minutes)
- [ ] Frontend loads at https://aivors.com
- [ ] /api/health returns 200 OK
- [ ] Can create new account
- [ ] OTP email is received
- [ ] Can verify email and login
- [ ] Dashboard loads successfully
- [ ] No 401 errors in browser console
- [ ] Server logs show AUTH SUCCESS messages
- [ ] Cookies are set with correct attributes:
  - [ ] Secure: true
  - [ ] HttpOnly: true
  - [ ] SameSite: none
  - [ ] Path: /
  - [ ] Domain: (matches frontend)

### Production Monitoring (first hour)
```bash
# Monitor server logs
# Look for patterns:

# Good:
✅ AUTH SUCCESS: Token verified
🍪 Login: Setting cookies with config
✅ Token refreshed successfully

# Bad (investigate):
❌ AUTH FAILED: No token found in cookies
🌍 CORS Check - Origin: ... ❌ BLOCKED
❌ Environment validation failed

# Monitor these metrics:
- 401 error rate (should be low)
- Login success rate (should be high)
- Automatic refresh success rate (should be >95%)
```

## Rollback Procedure

### If Critical Issues Detected
```bash
# 1. Rollback backend
git revert HEAD
git push production main

# 2. Rollback frontend if necessary
# (Platform specific)

# 3. Verify rollback
curl https://api.aivors.com/api/health

# 4. Notify team
# Post in #incidents channel

# 5. Investigate offline
# Review logs, test in staging
```

### Rollback Triggers
Rollback if any of these occur within first hour:
- [ ] 401 error rate >10%
- [ ] Login success rate <95%
- [ ] User reports "stuck" at login
- [ ] Server logs show environment validation failures
- [ ] CORS errors affecting users
- [ ] Cookies not being set

## Success Metrics (24 hours)

### Quantitative
- [ ] 401 error rate reduced by >90% vs pre-fix
- [ ] Login success rate >99%
- [ ] Automatic token refresh success rate >95%
- [ ] Zero user reports of "stuck" login
- [ ] Cookie set rate 100% on successful login

### Qualitative
- [ ] Server logs clearly show auth flow
- [ ] Any 401 errors have clear cause in logs
- [ ] Support team can use debug endpoint
- [ ] Troubleshooting guide is helpful

## Post-Deployment Tasks

### Week 1
- [ ] Monitor auth metrics daily
- [ ] Review server logs for patterns
- [ ] Gather user feedback
- [ ] Document any edge cases found
- [ ] Update troubleshooting guide if needed

### Week 2
- [ ] Analyze automatic refresh usage
- [ ] Check for any persistent issues
- [ ] Optimize logging if too verbose
- [ ] Consider adding metrics dashboard

## Communication Plan

### Before Deployment
**To Engineering Team**:
```
🚀 Deploying auth fixes to production [DATE] at [TIME]
Changes:
- Enhanced auth logging
- Automatic token refresh
- Environment validation
- Cookie configuration improvements

Expected impact: Reduced 401 errors, better debugging
Risk: Low (backward compatible)
Rollback: Available if needed
Monitor: Server logs, 401 error rate
```

### After Deployment (Success)
**To Engineering Team**:
```
✅ Auth fix deployed successfully
Status: All tests passing
Monitoring: Active for 24 hours
Metrics: 401 errors down X%
Known issues: None
```

### After Deployment (Issues)
**To Engineering Team**:
```
⚠️  Auth fix deployed - monitoring issues
Status: [Describe issue]
Impact: [User impact]
Action: [Investigating/Rollback planned]
ETA: [Time for resolution]
```

## Contact & Escalation

### Issue Categories

**P0 - Critical** (Rollback immediately):
- Users cannot login
- Existing sessions all broken
- Server won't start

**P1 - High** (Fix within 1 hour):
- Intermittent 401 errors still occurring
- Some users affected
- Logs not showing expected info

**P2 - Medium** (Fix within 24 hours):
- Minor logging issues
- Documentation updates needed
- Non-critical warnings

## Resources

- **Troubleshooting Guide**: `AUTH-401-TROUBLESHOOTING.md`
- **Quick Reference**: `AUTH-QUICK-REFERENCE.md`
- **Implementation Summary**: `AUTH-FIX-SUMMARY.md`
- **Debug Endpoint**: `GET /api/debug/auth-status`
- **Health Check**: `GET /api/health`

## Sign-Off

Deployer: _________________ Date: _____________

Reviewer: _________________ Date: _____________

Production verification complete: ☐ Yes ☐ No

Notes:
_________________________________________________
_________________________________________________
_________________________________________________
