import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 로컬 스토리지에서 사용자 정보 로드
    const loadUser = () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (token && savedUser) {
        setUser(JSON.parse(savedUser));
      }
    };
    
    loadUser();
    setLoading(false);
    
    // 사용자 정보 변경 이벤트 리스너
    const handleUserUpdate = () => {
      loadUser();
    };
    
    window.addEventListener('userUpdated', handleUserUpdate);
    window.addEventListener('storage', loadUser);
    
    return () => {
      window.removeEventListener('userUpdated', handleUserUpdate);
      window.removeEventListener('storage', loadUser);
    };
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/users/login', { email, password });
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);

      return { success: true };
    } catch (error) {
      // 백엔드가 없을 때를 위한 Mock 로그인
      console.warn('백엔드 연결 실패, Mock 모드로 전환');
      
      // 로컬 스토리지에서 저장된 사용자 확인
      const savedUsers = JSON.parse(localStorage.getItem('mock_users') || '[]');
      const foundUser = savedUsers.find(u => u.email === email && u.password === password);
      
      if (foundUser) {
        const mockUser = {
          id: foundUser.id,
          email: foundUser.email,
          username: foundUser.username,
          points: foundUser.points || 5000,
          badges: foundUser.badges || []
        };
        
        localStorage.setItem('token', 'mock_token_' + Date.now());
        localStorage.setItem('user', JSON.stringify(mockUser));
        setUser(mockUser);
        
        return { success: true };
      }
      
      return {
        success: false,
        error: '이메일 또는 비밀번호가 일치하지 않습니다.'
      };
    }
  };

  const signup = async (email, password, username) => {
    try {
      const response = await api.post('/users/signup', { email, password, username });
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);

      return { success: true };
    } catch (error) {
      // 백엔드가 없을 때를 위한 Mock 회원가입
      console.warn('백엔드 연결 실패, Mock 모드로 전환');
      
      const savedUsers = JSON.parse(localStorage.getItem('mock_users') || '[]');
      
      // 이메일 중복 체크
      if (savedUsers.find(u => u.email === email)) {
        return {
          success: false,
          error: '이미 사용 중인 이메일입니다.'
        };
      }
      
      // 새 사용자 생성
      const newUser = {
        id: 'user_' + Date.now(),
        email,
        password, // 실제로는 암호화해야 하지만 Mock이므로 생략
        username,
        points: 5000, // 초기 포인트
        badges: [],
        createdAt: new Date().toISOString()
      };
      
      savedUsers.push(newUser);
      localStorage.setItem('mock_users', JSON.stringify(savedUsers));
      
      const mockUser = {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        points: newUser.points,
        badges: newUser.badges
      };
      
      localStorage.setItem('token', 'mock_token_' + Date.now());
      localStorage.setItem('user', JSON.stringify(mockUser));
      setUser(mockUser);
      
      return { success: true };
    }
  };


  const logout = () => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚪 로그아웃 - 앱 완전 초기화 (처음 사용자처럼!) 시작...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // 1. localStorage 완전 삭제 (모든 데이터 초기화)
    console.log('🧹 localStorage 완전 삭제 중...');
    console.log('  - 모든 업로드 사진 삭제');
    console.log('  - 모든 알림 삭제');
    console.log('  - 모든 사용자 데이터 삭제');
    console.log('  - Mock 데이터 삭제');
    console.log('  - 캐시 데이터 삭제');
    
    localStorage.clear();
    console.log('✅ localStorage 완전 삭제 완료!');
    
    // 2. sessionStorage 완전 삭제
    sessionStorage.clear();
    console.log('✅ sessionStorage 완전 삭제 완료!');
    
    // 3. 로그아웃 플래그 설정 (시작화면 표시용)
    sessionStorage.setItem('justLoggedOut', 'true');
    console.log('🏠 시작화면 표시 플래그 설정');
    
    // 4. 상태 업데이트
    setUser(null);
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ 완전 초기화 완료!');
    console.log('🎉 다음 로그인 시 완전히 새로운 사용자처럼 시작합니다!');
    console.log('📦 Mock 데이터도 전부 삭제되어 처음부터 생성됩니다!');
    console.log('🏠 시작화면으로 이동합니다');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const socialLogin = (provider) => {
    // 소셜 로그인 URL로 리다이렉트
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    window.location.href = `${apiUrl}/api/auth/${provider.toLowerCase()}`;
  };

  // 테스터 계정으로 바로 로그인
  const testerLogin = async () => {
    try {
      const testerEmail = 'tester@livejourney.com';
      const testerPassword = 'tester123';
      const testerUsername = '테스터';

      // 먼저 실제 API 시도
      try {
        const response = await api.post('/users/login', { 
          email: testerEmail, 
          password: testerPassword 
        });
        const { token, user } = response.data;

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        setUser(user);

        return { success: true };
      } catch (apiError) {
        // API 실패 시 Mock 모드로 전환
        console.warn('백엔드 연결 실패, 테스터 계정 Mock 모드로 전환');
        
        // Mock 사용자 생성 또는 기존 사용자 사용
        const savedUsers = JSON.parse(localStorage.getItem('mock_users') || '[]');
        
        let testerUser = savedUsers.find(u => u.email === testerEmail);
        
        if (!testerUser) {
          // 테스터 계정 생성
          testerUser = {
            id: 'tester_' + Date.now(),
            email: testerEmail,
            password: testerPassword,
            username: testerUsername,
            points: 10000,
            badges: ['테스터'],
            createdAt: new Date().toISOString()
          };
          
          savedUsers.push(testerUser);
          localStorage.setItem('mock_users', JSON.stringify(savedUsers));
        }
        
        const mockUser = {
          id: testerUser.id,
          email: testerUser.email,
          username: testerUser.username,
          points: testerUser.points,
          badges: testerUser.badges
        };
        
        localStorage.setItem('token', 'mock_token_tester_' + Date.now());
        localStorage.setItem('user', JSON.stringify(mockUser));
        setUser(mockUser);
        
        return { success: true };
      }
    } catch (error) {
      console.error('테스터 로그인 실패:', error);
      return {
        success: false,
        error: '테스터 계정 로그인에 실패했습니다.'
      };
    }
  };

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    updateUser,
    socialLogin,
    testerLogin,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};















































