# 🚀 AI Phone Manager - Quick Start

## ⚡ 5-Minute Setup

### 1️⃣ Install & Start Backend
```bash
cd server
npm install
npm run dev
```

### 2️⃣ Install & Start Frontend (New Terminal)
```bash
npm install
npm run dev
```

### 3️⃣ Sign Up a User
- Open http://localhost:8080 (or your configured URL)
- Click "Get Started"
- Fill in your details and sign up
- You'll see the dashboard with default values

### 4️⃣ Test Auto-Update (New Terminal)
```bash
# Replace with your email from signup
node server/test-update-user.js full your-email@example.com
```

### 5️⃣ Watch the Magic! ✨
Go back to your browser and watch the dashboard update automatically within 5 seconds:
- ✅ Business Setup: Complete
- ✅ AI Training: Complete  
- ✅ POS Integration: Complete
- 📞 Phone Number: Active
- 📊 Calls Today: 147 (+23%)
- 🟢 AI Status: Online
- ⚡ Response Time: 0.8s
- 📝 Recent Activity appears

---

## 🎯 What Just Happened?

1. **You signed up** → User created in MongoDB with default values
2. **Test script ran** → Updated MongoDB with sample data
3. **Dashboard auto-refreshed** → Fetched new data every 5 seconds
4. **UI updated automatically** → No manual refresh needed!

---

## 🔑 Key Commands

### Test Commands
```bash
# Complete setup (business + analytics + activity + subscription)
node server/test-update-user.js full user@example.com

# Update only business
node server/test-update-user.js business user@example.com

# Update only analytics
node server/test-update-user.js analytics user@example.com

# Add activity feed
node server/test-update-user.js activity user@example.com

# View user data
node server/test-update-user.js view user@example.com

# List all users
node server/test-update-user.js list
```

### Server Commands
```bash
cd server

# Start server
npm run dev

# Start with nodemon (auto-restart)
nodemon index.js
```

---

## 📊 What's Auto-Updating?

Every **5 seconds**, the dashboard fetches fresh data and displays:

✅ **Subscription**: Plan, status, minutes remaining  
✅ **Business**: Setup status, AI training, POS integration, phone number  
✅ **Analytics**: Calls today, change %, AI status, response time  
✅ **Activity**: Recent AI phone interactions  

---

## 🔧 Manual MongoDB Updates

You can also update data directly in MongoDB:

### Using MongoDB Compass
1. Connect to your MongoDB
2. Open your database → `users` collection
3. Find user by email
4. Click "Edit Document"
5. Change any field (e.g., `analytics.callsToday` = 500)
6. Click "Update"
7. Dashboard updates within 5 seconds!

### Using MongoDB Shell
```javascript
// Update analytics
db.users.updateOne(
  { email: "user@example.com" },
  { $set: { "analytics.callsToday": 500 } }
)
```

---

## 🎨 Dashboard Features

### Live Data Display
- **Business Setup Cards**: Shows completion status from DB
- **Analytics Dashboard**: Real call metrics
- **AI Status**: Online/Offline with color indicators
- **Activity Feed**: Recent AI phone interactions
- **Subscription Details**: Plan info, credits, billing

### Auto-Refresh
- Polls API every 5 seconds
- Seamless updates (no loading spinners)
- Toast notifications for errors

---

## 🐛 Troubleshooting

### Backend Won't Start?
```bash
# Check MongoDB connection
# Make sure .env has MONGO_URI

# Install dependencies
cd server && npm install

# Check port 3001 is free
netstat -ano | findstr :3001
```

### Frontend Won't Load?
```bash
# Install dependencies
npm install

# Check port 8080/5173 is free
# Clear browser cache
# Check backend is running
```

### Dashboard Not Updating?
- Open browser DevTools (F12)
- Check Console for errors
- Check Network tab for `/api/dashboard` calls every 5s
- Verify backend is accessible at http://localhost:3001

### Test Script Errors?
```bash
# Make sure you're in project root
cd elite-render-engine-main

# Install server dependencies
cd server && npm install

# Check .env has MONGO_URI
```

---

## 📚 Full Documentation

- **AI-PHONE-MANAGER-GUIDE.md**: Complete system documentation
- **TESTING-GUIDE.md**: Detailed testing and API usage
- **IMPLEMENTATION-SUMMARY.md**: Technical implementation details

---

## 🎯 Next Steps

1. **Explore Admin APIs**: See TESTING-GUIDE.md for admin endpoints
2. **Customize Data**: Update user fields via test script or MongoDB
3. **Add Real AI**: Integrate with actual AI phone service
4. **Deploy**: Configure production environment

---

## ✅ Success Checklist

- [ ] Backend running on http://localhost:3001
- [ ] Frontend running on http://localhost:8080
- [ ] Signed up a new user
- [ ] Ran test script successfully
- [ ] Dashboard showing updated data
- [ ] Auto-refresh working (data updates every 5s)

---

**🎉 You're all set! Your AI Phone Manager is now fully database-driven and auto-updating!**

For questions or issues, check the documentation files or review the implementation summary.
