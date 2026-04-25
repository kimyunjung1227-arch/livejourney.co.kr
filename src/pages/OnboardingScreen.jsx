import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';

import 'swiper/css';

// 슬라이드별 높이 차이 없이 고정 레이아웃 (덜컥거림 방지)
const IMAGE_AREA_HEIGHT = '38vh';  // 이미지 영역 고정 높이

const OnboardingScreen = () => {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);

  const slides = [
    {
      id: 1,
      title: '실시간 여행 현장을 한눈에',
      description: '지금 사람들이 올린 현장 사진으로\n어디가 핫한지 바로 확인하세요.',
      img: '/images/onboarding1.png',
    },
    {
      id: 2,
      title: '지도로 읽는 가장 생생한 도시의 온도',
      description: '멀리 갈 필요 없어요. 내 주변 가장 핫한 곳을 지도에서 바로 찾으세요.',
      img: '/images/onboarding2.png',
    },
    {
      id: 3,
      title: '나의 발자국으로 완성되는 여행의 가치',
      description: '당신의 소중한 순간을 기록하고, 누군가의 여행을 돕는 가이드가 되어보세요.',
      img: '/images/onboarding3.png',
    },
  ];

  const handleStart = () => {
    navigate('/start');
  };

  const handleSkip = () => {
    navigate('/main');
  };

  const isLastSlide = activeIndex === slides.length - 1;

  return (
    <div className="relative flex flex-col h-dvh max-h-[100dvh] w-full max-w-md mx-auto bg-white overflow-hidden px-6 sm:px-8">
      {/* 상단 건너뛰기 */}
      <button
        type="button"
        onClick={handleSkip}
        className="absolute top-6 right-6 z-10 text-gray-400 text-sm hover:text-gray-600 transition-colors"
      >
        건너뛰기
      </button>

      {/* 메인 슬라이드 - 모든 슬라이드 동일 높이·동일 위치, 슬라이드 전환 부드럽게 */}
      <Swiper
        onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
        speed={280}
        touchRatio={1}
        resistanceRatio={0.85}
        className="onboarding-swiper w-full flex-1 min-h-0"
        style={{ overflow: 'hidden', height: '100%' }}
      >
        {slides.map((slide) => (
          <SwiperSlide key={slide.id} className="!h-full">
            {/* 사진처럼 화면 가운데 한 덩어리로 배치 */}
            <div className="h-full flex flex-col items-center justify-center px-2 sm:px-4 pt-4 pb-2">
              <div className="w-full max-w-[320px] flex flex-col items-center gap-0">
                {/* 이미지 - 더 중앙에 */}
                <div
                  className="w-full flex-shrink-0 flex items-center justify-center mb-2"
                  style={{ height: IMAGE_AREA_HEIGHT, minHeight: 200 }}
                >
                  <div className="w-full h-full max-w-[260px] mx-auto bg-gray-50 rounded-2xl flex items-center justify-center overflow-hidden">
                    <img
                      src={slide.img}
                      alt={slide.title}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/300?text=LiveJourney';
                      }}
                    />
                  </div>
                </div>
                {/* 제목·설명 문구 — 가볍게 보이도록 굵기·색 조정 */}
                <h2 className="text-lg sm:text-xl font-semibold text-gray-700 text-center flex-shrink-0 w-full leading-snug mb-0 break-keep tracking-tight">
                  {slide.title}
                </h2>
                <p className="text-gray-400 text-center text-sm sm:text-base font-normal flex-shrink-0 w-full mt-1 mb-0 leading-relaxed break-keep whitespace-pre-line tracking-wide">
                  {slide.description}
                </p>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* 페이지 인디케이터 - 가운데 */}
      <div className="flex justify-center gap-1.5 py-3 flex-shrink-0">
        {slides.map((_, i) => (
          <span
            key={i}
            className={`inline-block h-2 rounded-full transition-all duration-200 ${
              i === activeIndex ? 'w-5 bg-gray-800' : 'w-2 bg-gray-200'
            }`}
            aria-hidden
          />
        ))}
      </div>

      {/* 하단 버튼 - 시작하기 공간 항상 확보 후 페이드인으로 덜컥거림 방지 */}
      <div className="p-4 sm:p-6 pt-0 flex-shrink-0 flex flex-col items-center justify-end gap-3">
        <button
          type="button"
          onClick={handleStart}
          aria-hidden={!isLastSlide}
          className={`w-full min-h-[52px] sm:min-h-[56px] py-3.5 sm:py-4 rounded-xl font-medium text-base sm:text-lg border transition-opacity duration-300 ${
            isLastSlide
              ? 'opacity-100 pointer-events-auto bg-primary-5 text-primary border-primary hover:bg-primary-10'
              : 'opacity-0 pointer-events-none border-transparent bg-transparent invisible'
          }`}
        >
          시작하기
        </button>
        <button
          type="button"
          onClick={handleSkip}
          className="w-full text-gray-400 text-sm font-medium hover:text-gray-600 transition-colors py-2 text-center"
        >
          계정 없이 둘러보기
        </button>
      </div>
    </div>
  );
};

export default OnboardingScreen;
