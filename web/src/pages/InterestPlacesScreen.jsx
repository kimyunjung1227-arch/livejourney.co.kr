import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  toggleInterestPlace,
  isInterestPlace,
  getInterestPlaces
} from '../utils/interestPlaces';
import { getRegionDefaultImage } from '../utils/regionDefaultImages';

const InterestPlacesScreen = () => {
  const navigate = useNavigate();
  const [interestPlaces, setInterestPlaces] = useState([]);
  const [selectedRegions, setSelectedRegions] = useState([]);

  // 선택 가능한 관심 지역 목록 (중복 선택 허용)
  const availableRegions = [
    '서울', '경기도', '인천', '부산', '대구',
    '광주', '대전', '울산', '세종', '강원도',
    '충청북도', '충청남도', '전라북도', '전라남도',
    '경상북도', '경상남도', '제주도'
  ];

  useEffect(() => {
    loadData();

    const handleChange = () => loadData();
    window.addEventListener('interestPlaceChanged', handleChange);

    return () => {
      window.removeEventListener('interestPlaceChanged', handleChange);
    };
  }, []);

  const loadData = () => {
    const places = getInterestPlaces();
    setInterestPlaces(places);
    // 기존 저장된 관심 지역 이름들을 선택 상태로 초기화
    const names = places.map((p) => p.name).filter(Boolean);
    setSelectedRegions(names);
  };

  const handleToggleRegion = (region) => {
    setSelectedRegions((prev) =>
      prev.includes(region) ? prev.filter((r) => r !== region) : [...prev, region]
    );
  };

  const handleDone = () => {
    // 선택이 없으면 그냥 메인으로
    if (!selectedRegions || selectedRegions.length === 0) {
      localStorage.setItem('hasCompletedInterestSetup', 'true');
      navigate('/main', { replace: true });
      return;
    }

    const now = new Date().toISOString();
    const newPlaces = selectedRegions.map((region) => ({
      name: region,
      location: region,
      region,
      coordinates: null,
      addedAt: now
    }));

    localStorage.setItem('interestPlaces', JSON.stringify(newPlaces));
    localStorage.setItem('hasCompletedInterestSetup', 'true');
    window.dispatchEvent(
      new CustomEvent('interestPlaceChanged', {
        detail: { place: selectedRegions, enabled: true }
      })
    );

    navigate('/main', { replace: true });
  };

  const handleSkip = () => {
    localStorage.setItem('hasCompletedInterestSetup', 'true');
    navigate('/main', { replace: true });
  };

  return (
    <div className="flex h-screen w-full flex-col bg-white overflow-hidden">
      {/* 상단 헤더 */}
      <header className="flex-shrink-0 border-b border-gray-200 bg-white pt-5 pb-4 px-5">
        <button
          type="button"
          onClick={handleSkip}
          className="mb-4 inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100"
        >
          <span className="material-symbols-outlined text-gray-900 text-xl">arrow_back</span>
        </button>
        <h2 className="text-base font-semibold text-gray-900 mb-1">내 피드에서 보고 싶은</h2>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">관심 지역</h1>
        <p className="text-sm text-gray-500 mb-4">
          선택한 지역을 기준으로 메인 피드가 구성됩니다. 원하시는 만큼 골라 주세요.
        </p>
      </header>

      {/* 컨텐츠: 칩 형태로 관심 지역 선택 */}
      <div className="flex-1 overflow-y-auto bg-white px-5 pt-3">
        <div className="flex flex-wrap gap-2">
          {availableRegions.map((region) => {
            const selected = selectedRegions.includes(region);

            return (
              <button
                key={region}
                type="button"
                onClick={() => handleToggleRegion(region)}
                className={`inline-flex items-center rounded-full px-4 py-2 text-sm border transition-all ${
                  selected
                    ? 'bg-[#00BCD4] text-white border-[#00BCD4]'
                    : 'bg-white text-gray-800 border-gray-200 hover:bg-[#E0F7FA]'
                }`}
              >
                <span>{region}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 하단 버튼 영역 */}
      <div className="flex-shrink-0 px-5 pb-6 pt-4 bg-white">
        <p className="text-xs text-gray-400 mb-3 text-center">
          관심 지역은 나중에 프로필에서 다시 수정할 수 있어요.
        </p>
        <button
          type="button"
          onClick={handleDone}
          className="w-full h-11 rounded-full bg-[#00BCD4] text-sm font-semibold text-white active:bg-[#00A5BD]"
        >
          다음
        </button>
      </div>
    </div>
  );
};

export default InterestPlacesScreen;




