import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';

const AccountDeleteScreen = () => {
  const navigate = useNavigate();

  const [selectedReasons, setSelectedReasons] = useState([]);
  const [otherReason, setOtherReason] = useState('');

  const reasons = [
    { id: 1, text: '사용 빈도가 낮아요 / 더 이상 필요하지 않아요.' },
    { id: 2, text: '앱 사용이 불편해요.' },
    { id: 3, text: '원하는 기능이 부족해요.' },
    { id: 4, text: '콘텐츠/정보가 부족하거나 유용하지 않아요.' },
    { id: 5, text: '개인 정보 유출/보안 문제가 걱정돼요.' },
    { id: 6, text: '기타 (직접 입력)' }
  ];

  const handleReasonToggle = (reasonId) => {
    if (selectedReasons.includes(reasonId)) {
      setSelectedReasons(selectedReasons.filter(id => id !== reasonId));
    } else {
      setSelectedReasons([...selectedReasons, reasonId]);
    }
  };

  const handleNext = () => {
    if (selectedReasons.length === 0) {
      alert('탈퇴 이유를 하나 이상 선택해주세요.');
      return;
    }

    const isOtherSelected = selectedReasons.includes(6);
    if (isOtherSelected && !otherReason.trim()) {
      alert('기타 의견을 입력해주세요.');
      return;
    }

    // 최종 확인 화면으로 이동
    navigate('/account-delete/confirm', {
      state: { reasons: selectedReasons, otherReason }
    });
  };

  return (
    <div className="flex h-full w-full flex-col bg-background-light dark:bg-background-dark">
      {/* 헤더 */}
      <header className="flex-shrink-0 flex h-16 items-center justify-between border-b border-border-light bg-surface-light dark:border-border-dark dark:bg-surface-dark px-4">
        <button 
          onClick={() => navigate('/settings')}
          className="flex size-12 shrink-0 items-center justify-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined text-2xl text-content-light dark:text-content-dark">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold leading-tight tracking-[-0.015em] text-content-light dark:text-content-dark">
          계정 삭제
        </h1>
        <div className="flex size-12 shrink-0 items-center justify-end"></div>
      </header>

      {/* 메인 콘텐츠 - 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="flex flex-col bg-surface-light dark:bg-surface-dark">
          {/* 안내 메시지 */}
          <div className="px-6 pt-8 pb-4">
            <h2 className="text-lg font-bold text-content-light dark:text-content-dark">
              잠깐! 혹시 저희 앱에 아쉬운 점이 있으셨나요?
            </h2>
            <p className="mt-2 text-sm text-subtle-light dark:text-subtle-dark">
              고객님의 소중한 피드백은 더 나은 서비스를 만드는 데 큰 도움이 됩니다. 잠시 시간을 내어 탈퇴 이유를 알려주세요.
            </p>
          </div>

          {/* 구분선 */}
          <div className="h-2 bg-background-light dark:bg-background-dark"></div>

          {/* 탈퇴 이유 선택 */}
          <div className="px-6 pt-6 pb-4">
            <h3 className="text-base font-semibold text-content-light dark:text-content-dark">
              탈퇴하시는 이유를 선택해주세요.{' '}
              <span className="text-sm font-normal text-subtle-light dark:text-subtle-dark">
                (중복 선택 가능)
              </span>
            </h3>
          </div>

          {/* 체크박스 목록 */}
          <div className="flex flex-col gap-4 px-6 pb-6">
            {reasons.map((reason) => (
              <div key={reason.id}>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input 
                    className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary dark:bg-surface-subtle-dark dark:border-border-dark" 
                    type="checkbox"
                    checked={selectedReasons.includes(reason.id)}
                    onChange={() => handleReasonToggle(reason.id)}
                  />
                  <span className="text-base text-content-light dark:text-content-dark">
                    {reason.text}
                  </span>
                </label>
                {reason.id === 6 && selectedReasons.includes(6) && (
                  <textarea 
                    className="mt-3 w-full rounded-lg border border-border-light bg-surface-subtle-light p-3 text-sm text-content-light placeholder:text-subtle-light focus:border-primary focus:ring-1 focus:ring-primary dark:border-border-dark dark:bg-surface-subtle-dark dark:text-content-dark dark:placeholder:text-subtle-dark transition-all" 
                    placeholder="자세한 의견을 작성해주시면 서비스 개선에 큰 도움이 됩니다." 
                    rows="4"
                    value={otherReason}
                    onChange={(e) => setOtherReason(e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="flex-shrink-0 p-4 bg-surface-light dark:bg-surface-dark border-t border-border-light dark:border-border-dark">
        <button 
          onClick={handleNext}
          disabled={selectedReasons.length === 0}
          className={`w-full rounded-lg px-4 py-3.5 text-base font-bold transition-colors ${
            selectedReasons.length > 0
              ? 'bg-primary text-white hover:bg-primary/90 cursor-pointer'
              : 'bg-gray-300 text-white dark:bg-gray-600 dark:text-gray-400 cursor-not-allowed'
          }`}
        >
          다음 단계로 (계정 삭제 진행)
        </button>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default AccountDeleteScreen;

