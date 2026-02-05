/**
 * 레벨 시스템 (웹)
 * 사용자 활동에 따라 레벨 상승 - localStorage 기반
 */

const LEVEL_EXP = {
  1: 0, 2: 100, 3: 250, 4: 500, 5: 1000, 6: 2000, 7: 3500, 8: 5500, 9: 8000, 10: 11000,
  11: 15000, 12: 20000, 13: 26000, 14: 33000, 15: 41000, 16: 50000, 17: 60000, 18: 71000, 19: 83000, 20: 96000,
  21: 110000, 22: 125000, 23: 141000, 24: 158000, 25: 176000, 26: 195000, 27: 215000, 28: 236000, 29: 258000, 30: 281000
};

const LEVEL_TITLES = {
  1: '여행 입문자',
  5: '여행 애호가',
  10: '여행 마니아',
  15: '여행 전문가',
  20: '여행 달인',
  25: '여행 고수',
  30: '여행 명인'
};

const EXP_REWARDS = {
  '사진 업로드': 50,
  '좋아요 받기': 5,
  '댓글 받기': 10,
  '지역 방문': 20
};

export const calculateLevel = (totalExp) => {
  let level = 1;
  for (let lv = 1; lv <= 30; lv++) {
    if (totalExp >= (LEVEL_EXP[lv] ?? 0)) level = lv;
    else break;
  }
  return level;
};

export const getLevelTitle = (level) => {
  let title = LEVEL_TITLES[1];
  for (let lv = 30; lv >= 1; lv--) {
    if (LEVEL_TITLES[lv] && level >= lv) {
      title = LEVEL_TITLES[lv];
      break;
    }
  }
  return title;
};

function calculateTotalExp() {
  try {
    const postsJson = localStorage.getItem('uploadedPosts');
    const posts = postsJson ? JSON.parse(postsJson) : [];
    const userJson = localStorage.getItem('user');
    const currentUser = userJson ? JSON.parse(userJson) : {};
    const currentUserId = currentUser?.id ? String(currentUser.id) : null;

    const userPosts = posts.filter((post) => {
      const postUserId = post.userId || (typeof post.user === 'object' ? post.user?.id : post.user);
      if (currentUserId && postUserId) return String(postUserId) === currentUserId;
      return (post.id && String(post.id).startsWith('local-')) || String(post.id).startsWith('uploaded-');
    });

    let totalExp = 0;
    totalExp += userPosts.length * (EXP_REWARDS['사진 업로드'] || 50);
    totalExp += userPosts.reduce((sum, p) => sum + (p.likes || 0), 0) * (EXP_REWARDS['좋아요 받기'] || 5);
    totalExp += userPosts.reduce((sum, p) => sum + (p.qnaList?.length || 0) + (p.comments?.length || 0), 0) * (EXP_REWARDS['댓글 받기'] || 10);
    const regions = [...new Set(userPosts.map((p) => (p.location || '').split(' ')[0]).filter(Boolean))];
    totalExp += regions.length * (EXP_REWARDS['지역 방문'] || 20);
    return totalExp;
  } catch (e) {
    return 0;
  }
}

/**
 * 사용자 레벨 정보 조회 (동기)
 * @returns {{ level: number, title: string }}
 */
export function getUserLevel() {
  const totalExp = calculateTotalExp();
  const level = calculateLevel(totalExp);
  const title = getLevelTitle(level);
  return { level, title };
}
