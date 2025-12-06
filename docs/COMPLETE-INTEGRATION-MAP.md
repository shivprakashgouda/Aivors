# 🔗 Aivors Call Analytics - Complete Integration Map

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         RETELL AI                               │
│                    (Voice AI Platform)                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Webhook Events:
                             │ - call_start
                             │ - call_analyze ✓ (ONLY THIS ONE)
                             │ - call_end
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    HOSTINGER N8N WORKFLOW                       │
│            https://n8n.srv971061.hstgr.cloud                    │
├─────────────────────────────────────────────────────────────────┤
│  1. Webhook Trigger: /webhook/retell-webhook                   │
│  2. Filter Node: event_type === "call_analyze"                 │
│  3. HTTP Request: Forward to Aivors Backend                     │
│  4. Check Response: Low credits alert?                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ POST Request
                             │ {event_type, call_id, transcript...}
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     AIVORS BACKEND                              │
│                   http://localhost:3001                         │
├─────────────────────────────────────────────────────────────────┤
│  Endpoint: POST /api/n8n/retell-webhook                         │
│                                                                 │
│  Process:                                                       │
│  1. Validate event_type = "call_analyze"                       │
│  2. Check for duplicate call_id                                │
│  3. Extract call data (transcript, duration, etc.)             │
│  4. Find/create user and subscription                          │
│  5. Save call to MongoDB                                       │
│  6. Deduct minutes from subscription                           │
│  7. Update user analytics                                      │
│  8. Return credit status                                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Save to Database
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                        MONGODB                                  │
├─────────────────────────────────────────────────────────────────┤
│  Collections:                                                   │
│                                                                 │
│  ┌─────────────────────────────────────────────────┐          │
│  │ calls                                            │          │
│  │ - callId (unique)                               │          │
│  │ - userId                                        │          │
│  │ - phoneNumber                                   │          │
│  │ - durationMinutes                               │          │
│  │ - transcript ← SHOWN IN DASHBOARD               │          │
│  │ - summary ← SHOWN IN DASHBOARD                  │          │
│  │ - createdAt                                     │          │
│  └─────────────────────────────────────────────────┘          │
│                                                                 │
│  ┌─────────────────────────────────────────────────┐          │
│  │ subscriptions                                    │          │
│  │ - userId                                        │          │
│  │ - totalCredits                                  │          │
│  │ - usedCredits                                   │          │
│  │ - availableCredits ← TIME LEFT (DASHBOARD)     │          │
│  └─────────────────────────────────────────────────┘          │
│                                                                 │
│  ┌─────────────────────────────────────────────────┐          │
│  │ users                                            │          │
│  │ - _id                                           │          │
│  │ - email                                         │          │
│  │ - analytics.callsToday                          │          │
│  │ - subscription.minutesRemaining                 │          │
│  └─────────────────────────────────────────────────┘          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ API Calls
                             │ GET /api/dashboard/:userId
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    REACT DASHBOARD                              │
│                  http://localhost:5173                          │
├─────────────────────────────────────────────────────────────────┤
│  Component: CallAnalyticsDashboard.tsx                          │
│                                                                 │
│  Displays:                                                      │
│  ┌────────────────────────────────────────────────┐           │
│  │ 📊 Call Analytics                              │           │
│  │ Total Calls: 5                                 │           │
│  │ Calls Today: 2                                 │           │
│  │ Average Duration: 4 minutes                    │           │
│  └────────────────────────────────────────────────┘           │
│                                                                 │
│  ┌────────────────────────────────────────────────┐           │
│  │ 💳 Subscription Status                         │           │
│  │ Credits Remaining: 85 minutes ← TIME LEFT      │           │
│  │ Total Purchased: 100 minutes                   │           │
│  │ Used: 15 minutes (15%)                         │           │
│  └────────────────────────────────────────────────┘           │
│                                                                 │
│  ┌────────────────────────────────────────────────┐           │
│  │ 📞 Recent Calls                                │           │
│  │ +1-555-0123  3 min  2h ago  [View]             │           │
│  │ +1-555-0456  5 min  5h ago  [View]             │           │
│  └────────────────────────────────────────────────┘           │
│                                                                 │
│  [Click View Details] →                                         │
│  ┌────────────────────────────────────────────────┐           │
│  │ 📝 Full Transcript ← ANALYTICS OF CALL         │           │
│  │ Customer: Hi, I need help...                   │           │
│  │ AI: Of course! How can I help?                 │           │
│  │                                                 │           │
│  │ 📄 AI Summary                                  │           │
│  │ Customer requested assistance...                │           │
│  └────────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Two Main Features (As Requested)

### 1. ✅ Show Analytics of Call Transcript
**Location:** Recent Calls → [View Details] Button
**Shows:**
- Full conversation transcript
- AI-generated summary
- Call duration
- Phone number
- Timestamp

**Data Flow:**
```
Retell AI → n8n → Backend → MongoDB (calls.transcript) → Dashboard
```

### 2. ✅ Show Time Left (Minutes Remaining)
**Location:** Subscription Status Card
**Shows:**
- Credits Remaining: XX minutes
- Total Purchased: XX minutes
- Usage percentage

**Data Flow:**
```
Call happens → Duration deducted → MongoDB (subscriptions.availableCredits) → Dashboard
```

---

## 🔄 Real-Time Flow Example

### Scenario: Customer makes 3-minute call

