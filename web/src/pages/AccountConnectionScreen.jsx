import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';
import { useAuth } from '../contexts/AuthContext';

const AccountConnectionScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);

  return (
    <div className="flex h-full w-full flex-col bg-background-light dark:bg-background-dark">
      {/* 상단 헤더 (고정) */}
      <header className="flex h-16 items-center justify-between border-b border-border-light bg-surface-light dark:border-border-dark dark:bg-surface-dark px-4">
        <button 
          onClick={() => navigate('/settings')}
          className="flex size-12 shrink-0 items-center justify-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined text-2xl text-black dark:text-white">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold leading-tight tracking-[-0.015em] text-black dark:text-white">
          계정 연결
        </h1>
        <div className="flex size-12 shrink-0 items-center justify-end"></div>
      </header>

      {/* 메인 콘텐츠 - 스크롤 없이 한 화면에 보이도록 중앙 정렬 */}
      <main className="flex flex-1 items-center justify-center px-6">
        <div className="flex w-full max-w-sm flex-col items-center text-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <span className="material-symbols-outlined text-3xl text-primary">link</span>
          </div>
          <h2 className="text-xl font-bold text-black dark:text-white">
            계정을 연동해서 더 편하게 사용해보세요
          </h2>
          <p className="text-sm text-black/70 dark:text-white/70">
            소셜 계정을 연결하면 여러 기기에서 동일한 계정으로
            더욱 안전하고 편리하게 서비스를 이용할 수 있습니다.
          </p>
          <button
            // 계정 연결 완료 후 이동: 메인 화면이 아니라 프로필 화면으로 이동
            onClick={() => navigate('/profile')}
            className="mt-2 h-12 w-full max-w-xs rounded-full bg-primary px-6 text-sm font-bold text-white shadow-md hover:bg-primary/90 transition-colors"
          >
            계정 연결하기
          </button>
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default AccountConnectionScreen;



