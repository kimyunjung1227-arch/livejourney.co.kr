import api from './axios';

// 통합 검색
export const search = async (query, params = {}) => {
  try {
    const response = await api.get('/search', { 
      params: { q: query, ...params } 
    });
    return response.data;
  } catch (error) {
    console.error('검색 실패:', error);
    throw error;
  }
};

// 인기 검색어
export const getTrendingSearches = async () => {
  try {
    const response = await api.get('/search/trending');
    return response.data;
  } catch (error) {
    console.error('인기 검색어 조회 실패:', error);
    throw error;
  }
};

// 자동완성
export const getAutocomplete = async (query) => {
  try {
    const response = await api.get('/search/autocomplete', { 
      params: { q: query } 
    });
    return response.data;
  } catch (error) {
    console.error('자동완성 조회 실패:', error);
    throw error;
  }
};





















