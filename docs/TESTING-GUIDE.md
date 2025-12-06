# Quick Test Commands

## Test Script Usage

The test script (`server/test-update-user.js`) allows you to quickly update user data in MongoDB for testing purposes.

### Commands

#### 1. Complete Full Setup (Recommended for Quick Testing)
```bash
node server/test-update-user.js full user@example.com
```
This command will:
- ✅ Complete business setup
- ✅ Update analytics with sample data
- ✅ Add recent activity entries
- ✅ Activate Pro Monthly subscription

#### 2. Update Business Setup Only
```bash
node server/test-update-user.js business user@example.com
```

#### 3. Update Analytics Only
```bash
node server/test-update-user.js analytics user@example.com
```

#### 4. Add Activity Feed
```bash
node server/test-update-user.js activity user@example.com
```

#### 5. Activate Subscription
```bash
# Default Pro Monthly
node server/test-update-user.js subscription user@example.com

# Custom plan
node server/test-update-user.js subscription user@example.com "Growth Monthly"
```

#### 6. View User Data
```bash
node server/test-update-user.js view user@example.com
```

#### 7. List All Users
```bash
node server/test-update-user.js list
```

---

## Quick Start Testing Flow

### 1. Start the Backend
```bash
cd server
npm run dev
```

### 2. Start the Frontend
```bash
# In another terminal
npm run dev
```

### 3. Sign Up a New User
- Go to http://localhost:8080 (or your frontend URL)
- Click "Get Started" and sign up
- You'll be redirected to the dashboard

### 4. Update User Data
```bash
# In another terminal, run the test script with your email
node server/test-update-user.js full your-email@example.com
```

### 5. Watch Dashboard Auto-Update
- Go back to your browser
- Within 5 seconds, you'll see:
  - ✅ Business Setup: Complete
  - ✅ AI Training: Complete
  - ✅ POS Integration: Complete
  - ✅ Phone Number: Active 📞
  - 📊 Calls Today: 147 (+23%)
  - 🟢 AI Status: Online
  - ⚡ Response Time: 0.8s
  - 📝 Recent Activity Feed

---

## Admin API Testing with Postman/curl

### Get Admin Token First

#### Login as Admin
```bash
# First create an admin user or update existing user role in MongoDB
# Then login
curl -X POST http://localhost:3001/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "your_password"
  }' \
  -c cookies.txt
```

### Update Business Setup
```bash
curl -X PUT http://localhost:3001/api/admin/users/USER_ID/business \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "setupStatus": "complete",
    "aiTrainingStatus": "complete",
    "posIntegration": "complete",
    "phoneNumber": "Active 📞"
  }'
```

### Update Analytics
```bash
curl -X PUT http://localhost:3001/api/admin/users/USER_ID/analytics \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "callsToday": 147,
    "callsChangePercent": 23,
    "aiStatus": "Online",
    "responseTime": 0.8
  }'
```

### Add Activity
```bash
curl -X POST http://localhost:3001/api/admin/users/USER_ID/activity \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "text": "Order taken: 2× Margherita Pizza, 1× Caesar Salad – $34.50",
    "timeAgo": "2 minutes ago"
  }'
```

---

## MongoDB Direct Updates

### Using MongoDB Compass

1. Connect to your MongoDB
2. Find your database → `users` collection
3. Find user by email
4. Click "Edit Document"
5. Modify any field (business, analytics, etc.)
6. Click "Update"
7. Dashboard auto-updates within 5 seconds!

### Using MongoDB Shell

```javascript
// Connect to MongoDB
mongosh "your-connection-string"

// Use your database
use your-database-name

// Update business setup
db.users.updateOne(
  { email: "user@example.com" },
  { 
    $set: {
      "business.setupStatus": "complete",
      "business.aiTrainingStatus": "complete",
      "business.posIntegration": "complete",
      "business.phoneNumber": "Active 📞"
    }
  }
)

// Update analytics
db.users.updateOne(
  { email: "user@example.com" },
  { 
    $set: {
      "analytics.callsToday": 147,
      "analytics.callsChangePercent": 23,
      "analytics.aiStatus": "Online",
      "analytics.responseTime": 0.8
    }
  }
)

// Add activity
db.users.updateOne(
  { email: "user@example.com" },
  { 
    $push: {
      recentActivity: {
        $each: [{
          text: "Order taken: 2× Margherita Pizza, 1× Caesar Salad – $34.50",
          timeAgo: "2 minutes ago",
          createdAt: new Date()
        }],
        $position: 0,
        $slice: 10
      }
    }
  }
)
```

---

## Troubleshooting

### Test Script Errors

**Error: Cannot find module 'dotenv'**
```bash
cd server
npm install
```

**Error: MongoDB connection failed**
- Check your `.env` file has `MONGO_URI` set
- Verify MongoDB is running

### Dashboard Not Updating

**Check browser console:**
- Press F12 → Console tab
- Look for API errors

**Verify backend is running:**
```bash
curl http://localhost:3001/api/health
```

**Check auto-refresh:**
- Open Network tab in browser DevTools
- You should see `/api/dashboard` requests every 5 seconds

---

## What's Auto-Refreshing?

The dashboard polls the API every **5 seconds** and updates:

✅ Subscription plan and status  
✅ Business setup progress  
✅ Analytics (calls, AI status, response time)  
✅ Recent activity feed  
✅ Credit usage  
✅ Next billing date  

**No manual refresh needed!** Changes appear automatically.
