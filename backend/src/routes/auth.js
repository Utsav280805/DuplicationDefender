const express = require('express');
const { 
  register, 
  login, 
  getMe, 
  changePassword, 
  verifyEmail, 
  resendVerificationEmail, 
  forgotPassword, 
  resetPassword 
} = require('../controllers/authController');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerificationEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/me', auth, getMe);

// @route   POST /api/auth/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', auth, changePassword);

module.exports = router;
