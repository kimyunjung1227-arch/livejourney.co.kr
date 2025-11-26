// 브라우저 푸시 알림 유틸리티

// 알림 권한 요청
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.warn('이 브라우저는 알림을 지원하지 않습니다.');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

// 알림 권한 상태 확인
export const getNotificationPermission = () => {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
};

// 브라우저 푸시 알림 발송
export const sendBrowserNotification = (title, options = {}) => {
  if (!('Notification' in window)) {
    console.warn('이 브라우저는 알림을 지원하지 않습니다.');
    return null;
  }

  if (Notification.permission !== 'granted') {
    console.warn('알림 권한이 없습니다.');
    return null;
  }

  const defaultOptions = {
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: 'livejourney-notification',
    requireInteraction: false,
    ...options
  };

  try {
    const notification = new Notification(title, defaultOptions);
    
    // 알림 클릭 시 앱으로 포커스
    notification.onclick = () => {
      window.focus();
      notification.close();
      
      // 링크가 있으면 이동
      if (options.link) {
        window.location.href = options.link;
      }
    };

    // 알림 자동 닫기 (5초 후)
    setTimeout(() => {
      notification.close();
    }, 5000);

    return notification;
  } catch (error) {
    console.error('알림 발송 실패:', error);
    return null;
  }
};

// 좋아요 수 증가 알림 (특정 기준 달성 시)
export const notifyLikeMilestone = async (postId, newLikeCount, postLocation) => {
  // 알림 권한 확인
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) {
    return;
  }

  // 알림 기준점 (10, 50, 100, 500, 1000명 등)
  const milestones = [10, 50, 100, 500, 1000, 5000];
  const milestone = milestones.find(m => newLikeCount === m);

  if (milestone) {
    sendBrowserNotification(
      `🎉 ${milestone}명 달성!`,
      {
        body: `"${postLocation}" 사진이 ${milestone}명에게 도움이 되었습니다!`,
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        tag: `like-milestone-${postId}-${milestone}`,
        link: `/post/${postId}`
      }
    );
  }
};

// 총 좋아요 수 증가 알림 (내 모든 사진의 총 좋아요 수 기준)
export const notifyTotalLikesMilestone = async (totalLikes, previousTotal) => {
  // 알림 권한 확인
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) {
    return;
  }

  // 총 좋아요 수 기준점
  const milestones = [10, 50, 100, 500, 1000, 5000, 10000];
  const milestone = milestones.find(m => previousTotal < m && totalLikes >= m);

  if (milestone) {
    sendBrowserNotification(
      `🌟 대단해요! ${milestone.toLocaleString()}명 달성!`,
      {
        body: `현재 내 사진이 ${milestone.toLocaleString()}명에게 도움이 되었습니다!`,
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        tag: `total-likes-milestone-${milestone}`,
        link: '/profile'
      }
    );
  }
};

// 좋아요 받았을 때 알림 (내 게시물에 좋아요가 추가될 때)
export const notifyNewLike = async (postId, postLocation, likeCount) => {
  // 알림 권한 확인
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) {
    return;
  }

  // 앱이 포커스되어 있으면 알림 발송 안 함
  if (document.hasFocus()) {
    return;
  }

  sendBrowserNotification(
    '💚 내 게시물이 도움되었습니다!',
    {
      body: `"${postLocation}" 사진이 ${likeCount}명에게 도움이 되었습니다!`,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      tag: `new-like-${postId}`,
      link: `/post/${postId}`
    }
  );
};

// 내 게시물이 도움되었습니다 알림 (앱 내부 + 브라우저 푸시)
export const notifyPostHelped = async (postId, postLocation, likeCount) => {
  // 앱 내부 알림 추가
  try {
    const { addNotification } = await import('./notifications');
    addNotification({
      type: 'like',
      title: '💚 내 게시물이 도움되었습니다!',
      message: `"${postLocation}" 사진이 ${likeCount}명에게 도움이 되었습니다!`,
      link: `/post/${postId}`
    });
  } catch (error) {
    console.error('앱 내부 알림 추가 실패:', error);
  }

  // 브라우저 푸시 알림 (앱이 포커스되어 있지 않을 때만)
  if (!document.hasFocus()) {
    const hasPermission = await requestNotificationPermission();
    if (hasPermission) {
      sendBrowserNotification(
        '💚 내 게시물이 도움되었습니다!',
        {
          body: `"${postLocation}" 사진이 ${likeCount}명에게 도움이 되었습니다!`,
          icon: '/favicon.svg',
          badge: '/favicon.svg',
          tag: `post-helped-${postId}`,
          link: `/post/${postId}`
        }
      );
    }
  }
};

export default {
  requestNotificationPermission,
  getNotificationPermission,
  sendBrowserNotification,
  notifyLikeMilestone,
  notifyTotalLikesMilestone,
  notifyNewLike,
  notifyPostHelped
};



