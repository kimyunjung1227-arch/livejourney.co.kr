import api from './axios';

// 내 정보 조회
export const getMe = async () => {
  try {
    const response = await api.get('/users/me');
    return response.data;
  } catch (error) {
    console.error('사용자 정보 조회 실패:', error);
    throw error;
  }
};

// 프로필 수정
export const updateProfile = async (profileData) => {
  try {
    const response = await api.put('/users/me', profileData);
    return response.data;
  } catch (error) {
    console.error('프로필 수정 실패:', error);
    throw error;
  }
};

// 비밀번호 변경
export const changePassword = async (currentPassword, newPassword) => {
  try {
    const response = await api.put('/users/password', {
      currentPassword,
      newPassword
    });
    return response.data;
  } catch (error) {
    console.error('비밀번호 변경 실패:', error);
    throw error;
  }
};

// 계정 삭제
export const deleteAccount = async () => {
  try {
    const response = await api.delete('/users/me');
    return response.data;
  } catch (error) {
    console.error('계정 삭제 실패:', error);
    throw error;
  }
};

// 내 뱃지 조회
export const getMyBadges = async () => {
  try {
    const response = await api.get('/users/me/badges');
    return response.data;
  } catch (error) {
    console.error('뱃지 조회 실패:', error);
    throw error;
  }
};

// 알림 설정 변경
export const updateNotificationSettings = async (settings) => {
  try {
    const response = await api.put('/users/me/settings/notifications', settings);
    return response.data;
  } catch (error) {
    console.error('알림 설정 변경 실패:', error);
    throw error;
  }
};





















