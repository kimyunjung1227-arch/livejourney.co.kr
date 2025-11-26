import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';
import { getWeatherByRegion, getTrafficByRegion } from '../api/weather';
import { seedMockData } from '../utils/mockUploadData';
import { filterRecentPosts } from '../utils/timeUtils';

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
    
    // 2일 이상 된 게시물 필터링 ⭐
    uploadedPosts = filterRecentPosts(uploadedPosts, 2);
    console.log(`📊 ${region.name} - 2일 이내 게시물: ${uploadedPosts.length}개`);
    
    // Mock 데이터 생성 비활성화 - 프로덕션 모드
    if (uploadedPosts.length === 0) {
      console.log('📭 최근 2일 이내 업로드된 게시물이 없습니다.');
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
      .map(post => ({
        ...post, // 원본 게시물의 모든 필드 포함
        id: post.id,
        images: post.images || [],
        videos: post.videos || [],
        image: post.images?.[0] || post.videos?.[0] || post.image,
        time: post.timeLabel || '방금',
        timeLabel: post.timeLabel || '방금',
        category: post.categoryName,
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
    
    const touristPosts = regionPosts
      .filter(post => post.category === 'landmark' || post.category === 'scenic')
      .map(post => ({
        ...post, // 원본 게시물의 모든 필드 포함
        id: post.id,
        images: post.images || [],
        videos: post.videos || [],
        image: post.images?.[0] || post.videos?.[0] || post.image,
        time: post.timeLabel || '방금',
        timeLabel: post.timeLabel || '방금',
        category: post.categoryName,
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
    
    const foodPosts = regionPosts
      .filter(post => post.category === 'food')
      .map(post => ({
        ...post, // 원본 게시물의 모든 필드 포함
        id: post.id,
        images: post.images || [],
        videos: post.videos || [],
        image: post.images?.[0] || post.videos?.[0] || post.image,
        time: post.timeLabel || '방금',
        timeLabel: post.timeLabel || '방금',
        category: post.categoryName,
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
    
    const realtimePosts = regionPosts
      .map(post => ({
        ...post, // 원본 게시물의 모든 필드 포함
        id: post.id,
        images: post.images || [],
        videos: post.videos || [],
        image: post.images?.[0] || post.videos?.[0] || post.image,
        time: post.timeLabel || '방금',
        timeLabel: post.timeLabel || '방금',
        category: post.categoryName || '일반',
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
    
    setBloomPhotos(bloomPosts.slice(0, 6));
    setTouristSpots(touristPosts.slice(0, 6));
    setFoodPhotos(foodPosts.slice(0, 6));
    setRealtimePhotos(realtimePosts.slice(0, 6));
    
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
        <header className="screen-header flex items-center justify-between border-b border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900 relative z-50">
        <button 
          onClick={() => navigate(-1)}
          className="flex size-12 shrink-0 items-center justify-center text-content-light dark:text-content-dark hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-2xl">arrow_back</span>
        </button>
        <h1 className="flex-1 text-center text-lg font-bold leading-tight tracking-[-0.015em] text-content-light dark:text-content-dark">
          {region.name}
        </h1>
        <div className="w-12"></div>
      </header>

        <div className="screen-body">
          <main>
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
                  const allPosts = [...realtimePhotos, ...bloomPhotos, ...touristSpots, ...foodPhotos];
                  const currentIndex = allPosts.findIndex(p => p.id === photo.id);
                  navigate(`/post/${photo.id}`, { 
                    state: { 
                      post: photo,
                      allPosts: allPosts,
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

          {/* 가볼만한곳 - 첫 번째 */}
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
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 text-center mb-1">추천 장소가 아직 없어요</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 text-center mb-3">첫 번째 사진을 공유해보세요!</p>
                <button
                  onClick={() => navigate('/upload')}
                  className="bg-primary text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-primary/90 transition-colors shadow-md flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">add_a_photo</span>
                  첫 사진 올리기
                </button>
              </div>
            ) : (
          <div className="grid grid-cols-2 gap-4 px-4">
                {touristSpots.map((spot) => {
                  const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '{}');
                  const isLiked = likedPosts[spot.id] || false;
                  const likeCount = spot.likes || spot.likeCount || 0;
                  
                  return (
              <div 
                key={spot.id} 
                      className="cursor-pointer group"
                onClick={() => {
                  const allPosts = [...realtimePhotos, ...bloomPhotos, ...touristSpots, ...foodPhotos];
                  const currentIndex = allPosts.findIndex(p => p.id === spot.id);
                  navigate(`/post/${spot.id}`, { 
                    state: { 
                      post: spot,
                      allPosts: allPosts,
                      currentPostIndex: currentIndex >= 0 ? currentIndex : 0
                    } 
                  });
                }}
              >
                      <div>
                        {/* 이미지 */}
                        <div className="relative w-full aspect-[4/5] overflow-hidden rounded-lg mb-3">
                          {spot.videos && spot.videos.length > 0 ? (
                            <video
                              src={spot.videos[0]}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              autoPlay
                              loop
                              muted
                              playsInline
                            />
                          ) : (
                <img
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  src={spot.image}
                  alt={`${region.name} 추천 장소`}
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
                                {spot.detailedLocation || spot.placeName || spot.location || region.name}
                        </p>
                              {/* 업로드 시간 - 지역 옆에 */}
                      {spot.time && (
                                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                          {spot.time}
                        </p>
                      )}
                    </div>
                            {spot.detailedLocation && spot.detailedLocation !== spot.location && (
                              <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-0.5">
                                {spot.location}
                              </p>
                            )}
                  </div>
                          
                          {/* 해시태그 - 지역 이름 밑에 (줄 바꿈 없이) */}
                          {spot.tags && spot.tags.length > 0 && (
                            <div className="flex gap-1.5 overflow-x-auto [-ms-scrollbar-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                              {spot.tags.slice(0, 5).map((tag, tagIndex) => (
                                <span key={tagIndex} className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0">
                                  #{typeof tag === 'string' ? tag.replace('#', '') : tag}
                                </span>
                              ))}
                            </div>
                          )}
                          
                          {/* 메모/내용 */}
                          {spot.note && (
                            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark line-clamp-2">
                              {spot.note}
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

          {/* 개화 상황 - 두 번째 */}
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
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 text-center mb-1">개화 정보가 아직 없어요</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 text-center mb-3">첫 번째 사진을 공유해보세요!</p>
                <button
                  onClick={() => navigate('/upload')}
                  className="bg-primary text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-primary/90 transition-colors shadow-md flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">add_a_photo</span>
                  첫 사진 올리기
                </button>
              </div>
            ) : (
          <div className="grid grid-cols-2 gap-4 px-4">
                {bloomPhotos.map((photo) => {
                  const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '{}');
                  const isLiked = likedPosts[photo.id] || false;
                  const likeCount = photo.likes || photo.likeCount || 0;
                  
                  return (
                  <div 
                    key={photo.id} 
                      className="cursor-pointer group"
                    onClick={() => {
                      const allPosts = [...realtimePhotos, ...bloomPhotos, ...touristSpots, ...foodPhotos];
                      const currentIndex = allPosts.findIndex(p => p.id === photo.id);
                      navigate(`/post/${photo.id}`, { 
                        state: { 
                          post: photo,
                          allPosts: allPosts,
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
                  alt={`${region.name} 개화 상황`}
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
              <div className="grid grid-cols-2 gap-4 px-4">
                {foodPhotos.map((food) => {
                  const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '{}');
                  const isLiked = likedPosts[food.id] || false;
                  const likeCount = food.likes || food.likeCount || 0;
                  
                  return (
                  <div 
                    key={food.id} 
                      className="cursor-pointer group"
                    onClick={() => {
                      const allPosts = [...realtimePhotos, ...bloomPhotos, ...touristSpots, ...foodPhotos];
                      const currentIndex = allPosts.findIndex(p => p.id === food.id);
                      navigate(`/post/${food.id}`, { 
                        state: { 
                          post: food,
                          allPosts: allPosts,
                          currentPostIndex: currentIndex >= 0 ? currentIndex : 0
                        } 
                      });
                    }}
                  >
                      <div>
                        {/* 이미지 */}
                        <div className="relative w-full aspect-[4/5] overflow-hidden rounded-lg mb-3">
                          {food.videos && food.videos.length > 0 ? (
                            <video
                              src={food.videos[0]}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              autoPlay
                              loop
                              muted
                              playsInline
                            />
                          ) : (
                    <img
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      src={food.image}
                      alt={`${region.name} 맛집`}
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
                                {food.detailedLocation || food.placeName || food.location || region.name}
                        </p>
                              {/* 업로드 시간 - 지역 옆에 */}
                      {food.time && (
                                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                          {food.time}
                        </p>
                      )}
                </div>
                            {food.detailedLocation && food.detailedLocation !== food.location && (
                              <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-0.5">
                                {food.location}
                              </p>
                            )}
              </div>
                          
                          {/* 해시태그 - 지역 이름 밑에 (줄 바꿈 없이) */}
                          {food.tags && food.tags.length > 0 && (
                            <div className="flex gap-1.5 overflow-x-auto [-ms-scrollbar-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                              {food.tags.slice(0, 5).map((tag, tagIndex) => (
                                <span key={tagIndex} className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0">
                                  #{typeof tag === 'string' ? tag.replace('#', '') : tag}
                                </span>
                              ))}
                            </div>
                          )}
                          
                          {/* 메모/내용 */}
                          {food.note && (
                            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark line-clamp-2">
                              {food.note}
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
    </div>
  );
};

export default RegionDetailScreen;















































