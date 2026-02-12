import React from 'react';
import { useNavigate } from 'react-router-dom';
import { logger } from '../utils/logger';

const WelcomeScreen = () => {
  const navigate = useNavigate();

  React.useEffect(() => {
    logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.log('🏠 LiveJourney 시작화면 표시');
    logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // 스플래시 화면에서 자동으로 온보딩 화면으로 이동
    const timer = setTimeout(() => {
      logger.log('🚀 스플래시 화면 → 온보딩 화면으로 자동 이동');
      navigate('/onboarding', { replace: true });
    }, 1500); // 1.5초 후 자동 이동
    
    return () => clearTimeout(timer);
  }, [navigate]);


  return (
    <div className="relative flex h-[100dvh] w-full items-center justify-center overflow-hidden bg-white dark:bg-zinc-900 font-display">
      {/* 중앙: 서비스 이름 + 한 줄 설명 */}
      <div className="flex flex-col items-center justify-center px-6 text-center gap-3">
        <h1 className="text-4xl font-extrabold tracking-[-0.06em] text-black dark:text-white">
          LiveJourney
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
          지금 이 순간의 여행을 실시간으로 나누는 서비스
        </p>
      </div>

    </div>
  );
};

export default WelcomeScreen;

