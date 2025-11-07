import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import BottomNavigation from '../components/BottomNavigation';

const PointsCategoryScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [selectedProduct, setSelectedProduct] = useState(null);

  // 라우터에서 전달받은 카테고리 정보와 상품 목록
  const { category, products } = location.state || {};

  // 데이터가 없으면 포인트 샵으로 이동
  if (!category || !products) {
    navigate('/points/shop');
    return null;
  }

  const handleExchange = (product) => {
    setSelectedProduct(product);
  };

  const confirmExchange = () => {
    const currentPoints = user?.points || 12500;
    if (currentPoints < selectedProduct.points) {
      alert(`포인트가 부족합니다.\n\n필요한 금액: ${selectedProduct.points.toLocaleString()}원 (${selectedProduct.points.toLocaleString()}P)\n보유 포인트: ${currentPoints.toLocaleString()}P`);
      setSelectedProduct(null);
    } else {
      // 교환 성공 - 성공 화면으로 이동
      navigate('/exchange-success', { state: { product: selectedProduct } });
    }
  };

  const cancelExchange = () => {
    setSelectedProduct(null);
  };

  return (
    <div className="flex h-full w-full flex-col bg-background-light dark:bg-background-dark">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 flex flex-col bg-background-light dark:bg-background-dark shadow-sm flex-shrink-0">
        <div className="flex items-center p-4 pb-3 justify-between">
          <button 
            onClick={() => navigate('/points/shop')}
            className="flex size-12 shrink-0 items-center justify-center text-zinc-900 dark:text-zinc-50 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <span className="text-2xl">←</span>
          </button>
          <div className="flex-1 flex items-center justify-center gap-2 pr-12">
            <span className="text-2xl">{category.icon}</span>
            <h2 className="text-lg font-bold leading-tight tracking-[-0.015em] text-zinc-900 dark:text-zinc-50">
              {category.name}
            </h2>
          </div>
        </div>

        {/* 보유 포인트 */}
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between rounded-lg bg-white dark:bg-zinc-800 p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                보유 포인트
              </p>
              <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                1P = 1원
              </span>
            </div>
            <p className="text-2xl font-extrabold text-primary">
              {user?.points?.toLocaleString() || '12,500'} P
            </p>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 - 상품 목록 */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden pb-20">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              총 <strong className="text-primary font-bold">{products.length}개</strong>의 상품이 있습니다
            </p>
          </div>

          {/* 2열 그리드 - 상품 목록 */}
          <div className="grid grid-cols-2 gap-3">
            {products.map((product) => (
              <div 
                key={product.id} 
                className="flex flex-col rounded-xl bg-white dark:bg-zinc-800 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-transparent hover:border-primary/20"
              >
                {/* 상품 이미지 */}
                <div
                  className="w-full bg-center bg-no-repeat aspect-square bg-cover relative group"
                  style={{ backgroundImage: `url("${product.image}")` }}
                >
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300"></div>
                </div>
                
                {/* 상품 정보 */}
                <div className="p-3 flex flex-col flex-grow gap-2">
                  <p className="text-zinc-900 dark:text-zinc-50 text-sm font-medium leading-normal line-clamp-2 min-h-[2.5rem]">
                    {product.name}
                  </p>
                  
                  {/* 가격 표시 - 원화와 포인트 */}
                  <div className="flex flex-col gap-0.5">
                    <p className="text-zinc-900 dark:text-zinc-50 text-lg font-extrabold">
                      {product.points.toLocaleString()}원
                    </p>
                    <p className="text-primary text-xs font-bold">
                      {product.points.toLocaleString()}P
                    </p>
                  </div>

                  {/* 교환하기 버튼 */}
                  <button 
                    onClick={() => handleExchange(product)}
                    className="mt-auto w-full rounded-lg bg-primary text-white py-2.5 text-sm font-bold transition-all hover:bg-primary/90 active:scale-95 shadow-sm hover:shadow-md"
                  >
                    교환하기
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <BottomNavigation />

      {/* 교환 확인 모달 */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 p-4">
          <div className="w-full max-w-sm transform flex-col rounded-xl bg-white dark:bg-[#221910] p-6 shadow-2xl transition-all">
            {/* 제목 */}
            <h1 className="text-[#181411] dark:text-gray-100 text-[22px] font-bold leading-tight tracking-[-0.015em] text-center pb-3 pt-1">
              상품 교환 확인
            </h1>
            
            {/* 내용 */}
            <div className="flex flex-col gap-4 pb-6 pt-2">
              <div className="flex flex-col gap-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">
                  선택한 상품
                </p>
                <p className="text-gray-900 dark:text-gray-100 text-base font-bold">
                  {selectedProduct.name}
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-primary text-2xl font-extrabold">
                    {selectedProduct.points.toLocaleString()}원
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                    ({selectedProduct.points.toLocaleString()}P)
                  </p>
                </div>
              </div>
              
              <p className="text-gray-700 dark:text-gray-300 text-sm font-normal leading-relaxed px-2 text-center">
                💎 <strong className="font-bold">1P = 1원</strong>의 가치로 교환됩니다<br/>
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 inline-block">교환 후에는 취소 및 환불이 불가능합니다</span>
              </p>
            </div>
            
            {/* 버튼 그룹 */}
            <div className="flex w-full flex-row gap-3">
              <button 
                onClick={cancelExchange}
                className="flex flex-1 min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-gray-200 dark:bg-gray-700 text-[#181411] dark:text-gray-200 text-base font-bold leading-normal tracking-[0.015em] hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                <span className="truncate">취소</span>
              </button>
              <button 
                onClick={confirmExchange}
                className="flex flex-1 min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-primary text-white text-base font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 transition-colors"
              >
                <span className="truncate">교환하기</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PointsCategoryScreen;


