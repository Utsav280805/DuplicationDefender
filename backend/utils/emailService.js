const nodemailer = require('nodemailer');

// Create email transporter
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports like 587
    auth: {
        user: 'ariwalajay212530@gmail.com',
        pass: process.env.EMAIL_PASSWORD
    }
});

// Verify transporter configuration
transporter.verify(function(error, success) {
    if (error) {
        console.error('SMTP connection error:', error);
        
    } else {
        console.log('SMTP server is ready to send emails');
    }
});

// Function to send verification email
const sendVerificationEmail = async (email, verificationUrl) => {
    const mailOptions = {
        from: '"Data Duplication Alert System" <ariwalajay212530@gmail.com>',
        to: email,
        subject: 'Verify Your Email',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #2563eb;">Verify Your Email</h1>
                <p>Thank you for registering! Please click the button below to verify your email:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${verificationUrl}" 
                       style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                        Verify Email
                    </a>
                </div>
                <p style="color: #666; font-size: 14px;">Or copy and paste this link in your browser:</p>
                <p style="color: #2563eb; word-break: break-all;">${verificationUrl}</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error sending verification email:', error);
        return false;
    }
};

const sendPasswordResetEmail = async (email, resetUrl) => {
    const mailOptions = {
        from: '"Data Duplication Alert System" <ariwalajay212530@gmail.com>',
        to: email,
        subject: 'Reset Your Password',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #2563eb;">Reset Your Password</h1>
                <p>You are receiving this email because you (or someone else) requested a password reset.</p>
                <p>Click the button below to reset your password:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" 
                       style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                        Reset Password
                    </a>
                </div>
                <p style="color: #666; font-size: 14px;">Or copy and paste this link in your browser:</p>
                <p style="color: #2563eb; word-break: break-all;">${resetUrl}</p>
                <p style="color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
                <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email.</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error sending password reset email:', error);
        return false;
    }
};

module.exports = {
    transporter,
    sendVerificationEmail,
    sendPasswordResetEmail
}; 