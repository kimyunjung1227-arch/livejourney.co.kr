import api from './axios';

// 보상 목록 조회
export const getRewards = async (params = {}) => {
  try {
    const response = await api.get('/rewards', { params });
    return response.data;
  } catch (error) {
    console.error('보상 목록 조회 실패:', error);
    throw error;
  }
};

// 보상 상세 조회
export const getReward = async (rewardId) => {
  try {
    const response = await api.get(`/rewards/${rewardId}`);
    return response.data;
  } catch (error) {
    console.error('보상 상세 조회 실패:', error);
    throw error;
  }
};

// 보상 교환
export const exchangeReward = async (rewardId) => {
  try {
    const response = await api.post(`/rewards/${rewardId}/exchange`);
    return response.data;
  } catch (error) {
    console.error('보상 교환 실패:', error);
    throw error;
  }
};

// 내 교환 내역
export const getMyExchangeHistory = async (params = {}) => {
  try {
    const response = await api.get('/rewards/my/history', { params });
    return response.data;
  } catch (error) {
    console.error('교환 내역 조회 실패:', error);
    throw error;
  }
};





















