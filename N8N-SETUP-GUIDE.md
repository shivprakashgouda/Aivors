# ✅ N8N CONFIGURATION - CORRECT FORMAT

## 🎉 GOOD NEWS: System is Working!

Test call was successfully:
- ✅ Received by webhook
- ✅ Matched to correct user by agent_id  
- ✅ Saved to database
- ✅ Linked to ajinkyamhetre01@gmail.com

## ⚠️ IMPORTANT: Data Format

The webhook expects data in **FLAT structure**, NOT nested!

### ❌ WRONG (Nested):
```json
{
  "event": "call_analyzed",
  "call": {
    "call_id": "xxx",
    "agent_id": "agent_xxx",
    "transcript": "..."
  }
}
```

### ✅ CORRECT (Flat):
```json
{
  "event_type": "call_analyze",
  "call_id": "retell_xxx",
  "agent_id": "agent_2faeaea2dcfa43016ec8aa47a3",
  "from_number": "+1234567890",
  "to_number": "+0987654321",
  "start_timestamp": 1640000000,
  "end_timestamp": 1640000300,
  "transcript": "Full call transcript here",
  "summary": "Call summary",
  "call_analysis": {
    "call_summary": "Detailed summary"
  }
}
```

## 🔧 N8N HTTP REQUEST NODE CONFIGURATION

### Method
```
POST
```

### URL
```
https://aivors-5hvj.onrender.com/api/n8n/retell-webhook
```

### Headers
```
x-n8n-webhook-secret: aivors-secret
Content-Type: application/json
```

### Body Configuration

**Option 1: If Retell sends flat data already**
```
Send Body: All Input Data
```

**Option 2: If Retell sends nested data**

Use a **Code node** or **Set node** BEFORE the HTTP Request to flatten it:

```javascript
// In Code node
const retellData = $input.item.json;

return {
  json: {
    event_type: 'call_analyze',
    call_id: retellData.call?.call_id || retellData.call_id,
    agent_id: retellData.call?.agent_id || retellData.agent_id,
    from_number: retellData.call?.from_number,
    to_number: retellData.call?.to_number,
    start_timestamp: retellData.call?.start_timestamp,
    end_timestamp: retellData.call?.end_timestamp,
    transcript: retellData.call?.transcript || '',
    summary: retellData.call?.call_analysis?.call_summary || '',
    call_analysis: retellData.call?.call_analysis || {}
  }
};
```

## 🧪 TEST YOUR N8N WORKFLOW

### Test Payload

Send this to your n8n webhook to test:

```json
{
  "event_type": "call_analyze",
  "call_id": "test_n8n_123",
  "agent_id": "agent_2faeaea2dcfa43016ec8aa47a3",
  "from_number": "+1234567890",
  "to_number": "+0987654321",
  "start_timestamp": 1640000000,
  "end_timestamp": 1640000300,
  "transcript": "Customer: Hi! AI: Hello, how can I help you?",
  "summary": "Customer inquiry call",
  "call_analysis": {
    "call_summary": "Customer asked about product features"
  }
}
```

### Expected Response

```json
{
  "success": true,
  "message": "Call analyzed and saved successfully",
  "data": {
    "callId": "test_n8n_123",
    "userId": "6931b2a1f8727331edb77095",
    "availableCredits": 100,
    "alerts": {
      "shouldDisableWorkflow": false,
      "lowCredits": false,
      "criticalCredits": false
    }
  }
}
```

## 🎯 WORKFLOW STEPS

```
┌─────────────────────────────┐
│   Retell Webhook Trigger    │
│   (receives call data)      │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  IF/Switch Node (Optional)  │
│  Filter: event = call_end   │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│   Code/Set Node             │
│   Flatten data structure    │
│   Ensure agent_id is set    │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│   HTTP Request              │
│   → Your Backend            │
│   Headers: webhook secret   │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│   IF Node                   │
│   Check: shouldDisable=true │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  Disable Workflow Node      │
│  (when credits = 0)         │
└─────────────────────────────┘
```

## 📋 CHECKLIST

- [ ] N8N HTTP Request URL is correct
- [ ] Header `x-n8n-webhook-secret` is set
- [ ] Data is sent in FLAT format
- [ ] `event_type` = "call_analyze"
- [ ] `agent_id` is included in payload
- [ ] `call_id` is included in payload
- [ ] Test with sample payload above
- [ ] Check response is 200 with success=true
- [ ] Verify call appears in dashboard
- [ ] Test with real Retell call

## 🔍 DEBUGGING

### If calls not appearing:

1. **Check n8n execution logs**
   - Did HTTP Request succeed?
   - What was the response?

2. **Check backend response**
   - Success: `{"success": true, "message": "Call analyzed..."}`
   - Error: Look at error message

3. **Check data format**
   ```bash
   # Run this test
   curl -X POST https://aivors-5hvj.onrender.com/api/n8n/retell-webhook \
     -H "x-n8n-webhook-secret: aivors-secret" \
     -H "Content-Type: application/json" \
     -d '{ ... your payload ... }'
   ```

4. **Verify agent_id**
   - Must be: `agent_2faeaea2dcfa43016ec8aa47a3`
   - Check it's not null or undefined

## 🚀 READY TO GO!

Once n8n is configured:
1. Make a real call on Retell
2. Wait 30-60 seconds
3. Check https://www.aivors.com dashboard
4. Call should appear automatically!

---

**Last Updated:** December 8, 2025
**Status:** ✅ Backend Tested & Working
**Next:** Configure n8n with correct format
