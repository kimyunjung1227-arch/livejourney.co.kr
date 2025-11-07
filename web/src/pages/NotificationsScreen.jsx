import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';
import { 
  getNotifications, 
  markAsRead, 
  markAllAsRead, 
  getTimeAgo 
} from '../utils/notifications';

const NotificationsScreen = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all'); // 'all', 'unread'
  const [showMarkAllReadModal, setShowMarkAllReadModal] = useState(false);
  const [allNotifications, setAllNotifications] = useState([]);

  // 알림 불러오기
  useEffect(() => {
    loadNotifications();
    
    // 알림 변경 이벤트 리스너
    const handleNotificationChange = () => {
      loadNotifications();
    };
    
    window.addEventListener('notificationCountChanged', handleNotificationChange);
    window.addEventListener('focus', loadNotifications);
    
    return () => {
      window.removeEventListener('notificationCountChanged', handleNotificationChange);
      window.removeEventListener('focus', loadNotifications);
    };
  }, []);

  const loadNotifications = () => {
    const notifications = getNotifications();
    // 시간 포맷 적용
    const formattedNotifications = notifications.map(n => ({
      ...n,
      timeFormatted: getTimeAgo(n.time)
    }));
    setAllNotifications(formattedNotifications);
  };

  const filteredNotifications = filter === 'unread' 
    ? allNotifications.filter(n => !n.isRead)
    : allNotifications;

  const unreadCount = allNotifications.filter(n => !n.isRead).length;

  const handleNotificationClick = (notification) => {
    // 알림을 읽음 처리
    if (!notification.isRead) {
      markAsRead(notification.id);
      loadNotifications();
    }
    
    // 해당 링크로 이동
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleMarkAllRead = () => {
    if (unreadCount === 0) {
      return; // 읽지 않은 알림이 없으면 아무것도 안 함
    }
    setShowMarkAllReadModal(true);
  };

  const confirmMarkAllRead = () => {
    markAllAsRead();
    loadNotifications();
    setShowMarkAllReadModal(false);
  };

  const cancelMarkAllRead = () => {
    setShowMarkAllReadModal(false);
  };

  return (
    <div className="flex h-full w-full flex-col bg-background-light dark:bg-background-dark">
      {/* 메인 콘텐츠 - 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {/* 헤더 */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border-light bg-surface-light dark:border-border-dark dark:bg-surface-dark px-4">
        <button
          onClick={() => navigate('/main')}
          className="flex size-12 shrink-0 items-center justify-start cursor-pointer text-content-light dark:text-content-dark hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>arrow_back</span>
        </button>
        <h1 className="text-lg font-bold leading-tight tracking-[-0.015em] text-content-light dark:text-content-dark">
          알림
        </h1>
        <button
          onClick={handleMarkAllRead}
          className="flex items-center justify-end text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          모두 읽음
        </button>
      </header>

      {/* 필터 탭 */}
      <div className="flex bg-surface-light dark:bg-surface-dark border-b border-border-light dark:border-border-dark">
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'text-primary border-b-2 border-primary'
              : 'text-subtle-light dark:text-subtle-dark'
          }`}
        >
          전체 ({allNotifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            filter === 'unread'
              ? 'text-primary border-b-2 border-primary'
              : 'text-subtle-light dark:text-subtle-dark'
          }`}
        >
          읽은 알림 ({unreadCount})
        </button>
      </div>

        {/* 알림 리스트 */}
        <main className="flex-grow pb-4">
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <span className="material-symbols-outlined text-7xl text-gray-300 dark:text-gray-600 mb-4">
              notifications_off
            </span>
            <p className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">
              알림이 없습니다
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-xs">
              {filter === 'unread' 
                ? '읽은 알림이 없습니다.'
                : '여행 정보를 공유하고 다른 사용자와 소통하면 알림을 받을 수 있어요!'}
            </p>
            <button
              onClick={() => navigate('/main')}
              className="mt-6 bg-primary text-white px-6 py-2.5 rounded-full font-semibold hover:bg-primary/90 transition-colors"
            >
              둘러보기
            </button>
          </div>
        ) : (
          <div className="flex flex-col">
            {filteredNotifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`flex items-start gap-3 p-4 border-b border-border-light dark:border-border-dark hover:bg-surface-subtle-light dark:hover:bg-surface-subtle-dark transition-colors ${
                  !notification.isRead ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''
                }`}
              >
                {/* 아이콘 */}
                <div className={`flex size-10 shrink-0 items-center justify-center rounded-full ${notification.iconBg}`}>
                  <span className={`material-symbols-outlined ${notification.iconColor}`} style={{ fontSize: '20px' }}>
                    {notification.icon}
                  </span>
                </div>

                {/* 내용 */}
                <div className="flex-grow text-left">
                  <p className={`text-sm leading-normal ${
                    !notification.isRead 
                      ? 'font-bold text-content-light dark:text-content-dark' 
                      : 'font-medium text-content-light dark:text-content-dark'
                  }`}>
                    {notification.title}
                  </p>
                  {notification.message && (
                    <p className="text-sm text-subtle-light dark:text-subtle-dark mt-1">
                      {notification.message}
                    </p>
                  )}
                  <p className="text-xs text-subtle-light dark:text-subtle-dark mt-2">
                    {notification.timeFormatted || notification.time}
                  </p>
                </div>

                {/* 읽지 않음 표시 */}
                {!notification.isRead && (
                  <div className="flex size-2 shrink-0 items-center justify-center">
                    <div className="size-2 rounded-full bg-primary"></div>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
        </main>
      </div>

      <BottomNavigation />

      {/* 모두 읽기 확인 모달 */}
      {showMarkAllReadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 p-4">
          <div className="w-full max-w-sm transform flex-col rounded-xl bg-white dark:bg-[#221910] p-6 shadow-2xl transition-all">
            {/* 제목 */}
            <h1 className="text-[#181411] dark:text-gray-100 text-[22px] font-bold leading-tight tracking-[-0.015em] text-center pb-3 pt-1">
              모두 읽음 처리
            </h1>
            
            {/* 내용 */}
            <p className="text-gray-700 dark:text-gray-300 text-base font-normal leading-normal pb-6 pt-1 px-4 text-center">
              읽은 알림 <strong className="font-bold text-primary">{unreadCount}개</strong>가 모두 읽음으로 표시됩니다. 계속하시겠습니까?
            </p>
            
            {/* 버튼 그룹 */}
            <div className="flex w-full flex-row gap-3">
              <button 
                onClick={cancelMarkAllRead}
                className="flex flex-1 min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-gray-200 dark:bg-gray-700 text-[#181411] dark:text-gray-200 text-base font-bold leading-normal tracking-[0.015em] hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                <span className="truncate">취소</span>
              </button>
              <button 
                onClick={confirmMarkAllRead}
                className="flex flex-1 min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-primary text-white text-base font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 transition-colors"
              >
                <span className="truncate">확인</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsScreen;








































