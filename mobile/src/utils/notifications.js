import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from './logger';
import { getTimeAgo } from './timeUtils';

const NOTIFICATIONS_KEY = 'notifications';

const NOTIFICATION_TYPES = {
    badge: { icon: 'military-tech', iconBg: '#f0f9ff', iconColor: '#00BCD4' },
    like: { icon: 'favorite', iconBg: '#fee2e2', iconColor: '#ef4444' },
    comment: { icon: 'comment', iconBg: '#dbeafe', iconColor: '#3b82f6' },
    follow: { icon: 'person_add', iconBg: '#dcfce7', iconColor: '#22c55e' },
    post: { icon: 'photo_camera', iconBg: '#f3e8ff', iconColor: '#00BCD4' },
    system: { icon: 'notifications', iconBg: '#f1f5f9', iconColor: '#64748b' }
};

export const getNotifications = async () => {
    try {
        const notifications = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
        return notifications ? JSON.parse(notifications) : [];
    } catch (error) {
        logger.error('알림 불러오기 실패:', error);
        return [];
    }
};

export const addNotification = async (notification) => {
    try {
        const notifications = await getNotifications();
        const now = new Date();
        const newNotification = {
            id: Date.now().toString(),
            read: false,
            ...notification,
            timestamp: notification.timestamp || now.toISOString(),
            time: notification.time || getTimeAgo(now),
        };

        const typeConfig = NOTIFICATION_TYPES[notification.type] || NOTIFICATION_TYPES.system;
        newNotification.icon = newNotification.icon || typeConfig.icon;

        notifications.unshift(newNotification);
        const limitedNotifications = notifications.slice(0, 100);
        await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(limitedNotifications));

        logger.log('✅ 알림 추가:', newNotification.title);
        return newNotification;
    } catch (error) {
        logger.error('알림 추가 실패:', error);
        return null;
    }
};

export const markNotificationAsRead = async (notificationId) => {
    try {
        const notifications = await getNotifications();
        const updated = notifications.map(n =>
            n.id === notificationId ? { ...n, read: true } : n
        );
        await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
        return true;
    } catch (error) {
        logger.error('알림 읽음 처리 실패:', error);
        return false;
    }
};

export const markAllNotificationsAsRead = async () => {
    try {
        const notifications = await getNotifications();
        const updated = notifications.map(n => ({ ...n, read: true }));
        await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
        return true;
    } catch (error) {
        logger.error('모든 알림 읽음 처리 실패:', error);
        return false;
    }
};

export const clearAllNotifications = async () => {
    try {
        await AsyncStorage.removeItem(NOTIFICATIONS_KEY);
        return true;
    } catch (error) {
        logger.error('모든 알림 삭제 실패:', error);
        return false;
    }
};

export const deleteNotification = async (notificationId) => {
    try {
        const notifications = await getNotifications();
        const updated = notifications.filter((n) => n.id !== notificationId);
        await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
        return true;
    } catch (error) {
        logger.error('알림 삭제 실패:', error);
        return false;
    }
};

export const getUnreadCountSync = (notifications) => {
    return notifications.filter(n => !n.read).length;
};

export const notifyBadge = (badgeName, difficulty = '중') => {
    const difficultyEmoji = difficulty === '상' ? '🔥' : difficulty === '중' ? '⭐' : '🌟';
    addNotification({
        type: 'badge',
        title: `🏆 새로운 뱃지 획득! ${difficultyEmoji}`,
        message: `"${badgeName}" 뱃지를 획득했습니다!`,
        badge: badgeName,
        difficulty,
        link: 'BadgeList'
    });
};

export default {
    getNotifications,
    addNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearAllNotifications,
    deleteNotification,
    getUnreadCountSync,
    notifyBadge
};
