# 🎯 START HERE - Aivors Call Analytics Backend

## 📌 What Is This?

A complete backend system for processing AI call analytics from Retell AI with subscription credit management. Built specifically for the Aivors platform.

## ⚡ Quick Overview

```
Retell AI Call → n8n Webhooks → Your Backend → MongoDB → Dashboard
```

Your backend automatically:
- ✅ Processes call data from Retell AI
- ✅ Saves transcripts and summaries
- ✅ Deducts credits (minutes) from subscription
- ✅ Prevents duplicate charges
- ✅ Alerts on low balance (< 5 minutes)
- ✅ Stops workflow when credits reach 0
- ✅ Provides dashboard statistics

## 🚀 Get Started in 5 Minutes

### Option 1: Quick Start (Recommended)

```bash
# 1. Start MongoDB
mongod

# 2. Configure environment
cp server/.env.example server/.env
# Edit server/.env with your MongoDB URI

# 3. Start server
cd server
npm run dev

# 4. Run tests
node test-call-analytics.js
```

**📖 Full Instructions**: See [`docs/QUICK-START-CALL-ANALYTICS.md`](./docs/QUICK-START-CALL-ANALYTICS.md)

### Option 2: Read Documentation First

1. **Architecture** → [`docs/ARCHITECTURE-DIAGRAM.md`](./docs/ARCHITECTURE-DIAGRAM.md)
2. **API Guide** → [`docs/CALL-ANALYTICS-API-GUIDE.md`](./docs/CALL-ANALYTICS-API-GUIDE.md)
3. **Setup** → [`docs/QUICK-START-CALL-ANALYTICS.md`](./docs/QUICK-START-CALL-ANALYTICS.md)

## 📂 What Was Built?

### Backend Components

**Models (MongoDB)**:
- `User.js` - User accounts (updated with userId)
- `Subscription.js` - Credit management (NEW)
- `Call.js` - Call analytics storage (NEW)

**Controllers**:
- `callController.js` - Process calls from Retell AI
- `subscriptionController.js` - Manage credits
- `dashboardController.js` - Dashboard statistics

**Routes (API)**:
- `/api/calls/*` - Call analytics endpoints
- `/api/subscription/*` - Credit management
- `/api/dashboard/*` - Dashboard stats

**Middleware**:
- `validateEventType.js` - Filter only "call_analyze" events
- `checkDuplicateCall.js` - Prevent duplicate processing

**Utilities**:
- `helpers.js` - Helper functions (duration conversion, validation, etc.)

### Documentation

- 📖 **API Guide** - Complete endpoint documentation
- 🏗️ **Architecture** - System flow diagrams
- 🔧 **n8n Setup** - Webhook configuration
- 📋 **Implementation Summary** - What was built
- 🚀 **Quick Start** - 5-minute setup guide
- 📁 **File List** - All files created

## 🔌 API Endpoints

### Call Analytics
```bash
POST   /api/calls/analyze        # Process Retell AI call
GET    /api/calls/:callId        # Get call details
GET    /api/calls/user/:userId   # Get user's calls
GET    /api/calls/stats/:userId  # Get statistics
```

### Subscription
```bash
POST   /api/subscription/update          # Deduct credits
GET    /api/subscription/:userId         # Get subscription
POST   /api/subscription/add-credits     # Add credits
PUT    /api/subscription/:userId/status  # Update status
```

### Dashboard
```bash
GET    /api/dashboard/stats?userId=xxx                  # Main stats
GET    /api/dashboard/recent-activity/:userId          # Activity feed
GET    /api/dashboard/analytics/:userId?period=week    # Chart data
```

## 🔄 How It Works

### The Flow

1. **Retell AI** completes a call and sends 3 webhook events
2. **n8n Webhook #1** receives events and filters for `call_analyze` only
3. **Your Backend** receives the call data and:
   - Checks if it's a duplicate (prevents double-charging)
   - Saves call to MongoDB (transcript, summary, duration)
   - Returns subscription status
4. **n8n Webhook #2** receives duration and:
   - Calls backend to deduct credits
   - Checks response flags
5. **n8n Actions**:
   - If `stopWorkflow: true` → Disable workflow (no credits)
   - If `lowBalance: true` → Send notification (< 5 minutes)

### Visual Flow

```
Retell AI (3 events)
    ↓
n8n Filter (only call_analyze)
    ↓
POST /api/calls/analyze
    ↓
Save to MongoDB + Check duplicates
    ↓
POST /api/subscription/update
    ↓
Deduct credits + Check balance
    ↓
Return flags (lowBalance, stopWorkflow)
    ↓
n8n takes action based on flags
```

**📊 See full diagram**: [`docs/ARCHITECTURE-DIAGRAM.md`](./docs/ARCHITECTURE-DIAGRAM.md)

## 🧪 Testing

### Run Test Suite

```bash
node server/test-call-analytics.js
```

Tests include:
- ✅ Add credits
- ✅ Process call
- ✅ Event filtering
- ✅ Duplicate prevention
- ✅ Credit deduction
- ✅ Low balance alerts
- ✅ Workflow stop flag
- ✅ Dashboard stats

### Manual Testing

```bash
# 1. Add credits
curl -X POST http://localhost:3001/api/subscription/add-credits \
  -H "Content-Type: application/json" \
  -d '{"userId":"user123","minutes":500}'

# 2. Process a call
curl -X POST http://localhost:3001/api/calls/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "event_type":"call_analyze",
    "call_id":"call001",
    "user_id":"user123",
    "phone_number":"+1234567890",
    "duration_seconds":180,
    "transcript":"Test transcript",
    "summary":"Test summary"
  }'

# 3. Check dashboard
curl "http://localhost:3001/api/dashboard/stats?userId=user123"
```

