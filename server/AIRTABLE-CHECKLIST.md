# ✅ Airtable Integration - Setup Checklist

## Pre-Flight Checks

### 1. Environment Configuration ✅
- [x] `AIRTABLE_BASE` set in `.env`
- [x] `AIRTABLE_TABLE` set in `.env`
- [x] `AIRTABLE_VIEW` set in `.env`
- [x] `AIRTABLE_TOKEN` set in `.env`

### 2. Dependencies ✅
- [x] `socket.io` package installed
- [x] All other dependencies installed (`npm install`)

### 3. Files Created ✅
- [x] `services/airtableService.js` - Airtable API service
- [x] `routes/airtable.js` - API routes
- [x] `config/socketio.js` - Socket.io configuration
- [x] `public/airtable-demo.html` - Demo UI
- [x] `test-airtable-integration.js` - Test script

### 4. Server Configuration ✅
- [x] `index.js` updated with Socket.io
- [x] Airtable routes mounted
- [x] CSRF exemptions added
- [x] Environment variables validated

---

## Quick Start

### 1. Test Connection
```bash
cd server
node test-airtable-integration.js
```

Expected: ✅ All tests passed

### 2. Start Server
```bash
npm start
```

Expected output should include:
```
🚀 Server running on http://localhost:3001
🔌 Socket.io server ready for WebSocket connections
   - AIRTABLE_BASE: ✅ Set
   - AIRTABLE_TABLE: ✅ Set
   - AIRTABLE_TOKEN: ✅ Set
```

### 3. Test API Endpoint
```bash
curl http://localhost:3001/api/airtable/user123?all=true
```

Expected: JSON response with records (or empty array if no records exist)

### 4. Open Demo
Browser: `http://localhost:3001/airtable-demo.html`

Or directly: `public/airtable-demo.html`

Expected: 
- Demo page loads
- Can enter User ID
- Can load data
- Can connect WebSocket

---

## Verification Steps

### API Test ✅
```bash
# Should return JSON with success: true
curl http://localhost:3001/api/airtable/user123?all=true
```

### Webhook Test ✅
```bash
# Should return 200 OK
curl -X POST http://localhost:3001/api/webhook/airtable \
  -H "Content-Type: application/json" \
  -d '{"recordId":"test123","owner_id":"user123","fields":{"name":"Test"}}'
```

### Socket.io Test ✅
Open browser console:
```javascript
const socket = io('http://localhost:3001');
socket.on('connect', () => console.log('✅ Connected'));
socket.emit('join', { userId: 'user123' });
socket.on('joined', (data) => console.log('✅ Joined:', data));
```

---

## Common Issues & Solutions

### ❌ "AIRTABLE_TOKEN is not configured"
**Solution:** Check `server/.env` file has the token set

### ❌ "No records found"
**Solution:** Add records to Airtable with `owner_id` field = "user123"

### ❌ "Connection refused"
**Solution:** Make sure server is running (`npm start`)

### ❌ "CORS error"
**Solution:** Add your frontend URL to `CORS_ORIGINS` in `.env`

---

## Airtable Setup

### Add owner_id Field (If Not Exists)
1. Open Airtable base
2. Add new field: `owner_id` (Single line text)
3. Add test record with `owner_id = "user123"`

### Set Up Webhook (Optional - For Real-time Updates)
1. Airtable → Automations → Create
2. Trigger: "When record matches conditions"
3. Action: "Send webhook"
4. URL: `https://your-domain.com/api/webhook/airtable`
5. Method: POST
6. Body:
```json
{
  "recordId": "{{ Record ID }}",
  "owner_id": "{{ owner_id }}",
  "fields": {
    "name": "{{ name }}",
    "status": "{{ status }}"
  }
}
```

**For Local Development:** Use [ngrok](https://ngrok.com) to expose localhost

---

## Documentation Files

- 📘 **Full Guide**: `server/AIRTABLE-INTEGRATION.md`
- 📗 **Quick Reference**: `server/AIRTABLE-QUICK-START.md`
- 📙 **Implementation Summary**: `server/AIRTABLE-IMPLEMENTATION-SUMMARY.md`
- 📋 **This Checklist**: `server/AIRTABLE-CHECKLIST.md`

---

## API Endpoints

✅ `GET /api/airtable/:userId` - Fetch records
✅ `POST /api/webhook/airtable` - Receive webhooks

## Socket.io Events

✅ Client → Server: `join`, `leave`
✅ Server → Client: `joined`, `airtable_update`

---

## Files Structure

```
server/
├── services/
│   └── airtableService.js          ✅ Created
├── routes/
│   └── airtable.js                 ✅ Created
├── config/
│   └── socketio.js                 ✅ Created
├── index.js                        ✅ Updated
├── .env                            ✅ Updated
├── .env.example                    ✅ Updated
├── package.json                    ✅ Updated (socket.io added)
├── test-airtable-integration.js    ✅ Created
├── AIRTABLE-INTEGRATION.md         ✅ Created
├── AIRTABLE-QUICK-START.md         ✅ Created
├── AIRTABLE-IMPLEMENTATION-SUMMARY.md ✅ Created
└── AIRTABLE-CHECKLIST.md           ✅ Created

public/
└── airtable-demo.html              ✅ Created
```

---

## Final Status

🎉 **All components created and ready to use!**

### What's Working:
- ✅ Airtable API connection
- ✅ Record filtering by owner_id
- ✅ Pagination support
- ✅ Socket.io real-time updates
- ✅ Webhook endpoint
- ✅ Demo UI
- ✅ Complete documentation

### Next Actions:
1. ✅ Test with: `node test-airtable-integration.js`
2. ✅ Start server: `npm start`
3. ✅ Open demo: `http://localhost:3001/airtable-demo.html`
4. 🔄 Set up Airtable webhook (optional)
5. 🔄 Integrate with your frontend

---

## Support

If you encounter issues:
1. Check server logs for errors
2. Verify environment variables in `.env`
3. Test with the provided test script
4. Review the troubleshooting section in `AIRTABLE-INTEGRATION.md`

---

**Everything is configured and ready to use! 🚀**
