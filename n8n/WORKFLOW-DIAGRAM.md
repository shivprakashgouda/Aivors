# 🔄 Retell AI Integration - Complete Workflow

## Visual Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                    📱 RETELL AI PHONE CALL                          │
│                 Agent: agent_2faeaea2dcfa43016ec8aa47a3             │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ Call Completed
                               │ Event: call_analyzed
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    🪝 RETELL WEBHOOK TRIGGER                        │
│         POST to configured webhook URL with call data               │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    🔧 N8N WORKFLOW                                   │
│         https://n8n.srv971061.hstgr.cloud/webhook/retell-webhook   │
│                                                                      │
│  [1] Retell Webhook Receiver                                        │
│      ├─ Receives POST request                                       │
│      └─ Extracts webhook payload                                    │
│                               │                                      │
│                               ▼                                      │
│  [2] Parse Retell Event                                             │
│      ├─ Check event type                                            │
│      ├─ Valid: call_analyzed ✅                                     │
│      └─ Invalid: skip ❌                                            │
│                               │                                      │
│                               ▼                                      │
│  [3] Skip Non-Call Events (IF)                                      │
│      ├─ True → Send Skip Response                                   │
│      └─ False → Continue processing                                 │
│                               │                                      │
│                               ▼                                      │
│  [4] Forward to Backend (HTTP)                                      │
│      ├─ URL: https://aivors-5hvj.onrender.com/api/n8n/retell...   │
│      ├─ Headers: x-n8n-webhook-secret, Content-Type                │
│      └─ Body: Full webhook payload                                  │
│                               │                                      │
│                               ▼                                      │
│  [5] Log Response                                                    │
│      └─ Console logs for monitoring                                 │
│                               │                                      │
│                               ▼                                      │
│  [6] Check Credits                                                   │
│      ├─ Credits available → Continue                                │
│      └─ Credits depleted → shouldDisable flag                       │
│                               │                                      │
│                               ▼                                      │
│  [7] Send Response                                                   │
│      └─ Return JSON to Retell                                       │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    🖥️  AIVORS BACKEND                                │
│            https://aivors-5hvj.onrender.com                         │
│                                                                      │
│  POST /api/n8n/retell-webhook                                       │
│      ├─ Validate webhook secret                                     │
│      ├─ Extract agent_id from payload                               │
│      ├─ Find user by retellAgentId                                  │
│      ├─ Check for duplicate call                                    │
│      ├─ Save call to MongoDB                                        │
│      ├─ Deduct credits from subscription                            │
│      └─ Return response with call + subscription data               │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    🗄️  MONGODB ATLAS                                │
│         mongodb://cluster0.i3zmgmz.mongodb.net/Aivors              │
│                                                                      │
│  Collections:                                                        │
│      ├─ users (retellAgentId mapping)                               │
│      ├─ calls (call records)                                        │
│      └─ subscriptions (credits tracking)                            │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    🌐 DASHBOARD FRONTEND                            │
│                https://www.aivors.com                               │
│                                                                      │
│  GET /api/calls/user/:userId                                        │
│      └─ Fetches calls from MongoDB                                  │
│                                                                      │
│  GET /api/calls/stats/:userId                                       │
│      └─ Fetches call statistics                                     │
│                                                                      │
│  Display:                                                            │
│      ├─ Call list with transcripts                                  │
│      ├─ Total minutes used                                          │
│      ├─ Credits remaining                                           │
│      └─ Analytics charts                                            │
└─────────────────────────────────────────────────────────────────────┘
```

## 🔑 Key Components

### 1. Retell AI
- **Agent ID:** `agent_2faeaea2dcfa43016ec8aa47a3`
- **Webhook Event:** `call_analyzed`
- **Trigger:** After call completion

### 2. n8n Workflow
- **Webhook URL:** `https://n8n.srv971061.hstgr.cloud/webhook/retell-webhook`
- **Function:** Route and validate data
- **Output:** Forward to backend

### 3. Backend API
- **Endpoint:** `POST /api/n8n/retell-webhook`
- **Auth:** Webhook secret header
- **Processing:**
  - Agent → User matching
  - Call data extraction
  - MongoDB storage
  - Credit deduction

### 4. MongoDB
- **Collections:**
  - `users` - User accounts with retellAgentId
  - `calls` - Call records with userId
  - `subscriptions` - Credit tracking
