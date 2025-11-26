import React from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';

const NoticesScreen = () => {
  const navigate = useNavigate();

  // 공지사항 더미 데이터
  const notices = [
    {
      id: 1,
      title: 'LiveJourney v1.1 업데이트 안내',
      date: '2023.10.26',
      isNew: true
    },
    {
      id: 2,
      title: '[안내] 개인정보 처리방침 개정 안내',
      date: '2023.10.15',
      isNew: false
    },
    {
      id: 3,
      title: '[점검] 서비스 안정화를 위한 시스템 점검 안내',
      date: '2023.10.10',
      isNew: false
    },
    {
      id: 4,
      title: 'LiveJourney 서비스 이용약관 개정 안내',
      date: '2023.09.28',
      isNew: false
    },
    {
      id: 5,
      title: 'LiveJourney 정식 출시 안내',
      date: '2023.09.01',
      isNew: false
    }
  ];

  const handleNoticeClick = (noticeId) => {
    // TODO: 실제 백엔드 API 호출하여 공지사항 상세 페이지로 이동
    alert(`공지사항 상세 페이지 (ID: ${noticeId})는 추후 구현 예정입니다.`);
  };

  return (
    <div className="flex h-full w-full flex-col bg-background-light dark:bg-background-dark group/design-root">
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border-light bg-surface-light/80 dark:border-border-dark dark:bg-surface-dark/80 backdrop-blur-sm px-4">
        <button
          onClick={() => navigate('/settings')}
          className="flex size-12 shrink-0 items-center justify-center cursor-pointer text-content-light dark:text-content-dark hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined text-2xl">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold leading-tight tracking-[-0.015em] text-content-light dark:text-content-dark">공지사항</h1>
        <div className="flex size-12 shrink-0 items-center justify-end"></div>
      </header>

      <main className="flex-grow pb-24 bg-surface-light dark:bg-surface-dark">
        <div className="flex flex-col">
          {notices.map((notice) => (
            <button
              key={notice.id}
              onClick={() => handleNoticeClick(notice.id)}
              className="flex items-center border-b border-border-light dark:border-border-dark px-4 py-4 hover:bg-surface-subtle-light dark:hover:bg-surface-subtle-dark transition-colors cursor-pointer"
            >
              <div className="flex-grow text-left">
                <div className="flex items-center gap-2">
                  <p className="text-base font-bold leading-normal text-content-light dark:text-content-dark">
                    {notice.title}
                  </p>
                  {notice.isNew && (
                    <span className="inline-block rounded bg-primary/10 px-1.5 py-0.5 text-xs font-bold text-primary dark:bg-primary/20">
                      NEW
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm font-normal leading-normal text-subtle-light dark:text-subtle-dark">
                  {notice.date}
                </p>
              </div>
              <span className="material-symbols-outlined text-subtle-light dark:text-subtle-dark">
                chevron_right
              </span>
            </button>
          ))}
        </div>
      </main>

      </div>

      <BottomNavigation />
    </div>
  );
};

export default NoticesScreen;



