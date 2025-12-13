# 🎯 Retell AI Call Analytics - MongoDB Integration

## 📋 Overview

Production-ready call analytics system that receives Retell AI call data (directly or via n8n), resolves users by phone number, and stores everything in MongoDB with **email as the primary user identifier**.

---

## 🏗️ Architecture

```
Retell AI → Webhook → Phone-to-Email Resolution → MongoDB → Frontend API → React Dashboard
```

### Data Flow

1. **Retell AI** sends call data (directly or via n8n HTTP Request node)
2. **Webhook** (`POST /webhook/retell`) receives payload
3. **Resolution** finds user email from phoneNumber in MongoDB
4. **Storage** saves call to `calls` collection with email as identifier
5. **API** (`GET /api/my-calls`) fetches calls for authenticated user
6. **Frontend** displays calls in React table with details modal

---

## 📂 Files Created/Modified

### Backend Files

1. **`server/models/Call.js`** - MongoDB schema with email as primary identifier
2. **`server/routes/retellWebhook.js`** - Webhook endpoint with phone-to-email resolution
3. **`server/routes/myCalls.js`** - Authenticated API to fetch user calls
4. **`server/index.js`** - Route mounting and CSRF exclusion
5. **`server/test-retell-webhook.js`** - Testing script

### Frontend Files

6. **`src/pages/MyCallsPage.tsx`** - React component with table and modal
7. **`src/App.tsx`** - Route configuration for /my-calls

---

## 🔧 MongoDB Schema

### Collection: `calls`

```javascript
{
  _id: ObjectId,
  callId: String (unique, indexed),
  email: String (required, indexed, PRIMARY IDENTIFIER),
  phoneNumber: String (required),
  summary: String,
  transcript: String,
  durationSeconds: Number,
  eventType: String (default: 'call_completed'),
  createdAt: Date (indexed),
  status: String ('completed', 'failed', 'processing')
}
```

**Indexes:**
- `callId` (unique) - Prevents duplicates
- `email` (non-unique) - Fast user queries
- `{ email: 1, createdAt: -1 }` - Compound index for sorted queries

---

## 🚀 API Endpoints

### 1. Webhook Endpoint (Public)

**POST** `/webhook/retell`

Receives call data from Retell AI (directly or via n8n).

**Supported Field Names** (accepts both camelCase and snake_case):
- `callId` or `call_id`
- `phoneNumber` or `phone_number`
- `durationSeconds` or `duration_seconds`
- `eventType` or `event_type`
- `transcript`
- `summary`

**Example Request:**
```json
{
  "callId": "retell_call_abc123",
  "phoneNumber": "+14095551234",
  "transcript": "Hello, I need help with...",
  "summary": "Customer inquiry about pricing",
  "durationSeconds": 125,
  "eventType": "call_completed"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Call data saved successfully",
  "callId": "retell_call_abc123",
  "email": "user@example.com"
}
```

**Features:**
- ✅ **Idempotency**: Ignores duplicate `callId`
- ✅ **Phone Resolution**: Tries exact match, normalized, last 10 digits
- ✅ **Safe Errors**: Returns 200 even on errors to prevent retry storms
- ✅ **Flexible Format**: Accepts both camelCase and snake_case

---

### 2. My Calls API (Authenticated)

**GET** `/api/my-calls`

Returns calls for logged-in user (filtered by email).

**Authentication:** Required (JWT token in cookie)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "675b...",
      "callId": "retell_call_abc123",
      "phoneNumber": "+14095551234",
      "summary": "Customer inquiry",
      "transcript": "Full conversation...",
      "durationSeconds": 125,
      "createdAt": "2025-12-13T10:30:00.000Z",
      "eventType": "call_completed"
    }
  ],
  "count": 1,
  "email": "user@example.com"
}
```

---

## 🎨 Frontend Component

### Route: `/my-calls`

**Features:**
- ✅ Stats cards (Total calls, Total duration, Recent calls)
- ✅ Sortable table (latest first)
- ✅ Click to view full transcript/summary
- ✅ Refresh button
- ✅ Responsive design
- ✅ Empty state handling

**Fields Displayed:**
- Call Date
- Phone Number
- Duration (formatted as "2m 5s")
- Summary
- Transcript (in modal)

---

## 🧪 Testing

### 1. Test Webhook Endpoint

```bash
cd server
node test-retell-webhook.js
```

This sends 4 test payloads:
1. CamelCase format (from Retell directly)
2. Snake_case format (from n8n)
3. Duplicate call (should be ignored)
4. Unknown phone (should be skipped)

### 2. Manual Test with cURL

```bash
# Send test call
curl -X POST http://localhost:3001/webhook/retell \
  -H "Content-Type: application/json" \
  -d '{
    "callId": "test_123",
    "phoneNumber": "+14095551234",
    "transcript": "Test call",
    "summary": "Test summary",
    "durationSeconds": 60
  }'
```

### 3. Check MongoDB

```bash
# Connect to MongoDB
mongosh "your-mongodb-connection-string"

# Check calls collection
db.calls.find().pretty()

# Find calls by email
db.calls.find({ email: "user@example.com" }).pretty()

# Count total calls
db.calls.countDocuments()
```

### 4. Test Frontend

1. Start backend: `cd server && npm start`
2. Start frontend: `npm run dev`
3. Login to app
4. Visit: `http://localhost:8080/my-calls`
5. Should see empty state or existing calls

---

## 🔄 Integration Setup

### Option 1: Direct Retell AI Webhook

