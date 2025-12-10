# 🎯 Agent Assignment Complete!

## Your Retell AI Agent Configuration

**Email:** ajinkyamhetre01@gmail.com  
**Agent ID:** agent_2faeaea2dcfa43016ec8aa47a3  
**LLM ID:** llm_6ebc1d7bd6550089f4dc9f0e1e48

---

## ⚡ Quick Setup (3 Steps)

### Step 1: Run the Assignment Script

```bash
cd server
node assign-agent-to-user.js
```

This will:
- ✅ Find your user account by email
- ✅ Link the Retell agent to your account
- ✅ Display your User ID (needed for Airtable)

---

### Step 2: Copy Your User ID

After running the script, you'll see output like:

```
┌────────────────────────────────────────┐
│ YOUR USER ID (use as owner_id):       │
│ 674a9abc123def456789                   │
└────────────────────────────────────────┘
```

**IMPORTANT:** Copy this User ID - you'll need it for Step 3!

---

### Step 3: Use Your User ID in Airtable

When adding call records to Airtable, use your User ID as the `owner_id`:

**Example Airtable Record:**
```
owner_id: 674a9abc123def456789  ← YOUR USER ID FROM STEP 2
call_id: call_abc123
phone_number: +1234567890
duration_minutes: 5.2
transcript: Call transcript here...
summary: Call summary here...
```

---

## 🔄 How It Works Now

### When a call comes in:

```
1. Customer calls your AI number
   ↓
2. Retell AI agent (agent_2faeaea2dcfa43016ec8aa47a3) processes it
   ↓
3. Retell sends webhook to n8n with agent_id
   ↓
4. n8n finds YOUR account using agent_id mapping
   ↓
5. n8n creates Airtable record with YOUR user ID as owner_id
   ↓
6. Your dashboard shows the call!
```

---

## 🧪 Test Your Setup

### Option 1: Manual Test (Quick)

1. Open Airtable: https://airtable.com/appjg75kO367PZuBV
2. Go to "Table 1"
3. Add a new record:
   ```
   owner_id: YOUR_USER_ID_FROM_STEP_2
   call_id: test_call_001
   phone_number: +1234567890
   duration_minutes: 3.5
   transcript: Test call transcript
   summary: This is a test call
   ```
4. Refresh your dashboard
5. You should see the test call! 🎉

### Option 2: Real Call Test

1. Make a test call to your Retell AI number
2. Complete the call
3. Wait ~10 seconds for n8n to process
4. Check your Airtable - new record should appear
5. Refresh your dashboard - call should appear

---

## ✅ Verification Checklist

After running the script, verify:

- [ ] Script shows "✅ Agent successfully assigned!"
- [ ] You copied your User ID
- [ ] Agent ID shows in MongoDB: `agent_2faeaea2dcfa43016ec8aa47a3`
- [ ] You can see the agent in your user document

### Check in MongoDB:
```javascript
db.users.findOne({ email: "ajinkyamhetre01@gmail.com" })
// Should show:
// business: {
//   retellAgentId: "agent_2faeaea2dcfa43016ec8aa47a3",
//   retellLLMId: "llm_6ebc1d7bd6550089f4dc9f0e1e48"
// }
```

---

## 🔧 n8n Webhook Configuration

Make sure your n8n workflow includes:

```javascript
// In n8n workflow, when call comes in:
const agentId = $json.call.agent_id;  // "agent_2faeaea2dcfa43016ec8aa47a3"

// Find user by agent_id
const user = await User.findOne({ 
  'business.retellAgentId': agentId 
});

// Use user._id as owner_id in Airtable
const airtableData = {
  owner_id: user._id.toString(),  // YOUR USER ID
  call_id: $json.call.call_id,
  phone_number: $json.call.from_number,
  // ... other fields
};
```

---

## 📊 What Happens in Your Dashboard

Once setup is complete:

1. **Dashboard Stats** will show:
   - Total calls from your agent
   - Total minutes used
   - Average call duration
   - All filtered by your User ID

2. **Recent Activity** will show:
   - Latest calls from your agent
   - Phone numbers called
   - Call durations

3. **Analytics** will show:
   - Calls over time (daily/weekly/monthly)
   - Usage patterns
   - All YOUR data only

---

## 🐛 Troubleshooting

### Issue: Script can't find user
**Solution:** Check if email is exactly `ajinkyamhetre01@gmail.com` in database

### Issue: Dashboard shows no calls
**Solution:** 
1. Check Airtable records have correct `owner_id`
2. Verify owner_id matches your User ID
3. Check console for API errors

### Issue: n8n workflow not creating records
**Solution:**
1. Verify n8n can find user by agent_id
2. Check n8n workflow logs
3. Ensure n8n has Airtable API token

---

## 📞 Your Configuration Summary

| Setting | Value |
|---------|-------|
| **Email** | ajinkyamhetre01@gmail.com |
| **Agent ID** | agent_2faeaea2dcfa43016ec8aa47a3 |
| **LLM ID** | llm_6ebc1d7bd6550089f4dc9f0e1e48 |
| **User ID** | *(Get from Step 2)* |
| **Database** | MongoDB (User collection) |
| **Call Storage** | Airtable (Table 1) |
| **Filter Field** | owner_id |

---

## 🎉 You're All Set!

After running the script:
1. ✅ Agent is linked to your account
2. ✅ System knows agent belongs to you
3. ✅ All calls from this agent will show in YOUR dashboard
4. ✅ Data is automatically filtered by your User ID

**Ready to test? Run the script and start making calls!** 🚀

---

## 📚 Related Docs

- `docs/HOW-DATA-FLOWS-TO-YOUR-DASHBOARD.md` - How data filtering works
- `docs/DEPLOYMENT-READY.md` - Complete deployment guide
- `docs/AIRTABLE-MIGRATION-COMPLETE.md` - Technical details

---

**Last Updated:** December 9, 2025  
**Status:** Ready to assign! Run the script to complete setup.
