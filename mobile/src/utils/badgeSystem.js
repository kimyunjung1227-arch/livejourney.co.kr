/**
 * 라이브저니 뱃지 시스템 v3.0
 * 단순하고 재미있게! - Mobile Version
 * 달성 기준이 명확한 뱃지만!
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export const BADGES = {
  // 시작 단계
  '첫 걸음': {
    name: '첫 걸음',
    description: '첫 번째 여행 사진을 올렸어요!',
    icon: '🌱',
    category: '시작',
    difficulty: 1,
    gradient: ['#4ADE80', '#10B981'],
    condition: (stats) => stats.totalPosts >= 1,
    getProgress: (stats) => Math.min(100, (stats.totalPosts / 1) * 100)
  },
  
  '여행 시작': {
    name: '여행 시작',
    description: '3개의 여행 기록을 남겼어요',
    icon: '🎒',
    category: '시작',
    difficulty: 1,
    gradient: ['#60A5FA', '#06B6D4'],
    condition: (stats) => stats.totalPosts >= 3,
    getProgress: (stats) => Math.min(100, (stats.totalPosts / 3) * 100)
  },
  
  '첫 좋아요': {
    name: '첫 좋아요',
    description: '다른 사람이 내 사진을 좋아해줬어요!',
    icon: '💖',
    category: '시작',
    difficulty: 1,
    gradient: ['#F472B6', '#FB7185'],
    condition: (stats) => stats.totalLikes >= 1,
    getProgress: (stats) => Math.min(100, (stats.totalLikes / 1) * 100)
  },
  
  // 활동 단계
  '여행 애호가': {
    name: '여행 애호가',
    description: '10개의 여행 기록을 남겼어요',
    icon: '✈️',
    category: '활동',
    difficulty: 2,
    gradient: ['#38BDF8', '#3B82F6'],
    condition: (stats) => stats.totalPosts >= 10,
    getProgress: (stats) => Math.min(100, (stats.totalPosts / 10) * 100)
  },
  
  '사진 수집가': {
    name: '사진 수집가',
    description: '25개의 여행 사진을 모았어요',
    icon: '📷',
    category: '활동',
    difficulty: 2,
    gradient: ['#A78BFA', '#8B5CF6'],
    condition: (stats) => stats.totalPosts >= 25,
    getProgress: (stats) => Math.min(100, (stats.totalPosts / 25) * 100)
  },
  
  '인기 여행자': {
    name: '인기 여행자',
    description: '좋아요를 50개 받았어요!',
    icon: '⭐',
    category: '활동',
    difficulty: 2,
    gradient: ['#FBBF24', '#F97316'],
    condition: (stats) => stats.totalLikes >= 50,
    getProgress: (stats) => Math.min(100, (stats.totalLikes / 50) * 100)
  },
  
  // 전문가 단계
  '여행 전문가': {
    name: '여행 전문가',
    description: '50개의 여행 기록! 진정한 여행 전문가예요',
    icon: '🏆',
    category: '전문가',
    difficulty: 3,
    gradient: ['#FCD34D', '#D97706'],
    condition: (stats) => stats.totalPosts >= 50,
    getProgress: (stats) => Math.min(100, (stats.totalPosts / 50) * 100)
  },
  
  '슈퍼 인기': {
    name: '슈퍼 인기',
    description: '좋아요를 100개나 받았어요!',
    icon: '🌟',
    category: '전문가',
    difficulty: 3,
    gradient: ['#FDE047', '#F59E0B'],
    condition: (stats) => stats.totalLikes >= 100,
    getProgress: (stats) => Math.min(100, (stats.totalLikes / 100) * 100)
  },
  
  '지역 탐험가': {
    name: '지역 탐험가',
    description: '5개 이상의 다른 지역을 방문했어요',
    icon: '🗺️',
    category: '전문가',
    difficulty: 3,
    gradient: ['#2DD4BF', '#0891B2'],
    condition: (stats) => (stats.visitedRegions || 0) >= 5,
    getProgress: (stats) => Math.min(100, ((stats.visitedRegions || 0) / 5) * 100)
  },
  
  // 마스터 단계
  '여행 마스터': {
    name: '여행 마스터',
    description: '100개의 여행 기록! 정말 대단해요!',
    icon: '👑',
    category: '마스터',
    difficulty: 4,
    gradient: ['#A855F7', '#EC4899'],
    condition: (stats) => stats.totalPosts >= 100,
    getProgress: (stats) => Math.min(100, (stats.totalPosts / 100) * 100)
  },
  
  '전국 정복자': {
    name: '전국 정복자',
    description: '10개 이상의 지역을 모두 방문했어요!',
    icon: '🌍',
    category: '마스터',
    difficulty: 4,
    gradient: ['#22C55E', '#14B8A6'],
    condition: (stats) => (stats.visitedRegions || 0) >= 10,
    getProgress: (stats) => Math.min(100, ((stats.visitedRegions || 0) / 10) * 100)
  },
  
  '메가 스타': {
    name: '메가 스타',
    description: '좋아요를 500개나 받았어요! 슈퍼스타!',
    icon: '🌠',
    category: '마스터',
    difficulty: 4,
    gradient: ['#FBBF24', '#F97316', '#EF4444'],
    condition: (stats) => stats.totalLikes >= 500,
    getProgress: (stats) => Math.min(100, (stats.totalLikes / 500) * 100)
  },
  
  // 지역 단계
  '내 지역 알리미': {
    name: '내 지역 알리미',
    description: '한 지역에서 30개 이상 게시했어요! 지역 홍보 대사!',
    icon: '📍',
    category: '지역',
    difficulty: 3,
    gradient: ['#F87171', '#EC4899'],
    condition: (stats) => {
      if (!stats.posts || stats.posts.length === 0) return false;
      const regionCounts = {};
      stats.posts.forEach(post => {
        const region = post.region || post.location?.split(' ')[0] || 'unknown';
        regionCounts[region] = (regionCounts[region] || 0) + 1;
      });
      const maxCount = Math.max(...Object.values(regionCounts));
      return maxCount >= 30;
    },
    getProgress: (stats) => {
      if (!stats.posts || stats.posts.length === 0) return 0;
      const regionCounts = {};
      stats.posts.forEach(post => {
        const region = post.region || post.location?.split(' ')[0] || 'unknown';
        regionCounts[region] = (regionCounts[region] || 0) + 1;
      });
      const maxCount = Math.max(...Object.values(regionCounts));
      return Math.min(100, (maxCount / 30) * 100);
    }
  },
  
  '도시 홍보대사': {
    name: '도시 홍보대사',
    description: '한 지역에서 50개 이상! 이제 그 지역의 전문가예요',
    icon: '🏙️',
    category: '지역',
    difficulty: 4,
    gradient: ['#22D3EE', '#2563EB'],
    condition: (stats) => {
      if (!stats.posts || stats.posts.length === 0) return false;
      const regionCounts = {};
      stats.posts.forEach(post => {
        const region = post.region || post.location?.split(' ')[0] || 'unknown';
        regionCounts[region] = (regionCounts[region] || 0) + 1;
      });
      const maxCount = Math.max(...Object.values(regionCounts));
      return maxCount >= 50;
    },
    getProgress: (stats) => {
      if (!stats.posts || stats.posts.length === 0) return 0;
      const regionCounts = {};
      stats.posts.forEach(post => {
        const region = post.region || post.location?.split(' ')[0] || 'unknown';
        regionCounts[region] = (regionCounts[region] || 0) + 1;
      });
      const maxCount = Math.max(...Object.values(regionCounts));
      return Math.min(100, (maxCount / 50) * 100);
    }
  },
  
  // 숨겨진 뱃지
  '행운아': {
    name: '행운아',
    description: '게시물 하나가 좋아요 100개를 받았어요!',
    icon: '🍀',
    category: '숨김',
    difficulty: 4,
    gradient: ['#4ADE80', '#10B981', '#14B8A6'],
    hidden: true,
    condition: (stats) => (stats.maxLikes || 0) >= 100,
    getProgress: (stats) => Math.min(100, ((stats.maxLikes || 0) / 100) * 100)
  },
  
  '신속 게시자': {
    name: '신속 게시자',
    description: '하루에 게시물을 5개 올렸어요!',
    icon: '⚡',
    category: '숨김',
    difficulty: 3,
    gradient: ['#FDE047', '#F97316'],
    hidden: true,
    condition: (stats) => {
      if (!stats.posts || stats.posts.length === 0) return false;
      const postsByDate = {};
      stats.posts.forEach(post => {
        const date = new Date(post.createdAt).toDateString();
        postsByDate[date] = (postsByDate[date] || 0) + 1;
      });
      return Math.max(...Object.values(postsByDate)) >= 5;
    },
    getProgress: (stats) => {
      if (!stats.posts || stats.posts.length === 0) return 0;
      const postsByDate = {};
      stats.posts.forEach(post => {
        const date = new Date(post.createdAt).toDateString();
        postsByDate[date] = (postsByDate[date] || 0) + 1;
      });
      const max = Math.max(...Object.values(postsByDate));
      return Math.min(100, (max / 5) * 100);
    }
  },
  
  '전설의 여행자': {
    name: '전설의 여행자',
    description: '200개의 여행 기록! 당신은 전설입니다!',
    icon: '🦄',
    category: '숨김',
    difficulty: 5,
    gradient: ['#F472B6', '#A855F7', '#6366F1'],
    hidden: true,
    condition: (stats) => stats.totalPosts >= 200,
    getProgress: (stats) => Math.min(100, (stats.totalPosts / 200) * 100)
  },
  
  '도시 탐험가': {
    name: '도시 탐험가',
    description: '한 지역에서 20개 이상 게시! 숨겨진 명소를 찾았어요',
    icon: '🌃',
    category: '숨김',
    difficulty: 3,
    gradient: ['#818CF8', '#6366F1'],
    hidden: true,
    condition: (stats) => {
      if (!stats.posts || stats.posts.length === 0) return false;
      const regionCounts = {};
      stats.posts.forEach(post => {
        const region = post.region || post.location?.split(' ')[0] || 'unknown';
        regionCounts[region] = (regionCounts[region] || 0) + 1;
      });
      const maxCount = Math.max(...Object.values(regionCounts));
      return maxCount >= 20;
    },
    getProgress: (stats) => {
      if (!stats.posts || stats.posts.length === 0) return 0;
      const regionCounts = {};
      stats.posts.forEach(post => {
        const region = post.region || post.location?.split(' ')[0] || 'unknown';
        regionCounts[region] = (regionCounts[region] || 0) + 1;
      });
      const maxCount = Math.max(...Object.values(regionCounts));
      return Math.min(100, (maxCount / 20) * 100);
    }
  }
};

export const calculateUserStats = (posts = [], user = {}) => {
  console.log('📊 사용자 통계 계산 시작');
  
  const stats = {
    totalPosts: posts.length,
    posts: posts,
    userId: user.id || user._id,
    totalLikes: posts.reduce((sum, p) => sum + (p.likes || 0), 0),
    maxLikes: Math.max(...posts.map(p => p.likes || 0), 0),
    visitedRegions: new Set(posts.map(p => p.region || p.location?.split(' ')[0]).filter(Boolean)).size
  };
  
  console.log(`✅ 통계 계산 완료: 총 ${stats.totalPosts}개 게시물, ${stats.visitedRegions}개 지역`);
  return stats;
};

export const checkNewBadges = async (stats) => {
  console.log('🎖️ 새 뱃지 확인 시작');
  
  try {
    const earnedBadgesJson = await AsyncStorage.getItem('earnedBadges');
    const earnedBadges = earnedBadgesJson ? JSON.parse(earnedBadgesJson) : [];
    const earnedBadgeNames = earnedBadges.map(b => b.name);
    
    const newBadges = [];
    
    for (const [badgeName, badgeInfo] of Object.entries(BADGES)) {
      if (earnedBadgeNames.includes(badgeName)) continue;
      
      try {
        const meetsCondition = badgeInfo.condition(stats);
        if (meetsCondition) {
          newBadges.push(badgeInfo);
          console.log(`🎉 새 뱃지 획득 가능: ${badgeName}`);
        }
      } catch (error) {
        console.error(`뱃지 조건 확인 오류 (${badgeName}):`, error);
      }
    }
    
    console.log(`✅ 뱃지 확인 완료: ${newBadges.length}개 신규 획득 가능`);
    return newBadges;
  } catch (error) {
    console.error('❌ 뱃지 체크 오류:', error);
    return [];
  }
};

export const awardBadge = async (badge) => {
  console.log(`🎁 뱃지 획득 처리 시작: ${badge.name}`);
  
  try {
    const earnedBadgesJson = await AsyncStorage.getItem('earnedBadges');
    const earnedBadges = earnedBadgesJson ? JSON.parse(earnedBadgesJson) : [];
    
    if (earnedBadges.some(b => b.name === badge.name)) {
      console.log(`⚠️ 이미 획득한 뱃지: ${badge.name}`);
      return false;
    }
    
    const newBadge = {
      ...badge,
      earnedAt: new Date().toISOString()
    };
    
    earnedBadges.push(newBadge);
    await AsyncStorage.setItem('earnedBadges', JSON.stringify(earnedBadges));
    
    console.log(`✅ 뱃지 저장 완료: ${badge.name}`);
    return true;
  } catch (error) {
    console.error(`❌ 뱃지 획득 처리 오류:`, error);
    return false;
  }
};

export const getEarnedBadges = async () => {
  try {
    const earnedBadgesJson = await AsyncStorage.getItem('earnedBadges');
    return earnedBadgesJson ? JSON.parse(earnedBadgesJson) : [];
  } catch (error) {
    console.error('❌ 뱃지 목록 조회 오류:', error);
    return [];
  }
};

export const getBadgeProgress = (badgeName, stats) => {
  const badge = BADGES[badgeName];
  if (!badge || !badge.getProgress) return 0;
  
  try {
    return badge.getProgress(stats);
  } catch (error) {
    console.error(`뱃지 진행도 계산 오류 (${badgeName}):`, error);
    return 0;
  }
};

export const getBadgesByCategory = (category) => {
  return Object.values(BADGES).filter(badge => badge.category === category);
};

export const getVisibleBadges = () => {
  return Object.values(BADGES).filter(badge => !badge.hidden);
};

export const hasSeenBadge = async (badgeName) => {
  try {
    const seenBadgesJson = await AsyncStorage.getItem('seenBadges');
    const seenBadges = seenBadgesJson ? JSON.parse(seenBadgesJson) : [];
    return seenBadges.includes(badgeName);
  } catch (error) {
    console.error('❌ 뱃지 확인 오류:', error);
    return false;
  }
};

export const markBadgeAsSeen = async (badgeName) => {
  try {
    const seenBadgesJson = await AsyncStorage.getItem('seenBadges');
    const seenBadges = seenBadgesJson ? JSON.parse(seenBadgesJson) : [];
    if (!seenBadges.includes(badgeName)) {
      seenBadges.push(badgeName);
      await AsyncStorage.setItem('seenBadges', JSON.stringify(seenBadges));
      console.log(`✅ 뱃지 확인 표시: ${badgeName}`);
    }
    return true;
  } catch (error) {
    console.error('❌ 뱃지 확인 표시 오류:', error);
    return false;
  }
};
export const getEarnedBadgesForUser = async (userId) => {
  const earned = await getEarnedBadges();
  if (earned && earned.length > 0) {
    return earned;
  }

  // 개발 단계: 아직 실제 뱃지 데이터가 없을 때,
  // 각 사용자에게 BADGES 기반 임의 뱃지를 몇 개씩 부여해서
  // UI에서 항상 뱃지와 대표 뱃지가 보이도록 한다.
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    const visibleBadges = Object.values(BADGES);
    if (visibleBadges.length === 0) return [];

    const baseCount = 3;
    const maxExtra = 4; // 3~7개

    const hashSource = userId ? userId.toString() : 'default-user';
    const hash = hashSource
      .split('')
      .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

    const count = baseCount + (hash % maxExtra);

    const mockBadges = [];
    for (let i = 0; i < count; i += 1) {
      const idx = (hash + i) % visibleBadges.length;
      const badge = visibleBadges[idx];
      mockBadges.push({
        ...badge,
        earnedAt: new Date().toISOString(),
      });
    }

    return mockBadges;
  }

  return earned;
};

export const getAvailableBadges = async (stats = null) => {
  const earnedBadges = await getEarnedBadges();
  const earnedBadgeNames = earnedBadges.map(b => b.name);
  
  return Object.entries(BADGES).map(([name, badge]) => {
    const isEarned = earnedBadgeNames.includes(name);
    const progress = stats ? getBadgeProgress(name, stats) : 0;
    
    return {
      ...badge,
      name,
      isEarned,
      progress
    };
  });
};

export const getBadgeStats = async () => {
  const earnedBadges = await getEarnedBadges();
  
  const categoryCounts = {
    '시작': earnedBadges.filter(b => b.category === '시작').length,
    '활동': earnedBadges.filter(b => b.category === '활동').length,
    '전문가': earnedBadges.filter(b => b.category === '전문가').length,
    '마스터': earnedBadges.filter(b => b.category === '마스터').length,
    '지역': earnedBadges.filter(b => b.category === '지역').length,
    '숨김': earnedBadges.filter(b => b.category === '숨김').length
  };
  
  return {
    total: earnedBadges.length,
    categoryCounts
  };
};
export default BADGES;


