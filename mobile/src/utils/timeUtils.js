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
      if (diffDays === 1) return '1일 전';
      return `${diffDays}일 전`;
    }
    
    // 주 단위
    if (diffWeeks < 4) {
      if (diffWeeks === 1) return '1주 전';
      return `${diffWeeks}주 전`;
    }
    
    // 월 단위
    if (diffMonths < 12) {
      if (diffMonths === 1) return '1개월 전';
      return `${diffMonths}개월 전`;
    }
    
    // 년 단위
    if (diffYears === 1) return '1년 전';
    return `${diffYears}년 전`;
  } catch (error) {
    console.error('getTimeAgo 오류:', error);
    return '방금';
  }
};

/**
 * 최근 N일 이내 게시물만 필터링
 * @param {Array} posts - 게시물 배열
 * @param {number} maxDays - 최대 일수 (기본값: 2일)
 * @returns {Array} - 필터링된 게시물 배열
 */
export const filterRecentPosts = (posts, maxDays = 2) => {
  if (!Array.isArray(posts) || posts.length === 0) {
    return [];
  }
  
  const now = new Date();
  const maxAge = maxDays * 24 * 60 * 60 * 1000; // 밀리초로 변환
  
  return posts.filter(post => {
    try {
      const postTime = new Date(post.timestamp || post.createdAt || post.uploadedAt || post.time);
      
      // 유효한 날짜인지 확인
      if (isNaN(postTime.getTime())) {
        return false;
      }
      
      const age = now - postTime;
      return age >= 0 && age <= maxAge;
    } catch (error) {
      console.warn('게시물 시간 파싱 실패:', post.id, error);
      return false;
    }
  });
};

/**
 * 현재 타임스탬프 반환
 * @returns {string} - ISO 8601 형식의 타임스탬프
 */
export const getCurrentTimestamp = () => {
  return new Date().toISOString();
};

