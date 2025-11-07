// 알림 관련 유틸리티 함수들

// 시간 경과 표시
export const getTimeAgo = (timestamp) => {
  const now = new Date();
  const past = new Date(timestamp);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return '방금 전';
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
  return `${Math.floor(diffDays / 30)}개월 전`;
};

// 읽지 않은 알림 개수 가져오기
export const getUnreadCount = () => {
  try {
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    return notifications.filter(n => !n.isRead).length;
  } catch (error) {
    console.error('알림 개수 조회 실패:', error);
    return 0;
  }
};

// 알림 목록 가져오기
export const getNotifications = () => {
  try {
    return JSON.parse(localStorage.getItem('notifications') || '[]');
  } catch (error) {
    console.error('알림 목록 조회 실패:', error);
    return [];
  }
};

// 알림 추가
export const addNotification = (notification) => {
  try {
    const notifications = getNotifications();
    const newNotification = {
      id: Date.now(),
      isRead: false,
      time: new Date().toISOString(),
      ...notification
    };
    notifications.unshift(newNotification);
    localStorage.setItem('notifications', JSON.stringify(notifications));
    
    // 알림 개수 변경 이벤트 발생
    window.dispatchEvent(new Event('notificationCountChanged'));
    
    return newNotification;
  } catch (error) {
    console.error('알림 추가 실패:', error);
    return null;
  }
};

// 알림 읽음 처리
export const markAsRead = (notificationId) => {
  try {
    const notifications = getNotifications();
    const updated = notifications.map(n => 
      n.id === notificationId ? { ...n, isRead: true } : n
    );
    localStorage.setItem('notifications', JSON.stringify(updated));
    
    // 알림 개수 변경 이벤트 발생
    window.dispatchEvent(new Event('notificationCountChanged'));
    
    console.log('✅ 알림 읽음 처리 완료:', notificationId);
  } catch (error) {
    console.error('알림 읽음 처리 실패:', error);
  }
};

// 모든 알림 읽음 처리
export const markAllAsRead = () => {
  try {
    const notifications = getNotifications();
    console.log('📢 모든 알림 읽음 처리 시작:', notifications.length + '개');
    
    const unreadCount = notifications.filter(n => !n.isRead).length;
    console.log('📩 읽지 않은 알림:', unreadCount + '개');
    
    // 모든 알림을 읽음 처리
    const updated = notifications.map(n => ({ ...n, isRead: true }));
    localStorage.setItem('notifications', JSON.stringify(updated));
    
    console.log('✅ 모든 알림 읽음 처리 완료!');
    
    // 알림 개수 변경 이벤트 발생
    window.dispatchEvent(new Event('notificationCountChanged'));
  } catch (error) {
    console.error('❌ 전체 읽음 처리 실패:', error);
  }
};

// 알림 삭제
export const deleteNotification = (notificationId) => {
  try {
    const notifications = getNotifications();
    const updated = notifications.filter(n => n.id !== notificationId);
    localStorage.setItem('notifications', JSON.stringify(updated));
    
    // 알림 개수 변경 이벤트 발생
    window.dispatchEvent(new Event('notificationCountChanged'));
  } catch (error) {
    console.error('알림 삭제 실패:', error);
  }
};

// 뱃지 알림 보내기 (난이도 & 포인트 포함)
export const notifyBadge = (badgeName, difficulty = '중', points = 100) => {
  const difficultyEmoji = difficulty === '상' ? '🔥' : difficulty === '중' ? '⭐' : '🌟';
  addNotification({
    type: 'badge',
    title: `🏆 새로운 뱃지 획득! ${difficultyEmoji}`,
    message: `"${badgeName}" 뱃지를 획득했습니다! (+${points}P)`,
    badge: badgeName,
    difficulty,
    points,
    icon: 'military_tech',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    link: '/badges'
  });
};

// 댓글 알림 보내기
export const notifyComment = (postId, userName) => {
  addNotification({
    type: 'comment',
    title: '💬 새 댓글',
    message: `${userName}님이 회원님의 게시물에 댓글을 남겼습니다.`,
    postId
  });
};

// 좋아요 알림 보내기
export const notifyLike = (postId, userName) => {
  addNotification({
    type: 'like',
    title: '❤️ 좋아요',
    message: `${userName}님이 회원님의 게시물을 좋아합니다.`,
    postId
  });
};

// 포인트 알림 보내기
export const notifyPoints = (points, reason) => {
  addNotification({
    type: 'points',
    title: '🪙 포인트 적립',
    message: `${reason}으로 ${points}P를 획득했습니다!`,
    points
  });
};



































