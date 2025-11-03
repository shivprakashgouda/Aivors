/**
 * Test Email Configuration
 * 
 * Run this script locally or on Render to test SMTP settings
 * 
 * Usage:
 *   node server/test-email.js
 */

require('dotenv').config();
const { sendOTPEmail } = require('./utils/emailService');

async function testEmail() {
  console.log('\n🧪 ========== TESTING EMAIL CONFIGURATION ==========\n');
  
  const testEmail = process.env.TEST_EMAIL || 'tanmay9623bari@gmail.com';
  const testOTP = '123456';
  const testName = 'Test User';
  
  console.log('Sending test OTP email to:', testEmail);
  console.log('OTP Code:', testOTP);
  console.log('\n');
  
  try {
    const result = await sendOTPEmail(testEmail, testOTP, testName);
    
    if (result.success) {
      if (result.mode === 'test') {
        console.log('\n⚠️  TEST MODE: Email was logged but not actually sent');
        console.log('   To send real emails, set these environment variables:');
        console.log('   - SMTP_HOST=smtp.gmail.com');
        console.log('   - SMTP_PORT=587');
        console.log('   - SMTP_USER=your-email@gmail.com');
        console.log('   - SMTP_PASS=your-app-password');
      } else {
        console.log('\n✅ SUCCESS: Email sent successfully!');
        console.log('   Check your inbox at:', testEmail);
        console.log('   Message ID:', result.messageId);
      }
    } else {
      console.log('\n❌ FAILED: Email could not be sent');
      console.log('   Error:', result.error);
      console.log('   Code:', result.code);
      
      // Provide specific help based on error code
      if (result.code === 'EAUTH') {
        console.log('\n💡 Authentication failed. To fix:');
        console.log('   1. Generate Gmail App Password: https://myaccount.google.com/apppasswords');
        console.log('   2. Make sure 2FA is enabled on your Gmail');
        console.log('   3. Set SMTP_PASS to the 16-character App Password (no spaces)');
      } else if (result.code === 'ENOTFOUND') {
        console.log('\n💡 Cannot reach SMTP server. To fix:');
        console.log('   1. Check SMTP_HOST is set to: smtp.gmail.com');
        console.log('   2. Verify internet connection');
      } else if (result.code === 'ETIMEDOUT' || result.code === 'ECONNECTION') {
        console.log('\n💡 Connection timeout. To fix:');
        console.log('   1. Try SMTP_PORT=465 instead of 587');
        console.log('   2. Check firewall settings');
      }
    }
  } catch (error) {
    console.error('\n❌ UNEXPECTED ERROR:', error.message);
    console.error(error);
  }
  
  console.log('\n===================================================\n');
}

// Run the test
testEmail()
  .then(() => {
    console.log('Test completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });
