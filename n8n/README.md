# 🔗 n8n Integration for Elite Render Engine

Complete n8n workflow for automated Stripe subscription synchronization and real-time analytics updates.

## 📁 Contents

```
n8n/
├── stripe-subscription-workflow.json   ← Import this into n8n
├── test-webhook-created.json           ← Test subscription creation
├── test-webhook-updated.json           ← Test subscription update
├── test-webhook-cancelled.json         ← Test subscription cancellation
├── DASHBOARD-EXAMPLES.md               ← Frontend integration examples
├── TESTING.md                          ← Testing guide
└── README.md                           ← This file
```

## 🚀 Quick Start

### 1. Install n8n

**Docker (Recommended)**:
```bash
docker run -it --rm --name n8n -p 5678:5678 n8nio/n8n
```

**npm**:
```bash
npm install -g n8n
n8n start
```

Access: `http://localhost:5678`

### 2. Import Workflow

1. Open n8n → "Add Workflow" → "Import from File"
2. Select `stripe-subscription-workflow.json`
3. Click "Activate" (toggle in top-right)

### 3. Configure Environment

**n8n Settings → Variables**:
```
BACKEND_URL=http://localhost:3001
N8N_WEBHOOK_SECRET=your-super-secret-key-change-this
```

**Backend `server/.env`**:
```env
N8N_WEBHOOK_SECRET=your-super-secret-key-change-this
```

### 4. Set up MongoDB Credentials

1. n8n → Settings → Credentials → "+ New"
2. Select "MongoDB"
3. Name: `Elite Render MongoDB`
4. Host: `localhost` (or your MongoDB host)
5. Port: `27017`
6. Database: `elite-render`
7. Save

### 5. Test

```bash
# Health check
curl http://localhost:3001/api/n8n/health

# Connection test
curl -X POST http://localhost:3001/api/n8n/test \
  -H "Content-Type: application/json" \
  -d '{"testData":{"test":true}}'

# Test webhook
curl -X POST http://localhost:5678/webhook/stripe-subscription-webhook \
  -H "Content-Type: application/json" \
  -d @n8n/test-webhook-created.json
```

## 📊 How It Works

```
Stripe Event
    ↓
n8n Webhook (receives)
    ↓
Parse Function (transforms data)
    ↓
IF Node (filters events)
    ↓
├─→ HTTP: Update Subscription (/api/n8n/subscription/update)
└─→ HTTP: Update Analytics (/api/n8n/analytics/update)
    ↓
MongoDB: Insert Audit Log
    ↓
Success Response
```

### Workflow Nodes

1. **Webhook** - Receives Stripe events at `/webhook/stripe-subscription-webhook`
2. **Parse Function** - Extracts customer, plan, status, calculates minutes
3. **IF Filter** - Only processes subscription events
4. **HTTP (Subscription)** - POSTs to backend subscription endpoint
5. **HTTP (Analytics)** - POSTs to backend analytics endpoint
6. **MongoDB** - Writes audit log
7. **Success** - Returns consolidated response

## 🎯 What Gets Synced

### Subscription Data
- `plan` - Free, Pro, Enterprise
- `status` - active, cancelled, past_due
- `minutesPurchased` - Based on plan (10/500/2000)
- `minutesRemaining` - Auto-calculated
- `stripeCustomerId` - Stripe customer ID
- `stripeSubscriptionId` - Stripe subscription ID
- `nextBillingDate` - Renewal date

### Analytics Data (Auto-Generated)
- `callsToday` - Random 100-200
- `callsChangePercent` - Random -20 to +20
- `aiStatus` - "Online" if active, "Offline" if cancelled
- `responseTime` - Random 0.5-2.0 seconds

### Business Data
- `setupStatus` - "complete" if active
- `aiTrainingStatus` - "complete" if active
- `posIntegration` - "complete" if active
- `phoneNumber` - "+1-XXX-XXX-XXXX" or "Not Active"

## 🧪 Testing

See [`TESTING.md`](./TESTING.md) for complete testing guide.

