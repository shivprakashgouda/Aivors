# Airtable Integration - Quick Reference

## 🚀 Quick Start

```bash
cd server
npm install socket.io
npm start
```

## 📝 Environment Variables (.env)

```env
AIRTABLE_BASE=appjg75kO367PZuBV
AIRTABLE_TABLE=Table 1
AIRTABLE_VIEW=Grid view
AIRTABLE_TOKEN=patE6BWA050QJhvVM.4035a443db5b087d8cae3139d0b8beb0390f2f5e8876d58928caca9bef724f1a
```

## 🔗 API Endpoints

### GET Records
```bash
# Single page
curl http://localhost:3001/api/airtable/user123

# All records (auto-pagination)
curl http://localhost:3001/api/airtable/user123?all=true
```

### Webhook
```bash
curl -X POST http://localhost:3001/api/webhook/airtable \
  -H "Content-Type: application/json" \
  -d '{"recordId": "rec123", "owner_id": "user123", "fields": {...}}'
```

## 💻 Frontend Code

```javascript
// Load data
const response = await fetch('http://localhost:3001/api/airtable/user123?all=true');
const data = await response.json();

// Connect WebSocket
const socket = io('http://localhost:3001');
socket.on('connect', () => {
  socket.emit('join', { userId: 'user123' });
});

socket.on('airtable_update', (data) => {
  console.log('Update:', data);
  // Reload your data here
});
```

## 🎨 Demo

Open in browser: `http://localhost:3001/airtable-demo.html`

Or directly: `public/airtable-demo.html`

## 📁 Files Created

```
server/
├── services/airtableService.js     # Airtable API integration
├── routes/airtable.js              # API routes
├── config/socketio.js              # Socket.io setup
├── index.js                        # Updated with Socket.io
└── AIRTABLE-INTEGRATION.md         # Full documentation

public/
└── airtable-demo.html              # Complete demo UI
```

## ✅ Verify Setup

```bash
# Check if Socket.io installed
cd server && npm list socket.io

# Test API
curl http://localhost:3001/api/airtable/user123?all=true

# Check server logs
npm start
# Should see: "AIRTABLE_BASE: ✅ Set"
```

## 🔧 Airtable Webhook Setup

1. Airtable → Automations → Create
2. Trigger: "When record matches conditions"
3. Action: "Send webhook"
4. URL: `https://your-domain.com/api/webhook/airtable`
5. Body:
```json
{
  "recordId": "{{ Record ID }}",
  "owner_id": "{{ owner_id }}",
  "fields": {...}
}
```

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| Token error | Check `.env` has `AIRTABLE_TOKEN` |
| No records | Verify `owner_id` field exists |
| WebSocket fails | Check CORS origins |
| Webhook not working | Use ngrok for local testing |

## 📚 Documentation

Full docs: `server/AIRTABLE-INTEGRATION.md`
