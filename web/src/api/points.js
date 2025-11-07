import api from './axios';

// 포인트 잔액 조회
export const getPointBalance = async () => {
  try {
    const response = await api.get('/points/balance');
    return response.data;
  } catch (error) {
    console.error('포인트 조회 실패:', error);
    throw error;
  }
};

// 포인트 내역 조회
export const getPointHistory = async (params = {}) => {
  try {
    const response = await api.get('/points/history', { params });
    return response.data;
  } catch (error) {
    console.error('포인트 내역 조회 실패:', error);
    throw error;
  }
};
















