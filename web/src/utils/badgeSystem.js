/**
 * 뱃지 시스템 - 난이도별 포인트 지급
 */

// 뱃지 난이도별 포인트
const BADGE_POINTS = {
  '하': 100,   // 쉬운 뱃지
  '중': 300,   // 중간 난이도 뱃지
  '상': 500    // 어려운 뱃지
};

// 뱃지 목록 (난이도 포함)
export const BADGES = {
  // === 시작 뱃지 (하) ===
  '첫 여행 기록': {
    name: '첫 여행 기록',
    difficulty: '하',
    icon: '🎯',
    description: '첫 번째 여행 사진을 업로드했습니다!',
    condition: (stats) => stats.totalPosts >= 1,
    points: BADGE_POINTS['하']
  },
  
  '여행 입문자': {
    name: '여행 입문자',
    difficulty: '하',
    icon: '🌱',
    description: '3개의 여행 기록을 남겼습니다.',
    condition: (stats) => stats.totalPosts >= 3,
    points: BADGE_POINTS['하']
  },
  
  '첫 좋아요': {
    name: '첫 좋아요',
    difficulty: '하',
    icon: '❤️',
    description: '첫 번째 좋아요를 받았습니다!',
    condition: (stats) => stats.totalLikes >= 1,
    points: BADGE_POINTS['하']
  },
  
  // === 활동 뱃지 (중) ===
  '여행 탐험가': {
    name: '여행 탐험가',
    difficulty: '중',
    icon: '🧭',
    description: '10개의 여행 기록을 남긴 진정한 탐험가!',
    condition: (stats) => stats.totalPosts >= 10,
    points: BADGE_POINTS['중']
  },
  
  '사진 수집가': {
    name: '사진 수집가',
    difficulty: '중',
    icon: '📸',
    description: '25개의 여행 사진을 업로드했습니다.',
    condition: (stats) => stats.totalPosts >= 25,
    points: BADGE_POINTS['중']
  },
  
  '인기 여행자': {
    name: '인기 여행자',
    difficulty: '중',
    icon: '⭐',
    description: '50개의 좋아요를 받았습니다!',
    condition: (stats) => stats.totalLikes >= 50,
    points: BADGE_POINTS['중']
  },
  
  '지역 전문가': {
    name: '지역 전문가',
    difficulty: '중',
    icon: '🗺️',
    description: '5개 이상의 지역을 방문했습니다.',
    condition: (stats) => stats.visitedRegions >= 5,
    points: BADGE_POINTS['중']
  },
  
  // === 전문가 뱃지 (상) ===
  '여행 마스터': {
    name: '여행 마스터',
    difficulty: '상',
    icon: '🏆',
    description: '50개의 여행 기록을 남긴 마스터!',
    condition: (stats) => stats.totalPosts >= 50,
    points: BADGE_POINTS['상']
  },
  
  '전국 정복자': {
    name: '전국 정복자',
    difficulty: '상',
    icon: '🌏',
    description: '10개 이상의 지역을 모두 방문했습니다!',
    condition: (stats) => stats.visitedRegions >= 10,
    points: BADGE_POINTS['상']
  },
  
  '슈퍼스타': {
    name: '슈퍼스타',
    difficulty: '상',
    icon: '💫',
    description: '100개 이상의 좋아요를 받은 슈퍼스타!',
    condition: (stats) => stats.totalLikes >= 100,
    points: BADGE_POINTS['상']
  },
  
  '여행 레전드': {
    name: '여행 레전드',
    difficulty: '상',
    icon: '👑',
    description: '100개의 여행 기록을 남긴 전설!',
    condition: (stats) => stats.totalPosts >= 100,
    points: BADGE_POINTS['상']
  },
  
  // === 지역별 뱃지 (중) ===
  '서울 정복자': {
    name: '서울 정복자',
    difficulty: '중',
    icon: '🏙️',
    description: '서울의 주요 명소를 모두 방문했습니다!',
    condition: (stats) => stats.regionPosts['서울'] >= 5,
    points: BADGE_POINTS['중'],
    region: '서울'
  },
  
  '부산 정복자': {
    name: '부산 정복자',
    difficulty: '중',
    icon: '🌊',
    description: '부산의 주요 명소를 모두 방문했습니다!',
    condition: (stats) => stats.regionPosts['부산'] >= 5,
    points: BADGE_POINTS['중'],
    region: '부산'
  },
  
  '제주 정복자': {
    name: '제주 정복자',
    difficulty: '중',
    icon: '🍊',
    description: '제주도의 주요 명소를 모두 방문했습니다!',
    condition: (stats) => stats.regionPosts['제주'] >= 5,
    points: BADGE_POINTS['중'],
    region: '제주'
  },
  
  '경주 정복자': {
    name: '경주 정복자',
    difficulty: '중',
    icon: '🏛️',
    description: '경주의 주요 명소를 모두 방문했습니다!',
    condition: (stats) => stats.regionPosts['경주'] >= 5,
    points: BADGE_POINTS['중'],
    region: '경주'
  },
  
  '강릉 정복자': {
    name: '강릉 정복자',
    difficulty: '중',
    icon: '🏖️',
    description: '강릉의 주요 명소를 모두 방문했습니다!',
    condition: (stats) => stats.regionPosts['강릉'] >= 5,
    points: BADGE_POINTS['중'],
    region: '강릉'
  },
  
  '전주 정복자': {
    name: '전주 정복자',
    difficulty: '중',
    icon: '🏯',
    description: '전주의 주요 명소를 모두 방문했습니다!',
    condition: (stats) => stats.regionPosts['전주'] >= 5,
    points: BADGE_POINTS['중'],
    region: '전주'
  },
  
  // === 카테고리별 뱃지 (중) ===
  '맛집 헌터': {
    name: '맛집 헌터',
    difficulty: '중',
    icon: '🍜',
    description: '10개 이상의 맛집을 소개했습니다!',
    condition: (stats) => stats.categoryPosts['맛집 정보'] >= 10,
    points: BADGE_POINTS['중']
  },
  
  '꽃 사냥꾼': {
    name: '꽃 사냥꾼',
    difficulty: '중',
    icon: '🌸',
    description: '10개 이상의 개화 상황을 공유했습니다!',
    condition: (stats) => stats.categoryPosts['개화 상황'] >= 10,
    points: BADGE_POINTS['중']
  },
  
  '명소 추천왕': {
    name: '명소 추천왕',
    difficulty: '중',
    icon: '🏞️',
    description: '15개 이상의 추천 장소를 공유했습니다!',
    condition: (stats) => stats.categoryPosts['추천 장소'] >= 15,
    points: BADGE_POINTS['중']
  },
  
  // === 특별 뱃지 (상) ===
  '얼리어답터': {
    name: '얼리어답터',
    difficulty: '상',
    icon: '🚀',
    description: 'LiveJourney 초기 멤버입니다!',
    condition: (stats) => stats.joinDate && new Date(stats.joinDate) < new Date('2025-12-31'),
    points: BADGE_POINTS['상']
  },
  
  '연속 업로더': {
    name: '연속 업로더',
    difficulty: '상',
    icon: '🔥',
    description: '7일 연속으로 사진을 업로드했습니다!',
    condition: (stats) => stats.consecutiveDays >= 7,
    points: BADGE_POINTS['상']
  },
  
  '포인트 부자': {
    name: '포인트 부자',
    difficulty: '상',
    icon: '💰',
    description: '10,000 포인트를 모았습니다!',
    condition: (stats) => stats.totalPoints >= 10000,
    points: BADGE_POINTS['상']
  }
};

