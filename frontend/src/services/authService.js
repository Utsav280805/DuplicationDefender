import { API_ENDPOINTS, API_CONFIG, handleApiError } from '../config/api';
import axios from 'axios';

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

export const signIn = async (email, password) => {
  try {
    const response = await axios.post(API_ENDPOINTS.LOGIN, { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to sign in');
  }
};

export const signOut = (navigate) => {
  try {
    // Clear all auth-related data from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Clear any other app-specific data
    localStorage.clear();
    
    // Redirect to sign-in page
    if (navigate) {
      navigate('/signin');
    } else {
      window.location.href = '/signin';
    }
  } catch (error) {
    console.error('Error during sign out:', error);
  }
};

export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  return !!token;
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

export const refreshSession = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return false;

    const response = await fetch(`${API_ENDPOINTS.LOGIN}/refresh`, {
      method: 'POST',
      headers: {
        ...API_CONFIG.headers,
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      if (response.status === 401) {
        signOut();
        return false;
      }
      throw new Error(error.message || 'Failed to refresh session');
    }

    const data = await response.json();
    
    // Update token
    localStorage.setItem('token', data.token);
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    
    return true;
  } catch (error) {
    console.error('Session refresh error:', error);
    signOut();
    return false;
  }
}; 