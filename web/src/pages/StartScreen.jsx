import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LiveJourneyLogo from '../components/LiveJourneyLogo';

const StartScreen = () => {
  const navigate = useNavigate();
  const { login, signup, loginAsGuest, isAuthenticated } = useAuth();
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
    if (isAuthenticated) {
      navigate('/main', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSocialLogin = (provider) => {
    // 소셜 로그인은 백엔드 서버가 필요합니다
    alert('⚠️ 소셜 로그인은 현재 준비 중입니다.\n\n💡 "테스터 계정으로 바로 체험하기" 버튼을 눌러서\n모든 기능을 바로 사용해보세요!');
    return;
    
    // const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    // window.location.href = `${apiUrl}/api/auth/${provider.toLowerCase()}`;
  };

  const handleGuestLogin = () => {
    loginAsGuest();
    navigate('/main');
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

        <div className="flex-shrink-0 p-4 pt-2 pb-6 bg-background-light dark:bg-background-dark space-y-2">
          {/* 테스터 계정으로 바로 시작 버튼 */}
          <button
            onClick={handleGuestLogin}
            className="w-full h-11 text-sm font-bold rounded-xl shadow-lg transition-all bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-2xl active:scale-95"
            style={{ touchAction: 'manipulation' }}
          >
            ⚡ 테스터 계정으로 바로 시작
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading || !isFormValid()}
            className={`w-full h-11 text-sm font-bold rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all ${
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
    <div className="relative flex h-full w-full flex-col overflow-y-auto bg-background-light dark:bg-background-dark text-zinc-900 dark:text-zinc-50">
      <div className="flex flex-col items-center justify-start px-6 py-6 min-h-full pb-8">
        <div className="w-full max-w-sm text-center flex-1 flex flex-col justify-center">
          <div className="flex flex-col items-center justify-center mb-8">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-3">
              환영합니다!
            </h1>
            <p className="text-[#1c140d] dark:text-zinc-300 text-base font-normal leading-normal">
              가장 현명한 여행을 지금 바로 시작하세요.
            </p>
          </div>

          {/* 소셜 로그인 버튼들 */}
          <div className="flex flex-col w-full gap-2 mb-3">
            <button 
              onClick={() => handleSocialLogin('Google')}
              className="flex cursor-pointer items-center justify-center overflow-hidden rounded-xl h-12 px-5 bg-white text-[#1F1F1F] text-sm font-bold leading-normal tracking-[0.015em] border-2 border-zinc-300 dark:border-zinc-600 hover:bg-zinc-50 active:bg-zinc-100 transition-all shadow-md"
              style={{ touchAction: 'manipulation' }}
            >
              <span className="truncate">Google로 시작하기</span>
            </button>

            <button 
              onClick={() => handleSocialLogin('Kakao')}
              className="flex cursor-pointer items-center justify-center overflow-hidden rounded-xl h-12 px-5 bg-[#FEE500] text-[#000000] text-sm font-bold leading-normal tracking-[0.015em] hover:bg-[#fdd835] active:bg-[#fbc02d] transition-all shadow-sm"
              style={{ touchAction: 'manipulation' }}
            >
              <span className="truncate">KakaoTalk으로 시작하기</span>
            </button>

            <button 
              onClick={() => handleSocialLogin('Naver')}
              className="flex cursor-pointer items-center justify-center overflow-hidden rounded-xl h-12 px-5 bg-[#03C75A] text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-[#02b350] active:bg-[#02a047] transition-all shadow-sm"
              style={{ touchAction: 'manipulation' }}
            >
              <span className="truncate">Naver로 시작하기</span>
            </button>
          </div>

          <div className="flex items-center gap-4 my-3">
            <div className="flex-grow h-px bg-zinc-300 dark:bg-zinc-600"></div>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs font-medium leading-normal">또는</p>
            <div className="flex-grow h-px bg-zinc-300 dark:bg-zinc-600"></div>
          </div>

          {/* 이메일 가입 버튼 */}
          <div className="flex flex-col w-full gap-2">
            <button 
              onClick={handleEmailClick}
              className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl h-12 px-5 bg-white dark:bg-gray-800 text-primary dark:text-white text-sm font-bold leading-normal tracking-[0.015em] border-2 border-primary hover:bg-primary/5 active:bg-primary/10 transition-all shadow-md"
              style={{ touchAction: 'manipulation' }}
            >
              <span className="truncate">이메일로 가입/로그인</span>
            </button>

            {/* 테스터 유저 버튼 */}
            <button 
              onClick={handleGuestLogin}
              className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl h-14 px-5 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-base font-bold leading-normal tracking-[0.015em] hover:shadow-xl active:scale-95 transition-all shadow-lg mt-2"
              style={{ touchAction: 'manipulation' }}
            >
              <span className="material-symbols-outlined mr-2 text-xl">rocket_launch</span>
              <span className="truncate">테스터 계정으로 바로 체험하기</span>
            </button>
          </div>

          <div className="mt-4 text-center">
            <p className="text-zinc-500 dark:text-zinc-400 text-xs font-normal">
              💡 빠른 체험을 원하시면 "테스터 계정으로 바로 체험하기"를 눌러주세요!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StartScreen;
