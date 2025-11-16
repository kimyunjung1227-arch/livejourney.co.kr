import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Android 에뮬레이터: 10.0.2.2
// iOS 시뮬레이터: localhost
// 실제 디바이스: 컴퓨터의 IP 주소
const API_URL = __DEV__ 
  ? 'http://localhost:5000/api'  // 개발 환경
  : 'https://your-api-server.com/api';  // 프로덕션 환경

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// 요청 인터셉터: 토큰 자동 추가
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('토큰 가져오기 실패:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터: 에러 처리
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // 인증 실패 시 토큰 제거
      try {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
      } catch (e) {
        console.error('토큰 제거 실패:', e);
      }
    }
    return Promise.reject(error);
  }
);

export default api;