- **Indexes:** callId (unique), userId, createdAt

### 5. Dashboard
- **URL:** `https://www.aivors.com`
- **APIs:**
  - `/api/calls/user/:userId` - List calls
  - `/api/calls/stats/:userId` - Statistics
- **Features:**
  - Call history
  - Transcripts
  - Analytics
  - Credit usage

## 📦 Data Transformation

### Retell Webhook → Backend
```javascript
// Input from Retell
{
  "event": "call_analyzed",
  "call": {
    "call_id": "call_123",
    "agent_id": "agent_2faeaea2dcfa43016ec8aa47a3",
    "transcript": "...",
    "duration_ms": 16816
  }
}

// Transformed in Backend
{
  callId: "call_123",
  userId: "6931b2a1f8727331edb77095", // Found by agent_id
  durationMinutes: 3,  // Calculated from duration_ms
  transcript: "...",
  status: "completed"
}
```

### Backend → Dashboard
```javascript
// Backend saves to MongoDB
Call.create({ callId, userId, ... })

// Dashboard fetches
GET /api/calls/user/6931b2a1f8727331edb77095
→ Returns array of calls for that user only
```

## 🔐 Security Layer

```
Retell → n8n (HTTPS)
       ↓
n8n → Backend (HTTPS + Webhook Secret)
       ↓
Backend → MongoDB (Connection String Auth)
       ↓
Dashboard → Backend (JWT Token)
```

## ⚡ Credit System

```
Call Duration: 3 minutes
       ↓
Backend calculates: Math.ceil(duration_ms / 60000)
       ↓
Subscription.deductCredits(3)
       ↓
availableCredits: 500 → 497
       ↓
Check: availableCredits <= 0?
       ├─ Yes → shouldDisableWorkflow: true
       └─ No → shouldDisableWorkflow: false
       ↓
Response includes flag for n8n
```

## 🎯 Per-Client Isolation

```
Agent A (agent_xxx) → User A (user_123)
                           ↓
                      Calls stored with userId: user_123
                           ↓
                      Dashboard shows only user_123's calls

Agent B (agent_yyy) → User B (user_456)
                           ↓
                      Calls stored with userId: user_456
                           ↓
                      Dashboard shows only user_456's calls
```

**Isolation enforced at:**
1. Backend: `User.findOne({ 'business.retellAgentId': agentId })`
2. Database: `Call.find({ userId: req.user._id })`
3. Frontend: Only authenticated user's data

## 🔄 Error Handling

```
Retell Webhook
       ↓
┌──────┴──────┐
│   n8n       │
│  ┌────┐     │  Event not call_analyzed?
│  │ IF │─────┼──→ Skip & respond (200 OK)
│  └────┘     │
│      ↓      │  Event is call_analyzed
│  ┌────┐     │
│  │HTTP│     │  Backend unreachable?
│  └────┘─────┼──→ Retry (n8n auto-retry)
│      ↓      │
│  ┌────┐     │  Backend error response?
│  │Log │─────┼──→ Log & continue
│  └────┘     │
└─────────────┘
       ↓
Backend receives
       ↓
┌──────┴──────┐
│  Backend    │
│             │  No user found for agent_id?
│  ┌────┐    │──→ Return 400 "No client found"
│  │Find│    │
│  │User│    │  Duplicate call_id?
│  └────┘    │──→ Return 200 "Already processed"
│      ↓     │
│  ┌────┐   │  MongoDB error?
│  │Save│───┼──→ Return 500 "Failed to save"
│  └────┘   │
└───────────┘
```

## ✅ Success Indicators

1. **n8n Execution Log:** Green ✅ with all nodes executed
2. **Backend Response:** `{ success: true, data: { call: {...} } }`
3. **Database Check:** `node check-calls.cjs` shows new call
4. **Dashboard:** Call appears in user's call list

## 🚨 Monitoring Points

| Point | Check | Expected |
|-------|-------|----------|
| Retell | Webhook logs | POST sent to n8n |
| n8n | Executions tab | Successful run |
| Backend | Render logs | "Call saved" message |
| Database | check-calls.cjs | New call record |
| Dashboard | Browser | Call displayed |

---

**Status:** Ready for production use! ✅

**Next Action:** Import `retell-call-analytics-workflow.json` to n8n
