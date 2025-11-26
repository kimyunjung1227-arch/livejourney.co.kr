import api from './axios';

// 주변 게시물 조회
export const getNearbyPosts = async (lat, lon, radius = 5000) => {
  try {
    const response = await api.get('/locations/nearby', {
      params: { lat, lon, radius }
    });
    return response.data;
  } catch (error) {
    console.error('주변 게시물 조회 실패:', error);
    throw error;
  }
};

// 지역별 인기 장소
export const getPopularLocations = async (params = {}) => {
  try {
    const response = await api.get('/locations/popular', { params });
    return response.data;
  } catch (error) {
    console.error('인기 장소 조회 실패:', error);
    throw error;
  }
};

// 지역별 게시물
export const getPostsByRegion = async (region, params = {}) => {
  try {
    const response = await api.get(`/locations/region/${region}`, { params });
    return response.data;
  } catch (error) {
    console.error('지역별 게시물 조회 실패:', error);
    throw error;
  }
};

// 모든 지역 목록
export const getRegions = async () => {
  try {
    const response = await api.get('/locations/regions');
    return response.data;
  } catch (error) {
    console.error('지역 목록 조회 실패:', error);
    throw error;
  }
};





















