import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>로딩 중...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return children;
  }

  // 로그인이 필요한 페이지 접근 시, 프로필 탭으로 보내서 거기서 로그인 가능하도록
  return <Navigate to="/profile" replace />;
};

export default ProtectedRoute;




















