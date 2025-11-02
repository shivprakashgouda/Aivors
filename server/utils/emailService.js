const nodemailer = require('nodemailer');

// Create email transporter
const createTransporter = () => {
  // For Render deployment, use environment variables
  // You can use Gmail, SendGrid, AWS SES, or any SMTP service
  
  try {
    if (process.env.EMAIL_SERVICE === 'gmail') {
      // Validate Gmail configuration
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.log('⚠️  Gmail credentials missing. Using test mode.');
        return null;
      }
      
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD, // Use App Password for Gmail
        },
      });
    } else if (process.env.EMAIL_SERVICE === 'smtp') {
      // Validate SMTP configuration
      if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
        console.log('⚠️  SMTP credentials missing. Using test mode.');
        return null;
      }
      
      return nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });
    } else {
      // Development mode - use ethereal.email for testing
      // This won't actually send emails, but will log them
      console.log('⚠️  Email service not configured. Using test mode (emails will be logged).');
      return null;
    }
  } catch (error) {
    console.error('❌ Error creating email transporter:', error.message);
    console.log('⚠️  Falling back to test mode.');
    return null;
  }
};

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email
const sendOTPEmail = async (email, otp, name) => {
  try {
    const transporter = createTransporter();
    
    // If no transporter (development mode), just log the OTP
    if (!transporter) {
      console.log('\n📧 ============ EMAIL OTP (TEST MODE) ============');
      console.log(`To: ${email}`);
      console.log(`Name: ${name}`);
      console.log(`OTP: ${otp}`);
      console.log('============================================\n');
      return { success: true, mode: 'test' };
    }

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Aivors'}" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Email - Aivors',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification</title>
        </head>
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
        </html>
      `,
      text: `
        Welcome to Aivors!
        
        Hi ${name},
        
        Thank you for signing up! To complete your registration, please use the following OTP code:
        
        ${otp}
        
        This code expires in 10 minutes.
        
        If you didn't create an account with Aivors, please ignore this email.
        
        © ${new Date().getFullYear()} Aivors. All rights reserved.
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    // Don't throw - return error result to prevent crash
    return { success: false, error: error.message };
  }
};

// Send welcome email after verification
const sendWelcomeEmail = async (email, name) => {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      console.log(`\n📧 Welcome email would be sent to: ${email}`);
      return { success: true, mode: 'test' };
    }

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Aivors'}" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Welcome to Aivors - Your AI Voice Platform!',
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">🎊 You're All Set! 🎊</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #667eea;">Welcome aboard, ${name}!</h2>
            
            <p>Your email has been verified successfully. You now have full access to your Aivors account!</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #667eea;">What's Next?</h3>
              <ul style="padding-left: 20px;">
                <li>Explore your dashboard</li>
                <li>Set up your AI voice assistant</li>
                <li>Choose a subscription plan that fits your needs</li>
                <li>Start making AI-powered calls</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.CLIENT_URL || 'https://www.aivors.com'}/dashboard" 
                 style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Go to Dashboard
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px;">Need help? Contact our support team anytime.</p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
              © ${new Date().getFullYear()} Aivors. All rights reserved.
            </p>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Welcome email sent to:', email);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
    // Don't throw error for welcome email - it's not critical
    return { success: false, error: error.message };
  }
};

// Send demo booking notification email
const sendDemoBookingEmail = async (demoData) => {
  try {
    const transporter = createTransporter();
    
    const {fullName, phone, email, businessName, timeSlot, additionalInfo } = demoData;
    
    // If no transporter (development mode), just log the booking
    if (!transporter) {
      console.log('\n📧 ============ DEMO BOOKING (TEST MODE) ============');
      console.log(`Name: ${fullName}`);
      console.log(`Email: ${email}`);
      console.log(`Phone: ${phone}`);
      console.log(`Business: ${businessName}`);
      console.log(`Time Slot: ${timeSlot || 'Not specified'}`);
      console.log(`Additional Info: ${additionalInfo || 'None'}`);
      console.log('============================================\n');
      return { success: true, mode: 'test' };
    }

    const demoEmail = process.env.DEMO_EMAIL || process.env.EMAIL_USER;

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Aivors'}" <${process.env.EMAIL_USER}>`,
      to: demoEmail,
      replyTo: email,
      subject: `🎯 New Demo Booking: ${businessName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Demo Booking</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎯 New Demo Booking!</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #667eea; margin-top: 0;">Demo Request Details</h2>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-weight: bold; width: 40%;">Full Name:</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee;">${fullName}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-weight: bold;">Email:</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee;"><a href="mailto:${email}" style="color: #667eea; text-decoration: none;">${email}</a></td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-weight: bold;">Phone:</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee;"><a href="tel:${phone}" style="color: #667eea; text-decoration: none;">${phone}</a></td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-weight: bold;">Business Name:</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee;">${businessName}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-weight: bold;">Preferred Time:</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee;">${timeSlot || 'Not specified'}</td>
                </tr>
                ${additionalInfo ? `
                <tr>
                  <td style="padding: 12px 0; font-weight: bold; vertical-align: top;">Additional Info:</td>
                  <td style="padding: 12px 0;">${additionalInfo}</td>
                </tr>
                ` : ''}
              </table>
            </div>
            
            <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; border-left: 4px solid #4caf50; margin: 20px 0;">
              <p style="margin: 0; color: #2e7d32;">
                <strong>Action Required:</strong> Please respond to this demo request within 24 hours.
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
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
