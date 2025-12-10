# 🤖 Retell AI → n8n → Aivors Backend Integration

Complete workflow for capturing Retell AI call analytics and displaying in your dashboard.

## 📋 Overview

**Data Flow:**
```
Retell AI Call
    ↓ (webhook)
n8n (https://n8n.srv971061.hstgr.cloud/webhook/retell-webhook)
    ↓ (HTTP POST)
Backend (https://aivors-5hvj.onrender.com/api/n8n/retell-webhook)
    ↓ (MongoDB save)
Database (MongoDB Atlas)
    ↓ (API fetch)
Dashboard (www.aivors.com)
```

## 🚀 Setup Instructions

### Step 1: Import Workflow to n8n

1. **Login to your n8n instance:**
   - URL: `https://n8n.srv971061.hstgr.cloud`

2. **Import the workflow:**
   - Click "Add Workflow" → "Import from File"
   - Select `retell-call-analytics-workflow.json`
   - Click "Import"

3. **Activate the workflow:**
   - Toggle "Active" switch in top-right corner
   - Status should show green ✅

### Step 2: Verify Webhook URL

Your webhook URL is now active at:
```
https://n8n.srv971061.hstgr.cloud/webhook/retell-webhook
```

**Test it:**
```bash
curl -X POST https://n8n.srv971061.hstgr.cloud/webhook/retell-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "call_analyzed",
    "call": {
      "call_id": "test_123",
      "agent_id": "agent_2faeaea2dcfa43016ec8aa47a3",
      "transcript": "Test call",
      "call_analysis": {
        "call_summary": "Test summary"
      },
      "start_timestamp": 1765189115573,
      "end_timestamp": 1765189132389,
      "duration_ms": 16816
    }
  }'
```

### Step 3: Configure Retell AI Webhook

1. **Login to Retell AI Dashboard:**
   - Go to https://app.retellai.com

2. **Navigate to Webhooks Settings:**
   - Click on your agent: `agent_2faeaea2dcfa43016ec8aa47a3`
   - Go to "Settings" → "Webhooks"

3. **Add Webhook URL:**
   ```
   https://n8n.srv971061.hstgr.cloud/webhook/retell-webhook
   ```

4. **Select Events:**
   - ✅ `call.analyzed` (or `call_analyzed`)
   - ❌ Uncheck other events (optional)

5. **Save Configuration**

### Step 4: Connect Agent to User Account

**Option A: Use API (Recommended)**
```bash
curl -X POST https://aivors-5hvj.onrender.com/api/retell/connect-agent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "agentId": "agent_2faeaea2dcfa43016ec8aa47a3"
  }'
```

**Option B: Direct Database Update**
```bash
cd server
node connect-real-agent.cjs
```

### Step 5: Test End-to-End

1. **Make a test call on Retell AI**
   - Use agent `agent_2faeaea2dcfa43016ec8aa47a3`
   - Complete the call

2. **Check n8n Execution Log**
   - n8n → Executions tab
   - Should see successful execution
   - Check each node's output

3. **Verify in Database**
   ```bash
   cd server
   node check-calls.cjs
   ```

4. **View in Dashboard**
   - Login to https://www.aivors.com
   - Go to Dashboard/Analytics
   - Should see the call listed

## 🔍 Workflow Details

### Node 1: Retell Webhook Receiver
- **Type:** Webhook
- **Path:** `/webhook/retell-webhook`
- **Method:** POST
- **Purpose:** Receives call data from Retell AI

### Node 2: Parse Retell Event
- **Type:** Function
- **Purpose:** Validates event type (only `call_analyzed`)
- **Output:** Original webhook data or skip flag

### Node 3: Skip Non-Call Events
- **Type:** IF Condition
- **Purpose:** Filter out non-call events
- **True:** Skip and respond
- **False:** Process call

### Node 4: Forward to Backend
- **Type:** HTTP Request
- **URL:** `https://aivors-5hvj.onrender.com/api/n8n/retell-webhook`
- **Method:** POST
- **Headers:**
  - `x-n8n-webhook-secret: aivors-secret`
  - `Content-Type: application/json`
