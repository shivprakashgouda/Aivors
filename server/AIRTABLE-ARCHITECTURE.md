# Airtable Integration - Architecture & Flow Diagrams

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         AIRTABLE                                │
│  Base ID: appjg75kO367PZuBV                                     │
│  Table: "Table 1"                                               │
│  View: "Grid view"                                              │
│                                                                 │
│  Records with owner_id field:                                   │
│  ┌────────────────────────────────────────────┐                │
│  │ Record 1: { owner_id: "user123", ... }     │                │
│  │ Record 2: { owner_id: "user456", ... }     │                │
│  │ Record 3: { owner_id: "user123", ... }     │                │
│  └────────────────────────────────────────────┘                │
└──────────────┬──────────────────────────────┬───────────────────┘
               │                              │
               │ HTTP API                     │ Webhook (Automation)
               │ (PAT Token)                  │
               │                              │
┌──────────────▼──────────────────────────────▼───────────────────┐
│              EXPRESS SERVER (PORT 3001)                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              HTTP Server + Socket.io                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  ROUTES (routes/airtable.js)                             │  │
│  │                                                            │  │
│  │  GET /api/airtable/:userId                                │  │
│  │  • Query params: offset, maxRecords, all                  │  │
│  │  • Returns: Filtered records + pagination offset          │  │
│  │                                                            │  │
│  │  POST /api/webhook/airtable                               │  │
│  │  • Receives: Airtable automation payload                  │  │
│  │  • Emits: Socket.io event to user room                    │  │
│  └───────────────────┬──────────────────────────────────────┘  │
│                      │                                          │
│                      ▼                                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  SERVICE (services/airtableService.js)                   │  │
│  │                                                            │  │
│  │  getAirtableRecords(options)                              │  │
│  │  • Makes HTTPS requests to Airtable API                   │  │
│  │  • Uses PAT token from process.env                        │  │
│  │  • Handles pagination with offset parameter               │  │
│  │                                                            │  │
│  │  getRecordsByUserId(userId, options)                      │  │
│  │  • Builds filterByFormula: {owner_id} = 'userId'          │  │
│  │  • Returns single page of results                         │  │
│  │                                                            │  │
│  │  getAllRecordsByUserId(userId, maxRecords)                │  │
│  │  • Automatically fetches all pages                        │  │
│  │  • Follows offset tokens until complete                   │  │
│  └───────────────────┬──────────────────────────────────────┘  │
│                      │                                          │
│                      ▼                                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  SOCKET.IO (config/socketio.js)                          │  │
│  │                                                            │  │
│  │  User Rooms: user_{userId}                                │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐          │  │
│  │  │ user_123   │  │ user_456   │  │ user_789   │          │  │
│  │  │ Client A   │  │ Client B   │  │ Client C   │          │  │
│  │  │ Client D   │  │            │  │            │          │  │
│  │  └────────────┘  └────────────┘  └────────────┘          │  │
│  │                                                            │  │
│  │  Events:                                                   │  │
│  │  • join: Client joins their user room                     │  │
│  │  • leave: Client leaves their user room                   │  │
│  │  • airtable_update: Broadcast to specific room            │  │
│  └───────────────────┬──────────────────────────────────────┘  │
└────────────────────────┬───────────────────────────────────────┘
                         │
                         │ WebSocket Connection
                         ▼
       ┌─────────────────────────────────────────┐
       │         FRONTEND CLIENT                  │
       │  (Browser with Socket.io Client)         │
       │                                          │
       │  1. Load Airtable data via API          │
       │  2. Connect to Socket.io                │
       │  3. Join user room                       │
       │  4. Listen for airtable_update events    │
       │  5. Auto-refresh on updates              │
       └─────────────────────────────────────────┘
```

---

## Data Flow: Load Records

```
User Action: "Load Data" button clicked
   │
   ├─ Step 1: Frontend makes HTTP GET request
   │  GET http://localhost:3001/api/airtable/user123?all=true
   │
   ▼