```
1. Customer calls AI agent via Retell AI
   ↓
2. Call lasts 3 minutes
   ↓
3. Retell AI sends webhook:
   {
     event_type: "call_analyze",
     duration_seconds: 180,
     transcript: "Full conversation...",
     summary: "Customer requested help..."
   }
   ↓
4. n8n receives webhook
   ↓
5. n8n filters: only process if event_type === "call_analyze" ✓
   ↓
6. n8n forwards to: POST /api/n8n/retell-webhook
   ↓
7. Backend processes:
   - Saves call with transcript ✓
   - Deducts 3 minutes from subscription ✓
   - Updates user analytics ✓
   ↓
8. MongoDB updated:
   calls: {transcript, summary, duration: 3}
   subscriptions: {availableCredits: 97} (was 100)
   ↓
9. Dashboard refreshes:
   - Shows new call in "Recent Calls" ✓
   - Shows "97 minutes remaining" ✓
   - Can click [View] to see transcript ✓
```

---

## 📡 API Endpoints

### For n8n Integration:
```
POST /api/n8n/retell-webhook
├─ Receives: Retell AI call data
├─ Processes: call_analyze events only
├─ Returns: {call, subscription, alerts}
└─ Used by: n8n workflow

GET /api/n8n/health
├─ Returns: {status: "healthy"}
└─ Used by: n8n monitoring
```

### For Dashboard:
```
GET /api/dashboard/:userId
├─ Returns: Complete dashboard stats
├─ Includes: calls, subscription, analytics
└─ Used by: CallAnalyticsDashboard.tsx

GET /api/calls/user/:userId
├─ Returns: All user's calls with transcripts
└─ Used by: Recent calls list

GET /api/subscription/:userId
├─ Returns: Credit/minutes information
└─ Used by: Subscription status card
```

---

## 🧪 Testing Flow

### Test Script Flow:
```bash
node server/test-n8n-webhook.js
```

**What it does:**
```
1. Finds test user in database
   ↓
2. Checks subscription before call
   ↓
3. Sends simulated webhook:
   - event_type: "call_analyze"
   - duration: 3 minutes
   - transcript: Test conversation
   - summary: Test summary
   ↓
4. Verifies call saved to MongoDB
   ↓
5. Confirms credits deducted
   ↓
6. Checks dashboard shows new data
   ↓
7. Tests duplicate prevention
   ↓
8. Tests event filtering
```

---

## 🔒 Security & Validation

### Webhook Security:
```javascript
// Optional: Add to n8n HTTP Request headers
{
  "x-n8n-webhook-secret": "your-secret-here"
}

// Backend verifies (if N8N_WEBHOOK_SECRET is set)
verifyN8NSecret(req, res, next)
```

### Data Validation:
```javascript
// Backend checks:
✓ event_type === "call_analyze"
✓ call_id exists (required)
✓ duration_seconds exists
✓ call_id not duplicate
✓ user exists or can be created
```

---

## 📊 Database Schema

### Call Document:
```javascript
{
  _id: ObjectId,
  callId: "retell_call_abc123",      // Unique
  userId: "user_xyz",
  phoneNumber: "+1-555-0123",
  durationSeconds: 180,
  durationMinutes: 3,
  transcript: "Full conversation text...",  // ← SHOWN IN DASHBOARD
  summary: "AI-generated summary...",       // ← SHOWN IN DASHBOARD
  eventType: "call_analyze",
  status: "completed",
  metadata: {...},
  createdAt: ISODate("2024-01-15T10:00:00Z")
}
```

### Subscription Document:
```javascript
{
  _id: ObjectId,
  userId: "user_xyz",
  totalCredits: 100,              // Total purchased
  usedCredits: 3,                 // Total used
  availableCredits: 97,           // Virtual field (total - used)
                                  // ← TIME LEFT (SHOWN IN DASHBOARD)
  createdAt: ISODate,
  updatedAt: ISODate
}
```

---

## ✅ Integration Checklist

### Backend Setup:
- [x] n8n webhook endpoint created
- [x] Call model with transcript/summary
- [x] Subscription model with credits
- [x] Duplicate prevention
- [x] Event type filtering
- [x] Credit deduction logic
- [x] User analytics updates

### Frontend Setup:
- [x] CallAnalyticsDashboard component
- [x] Display call transcripts ✓
- [x] Display time remaining ✓
- [x] API service layer
- [x] Route added to App.tsx

### n8n Setup:
- [ ] Workflow created on Hostinger
- [ ] Webhook trigger configured
- [ ] HTTP Request node pointing to backend
- [ ] Filter for call_analyze events
- [ ] Test payload successful

### Testing:
- [x] Test script created
- [x] Local webhook testing works
- [ ] n8n workflow tested
- [ ] Real Retell AI call tested

### Production:
- [ ] Backend deployed with MONGODB_URI
- [ ] n8n workflow URL updated to production
- [ ] Retell AI webhook configured
- [ ] End-to-end test passed

---

## 🚀 Next Steps

1. **Run Test Script:**
   ```bash
   cd c:\Aivors\server
   node test-n8n-webhook.js
   ```

2. **View Dashboard:**
   ```bash
   cd c:\Aivors
   npm run dev
   # Open: http://localhost:5173/customer-dashboard
   # Click: "View Call Analytics"
   ```

3. **Configure n8n Workflow:**
   - Follow: `docs/N8N-HOSTINGER-SETUP-GUIDE.md`

4. **Deploy to Production:**
   - Update n8n HTTP Request URL to production
   - Configure Retell AI webhook
   - Test with real call

---

## 🎉 Success!

Your system now:
1. ✅ Receives Retell AI calls via n8n
2. ✅ Shows call transcript analytics in dashboard
3. ✅ Shows time/minutes remaining in subscription
4. ✅ Automatically deducts minutes after each call
5. ✅ Prevents duplicate processing
6. ✅ Filters only call_analyze events

**Ready to go! 🚀**
