// HYBRID EMAIL SERVICE - Supports both SMTP and Resend API
// Use Resend API on production (Render) where SMTP ports are blocked
// Use SMTP for local development

const nodemailer = require('nodemailer');
let Resend;

// Try to load Resend SDK (only if installed)
try {
  const { Resend: ResendSDK } = require('resend');
  Resend = ResendSDK;
} catch (error) {
  console.log('ℹ️  Resend SDK not installed. Install with: npm install resend');
}

// Check if Resend is configured AND has valid API key format
const isResendConfigured = () => {
  const apiKey = process.env.RESEND_API_KEY;
  // Valid Resend API key must start with 're_'
  return apiKey && apiKey.startsWith('re_') && Resend;
};

// Create Resend client
const createResendClient = () => {
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY not set');
    return null;
  }
  if (!Resend) {
    console.error('❌ Resend SDK not installed. Run: npm install resend');
    return null;
  }
  console.log('✅ Using Resend API for email delivery');
  return new Resend(process.env.RESEND_API_KEY);
};

// Create SMTP transporter (fallback)
const createTransporter = () => {
  console.log('\n🔧 ========== EMAIL CONFIGURATION CHECK ==========');
  console.log('Environment Variables Present:');
  console.log('  RESEND_API_KEY:', process.env.RESEND_API_KEY ? `${process.env.RESEND_API_KEY.substring(0, 6)}****` : 'NOT SET');
  console.log('  EMAIL_SERVICE:', process.env.EMAIL_SERVICE || 'NOT SET');
  console.log('  EMAIL_USER:', process.env.EMAIL_USER || 'NOT SET');
  console.log('  EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? `${process.env.EMAIL_PASSWORD.substring(0, 4)}****` : 'NOT SET');
  console.log('  SMTP_HOST:', process.env.SMTP_HOST || 'NOT SET');
  console.log('  SMTP_PORT:', process.env.SMTP_PORT || 'NOT SET');
  console.log('  SMTP_USER:', process.env.SMTP_USER || 'NOT SET');
  console.log('  SMTP_PASS:', process.env.SMTP_PASS ? `${process.env.SMTP_PASS.substring(0, 4)}****` : 'NOT SET');
  console.log('================================================\n');

  // Prefer Resend if configured
  if (isResendConfigured()) {
    return 'RESEND';
  }

  try {
    const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASSWORD;
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || '587');
    const smtpSecure = smtpPort === 465;

    if (!smtpUser || !smtpPass) {
      console.error('❌ CRITICAL: SMTP credentials are missing!');
      console.error('   Required: SMTP_USER and SMTP_PASS (or EMAIL_USER and EMAIL_PASSWORD)');
      console.log('⚠️  Falling back to TEST MODE - emails will only be logged, not sent.\n');
      return null;
    }

    console.log('📧 Creating SMTP transporter with:');
    console.log('   Host:', smtpHost);
    console.log('   Port:', smtpPort);
    console.log('   Secure:', smtpSecure, `(${smtpSecure ? 'SSL/TLS' : 'STARTTLS'})`);
    console.log('   User:', smtpUser);

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: { user: smtpUser, pass: smtpPass },
      debug: true,
      logger: true,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });

    transporter.verify((error) => {
      if (error) {
        console.error('\n❌ ========== SMTP CONNECTION FAILED ==========');
        console.error('Error Name:', error.name);
        console.error('Error Message:', error.message);
        console.error('Error Code:', error.code);
        if (error.command) console.error('Failed Command:', error.command);
        if (error.response) console.error('Server Response:', error.response);
        if (error.responseCode) console.error('Response Code:', error.responseCode);
        console.error('==============================================\n');
        
        if (error.code === 'ETIMEDOUT') {
          console.error('💡 HINT: SMTP port may be blocked by your hosting provider (Render, Heroku, etc.)');
          console.error('   Solution: Use Resend API instead. Set RESEND_API_KEY environment variable.');
          console.error('   Get API key: https://resend.com/api-keys\n');
        }
      } else {
        console.log('\n✅ ========== SMTP CONNECTION VERIFIED ==========');
        console.log('   Server is ready to send emails!');
        console.log('=================================================\n');
      }
    });

    return transporter;
  } catch (error) {
    console.error('\n❌ ========== TRANSPORTER CREATION FAILED ==========');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('====================================================\n');
    console.log('⚠️  Falling back to test mode.');
    return null;
  }
};

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const sendOTPEmail = async (email, otp, name) => {
  console.log('\n📤 ========== SENDING OTP EMAIL ==========');
  console.log('To:', email);
  console.log('OTP:', otp);
  console.log('Name:', name);
  console.log('=========================================\n');

  try {
    const transporter = createTransporter();
    
    // Test mode
    if (!transporter) {
      console.log('\n📧 ============ EMAIL OTP (TEST MODE) ============');
      console.log(`To: ${email}`);
      console.log(`Name: ${name}`);
      console.log(`OTP: ${otp}`);
      console.log('============================================\n');
      return { success: true, mode: 'test' };
    }

    // Determine from email - use Resend's test domain if Gmail is configured
    let fromEmail = process.env.EMAIL_USER || process.env.SMTP_USER || 'noreply@aivors.com';
    const fromName = process.env.EMAIL_FROM_NAME || 'Aivors';
    
    // If using Resend but EMAIL_USER is Gmail, use Resend's test domain instead
    if (transporter === 'RESEND' && fromEmail.includes('@gmail.com')) {
      console.log('⚠️  Gmail address detected with Resend - switching to Resend test domain');
      fromEmail = 'onboarding@resend.dev';
    }

    // Use Resend API
    if (transporter === 'RESEND') {
      const resend = createResendClient();
      console.log('📤 Sending OTP via Resend API...');
      
      const { data, error } = await resend.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to: [email],
        subject: 'Verify Your Email - Aivors',
        html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Aivors! 🎉</h1>
  </div>
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <h2 style="color: #667eea; margin-top: 0;">Hi ${name}!</h2>
    <p>Thank you for signing up! To complete your registration, please verify your email address using the OTP below:</p>
    <div style="background: white; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
      <p style="margin: 0; color: #666; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Your OTP Code</p>
      <h1 style="margin: 10px 0; color: #667eea; font-size: 42px; letter-spacing: 8px; font-weight: bold;">${otp}</h1>
      <p style="margin: 0; color: #999; font-size: 12px;">This code expires in 10 minutes</p>
    </div>
    <p style="color: #666; font-size: 14px;">If you didn't create an account with Aivors, please ignore this email.</p>
    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
    <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
      © ${new Date().getFullYear()} Aivors. All rights reserved.<br>
      This is an automated email, please do not reply.
    </p>
  </div>
</body>
</html>`,
        text: `Hi ${name},\n\nThank you for signing up! Your OTP code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you didn't create an account with Aivors, please ignore this email.\n\n© ${new Date().getFullYear()} Aivors. All rights reserved.`,
      });

      if (error) {
        console.error('\n❌ ========== RESEND API ERROR ==========');
        console.error('Error:', error);
        console.error('   Hint: Check that RESEND_API_KEY starts with "re_"');
        console.error('   Get valid key at: https://resend.com/api-keys');
        console.error('========================================\n');
        
        // If invalid API key, print the OTP to console for testing
        console.log('\n⚠️  ========== EMAIL FAILED - OTP FOR TESTING ==========');
        console.log(`   Email: ${email}`);
        console.log(`   OTP: ${otp}`);
        console.log(`   Name: ${name}`);
        console.log('   ACTION: Use this OTP to verify your account manually');
        console.log('=========================================================\n');
        
        return { success: false, error: error.message, otp: otp };
      }

      console.log('\n✅ ========== EMAIL SENT VIA RESEND ==========');
      console.log('   Email ID:', data.id);
      console.log('============================================\n');

      return { success: true, messageId: data.id, provider: 'resend' };
    }

    // Use SMTP
    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: email,
      subject: 'Verify Your Email - Aivors',
      html: `<!DOCTYPE html><html><body>Hi ${name}, your OTP is <strong>${otp}</strong></body></html>`,
      text: `Hi ${name}, your OTP is ${otp}`,
    };

    console.log('📤 Sending OTP via SMTP...');
    const info = await transporter.sendMail(mailOptions);

    console.log('\n✅ ========== EMAIL SENT VIA SMTP ==========');
    console.log('   Message ID:', info.messageId);
    console.log('==========================================\n');

    return { success: true, messageId: info.messageId, provider: 'smtp' };
  } catch (error) {
    console.error('\n❌ ========== EMAIL SENDING FAILED ==========');
    console.error('Error Message:', error.message);
    console.error('=============================================\n');
    return { success: false, error: error.message, code: error.code };
  }
};

