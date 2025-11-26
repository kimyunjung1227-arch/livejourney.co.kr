import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DAILY_TITLES } from '../utils/dailyTitleSystem';

const TitlePreviewScreen = () => {
  const navigate = useNavigate();
  const [selectedTitle, setSelectedTitle] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);

  // 타이틀 카테고리별로 그룹화
  const titlesByCategory = Object.values(DAILY_TITLES).reduce((acc, title) => {
    const category = title.category || '기타';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(title);
    return acc;
  }, {});

  const handleTitleClick = (title) => {
    setSelectedTitle(title);
    setShowCelebration(true);
  };

  const closeCelebration = () => {
    setShowCelebration(false);
    setTimeout(() => {
      setSelectedTitle(null);
    }, 300);
  };

  return (
    <div className="screen-layout bg-gray-100 dark:bg-gray-900">
      <div className="screen-content">
        {/* 헤더 */}
        <header className="screen-header bg-white dark:bg-gray-900 flex items-center p-4 justify-between shadow-sm">
          <button 
            onClick={() => navigate(-1)}
            aria-label="Back" 
            className="flex size-12 shrink-0 items-center justify-center text-text-primary-light dark:text-text-primary-dark hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-2xl">arrow_back</span>
          </button>
          <h1 className="text-text-primary-light dark:text-text-primary-dark text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-10">
            타이틀 미리보기
          </h1>
        </header>

        {/* 메인 컨텐츠 */}
        <main className="flex-grow px-4 py-6">
          <div className="mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              타이틀을 클릭하면 획득 축하 화면과 프로필 표시를 미리 볼 수 있습니다.
            </p>
          </div>

          {/* 타이틀 목록 */}
          <div className="space-y-6">
            {Object.entries(titlesByCategory).map(([category, titles]) => (
              <div key={category}>
                <h2 className="text-base font-bold text-gray-800 dark:text-gray-200 mb-3">
                  {category}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {titles.map((title) => (
                    <button
                      key={title.id}
                      onClick={() => handleTitleClick(title)}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-lg transition-all"
                    >
                      <div className="text-3xl">{title.icon}</div>
                      <div className="text-center">
                        <div className="text-sm font-bold text-gray-800 dark:text-gray-200">
                          {title.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {title.description}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* 핸드폰 프레임 - 타이틀 획득 축하 모달 (앱 주황 톤과 통일) */}
      {showCelebration && selectedTitle && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-sm">
            {/* 핸드폰 프레임 */}
            <div className="relative bg-gray-900 rounded-[2.5rem] p-2 shadow-2xl">
              {/* 노치 */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-2xl z-10"></div>
              
              {/* 화면 */}
              <div className="relative bg-white rounded-[2rem] overflow-hidden" style={{ height: '600px' }}>
                {/* 축하 모달 - 메인/업로드와 동일한 주황 톤 */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/70 p-4 z-50">
                  <div className="w-full max-w-sm transform rounded-3xl bg-background-light dark:bg-card-dark p-8 shadow-2xl border-4 border-primary animate-scale-up">
                    <div className="flex justify-center mb-6">
                      <div className="relative">
                        {/* 심플한 아이콘 원 - primary 컬러 단색 */}
                        <div className="flex items-center justify-center w-32 h-32 rounded-full bg-primary shadow-xl">
                          <span className="text-6xl">{selectedTitle.icon || '👑'}</span>
                        </div>
                        {/* 단일 펄스 효과 */}
                        <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
                        {/* VIP 배지 */}
                        <div className="absolute -top-2 -right-2 bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                          VIP
                        </div>
                      </div>
                    </div>

                    <h1 className="text-3xl font-bold text-center mb-3 text-text-primary-light dark:text-text-primary-dark">
                      축하합니다!
                    </h1>
                    
                    <p className="text-xl font-bold text-center text-primary mb-2">
                      {selectedTitle.name}
                    </p>
                    
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <div className="px-3 py-1 rounded-full text-sm font-bold bg-primary/10 text-primary border border-primary/30">
                        {selectedTitle.category || '24시간 타이틀'}
                      </div>
                    </div>
                    
                    <p className="text-base font-medium text-center text-text-secondary-light dark:text-text-secondary-dark mb-2">
                      24시간 타이틀을 획득했습니다!
                    </p>
                    
                    <p className="text-sm text-center text-text-subtle-light dark:text-text-subtle-dark mb-8 leading-relaxed">
                      {selectedTitle.description || '오늘 하루 동안 이 타이틀을 유지할 수 있습니다!'}
                    </p>
                    
                    <button
                      onClick={() => {
                        setShowCelebration(false);
                      }}
                      className="w-full py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg transform hover:scale-105 active:scale-95 text-lg"
                    >
                      프로필에서 확인하기
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 닫기 버튼 */}
            <button
              onClick={closeCelebration}
              className="absolute -top-12 right-0 bg-white dark:bg-gray-800 text-gray-800 dark:text-white p-2 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>
      )}

      {/* 핸드폰 프레임 - 프로필 타이틀 표시 */}
      {selectedTitle && !showCelebration && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-sm">
            {/* 핸드폰 프레임 */}
            <div className="relative bg-gray-900 rounded-[2.5rem] p-2 shadow-2xl">
              {/* 노치 */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-2xl z-10"></div>
              
              {/* 화면 */}
              <div className="relative bg-white dark:bg-gray-900 rounded-[2rem] overflow-y-auto" style={{ height: '600px' }}>
                {/* 프로필 화면 시뮬레이션 */}
                <div className="p-4">
                  {/* 프로필 헤더 */}
                  <div className="mb-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-purple-500"></div>
                      <div>
                        <div className="text-lg font-bold text-gray-800 dark:text-white">사용자 이름</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">@username</div>
                      </div>
                    </div>
                  </div>

                  {/* 타이틀 표시 영역 */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
                        오늘의 타이틀
                      </h2>
                    </div>
                    <div className="relative flex items-center gap-3 px-4 py-4 rounded-2xl bg-gradient-to-r from-amber-100 via-orange-100 to-yellow-100 dark:from-amber-900/50 dark:via-orange-900/50 dark:to-yellow-900/50 border-2 border-amber-400 dark:border-amber-500 shadow-lg animate-pulse">
                      {/* 후광 효과 */}
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-amber-400/20 via-orange-400/20 to-yellow-400/20 dark:from-amber-500/30 dark:via-orange-500/30 dark:to-yellow-500/30 blur-xl animate-pulse"></div>
                      
                      {/* 특별 배지 */}
                      <div className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg animate-bounce">
                        👑 VIP
                      </div>
                      
                      <div className="relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 via-orange-400 to-yellow-400 dark:from-amber-500 dark:via-orange-500 dark:to-yellow-500 shadow-xl ring-4 ring-amber-300/50 dark:ring-amber-400/30">
                        <span className="text-3xl drop-shadow-lg">{selectedTitle.icon || '👑'}</span>
                      </div>
                      <div className="flex flex-col flex-1 relative z-10">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg font-extrabold bg-gradient-to-r from-amber-700 to-orange-700 dark:from-amber-300 dark:to-orange-300 bg-clip-text text-transparent">
                            {selectedTitle.name}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                            {selectedTitle.category || '24시간'}
                          </span>
                        </div>
                        <span className="text-xs text-amber-800/90 dark:text-amber-200/90 font-medium">
                          {selectedTitle.description || '오늘 하루 동안 유지되는 명예 타이틀입니다.'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 설명 */}
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      💡 이 타이틀은 프로필 상단에 이렇게 표시됩니다. 후광 효과와 애니메이션이 적용되어 특별함을 강조합니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 닫기 버튼 */}
            <button
              onClick={() => setSelectedTitle(null)}
              className="absolute -top-12 right-0 bg-white dark:bg-gray-800 text-gray-800 dark:text-white p-2 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            {/* 모드 전환 버튼 */}
            <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 flex flex-col gap-2">
              <button
                onClick={() => setShowCelebration(true)}
                className="bg-gradient-to-r from-amber-400 to-orange-400 text-white px-4 py-2 rounded-full shadow-lg hover:from-amber-500 hover:to-orange-500 transition-all font-semibold whitespace-nowrap"
              >
                축하 모달 보기
              </button>
              <button
                onClick={() => setSelectedTitle(null)}
                className="bg-gray-500 text-white px-4 py-2 rounded-full shadow-lg hover:bg-gray-600 transition-all font-semibold whitespace-nowrap"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TitlePreviewScreen;


