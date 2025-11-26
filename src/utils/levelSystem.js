/**
 * 레벨 시스템
 * 사용자 활동에 따라 레벨 상승
 */

// 레벨별 필요 경험치
export const LEVEL_EXP = {
  1: 0,
  2: 100,
  3: 250,
  4: 500,
  5: 1000,
  6: 2000,
  7: 3500,
  8: 5500,
  9: 8000,
  10: 11000,
  11: 15000,
  12: 20000,
  13: 26000,
  14: 33000,
  15: 41000,
  16: 50000,
  17: 60000,
  18: 71000,
  19: 83000,
  20: 96000,
  21: 110000,
  22: 125000,
  23: 141000,
  24: 158000,
  25: 176000,
  26: 195000,
  27: 215000,
  28: 236000,
  29: 258000,
  30: 281000,
  31: 305000,
  32: 330000,
  33: 356000,
  34: 383000,
  35: 411000,
  36: 440000,
  37: 470000,
  38: 501000,
  39: 533000,
  40: 566000,
  41: 600000,
  42: 635000,
  43: 671000,
  44: 708000,
  45: 746000,
  46: 785000,
  47: 825000,
  48: 866000,
  49: 908000,
  50: 951000,
  51: 995000,
  52: 1040000,
  53: 1086000,
  54: 1133000,
  55: 1181000,
  56: 1230000,
  57: 1280000,
  58: 1331000,
  59: 1383000,
  60: 1436000,
  61: 1490000,
  62: 1545000,
  63: 1601000,
  64: 1658000,
  65: 1716000,
  66: 1775000,
  67: 1835000,
  68: 1896000,
  69: 1958000,
  70: 2021000,
  71: 2085000,
  72: 2150000,
  73: 2216000,
  74: 2283000,
  75: 2351000,
  76: 2420000,
  77: 2490000,
  78: 2561000,
  79: 2633000,
  80: 2706000,
  81: 2780000,
  82: 2855000,
  83: 2931000,
  84: 3008000,
  85: 3086000,
  86: 3165000,
  87: 3245000,
  88: 3326000,
  89: 3408000,
  90: 3491000,
  91: 3575000,
  92: 3660000,
  93: 3746000,
  94: 3833000,
  95: 3921000,
  96: 4010000,
  97: 4100000,
  98: 4191000,
  99: 4283000,
  100: 4376000
};

// 레벨별 타이틀
export const LEVEL_TITLES = {
  1: '여행 입문자',
  5: '여행 애호가',
  10: '여행 마니아',
  15: '여행 전문가',
  20: '여행 달인',
  25: '여행 고수',
  30: '여행 명인',
  35: '여행 대가',
  40: '여행 장인',
  45: '여행 거장',
  50: '여행 마스터',
  60: '여행 그랜드마스터',
  70: '여행 레전드',
  80: '여행 신',
  90: '여행 초월자',
  100: '여행 불멸자'
};

// 경험치 획득 액션
export const EXP_REWARDS = {
  '사진 업로드': 50,
  '좋아요 받기': 5,
  '댓글 받기': 10,
  '댓글 작성': 3,
  '지역 방문': 20,
  '뱃지 획득 (하)': 100,
  '뱃지 획득 (중)': 300,
  '뱃지 획득 (상)': 500,
  '24시간 타이틀': 200,
  '프로필 완성': 30,
  '연속 로그인': 15
};

// 현재 레벨 계산
export const calculateLevel = (totalExp) => {
  let level = 1;
  
  for (let lv = 1; lv <= 100; lv++) {
    if (totalExp >= LEVEL_EXP[lv]) {
      level = lv;
    } else {
      break;
    }
  }
  
  return level;
};

// 현재 레벨 타이틀
export const getLevelTitle = (level) => {
  // 가장 가까운 레벨 타이틀 찾기
  let title = LEVEL_TITLES[1];
  
  for (let lv = 100; lv >= 1; lv--) {
    if (LEVEL_TITLES[lv] && level >= lv) {
      title = LEVEL_TITLES[lv];
      break;
    }
  }
  
  return title;
};

// 다음 레벨까지 필요한 경험치
export const getExpToNextLevel = (currentLevel) => {
  if (currentLevel >= 100) return 0;
  return LEVEL_EXP[currentLevel + 1] || 0;
};

// 현재 레벨 진행률 (%)
export const getLevelProgress = (totalExp, currentLevel) => {
  if (currentLevel >= 100) return 100;
  
  const currentLevelExp = LEVEL_EXP[currentLevel];
  const nextLevelExp = LEVEL_EXP[currentLevel + 1];
  
  if (!nextLevelExp) return 100;
  
  const expInCurrentLevel = totalExp - currentLevelExp;
  const expNeededForLevel = nextLevelExp - currentLevelExp;
  
  return Math.min(100, Math.round((expInCurrentLevel / expNeededForLevel) * 100));
};

