# 🗄️ MongoDB Deployment Guide

## Pre-Deployment Setup

### 1. Run MongoDB Setup Script

**Before deploying to production**, run this script locally or on Render:

```bash
cd server
node setup-mongodb.js
```

This script will:
- ✅ Connect to your MongoDB Atlas cluster
- ✅ Create required indexes on the `calls` collection
- ✅ Verify database structure
- ✅ Check user phone numbers
- ✅ Test query performance

**Expected Output:**
```
🔧 MongoDB Setup Script
========================

📡 Connecting to MongoDB...
✅ Connected to MongoDB successfully

📊 Database: aivors-prod

🔨 Creating indexes for "calls" collection...
   ✅ Created index: callId (unique)
   ✅ Created index: email
   ✅ Created index: createdAt
   ✅ Created compound index: { email: 1, createdAt: -1 }

🔍 Verifying indexes...
   Active indexes:
   - _id_: {"_id":1}
   - callId_1: {"callId":1}
   - email_1: {"email":1}
   - createdAt_1: {"createdAt":1}
   - email_1_createdAt_-1: {"email":1,"createdAt":-1}

✅ MongoDB Setup Complete!
```

---

## Environment Variables for Render

Set these in Render Dashboard → Environment:

### Required
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/aivors?retryWrites=true&w=majority
```

### Optional (for better connection handling)
```bash
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/aivors?retryWrites=true&w=majority
```

**Note:** Both `MONGODB_URI` and `MONGO_URI` work (script checks both).

---

## Automatic Index Creation

Indexes are **automatically created** on server startup via `server/config/db.js`.

This happens when:
- Server starts for the first time
- You deploy to Render
- You restart the server

**No manual intervention needed** - indexes sync automatically! ✨

---

## MongoDB Atlas Configuration

### 1. Network Access

**Add Render IP to whitelist:**

Option A: Allow all (easiest for Render)
```
0.0.0.0/0
```

Option B: Add Render's IP ranges (more secure)
- Get IPs from Render dashboard
- Add each IP to Atlas Network Access

### 2. Database User

Ensure user has **read/write** permissions:
```
Role: readWrite
Database: aivors (or your database name)
```

### 3. Connection String

Format:
```
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
```

**Replace:**
- `<username>` - Your database username
- `<password>` - Your database password (URL encode special chars!)
- `<cluster>` - Your Atlas cluster name
- `<database>` - Your database name (e.g., "aivors")

---

## Required Indexes

The system creates these indexes automatically:

### On `calls` collection:

| Index Name | Fields | Type | Purpose |
|------------|--------|------|---------|
| `callId_1` | `{ callId: 1 }` | Unique | Prevent duplicate calls |
| `email_1` | `{ email: 1 }` | Regular | Fast user lookups |
| `createdAt_1` | `{ createdAt: 1 }` | Regular | Sort by date |
| `email_1_createdAt_-1` | `{ email: 1, createdAt: -1 }` | Compound | Optimized user+date queries |

---

## Verify Setup After Deployment

### 1. Check Render Logs

Look for these lines in Render logs:
```
✅ MongoDB Connected: cluster.mongodb.net
🔨 Ensuring MongoDB indexes...
✅ Call indexes synchronized
```

### 2. Test Webhook Endpoint

```bash
curl -X POST https://your-app.onrender.com/webhook/retell \
  -H "Content-Type: application/json" \
  -d '{
    "callId": "test_prod_123",
    "phoneNumber": "+14095551234",
    "transcript": "Production test call",
    "summary": "Testing production deployment",
    "durationSeconds": 30
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Call data saved successfully",
  "callId": "test_prod_123",
  "email": "user@example.com"
}
```

### 3. Check MongoDB Atlas

Login to Atlas → Browse Collections → `calls`:

You should see the test call with:
- `callId`: "test_prod_123"
- `email`: (resolved from phone number)
- `phoneNumber`: "+14095551234"
- `createdAt`: (timestamp)

---

## Common Issues & Solutions

### Issue: "MongoServerError: Index already exists with different options"

**Cause:** Old indexes from previous schema

**Fix:** Run setup script to recreate indexes:
```bash
node setup-mongodb.js
```

This will drop old indexes and create new ones.

---

### Issue: "No user found for phone: +14095551234"

**Cause:** User doesn't have phone number in MongoDB

**Fix:** Add phone to user record:

```javascript
// In MongoDB Atlas or mongosh
db.users.updateOne(
  { email: "user@example.com" },
  { $set: { "business.phoneNumber": "+14095551234" } }
)
```

**Or** update via API:
```bash
curl -X PATCH https://your-api.com/api/profile \
  -H "Authorization: Bearer YOUR_JWT" \
  -d '{ "business.phoneNumber": "+14095551234" }'
