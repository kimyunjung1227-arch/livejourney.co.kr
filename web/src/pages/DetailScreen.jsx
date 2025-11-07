import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';

const DetailScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('filter') || 'realtime');
  const [selectedCategory, setSelectedCategory] = useState('자연');
  const [displayedItems, setDisplayedItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const loadMoreRef = useRef(null);
  const pageRef = useRef(0);
  
  const [realtimeData, setRealtimeData] = useState([]);
  const [crowdedData, setCrowdedData] = useState([]);
  const [recommendedData, setRecommendedData] = useState([]);
  
  // 해시태그 드래그 스크롤 상태
  const hashtagScrollRef = useRef(null);
  const [isDraggingHashtag, setIsDraggingHashtag] = useState(false);
  const [hashtagStartX, setHashtagStartX] = useState(0);
  const [hashtagScrollLeft, setHashtagScrollLeft] = useState(0);
  
  // 카테고리 목록 (메모이제이션)
  const categories = useMemo(() => ['자연', '힐링', '액티비티', '맛집', '카페'], []);

  // 해시태그 드래그 핸들러
  const handleHashtagDragStart = useCallback((e) => {
    if (!hashtagScrollRef.current) return;
    setIsDraggingHashtag(true);
    const pageX = e.type === 'touchstart' ? e.touches[0].pageX : e.pageX;
    setHashtagStartX(pageX - hashtagScrollRef.current.offsetLeft);
    setHashtagScrollLeft(hashtagScrollRef.current.scrollLeft);
    hashtagScrollRef.current.style.cursor = 'grabbing';
  }, []);

  const handleHashtagDragMove = useCallback((e) => {
    if (!isDraggingHashtag || !hashtagScrollRef.current) return;
    e.preventDefault();
    const pageX = e.type === 'touchmove' ? e.touches[0].pageX : e.pageX;
    const x = pageX - hashtagScrollRef.current.offsetLeft;
    const walk = (x - hashtagStartX) * 2;
    
    requestAnimationFrame(() => {
      if (hashtagScrollRef.current) {
        hashtagScrollRef.current.scrollLeft = hashtagScrollLeft - walk;
      }
    });
  }, [isDraggingHashtag, hashtagStartX, hashtagScrollLeft]);

  const handleHashtagDragEnd = useCallback(() => {
    setIsDraggingHashtag(false);
    if (hashtagScrollRef.current) {
      hashtagScrollRef.current.style.cursor = 'grab';
    }
  }, []);

  // 탭 목록 (메모이제이션)
  const tabs = useMemo(() => [
    { id: 'realtime', label: '실시간 정보' },
    { id: 'crowded', label: '실시간 밀집 지역' },
    { id: 'recommended', label: '추천 지역' }
  ], []);

  // 탭 변경 핸들러 (URL 업데이트 포함)
  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
    // URL 파라미터 업데이트 (히스토리 스택에 추가)
    navigate(`/detail?filter=${tabId}`, { replace: true });
  }, [navigate]);

  // 표시할 데이터 가져오기 (useCallback)
  const getDisplayData = useCallback(() => {
    switch (activeTab) {
      case 'realtime':
        return realtimeData;
      case 'crowded':
        return crowdedData;
      case 'recommended':
        return recommendedData.filter(item => item.category === selectedCategory);
      default:
        return realtimeData;
    }
  }, [activeTab, selectedCategory, realtimeData, crowdedData, recommendedData]);

  // 시간을 숫자로 변환하는 함수 (정렬용)
  const timeToMinutes = (timeLabel) => {
    if (timeLabel === '방금') return 0;
    if (timeLabel.includes('분 전')) return parseInt(timeLabel);
    if (timeLabel.includes('시간 전')) return parseInt(timeLabel) * 60;
    if (timeLabel.includes('일 전')) return parseInt(timeLabel) * 24 * 60;
    return 999999;
  };

  // 모든 데이터 로드 (useCallback)
  const loadAllData = useCallback(() => {
    let posts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');
    
    if (posts.length === 0) {
      setRealtimeData([]);
      setCrowdedData([]);
      setRecommendedData([]);
      return;
    }
    
    // 최신순 정렬
    posts = posts.sort((a, b) => {
      const timeA = timeToMinutes(a.timeLabel || '방금');
      const timeB = timeToMinutes(b.timeLabel || '방금');
      return timeA - timeB;
    });
    
    const realtimeFormatted = posts.slice(0, 100).map((post) => ({
      id: `realtime-${post.id}`,
      images: post.images,
      image: post.images[0],
      title: post.location,
      location: post.location,
      detailedLocation: post.detailedLocation || post.placeName || post.location,
      time: post.timeLabel || '방금',
      user: post.user || '여행자',
      badge: post.categoryName || '여행러버',
      weather: '맑음',
      category: post.category,
      categoryName: post.categoryName,
      aiLabels: post.aiLabels
    }));
    
    const crowdedFormatted = posts
      .filter((_, idx) => idx % 2 === 0)
      .slice(0, 80)
      .map((post) => ({
        id: `crowded-${post.id}`,
        images: post.images,
        image: post.images[0],
        title: post.location,
        location: post.location,
        detailedLocation: post.detailedLocation || post.placeName || post.location,
        badge: '인기',
        time: post.timeLabel || '방금',
        user: post.user || '여행자',
        weather: '맑음',
        category: post.category,
        categoryName: post.categoryName,
        aiLabels: post.aiLabels
      }));
    
    const recommendedFormatted = posts.slice(0, 100).map((post, idx) => {
      let assignedCategory = '자연';
      if (post.category === 'food') {
        assignedCategory = idx % 2 === 0 ? '맛집' : '카페';
      } else if (post.category === 'landmark' || post.category === 'scenic') {
        assignedCategory = idx % 2 === 0 ? '자연' : '힐링';
      } else if (post.category === 'bloom') {
        assignedCategory = '힐링';
      } else {
        assignedCategory = '액티비티';
      }
      
      return {
        id: `recommended-${post.id}`,
        images: post.images,
        image: post.images[0],
        title: post.location,
        location: post.location,
        detailedLocation: post.detailedLocation || post.placeName || post.location,
        badge: '추천',
        category: assignedCategory,
        tags: [assignedCategory],
        time: post.timeLabel || '방금',
        user: post.user || '여행자',
        weather: '맑음',
        categoryName: post.categoryName,
        aiLabels: post.aiLabels
      };
    });
    
    setRealtimeData(realtimeFormatted);
    setCrowdedData(crowdedFormatted);
    setRecommendedData(recommendedFormatted);
    
    console.log('📊 DetailScreen 데이터 로드:', {
      realtime: realtimeFormatted.length,
      crowded: crowdedFormatted.length,
      recommended: recommendedFormatted.length
    });
  }, []);

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
      console.log('✅ 모든 사진을 불러왔습니다!');
      return;
    }
    
    const remainingItems = baseData.length - startIndex;
    const itemsToLoad = Math.min(itemsPerPage, remainingItems);
    
    const newItems = baseData.slice(startIndex, startIndex + itemsToLoad);

    setDisplayedItems(prev => [...prev, ...newItems]);
    pageRef.current += 1;
    
    console.log(`📸 사진 ${itemsToLoad}개 로드 (${startIndex + itemsToLoad}/${baseData.length})`);
  }, [getDisplayData]);

  // 초기 데이터 로드 (자동 업데이트 제거)
  useEffect(() => {
    loadAllData();
    // 사용자가 새로고침할 때만 데이터 갱신
  }, [loadAllData]);

  // 탭 또는 카테고리 변경 시에만 스크롤 초기화
  useEffect(() => {
    pageRef.current = 0;
    setDisplayedItems([]);
    window.scrollTo(0, 0);
    
    // 즉시 사진 로드 (지연 제거)
    loadMoreItems();
  }, [activeTab, selectedCategory, loadMoreItems]);
  
  // 데이터 업데이트 시 현재 표시된 아이템 자동 갱신 (스크롤 유지)
  useEffect(() => {
    if (displayedItems.length > 0) {
      const baseData = getDisplayData();
      const currentPage = pageRef.current;
      const itemsPerPage = 12;
      const itemsToShow = Math.min(currentPage * itemsPerPage, baseData.length);
      const updatedItems = baseData.slice(0, itemsToShow);
      
      setDisplayedItems(updatedItems);
      console.log(`🔄 데이터 업데이트 - 스크롤 위치 유지 (${updatedItems.length}개 표시)`);
    }
  }, [realtimeData, crowdedData, recommendedData]);

  // 무한 스크롤 Intersection Observer
  useEffect(() => {
    const baseData = getDisplayData();
    const hasMoreData = displayedItems.length < baseData.length;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading && hasMoreData) {
          setIsLoading(true);
          setTimeout(() => {
            loadMoreItems();
            setIsLoading(false);
          }, 500);
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

  // 현재 표시 데이터 (useMemo)
  const currentDisplayData = useMemo(() => getDisplayData(), [getDisplayData]);

  return (
    <div className="flex h-full w-full flex-col bg-background-light dark:bg-background-dark">
      <div className="flex-shrink-0 z-20 flex flex-col bg-background-light dark:bg-background-dark border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between p-4">
          <button 
            onClick={() => navigate(-1)}
            className="flex size-10 shrink-0 items-center justify-center text-content-light dark:text-content-dark hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-text-primary-light dark:text-text-primary-dark text-xl font-bold leading-tight tracking-[-0.015em]">
            {activeTab === 'realtime' && '실시간 정보'}
            {activeTab === 'crowded' && '실시간 밀집지역'}
            {activeTab === 'recommended' && '추천 장소'}
          </h1>
          <div className="w-10"></div>
        </div>

        <div className="w-full">
          <div className="flex border-b border-zinc-200 dark:border-zinc-800 px-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex flex-col items-center justify-center border-b-[3px] pb-[13px] pt-2 px-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-b-primary text-primary'
                    : 'border-b-transparent text-text-secondary-light dark:text-text-secondary-dark'
                }`}
              >
                <p className="text-sm font-bold leading-normal tracking-[0.015em]">
                  {tab.label}
                </p>
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'recommended' && (
          <div className="w-full bg-background-light dark:bg-background-dark border-b border-zinc-200 dark:border-zinc-800">
            <div 
              ref={hashtagScrollRef}
              onMouseDown={handleHashtagDragStart}
              onMouseMove={handleHashtagDragMove}
              onMouseUp={handleHashtagDragEnd}
              onMouseLeave={handleHashtagDragEnd}
              onTouchStart={handleHashtagDragStart}
              onTouchMove={handleHashtagDragMove}
              onTouchEnd={handleHashtagDragEnd}
              className="flex gap-2 px-4 py-3 overflow-x-auto [-ms-scrollbar-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth cursor-grab active:cursor-grabbing select-none"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    selectedCategory === category
                      ? 'bg-primary text-white'
                      : 'bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark ring-1 ring-inset ring-black/10 dark:ring-white/10 hover:bg-primary/10'
                  }`}
                >
                  #{category}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        {displayedItems.length > 0 && (
          <div className="sticky top-0 z-10 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800 px-4 py-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                📸 총 <span className="text-primary font-bold">{currentDisplayData.length}</span>개의 사진
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                실시간 업데이트 중 🔄
              </p>
            </div>
          </div>
        )}

        {displayedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <span className="material-symbols-outlined text-7xl text-gray-300 dark:text-gray-600 mb-4">
              {activeTab === 'realtime' ? 'update' : activeTab === 'crowded' ? 'people' : 'recommend'}
            </span>
            <p className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2 text-center">
              {activeTab === 'realtime' && '실시간 정보가 아직 없어요'}
              {activeTab === 'crowded' && '밀집 지역 정보가 아직 없어요'}
              {activeTab === 'recommended' && '추천 장소가 아직 없어요'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6 max-w-xs">
              첫 번째로 여행 정보를 공유하고<br />다른 사용자들과 함께 만들어가요!
            </p>
            <button
              onClick={() => navigate('/upload')}
              className="bg-primary text-white px-6 py-3 rounded-full font-semibold hover:bg-primary/90 transition-colors"
            >
              정보 공유하기
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 p-4">
            {displayedItems.map((item) => (
              <div 
                key={item.id} 
                className="flex flex-col gap-2 cursor-pointer group"
                onClick={() => navigate(`/post/${item.id}`, { state: { post: item } })}
              >
                <div className="relative w-full overflow-hidden rounded-xl shadow-lg group-hover:shadow-xl transition-all">
                  <img
                    className="h-auto w-full object-cover aspect-square group-hover:scale-105 transition-transform duration-300"
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
              <div className="flex flex-col items-center gap-2 text-gray-500 dark:text-gray-400">
                <span className="material-symbols-outlined text-4xl">check_circle</span>
                <p className="text-sm font-semibold">모든 사진을 불러왔습니다!</p>
                <p className="text-xs">총 {currentDisplayData.length}개</p>
              </div>
            ) : null}
          </div>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
};

export default DetailScreen;









































