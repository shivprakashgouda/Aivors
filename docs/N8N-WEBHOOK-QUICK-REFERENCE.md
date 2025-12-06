# 🔗 n8n Webhook Integration - Quick Reference

## 📌 Overview

This guide shows how to configure your n8n webhooks to work with the Aivors backend.

## 🎯 Two-Webhook System

### Webhook 1: Retell AI Event Processor
**Purpose**: Receives Retell AI events and saves call data

### Webhook 2: Subscription Credit Manager
**Purpose**: Deducts credits and checks balance

---

## 🔧 Webhook 1: Retell AI Event Processor

### n8n Webhook Node Configuration

**URL**: `https://n8n.srv971061.hstgr.cloud/webhook/retell-webhook`

**Settings**:
- Method: `POST`
- Path: `/retell-webhook`
- Response Mode: `Last Node`
- Response Data: `All Entries`

### Filter Node (IMPORTANT!)

```javascript
// Only process "call_analyze" events
// Retell AI sends 3 events per call, we only want this one

// Item 1 → Filter
{{$json.event_type}} === "call_analyze"

// Skip all other event types
```

### HTTP Request Node

**Configuration**:
- Method: `POST`
- URL: `http://your-backend-server:3001/api/calls/analyze`
- Authentication: None (add JWT if needed)
- Headers: 
  ```
  Content-Type: application/json
  ```

**Body**:
```json
{
  "event_type": "{{$json.event_type}}",
  "call_id": "{{$json.call_id}}",
  "user_id": "{{$json.user_id}}",
  "phone_number": "{{$json.phone_number}}",
  "duration_seconds": "{{$json.duration_seconds}}",
  "transcript": "{{$json.transcript}}",
  "summary": "{{$json.summary}}",
  "metadata": "{{$json.metadata}}",
  "call_start_time": "{{$json.call_start_time}}",
  "call_end_time": "{{$json.call_end_time}}"
}
```

**Or simply forward the entire payload**:
- Body Content Type: `JSON`
- Specify Body: `Using JSON`
- JSON Body: `{{$json}}`

### Expected Response

```json
{
  "success": true,
  "message": "Call analyzed and saved successfully",
  "data": {
    "call": {
      "callId": "call_123456",
      "userId": "user_abc",
      "phoneNumber": "+1234567890",
      "durationMinutes": 3,
      "durationSeconds": 180
    },
    "subscription": {
      "availableCredits": 497,
      "totalCredits": 500,
      "usedCredits": 3,
      "lowBalance": false,
      "stopWorkflow": false
    },
    "nextAction": {
      "shouldUpdateSubscription": true,
      "durationMinutes": 3,
      "userId": "user_abc"
    }
  }
}
```

---

## 🔧 Webhook 2: Subscription Credit Manager

### n8n Webhook Node Configuration

**URL**: `https://n8n.srv971061.hstgr.cloud/webhook/subscription`

**Triggered by**: Webhook 1 success (or manual trigger)

**Settings**:
- Method: `POST`
- Path: `/subscription`
- Response Mode: `Last Node`

### HTTP Request Node

**Configuration**:
- Method: `POST`
- URL: `http://your-backend-server:3001/api/subscription/update`
- Authentication: None (add JWT if needed)
- Headers:
  ```
  Content-Type: application/json
  ```

**Body (Option 1 - From Webhook 1 Response)**:
```json
{
  "userId": "{{$node['HTTP Request'].json.data.call.userId}}",
  "durationMinutes": "{{$node['HTTP Request'].json.data.call.durationMinutes}}"
}
```

**Body (Option 2 - From Direct Webhook)**:
```json
{
  "userId": "{{$json.userId}}",
  "durationMinutes": "{{$json.durationMinutes}}"
}
```

**Body (Option 3 - Using duration_seconds)**:
```json
{
  "userId": "{{$json.userId}}",
  "durationSeconds": "{{$json.durationSeconds}}"
}
```

### Expected Response

```json
{
  "success": true,
  "message": "Subscription updated successfully",
  "data": {
    "userId": "user_abc",
    "subscription": {
      "totalCredits": 500,
      "usedCredits": 3,
      "availableCredits": 497,
      "status": "active"
    },
    "deductedMinutes": 3,
    "lowBalance": false,
    "stopWorkflow": false,
    "creditsRemaining": 497,
    "alerts": {
      "shouldDisableWorkflow": false,
      "shouldNotifyLowBalance": false,
      "message": "Subscription updated. 497 minutes remaining"
    }
  }
}
```

---

## 🚨 Alert Handling

### IF Node - Check Flags

**Add an IF node after Webhook 2 to check the response**:

```javascript
// Condition 1: Stop Workflow (No Credits)
{{$json.data.stopWorkflow}} === true

// Condition 2: Low Balance Warning
{{$json.data.lowBalance}} === true
```

