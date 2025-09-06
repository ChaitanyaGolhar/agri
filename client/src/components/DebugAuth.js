import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const DebugAuth = () => {
  const auth = useAuth();
  
  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      background: 'black', 
      color: 'white', 
      padding: '10px', 
      zIndex: 9999,
      fontSize: '12px'
    }}>
      <div>isAuthenticated: {String(auth.isAuthenticated)}</div>
      <div>isLoading: {String(auth.isLoading)}</div>
      <div>token: {auth.token ? 'exists' : 'null'}</div>
      <div>user: {auth.user ? auth.user.username : 'null'}</div>
    </div>
  );
};

export default DebugAuth;



