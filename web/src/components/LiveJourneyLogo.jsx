import React from 'react';

const LiveJourneyLogo = ({ size = 80, showText = true, className = '' }) => {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* 실제 로고 이미지 사용 */}
      <img 
        src="/livejourney-logo.png" 
        alt="LiveJourney" 
        style={{ 
          width: size,
          height: 'auto',
          objectFit: 'contain'
        }}
      />
    </div>
  );
};

export default LiveJourneyLogo;