// 사용자 통계 계산
export const calculateUserStats = () => {
  const posts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');
  const userPosts = posts.filter(p => !p.id || !p.id.toString().startsWith('mock-'));
  
  // 지역별 게시물 수
  const regionPosts = {};
  userPosts.forEach(post => {
    const region = post.location?.split(' ')[0] || post.detailedLocation?.split(' ')[0];
    if (region) {
      regionPosts[region] = (regionPosts[region] || 0) + 1;
    }
  });
  
  // 카테고리별 게시물 수
  const categoryPosts = {};
  userPosts.forEach(post => {
    const category = post.categoryName || post.category;
    if (category) {
      categoryPosts[category] = (categoryPosts[category] || 0) + 1;
    }
  });
  
  // 총 좋아요 수
  const totalLikes = userPosts.reduce((sum, post) => sum + (post.likes || 0), 0);
  
  // 방문한 지역 수
  const visitedRegions = Object.keys(regionPosts).length;
  
  // 총 포인트
  const totalPoints = parseInt(localStorage.getItem('userPoints') || '0');
  
  // 가입일 (localStorage에서 가져오기, 없으면 현재)
  const joinDate = localStorage.getItem('userJoinDate') || new Date().toISOString();
  if (!localStorage.getItem('userJoinDate')) {
    localStorage.setItem('userJoinDate', joinDate);
  }
  
  // 연속 업로드 일수 (간단히 구현)
  const consecutiveDays = calculateConsecutiveDays(userPosts);
  
  return {
    totalPosts: userPosts.length,
    totalLikes,
    visitedRegions,
    regionPosts,
    categoryPosts,
    totalPoints,
    joinDate,
    consecutiveDays
  };
};

