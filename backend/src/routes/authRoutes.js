const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Auth routes
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Basic validation
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // For now, just create a simple success response
    // In a real app, you would hash the password and store in database
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token: 'dummy-token' // In a real app, generate a JWT token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: error.message
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Basic validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // For now, just create a simple success response
    // In a real app, you would verify credentials against database
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token: 'dummy-token' // In a real app, generate a JWT token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    // For now, just return dummy user data
    // In a real app, you would fetch user data from database
    res.json({
      success: true,
      user: {
        id: 1,
        name: 'Test User',
        email: 'test@example.com'
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting user data',
      error: error.message
    });
  }
});

module.exports = router;
