# 🔄 How Your Dashboard Gets Data - Explained Simply

## 🎯 Quick Answer

When you log into your dashboard, the system uses **YOUR USER ID** to fetch **ONLY YOUR CALLS** from Airtable.

The connection is: **Your Account ID → owner_id in Airtable → Your Calls Display**

---

## 📊 Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│  Step 1: YOU LOGIN TO DASHBOARD                        │
│  Email: your-email@example.com                         │
│  Password: ••••••••                                     │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  Step 2: SYSTEM GETS YOUR USER OBJECT                  │
│  {                                                      │
│    _id: "674a9abc123def456789",  ← YOUR UNIQUE USER ID │
│    email: "your-email@example.com",                    │
│    name: "Your Name",                                  │
│    role: "user"                                        │
│  }                                                      │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  Step 3: DASHBOARD CALLS API WITH YOUR USER ID         │
│  GET /api/dashboard/stats?userId=674a9abc123def456789  │
│  GET /api/calls/user/674a9abc123def456789              │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  Step 4: SERVER QUERIES AIRTABLE                       │
│  Filter: {owner_id} = '674a9abc123def456789'           │
│                                                         │
│  This ONLY returns records where:                      │
│  owner_id matches YOUR user ID                         │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  Step 5: AIRTABLE RETURNS YOUR CALLS                   │
│                                                         │
│  Record 1: owner_id = "674a9abc123def456789" ✅        │
│            phone: "+1234567890"                        │
│            duration: 5.2 min                           │
│                                                         │
│  Record 2: owner_id = "674a9abc123def456789" ✅        │
│            phone: "+0987654321"                        │
│            duration: 3.8 min                           │
│                                                         │
│  Record 3: owner_id = "DIFFERENT_USER_ID" ❌           │
│            (This is NOT returned - not your call)      │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  Step 6: YOUR DASHBOARD SHOWS ONLY YOUR DATA           │
│  ✅ Total Calls: 2                                     │
│  ✅ Total Minutes: 9.0                                 │
│  ✅ Recent Calls: Your 2 calls                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🔐 Security: How It Works

### 1. **When You Login:**
```javascript
// Frontend sends:
POST /api/auth/login
{
  email: "your-email@example.com",
  password: "your-password"
}

// Backend returns:
{
  user: {
    _id: "674a9abc123def456789",  // ← YOUR UNIQUE ID
    email: "your-email@example.com",
    name: "Your Name"
  }
}
```

### 2. **User ID is Stored in Browser:**
```javascript
// AuthContext stores your user:
user = {
  _id: "674a9abc123def456789",  // ← Saved in memory
  email: "your-email@example.com"
}
```

### 3. **Dashboard Uses Your ID:**
```javascript
// From CallAnalyticsDashboard.tsx:
const userId = user._id;  // Gets "674a9abc123def456789"
const response = await callAnalyticsAPI.getDashboardStats(userId);
```

### 4. **Backend Filters By Your ID:**
```javascript
// From airtableService.js:
const filterFormula = `{owner_id} = '674a9abc123def456789'`;
// This ONLY returns YOUR records from Airtable
```

---

## 📋 Airtable Structure

Your Airtable table needs this structure:

| Field Name | Type | Purpose | Example |
|------------|------|---------|---------|
| **owner_id** | Text | **Links call to your account** | `674a9abc123def456789` |
| call_id | Text | Unique call identifier | `call_abc123` |
| phone_number | Text | Phone number called | `+1234567890` |
| duration_minutes | Number | Call length | `5.2` |
| transcript | Long Text | Call transcript | `Hello, how are you...` |
| createdTime | Created Time | When record created | `2025-12-09 10:30 AM` |

**The `owner_id` field is CRITICAL** - it's how the system knows which calls belong to you!

---

## ❓ How Do Calls Get Your User ID?

There are **two ways** calls get assigned to your account:

