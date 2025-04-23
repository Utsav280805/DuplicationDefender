// @ts-nocheck
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authentication middleware
 * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 * @param {import('express').NextFunction} next 
 */
const auth = async (req, res, next) => {
  try {
    // Check if JWT secret is configured
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not set in environment variables');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error',
      });
    }

    // Get token from Authorization header
    const authHeader = req.header('Authorization');
    console.log('Auth Header:', authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No valid authentication token provided',
      });
    }

    const token = authHeader.split(' ')[1];
    console.log('Token:', token);

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded);

    if (!decoded.userId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token: missing user ID',
      });
    }

    // Find user in the database
    const user = await User.findById(decoded.userId).select('-password');
    console.log('User found:', !!user);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    // Attach user and token to request
    req.user = {
      id: user._id,
      name: user.name,
      email: user.email,
    };
    req.token = token;

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired',
        expired: true,
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
      error: error.message,
    });
  }
};

module.exports = auth;
