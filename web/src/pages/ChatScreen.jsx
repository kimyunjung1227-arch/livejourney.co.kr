import React from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';

const ChatScreen = () => {
  const navigate = useNavigate();

  return (
    <div className="screen-layout bg-background-light dark:bg-background-dark">
      <div className="screen-content" style={{ background: '#ffffff', paddingBottom: 80 }}>
        {/* 상단 헤더 */}
        <header className="screen-header bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between px-4 pt-4 pb-3">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
              채팅
            </h1>
          </div>
        </header>

        {/* 준비 중 화면 */}
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-3xl text-gray-400 dark:text-gray-500">
              chat
            </span>
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            채팅 기능은 준비 중이에요
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
            라이브 동행 채팅은 곧 업데이트될 예정입니다.
            <br />
            그동안은 메인 피드에서 여행 소식을 먼저 즐겨 주세요!
          </p>
          <button
            type="button"
            onClick={() => navigate('/main')}
            className="px-5 py-2.5 rounded-xl bg-[#00BCD4] text-white text-sm font-semibold hover:bg-[#00a8b8] active:opacity-90"
          >
            홈으로 가기
          </button>
        </div>
      </div>
      <BottomNavigation />
    </div>
  );
};

export default ChatScreen;