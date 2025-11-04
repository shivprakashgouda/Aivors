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

    // Determine from email - use Resend's test domain if unverified domain
    let fromEmail = process.env.EMAIL_USER || process.env.SMTP_USER || 'noreply@aivors.com';
    const fromName = process.env.EMAIL_FROM_NAME || 'Aivors';
    
    // If using Resend but EMAIL_USER is Gmail or unverified domain, use Resend's test domain
    if (transporter === 'RESEND' && (fromEmail.includes('@gmail.com') || fromEmail.includes('@aivors.com') || fromEmail.includes('@aiactivesolutions.com'))) {
      console.log('⚠️  Using Resend test domain for welcome email');
      fromEmail = 'onboarding@resend.dev';
    }

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

    // Determine from email - use Resend's test domain if unverified domain
    let fromEmail = process.env.EMAIL_USER || process.env.SMTP_USER || 'noreply@aivors.com';
    const fromName = process.env.EMAIL_FROM_NAME || 'Aivors';
    const demoEmail = process.env.DEMO_EMAIL || fromEmail;
    
    // If using Resend but EMAIL_USER is Gmail or unverified domain, use Resend's test domain
    if (transporter === 'RESEND' && (fromEmail.includes('@gmail.com') || fromEmail.includes('@aivors.com') || fromEmail.includes('@aiactivesolutions.com'))) {
      console.log('⚠️  Using Resend test domain for demo booking email');
      fromEmail = 'onboarding@resend.dev';
    }

    // Resend API
    if (transporter === 'RESEND') {
      const resend = createResendClient();
      const { data, error } = await resend.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to: [demoEmail],
        replyTo: email,
        subject: `🎯 New Demo Booking: ${businessName}`,
        html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🎯 New Demo Request</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">From Aivors Website</p>
  </div>
  
  <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h2 style="color: #667eea; margin-top: 0; border-bottom: 2px solid #667eea; padding-bottom: 10px;">Contact Information</h2>
    
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <tr>
        <td style="padding: 12px; background: #f9f9f9; border: 1px solid #e0e0e0; font-weight: bold; width: 40%;">👤 Full Name:</td>
        <td style="padding: 12px; background: white; border: 1px solid #e0e0e0;">${fullName}</td>
      </tr>
      <tr>
        <td style="padding: 12px; background: #f9f9f9; border: 1px solid #e0e0e0; font-weight: bold;">📧 Email:</td>
        <td style="padding: 12px; background: white; border: 1px solid #e0e0e0;"><a href="mailto:${email}" style="color: #667eea; text-decoration: none;">${email}</a></td>
      </tr>
      <tr>
        <td style="padding: 12px; background: #f9f9f9; border: 1px solid #e0e0e0; font-weight: bold;">📱 Phone:</td>
        <td style="padding: 12px; background: white; border: 1px solid #e0e0e0;"><a href="tel:${phone}" style="color: #667eea; text-decoration: none;">${phone}</a></td>
      </tr>
      <tr>
        <td style="padding: 12px; background: #f9f9f9; border: 1px solid #e0e0e0; font-weight: bold;">🏢 Business Name:</td>
        <td style="padding: 12px; background: white; border: 1px solid #e0e0e0;">${businessName}</td>
      </tr>
      ${timeSlot ? `<tr>
        <td style="padding: 12px; background: #f9f9f9; border: 1px solid #e0e0e0; font-weight: bold;">🕐 Preferred Time:</td>
        <td style="padding: 12px; background: white; border: 1px solid #e0e0e0;">${timeSlot}</td>
      </tr>` : ''}
      ${additionalInfo ? `<tr>
        <td style="padding: 12px; background: #f9f9f9; border: 1px solid #e0e0e0; font-weight: bold; vertical-align: top;">📝 Additional Info:</td>
        <td style="padding: 12px; background: white; border: 1px solid #e0e0e0;">${additionalInfo.replace(/\n/g, '<br>')}</td>
      </tr>` : ''}
    </table>

    <div style="background: #f0f7ff; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 14px;"><strong>📅 Submitted:</strong> ${new Date().toLocaleString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      })}</p>
    </div>

    <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
      <a href="mailto:${email}" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 5px;">Reply to Client</a>
      <a href="tel:${phone}" style="display: inline-block; background: #764ba2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 5px;">Call Client</a>
    </div>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
    
    <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
      This is an automated notification from Aivors Demo Booking System<br>
      © ${new Date().getFullYear()} Aivors. All rights reserved.
    </p>
  </div>
</body>
</html>`,
        text: `🎯 NEW DEMO BOOKING REQUEST

Contact Information:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 Full Name: ${fullName}
📧 Email: ${email}
📱 Phone: ${phone}
🏢 Business: ${businessName}
${timeSlot ? `🕐 Preferred Time: ${timeSlot}` : ''}
${additionalInfo ? `\n📝 Additional Information:\n${additionalInfo}` : ''}

📅 Submitted: ${new Date().toLocaleString()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Quick Actions:
• Reply: ${email}
• Call: ${phone}

---
This is an automated notification from Aivors Demo Booking System
© ${new Date().getFullYear()} Aivors. All rights reserved.`,
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
      html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #667eea;">🎯 New Demo Request</h2>
  <p><strong>Full Name:</strong> ${fullName}</p>
  <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
  <p><strong>Phone:</strong> <a href="tel:${phone}">${phone}</a></p>
  <p><strong>Business:</strong> ${businessName}</p>
  ${timeSlot ? `<p><strong>Preferred Time:</strong> ${timeSlot}</p>` : ''}
  ${additionalInfo ? `<p><strong>Additional Info:</strong><br>${additionalInfo.replace(/\n/g, '<br>')}</p>` : ''}
  <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
</body>
</html>`,
      text: `NEW DEMO BOOKING

Name: ${fullName}
Email: ${email}
Phone: ${phone}
Business: ${businessName}
${timeSlot ? `Time: ${timeSlot}` : ''}
${additionalInfo ? `\nAdditional Info:\n${additionalInfo}` : ''}

Submitted: ${new Date().toLocaleString()}`,
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
