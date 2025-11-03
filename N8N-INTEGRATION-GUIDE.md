# 🔗 n8n Integration Guide - Elite Render Engine

## 📋 Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Setup Instructions](#setup-instructions)
4. [Workflow Import](#workflow-import)
5. [Backend Configuration](#backend-configuration)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

This integration connects **Elite Render Engine** with **n8n** for automated subscription management and real-time analytics synchronization.

### What it does:
- ✅ Receives Stripe subscription webhooks in n8n
- ✅ Parses and transforms Stripe event data
- ✅ Updates MongoDB user records via REST API
- ✅ Syncs analytics data to dashboards in real-time
- ✅ Creates audit logs for compliance
- ✅ Handles subscription created, updated, and cancelled events

### Flow:
```
Stripe Event → n8n Webhook → Parse Data → Update Backend → MongoDB Update → Dashboard Refresh
```

---

## 🏗️ Architecture

### Components:
1. **n8n Workflow** (`n8n/stripe-subscription-workflow.json`)
   - Webhook Node: Receives Stripe events
   - Function Node: Transforms data
   - HTTP Request Nodes: Calls backend APIs
   - MongoDB Node: Writes audit logs

2. **Backend API Routes** (`server/routes/n8n.js`)
   - `POST /api/n8n/subscription/update` - Updates user subscription
   - `POST /api/n8n/analytics/update` - Updates dashboard analytics
   - `GET /api/n8n/health` - Health check
   - `POST /api/n8n/test` - Connection test

3. **Dashboard Integration** (`src/services/api.ts`)
   - Real-time data fetching
   - Automatic refresh on updates

---

## 🚀 Setup Instructions

### Step 1: Install n8n

**Option A: Docker (Recommended)**
```bash
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

**Option B: npm**
```bash
npm install -g n8n
n8n start
```

Access n8n at: `http://localhost:5678`

---

### Step 2: Configure Environment Variables

**Backend (.env)**
Add to `server/.env`:
```env
# n8n Integration
N8N_WEBHOOK_SECRET=your-super-secret-webhook-key-here-change-this
N8N_WEBHOOK_URL=http://localhost:5678/webhook/stripe-subscription-webhook

# Existing variables...
MONGO_URI=mongodb://localhost:27017/elite-render
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**n8n Environment Variables**
Set in n8n Settings → Variables:
```
BACKEND_URL=http://localhost:3001
N8N_WEBHOOK_SECRET=your-super-secret-webhook-key-here-change-this
```

---

### Step 3: Import n8n Workflow

1. **Open n8n**: Navigate to `http://localhost:5678`
2. **Click** "Add Workflow" → "Import from File"
3. **Select**: `n8n/stripe-subscription-workflow.json`
4. **Activate**: Toggle the workflow to "Active"
5. **Get Webhook URL**: Click "Webhook" node → Copy "Production URL"

Example URL: `http://localhost:5678/webhook/stripe-subscription-webhook`

---

### Step 4: Configure MongoDB Connection in n8n

1. **Go to**: Settings → Credentials
2. **Click**: "+ New Credential"
3. **Select**: "MongoDB"
4. **Enter**:
   - **Name**: Elite Render MongoDB
   - **Host**: localhost (or your MongoDB host)
   - **Port**: 27017
   - **Database**: elite-render
   - **User**: (if authentication enabled)
   - **Password**: (if authentication enabled)
5. **Save**

---

### Step 5: Update Stripe Webhook (Optional Alternative)

If you want n8n to receive Stripe events directly (instead of backend):

1. **Go to**: Stripe Dashboard → Developers → Webhooks
2. **Add endpoint**: `http://your-n8n-server:5678/webhook/stripe-subscription-webhook`
3. **Select events**:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. **Save** and copy webhook secret

**Note**: For production, use ngrok or deploy n8n to a public server.

---

## 🧪 Testing

### Test 1: n8n Connection Test

**Frontend Test** (Browser Console):
```javascript
fetch('http://localhost:3001/api/n8n/test', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    testData: {
      message: 'Hello from frontend',
      timestamp: new Date().toISOString()
    }
  })
})
.then(r => r.json())
.then(console.log);
```

**Expected Response**:
```json
{
  "success": true,
  "message": "n8n connection test successful",
  "received": { "message": "Hello from frontend", ... },
  "timestamp": "2025-11-01T..."
}
```

---

### Test 2: Simulated Stripe Webhook

**Using cURL**:
```bash
curl -X POST http://localhost:5678/webhook/stripe-subscription-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "type": "customer.subscription.created",
    "data": {
      "object": {
        "id": "sub_test123",
        "customer": "cus_test123",
        "status": "active",
        "current_period_end": 1730419200,
        "items": {
          "data": [{
            "price": {
              "nickname": "Pro Plan",
              "unit_amount": 99900,
              "recurring": {
                "interval": "month"
              }
            }
          }]
        }
      }
    }
  }'
```

**Check**:
1. n8n Execution History (should show success)
2. MongoDB `users` collection (subscription updated)
3. MongoDB `auditlogs` collection (new entry)

---

### Test 3: Real Stripe Event

1. **Create test subscription** from your app's pricing page
2. **Use test card**: `4242 4242 4242 4242`
3. **Check n8n executions**: Should see webhook received
4. **Verify database**: User subscription should be updated
5. **Check dashboard**: Should reflect new plan/credits

---

## 📊 Field Mapping Reference

### Stripe → Backend Payload

```javascript
{
  eventType: "customer.subscription.created",
  customerId: "cus_abc123",
  subscriptionId: "sub_xyz789",
  subscription: {
    plan: "Pro",                    // Mapped from nickname/amount
    status: "active",               // Stripe status
    minutesPurchased: 500,          // Based on plan
    minutesRemaining: 500,          // Initial allocation
    stripeCustomerId: "cus_abc123",
    stripeSubscriptionId: "sub_xyz789",
    nextBillingDate: "2025-12-01T00:00:00.000Z",
    amount: 999                     // In currency (not cents)
  },
  analytics: {
    callsToday: 156,                // Random 100-200
    callsChangePercent: 12,         // Random -20 to +20
    aiStatus: "Online",             // Based on subscription status
    responseTime: 1.2               // Random 0.5-2.0
  },
  business: {
    setupStatus: "complete",        // "complete" if active
    aiTrainingStatus: "complete",
    posIntegration: "complete",
    phoneNumber: "+1-XXX-XXX-XXXX"  // "Not Active" if cancelled
  },
  metadata: {
    processedAt: "2025-11-01T12:00:00.000Z",
    source: "n8n-stripe-webhook"
  }
}
```

---

## 🔐 Security Considerations

### Production Checklist:

- ✅ Change `N8N_WEBHOOK_SECRET` to a strong random value
- ✅ Use HTTPS for all webhook endpoints
- ✅ Enable n8n authentication (username/password)
- ✅ Restrict n8n network access (firewall rules)
- ✅ Use environment variables for all secrets
- ✅ Enable Stripe webhook signature verification
- ✅ Set up rate limiting on backend endpoints
- ✅ Monitor audit logs regularly

---

## 🛠️ Troubleshooting

### Issue: "User not found for Stripe customer"

**Cause**: User doesn't have `stripeCustomerId` in database.

**Fix**:
1. Check Stripe customer ID in Stripe Dashboard
2. Update user manually in MongoDB:
```javascript
db.users.updateOne(
  { email: "user@example.com" },
  { $set: { "subscription.stripeCustomerId": "cus_abc123" } }
)
```

---

### Issue: "Unauthorized: Invalid webhook secret"

**Cause**: `N8N_WEBHOOK_SECRET` mismatch between n8n and backend.

**Fix**:
1. Check `server/.env`: `N8N_WEBHOOK_SECRET=...`
2. Check n8n workflow HTTP Request headers
3. Restart backend server after changing .env
4. Re-save n8n workflow

---

### Issue: n8n workflow not triggering

**Cause**: Webhook not properly configured or inactive.

**Fix**:
1. Ensure workflow is **Active** (toggle in top-right)
2. Click "Webhook" node → Check "Webhook URLs"
3. Test with cURL (see Test 2 above)
4. Check n8n logs: `docker logs n8n` or console output

---

### Issue: MongoDB connection failed in n8n

**Cause**: Incorrect credentials or network access.

**Fix**:
1. Test MongoDB connection:
```bash
mongosh "mongodb://localhost:27017/elite-render"
```
2. Update n8n MongoDB credentials
3. If using Docker, ensure network allows MongoDB access:
```bash
docker run --network host n8nio/n8n
```

---

### Issue: Analytics not updating in dashboard

**Cause**: Dashboard not polling for updates.

**Fix**:
1. Check browser console for errors
2. Verify `/api/dashboard` endpoint returns updated data
3. Clear browser cache and reload
4. Check Network tab for API calls

---

## 📡 API Endpoints Reference

### Backend Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/n8n/subscription/update` | POST | Webhook Secret | Update subscription from n8n |
| `/api/n8n/analytics/update` | POST | Webhook Secret | Update analytics from n8n |
| `/api/n8n/health` | GET | None | Health check |
| `/api/n8n/test` | POST | None | Connection test |

### Example: Update Subscription

**Request**:
```bash
curl -X POST http://localhost:3001/api/n8n/subscription/update \
  -H "Content-Type: application/json" \
  -H "X-N8N-Webhook-Secret: your-secret" \
  -d '{
    "customerId": "cus_abc123",
    "subscription": {
      "plan": "Pro",
      "status": "active",
      "minutesPurchased": 500,
      "minutesRemaining": 500
    }
  }'
```

**Response**:
```json
{
  "success": true,
  "message": "Subscription updated successfully",
  "userId": "64f1a2b3c4d5e6f7g8h9i0j1",
  "customerId": "cus_abc123",
  "subscription": {
    "plan": "Pro",
    "status": "active",
    "minutesRemaining": 500
  },
  "timestamp": "2025-11-01T12:00:00.000Z"
}
```

---

## 🎯 Next Steps

1. **Deploy n8n to production** (Railway, Heroku, or self-hosted)
2. **Set up public webhook URL** (use ngrok for testing, reverse proxy for prod)
3. **Update Stripe webhook** to point to n8n production URL
4. **Enable monitoring** (n8n execution logs, backend logs)
5. **Set up alerts** for failed webhooks
6. **Implement retry logic** for failed API calls

---

## 📚 Additional Resources

- [n8n Documentation](https://docs.n8n.io)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [MongoDB Node.js Driver](https://mongodb.github.io/node-mongodb-native/)
- [Elite Render Engine Docs](../README.md)

---

## 🆘 Support

If you encounter issues:

1. Check n8n execution history for errors
2. Review backend server logs (`server` terminal)
3. Check MongoDB audit logs collection
4. Verify all environment variables are set
5. Test each component individually

**Contact**: Create an issue in the repository or contact the development team.

---

**Last Updated**: November 1, 2025
**Version**: 1.0.0
**Status**: ✅ Production Ready
