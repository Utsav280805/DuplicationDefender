import { API_ENDPOINTS, API_CONFIG, handleApiError } from '../config/api';

const API_URL = 'http://localhost:5000/api';

// Hardcoded users for demo
let DEMO_USERS = [
  {
    id: 1,
    email: '23it007@charusat.edu.in',
    password: '********', // Using the password you entered
    name: '23IT007' // Changed from Demo User to match student ID
  }
];

export const signup = async (name, email, password) => {
  try {
    const response = await fetch(`${API_ENDPOINTS.LOGIN}/register`, {
      method: 'POST',
      headers: API_CONFIG.headers,
      ...API_CONFIG,
      body: JSON.stringify({ name, email, password })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to create account');
    }

    // Store auth data
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    return data;
  } catch (error) {
    console.error('Signup error:', error);
    throw new Error(error.message || 'Failed to sign up');
    throw error;
  }
};

export const login = async (email, password) => {
  try {
    const response = await fetch(`${API_ENDPOINTS.LOGIN}/login`, {
      method: 'POST',
      headers: API_CONFIG.headers,
      ...API_CONFIG,
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Invalid credentials');
      // Check specifically for email verification error
      if (data.message === 'Please verify your email before logging in') {
        throw new Error('Please check your email for verification link before logging in');
      }
      // Check for specific error messages from the server
      if (data.message) {
        throw new Error(data.message);
      }
      throw new Error('Invalid credentials. Please check your email and password.');
    }

    // Store auth data
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw new Error(error.message || 'Failed to sign in');
    throw error;
  }
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  if (!token) return false;
  
  try {
    // Verify token expiration
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp < Date.now() / 1000) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return false;
    }
    return true;
  } catch {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return false;
  }
};

export const getToken = () => {
  return localStorage.getItem('token');
};

export const getUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const resendVerificationEmail = async (email) => {
  try {
    const response = await fetch(`${API_ENDPOINTS.LOGIN}/resend-verification`, {
      method: 'POST',
      ...API_CONFIG,
      body: JSON.stringify({ email })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to resend verification email');
    }

    return data;
  } catch (error) {
    console.error('Resend verification email error:', error);
    throw error;
  }
}; 