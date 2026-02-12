import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';
import { filterRecentPosts, filterActivePosts48, getTimeAgo } from '../utils/timeUtils';
import { logger } from '../utils/logger';
import { useHorizontalDragScroll } from '../hooks/useHorizontalDragScroll';

const DetailScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('filter') || 'realtime');
  const [selectedTag, setSelectedTag] = useState(null);
  const [displayedItems, setDisplayedItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [popularTags, setPopularTags] = useState([]);
  const loadMoreRef = useRef(null);
  const pageRef = useRef(0);

  const [realtimeData, setRealtimeData] = useState([]);
  const [crowdedData, setCrowdedData] = useState([]);
  const [recommendedData, setRecommendedData] = useState([]);

  const { handleDragStart: handleHashtagDrag, hasMovedRef: hashtagHasMovedRef } = useHorizontalDragScroll();

  // 모든 게시물에서 태그 수집 및 인기 태그 계산
  const extractPopularTags = useCallback((posts) => {
    const tagCountMap = new Map();

    posts.forEach(post => {
      const tags = post.tags || [];
      tags.forEach(tag => {
        // 태그에서 # 제거하고 정규화
        const cleanTag = typeof tag === 'string' ? tag.replace(/^#+/, '').trim() : String(tag).replace(/^#+/, '').trim();

        // 빈 문자열 제외, 최소 2글자 이상만
        if (cleanTag && cleanTag.length >= 2) {
          tagCountMap.set(cleanTag, (tagCountMap.get(cleanTag) || 0) + 1);
        }
      });
    });

    // 빈도수 기준으로 정렬하고 상위 10개 추출
    const sortedTags = Array.from(tagCountMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag]) => tag);

    return sortedTags;
  }, []);

  const withHashtagDragCheck = useCallback((fn) => () => {
    if (!hashtagHasMovedRef.current) fn();
  }, [hashtagHasMovedRef]);

  // 탭 목록 (메모이제이션)
  const tabs = useMemo(() => [
    { id: 'realtime', label: '지금 여기는!' },
    { id: 'crowded', label: '지금 사람 많은 곳!' },
    { id: 'recommended', label: '추천 장소' }
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
        if (!selectedTag) {
          return recommendedData;
        }
        return recommendedData.filter(item => {
          const tags = item.tags || [];
          return tags.some(tag => {
            const cleanTag = typeof tag === 'string' ? tag.replace(/^#+/, '').trim() : String(tag).replace(/^#+/, '').trim();
            return cleanTag === selectedTag;
          });
        });
      default:
        return realtimeData;
    }
  }, [activeTab, selectedTag, realtimeData, crowdedData, recommendedData]);

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

    // 2일 이상 된 게시물 필터링 ⭐
    posts = filterActivePosts48(posts);
    console.log(`📊 상세화면 - 2일 이내 게시물: ${posts.length}개`);

    if (posts.length === 0) {
      setRealtimeData([]);
      setCrowdedData([]);
      setRecommendedData([]);
      return;
    }

    const realtimeFormatted = posts.slice(0, 100).map((post) => {
      // timestamp 기반으로 동적 시간 계산
      const dynamicTime = getTimeAgo(post.timestamp || post.createdAt || post.time);

      return {
        id: post.id,
        images: post.images || [],
        videos: post.videos || [],
        image: post.images?.[0] || post.videos?.[0] || '',
        title: post.location,
        location: post.location,
        detailedLocation: post.detailedLocation || post.location,
        placeName: post.placeName || post.location,
        time: dynamicTime,
        timeLabel: dynamicTime,
        timestamp: post.timestamp || post.createdAt || post.time,
        user: post.user || '여행자',
        userId: post.userId,
        badge: post.categoryName || '여행러버',
        category: post.category,
        categoryName: post.categoryName,
        content: post.note || `${post.location}의 아름다운 순간!`,
        note: post.note,
        tags: post.tags || [],
        coordinates: post.coordinates,
        likes: post.likes || 0,
        comments: post.comments || [],
        questions: post.questions || [],
        qnaList: [],
        aiLabels: post.aiLabels,
        // EXIF 데이터 추가
        photoDate: post.photoDate || null,
        verifiedLocation: post.verifiedLocation || null,
        exifData: post.exifData || null
      };
    });

    // 1시간 이내 게시물 + 'waiting' 카테고리 중심 (인기 섹션)
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    const crowdedFormatted = posts
      .filter(post => {
        const postTime = new Date(post.timestamp || post.createdAt || post.time).getTime();
        // 1시간 이내거나, 'waiting' 카테고리인 경우 포함
        return postTime > oneHourAgo || post.category === 'waiting';
      })
      .slice(0, 150)
      .map((post) => {
        const dynamicTime = getTimeAgo(post.timestamp || post.createdAt || post.time);

        return {
          id: post.id,
          images: post.images || [],
          videos: post.videos || [],
          image: post.images?.[0] || post.videos?.[0] || '',
          title: post.location,
          location: post.location,
          detailedLocation: post.detailedLocation || post.location,
          placeName: post.placeName || post.location,
          badge: '인기',
          category: post.category || '자연',
          categoryName: post.categoryName,
          time: dynamicTime,
          timeLabel: dynamicTime,
          timestamp: post.timestamp || post.createdAt || post.time,
          user: post.user || '여행자',
          userId: post.userId,
          content: post.note || `${post.location}의 인기 명소!`,
          note: post.note,
          tags: post.tags || [],
          coordinates: post.coordinates,
          likes: post.likes || 0,
          comments: post.comments || [],
          questions: post.questions || [],
          aiLabels: post.aiLabels
        };
      });

    const recommendedFormatted = posts.slice(0, 200).map((post, idx) => {
      const dynamicTime = getTimeAgo(post.timestamp || post.createdAt || post.time);

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
        id: post.id,
        images: post.images || [],
        videos: post.videos || [],
        image: post.images?.[0] || post.videos?.[0] || '',
        title: post.location,
        location: post.location,
        detailedLocation: post.detailedLocation || post.location,
        placeName: post.placeName || post.location,
        badge: '추천',
        category: assignedCategory,
        categoryName: post.categoryName,
        tags: post.tags || [assignedCategory],
        time: dynamicTime,
        timeLabel: dynamicTime,
        timestamp: post.timestamp || post.createdAt || post.time,
        user: post.user || '여행자',
        userId: post.userId,
        content: post.note || `${post.location} 추천!`,
        note: post.note,
        coordinates: post.coordinates,
        likes: post.likes || 0,
        comments: post.comments || [],
        questions: post.questions || [],
        aiLabels: post.aiLabels
      };
    });

    setRealtimeData(realtimeFormatted);
    setCrowdedData(crowdedFormatted);
    setRecommendedData(recommendedFormatted);

    // 추천 섹션에서 사용할 인기 태그 추출
    const allRecommendedPosts = [...realtimeFormatted, ...crowdedFormatted, ...recommendedFormatted];
    const tags = extractPopularTags(allRecommendedPosts);
    setPopularTags(tags);

    logger.log('📊 DetailScreen 데이터 로드:', {
      realtime: realtimeFormatted.length,
      crowded: crowdedFormatted.length,
      recommended: recommendedFormatted.length,
      popularTags: tags.length
    });
  }, [getTimeAgo, extractPopularTags]);

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
      logger.log('✅ 모든 사진을 불러왔습니다!');
      return;
    }

    const remainingItems = baseData.length - startIndex;
    const itemsToLoad = Math.min(itemsPerPage, remainingItems);

    const newItems = baseData.slice(startIndex, startIndex + itemsToLoad);

    setDisplayedItems(prev => [...prev, ...newItems]);
    pageRef.current += 1;

    logger.log(`📸 사진 ${itemsToLoad}개 로드 (${startIndex + itemsToLoad}/${baseData.length})`);
  }, [getDisplayData]);

  // 초기 데이터 로드 (자동 업데이트 제거)
  useEffect(() => {
    loadAllData();
    // 사용자가 새로고침할 때만 데이터 갱신
  }, [loadAllData]);

  // 탭 또는 태그 변경 시에만 스크롤 초기화
  useEffect(() => {
    pageRef.current = 0;
    setDisplayedItems([]);
    window.scrollTo(0, 0);

    // 즉시 사진 로드 (지연 제거)
    loadMoreItems();
  }, [activeTab, selectedTag, loadMoreItems]);

  // 데이터 업데이트 시 현재 표시된 아이템 자동 갱신 (스크롤 유지)
  useEffect(() => {
    if (displayedItems.length > 0) {
      const baseData = getDisplayData();
      const currentPage = pageRef.current;
      const itemsPerPage = 12;
      const itemsToShow = Math.min(currentPage * itemsPerPage, baseData.length);
      const updatedItems = baseData.slice(0, itemsToShow);

      setDisplayedItems(updatedItems);
      logger.log(`🔄 데이터 업데이트 - 스크롤 위치 유지 (${updatedItems.length}개 표시)`);
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
    <div className="screen-layout bg-background-light dark:bg-background-dark">
      <div className="screen-content">
        <div className="screen-header flex-shrink-0 flex flex-col bg-white dark:bg-gray-900 border-b border-zinc-200 dark:border-zinc-800 shadow-sm relative z-50">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => navigate(-1)}
              className="flex size-12 shrink-0 items-center justify-center text-content-light dark:text-content-dark hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-2xl">arrow_back</span>
            </button>
            <h1 className="text-text-primary-light dark:text-text-primary-dark text-[22px] font-bold leading-tight tracking-[-0.015em]">
              {activeTab === 'realtime' && '지금 여기는!'}
              {activeTab === 'crowded' && '지금 사람 많은 곳!'}
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
                  className={`flex flex-col items-center justify-center border-b-[3px] pb-[13px] pt-2 px-2 transition-colors ${activeTab === tab.id
                    ? 'border-b-primary text-primary'
                    : 'border-b-transparent text-text-subtle-light dark:text-text-subtle-dark'
                    }`}
                >
                  <p className="text-sm font-bold leading-normal tracking-[0.015em]">
                    {tab.label}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'recommended' && popularTags.length > 0 && (
            <div className="w-full bg-background-light dark:bg-background-dark border-b border-zinc-200 dark:border-zinc-800">
              <div className="px-4 pt-3 pb-2">
                <p className="text-xs text-text-subtle-light dark:text-text-subtle-dark mb-2 font-medium flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">local_fire_department</span>
                  사람들이 많이 찾는 태그
                </p>
              </div>
              <div
                onMouseDown={handleHashtagDrag}
                className="flex gap-2 px-4 pb-3 overflow-x-auto [-ms-scrollbar-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth cursor-grab active:cursor-grabbing select-none"
                style={{ WebkitOverflowScrolling: 'touch', scrollSnapType: 'x mandatory' }}
              >
                <button
                  onClick={withHashtagDragCheck(() => setSelectedTag(null))}
                  style={{ scrollSnapAlign: 'start', scrollSnapStop: 'always' }}
                  className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 select-none flex items-center gap-1.5 ${selectedTag === null
                    ? 'bg-primary text-white scale-105 shadow-md'
                    : 'bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark ring-1 ring-inset ring-black/10 dark:ring-white/10 hover:bg-primary/10 hover:scale-105'
                    }`}
                >
                  <span className="material-symbols-outlined text-base">explore</span>
                  전체
                </button>
                {popularTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={withHashtagDragCheck(() => setSelectedTag(tag))}
                    style={{ scrollSnapAlign: 'start', scrollSnapStop: 'always' }}
                    className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 select-none ${selectedTag === tag
                      ? 'bg-primary/20 text-primary scale-105 shadow-md border-2 border-primary/30'
                      : 'bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark ring-1 ring-inset ring-black/10 dark:ring-white/10 hover:bg-primary/10 hover:scale-105 border-2 border-transparent'
                      }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <main className="flex-1 overflow-y-auto overflow-x-hidden screen-body">
          {displayedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4">
              <span className="material-symbols-outlined text-7xl text-gray-300 dark:text-gray-600 mb-4">
                {activeTab === 'realtime' ? 'update' : activeTab === 'crowded' ? 'people' : (selectedTag ? 'search_off' : 'recommend')}
              </span>
              <p className="text-base font-medium text-gray-500 dark:text-gray-400 mb-2 text-center">
                {activeTab === 'realtime' && '아직 지금 이곳의 모습이 올라오지 않았어요'}
                {activeTab === 'crowded' && '아직 어디가 붐비는지 정보가 없어요'}
                {activeTab === 'recommended' && selectedTag && (
                  <>
                    <span className="font-bold text-primary">#{selectedTag}</span> 태그로 추천된 장소가 없어요
                  </>
                )}
                {activeTab === 'recommended' && !selectedTag && '추천 장소가 아직 없어요'}
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center mb-4 max-w-xs">
                {activeTab === 'realtime' && '지금 보고 있는 장소와 분위기, 날씨가 보이도록 한 장만 남겨 주세요'}
                {activeTab === 'crowded' && '지금 있는 곳의 상황과 느낌을 남겨 주면 다른 사람들의 선택에 도움이 돼요'}
                {activeTab === 'recommended' && selectedTag && '다른 태그를 선택하거나 전체를 확인해보세요'}
                {activeTab === 'recommended' && !selectedTag && '첫 번째로 추천 장소를 공유해보세요!'}
              </p>
              {activeTab === 'recommended' && selectedTag ? (
                <button
                  onClick={() => setSelectedTag(null)}
                  className="bg-primary text-white px-6 py-3 rounded-full font-semibold hover:bg-primary/90 transition-colors shadow-lg flex items-center gap-2"
                >
                  <span className="material-symbols-outlined">explore</span>
                  전체 보기
                </button>
              ) : (
                <button
                  onClick={() => navigate('/upload')}
                  className="bg-primary text-white px-6 py-3 rounded-full font-semibold hover:bg-primary/90 transition-colors shadow-lg flex items-center gap-2"
                >
                  <span className="material-symbols-outlined">add_a_photo</span>
                  첫 사진 올리기
                </button>
              )}
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

                      {/* 이미지 밖 하단 텍스트 - 사진 아래 시트 스타일 통일 */}
                      <div className="space-y-1.5" style={{ borderTop: '3px solid #475569', background: '#f8fafc', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', padding: '12px 14px 14px', marginTop: 0 }}>
                        {/* 지역 상세 정보 */}
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
                              {item.verifiedLocation || item.detailedLocation || item.placeName || item.location || '여행지'}
                            </p>
                            {/* 업로드 시간 - 지역 옆에 */}
                            {item.time && (
                              <p className="text-[11px] text-text-secondary-light dark:text-text-secondary-dark">
                                {item.time}
                                {item.photoDate && (
                                  <span className="ml-0.5 text-[9px] text-green-600 dark:text-green-400" title={`촬영: ${new Date(item.photoDate).toLocaleString('ko-KR')}`}>
                                    (EXIF)
                                  </span>
                                )}
                              </p>
                            )}
                          </div>
                          {item.detailedLocation && item.detailedLocation !== item.location && (
                            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-0.5">
                              {item.location}
                            </p>
                          )}
                        </div>

                        {/* 해시태그 - 글자 크기 살짝 축소 */}
                        {item.tags && item.tags.length > 0 && (
                          <div className="flex gap-1.5 overflow-x-auto [-ms-scrollbar-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            {item.tags.slice(0, 5).map((tag, tagIndex) => (
                              <span key={tagIndex} className="text-[11px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
                                #{typeof tag === 'string' ? tag.replace('#', '') : tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* 메모/내용 - 한 줄 더 가볍게 */}
                        {item.note && (
                          <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark leading-snug line-clamp-2">
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
                <div className="flex flex-col items-center gap-2 text-gray-500 dark:text-gray-400">
                  <span className="material-symbols-outlined text-4xl">check_circle</span>
                  <p className="text-sm font-semibold">모든 사진을 불러왔습니다!</p>
                  <p className="text-xs">총 {currentDisplayData.length}개</p>
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

export default DetailScreen;









































