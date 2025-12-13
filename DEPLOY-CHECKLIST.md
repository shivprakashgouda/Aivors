# 🚀 Quick Deployment Checklist

## Before Deployment

### 1. Test Locally ✅
```bash
cd server
npm start
node test-retell-webhook.js
```

### 2. Setup MongoDB ✅
```bash
cd server
npm run setup-db
```

This will:
- Connect to MongoDB
- Create required indexes
- Verify structure
- Check phone numbers

### 3. Verify Environment Variables ✅

**Required in `.env` (local) or Render Environment:**
```bash
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret
CLIENT_URL=https://your-frontend.com
```

---

## Deploy to Render

### Backend Deployment

1. **Push code to GitHub:**
```bash
git add .
git commit -m "Add Retell webhook and call analytics"
git push origin main
```

2. **Render will auto-deploy** when you push to GitHub

3. **Check logs for:**
```
✅ MongoDB Connected
🔨 Ensuring MongoDB indexes...
✅ Call indexes synchronized
🚀 Server running on port 3001
```

### Frontend Deployment

Frontend auto-deploys when you push. No changes needed.

---

## Configure Retell AI

### Option 1: Direct Webhook

1. Go to **Retell AI Dashboard** → Settings → Webhooks
2. Add webhook URL:
   ```
   https://your-backend.onrender.com/webhook/retell
   ```
3. Select events: **call_completed**
4. Save

### Option 2: Via n8n

1. In n8n workflow, add **HTTP Request** node
2. Set URL: `https://your-backend.onrender.com/webhook/retell`
3. Method: `POST`
4. Body: `{{ $json }}`
5. Activate workflow

---

## Test Production

### 1. Test Webhook Endpoint
```bash
curl -X POST https://your-backend.onrender.com/webhook/retell \
  -H "Content-Type: application/json" \
  -d '{
    "callId": "prod_test_123",
    "phoneNumber": "+14095551234",
    "transcript": "Production test",
    "summary": "Testing",
    "durationSeconds": 30
  }'
```

Expected:
```json
{"success":true,"message":"Call data saved successfully"}
```

### 2. Test Frontend

1. Login to app: `https://your-frontend.com`
2. Navigate to: `/my-calls`
3. Should see call history table

---

## MongoDB Atlas Setup

### 1. Network Access
- Go to **Network Access** → Add IP Address
- Add: `0.0.0.0/0` (allow all) for Render

### 2. Database User
- Role: **readWrite**
- Database: your database name

### 3. Get Connection String
```
mongodb+srv://<user>:<pass>@cluster.mongodb.net/<db>?retryWrites=true&w=majority
```

---

## Verify Everything Works

### ✅ Backend Health
```bash
curl https://your-backend.onrender.com/api/health
```

### ✅ Webhook Working
```bash
curl -X POST https://your-backend.onrender.com/webhook/retell \
  -H "Content-Type: application/json" \
  -d '{"callId":"test","phoneNumber":"+14095551234","summary":"Test"}'
```

### ✅ MongoDB Indexes
```bash
cd server
npm run setup-db
```

### ✅ Frontend Dashboard
- Login → Go to `/my-calls`
- Should see table with calls

---

## Common Issues

### "No user found for phone"
**Fix:** Add phone to user:
```javascript
db.users.updateOne(
  { email: "user@example.com" },
  { $set: { "business.phoneNumber": "+14095551234" } }
)
```

### "Network timeout"
**Fix:** Add `0.0.0.0/0` to MongoDB Atlas Network Access

### "Cannot connect to MongoDB"
**Fix:** Check `MONGODB_URI` in Render environment variables

---

## Post-Deployment

### 1. Make a Test Call
- Use Retell AI to make a test call
- Check MongoDB for new record:
```javascript
db.calls.findOne().sort({createdAt:-1})
```

### 2. Check Frontend
- Login and view `/my-calls`
- Verify call appears in table

### 3. Monitor Logs
Watch Render logs for:
```
✅ [RETELL WEBHOOK] Call saved to MongoDB
✅ [RETELL WEBHOOK] User found: user@example.com
```

---

## Scripts Reference

```bash
# Start server
npm start

# Setup MongoDB indexes
npm run setup-db

# Test webhook locally
npm run test-webhook

# Development mode
npm run dev
```

---

## Files Created

- ✅ `server/routes/retellWebhook.js` - Webhook endpoint
- ✅ `server/routes/myCalls.js` - API endpoint
- ✅ `server/models/Call.js` - MongoDB schema
- ✅ `server/setup-mongodb.js` - Database setup script
- ✅ `server/test-retell-webhook.js` - Test script
- ✅ `src/pages/MyCallsPage.tsx` - Frontend component
- ✅ `docs/MONGODB-DEPLOYMENT-GUIDE.md` - Full guide
- ✅ `RETELL-WEBHOOK-SETUP.md` - Implementation docs

---

## Support

**Questions?**
- Email: info@restaurant-ai.com
- Phone: (409) 960-2907

---

**Status**: ✅ Ready to Deploy!  
**Time to Deploy**: ~5 minutes  
**Next Step**: Push to GitHub and Render will auto-deploy
