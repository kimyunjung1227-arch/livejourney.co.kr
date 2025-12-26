import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LiveJourneyLogo from '../components/LiveJourneyLogo';

const StartScreen = () => {
  const navigate = useNavigate();
  const { login, signup, isAuthenticated, testerLogin } = useAuth();
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isLogin, setIsLogin] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    username: ''
  });
  const [agreements, setAgreements] = useState({
    terms: false,
    privacy: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
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
        navigate('/main');
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
      console.error('소셜 로그인 실패:', error);
      setError(`${provider} 로그인에 실패했습니다.`);
      setLoading(false);
    }
  };

  const handleEmailClick = () => {
    setShowEmailForm(true);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    setLoading(true);
    setError('');

    try {
      let result;
      if (isLogin) {
        result = await login(formData.email, formData.password);
      } else {
        if (!formData.username) {
          setError('닉네임을 입력해주세요.');
          setLoading(false);
          return;
        }
        if (formData.password !== formData.passwordConfirm) {
          setError('비밀번호가 일치하지 않습니다.');
          setLoading(false);
          return;
        }
        if (!agreements.terms || !agreements.privacy) {
          setError('필수 약관에 동의해주세요.');
          setLoading(false);
          return;
        }
        result = await signup(formData.email, formData.password, formData.username);
      }

      if (result.success) {
        navigate('/main');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    if (isLogin) {
      return formData.email && formData.password;
    } else {
      return (
        formData.email &&
        formData.password &&
        formData.passwordConfirm &&
        formData.username &&
        agreements.terms &&
        agreements.privacy
      );
    }
  };

  // 이메일 가입/로그인 화면
  if (showEmailForm) {
    return (
      <div className="relative flex h-full w-full flex-col bg-background-light dark:bg-background-dark overflow-hidden">
        <div className="flex-shrink-0 flex items-center bg-background-light dark:bg-background-dark p-4 pb-2 justify-between">
          <button 
            onClick={() => setShowEmailForm(false)}
            className="text-text-light-primary dark:text-white flex h-12 w-12 shrink-0 items-center justify-start cursor-pointer"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
        </div>

        <h1 className="flex-shrink-0 text-text-light-primary dark:text-white tracking-tight text-2xl font-bold leading-tight px-4 text-left pb-2 pt-2">
          회원가입/로그인
        </h1>

        <div className="flex-shrink-0 flex px-4 py-2">
          <div className="flex h-12 flex-1 items-center justify-center rounded-full bg-[#E0E0E0]/50 dark:bg-white/10 p-1">
            <label className={`flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-full px-4 transition-all duration-300 ${
              !isLogin 
                ? 'bg-white dark:bg-background-dark shadow-md text-primary' 
                : 'text-text-light-secondary dark:text-gray-400'
            }`}>
              <span className="truncate text-sm font-bold">회원가입</span>
              <input 
                className="invisible w-0" 
                name="auth-mode" 
                type="radio" 
                checked={!isLogin}
                onChange={() => {
                  setIsLogin(false);
                  setError('');
                }}
              />
            </label>
            <label className={`flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-full px-4 transition-all duration-300 ${
              isLogin 
                ? 'bg-white dark:bg-background-dark shadow-md text-primary' 
                : 'text-text-light-secondary dark:text-gray-400'
            }`}>
              <span className="truncate text-sm font-bold">로그인</span>
              <input 
                className="invisible w-0" 
                name="auth-mode" 
                type="radio" 
                checked={isLogin}
                onChange={() => {
                  setIsLogin(true);
                  setError('');
                }}
              />
            </label>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 pt-3 pb-4">
          <div className="space-y-3">
            <label className="flex flex-col">
              <p className="text-text-light-primary dark:text-white text-sm font-semibold leading-normal pb-1.5">
                이메일
              </p>
              <div className="relative">
                <input
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-text-light-primary dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary border-2 border-border-light dark:border-gray-600 bg-background-light dark:bg-background-dark h-11 placeholder:text-text-light-secondary dark:placeholder:text-gray-500 px-4 pr-12 text-sm font-normal leading-normal transition-colors"
                  placeholder="이메일 주소를 입력해주세요"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-text-light-secondary dark:text-gray-500 pointer-events-none" style={{ fontSize: '20px' }}>
                  mail
                </span>
              </div>
            </label>

            <label className="flex flex-col">
              <p className="text-text-light-primary dark:text-white text-sm font-semibold leading-normal pb-1.5">
                비밀번호
              </p>
              <div className="relative">
                <input
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-text-light-primary dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary border-2 border-border-light dark:border-gray-600 bg-background-light dark:bg-background-dark h-11 placeholder:text-text-light-secondary dark:placeholder:text-gray-500 px-4 pr-12 text-sm font-normal leading-normal transition-colors"
                  placeholder="영문, 숫자 포함 8자 이상"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light-secondary dark:text-gray-500 hover:text-text-light-primary dark:hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                    {showPassword ? 'visibility' : 'visibility_off'}
                  </span>
                </button>
              </div>
            </label>

            {!isLogin && (
              <>
                <label className="flex flex-col">
                  <p className="text-text-light-primary dark:text-white text-sm font-semibold leading-normal pb-1.5">
                    비밀번호 확인
                  </p>
                  <div className="relative">
                    <input
                      className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-text-light-primary dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary border-2 border-border-light dark:border-gray-600 bg-background-light dark:bg-background-dark h-11 placeholder:text-text-light-secondary dark:placeholder:text-gray-500 px-4 pr-12 text-sm font-normal leading-normal transition-colors"
                      placeholder="비밀번호를 다시 입력해주세요"
                      type={showPasswordConfirm ? "text" : "password"}
                      name="passwordConfirm"
                      value={formData.passwordConfirm}
                      onChange={handleChange}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light-secondary dark:text-gray-500 hover:text-text-light-primary dark:hover:text-white transition-colors"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                        {showPasswordConfirm ? 'visibility' : 'visibility_off'}
                      </span>
                    </button>
                  </div>
                </label>

                <label className="flex flex-col">
                  <p className="text-text-light-primary dark:text-white text-sm font-semibold leading-normal pb-1.5">
                    닉네임
                  </p>
                  <div className="relative">
                    <input
                      className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-text-light-primary dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary border-2 border-border-light dark:border-gray-600 bg-background-light dark:bg-background-dark h-11 placeholder:text-text-light-secondary dark:placeholder:text-gray-500 px-4 pr-12 text-sm font-normal leading-normal transition-colors"
                      placeholder="닉네임을 입력해주세요"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      required
                    />
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-text-light-secondary dark:text-gray-500 pointer-events-none" style={{ fontSize: '20px' }}>
                      person
                    </span>
                  </div>
                </label>
              </>
            )}
          </div>

          {!isLogin && (
            <div className="space-y-2.5 mt-4">
              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  className="form-checkbox h-4 w-4 rounded border-border-light dark:border-gray-600 text-primary focus:ring-primary bg-background-light dark:bg-background-dark"
                  type="checkbox"
                  checked={agreements.terms}
                  onChange={(e) => setAgreements({ ...agreements, terms: e.target.checked })}
                />
                <span className="text-text-light-primary dark:text-white text-xs font-medium">
                  이용약관 동의 (필수)
                </span>
              </label>
              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  className="form-checkbox h-4 w-4 rounded border-border-light dark:border-gray-600 text-primary focus:ring-primary bg-background-light dark:bg-background-dark"
                  type="checkbox"
                  checked={agreements.privacy}
                  onChange={(e) => setAgreements({ ...agreements, privacy: e.target.checked })}
                />
                <span className="text-text-light-primary dark:text-white text-xs font-medium">
                  개인정보 처리방침 동의 (필수)
                </span>
              </label>
            </div>
          )}

          {error && (
            <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 p-3 rounded-xl text-sm font-medium mt-3">
              {error}
            </div>
          )}
        </div>

        <div className="flex-shrink-0 p-4 pt-2 pb-6 bg-background-light dark:bg-background-dark">
          <button
            onClick={handleSubmit}
            disabled={loading || !isFormValid()}
            className={`w-full h-12 text-sm font-bold rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all ${
              loading || !isFormValid()
                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                : 'bg-primary text-white hover:bg-primary/90 active:scale-98'
            }`}
          >
            {loading ? '처리 중...' : isLogin ? '로그인' : '회원가입'}
          </button>
        </div>
      </div>
    );
  }

  // 메인 시작 화면
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 dark:bg-black/60 z-50 p-4">
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
            onClick={() => navigate(-1)}
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
            {/* 기능 안내 문구 */}
            <div className="mb-5 p-4 bg-primary/5 dark:bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                💡 <span className="font-semibold">계정을 연결하고</span> 뱃지, 기록 등<br />
                다양한 기능들을 사용해보세요
            </p>
          </div>

            {/* 소셜 로그인 버튼들 - 크기 절반으로 축소 */}
            <div className="flex flex-col w-full gap-2 mb-3">
            {/* 테스터 계정 버튼 */}
            <button 
              onClick={handleTesterLogin}
              disabled={loading}
              className="flex cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg h-11 px-4 bg-gradient-to-r from-primary to-primary-dark text-white text-xs font-semibold leading-normal tracking-[0.015em] hover:from-primary-dark hover:to-primary-dark active:scale-95 transition-all shadow-md disabled:opacity-50"
              style={{ touchAction: 'manipulation' }}
            >
              <span className="material-symbols-outlined text-base">bug_report</span>
              <span className="truncate">테스터 계정으로 시작하기</span>
            </button>

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

          <div className="flex items-center gap-3 my-2">
            <div className="flex-grow h-px bg-zinc-300 dark:bg-zinc-600"></div>
            <p className="text-zinc-500 dark:text-zinc-400 text-[10px] font-medium leading-normal">또는</p>
            <div className="flex-grow h-px bg-zinc-300 dark:bg-zinc-600"></div>
          </div>

          {/* 이메일 가입 버튼 */}
          <div className="flex flex-col w-full">
            <button 
              onClick={handleEmailClick}
              disabled={loading}
              className="flex w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg h-10 px-4 bg-white dark:bg-gray-800 text-primary dark:text-white text-xs font-semibold leading-normal tracking-[0.015em] border border-primary hover:bg-primary/5 active:bg-primary/10 transition-all shadow-sm disabled:opacity-50"
              style={{ touchAction: 'manipulation' }}
            >
              <span className="material-symbols-outlined text-base">mail</span>
              <span className="truncate">이메일로 가입/로그인</span>
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
