import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';

const RegionCategoryScreen = () => {
  const navigate = useNavigate();
  const { regionName } = useParams();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('type') || 'realtime');
  const [displayedItems, setDisplayedItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const loadMoreRef = useRef(null);
  const pageRef = useRef(0);

  const [realtimeData, setRealtimeData] = useState([]);
  const [bloomingData, setBloomingData] = useState([]);
  const [spotsData, setSpotsData] = useState([]);
  const [foodData, setFoodData] = useState([]);

  // 탭 목록 (메모이제이션)
  const tabs = useMemo(() => [
    { id: 'realtime', label: '현지 실시간 정보' },
    { id: 'blooming', label: '개화정보' },
    { id: 'spots', label: '가볼만한 곳' },
    { id: 'food', label: '맛집 정보' }
  ], []);

  // 탭 변경 핸들러 (URL 업데이트 포함)
  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
    // URL 파라미터 업데이트 (히스토리 유지)
    navigate(`/region/${regionName}/category?type=${tabId}`, { replace: true });
  }, [navigate, regionName]);

  // 표시할 데이터 가져오기 (useCallback)
  const getDisplayData = useCallback(() => {
    switch (activeTab) {
      case 'realtime':
        return realtimeData;
      case 'blooming':
        return bloomingData;
      case 'spots':
        return spotsData;
      case 'food':
        return foodData;
      default:
        return realtimeData;
    }
  }, [activeTab, realtimeData, bloomingData, spotsData, foodData]);

  // 시간을 숫자로 변환하는 함수 (정렬용)
  const timeToMinutes = (timeLabel) => {
    if (timeLabel === '방금') return 0;
    if (timeLabel.includes('분 전')) return parseInt(timeLabel);
    if (timeLabel.includes('시간 전')) return parseInt(timeLabel) * 60;
    if (timeLabel.includes('일 전')) return parseInt(timeLabel) * 24 * 60;
    return 999999; // 알 수 없는 경우 맨 뒤로
  };

  // 지역 데이터 로드 (useCallback)
  const loadRegionData = useCallback(() => {
    const allPosts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');
    
    const regionPosts = allPosts.filter(
      post => post.location?.includes(regionName) || post.location === regionName
    )
    .sort((a, b) => {
      // 시간순 정렬 (최신순)
      const timeA = timeToMinutes(a.timeLabel || '방금');
      const timeB = timeToMinutes(b.timeLabel || '방금');
      return timeA - timeB;
    });

    if (regionPosts.length === 0) {
      setRealtimeData([]);
      setBloomingData([]);
      setSpotsData([]);
      setFoodData([]);
      return;
    }

    const realtimeFormatted = regionPosts.map((post) => ({
      id: `realtime-${post.id}`,
      images: post.images,
      image: post.images[0],
      location: post.location,
      detailedLocation: post.detailedLocation || post.placeName || post.location,
      placeName: post.placeName,
      address: post.address,
      time: post.timeLabel || '방금',
      user: post.user || '여행자',
      weather: '맑음',
      category: post.category,
      categoryName: post.categoryName,
      aiLabels: post.aiLabels
    }));

    const bloomFormatted = regionPosts
      .filter(post => post.category === 'bloom')
      .map((post) => ({
        id: `bloom-${post.id}`,
        images: post.images,
        image: post.images[0],
        location: post.location,
        detailedLocation: post.detailedLocation || post.placeName || post.location,
        placeName: post.placeName,
        address: post.address,
        time: post.timeLabel || '방금',
        user: post.user || '여행자',
        weather: '맑음',
        category: post.category,
        categoryName: post.categoryName,
        aiLabels: post.aiLabels
      }));

    const spotsFormatted = regionPosts
      .filter(post => post.category === 'landmark' || post.category === 'scenic')
      .map((post) => ({
        id: `spot-${post.id}`,
        images: post.images,
        image: post.images[0],
        location: post.location,
        detailedLocation: post.detailedLocation || post.placeName || post.location,
        placeName: post.placeName,
        address: post.address,
        time: post.timeLabel || '방금',
        user: post.user || '여행자',
        weather: '맑음',
        category: post.category,
        categoryName: post.categoryName,
        aiLabels: post.aiLabels
      }));

    const foodFormatted = regionPosts
      .filter(post => post.category === 'food')
      .map((post) => ({
        id: `food-${post.id}`,
        images: post.images,
        image: post.images[0],
        location: post.location,
        detailedLocation: post.detailedLocation || post.placeName || post.location,
        placeName: post.placeName,
        address: post.address,
        time: post.timeLabel || '방금',
        user: post.user || '여행자',
        weather: '맛집',
        category: post.category,
        categoryName: post.categoryName,
        aiLabels: post.aiLabels
      }));

    setRealtimeData(realtimeFormatted);
    setBloomingData(bloomFormatted);
    setSpotsData(spotsFormatted);
    setFoodData(foodFormatted);

    console.log(`📊 ${regionName} 지역 데이터 로드:`, {
      realtime: realtimeFormatted.length,
      bloom: bloomFormatted.length,
      spots: spotsFormatted.length,
      food: foodFormatted.length
    });
  }, [regionName]);

  // 더 많은 아이템 로드 (useCallback)
  const loadMoreItems = useCallback(() => {
    const baseData = getDisplayData();
    if (baseData.length === 0) {
      setDisplayedItems([]);
      return;
    }
    
    const itemsPerPage = 12;
    const startIndex = pageRef.current * itemsPerPage;
    
    if (startIndex >= baseData.length) {
      return;
    }
    
    const remainingItems = baseData.length - startIndex;
    const itemsToLoad = Math.min(itemsPerPage, remainingItems);
    const newItems = baseData.slice(startIndex, startIndex + itemsToLoad);

    setDisplayedItems(prev => [...prev, ...newItems]);
    pageRef.current += 1;
  }, [getDisplayData]);

  // URL 파라미터 확인
  useEffect(() => {
    const type = searchParams.get('type');
    if (type) {
      setActiveTab(type);
    }
  }, [searchParams]);

  // 초기 데이터 로드 (자동 업데이트 제거)
  useEffect(() => {
    loadRegionData();
    // 사용자가 새로고침할 때만 데이터 갱신
  }, [loadRegionData]);

  // 탭 변경 시에만 스크롤 초기화
  useEffect(() => {
    pageRef.current = 0;
    setDisplayedItems([]);
    window.scrollTo(0, 0);
    
    // 즉시 사진 로드 (지연 제거)
    loadMoreItems();
  }, [activeTab, loadMoreItems]);
  
  // 데이터 업데이트 시 현재 표시된 아이템 자동 갱신 (스크롤 유지)
  useEffect(() => {
    if (displayedItems.length > 0) {
      const baseData = getDisplayData();
      const currentPage = pageRef.current;
      const itemsPerPage = 12;
      const itemsToShow = Math.min(currentPage * itemsPerPage, baseData.length);
      const updatedItems = baseData.slice(0, itemsToShow);
      
      setDisplayedItems(updatedItems);
      console.log(`🔄 ${regionName} 데이터 업데이트 - 스크롤 위치 유지`);
    }
  }, [realtimeData, bloomingData, spotsData, foodData]);

  // 무한 스크롤
  useEffect(() => {
    const baseData = getDisplayData();
    const hasMoreData = displayedItems.length < baseData.length;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading && hasMoreData) {
          setIsLoading(true);
          // 즉시 로드 (지연 제거)
          loadMoreItems();
          setIsLoading(false);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current && hasMoreData) {
      observer.observe(loadMoreRef.current);
    }

    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
    };
  }, [isLoading, displayedItems, getDisplayData, loadMoreItems]);

  const currentDisplayData = useMemo(() => getDisplayData(), [getDisplayData]);

  return (
    <div className="flex h-full w-full flex-col bg-background-light dark:bg-background-dark">
      <div className="flex-shrink-0 z-20 flex flex-col bg-background-light dark:bg-background-dark border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between p-4">
          <button 
            onClick={() => navigate(-1)}
            className="flex size-10 shrink-0 items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-xl font-bold">{regionName}</h1>
          <div className="w-10"></div>
        </div>

        <div className="w-full overflow-x-auto">
          <div className="flex border-b border-zinc-200 dark:border-zinc-800 px-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex flex-col items-center justify-center border-b-[3px] pb-[13px] pt-2 px-3 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-b-primary text-primary'
                    : 'border-b-transparent text-text-secondary-light dark:text-text-secondary-dark'
                }`}
              >
                <p className="text-xs font-bold">{tab.label}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        {displayedItems.length > 0 && (
          <div className="sticky top-0 z-10 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800 px-4 py-3">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              📸 총 <span className="text-primary font-bold">{currentDisplayData.length}</span>개의 사진
            </p>
          </div>
        )}

        {displayedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <span className="material-symbols-outlined text-7xl text-gray-300 dark:text-gray-600 mb-4">photo_camera</span>
            <p className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">아직 사진이 없어요</p>
            <button
              onClick={() => navigate('/upload')}
              className="bg-primary text-white px-6 py-3 rounded-full font-semibold hover:bg-primary/90 transition-colors mt-4"
            >
              사진 업로드
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 p-4">
            {displayedItems.map((item) => (
              <div 
                key={item.id} 
                className="cursor-pointer group"
                onClick={() => navigate(`/post/${item.id}`, { state: { post: item } })}
              >
                <div className="relative w-full overflow-hidden rounded-xl shadow-md group-hover:shadow-xl transition-shadow">
                  <img
                    className="w-full aspect-square object-cover group-hover:scale-105 transition-transform"
                    src={item.image}
                    alt={item.location}
                  />
                  {/* 그라데이션 오버레이 */}
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.3))' }}></div>
                  
                  {/* 좌측상단: 카테고리 아이콘만 */}
                  {item.categoryName && (
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
                        {item.categoryName === '개화 상황' && '🌸'}
                        {item.categoryName === '추천 장소' && '🏞️'}
                        {item.categoryName === '맛집 정보' && '🍜'}
                        {item.categoryName === '가볼만한곳' && '🗺️'}
                        {!['개화 상황', '추천 장소', '맛집 정보', '가볼만한곳'].includes(item.categoryName) && '📷'}
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
                      {item.detailedLocation && (
                        <p style={{ 
                          color: 'white', 
                          fontSize: '14px', 
                          fontWeight: 'bold', 
                          lineHeight: '1.2',
                          textShadow: '0 2px 8px rgba(0,0,0,0.8)',
                          margin: 0
                        }}>
                          📍 {item.detailedLocation}
                        </p>
                      )}
                      {item.time && (
                        <p style={{ 
                          color: 'rgba(255,255,255,0.9)', 
                          fontSize: '12px', 
                          fontWeight: '600', 
                          lineHeight: '1.2',
                          textShadow: '0 2px 8px rgba(0,0,0,0.8)',
                          margin: 0
                        }}>
                          ⏰ {item.time}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {displayedItems.length > 0 && (
          <div ref={loadMoreRef} className="flex justify-center items-center p-8">
            {isLoading ? (
              <div className="flex items-center gap-2 text-primary">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span className="text-sm">사진 불러오는 중...</span>
              </div>
            ) : displayedItems.length >= currentDisplayData.length ? (
              <div className="flex flex-col items-center gap-2 text-gray-500">
                <span className="material-symbols-outlined text-4xl">check_circle</span>
                <p className="text-sm font-semibold">모든 사진을 불러왔습니다!</p>
              </div>
            ) : null}
          </div>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
};

export default RegionCategoryScreen;










































