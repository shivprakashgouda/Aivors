# 🚀 Quick Start Guide - Aivors Call Analytics Backend

Get your call analytics system running in 5 minutes!

## ✅ Prerequisites

- Node.js (v16+)
- MongoDB (local or Atlas)
- n8n instance running
- Retell AI account

## 📋 Step-by-Step Setup

### Step 1: Install Dependencies

```bash
cd server
npm install
```

Required packages (should already be in package.json):
- express
- mongoose
- cors
- dotenv

### Step 2: Configure Environment

Create `server/.env`:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/aivors

# Server Configuration
PORT=3001
NODE_ENV=development

# Optional: JWT Secret (if using auth)
JWT_SECRET=your_secret_key_here

# Optional: CORS
CLIENT_URL=http://localhost:8080
```

### Step 3: Start MongoDB

**Local MongoDB:**
```bash
mongod
```

**Or use MongoDB Atlas:**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/aivors
```

### Step 4: Start the Server

```bash
npm run dev
```

You should see:
```
✅ MongoDB Connected Successfully
🚀 Server running on http://localhost:3001
```

### Step 5: Test the API

```bash
# Test health endpoint
curl http://localhost:3001/api/health

# Expected response:
{
  "status": "ok",
  "message": "Server is running",
  "mongodb": "connected"
}
```

### Step 6: Run Test Suite

```bash
# In another terminal
node server/test-call-analytics.js
```

This will:
- ✅ Create test user
- ✅ Add 500 credits
- ✅ Process a test call
- ✅ Test duplicate prevention
- ✅ Test event filtering
- ✅ Update subscription
- ✅ Test low balance scenarios

### Step 7: Configure n8n Webhooks

#### Webhook 1: Retell AI Listener

1. Create new n8n workflow
2. Add **Webhook** node:
   - HTTP Method: `POST`
   - Path: `retell-webhook`
3. Add **Filter** node:
   - Condition: `{{$json.event_type}} === "call_analyze"`
4. Add **HTTP Request** node:
   - Method: `POST`
   - URL: `http://your-server:3001/api/calls/analyze`
   - Body: `{{$json}}` (forward entire payload)

#### Webhook 2: Subscription Updater

1. Create new n8n workflow
2. Add **Webhook** node:
   - HTTP Method: `POST`
   - Path: `subscription`
3. Add **HTTP Request** node:
   - Method: `POST`
   - URL: `http://your-server:3001/api/subscription/update`
   - Body:
   ```json
   {
     "userId": "{{$json.userId}}",
     "durationMinutes": "{{$json.durationMinutes}}"
   }
   ```
4. Add **IF** node to check response flags

### Step 8: Configure Retell AI

In Retell AI dashboard:
1. Go to Webhooks
2. Add webhook URL: `https://n8n.srv971061.hstgr.cloud/webhook/retell-webhook`
3. Enable events: `call_analyze`

---

## 🧪 Manual Testing

### 1. Add Credits

```bash
curl -X POST http://localhost:3001/api/subscription/add-credits \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "minutes": 500
  }'
```

### 2. Process a Call

```bash
curl -X POST http://localhost:3001/api/calls/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "call_analyze",
    "call_id": "call001",
    "user_id": "user123",
    "phone_number": "+1234567890",
    "duration_seconds": 180,
    "transcript": "Customer inquiry about pricing",
    "summary": "Discussed Pro plan features"
  }'
```

### 3. Check Subscription

```bash
curl http://localhost:3001/api/subscription/user123
```

### 4. Get Dashboard Stats

```bash
curl "http://localhost:3001/api/dashboard/stats?userId=user123"
```

---

## 📊 Understanding the Response

### Call Analyze Response

```json
{
  "success": true,
  "data": {
    "call": {
      "callId": "call001",
      "durationMinutes": 3,  // ← Rounded up from 180 seconds
      "durationSeconds": 180
    },
    "subscription": {
      "availableCredits": 497,  // ← 500 - 3
      "lowBalance": false,
      "stopWorkflow": false
    }
  }
}
```

