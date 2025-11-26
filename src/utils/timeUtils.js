// 실시간 시간 계산 유틸리티

/**
 * timestamp를 현재 시각 기준으로 상대적 시간으로 변환
 * @param {Date|string|number} timestamp - 업로드 시각
 * @returns {string} - "방금", "5분 전", "1시간 전" 등
 */
export const getTimeAgo = (timestamp) => {
  if (!timestamp) return '방금';
  
  try {
    const now = new Date();
    const uploadTime = new Date(timestamp);
    
    // 유효한 날짜인지 확인
    if (isNaN(uploadTime.getTime())) {
      return '방금';
    }
    
    const diffMs = now - uploadTime; // 밀리초 차이
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);
    
    // 음수면 미래 시각 (오류)
    if (diffSeconds < 0) return '방금';
    
    // 초 단위
    if (diffSeconds < 60) return '방금';
    
    // 분 단위
    if (diffMinutes < 60) {
      if (diffMinutes < 5) return '방금';
      if (diffMinutes < 10) return '5분 전';
      if (diffMinutes < 30) return '10분 전';
      return '30분 전';
    }
    
    // 시간 단위
    if (diffHours < 24) {
      if (diffHours === 1) return '1시간 전';
      return `${diffHours}시간 전`;
    }
    
    // 일 단위
    if (diffDays < 7) {
      return `${diffDays}일 전`;
    }
    
    // 주 단위
    if (diffWeeks < 4) {
      return `${diffWeeks}주 전`;
    }
    
    // 월 단위
    if (diffMonths < 12) {
      return `${diffMonths}개월 전`;
    }
    
    // 년 단위
    return `${diffYears}년 전`;
    
  } catch (error) {
    console.error('시간 계산 오류:', error);
    return '방금';
  }
};

/**
 * 여러 게시물의 시간을 일괄 업데이트
 * @param {Array} posts - 게시물 배열
 * @returns {Array} - timeLabel이 업데이트된 게시물 배열
 */
export const updatePostTimes = (posts) => {
  if (!Array.isArray(posts)) return [];
  
  return posts.map(post => ({
    ...post,
    timeLabel: getTimeAgo(post.timestamp || post.createdAt || post.uploadedAt)
  }));
};

/**
 * 현재 시각을 timestamp로 반환
 * @returns {string} - ISO 8601 형식
 */
export const getCurrentTimestamp = () => {
  return new Date().toISOString();
};

// React Hook은 각 컴포넌트에서 직접 구현
// useEffect + setInterval 사용

/**
 * timestamp를 숫자로 변환 (정렬용)
 * @param {Date|string|number} timestamp
 * @returns {number} - 밀리초
 */
export const timestampToNumber = (timestamp) => {
  if (!timestamp) return 0;
  
  try {
    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? 0 : date.getTime();
  } catch (error) {
    return 0;
  }
};

/**
 * 시간순 정렬 (최신순)
 * @param {Array} posts - 게시물 배열
 * @returns {Array} - 정렬된 배열
 */
export const sortByTime = (posts) => {
  return [...posts].sort((a, b) => {
    const timeA = timestampToNumber(a.timestamp || a.createdAt || a.uploadedAt);
    const timeB = timestampToNumber(b.timestamp || b.createdAt || b.uploadedAt);
    return timeB - timeA; // 최신순
  });
};

// 2일(48시간) 이상 지났는지 확인
export const isOlderThanTwoDays = (timestamp) => {
  if (!timestamp) return false;
  
  const now = new Date();
  const postDate = new Date(timestamp);
  const diffHours = (now - postDate) / (1000 * 60 * 60);
  
  return diffHours >= 48; // 48시간 = 2일
};

// 게시물을 최신순으로 정렬하고 2일 이상 된 것은 필터링
export const filterRecentPosts = (posts, maxDays = 2) => {
  if (!posts || posts.length === 0) return [];
  
  const maxHours = maxDays * 24;
  const now = new Date();
  
  return posts
    .filter(post => {
      const timestamp = post.timestamp || post.createdAt;
      if (!timestamp) return true; // 시간 정보 없으면 유지
      
      const postDate = new Date(timestamp);
      const diffHours = (now - postDate) / (1000 * 60 * 60);
      
      return diffHours < maxHours;
    })
    .sort((a, b) => {
      const timeA = new Date(a.timestamp || a.createdAt || 0);
      const timeB = new Date(b.timestamp || b.createdAt || 0);
      return timeB - timeA; // 최신순
    });
};

// 게시물 나이(시간) 계산 (시간 단위)
export const getPostAgeInHours = (timestamp) => {
  if (!timestamp) return 0;
  
  const now = new Date();
  const postDate = new Date(timestamp);
  return (now - postDate) / (1000 * 60 * 60);
};

export default {
  getTimeAgo,
  updatePostTimes,
  getCurrentTimestamp,
  timestampToNumber,
  sortByTime,
  isOlderThanTwoDays,
  filterRecentPosts,
  getPostAgeInHours
};