```

---

### Issue: "Connection timeout" or "Network error"

**Cause:** IP not whitelisted in MongoDB Atlas

**Fix:**
1. Go to MongoDB Atlas → Network Access
2. Add IP `0.0.0.0/0` (allow all)
3. Wait 2-3 minutes for changes to propagate
4. Restart Render service

---

### Issue: "Authentication failed"

**Cause:** Wrong credentials or database name

**Fix:**
1. Check `MONGODB_URI` in Render environment
2. Verify username/password in Atlas
3. Ensure database name matches Atlas cluster
4. URL encode special characters in password

Example:
```
Password: P@ssw0rd! → P%40ssw0rd%21
```

---

## Manual Index Creation (if needed)

If auto-creation fails, create indexes manually in **mongosh**:

```javascript
// Connect to your database
mongosh "your-connection-string"

// Switch to database
use aivors

// Create indexes
db.calls.createIndex({ callId: 1 }, { unique: true })
db.calls.createIndex({ email: 1 })
db.calls.createIndex({ createdAt: 1 })
db.calls.createIndex({ email: 1, createdAt: -1 })

// Verify
db.calls.getIndexes()
```

---

## Performance Monitoring

### Check Query Performance

```javascript
// In mongosh
db.calls.find({ email: "user@example.com" })
  .sort({ createdAt: -1 })
  .explain("executionStats")
```

Look for:
- `executionStats.executionTimeMillis` < 50ms ✅
- `executionStats.totalDocsExamined` ≈ `nReturned` ✅
- `winningPlan.inputStage.stage` = "IXSCAN" ✅

If `stage` is "COLLSCAN", indexes aren't being used! ❌

---

## Database Backup

### MongoDB Atlas Auto-Backup

Atlas M10+ clusters have automatic backups enabled.

For M0 (free tier):
1. Use `mongodump` regularly
2. Or upgrade to M10+ for auto-backups

### Manual Backup

```bash
# Export calls collection
mongodump --uri="your-connection-string" --collection=calls --out=./backup

# Restore
mongorestore --uri="your-connection-string" --dir=./backup
```

---

## Production Checklist

Before going live:

- [ ] MongoDB Atlas cluster created
- [ ] Network access configured (0.0.0.0/0 or Render IPs)
- [ ] Database user with readWrite permissions
- [ ] `MONGODB_URI` set in Render environment
- [ ] Indexes created (auto or manual)
- [ ] Setup script run successfully
- [ ] Webhook endpoint tested
- [ ] User phone numbers populated
- [ ] Backup strategy in place
- [ ] Monitoring alerts configured

---

## Support

**MongoDB Atlas Issues:**
- Support: https://support.mongodb.com
- Documentation: https://docs.atlas.mongodb.com

**Render Deployment:**
- Support: https://render.com/docs
- Community: https://community.render.com

**Aivors Support:**
- Email: info@restaurant-ai.com
- Phone: (409) 960-2907

---

**Status**: ✅ Production Ready  
**Last Updated**: December 13, 2025
