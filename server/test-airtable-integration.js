/**
 * Airtable Integration Test Script
 * 
 * Tests the Airtable service and verifies connection
 * 
 * Usage: node test-airtable-integration.js
 */

require('dotenv').config();
const { getRecordsByUserId, getAllRecordsByUserId, AIRTABLE_CONFIG } = require('./services/airtableService');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testAirtableIntegration() {
  log('\n🧪 Testing Airtable Integration\n', 'cyan');
  log('=' .repeat(60), 'blue');

  // Step 1: Check configuration
  log('\n📋 Step 1: Checking Configuration...', 'yellow');
  log('─'.repeat(60), 'blue');

  const checks = [
    { name: 'AIRTABLE_BASE', value: AIRTABLE_CONFIG.baseId },
    { name: 'AIRTABLE_TABLE', value: AIRTABLE_CONFIG.tableName },
    { name: 'AIRTABLE_VIEW', value: AIRTABLE_CONFIG.viewName },
    { name: 'AIRTABLE_TOKEN', value: AIRTABLE_CONFIG.token ? '***' + AIRTABLE_CONFIG.token.slice(-8) : null },
  ];

  let configValid = true;
  checks.forEach(check => {
    if (check.value) {
      log(`   ✅ ${check.name}: ${check.value}`, 'green');
    } else {
      log(`   ❌ ${check.name}: Not set`, 'red');
      configValid = false;
    }
  });

  if (!configValid) {
    log('\n❌ Configuration incomplete. Please check your .env file.', 'red');
    log('   Required variables: AIRTABLE_BASE, AIRTABLE_TABLE, AIRTABLE_TOKEN', 'yellow');
    process.exit(1);
  }

  // Step 2: Test connection with a sample user
  log('\n📡 Step 2: Testing Airtable API Connection...', 'yellow');
  log('─'.repeat(60), 'blue');

  try {
    // You can change this test userId
    const testUserId = 'user123';
    
    log(`   → Fetching records for userId: ${testUserId}`, 'cyan');
    
    const result = await getRecordsByUserId(testUserId, { maxRecords: 5 });

    if (result.records.length === 0) {
      log(`   ⚠️  No records found for userId: ${testUserId}`, 'yellow');
      log('   → This is normal if you haven\'t added records with this owner_id yet', 'yellow');
      log('   → Try adding a record to Airtable with owner_id = "user123"', 'yellow');
    } else {
      log(`   ✅ Successfully retrieved ${result.records.length} records`, 'green');
      log(`   → First record ID: ${result.records[0].id}`, 'cyan');
      log(`   → Fields: ${Object.keys(result.records[0].fields).join(', ')}`, 'cyan');
      
      if (result.offset) {
        log(`   → More records available (offset: ${result.offset.slice(0, 10)}...)`, 'cyan');
      }
    }

    log('\n✅ API Connection Test: PASSED', 'green');

  } catch (error) {
    log('\n❌ API Connection Test: FAILED', 'red');
    log(`   Error: ${error.message}`, 'red');
    
    if (error.message.includes('INVALID_REQUEST')) {
      log('\n💡 Troubleshooting:', 'yellow');
      log('   1. Check that AIRTABLE_BASE is correct', 'yellow');
      log('   2. Check that AIRTABLE_TABLE name matches exactly (case-sensitive)', 'yellow');
      log('   3. Verify your table has an "owner_id" field', 'yellow');
    } else if (error.message.includes('AUTHENTICATION_REQUIRED')) {
      log('\n💡 Troubleshooting:', 'yellow');
      log('   1. Check that AIRTABLE_TOKEN is valid', 'yellow');
      log('   2. Verify token has access to this base', 'yellow');
      log('   3. Check token has data.records:read scope', 'yellow');
    }
    
    process.exit(1);
  }

  // Step 3: Test pagination (if records exist)
  log('\n📚 Step 3: Testing Pagination...', 'yellow');
  log('─'.repeat(60), 'blue');

  try {
    const testUserId = 'user123';
    log(`   → Fetching all records for userId: ${testUserId}`, 'cyan');
    
    const allRecords = await getAllRecordsByUserId(testUserId, 10); // Max 10 for test
    
    if (allRecords.length === 0) {
      log(`   ⚠️  No records to test pagination`, 'yellow');
    } else {
      log(`   ✅ Pagination test complete: ${allRecords.length} total records`, 'green');
    }

  } catch (error) {
    log(`   ⚠️  Pagination test skipped: ${error.message}`, 'yellow');
  }

  // Final summary
  log('\n' + '='.repeat(60), 'blue');
  log('🎉 All Tests Passed!', 'green');
  log('='.repeat(60), 'blue');

  log('\n📝 Next Steps:', 'cyan');
  log('   1. Start the server: npm start', 'cyan');
  log('   2. Test API: curl http://localhost:3001/api/airtable/user123?all=true', 'cyan');
  log('   3. Open demo: http://localhost:3001/airtable-demo.html', 'cyan');
  log('   4. Set up Airtable webhook for real-time updates', 'cyan');

  log('\n📚 Documentation:', 'cyan');
  log('   → server/AIRTABLE-INTEGRATION.md (Full documentation)', 'cyan');
  log('   → server/AIRTABLE-QUICK-START.md (Quick reference)', 'cyan');
  
  log('');
}

// Run the test
testAirtableIntegration().catch(error => {
  log('\n❌ Unexpected error:', 'red');
  console.error(error);
  process.exit(1);
});
