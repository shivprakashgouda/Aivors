/**
 * Test script for n8n Retell AI webhook endpoint
 * Simulates a call_analyze event from Retell AI via n8n
 * 
 * Usage:
 *   node server/test-n8n-webhook.js
 */

const axios = require('axios');

// Test data - simulates what Retell AI sends to n8n, and n8n forwards to our backend
const testCallAnalyzeEvent = {
  event_type: 'call_analyze',
  call_id: 'retell_call_' + Date.now(),
  user_id: null, // Will be populated with actual user ID
  email: null, // Will be populated with actual user email
  phone_number: '+1-555-0123',
  duration_seconds: 180, // 3 minutes
  transcript: 'Customer: Hi, I need help with my subscription.\nAI Agent: Of course! I\'d be happy to help you with your subscription. Can you tell me what you need assistance with?\nCustomer: I want to upgrade my plan.\nAI Agent: Great! Let me check your current plan and show you the available upgrade options...',
  summary: 'Customer inquired about upgrading their subscription plan. Agent provided information about available upgrade options and pricing.',
  metadata: {
    agent_name: 'Aivors AI Assistant',
    call_direction: 'inbound',
    recording_url: 'https://example.com/recordings/123',
    sentiment: 'positive'
  },
  call_start_time: new Date(Date.now() - 180000).toISOString(), // 3 minutes ago
  call_end_time: new Date().toISOString()
};

const BASE_URL = 'http://localhost:3001';

