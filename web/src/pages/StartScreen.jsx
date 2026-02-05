import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LiveJourneyLogo from '../components/LiveJourneyLogo';
import { logger } from '../utils/logger';

const StartScreen = () => {
  const navigate = useNavigate();
  const { isAuthenticated, testerLogin } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 로그아웃 후 돌아온 경우 또는 Welcome 화면에서 온 경우는 로그인 화면 표시
    const justLoggedOut = sessionStorage.getItem('justLoggedOut');
    const showLoginScreen = sessionStorage.getItem('showLoginScreen');

    // 로그인 화면을 보려는 의도가 있으면 자동 리다이렉트 안함
    if (isAuthenticated && !justLoggedOut && !showLoginScreen) {
      navigate('/main', { replace: true });
    }

    // 플래그 제거
    if (justLoggedOut) {
      sessionStorage.removeItem('justLoggedOut');
    }
    if (showLoginScreen) {
      sessionStorage.removeItem('showLoginScreen');
    }
  }, [isAuthenticated, navigate]);

  const handleTesterLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await testerLogin();
      if (result.success) {
        const hasCompletedInterest = localStorage.getItem('hasCompletedInterestSetup') === 'true';
        // 처음 로그인이라면 관심 지역 설정으로, 아니면 바로 메인으로
        if (!hasCompletedInterest) {
          navigate('/interest-places', { replace: true });
        } else {
          navigate('/main', { replace: true });
        }
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('테스터 계정 로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider) => {
    setLoading(true);
    setError('');

    try {
      // 백엔드 API URL 가져오기
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

      // 소셜 로그인 제공자에 따라 엔드포인트 결정
      const providerLower = provider.toLowerCase();
      let authEndpoint = '';

      if (providerLower === 'kakao') {
        authEndpoint = `${apiUrl}/api/auth/kakao`;
      } else if (providerLower === 'naver') {
        authEndpoint = `${apiUrl}/api/auth/naver`;
      } else if (providerLower === 'google') {
        authEndpoint = `${apiUrl}/api/auth/google`;
      } else {
        throw new Error('지원하지 않는 소셜 로그인 제공자입니다.');
      }

      // 백엔드로 리다이렉트 (OAuth 인증 시작)
      window.location.href = authEndpoint;

      // 리다이렉트되므로 여기서는 로딩 상태만 유지
      // 실제 로그인 처리는 AuthCallbackScreen에서 수행됨
    } catch (error) {
      logger.error('소셜 로그인 실패:', error);
      setError(`${provider} 로그인에 실패했습니다.`);
      setLoading(false);
    }
  };


  // 메인 시작 화면 (소셜 로그인 전용)
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/40 dark:bg-black/60 z-50 p-4">
      {/* 뒤로가기 버튼 - 배경 클릭으로 닫기 */}
      <div
        className="absolute inset-0"
        onClick={() => navigate(-1)}
      ></div>

      {/* 절반 크기 로그인 카드 */}
      <div
        className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden animate-slide-up flex flex-col"
        style={{
          animation: 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
          maxHeight: '85vh'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => navigate('/main')}
            className="flex h-10 w-10 items-center justify-center text-text-primary-light dark:text-text-primary-dark hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
          <h2 className="text-base font-bold text-text-primary-light dark:text-text-primary-dark">로그인</h2>
          <div className="w-10"></div>
        </div>

        {/* 컨텐츠 영역 */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="w-full text-center">
            {/* 상단 카피 */}
            <div className="mb-8">
              <p className="text-xs font-semibold text-primary mb-1 tracking-[0.15em] uppercase">
                LIVEJOURNEY
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-white leading-snug">
                실시간 여행 현황 검증의 기준,<br />라이브저니
              </p>
            </div>

            {/* 소셜 로그인 버튼들 */}
            <div className="flex flex-col w-full gap-3 mb-3">
              {/* 카카오 로그인 */}
              <button
                onClick={() => handleSocialLogin('Kakao')}
                disabled={loading}
                className="flex cursor-pointer items-center justify-center gap-3 rounded-full h-12 px-6 bg-[#FEE500] text-[#000000] text-sm font-bold tracking-tight hover:bg-[#fdd835] active:bg-[#fbc02d] transition-all shadow-md disabled:opacity-50"
                style={{ touchAction: 'manipulation' }}
              >
                <span className="material-symbols-outlined text-base bg-black text-[#FEE500] rounded-full w-6 h-6 flex items-center justify-center">
                  chat
                </span>
                <span className="truncate">카카오로 시작하기</span>
              </button>

              {/* 구글 로그인 */}
              <button
                onClick={() => handleSocialLogin('Google')}
                disabled={loading}
                className="flex cursor-pointer items-center justify-center gap-3 rounded-full h-12 px-6 bg-white dark:bg-gray-900 text-[#1F1F1F] dark:text-white text-sm font-semibold tracking-tight border border-zinc-300 dark:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-gray-800 active:bg-zinc-100 transition-all shadow-sm disabled:opacity-50"
                style={{ touchAction: 'manipulation' }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span className="truncate">구글로 시작하기</span>
              </button>
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="mt-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-2.5 rounded-lg text-xs font-medium text-center">
                {error}
              </div>
            )}

            {/* 로딩 상태 */}
            {loading && (
              <div className="mt-3 flex items-center justify-center gap-2 text-primary dark:text-primary-soft">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                <span className="text-xs font-medium">로그인 중...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StartScreen;
