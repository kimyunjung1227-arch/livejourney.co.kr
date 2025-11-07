import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import BottomNavigation from '../components/BottomNavigation';

const AccountDeleteConfirmScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const reasons = location.state?.reasons || [];
  const [agreed, setAgreed] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleDeleteAccount = () => {
    if (!agreed) {
      alert('안내 사항을 확인하고 동의해주세요.');
      return;
    }
    if (!password) {
      alert('비밀번호를 입력해주세요.');
      return;
    }

    // 최종 확인
    if (confirm('정말로 계정을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.')) {
      // TODO: 실제 탈퇴 API 호출
      alert('계정 삭제가 완료되었습니다.\n\n그동안 LiveJourney를 이용해주셔서 감사합니다.');
      logout();
      navigate('/');
    }
  };

  return (
    <div className="flex h-full w-full flex-col bg-background-light dark:bg-background-dark">
      {/* 헤더 */}
      <header className="flex-shrink-0 flex h-16 items-center justify-between border-b border-border-light bg-surface-light dark:border-border-dark dark:bg-surface-dark px-4">
        <button 
          onClick={() => navigate('/account-delete')}
          className="flex size-12 shrink-0 items-center justify-start cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined text-content-light dark:text-content-dark" style={{ fontSize: '24px' }}>
            arrow_back
          </span>
        </button>
        <h1 className="text-lg font-bold leading-tight tracking-[-0.015em] text-content-light dark:text-content-dark">
          계정 삭제 최종 확인
        </h1>
        <div className="flex size-12 shrink-0 items-center justify-end"></div>
      </header>

      {/* 메인 콘텐츠 - 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="flex flex-col bg-surface-light dark:bg-surface-dark">
          {/* 주의 사항 */}
          <div className="px-6 pt-8 pb-6">
            <h2 className="text-lg font-bold text-red-600 dark:text-red-500">
              계정 삭제 전, 반드시 확인해주세요.
            </h2>
            <ul className="mt-4 flex flex-col gap-3">
              <li className="flex items-start">
                <span className="mr-2 mt-1 block h-1 w-1 shrink-0 rounded-full bg-subtle-light dark:bg-subtle-dark"></span>
                <p className="text-sm text-subtle-light dark:text-subtle-dark">
                  탈퇴 시, 고객님의 모든 활동 정보 (작성한 리뷰, 업로드한 사진, 획득한 뱃지 등)가 영구적으로 삭제되며 복구할 수 없습니다.
                </p>
              </li>
              <li className="flex items-start">
                <span className="mr-2 mt-1 block h-1 w-1 shrink-0 rounded-full bg-subtle-light dark:bg-subtle-dark"></span>
                <p className="text-sm text-subtle-light dark:text-subtle-dark">
                  계정 내 보유 포인트 ({user?.points || 2000} P)는 탈퇴와 동시에 소멸됩니다.
                </p>
              </li>
              <li className="flex items-start">
                <span className="mr-2 mt-1 block h-1 w-1 shrink-0 rounded-full bg-subtle-light dark:bg-subtle-dark"></span>
                <p className="text-sm text-subtle-light dark:text-subtle-dark">
                  탈퇴 후 30일 동안은 동일 계정으로 재가입이 제한됩니다.
                </p>
              </li>
            </ul>
          </div>

          {/* 구분선 */}
          <div className="h-2 bg-background-light dark:bg-background-dark"></div>

          {/* 동의 체크박스 */}
          <div className="px-6 pt-6">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input 
                className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary dark:bg-surface-subtle-dark dark:border-border-dark" 
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <span className="text-base font-medium text-content-light dark:text-content-dark">
                안내 사항을 모두 확인하였으며, 계정 삭제에 동의합니다.
              </span>
            </label>
          </div>

          {/* 구분선 */}
          <div className="h-2 bg-background-light dark:bg-background-dark"></div>

          {/* 비밀번호 확인 */}
          <div className="px-6 pt-6 pb-8">
            <p className="text-sm text-content-light dark:text-content-dark">
              안전한 탈퇴를 위해 비밀번호를 다시 한 번 입력해주세요.
            </p>
            <div className="relative mt-4">
              <label 
                className="text-xs font-medium text-subtle-light dark:text-subtle-dark" 
                htmlFor="password"
              >
                비밀번호 확인
              </label>
              <div className="relative">
                <input 
                  className="mt-1 block w-full rounded-lg border border-border-light bg-surface-subtle-light px-4 py-3 pr-12 text-base text-content-light placeholder:text-subtle-light focus:border-primary focus:ring-1 focus:ring-primary dark:border-border-dark dark:bg-surface-subtle-dark dark:text-content-dark dark:placeholder:text-subtle-dark transition-all" 
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="현재 비밀번호를 입력해주세요."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button 
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded-r-lg transition-colors"
                >
                  <span className="material-symbols-outlined text-subtle-light dark:text-subtle-dark">
                    {showPassword ? 'visibility' : 'visibility_off'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="flex-shrink-0 p-4 bg-surface-light dark:bg-surface-dark border-t border-border-light dark:border-border-dark">
        <button 
          onClick={handleDeleteAccount}
          disabled={!agreed || !password}
          className={`w-full rounded-lg px-4 py-3.5 text-base font-bold transition-colors ${
            agreed && password
              ? 'bg-red-600 text-white hover:bg-red-700 cursor-pointer'
              : 'bg-gray-300 text-white dark:bg-gray-600 dark:text-gray-400 cursor-not-allowed'
          }`}
        >
          계정 삭제
        </button>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default AccountDeleteConfirmScreen;