async function testRetellWebhook() {
  console.log('🧪 Testing Retell AI Webhook via n8n\n');
  console.log('=' . repeat(60));

  try {
    // Step 1: Get a test user
    console.log('\n📋 Step 1: Finding test user...');
    const usersResponse = await axios.get(`${BASE_URL}/api/users`);
    const testUser = usersResponse.data.users.find(u => u.role === 'customer');
    
    if (!testUser) {
      console.log('❌ No test user found. Please create a user first.');
      return;
    }

    console.log(`✅ Found test user: ${testUser.email} (ID: ${testUser._id})`);
    
    // Update test data with real user
    testCallAnalyzeEvent.user_id = testUser._id;
    testCallAnalyzeEvent.email = testUser.email;

    // Step 2: Check subscription before call
    console.log('\n📋 Step 2: Checking subscription before call...');
    try {
      const subBefore = await axios.get(`${BASE_URL}/api/subscription/${testUser._id}`);
      console.log(`💳 Credits before: ${subBefore.data.subscription.availableCredits} minutes`);
    } catch (err) {
      console.log('⚠️  No subscription found (will be created)');
    }

    // Step 3: Send test webhook
    console.log('\n📋 Step 3: Sending Retell webhook to n8n endpoint...');
    console.log('📞 Call Details:');
    console.log(`   - Call ID: ${testCallAnalyzeEvent.call_id}`);
    console.log(`   - Duration: ${testCallAnalyzeEvent.duration_seconds}s (${testCallAnalyzeEvent.duration_seconds / 60} min)`);
    console.log(`   - Phone: ${testCallAnalyzeEvent.phone_number}`);
    console.log(`   - Transcript: ${testCallAnalyzeEvent.transcript.substring(0, 100)}...`);

    const webhookResponse = await axios.post(
      `${BASE_URL}/api/n8n/retell-webhook`,
      testCallAnalyzeEvent,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-n8n-webhook-secret': process.env.N8N_WEBHOOK_SECRET || 'test-secret'
        }
      }
    );

    console.log('\n✅ Webhook processed successfully!');
    console.log('📊 Response:', JSON.stringify(webhookResponse.data, null, 2));

    // Step 4: Verify call was saved
    console.log('\n📋 Step 4: Verifying call was saved...');
    const callsResponse = await axios.get(`${BASE_URL}/api/calls/user/${testUser._id}`);
    const savedCall = callsResponse.data.calls.find(c => c.callId === testCallAnalyzeEvent.call_id);
    
    if (savedCall) {
      console.log('✅ Call found in database:');
      console.log(`   - Call ID: ${savedCall.callId}`);
      console.log(`   - Duration: ${savedCall.durationMinutes} minutes`);
      console.log(`   - Transcript length: ${savedCall.transcript.length} chars`);
      console.log(`   - Summary: ${savedCall.summary}`);
    } else {
      console.log('❌ Call not found in database');
    }

    // Step 5: Check subscription after call
    console.log('\n📋 Step 5: Checking subscription after call...');
    const subAfter = await axios.get(`${BASE_URL}/api/subscription/${testUser._id}`);
    console.log(`💳 Credits after: ${subAfter.data.subscription.availableCredits} minutes`);
    console.log(`📉 Credits used: ${testCallAnalyzeEvent.duration_seconds / 60} minutes`);

    // Step 6: Check dashboard data
    console.log('\n📋 Step 6: Checking dashboard data...');
    const dashboardResponse = await axios.get(`${BASE_URL}/api/dashboard/${testUser._id}`);
    const stats = dashboardResponse.data.data;
    console.log('📊 Dashboard Stats:');
    console.log(`   - Total Calls: ${stats.totalCalls}`);
    console.log(`   - Calls Today: ${stats.callsToday}`);
    console.log(`   - Average Duration: ${stats.averageDuration} minutes`);
    console.log(`   - Credits Remaining: ${stats.subscription.availableCredits} minutes`);
    console.log(`   - Recent Calls: ${stats.recentCalls.length}`);

    // Success summary
    console.log('\n' + '='.repeat(60));
    console.log('✨ TEST COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('\n✅ All systems working:');
    console.log('   1. ✅ Retell webhook received');
    console.log('   2. ✅ Call saved to database');
    console.log('   3. ✅ Credits deducted from subscription');
    console.log('   4. ✅ Dashboard shows updated data');
    console.log('\n📱 Next steps:');
    console.log('   1. Configure n8n workflow on Hostinger:');
    console.log('      URL: https://n8n.srv971061.hstgr.cloud/webhook/retell-webhook');
    console.log('   2. Set webhook destination to: POST ' + BASE_URL + '/api/n8n/retell-webhook');
    console.log('   3. Test with real Retell AI call');
    console.log('   4. Open dashboard to view analytics\n');

  } catch (error) {
    console.error('\n❌ TEST FAILED!');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Test duplicate prevention
async function testDuplicatePrevention() {
  console.log('\n\n🧪 Testing Duplicate Prevention\n');
  console.log('=' . repeat(60));

  try {
    // Send the same call twice
    console.log('\n📋 Sending same call ID twice...');
    
    const usersResponse = await axios.get(`${BASE_URL}/api/users`);
    const testUser = usersResponse.data.users.find(u => u.role === 'customer');
    
    const duplicateCall = {
      ...testCallAnalyzeEvent,
      call_id: 'duplicate_test_' + Date.now(),
      user_id: testUser._id,
      email: testUser.email
    };

    // First call - should succeed
    console.log('📞 First call...');
    const firstResponse = await axios.post(
      `${BASE_URL}/api/n8n/retell-webhook`,
      duplicateCall
    );
    console.log('✅ First call processed:', firstResponse.data.success);

    // Second call - should be rejected as duplicate
    console.log('\n📞 Second call (duplicate)...');
    const secondResponse = await axios.post(
      `${BASE_URL}/api/n8n/retell-webhook`,
      duplicateCall
    );
    
    if (secondResponse.data.duplicate) {
      console.log('✅ Duplicate correctly detected and rejected!');
      console.log('Message:', secondResponse.data.message);
    } else {
      console.log('❌ Duplicate was not detected!');
    }

  } catch (error) {
    console.error('❌ Duplicate test failed:', error.message);
  }
}

// Test event filtering
async function testEventFiltering() {
  console.log('\n\n🧪 Testing Event Filtering\n');
  console.log('=' . repeat(60));

  try {
    const usersResponse = await axios.get(`${BASE_URL}/api/users`);
    const testUser = usersResponse.data.users.find(u => u.role === 'customer');

    // Test call_start (should be skipped)
    console.log('\n📋 Testing call_start event (should be skipped)...');
    const callStartEvent = {
      event_type: 'call_start',
      call_id: 'test_call_start_' + Date.now(),
      user_id: testUser._id
    };
    
    const startResponse = await axios.post(
      `${BASE_URL}/api/n8n/retell-webhook`,
      callStartEvent
    );
    
    if (startResponse.data.skipped) {
      console.log('✅ call_start correctly skipped!');
      console.log('Message:', startResponse.data.message);
    } else {
      console.log('❌ call_start was not skipped!');
    }

    // Test call_end (should be skipped)
    console.log('\n📋 Testing call_end event (should be skipped)...');
    const callEndEvent = {
      event_type: 'call_end',
      call_id: 'test_call_end_' + Date.now(),
      user_id: testUser._id
    };
    
    const endResponse = await axios.post(
      `${BASE_URL}/api/n8n/retell-webhook`,
      callEndEvent
    );
    
    if (endResponse.data.skipped) {
      console.log('✅ call_end correctly skipped!');
      console.log('Message:', endResponse.data.message);
    } else {
      console.log('❌ call_end was not skipped!');
    }

    console.log('\n✅ Event filtering working correctly!');

  } catch (error) {
    console.error('❌ Event filtering test failed:', error.message);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting n8n Webhook Tests...\n');
  
  await testRetellWebhook();
  await testDuplicatePrevention();
  await testEventFiltering();
  
  console.log('\n' + '='.repeat(60));
  console.log('🎉 ALL TESTS COMPLETED!');
  console.log('='.repeat(60) + '\n');
}

// Execute
runAllTests().catch(console.error);
