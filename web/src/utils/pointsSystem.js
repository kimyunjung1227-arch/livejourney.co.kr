// 포인트 시스템 유틸리티

// 오늘의 포인트 통계 가져오기
export const getTodayStats = () => {
  const user = JSON.parse(localStorage.getItem('currentUser') || localStorage.getItem('user') || 'null');
  
  if (!user) {
    return {
      earned: 0,
      spent: 0,
      remaining: 0
    };
  }

  const today = new Date().toDateString();
  const pointHistory = JSON.parse(localStorage.getItem('pointHistory') || '[]');
  
  // 오늘 획득한 포인트
  const todayEarned = pointHistory
    .filter(h => new Date(h.date).toDateString() === today && h.type === 'earn')
    .reduce((sum, h) => sum + h.points, 0);
  
  // 오늘 사용한 포인트
  const todaySpent = pointHistory
    .filter(h => new Date(h.date).toDateString() === today && h.type === 'spend')
    .reduce((sum, h) => sum + h.points, 0);
  
  return {
    earned: todayEarned,
    spent: todaySpent,
    remaining: user.points || 0
  };
};

// 포인트 추가
export const addPoints = (points, reason = '기타') => {
  const user = JSON.parse(localStorage.getItem('currentUser') || localStorage.getItem('user') || 'null');
  
  if (!user) return false;
  
  user.points = (user.points || 0) + points;
  localStorage.setItem('currentUser', JSON.stringify(user));
  localStorage.setItem('user', JSON.stringify(user));
  
  // 포인트 히스토리 추가
  const history = JSON.parse(localStorage.getItem('pointHistory') || '[]');
  history.unshift({
    id: Date.now(),
    type: 'earn',
    points,
    reason,
    date: new Date().toISOString(),
    balance: user.points
  });
  localStorage.setItem('pointHistory', JSON.stringify(history.slice(0, 100))); // 최근 100개만 유지
  
  // 사용자 정보 업데이트 이벤트
  window.dispatchEvent(new Event('userUpdated'));
  
  return true;
};

// 포인트 차감
export const deductPoints = (points, reason = '사용') => {
  const user = JSON.parse(localStorage.getItem('currentUser') || localStorage.getItem('user') || 'null');
  
  if (!user || (user.points || 0) < points) return false;
  
  user.points = (user.points || 0) - points;
  localStorage.setItem('currentUser', JSON.stringify(user));
  localStorage.setItem('user', JSON.stringify(user));
  
  // 포인트 히스토리 추가
  const history = JSON.parse(localStorage.getItem('pointHistory') || '[]');
  history.unshift({
    id: Date.now(),
    type: 'spend',
    points,
    reason,
    date: new Date().toISOString(),
    balance: user.points
  });
  localStorage.setItem('pointHistory', JSON.stringify(history.slice(0, 100)));
  
  // 사용자 정보 업데이트 이벤트
  window.dispatchEvent(new Event('userUpdated'));
  
  return true;
};

// 포인트 히스토리 가져오기
export const getPointHistory = (limit = 20) => {
  const history = JSON.parse(localStorage.getItem('pointHistory') || '[]');
  return history.slice(0, limit);
};

// 포인트 획득 시도 (중복 방지 + 쿨다운)
export const tryEarnPoints = (action, uniqueId) => {
  const pointsConfig = {
    '게시물 작성': { points: 10, cooldown: 0 }, // 쿨다운 없음
    '좋아요': { points: 1, cooldown: 60 * 1000 }, // 1분
    '댓글 작성': { points: 3, cooldown: 30 * 1000 }, // 30초
    '질문 작성': { points: 5, cooldown: 60 * 1000 }, // 1분
    '답변 작성': { points: 5, cooldown: 60 * 1000 } // 1분
  };

  const config = pointsConfig[action];
  if (!config) {
    return { success: false, reason: 'invalid_action', message: '알 수 없는 액션입니다.' };
  }

  // 중복 체크 (uniqueId 기반)
  const earnedActions = JSON.parse(localStorage.getItem('earnedActions') || '{}');
  const actionKey = `${action}_${uniqueId}`;
  
  if (earnedActions[actionKey]) {
    const lastEarned = new Date(earnedActions[actionKey]);
    const now = new Date();
    const timePassed = now - lastEarned;
    
    if (timePassed < config.cooldown) {
      const remainingSeconds = Math.ceil((config.cooldown - timePassed) / 1000);
      return {
        success: false,
        reason: 'cooldown',
        message: `${remainingSeconds}초 후에 다시 시도할 수 있습니다.`,
        remainingSeconds
      };
    }
  }

  // 포인트 지급
  const success = addPoints(config.points, action);
  
  if (success) {
    // 액션 기록
    earnedActions[actionKey] = new Date().toISOString();
    localStorage.setItem('earnedActions', JSON.stringify(earnedActions));
    
    return {
      success: true,
      points: config.points,
      action
    };
  }

  return { success: false, reason: 'error', message: '포인트 지급 실패' };
};

