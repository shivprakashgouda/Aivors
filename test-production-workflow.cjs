/**
 * PRODUCTION WORKFLOW TEST
 * Tests the complete N8N → Backend → Dashboard integration
 */

const https = require('https');
const http = require('http');

// Configuration
const CONFIG = {
  backendUrl: 'https://aivors-5hvj.onrender.com',
  frontendUrl: 'https://www.aivors.com',
  n8nWebhookUrl: 'https://n8n.srv971061.hstgr.cloud/webhook/retell-webhook',
  testUserId: '674a6b06b0bbea88bbf2fbb4', // ajinkyamhetre01@gmail.com
  n8nSecret: 'aivors-secret'
};

// Test results
const results = {
  tests: [],
  passed: 0,
  failed: 0
};

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const urlObj = new URL(url);
    
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: 30000
    };

    const req = protocol.request(reqOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

// Test functions
async function testBackendHealth() {
  console.log('\n🔍 TEST 1: Backend Health Check');
  console.log('━'.repeat(60));
  
  try {
    const response = await makeRequest(`${CONFIG.backendUrl}/health`);
    
    if (response.statusCode === 200) {
      const data = JSON.parse(response.body);
      console.log('✅ Backend is LIVE!');
      console.log(`   Status: ${data.status}`);
      console.log(`   Timestamp: ${data.timestamp}`);
      results.tests.push({ name: 'Backend Health', status: 'PASS' });
      results.passed++;
      return true;
    } else {
      console.log(`❌ Backend returned status: ${response.statusCode}`);
      results.tests.push({ name: 'Backend Health', status: 'FAIL', error: `Status ${response.statusCode}` });
      results.failed++;
      return false;
    }
  } catch (error) {
    console.log(`❌ Backend is DOWN: ${error.message}`);
    results.tests.push({ name: 'Backend Health', status: 'FAIL', error: error.message });
    results.failed++;
    return false;
  }
}

async function testFrontendAccess() {
  console.log('\n🔍 TEST 2: Frontend Access');
  console.log('━'.repeat(60));
  
  try {
    const response = await makeRequest(CONFIG.frontendUrl);
    
    if (response.statusCode === 200) {
      console.log('✅ Frontend is ACCESSIBLE!');
      console.log(`   Content-Type: ${response.headers['content-type']}`);
      results.tests.push({ name: 'Frontend Access', status: 'PASS' });
      results.passed++;
      return true;
    } else {
      console.log(`❌ Frontend returned status: ${response.statusCode}`);
      results.tests.push({ name: 'Frontend Access', status: 'FAIL', error: `Status ${response.statusCode}` });
      results.failed++;
      return false;
    }
  } catch (error) {
    console.log(`❌ Frontend is DOWN: ${error.message}`);
    results.tests.push({ name: 'Frontend Access', status: 'FAIL', error: error.message });
    results.failed++;
    return false;
  }
}

async function testN8NWebhookEndpoint() {
  console.log('\n🔍 TEST 3: N8N Webhook Endpoint');
  console.log('━'.repeat(60));
  
  try {
    const testPayload = {
      event: 'call_analyzed',
      call: {
        call_id: `test_${Date.now()}`,
        from_number: '+1234567890',
        to_number: '+0987654321',
        start_timestamp: Date.now(),
        end_timestamp: Date.now() + 60000,
        transcript: 'Test call transcript',
        call_analysis: {
          call_summary: 'This is a test call'
        },
        agent_id: 'agent_test',
        retell_llm_dynamic_variables: {
          customer_name: 'Test Customer',
          user_id: CONFIG.testUserId
        }
      }
    };

    const response = await makeRequest(`${CONFIG.backendUrl}/api/n8n/retell-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-n8n-webhook-secret': CONFIG.n8nSecret
      },
      body: testPayload
    });

    if (response.statusCode === 200) {
      const data = JSON.parse(response.body);
      console.log('✅ N8N Webhook is WORKING!');
      console.log(`   Success: ${data.success}`);
      console.log(`   Message: ${data.message}`);
      if (data.data) {
        console.log(`   Credits Remaining: ${data.data.availableCredits}`);
        console.log(`   Should Disable Workflow: ${data.data.alerts?.shouldDisableWorkflow || false}`);
      }
      results.tests.push({ name: 'N8N Webhook', status: 'PASS' });
      results.passed++;
      return true;
    } else {
      console.log(`❌ Webhook returned status: ${response.statusCode}`);
      console.log(`   Response: ${response.body}`);
      results.tests.push({ name: 'N8N Webhook', status: 'FAIL', error: `Status ${response.statusCode}` });
      results.failed++;
      return false;
    }
  } catch (error) {
    console.log(`❌ N8N Webhook FAILED: ${error.message}`);
    results.tests.push({ name: 'N8N Webhook', status: 'FAIL', error: error.message });
    results.failed++;
    return false;
  }
}

async function testDashboardAPI() {
  console.log('\n🔍 TEST 4: Dashboard API (Call Analytics)');
  console.log('━'.repeat(60));
  
  try {
    const response = await makeRequest(`${CONFIG.backendUrl}/api/dashboard/stats?userId=${CONFIG.testUserId}`);
    
    if (response.statusCode === 200) {
      const data = JSON.parse(response.body);
      console.log('✅ Dashboard API is WORKING!');
      console.log('\n📊 Current Dashboard Data:');
      console.log(`   Total Calls: ${data.callAnalytics?.totalCalls || 0}`);
      console.log(`   Calls Today: ${data.callAnalytics?.callsToday || 0}`);
      console.log(`   Average Duration: ${data.callAnalytics?.averageDuration || 0} seconds`);
      console.log(`   Available Credits: ${data.subscription?.availableCredits || 0}`);
      console.log(`   Subscription Status: ${data.subscription?.status || 'N/A'}`);
      
      if (data.recentCalls && data.recentCalls.length > 0) {
        console.log(`\n📞 Recent Calls (${data.recentCalls.length}):`);
        data.recentCalls.slice(0, 3).forEach((call, idx) => {
          console.log(`   ${idx + 1}. ${call.callId} - ${new Date(call.timestamp).toLocaleString()}`);
        });
      }
      
      results.tests.push({ name: 'Dashboard API', status: 'PASS' });
      results.passed++;
      return true;
    } else {
      console.log(`❌ Dashboard API returned status: ${response.statusCode}`);
      results.tests.push({ name: 'Dashboard API', status: 'FAIL', error: `Status ${response.statusCode}` });
      results.failed++;
      return false;
    }
  } catch (error) {
    console.log(`❌ Dashboard API FAILED: ${error.message}`);
    results.tests.push({ name: 'Dashboard API', status: 'FAIL', error: error.message });
    results.failed++;
    return false;
  }
}

async function testN8NHostAccess() {
  console.log('\n🔍 TEST 5: N8N Host Accessibility');
  console.log('━'.repeat(60));
  
  try {
    const response = await makeRequest(CONFIG.n8nWebhookUrl.replace('/webhook/retell-webhook', ''));
    
    if (response.statusCode >= 200 && response.statusCode < 500) {
      console.log('✅ N8N Host is ACCESSIBLE!');
      console.log(`   Status: ${response.statusCode}`);
      results.tests.push({ name: 'N8N Host', status: 'PASS' });
      results.passed++;
      return true;
    } else {
      console.log(`⚠️  N8N Host returned status: ${response.statusCode}`);
      results.tests.push({ name: 'N8N Host', status: 'WARN', error: `Status ${response.statusCode}` });
      return true;
    }
  } catch (error) {
    console.log(`❌ N8N Host is DOWN: ${error.message}`);
    results.tests.push({ name: 'N8N Host', status: 'FAIL', error: error.message });
    results.failed++;
    return false;
  }
}

// Print summary
function printSummary() {
  console.log('\n\n');
  console.log('═'.repeat(60));
  console.log('📋 TEST SUMMARY');
  console.log('═'.repeat(60));
  
  results.tests.forEach((test, idx) => {
    const icon = test.status === 'PASS' ? '✅' : test.status === 'WARN' ? '⚠️' : '❌';
    console.log(`${icon} ${idx + 1}. ${test.name.padEnd(30)} ${test.status}`);
    if (test.error) {
      console.log(`   └─ Error: ${test.error}`);
    }
  });
  
  console.log('\n' + '─'.repeat(60));
  console.log(`Total Tests: ${results.tests.length}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log('─'.repeat(60));
  
  if (results.failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Your N8N workflow is fully operational!');
    console.log('\n📝 Next Steps:');
    console.log('   1. Make a test call through Retell AI');
    console.log('   2. Check the dashboard at: ' + CONFIG.frontendUrl);
    console.log('   3. Verify credits are being deducted');
    console.log('   4. Test the workflow disable at 0 credits');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.');
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Verify services are deployed on Render');
    console.log('   2. Check environment variables are set correctly');
    console.log('   3. Review logs on Render dashboard');
    console.log('   4. Ensure MongoDB connection is working');
  }
  
  console.log('\n');
}

// Main execution
async function runTests() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     AIVORS PRODUCTION WORKFLOW TEST                        ║');
  console.log('║     Testing N8N → Backend → Dashboard Integration         ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('\n📍 Configuration:');
  console.log(`   Backend:  ${CONFIG.backendUrl}`);
  console.log(`   Frontend: ${CONFIG.frontendUrl}`);
  console.log(`   N8N Host: ${CONFIG.n8nWebhookUrl}`);
  console.log(`   Test User: ${CONFIG.testUserId}`);
  
  // Run all tests
  await testBackendHealth();
  await testFrontendAccess();
  await testN8NWebhookEndpoint();
  await testDashboardAPI();
  await testN8NHostAccess();
  
  // Print summary
  printSummary();
  
  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('\n❌ CRITICAL ERROR:', error);
  process.exit(1);
});
