import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';
import { getWeatherByRegion, getTrafficByRegion } from '../api/weather';
import { filterRecentPosts } from '../utils/timeUtils';
import { toggleInterestPlace, isInterestPlace } from '../utils/interestPlaces';
import { getLandmarksByRegion, isPostMatchingLandmarks, REGION_LANDMARKS } from '../utils/regionLandmarks';

const RegionDetailScreen = () => {
  const navigate = useNavigate();
  const { regionName } = useParams();
  const location = useLocation();
  const region = location.state?.region || { name: regionName || '서울' };
  const focusLocation = location.state?.focusLocation || null;

  const [realtimePhotos, setRealtimePhotos] = useState([]);
  const [allRegionPosts, setAllRegionPosts] = useState([]); // 전체 게시물 저장
  const [activeFilter, setActiveFilter] = useState('all'); // 필터 상태: 'all', 'blooming', 'spots', 'food'
  
  // 필터 스크롤 관련 refs
  const filterScrollRef = useRef(null);
  const filterButtonRefs = useRef({});
  
  // 필터 드래그 스크롤 상태
  const [isDraggingFilter, setIsDraggingFilter] = useState(false);
  const [filterStartX, setFilterStartX] = useState(0);
  const [filterScrollLeft, setFilterScrollLeft] = useState(0);
  const [hasMovedFilter, setHasMovedFilter] = useState(false);
  
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
  
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(false);
  const [selectedLandmarks, setSelectedLandmarks] = useState([]); // 선택된 명소 ID 목록
  const [showLandmarkModal, setShowLandmarkModal] = useState(false); // 명소 선택 모달 표시 여부
  
  // 관심 지역 상태 확인
  useEffect(() => {
    setIsNotificationEnabled(isInterestPlace(region.name || regionName));
  }, [region.name, regionName]);
  
  const handleNotificationToggle = () => {
    const newState = toggleInterestPlace(region.name || regionName);
    setIsNotificationEnabled(newState);
  };

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
    
    // 2일 이상 된 게시물 필터링 ⭐
    uploadedPosts = filterRecentPosts(uploadedPosts, 2);
    console.log(`📊 ${region.name} - 2일 이내 게시물: ${uploadedPosts.length}개`);
    
    // Mock 데이터 생성 비활성화 - 프로덕션 모드
    if (uploadedPosts.length === 0) {
      console.log('📭 최근 2일 이내 업로드된 게시물이 없습니다.');
    }
    
    let regionPosts = uploadedPosts.filter(
      post => post.location?.includes(region.name) || post.location === region.name
    );

    // 매거진 등에서 상세 위치(focusLocation)가 넘어온 경우, 해당 위치 중심으로 한 번 더 필터링
    if (focusLocation) {
      const focus = focusLocation.toLowerCase();
      regionPosts = regionPosts.filter(post => {
        const detailed = (post.detailedLocation || post.placeName || '').toLowerCase();
        const locText = (post.location || '').toLowerCase();
        return detailed.includes(focus) || locText.includes(focus);
      });
      console.log(`🎯 상세 위치 필터 적용: ${focusLocation} → ${regionPosts.length}개 게시물`);
    }

    // 선택된 명소로 필터링 (모든 지역의 명소 지원)
    if (selectedLandmarks.length > 0) {
      regionPosts = regionPosts.filter(post => {
        // 선택된 명소 ID 형식: "지역명_명소ID"
        return selectedLandmarks.some(landmarkId => {
          const [landmarkRegion, landmarkIdOnly] = landmarkId.split('_');
          const landmarks = getLandmarksByRegion(landmarkRegion);
          const landmark = landmarks.find(l => l.id === landmarkIdOnly);
          
          if (!landmark) return false;
          
          // 게시물의 위치 정보
          const postLocation = (post.detailedLocation || post.placeName || post.location || '').toLowerCase();
          const postTags = (post.tags || []).join(' ').toLowerCase();
          const postNote = (post.note || post.content || '').toLowerCase();
          const searchText = `${postLocation} ${postTags} ${postNote}`;
          
          // 명소의 키워드와 일치하는지 확인
          return landmark.keywords.some(keyword => {
            return searchText.includes(keyword.toLowerCase());
          });
        });
      });
      console.log(`🏛️ 명소 필터 적용: ${selectedLandmarks.length}개 명소 → ${regionPosts.length}개 게시물`);
    }

    regionPosts = regionPosts
    .sort((a, b) => {
      // 시간순 정렬 (최신순)
      const timeA = timeToMinutes(a.timeLabel || '방금');
      const timeB = timeToMinutes(b.timeLabel || '방금');
      return timeA - timeB;
    });
    
    
    const allPosts = regionPosts
      .map(post => ({
        ...post, // 원본 게시물의 모든 필드 포함
        id: post.id,
        images: post.images || [],
        videos: post.videos || [],
        image: post.images?.[0] || post.videos?.[0] || post.image,
        time: post.timeLabel || '방금',
        timeLabel: post.timeLabel || '방금',
        category: post.category || '일반',
        categoryName: post.categoryName,
        labels: post.aiLabels,
        detailedLocation: post.detailedLocation || post.placeName,
        placeName: post.placeName,
        address: post.address,
        location: post.location,
        tags: post.tags || post.aiLabels || [],
        note: post.note || post.content,
        likes: post.likes || post.likeCount || 0,
        user: post.user || '여행자',
        userId: post.userId,
        comments: post.comments || [],
        qnaList: post.qnaList || [],
        timestamp: post.timestamp || post.createdAt || post.time,
      }));
    
    setAllRegionPosts(allPosts);
    setRealtimePhotos(allPosts.slice(0, 6));
    
    console.log('📊 지역 게시물 로드:', {
      total: allPosts.length
    });
  }, [region.name, timeToMinutes, selectedLandmarks]);

  // 필터에 따른 게시물 필터링 및 표시
  useEffect(() => {
    let filtered = [];
    
    if (activeFilter === 'all') {
      filtered = allRegionPosts;
    } else if (activeFilter === 'blooming') {
      filtered = allRegionPosts.filter(post => post.category === 'bloom');
    } else if (activeFilter === 'spots') {
      filtered = allRegionPosts.filter(post => post.category === 'landmark' || post.category === 'scenic');
    } else if (activeFilter === 'food') {
      filtered = allRegionPosts.filter(post => post.category === 'food');
    } else {
      filtered = allRegionPosts;
    }
    
    setRealtimePhotos(filtered.slice(0, 6));
  }, [allRegionPosts, activeFilter]);

  // 필터 드래그 스크롤 핸들러
  const handleFilterMouseDown = useCallback((e) => {
    if (!filterScrollRef.current) return;
    
    setIsDraggingFilter(true);
    setHasMovedFilter(false);
    setFilterStartX(e.pageX);
    setFilterScrollLeft(filterScrollRef.current.scrollLeft);
    if (filterScrollRef.current) {
      filterScrollRef.current.style.cursor = 'grabbing';
      filterScrollRef.current.style.userSelect = 'none';
    }
  }, []);

  // 전역 마우스 이벤트 리스너
  useEffect(() => {
    if (!isDraggingFilter) return;
    
    const handleGlobalMouseMove = (e) => {
      if (!filterScrollRef.current) return;
      
      e.preventDefault();
      e.stopPropagation();
      
      const walk = (e.pageX - filterStartX) * 2;
      
      if (Math.abs(walk) > 5) {
        setHasMovedFilter(true);
      }
      
      filterScrollRef.current.scrollLeft = filterScrollLeft - walk;
    };
    
    const handleGlobalMouseUp = () => {
      setIsDraggingFilter(false);
      if (filterScrollRef.current) {
        filterScrollRef.current.style.cursor = 'grab';
        filterScrollRef.current.style.userSelect = 'auto';
      }
      // 약간의 지연 후 hasMovedFilter 초기화
      setTimeout(() => {
        setHasMovedFilter(false);
      }, 100);
    };
    
    document.addEventListener('mousemove', handleGlobalMouseMove, { passive: false });
    document.addEventListener('mouseup', handleGlobalMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDraggingFilter, filterStartX, filterScrollLeft]);

  const handleFilterMouseLeave = useCallback(() => {
    // 마우스가 나가도 드래그는 계속 (전역 리스너가 처리)
  }, []);

  // 필터 변경 시 해당 버튼이 앞으로 오도록 스크롤
  useEffect(() => {
    if (filterButtonRefs.current[activeFilter] && filterScrollRef.current) {
      const button = filterButtonRefs.current[activeFilter];
      const container = filterScrollRef.current;
      
      // 약간의 지연을 두어 DOM 업데이트 완료 후 스크롤
      setTimeout(() => {
        if (button && container) {
          // 버튼의 위치 계산
          const buttonLeft = button.offsetLeft;
          const buttonWidth = button.offsetWidth;
          const containerWidth = container.clientWidth;
          const containerScrollLeft = container.scrollLeft;
          const buttonRight = buttonLeft + buttonWidth;
          const containerRight = containerScrollLeft + containerWidth;
          
          // 버튼이 보이는 영역 밖에 있으면 스크롤
          if (buttonLeft < containerScrollLeft) {
            // 버튼이 왼쪽에 있으면 맨 앞으로
            container.scrollTo({
              left: buttonLeft - 16, // px-4 패딩 고려
              behavior: 'smooth'
            });
          } else if (buttonRight > containerRight) {
            // 버튼이 오른쪽에 있으면 보이도록
            container.scrollTo({
              left: buttonLeft - containerWidth + buttonWidth + 16,
              behavior: 'smooth'
            });
          }
        }
      }, 150);
    }
  }, [activeFilter]);

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
    
    // 게시물 업데이트 이벤트 리스너
    const handlePostsUpdate = () => {
      console.log(`🔄 ${region.name} 지역상세 - 게시물 업데이트 감지`);
      loadRegionData();
    };
    
    window.addEventListener('postsUpdated', handlePostsUpdate);
    window.addEventListener('newPostsAdded', handlePostsUpdate);
    
    return () => {
      window.removeEventListener('postsUpdated', handlePostsUpdate);
      window.removeEventListener('newPostsAdded', handlePostsUpdate);
    };
  }, [loadRegionData, fetchWeatherData, fetchTrafficData, region.name]);

  return (
    <div className="screen-layout bg-background-light dark:bg-background-dark">
      <div className="screen-content">
        <header className="screen-header flex flex-col border-b border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900 relative z-50">
        <div className="flex items-center justify-between p-4 pb-2">
          <button 
            onClick={() => navigate(-1)}
            className="flex size-12 shrink-0 items-center justify-center text-content-light dark:text-content-dark hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-2xl">arrow_back</span>
          </button>
          <h1 className="flex-1 text-center text-lg font-bold leading-tight tracking-[-0.015em] text-content-light dark:text-content-dark">
            {region.name}
          </h1>
          {/* 관심 지역 버튼 */}
          <button
            onClick={handleNotificationToggle}
            className={`flex size-12 shrink-0 items-center justify-center rounded-lg transition-colors ${
              isNotificationEnabled
                ? 'bg-primary/10 hover:bg-primary/20'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            title={isNotificationEnabled ? "관심 지역 해제" : "관심 지역 추가"}
          >
            <span 
              className={`material-symbols-outlined text-2xl ${
                isNotificationEnabled ? 'text-primary' : 'text-gray-600 dark:text-gray-400'
              }`}
              style={isNotificationEnabled ? { fontVariationSettings: "'FILL' 1" } : {}}
            >
              {isNotificationEnabled ? 'star' : 'star_outline'}
            </span>
          </button>
        </div>
        
        {/* 날씨/교통 정보 - 지역 이름 바로 아래 */}
        <div className="flex justify-center gap-2 px-4 pb-3">
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
      </header>

        <div className="screen-body">
          <main>

          {/* 현장 실시간 정보 */}
        <div>
          <div className="flex items-center justify-between px-4 pb-3 pt-5">
            <h2 className="text-[22px] font-bold leading-tight tracking-[-0.015em] text-text-headings dark:text-gray-100">
              현지 실시간 상황
            </h2>
            <button
              onClick={() => setShowLandmarkModal(true)}
              className="px-3 py-1.5 rounded-lg text-sm font-semibold text-primary bg-primary-soft hover:bg-primary/20 transition-colors"
            >
              {selectedLandmarks.length > 0 
                ? `주요 명소 (${selectedLandmarks.length})`
                : '모든 지역 명소보기'
              }
            </button>
          </div>

          {/* 필터 버튼 - 슬라이드 가능 */}
          <div className="pb-3 w-full">
            <div 
              ref={filterScrollRef}
              onMouseDown={handleFilterMouseDown}
              onMouseLeave={handleFilterMouseLeave}
              className="flex gap-2 px-4 overflow-x-scroll overflow-y-hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth"
              style={{ 
                WebkitOverflowScrolling: 'touch',
                overflowX: 'scroll',
                overflowY: 'hidden',
                width: '100%',
                cursor: 'grab'
              }}
            >
              <button
                ref={(el) => filterButtonRefs.current['all'] = el}
                onClick={() => {
                  if (!hasMovedFilter) {
                    setActiveFilter('all');
                  }
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                  activeFilter === 'all'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-text-secondary-light dark:text-text-secondary-dark hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                전체
              </button>
              <button
                ref={(el) => filterButtonRefs.current['blooming'] = el}
                onClick={() => {
                  if (!hasMovedFilter) {
                    setActiveFilter('blooming');
                  }
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                  activeFilter === 'blooming'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-text-secondary-light dark:text-text-secondary-dark hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                🌸 개화정보
              </button>
              <button
                ref={(el) => filterButtonRefs.current['spots'] = el}
                onClick={() => {
                  if (!hasMovedFilter) {
                    setActiveFilter('spots');
                  }
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                  activeFilter === 'spots'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-text-secondary-light dark:text-text-secondary-dark hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                🏞️ 가볼만한 곳
              </button>
              <button
                ref={(el) => filterButtonRefs.current['food'] = el}
                onClick={() => {
                  if (!hasMovedFilter) {
                    setActiveFilter('food');
                  }
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                  activeFilter === 'food'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-text-secondary-light dark:text-text-secondary-dark hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                🍜 맛집 정보
              </button>
            </div>
          </div>

            {realtimePhotos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-4">add_a_photo</span>
                <p className="text-base font-medium text-gray-700 dark:text-gray-300 mb-2 text-center">
                  {region.name}의 실시간 정보가 없어요
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">
                  첫 번째 사진을 공유해보세요!
                </p>
                <button
                  onClick={() => navigate('/upload')}
                  className="bg-primary text-white px-6 py-3 rounded-full font-semibold hover:bg-primary/90 transition-colors shadow-lg flex items-center gap-2 mx-auto"
                >
                  <span className="material-symbols-outlined">add_a_photo</span>
                  첫 사진 올리기
                </button>
              </div>
            ) : (
          <div className="grid grid-cols-2 gap-4 px-4">
            {realtimePhotos.map((photo) => {
              const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '{}');
              const isLiked = likedPosts[photo.id] || false;
              const likeCount = photo.likes || photo.likeCount || 0;
              
              return (
              <div 
                key={photo.id} 
                  className="cursor-pointer group"
                onClick={() => {
                  const currentIndex = allRegionPosts.findIndex(p => p.id === photo.id);
                  navigate(`/post/${photo.id}`, { 
                    state: { 
                      post: photo,
                      allPosts: allRegionPosts,
                      currentPostIndex: currentIndex >= 0 ? currentIndex : 0
                    } 
                  });
                }}
              >
                  <div>
                    {/* 이미지 */}
                    <div className="relative w-full aspect-[4/5] overflow-hidden rounded-lg mb-3">
                      {photo.videos && photo.videos.length > 0 ? (
                        <video
                          src={photo.videos[0]}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          autoPlay
                          loop
                          muted
                          playsInline
                        />
                      ) : (
                <img
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  src={photo.image}
                  alt={`${region.name} 실시간 정보`}
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
                            {photo.detailedLocation || photo.placeName || photo.location || region.name}
                          </p>
                          {/* 업로드 시간 - 지역 옆에 */}
                        {photo.time && (
                            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                            {photo.time}
                            </p>
                          )}
                        </div>
                        {photo.detailedLocation && photo.detailedLocation !== photo.location && (
                          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-0.5">
                            {photo.location}
                          </p>
                        )}
                      </div>
                      
                      {/* 해시태그 - 지역 이름 밑에 (줄 바꿈 없이) */}
                      {photo.tags && photo.tags.length > 0 && (
                        <div className="flex gap-1.5 overflow-x-auto [-ms-scrollbar-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                          {photo.tags.slice(0, 5).map((tag, tagIndex) => (
                            <span key={tagIndex} className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0">
                              #{typeof tag === 'string' ? tag.replace('#', '') : tag}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {/* 메모/내용 */}
                      {photo.note && (
                        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark line-clamp-2">
                          {photo.note}
                          </p>
                        )}
                      </div>
                  </div>
              </div>
              );
            })}
          </div>
            )}
        </div>
        </main>
        </div>
      </div>

      <BottomNavigation />

      {/* 명소 선택 모달 - 모든 지역의 명소 표시 */}
      {showLandmarkModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-end justify-center z-50"
          onClick={() => setShowLandmarkModal(false)}
        >
          <div 
            className="w-full max-w-lg bg-background-light dark:bg-background-dark rounded-t-3xl max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between p-4 border-b border-border-light dark:border-border-dark">
              <h3 className="text-lg font-bold text-text-headings dark:text-gray-100">
                모든 지역 주요 명소
              </h3>
              <button
                onClick={() => setShowLandmarkModal(false)}
                className="material-symbols-outlined text-text-secondary-light dark:text-text-secondary-dark"
              >
                close
              </button>
            </div>

            {/* 설명 */}
            <div className="px-4 pt-4">
              <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                보고 싶은 명소를 선택하세요. 선택한 명소의 사진만 표시됩니다.
              </p>
            </div>

            {/* 명소 목록 - 모든 지역 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {Object.entries(REGION_LANDMARKS).map(([regionName, landmarks]) => (
                <div key={regionName} className="space-y-2">
                  {/* 지역 헤더 */}
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                    <h4 className="text-base font-bold text-text-headings dark:text-gray-100">
                      {regionName}
                    </h4>
                    <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                      ({landmarks.length}개)
                    </span>
                  </div>
                  
                  {/* 해당 지역의 명소들 */}
                  <div className="space-y-2 pl-2">
                    {landmarks.map((landmark) => {
                      const landmarkId = `${regionName}_${landmark.id}`;
                      const isSelected = selectedLandmarks.includes(landmarkId);
                      return (
                        <button
                          key={landmarkId}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedLandmarks(selectedLandmarks.filter(id => id !== landmarkId));
                            } else {
                              setSelectedLandmarks([...selectedLandmarks, landmarkId]);
                            }
                          }}
                          className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                            isSelected
                              ? 'bg-primary-soft border-primary text-primary'
                              : 'bg-background dark:bg-card-dark border-border-light dark:border-border-dark text-text-headings dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800'
                          }`}
                        >
                          <span className={`text-sm font-medium ${isSelected ? 'text-primary' : ''}`}>
                            {landmark.name}
                          </span>
                          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                            {isSelected ? 'check_circle' : 'radio_button_unchecked'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* 푸터 */}
            <div className="flex gap-2 p-4 border-t border-border-light dark:border-border-dark">
              <button
                onClick={() => {
                  setSelectedLandmarks([]);
                  setShowLandmarkModal(false);
                }}
                className="flex-1 px-4 py-3 rounded-xl bg-background dark:bg-card-dark text-text-secondary-light dark:text-text-secondary-dark font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                초기화
              </button>
              <button
                onClick={() => {
                  setShowLandmarkModal(false);
                  loadRegionData();
                }}
                className="flex-1 px-4 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-colors"
              >
                {selectedLandmarks.length > 0 ? `${selectedLandmarks.length}개 선택됨` : '확인'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegionDetailScreen;















