const sendWelcomeEmail = async (email, name) => {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.log(`\n📧 Welcome email would be sent to: ${email}`);
      return { success: true, mode: 'test' };
    }

    const fromEmail = process.env.EMAIL_USER || process.env.SMTP_USER || 'noreply@aivors.com';
    const fromName = process.env.EMAIL_FROM_NAME || 'Aivors';

    // Resend API
    if (transporter === 'RESEND') {
      const resend = createResendClient();
      const { data, error } = await resend.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to: [email],
        subject: 'Welcome to Aivors - Your AI Voice Platform!',
        html: `<p>Welcome aboard, ${name}!</p>`,
        text: `Welcome aboard, ${name}!`,
      });

      if (error) return { success: false, error: error.message };
      console.log('✅ Welcome email sent via Resend to:', email);
      return { success: true, messageId: data.id, provider: 'resend' };
    }

    // SMTP
    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: email,
      subject: 'Welcome to Aivors - Your AI Voice Platform!',
      html: `<p>Welcome aboard, ${name}!</p>`,
      text: `Welcome aboard, ${name}!`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Welcome email sent via SMTP to:', email);
    return { success: true, messageId: info.messageId, provider: 'smtp' };
  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
};

const sendDemoBookingEmail = async (demoData) => {
  try {
    const transporter = createTransporter();
    const { fullName, phone, email, businessName, timeSlot, additionalInfo } = demoData;
    if (!transporter) {
      console.log('\n📧 ============ DEMO BOOKING (TEST MODE) ============');
      console.log(`Name: ${fullName}, Email: ${email}`);
      console.log('============================================\n');
      return { success: true, mode: 'test' };
    }

    const fromEmail = process.env.EMAIL_USER || process.env.SMTP_USER || 'noreply@aivors.com';
    const fromName = process.env.EMAIL_FROM_NAME || 'Aivors';
    const demoEmail = process.env.DEMO_EMAIL || fromEmail;

    // Resend API
    if (transporter === 'RESEND') {
      const resend = createResendClient();
      const { data, error } = await resend.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to: [demoEmail],
        replyTo: email,
        subject: `🎯 New Demo Booking: ${businessName}`,
        html: `<p>New demo booking from ${fullName} (${email})</p>`,
        text: `New demo booking from ${fullName} (${email})`,
      });

      if (error) return { success: false, error: error.message };
      console.log('✅ Demo booking email sent via Resend');
      return { success: true, messageId: data.id, provider: 'resend' };
    }

    // SMTP
    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: demoEmail,
      replyTo: email,
      subject: `🎯 New Demo Booking: ${businessName}`,
      html: `<p>New demo booking from ${fullName} (${email})</p>`,
      text: `New demo booking from ${fullName} (${email})`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Demo booking email sent via SMTP');
    return { success: true, messageId: info.messageId, provider: 'smtp' };
  } catch (error) {
    console.error('❌ Error sending demo booking email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  generateOTP,
  sendOTPEmail,
  sendWelcomeEmail,
  sendDemoBookingEmail,
};
