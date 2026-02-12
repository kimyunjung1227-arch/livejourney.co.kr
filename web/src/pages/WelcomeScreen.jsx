import React from 'react';
import { useNavigate } from 'react-router-dom';
import LiveJourneyLogo from '../components/LiveJourneyLogo';
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
      {/* 중앙 컨텐츠 - 로고만 표시 (완전 중앙 정렬) */}
      <div className="flex flex-col items-center justify-center px-6 text-center gap-6">
        <LiveJourneyLogo size={180} showText={true} />
      </div>
    </div>
  );
};

export default WelcomeScreen;

