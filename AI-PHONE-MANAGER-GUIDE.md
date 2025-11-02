# AI Phone Manager - Complete Setup & Usage Guide

## 🎯 Overview

This is a fully **database-driven AI Phone Manager** where all user, business, subscription, analytics, and AI activity data is stored and managed exclusively in **MongoDB**. The frontend dashboard displays data dynamically from the database and auto-refreshes every 5 seconds.

---

## 📦 Database Structure

### User Document Schema

```javascript
{
  "_id": ObjectId(),
  "name": String,
  "email": String,
  "passwordHash": String,
  "role": "user",
  "status": "pending_payment" | "active" | "inactive" | "cancelled",

  "subscription": {
    "plan": "Free",
    "status": "inactive" | "active" | "past_due" | "cancelled",
    "minutesPurchased": 0,
    "minutesRemaining": 0,
    "stripeCustomerId": null,
    "stripeSubscriptionId": null,
    "startDate": null,
    "nextBillingDate": null
  },

  "business": {
    "setupStatus": "incomplete" | "complete",
    "aiTrainingStatus": "incomplete" | "complete",
    "posIntegration": "incomplete" | "complete",
    "phoneNumber": "Not Active" | "Active 📞"
  },

  "analytics": {
    "callsToday": 0,
    "callsChangePercent": 0,
    "aiStatus": "Offline" | "Online" | "Maintenance",
    "responseTime": 0
  },

  "recentActivity": [
    {
      "text": "Order taken: 2× Margherita Pizza, 1× Caesar Salad – $34.50",
      "timeAgo": "2 minutes ago",
      "createdAt": ISODate()
    }
  ],

  "createdAt": ISODate(),
  "updatedAt": ISODate()
}
```

---

## 🚀 API Endpoints

### Dashboard Endpoints

#### Get Current User Dashboard
```http
GET /api/dashboard
Authorization: Required (JWT Cookie)

Response:
{
  "user": { ... },
  "subscription": { ... },
  "business": { ... },
  "analytics": { ... },
  "recentActivity": [ ... ]
}
```

#### Get Specific User Dashboard (Admin Only)
```http
GET /api/dashboard/:userId
Authorization: Required (Admin JWT Cookie)
```

---

### Admin Endpoints for Data Management

#### 1. Update Business Setup
```http
PUT /api/admin/users/:userId/business
Authorization: Required (Admin JWT Cookie)

Body:
{
  "setupStatus": "complete",
  "aiTrainingStatus": "complete",
  "posIntegration": "complete",
  "phoneNumber": "Active 📞"
}
```

#### 2. Update Analytics
```http
PUT /api/admin/users/:userId/analytics
Authorization: Required (Admin JWT Cookie)

Body:
{
  "callsToday": 147,
  "callsChangePercent": 23,
  "aiStatus": "Online",
  "responseTime": 0.8
}
```

#### 3. Add Recent Activity
```http
POST /api/admin/users/:userId/activity
Authorization: Required (Admin JWT Cookie)

Body:
{
  "text": "Order taken: 2× Margherita Pizza, 1× Caesar Salad – $34.50",
  "timeAgo": "2 minutes ago"
}
```

#### 4. Update All User Data
```http
PUT /api/admin/users/:userId
Authorization: Required (Admin JWT Cookie)

Body:
{
  "subscription": {
    "plan": "Pro Monthly",
    "status": "active",
    "minutesPurchased": 2000,
    "minutesRemaining": 1850
  },
  "business": {
    "setupStatus": "complete",
    "aiTrainingStatus": "complete",
    "posIntegration": "complete",
    "phoneNumber": "Active 📞"
  },
  "analytics": {
    "callsToday": 147,
    "callsChangePercent": 23,
    "aiStatus": "Online",
    "responseTime": 0.8
  },
  "status": "active"
}
```

---

## 🔧 Developer Workflow

### Step 1: Create an Admin User

First, create an admin account through signup, then manually update the role in MongoDB:

```javascript
// In MongoDB Compass or Atlas
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```

### Step 2: Login as Admin

```http
POST /api/admin/login

Body:
{
  "email": "admin@example.com",
  "password": "your_password"
}
```

### Step 3: Update User Data

Use the admin endpoints above to update any user's data. The frontend will automatically reflect changes within 5 seconds.

---

## 📝 Example Usage Scenarios

### Scenario 1: Setup Complete Business

