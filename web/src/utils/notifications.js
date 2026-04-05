// 알림 관리 유틸리티
import { logger } from './logger';

const NOTIFICATIONS_KEY = 'notifications';

// 알림 타입별 기본 설정
const NOTIFICATION_TYPES = {
  badge: {
    icon: 'military_tech',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary'
  },
  interest: {
    icon: 'place',
    iconBg: 'bg-teal-100 dark:bg-teal-900/20',
    iconColor: 'text-teal-600'
  },
  like: {
    icon: 'favorite',
    iconBg: 'bg-red-100 dark:bg-red-900/20',
    iconColor: 'text-red-500'
  },
  comment: {
    icon: 'comment',
    iconBg: 'bg-blue-100 dark:bg-blue-900/20',
    iconColor: 'text-blue-500'
  },
  follow: {
    icon: 'person_add',
    iconBg: 'bg-green-100 dark:bg-green-900/20',
    iconColor: 'text-green-500'
  },
  post: {
    icon: 'photo_camera',
    iconBg: 'bg-purple-100 dark:bg-purple-900/20',
    iconColor: 'text-primary'
  },
  system: {
    icon: 'notifications',
    iconBg: 'bg-gray-100 dark:bg-gray-900/20',
    iconColor: 'text-gray-500'
  }
};

// 알림 목록 가져오기 (저장소 전체)
export const getNotifications = () => {
  try {
    const notifications = localStorage.getItem(NOTIFICATIONS_KEY);
    return notifications ? JSON.parse(notifications) : [];
  } catch (error) {
    logger.error('알림 불러오기 실패:', error);
    return [];
  }
};

const getCurrentUserIdFromStorage = () => {
  try {
    const u = localStorage.getItem('user');
    if (!u) return null;
    const o = JSON.parse(u);
    return o?.id ? String(o.id) : null;
  } catch {
    return null;
  }
};

/**
 * 현재 로그인 사용자에게 보여야 할 알림만 (recipientUserId가 있으면 해당 유저만)
 */
export const getNotificationsForCurrentUser = () => {
  const uid = getCurrentUserIdFromStorage();
  const all = getNotifications();
  if (!uid) return all.filter((n) => !n.recipientUserId);
  return all.filter((n) => !n.recipientUserId || String(n.recipientUserId) === uid);
};

// 알림 추가
export const addNotification = (notification) => {
  try {
    const notifications = getNotifications();
    const newNotification = {
      id: Date.now().toString(),
      read: false,
      time: getTimeAgo(new Date()),
      timestamp: new Date().toISOString(),
      ...notification
    };

    // 타입별 기본 설정 적용
    const typeConfig = NOTIFICATION_TYPES[notification.type] || NOTIFICATION_TYPES.system;
    newNotification.icon = newNotification.icon || typeConfig.icon;
    newNotification.iconBg = newNotification.iconBg || typeConfig.iconBg;
    newNotification.iconColor = newNotification.iconColor || typeConfig.iconColor;

    notifications.unshift(newNotification);

    // 최대 100개까지만 저장
    const limitedNotifications = notifications.slice(0, 100);
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(limitedNotifications));

    // 알림 업데이트 이벤트 발생
    window.dispatchEvent(new Event('notificationUpdate'));
    window.dispatchEvent(new Event('notificationCountChanged'));

    logger.log('✅ 알림 추가:', newNotification.title);
    return newNotification;
  } catch (error) {
    logger.error('알림 추가 실패:', error);
    return null;
  }
};

// 알림 읽음 처리
export const markNotificationAsRead = (notificationId) => {
  try {
    const notifications = getNotifications();
    const updated = notifications.map(n =>
      n.id === notificationId ? { ...n, read: true } : n
    );
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));

    // 알림 카운트 업데이트 이벤트 발생
    window.dispatchEvent(new Event('notificationCountChanged'));

    return true;
  } catch (error) {
    logger.error('알림 읽음 처리 실패:', error);
    return false;
  }
};

// 모든 알림 읽음 처리 (현재 사용자에게 보이는 항목만 읽음 처리)
export const markAllNotificationsAsRead = () => {
  try {
    const all = getNotifications();
    const visibleIds = new Set(getNotificationsForCurrentUser().map((n) => n.id));
    const updated = all.map((n) => (visibleIds.has(n.id) ? { ...n, read: true } : n));
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));

    window.dispatchEvent(new Event('notificationUpdate'));
    window.dispatchEvent(new Event('notificationCountChanged'));

    logger.log('✅ 모든 알림 읽음 처리');
    return true;
  } catch (error) {
    logger.error('모든 알림 읽음 처리 실패:', error);
    return false;
  }
};

