/**
 * Test Webhook Storage
 * Simulates n8n sending webhook and verifies data is stored in MongoDB
 */

const https = require('https');

// Simulate webhook from n8n (Retell format)
const webhookPayload = {
  event_type: "call_analyzed",
  event: "call_analyzed",
  call: {
    call_id: `test_storage_${Date.now()}`,
    agent_id: "agent_2faeaea2dcfa43016ec8aa47a3",
    transcript: "Customer: Testing storage verification\nAI: This call should be stored in MongoDB immediately.",
    call_analysis: {
      call_summary: "Storage test call to verify MongoDB persistence"
    },
    start_timestamp: Date.now() - 120000, // 2 minutes ago
    end_timestamp: Date.now(),
    duration_ms: 120000 // 2 minutes
  }
};

// Step 1: Send webhook to backend
console.log('📤 Sending webhook to backend...\n');
console.log('Call ID:', webhookPayload.call.call_id);
console.log('Agent ID:', webhookPayload.call.agent_id);
console.log('Duration: 2 minutes\n');

const postData = JSON.stringify(webhookPayload);

const options = {
  hostname: 'aivors-5hvj.onrender.com',
  port: 443,
  path: '/api/n8n/retell-webhook',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
    'x-n8n-webhook-secret': 'aivors-secret'
  }
};

const req = https.request(options, (res) => {
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('✅ Webhook Response:', res.statusCode);
    const parsed = JSON.parse(responseData);
    console.log('Response:', JSON.stringify(parsed, null, 2));
    
    if (parsed.success) {
      console.log('\n✅ SUCCESS! Call saved to MongoDB');
      console.log('Call ID:', parsed.data?.call?.callId || webhookPayload.call.call_id);
      console.log('Duration:', parsed.data?.call?.durationMinutes || '2 min');
      
      // Step 2: Verify it's in database
      console.log('\n🔍 Verifying in database...');
      setTimeout(() => {
        const mongoose = require('mongoose');
        require('dotenv').config();
        
        mongoose.connect(process.env.MONGO_URI)
          .then(async () => {
            const Call = require('./models/Call');
            const call = await Call.findOne({ callId: webhookPayload.call.call_id });
            
            if (call) {
              console.log('\n✅ CONFIRMED! Call found in MongoDB:');
              console.log({
                callId: call.callId,
                userId: call.userId,
                duration: `${call.durationMinutes} min`,
                transcript: call.transcript.substring(0, 50) + '...',
                createdAt: call.createdAt
              });
            } else {
              console.log('\n❌ Call not found in database');
            }
            
            process.exit(0);
          })
          .catch(err => {
            console.error('❌ Database connection error:', err.message);
            process.exit(1);
          });
      }, 2000);
    } else {
      console.log('\n❌ Webhook failed:', parsed.message);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
  process.exit(1);
});

req.write(postData);
req.end();
