import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { seedMockData } from '../utils/mockUploadData';
import LiveJourneyLogo from '../components/LiveJourneyLogo';

const WelcomeScreen = () => {
  const navigate = useNavigate();
  const { testerLogin } = useAuth();

  React.useEffect(() => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🏠 LiveJourney 시작화면 표시');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Mock 데이터는 개발 모드에서만 생성 (최소화)
    if (import.meta.env.MODE === 'development') {
      const timer = setTimeout(() => {
        try {
          const existingPosts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');
          // Mock 데이터 생성 비활성화 - 프로덕션 모드
          console.log(`📊 현재 게시물: ${existingPosts.length}개`);
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
    console.log('🚀 앱 시작하기 버튼 클릭 → 로그인 화면으로 이동');
    
    // 로그인 화면을 보기 위한 플래그 설정 (자동 리다이렉트 방지)
    sessionStorage.setItem('showLoginScreen', 'true');
    
    navigate('/start');
  };

  const handleTesterLogin = async () => {
    console.log('🧪 테스터 계정으로 바로 로그인');
    try {
      const result = await testerLogin();
      if (result.success) {
        navigate('/main', { replace: true });
      } else {
        console.error('테스터 로그인 실패:', result.error);
        // 실패해도 로그인 화면으로 이동
        navigate('/start');
      }
    } catch (error) {
      console.error('테스터 로그인 오류:', error);
      navigate('/start');
    }
  };

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-white dark:bg-zinc-900 font-display">
      {/* 중앙 컨텐츠 */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center py-12">
        <div className="flex flex-col items-center justify-center gap-6">
          <LiveJourneyLogo size={180} showText={true} />
          <h2 className="text-gray-700 dark:text-gray-300 tracking-tight text-xl font-semibold leading-relaxed max-w-xs">
            가기 전에 확인하고,<br/>실망 없이 즐기세요
          </h2>
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="flex-shrink-0 w-full px-8 pb-12 space-y-3">
        <button 
          onClick={handleTesterLogin}
          className="flex cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-full h-14 px-5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-base font-bold leading-normal tracking-[0.015em] w-full hover:from-purple-600 hover:to-pink-600 active:scale-95 transition-all shadow-lg"
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

