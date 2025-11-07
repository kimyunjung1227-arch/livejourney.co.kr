import React from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';

const PointsUsageGuideScreen = () => {
  const navigate = useNavigate();

  // 상품 데이터 (포인트 샵과 동일)
  const products = {
    food: [
      { id: 1, name: '스타벅스 아메리카노', points: 4500 },
      { id: 2, name: '커피빈 기프트카드', points: 5000 },
      { id: 3, name: '투썸플레이스 케이크', points: 6000 },
      { id: 4, name: '빽다방 음료 쿠폰', points: 3500 }
    ],
    convenience: [
      { id: 5, name: 'GS25 모바일상품권 5천원', points: 5000 },
      { id: 6, name: 'CU 모바일쿠폰 1만원', points: 10000 },
      { id: 7, name: '세븐일레븐 3천원권', points: 3000 },
      { id: 8, name: '이마트24 5천원권', points: 5000 }
    ],
    bakery: [
      { id: 9, name: '파리바게뜨 5천원권', points: 5000 },
      { id: 10, name: '뚜레쥬르 3천원권', points: 3000 }
    ],
    movie: [
      { id: 11, name: 'CGV 영화 관람권', points: 12000 },
      { id: 12, name: '메가박스 관람권', points: 11000 },
      { id: 13, name: '롯데시네마 관람권', points: 12000 },
      { id: 14, name: '롯데시네마 팝콘세트', points: 8000 }
    ],
    flight: [
      { id: 15, name: '항공권 할인 쿠폰', points: 10000 },
      { id: 16, name: '공항 라운지 이용권', points: 7500 },
      { id: 17, name: '제주항공 5만원 할인', points: 15000 },
      { id: 18, name: '진에어 3만원 쿠폰', points: 10000 }
    ],
    accommodation: [
      { id: 19, name: '호텔 숙박권', points: 15000 },
      { id: 20, name: '면세점 상품권', points: 3000 },
      { id: 21, name: '펜션 숙박권 10만원', points: 30000 },
      { id: 22, name: '에어비앤비 5만원권', points: 20000 }
    ],
    giftcard: [
      { id: 23, name: '컬쳐랜드 1만원권', points: 10000 },
      { id: 24, name: '해피머니 상품권 5천원', points: 5000 },
      { id: 25, name: '북앤라이프 1만원권', points: 10000 },
      { id: 26, name: '문화상품권 5천원', points: 5000 }
    ],
    transport: [
      { id: 27, name: '카카오택시 1만원권', points: 10000 },
      { id: 28, name: 'T머니 충전권 5천원', points: 5000 },
      { id: 29, name: 'SRT 5천원 할인', points: 5000 },
      { id: 30, name: 'KTX 1만원 할인권', points: 10000 }
    ],
    beauty: [
      { id: 31, name: '올리브영 1만원권', points: 10000 },
      { id: 32, name: '아리따움 5천원권', points: 5000 }
    ]
  };

  // 카테고리 정보
  const categoryInfo = {
    food: { key: 'food', name: '카페 · 식품', icon: '☕', description: '스타벅스, 커피빈, 투썸플레이스 등', color: 'from-amber-500 to-orange-500' },
    convenience: { key: 'convenience', name: '편의점', icon: '🏪', description: 'GS25, CU, 세븐일레븐 등', color: 'from-green-500 to-emerald-500' },
    bakery: { key: 'bakery', name: '베이커리', icon: '🥐', description: '파리바게뜨, 뚜레쥬르 등', color: 'from-yellow-500 to-amber-500' },
    movie: { key: 'movie', name: '영화', icon: '🎬', description: 'CGV, 메가박스, 롯데시네마 등', color: 'from-purple-500 to-pink-500' },
    flight: { key: 'flight', name: '항공', icon: '✈️', description: '항공권 할인, 제주항공, 진에어 등', color: 'from-blue-500 to-cyan-500' },
    accommodation: { key: 'accommodation', name: '숙소', icon: '🏨', description: '호텔, 펜션, 에어비앤비 등', color: 'from-indigo-500 to-purple-500' },
    giftcard: { key: 'giftcard', name: '기프트카드', icon: '🎁', description: '컬쳐랜드, 해피머니, 문화상품권 등', color: 'from-pink-500 to-rose-500' },
    transport: { key: 'transport', name: '교통', icon: '🚗', description: '택시, T머니, KTX, SRT 등', color: 'from-cyan-500 to-blue-500' },
    beauty: { key: 'beauty', name: '뷰티', icon: '💄', description: '올리브영, 아리따움 등', color: 'from-rose-500 to-pink-500' }
  };

  // 포인트 사용 방법 데이터 (포인트 샵 카테고리와 연결)
  const usageMethods = [
    {
      id: 1,
      category: 'accommodation',
      icon: '🏨',
      iconColor: 'bg-indigo-500',
      title: '숙소',
      description: '호텔, 펜션, 에어비앤비 등 다양한 숙박 시설 상품권',
      points: '1P = 1원',
      example: '15,000원부터 시작',
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400'
    },
    {
      id: 2,
      category: 'flight',
      icon: '✈️',
      iconColor: 'bg-blue-500',
      title: '항공',
      description: '항공권 할인 쿠폰, 제주항공, 진에어 등',
      points: '1P = 1원',
      example: '7,500원부터 시작',
      image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400'
    },
    {
      id: 3,
      category: 'food',
      icon: '☕',
      iconColor: 'bg-amber-500',
      title: '카페 · 식품',
      description: '스타벅스, 커피빈, 투썸플레이스 등 인기 카페',
      points: '1P = 1원',
      example: '3,500원부터 시작',
      image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400'
    },
    {
      id: 4,
      category: 'movie',
      icon: '🎬',
      iconColor: 'bg-purple-500',
      title: '영화',
      description: 'CGV, 메가박스, 롯데시네마 관람권',
      points: '1P = 1원',
      example: '8,000원부터 시작',
      image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400'
    },
    {
      id: 5,
      category: 'convenience',
      icon: '🏪',
      iconColor: 'bg-green-500',
      title: '편의점',
      description: 'GS25, CU, 세븐일레븐, 이마트24 상품권',
      points: '1P = 1원',
      example: '3,000원부터 시작',
      image: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400'
    },
    {
      id: 6,
      category: 'giftcard',
      icon: '🎁',
      iconColor: 'bg-pink-500',
      title: '기프트카드',
      description: '컬쳐랜드, 해피머니, 문화상품권 등',
      points: '1P = 1원',
      example: '5,000원부터 시작',
      image: 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=400'
    },
    {
      id: 7,
      category: 'transport',
      icon: '🚗',
      iconColor: 'bg-cyan-500',
      title: '교통',
      description: '카카오택시, T머니, KTX, SRT 할인권',
      points: '1P = 1원',
      example: '5,000원부터 시작',
      image: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=400'
    },
    {
      id: 8,
      category: 'bakery',
      icon: '🥐',
      iconColor: 'bg-yellow-500',
      title: '베이커리',
      description: '파리바게뜨, 뚜레쥬르 상품권',
      points: '1P = 1원',
      example: '3,000원부터 시작',
      image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400'
    },
    {
      id: 9,
      category: 'beauty',
      icon: '💄',
      iconColor: 'bg-rose-500',
      title: '뷰티',
      description: '올리브영, 아리따움 상품권',
      points: '1P = 1원',
      example: '5,000원부터 시작',
      image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400'
    }
  ];

  // 포인트 적립 방법
  const earnMethods = [
    { icon: 'add_a_photo', title: '사진 업로드', points: '+10P', description: '여행지 사진을 올려주세요' },
    { icon: 'rate_review', title: '리뷰 작성', points: '+20P', description: '솔직한 후기를 남겨주세요' },
    { icon: 'location_on', title: '장소 체크인', points: '+15P', description: '여행지에서 체크인하세요' },
    { icon: 'badge', title: '뱃지 획득', points: '+50P', description: '다양한 뱃지를 모아보세요' },
    { icon: 'person_add', title: '친구 초대', points: '+200P', description: '친구를 초대하면 큰 보너스!' },
    { icon: 'calendar_today', title: '일일 출석', points: '+5P', description: '매일 접속하여 포인트 받기' }
  ];

  return (
    <div className="flex h-full w-full flex-col bg-background-light dark:bg-background-dark">
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {/* 헤더 */}
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between bg-background-light/80 px-4 backdrop-blur-sm dark:bg-background-dark/80 border-b border-border-light dark:border-border-dark">
          <button 
            onClick={() => navigate('/points')}
            className="flex size-10 items-center justify-center rounded-full text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <span className="material-symbols-outlined text-2xl">arrow_back</span>
          </button>
          <h1 className="flex-1 text-center text-lg font-bold text-text-light dark:text-text-dark">
            포인트 사용 가이드
          </h1>
          <div className="size-10"></div>
        </header>

        {/* 메인 콘텐츠 */}
        <main className="px-4 pt-6 pb-4">
          {/* 안내 배너 */}
          <div className="rounded-2xl bg-gradient-to-br from-primary to-orange-600 p-6 text-white mb-6 shadow-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm">
                <span className="material-symbols-outlined text-3xl">payments</span>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold whitespace-nowrap">포인트로 여행을 더 즐겁게!</h2>
                <p className="text-sm opacity-90 mt-1">다양한 혜택으로 교환하세요</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-white/20">
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <span className="text-xl">💎</span>
                <span className="text-lg font-bold">1P = 1원</span>
              </div>
            </div>
          </div>

          {/* 포인트 사용 방법 */}
          <section className="mb-8">
            <h3 className="text-xl font-bold text-text-light dark:text-text-dark mb-4">
              💎 포인트 사용 방법
            </h3>
            <div className="space-y-4">
              {usageMethods.map((method) => (
                <div 
                  key={method.id}
                  className="rounded-xl bg-surface-light dark:bg-surface-dark overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-95"
                  onClick={() => {
                    // 해당 카테고리의 상품 목록 페이지로 이동
                    navigate(`/points/category/${method.category}`, {
                      state: {
                        category: categoryInfo[method.category],
                        products: products[method.category]
                      }
                    });
                  }}
                >
                  {/* 이미지 헤더 */}
                  <div className="relative h-32 overflow-hidden">
                    <img
                      src={method.image}
                      alt={method.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className={`absolute top-3 left-3 flex items-center justify-center w-10 h-10 rounded-full ${method.iconColor} shadow-lg text-2xl`}>
                      {method.icon}
                    </div>
                  </div>

                  {/* 내용 */}
                  <div className="p-4">
                    <h4 className="text-base font-bold text-text-light dark:text-text-dark mb-2">
                      {method.title}
                    </h4>
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-3">
                      {method.description}
                    </p>
                    <div className="flex items-center justify-between pt-3 border-t border-border-light dark:border-border-dark">
                      <div>
                        <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mb-1">
                          교환 비율
                        </p>
                        <p className="text-sm font-bold text-primary">
                          {method.points}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mb-1">
                          예시
                        </p>
                        <p className="text-xs font-medium text-text-light dark:text-text-dark">
                          {method.example}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 포인트 적립 방법 */}
          <section className="mb-8">
            <h3 className="text-xl font-bold text-text-light dark:text-text-dark mb-4">
              ⭐ 포인트 적립 방법
            </h3>
            <div className="rounded-xl bg-surface-light dark:bg-surface-dark p-4">
              <div className="grid grid-cols-2 gap-3">
                {earnMethods.map((method, index) => (
                  <div
                    key={index}
                    className="flex flex-col items-center gap-2 p-4 rounded-lg bg-background-light dark:bg-background-dark hover:bg-primary/5 transition-colors"
                  >
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                      <span className="material-symbols-outlined text-primary text-xl">{method.icon}</span>
                    </div>
                    <p className="text-sm font-semibold text-text-light dark:text-text-dark text-center">
                      {method.title}
                    </p>
                    <p className="text-lg font-bold text-primary">
                      {method.points}
                    </p>
                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark text-center">
                      {method.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 유의사항 */}
          <section className="mb-8">
            <h3 className="text-xl font-bold text-text-light dark:text-text-dark mb-4">
              📋 유의사항
            </h3>
            <div className="rounded-xl bg-yellow-50 dark:bg-yellow-900/20 p-5">
              <div className="space-y-3">
                <div className="flex gap-3">
                  <span className="material-symbols-outlined text-yellow-600 dark:text-yellow-500 text-xl mt-0.5">info</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-400 mb-1">
                      포인트 유효기간
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300">
                      포인트는 적립일로부터 1년간 유효합니다. 기간 만료 전에 사용해주세요.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="material-symbols-outlined text-yellow-600 dark:text-yellow-500 text-xl mt-0.5">block</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-400 mb-1">
                      부정 적립 금지
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300">
                      부정한 방법으로 포인트를 적립할 경우 계정이 정지될 수 있습니다.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="material-symbols-outlined text-yellow-600 dark:text-yellow-500 text-xl mt-0.5">currency_exchange</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-400 mb-1">
                      환불 정책
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300">
                      포인트로 교환한 상품은 환불이 불가능합니다. 신중하게 선택해주세요.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section className="mb-8">
            <h3 className="text-xl font-bold text-text-light dark:text-text-dark mb-4">
              ❓ 자주 묻는 질문
            </h3>
            <div className="space-y-3">
              <details className="group rounded-xl bg-surface-light dark:bg-surface-dark overflow-hidden">
                <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <span className="text-sm font-semibold text-text-light dark:text-text-dark">
                    포인트는 어떻게 적립하나요?
                  </span>
                  <span className="material-symbols-outlined text-text-secondary-light dark:text-text-secondary-dark group-open:rotate-180 transition-transform">
                    expand_more
                  </span>
                </summary>
                <div className="px-4 pb-4">
                  <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">
                    사진 업로드, 리뷰 작성, 체크인, 뱃지 획득 등 다양한 활동을 통해 포인트를 적립할 수 있습니다. 특히 친구 초대 시 200P의 큰 보너스를 받을 수 있습니다!
                  </p>
                </div>
              </details>

              <details className="group rounded-xl bg-surface-light dark:bg-surface-dark overflow-hidden">
                <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <span className="text-sm font-semibold text-text-light dark:text-text-dark">
                    포인트는 현금으로 환전할 수 있나요?
                  </span>
                  <span className="material-symbols-outlined text-text-secondary-light dark:text-text-secondary-dark group-open:rotate-180 transition-transform">
                    expand_more
                  </span>
                </summary>
                <div className="px-4 pb-4">
                  <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">
                    포인트는 현금으로 환전할 수 없으며, LiveJourney 앱 내에서만 사용 가능합니다. 숙박, 맛집, 관광지 등 다양한 여행 관련 혜택으로 교환하실 수 있습니다.
                  </p>
                </div>
              </details>

              <details className="group rounded-xl bg-surface-light dark:bg-surface-dark overflow-hidden">
                <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <span className="text-sm font-semibold text-text-light dark:text-text-dark">
                    포인트 유효기간이 지나면 어떻게 되나요?
                  </span>
                  <span className="material-symbols-outlined text-text-secondary-light dark:text-text-secondary-dark group-open:rotate-180 transition-transform">
                    expand_more
                  </span>
                </summary>
                <div className="px-4 pb-4">
                  <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">
                    유효기간이 지난 포인트는 자동으로 소멸됩니다. 포인트 내역에서 각 포인트의 만료일을 확인하실 수 있으니, 만료 전에 꼭 사용해주세요!
                  </p>
                </div>
              </details>

              <details className="group rounded-xl bg-surface-light dark:bg-surface-dark overflow-hidden">
                <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <span className="text-sm font-semibold text-text-light dark:text-text-dark">
                    포인트를 가장 많이 받는 방법은?
                  </span>
                  <span className="material-symbols-outlined text-text-secondary-light dark:text-text-secondary-dark group-open:rotate-180 transition-transform">
                    expand_more
                  </span>
                </summary>
                <div className="px-4 pb-4">
                  <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">
                    친구 초대(200P)와 뱃지 획득(50~100P)이 가장 많은 포인트를 받을 수 있는 방법입니다. 또한 매일 출석하고 꾸준히 활동하면 보너스 포인트를 받을 수 있습니다!
                  </p>
                </div>
              </details>
            </div>
          </section>

          {/* CTA 버튼 */}
          <div className="space-y-3 mb-8">
            <button
              onClick={() => navigate('/points/shop')}
              className="w-full py-4 rounded-xl bg-primary text-white font-bold shadow-lg hover:bg-primary/90 transition-all active:scale-95"
            >
              포인트 숍 둘러보기 🛍️
            </button>
            <button
              onClick={() => navigate('/points/history')}
              className="w-full py-4 rounded-xl bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark font-semibold border-2 border-primary hover:bg-primary/5 transition-all active:scale-95"
            >
              내 포인트 내역 확인하기
            </button>
          </div>
        </main>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default PointsUsageGuideScreen;
















