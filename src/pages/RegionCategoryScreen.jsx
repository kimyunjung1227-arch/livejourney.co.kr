import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';
import { filterRecentPosts } from '../utils/timeUtils';

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
    let allPosts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');
    
    // 2일 이상 된 게시물 필터링 ⭐
    allPosts = filterRecentPosts(allPosts, 2);
    console.log(`📊 ${regionName} - 2일 이내 게시물: ${allPosts.length}개`);
    
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
      images: post.images || [],
      videos: post.videos || [],
      image: post.images?.[0] || post.videos?.[0] || '',
      location: post.location,
      detailedLocation: post.detailedLocation || post.placeName || post.location,
      placeName: post.placeName,
      address: post.address,
      time: post.timeLabel || '방금',
      user: post.user || '여행자',
      weather: '맑음',
      category: post.category,
      categoryName: post.categoryName,
      aiLabels: post.aiLabels,
      tags: post.tags || post.aiLabels || [],
      note: post.note || post.content,
      likes: post.likes || post.likeCount || 0
    }));

    const bloomFormatted = regionPosts
      .filter(post => post.category === 'bloom')
      .map((post) => ({
        id: `bloom-${post.id}`,
        images: post.images || [],
        videos: post.videos || [],
        image: post.images?.[0] || post.videos?.[0] || '',
        location: post.location,
        detailedLocation: post.detailedLocation || post.placeName || post.location,
        placeName: post.placeName,
        address: post.address,
        time: post.timeLabel || '방금',
        user: post.user || '여행자',
        weather: '맑음',
        category: post.category,
        categoryName: post.categoryName,
        aiLabels: post.aiLabels,
        tags: post.tags || post.aiLabels || [],
        note: post.note || post.content,
        likes: post.likes || post.likeCount || 0
      }));

    const spotsFormatted = regionPosts
      .filter(post => post.category === 'landmark' || post.category === 'scenic')
      .map((post) => ({
        id: `spot-${post.id}`,
        images: post.images || [],
        videos: post.videos || [],
        image: post.images?.[0] || post.videos?.[0] || '',
        location: post.location,
        detailedLocation: post.detailedLocation || post.placeName || post.location,
        placeName: post.placeName,
        address: post.address,
        time: post.timeLabel || '방금',
        user: post.user || '여행자',
        weather: '맑음',
        category: post.category,
        categoryName: post.categoryName,
        aiLabels: post.aiLabels,
        tags: post.tags || post.aiLabels || [],
        note: post.note || post.content,
        likes: post.likes || post.likeCount || 0
      }));

    const foodFormatted = regionPosts
      .filter(post => post.category === 'food')
      .map((post) => ({
        id: `food-${post.id}`,
        images: post.images || [],
        videos: post.videos || [],
        image: post.images?.[0] || post.videos?.[0] || '',
        location: post.location,
        detailedLocation: post.detailedLocation || post.placeName || post.location,
        placeName: post.placeName,
        address: post.address,
        time: post.timeLabel || '방금',
        user: post.user || '여행자',
        weather: '맛집',
        category: post.category,
        categoryName: post.categoryName,
        aiLabels: post.aiLabels,
        tags: post.tags || post.aiLabels || [],
        note: post.note || post.content,
        likes: post.likes || post.likeCount || 0
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
    <div className="screen-layout bg-background-light dark:bg-background-dark">
      <div className="screen-content">
        <div className="screen-header flex-shrink-0 flex flex-col bg-white dark:bg-gray-900 border-b border-zinc-200 dark:border-zinc-800 shadow-sm relative z-50">
        <div className="flex items-center justify-between p-4">
          <button 
            onClick={() => navigate(-1)}
            className="flex size-12 shrink-0 items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-2xl">arrow_back</span>
          </button>
          <div className="flex flex-col">
          <h1 className="text-xl font-bold">{regionName}</h1>
            {(() => {
              // 첫 번째 게시물의 detailedLocation을 가져와서 표시
              const firstItem = displayedItems.length > 0 ? displayedItems[0] : null;
              const samplePost = realtimeData.length > 0 ? realtimeData[0] : 
                                bloomingData.length > 0 ? bloomingData[0] :
                                spotsData.length > 0 ? spotsData[0] :
                                foodData.length > 0 ? foodData[0] : null;
              const detailedLocation = samplePost?.detailedLocation || samplePost?.placeName;
              
              if (detailedLocation && detailedLocation !== regionName && !detailedLocation.includes(regionName)) {
                return <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">{detailedLocation}</p>;
              }
              return null;
            })()}
          </div>
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

        <main className="flex-1 overflow-y-auto overflow-x-hidden screen-body">
        {displayedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <span className="material-symbols-outlined text-7xl text-gray-300 dark:text-gray-600 mb-4">photo_camera</span>
            <p className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">아직 사진이 없어요</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">
              첫 번째 사진을 공유해보세요!
            </p>
            <button
              onClick={() => navigate('/upload')}
              className="bg-primary text-white px-6 py-3 rounded-full font-semibold hover:bg-primary/90 transition-colors shadow-lg flex items-center gap-2"
            >
              <span className="material-symbols-outlined">add_a_photo</span>
              첫 사진 올리기
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 p-4">
            {displayedItems.map((item) => {
              const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '{}');
              const isLiked = likedPosts[item.id] || false;
              const likeCount = item.likes || item.likesCount || 0;
              
              return (
              <div 
                key={item.id} 
                className="cursor-pointer group"
                  onClick={() => {
                    const allPosts = getDisplayData();
                    const currentIndex = allPosts.findIndex(p => p.id === item.id);
                    navigate(`/post/${item.id}`, { 
                      state: { 
                        post: item,
                        allPosts: allPosts,
                        currentPostIndex: currentIndex >= 0 ? currentIndex : 0
                      } 
                    });
                  }}
              >
                  <div>
                    {/* 이미지 */}
                      <div className="relative w-full aspect-[4/5] overflow-hidden rounded-lg mb-3">
                      {item.videos && item.videos.length > 0 ? (
                        <video
                          src={item.videos[0]}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          autoPlay
                          loop
                          muted
                          playsInline
                          onMouseEnter={(e) => e.target.play()}
                          onMouseLeave={(e) => e.target.pause()}
                        />
                      ) : (
                  <img
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    src={item.image}
                    alt={item.location}
                  />
                      )}
                  
                  
                      {/* 우측 하단 하트 아이콘 */}
                      <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-md">
                        <span className={`material-symbols-outlined text-base ${isLiked ? 'text-red-500 fill' : 'text-gray-600'}`}>
                          favorite
                        </span>
                        <span className="text-sm font-semibold text-gray-700">{likeCount}</span>
                      </div>
                    </div>
                    
                    {/* 이미지 밖 하단 텍스트 */}
                    <div className="space-y-2">
                      {/* 지역 상세 정보 */}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-base font-bold text-text-primary-light dark:text-text-primary-dark">
                            {item.detailedLocation || item.placeName || item.location || regionName}
                          </p>
                          {/* 업로드 시간 - 지역 옆에 */}
                          {item.time && (
                            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                              {item.time}
                            </p>
                          )}
                        </div>
                        {item.detailedLocation && item.detailedLocation !== item.location && (
                          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-0.5">
                            {item.location}
                        </p>
                      )}
                      </div>
                      
                      {/* 해시태그 - 지역 이름 밑에 (줄 바꿈 없이) */}
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex gap-1.5 overflow-x-auto [-ms-scrollbar-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                          {item.tags.slice(0, 5).map((tag, tagIndex) => (
                            <span key={tagIndex} className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0">
                              #{typeof tag === 'string' ? tag.replace('#', '') : tag}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {/* 메모/내용 */}
                      {item.note && (
                        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark line-clamp-2">
                          {item.note}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
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
      </div>

      <BottomNavigation />
    </div>
  );
};

export default RegionCategoryScreen;










































