import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';
import { getWeatherByRegion, getTrafficByRegion } from '../api/weather';
import { seedMockData } from '../utils/mockUploadData';

const RegionDetailScreen = () => {
  const navigate = useNavigate();
  const { regionName } = useParams();
  const location = useLocation();
  const region = location.state?.region || { name: regionName || '서울' };

  const [realtimePhotos, setRealtimePhotos] = useState([]);
  const [bloomPhotos, setBloomPhotos] = useState([]);
  const [touristSpots, setTouristSpots] = useState([]);
  const [foodPhotos, setFoodPhotos] = useState([]);
  
  const [weatherInfo, setWeatherInfo] = useState({
    icon: '☀️',
    condition: '맑음',
    temperature: '27℃',
    loading: false
  });
  
  const [trafficInfo, setTrafficInfo] = useState({
    icon: '🚗',
    status: '교통 원활',
    loading: false
  });

  // 시간을 숫자로 변환하는 함수 (정렬용)
  const timeToMinutes = useCallback((timeLabel) => {
    if (timeLabel === '방금') return 0;
    if (timeLabel.includes('분 전')) return parseInt(timeLabel);
    if (timeLabel.includes('시간 전')) return parseInt(timeLabel) * 60;
    if (timeLabel.includes('일 전')) return parseInt(timeLabel) * 24 * 60;
    return 999999; // 알 수 없는 경우 맨 뒤로
  }, []);

  // 지역 데이터 로드 (useCallback)
  const loadRegionData = useCallback(() => {
    let uploadedPosts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');
    
    // Mock 데이터가 없으면 즉시 생성!
    if (uploadedPosts.length === 0) {
      console.log('⚠️ Mock 데이터가 없습니다! 즉시 1000개 생성...');
      seedMockData(1000);
      uploadedPosts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');
      console.log(`✅ ${uploadedPosts.length}개 Mock 데이터 생성 완료!`);
    }
    
    const regionPosts = uploadedPosts.filter(
      post => post.location?.includes(region.name) || post.location === region.name
    )
    .sort((a, b) => {
      // 시간순 정렬 (최신순)
      const timeA = timeToMinutes(a.timeLabel || '방금');
      const timeB = timeToMinutes(b.timeLabel || '방금');
      return timeA - timeB;
    });
    
    const bloomPosts = regionPosts
      .filter(post => post.category === 'bloom')
      .map(post => ({ // slice 제거 - 모든 사진 표시!
        id: post.id,
        image: post.images?.[0] || post.image,
        time: post.timeLabel || '방금',
        category: post.categoryName,
        categoryName: post.categoryName,
        labels: post.aiLabels,
        detailedLocation: post.detailedLocation || post.placeName,
        placeName: post.placeName,
        address: post.address
      }));
    
    const touristPosts = regionPosts
      .filter(post => post.category === 'landmark' || post.category === 'scenic')
      .map(post => ({ // slice 제거 - 모든 사진 표시!
        id: post.id,
        image: post.images?.[0] || post.image,
        time: post.timeLabel || '방금',
        category: post.categoryName,
        categoryName: post.categoryName,
        labels: post.aiLabels,
        detailedLocation: post.detailedLocation || post.placeName,
        placeName: post.placeName,
        address: post.address
      }));
    
    const foodPosts = regionPosts
      .filter(post => post.category === 'food')
      .map(post => ({ // slice 제거 - 모든 사진 표시!
        id: post.id,
        image: post.images?.[0] || post.image,
        time: post.timeLabel || '방금',
        category: post.categoryName,
        categoryName: post.categoryName,
        labels: post.aiLabels,
        detailedLocation: post.detailedLocation || post.placeName,
        placeName: post.placeName,
        address: post.address
      }));
    
    const realtimePosts = regionPosts
      .map(post => ({ // slice 제거 - 모든 사진 표시!
        id: post.id,
        image: post.images?.[0] || post.image,
        time: post.timeLabel || '방금',
        category: post.categoryName || '일반',
        categoryName: post.categoryName,
        labels: post.aiLabels,
        detailedLocation: post.detailedLocation || post.placeName,
        placeName: post.placeName,
        address: post.address
      }));
    
    setBloomPhotos(bloomPosts);
    setTouristSpots(touristPosts);
    setFoodPhotos(foodPosts);
    setRealtimePhotos(realtimePosts);
    
    console.log('📊 AI 카테고리별 사진 분류:', {
      bloom: bloomPosts.length,
      tourist: touristPosts.length,
      food: foodPosts.length,
      total: realtimePosts.length
    });
  }, [region.name, timeToMinutes]);

  // 날씨 정보 가져오기 (useCallback)
  const fetchWeatherData = useCallback(async () => {
    setWeatherInfo(prev => ({ ...prev, loading: true }));
    try {
      const result = await getWeatherByRegion(region.name);
      if (result.success) {
        setWeatherInfo({
          icon: result.weather.icon,
          condition: result.weather.condition,
          temperature: result.weather.temperature,
          loading: false
        });
      }
    } catch (error) {
      console.error('날씨 정보 조회 실패:', error);
      setWeatherInfo(prev => ({ ...prev, loading: false }));
    }
  }, [region.name]);

  // 교통 정보 가져오기 (useCallback)
  const fetchTrafficData = useCallback(async () => {
    setTrafficInfo(prev => ({ ...prev, loading: true }));
    try {
      const result = await getTrafficByRegion(region.name);
      if (result.success) {
        setTrafficInfo({
          icon: result.traffic.icon,
          status: result.traffic.status,
          loading: false
        });
      }
    } catch (error) {
      console.error('교통 정보 조회 실패:', error);
      setTrafficInfo(prev => ({ ...prev, loading: false }));
    }
  }, [region.name]);

  useEffect(() => {
    loadRegionData();
    fetchWeatherData();
    fetchTrafficData();
  }, [loadRegionData, fetchWeatherData, fetchTrafficData]);

  return (
    <div className="flex h-full w-full flex-col bg-background-light dark:bg-background-dark">
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200/80 bg-background-light/80 p-4 pb-3 backdrop-blur-sm dark:border-gray-700/80 dark:bg-background-dark/80">
        <button 
          onClick={() => navigate(-1)}
          className="flex size-12 shrink-0 items-center justify-center text-content-light dark:text-content-dark hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>arrow_back</span>
        </button>
        <h1 className="flex-1 text-center text-lg font-bold leading-tight tracking-[-0.015em] text-content-light dark:text-content-dark">
          {region.name}
        </h1>
        <div className="w-12"></div>
      </header>

        <main className="flex-grow pb-4">
        <div className="flex justify-center gap-2 p-4 pt-4">
          <div className="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-surface pl-3 pr-4 shadow-sm dark:bg-background-dark/50">
              {weatherInfo.loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              ) : (
                <>
                  <span className="text-base">{weatherInfo.icon}</span>
            <p className="text-sm font-medium leading-normal text-text-headings dark:text-gray-200">
                    {weatherInfo.condition}, {weatherInfo.temperature}
            </p>
                </>
              )}
          </div>
            
          <div className="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-surface pl-3 pr-4 shadow-sm dark:bg-background-dark/50">
              {trafficInfo.loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              ) : (
                <>
                  <span className="text-base">{trafficInfo.icon}</span>
            <p className="text-sm font-medium leading-normal text-text-headings dark:text-gray-200">
                    {trafficInfo.status}
            </p>
                </>
              )}
            </div>
        </div>

          {/* 현장 실시간 정보 */}
        <div>
          <div className="flex items-center justify-between px-4 pb-3 pt-5">
            <h2 className="text-[22px] font-bold leading-tight tracking-[-0.015em] text-text-headings dark:text-gray-100">
              현장 실시간 정보
            </h2>
            <button 
              onClick={() => navigate(`/region/${region.name}/category?type=realtime`)}
              className="text-sm font-medium text-text-body dark:text-gray-400 hover:text-primary transition-colors"
            >
              더보기
            </button>
          </div>

            {realtimePhotos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-4">add_a_photo</span>
                <p className="text-base font-medium text-gray-700 dark:text-gray-300 mb-2 text-center">
                  {region.name}의 실시간 정보가 없어요
                </p>
                <button
                  onClick={() => navigate('/upload')}
                  className="bg-primary text-white px-6 py-2.5 rounded-full font-semibold hover:bg-primary/90 transition-colors mt-4"
                >
                  정보 공유하기
                </button>
              </div>
            ) : (
          <div className="grid grid-cols-2 gap-3 px-4">
            {realtimePhotos.map((photo) => (
              <div 
                key={photo.id} 
                    className="relative overflow-hidden rounded-xl bg-gray-200 cursor-pointer group shadow-lg hover:shadow-xl transition-all"
                onClick={() => navigate(`/post/${photo.id}`, { state: { post: photo } })}
              >
                <img
                      className="h-full w-full object-cover aspect-[1/1] group-hover:scale-105 transition-transform duration-300"
                  src={photo.image}
                  alt={`${region.name} 실시간 정보`}
                />
                    {/* 그라데이션 오버레이 */}
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.3))' }}></div>
                    
                    {/* 좌측상단: 카테고리 아이콘만 */}
                    {photo.categoryName && (
                      <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 20 }}>
                        <span style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          width: '40px', 
                          height: '40px', 
                          borderRadius: '50%', 
                          backgroundColor: 'rgba(255,255,255,0.95)', 
                          fontSize: '20px',
                          fontWeight: 'bold',
                          boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
                        }}>
                          {photo.categoryName === '개화 상황' && '🌸'}
                          {photo.categoryName === '추천 장소' && '🏞️'}
                          {photo.categoryName === '맛집 정보' && '🍜'}
                          {photo.categoryName === '가볼만한곳' && '🗺️'}
                          {!['개화 상황', '추천 장소', '맛집 정보', '가볼만한곳'].includes(photo.categoryName) && '📷'}
                        </span>
                      </div>
                    )}
                    
                    {/* 좌측하단: 위치정보 + 업로드시간 */}
                    <div style={{ 
                      position: 'absolute', 
                      left: 0, 
                      bottom: 0, 
                      right: 0, 
                      padding: '12px', 
                      background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
                      zIndex: 10
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {photo.detailedLocation && (
                          <p style={{ 
                            color: 'white', 
                            fontSize: '14px', 
                            fontWeight: 'bold', 
                            lineHeight: '1.2',
                            textShadow: '0 2px 8px rgba(0,0,0,0.8)',
                            margin: 0
                          }}>
                            📍 {photo.detailedLocation}
                          </p>
                        )}
                        {photo.time && (
                          <p style={{ 
                            color: 'rgba(255,255,255,0.9)', 
                            fontSize: '12px', 
                            fontWeight: '600', 
                            lineHeight: '1.2',
                            textShadow: '0 2px 8px rgba(0,0,0,0.8)',
                            margin: 0
                          }}>
                            ⏰ {photo.time}
                          </p>
                        )}
                      </div>
                  </div>
              </div>
            ))}
          </div>
            )}
        </div>

          {/* 개화 상황 */}
        <div>
          <div className="flex items-center justify-between px-4 pb-3 pt-8">
              <h2 className="text-[22px] font-bold leading-tight tracking-[-0.015em] text-text-headings dark:text-gray-100 flex items-center gap-2">
                🌸 {region.name} 개화 상황
                {bloomPhotos.length > 0 && (
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                    AI 자동 분류
                  </span>
                )}
            </h2>
              {bloomPhotos.length > 0 && (
            <button 
              onClick={() => navigate(`/region/${region.name}/category?type=blooming`)}
              className="text-sm font-medium text-text-body dark:text-gray-400 hover:text-primary transition-colors"
            >
              더보기
            </button>
              )}
          </div>

            {bloomPhotos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4">
                <span className="material-symbols-outlined text-5xl text-gray-300 dark:text-gray-600 mb-3">local_florist</span>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">개화 정보가 아직 없어요</p>
              </div>
            ) : (
          <div className="grid grid-cols-2 gap-3 px-4">
                {bloomPhotos.map((photo) => (
                  <div 
                    key={photo.id} 
                    className="relative overflow-hidden rounded-xl bg-gray-200 cursor-pointer group shadow-lg hover:shadow-xl transition-all"
                    onClick={() => navigate(`/post/${photo.id}`, { state: { post: photo } })}
              >
                <img
                      className="h-full w-full object-cover aspect-[1/1] group-hover:scale-105 transition-transform duration-300"
                      src={photo.image}
                  alt={`${region.name} 개화 상황`}
                />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                    
                    {/* 좌측상단: 카테고리 아이콘만 */}
                    <div className="absolute top-0 left-0 p-2">
                      <span className="text-lg font-bold bg-white/90 dark:bg-white/80 rounded-full w-9 h-9 flex items-center justify-center shadow-md backdrop-blur-sm">
                        🌸
                      </span>
                    </div>
                    
                    {/* 하단: 지역정보 + 시간 */}
                    <div className="absolute inset-x-0 bottom-0 p-2.5 flex flex-col gap-1">
                      {photo.detailedLocation && (
                        <p className="text-white text-sm font-bold truncate drop-shadow-lg">
                          📍 {photo.detailedLocation}
                        </p>
                      )}
                      {photo.time && (
                        <p className="text-white/90 text-xs font-medium drop-shadow-md">
                          ⏰ {photo.time}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>

          {/* 가볼만한곳 */}
        <div>
          <div className="flex items-center justify-between px-4 pb-3 pt-8">
              <h2 className="text-[22px] font-bold leading-tight tracking-[-0.015em] text-text-headings dark:text-gray-100 flex items-center gap-2">
                🏞️ {region.name} 가볼만한곳
                {touristSpots.length > 0 && (
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                    AI 자동 분류
                  </span>
                )}
            </h2>
              {touristSpots.length > 0 && (
            <button 
              onClick={() => navigate(`/region/${region.name}/category?type=spots`)}
              className="text-sm font-medium text-text-body dark:text-gray-400 hover:text-primary transition-colors"
            >
              더보기
            </button>
              )}
          </div>

            {touristSpots.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4">
                <span className="material-symbols-outlined text-5xl text-gray-300 dark:text-gray-600 mb-3">explore</span>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">추천 장소가 아직 없어요</p>
              </div>
            ) : (
          <div className="grid grid-cols-2 gap-3 px-4">
                {touristSpots.map((spot) => (
              <div 
                key={spot.id} 
                    className="relative overflow-hidden rounded-xl bg-gray-200 cursor-pointer group shadow-lg hover:shadow-xl transition-all"
                onClick={() => navigate(`/post/${spot.id}`, { state: { post: spot } })}
              >
                <img
                      className="h-full w-full object-cover aspect-[1/1] group-hover:scale-105 transition-transform duration-300"
                  src={spot.image}
                  alt={`${region.name} 추천 장소`}
                />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                    
                    {/* 좌측상단: 카테고리 아이콘만 */}
                    <div className="absolute top-0 left-0 p-2">
                      <span className="text-lg font-bold bg-white/90 dark:bg-white/80 rounded-full w-9 h-9 flex items-center justify-center shadow-md backdrop-blur-sm">
                        🏞️
                      </span>
                    </div>
                    
                    {/* 하단: 지역정보 + 시간 */}
                    <div className="absolute inset-x-0 bottom-0 p-2.5 flex flex-col gap-1">
                      {spot.detailedLocation && (
                        <p className="text-white text-sm font-bold truncate drop-shadow-lg">
                          📍 {spot.detailedLocation}
                        </p>
                      )}
                      {spot.time && (
                        <p className="text-white/90 text-xs font-medium drop-shadow-md">
                          ⏰ {spot.time}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 맛집 정보 */}
          <div>
            <div className="flex items-center justify-between px-4 pb-3 pt-8">
              <h2 className="text-[22px] font-bold leading-tight tracking-[-0.015em] text-text-headings dark:text-gray-100 flex items-center gap-2">
                🍜 {region.name} 맛집 정보
                {foodPhotos.length > 0 && (
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                    AI 자동 분류
                  </span>
                )}
              </h2>
              {foodPhotos.length > 0 && (
                <button 
                  onClick={() => navigate(`/region/${region.name}/category?type=food`)}
                  className="text-sm font-medium text-text-body dark:text-gray-400 hover:text-primary transition-colors"
                >
                  더보기
                </button>
              )}
            </div>

            {foodPhotos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4">
                <span className="material-symbols-outlined text-5xl text-gray-300 dark:text-gray-600 mb-3">restaurant</span>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">맛집 정보가 아직 없어요</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 px-4">
                {foodPhotos.map((food) => (
                  <div 
                    key={food.id} 
                    className="relative overflow-hidden rounded-xl bg-gray-200 cursor-pointer group shadow-lg hover:shadow-xl transition-all"
                    onClick={() => navigate(`/post/${food.id}`, { state: { post: food } })}
                  >
                    <img
                      className="h-full w-full object-cover aspect-[1/1] group-hover:scale-105 transition-transform duration-300"
                      src={food.image}
                      alt={`${region.name} 맛집`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                    
                    {/* 좌측상단: 카테고리 아이콘만 */}
                    <div className="absolute top-0 left-0 p-2">
                      <span className="text-lg font-bold bg-white/90 dark:bg-white/80 rounded-full w-9 h-9 flex items-center justify-center shadow-md backdrop-blur-sm">
                        🍜
                      </span>
                    </div>
                    
                    {/* 하단: 지역정보 + 시간 */}
                    <div className="absolute inset-x-0 bottom-0 p-2.5 flex flex-col gap-1">
                      {food.detailedLocation && (
                        <p className="text-white text-sm font-bold truncate drop-shadow-lg">
                          📍 {food.detailedLocation}
                        </p>
                      )}
                      {food.time && (
                        <p className="text-white/90 text-xs font-medium drop-shadow-md">
                          ⏰ {food.time}
                        </p>
                      )}
                </div>
              </div>
            ))}
              </div>
            )}
        </div>
        </main>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default RegionDetailScreen;













































