// Quick test script to verify Resend API key
require('dotenv').config();
const { Resend } = require('resend');

const apiKey = process.env.RESEND_API_KEY || 're_T2q2X2uU_NJJ6sNWAaAi5f3XbXocEtziS';

console.log('\n🔍 ========== TESTING RESEND API KEY ==========');
console.log('API Key:', apiKey);
console.log('Format Valid:', apiKey.startsWith('re_') ? '✅' : '❌');
console.log('Length:', apiKey.length, 'chars');
console.log('==============================================\n');

const resend = new Resend(apiKey);

// Try to send a test email
async function testResendAPI() {
  try {
    console.log('📤 Attempting to send test email via Resend...\n');
    
    const { data, error } = await resend.emails.send({
      from: 'Aivors <onboarding@resend.dev>', // Use Resend's test domain
      to: ['tanmaybari01@gmail.com'],
      subject: 'Test Email - Resend API Verification',
      html: '<p>If you receive this email, your Resend API key is working! ✅</p>',
      text: 'If you receive this email, your Resend API key is working!',
    });

    if (error) {
      console.error('❌ ========== RESEND API ERROR ==========');
      console.error('Status Code:', error.statusCode);
      console.error('Error Name:', error.name);
      console.error('Error Message:', error.message);
      console.error('=========================================\n');
      
      if (error.statusCode === 403) {
        console.log('💡 HINT: API key is invalid, expired, or revoked');
        console.log('   Action: Generate a new API key at https://resend.com/api-keys\n');
      }
      
      if (error.statusCode === 400) {
        console.log('💡 HINT: API key format is invalid or account not verified');
        console.log('   Actions:');
        console.log('   1. Check your Resend account is verified');
        console.log('   2. Generate a new API key at https://resend.com/api-keys');
        console.log('   3. Make sure you copied the FULL key (starts with re_)\n');
      }
      
      process.exit(1);
    }

    console.log('✅ ========== EMAIL SENT SUCCESSFULLY ==========');
    console.log('Email ID:', data.id);
    console.log('Status: Email sent via Resend API');
    console.log('Action: Check tanmaybari01@gmail.com inbox');
    console.log('================================================\n');
    
    console.log('🎉 SUCCESS! Your Resend API key is working correctly!\n');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ ========== UNEXPECTED ERROR ==========');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('=========================================\n');
    process.exit(1);
  }
}

testResendAPI();
