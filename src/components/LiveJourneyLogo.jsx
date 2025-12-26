import React from 'react';

// 공용 로고 컴포넌트
// 실제 이미지는 /public/logo-camera.png, /public/icon-192.png 등으로 저장해 두고 사용합니다.
const LiveJourneyLogo = ({ size = 96, showText = true, className = '' }) => {
  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      {/* 메인 앱 로고 이미지 */}
      <div
        className="rounded-3xl shadow-xl overflow-hidden bg-gradient-to-br from-cyan-400 to-sky-500"
        style={{ width: size, height: size }}
      >
        <img
          src="/logo-camera.png"
          alt="LiveJourney 로고"
          className="w-full h-full object-contain"
          onError={(e) => {
            // 만약 로고 파일이 아직 없으면 그냥 배경만 보이도록
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>

      {/* 텍스트 로고 */}
      {showText && (
        <div className="flex flex-col items-center gap-1">
              <h1
                className="text-4xl font-bold tracking-tight"
                style={{
                  background: 'linear-gradient(135deg, #00BCD4 0%, #0097A7 60%, #FFC107 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
            LiveJourney
          </h1>
        </div>
      )}
    </div>
  );
};

export default LiveJourneyLogo;







