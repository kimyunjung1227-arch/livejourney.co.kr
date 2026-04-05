import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import BottomNavigation from '../components/BottomNavigation';
import {
  getNotificationsForCurrentUser,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  deleteNotification,
} from '../utils/notifications';
import { follow, unfollow, isFollowing } from '../utils/followSystem';
import { getDisplayImageUrl } from '../api/upload';

const typeMeta = {
  badge: { icon: 'military_tech', bg: 'bg-primary-soft dark:bg-primary/15' },
  like: { icon: 'favorite', bg: 'bg-primary-soft dark:bg-primary/15' },
  comment: { icon: 'chat_bubble', bg: 'bg-primary-soft dark:bg-primary/15' },
  follow: { icon: 'person', bg: 'bg-primary-soft dark:bg-primary/15' },
  post: { icon: 'photo_camera', bg: 'bg-primary-soft dark:bg-primary/15' },
  interest: { icon: 'place', bg: 'bg-primary-soft dark:bg-primary/15' },
  system: { icon: 'notifications', bg: 'bg-primary-soft dark:bg-primary/15' },
};

function notificationTimeMs(n) {
  if (n.timestamp) {
    const t = new Date(n.timestamp).getTime();
    if (!Number.isNaN(t)) return t;
  }
  return Date.now();
}

function bucketLabel(daysAgo) {
  if (daysAgo <= 7) return '최근 7일';
  if (daysAgo <= 30) return '최근 30일';
  return '이전';
}

const NotificationsScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filter, setFilter] = useState('all');
  const [showMarkAllReadModal, setShowMarkAllReadModal] = useState(false);
  const [allNotifications, setAllNotifications] = useState([]);
  const [, setTick] = useState(0);

  useEffect(() => {
    loadNotifications();
    const handleNotificationUpdate = () => loadNotifications();
    window.addEventListener('notificationUpdate', handleNotificationUpdate);
    return () => window.removeEventListener('notificationUpdate', handleNotificationUpdate);
  }, [user?.id]);

  const loadNotifications = () => {
    setAllNotifications(getNotificationsForCurrentUser());
  };

  const filteredNotifications = useMemo(() => {
    const list =
      filter === 'interest'
        ? allNotifications.filter((n) => n.type === 'interest')
        : allNotifications;
    return [...list].sort((a, b) => notificationTimeMs(b) - notificationTimeMs(a));
  }, [allNotifications, filter]);

  const grouped = useMemo(() => {
    const now = Date.now();
    const groups = { '최근 7일': [], '최근 30일': [], 이전: [] };
    filteredNotifications.forEach((n) => {
      const ms = notificationTimeMs(n);
      const days = (now - ms) / 86400000;
      const key = bucketLabel(days);
      if (groups[key]) groups[key].push(n);
      else groups.이전.push(n);
    });
    return groups;
  }, [filteredNotifications]);

  const handleOpen = (notification) => {
    if (!notification.read) {
      markNotificationAsRead(notification.id);
      loadNotifications();
    }
    if (notification.data?.type === 'sos_request' && notification.data.sosRequest) {
      const sosRequest = notification.data.sosRequest;
      navigate('/upload', {
        state: {
          fromMission: true,
          missionId: notification.data?.missionId || `mission-${sosRequest.id || Date.now()}`,
          missionQuestion: sosRequest.question,
          missionLocationName: sosRequest.coordinates ? '요청 위치' : '근처 지역',
          missionCoordinates: sosRequest.coordinates,
        },
      });
      return;
    }
    if (notification.link) navigate(notification.link);
  };

  const handleMarkAllRead = () => {
    markAllNotificationsAsRead();
    loadNotifications();
    setShowMarkAllReadModal(false);
    window.dispatchEvent(new Event('notificationCountChanged'));
  };

  const handleDelete = (notificationId, e) => {
    e.stopPropagation();
    deleteNotification(notificationId);
    loadNotifications();
    window.dispatchEvent(new Event('notificationCountChanged'));
  };

  const avatarFor = (n) => {
    if (n.actorAvatar) return getDisplayImageUrl(n.actorAvatar);
    return null;
  };

  const leftIcon = (n) => {
    const t = typeMeta[n.type] || typeMeta.system;
    const url = avatarFor(n);
    if (url && (n.type === 'follow' || n.type === 'like')) {
      return (
        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-primary-soft ring-2 ring-primary/25 dark:bg-primary/20 dark:ring-primary/35">
          <img src={url} alt="" className="h-full w-full object-cover" />
        </div>
      );
    }
    return (
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${t.bg}`}
      >
        <span className="material-symbols-outlined text-[22px] text-primary dark:text-primary">
          {n.icon || t.icon}
        </span>
      </div>
    );
  };

  const renderRight = (n) => {
    if (n.type === 'like' && n.thumbnailUrl) {
      return (
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-primary-soft ring-2 ring-primary/20 dark:bg-primary/15 dark:ring-primary/30">
          <img src={getDisplayImageUrl(n.thumbnailUrl)} alt="" className="h-full w-full object-cover" />
        </div>
      );
    }
    if (n.type === 'badge' || n.type === 'system') {
      return (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleOpen({ ...n, read: n.read });
          }}
          className="shrink-0 rounded-lg border border-primary/40 bg-primary-5 px-3 py-1.5 text-xs font-medium text-primary-dark dark:border-primary/50 dark:bg-primary/10 dark:text-primary"
        >
          자세히
        </button>
      );
    }
    if (n.type === 'follow' && n.kind === 'follow_received' && n.actorUserId) {
      const uid = n.actorUserId;
      const following = isFollowing(null, uid);
      return (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (following) {
              unfollow(uid);
            } else {
              follow(uid);
            }
            setTick((x) => x + 1);
            window.dispatchEvent(new CustomEvent('followsUpdated'));
          }}
          className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold ${
            following
              ? 'border border-primary/35 bg-primary-5 text-primary-dark dark:bg-primary/15 dark:text-primary'
              : 'bg-primary text-white shadow-sm hover:bg-primary-dark'
          }`}
        >
          {following ? '팔로잉' : '팔로우'}
        </button>
      );
    }
    return null;
  };

  const mainText = (n) => {
    if (n.message) return n.message;
    return n.title || '알림';
  };

  const sectionOrder = ['최근 7일', '최근 30일', '이전'];

  return (
    <div className="screen-layout relative h-screen overflow-hidden bg-primary-5 dark:bg-background-dark">
      <div className="screen-content">
        <header className="screen-header flex h-14 items-center justify-between border-b border-primary/15 bg-white px-3 dark:border-primary/20 dark:bg-gray-900">
          <button
            type="button"
            onClick={() => navigate('/main')}
            className="flex size-11 shrink-0 items-center justify-center rounded-lg text-primary transition-colors hover:bg-primary-5 dark:text-primary dark:hover:bg-primary/10"
          >
            <span className="material-symbols-outlined text-2xl">arrow_back</span>
          </button>
          <h1 className="flex-1 text-center text-base font-bold text-primary-dark dark:text-primary">알림</h1>
          <button
            type="button"
            onClick={() => setShowMarkAllReadModal(true)}
            disabled={allNotifications.filter((x) => !x.read).length === 0}
            className="flex size-11 shrink-0 items-center justify-end rounded-lg text-primary transition-colors hover:bg-primary-5 disabled:cursor-not-allowed disabled:opacity-40 dark:text-primary dark:hover:bg-primary/10"
          >
            <span className="material-symbols-outlined text-[22px]">done_all</span>
          </button>
        </header>

        <div className="screen-body">
          <div className="flex gap-2 border-b border-primary/10 bg-white px-3 py-2.5 dark:border-primary/15 dark:bg-gray-900">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`flex-1 rounded-full py-2 text-xs font-semibold transition-colors ${
                filter === 'all'
                  ? 'bg-primary text-white shadow-sm dark:bg-primary dark:text-white'
                  : 'bg-primary-5 text-primary-dark hover:bg-primary-10 dark:bg-primary/10 dark:text-primary dark:hover:bg-primary/20'
              }`}
            >
              전체 ({allNotifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('interest')}
              className={`flex-1 rounded-full py-2 text-xs font-semibold transition-colors ${
                filter === 'interest'
                  ? 'bg-primary text-white shadow-sm dark:bg-primary dark:text-white'
                  : 'bg-primary-5 text-primary-dark hover:bg-primary-10 dark:bg-primary/10 dark:text-primary dark:hover:bg-primary/20'
              }`}
            >
              관심지역 ({allNotifications.filter((n) => n.type === 'interest').length})
            </button>
          </div>

          <div className="pb-24 pt-1">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-20">
                <span className="material-symbols-outlined mb-3 text-5xl text-primary/35 dark:text-primary/40">
                  notifications_off
                </span>
                <p className="text-sm font-semibold text-primary-dark dark:text-primary">알림이 없습니다</p>
                <p className="mt-1 text-center text-xs text-primary/80 dark:text-primary/70">
                  활동이 쌓이면 여기에 표시돼요
                </p>
              </div>
            ) : (
              <div className="px-0">
                {sectionOrder.map((section) => {
                  const items = grouped[section];
                  if (!items || items.length === 0) return null;
                  return (
                    <div key={section} className="mb-4">
                      <p className="px-4 pb-2 pt-3 text-xs font-bold text-primary-dark/80 dark:text-primary/90">{section}</p>
                      <div className="divide-y divide-primary/10 bg-white dark:divide-primary/15 dark:bg-gray-900">
                        {items.map((notification) => (
                          <div
                            key={notification.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => handleOpen(notification)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') handleOpen(notification);
                            }}
                            className={`flex cursor-pointer items-center gap-3 px-4 py-3.5 transition-colors ${
                              !notification.read ? 'bg-primary-5 dark:bg-primary/10' : ''
                            } hover:bg-primary-5 dark:hover:bg-primary/10`}
                          >
                            {leftIcon(notification)}
                            <div className="min-w-0 flex-1">
                              <p className="text-[13px] leading-snug text-text-primary-light dark:text-text-primary-dark">
                                {mainText(notification)}
                              </p>
                              {notification.subMessage ? (
                                <p className="mt-0.5 line-clamp-1 text-[11px] text-primary/75 dark:text-primary/70">
                                  {notification.subMessage}
                                </p>
                              ) : null}
                              <p className="mt-1 text-[11px] text-primary/55 dark:text-primary/50">
                                {notification.time}
                              </p>
                            </div>
                            {renderRight(notification)}
                            <button
                              type="button"
                              onClick={(e) => handleDelete(notification.id, e)}
                              className="flex size-8 shrink-0 items-center justify-center rounded-full text-primary/35 hover:bg-primary-5 hover:text-primary-dark dark:text-primary/40 dark:hover:bg-primary/15 dark:hover:text-primary"
                              aria-label="삭제"
                            >
                              <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <BottomNavigation />

      {showMarkAllReadModal && (
        <div className="absolute inset-0 z-[200] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-primary/15 bg-white shadow-2xl dark:border-primary/25 dark:bg-gray-900">
            <div className="p-5">
              <h3 className="text-base font-bold text-primary-dark dark:text-primary">모든 알림을 읽음 처리할까요?</h3>
              <p className="mt-2 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                읽지 않은 알림 {allNotifications.filter((n) => !n.read).length}개가 읽음 처리됩니다.
              </p>
            </div>
            <div className="flex gap-2 px-5 pb-5">
              <button
                type="button"
                onClick={() => setShowMarkAllReadModal(false)}
                className="flex-1 rounded-xl bg-primary-5 py-3 text-sm font-semibold text-primary-dark dark:bg-primary/15 dark:text-primary"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark dark:bg-primary dark:hover:bg-primary-dark"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsScreen;
