# Retell Agent Integration Guide

## Overview

This system allows multiple clients to connect their individual Retell AI agents to their Aivors dashboards. Each client's calls are tracked separately and displayed only on their own dashboard.

## How It Works

### 1. **Client Connects Their Agent**

When a client wants to use the call analytics feature:

1. They go to their dashboard settings or integration page
2. They enter their Retell Agent ID (found in Retell AI dashboard)
3. Click "Connect Agent"
4. The system saves the `retellAgentId` in their user profile

**API Endpoint:** `POST /api/retell/connect-agent`
```json
{
  "agentId": "agent_xxxxxxxxxxxxx"
}
```

**What Happens:**
- Updates `User.business.retellAgentId` with the agent ID
- Sets `User.business.aiTrainingStatus` to 'complete'
- Sets `User.analytics.aiStatus` to 'Online'
- Validates that this agent isn't already connected to another user

### 2. **Retell AI Sends Webhook to N8N**

When a call happens on the client's Retell agent:

1. Call completes on Retell AI
2. Retell sends webhook to your n8n workflow
3. N8N processes the data and forwards to your backend

**Webhook URL:** `https://n8n.srv971061.hstgr.cloud/webhook/retell-webhook`

**Webhook Payload Includes:**
```json
{
  "event": "call_analyzed",
  "call": {
    "call_id": "xxxxx",
    "agent_id": "agent_xxxxxxxxxxxxx",  // <- This identifies the client!
    "transcript": "...",
    "call_analysis": {
      "call_summary": "..."
    }
  }
}
```

### 3. **N8N Forwards to Your Backend**

N8N HTTP Request node sends data to:

**Backend URL:** `https://aivors-5hvj.onrender.com/api/n8n/retell-webhook`

**Headers:**
```
x-n8n-webhook-secret: aivors-secret
Content-Type: application/json
```

### 4. **Backend Matches Call to Client**

The webhook handler (`/api/n8n/retell-webhook`) does this:

```javascript
// Extract agent_id from webhook
const agentId = req.body.call?.agent_id || req.body.agent_id;

// Find the user who owns this agent
const user = await User.findOne({ 'business.retellAgentId': agentId });

if (user) {
  userId = user._id.toString();
  // Save call with this userId
  await Call.create({
    callId: callData.callId,
    userId: userId,  // <- Call is linked to correct client
    transcript: callData.transcript,
    summary: callData.summary,
    durationMinutes: callData.durationMinutes
  });
}
```

### 5. **Dashboard Shows Client's Calls**

When client views their dashboard:

```javascript
// Dashboard API fetches only THEIR calls
const calls = await Call.find({ userId: currentUser.userId });
```

**Result:** Each client sees only their own calls, even though all calls go through the same webhook!

## Database Schema

### User Model (Updated)

```javascript
{
  business: {
    retellAgentId: String,  // <- New field!
    phoneNumber: String,
    aiTrainingStatus: String
  },
  analytics: {
    aiStatus: String  // 'Online' when agent connected
  }
}
```

### Call Model

```javascript
{
  callId: String,
  userId: String,  // <- Links call to specific client
  transcript: String,
  summary: String,
  durationMinutes: Number,
  createdAt: Date
}
```

## API Endpoints

### Connect Agent
```
POST /api/retell/connect-agent
Authorization: Bearer token (or cookie)
Body: { "agentId": "agent_xxx" }

Response:
{
  "success": true,
  "message": "Retell agent connected successfully",
  "data": {
    "agentId": "agent_xxx",
    "email": "user@example.com",
    "aiStatus": "Online"
  }
}
```

### Disconnect Agent
```
DELETE /api/retell/disconnect-agent
Authorization: Bearer token (or cookie)

Response:
{
  "success": true,
  "message": "Retell agent disconnected successfully",
  "data": {
    "aiStatus": "Offline"
  }
}
```

