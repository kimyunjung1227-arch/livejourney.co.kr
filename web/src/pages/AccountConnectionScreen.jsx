import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';
import { useAuth } from '../contexts/AuthContext';

const AccountConnectionScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [showSocialLoginModal, setShowSocialLoginModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      console.error('소셜 로그인 실패:', error);
      setError(`${provider} 로그인에 실패했습니다.`);
      setLoading(false);
    }
  };

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
            onClick={() => setShowSocialLoginModal(true)}
            className="mt-2 h-12 w-full max-w-xs rounded-full bg-primary px-6 text-sm font-bold text-white shadow-md hover:bg-primary/90 transition-colors"
          >
            계정 연결하기
          </button>
        </div>
      </main>

      {/* 소셜 로그인 모달 */}
      {showSocialLoginModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowSocialLoginModal(false)}
        >
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
                onClick={() => setShowSocialLoginModal(false)}
                className="flex h-10 w-10 items-center justify-center text-text-primary-light dark:text-text-primary-dark hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
              <h2 className="text-base font-bold text-text-primary-light dark:text-text-primary-dark">계정 연결</h2>
              <div className="w-10"></div>
            </div>

            {/* 컨텐츠 영역 */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="w-full text-center">
                {/* 기능 안내 문구 */}
                <div className="mb-5 p-4 bg-primary/5 dark:bg-primary/10 rounded-lg border border-primary/20">
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    💡 <span className="font-semibold">계정을 연결하고</span> 뱃지, 기록 등<br />
                    다양한 기능들을 사용해보세요
                  </p>
                </div>

                {/* 소셜 로그인 버튼들 */}
                <div className="flex flex-col w-full gap-2 mb-3">
                  <button 
                    onClick={() => handleSocialLogin('Google')}
                    disabled={loading}
                    className="flex cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg h-11 px-4 bg-white text-[#1F1F1F] text-xs font-semibold leading-normal tracking-[0.015em] border border-zinc-300 dark:border-zinc-600 hover:bg-zinc-50 active:bg-zinc-100 transition-all shadow-sm disabled:opacity-50"
                    style={{ touchAction: 'manipulation' }}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span className="truncate">Google로 계속하기</span>
                  </button>

                  <button 
                    onClick={() => handleSocialLogin('Kakao')}
                    disabled={loading}
                    className="flex cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg h-11 px-4 bg-[#FEE500] text-[#000000] text-xs font-semibold leading-normal tracking-[0.015em] hover:bg-[#fdd835] active:bg-[#fbc02d] transition-all shadow-sm disabled:opacity-50"
                    style={{ touchAction: 'manipulation' }}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3zm5.907 8.06l1.47-1.424a.472.472 0 0 0-.656-.678l-1.928 1.866V9.282a.472.472 0 0 0-.944 0v2.557a.471.471 0 0 0 0 .222V13.5a.472.472 0 0 0 .944 0v-1.363l.427-.413 1.428 2.033a.472.472 0 1 0 .773-.543l-1.514-2.155zm-2.958 1.924h-1.46V9.297a.472.472 0 0 0-.943 0v4.159c0 .26.21.472.471.472h1.932a.472.472 0 1 0 0-.944zm-5.857-1.092l.696-1.707.638 1.707H9.092zm2.523.488l.002-.016a.469.469 0 0 0-.127-.32l-1.046-2.8a.69.69 0 0 0-.627-.474.69.69 0 0 0-.627.474l-1.149 2.79a.472.472 0 0 0 .874.338l.228-.546h2.013l.251.611a.472.472 0 1 0 .874-.338l-.002-.016.336-.103zm-4.055.418a.512.512 0 0 1-.234-.234.487.487 0 0 1-.046-.308v-3.168a.472.472 0 0 0-.944 0v3.168c0 .27.063.533.184.765a1.427 1.427 0 0 0 1.163.695c.26 0 .472-.212.472-.472a.472.472 0 0 0-.472-.472h-.123v.026z"/>
                    </svg>
                    <span className="truncate">카카오로 계속하기</span>
                  </button>

                  <button 
                    onClick={() => handleSocialLogin('Naver')}
                    disabled={loading}
                    className="flex cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg h-11 px-4 bg-[#03C75A] text-white text-xs font-semibold leading-normal tracking-[0.015em] hover:bg-[#02b350] active:bg-[#02a047] transition-all shadow-sm disabled:opacity-50"
                    style={{ touchAction: 'manipulation' }}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M16.273 12.845L7.376 0H0v24h7.726V11.156L16.624 24H24V0h-7.727v12.845z"/>
                    </svg>
                    <span className="truncate">네이버로 계속하기</span>
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
      )}

      <BottomNavigation />
    </div>
  );
};

export default AccountConnectionScreen;