// 연속 업로드 일수 계산
const calculateConsecutiveDays = (posts) => {
  if (posts.length === 0) return 0;
  
  // 날짜별로 게시물 그룹화
  const dateSet = new Set();
  posts.forEach(post => {
    if (post.time) {
      const date = new Date(post.time).toDateString();
      dateSet.add(date);
    }
  });
  
  const dates = Array.from(dateSet).sort((a, b) => new Date(b) - new Date(a));
  
  let consecutive = 1;
  for (let i = 0; i < dates.length - 1; i++) {
    const current = new Date(dates[i]);
    const next = new Date(dates[i + 1]);
    const diffDays = Math.floor((current - next) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      consecutive++;
    } else {
      break;
    }
  }
  
  return consecutive;
};

// 새로 획득한 뱃지 확인
export const checkNewBadges = () => {
  const stats = calculateUserStats();
  const earnedBadges = JSON.parse(localStorage.getItem('earnedBadges') || '[]');
  const earnedBadgeNames = earnedBadges.map(b => b.name);
  
  const newBadges = [];
  
  Object.values(BADGES).forEach(badge => {
    if (!earnedBadgeNames.includes(badge.name) && badge.condition(stats)) {
      newBadges.push(badge);
    }
  });
  
  return newBadges;
};

// 뱃지 획득 처리 (포인트 지급 포함)
export const awardBadge = (badge) => {
  const earnedBadges = JSON.parse(localStorage.getItem('earnedBadges') || '[]');
  
  // 이미 획득한 뱃지인지 확인
  if (earnedBadges.some(b => b.name === badge.name)) {
    return false;
  }
  
  // 뱃지 추가
  const newBadge = {
    ...badge,
    earnedAt: new Date().toISOString()
  };
  
  earnedBadges.push(newBadge);
  localStorage.setItem('earnedBadges', JSON.stringify(earnedBadges));
  
  // 포인트 지급
  const currentPoints = parseInt(localStorage.getItem('userPoints') || '0');
  const newPoints = currentPoints + badge.points;
  localStorage.setItem('userPoints', newPoints.toString());
  
  // 포인트 히스토리 추가
  const pointsHistory = JSON.parse(localStorage.getItem('pointsHistory') || '[]');
  pointsHistory.unshift({
    action: `뱃지 획득: ${badge.name}`,
    points: badge.points,
    timestamp: new Date().toISOString(),
    badge: badge.name,
    difficulty: badge.difficulty
  });
  localStorage.setItem('pointsHistory', JSON.stringify(pointsHistory));
  
  console.log(`🏆 뱃지 획득: ${badge.name} (난이도: ${badge.difficulty}, +${badge.points}P)`);
  
  return true;
};

// 획득한 뱃지 목록
export const getEarnedBadges = () => {
  return JSON.parse(localStorage.getItem('earnedBadges') || '[]');
};

// 뱃지 획득 여부 확인
export const hasSeenBadge = (badgeName) => {
  const seenBadges = JSON.parse(localStorage.getItem('seenBadges') || '[]');
  return seenBadges.includes(badgeName);
};

// 뱃지를 본 것으로 표시
export const markBadgeAsSeen = (badgeName) => {
  const seenBadges = JSON.parse(localStorage.getItem('seenBadges') || '[]');
  if (!seenBadges.includes(badgeName)) {
    seenBadges.push(badgeName);
    localStorage.setItem('seenBadges', JSON.stringify(seenBadges));
  }
};

// 획득 가능한 뱃지 목록 (진행률 포함)
export const getAvailableBadges = () => {
  const stats = calculateUserStats();
  const earnedBadges = getEarnedBadges();
  const earnedBadgeNames = earnedBadges.map(b => b.name);
  
  return Object.values(BADGES).map(badge => {
    const isEarned = earnedBadgeNames.includes(badge.name);
    const progress = calculateBadgeProgress(badge, stats);
    
    return {
      ...badge,
      isEarned,
      progress
    };
  });
};

// 뱃지 진행률 계산
const calculateBadgeProgress = (badge, stats) => {
  // 간단한 진행률 계산 (실제로는 더 복잡할 수 있음)
  if (badge.condition(stats)) {
    return 100;
  }
  
  // 게시물 수 기반 뱃지
  if (badge.name.includes('여행') || badge.name.includes('사진')) {
    const required = badge.name.includes('100') ? 100 : 
                    badge.name.includes('50') ? 50 :
                    badge.name.includes('25') ? 25 :
                    badge.name.includes('10') ? 10 :
                    badge.name.includes('3') ? 3 : 1;
    return Math.min(100, (stats.totalPosts / required) * 100);
  }
  
  return 0;
};

