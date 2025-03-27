// @ts-nocheck
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
    // Get token from Authorization header or cookie
    const token = req.header('Authorization')?.replace('Bearer ', '') || 
                 req.cookies?.token;
    
    if (!token) {
      console.log('No authentication token provided');
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    console.log('Verifying token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    if (!decoded || typeof decoded !== 'object') {
      throw new Error('Invalid token');
    }

    // Look for userId in decoded token
    const userId = decoded.userId || decoded._id;
    if (!userId) {
      throw new Error('Invalid token format');
    }

    console.log('Finding user with ID:', userId);
    const user = await User.findById(userId);

    if (!user) {
      console.log('User not found with ID:', userId);
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('User authenticated:', user._id);
    req.token = token;
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    res.status(401).json({
      success: false,
      message: 'Invalid authentication token'
    });
  }
};

module.exports = { auth };