// 알림 삭제
export const deleteNotification = (notificationId) => {
  try {
    const notifications = getNotifications();
    const filtered = notifications.filter(n => n.id !== notificationId);
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(filtered));

    // 알림 카운트 업데이트 이벤트 발생
    window.dispatchEvent(new Event('notificationCountChanged'));

    return true;
  } catch (error) {
    logger.error('알림 삭제 실패:', error);
    return false;
  }
};

// 읽지 않은 알림 개수 (현재 사용자 기준)
export const getUnreadCount = () => {
  try {
    return getNotificationsForCurrentUser().filter((n) => !n.read).length;
  } catch (error) {
    logger.error('읽지 않은 알림 개수 조회 실패:', error);
    return 0;
  }
};

// 모든 알림 삭제
export const clearAllNotifications = () => {
  try {
    localStorage.removeItem(NOTIFICATIONS_KEY);

    // 알림 업데이트 이벤트 발생
    window.dispatchEvent(new Event('notificationUpdate'));
    window.dispatchEvent(new Event('notificationCountChanged'));

    logger.log('✅ 모든 알림 삭제');
    return true;
  } catch (error) {
    logger.error('모든 알림 삭제 실패:', error);
    return false;
  }
};

// 시간 표시 유틸리티
const getTimeAgo = (date) => {
  const now = new Date();
  const diff = now - new Date(date);
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return '방금';
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 7) return `${days}일 전`;
  if (days < 30) return `${Math.floor(days / 7)}주 전`;
  if (days < 365) return `${Math.floor(days / 30)}개월 전`;
  return `${Math.floor(days / 365)}년 전`;
};

// 뱃지 획득 알림
export const notifyBadge = (badgeName, difficulty = '중') => {
  const difficultyEmoji = difficulty === '상' ? '🔥' : difficulty === '중' ? '⭐' : '🌟';

  addNotification({
    type: 'badge',
    title: `🏆 새로운 뱃지 획득! ${difficultyEmoji}`,
    message: `"${badgeName}" 뱃지를 획득했습니다!`,
    badge: badgeName,
    difficulty,
    icon: 'military_tech',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    link: '/badges'
  });
};

// 좋아요 알림
export const notifyLike = (username, postLocation) => {
  addNotification({
    type: 'like',
    title: '❤️ 새로운 좋아요',
    message: `${username}님이 "${postLocation}" 게시물을 좋아합니다.`,
    link: '/profile'
  });
};

// 댓글 알림
export const notifyComment = (username, postLocation, comment) => {
  addNotification({
    type: 'comment',
    title: '💬 새로운 댓글',
    message: `${username}님이 "${postLocation}" 게시물에 댓글을 남겼습니다: "${comment}"`,
    link: '/profile'
  });
};

/** 피팔로우 유저에게: 누군가 나를 팔로우함 */
export const notifyFollowReceived = (followerUsername, recipientUserId) => {
  if (!recipientUserId) return null;
  return addNotification({
    type: 'follow',
    title: '👥 새로운 팔로워',
    message: `${followerUsername}님이 회원님을 팔로우하기 시작했습니다.`,
    recipientUserId: String(recipientUserId),
    link: '/profile',
  });
};

/** 팔로우한 사람에게: 내가 누군가를 팔로우함 */
export const notifyFollowingStarted = (targetUsername, recipientUserId) => {
  if (!recipientUserId) return null;
  return addNotification({
    type: 'follow',
    title: '👥 팔로우했어요',
    message: `${targetUsername}님을 팔로우하기 시작했습니다.`,
    recipientUserId: String(recipientUserId),
    link: '/profile',
  });
};

/** @deprecated recipientUserId 없음 — 가능하면 notifyFollowReceived / notifyFollowingStarted 사용 */
export const notifyFollow = (username) => {
  addNotification({
    type: 'follow',
    title: '👥 새로운 팔로워',
    message: `${username}님이 회원님을 팔로우하기 시작했습니다.`,
    link: '/profile',
  });
};

// 시스템 알림
export const notifySystem = (title, message, link = null) => {
  addNotification({
    type: 'system',
    title,
    message,
    link
  });
};


export default {
  getNotifications,
  getNotificationsForCurrentUser,
  addNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadCount,
  clearAllNotifications,
  notifyBadge,
  notifyLike,
  notifyComment,
  notifyFollow,
  notifyFollowReceived,
  notifyFollowingStarted,
  notifySystem,
};
