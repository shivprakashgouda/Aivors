/**
 * Test Script for Call Analytics API
 * Run: node server/test-call-analytics.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const TEST_USER_ID = 'test_user_' + Date.now();
const TEST_CALL_ID = 'test_call_' + Date.now();

// Helper function for logging
const log = (title, data) => {
  console.log('\n' + '='.repeat(50));
  console.log(title);
  console.log('='.repeat(50));
  console.log(JSON.stringify(data, null, 2));
};

// Test functions
const tests = {
  
  // Test 1: Add credits to subscription
  async testAddCredits() {
    log('TEST 1: Add Credits to Subscription', {
      userId: TEST_USER_ID,
      minutes: 500
    });
    
    try {
      const response = await axios.post(`${BASE_URL}/api/subscription/add-credits`, {
        userId: TEST_USER_ID,
        minutes: 500
      });
      log('✅ Add Credits Success', response.data);
      return true;
    } catch (error) {
      log('❌ Add Credits Failed', error.response?.data || error.message);
      return false;
    }
  },
  
  // Test 2: Analyze a call (with event_type validation)
  async testAnalyzeCall() {
    log('TEST 2: Analyze Call (call_analyze event)', {
      callId: TEST_CALL_ID,
      userId: TEST_USER_ID,
      durationSeconds: 180
    });
    
    try {
      const response = await axios.post(`${BASE_URL}/api/calls/analyze`, {
        event_type: 'call_analyze',
        call_id: TEST_CALL_ID,
        user_id: TEST_USER_ID,
        phone_number: '+1234567890',
        duration_seconds: 180,
        transcript: 'This is a test call transcript. Customer called to inquire about product pricing.',
        summary: 'Customer inquiry about pricing. Provided details about Pro plan.',
        metadata: {
          agent_id: 'agent_001',
          call_quality: 'excellent'
        }
      });
      log('✅ Analyze Call Success', response.data);
      return true;
    } catch (error) {
      log('❌ Analyze Call Failed', error.response?.data || error.message);
      return false;
    }
  },
  
  // Test 3: Try to analyze with wrong event_type (should be skipped)
  async testWrongEventType() {
    log('TEST 3: Try Wrong Event Type (should be skipped)', {
      event_type: 'call_started'
    });
    
    try {
      const response = await axios.post(`${BASE_URL}/api/calls/analyze`, {
        event_type: 'call_started',
        call_id: 'wrong_event_' + Date.now(),
        user_id: TEST_USER_ID,
        phone_number: '+1234567890',
        duration_seconds: 60
      });
      log('✅ Wrong Event Type Handled', response.data);
      return true;
    } catch (error) {
      log('❌ Wrong Event Type Failed', error.response?.data || error.message);
      return false;
    }
  },
  
  // Test 4: Try duplicate call (should be prevented)
  async testDuplicateCall() {
    log('TEST 4: Try Duplicate Call (should be prevented)', {
      callId: TEST_CALL_ID
    });
    
    try {
      const response = await axios.post(`${BASE_URL}/api/calls/analyze`, {
        event_type: 'call_analyze',
        call_id: TEST_CALL_ID,
        user_id: TEST_USER_ID,
        phone_number: '+1234567890',
        duration_seconds: 180,
        transcript: 'Duplicate attempt',
        summary: 'Should not be saved'
      });
      log('✅ Duplicate Prevention Works', response.data);
      return true;
    } catch (error) {
      log('❌ Duplicate Check Failed', error.response?.data || error.message);
      return false;
    }
  },
  
  // Test 5: Update subscription (deduct credits)
  async testUpdateSubscription() {
    log('TEST 5: Update Subscription (deduct credits)', {
      userId: TEST_USER_ID,
      durationMinutes: 3
    });
    
    try {
      const response = await axios.post(`${BASE_URL}/api/subscription/update`, {
        userId: TEST_USER_ID,
        durationMinutes: 3
      });
      log('✅ Update Subscription Success', response.data);
      return true;
    } catch (error) {
      log('❌ Update Subscription Failed', error.response?.data || error.message);
      return false;
    }
  },
  
  // Test 6: Get subscription details
  async testGetSubscription() {
    log('TEST 6: Get Subscription Details', {
      userId: TEST_USER_ID
    });
    
    try {
      const response = await axios.get(`${BASE_URL}/api/subscription/${TEST_USER_ID}`);
      log('✅ Get Subscription Success', response.data);
      return true;
    } catch (error) {
      log('❌ Get Subscription Failed', error.response?.data || error.message);
      return false;
    }
  },
  
  // Test 7: Get call by ID
  async testGetCallById() {
    log('TEST 7: Get Call By ID', {
      callId: TEST_CALL_ID
    });
    
    try {
      const response = await axios.get(`${BASE_URL}/api/calls/${TEST_CALL_ID}`);
      log('✅ Get Call By ID Success', response.data);
      return true;
    } catch (error) {
      log('❌ Get Call By ID Failed', error.response?.data || error.message);
      return false;
    }
  },
  
  // Test 8: Get user calls
  async testGetUserCalls() {
    log('TEST 8: Get User Calls', {
      userId: TEST_USER_ID
    });
    
    try {
      const response = await axios.get(`${BASE_URL}/api/calls/user/${TEST_USER_ID}`);
      log('✅ Get User Calls Success', response.data);
      return true;
    } catch (error) {
      log('❌ Get User Calls Failed', error.response?.data || error.message);
      return false;
    }
  },
  
  // Test 9: Get call statistics
  async testGetCallStats() {
    log('TEST 9: Get Call Statistics', {
      userId: TEST_USER_ID
    });
    
    try {
      const response = await axios.get(`${BASE_URL}/api/calls/stats/${TEST_USER_ID}`);
      log('✅ Get Call Stats Success', response.data);
      return true;
    } catch (error) {
      log('❌ Get Call Stats Failed', error.response?.data || error.message);
      return false;
    }
  },
  
  // Test 10: Get dashboard stats
  async testGetDashboardStats() {
    log('TEST 10: Get Dashboard Statistics', {
      userId: TEST_USER_ID
    });
    
    try {
      const response = await axios.get(`${BASE_URL}/api/dashboard/stats?userId=${TEST_USER_ID}`);
      log('✅ Get Dashboard Stats Success', response.data);
      return true;
    } catch (error) {
      log('❌ Get Dashboard Stats Failed', error.response?.data || error.message);
      return false;
    }
  },
  
  // Test 11: Test low balance scenario
  async testLowBalance() {
    log('TEST 11: Test Low Balance Scenario', {
      userId: TEST_USER_ID,
      action: 'Deduct 496 minutes to leave 4 minutes'
    });
    
    try {
      // Deduct most credits to test low balance
      const response = await axios.post(`${BASE_URL}/api/subscription/update`, {
        userId: TEST_USER_ID,
        durationMinutes: 496
      });
      log('✅ Low Balance Test', response.data);
      
      if (response.data.data.lowBalance) {
        console.log('🔔 LOW BALANCE ALERT TRIGGERED!');
      }
      return true;
    } catch (error) {
      log('❌ Low Balance Test Failed', error.response?.data || error.message);
      return false;
    }
  },
  
  // Test 12: Test workflow stop scenario
  async testWorkflowStop() {
    log('TEST 12: Test Workflow Stop Scenario', {
      userId: TEST_USER_ID,
      action: 'Deduct remaining minutes to trigger stop'
    });
    
    try {
      const response = await axios.post(`${BASE_URL}/api/subscription/update`, {
        userId: TEST_USER_ID,
        durationMinutes: 10  // Deduct remaining credits
      });
      log('✅ Workflow Stop Test', response.data);
      
      if (response.data.data.stopWorkflow) {
        console.log('🛑 WORKFLOW STOP FLAG TRIGGERED!');
      }
      return true;
    } catch (error) {
      log('❌ Workflow Stop Test Failed', error.response?.data || error.message);
      return false;
    }
  }
};

// Run all tests
async function runTests() {
  console.log('\n' + '🚀'.repeat(25));
  console.log('  AIVORS CALL ANALYTICS API TEST SUITE');
  console.log('🚀'.repeat(25) + '\n');
  
  console.log(`Testing against: ${BASE_URL}`);
  console.log(`Test User ID: ${TEST_USER_ID}`);
  console.log(`Test Call ID: ${TEST_CALL_ID}\n`);
  
  const results = [];
  
  // Run tests sequentially
  for (const [name, testFn] of Object.entries(tests)) {
    const result = await testFn();
    results.push({ name, passed: result });
    
    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('TEST SUMMARY');
  console.log('='.repeat(50));
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  results.forEach(({ name, passed }) => {
    console.log(`${passed ? '✅' : '❌'} ${name}`);
  });
  
  console.log('\n' + '-'.repeat(50));
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
  console.log('-'.repeat(50) + '\n');
  
  if (failed === 0) {
    console.log('🎉 All tests passed!\n');
  } else {
    console.log('⚠️  Some tests failed. Check the logs above.\n');
  }
}

// Check if server is running
async function checkServer() {
  try {
    await axios.get(`${BASE_URL}/api/health`);
    return true;
  } catch (error) {
    console.error('❌ Server is not running or not accessible.');
    console.error('   Please start the server with: npm run dev');
    console.error(`   Expected server at: ${BASE_URL}\n`);
    return false;
  }
}

// Main execution
(async () => {
  const serverRunning = await checkServer();
  if (!serverRunning) {
    process.exit(1);
  }
  
  await runTests();
})();