## 🔧 n8n Configuration

### Webhook 1: Call Processor

**URL**: `https://n8n.srv971061.hstgr.cloud/webhook/retell-webhook`

1. **Webhook Node** - Receive Retell AI events
2. **Filter Node** - Check `event_type === "call_analyze"`
3. **HTTP Request** - POST to `/api/calls/analyze`

### Webhook 2: Credit Manager

**URL**: `https://n8n.srv971061.hstgr.cloud/webhook/subscription`

1. **Webhook Node** - Receive trigger
2. **HTTP Request** - POST to `/api/subscription/update`
3. **IF Node** - Check `stopWorkflow` flag
4. **Action** - Disable workflow or send alert

**📖 Full Configuration**: [`docs/N8N-WEBHOOK-QUICK-REFERENCE.md`](./docs/N8N-WEBHOOK-QUICK-REFERENCE.md)

## 📚 Documentation Index

| Document | Purpose | When to Read |
|----------|---------|--------------|
| [`QUICK-START-CALL-ANALYTICS.md`](./docs/QUICK-START-CALL-ANALYTICS.md) | 5-minute setup | **Start here** |
| [`CALL-ANALYTICS-API-GUIDE.md`](./docs/CALL-ANALYTICS-API-GUIDE.md) | Complete API docs | Building frontend |
| [`ARCHITECTURE-DIAGRAM.md`](./docs/ARCHITECTURE-DIAGRAM.md) | System flow | Understanding system |
| [`N8N-WEBHOOK-QUICK-REFERENCE.md`](./docs/N8N-WEBHOOK-QUICK-REFERENCE.md) | n8n setup | Configuring webhooks |
| [`CALL-ANALYTICS-IMPLEMENTATION-SUMMARY.md`](./docs/CALL-ANALYTICS-IMPLEMENTATION-SUMMARY.md) | What was built | Review implementation |
| [`FILE-LIST-CALL-ANALYTICS.md`](./docs/FILE-LIST-CALL-ANALYTICS.md) | All files created | Finding specific code |

## ⚠️ Important Notes

### Event Filtering
- Retell AI sends **3 events per call**: `call_started`, `call_ended`, `call_analyze`
- We **only process** `call_analyze` (contains transcript & summary)
- Middleware automatically filters and skips other events

### Duplicate Prevention
- Backend checks `call_id` before processing
- If duplicate, returns success (doesn't save again)
- Prevents double-charging the same call

### Credit Management
- Duration converted: `seconds → minutes (rounded up)`
- Credits calculated: `availableCredits = totalCredits - usedCredits`
- Low balance: `< 5 minutes` → Send notification
- Stop workflow: `≤ 0 minutes` → Disable n8n workflow

### Response Flags

Every subscription update returns:
```json
{
  "lowBalance": false,      // TRUE if < 5 minutes
  "stopWorkflow": false,    // TRUE if <= 0 minutes
  "creditsRemaining": 497
}
```

**n8n should check these flags and take action!**

## 🐛 Troubleshooting

### Server won't start
- Check if MongoDB is running: `mongod`
- Check if port 3001 is available
- Verify `.env` file exists and is configured

### Calls not being saved
- Check n8n webhook execution logs
- Verify `event_type === "call_analyze"`
- Check backend logs for errors
- Test endpoint directly with curl

### Credits not deducting
- Verify `userId` matches between calls
- Check subscription exists in database
- Review backend logs for errors
- Test `/api/subscription/update` directly

### Duplicate calls being saved
- Verify `checkDuplicateCall` middleware is active
- Check MongoDB for duplicate `call_id` values
- Review route configuration

**📖 More solutions**: [`docs/QUICK-START-CALL-ANALYTICS.md`](./docs/QUICK-START-CALL-ANALYTICS.md)

## 🚀 Next Steps

1. **Setup & Test**: Follow quick start guide
2. **Configure n8n**: Set up webhooks
3. **Connect Retell AI**: Add webhook URL
4. **Test End-to-End**: Make test call through Retell AI
5. **Build Frontend**: Connect dashboard to API
6. **Deploy**: Use Render, Railway, or Heroku

## 📞 Support

- **Documentation**: All docs in [`docs/`](./docs/) folder
- **Test Suite**: Run `node server/test-call-analytics.js`
- **Logs**: Check server console for detailed debug info
- **Issues**: Review troubleshooting section above

## ✨ Features

✅ **Complete Backend** - All endpoints ready  
✅ **MongoDB Integration** - Persistent storage  
✅ **Event Filtering** - Only call_analyze processed  
✅ **Duplicate Prevention** - No double charging  
✅ **Credit Management** - Automatic deduction  
✅ **Balance Alerts** - Low balance warnings  
✅ **Workflow Control** - Auto-disable at 0 credits  
✅ **Dashboard Ready** - All stats available  
✅ **Well Documented** - Extensive guides  
✅ **Production Ready** - Error handling & logging  

## 🎉 You're Ready!

Your Aivors call analytics backend is **complete and production-ready**!

**Next**: Open [`docs/QUICK-START-CALL-ANALYTICS.md`](./docs/QUICK-START-CALL-ANALYTICS.md) and get it running in 5 minutes.

---

**Built with ❤️ for Aivors Platform**
