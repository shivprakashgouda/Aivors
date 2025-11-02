# 🧪 n8n Integration Testing Guide

## Test Files

Three test webhook payloads are provided for testing the n8n integration:

1. `test-webhook-created.json` - Subscription created (Pro plan)
2. `test-webhook-updated.json` - Subscription updated (Pro → Enterprise)
3. `test-webhook-cancelled.json` - Subscription cancelled

## Quick Test Commands

### Test 1: Subscription Created

```bash
curl -X POST http://localhost:5678/webhook/stripe-subscription-webhook \
  -H "Content-Type: application/json" \
  -d @n8n/test-webhook-created.json
```

**Expected Result**:
- n8n execution shows success
- MongoDB user updated with Pro plan (500 minutes)
- Analytics: `aiStatus = "Online"`
- Business: `setupStatus = "complete"`

---

### Test 2: Subscription Updated

```bash
curl -X POST http://localhost:5678/webhook/stripe-subscription-webhook \
  -H "Content-Type: application/json" \
  -d @n8n/test-webhook-updated.json
```

**Expected Result**:
- Plan changed from Pro → Enterprise
- Minutes increased from 500 → 2000
- Remaining minutes = previous + difference (1500 added)
- Audit log created

---

### Test 3: Subscription Cancelled

```bash
curl -X POST http://localhost:5678/webhook/stripe-subscription-webhook \
  -H "Content-Type: application/json" \
  -d @n8n/test-webhook-cancelled.json
```

**Expected Result**:
- Plan changed to "Free"
- Status: `cancelled`
- Analytics: `aiStatus = "Offline"`
- Business: `phoneNumber = "Not Active"`
- Minutes reset to 10

---

## PowerShell Testing (Windows)

```powershell
# Test 1: Created
Invoke-RestMethod -Uri "http://localhost:5678/webhook/stripe-subscription-webhook" `
  -Method Post `
  -ContentType "application/json" `
  -Body (Get-Content "n8n\test-webhook-created.json" -Raw)

# Test 2: Updated
Invoke-RestMethod -Uri "http://localhost:5678/webhook/stripe-subscription-webhook" `
  -Method Post `
  -ContentType "application/json" `
  -Body (Get-Content "n8n\test-webhook-updated.json" -Raw)

# Test 3: Cancelled
Invoke-RestMethod -Uri "http://localhost:5678/webhook/stripe-subscription-webhook" `
  -Method Post `
  -ContentType "application/json" `
  -Body (Get-Content "n8n\test-webhook-cancelled.json" -Raw)
```

---

## Verification Steps

After each test:

### 1. Check n8n Execution
- Open n8n: `http://localhost:5678`
- Click "Executions" tab
- Verify latest execution succeeded
- Check each node output

### 2. Check MongoDB
```javascript
// Connect to MongoDB
mongosh "mongodb://localhost:27017/elite-render"

// Check user subscription
db.users.findOne(
  { "subscription.stripeCustomerId": "cus_test_123456789" },
  { subscription: 1, analytics: 1, business: 1 }
)
```

**Expected Fields**:
```javascript
{
  subscription: {
    plan: "Pro" | "Enterprise" | "Free",
    status: "active" | "cancelled",
    minutesPurchased: 500 | 2000 | 10,
    minutesRemaining: 500 | 2000 | 10,
    stripeCustomerId: "cus_test_123456789",
    stripeSubscriptionId: "sub_test_123456789"
  },
  analytics: {
    callsToday: 100-200,
    aiStatus: "Online" | "Offline",
    responseTime: 0.5-2.0
  },
  business: {
    setupStatus: "complete" | "incomplete",
    phoneNumber: "+1-XXX-XXX-XXXX" | "Not Active"
  }
}
```

### 3. Check Audit Logs
```javascript
db.auditlogs.find({ eventType: "SUBSCRIPTION_UPDATED_VIA_N8N" })
  .sort({ createdAt: -1 })
  .limit(5)
```

### 4. Check Backend Logs
Backend terminal should show:
```
✅ Subscription updated for user test@example.com: Pro (active)
✅ Analytics updated for user test@example.com
```

---

## Integration Test Scenarios

### Scenario 1: New Customer Flow

1. **Create user** (if not exists):
```javascript
db.users.insertOne({
  name: "Test User",
  email: "test@example.com",
  passwordHash: "hashed",
  subscription: {
    stripeCustomerId: "cus_test_123456789",
    plan: "Free",
    status: "inactive",
    minutesPurchased: 0,
    minutesRemaining: 0
  }
})
```

