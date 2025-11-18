/**
 * 24시간 명예 챌린지 시스템 (간단 버전)
 * 매일 자정에 리셋되며 상위 25인에게 특별 타이틀 수여
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// 타이틀 정의 (주요 타이틀만)
export const DAILY_TITLES = {
  '실시간 0분 스피드 헌터': {
    id: 1,
    name: '실시간 0분 스피드 헌터',
    icon: '⚡️',
    category: '실시간 속보',
    description: '당일 첫 번째 실시간 여행 정보를 포스팅한 사용자',
    effect: 'lightning',
  },
  '좋아요 폭격의 왕': {
    id: 16,
    name: '좋아요 폭격의 왕',
    icon: '⭐',
    category: '소통',
    description: '24시간 동안 가장 많은 좋아요를 받은 포스팅의 작성자',
    effect: 'star',
  },
  '오늘의 첫 셔터': {
    id: 23,
    name: '오늘의 첫 셔터',
    icon: '📷',
    category: '참여',
    description: '당일 가장 먼저 사진 포스팅을 올린 사용자',
    effect: 'first',
  },
};

// 오늘 날짜 키 (YYYY-MM-DD)
const getTodayKey = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

// 사용자의 현재 타이틀 조회
export const getUserDailyTitle = async (userId) => {
  try {
    const todayKey = getTodayKey();
    const dailyTitlesJson = await AsyncStorage.getItem('dailyTitles');
    const dailyTitles = dailyTitlesJson ? JSON.parse(dailyTitlesJson) : {};
    
    const userTitle = dailyTitles[todayKey]?.[userId];
    
    // 만료 확인
    if (userTitle) {
      const expiresAt = new Date(userTitle.expiresAt);
      if (new Date() > expiresAt) {
        // 만료됨
        delete dailyTitles[todayKey][userId];
        await AsyncStorage.setItem('dailyTitles', JSON.stringify(dailyTitles));
        return null;
      }
    }
    
    return userTitle || null;
  } catch (error) {
    console.error('타이틀 조회 실패:', error);
    return null;
  }
};

// 게시물에 타이틀 효과 적용
export const getTitleEffect = (effect) => {
  const effects = {
    lightning: {
      border: 'border-4 border-yellow-400',
      shadow: 'shadow-2xl shadow-yellow-400/50',
      glow: 'animate-pulse',
      badge: '⚡️ NEW'
    },
    star: {
      border: 'border-4 border-yellow-300',
      shadow: 'shadow-2xl shadow-yellow-300/50',
      glow: 'animate-pulse',
      badge: '⭐ STAR'
    },
    first: {
      border: 'border-4 border-sky-400',
      shadow: 'shadow-2xl shadow-sky-400/50',
      glow: 'animate-pulse',
      badge: '📷 FIRST'
    },
    default: {
      border: 'border-2 border-primary',
      shadow: 'shadow-xl shadow-primary/30',
      glow: '',
      badge: '👑 VIP'
    }
  };

  return effects[effect] || effects.default;
};

// 일일 통계 계산
const calculateDailyStats = async (userId) => {
  try {
    const postsJson = await AsyncStorage.getItem('uploadedPosts');
    const posts = postsJson ? JSON.parse(postsJson) : [];
    const todayKey = getTodayKey();
    
    const todayPosts = posts.filter(p => {
      if (!p.timestamp) return false;
      const postDate = new Date(p.timestamp);
      const postKey = `${postDate.getFullYear()}-${String(postDate.getMonth() + 1).padStart(2, '0')}-${String(postDate.getDate()).padStart(2, '0')}`;
      return postKey === todayKey && p.userId === userId;
    });
    
    const firstPost = todayPosts.length > 0 ? todayPosts[0] : null;
    
    return {
      totalPosts: todayPosts.length,
      totalLikes: todayPosts.reduce((sum, p) => sum + (p.likes || 0), 0),
      firstPost: firstPost !== null,
      posts: todayPosts
    };
  } catch (error) {
    console.error('일일 통계 계산 실패:', error);
    return {
      totalPosts: 0,
      totalLikes: 0,
      firstPost: false,
      posts: []
    };
  }
};

// 타이틀 조건 체크
const checkTitleConditions = async (userId) => {
  const stats = await calculateDailyStats(userId);
  const earnedTitles = [];

  // 1. 실시간 0분 스피드 헌터 - 당일 첫 포스팅
  if (stats.firstPost) {
    const postsJson = await AsyncStorage.getItem('uploadedPosts');
    const allPosts = postsJson ? JSON.parse(postsJson) : [];
    const todayKey = getTodayKey();
    const allTodayPosts = allPosts.filter(p => {
      if (!p.timestamp) return false;
      const postDate = new Date(p.timestamp);
      const postKey = `${postDate.getFullYear()}-${String(postDate.getMonth() + 1).padStart(2, '0')}-${String(postDate.getDate()).padStart(2, '0')}`;
      return postKey === todayKey;
    }).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    if (allTodayPosts[0]?.userId === userId) {
      earnedTitles.push(DAILY_TITLES['실시간 0분 스피드 헌터']);
    }
  }

  // 2. 오늘의 첫 셔터 - 당일 첫 포스팅
  if (stats.firstPost) {
    earnedTitles.push(DAILY_TITLES['오늘의 첫 셔터']);
  }

  // 3. 좋아요 폭격의 왕 - 좋아요 많은 포스팅
  if (stats.totalLikes >= 10) {
    earnedTitles.push(DAILY_TITLES['좋아요 폭격의 왕']);
  }

  return earnedTitles;
};

// 타이틀 수여
export const awardDailyTitle = async (userId, title) => {
  try {
    const todayKey = getTodayKey();
    const dailyTitlesJson = await AsyncStorage.getItem('dailyTitles');
    const dailyTitles = dailyTitlesJson ? JSON.parse(dailyTitlesJson) : {};
    
    if (!dailyTitles[todayKey]) {
      dailyTitles[todayKey] = {};
    }
    
    dailyTitles[todayKey][userId] = {
      ...title,
      earnedAt: new Date().toISOString(),
      expiresAt: new Date(new Date().setHours(24, 0, 0, 0)).toISOString()
    };
    
    await AsyncStorage.setItem('dailyTitles', JSON.stringify(dailyTitles));
    
    console.log(`👑 24시간 타이틀 획득: ${title.name}`);
    return true;
  } catch (error) {
    console.error('타이틀 수여 실패:', error);
    return false;
  }
};

// 포스팅 업로드 시 타이틀 체크
export const checkAndAwardTitles = async (userId) => {
  try {
    const titles = await checkTitleConditions(userId);
    
    if (titles.length > 0) {
      const bestTitle = titles[0]; // 첫 번째 타이틀 수여
      await awardDailyTitle(userId, bestTitle);
      return bestTitle;
    }
    
    return null;
  } catch (error) {
    console.error('타이틀 체크 실패:', error);
    return null;
  }
};

