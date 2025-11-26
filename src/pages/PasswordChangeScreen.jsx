import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';

const PasswordChangeScreen = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSave = () => {
    // 유효성 검사
    if (!formData.currentPassword) {
      alert('현재 비밀번호를 입력해주세요.');
      return;
    }
    if (!formData.newPassword) {
      alert('새 비밀번호를 입력해주세요.');
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      alert('새 비밀번호가 일치하지 않습니다.');
      return;
    }
    if (formData.newPassword.length < 8) {
      alert('비밀번호는 8자 이상이어야 합니다.');
      return;
    }

    // TODO: API 호출하여 비밀번호 변경
    alert('비밀번호가 변경되었습니다!');
    navigate('/settings');
  };

  return (
    <div className="flex h-full w-full flex-col bg-background-light dark:bg-background-dark">
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {/* 헤더 */}
        <header className="sticky top-0 z-10 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm">
          <div className="flex items-center p-4 justify-between">
            <button 
              onClick={() => navigate('/settings')}
              className="flex size-12 shrink-0 items-center justify-center text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined text-2xl">arrow_back</span>
            </button>
            <h1 className="text-text-light dark:text-text-dark text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">
              비밀번호 변경
            </h1>
            <div className="size-12 shrink-0"></div>
          </div>
        </header>

        {/* 메인 콘텐츠 */}
        <main className="flex-grow flex flex-col px-4 pt-4">
          <div className="flex-grow pt-4 pb-6">
            <div className="flex flex-col gap-6">
              {/* 현재 비밀번호 */}
              <label className="flex flex-col min-w-40 flex-1">
                <p className="text-text-light dark:text-text-dark text-base font-medium leading-normal pb-2">
                  현재 비밀번호
                </p>
                <div className="flex w-full flex-1 items-stretch rounded-lg">
                  <input 
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-text-light dark:text-text-dark focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark focus:border-primary h-14 placeholder:text-text-secondary-light dark:placeholder:text-text-secondary-dark p-[15px] rounded-r-none border-r-0 pr-2 text-base font-normal leading-normal" 
                    placeholder="현재 비밀번호 입력" 
                    type={showPassword.current ? 'text' : 'password'}
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleInputChange}
                  />
                  <button 
                    onClick={() => togglePasswordVisibility('current')}
                    aria-label="Toggle password visibility" 
                    className="text-text-secondary-light dark:text-text-secondary-dark flex border border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark items-center justify-center pr-[15px] rounded-r-lg border-l-0 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <span className="material-symbols-outlined text-2xl">
                      {showPassword.current ? 'visibility' : 'visibility_off'}
                    </span>
                  </button>
                </div>
              </label>

              {/* 새 비밀번호 */}
              <label className="flex flex-col min-w-40 flex-1">
                <p className="text-text-light dark:text-text-dark text-base font-medium leading-normal pb-2">
                  새 비밀번호
                </p>
                <div className="flex w-full flex-1 items-stretch rounded-lg">
                  <input 
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-text-light dark:text-text-dark focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark focus:border-primary h-14 placeholder:text-text-secondary-light dark:placeholder:text-text-secondary-dark p-[15px] rounded-r-none border-r-0 pr-2 text-base font-normal leading-normal" 
                    placeholder="새 비밀번호 입력" 
                    type={showPassword.new ? 'text' : 'password'}
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                  />
                  <button 
                    onClick={() => togglePasswordVisibility('new')}
                    aria-label="Toggle password visibility" 
                    className="text-text-secondary-light dark:text-text-secondary-dark flex border border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark items-center justify-center pr-[15px] rounded-r-lg border-l-0 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <span className="material-symbols-outlined text-2xl">
                      {showPassword.new ? 'visibility' : 'visibility_off'}
                    </span>
                  </button>
                </div>
              </label>

              {/* 새 비밀번호 확인 */}
              <label className="flex flex-col min-w-40 flex-1">
                <p className="text-text-light dark:text-text-dark text-base font-medium leading-normal pb-2">
                  새 비밀번호 확인
                </p>
                <div className="flex w-full flex-1 items-stretch rounded-lg">
                  <input 
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-text-light dark:text-text-dark focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark focus:border-primary h-14 placeholder:text-text-secondary-light dark:placeholder:text-text-secondary-dark p-[15px] rounded-r-none border-r-0 pr-2 text-base font-normal leading-normal" 
                    placeholder="새 비밀번호 다시 입력" 
                    type={showPassword.confirm ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                  />
                  <button 
                    onClick={() => togglePasswordVisibility('confirm')}
                    aria-label="Toggle password visibility" 
                    className="text-text-secondary-light dark:text-text-secondary-dark flex border border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark items-center justify-center pr-[15px] rounded-r-lg border-l-0 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <span className="material-symbols-outlined text-2xl">
                      {showPassword.confirm ? 'visibility' : 'visibility_off'}
                    </span>
                  </button>
                </div>
              </label>
            </div>
          </div>

          {/* 저장 버튼 */}
          <div className="mt-auto pb-4">
            <button 
              onClick={handleSave}
              className="flex w-full items-center justify-center rounded-lg bg-[#FF7A00] h-14 text-white text-base font-bold leading-normal shadow-md hover:bg-opacity-90 transition-colors"
            >
              저장
            </button>
          </div>
        </main>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default PasswordChangeScreen;