┌─────────────────────────────────────────┐
│  Express Route: routes/airtable.js      │
│  GET /api/airtable/:userId              │
└──────────┬──────────────────────────────┘
           │
           ├─ Extract userId from path params
           ├─ Extract query params (all=true)
           │
           ▼
┌─────────────────────────────────────────┐
│  Service: airtableService.js            │
│  getAllRecordsByUserId(userId)          │
└──────────┬──────────────────────────────┘
           │
           ├─ Loop: Fetch pages until no more offset
           │
           ▼
┌─────────────────────────────────────────┐
│  getRecordsByUserId(userId, {offset})   │
└──────────┬──────────────────────────────┘
           │
           ├─ Build filterByFormula
           │  {owner_id} = 'user123'
           │
           ▼
┌─────────────────────────────────────────┐
│  getAirtableRecords({                   │
│    filterByFormula,                     │
│    offset                               │
│  })                                     │
└──────────┬──────────────────────────────┘
           │
           ├─ Make HTTPS request to Airtable API
           │  Host: api.airtable.com
           │  Path: /v0/appjg75kO367PZuBV/Table%201
           │  Headers: Authorization: Bearer {PAT}
           │
           ▼
┌─────────────────────────────────────────┐
│  AIRTABLE API                           │
│  Returns:                               │
│  {                                      │
│    records: [...],                      │
│    offset: "itrXXX" (or null if done)   │
│  }                                      │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│  Service accumulates all records        │
│  Continues until offset is null         │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│  Route returns JSON response:           │
│  {                                      │
│    success: true,                       │
│    data: {                              │
│      records: [...],  // All records    │
│      userId: "user123",                 │
│      totalReturned: 25,                 │
│      hasMore: false                     │
│    }                                    │
│  }                                      │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│  Frontend receives response             │
│  Renders records in table               │
│  Updates record count                   │
└─────────────────────────────────────────┘
```

---

## Data Flow: Real-time Update (Webhook)

```
User Action: Update record in Airtable
   │
   ▼
┌─────────────────────────────────────────┐
│  AIRTABLE AUTOMATION                    │
│  Trigger: Record updated                │
│  Action: Send webhook                   │
└──────────┬──────────────────────────────┘
           │
           ├─ POST request to webhook URL
           │  URL: https://your-domain.com/api/webhook/airtable
           │  Body: {
           │    recordId: "recXXX",
           │    owner_id: "user123",
           │    fields: { name: "Updated", status: "Active" }
           │  }
           │
           ▼
┌─────────────────────────────────────────┐
│  Express Route: routes/airtable.js      │
│  POST /api/webhook/airtable             │
└──────────┬──────────────────────────────┘
           │
           ├─ Extract payload from req.body
           ├─ Extract owner_id (userId)
           ├─ Validate userId exists
           │
           ▼
┌─────────────────────────────────────────┐
│  Get Socket.io instance                 │
│  const io = req.app.get('io')           │
└──────────┬──────────────────────────────┘
           │
           ├─ Build room name: "user_user123"
           ├─ Emit event to room
           │
           ▼
┌─────────────────────────────────────────┐
│  io.to('user_user123').emit(            │
│    'airtable_update',                   │
│    {                                    │
│      type: 'record_updated',            │
│      userId: 'user123',                 │
│      recordId: 'recXXX',                │
│      fields: {...},                     │
│      timestamp: '2024-12-09T...'        │
│    }                                    │
│  )                                      │
└──────────┬──────────────────────────────┘
           │
           ├─ Broadcast to all clients in room
           │
           ▼
