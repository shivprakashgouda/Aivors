/**
 * Email utility for sending emails via SMTP
 * 
 * Required environment variables:
 * - SMTP_HOST: SMTP server hostname (e.g., smtp.gmail.com)
 * - SMTP_PORT: SMTP port (e.g., 587 for TLS, 465 for SSL)
 * - SMTP_SECURE: 'true' for SSL (port 465), 'false' for STARTTLS
 * - SMTP_PASS: SMTP password or API key
 * - EMAIL_USER: Email address to send from
 * - EMAIL_FROM_NAME: Sender name
 */

const nodemailer = require('nodemailer');

/**
 * Send email via SMTP
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML email body
 * @param {string} [options.text] - Plain text email body (optional)
 * @returns {Promise<Object>} - Nodemailer info object
 * @throws {Error} - If email sending fails
 */
async function sendMail({ to, subject, html, text }) {
  try {
    // Validate required fields
    if (!to || !subject || !html) {
      throw new Error('Missing required email fields: to, subject, html');
    }

    // Create SMTP transporter
    const isResendSMTP = process.env.SMTP_HOST?.includes('resend.com');
    
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        // For Resend SMTP: username is always "resend", password is the API key
        user: isResendSMTP ? 'resend' : process.env.EMAIL_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Email options
    // Use Resend test domain until aivors.com is verified
    // Change this back to process.env.EMAIL_USER once domain is verified
    let fromEmail = process.env.EMAIL_USER;
    if (isResendSMTP) {
      console.log('⚠️  Using Resend test domain (onboarding@resend.dev) - domain not verified yet');
      fromEmail = 'onboarding@resend.dev';
    }
    
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Aivors'}" <${fromEmail}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML if no text provided
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    console.log(`✅ Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error.message);
    throw error; // Rethrow for route to handle
  }
}

module.exports = { sendMail };
