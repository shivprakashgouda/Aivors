# 🚀 QUICK START: Get Dashboard Working NOW

## ⚡ 5-Minute Setup

### Step 1: Start Backend (2 min)
```bash
cd c:\Aivors\server
npm run dev
```

**Expected output:**
```
🚀 Server running on port 3001
✅ Connected to MongoDB
```

---

### Step 2: Test n8n Webhook (1 min)
```bash
cd c:\Aivors\server
node test-n8n-webhook.js
```

**Expected output:**
```
✅ Webhook processed successfully!
✅ Call found in database
✅ Credits deducted
✅ Dashboard shows data
```

This will:
- Create a test call
- Save to MongoDB
- Deduct credits
- Populate dashboard with data

---

### Step 3: Open Dashboard (30 sec)
```bash
cd c:\Aivors
npm run dev
```

Then open: `http://localhost:5173/customer-dashboard`

Click: **"View Call Analytics"**

You should now see:
- ✅ Total Calls: 1
- ✅ Calls Today: 1
- ✅ Credits Remaining: 97 minutes (or similar)
- ✅ Recent call with transcript

---

## 🔗 Connect to Hostinger n8n (5 min)

### Your n8n Webhook URLs:
- **Retell:** `https://n8n.srv971061.hstgr.cloud/webhook/retell-webhook`
- **Subscription:** `https://n8n.srv971061.hstgr.cloud/webhook/subscription`

### In n8n Workflow:

**1. Create Webhook Node:**
- URL: `/webhook/retell-webhook`
- Method: `POST`

**2. Add HTTP Request Node:**
- Method: `POST`
- URL: `YOUR_BACKEND_URL/api/n8n/retell-webhook`
- Body:
  ```json
  {
    "event_type": "{{ $json.event_type }}",
    "call_id": "{{ $json.call_id }}",
    "email": "{{ $json.email }}",
    "phone_number": "{{ $json.phone_number }}",
    "duration_seconds": "{{ $json.duration_seconds }}",
    "transcript": "{{ $json.transcript }}",
    "summary": "{{ $json.summary }}",
    "metadata": "{{ $json.metadata }}",
    "call_start_time": "{{ $json.call_start_time }}",
    "call_end_time": "{{ $json.call_end_time }}"
  }
  ```

**3. Test in n8n:**
Send this payload:
```json
{
  "event_type": "call_analyze",
  "call_id": "test_123",
  "email": "test@example.com",
  "phone_number": "+1-555-0123",
  "duration_seconds": 120,
  "transcript": "Test transcript",
  "summary": "Test summary",
  "metadata": {},
  "call_start_time": "2024-01-15T10:00:00Z",
  "call_end_time": "2024-01-15T10:02:00Z"
}
```

---

## 📊 What You'll See in Dashboard

### Analytics Card:
```
📊 Call Analytics
Total Calls: 1
Calls Today: 1
Average Duration: 3 minutes
```

### Subscription Card:
```
💳 Subscription Status
Credits Remaining: 97 minutes
Total Purchased: 100 minutes
Usage: 3% used
```

### Recent Calls Table:
```
Phone Number    Duration   Date         Actions
+1-555-0123    3 min      Just now     [View Details]
```

### Call Details (click View):
```
📞 Call with +1-555-0123
Duration: 3 minutes
Status: Completed

📝 Transcript:
Customer: Hi, I need help...
AI: Of course! How can I help?

📄 Summary:
Customer requested assistance...
```

---

## 🎯 Key Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/n8n/retell-webhook` | POST | Receive Retell calls from n8n |
| `/api/dashboard/:userId` | GET | Get dashboard stats |
| `/api/calls/user/:userId` | GET | Get user's calls |
| `/api/subscription/:userId` | GET | Get subscription info |
| `/api/n8n/health` | GET | Health check |

---

## 🐛 Quick Fixes

### No data in dashboard?
```bash
# Run test to populate data
node server/test-n8n-webhook.js
```

### Backend not starting?
```bash
# Check MongoDB connection
echo $MONGODB_URI

# Or use local MongoDB
MONGODB_URI=mongodb://localhost:27017/aivors npm run dev
```

### Can't see test user?
```bash
# Create test user
curl -X POST http://localhost:3001/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "role": "customer"
  }'
```

---

## 📁 Important Files

| File | Purpose |
|------|---------|
| `server/routes/n8n.js` | **NEW!** Retell webhook handler |
| `server/test-n8n-webhook.js` | **NEW!** Test script |
| `docs/N8N-HOSTINGER-SETUP-GUIDE.md` | **NEW!** Full setup guide |
| `src/pages/CallAnalyticsDashboard.tsx` | Dashboard UI |
| `server/models/Call.js` | Call data model |
| `server/models/Subscription.js` | Subscription/credits |

---

## ✅ Success Checklist

- [ ] Backend running (port 3001)
- [ ] Test script runs successfully
- [ ] Dashboard shows call data
- [ ] Transcript visible
- [ ] Credits/minutes showing
- [ ] n8n workflow created
- [ ] Test webhook works

---

## 🎉 You're Done!

Your dashboard now shows:
1. ✅ **Call transcript analytics**
2. ✅ **Time/minutes remaining**

Just connect your n8n workflow to start receiving real Retell AI calls!

---

## 📞 Need Help?

1. Check logs: `cd server && npm run dev`
2. Test webhook: `node server/test-n8n-webhook.js`
3. Verify health: `curl http://localhost:3001/api/n8n/health`
4. Read full guide: `docs/N8N-HOSTINGER-SETUP-GUIDE.md`
