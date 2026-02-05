import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// 온보딩 공통 레이아웃 (사용자가 제공한 코드 기반)
const OnboardingLayout = ({ title, description, step, children, onLogin, onSkip }) => {
  return (
    <div className="flex flex-col min-h-screen w-full max-w-md mx-auto bg-white px-5 pt-4 pb-8 font-sans">
      {/* 상단 건너뛰기 버튼 */}
      <div className="flex justify-end mb-4">
        <button
          type="button"
          onClick={onSkip}
          className="text-sm font-medium text-gray-400 hover:text-gray-600"
        >
          건너뛰기
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <h1 className="text-2xl font-bold text-center whitespace-pre-line leading-tight">
          {title}
        </h1>

        <div className="w-full flex items-center justify-center relative overflow-hidden">
          {children}
        </div>

        <div className="text-center">
          <p className="text-gray-600 text-sm mb-4 leading-relaxed px-4 whitespace-pre-line">
            {description}
          </p>
          <p className="text-xs font-semibold mb-2 text-gray-400">
            <span className="text-black">{step}</span> of 3
          </p>

          <div className="w-full h-1 bg-gray-100 rounded-full mb-4" />

          <button
            type="button"
            onClick={onLogin}
            className="w-full h-11 bg-[#00BCD4] text-white rounded-full font-semibold text-sm hover:bg-[#00A5BD] transition-colors"
          >
            로그인
          </button>
        </div>
      </div>
    </div>
  );
};

const OnboardingScreen = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0); // 0,1,2 -> 화면에서는 1,2,3
  const [dragStartX, setDragStartX] = useState(null);
  const [dragEndX, setDragEndX] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const slides = [
    {
      title: '실시간 여행 현장을 한눈에',
      description: '지금 사람들이 올린 현장 사진으로\n어디가 핫한지 바로 확인하세요.'
    },
    {
      title: '날씨·혼잡도까지 한 번에',
      description: '사진 속 날씨와 분위기를 함께 보여줘서\n가야 할지 말지 쉽게 결정할 수 있어요.'
    },
    {
      title: '내 여행 기록도 자동 정리',
      description: '찍은 사진만 올리면\n지역·날짜별로 여행 기록이 쌓여요.'
    }
  ];

  const current = slides[step];

  const handleLogin = () => {
    navigate('/start');
  };

  const handleSkip = () => {
    navigate('/start');
  };

  const startDrag = (clientX) => {
    setDragStartX(clientX);
    setDragEndX(null);
    setIsDragging(true);
  };

  const moveDrag = (clientX) => {
    if (!isDragging) return;
    setDragEndX(clientX);
  };

  const endDrag = () => {
    if (!isDragging || dragStartX === null || dragEndX === null) {
      setIsDragging(false);
      return;
    }

    const delta = dragStartX - dragEndX;
    const threshold = 40;

    if (delta > threshold && step < slides.length - 1) {
      setStep((prev) => Math.min(prev + 1, slides.length - 1));
    } else if (delta < -threshold && step > 0) {
      setStep((prev) => Math.max(prev - 1, 0));
    }

    setDragStartX(null);
    setDragEndX(null);
    setIsDragging(false);
  };

  const renderIllustration = () => {
    // 1번: 사진 콜라주 (이미지 예시와 유사)
    if (step === 0) {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <div className="relative w-[90%] h-[80%] rounded-3xl overflow-hidden bg-white">
            <div className="grid grid-cols-3 gap-3 p-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                <div
                  key={i}
                  className={`rounded-2xl bg-gray-200 overflow-hidden ${
                    i % 5 === 0 ? 'col-span-2 h-32' : 'h-20'
                  }`}
                  style={{
                    transform:
                      i % 3 === 0 ? 'rotate(4deg)' : i % 3 === 1 ? 'rotate(-3deg)' : 'rotate(2deg)',
                    transformOrigin: 'center center'
                  }}
                >
                  <div className="w-full h-full bg-gradient-to-tr from-sky-200 via-emerald-200 to-amber-200" />
                </div>
              ))}
            </div>

            {/* 위/아래 화이트 그라데이션 */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent" />
          </div>
        </div>
      );
    }

    // 2번: 날씨/혼잡도 카드
    if (step === 1) {
      return (
        <div className="space-y-4 w-full px-10">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50">
            <div className="w-full h-24 bg-gray-50 rounded-lg animate-pulse" />
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50">
            <div className="w-full h-24 bg-gray-50 rounded-lg animate-pulse" />
          </div>
        </div>
      );
    }

    // 3번: 타임라인 + 사진 썸네일
    return (
      <div className="w-full h-full flex items-center justify-center px-4">
        <div className="flex items-center justify-between w-full max-w-xs">
          <div className="flex flex-col gap-6 text-left text-xs text-gray-700">
            <div>
              <div className="text-sm font-semibold">2023·10월 일기</div>
              <div className="text-[11px] text-gray-500">지역 · 남해/백팩</div>
            </div>
            <div>
              <div className="text-sm font-semibold">2023·12월 일기</div>
              <div className="text-[11px] text-gray-500">5일 · 제주/걷기</div>
            </div>
          </div>
          <div className="flex-1 mx-4 h-40 relative">
            <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-gray-200 -translate-x-1/2" />
            <div className="absolute left-1/2 top-4 -translate-x-1/2 w-3 h-3 rounded-full bg-sky-400" />
            <div className="absolute left-1/2 bottom-4 -translate-x-1/2 w-3 h-3 rounded-full bg-emerald-400" />
          </div>
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-16 h-10 rounded-xl bg-gray-200 overflow-hidden">
                <div className="w-full h-full bg-gradient-to-tr from-sky-200 to-emerald-200" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative min-h-screen w-full bg-white flex items-center justify-center px-4">
      {/* 스와이프 영역 - 화면 가운데 컨텐츠 */}
      <div
        className="w-full"
        onTouchStart={(e) => startDrag(e.touches[0].clientX)}
        onTouchMove={(e) => moveDrag(e.touches[0].clientX)}
        onTouchEnd={endDrag}
        onMouseDown={(e) => startDrag(e.clientX)}
        onMouseMove={(e) => moveDrag(e.clientX)}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
      >
        <OnboardingLayout
          title={current.title}
          description={current.description}
          step={step + 1}
          onLogin={handleLogin}
          onSkip={handleSkip}
        >
          {renderIllustration()}
        </OnboardingLayout>
      </div>
    </div>
  );
};

export default OnboardingScreen;