- **Body:** Full webhook payload
- **Purpose:** Send to backend for processing

### Node 5: Log Response
- **Type:** Function
- **Purpose:** Log backend response for monitoring

### Node 6: Check Credits
- **Type:** Function
- **Purpose:** Check if user credits depleted
- **Output:** `shouldDisable` flag

### Node 7: Send Response
- **Type:** Respond to Webhook
- **Purpose:** Return success response to Retell

## 📊 Data Format

### Retell Webhook Format (Input)
```json
{
  "event": "call_analyzed",
  "call": {
    "call_id": "call_abc123xyz",
    "agent_id": "agent_2faeaea2dcfa43016ec8aa47a3",
    "transcript": "Full conversation transcript...",
    "call_analysis": {
      "call_summary": "Brief summary of the call"
    },
    "start_timestamp": 1765189115573,
    "end_timestamp": 1765189132389,
    "duration_ms": 16816
  }
}
```

### Backend Response Format (Output)
```json
{
  "success": true,
  "message": "Call processed successfully",
  "data": {
    "call": {
      "callId": "call_abc123xyz",
      "userId": "6931b2a1f8727331edb77095",
      "durationMinutes": 3,
      "durationSeconds": 180
    },
    "subscription": {
      "availableCredits": 497,
      "totalCredits": 500,
      "usedCredits": 3,
      "shouldDisableWorkflow": false
    }
  }
}
```

## ⚠️ Troubleshooting

### Webhook Not Receiving Data
1. Check n8n workflow is **Active** (green toggle)
2. Verify Retell webhook URL is correct
3. Check n8n logs: Executions → Recent executions

### Backend Not Saving Data
1. Check backend logs on Render.com
2. Verify webhook secret matches: `aivors-secret`
3. Test backend endpoint:
   ```bash
   curl -X POST https://aivors-5hvj.onrender.com/api/n8n/health
   ```

### Agent Not Linked to User
1. Verify user has `retellAgentId` field:
   ```bash
   node check-calls.cjs
   ```
2. Connect agent using API or script (Step 4)

### Calls Not Showing in Dashboard
1. Check MongoDB has calls: `node check-calls.cjs`
2. Verify frontend is calling correct API: `/api/calls/user/:userId`
3. Check browser console for errors

## 🔐 Security

- ✅ Webhook secret validation: `x-n8n-webhook-secret: aivors-secret`
- ✅ HTTPS only (both n8n and backend)
- ✅ JWT authentication for API endpoints
- ✅ Per-user data isolation (calls linked to userId)

## 📈 Monitoring

**Check n8n Executions:**
```
https://n8n.srv971061.hstgr.cloud → Executions tab
```

**Check Backend Logs:**
```
https://dashboard.render.com → Aivors backend → Logs
```

**Check Database:**
```bash
cd server
node check-calls.cjs
```

## 🎯 Success Criteria

After setup, you should see:
- ✅ n8n workflow status: Active
- ✅ Retell webhook configured
- ✅ Test call appears in n8n executions
- ✅ Call saved to MongoDB
- ✅ Call visible in dashboard

## 📞 Current Configuration

- **n8n URL:** https://n8n.srv971061.hstgr.cloud
- **Backend URL:** https://aivors-5hvj.onrender.com
- **Dashboard URL:** https://www.aivors.com
- **Test User:** ajinkyamhetre01@gmail.com
- **Test Agent:** agent_2faeaea2dcfa43016ec8aa47a3
- **Webhook Secret:** aivors-secret

## 🔄 Next Steps

1. Import workflow to n8n ✅
2. Activate workflow ✅
3. Configure Retell webhook URL ⏳
4. Make test call ⏳
5. Verify in dashboard ⏳

---

**Need Help?** Check the logs:
- n8n: Executions tab
- Backend: Render.com dashboard
- Database: `node check-calls.cjs`
