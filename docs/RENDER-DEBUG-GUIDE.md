#  Authentication Debug Checklist

##  Changes Just Deployed

1. **Added pp.set('trust proxy', 1)** - Required for Render to properly detect client IPs
2. **Added debug logging** to track cookie setting and authentication flow
3. **Fixed merge conflicts** in CORS configuration

##  Critical: Verify Render Environment Variables

The debug logs will show what's happening, but first **MAKE SURE** these are set on Render:

### Required Environment Variables on Render Backend:

```
NODE_ENV=production
MONGO_URI=<your-actual-mongodb-connection-string>
JWT_SECRET=<generate-a-strong-random-32-char-string>
JWT_REFRESH_SECRET=<generate-different-32-char-string>
CLIENT_URL=https://aivors-1.onrender.com
CORS_ORIGINS=https://aivors-1.onrender.com,https://aivors-5hvj.onrender.com
STRIPE_SECRET_KEY=<your-stripe-key>
STRIPE_WEBHOOK_SECRET=<your-webhook-secret>
```

###  CRITICAL: Check NODE_ENV

If NODE_ENV is NOT set to production, cookies will use sameSite: 'lax' which **WILL NOT WORK** for cross-origin requests!

##  What to Check in Render Logs

After the new deployment, watch for these log messages:

### On Login/Signup:
```
 Setting cookies with config: {
  httpOnly: true,
  secure: true,
  sameSite: 'none',  // <-- Should be 'none' in production
  nodeEnv: 'production',  // <-- MUST be 'production'
  origin: 'https://aivors-1.onrender.com'
}
```

### On Dashboard Access:
```
 Auth Guard Debug: {
  hasAccessToken: false,  // <-- If false, cookies aren't being sent
  allCookies: [],  // <-- Should show ['access_token', 'refresh_token']
  origin: 'https://aivors-1.onrender.com',
}
```

##  Common Issues & Solutions

### Issue 1: sameSite: 'lax' in logs
**Cause**: NODE_ENV is not set to production  
**Fix**: Set NODE_ENV=production in Render environment variables

### Issue 2: hasAccessToken: false in logs
**Cause**: Cookies not being sent from browser  
**Possible reasons**:
- secure: false (HTTPS required for production)
- sameSite: 'lax' instead of 'none'
- CORS not allowing credentials
- Browser blocking third-party cookies

**Fix**:
1. Ensure NODE_ENV=production on Render
2. Verify both sites use HTTPS
3. Check browser console for cookie errors
4. Try in incognito/private mode

### Issue 3: CORS errors
**Cause**: Frontend URL not in CORS_ORIGINS  
**Fix**: Add exact frontend URL to CORS_ORIGINS:
```
CORS_ORIGINS=https://aivors-1.onrender.com,https://aivors-5hvj.onrender.com
```

### Issue 4: "Invalid or expired token"
**Cause**: Token signed with different secret  
**Fix**: Ensure JWT_SECRET is set and doesn't change between deployments

##  Step-by-Step Debug Process

1. **Check Render Environment Variables**
   - Go to Render Dashboard  Your Service  Environment
   - Verify ALL variables are set correctly
   - **Especially check NODE_ENV=production**

2. **Redeploy** (if you just set env vars)
   - Render  Manual Deploy  Deploy latest commit

3. **Test Login Flow**
   - Open frontend in browser
   - Open DevTools  Network tab
   - Try logging in
   - Check the login response headers for Set-Cookie

4. **Check Set-Cookie Header**
   Should look like:
   ```
   Set-Cookie: access_token=...; Path=/; HttpOnly; Secure; SameSite=None
   Set-Cookie: refresh_token=...; Path=/; HttpOnly; Secure; SameSite=None
   ```

5. **Check Browser Cookies**
   - DevTools  Application  Cookies
   - Look for ccess_token and efresh_token
   - If missing, browser is blocking them

6. **Check Render Logs**
   - Render Dashboard  Logs
   - Look for the emoji debug messages
   - They'll tell you exactly what's wrong

##  Quick Fixes

### If cookies show sameSite: 'lax':
```bash
# On Render, set:
NODE_ENV=production
```

### If CORS errors persist:
```bash
# On Render, update:
CORS_ORIGINS=https://your-exact-frontend-url.com,https://aivors-1.onrender.com
```

### If MongoDB connection fails:
```bash
# Verify MONGO_URI is correct
# Should look like: mongodb+srv://username:password@cluster.mongodb.net/dbname
```

### Generate Strong JWT Secrets:
```powershell
# PowerShell command:
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]})
```

##  Expected Behavior After Fix

 Render logs show 	rust proxy is set (no more warnings)
 Login response includes Set-Cookie headers with SameSite=None; Secure
 Browser stores cookies
 Dashboard requests include cookies automatically
 No 401 errors
 Debug logs show hasAccessToken: true

##  Next Steps

1. Wait for Render to deploy the latest changes (2-3 minutes)
2. Check Render logs for the new debug messages
3. Try logging in again
4. Share the debug log output if issues persist

The debug logs will tell us exactly what's wrong!
