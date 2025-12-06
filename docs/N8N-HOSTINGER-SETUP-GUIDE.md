# 🔗 n8n Hostinger Integration Guide

## Overview
This guide shows you how to configure your Hostinger n8n instance to receive Retell AI webhooks and forward them to your Aivors backend.

---

## 📍 Your n8n URLs

**Hostinger n8n Instance:**
- Retell Webhook: `https://n8n.srv971061.hstgr.cloud/webhook/retell-webhook`
- Subscription Webhook: `https://n8n.srv971061.hstgr.cloud/webhook/subscription`

**Aivors Backend Endpoints:**
- Retell Handler: `POST http://localhost:3001/api/n8n/retell-webhook`
- Subscription Handler: `POST http://localhost:3001/api/n8n/subscription/update`
- Dashboard: `GET http://localhost:3001/api/dashboard/:userId`

---

## 🛠️ n8n Workflow Setup

### Workflow 1: Retell AI Call Analytics

**Purpose:** Receive call_analyze events from Retell AI and forward to Aivors backend

**Workflow Steps:**

```
1. Webhook Node (Trigger)
   └─> 2. Filter Node (Only call_analyze)
        └─> 3. HTTP Request Node (Send to Aivors)
             └─> 4. Conditional Node (Check credits)
                  ├─> 5a. Low Credits Alert
                  └─> 5b. Success Response
```

#### Step 1: Webhook Trigger
```json
{
  "name": "Retell Webhook",
  "type": "n8n-nodes-base.webhook",
  "parameters": {
    "path": "retell-webhook",
    "httpMethod": "POST",
    "responseMode": "responseNode",
    "responseData": "firstEntryJson"
  }
}
```

**Configuration:**
- Webhook URL: `https://n8n.srv971061.hstgr.cloud/webhook/retell-webhook`
- Method: `POST`
- Authentication: None (or add authentication if needed)

#### Step 2: Filter Events
```json
{
  "name": "Filter call_analyze",
  "type": "n8n-nodes-base.if",
  "parameters": {
    "conditions": {
      "string": [
        {
          "value1": "={{ $json.event_type }}",
          "operation": "equals",
          "value2": "call_analyze"
        }
      ]
    }
  }
}
```

**Logic:** Only process if `event_type === "call_analyze"`

#### Step 3: Forward to Aivors Backend
```json
{
  "name": "Send to Aivors",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "method": "POST",
    "url": "YOUR_PRODUCTION_URL/api/n8n/retell-webhook",
    "authentication": "none",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [
        {
          "name": "Content-Type",
          "value": "application/json"
        }
      ]
    },
    "sendBody": true,
    "bodyParameters": {
      "parameters": [
        {
          "name": "event_type",
          "value": "={{ $json.event_type }}"
        },
        {
          "name": "call_id",
          "value": "={{ $json.call_id }}"
        },
        {
          "name": "user_id",
          "value": "={{ $json.user_id }}"
        },
        {
          "name": "email",
          "value": "={{ $json.email }}"
        },
        {
          "name": "phone_number",
          "value": "={{ $json.phone_number }}"
        },
        {
          "name": "duration_seconds",
          "value": "={{ $json.duration_seconds }}"
        },
        {
          "name": "transcript",
          "value": "={{ $json.transcript }}"
        },
        {
          "name": "summary",
          "value": "={{ $json.summary }}"
        },
        {
          "name": "metadata",
          "value": "={{ $json.metadata }}"
        },
        {
          "name": "call_start_time",
          "value": "={{ $json.call_start_time }}"
        },
        {
          "name": "call_end_time",
          "value": "={{ $json.call_end_time }}"
        }
      ]
    }
  }
}
```

**Replace:** `YOUR_PRODUCTION_URL` with your actual deployed backend URL

#### Step 4: Check Credits Response
```json
{
  "name": "Check Credits",
  "type": "n8n-nodes-base.if",
  "parameters": {
    "conditions": {
      "boolean": [
        {
          "value1": "={{ $json.alerts.shouldDisableWorkflow }}",
          "value2": true
        }
      ]
    }
  }
}
```

#### Step 5a: Low Credits Alert (Optional)
```json
{
  "name": "Send Low Credits Alert",
  "type": "n8n-nodes-base.emailSend",
  "parameters": {
    "fromEmail": "alerts@aivors.com",
    "toEmail": "={{ $json.userEmail }}",
    "subject": "⚠️ Low Credits Alert - Aivors",
    "text": "Your Aivors subscription has {{ $json.subscription.availableCredits }} minutes remaining. Please add more credits to continue using the service."
  }
}
```

#### Step 5b: Success Response
```json
{
  "name": "Success Response",
  "type": "n8n-nodes-base.respondToWebhook",
  "parameters": {
    "respondWith": "json",
    "responseBody": "={{ $json }}"
  }
}
```

---

## 🧪 Testing the Integration

### Step 1: Start Your Backend
```bash
cd server
npm run dev
```

Backend should be running at `http://localhost:3001`

### Step 2: Test with Test Script
```bash
node server/test-n8n-webhook.js
```

This will:
- ✅ Send a test call_analyze event
- ✅ Verify call is saved
- ✅ Check credits are deducted
- ✅ Confirm dashboard shows data

### Step 3: Test with n8n Test Webhook
In n8n workflow:
1. Click on "Webhook" node
2. Click "Test step" button
3. Send this payload:

