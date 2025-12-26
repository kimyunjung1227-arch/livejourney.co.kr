import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { seedMockData } from '../utils/mockUploadData';
import LiveJourneyLogo from '../components/LiveJourneyLogo';
import { logger } from '../utils/logger';

const WelcomeScreen = () => {
  const navigate = useNavigate();
  const { testerLogin } = useAuth();

  React.useEffect(() => {
    logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.log('🏠 LiveJourney 시작화면 표시');
    logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Mock 데이터는 개발 모드에서만 생성 (최소화)
    if (import.meta.env.MODE === 'development') {
      const timer = setTimeout(() => {
        try {
          const existingPosts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');
          // Mock 데이터 생성 비활성화 - 프로덕션 모드
          logger.log(`📊 현재 게시물: ${existingPosts.length}개`);
        } catch (error) {
          logger.error('Mock 데이터 생성 오류:', error);
        }
      }, 100);
      
      return () => clearTimeout(timer);
    } else {
      logger.log('🚫 [프로덕션] Mock 데이터 생성 건너뜀');
    }
  }, []);

  const handleStart = React.useCallback(() => {
    // "앱 시작하기" 버튼 클릭 시 - 로그인 없이 메인 화면으로 진입
    logger.log('🚀 앱 시작하기 버튼 클릭 → 메인 화면으로 이동 (게스트 모드 가능)');
    navigate('/main');
  }, [navigate]);

  const handleTesterLogin = React.useCallback(async () => {
    logger.log('🧪 테스터 계정으로 바로 로그인');
    try {
      const result = await testerLogin();
      if (result.success) {
        navigate('/main', { replace: true });
      } else {
        logger.error('테스터 로그인 실패:', result.error);
        // 실패해도 로그인 화면으로 이동
        navigate('/start');
      }
    } catch (error) {
      logger.error('테스터 로그인 오류:', error);
      navigate('/start');
    }
  }, [testerLogin, navigate]);

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-white dark:bg-zinc-900 font-display">
      {/* 중앙 컨텐츠 */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center py-12">
        <div className="flex flex-col items-center justify-center gap-6">
          <LiveJourneyLogo size={180} showText={true} />
          <p className="text-black dark:text-white text-lg font-bold leading-relaxed max-w-sm mt-2 px-4">
            당신의 여정 속 불확실성을<br/>실시간 확신과 즐거움으로 바꿉니다
          </p>
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="flex-shrink-0 w-full px-8 pb-12 space-y-3">
        <button 
          onClick={handleTesterLogin}
          className="flex cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-full h-14 px-5 bg-gradient-to-r from-primary to-primary-dark text-white text-base font-bold leading-normal tracking-[0.015em] w-full hover:from-primary-dark hover:to-primary-dark active:scale-95 transition-all shadow-lg"
        >
          <span className="material-symbols-outlined text-lg">bug_report</span>
          <span className="truncate">테스터 계정으로 바로 시작</span>
        </button>
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

