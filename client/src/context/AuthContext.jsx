import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();
const API_URL = `${import.meta.env.VITE_API_BASE_URL}/auth`;

const getRoleRoute = (role) => {
  const routes = { admin: '/admin', subadmin: '/subadmin', recruiter: '/company', jobseeker: '/jobseeker' };
  return routes[role] || '/jobseeker';
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API_URL}/login`, { email, password });
      
      if (res.data.requireOtp) {
        return { success: true, requireOtp: true, email: res.data.email, msg: res.data.msg };
      }

      const { user, token } = res.data;
      setUser(user);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return { success: true, redirect: getRoleRoute(user.role) };
    } catch (err) {
      return { success: false, msg: err.response?.data?.msg || 'Login failed' };
    }
  };

  const register = async (userData) => {
    try {
      const res = await axios.post(`${API_URL}/register`, userData);
      
      if (res.data.requireOtp) {
        return { success: true, requireOtp: true, email: res.data.email, msg: res.data.msg };
      }

      // Fallback if no OTP required
      const { user, token } = res.data;
      setUser(user);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return { success: true, redirect: getRoleRoute(user.role) };
    } catch (err) {
      return { success: false, msg: err.response?.data?.msg || 'Registration failed' };
    }
  };

  const verifyOtp = async (email, otp) => {
    try {
      const res = await axios.post(`${API_URL}/verify-otp`, { email, otp });
      const { user, token } = res.data;
      setUser(user);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return { success: true, redirect: getRoleRoute(user.role) };
    } catch (err) {
      return { success: false, msg: err.response?.data?.msg || 'Invalid or expired OTP' };
    }
  };

  const forgotPassword = async (email) => {
    try {
      const res = await axios.post(`${API_URL}/forgot-password`, { email });
      return { success: true, msg: res.data.msg };
    } catch (err) {
      return { success: false, msg: err.response?.data?.msg || 'Failed to send reset email' };
    }
  };
  
  const resetPassword = async (email, otp, newPassword) => {
    try {
      const res = await axios.post(`${API_URL}/reset-password`, { email, otp, newPassword });
      return { success: true, msg: res.data.msg };
    } catch (err) {
      return { success: false, msg: err.response?.data?.msg || 'Failed to reset password. OTP may be invalid.' };
    }
  };

  const resendOtp = async (email) => {
    try {
      const res = await axios.post(`${API_URL}/resend-otp`, { email });
      return { success: true, msg: res.data.msg };
    } catch (err) {
      return { success: false, msg: err.response?.data?.msg || 'Failed to resend OTP' };
    }
  };

  const completeSocialLogin = (token, userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    return { success: true, redirect: getRoleRoute(userData.role) };
  };

  const updateUser = (newData) => {
    const updatedUser = { ...user, ...newData };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, login, register, verifyOtp, forgotPassword, resetPassword, resendOtp, completeSocialLogin, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