```json
{
  "event_type": "call_analyze",
  "call_id": "test_retell_call_123",
  "email": "your-test-user@example.com",
  "phone_number": "+1-555-0199",
  "duration_seconds": 120,
  "transcript": "Customer: Hello! I need help.\nAI: Of course! How can I assist you today?",
  "summary": "Customer requested general assistance.",
  "metadata": {
    "agent_name": "Aivors AI",
    "sentiment": "positive"
  },
  "call_start_time": "2024-01-15T10:00:00Z",
  "call_end_time": "2024-01-15T10:02:00Z"
}
```

### Step 4: Verify in Dashboard
Open your frontend dashboard and check:
- ✅ Total calls increased
- ✅ Recent calls shows new call
- ✅ Transcript is visible
- ✅ Credits/time remaining decreased

---

## 🔐 Security (Optional)

### Add Webhook Secret Validation

**In n8n workflow, add header:**
```json
{
  "name": "x-n8n-webhook-secret",
  "value": "your-secret-here"
}
```

**In Aivors backend:**
Set environment variable:
```bash
N8N_WEBHOOK_SECRET=your-secret-here
```

---

## 📊 Expected Data Flow

```
Retell AI Call
    ↓
[Retell sends webhook]
    ↓
n8n Hostinger: https://n8n.srv971061.hstgr.cloud/webhook/retell-webhook
    ↓
[Filter: only call_analyze]
    ↓
[HTTP Request to Aivors Backend]
    ↓
Aivors Backend: POST /api/n8n/retell-webhook
    ↓
[Save to MongoDB]
    ↓
[Deduct credits from subscription]
    ↓
[Update user analytics]
    ↓
[Return response with credit info]
    ↓
n8n receives response
    ↓
[Check if credits low]
    ↓
Dashboard shows updated data
```

---

## 🎯 What Gets Stored

### Call Document (MongoDB)
```javascript
{
  callId: "retell_call_abc123",
  userId: "user_id_xyz",
  phoneNumber: "+1-555-0123",
  durationSeconds: 180,
  durationMinutes: 3,
  transcript: "Full conversation text...",
  summary: "Call summary...",
  eventType: "call_analyze",
  status: "completed",
  metadata: { /* Retell metadata */ },
  createdAt: "2024-01-15T10:00:00Z"
}
```

### Subscription Update
```javascript
{
  userId: "user_id_xyz",
  totalCredits: 100,
  usedCredits: 3,
  availableCredits: 97  // Virtual field (totalCredits - usedCredits)
}
```

### User Analytics Update
```javascript
{
  analytics: {
    callsToday: 5,
    aiStatus: "Online"
  },
  subscription: {
    minutesRemaining: 97,
    minutesPurchased: 100
  },
  recentActivity: [
    {
      text: "Call completed with +1-555-0123 (3 min)",
      timeAgo: "Just now",
      createdAt: "2024-01-15T10:00:00Z"
    }
  ]
}
```

---

## 🚀 Production Deployment

### When deploying to production:

1. **Update n8n HTTP Request URL**
   Replace `http://localhost:3001` with your production URL:
   ```
   https://your-production-domain.com/api/n8n/retell-webhook
   ```

2. **Configure Retell AI Webhook**
   In Retell AI dashboard, set webhook URL to:
   ```
   https://n8n.srv971061.hstgr.cloud/webhook/retell-webhook
   ```

3. **Environment Variables**
   Set in production:
   ```bash
   MONGODB_URI=your_production_mongodb_uri
   N8N_WEBHOOK_SECRET=your_secret_here
   PORT=3001
   ```

4. **Test End-to-End**
   - Make a real call via Retell AI
   - Verify webhook reaches n8n
   - Confirm data appears in dashboard

---

## 🐛 Troubleshooting

### Dashboard shows no data
**Check:**
1. Backend is running: `http://localhost:3001/api/n8n/health`
2. MongoDB is connected (check server logs)
3. n8n workflow is active
4. n8n can reach your backend (check n8n execution logs)

### Credits not deducting
**Check:**
1. User has subscription (created automatically if missing)
2. `duration_seconds` is being sent in webhook payload
3. Check server logs for credit deduction messages

### Duplicate calls
**This is normal!** The system prevents duplicate processing automatically. If the same `call_id` is sent twice, the second one is rejected.

### Event not processing
**Check:**
- Event type is exactly `call_analyze` (case-sensitive)
- All required fields are present: `call_id`, `duration_seconds`

---

## 📞 Support

If you need help:
1. Check server logs: `cd server && npm run dev`
2. Check n8n execution logs in n8n UI
3. Run test script: `node server/test-n8n-webhook.js`
4. Verify MongoDB connection and data

---

## ✅ Quick Checklist

- [ ] Backend running at port 3001
- [ ] MongoDB connected
- [ ] n8n workflow created and active
- [ ] n8n HTTP Request node points to correct URL
- [ ] Test webhook sent successfully
- [ ] Call appears in MongoDB
- [ ] Credits deducted from subscription
- [ ] Dashboard shows data
- [ ] Retell AI webhook configured
- [ ] Production deployment complete

---

**You're all set! 🎉**

The dashboard will now show:
1. ✅ Call transcript analytics
2. ✅ Time/minutes remaining in subscription
