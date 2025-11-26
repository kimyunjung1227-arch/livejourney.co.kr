/**
 * 24시간 명예 챌린지 시스템
 * 매일 자정에 리셋되며 상위 25인에게 특별 타이틀 수여
 */

// 타이틀 정의 (25개)
export const DAILY_TITLES = {
  // === 1. 실시간 현장 속보 부문 ===
  '실시간 0분 스피드 헌터': {
    id: 1,
    name: '실시간 0분 스피드 헌터',
    icon: '⚡️',
    category: '실시간 속보',
    description: '당일 첫 번째 실시간 여행 정보를 포스팅한 사용자',
    effect: 'lightning',
    bgColor: 'from-yellow-400 to-orange-500',
    borderColor: 'border-yellow-500',
    glowColor: 'shadow-yellow-500/50'
  },
  '긴급 속보 특파원': {
    id: 2,
    name: '긴급 속보 특파원',
    icon: '📢',
    category: '실시간 속보',
    description: "'교통 통제', '휴무' 등 긴급 키워드 정보를 가장 먼저 포스팅",
    effect: 'alert',
    bgColor: 'from-red-400 to-orange-500',
    borderColor: 'border-red-500',
    glowColor: 'shadow-red-500/50'
  },
  '번개 날씨 예보관': {
    id: 3,
    name: '번개 날씨 예보관',
    icon: '🌧️',
    category: '실시간 속보',
    description: '갑작스러운 날씨 변화를 가장 먼저 실시간으로 올린 사용자',
    effect: 'weather',
    bgColor: 'from-blue-400 to-cyan-500',
    borderColor: 'border-blue-500',
    glowColor: 'shadow-blue-500/50'
  },
  '위험 경보의 수호자': {
    id: 4,
    name: '위험 경보의 수호자',
    icon: '🚨',
    category: '실시간 속보',
    description: '여행지 안전 정보를 공유하여 피해를 막은 사용자',
    effect: 'danger',
    bgColor: 'from-red-500 to-pink-500',
    borderColor: 'border-red-600',
    glowColor: 'shadow-red-600/50'
  },
  '의지의 핫플 실패러': {
    id: 5,
    name: '의지의 핫플 실패러',
    icon: '🚧',
    category: '실시간 속보',
    description: '폐업/휴무 등 변동된 현장 상황을 공유한 사용자',
    effect: 'caution',
    bgColor: 'from-orange-400 to-red-400',
    borderColor: 'border-orange-500',
    glowColor: 'shadow-orange-500/50'
  },
  '새벽 개척자': {
    id: 6,
    name: '새벽 개척자',
    icon: '🌙',
    category: '실시간 속보',
    description: '새벽 1시~5시 사이에 실시간 정보를 포스팅한 사용자',
    effect: 'night',
    bgColor: 'from-indigo-500 to-purple-600',
    borderColor: 'border-indigo-600',
    glowColor: 'shadow-indigo-600/50'
  },
  '지금 간다 묻지 마세요': {
    id: 7,
    name: '지금 간다 묻지 마세요',
    icon: '🏃',
    category: '실시간 속보',
    description: "'지금 바로 가세요' 알림 후, 해당 장소에 가장 먼저 도착 인증",
    effect: 'speed',
    bgColor: 'from-green-400 to-orange-500',
    borderColor: 'border-green-500',
    glowColor: 'shadow-green-500/50'
  },
  '현장 줄 서기 명인': {
    id: 8,
    name: '현장 줄 서기 명인',
    icon: '⏳',
    category: '실시간 속보',
    description: '인기 장소의 가장 정확한 실시간 대기 시간 정보를 제공',
    effect: 'waiting',
    bgColor: 'from-amber-400 to-orange-500',
    borderColor: 'border-amber-500',
    glowColor: 'shadow-amber-500/50'
  },
  '날 것의 기록자': {
    id: 9,
    name: '날 것의 기록자',
    icon: '📸',
    category: '실시간 속보',
    description: '포토샵 없이 가장 현실적인 현장 상황 사진을 공유',
    effect: 'raw',
    bgColor: 'from-gray-400 to-gray-600',
    borderColor: 'border-gray-500',
    glowColor: 'shadow-gray-500/50'
  },

  // === 2. 위치 기반 & 유용성 부문 ===
  '오늘 길잡이': {
    id: 10,
    name: '오늘 길잡이',
    icon: '🗺️',
    category: '위치 기반',
    description: "'저장하기'를 가장 많이 받은 유용한 정보성 포스팅 작성자",
    effect: 'guide',
    bgColor: 'from-emerald-400 to-green-500',
    borderColor: 'border-emerald-500',
    glowColor: 'shadow-emerald-500/50'
  },
  '오늘 지역 전문가': {
    id: 11,
    name: '오늘 지역 전문가',
    icon: '🎯',
    category: '위치 기반',
    description: '특정 여행 지역 내에서만 7개 이상의 포스팅을 올린 사용자',
    effect: 'expert',
    bgColor: 'from-purple-400 to-pink-500',
    borderColor: 'border-purple-500',
    glowColor: 'shadow-purple-500/50'
  },
  '500m 현장 검증단': {
    id: 12,
    name: '500m 현장 검증단',
    icon: '✅',
    category: '위치 기반',
    description: "500m 내 다른 정보에 대해 '사실 확인' 댓글을 3회 이상",
    effect: 'verified',
    bgColor: 'from-blue-400 to-indigo-500',
    borderColor: 'border-blue-500',
    glowColor: 'shadow-blue-500/50'
  },
  '숨겨진 보물 탐험가': {
    id: 13,
    name: '숨겨진 보물 탐험가',
    icon: '💎',
    category: '위치 기반',
    description: "숨겨진 '핫스팟 미션' 성공 후 가장 상세한 후기",
    effect: 'treasure',
    bgColor: 'from-cyan-400 to-blue-500',
    borderColor: 'border-cyan-500',
    glowColor: 'shadow-cyan-500/50'
  },
  '워커홀릭 여행자': {
    id: 14,
    name: '워커홀릭 여행자',
    icon: '👟',
    category: '위치 기반',
    description: '가장 긴 거리를 이동하고 현장 인증을 한 사용자',
    effect: 'walker',
    bgColor: 'from-lime-400 to-green-500',
    borderColor: 'border-lime-500',
    glowColor: 'shadow-lime-500/50'
  },
  '가성비 신': {
    id: 15,
    name: '가성비 신',
    icon: '💰',
    category: '위치 기반',
    description: '가장 유용한 현지 상황(할인, 이벤트 등) 팁을 공유',
    effect: 'value',
    bgColor: 'from-yellow-400 to-amber-500',
    borderColor: 'border-yellow-500',
    glowColor: 'shadow-yellow-500/50'
  },

  // === 3. 소통 & 콘텐츠 품질 부문 ===
  '좋아요 폭격의 왕': {
    id: 16,
    name: '좋아요 폭격의 왕',
    icon: '⭐',
    category: '소통',
    description: '24시간 동안 가장 많은 좋아요를 받은 포스팅의 작성자',
    effect: 'star',
    bgColor: 'from-yellow-300 to-orange-400',
    borderColor: 'border-yellow-400',
    glowColor: 'shadow-yellow-400/50'
  },
  '토론 유발자': {
    id: 17,
    name: '토론 유발자',
    icon: '💬',
    category: '소통',
    description: '24시간 동안 가장 많은 댓글이 달린 포스팅의 작성자',
    effect: 'discussion',
    bgColor: 'from-pink-400 to-rose-500',
    borderColor: 'border-pink-500',
    glowColor: 'shadow-pink-500/50'
  },
  '질문 해결사': {
    id: 18,
    name: '질문 해결사',
    icon: '❓',
    category: '소통',
    description: '여행 상황 질문에 가장 정확하고 상세한 답변을 제공',
    effect: 'solver',
    bgColor: 'from-orange-400 to-pink-500',
    borderColor: 'border-orange-500',
    glowColor: 'shadow-orange-500/50'
  },
  '댓글 릴레이 주역': {
    id: 19,
    name: '댓글 릴레이 주역',
    icon: '🔄',
    category: '소통',
    description: '자신의 포스팅 댓글에 가장 성실하게 응답(10회 이상)',
    effect: 'relay',
    bgColor: 'from-green-400 to-emerald-500',
    borderColor: 'border-green-500',
    glowColor: 'shadow-green-500/50'
  },
  '인생샷 제조기': {
    id: 20,
    name: '인생샷 제조기',
    icon: '🖼️',
    category: '소통',
    description: '가이드북급 품질의 사진을 업로드하여 시각적 즐거움을 제공',
    effect: 'photo',
    bgColor: 'from-violet-400 to-purple-500',
    borderColor: 'border-violet-500',
    glowColor: 'shadow-violet-500/50'
  },
  '일출/일몰 마스터': {
    id: 21,
    name: '일출/일몰 마스터',
    icon: '☀️',
    category: '소통',
    description: '시간대에 맞춰 가장 아름다운 사진을 업로드',
    effect: 'sunset',
    bgColor: 'from-orange-400 to-pink-500',
    borderColor: 'border-orange-500',
    glowColor: 'shadow-orange-500/50'
  },
  '댓글 인싸력 만렙': {
    id: 22,
    name: '댓글 인싸력 만렙',
    icon: '🔥',
    category: '소통',
    description: '다른 사람의 댓글에 달린 답글을 가장 많이 받은 사용자',
    effect: 'hot',
    bgColor: 'from-red-400 to-orange-500',
    borderColor: 'border-red-500',
    glowColor: 'shadow-red-500/50'
  },

  // === 4. 참여 & 성실 부문 ===
  '오늘의 첫 셔터': {
    id: 23,
    name: '오늘의 첫 셔터',
    icon: '📷',
    category: '참여',
    description: '당일 가장 먼저 사진 포스팅을 올린 사용자',
    effect: 'first',
    bgColor: 'from-sky-400 to-blue-500',
    borderColor: 'border-sky-500',
    glowColor: 'shadow-sky-500/50'
  },
  '일일 접속 완벽주의자': {
    id: 24,
    name: '일일 접속 완벽주의자',
    icon: '🔁',
    category: '참여',
    description: '3시간 간격으로 최소 5회 이상 앱에 접속한 사용자',
    effect: 'perfect',
    bgColor: 'from-indigo-400 to-purple-500',
    borderColor: 'border-indigo-500',
    glowColor: 'shadow-indigo-500/50'
  },
  '시한부 낭만주의자': {
    id: 25,
    name: '시한부 낭만주의자',
    icon: '⏱️',
    category: '참여',
    description: '24시간 혜택 종료 10분 전에 아슬아슬하게 미션을 완료',
    effect: 'deadline',
    bgColor: 'from-fuchsia-400 to-pink-500',
    borderColor: 'border-fuchsia-500',
    glowColor: 'shadow-fuchsia-500/50'
  }
};