2. **Send created webhook**:
```bash
curl -X POST http://localhost:5678/webhook/stripe-subscription-webhook \
  -H "Content-Type: application/json" \
  -d @n8n/test-webhook-created.json
```

3. **Verify**: User now has Pro plan with 500 minutes

---

### Scenario 2: Upgrade Flow

1. **Start with Pro plan** (use created webhook)
2. **Send updated webhook** (Enterprise):
```bash
curl -X POST http://localhost:5678/webhook/stripe-subscription-webhook \
  -H "Content-Type: application/json" \
  -d @n8n/test-webhook-updated.json
```

3. **Verify**:
   - Plan: "Enterprise"
   - Minutes: Previous remaining + 1500 (difference)
   - Status: "active"

---

### Scenario 3: Cancellation Flow

1. **Start with active subscription**
2. **Send cancelled webhook**:
```bash
curl -X POST http://localhost:5678/webhook/stripe-subscription-webhook \
  -H "Content-Type: application/json" \
  -d @n8n/test-webhook-cancelled.json
```

3. **Verify**:
   - Plan: "Free"
   - Status: "cancelled"
   - AI Status: "Offline"
   - Phone: "Not Active"

---

## Backend API Testing

### Test Health Endpoint
```bash
curl http://localhost:3001/api/n8n/health
```

**Expected**:
```json
{
  "success": true,
  "service": "n8n-integration",
  "status": "healthy",
  "timestamp": "2025-11-01T..."
}
```

---

### Test Connection
```bash
curl -X POST http://localhost:3001/api/n8n/test \
  -H "Content-Type: application/json" \
  -d '{"testData": {"source": "curl-test"}}'
```

**Expected**:
```json
{
  "success": true,
  "message": "n8n connection test successful",
  "received": {"source": "curl-test"},
  "timestamp": "2025-11-01T..."
}
```

---

### Test Subscription Update Directly
```bash
curl -X POST http://localhost:3001/api/n8n/subscription/update \
  -H "Content-Type: application/json" \
  -H "X-N8N-Webhook-Secret: your-super-secret-key-change-this" \
  -d '{
    "customerId": "cus_test_123456789",
    "subscription": {
      "plan": "Pro",
      "status": "active",
      "minutesPurchased": 500,
      "minutesRemaining": 500,
      "stripeCustomerId": "cus_test_123456789",
      "stripeSubscriptionId": "sub_test_123456789",
      "nextBillingDate": "2025-12-01T00:00:00.000Z"
    },
    "analytics": {
      "callsToday": 150,
      "aiStatus": "Online",
      "responseTime": 1.5
    }
  }'
```

**Expected**:
```json
{
  "success": true,
  "message": "Subscription updated successfully",
  "userId": "...",
  "subscription": {
    "plan": "Pro",
    "status": "active",
    "minutesRemaining": 500
  }
}
```

---

## Common Issues

### ❌ "User not found for Stripe customer"

**Fix**: Create user with matching customer ID:
```javascript
db.users.updateOne(
  { email: "test@example.com" },
  { $set: { "subscription.stripeCustomerId": "cus_test_123456789" } }
)
```

---

### ❌ "Unauthorized: Invalid webhook secret"

**Fix**: Check `server/.env`:
```env
N8N_WEBHOOK_SECRET=your-super-secret-key-change-this
```

And n8n HTTP Request node headers match.

---

### ❌ n8n workflow not executing

**Fix**:
1. Check workflow is **Active**
2. Click webhook node → verify URL
3. Test with cURL
4. Check n8n logs

---

## Success Criteria

✅ All three webhook types process successfully  
✅ MongoDB user collection updated correctly  
✅ Audit logs created for each event  
✅ n8n executions show green status  
✅ Backend logs show success messages  
✅ No errors in console  
✅ Analytics auto-generated  
✅ Business status updated  

---

## Monitoring

### Check Recent n8n Executions
```bash
# n8n API (if exposed)
curl http://localhost:5678/api/v1/executions?limit=10
```

### Check Recent Audit Logs
```javascript
db.auditlogs.find({ eventType: /N8N/ })
  .sort({ createdAt: -1 })
  .limit(10)
```

### Check Recent User Updates
```javascript
db.users.find({ updatedAt: { $gte: new Date(Date.now() - 3600000) } })
  .sort({ updatedAt: -1 })
```

---

**Ready to test!** Start with the created webhook and work through all three scenarios.
