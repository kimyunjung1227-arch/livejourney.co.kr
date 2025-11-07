import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PointsProductDetailScreen = () => {
  const navigate = useNavigate();
  const { productId } = useParams();
  const { user } = useAuth();
  const [showExchangeModal, setShowExchangeModal] = useState(false);

  // 전체 상품 데이터
  const allProducts = {
    1: {
      id: 1,
      name: '스타벅스 아메리카노',
      points: 4500,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCSTjlsL0GiZSU7Yql8Hw-E098mGrnKE0LMU_I4H7Ig9v9JC57wngQYV9YGVN7w8OTXnxj03Z0k3U0auq5XY9xPW5qOocKlNq5poM2EUO7eR4rG_jPry8vuw8l0vDanRFnQxUZm25_z7iQVJslSdrjJ1IBX2YltdEZLUB1g0fjip1MPzWWbTwzwrJmZFE1UxTCt60Ty2cDdHhHNwOZ-ayc5n9n4vO6ld4fQS3iScXiGZX65Uy3wkWJeYQMLD0PLoNKEbFTfY6XC_OO2',
      description: '스타벅스만의 깔끔하고 풍부한 맛의 아메리카노입니다. 언제 어디서나 간편하게 즐겨보세요.',
      type: '모바일 쿠폰',
      validity: '발급일로부터 90일',
      usage: '전국 스타벅스 매장 (일부 매장 제외)',
      warnings: [
        '일부 특수 매장(백화점, 공항, 리조트 등)에서는 사용이 불가능할 수 있습니다.',
        '현금으로 교환 및 잔액 환불이 불가능합니다.',
        '타 쿠폰 및 할인 혜택과 중복 적용되지 않을 수 있습니다.',
        '유효기간 연장은 불가능하오니 기간 내에 사용해주시기 바랍니다.'
      ]
    },
    2: {
      id: 2,
      name: 'Coffee Bean Gift Card',
      points: 5000,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBtsft8q7KBLYmmUczE-67gu_TfCWiqkWiJ5vG0vUlWC4kINvuSXEIg7PGpT7MDpXWwwq6TitAAqC8KMoTbr-LMB5WAMyO5T9Crh5nwFa8dg8FifjRn6slV2HjC8e287kO6oum-uOwS78wlFy6KeVzKauFg3GHUxbY_2Xgd2qsp2FHOwaOimqRs7JhBLxxHuT-OJejov9ntuw9V7PzoRNBlGaUVBo4j-mF8Xl-CVBHfY8PM9VD6hRhy9_lp9GUdgBKQQSuRlmdcWN8',
      description: '커피빈에서 다양한 음료와 푸드를 즐길 수 있는 기프트 카드입니다.',
      type: '기프트 카드',
      validity: '발급일로부터 1년',
      usage: '전국 커피빈 매장',
      warnings: [
        '잔액 환불이 불가능합니다.',
        '타 할인 혜택과 중복 적용되지 않을 수 있습니다.',
        '유효기간 경과 시 사용이 불가능합니다.'
      ]
    },
    3: {
      id: 3,
      name: 'Flight Discount Voucher',
      points: 10000,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDVFPAPt_XM5FWnpecep25NhzH7ldRk7ZMYgA3xoyGJtCLR4xAII1ZrM1b77CibimwBojK-dEn9KhIqtUW3dB6UOZKO3-GQ-yFA3ozjoyAfuhcAN32aFfANEzs1-WObp94w52dufSrIX0JXZFP7M80-EbqD52suVqgB0GLnnuK4NGptH1i9G3vOmVn-NIO65f8Z3xiflVUWhwIH2QkTA_QEJjk-P8Kjppnm32ZJcVP6ZkvjPfSOj1Or4I-Kj1TllZW4k0SzgOpM8II',
      description: '항공권 예약 시 사용할 수 있는 10% 할인 바우처입니다.',
      type: '할인 쿠폰',
      validity: '발급일로부터 6개월',
      usage: '온라인 항공권 예약 사이트',
      warnings: [
        '최소 구매 금액 제한이 있을 수 있습니다.',
        '일부 노선 및 좌석 등급에서는 사용이 제한될 수 있습니다.',
        '성수기 및 연휴 기간에는 사용이 불가능할 수 있습니다.'
      ]
    },
    5: {
      id: 5,
      name: 'Hotel Stay Coupon',
      points: 15000,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBGuE5kezwpm0yOgQOewEyiQkEpXOZn85U09hw7d5mbsbwZNPbuGCr_qSySwaAJZPwLB4OqPKqlE9MN3DQQoBwuBkocPAtaMCxet6OmrGMKOnylLSFl4I3G82ZJVtx2oY-yeMFwiK8_rQ3Khwp9Xi6IBO7C9ZZ1LnRMweSeauLG21TbC1vigkKjSXpd0g93b6yLPayUdSzFCpoxkAkWmom-Q8l2-qnGVVqtlqUkFLTJ0_av2QwyeiKf5M67BjXpFxWCQ029VKDF-Oo',
      description: '제휴 호텔에서 사용 가능한 1박 숙박 쿠폰입니다.',
      type: '숙박 쿠폰',
      validity: '발급일로부터 1년',
      usage: '제휴 호텔 전국 지점',
      warnings: [
        '예약 가능 여부는 호텔 사정에 따라 달라질 수 있습니다.',
        '성수기 및 공휴일에는 사용이 제한될 수 있습니다.',
        '추가 인원 및 조식은 별도 비용이 발생할 수 있습니다.'
      ]
    }
  };

  const product = allProducts[productId] || allProducts[1];

  const handleExchange = () => {
    setShowExchangeModal(true);
  };

  const confirmExchange = () => {
    const currentPoints = user?.points || 12500;
    if (currentPoints < product.points) {
      alert(`포인트가 부족합니다.\n\n필요 포인트: ${product.points.toLocaleString()}P\n보유 포인트: ${currentPoints.toLocaleString()}P`);
      setShowExchangeModal(false);
    } else {
      // 교환 성공 - 성공 화면으로 이동
      navigate('/exchange-success', { state: { product: product } });
    }
  };

  const cancelExchange = () => {
    setShowExchangeModal(false);
  };

  return (
    <div className="flex h-full w-full flex-col bg-background-light dark:bg-background-dark">
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {/* 상단 앱 바 */}
        <header className="sticky top-0 z-10 flex items-center border-b border-gray-200 dark:border-gray-800 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm p-4 pb-2 justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="text-gray-800 dark:text-gray-200 flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 className="text-gray-900 dark:text-gray-100 text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-10">
          상품 상세
        </h2>
      </header>

        {/* 메인 콘텐츠 */}
        <main className="w-full flex-1 pb-4">
        {/* 상품 개요 */}
        <section className="flex w-full flex-col items-center">
          <div className="w-full max-w-lg aspect-square p-4">
            <div 
              className="w-full h-full bg-center bg-no-repeat bg-cover rounded-xl"
              style={{ backgroundImage: `url("${product.image}")` }}
            ></div>
          </div>
          <div className="w-full px-4 text-center">
            <h1 className="text-gray-900 dark:text-gray-100 tracking-tight text-3xl font-bold leading-tight pt-2 pb-2">
              {product.name}
            </h1>
            <p className="text-primary text-2xl font-bold leading-tight tracking-[-0.015em]">
              {product.points.toLocaleString()} P
            </p>
          </div>
        </section>

        <div className="h-4 bg-gray-100 dark:bg-gray-900/50 my-8"></div>

        {/* 상세 설명 및 유의사항 */}
        <section className="w-full px-4">
          <h2 className="text-gray-900 dark:text-gray-100 text-xl font-bold leading-tight tracking-[-0.015em] pb-4">
            상세 설명 및 유의사항
          </h2>

          {/* 상품 정보 */}
          <div className="mb-6">
            <h3 className="text-gray-800 dark:text-gray-200 text-lg font-bold mb-3">상품 정보</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4 text-base">
              {product.description}
            </p>
            <ul className="space-y-2 text-gray-700 dark:text-gray-300 text-base">
              <li className="flex items-start">
                <span className="w-24 shrink-0 font-semibold text-gray-500 dark:text-gray-400">상품 종류:</span>
                <span>{product.type}</span>
              </li>
              <li className="flex items-start">
                <span className="w-24 shrink-0 font-semibold text-gray-500 dark:text-gray-400">유효 기간:</span>
                <span>{product.validity}</span>
              </li>
              <li className="flex items-start">
                <span className="w-24 shrink-0 font-semibold text-gray-500 dark:text-gray-400">사용처:</span>
                <span>{product.usage}</span>
              </li>
            </ul>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-800 my-6"></div>

          {/* 사용 전 유의사항 (아코디언) */}
          <details className="group mb-6">
            <summary className="flex cursor-pointer list-none items-center justify-between py-2">
              <h3 className="text-gray-800 dark:text-gray-200 text-lg font-bold">사용 전 유의사항</h3>
              <div className="text-gray-500 transition-transform duration-300 group-open:rotate-180">
                <span className="material-symbols-outlined">expand_more</span>
              </div>
            </summary>
            <div className="text-gray-600 dark:text-gray-400 text-sm mt-2 space-y-2">
              {product.warnings.map((warning, index) => (
                <p key={index}>• {warning}</p>
              ))}
            </div>
          </details>

          <div className="border-t border-gray-200 dark:border-gray-800 my-6"></div>

          {/* 교환 후 안내 */}
          <div>
            <h3 className="text-gray-800 dark:text-gray-200 text-lg font-bold mb-3">교환 후 안내</h3>
            <p className="text-gray-600 dark:text-gray-400 text-base">
              포인트 교환이 완료되면 앱 내 '내 쿠폰함'에서 모바일 쿠폰을 확인하실 수 있습니다. 매장 결제 시 바코드를 제시해주세요.
            </p>
          </div>
        </section>
        </main>
      </div>

      {/* 하단 고정 버튼 */}
      <footer className="flex-shrink-0 bg-background-light dark:bg-background-dark pt-3 pb-3 px-4 border-t border-border-light dark:border-border-dark">
        <button 
          onClick={handleExchange}
          className="w-full h-14 bg-primary text-white text-lg font-bold rounded-xl shadow-lg hover:bg-primary/90 transition-colors"
        >
          {product.points.toLocaleString()} P로 교환하기
        </button>
      </footer>

      {/* 교환 확인 모달 */}
      {showExchangeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 p-4">
          <div className="w-full max-w-sm transform flex-col rounded-xl bg-white dark:bg-[#221910] p-6 shadow-2xl transition-all">
            {/* 제목 */}
            <h1 className="text-[#181411] dark:text-gray-100 text-[22px] font-bold leading-tight tracking-[-0.015em] text-center pb-3 pt-1">
              교환 확인
            </h1>
            
            {/* 내용 */}
            <p className="text-gray-700 dark:text-gray-300 text-base font-normal leading-normal pb-6 pt-1 px-4 text-center">
              선택하신 상품을 <strong className="font-bold text-primary">{product.points.toLocaleString()} P</strong>로 교환하시겠습니까? 교환 후에는 취소 및 환불이 불가능합니다.
            </p>
            
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

export default PointsProductDetailScreen;

