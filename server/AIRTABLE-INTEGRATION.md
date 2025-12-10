# Airtable Integration with Real-time Updates

Complete Node.js backend integration with Airtable API and Socket.io for real-time updates.

## 📋 Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Setup](#setup)
- [API Endpoints](#api-endpoints)
- [Socket.io Events](#socketio-events)
- [Frontend Integration](#frontend-integration)
- [Airtable Webhook Setup](#airtable-webhook-setup)
- [Testing](#testing)

---

## ✨ Features

- ✅ **Airtable API Integration** - Connect to Airtable using Personal Access Token (PAT)
- ✅ **Filtered Queries** - Fetch records filtered by `owner_id` using `filterByFormula`
- ✅ **Automatic Pagination** - Handle large datasets with built-in pagination support
- ✅ **Real-time Updates** - Socket.io WebSocket for instant updates to connected clients
- ✅ **User Rooms** - Each user joins their own room (`user_{userId}`) for targeted updates
- ✅ **Webhook Endpoint** - Receive updates from Airtable Automations
- ✅ **Production Ready** - Clean code, error handling, and comprehensive logging
- ✅ **Security First** - No hardcoded tokens, all credentials from environment variables

---

## 🏗️ Architecture

```
┌─────────────────┐
│   Airtable      │
│   Automation    │
│   (Webhook)     │
└────────┬────────┘
         │
         │ POST /api/webhook/airtable
         │
         ▼
┌─────────────────────────────────────────┐
│  Express Server (index.js)              │
│  ┌───────────────────────────────────┐  │
│  │  Routes (routes/airtable.js)      │  │
│  │  - GET /api/airtable/:userId      │  │
│  │  - POST /api/webhook/airtable     │  │
│  └─────────────┬─────────────────────┘  │
│                │                         │
│                ▼                         │
│  ┌───────────────────────────────────┐  │
│  │  Service (services/airtable.js)   │  │
│  │  - getAirtableRecords()           │  │
│  │  - getRecordsByUserId()           │  │
│  │  - getAllRecordsByUserId()        │  │
│  └─────────────┬─────────────────────┘  │
│                │                         │
│                ▼                         │
│  ┌───────────────────────────────────┐  │
│  │  Socket.io (config/socketio.js)   │  │
│  │  - User Rooms: user_{userId}      │  │
│  │  - Event: 'airtable_update'       │  │
│  └───────────────────────────────────┘  │
└─────────────────┬───────────────────────┘
                  │
                  │ WebSocket
                  ▼
         ┌────────────────┐
         │  Frontend      │
         │  - Socket.io   │
         │  - Join Room   │
         │  - Listen      │
         └────────────────┘
```

---

## 🚀 Setup

### 1. Install Dependencies

The `socket.io` package has already been installed. If you need to reinstall:

```bash
cd server
npm install socket.io
```

### 2. Configure Environment Variables

Add these variables to your `server/.env` file:

```env
# Airtable Configuration
AIRTABLE_BASE=appjg75kO367PZuBV
AIRTABLE_TABLE=Table 1
AIRTABLE_VIEW=Grid view
AIRTABLE_TOKEN=patE6BWA050QJhvVM.4035a443db5b087d8cae3139d0b8beb0390f2f5e8876d58928caca9bef724f1a
```

**Important**: Never commit the `.env` file to version control! The token is already configured in your `.env` file.

### 3. Get Your Airtable Personal Access Token

If you need to create a new token:

1. Go to https://airtable.com/create/tokens
2. Click **Create token**
3. Give it a name (e.g., "Aivors Backend Integration")
4. Add these scopes:
   - `data.records:read`
   - `data.records:write` (if you need to update records)
   - `schema.bases:read`
5. Add access to your base (`appjg75kO367PZuBV`)
6. Create token and copy the PAT
7. Update `AIRTABLE_TOKEN` in your `.env` file

### 4. Start the Server

```bash
cd server
npm start
```

You should see:

```
🚀 Server running on http://localhost:3001
🔌 Socket.io server ready for WebSocket connections
...
   Airtable:
   - GET  http://localhost:3001/api/airtable/:userId
   - POST http://localhost:3001/api/webhook/airtable
...
   - AIRTABLE_BASE: ✅ Set
   - AIRTABLE_TABLE: ✅ Set
   - AIRTABLE_TOKEN: ✅ Set
```

---

## 📡 API Endpoints

### GET /api/airtable/:userId

Fetch all Airtable records for a specific user.

**Path Parameters:**
- `userId` - The user ID to filter records by (matches `owner_id` field in Airtable)

**Query Parameters:**
- `offset` (optional) - Pagination offset from previous response
- `maxRecords` (optional) - Maximum records per page
- `all` (optional) - If `true`, fetches all pages automatically

**Example Request:**

```bash
# Fetch first page
curl http://localhost:3001/api/airtable/user123

# Fetch all records (automatic pagination)
curl http://localhost:3001/api/airtable/user123?all=true

# Fetch with pagination
curl http://localhost:3001/api/airtable/user123?offset=itrXXXXXXX&maxRecords=10
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "records": [
      {
        "id": "recXXXXXXXXXX",
        "fields": {
          "owner_id": "user123",
          "name": "Sample Record",
          "status": "Active",
          "created_date": "2024-01-15"
        },
        "createdTime": "2024-01-15T10:30:00.000Z"
      }
    ],
    "offset": "itrYYYYYYYYYY",
    "userId": "user123",
    "totalReturned": 1,
    "hasMore": true
  }
}
```

---

### POST /api/webhook/airtable

Webhook endpoint for receiving updates from Airtable Automations.

**Expected Payload:**

```json
{
  "recordId": "recXXXXXXXXXX",
  "owner_id": "user123",
  "fields": {
    "name": "Updated Record",
    "status": "Modified"
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Webhook received and processed",
  "userId": "user123",
  "recordId": "recXXXXXXXXXX"
}
```

**What it does:**
1. Receives the webhook payload
2. Extracts `owner_id` (userId)
3. Broadcasts update to all clients in room `user_{userId}` via Socket.io
4. Connected clients receive `airtable_update` event

---

## 🔌 Socket.io Events

### Client → Server Events

#### `join`
Join a user's room to receive their updates.

```javascript
socket.emit('join', { userId: 'user123' });
```

**Response:** `joined` event with confirmation

#### `leave`
Leave a user's room.

```javascript
socket.emit('leave', { userId: 'user123' });
```

---

### Server → Client Events

#### `joined`
Confirmation that client joined a room.

```javascript
socket.on('joined', (data) => {
  console.log(data.roomName); // "user_123"
  console.log(data.message);  // "Successfully joined room..."
});
```

#### `airtable_update`
Real-time update when Airtable record changes.

```javascript
socket.on('airtable_update', (data) => {
  console.log(data.type);      // "record_updated"
  console.log(data.userId);    // "user123"
  console.log(data.recordId);  // "recXXXXXXXXXX"
  console.log(data.fields);    // { name: "...", status: "..." }
  console.log(data.timestamp); // ISO timestamp
});
```

---

## 💻 Frontend Integration

### Example HTML/JavaScript

A complete demo is available at `public/airtable-demo.html`. Here's a minimal example:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Airtable Integration</title>
    <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
</head>
<body>
    <h1>Airtable Real-time Demo</h1>
    
    <button onclick="loadData()">Load Data</button>
    <button onclick="connectWebSocket()">Connect WebSocket</button>
    
    <div id="records"></div>
    <div id="updates"></div>

    <script>
        const API_URL = 'http://localhost:3001';
        const USER_ID = 'user123';
        let socket;

        // Load data from API
        async function loadData() {
            const response = await fetch(`${API_URL}/api/airtable/${USER_ID}?all=true`);
            const result = await response.json();
            
            document.getElementById('records').innerHTML = 
                `<h2>Records (${result.data.records.length})</h2>` +
                `<pre>${JSON.stringify(result.data.records, null, 2)}</pre>`;
        }

        // Connect to WebSocket
        function connectWebSocket() {
            socket = io(API_URL);

            socket.on('connect', () => {
                console.log('Connected!');
                socket.emit('join', { userId: USER_ID });
            });

            socket.on('joined', (data) => {
                console.log('Joined room:', data.roomName);
            });

            socket.on('airtable_update', (data) => {
                console.log('Update received:', data);
                document.getElementById('updates').innerHTML = 
                    `<h2>Latest Update</h2>` +
                    `<pre>${JSON.stringify(data, null, 2)}</pre>`;
                
                // Reload data to show changes
                loadData();
            });
        }
    </script>
</body>
</html>
```

### View the Demo

1. Start the server: `cd server && npm start`
2. Open in browser: `http://localhost:3001/airtable-demo.html`
   - Or open the file directly: `public/airtable-demo.html`

---

## 🔗 Airtable Webhook Setup

To enable real-time updates, configure an Airtable Automation:

### Step 1: Create Automation in Airtable

1. Open your Airtable base
2. Click **Automations** in the top-right
3. Click **Create automation**

### Step 2: Configure Trigger

- **Trigger**: "When record matches conditions"
- **Table**: Your table (e.g., "Table 1")
- **Conditions**: Configure when to trigger (e.g., when any field changes)

### Step 3: Configure Action

- **Action**: "Send webhook"
- **URL**: `https://your-domain.com/api/webhook/airtable`
  - For development: Use ngrok to expose localhost
  - For production: Use your deployed server URL

- **Method**: POST
- **Content-Type**: application/json
- **Body**:
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

### Step 4: Test

1. Turn on the automation
2. Update a record in Airtable
3. Check your server logs for webhook receipt
4. Connected clients should receive `airtable_update` event

### Development Testing with ngrok

```bash
# Install ngrok: https://ngrok.com/download
# Expose local server
ngrok http 3001

# Use the ngrok URL in Airtable webhook
# Example: https://abcd1234.ngrok.io/api/webhook/airtable
```

---

## 🧪 Testing

### Test API Endpoint

```bash
# Test GET endpoint
curl http://localhost:3001/api/airtable/user123?all=true

# Test webhook endpoint
curl -X POST http://localhost:3001/api/webhook/airtable \
  -H "Content-Type: application/json" \
  -d '{
    "recordId": "recTest123",
    "owner_id": "user123",
    "fields": {
      "name": "Test Record",
      "status": "Testing"
    }
  }'
```

### Test Socket.io Connection

Open browser console and run:

```javascript
const socket = io('http://localhost:3001');

socket.on('connect', () => {
  console.log('Connected:', socket.id);
  socket.emit('join', { userId: 'user123' });
});

socket.on('joined', (data) => {
  console.log('Joined room:', data);
});

socket.on('airtable_update', (data) => {
  console.log('Update received:', data);
});
```

---

## 📁 Project Structure

```
server/
├── index.js                    # Main server file (updated with Socket.io)
├── config/
│   └── socketio.js            # Socket.io configuration
├── routes/
│   └── airtable.js            # Airtable API routes
├── services/
│   └── airtableService.js     # Airtable service with reusable functions
├── .env                        # Environment variables (DO NOT COMMIT!)
└── .env.example               # Example environment file

public/
└── airtable-demo.html         # Complete frontend demo
```

---

## 🔒 Security Best Practices

1. **Never hardcode tokens** - Always use `process.env.AIRTABLE_TOKEN`
2. **Don't commit .env** - Add to `.gitignore`
3. **Use HTTPS in production** - Especially for webhooks
4. **Validate webhook payloads** - Check for required fields
5. **Rate limiting** - Already implemented in the server
6. **CORS configuration** - Already configured for your domains

---

## 🐛 Troubleshooting

### "AIRTABLE_TOKEN is not configured"

- Check that `.env` file exists in `server/` directory
- Verify `AIRTABLE_TOKEN` is set in `.env`
- Restart the server after changing `.env`

### "No records found"

- Verify the `owner_id` field exists in your Airtable table
- Check that records have `owner_id` matching your userId
- Test with `filterByFormula` directly in Airtable to verify syntax

### "WebSocket connection failed"

- Check that server is running
- Verify CORS origins include your frontend URL
- Check browser console for specific error messages

### "Webhook not received"

- Verify webhook URL is correct
- Check Airtable automation is active
- Look at server logs for incoming requests
- Use ngrok for local development testing

---

## 📚 API Reference

### Airtable Service Functions

#### `getAirtableRecords(options)`

Reusable function for fetching Airtable records with pagination.

**Parameters:**
```javascript
{
  filterByFormula: string,  // Airtable formula
  view: string,             // View name
  offset: string,           // Pagination offset
  maxRecords: number,       // Max records per page
  fields: string[]          // Specific fields to return
}
```

**Returns:**
```javascript
{
  records: Array,   // Airtable records
  offset: string    // Next page offset (null if no more)
}
```

#### `getRecordsByUserId(userId, options)`

Get records filtered by `owner_id = userId`.

#### `getAllRecordsByUserId(userId, maxRecords)`

Get ALL records for a user with automatic pagination.

---

## 🎉 Success!

Your Airtable integration is complete! You now have:

✅ API endpoint to fetch filtered Airtable records  
✅ Automatic pagination support  
✅ Real-time updates via Socket.io  
✅ Webhook endpoint for Airtable Automations  
✅ Production-ready code with proper error handling  
✅ Complete frontend demo  

---

## 📞 Support

For issues or questions:
- Check the troubleshooting section above
- Review server logs for detailed error messages
- Test with the demo HTML file first

## 🔗 Resources

- [Airtable API Documentation](https://airtable.com/developers/web/api/introduction)
- [Socket.io Documentation](https://socket.io/docs/v4/)
- [Airtable Personal Access Tokens](https://airtable.com/create/tokens)
