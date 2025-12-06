# Aivors Backend - Call Analytics API

Complete backend for AI call-analytics platform with Retell AI webhook integration and subscription credit management.

## 🎯 Overview

This backend provides:
- **Call Analytics**: Process and store call data from Retell AI
- **Credit Management**: Track and deduct subscription minutes
- **Dashboard Stats**: Comprehensive analytics for the dashboard
- **MongoDB Integration**: All data stored in MongoDB

## 📦 Technology Stack

- **Node.js + Express**: REST API server
- **MongoDB + Mongoose**: Database and ODM
- **JWT**: Authentication (optional)
- **n8n Integration**: Webhook handling

## 🗂️ Project Structure

```
server/
├── models/
│   ├── User.js              # User model (updated with userId)
│   ├── Subscription.js      # Subscription & credits model
│   ├── Call.js              # Call analytics model
│   └── index.js             # Models export
│
├── controllers/
│   ├── callController.js          # Call analytics logic
│   ├── subscriptionController.js  # Credit management logic
│   └── dashboardController.js     # Dashboard statistics
│
├── routes/
│   ├── callRoutes.js          # /api/calls endpoints
│   ├── subscriptionRoutes.js  # /api/subscription endpoints
│   ├── dashboardRoutes.js     # /api/dashboard endpoints
│   └── index.js               # Routes export
│
├── middleware/
│   ├── validateEventType.js    # Only process "call_analyze" events
│   └── checkDuplicateCall.js   # Prevent duplicate call processing
│
├── utils/
│   └── helpers.js             # Helper functions
│
├── config/
│   └── database.js            # MongoDB connection
│
└── index.js                   # Main server file
```

## 🔌 API Endpoints

### 1. Call Analytics

#### POST /api/calls/analyze
Process call_analyze event from Retell AI (via n8n webhook).

**Request:**
```json
{
  "event_type": "call_analyze",
  "call_id": "call_123456",
  "user_id": "user_abc",
  "phone_number": "+1234567890",
  "duration_seconds": 180,
  "transcript": "Full conversation transcript...",
  "summary": "Call summary..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Call analyzed and saved successfully",
  "data": {
    "call": {
      "callId": "call_123456",
      "userId": "user_abc",
      "phoneNumber": "+1234567890",
      "durationMinutes": 3,
      "durationSeconds": 180
    },
    "subscription": {
      "availableCredits": 497,
      "totalCredits": 500,
      "usedCredits": 3,
      "lowBalance": false,
      "stopWorkflow": false
    }
  }
}
```

#### GET /api/calls/:callId
Get details of a specific call.

#### GET /api/calls/user/:userId
Get all calls for a user (paginated).

#### GET /api/calls/stats/:userId
Get call statistics for a user.

### 2. Subscription Management

#### POST /api/subscription/update
Update subscription credits after a call (called by n8n).

**Request:**
```json
{
  "userId": "user_abc",
  "durationMinutes": 3
}
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription updated successfully",
  "data": {
    "userId": "user_abc",
    "subscription": {
      "totalCredits": 500,
      "usedCredits": 3,
      "availableCredits": 497,
      "status": "active"
    },
    "deductedMinutes": 3,
    "lowBalance": false,
    "stopWorkflow": false,
    "alerts": {
      "shouldDisableWorkflow": false,
      "shouldNotifyLowBalance": false,
      "message": "Subscription updated. 497 minutes remaining"
    }
  }
}
```

#### GET /api/subscription/:userId
Get subscription details.

#### POST /api/subscription/add-credits
Add credits to a subscription.

**Request:**
```json
{
  "userId": "user_abc",
  "minutes": 500
}
```

#### PUT /api/subscription/:userId/status
Update subscription status (active, inactive, suspended, cancelled).

### 3. Dashboard Statistics

#### GET /api/dashboard/stats?userId=xxx
Get comprehensive dashboard statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "callAnalytics": {
      "totalCalls": 45,
      "callsToday": 5,
      "callsYesterday": 3,
      "callsChangePercent": 66.67,
      "totalMinutesUsed": 123,
      "averageDuration": 2.73
    },
    "subscription": {
      "totalCredits": 500,
      "usedCredits": 123,
      "availableCredits": 377,
      "planName": "Pro",
      "status": "active",
      "lowBalance": false,
      "stopWorkflow": false
    },
    "recentCalls": [
      {
        "callId": "call_123",
        "phoneNumber": "+1234567890",
        "durationMinutes": 3,
        "transcriptPreview": "Hello, this is...",
        "createdAt": "2025-12-06T10:30:00Z",
        "timeAgo": "2 hours ago"
      }
    ]
  }
}
```

#### GET /api/dashboard/recent-activity/:userId
Get recent activity feed.

#### GET /api/dashboard/analytics/:userId?period=week
Get analytics data for charts (week, month, year).

## 🚀 Setup Instructions

### 1. Environment Variables

Create `server/.env`:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/aivors
# or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/aivors

# Server
PORT=3001
NODE_ENV=development

# JWT (if using authentication)
JWT_SECRET=your_jwt_secret_key_here

# CORS
CLIENT_URL=http://localhost:8080
```

