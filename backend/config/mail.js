const nodemailer = require('nodemailer');

// Cache the transporter so we don't recreate it on every email
let cachedTransporter = null;
let cachedTestAccount = null;

// Create transporter — uses Ethereal (fake SMTP) in development
const getTransporter = async () => {
  if (cachedTransporter) return cachedTransporter;

  // Development: use Ethereal (emails are captured, not delivered)
  if (process.env.NODE_ENV !== 'production') {
    // Create a test account on the fly if no credentials in .env
    if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your_email@gmail.com') {
      cachedTestAccount = await nodemailer.createTestAccount();
      console.log('📬 Ethereal test account created:', cachedTestAccount.user);
      console.log('   Emails will NOT be delivered — view them via the preview URL logged below.');

      cachedTransporter = nodemailer.createTransport({
        host: cachedTestAccount.smtp.host,
        port: cachedTestAccount.smtp.port,
        secure: cachedTestAccount.smtp.secure,
        auth: {
          user: cachedTestAccount.user,
          pass: cachedTestAccount.pass,
        },
      });
    } else {
      // Use .env Ethereal credentials if provided
      cachedTransporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
    }
  } else {
    // Production: real SMTP (Gmail, SendGrid, etc.)
    cachedTransporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  return cachedTransporter;
};

// Send email function
const sendEmail = async (options) => {
  const transporter = await getTransporter();

  const fromEmail = process.env.EMAIL_USER || (cachedTestAccount && cachedTestAccount.user) || 'noreply@dukaflow.app';
  const fromName = options.fromName
    ? `"${options.fromName} via DukaFlow" <${fromEmail}>`
    : `DukaFlow <${fromEmail}>`;

  const mailOptions = {
    from: fromName,
    to: options.to,
    subject: options.subject,
    html: options.html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent: ${info.messageId}`);

    // In development, log the Ethereal preview URL
    if (process.env.NODE_ENV !== 'production') {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`📬 Preview URL: ${previewUrl}`);
      }
    }

    return info;
  } catch (error) {
    console.error(`❌ Error sending email: ${error.message}`);
    throw error;
  }
};

module.exports = { sendEmail };
