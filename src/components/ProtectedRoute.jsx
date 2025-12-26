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

  // 로그인이 필요한 페이지 접근 시, 로그인/회원가입 화면으로 유도
  try {
    sessionStorage.setItem('showLoginScreen', 'true');
  } catch (e) {
    // sessionStorage 사용 불가한 환경은 조용히 무시
  }

  return <Navigate to="/start" replace />;
};

export default ProtectedRoute;




