// 사용자 통계에서 총 경험치 계산
export const calculateTotalExp = () => {
  const posts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');
  const earnedBadges = JSON.parse(localStorage.getItem('earnedBadges') || '[]');
  
  // 현재 사용자 정보 가져오기
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserId = currentUser?.id;
  
  // 목업 데이터 필터링 (실제 사용자가 업로드한 게시물만)
  const userPosts = posts.filter(post => {
    // 목업 데이터 제외 (id가 mock-로 시작하거나 userId가 mock_user_로 시작하는 경우)
    if (post.id && post.id.toString().startsWith('mock-')) {
      return false;
    }
    if (post.userId && post.userId.toString().startsWith('mock_user_')) {
      return false;
    }
    
    // 현재 사용자의 게시물만 포함
    if (currentUserId) {
      const postUserId = post.userId || 
                        (typeof post.user === 'string' ? post.user : post.user?.id) ||
                        post.user;
      return postUserId === currentUserId;
    }
    
    // 사용자 정보가 없으면 local-로 시작하는 게시물만 포함 (실제 업로드)
    return post.id && post.id.toString().startsWith('local-');
  });
  
  let totalExp = 0;
  
  // 사진 업로드 경험치 (실제 사용자 게시물만)
  totalExp += userPosts.length * EXP_REWARDS['사진 업로드'];
  
  // 좋아요 받기 경험치 (실제 사용자 게시물만)
  const totalLikes = userPosts.reduce((sum, post) => sum + (post.likes || 0), 0);
  totalExp += totalLikes * EXP_REWARDS['좋아요 받기'];
  
  // 댓글 받기 경험치 (실제 사용자 게시물만)
  const totalComments = userPosts.reduce((sum, post) => sum + (post.qnaList?.length || 0), 0);
  totalExp += totalComments * EXP_REWARDS['댓글 받기'];
  
  // 뱃지 경험치
  earnedBadges.forEach(badge => {
    const expReward = EXP_REWARDS[`뱃지 획득 (${badge.difficulty})`] || 100;
    totalExp += expReward;
  });
  
  // 방문한 지역 경험치 (실제 사용자 게시물만)
  const visitedRegions = [...new Set(userPosts.map(p => p.location?.split(' ')[0]).filter(Boolean))];
  totalExp += visitedRegions.length * EXP_REWARDS['지역 방문'];
  
  return totalExp;
};

// 사용자 레벨 정보 조회
export const getUserLevel = () => {
  const totalExp = calculateTotalExp();
  const level = calculateLevel(totalExp);
  const title = getLevelTitle(level);
  const nextLevelExp = getExpToNextLevel(level);
  const progress = getLevelProgress(totalExp, level);
  const currentLevelExp = LEVEL_EXP[level];
  const expInCurrentLevel = totalExp - currentLevelExp;
  const expNeededForNextLevel = nextLevelExp - currentLevelExp;
  
  return {
    level,
    title,
    totalExp,
    currentLevelExp,
    nextLevelExp,
    expInCurrentLevel,
    expNeededForNextLevel,
    progress
  };
};

// 경험치 획득
export const gainExp = (action) => {
  const expGained = EXP_REWARDS[action] || 0;
  
  if (expGained === 0) {
    console.log(`⚠️ 알 수 없는 액션: ${action}`);
    return false;
  }
  
  const beforeLevel = getUserLevel();
  
  // localStorage에 기록 (옵션)
  const expHistory = JSON.parse(localStorage.getItem('expHistory') || '[]');
  expHistory.unshift({
    action,
    exp: expGained,
    timestamp: new Date().toISOString()
  });
  localStorage.setItem('expHistory', JSON.stringify(expHistory.slice(0, 100))); // 최근 100개만
  
  const afterLevel = getUserLevel();
  
  console.log(`✨ 경험치 획득: ${action} (+${expGained} EXP)`);
  console.log(`   레벨: ${beforeLevel.level} → ${afterLevel.level}`);
  console.log(`   경험치: ${beforeLevel.totalExp} → ${afterLevel.totalExp}`);
  
  // 레벨업 확인
  if (afterLevel.level > beforeLevel.level) {
    console.log(`🎉 레벨업! Lv.${afterLevel.level} ${afterLevel.title}`);
    
    // 레벨업 이벤트 발생
    window.dispatchEvent(new CustomEvent('levelUp', { 
      detail: { 
        newLevel: afterLevel.level, 
        title: afterLevel.title 
      } 
    }));
    
    return { levelUp: true, newLevel: afterLevel.level };
  }
  
  return { levelUp: false };
};