### Option 1: Through n8n Workflow (Automatic)
```
1. Customer calls your AI phone number
2. Retell AI processes the call
3. Retell sends webhook to n8n: "Call completed"
4. n8n workflow finds YOUR USER ID from:
   - Agent ID mapping
   - Phone number mapping
   - Metadata
5. n8n creates Airtable record with YOUR owner_id
```

### Option 2: Manual Entry (For Testing)
```
1. You open Airtable directly
2. You create a new record
3. You manually enter YOUR owner_id: "674a9abc123def456789"
4. Dashboard immediately shows this call
```

---

## 🎯 Key Points

### ✅ **Data Security:**
- You **ONLY** see calls where `owner_id = YOUR USER ID`
- Other users **CANNOT** see your calls
- Each user's data is completely isolated

### ✅ **Automatic Assignment:**
- When Retell AI sends call data to n8n
- n8n automatically sets the correct `owner_id`
- No manual work needed

### ✅ **Real-time Updates:**
- When a new call completes
- n8n creates record with your `owner_id`
- Dashboard refreshes and shows new call

---

## 🔍 How to Find Your User ID

### Method 1: From Browser Console
```javascript
// Open browser DevTools (F12)
// In Console tab, type:
console.log(window.localStorage)
// Look for user data

// Or check auth cookie
document.cookie
```

### Method 2: From Dashboard
```javascript
// Add this to CallAnalyticsDashboard.tsx temporarily:
console.log('My User ID:', user._id);
// Check browser console
```

### Method 3: From Database
```bash
# In MongoDB, find your user:
db.users.findOne({ email: "your-email@example.com" })
# The _id field is your user ID
```

---

## 🧪 Testing: Add Your Own Test Data

Want to see data in your dashboard right now?

### Step 1: Get Your User ID
```javascript
// In your dashboard, open browser console (F12)
// Type this:
console.log('My User ID:', window.__user?._id);
```

### Step 2: Add Record to Airtable
1. Open your Airtable base: https://airtable.com/appjg75kO367PZuBV
2. Go to "Table 1"
3. Click "+" to add new record
4. Fill in:
   - **owner_id**: `YOUR_USER_ID_FROM_STEP_1`
   - **call_id**: `test_call_001`
   - **phone_number**: `+1234567890`
   - **duration_minutes**: `5.5`
   - **transcript**: `Test call transcript`
   - **summary**: `Test call summary`

### Step 3: Refresh Dashboard
- Go back to your dashboard
- Refresh the page
- You should see your test call! 🎉

---

## 🔗 Where User ID Comes From

```
MongoDB User Collection
  ↓
  User Document: {
    _id: ObjectId("674a9abc123def456789")
  }
  ↓
  Converted to string: "674a9abc123def456789"
  ↓
  Used as owner_id in Airtable
  ↓
  Dashboard filters by this ID
```

---

## 💡 Common Questions

### Q: Can other users see my calls?
**A:** NO! Each user only sees calls where `owner_id` matches their user ID.

### Q: What if owner_id is missing?
**A:** The call won't appear in any dashboard. Always ensure n8n sets owner_id correctly.

### Q: Can I change my user ID?
**A:** No, it's permanent. It's created when you register and never changes.

### Q: How does n8n know my user ID?
**A:** You configure agent mapping in n8n. When a call comes from your Retell agent, n8n looks up your user ID and uses it.

### Q: Can I have multiple phone numbers?
**A:** YES! All calls with your `owner_id` appear in your dashboard, regardless of which phone number was used.

---

## 🎉 Summary

**Simple Answer:**
Your dashboard shows calls where the Airtable `owner_id` field equals your account's `_id`. When you login, the system automatically uses your ID to filter Airtable records.

**Flow:**
```
You Login → System Gets Your ID → API Calls Use Your ID → 
Airtable Filters By Your ID → You See Only Your Calls
```

**Security:**
Each user has a unique ID. Airtable records are filtered by this ID. No user can see another user's data.

---

**Need Help?**
- Check your user ID in browser console
- Verify Airtable records have correct `owner_id`
- Test by manually adding a record with your ID
- Check n8n workflow is setting `owner_id` correctly

🚀 Your data is secure and properly filtered!
