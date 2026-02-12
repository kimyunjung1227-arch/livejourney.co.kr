import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';
import { getWeatherByRegion } from '../api/weather';
import { filterRecentPosts, filterActivePosts48 } from '../utils/timeUtils';
import { toggleInterestPlace, isInterestPlace } from '../utils/interestPlaces';
import { getLandmarksByRegion } from '../utils/regionLandmarks';
import { logger } from '../utils/logger';
import { getCombinedPosts } from '../utils/mockData';
import { getDisplayImageUrl } from '../api/upload';
import { getRegionDefaultImage } from '../utils/regionDefaultImages';
import { useHorizontalDragScroll } from '../hooks/useHorizontalDragScroll';

const RegionDetailScreen = () => {
  const navigate = useNavigate();
  const { regionName } = useParams();
  const location = useLocation();
  const region = location.state?.region || { name: regionName || '서울' };
  const focusLocation = location.state?.focusLocation || null;

  const [realtimePhotos, setRealtimePhotos] = useState([]);
  const [allRegionPosts, setAllRegionPosts] = useState([]); // 전체 게시물 저장
  const [activeFilter, setActiveFilter] = useState('all'); // 필터 상태: 'all', 'blooming', 'spots', 'food'

  const filterScrollRef = useRef(null);
  const filterButtonRefs = useRef({});
  const { handleDragStart: handleFilterDrag, hasMovedRef: filterHasMovedRef } = useHorizontalDragScroll();

  const [weatherInfo, setWeatherInfo] = useState({
    icon: '☀️',
    condition: '맑음',
    temperature: '27℃',
    loading: false
  });

  const [isNotificationEnabled, setIsNotificationEnabled] = useState(false);
  const [selectedLandmarks, setSelectedLandmarks] = useState([]); // 선택된 명소 ID 목록
  const [showLandmarkModal, setShowLandmarkModal] = useState(false); // 명소 선택 모달 표시 여부
  const bodyRef = useRef(null);

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
    const localPosts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');
    const combinedPosts = getCombinedPosts(Array.isArray(localPosts) ? localPosts : []);

    // 7일 이내 게시물 필터링
    const recentPosts = filterActivePosts48(combinedPosts);
    logger.log(`📊 ${region.name} - 7일 이내 게시물: ${recentPosts.length}개`);

    let regionPosts = recentPosts.filter(
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
      logger.log(`🎯 상세 위치 필터 적용: ${focusLocation} → ${regionPosts.length}개 게시물`);
    }

    // 선택된 명소로 필터링 (현재 지역의 명소만 사용)
    if (selectedLandmarks.length > 0) {
      const currentRegionLandmarks = getLandmarksByRegion(region.name);
      const selectedLandmarkObjects = currentRegionLandmarks.filter(l =>
        selectedLandmarks.includes(l.id)
      );

      if (selectedLandmarkObjects.length > 0) {
        regionPosts = regionPosts.filter(post => {
          // 게시물의 위치 정보
          const postLocation = (post.detailedLocation || post.placeName || post.location || '').toLowerCase();
          const postTags = (post.tags || []).join(' ').toLowerCase();
          const postNote = (post.note || post.content || '').toLowerCase();
          const searchText = `${postLocation} ${postTags} ${postNote}`;

          // 선택된 명소 중 하나라도 키워드와 일치하면 true
          return selectedLandmarkObjects.some(landmark => {
            return landmark.keywords.some(keyword => {
              return searchText.includes(keyword.toLowerCase());
            });
          });
        });
        logger.log(`🏛️ ${region.name} 명소 필터 적용: ${selectedLandmarks.length}개 명소 → ${regionPosts.length}개 게시물`);
      }
    }

    regionPosts = regionPosts
      .sort((a, b) => {
        // 시간순 정렬 (최신순)
        const timeA = timeToMinutes(a.timeLabel || '방금');
        const timeB = timeToMinutes(b.timeLabel || '방금');
        return timeA - timeB;
      });


    const formattedPosts = regionPosts
      .map(post => ({
        ...post,
        id: post.id,
        images: (post.images || []).map(getDisplayImageUrl),
        videos: (post.videos || []).map(getDisplayImageUrl),
        image: getDisplayImageUrl(post.images?.[0] || post.videos?.[0] || post.image || post.thumbnail),
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

    setAllRegionPosts(formattedPosts);
    setRealtimePhotos(formattedPosts.slice(0, 6));

    logger.log('📊 지역 게시물 로드:', {
      total: formattedPosts.length
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

  // 날씨 정보 가져오기 (useCallback) - 재시도 로직 포함
  const fetchWeatherData = useCallback(async (forceRefresh = false) => {
    setWeatherInfo(prev => ({ ...prev, loading: true }));
    try {
      const result = await getWeatherByRegion(region.name, forceRefresh);
      if (result.success) {
        setWeatherInfo({
          icon: result.weather.icon,
          condition: result.weather.condition,
          temperature: result.weather.temperature,
          loading: false
        });
      } else {
        setWeatherInfo(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('날씨 정보 조회 실패:', error);
      setWeatherInfo(prev => ({ ...prev, loading: false }));
    }
  }, [region.name]);

  useEffect(() => {
    loadRegionData();
    fetchWeatherData();

    // 날씨 정보 주기적 갱신 (5분마다)
    const weatherInterval = setInterval(() => {
      logger.log(`🔄 날씨 정보 자동 갱신: ${region.name}`);
      fetchWeatherData(true); // 강제 새로고침
    }, 5 * 60 * 1000);

    // 게시물 업데이트 이벤트 리스너
    const handlePostsUpdate = () => {
      logger.log(`🔄 ${region.name} 지역상세 - 게시물 업데이트 감지`);
      loadRegionData();
    };

    window.addEventListener('postsUpdated', handlePostsUpdate);
    window.addEventListener('newPostsAdded', handlePostsUpdate);

    return () => {
      clearInterval(weatherInterval);
      window.removeEventListener('postsUpdated', handlePostsUpdate);
      window.removeEventListener('newPostsAdded', handlePostsUpdate);
    };
  }, [loadRegionData, fetchWeatherData, region.name]);

  // 상단에는 항상 그 지역의 특징이 담긴 대표 사진 표시 (지역상세 정체성)
  const heroImageUrl = getRegionDefaultImage(region.name || regionName);

  return (
    <div className="screen-layout bg-background-light dark:bg-background-dark relative h-screen overflow-hidden">
      <div className="screen-content relative">
        {/* 상단 풀블리드 사진 — 뒤로가기 구역까지 겹침 */}
        <div
          className="absolute top-0 left-0 right-0 z-0"
          style={{ height: '42vh', minHeight: 240 }}
        >
          <img
            src={heroImageUrl}
            alt={region.name}
            className="w-full h-full object-cover block"
            style={{ display: 'block' }}
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, transparent 50%, rgba(0,0,0,0.4) 100%)' }}
            aria-hidden
          />
        </div>

        {/* 뒤로가기 구역 — sticky + pointer-events-none 제거로 항상 클릭 가능 */}
        <header
          className="flex flex-col sticky top-0 z-[100] shrink-0"
          style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
        >
          <div className="flex items-center justify-between p-4 pb-2">
            <button
              type="button"
              onClick={() => {
                if (window.history.length > 1) {
                  navigate(-1);
                } else {
                  navigate('/main', { replace: true });
                }
              }}
              className="flex size-12 shrink-0 items-center justify-center text-white rounded-full bg-transparent hover:bg-black/20 transition-colors cursor-pointer touch-manipulation"
              aria-label="뒤로가기"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <span className="material-symbols-outlined text-2xl" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>arrow_back</span>
            </button>
            <h1 className="flex-1 text-center text-lg font-bold leading-tight tracking-[-0.015em] text-white" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.7)' }}>
              {region.name}
            </h1>
            <button
                onClick={handleNotificationToggle}
                className={`flex size-12 shrink-0 items-center justify-center rounded-full transition-colors ${isNotificationEnabled ? 'bg-white/20 hover:bg-white/30 text-primary' : 'bg-transparent hover:bg-black/20 text-white'}`}
                title={isNotificationEnabled ? "관심 지역 해제" : "관심 지역 추가"}
                style={!isNotificationEnabled ? { textShadow: '0 1px 3px rgba(0,0,0,0.6)' } : {}}
              >
                <span className="material-symbols-outlined text-2xl" style={isNotificationEnabled ? { fontVariationSettings: "'FILL' 1" } : {}}>
                  {isNotificationEnabled ? 'star' : 'star_outline'}
                </span>
              </button>
          </div>

          {/* 날씨 — 투명 배경 위에 반투명 팔레트 */}
          <div className="flex justify-center px-4 pb-3">
            <div className="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full bg-black/25 backdrop-blur-sm pl-4 pr-4 shadow-sm">
              {weatherInfo.loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/80 border-t-transparent"></div>
              ) : (
                <>
                  <span className="text-base">{weatherInfo.icon}</span>
                  <p className="text-sm font-medium leading-normal text-white" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                    {weatherInfo.condition}, {weatherInfo.temperature}
                  </p>
                </>
              )}
            </div>
          </div>
        </header>

        <div
          ref={bodyRef}
          className="screen-body relative z-10 bg-background-light dark:bg-background-dark rounded-t-[20px]"
          style={{ marginTop: '-16px', boxShadow: '0 -4px 20px rgba(0,0,0,0.08)', overflowY: 'auto', maxHeight: '58vh' }}
        >
          <main>

            {/* 현장 실시간 정보 */}
            <div>
              {/* 제목 + 대표명소 버튼 (우측) */}
              <div className="flex items-center justify-between px-4 pb-2 pt-5">
                <h2 className="text-[22px] font-bold leading-tight tracking-[-0.015em] text-text-headings dark:text-gray-100">
                  현지 실시간 상황
                </h2>
                <button
                  onClick={() => setShowLandmarkModal(true)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-primary bg-primary-soft hover:bg-primary/20 transition-colors whitespace-nowrap"
                >
                  {selectedLandmarks.length > 0
                    ? `${region.name} 대표명소 (${selectedLandmarks.length})`
                    : `${region.name} 대표명소 보기`
                  }
                </button>
              </div>

              {/* 필터 버튼 - 슬라이드 가능 */}
              <div className="pb-3 w-full">
                <div
                  ref={filterScrollRef}
                  onMouseDown={handleFilterDrag}
                  className="flex gap-2 px-4 overflow-x-scroll overflow-y-hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth cursor-grab"
                  style={{
                    WebkitOverflowScrolling: 'touch',
                    overflowX: 'scroll',
                    overflowY: 'hidden',
                    width: '100%',
                    scrollSnapType: 'x mandatory'
                  }}
                >
                  <button
                    ref={(el) => filterButtonRefs.current['all'] = el}
                    onClick={() => {
                      if (!filterHasMovedRef.current) setActiveFilter('all');
                    }}
                    style={{ scrollSnapAlign: 'start', scrollSnapStop: 'always' }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${activeFilter === 'all'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-text-secondary-light dark:text-text-secondary-dark hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                  >
                    전체
                  </button>
                  <button
                    ref={(el) => filterButtonRefs.current['blooming'] = el}
                    onClick={() => {
                      if (!filterHasMovedRef.current) setActiveFilter('blooming');
                    }}
                    style={{ scrollSnapAlign: 'start', scrollSnapStop: 'always' }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${activeFilter === 'blooming'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-text-secondary-light dark:text-text-secondary-dark hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                  >
                    🌸 개화정보
                  </button>
                  <button
                    ref={(el) => filterButtonRefs.current['spots'] = el}
                    onClick={() => {
                      if (!filterHasMovedRef.current) setActiveFilter('spots');
                    }}
                    style={{ scrollSnapAlign: 'start', scrollSnapStop: 'always' }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${activeFilter === 'spots'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-text-secondary-light dark:text-text-secondary-dark hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                  >
                    🏞️ 가볼만한 곳
                  </button>
                  <button
                    ref={(el) => filterButtonRefs.current['food'] = el}
                    onClick={() => {
                      if (!filterHasMovedRef.current) setActiveFilter('food');
                    }}
                    style={{ scrollSnapAlign: 'start', scrollSnapStop: 'always' }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${activeFilter === 'food'
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
                <div className="px-4 pb-4">
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                      rowGap: '7px',
                      columnGap: '7px'
                    }}
                  >
                    {realtimePhotos.map((photo) => {
                      const weather = photo.weather || null;
                      const hasWeather = weather && (weather.icon || weather.temperature);
                      const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '{}');
                      const isLiked = likedPosts[photo.id] || false;
                      const likeCount = photo.likes || photo.likeCount || 0;

                      return (
                        <div
                          key={photo.id}
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
                          style={{
                            background: '#ffffff',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            boxShadow: '0 2px 6px rgba(15,23,42,0.08)',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column'
                          }}
                        >
                          {/* 이미지: 정사각형, 좋아요 뱃지 포함 */}
                          <div style={{ width: '100%', paddingBottom: '100%', height: 0, position: 'relative', background: '#e5e7eb' }}>
                            {photo.videos && photo.videos.length > 0 ? (
                              <video
                                src={getDisplayImageUrl(photo.videos[0])}
                                className="w-full h-full object-cover"
                                style={{ position: 'absolute', top: 0, left: 0 }}
                                autoPlay
                                loop
                                muted
                                playsInline
                              />
                            ) : (
                              <>
                                {photo.image ? (
                                  <img
                                    src={getDisplayImageUrl(photo.image)}
                                    alt={photo.location || region.name}
                                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                  />
                                ) : (
                                  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1' }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>image</span>
                                  </div>
                                )}
                              </>
                            )}
                            <div style={{ position: 'absolute', bottom: '4px', right: '4px', background: 'rgba(255,255,255,0.9)', padding: '2px 6px', borderRadius: '999px', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', color: '#1f2937' }}>
                              <span className={`material-symbols-outlined text-base ${isLiked ? 'text-red-500' : 'text-gray-600'}`}>
                                favorite
                              </span>
                              <span>{likeCount}</span>
                            </div>
                          </div>

                          {/* 하단 시트: "지금 여기는" 더보기 스타일 */}
                          <div style={{ padding: '12px 14px 14px', background: '#f8fafc', borderTop: '3px solid #475569', boxShadow: '0 -2px 0 0 #475569, 0 2px 8px rgba(0,0,0,0.08)', minHeight: '92px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }}>
                              📍 {photo.detailedLocation || photo.placeName || photo.location || region.name}
                            </div>
                            {(photo.note || photo.content) && (
                              <div style={{ fontSize: '12px', color: '#4b5563', marginTop: '4px', lineHeight: 1.4, height: '2.8em', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                {photo.note || photo.content}
                              </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', flexShrink: 0, fontSize: '11px', color: '#6b7280' }}>
                              <span>{photo.time}</span>
                              {hasWeather && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  {weather.icon && <span>{weather.icon}</span>}
                                  {weather.temperature && <span>{weather.temperature}</span>}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* 위로가기 버튼 - 프로필 버튼 바로 위, 흰색 완전 원형 */}
      <button
        type="button"
        onClick={() => {
          if (bodyRef.current) {
            bodyRef.current.scrollTop = 0;
            if (typeof bodyRef.current.scrollTo === 'function') {
              bodyRef.current.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        style={{
          position: 'fixed',
          bottom: 'calc(80px + env(safe-area-inset-bottom, 0px) + 20px)',
          right: 'calc((100vw - 460px) / 2 + 20px)',
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.85)',
          border: '1px solid rgba(148,163,184,0.5)',
          boxShadow: '0 4px 14px rgba(15,23,42,0.22)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 200
        }}
        aria-label="위로가기"
      >
        <span className="material-symbols-outlined" style={{ fontSize: '22px', color: '#111827' }}>north</span>
      </button>

      <BottomNavigation />

      {/* 명소 선택 모달 - 화면 가운데 */}
      {showLandmarkModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowLandmarkModal(false)}
        >
          <div
            className="w-full max-w-lg bg-background-light dark:bg-background-dark rounded-2xl max-h-[85vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between p-4 border-b border-border-light dark:border-border-dark">
              <h3 className="text-lg font-bold text-text-headings dark:text-gray-100">
                {region.name} 대표 명소
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
                {region.name}의 대표 명소를 선택하세요. 선택한 명소의 사진만 표시됩니다.
              </p>
            </div>

            {/* 명소 목록 - 현재 지역만 */}
            <div className="flex-1 overflow-y-auto p-4">
              {(() => {
                const currentLandmarks = getLandmarksByRegion(region.name);

                if (currentLandmarks.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center py-12">
                      <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-4">location_off</span>
                      <p className="text-base font-medium text-gray-700 dark:text-gray-300 text-center">
                        {region.name}의 대표 명소 정보가 없습니다.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-2">
                    {currentLandmarks.map((landmark) => {
                      const isSelected = selectedLandmarks.includes(landmark.id);
                      return (
                        <button
                          key={landmark.id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedLandmarks(selectedLandmarks.filter(id => id !== landmark.id));
                            } else {
                              setSelectedLandmarks([...selectedLandmarks, landmark.id]);
                            }
                          }}
                          className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${isSelected
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
                );
              })()}
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















