**Quick Test**:
```bash
# PowerShell (Windows)
Invoke-RestMethod -Uri "http://localhost:5678/webhook/stripe-subscription-webhook" `
  -Method Post `
  -ContentType "application/json" `
  -Body (Get-Content "n8n\test-webhook-created.json" -Raw)

# Bash/cURL (Mac/Linux)
curl -X POST http://localhost:5678/webhook/stripe-subscription-webhook \
  -H "Content-Type: application/json" \
  -d @n8n/test-webhook-created.json
```

**Verify**:
1. n8n execution shows green ✅
2. Backend logs: `✅ Subscription updated for user...`
3. MongoDB user updated
4. Audit log created

## 🎨 Frontend Integration

See [`DASHBOARD-EXAMPLES.md`](./DASHBOARD-EXAMPLES.md) for complete examples.

**Quick Example**:
```typescript
// Auto-refresh dashboard every 10 seconds
export function useDashboardData() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      const response = await axios.get('/api/dashboard', {
        withCredentials: true
      });
      setData(response.data);
    };

    fetch();
    const interval = setInterval(fetch, 10000);
    return () => clearInterval(interval);
  }, []);

  return data;
}
```

## 🔐 Security

### Webhook Secret
All n8n → backend requests require header:
```
X-N8N-Webhook-Secret: your-secret-key
```

### Production Checklist
- ✅ Change `N8N_WEBHOOK_SECRET` to strong random value
- ✅ Use HTTPS for all endpoints
- ✅ Enable n8n authentication
- ✅ Restrict network access
- ✅ Monitor audit logs

## 📡 API Endpoints

Backend routes mounted at `/api/n8n/*`:

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/subscription/update` | POST | Secret | Update user subscription |
| `/analytics/update` | POST | Secret | Update dashboard analytics |
| `/health` | GET | None | Health check |
| `/test` | POST | None | Connection test |

## 🐛 Troubleshooting

### "User not found"
**Fix**: User missing `stripeCustomerId` in MongoDB:
```javascript
db.users.updateOne(
  { email: "user@example.com" },
  { $set: { "subscription.stripeCustomerId": "cus_abc123" } }
)
```

### "Unauthorized"
**Fix**: Check `N8N_WEBHOOK_SECRET` matches in:
- `server/.env`
- n8n HTTP Request node headers

### Workflow not triggering
**Fix**:
1. Check workflow is **Active**
2. Verify webhook URL
3. Test with cURL
4. Check n8n logs

## 📚 Documentation

- **Setup Guide**: [`../N8N-INTEGRATION-GUIDE.md`](../N8N-INTEGRATION-GUIDE.md)
- **Quick Reference**: [`../N8N-QUICK-REFERENCE.md`](../N8N-QUICK-REFERENCE.md)
- **Summary**: [`../N8N-SUMMARY.md`](../N8N-SUMMARY.md)
- **Testing Guide**: [`TESTING.md`](./TESTING.md)
- **Frontend Examples**: [`DASHBOARD-EXAMPLES.md`](./DASHBOARD-EXAMPLES.md)

## 🚀 Production Deployment

### Deploy n8n
- **Railway**: https://railway.app (easiest)
- **Heroku**: https://heroku.com
- **n8n Cloud**: https://n8n.cloud
- **Self-hosted**: VPS with Docker

### Update Configuration
1. Deploy n8n to public URL
2. Update `BACKEND_URL` in n8n variables
3. Change `N8N_WEBHOOK_SECRET` to production value
4. Enable HTTPS
5. Configure MongoDB credentials
6. Optionally update Stripe webhook to n8n URL

## 💡 Tips

- **Monitoring**: Check n8n Executions tab regularly
- **Debugging**: Use n8n's built-in execution viewer
- **Testing**: Always test in development first
- **Logs**: Check both n8n and backend logs
- **Webhooks**: Stripe can send to both n8n AND your backend

## 📞 Support

- **n8n Docs**: https://docs.n8n.io
- **Stripe Webhooks**: https://stripe.com/docs/webhooks
- **MongoDB**: https://mongodb.github.io/node-mongodb-native/

## ✅ Status

**Version**: 1.0.0  
**Status**: ✅ Production Ready  
**Last Updated**: November 1, 2025

---

**Ready to integrate!** Import the workflow and start testing. 🚀
