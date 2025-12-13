/**
 * Test script to verify Airtable email filtering
 * Run this to test if the email filter is working correctly
 */

require('dotenv').config();
const { getRecordsByEmail } = require('./services/airtableService');

const testEmail = 'autionix2@gmail.com';

console.log('🧪 Testing Airtable Email Filter');
console.log('================================\n');

console.log('📋 Configuration:');
console.log(`   Email to search: ${testEmail}`);
console.log(`   Airtable Base: ${process.env.AIRTABLE_BASE}`);
console.log(`   Airtable Table: ${process.env.AIRTABLE_TABLE}`);
console.log(`   Token configured: ${process.env.AIRTABLE_TOKEN ? '✅ Yes' : '❌ No'}\n`);

async function testEmailFilter() {
  try {
    console.log('🔍 Searching for records...\n');
    
    const result = await getRecordsByEmail(testEmail);
    
    console.log('✅ API Response:');
    console.log(`   Records found: ${result.records.length}`);
    console.log(`   Has more pages: ${result.offset ? 'Yes' : 'No'}\n`);
    
    if (result.records.length > 0) {
      console.log('📊 Records Details:');
      result.records.forEach((record, index) => {
        console.log(`\n   Record ${index + 1}:`);
        console.log(`   - ID: ${record.id}`);
        console.log(`   - Fields:`, JSON.stringify(record.fields, null, 6));
      });
    } else {
      console.log('⚠️  No records found!');
      console.log('\n🔍 Possible reasons:');
      console.log('   1. Email does not exist in Airtable');
      console.log('   2. Email has different casing (e.g., Autionix2@gmail.com)');
      console.log('   3. EMAIL column name is different');
      console.log('   4. Record exists in a different view');
      console.log('\n💡 Suggestions:');
      console.log('   1. Check Airtable manually for this email');
      console.log('   2. Try case-insensitive search');
      console.log('   3. Verify the EMAIL column name in Airtable');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\n🔍 Error Details:', error);
  }
}

testEmailFilter();
