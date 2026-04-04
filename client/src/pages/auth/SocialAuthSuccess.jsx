import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Spin } from 'antd';

const SocialAuthSuccess = () => {
  const { completeSocialLogin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const userStr = params.get('user');

    if (token && userStr) {
      try {
        const userData = JSON.parse(decodeURIComponent(userStr));
        const result = completeSocialLogin(token, userData);
        if (result.success) {
          navigate(result.redirect);
        } else {
          navigate('/login');
        }
      } catch (err) {
        console.error('Social Login Success Component Error:', err);
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
  }, [location, completeSocialLogin, navigate]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px' }}>
      <Spin size="large" />
      <span style={{ fontSize: '18px', fontWeight: 600, color: '#4b5563' }}>Completing login...</span>
    </div>
  );
};

export default SocialAuthSuccess;
