import React from 'react';
import { useNavigate } from 'react-router-dom';
import { seedMockData } from '../utils/mockUploadData';
import LiveJourneyLogo from '../components/LiveJourneyLogo';

const WelcomeScreen = () => {
  const navigate = useNavigate();

  React.useEffect(() => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🏠 LiveJourney 시작화면 표시');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Mock 데이터는 개발 모드에서만 생성 (최소화)
    if (import.meta.env.MODE === 'development') {
      const timer = setTimeout(() => {
        try {
          const existingPosts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');
          if (existingPosts.length < 50) {
            console.log('📦 [개발 모드] Mock 데이터 생성 중...');
            const needCount = 50 - existingPosts.length;
            seedMockData(needCount);
            console.log(`✅ [개발 모드] ${needCount}개 생성 완료!`);
          } else {
            console.log(`✅ [개발 모드] Mock 데이터 충분 (${existingPosts.length}개)`);
          }
        } catch (error) {
          console.error('Mock 데이터 생성 오류:', error);
        }
      }, 100);
      
      return () => clearTimeout(timer);
    } else {
      console.log('🚫 [프로덕션] Mock 데이터 생성 건너뜀');
    }
  }, []);

  const handleStart = () => {
    // "앱 시작하기" 버튼 클릭 시 - 무조건 소셜 로그인 화면으로
    console.log('🚀 앱 시작하기 버튼 클릭 → 소셜 로그인 화면으로 이동');
    navigate('/start');
  };

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-white dark:bg-zinc-900 font-display">
      {/* 중앙 컨텐츠 */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center py-12">
        <div className="flex flex-col items-center justify-center gap-8">
          <LiveJourneyLogo size={280} showText={true} />
          <h2 className="text-primary tracking-tight text-3xl font-bold leading-tight max-w-xs">
            지금, 당신의 여행을<br/>실시간으로!
          </h2>
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="flex-shrink-0 w-full px-8 pb-12">
        <button 
          onClick={handleStart}
          className="flex cursor-pointer items-center justify-center overflow-hidden rounded-full h-14 px-5 bg-primary text-white text-lg font-bold leading-normal tracking-[0.015em] w-full hover:shadow-2xl active:scale-95 transition-all shadow-xl"
        >
          <span className="truncate">앱 시작하기</span>
        </button>
      </div>
    </div>
  );
};

export default WelcomeScreen;





