### Subscription Update Response

```json
{
  "success": true,
  "data": {
    "subscription": {
      "totalCredits": 500,
      "usedCredits": 3,
      "availableCredits": 497
    },
    "lowBalance": false,     // ← TRUE if < 5 minutes
    "stopWorkflow": false,   // ← TRUE if <= 0 minutes
    "alerts": {
      "shouldDisableWorkflow": false,
      "message": "497 minutes remaining"
    }
  }
}
```

---

## 🚨 Common Issues & Solutions

### Issue: MongoDB Connection Failed

**Error:** `MongoDB Connection Failed: connect ECONNREFUSED`

**Solution:**
1. Start MongoDB: `mongod`
2. Or check MONGODB_URI in `.env`
3. For Atlas, whitelist your IP

### Issue: Port Already in Use

**Error:** `EADDRINUSE: address already in use :::3001`

**Solution:**
```bash
# Find process using port 3001
netstat -ano | findstr :3001

# Kill the process
taskkill /PID <process_id> /F

# Or use different port in .env
PORT=3002
```

### Issue: CORS Error

**Error:** `CORS not allowed for origin`

**Solution:**
Add your frontend URL to `.env`:
```env
CLIENT_URL=http://localhost:8080
CORS_ORIGINS=http://localhost:8080,http://localhost:5173
```

### Issue: Duplicate Calls Being Saved

**Solution:**
- Check that middleware is properly configured
- Verify `checkDuplicateCall` middleware is in route chain
- Check MongoDB for duplicate `call_id` values

---

## 📈 Next Steps

### 1. Production Deployment

Deploy to:
- **Render**: `render.yaml` ready
- **Railway**: One-click deploy
- **Heroku**: Use Procfile
- **DigitalOcean**: App Platform

### 2. Add Authentication

Protect endpoints with JWT:
```javascript
const { authGuard } = require('./middleware/authGuard');

router.get('/stats', authGuard, getDashboardStats);
```

### 3. Add Webhook Security

Validate n8n webhook signatures:
```javascript
const validateWebhook = (req, res, next) => {
  const signature = req.headers['x-n8n-signature'];
  // Verify signature
  next();
};
```

### 4. Monitor & Scale

- Set up logging (Winston)
- Add monitoring (DataDog, New Relic)
- Configure auto-scaling
- Set up backups for MongoDB

---

## 📚 Documentation

- **Complete API Guide**: `docs/CALL-ANALYTICS-API-GUIDE.md`
- **Architecture Diagram**: `docs/ARCHITECTURE-DIAGRAM.md`
- **n8n Configuration**: `docs/N8N-WEBHOOK-QUICK-REFERENCE.md`
- **Implementation Summary**: `docs/CALL-ANALYTICS-IMPLEMENTATION-SUMMARY.md`

---

## 🎯 Key Features Recap

✅ **Event Filtering**: Only processes `call_analyze` events  
✅ **Duplicate Prevention**: Won't charge twice for same call  
✅ **Credit Management**: Automatic minute deduction  
✅ **Low Balance Alerts**: Warning at < 5 minutes  
✅ **Workflow Control**: Auto-disable at 0 credits  
✅ **Dashboard Ready**: All stats endpoints available  

---

## 💬 Need Help?

Check the logs:
```bash
# Server logs show:
[TIMESTAMP] [CALL_ANALYZE_START] {...}
[TIMESTAMP] [CALL_SAVED] {...}
[TIMESTAMP] [CREDITS_DEDUCTED] {...}
```

Still stuck? Review:
1. MongoDB connection status
2. n8n webhook execution logs
3. Backend server console output
4. Test suite results

---

**🎉 You're all set! Your call analytics backend is ready to process Retell AI webhooks!**