┌─────────────────────────────────────────┐
│  ALL CLIENTS IN ROOM user_user123       │
│  Receive 'airtable_update' event        │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│  Frontend Socket.io Handler             │
│  socket.on('airtable_update', (data) => {│
│    console.log('Update received!');     │
│    loadData(); // Refresh table         │
│  })                                     │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│  Table automatically refreshes          │
│  User sees updated data instantly       │
│  No page reload needed!                 │
└─────────────────────────────────────────┘
```

---

## Socket.io Connection Flow

```
Frontend Action: "Connect WebSocket" button clicked
   │
   ├─ Initialize Socket.io client
   │  const socket = io('http://localhost:3001')
   │
   ▼
┌─────────────────────────────────────────┐
│  Socket.io Client attempts connection   │
│  Transports: ['websocket', 'polling']   │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│  Server: config/socketio.js             │
│  Event: 'connection'                    │
└──────────┬──────────────────────────────┘
           │
           ├─ New socket created
           ├─ Assign socket.id
           ├─ Log connection
           │
           ▼
┌─────────────────────────────────────────┐
│  Client receives 'connect' event        │
│  socket.on('connect', () => { ... })    │
└──────────┬──────────────────────────────┘
           │
           ├─ Client emits 'join' event
           │  socket.emit('join', { userId: 'user123' })
           │
           ▼
┌─────────────────────────────────────────┐
│  Server receives 'join' event           │
│  socket.on('join', (data) => { ... })   │
└──────────┬──────────────────────────────┘
           │
           ├─ Extract userId from data
           ├─ Build room name: "user_user123"
           ├─ socket.join('user_user123')
           ├─ Log join event
           │
           ▼
┌─────────────────────────────────────────┐
│  Server emits 'joined' confirmation     │
│  socket.emit('joined', {                │
│    roomName: 'user_user123',            │
│    userId: 'user123',                   │
│    message: 'Successfully joined...'    │
│  })                                     │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│  Client receives 'joined' event         │
│  socket.on('joined', (data) => { ... }) │
│  Status indicator turns green           │
│  Log: "Joined room: user_user123"       │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│  CONNECTION ESTABLISHED ✅               │
│  Ready to receive airtable_update events │
└─────────────────────────────────────────┘
```

---

## Room-based Broadcasting

```
Server State: Multiple clients connected
┌─────────────────────────────────────────────────────────┐
│  Socket.io Rooms                                        │
│                                                         │
│  user_user123                                           │
│  ├─ Client A (socket.id: abc123)                       │
│  └─ Client B (socket.id: def456)                       │
│                                                         │
│  user_user456                                           │
│  └─ Client C (socket.id: ghi789)                       │
│                                                         │
│  user_user789                                           │
│  └─ Client D (socket.id: jkl012)                       │
└─────────────────────────────────────────────────────────┘

Webhook received: { owner_id: "user123", ... }
   │
   ├─ Server identifies room: "user_user123"
   ├─ io.to('user_user123').emit('airtable_update', {...})
   │
   ▼
┌─────────────────────────────────────────────────────────┐
│  Broadcast to room user_user123                         │
│  ✅ Client A receives event                             │
│  ✅ Client B receives event                             │
│  ❌ Client C does NOT receive (different room)          │
│  ❌ Client D does NOT receive (different room)          │
└─────────────────────────────────────────────────────────┘

Result: Only users in "user123" room get the update!
```

---

## Environment Configuration Flow

```
Application Startup
   │
   ├─ Load dotenv
   │  require('dotenv').config()
   │
   ▼
┌─────────────────────────────────────────┐
│  Read .env file                         │
│  AIRTABLE_BASE=appjg75kO367PZuBV        │
│  AIRTABLE_TABLE=Table 1                 │
│  AIRTABLE_VIEW=Grid view                │
│  AIRTABLE_TOKEN=patE6BWA050QJhvVM...    │
└──────────┬──────────────────────────────┘
           │
           ├─ Set process.env variables
           │
           ▼
