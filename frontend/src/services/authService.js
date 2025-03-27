import { API_ENDPOINTS, API_CONFIG, handleApiError } from '../config/api';

export const signup = async (name, email, password) => {
  try {
    console.log('Attempting signup with:', { name, email });
    const response = await fetch(API_ENDPOINTS.SIGN_UP, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ name, email, password }),
      credentials: 'include'  // Added this to handle cookies
    });

    const data = await response.json();
    console.log('Signup response:', data);
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to create account');
    }

    // Store the token and user data
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      console.log('Stored auth token and user data');
    }

    return data;
  } catch (error) {
    console.error('Signup error:', error);
    throw error;
  }
};

export const login = async (email, password) => {
  try {
    console.log('Attempting login with email:', email);
    const response = await fetch(API_ENDPOINTS.SIGN_IN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ email, password }),
      credentials: 'include'
    });

    const data = await response.json();
    console.log('Login response:', data);
    
    if (!response.ok) {
      throw new Error(data.message || 'Invalid credentials');
    }

    // Store the token and user data
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      console.log('Stored auth token and user data');
    }

    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  console.log('Cleared auth token and user data');
};

export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.log('No auth token found');
    return false;
  }

  try {
    // Check if user data exists
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      console.log('No user data found');
      return false;
    }

    console.log('User is authenticated');
    return true;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
};

export const getToken = () => {
  return localStorage.getItem('token');
};

export const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

export const resendVerificationEmail = async (email) => {
  try {
    const response = await fetch(API_ENDPOINTS.RESEND_VERIFICATION, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ email }),
      credentials: 'include'
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to resend verification email');
    }

    return data;
  } catch (error) {
    console.error('Error resending verification:', error);
    throw error;
  }
};