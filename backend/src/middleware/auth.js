const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * @typedef {import('express').Request} ExpressRequest
 * @typedef {import('express').Response} Response
 * @typedef {import('express').NextFunction} NextFunction
 * 
 * @typedef {Object} AuthRequest
 * @property {string} token
 * @property {import('../models/User').User} user
 * 
 * @typedef {ExpressRequest & AuthRequest} Request
 */

/**
 * Authentication middleware
 * @param {Request} req 
 * @param {Response} res 
 * @param {NextFunction} next 
 */
const auth = async (req, res, next) => {
  try {
    // Get token from header or cookies
    const authHeader = req.header('Authorization');
    const token = authHeader ? authHeader.replace('Bearer ', '') : null;

    console.log('Auth Header:', authHeader); // Debug log
    console.log('Token:', token); // Debug log

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No authentication token found'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Decoded token:', decoded); // Debug log

      // Find user
      const user = await User.findById(decoded.userId);
      console.log('Found user:', user ? 'Yes' : 'No'); // Debug log

      if (!user) {
        throw new Error('User not found');
      }

      // Add user info to request
      req.user = {
        id: user._id,
        name: user.name,
        email: user.email
      };
      req.token = token;

      next();
    } catch (error) {
      console.error('Token verification error:', error);
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired',
          expired: true
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({
      success: false,
      message: 'Authentication failed',
      error: error.message
    });
  }
};

module.exports = auth; 