### Action: No Credits (stopWorkflow = true)

```javascript
// When stopWorkflow is true:
// 1. Disable the Retell AI webhook workflow
// 2. Send admin notification
// 3. Log the event

// Example notification:
{
  "subject": "⚠️ No Credits Remaining",
  "message": "User {{$json.data.userId}} has no credits. Workflow disabled.",
  "credits": "{{$json.data.subscription.availableCredits}}"
}
```

### Action: Low Balance (lowBalance = true)

```javascript
// When lowBalance is true:
// 1. Send notification to user
// 2. Log the warning

// Example notification:
{
  "subject": "🔔 Low Balance Alert",
  "message": "You have {{$json.data.creditsRemaining}} minutes remaining",
  "action": "Add credits to continue service"
}
```

---

## 📋 Complete n8n Workflow

```
1. Webhook Trigger (Retell AI)
   ↓
2. Filter Node (event_type === "call_analyze")
   ↓ YES
3. HTTP Request (POST /api/calls/analyze)
   ↓
4. HTTP Request (POST /api/subscription/update)
   ↓
5. IF Node (Check stopWorkflow)
   ↓ TRUE
6a. Disable Workflow
6b. Send Admin Alert
   ↓ FALSE
7. IF Node (Check lowBalance)
   ↓ TRUE
8. Send User Notification
   ↓ FALSE
9. Success (End)
```

---

## 🧪 Testing n8n Webhooks

### Test Webhook 1: Call Analyze

```bash
curl -X POST https://n8n.srv971061.hstgr.cloud/webhook/retell-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "call_analyze",
    "call_id": "test_call_001",
    "user_id": "test_user_123",
    "phone_number": "+1234567890",
    "duration_seconds": 180,
    "transcript": "Test transcript",
    "summary": "Test summary"
  }'
```

### Test Webhook 2: Subscription Update

```bash
curl -X POST https://n8n.srv971061.hstgr.cloud/webhook/subscription \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user_123",
    "durationMinutes": 3
  }'
```

---

## 🔍 Debugging Tips

### 1. Check n8n Execution Logs
- Go to n8n → Executions
- Look for errors in each node
- Check the input/output data

### 2. Check Backend Logs
```bash
# In your server terminal
# You should see:
[TIMESTAMP] [CALL_ANALYZE_START] {...}
[TIMESTAMP] [CALL_SAVED] {...}
[TIMESTAMP] [SUBSCRIPTION_UPDATE_START] {...}
[TIMESTAMP] [CREDITS_DEDUCTED] {...}
```

### 3. Test Backend Directly
```bash
# Bypass n8n and test backend directly
curl -X POST http://localhost:3001/api/calls/analyze \
  -H "Content-Type: application/json" \
  -d '{"event_type":"call_analyze","call_id":"test001",...}'
```

### 4. Common Issues

**Issue**: Webhook not triggering
- **Solution**: Check Retell AI webhook URL configuration
- **Solution**: Verify n8n webhook is active

**Issue**: event_type filter not working
- **Solution**: Check the filter expression syntax
- **Solution**: Log the incoming data to see actual field names

**Issue**: Credits not deducting
- **Solution**: Verify userId matches between calls
- **Solution**: Check subscription exists in database

**Issue**: Duplicate calls processed
- **Solution**: Ensure checkDuplicateCall middleware is active
- **Solution**: Verify call_id is unique

---

## 📊 Monitoring

### Key Metrics to Track

1. **Total Calls Processed**: Count of successful /api/calls/analyze
2. **Failed Calls**: Errors in call processing
3. **Credits Deducted**: Sum of minutes deducted
4. **Low Balance Alerts**: Count of lowBalance flags
5. **Workflow Stops**: Count of stopWorkflow flags

### n8n Webhook Health Check

Create a separate webhook for health monitoring:

```javascript
// GET https://n8n.srv971061.hstgr.cloud/webhook/health

{
  "status": "ok",
  "webhook1": "active",
  "webhook2": "active",
  "lastProcessed": "2025-12-06T10:30:00Z"
}
```

---

## 🔐 Security Best Practices

1. **Validate Webhook Signatures**: Add signature verification in n8n
2. **Use HTTPS**: Always use HTTPS for webhooks
3. **Rate Limiting**: Configure rate limits in n8n
4. **Authentication**: Add JWT tokens for backend requests
5. **IP Whitelist**: Restrict webhook access to known IPs

---

## 📞 Quick Links

- **Backend API Guide**: `docs/CALL-ANALYTICS-API-GUIDE.md`
- **Implementation Summary**: `docs/CALL-ANALYTICS-IMPLEMENTATION-SUMMARY.md`
- **Test Suite**: `server/test-call-analytics.js`

---

**Need Help?** Check backend logs and n8n execution history for detailed error messages.