```bash
# Using curl or Postman
curl -X PUT http://localhost:3001/api/admin/users/USER_ID/business \
  -H "Content-Type: application/json" \
  -H "Cookie: access_token=YOUR_ADMIN_TOKEN" \
  -d '{
    "setupStatus": "complete",
    "aiTrainingStatus": "complete",
    "posIntegration": "complete",
    "phoneNumber": "Active 📞"
  }'
```

### Scenario 2: Update Analytics for Active Business

```bash
curl -X PUT http://localhost:3001/api/admin/users/USER_ID/analytics \
  -H "Content-Type: application/json" \
  -H "Cookie: access_token=YOUR_ADMIN_TOKEN" \
  -d '{
    "callsToday": 147,
    "callsChangePercent": 23,
    "aiStatus": "Online",
    "responseTime": 0.8
  }'
```

### Scenario 3: Add Recent AI Activity

```bash
curl -X POST http://localhost:3001/api/admin/users/USER_ID/activity \
  -H "Content-Type: application/json" \
  -H "Cookie: access_token=YOUR_ADMIN_TOKEN" \
  -d '{
    "text": "Order taken: 2× Margherita Pizza, 1× Caesar Salad – $34.50",
    "timeAgo": "2 minutes ago"
  }'
```

---

## 🎨 Frontend Features

### Auto-Refresh Dashboard
- The dashboard automatically fetches fresh data every **5 seconds**
- No manual refresh needed
- Changes in MongoDB appear on screen instantly

### Dynamic Display
All data shown on the dashboard is fetched from MongoDB:
- ✅ Business Setup Status
- ✅ AI Training Status  
- ✅ POS Integration Status
- ✅ Phone Number Status
- ✅ Calls Today with Change %
- ✅ AI Status (Online/Offline)
- ✅ Response Time
- ✅ Recent Activity Feed

---

## 🔒 Security

### Access Control
- **Users**: Can only view their own dashboard
- **Admins**: Can view and update any user's data
- All endpoints are protected with JWT authentication

### Rate Limiting
- Auth endpoints: Limited to prevent brute force
- API endpoints: Rate limited for security

---

## 🧪 Testing Guide

### Test 1: New User Signup
1. Sign up a new user
2. Check MongoDB - should have default values:
   - `subscription.plan`: "Free"
   - `business.setupStatus`: "incomplete"
   - `analytics.aiStatus`: "Offline"
   - `recentActivity`: []

### Test 2: Update Business Setup
1. Use admin endpoint to update business fields
2. Check dashboard - should show updated values within 5 seconds
3. Verify MongoDB has the updated data

### Test 3: Add Activity
1. Use admin endpoint to add activity
2. Dashboard should show new activity in "Recent AI Activity"
3. Activity list limited to last 10 entries

### Test 4: Update Analytics
1. Update analytics with admin endpoint
2. Dashboard should show new numbers for calls, AI status, response time
3. Verify change percentage displays correctly

---

## 📊 MongoDB Management

### Using MongoDB Compass

1. Connect to your MongoDB instance
2. Navigate to your database → `users` collection
3. Find user by email or ID
4. Click "Edit Document" to manually update any field
5. Frontend will reflect changes within 5 seconds

### Using MongoDB Atlas UI

1. Login to MongoDB Atlas
2. Browse Collections → Select User
3. Edit document directly in UI
4. Changes propagate automatically

---

## 🐛 Troubleshooting

### Dashboard Not Updating?
- Check browser console for errors
- Verify backend is running on port 3001
- Check that `/api/dashboard` endpoint is accessible
- Verify JWT cookie is present in browser

### Data Not Saving?
- Check MongoDB connection in backend logs
- Verify admin JWT token is valid
- Check audit logs for errors

### Auto-Refresh Not Working?
- Check browser console for interval errors
- Verify API calls are succeeding (Network tab)
- Ensure no CORS issues

---

## 📈 Next Steps

1. **Implement Real AI Integration**: Connect to actual AI phone service
2. **Add Webhooks**: Auto-update analytics from real call data
3. **Enhanced Security**: Add 2FA for admin accounts
4. **Real-time Updates**: Use WebSockets instead of polling
5. **Advanced Analytics**: Add graphs and historical data

---

## 🎯 Summary

✅ **MongoDB = Single Source of Truth**  
✅ **Frontend = Dynamic Viewer**  
✅ **Admins/Developers = Data Controllers**  
✅ **Auto-Refresh = Real-time Updates**  

Everything displayed on the dashboard comes directly from MongoDB and updates automatically!