// 오늘 날짜 키 (YYYY-MM-DD)
const getTodayKey = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

// 사용자 통계 계산 (당일 기준)
export const calculateDailyStats = (userId) => {
  const todayKey = getTodayKey();
  const posts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');
  
  // 당일 게시물만 필터링
  const todayPosts = posts.filter(p => {
    if (!p.timestamp) return false;
    const postDate = new Date(p.timestamp);
    const postKey = `${postDate.getFullYear()}-${String(postDate.getMonth() + 1).padStart(2, '0')}-${String(postDate.getDate()).padStart(2, '0')}`;
    return postKey === todayKey && p.userId === userId;
  });

  // 통계 계산
  return {
    todayPostCount: todayPosts.length,
    totalLikes: todayPosts.reduce((sum, p) => sum + (p.likes || 0), 0),
    totalComments: todayPosts.reduce((sum, p) => sum + (p.qnaList?.length || 0), 0),
    firstPost: todayPosts.length > 0 ? todayPosts.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))[0] : null,
    mostLikedPost: todayPosts.length > 0 ? todayPosts.sort((a, b) => (b.likes || 0) - (a.likes || 0))[0] : null,
    posts: todayPosts
  };
};

// 타이틀 조건 체크
export const checkTitleConditions = (userId) => {
  const stats = calculateDailyStats(userId);
  const earnedTitles = [];

  // 1. 실시간 0분 스피드 헌터 - 당일 첫 포스팅
  if (stats.firstPost) {
    const allPosts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');
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

  // 2. 긴급 속보 특파원 - 긴급 키워드 포함 (가장 먼저 포스팅한 사람만)
  const emergencyKeywords = ['교통 통제', '휴무', '폐업', '공사', '긴급', '통제', '운휴'];
  const emergencyPosts = stats.posts.filter(p => 
    emergencyKeywords.some(keyword => 
      (p.note || '').includes(keyword) || (p.aiLabels || []).some(label => label.includes(keyword))
    )
  ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  
  if (emergencyPosts.length > 0) {
    const allPosts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');
    const todayKey = getTodayKey();
    const allTodayEmergencyPosts = allPosts.filter(p => {
      if (!p.timestamp) return false;
      const postDate = new Date(p.timestamp);
      const postKey = `${postDate.getFullYear()}-${String(postDate.getMonth() + 1).padStart(2, '0')}-${String(postDate.getDate()).padStart(2, '0')}`;
      if (postKey !== todayKey) return false;
      return emergencyKeywords.some(keyword => 
        (p.note || '').includes(keyword) || (p.aiLabels || []).some(label => label.includes(keyword))
      );
    }).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    if (allTodayEmergencyPosts[0]?.userId === userId) {
      earnedTitles.push(DAILY_TITLES['긴급 속보 특파원']);
    }
  }

  // 3. 번개 날씨 예보관 - 날씨 관련 키워드 (가장 먼저 포스팅한 사람만)
  const weatherKeywords = ['비', '눈', '폭우', '강풍', '날씨', '우천'];
  const weatherPosts = stats.posts.filter(p => 
    weatherKeywords.some(keyword => 
      (p.note || '').includes(keyword) || (p.aiLabels || []).some(label => label.includes(keyword))
    )
  ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  
  if (weatherPosts.length > 0) {
    const allPosts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');
    const todayKey = getTodayKey();
    const allTodayWeatherPosts = allPosts.filter(p => {
      if (!p.timestamp) return false;
      const postDate = new Date(p.timestamp);
      const postKey = `${postDate.getFullYear()}-${String(postDate.getMonth() + 1).padStart(2, '0')}-${String(postDate.getDate()).padStart(2, '0')}`;
      if (postKey !== todayKey) return false;
      return weatherKeywords.some(keyword => 
        (p.note || '').includes(keyword) || (p.aiLabels || []).some(label => label.includes(keyword))
      );
    }).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    if (allTodayWeatherPosts[0]?.userId === userId) {
      earnedTitles.push(DAILY_TITLES['번개 날씨 예보관']);
    }
  }

  // 4. 새벽 개척자 - 새벽 1시~5시 포스팅 (가장 먼저 포스팅한 사람만)
  const dawnPosts = stats.posts.filter(p => {
    const hour = new Date(p.timestamp).getHours();
    return hour >= 1 && hour <= 5;
  }).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  
  if (dawnPosts.length > 0) {
    const allPosts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');
    const todayKey = getTodayKey();
    const allTodayDawnPosts = allPosts.filter(p => {
      if (!p.timestamp) return false;
      const postDate = new Date(p.timestamp);
      const postKey = `${postDate.getFullYear()}-${String(postDate.getMonth() + 1).padStart(2, '0')}-${String(postDate.getDate()).padStart(2, '0')}`;
      if (postKey !== todayKey) return false;
      const hour = new Date(p.timestamp).getHours();
      return hour >= 1 && hour <= 5;
    }).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    if (allTodayDawnPosts[0]?.userId === userId) {
      earnedTitles.push(DAILY_TITLES['새벽 개척자']);
    }
  }

  // 5. 오늘 지역 전문가 - 특정 지역 7개 이상 (가장 많은 사람만)
  const regionCounts = {};
  stats.posts.forEach(p => {
    const region = p.location?.split(' ')[0];
    if (region) {
      regionCounts[region] = (regionCounts[region] || 0) + 1;
    }
  });
  const maxRegionCount = Math.max(...Object.values(regionCounts), 0);
  if (maxRegionCount >= 7) {
    // 모든 사용자 중에서 가장 많은 지역 포스팅을 한 사람 찾기
    const allPosts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');
    const todayKey = getTodayKey();
    const allTodayPosts = allPosts.filter(p => {
      if (!p.timestamp) return false;
      const postDate = new Date(p.timestamp);
      const postKey = `${postDate.getFullYear()}-${String(postDate.getMonth() + 1).padStart(2, '0')}-${String(postDate.getDate()).padStart(2, '0')}`;
      return postKey === todayKey;
    });
    
    const userRegionCounts = {};
    allTodayPosts.forEach(p => {
      const region = p.location?.split(' ')[0];
      if (region) {
        if (!userRegionCounts[p.userId]) {
          userRegionCounts[p.userId] = {};
        }
        userRegionCounts[p.userId][region] = (userRegionCounts[p.userId][region] || 0) + 1;
      }
    });
    
    const userMaxCounts = Object.entries(userRegionCounts).map(([uid, regions]) => ({
      userId: uid,
      maxCount: Math.max(...Object.values(regions), 0)
    }));
    
    const topUser = userMaxCounts.sort((a, b) => b.maxCount - a.maxCount)[0];
    if (topUser && topUser.userId === userId && topUser.maxCount >= 7) {
      earnedTitles.push(DAILY_TITLES['오늘 지역 전문가']);
    }
  }

  // 6. 좋아요 폭격의 왕 - 좋아요 많은 포스팅 (가장 많은 사람만)
  if (stats.mostLikedPost && stats.mostLikedPost.likes >= 10) {
    const allPosts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');
    const todayKey = getTodayKey();
    const allTodayPosts = allPosts.filter(p => {
      if (!p.timestamp) return false;
      const postDate = new Date(p.timestamp);
      const postKey = `${postDate.getFullYear()}-${String(postDate.getMonth() + 1).padStart(2, '0')}-${String(postDate.getDate()).padStart(2, '0')}`;
      return postKey === todayKey;
    });
    
    const topLikedPost = allTodayPosts
      .filter(p => (p.likes || p.likeCount || 0) >= 10)
      .sort((a, b) => (b.likes || b.likeCount || 0) - (a.likes || a.likeCount || 0))[0];
    
    if (topLikedPost && topLikedPost.userId === userId) {
      earnedTitles.push(DAILY_TITLES['좋아요 폭격의 왕']);
    }
  }

  // 7. 토론 유발자 - 댓글 많은 포스팅 (가장 많은 사람만)
  if (stats.totalComments >= 15) {
    const allPosts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');
    const todayKey = getTodayKey();
    const allTodayPosts = allPosts.filter(p => {
      if (!p.timestamp) return false;
      const postDate = new Date(p.timestamp);
      const postKey = `${postDate.getFullYear()}-${String(postDate.getMonth() + 1).padStart(2, '0')}-${String(postDate.getDate()).padStart(2, '0')}`;
      return postKey === todayKey;
    });
    
    const userCommentCounts = {};
    allTodayPosts.forEach(p => {
      const commentCount = p.comments?.length || p.commentCount || 0;
      userCommentCounts[p.userId] = (userCommentCounts[p.userId] || 0) + commentCount;
    });
    
    const topUser = Object.entries(userCommentCounts)
      .sort((a, b) => b[1] - a[1])[0];
    
    if (topUser && topUser[0] === userId && topUser[1] >= 15) {
      earnedTitles.push(DAILY_TITLES['토론 유발자']);
    }
  }

  // 8. 오늘의 첫 셔터 - 첫 포스팅 (이미 실시간 0분 스피드 헌터와 중복이므로 제거)
  // if (stats.todayPostCount >= 1) {
  //   earnedTitles.push(DAILY_TITLES['오늘의 첫 셔터']);
  // }

  // 9. 인생샷 제조기 - 좋아요 많은 사진 (가장 많은 사람만)
  if (stats.totalLikes >= 20) {
    const allPosts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');
    const todayKey = getTodayKey();
    const allTodayPosts = allPosts.filter(p => {
      if (!p.timestamp) return false;
      const postDate = new Date(p.timestamp);
      const postKey = `${postDate.getFullYear()}-${String(postDate.getMonth() + 1).padStart(2, '0')}-${String(postDate.getDate()).padStart(2, '0')}`;
      return postKey === todayKey;
    });
    
    const userTotalLikes = {};
    allTodayPosts.forEach(p => {
      const likes = p.likes || p.likeCount || 0;
      userTotalLikes[p.userId] = (userTotalLikes[p.userId] || 0) + likes;
    });
    
    const topUser = Object.entries(userTotalLikes)
      .sort((a, b) => b[1] - a[1])[0];
    
    if (topUser && topUser[0] === userId && topUser[1] >= 20) {
      earnedTitles.push(DAILY_TITLES['인생샷 제조기']);
    }
  }

  return earnedTitles;
};

// 타이틀 수여 (한 타이틀은 한 사람에게만 수여)
export const awardDailyTitle = (userId, title) => {
  const todayKey = getTodayKey();
  const dailyTitles = JSON.parse(localStorage.getItem('dailyTitles') || '{}');
  
  if (!dailyTitles[todayKey]) {
    dailyTitles[todayKey] = {};
  }
  
  // 이미 이 타이틀을 받은 사용자가 있는지 확인
  const existingTitleOwner = Object.entries(dailyTitles[todayKey]).find(
    ([uid, titleData]) => titleData.name === title.name
  );
  
  if (existingTitleOwner) {
    // 이미 다른 사용자가 이 타이틀을 받았음
    console.log(`👑 타이틀 "${title.name}"은 이미 ${existingTitleOwner[0]}에게 수여되었습니다.`);
    return false;
  }
  
  // 현재 사용자가 이미 다른 타이틀을 가지고 있는지 확인
  if (dailyTitles[todayKey][userId]) {
    // 이미 타이틀을 가지고 있으면 교체하지 않고 false 반환
    console.log(`👑 사용자 ${userId}는 이미 타이틀을 가지고 있습니다.`);
    return false;
  }
  
  // 타이틀 수여
  dailyTitles[todayKey][userId] = {
    ...title,
    earnedAt: new Date().toISOString(),
    expiresAt: new Date(new Date().setHours(24, 0, 0, 0)).toISOString()
  };
  
  localStorage.setItem('dailyTitles', JSON.stringify(dailyTitles));
  
  console.log(`👑 24시간 타이틀 획득: ${title.name} (사용자: ${userId})`);
  return true;
};

// 사용자의 현재 타이틀 조회
export const getUserDailyTitle = (userId) => {
  const todayKey = getTodayKey();
  const dailyTitles = JSON.parse(localStorage.getItem('dailyTitles') || '{}');
  
  const userTitle = dailyTitles[todayKey]?.[userId];
  
  // 만료 확인
  if (userTitle) {
    const expiresAt = new Date(userTitle.expiresAt);
    if (new Date() > expiresAt) {
      // 만료됨
      delete dailyTitles[todayKey][userId];
      localStorage.setItem('dailyTitles', JSON.stringify(dailyTitles));
      return null;
    }
  }
  
  return userTitle || null;
};

// 오늘의 모든 타이틀 조회 (모든 사용자)
export const getAllTodayTitles = () => {
  const todayKey = getTodayKey();
  const dailyTitles = JSON.parse(localStorage.getItem('dailyTitles') || '{}');
  const todayTitles = dailyTitles[todayKey] || {};
  
  // 만료된 타이틀 제거 및 유효한 타이틀만 반환
  const validTitles = [];
  const now = new Date();
  
  Object.entries(todayTitles).forEach(([userId, title]) => {
    const expiresAt = new Date(title.expiresAt);
    if (now <= expiresAt) {
      // 사용자 정보 가져오기
      const posts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');
      const userPost = posts.find(p => p.userId === userId);
      const user = userPost?.user || userId;
      
      validTitles.push({
        userId,
        user: typeof user === 'string' ? user : user?.username || user?.id || userId,
        title: title,
        earnedAt: title.earnedAt
      });
    }
  });
  
  // 획득 시간순 정렬
  validTitles.sort((a, b) => new Date(a.earnedAt) - new Date(b.earnedAt));
  
  return validTitles;
};

// 게시물에 타이틀 효과 적용
export const getTitleEffect = (effect) => {
  const effects = {
    lightning: {
      border: 'border-4 border-amber-400',
      shadow: 'shadow-lg shadow-amber-400/40',
      glow: 'ring-2 ring-amber-300/60',
      badge: '⚡️ NEW'
    },
    alert: {
      border: 'border-4 border-orange-500',
      shadow: 'shadow-lg shadow-orange-500/40',
      glow: 'ring-2 ring-orange-300/60',
      badge: '📢 HOT'
    },
    weather: {
      border: 'border-4 border-amber-500',
      shadow: 'shadow-lg shadow-amber-500/40',
      glow: 'ring-2 ring-amber-200/60',
      badge: '🌧️ LIVE'
    },
    danger: {
      border: 'border-4 border-orange-600',
      shadow: 'shadow-lg shadow-orange-600/40',
      glow: 'ring-2 ring-orange-200/60',
      badge: '🚨 ALERT'
    },
    star: {
      border: 'border-4 border-amber-300',
      shadow: 'shadow-lg shadow-amber-300/40',
      glow: 'ring-2 ring-amber-100/60',
      badge: '⭐ STAR'
    },
    guide: {
      border: 'border-4 border-primary',
      shadow: 'shadow-lg shadow-primary/40',
      glow: 'ring-2 ring-primary/40',
      badge: '🗺️ GUIDE'
    },
    expert: {
      border: 'border-4 border-orange-400',
      shadow: 'shadow-lg shadow-orange-400/40',
      glow: 'ring-2 ring-orange-100/60',
      badge: '🎯 PRO'
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

// 매일 자정 리셋 체크
export const checkDailyReset = () => {
  const lastResetDate = localStorage.getItem('lastTitleResetDate');
  const todayKey = getTodayKey();
  
  if (lastResetDate !== todayKey) {
    console.log('🔄 새로운 날! 타이틀 리셋');
    
    // 이전 날짜 데이터 정리 (최근 7일만 유지)
    const dailyTitles = JSON.parse(localStorage.getItem('dailyTitles') || '{}');
    const dates = Object.keys(dailyTitles);
    const today = new Date();
    
    dates.forEach(date => {
      const dateObj = new Date(date);
      const diffDays = Math.floor((today - dateObj) / (1000 * 60 * 60 * 24));
      
      if (diffDays > 7) {
        delete dailyTitles[date];
      }
    });
    
    localStorage.setItem('dailyTitles', JSON.stringify(dailyTitles));
    localStorage.setItem('lastTitleResetDate', todayKey);
  }
};

// 모든 사용자의 타이틀 갱신 (매일 자정 또는 수동 트리거)
export const updateAllDailyTitles = () => {
  checkDailyReset();
  
  const posts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');
  const userIds = [...new Set(posts.map(p => p.userId))];
  
  userIds.forEach(userId => {
    const titles = checkTitleConditions(userId);
    
    // 가장 높은 우선순위 타이틀 하나만 수여
    if (titles.length > 0) {
      awardDailyTitle(userId, titles[0]);
    }
  });
  
  console.log('✅ 모든 사용자 타이틀 갱신 완료');
};

// 포스팅 업로드 시 타이틀 체크
export const checkAndAwardTitles = (userId) => {
  const titles = checkTitleConditions(userId);
  
  if (titles.length > 0) {
    // 이미 수여된 타이틀을 제외하고 사용 가능한 타이틀 찾기
    const todayKey = getTodayKey();
    const dailyTitles = JSON.parse(localStorage.getItem('dailyTitles') || '{}');
    const todayTitles = dailyTitles[todayKey] || {};
    
    // 이미 수여된 타이틀 이름 목록
    const awardedTitleNames = Object.values(todayTitles)
      .map(titleData => titleData.name)
      .filter(Boolean);
    
    // 사용 가능한 타이틀 찾기 (아직 수여되지 않은 타이틀)
    const availableTitle = titles.find(title => !awardedTitleNames.includes(title.name));
    
    if (availableTitle) {
      const success = awardDailyTitle(userId, availableTitle);
      if (success) {
        return availableTitle;
      }
    }
  }
  
  return null;
};

// 타이틀 획득 히스토리 조회
export const getTitleHistory = (userId) => {
  const dailyTitles = JSON.parse(localStorage.getItem('dailyTitles') || '{}');
  const history = [];
  
  Object.entries(dailyTitles).forEach(([date, titles]) => {
    if (titles[userId]) {
      history.push({
        date,
        title: titles[userId],
        earnedAt: titles[userId].earnedAt
      });
    }
  });
  
  // 날짜순 정렬 (최신순)
  history.sort((a, b) => new Date(b.earnedAt) - new Date(a.earnedAt));
  
  return history;
};

// 타이틀 랭킹 조회 (가장 많이 획득한 타이틀)
export const getTitleRanking = () => {
  const dailyTitles = JSON.parse(localStorage.getItem('dailyTitles') || '{}');
  const titleCounts = {};
  
  Object.values(dailyTitles).forEach(titles => {
    Object.values(titles).forEach(titleData => {
      const titleName = titleData.name;
      titleCounts[titleName] = (titleCounts[titleName] || 0) + 1;
    });
  });
  
  // 획득 횟수순 정렬
  return Object.entries(titleCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
};

// 사용자별 타이틀 획득 통계
export const getUserTitleStats = (userId) => {
  const history = getTitleHistory(userId);
  const titleCounts = {};
  
  history.forEach(item => {
    const titleName = item.title.name;
    titleCounts[titleName] = (titleCounts[titleName] || 0) + 1;
  });
  
  return {
    totalTitles: history.length,
    uniqueTitles: Object.keys(titleCounts).length,
    mostEarnedTitle: Object.entries(titleCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || null,
    titleCounts
  };
};

