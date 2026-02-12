import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// 온보딩 레이아웃 - 참고: 일러스트 → 제목 → 설명(가깝게) → 페이지 점 → 버튼
const OnboardingLayout = ({ title, description, step, children, onLogin, onSkip, middleImage }) => {
  const isLastStep = step === 3;
  return (
    <div className="flex flex-col min-h-screen w-full max-w-md mx-auto bg-white px-4 pt-3 pb-8 font-sans">
      <div className="flex justify-end mb-2">
        <button
          type="button"
          onClick={onSkip}
          className="text-xs font-medium text-gray-400 hover:text-gray-600"
        >
          건너뛰기
        </button>
      </div>

      {/* 콘텐츠 블록을 화면 세로 중앙으로 */}
      <div className="flex flex-1 min-h-0 flex-col items-center justify-center">
        <div className="flex flex-col items-center w-full">
          {/* 1. 일러스트 영역 - 고정 높이 38vh */}
          <div
            className="flex items-center justify-center w-full flex-shrink-0"
            style={{ height: '38vh', paddingTop: 8, paddingBottom: 16 }}
          >
            {middleImage ? (
              <img
                src={middleImage}
                alt=""
                className="w-full max-w-[290px] h-full mx-auto rounded-xl object-cover shadow-sm border border-gray-100"
                style={{ maxHeight: '100%' }}
              />
            ) : (
              <div className="w-full max-w-[290px] h-full mx-auto flex items-center justify-center [&>*]:max-h-full [&>img]:max-h-full">
                {children}
              </div>
            )}
          </div>

          {/* 2. 제목 - 1줄, 사이즈 줄여서 3줄 구성 */}
          <div className="w-full max-w-[300px] flex-shrink-0 min-h-[56px] flex items-center justify-center px-2 mb-0.5">
            <h1 className="text-lg font-bold text-center whitespace-pre-line leading-tight text-gray-900 break-keep">
              {title}
            </h1>
          </div>

          {/* 3. 설명 - 2줄, 작은 글씨로 3줄 안에 자연스럽게 */}
          <div className="w-full max-w-[300px] flex-shrink-0 min-h-[48px] flex items-center justify-center px-2 mb-2">
            <p className="text-gray-600 text-sm leading-snug text-center whitespace-pre-line w-full break-keep">
              {description}
            </p>
          </div>

          {/* 4. 하단(점 + 버튼) */}
          <div className="w-full max-w-[320px] flex-shrink-0 min-h-[140px] flex flex-col items-center justify-start pt-2">
          <div className="flex justify-center gap-1.5 mb-4">
            {[1, 2, 3].map((i) => (
              <span
                key={i}
                className={`inline-block w-2 h-2 rounded-full transition-colors ${
                  i === step ? 'bg-gray-800' : 'bg-gray-200'
                }`}
                aria-hidden
              />
            ))}
          </div>
          {isLastStep ? (
            <>
              <button
                type="button"
                onClick={onLogin}
                className="w-full h-11 bg-[#00BCD4] text-white rounded-full font-medium text-sm hover:bg-[#00A5BD] transition-colors"
              >
                시작하기
              </button>
              <button
                type="button"
                onClick={onSkip}
                className="mt-3 text-xs text-gray-500 hover:text-gray-700"
              >
                계정 없이 둘러보기
              </button>
            </>
          ) : (
            <div className="w-full h-11 rounded-full" aria-hidden />
          )}
          </div>
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
      title: '지도에서 현지 정보 확인하기',
      description: '궁금한 곳? 지도에서 실시간으로 물어보세요.\n핀을 연결해 나만의 여행 코스를 만드세요.'
    },
    {
      title: '흩어진 사진이 여행 기록이 됩니다',
      description: '사진만 올리면 찍은 날짜와 위치를 바탕으로\n자동으로 여행별·도시별 앨범이 정리돼요.'
    }
  ];

  const current = slides[step];

  const handleStart = () => {
    // 온보딩에서 "시작하기"를 누르면 로그인 화면으로 이동
    navigate('/start');
  };

  const handleSkip = () => {
    navigate('/main');
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
    // 1번: 레이아웃에서 middleImage로 표시하므로 여기서는 미사용
    if (step === 0) return null;

    // 2번: 지도 기능 - 1번과 동일한 작은 사이즈
    if (step === 1) {
      return (
        <img
          src="/지도기능.jpg.png"
          alt="지도에서 현지 정보 확인"
          className="w-full max-w-[290px] rounded-xl object-cover shadow-sm border border-gray-100"
          style={{ maxHeight: '38vh' }}
        />
      );
    }

    // 3번: 여행 기록 기능 – 제공해주신 카드 타임라인 이미지 사용
    // 원본 이미지에 여백이 많아서, 컨테이너를 잘라내는 방식으로 살짝 확대해서 넣습니다.
    return (
      <div
        className="w-full max-w-[290px] h-full mx-auto rounded-xl overflow-hidden shadow-sm border border-gray-100 flex items-center justify-center"
        style={{ maxHeight: '38vh' }}
      >
        <img
          src="/기록기능.png.png"
          alt="여행 기록 기능 예시"
          className="w-full h-full object-cover"
          style={{ transform: 'scale(1.08)' }} // 가장자리 여백을 조금 잘라내서 꽉 차게 보이도록 확대
        />
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
          onLogin={handleStart}
          onSkip={handleSkip}
          middleImage={undefined}
        >
          {renderIllustration()}
        </OnboardingLayout>
      </div>
    </div>
  );
};

export default OnboardingScreen;

