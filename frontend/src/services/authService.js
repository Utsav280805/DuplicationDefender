import { API_ENDPOINTS, API_CONFIG, handleApiError } from '../config/api';

const API_URL = 'http://localhost:5000/api';

export const signup = async (name, email, password) => {
  try {
    const response = await fetch(`${API_ENDPOINTS.LOGIN}/register`, {
      method: 'POST',
      ...API_CONFIG,
      body: JSON.stringify({ name, email, password })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to create account');
    }

    // Don't store auth data immediately since email needs verification
    // Instead, show verification message
    if (data.success) {
      return {
        success: true,
        message: 'Please check your email to verify your account'
      };
    }

    return data;
  } catch (error) {
    console.error('Signup error:', error);
    throw error;
  }
};

export const login = async (email, password) => {
  try {
    const response = await fetch(`${API_ENDPOINTS.LOGIN}/login`, {
      method: 'POST',
      ...API_CONFIG,
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    
    if (!response.ok) {
      // Check specifically for email verification error
      if (data.message === 'Please verify your email before logging in') {
        throw new Error('Please check your email for verification link before logging in');
      }
      // Use server's error message if available, otherwise use default
      throw new Error(data.message || 'Invalid credentials. Please check your email and password.');
    }

    // Store auth data
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error; // Re-throw the error to be handled by the component
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