### 2. Install Dependencies

```bash
cd server
npm install
```

### 3. Start MongoDB

Local MongoDB:
```bash
mongod
```

Or use MongoDB Atlas (cloud).

### 4. Start Server

```bash
npm run dev
```

Server will start on `http://localhost:3001`

## 🔧 n8n Webhook Configuration

### Webhook 1: Retell AI Call Analyze

**URL:** `https://n8n.srv971061.hstgr.cloud/webhook/retell-webhook`

**n8n Workflow:**
1. Receive Retell AI webhook
2. Filter: `event_type === "call_analyze"`
3. HTTP Request to: `POST http://your-server:3001/api/calls/analyze`
4. Body: Forward entire Retell AI payload

### Webhook 2: Subscription Update

**URL:** `https://n8n.srv971061.hstgr.cloud/webhook/subscription`

**n8n Workflow:**
1. Receive trigger from webhook 1
2. HTTP Request to: `POST http://your-server:3001/api/subscription/update`
3. Body:
```json
{
  "userId": "{{$json.userId}}",
  "durationMinutes": "{{$json.call.durationMinutes}}"
}
```
4. Check response flags:
   - If `stopWorkflow: true` → Disable n8n workflow
   - If `lowBalance: true` → Send notification

## 📊 Database Models

### User
```javascript
{
  userId: String (unique, indexed),
  name: String,
  email: String (unique),
  // ... existing fields
}
```

### Subscription
```javascript
{
  userId: String (unique, ref: User),
  totalCredits: Number,
  usedCredits: Number,
  availableCredits: Number (virtual),
  planName: String,
  planType: String (free, basic, pro, enterprise),
  status: String (active, inactive, suspended, cancelled)
}
```

### Call
```javascript
{
  callId: String (unique),
  userId: String (ref: User),
  phoneNumber: String,
  durationSeconds: Number,
  durationMinutes: Number,
  transcript: String,
  summary: String,
  metadata: Object,
  status: String (completed, failed, processing)
}
```

## 🛡️ Features

### Duplicate Prevention
- Middleware checks `call_id` before processing
- Prevents double-charging for the same call
- Returns success if already processed

### Event Type Filtering
- Only processes `event_type === "call_analyze"`
- Ignores other Retell AI events
- Logs skipped events

### Credit Management
- Automatic conversion: seconds → minutes (rounded up)
- Virtual field: `availableCredits = totalCredits - usedCredits`
- Low balance detection (< 5 minutes)
- Workflow stop flag (≤ 0 minutes)

### Error Handling
- Comprehensive try-catch blocks
- Detailed error messages
- Status codes for different scenarios
- Logging for debugging

## 🧪 Testing

### Test Call Analyze
```bash
curl -X POST http://localhost:3001/api/calls/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "call_analyze",
    "call_id": "test_call_001",
    "user_id": "test_user_123",
    "phone_number": "+1234567890",
    "duration_seconds": 180,
    "transcript": "Test transcript",
    "summary": "Test summary"
  }'
```

### Test Subscription Update
```bash
curl -X POST http://localhost:3001/api/subscription/update \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user_123",
    "durationMinutes": 3
  }'
```

### Test Dashboard Stats
```bash
curl http://localhost:3001/api/dashboard/stats?userId=test_user_123
```

## 📝 Logging

All important events are logged:
- `CALL_ANALYZE_START`: Incoming call data
- `CALL_SAVED`: Call saved to database
- `SUBSCRIPTION_UPDATE_START`: Credit deduction started
- `CREDITS_DEDUCTED`: Minutes deducted
- `SUBSCRIPTION_CREATED`: New subscription created

## 🔐 Security Notes

- Add JWT authentication to protect endpoints
- Validate n8n webhook signatures
- Use environment variables for secrets
- Enable CORS only for trusted origins
- Add rate limiting for production

## 📚 Next Steps

1. **Add Authentication**: Protect endpoints with JWT
2. **Add Webhook Signature Validation**: Verify n8n requests
3. **Add Rate Limiting**: Prevent abuse
4. **Add Unit Tests**: Test controllers and models
5. **Add Logging**: Use Winston or Morgan
6. **Deploy**: Use Render, Railway, or Heroku

## 🤝 Integration Flow

```
Retell AI Call Completed
         ↓
n8n Webhook (retell-webhook)
         ↓
Filter: event_type === "call_analyze"
         ↓
POST /api/calls/analyze
         ↓
Save call to MongoDB
         ↓
Return call + subscription data
         ↓
n8n Webhook (subscription)
         ↓
POST /api/subscription/update
         ↓
Deduct credits from subscription
         ↓
Return flags (lowBalance, stopWorkflow)
         ↓
n8n: Check flags and take action
```

## 📞 Support

For issues or questions:
1. Check logs in console
2. Verify MongoDB connection
3. Test endpoints with curl/Postman
4. Check n8n workflow execution logs

---

**Built with ❤️ for Aivors Platform**
