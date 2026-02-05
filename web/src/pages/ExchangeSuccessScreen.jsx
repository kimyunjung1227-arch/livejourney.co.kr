import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';

const ExchangeSuccessScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const product = location.state?.product;

  useEffect(() => {
    // 직접 접근 방지 (교환 과정 없이 URL로 바로 접근)
    if (!product) {
      navigate('/points');
    }
  }, [product, navigate]);

  const handleGoToCoupons = () => {
    navigate('/coupons');
  };

  const handleGoHome = () => {
    navigate('/main');
  };

  if (!product) {
    return null;
  }

  return (
    <div className="flex h-screen w-full flex-col bg-white dark:bg-background-dark overflow-hidden">
      <div className="flex flex-1 flex-col justify-between p-6 overflow-y-auto overflow-x-hidden">
        {/* 성공 메시지 영역 */}
        <div className="flex flex-1 flex-col items-center justify-center pt-16">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <span className="material-symbols-outlined text-5xl text-primary" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 48" }}>
              check
            </span>
          </div>
          <h1 className="text-[#181411] dark:text-gray-100 text-[24px] font-bold leading-tight tracking-[-0.015em] text-center mb-3">
            상품 교환이 완료되었습니다!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-base font-normal leading-normal text-center">
            교환하신 쿠폰은 [프로필 &gt; 내 쿠폰함]에서 확인하실 수 있습니다.
          </p>
        </div>

        {/* 액션 버튼 영역 */}
        <div className="w-full space-y-3 pb-4">
          <button
            onClick={handleGoToCoupons}
            className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-14 px-5 bg-primary text-white text-lg font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 transition-colors"
          >
            <span className="truncate">내 쿠폰함 바로가기</span>
          </button>
          <button
            onClick={handleGoHome}
            className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-14 px-5 bg-transparent text-gray-500 dark:text-gray-400 text-base font-bold leading-normal tracking-[0.015em] hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <span className="truncate">홈으로 돌아가기</span>
          </button>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default ExchangeSuccessScreen;

