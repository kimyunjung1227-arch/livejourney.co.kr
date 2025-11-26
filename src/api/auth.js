import api from './axios';

// 로그인 / 회원가입
export const login = async (username) => {
  try {
    const response = await api.post('/auth/login', { username });
    return response.data;
  } catch (error) {
    // 백엔드 없이도 작동하도록 로컬에서 처리
    if (error.code === 'ERR_NETWORK' || error.code === 'ERR_CONNECTION_REFUSED') {
      console.log('💡 백엔드 미연결 - 로컬 인증 사용');
      
      // localStorage에서 사용자 정보 가져오기
      const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
      let user = existingUsers.find(u => u.username === username);
      
      if (!user) {
        // 새 사용자 생성
        user = {
          id: Date.now().toString(),
          username,
          socialProvider: 'local',
          profileImage: '',
          bio: '',
          points: 0,
          level: 1,
          badges: [],
          stats: {
            totalPosts: 0,
            totalLikes: 0,
            totalComments: 0,
            visitedRegions: [],
            consecutiveDays: 0
          },
          settings: {
            theme: 'auto',
            language: 'ko',
            notifications: {
              push: true,
              email: true,
              marketing: false
            }
          },
          isActive: true,
          lastLogin: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        existingUsers.push(user);
        localStorage.setItem('users', JSON.stringify(existingUsers));
      } else {
        // 기존 사용자 업데이트
        user.lastLogin = new Date().toISOString();
        localStorage.setItem('users', JSON.stringify(existingUsers));
      }
      
      return {
        success: true,
        user,
        message: user.createdAt === user.updatedAt ? '회원가입 완료!' : '로그인 성공!'
      };
    }
    
    console.error('로그인 실패:', error);
    throw error;
  }
};

// 사용자 정보 조회
export const getMe = async () => {
  try {
    const response = await api.get('/auth/me');
    return response.data;
  } catch (error) {
    // 백엔드 없이도 작동하도록 로컬에서 처리
    if (error.code === 'ERR_NETWORK' || error.code === 'ERR_CONNECTION_REFUSED') {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
      if (currentUser) {
        return { success: true, user: currentUser };
      }
      return { success: false, error: '로그인이 필요합니다.' };
    }
    
    console.error('사용자 정보 조회 실패:', error);
    throw error;
  }
};

// 로그아웃
export const logout = async () => {
  try {
    const response = await api.post('/auth/logout');
    return response.data;
  } catch (error) {
    // 로컬에서도 처리
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    return { success: true, message: '로그아웃 성공' };
  }
};

// 사용자 프로필 업데이트
export const updateProfile = async (userId, profileData) => {
  try {
    const response = await api.put(`/users/${userId}`, profileData);
    return response.data;
  } catch (error) {
    // 백엔드 없이도 작동하도록 로컬에서 처리
    if (error.code === 'ERR_NETWORK' || error.code === 'ERR_CONNECTION_REFUSED') {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
      if (currentUser && currentUser.id === userId) {
        const updatedUser = { ...currentUser, ...profileData, updatedAt: new Date().toISOString() };
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        
        // users 배열도 업데이트
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
          users[userIndex] = updatedUser;
          localStorage.setItem('users', JSON.stringify(users));
        }
        
        return { success: true, user: updatedUser };
      }
      return { success: false, error: '사용자를 찾을 수 없습니다.' };
    }
    
    console.error('프로필 업데이트 실패:', error);
    throw error;
  }
};

// 사용자 정보 조회 (ID로)
export const getUser = async (userId) => {
  try {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    // 백엔드 없이도 작동하도록 로컬에서 처리
    if (error.code === 'ERR_NETWORK' || error.code === 'ERR_CONNECTION_REFUSED') {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find(u => u.id === userId);
      if (user) {
        return { success: true, user };
      }
      return { success: false, error: '사용자를 찾을 수 없습니다.' };
    }
    
    console.error('사용자 조회 실패:', error);
    throw error;
  }
};


























