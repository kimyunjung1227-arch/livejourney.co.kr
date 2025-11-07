import React, { useState, useEffect } from 'react';

const StatusBar = () => {
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-shrink-0 flex h-11 items-center justify-between px-6 bg-white dark:bg-background-dark text-text-light dark:text-text-dark text-sm font-semibold z-50">
      {/* 왼쪽: 시간 */}
      <div className="w-20 text-left">
        {currentTime}
      </div>

      {/* 오른쪽: 상태 아이콘들 */}
      <div className="flex items-center gap-1">
        {/* 셀룰러 신호 */}
        <span className="material-symbols-outlined !text-base">
          signal_cellular_alt
        </span>
        {/* 와이파이 */}
        <span className="material-symbols-outlined !text-base">
          wifi
        </span>
        {/* 배터리 */}
        <span className="material-symbols-outlined !text-base">
          battery_full
        </span>
      </div>
    </div>
  );
};

export default StatusBar;

