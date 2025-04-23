
const nodemailer = require('nodemailer');

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'ariwalajay212530@gmail.com',
    pass: process.env.EMAIL_PASS || 'your_app_specific_password' // You need to set this up in your Gmail account
  }
});

// Test transporter configuration
async function verifyConnection() {
  try {
    // Test the connection by sending a test email
    await transporter.sendMail({
      from: process.env.EMAIL_USER || 'ariwalajay212530@gmail.com',
      to: process.env.EMAIL_USER || 'ariwalajay212530@gmail.com',
      subject: 'Test Connection',
      text: 'This is a test email to verify the connection.'
    });
    console.log('Email service is ready');
    return true;
  } catch (error) {
    console.error('Email service configuration error:', error);
    return false;
  }
}

// Helper function to retry failed operations
const retry = async (fn, retries = 3, delay = 1000) => {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    await new Promise(resolve => setTimeout(resolve, delay));
    return retry(fn, retries - 1, delay * 2);
  }
};

// Function to send verification email
const sendVerificationEmail = async (email, verificationUrl) => {
  try {
    console.log('Sending verification email to:', email);
    const mailOptions = {
      from: '"Data Duplication Alert System" <ariwalajay212530@gmail.com>',
      to: email,
      subject: 'Verify Your Email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Verify Your Email</h1>
          <p>Thank you for registering with our Data Duplication Alert System. Please click the button below to verify your email address:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Verify Email
            </a>
          </div>
          <p>If the button doesn't work, you can also click this link:</p>
          <p><a href="${verificationUrl}">${verificationUrl}</a></p>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't create an account, you can safely ignore this email.</p>
        </div>
      `
    };

    await retry(() => transporter.sendMail(mailOptions));
    console.log('Verification email sent successfully to:', email);
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }

// Temporary mock email service
const sendVerificationEmail = async (email, verificationUrl) => {
    console.log('Email verification disabled temporarily');
    console.log('Would have sent verification email to:', email);
    console.log('With verification URL:', verificationUrl);
    return true;

};

// Function to send password reset email
const sendPasswordResetEmail = async (email, resetUrl) => {
  try {
    console.log('Sending password reset email to:', email);
    const mailOptions = {
      from: '"Data Duplication Alert System" <ariwalajay212530@gmail.com>',
      to: email,
      subject: 'Reset Your Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Reset Your Password</h1>
          <p>You have requested to reset your password. Click the button below to set a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>If the button doesn't work, you can also click this link:</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request a password reset, you can safely ignore this email.</p>
        </div>
      `
    };

    await retry(() => transporter.sendMail(mailOptions));
    console.log('Password reset email sent successfully to:', email);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

module.exports = {
  verifyConnection,
  sendVerificationEmail,
  sendPasswordResetEmail};
    console.log('Password reset email disabled temporarily');
    console.log('Would have sent password reset email to:', email);
    console.log('With reset URL:', resetUrl);
    return true;
};

module.exports = {
    sendVerificationEmail,
    sendPasswordResetEmail
};