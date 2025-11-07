import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import BottomNavigation from '../components/BottomNavigation';
import { getTodayStats } from '../utils/pointsSystem';

const PointsScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [todayStats, setTodayStats] = useState(null);

  // 오늘의 포인트 통계 로드
  useEffect(() => {
    const stats = getTodayStats();
    setTodayStats(stats);
  }, []);

  // 포인트 적립 내역 (최근 5개)
  const earnHistory = JSON.parse(localStorage.getItem('pointsHistory') || '[]').slice(0, 5).map((item, index) => ({
    id: index,
    icon: item.action === '게시물 작성' ? 'add_circle' : item.action === '좋아요' ? 'favorite' : item.action === '질문 작성' ? 'question_answer' : 'stars',
    title: item.action,
    date: new Date(item.timestamp).toLocaleDateString('ko-KR'),
    points: item.points
  }));

  const handleUsePoints = () => {
    navigate('/points/shop');
  };

  const handleViewMoreEarn = () => {
    navigate('/points/history');
  };

  const handleViewMoreUsage = () => {
    navigate('/points/guide');
  };

  return (
    <div className="flex h-full w-full flex-col bg-background-light dark:bg-background-dark">
      {/* 메인 콘텐츠 - 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {/* 헤더 */}
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between bg-background-light/80 px-4 backdrop-blur-sm dark:bg-background-dark/80">
        <button 
          onClick={() => navigate('/profile')}
          className="flex size-10 items-center justify-center rounded-full text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <span className="material-symbols-outlined text-2xl">arrow_back</span>
        </button>
        <h1 className="flex-1 text-center text-lg font-bold text-text-light dark:text-text-dark">
          포인트 관리
        </h1>
        <div className="size-10"></div>
      </header>

        {/* 메인 콘텐츠 */}
        <main className="flex-1 px-4 pb-4 pt-4">
        {/* 현재 보유 포인트 카드 */}
        <div className="rounded-lg bg-card-light p-6 shadow-sm dark:bg-card-dark">
          <p className="text-base font-normal leading-normal text-text-secondary-light dark:text-text-secondary-dark">
            현재 보유 포인트
          </p>
          <h2 className="tracking-light text-primary mt-2 text-[32px] font-bold leading-tight">
            {user?.points || 1250}P
          </h2>
          
          {/* 오늘의 포인트 통계 */}
          {todayStats && (
            <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-text-light dark:text-text-dark">
                  오늘 적립한 포인트
                </p>
                <p className="text-base font-bold text-primary">
                  {todayStats.total}P
                </p>
              </div>
              <div className="flex items-center justify-between text-xs">
                <p className="text-text-secondary-light dark:text-text-secondary-dark">
                  일일 한도
                </p>
                <p className="text-text-secondary-light dark:text-text-secondary-dark">
                  {todayStats.remaining}P 남음 (최대 {todayStats.limit}P)
                </p>
              </div>
            </div>
          )}
          
          <button 
            onClick={handleUsePoints}
            className="mt-4 w-full rounded-full bg-primary py-3 text-base font-bold text-white shadow-sm transition-colors hover:bg-primary/90"
          >
            포인트 사용
          </button>
        </div>

        {/* 포인트 적립 내역 */}
        <section className="mt-8">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-lg font-bold leading-tight tracking-[-0.015em] text-text-light dark:text-text-dark">
              포인트 적립 내역
            </h3>
            <button 
              onClick={handleViewMoreEarn}
              className="flex items-center gap-1 text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark hover:text-primary transition-colors"
            >
              더보기
              <span className="material-symbols-outlined text-base">arrow_forward_ios</span>
            </button>
          </div>
          <div className="mt-3 flex flex-col divide-y divide-border-light dark:divide-border-dark">
            {earnHistory.map((item) => (
              <div key={item.id} className="flex items-center gap-4 py-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <span className="material-symbols-outlined">{item.icon}</span>
                </div>
                <div className="flex flex-1 flex-col justify-center">
                  <p className="text-base font-medium leading-normal text-text-light dark:text-text-dark">
                    {item.title}
                  </p>
                  <p className="text-sm font-normal leading-normal text-text-secondary-light dark:text-text-secondary-dark">
                    {item.date}
                  </p>
                </div>
                <p className="shrink-0 text-base font-medium leading-normal text-primary">
                  +{item.points}P
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 포인트 사용 방법 */}
        <section className="mt-8">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-lg font-bold leading-tight tracking-[-0.015em] text-text-light dark:text-text-dark">
              포인트 사용 방법
            </h3>
            <button 
              onClick={handleViewMoreUsage}
              className="flex items-center gap-1 text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark hover:text-primary transition-colors"
            >
              더보기
              <span className="material-symbols-outlined text-base">arrow_forward_ios</span>
            </button>
          </div>
          <div className="mt-3 rounded-lg bg-card-light p-4 dark:bg-card-dark">
            <p className="text-sm leading-relaxed text-text-secondary-light dark:text-text-secondary-dark">
              적립된 포인트는 LiveJourney에서 다양한 혜택으로 교환할 수 있습니다. 숙소 예약 시 할인을 받거나, 특별한 여행 상품을 구매하는 데 사용해 보세요.
            </p>
          </div>
        </section>
        </main>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default PointsScreen;



