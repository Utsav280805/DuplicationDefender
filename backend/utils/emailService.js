// Temporary mock email service
const sendVerificationEmail = async (email, verificationUrl) => {
    console.log('Email verification disabled temporarily');
    console.log('Would have sent verification email to:', email);
    console.log('With verification URL:', verificationUrl);
    return true;
};

const sendPasswordResetEmail = async (email, resetUrl) => {
    console.log('Password reset email disabled temporarily');
    console.log('Would have sent password reset email to:', email);
    console.log('With reset URL:', resetUrl);
    return true;
};

module.exports = {
    sendVerificationEmail,
    sendPasswordResetEmail
};