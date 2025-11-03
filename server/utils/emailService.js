const nodemailer = require('nodemailer');const nodemailer = require('nodemailer');



// Create email transporter// Create email transporter

const createTransporter = () => {const createTransporter = () => {

  console.log('\n🔧 ========== EMAIL CONFIGURATION CHECK ==========');  // For Render deployment, use environment variables

  console.log('Environment Variables Present:');  // You can use Gmail, SendGrid, AWS SES, or any SMTP service

  console.log('  EMAIL_SERVICE:', process.env.EMAIL_SERVICE || 'NOT SET');  

  console.log('  EMAIL_USER:', process.env.EMAIL_USER || 'NOT SET');  console.log('🔧 Email Configuration Check:');

  console.log('  EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? `${process.env.EMAIL_PASSWORD.substring(0, 4)}****` : 'NOT SET');  console.log('  EMAIL_SERVICE:', process.env.EMAIL_SERVICE);

  console.log('  SMTP_HOST:', process.env.SMTP_HOST || 'NOT SET');  console.log('  EMAIL_USER:', process.env.EMAIL_USER);

  console.log('  SMTP_PORT:', process.env.SMTP_PORT || 'NOT SET');  console.log('  EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? `${process.env.EMAIL_PASSWORD.substring(0, 4)}****` : 'NOT SET');

  console.log('  SMTP_USER:', process.env.SMTP_USER || 'NOT SET');  

  console.log('  SMTP_PASS:', process.env.SMTP_PASS ? `${process.env.SMTP_PASS.substring(0, 4)}****` : 'NOT SET');  try {

  console.log('================================================\n');    if (process.env.EMAIL_SERVICE === 'gmail') {

        // Validate Gmail configuration

  try {      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {

    // Support both naming conventions: SMTP_USER/SMTP_PASS (Render) and EMAIL_USER/EMAIL_PASSWORD (legacy)        console.log('⚠️  Gmail credentials missing. Using test mode.');

    const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;        return null;

    const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASSWORD;      }

    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';      

    const smtpPort = parseInt(process.env.SMTP_PORT || '587');      console.log('📧 Creating Gmail transporter with explicit SMTP settings...');

    const smtpSecure = smtpPort === 465; // Auto-determine: 465 = true, 587 = false      

          // Use explicit SMTP settings for better reliability

    // Check if credentials are available      const transporter = nodemailer.createTransport({

    if (!smtpUser || !smtpPass) {        host: process.env.SMTP_HOST || 'smtp.gmail.com',

      console.error('❌ CRITICAL: SMTP credentials are missing!');        port: parseInt(process.env.SMTP_PORT || '465'),

      console.error('   Required: SMTP_USER and SMTP_PASS (or EMAIL_USER and EMAIL_PASSWORD)');        secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465' || true, // true for 465, false for other ports

      console.error('   SMTP_USER:', smtpUser || 'NOT SET');        auth: {

      console.error('   SMTP_PASS:', smtpPass ? 'SET ✓' : 'NOT SET ✗');          user: process.env.EMAIL_USER,

      console.log('⚠️  Falling back to TEST MODE - emails will only be logged, not sent.\n');          pass: process.env.EMAIL_PASSWORD, // Use App Password for Gmail

      return null;        },

    }        debug: true, // Enable debug logging

            logger: true, // Log to console

    console.log('📧 Creating SMTP transporter with:');      });

    console.log('   Host:', smtpHost);      

    console.log('   Port:', smtpPort);      // Verify connection

    console.log('   Secure:', smtpSecure, `(${smtpSecure ? 'SSL/TLS' : 'STARTTLS'})`);      transporter.verify((error, success) => {

    console.log('   User:', smtpUser);        if (error) {

    console.log('   Pass:', smtpPass.substring(0, 4) + '****');          console.error('❌ Gmail SMTP connection failed:', error.message);

            } else {

    const transporter = nodemailer.createTransport({          console.log('✅ Gmail SMTP connection verified successfully!');

      host: smtpHost,        }

      port: smtpPort,      });

      secure: smtpSecure,      

      auth: {      return transporter;

        user: smtpUser,    } else if (process.env.EMAIL_SERVICE === 'smtp') {

        pass: smtpPass,      // Validate SMTP configuration

      },      if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {

      debug: true, // Enable debug logging        console.log('⚠️  SMTP credentials missing. Using test mode.');

      logger: true, // Log to console        return null;

      // Add connection timeout and other settings      }

      connectionTimeout: 10000, // 10 seconds      

      greetingTimeout: 10000,      console.log('📧 Creating custom SMTP transporter...');

      socketTimeout: 10000,      

    });      return nodemailer.createTransporter({

            host: process.env.SMTP_HOST,

    // Verify connection asynchronously        port: parseInt(process.env.SMTP_PORT || '587'),

    console.log('🔍 Verifying SMTP connection...');        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports

    transporter.verify((error, success) => {        auth: {

      if (error) {          user: process.env.SMTP_USER,

        console.error('\n❌ ========== SMTP CONNECTION FAILED ==========');          pass: process.env.SMTP_PASSWORD,

        console.error('Error Name:', error.name);        },

        console.error('Error Message:', error.message);        debug: true,

        console.error('Error Code:', error.code);        logger: true,

        if (error.command) console.error('Failed Command:', error.command);      });

        if (error.response) console.error('Server Response:', error.response);    } else {

        if (error.responseCode) console.error('Response Code:', error.responseCode);      // Development mode - use ethereal.email for testing

        console.error('==============================================\n');      // This won't actually send emails, but will log them

              console.log('⚠️  Email service not configured. Using test mode (emails will be logged).');

        // Common error hints      return null;

        if (error.code === 'EAUTH') {    }

          console.error('💡 HINT: Authentication failed. Check:');  } catch (error) {

          console.error('   1. Using Gmail App Password (not your regular password)');    console.error('❌ Error creating email transporter:', error.message);

          console.error('   2. App Password is correctly copied (no spaces)');    console.log('⚠️  Falling back to test mode.');

          console.error('   3. 2FA is enabled on your Gmail account');    return null;

          console.error('   Generate App Password: https://myaccount.google.com/apppasswords\n');  }

        } else if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {};

          console.error('💡 HINT: Cannot reach SMTP server. Check:');

          console.error('   1. SMTP_HOST is correct (smtp.gmail.com)');// Generate 6-digit OTP

          console.error('   2. Server has internet connection');const generateOTP = () => {

          console.error('   3. Firewall allows outbound SMTP traffic\n');  return Math.floor(100000 + Math.random() * 900000).toString();

        } else if (error.code === 'ECONNECTION') {};

          console.error('💡 HINT: Connection refused. Check:');

          console.error('   1. SMTP_PORT is correct (587 or 465)');// Send OTP email

          console.error('   2. Port is not blocked by firewall\n');const sendOTPEmail = async (email, otp, name) => {

        }  try {

      } else {    const transporter = createTransporter();

        console.log('\n✅ ========== SMTP CONNECTION VERIFIED ==========');    

        console.log('   Server is ready to send emails!');    // If no transporter (development mode), just log the OTP

        console.log('=================================================\n');    if (!transporter) {

      }      console.log('\n📧 ============ EMAIL OTP (TEST MODE) ============');

    });      console.log(`To: ${email}`);

          console.log(`Name: ${name}`);

    return transporter;      console.log(`OTP: ${otp}`);

  } catch (error) {      console.log('============================================\n');

    console.error('\n❌ ========== TRANSPORTER CREATION FAILED ==========');      return { success: true, mode: 'test' };

    console.error('Error:', error.message);    }

    console.error('Stack:', error.stack);

    console.error('====================================================\n');    const mailOptions = {

    console.log('⚠️  Falling back to test mode.');      from: `"${process.env.EMAIL_FROM_NAME || 'Aivors'}" <${process.env.EMAIL_USER}>`,

    return null;      to: email,

  }      subject: 'Verify Your Email - Aivors',

};      html: `

        <!DOCTYPE html>

// Generate 6-digit OTP        <html>

const generateOTP = () => {        <head>

  return Math.floor(100000 + Math.random() * 900000).toString();          <meta charset="utf-8">

};          <meta name="viewport" content="width=device-width, initial-scale=1.0">

          <title>Email Verification</title>

// Send OTP email        </head>

const sendOTPEmail = async (email, otp, name) => {        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

  console.log('\n📤 ========== SENDING OTP EMAIL ==========');          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">

  console.log('To:', email);            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Aivors! 🎉</h1>

  console.log('OTP:', otp);          </div>

  console.log('Name:', name);          

  console.log('=========================================\n');          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">

              <h2 style="color: #667eea; margin-top: 0;">Hi ${name}!</h2>

  try {            

    const transporter = createTransporter();            <p>Thank you for signing up! To complete your registration, please verify your email address using the OTP below:</p>

                

    // If no transporter (development mode), just log the OTP            <div style="background: white; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">

    if (!transporter) {              <p style="margin: 0; color: #666; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Your OTP Code</p>

      console.log('\n📧 ============ EMAIL OTP (TEST MODE) ============');              <h1 style="margin: 10px 0; color: #667eea; font-size: 42px; letter-spacing: 8px; font-weight: bold;">${otp}</h1>

      console.log(`To: ${email}`);              <p style="margin: 0; color: #999; font-size: 12px;">This code expires in 10 minutes</p>

      console.log(`Name: ${name}`);            </div>

      console.log(`OTP: ${otp}`);            

      console.log('============================================\n');            <p style="color: #666; font-size: 14px;">If you didn't create an account with Aivors, please ignore this email.</p>

      return { success: true, mode: 'test' };            

    }            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

            

    const fromEmail = process.env.SMTP_USER || process.env.EMAIL_USER;            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">

    const fromName = process.env.EMAIL_FROM_NAME || 'Aivors';              © ${new Date().getFullYear()} Aivors. All rights reserved.<br>

                  This is an automated email, please do not reply.

    const mailOptions = {            </p>

      from: `"${fromName}" <${fromEmail}>`,          </div>

      to: email,        </body>

      subject: 'Verify Your Email - Aivors',        </html>

      html: `      `,

        <!DOCTYPE html>      text: `

        <html>        Welcome to Aivors!

        <head>        

          <meta charset="utf-8">        Hi ${name},

          <meta name="viewport" content="width=device-width, initial-scale=1.0">        

          <title>Email Verification</title>        Thank you for signing up! To complete your registration, please use the following OTP code:

        </head>        

        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">        ${otp}

          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">        

            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Aivors! 🎉</h1>        This code expires in 10 minutes.

          </div>        

                  If you didn't create an account with Aivors, please ignore this email.

          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">        

            <h2 style="color: #667eea; margin-top: 0;">Hi ${name}!</h2>        © ${new Date().getFullYear()} Aivors. All rights reserved.

                  `,

            <p>Thank you for signing up! To complete your registration, please verify your email address using the OTP below:</p>    };

            

            <div style="background: white; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">    console.log('📤 Attempting to send OTP email to:', email);

              <p style="margin: 0; color: #666; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Your OTP Code</p>    console.log('📤 From:', mailOptions.from);

              <h1 style="margin: 10px 0; color: #667eea; font-size: 42px; letter-spacing: 8px; font-weight: bold;">${otp}</h1>    

              <p style="margin: 0; color: #999; font-size: 12px;">This code expires in 10 minutes</p>    const info = await transporter.sendMail(mailOptions);

            </div>    console.log('✅ Email sent successfully!');

                console.log('   Message ID:', info.messageId);

            <p style="color: #666; font-size: 14px;">If you didn't create an account with Aivors, please ignore this email.</p>    console.log('   Response:', info.response);

                console.log('   Accepted:', info.accepted);

            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">    console.log('   Rejected:', info.rejected);

                return { success: true, messageId: info.messageId };

            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">  } catch (error) {

              © ${new Date().getFullYear()} Aivors. All rights reserved.<br>    console.error('❌ Error sending email:');

              This is an automated email, please do not reply.    console.error('   Error name:', error.name);

            </p>    console.error('   Error message:', error.message);

          </div>    console.error('   Error code:', error.code);

        </body>    console.error('   Error command:', error.command);

        </html>    if (error.response) {

      `,      console.error('   Server response:', error.response);

      text: `    }

        Welcome to Aivors!    if (error.responseCode) {

              console.error('   Response code:', error.responseCode);

        Hi ${name},    }

            // Don't throw - return error result to prevent crash

        Thank you for signing up! To complete your registration, please use the following OTP code:    return { success: false, error: error.message };

          }

        ${otp}};

        

        This code expires in 10 minutes.// Send welcome email after verification

        const sendWelcomeEmail = async (email, name) => {

        If you didn't create an account with Aivors, please ignore this email.  try {

            const transporter = createTransporter();

        © ${new Date().getFullYear()} Aivors. All rights reserved.    

      `,    if (!transporter) {

    };      console.log(`\n📧 Welcome email would be sent to: ${email}`);

      return { success: true, mode: 'test' };

    console.log('📤 Attempting to send OTP email...');    }

    console.log('   From:', mailOptions.from);

    console.log('   To:', email);    const mailOptions = {

    console.log('   Subject:', mailOptions.subject);      from: `"${process.env.EMAIL_FROM_NAME || 'Aivors'}" <${process.env.EMAIL_USER}>`,

          to: email,

    const info = await transporter.sendMail(mailOptions);      subject: 'Welcome to Aivors - Your AI Voice Platform!',

          html: `

    console.log('\n✅ ========== EMAIL SENT SUCCESSFULLY ==========');        <!DOCTYPE html>

    console.log('   Message ID:', info.messageId);        <html>

    console.log('   Response:', info.response);        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

    console.log('   Accepted:', info.accepted);          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">

    console.log('   Rejected:', info.rejected);            <h1 style="color: white; margin: 0;">🎊 You're All Set! 🎊</h1>

    console.log('================================================\n');          </div>

              

    return { success: true, messageId: info.messageId };          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">

  } catch (error) {            <h2 style="color: #667eea;">Welcome aboard, ${name}!</h2>

    console.error('\n❌ ========== EMAIL SENDING FAILED ==========');            

    console.error('Error Name:', error.name);            <p>Your email has been verified successfully. You now have full access to your Aivors account!</p>

    console.error('Error Message:', error.message);            

    console.error('Error Code:', error.code);            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">

    console.error('Error Command:', error.command);              <h3 style="margin-top: 0; color: #667eea;">What's Next?</h3>

    if (error.response) {              <ul style="padding-left: 20px;">

      console.error('Server Response:', error.response);                <li>Explore your dashboard</li>

    }                <li>Set up your AI voice assistant</li>

    if (error.responseCode) {                <li>Choose a subscription plan that fits your needs</li>

      console.error('Response Code:', error.responseCode);                <li>Start making AI-powered calls</li>

    }              </ul>

    console.error('Full Error:', error);            </div>

    console.error('=============================================\n');            

                <div style="text-align: center; margin: 30px 0;">

    // Don't throw - return error result to prevent crash              <a href="${process.env.CLIENT_URL || 'https://www.aivors.com'}/dashboard" 

    return { success: false, error: error.message, code: error.code };                 style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">

  }                Go to Dashboard

};              </a>

            </div>

// Send welcome email after verification            

const sendWelcomeEmail = async (email, name) => {            <p style="color: #666; font-size: 14px;">Need help? Contact our support team anytime.</p>

  try {            

    const transporter = createTransporter();            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

                

    if (!transporter) {            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">

      console.log(`\n📧 Welcome email would be sent to: ${email}`);              © ${new Date().getFullYear()} Aivors. All rights reserved.

      return { success: true, mode: 'test' };            </p>

    }          </div>

        </body>

    const fromEmail = process.env.SMTP_USER || process.env.EMAIL_USER;        </html>

    const fromName = process.env.EMAIL_FROM_NAME || 'Aivors';      `,

        };

    const mailOptions = {

      from: `"${fromName}" <${fromEmail}>`,    await transporter.sendMail(mailOptions);

      to: email,    console.log('✅ Welcome email sent to:', email);

      subject: 'Welcome to Aivors - Your AI Voice Platform!',    return { success: true };

      html: `  } catch (error) {

        <!DOCTYPE html>    console.error('❌ Error sending welcome email:', error);

        <html>    // Don't throw error for welcome email - it's not critical

        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">    return { success: false, error: error.message };

          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">  }

            <h1 style="color: white; margin: 0;">🎊 You're All Set! 🎊</h1>};

          </div>

          // Send demo booking notification email

          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">const sendDemoBookingEmail = async (demoData) => {

            <h2 style="color: #667eea;">Welcome aboard, ${name}!</h2>  try {

                const transporter = createTransporter();

            <p>Your email has been verified successfully. You now have full access to your Aivors account!</p>    

                const {fullName, phone, email, businessName, timeSlot, additionalInfo } = demoData;

            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">    

              <h3 style="margin-top: 0; color: #667eea;">What's Next?</h3>    // If no transporter (development mode), just log the booking

              <ul style="padding-left: 20px;">    if (!transporter) {

                <li>Explore your dashboard</li>      console.log('\n📧 ============ DEMO BOOKING (TEST MODE) ============');

                <li>Set up your AI voice assistant</li>      console.log(`Name: ${fullName}`);

                <li>Choose a subscription plan that fits your needs</li>      console.log(`Email: ${email}`);

                <li>Start making AI-powered calls</li>      console.log(`Phone: ${phone}`);

              </ul>      console.log(`Business: ${businessName}`);

            </div>      console.log(`Time Slot: ${timeSlot || 'Not specified'}`);

                  console.log(`Additional Info: ${additionalInfo || 'None'}`);

            <div style="text-align: center; margin: 30px 0;">      console.log('============================================\n');

              <a href="${process.env.CLIENT_URL || 'https://www.aivors.com'}/dashboard"       return { success: true, mode: 'test' };

                 style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">    }

                Go to Dashboard

              </a>    const demoEmail = process.env.DEMO_EMAIL || process.env.EMAIL_USER;

            </div>

                const mailOptions = {

            <p style="color: #666; font-size: 14px;">Need help? Contact our support team anytime.</p>      from: `"${process.env.EMAIL_FROM_NAME || 'Aivors'}" <${process.env.EMAIL_USER}>`,

                  to: demoEmail,

            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">      replyTo: email,

                  subject: `🎯 New Demo Booking: ${businessName}`,

            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">      html: `

              © ${new Date().getFullYear()} Aivors. All rights reserved.        <!DOCTYPE html>

            </p>        <html>

          </div>        <head>

        </body>          <meta charset="utf-8">

        </html>          <meta name="viewport" content="width=device-width, initial-scale=1.0">

      `,          <title>New Demo Booking</title>

    };        </head>

        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

    await transporter.sendMail(mailOptions);          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">

    console.log('✅ Welcome email sent to:', email);            <h1 style="color: white; margin: 0; font-size: 28px;">🎯 New Demo Booking!</h1>

    return { success: true };          </div>

  } catch (error) {          

    console.error('❌ Error sending welcome email:', error);          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">

    // Don't throw error for welcome email - it's not critical            <h2 style="color: #667eea; margin-top: 0;">Demo Request Details</h2>

    return { success: false, error: error.message };            

  }            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">

};              <table style="width: 100%; border-collapse: collapse;">

                <tr>

// Send demo booking notification email                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-weight: bold; width: 40%;">Full Name:</td>

const sendDemoBookingEmail = async (demoData) => {                  <td style="padding: 12px 0; border-bottom: 1px solid #eee;">${fullName}</td>

  try {                </tr>

    const transporter = createTransporter();                <tr>

                      <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-weight: bold;">Email:</td>

    const {fullName, phone, email, businessName, timeSlot, additionalInfo } = demoData;                  <td style="padding: 12px 0; border-bottom: 1px solid #eee;"><a href="mailto:${email}" style="color: #667eea; text-decoration: none;">${email}</a></td>

                    </tr>

    // If no transporter (development mode), just log the booking                <tr>

    if (!transporter) {                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-weight: bold;">Phone:</td>

      console.log('\n📧 ============ DEMO BOOKING (TEST MODE) ============');                  <td style="padding: 12px 0; border-bottom: 1px solid #eee;"><a href="tel:${phone}" style="color: #667eea; text-decoration: none;">${phone}</a></td>

      console.log(`Name: ${fullName}`);                </tr>

      console.log(`Email: ${email}`);                <tr>

      console.log(`Phone: ${phone}`);                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-weight: bold;">Business Name:</td>

      console.log(`Business: ${businessName}`);                  <td style="padding: 12px 0; border-bottom: 1px solid #eee;">${businessName}</td>

      console.log(`Time Slot: ${timeSlot || 'Not specified'}`);                </tr>

      console.log(`Additional Info: ${additionalInfo || 'None'}`);                <tr>

      console.log('============================================\n');                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-weight: bold;">Preferred Time:</td>

      return { success: true, mode: 'test' };                  <td style="padding: 12px 0; border-bottom: 1px solid #eee;">${timeSlot || 'Not specified'}</td>

    }                </tr>

                ${additionalInfo ? `

    const fromEmail = process.env.SMTP_USER || process.env.EMAIL_USER;                <tr>

    const fromName = process.env.EMAIL_FROM_NAME || 'Aivors';                  <td style="padding: 12px 0; font-weight: bold; vertical-align: top;">Additional Info:</td>

    const demoEmail = process.env.DEMO_EMAIL || fromEmail;                  <td style="padding: 12px 0;">${additionalInfo}</td>

                </tr>

    const mailOptions = {                ` : ''}

      from: `"${fromName}" <${fromEmail}>`,              </table>

      to: demoEmail,            </div>

      replyTo: email,            

      subject: `🎯 New Demo Booking: ${businessName}`,            <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; border-left: 4px solid #4caf50; margin: 20px 0;">

      html: `              <p style="margin: 0; color: #2e7d32;">

        <!DOCTYPE html>                <strong>Action Required:</strong> Please respond to this demo request within 24 hours.

        <html>              </p>

        <head>            </div>

          <meta charset="utf-8">            

          <meta name="viewport" content="width=device-width, initial-scale=1.0">            <div style="text-align: center; margin: 30px 0;">

          <title>New Demo Booking</title>              <a href="mailto:${email}?subject=Re: Demo Call for ${businessName}" 

        </head>                 style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">

        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">                Reply to ${fullName}

          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">              </a>

            <h1 style="color: white; margin: 0; font-size: 28px;">🎯 New Demo Booking!</h1>            </div>

          </div>            

                      <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">            

            <h2 style="color: #667eea; margin-top: 0;">Demo Request Details</h2>            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">

                          Received on ${new Date().toLocaleString()}<br>

            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">              © ${new Date().getFullYear()} Aivors. All rights reserved.

              <table style="width: 100%; border-collapse: collapse;">            </p>

                <tr>          </div>

                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-weight: bold; width: 40%;">Full Name:</td>        </body>

                  <td style="padding: 12px 0; border-bottom: 1px solid #eee;">${fullName}</td>        </html>

                </tr>      `,

                <tr>      text: `

                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-weight: bold;">Email:</td>        New Demo Booking Request

                  <td style="padding: 12px 0; border-bottom: 1px solid #eee;"><a href="mailto:${email}" style="color: #667eea; text-decoration: none;">${email}</a></td>        

                </tr>        Full Name: ${fullName}

                <tr>        Email: ${email}

                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-weight: bold;">Phone:</td>        Phone: ${phone}

                  <td style="padding: 12px 0; border-bottom: 1px solid #eee;"><a href="tel:${phone}" style="color: #667eea; text-decoration: none;">${phone}</a></td>        Business Name: ${businessName}

                </tr>        Preferred Time: ${timeSlot || 'Not specified'}

                <tr>        ${additionalInfo ? `\nAdditional Information:\n${additionalInfo}` : ''}

                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-weight: bold;">Business Name:</td>        

                  <td style="padding: 12px 0; border-bottom: 1px solid #eee;">${businessName}</td>        Received on ${new Date().toLocaleString()}

                </tr>        

                <tr>        Please respond to this demo request within 24 hours.

                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-weight: bold;">Preferred Time:</td>      `,

                  <td style="padding: 12px 0; border-bottom: 1px solid #eee;">${timeSlot || 'Not specified'}</td>    };

                </tr>

                ${additionalInfo ? `    const info = await transporter.sendMail(mailOptions);

                <tr>    console.log('✅ Demo booking email sent successfully:', info.messageId);

                  <td style="padding: 12px 0; font-weight: bold; vertical-align: top;">Additional Info:</td>    return { success: true, messageId: info.messageId };

                  <td style="padding: 12px 0;">${additionalInfo}</td>  } catch (error) {

                </tr>    console.error('❌ Error sending demo booking email:', error);

                ` : ''}    // Don't throw - return error result to prevent crash

              </table>    return { success: false, error: error.message };

            </div>  }

            };

            <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; border-left: 4px solid #4caf50; margin: 20px 0;">

              <p style="margin: 0; color: #2e7d32;">module.exports = {

                <strong>Action Required:</strong> Please respond to this demo request within 24 hours.  generateOTP,

              </p>  sendOTPEmail,

            </div>  sendWelcomeEmail,

              sendDemoBookingEmail,

            <div style="text-align: center; margin: 30px 0;">};

              <a href="mailto:${email}?subject=Re: Demo Call for ${businessName}" 
                 style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Reply to ${fullName}
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
              Received on ${new Date().toLocaleString()}<br>
              © ${new Date().getFullYear()} Aivors. All rights reserved.
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
        New Demo Booking Request
        
        Full Name: ${fullName}
        Email: ${email}
        Phone: ${phone}
        Business Name: ${businessName}
        Preferred Time: ${timeSlot || 'Not specified'}
        ${additionalInfo ? `\nAdditional Information:\n${additionalInfo}` : ''}
        
        Received on ${new Date().toLocaleString()}
        
        Please respond to this demo request within 24 hours.
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Demo booking email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending demo booking email:', error);
    // Don't throw - return error result to prevent crash
    return { success: false, error: error.message };
  }
};

module.exports = {
  generateOTP,
  sendOTPEmail,
  sendWelcomeEmail,
  sendDemoBookingEmail,
};