1. Go to Retell AI Dashboard
2. Navigate to Webhooks settings
3. Add webhook URL: `https://your-domain.com/webhook/retell`
4. Select events: `call_completed` or `call_analyze`
5. Save and test

### Option 2: Via n8n HTTP Request Node

1. Create n8n workflow
2. Add **Webhook** trigger (receives from Retell)
3. Add **HTTP Request** node:
   - Method: `POST`
   - URL: `https://your-domain.com/webhook/retell`
   - Body Type: `JSON`
   - Body: `{{ $json }}` (forwards entire payload)
4. Activate workflow

---

## 📊 Phone Number Resolution Logic

The webhook tries multiple strategies to find the user:

1. **Exact match**: `business.phoneNumber` or `phoneNumber` fields
2. **Normalized match**: Remove spaces, dashes, parentheses
3. **Partial match**: Last 10 digits (handles country codes)

Example:
```
Webhook receives: "+1 (409) 555-1234"

Tries:
1. Exact: "+1 (409) 555-1234"
2. Normalized: "+14095551234"
3. Last 10 digits: "4095551234"
```

If no user is found, the webhook:
- Logs the phone number
- Returns `{ success: true, skipped: true }`
- Does NOT save the call
- Does NOT retry (prevents webhook storms)

---

## 🔒 Security Features

1. **CSRF Exclusion**: `/webhook/retell` excluded from CSRF protection
2. **Idempotency**: Duplicate `callId` safely ignored
3. **Authentication**: `/api/my-calls` requires valid JWT token
4. **Email Privacy**: Only shows calls for authenticated user
5. **Safe Errors**: Always returns 200 to prevent retry loops

---

## 🚀 Deployment to Render

### Environment Variables

Ensure these are set on Render:

```bash
# MongoDB
MONGODB_URI=mongodb+srv://...

# JWT (for authentication)
JWT_SECRET=your-secret-here
JWT_REFRESH_SECRET=your-refresh-secret

# Frontend URL (for CORS)
CLIENT_URL=https://your-frontend.com

# Optional
PORT=3001
NODE_ENV=production
```

### Build Command

```bash
cd server && npm install
```

### Start Command

```bash
cd server && npm start
```

### Webhook URL

Your webhook will be available at:
```
https://your-backend.onrender.com/webhook/retell
```

---

## 📈 Monitoring

### Backend Logs

Watch for these log patterns:

```bash
✅ [RETELL WEBHOOK] Call saved to MongoDB
✅ [RETELL WEBHOOK] User found: user@example.com
⚠️  [RETELL WEBHOOK] No user found for phone: +15555555555
✅ [RETELL WEBHOOK] Call already processed (duplicate)
```

### MongoDB Queries

```javascript
// Total calls
db.calls.countDocuments()

// Calls by user
db.calls.find({ email: "user@example.com" }).count()

// Recent calls (last 24 hours)
db.calls.find({
  createdAt: { $gte: new Date(Date.now() - 24*60*60*1000) }
})

// Average duration
db.calls.aggregate([
  { $group: { _id: null, avgDuration: { $avg: "$durationSeconds" } } }
])
```

---

## 🐛 Troubleshooting

### Issue: "No user found for phone"

**Cause**: Phone number not in MongoDB users collection

**Fix:**
1. Check User schema has `phoneNumber` or `business.phoneNumber`
2. Verify phone format matches (try normalized version)
3. Check user exists: `db.users.findOne({ email: "user@example.com" })`
4. Update user with phone: 
```javascript
db.users.updateOne(
  { email: "user@example.com" },
  { $set: { "business.phoneNumber": "+14095551234" } }
)
```

### Issue: "Calls not showing in frontend"

**Cause**: Email mismatch or authentication issue

**Fix:**
1. Check logged-in user email: Open DevTools → Application → Cookies
2. Verify calls exist for that email:
```bash
db.calls.find({ email: "actual-user@example.com" })
```
3. Check browser console for API errors
4. Test API directly:
```bash
curl http://localhost:3001/api/my-calls \
  -H "Cookie: access_token=YOUR_TOKEN"
```

### Issue: "Duplicate calls being created"

**Cause**: Race condition or missing unique index

**Fix:**
1. Check unique index exists:
```javascript
db.calls.getIndexes()
```
2. Create index if missing:
```javascript
db.calls.createIndex({ callId: 1 }, { unique: true })
```
3. Remove duplicates:
```javascript
db.calls.aggregate([
  { $group: { _id: "$callId", count: { $sum: 1 }, docs: { $push: "$_id" } } },
  { $match: { count: { $gt: 1 } } }
]).forEach(doc => {
  doc.docs.shift(); // Keep first
  db.calls.deleteMany({ _id: { $in: doc.docs } });
});
```

---

## 📞 Support

**Email**: info@restaurant-ai.com  
**Phone**: (409) 960-2907

---

## ✅ Checklist

- [x] MongoDB Call model with email as primary identifier
- [x] Webhook endpoint with phone-to-email resolution
- [x] Idempotency using callId
- [x] Support for both camelCase and snake_case
- [x] Authenticated API endpoint for fetching calls
- [x] React component with table and modal
- [x] Stats cards and empty states
- [x] Testing script
- [x] CSRF exclusion for webhook
- [x] Route configuration
- [x] Production-ready error handling
- [x] Comprehensive documentation

---

**Status**: ✅ Production Ready  
**Last Updated**: December 13, 2025  
**Version**: 1.0.0
