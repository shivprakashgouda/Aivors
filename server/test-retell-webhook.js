/**
 * Test script for Retell webhook endpoint
 * Usage: node test-retell-webhook.js
 */

require('dotenv').config();
const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3001';

// Test payloads
const testPayloads = [
  {
    name: 'Test 1: CamelCase format (from Retell directly)',
    data: {
      callId: 'test_call_001',
      phoneNumber: '+14095551234',
      transcript: 'Hello, this is a test call transcript. The customer inquired about pricing.',
      summary: 'Customer asked about pricing plans',
      durationSeconds: 125,
      eventType: 'call_completed'
    }
  },
  {
    name: 'Test 2: Snake_case format (from n8n)',
    data: {
      call_id: 'test_call_002',
      phone_number: '+14095551234',
      transcript: 'This is another test call. Customer wanted support.',
      summary: 'Customer requested technical support',
      duration_seconds: 180,
      event_type: 'call_analyze'
    }
  },
  {
    name: 'Test 3: Duplicate call (should be ignored)',
    data: {
      callId: 'test_call_001',
      phoneNumber: '+14095551234',
      transcript: 'Duplicate test',
      summary: 'This should be ignored',
      durationSeconds: 60
    }
  },
  {
    name: 'Test 4: Unknown phone number (should be skipped)',
    data: {
      callId: 'test_call_003',
      phoneNumber: '+15555555555',
      transcript: 'Unknown user',
      summary: 'No user found',
      durationSeconds: 45
    }
  }
];

async function testWebhook() {
  console.log('\n🧪 ========== TESTING RETELL WEBHOOK ==========\n');
  console.log(`Testing endpoint: ${API_URL}/webhook/retell\n`);

  for (const test of testPayloads) {
    console.log(`\n📝 ${test.name}`);
    console.log('Payload:', JSON.stringify(test.data, null, 2));

    try {
      const response = await axios.post(`${API_URL}/webhook/retell`, test.data, {
        headers: { 'Content-Type': 'application/json' }
      });

      console.log('✅ Response:', response.status, response.statusText);
      console.log('   Body:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      if (error.response) {
        console.log('❌ Error:', error.response.status, error.response.statusText);
        console.log('   Body:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.log('❌ Network Error:', error.message);
        console.log('   Make sure backend is running on', API_URL);
      }
    }
  }

  console.log('\n\n✅ ========== WEBHOOK TESTING COMPLETE ==========\n');
  console.log('Next steps:');
  console.log('1. Check MongoDB for saved calls: db.calls.find()');
  console.log('2. Login to frontend and visit /my-calls');
  console.log('3. Configure Retell AI webhook URL: POST', `${API_URL}/webhook/retell`);
  console.log('4. Or configure n8n HTTP Request node to:', `${API_URL}/webhook/retell\n`);
}

// Run tests
testWebhook();