┌─────────────────────────────────────────┐
│  airtableService.js                     │
│  const AIRTABLE_CONFIG = {              │
│    baseId: process.env.AIRTABLE_BASE,   │
│    tableName: process.env.AIRTABLE_TABLE│
│    token: process.env.AIRTABLE_TOKEN    │
│  }                                      │
└──────────┬──────────────────────────────┘
           │
           ├─ Used in all API requests
           ├─ NEVER hardcoded
           │
           ▼
┌─────────────────────────────────────────┐
│  index.js startup validation            │
│  console.log('AIRTABLE_BASE:', ...?)    │
│  console.log('AIRTABLE_TOKEN:', ...?)   │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│  Server ready ✅                         │
│  All credentials loaded securely        │
└─────────────────────────────────────────┘
```

---

## Complete Integration Flow

```
1. User opens browser
      │
      ▼
2. Load demo page
   public/airtable-demo.html
      │
      ├─ Enter userId: "user123"
      ├─ Enter API URL: "http://localhost:3001"
      │
      ▼
3. Click "Load Data"
      │
      ├─ Fetch: GET /api/airtable/user123?all=true
      ├─ Receive: { records: [...], ... }
      ├─ Render: Display records in table
      │
      ▼
4. Click "Connect WebSocket"
      │
      ├─ io('http://localhost:3001')
      ├─ On connect: emit('join', { userId: 'user123' })
      ├─ On joined: Status indicator green
      │
      ▼
5. User updates record in Airtable
      │
      ├─ Airtable Automation triggered
      ├─ Webhook: POST /api/webhook/airtable
      ├─ Server: io.to('user_user123').emit('airtable_update')
      │
      ▼
6. Frontend receives 'airtable_update'
      │
      ├─ Log update in activity console
      ├─ Auto-reload data: loadData()
      ├─ Table refreshes with new data
      │
      ▼
7. User sees updated data instantly! ✨
   No page reload needed!
```

---

## Error Handling Flow

```
API Request Error
   │
   ▼
Try-Catch in Service
   │
   ├─ Airtable API error?
   ├─ Network error?
   ├─ Invalid token?
   │
   ▼
Log detailed error
   │
   ├─ console.error('❌ Error:', error)
   │
   ▼
Throw error with message
   │
   ▼
Route catches error
   │
   ├─ res.status(500).json({
   │     success: false,
   │     error: error.message
   │   })
   │
   ▼
Frontend receives error
   │
   ├─ Display to user
   ├─ Log to console
   ├─ Show in activity log
   │
   ▼
User sees helpful error message
```

---

## Files & Their Roles

```
PROJECT STRUCTURE
│
├─ BACKEND (server/)
│  │
│  ├─ index.js                          # Main server entry point
│  │  ├─ Creates HTTP server
│  │  ├─ Initializes Socket.io
│  │  ├─ Mounts routes
│  │  └─ Starts listening on port
│  │
│  ├─ services/airtableService.js       # Airtable API integration
│  │  ├─ Makes HTTPS requests
│  │  ├─ Handles authentication
│  │  ├─ Implements pagination
│  │  └─ Exports reusable functions
│  │
│  ├─ routes/airtable.js                # HTTP API endpoints
│  │  ├─ GET /api/airtable/:userId
│  │  ├─ POST /api/webhook/airtable
│  │  └─ Emits Socket.io events
│  │
│  └─ config/socketio.js                # WebSocket configuration
│     ├─ Initializes Socket.io server
│     ├─ Manages rooms
│     ├─ Handles join/leave events
│     └─ Exports helper functions
│
├─ FRONTEND (public/)
│  │
│  └─ airtable-demo.html                # Complete demo UI
│     ├─ Fetch API for loading data
│     ├─ Socket.io client for real-time
│     ├─ Dynamic table rendering
│     └─ Activity log console
│
└─ CONFIG
   ├─ .env                              # Environment variables
   │  └─ Contains all credentials
   │
   └─ package.json                      # Dependencies
      └─ socket.io ^4.8.1
```

---

This diagram shows the complete architecture and data flow of the Airtable integration!