### Get Agent Status
```
GET /api/retell/agent-status
Authorization: Bearer token (or cookie)

Response:
{
  "success": true,
  "data": {
    "isConnected": true,
    "agentId": "agent_xxx",
    "aiStatus": "Online"
  }
}
```

### Webhook Endpoint (N8N → Backend)
```
POST /api/n8n/retell-webhook
Headers: x-n8n-webhook-secret: aivors-secret

Body: {
  "event": "call_analyzed",
  "call": {
    "call_id": "xxx",
    "agent_id": "agent_xxx",  // Used to find the client
    "transcript": "...",
    "call_analysis": { "call_summary": "..." }
  }
}
```

## Frontend Integration

### Add to Dashboard Settings

```tsx
import RetellAgentConnect from '@/components/RetellAgentConnect';

function DashboardSettings() {
  return (
    <div>
      <h2>Integrations</h2>
      <RetellAgentConnect />
    </div>
  );
}
```

### Component Features

- Shows current connection status
- Input for agent ID
- Connect/Disconnect buttons
- Validation and error handling
- Instructions for finding agent ID

## Testing

### 1. Connect an Agent

```bash
curl -X POST http://localhost:5000/api/retell/connect-agent \
  -H "Content-Type: application/json" \
  -H "Cookie: access_token=YOUR_TOKEN" \
  -d '{"agentId": "agent_test123"}'
```

### 2. Simulate Webhook from N8N

```bash
curl -X POST https://aivors-5hvj.onrender.com/api/n8n/retell-webhook \
  -H "Content-Type: application/json" \
  -H "x-n8n-webhook-secret: aivors-secret" \
  -d '{
    "event": "call_analyzed",
    "call": {
      "call_id": "test_call_123",
      "agent_id": "agent_test123",
      "transcript": "Test call transcript",
      "call_analysis": {
        "call_summary": "This was a test call"
      },
      "start_timestamp": 1640000000,
      "end_timestamp": 1640000300
    }
  }'
```

### 3. Check Dashboard

Visit your dashboard - you should see the test call appear!

## N8N Configuration

### Update HTTP Request Node

1. **URL:** `https://aivors-5hvj.onrender.com/api/n8n/retell-webhook`
2. **Method:** POST
3. **Headers:**
   - Name: `x-n8n-webhook-secret`
   - Value: `aivors-secret`
   - Name: `Content-Type`
   - Value: `application/json`
4. **Body:** Forward the entire webhook payload from Retell

### Workflow Flow

```
Retell Webhook (n8n)
    ↓
HTTP Request (to your backend)
    ↓
Your Backend (matches agent_id to user)
    ↓
Save call to database with correct userId
    ↓
Client's dashboard shows their calls
```

## Security

1. **Agent ID Uniqueness:** Each agent can only be connected to one user account
2. **Authentication:** All API endpoints require valid JWT token
3. **Webhook Secret:** N8N must include correct secret header
4. **Data Isolation:** Clients can only see their own calls (filtered by userId)

## Troubleshooting

### Problem: Calls not appearing in dashboard

**Check:**
1. Is agent connected? Call `/api/retell/agent-status`
2. Does webhook payload include `agent_id`?
3. Check backend logs for `[RETELL WEBHOOK]` messages
4. Verify n8n is forwarding to correct backend URL

### Problem: "No client found for this agent"

**Solution:**
- Client needs to connect their agent first
- Verify the `agent_id` in webhook matches the connected `retellAgentId`

### Problem: Calls appearing on wrong dashboard

**Check:**
- Verify `Call.userId` matches the user viewing the dashboard
- Check database: `db.calls.find({ callId: "xxx" })` - what's the userId?

## Summary

✅ **Before:** All calls mixed together, no way to separate by client
✅ **After:** Each client's calls tracked separately using their agent ID
✅ **Benefit:** Multi-tenant system where each client sees only their data

---

**Last Updated:** December 2025
**Status:** Production Ready 🚀
