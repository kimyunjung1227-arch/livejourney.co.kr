import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';

const FeedUpdateFrequencyScreen = () => {
  const navigate = useNavigate();
  const [selectedFrequency, setSelectedFrequency] = useState('30s'); // Default: 30초 (권장)

  const handleSave = () => {
    // TODO: 실제 백엔드 API 호출하여 업데이트 주기 설정 저장
    alert(`피드 업데이트 주기가 ${getFrequencyLabel(selectedFrequency)}로 설정되었습니다.`);
    navigate('/settings');
  };

  const getFrequencyLabel = (value) => {
    switch (value) {
      case '30s':
        return '30초 (권장)';
      case '1m':
        return '1분';
      case '5m':
        return '5분';
      case 'manual':
        return '수동 업데이트';
      default:
        return '';
    }
  };

  return (
    <div className="flex h-full w-full flex-col bg-background-light dark:bg-background-dark group/design-root">
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border-light bg-surface-light/80 dark:border-border-dark dark:bg-surface-dark/80 backdrop-blur-sm px-4">
        <button
          onClick={() => navigate('/settings')}
          className="flex size-12 shrink-0 items-center justify-center cursor-pointer text-content-light dark:text-content-dark hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined text-2xl">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold leading-tight tracking-[-0.015em] text-content-light dark:text-content-dark">실시간 피드 업데이트 주기</h1>
        <div className="flex size-12 shrink-0 items-center justify-end">
          <button
            onClick={handleSave}
            className="text-base font-bold text-primary hover:text-primary/80 transition-colors"
          >
            저장
          </button>
        </div>
      </header>

      <main className="flex-grow pb-24">
        <div className="flex flex-col">
          {/* Information Section */}
          <div className="bg-surface-subtle-light dark:bg-surface-subtle-dark p-4">
            <h2 className="text-sm font-bold leading-normal text-content-light dark:text-content-dark mb-1">설정 안내</h2>
            <p className="text-sm font-normal leading-normal text-subtle-light dark:text-subtle-dark">
              피드 업데이트 주기가 짧을수록 배터리 소모가 많아질 수 있습니다. 최적의 사용을 위해 '권장' 설정을 유지하는 것이 좋습니다.
            </p>
          </div>

          {/* Radio Options Section */}
          <div className="bg-surface-light dark:bg-surface-dark">
            <div className="px-4 pt-6 pb-2">
              <h2 className="text-sm font-medium leading-normal text-subtle-light dark:text-subtle-dark">주기 선택 옵션</h2>
            </div>

            <div className="flex flex-col" role="radiogroup">
              {/* 30초 (권장) */}
              <label
                className={`flex h-auto cursor-pointer items-start justify-between p-4 transition-colors ${
                  selectedFrequency === '30s' ? 'bg-primary/10 dark:bg-primary/20' : 'hover:bg-surface-subtle-light dark:hover:bg-surface-subtle-dark'
                }`}
                htmlFor="option1"
              >
                <div className="flex-grow pr-4">
                  <p className={`text-base leading-normal ${selectedFrequency === '30s' ? 'font-bold' : 'font-medium'} text-content-light dark:text-content-dark`}>
                    30초 (권장)
                  </p>
                  <p className="text-sm font-normal leading-normal text-subtle-light dark:text-subtle-dark mt-1">
                    가장 일반적인 설정으로, 실시간 정보와 배터리 효율의 균형을 맞춥니다.
                  </p>
                </div>
                <input
                  className="form-radio mt-1 size-5 shrink-0 border-gray-300 text-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-offset-gray-800"
                  id="option1"
                  name="update-frequency"
                  type="radio"
                  checked={selectedFrequency === '30s'}
                  onChange={() => setSelectedFrequency('30s')}
                />
              </label>

              {/* 1분 */}
              <label
                className={`flex h-auto cursor-pointer items-start justify-between p-4 transition-colors ${
                  selectedFrequency === '1m' ? 'bg-primary/10 dark:bg-primary/20' : 'hover:bg-surface-subtle-light dark:hover:bg-surface-subtle-dark'
                }`}
                htmlFor="option2"
              >
                <div className="flex-grow pr-4">
                  <p className={`text-base leading-normal ${selectedFrequency === '1m' ? 'font-bold' : 'font-medium'} text-content-light dark:text-content-dark`}>
                    1분
                  </p>
                  <p className="text-sm font-normal leading-normal text-subtle-light dark:text-subtle-dark mt-1">
                    배터리 소모를 줄이고 싶을 때 적합한 설정입니다.
                  </p>
                </div>
                <input
                  className="form-radio mt-1 size-5 shrink-0 border-gray-300 text-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-offset-gray-800"
                  id="option2"
                  name="update-frequency"
                  type="radio"
                  checked={selectedFrequency === '1m'}
                  onChange={() => setSelectedFrequency('1m')}
                />
              </label>

              {/* 5분 */}
              <label
                className={`flex h-auto cursor-pointer items-start justify-between p-4 transition-colors ${
                  selectedFrequency === '5m' ? 'bg-primary/10 dark:bg-primary/20' : 'hover:bg-surface-subtle-light dark:hover:bg-surface-subtle-dark'
                }`}
                htmlFor="option3"
              >
                <div className="flex-grow pr-4">
                  <p className={`text-base leading-normal ${selectedFrequency === '5m' ? 'font-bold' : 'font-medium'} text-content-light dark:text-content-dark`}>
                    5분
                  </p>
                  <p className="text-sm font-normal leading-normal text-subtle-light dark:text-subtle-dark mt-1">
                    중요한 업데이트만 간헐적으로 확인하고 싶을 때 사용합니다.
                  </p>
                </div>
                <input
                  className="form-radio mt-1 size-5 shrink-0 border-gray-300 text-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-offset-gray-800"
                  id="option3"
                  name="update-frequency"
                  type="radio"
                  checked={selectedFrequency === '5m'}
                  onChange={() => setSelectedFrequency('5m')}
                />
              </label>

              {/* 수동 업데이트 */}
              <label
                className={`flex h-auto cursor-pointer items-start justify-between p-4 transition-colors ${
                  selectedFrequency === 'manual' ? 'bg-primary/10 dark:bg-primary/20' : 'hover:bg-surface-subtle-light dark:hover:bg-surface-subtle-dark'
                }`}
                htmlFor="option4"
              >
                <div className="flex-grow pr-4">
                  <p className={`text-base leading-normal ${selectedFrequency === 'manual' ? 'font-bold' : 'font-medium'} text-content-light dark:text-content-dark`}>
                    수동 업데이트
                  </p>
                  <p className="text-sm font-normal leading-normal text-subtle-light dark:text-subtle-dark mt-1">
                    필요할 때만 직접 새로고침하여 데이터를 업데이트합니다.
                  </p>
                </div>
                <input
                  className="form-radio mt-1 size-5 shrink-0 border-gray-300 text-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-offset-gray-800"
                  id="option4"
                  name="update-frequency"
                  type="radio"
                  checked={selectedFrequency === 'manual'}
                  onChange={() => setSelectedFrequency('manual')}
                />
              </label>
            </div>
          </div>
        </div>
      </main>

      </div>

      <BottomNavigation />
    </div>
  );
};

export default FeedUpdateFrequencyScreen;



