const nodemailer = require('nodemailer');

const createTransporter = () => {
  console.log('\n ========== EMAIL CONFIGURATION CHECK ==========');
  console.log('Environment Variables Present:');
  console.log('  EMAIL_SERVICE:', process.env.EMAIL_SERVICE || 'NOT SET');
  console.log('  EMAIL_USER:', process.env.EMAIL_USER || 'NOT SET');
  console.log('  EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? `${process.env.EMAIL_PASSWORD.substring(0, 4)}****` : 'NOT SET');
  console.log('  SMTP_HOST:', process.env.SMTP_HOST || 'NOT SET');
  console.log('  SMTP_PORT:', process.env.SMTP_PORT || 'NOT SET');
  console.log('  SMTP_USER:', process.env.SMTP_USER || 'NOT SET');
  console.log('  SMTP_PASS:', process.env.SMTP_PASS ? `${process.env.SMTP_PASS.substring(0, 4)}****` : 'NOT SET');
  console.log('================================================\n');

  try {
    const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASSWORD;
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || '587');
    const smtpSecure = smtpPort === 465;

    if (!smtpUser || !smtpPass) {
      console.error(' CRITICAL: SMTP credentials are missing!');
      console.error('   Required: SMTP_USER and SMTP_PASS (or EMAIL_USER and EMAIL_PASSWORD)');
      console.log('  Falling back to TEST MODE - emails will only be logged, not sent.\n');
      return null;
    }

    console.log(' Creating SMTP transporter with:');
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
        console.error('\n ========== SMTP CONNECTION FAILED ==========');
        console.error('Error Name:', error.name);
        console.error('Error Message:', error.message);
        console.error('Error Code:', error.code);
        if (error.command) console.error('Failed Command:', error.command);
        if (error.response) console.error('Server Response:', error.response);
        if (error.responseCode) console.error('Response Code:', error.responseCode);
        console.error('==============================================\n');
      } else {
        console.log('\n ========== SMTP CONNECTION VERIFIED ==========');
        console.log('   Server is ready to send emails!');
        console.log('=================================================\n');
      }
    });

    return transporter;
  } catch (error) {
    console.error('\n ========== TRANSPORTER CREATION FAILED ==========');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('====================================================\n');
    console.log('  Falling back to test mode.');
    return null;
  }
};

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const sendOTPEmail = async (email, otp, name) => {
  console.log('\n ========== SENDING OTP EMAIL ==========');
  console.log('To:', email);
  console.log('OTP:', otp);
  console.log('Name:', name);
  console.log('=========================================\n');

  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.log('\n ============ EMAIL OTP (TEST MODE) ============');
      console.log(`To: ${email}`);
      console.log(`Name: ${name}`);
      console.log(`OTP: ${otp}`);
      console.log('============================================\n');
      return { success: true, mode: 'test' };
    }

    const fromEmail = process.env.SMTP_USER || process.env.EMAIL_USER;
    const fromName = process.env.EMAIL_FROM_NAME || 'Aivors';

    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: email,
      subject: 'Verify Your Email - Aivors',
      html: `<!DOCTYPE html><html><body>Hi ${name}, your OTP is <strong>${otp}</strong></body></html>`,
      text: `Hi ${name}, your OTP is ${otp}`,
    };

    console.log(' Attempting to send OTP email...');
    const info = await transporter.sendMail(mailOptions);

    console.log('\n ========== EMAIL SENT SUCCESSFULLY ==========');
    console.log('   Message ID:', info.messageId);
    console.log('================================================\n');

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('\n ========== EMAIL SENDING FAILED ==========');
    console.error('Error Message:', error.message);
    console.error('=============================================\n');
    return { success: false, error: error.message, code: error.code };
  }
};

const sendWelcomeEmail = async (email, name) => {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.log(`\n Welcome email would be sent to: ${email}`);
      return { success: true, mode: 'test' };
    }

    const fromEmail = process.env.SMTP_USER || process.env.EMAIL_USER;
    const fromName = process.env.EMAIL_FROM_NAME || 'Aivors';

    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: email,
      subject: 'Welcome to Aivors - Your AI Voice Platform!',
      html: `<p>Welcome aboard, ${name}!</p>`,
      text: `Welcome aboard, ${name}!`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(' Welcome email sent to:', email);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(' Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
};

const sendDemoBookingEmail = async (demoData) => {
  try {
    const transporter = createTransporter();
    const { fullName, phone, email, businessName, timeSlot, additionalInfo } = demoData;
    if (!transporter) {
      console.log('\n ============ DEMO BOOKING (TEST MODE) ============');
      console.log(`Name: ${fullName}, Email: ${email}`);
      console.log('============================================\n');
      return { success: true, mode: 'test' };
    }

    const fromEmail = process.env.SMTP_USER || process.env.EMAIL_USER;
    const fromName = process.env.EMAIL_FROM_NAME || 'Aivors';
    const demoEmail = process.env.DEMO_EMAIL || fromEmail;

    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: demoEmail,
      replyTo: email,
      subject: ` New Demo Booking: ${businessName}`,
      html: `<p>New demo booking from ${fullName} (${email})</p>`,
      text: `New demo booking from ${fullName} (${email})`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(' Demo booking email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(' Error sending demo booking email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  generateOTP,
  sendOTPEmail,
  sendWelcomeEmail,
  sendDemoBookingEmail,
};