import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';

const PointsHistoryScreen = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('earn'); // 'earn' or 'use'

  // 포인트 적립 내역 (실제 데이터)
  const earnHistory = JSON.parse(localStorage.getItem('pointsHistory') || '[]').map((item, index) => ({
    id: index,
    icon: item.action === '게시물 작성' ? 'add_circle' : 
          item.action === '좋아요' ? 'favorite' : 
          item.action === '질문 작성' ? 'question_answer' : 
          item.action === '댓글 작성' ? 'comment' :
          item.action === '출석 체크' ? 'calendar_today' : 'stars',
    title: item.action,
    date: new Date(item.timestamp).toLocaleString('ko-KR', { 
      month: 'long', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    points: item.points
  }));

  // 포인트 사용 내역 (추후 구현)
  const useHistory = [];

  const currentHistory = activeTab === 'earn' ? earnHistory : useHistory;
  const totalEarned = earnHistory.reduce((sum, item) => sum + item.points, 0);
  const totalUsed = Math.abs(useHistory.reduce((sum, item) => sum + item.points, 0));

  return (
    <div className="flex h-full w-full flex-col bg-background-light dark:bg-background-dark">
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {/* 헤더 */}
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between bg-background-light/80 px-4 backdrop-blur-sm dark:bg-background-dark/80 border-b border-border-light dark:border-border-dark">
          <button 
            onClick={() => navigate('/points')}
            className="flex size-10 items-center justify-center rounded-full text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <span className="material-symbols-outlined text-2xl">arrow_back</span>
          </button>
          <h1 className="flex-1 text-center text-lg font-bold text-text-light dark:text-text-dark">
            포인트 내역
          </h1>
          <div className="size-10"></div>
        </header>

        {/* 탭 네비게이션 */}
        <div className="sticky top-16 z-10 flex border-b border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark">
          <button
            onClick={() => setActiveTab('earn')}
            className={`flex-1 py-3 px-4 text-center font-semibold transition-colors relative ${
              activeTab === 'earn'
                ? 'text-primary'
                : 'text-text-secondary-light dark:text-text-secondary-dark'
            }`}
          >
            적립 내역
            {activeTab === 'earn' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('use')}
            className={`flex-1 py-3 px-4 text-center font-semibold transition-colors relative ${
              activeTab === 'use'
                ? 'text-primary'
                : 'text-text-secondary-light dark:text-text-secondary-dark'
            }`}
          >
            사용 내역
            {activeTab === 'use' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
            )}
          </button>
        </div>

        {/* 통계 카드 */}
        <div className="px-4 pt-4">
          <div className="rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-1">
                  {activeTab === 'earn' ? '총 적립 포인트' : '총 사용 포인트'}
                </p>
                <p className="text-2xl font-bold text-primary">
                  {activeTab === 'earn' ? `+${totalEarned}` : `-${totalUsed}`}P
                </p>
              </div>
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                <span className="material-symbols-outlined text-primary text-3xl">
                  {activeTab === 'earn' ? 'trending_up' : 'trending_down'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 내역 리스트 */}
        <div className="px-4 pt-6 pb-4">
          {currentHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <span className="material-symbols-outlined text-gray-300 dark:text-gray-600 text-6xl mb-4">
                {activeTab === 'earn' ? 'payments' : 'shopping_cart'}
              </span>
              <p className="text-gray-500 dark:text-gray-400 text-base font-medium">
                {activeTab === 'earn' ? '포인트 적립 내역이 없습니다' : '포인트 사용 내역이 없습니다'}
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                {activeTab === 'earn' ? '여행을 즐기며 포인트를 모아보세요!' : '포인트를 사용해보세요!'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {currentHistory.map((item) => (
                <div 
                  key={item.id} 
                  className="flex items-center gap-4 p-4 rounded-xl bg-surface-light dark:bg-surface-dark hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                  onClick={() => {
                    alert(`${item.title} 상세 정보`);
                  }}
                >
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${item.color} text-white`}>
                    <span className="material-symbols-outlined">{item.icon}</span>
                  </div>
                  <div className="flex flex-1 flex-col justify-center">
                    <p className="text-base font-semibold text-text-light dark:text-text-dark">
                      {item.title}
                    </p>
                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-0.5">
                      {item.description}
                    </p>
                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
                      {item.date}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={`text-lg font-bold ${item.points > 0 ? 'text-primary' : 'text-red-500'}`}>
                      {item.points > 0 ? '+' : ''}{item.points}P
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 안내 문구 */}
        <div className="px-4 pb-8">
          <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4">
            <div className="flex gap-2">
              <span className="material-symbols-outlined text-blue-500 text-xl">info</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-1">
                  포인트 안내
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-300 leading-relaxed">
                  • 포인트는 1년간 유효합니다<br />
                  • 적립된 포인트는 다양한 혜택으로 교환 가능합니다<br />
                  • 여행지 방문, 사진 업로드, 리뷰 작성 등으로 포인트를 적립하세요
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default PointsHistoryScreen;













