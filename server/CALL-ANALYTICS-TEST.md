# 🚀 Quick Test Guide - Call Analytics with Airtable

## ✅ What Was Changed

The **Call Analytics Dashboard** now displays data **exclusively from Airtable** instead of the old MongoDB database.

## 📋 Quick Test Steps

### Step 1: Verify Server is Ready

```bash
cd server
npm start
```

**Expected output:**
```
✅ Retrieved X records from Airtable
📊 Fetching dashboard stats from Airtable for user: user123
```

### Step 2: Add Test Data to Airtable

Go to your Airtable base and add a test record:

| Field | Value | Type |
|-------|-------|------|
| `owner_id` | `user123` | Text |
| `phone_number` | `+1234567890` | Text |
| `duration_minutes` | `5.5` | Number |
| `transcript` | `This is a test call transcript. Customer called about product inquiry.` | Long text |
| `summary` | `Customer inquiry about product features and pricing.` | Long text |
| `status` | `completed` | Single select |

**Important:** The `owner_id` must match a user ID in your system (or use `user123` for testing).

### Step 3: Test API Endpoints

```bash
# 1. Test dashboard stats
curl "http://localhost:3001/api/dashboard/stats?userId=user123"

# Expected: JSON with airtable records

# 2. Test get all calls for user
curl "http://localhost:3001/api/calls/user/user123"

# Expected: List of calls from Airtable

# 3. Test stats
curl "http://localhost:3001/api/calls/stats/user123"

# Expected: Statistics from Airtable data
```

### Step 4: View in Dashboard

1. Open browser: `http://localhost:8080`
2. Log in with a user account
3. Navigate to: **Call Analytics Dashboard**
4. You should see:
   - ✅ Total calls from Airtable
   - ✅ Calls today count
   - ✅ Average duration
   - ✅ Recent calls list with your Airtable records
   - ✅ Expandable transcripts from Airtable

## 🔍 What to Look For

### In Server Logs:
```
📊 Fetching dashboard stats from Airtable for user: user123
✅ Retrieved 5 records from Airtable
✅ Dashboard stats prepared from Airtable: 5 total records, 2 today
```

### In Dashboard:
- **Total Calls** card shows Airtable record count
- **Recent Calls** section displays Airtable records
- Click "Expand" on any call to see full transcript from Airtable
- All data comes from your Airtable sheet

### In API Response:
```json
{
  "success": true,
  "message": "Dashboard statistics retrieved successfully from Airtable",
  "data": {
    "dataSource": "airtable",
    "airtableRecordCount": 5,
    "callAnalytics": {
      "totalCalls": 5,
      "callsToday": 2,
      ...
    },
    "recentCalls": [
      {
        "callId": "recXXXXXXXXXX",
        "phoneNumber": "+1234567890",
        "transcript": "Full transcript from Airtable...",
        "airtableFields": { ... }
      }
    ]
  }
}
```

## ⚠️ Troubleshooting

### "No data found"
- Check that `owner_id` in Airtable matches your user ID
- Verify `AIRTABLE_TOKEN` is set in `.env`
- Check Airtable base ID and table name are correct

### "Connection error"
- Verify Airtable credentials in `server/.env`:
  ```env
  AIRTABLE_BASE=appjg75kO367PZuBV
  AIRTABLE_TABLE=Table 1
  AIRTABLE_TOKEN=patE6BWA050QJhvVM...
  ```

### "Wrong data displayed"
- Check the `owner_id` field in your Airtable records
- Ensure it matches the logged-in user's ID

## 📊 Supported Airtable Fields

The system automatically detects these field names:

**Duration:**
- `duration_minutes` ✅ (recommended)
- `durationMinutes`
- `duration`

**Phone:**
- `phone_number` ✅ (recommended)
- `phoneNumber`
- `phone`

**Status:**
- `status` ✅ (recommended)
- `call_status`

**Text:**
- `transcript` ✅ (recommended)
- `summary` ✅ (recommended)
- `notes`

**User ID:**
- `owner_id` ✅ (required)

## ✨ Real-time Updates

If you set up the Airtable webhook:
1. Update a record in Airtable
2. Dashboard automatically refreshes
3. New data appears instantly

See `server/AIRTABLE-INTEGRATION.md` for webhook setup.

## 🎯 Success Checklist

- [x] Server starts without errors
- [x] Airtable credentials configured
- [x] Test record added to Airtable with `owner_id`
- [x] API returns Airtable data
- [x] Dashboard displays Airtable records
- [x] Can expand calls to see full transcript
- [x] Stats calculate correctly

## 📚 Full Documentation

- **Integration Guide:** `server/AIRTABLE-INTEGRATION.md`
- **Architecture:** `server/AIRTABLE-ARCHITECTURE.md`
- **Changes Made:** `server/CALL-ANALYTICS-AIRTABLE.md`

---

**Ready to test!** Add records to Airtable and they'll appear in your Call Analytics Dashboard. 🎉
