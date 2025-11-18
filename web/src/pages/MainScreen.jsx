import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';
import { seedMockData } from '../utils/mockUploadData';
import { getPosts } from '../api/posts';
import { getUnreadCount } from '../utils/notifications';
import { getTimeAgo, updatePostTimes, filterRecentPosts } from '../utils/timeUtils';
import { getUserDailyTitle, getTitleEffect } from '../utils/dailyTitleSystem';

const MainScreen = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('자연');
  const [uploadedPosts, setUploadedPosts] = useState([]);

  const [realtimeData, setRealtimeData] = useState([]);
  const [crowdedData, setCrowdedData] = useState([]);
  const [recommendedData, setRecommendedData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  const realtimeScrollRef = useRef(null);
  const crowdedScrollRef = useRef(null);
  const recommendedScrollRef = useRef(null);
  const categoryScrollRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [currentScrollRef, setCurrentScrollRef] = useState(null);
  const [hasMoved, setHasMoved] = useState(false);

  const categories = useMemo(() => ['자연', '힐링', '액티비티', '맛집', '카페'], []);

  const filteredRecommendedData = useMemo(() => 
    recommendedData.filter(item => 
      item.category === selectedCategory || item.tags?.includes(selectedCategory)
    ),
    [recommendedData, selectedCategory]
  );

  const updateNotificationCount = useCallback(() => {
    setUnreadNotificationCount(getUnreadCount());
  }, []);

  const getTimeAgo = useCallback((date) => {
    const now = new Date();
    const postDate = new Date(date);
    const diffMs = now - postDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    return `${diffDays}일 전`;
  }, []);

  const formatQnA = useCallback((questions) => {
    return questions.map((q, idx) => {
      const items = [{
        id: idx * 2 + 1,
        type: 'question',
        user: q.user?.username || '익명',
        content: q.question,
        time: getTimeAgo(q.createdAt),
        avatar: q.user?.profileImage || `https://i.pravatar.cc/150?img=${idx + 1}`
      }];
      
      if (q.answer) {
        items.push({
          id: idx * 2 + 2,
          type: 'answer',
          user: q.answeredBy?.username || '작성자',
          isAuthor: true,
          content: q.answer,
          time: getTimeAgo(q.createdAt),
          avatar: q.answeredBy?.profileImage || `https://i.pravatar.cc/150?img=${idx + 10}`
        });
      }
      
      return items;
    }).flat();
  }, [getTimeAgo]);

  const loadMockData = useCallback(() => {
    let posts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');
    
    // 2일 이상 된 게시물 필터링 ⭐
    posts = filterRecentPosts(posts, 2);
    console.log(`📊 전체 게시물 → 2일 이내 게시물: ${posts.length}개`);
    
    // Mock 데이터 생성 비활성화 - 프로덕션 모드
    if (posts.length === 0) {
      console.log('📭 최근 2일 이내 업로드된 사진이 없습니다');
      setRealtimeData([]);
      setCrowdedData([]);
      setRecommendedData([]);
      return;
    }
    
    const realtimeFormatted = posts.slice(0, 30).map((post) => {
      // timestamp 기반으로 동적 시간 계산 ⭐
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
        time: dynamicTime, // 동적 시간 ⭐
        timeLabel: dynamicTime, // 동적 시간 ⭐
        timestamp: post.timestamp || post.createdAt || post.time, // 원본 timestamp 유지
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
        aiLabels: post.aiLabels
      };
    });
    
    // 1시간 이내 게시물만 필터링 (동적)
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    const crowdedFormatted = posts
      .filter(post => {
        const postTime = new Date(post.timestamp || post.createdAt || post.time).getTime();
        return postTime > oneHourAgo; // 1시간 이내
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
          time: dynamicTime, // 동적 시간 ⭐
          timeLabel: dynamicTime, // 동적 시간 ⭐
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
        time: dynamicTime, // 동적 시간 ⭐
        timeLabel: dynamicTime, // 동적 시간 ⭐
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
    
    console.log('📊 메인화면 Mock 데이터 로드:', {
      realtime: realtimeFormatted.length,
      crowded: crowdedFormatted.length,
      recommended: recommendedFormatted.length
    });
  }, []);

  const loadUploadedPosts = useCallback(() => {
    const posts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');
    console.log(`📸 업로드된 게시물 로드: ${posts.length}개`);
    
    const formattedPosts = posts.slice(0, 10).map(post => ({
      id: `uploaded-${post.id}`,
      images: post.images,
      image: post.images[0],
      title: post.location,
      location: post.location,
      time: post.timeLabel || '방금',
      user: post.user || '나',
      badge: '여행러버',
      qnaList: [],
      isUploaded: true
    }));
    setUploadedPosts(formattedPosts);
  }, []);

  const fetchPosts = useCallback(async () => {
    try {
      // loading 제거 - 사진이 바로 보이도록
      setError(null);
      
      // 타임아웃 1초로 단축 - 빠르게 Mock 데이터로 전환!
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('timeout')), 1000)
      );
      
      const postsPromise = getPosts({ isRealtime: true, limit: 10 });
      
      try {
        const realtimeResponse = await Promise.race([postsPromise, timeout]);
        
        if (realtimeResponse.success && realtimeResponse.posts && realtimeResponse.posts.length > 0) {
          const formattedRealtime = realtimeResponse.posts.map(post => ({
            id: post._id,
            images: post.images || [],
            image: post.images[0],
            title: post.location?.name || '여행지',
            location: post.location?.name || '여행지',
            time: getTimeAgo(post.createdAt),
            user: post.user?.username || '익명',
            badge: post.user?.badges?.[0] || '여행러버',
            qnaList: formatQnA(post.questions || []),
            content: post.content,
            likesCount: post.likesCount || 0,
            comments: post.comments || []
          }));
          setRealtimeData(formattedRealtime);
          
          const allPostsResponse = await getPosts({ isRealtime: false, limit: 20 });
          if (allPostsResponse.success && allPostsResponse.posts && allPostsResponse.posts.length > 0) {
            const formattedRecommended = allPostsResponse.posts.map(post => ({
              id: post._id,
              images: post.images || [],
              image: post.images[0],
              title: post.location?.name || '여행지',
              badge: '추천',
              category: post.tags?.[0] || '자연',
              user: post.user?.username || '익명',
              time: getTimeAgo(post.createdAt),
              qnaList: formatQnA(post.questions || []),
              content: post.content
            }));
            setRecommendedData(formattedRecommended);
            setCrowdedData(formattedRecommended.slice(0, 10));
          } else {
            // 백엔드에 데이터 없음 - Mock 데이터 사용
            loadMockData();
          }
        } else {
          // 백엔드에 데이터 없음 - Mock 데이터 사용
          loadMockData();
        }
      } catch (timeoutError) {
        // 조용히 Mock 데이터로 전환
        loadMockData();
      }
    } catch (err) {
      // 조용히 Mock 데이터로 전환
      loadMockData();
    }
  }, [getTimeAgo, formatQnA, loadMockData]);

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  }, [searchQuery, navigate]);

  const handleSearchFocus = useCallback(() => {
    navigate('/search');
  }, [navigate]);

  const handleMouseDown = useCallback((e, scrollRef) => {
    if (!scrollRef || !scrollRef.current) return;
    setIsDragging(true);
    setHasMoved(false);
    setCurrentScrollRef(scrollRef);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
    scrollRef.current.style.cursor = 'grabbing';
    scrollRef.current.style.userSelect = 'none';
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !currentScrollRef) return;
    e.preventDefault();
    const x = e.pageX - currentScrollRef.current.offsetLeft;
    const walk = (x - startX) * 2; // 더 빠르고 부드러운 스크롤
    
    if (Math.abs(walk) > 5) {
      setHasMoved(true);
    }
    
    if (currentScrollRef.current) {
      // requestAnimationFrame으로 부드러운 스크롤
      requestAnimationFrame(() => {
    if (currentScrollRef.current) {
      currentScrollRef.current.scrollLeft = scrollLeft - walk;
    }
      });
    }
  }, [isDragging, currentScrollRef, startX, scrollLeft]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    if (currentScrollRef) {
      currentScrollRef.current.style.cursor = 'grab';
      currentScrollRef.current.style.userSelect = 'auto';
    }
    setCurrentScrollRef(null);
  }, [currentScrollRef]);

  const handleMouseLeave = useCallback(() => {
    if (isDragging && currentScrollRef) {
      currentScrollRef.current.style.cursor = 'grab';
      currentScrollRef.current.style.userSelect = 'auto';
    }
    setIsDragging(false);
    setCurrentScrollRef(null);
  }, [isDragging, currentScrollRef]);

  const handleItemClickWithDragCheck = useCallback((item, sectionType = 'realtime') => {
    if (!hasMoved) {
      // 섹션별로 모든 게시물 목록 가져오기
      let allPosts = [];
      let currentIndex = 0;
      
      switch (sectionType) {
        case 'realtime':
          allPosts = realtimeData;
          currentIndex = realtimeData.findIndex(p => p.id === item.id);
          break;
        case 'crowded':
          allPosts = crowdedData;
          currentIndex = crowdedData.findIndex(p => p.id === item.id);
          break;
        case 'recommended':
          allPosts = filteredRecommendedData;
          currentIndex = filteredRecommendedData.findIndex(p => p.id === item.id);
          break;
        default:
          allPosts = [item];
          currentIndex = 0;
      }
      
      navigate(`/post/${item.id}`, { 
        state: { 
          post: item,
          allPosts: allPosts,
          currentPostIndex: currentIndex >= 0 ? currentIndex : 0
        } 
      });
    }
  }, [hasMoved, navigate, realtimeData, crowdedData, filteredRecommendedData]);

  // 메인화면 진입 시 한 번 업데이트 후 자동 새로고침
  useEffect(() => {
    console.log('📱 메인화면 진입 - 초기 데이터 로드');
    
    // Mock 데이터 즉시 로드 (사진 바로 표시!)
    loadMockData();
    loadUploadedPosts();
    updateNotificationCount();
    
    console.log('✅ Mock 데이터 로드 완료 - 화면 즉시 표시!');
    
    // 백엔드 연결은 백그라운드에서 (비차단)
    setTimeout(() => {
      fetchPosts();
    }, 100);
    
    const handleNotificationChange = () => {
      updateNotificationCount();
    };
    
    // newPostsAdded 이벤트 리스너 (Mock 데이터 생성 시)
    const handleNewPosts = () => {
      console.log('🔄 새 게시물 추가됨 - 화면 업데이트!');
      loadMockData();
      loadUploadedPosts();
    };
    
    // 알림 개수 업데이트
    window.addEventListener('notificationCountChanged', handleNotificationChange);
    window.addEventListener('newPostsAdded', handleNewPosts);
    
    // 자동 새로고침: 30초마다 데이터 및 시간 업데이트 ⏰
    const autoRefreshInterval = setInterval(() => {
      console.log('⏰ 자동 새로고침 (30초) - 시간 업데이트');
      loadUploadedPosts();
      loadMockData(); // 시간도 자동으로 재계산됨
    }, 30000);
    
    return () => {
      window.removeEventListener('notificationCountChanged', handleNotificationChange);
      window.removeEventListener('newPostsAdded', handleNewPosts);
      clearInterval(autoRefreshInterval);
    };
  }, [fetchPosts, loadUploadedPosts, loadMockData, updateNotificationCount]);

  return (
    <div className="screen-layout text-text-light dark:text-text-dark bg-background-light dark:bg-background-dark">
      {/* 메인 스크롤 영역 */}
      <div className="screen-content">
        {/* 상단 헤더 - sticky */}
        <div className="screen-header bg-white dark:bg-gray-900 border-b border-border-light/50 dark:border-border-dark/50 shadow-sm relative z-50">
        <div className="flex items-center px-4 py-3 justify-between">
          <h2 className="text-xl font-bold leading-tight tracking-[-0.015em]">LiveJourney</h2>
          <button 
            onClick={() => navigate('/notifications')}
            className="relative flex items-center justify-center w-11 h-11 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
          >
            <span className="material-symbols-outlined text-text-light dark:text-text-dark" style={{ fontSize: '26px' }}>notifications</span>
            {unreadNotificationCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
            </span>
            )}
          </button>
        </div>

        {/* 검색창 */}
        <div className="px-4 pb-3">
          <form onSubmit={handleSearch}>
            <label className="flex flex-col min-w-40 h-14 w-full">
              <div className="flex w-full flex-1 items-stretch rounded-full h-full shadow-lg ring-2 ring-primary/30 hover:ring-primary/50 transition-all">
                <div className="text-primary flex border-none bg-white dark:bg-gray-800 items-center justify-center pl-5 rounded-l-full border-r-0">
                  <span className="material-symbols-outlined text-2xl">search</span>
                </div>
                <input
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-full text-text-light dark:text-text-dark focus:outline-0 focus:ring-0 border-none bg-white dark:bg-gray-800 focus:border-none h-full placeholder:text-gray-400 dark:placeholder:text-gray-500 px-4 rounded-l-none border-l-0 pl-2 text-base font-medium leading-normal"
                  placeholder="어디로 떠나볼까요? 🌏"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={handleSearchFocus}
                />
              </div>
            </label>
          </form>
        </div>
        </div>

        {/* 메인 컨텐츠 */}
        <div className="screen-body">
          {error && !loading && (
            <div className="mx-4 my-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-blue-700 dark:text-blue-300 text-sm">오프라인 모드로 실행 중입니다</p>
              <p className="text-blue-600 dark:text-blue-400 text-xs mt-1">게시물을 작성하면 여기에 표시됩니다.</p>
            </div>
          )}

          <main>
        {/* 실시간 정보 섹션 */}
        <section className="pt-5">
          <div className="flex items-center justify-between px-4 pb-3">
            <h2 className="text-text-light dark:text-text-dark text-[22px] font-bold leading-tight tracking-[-0.015em]">
              실시간 정보
            </h2>
            <button 
              onClick={() => navigate('/detail?filter=realtime')}
              className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-transparent text-text-subtle-light dark:text-text-subtle-dark text-sm font-bold leading-normal tracking-[0.015em] hover:text-primary transition-colors"
            >
              <span className="truncate">더보기</span>
            </button>
          </div>

          {realtimeData.length === 0 ? (
            <div className="flex flex-col items-center justify-center w-full py-12 px-4">
              <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-4">
                travel_explore
              </span>
              <p className="text-gray-500 dark:text-gray-400 text-center text-base font-medium mb-2">
                아직 공유된 여행 정보가 없어요
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-center text-sm mb-4">
                첫 번째로 여행 정보를 공유해보세요!
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
            <div 
              ref={realtimeScrollRef}
              onMouseDown={(e) => handleMouseDown(e, realtimeScrollRef)}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              className="flex overflow-x-scroll overflow-y-hidden [-ms-scrollbar-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory scroll-smooth"
              style={{ 
                scrollBehavior: 'smooth', 
                WebkitOverflowScrolling: 'touch',
                scrollSnapType: 'x mandatory',
                scrollPaddingLeft: '16px'
              }}
            >
              <div className="flex items-stretch px-4 gap-3 pb-2">
                {realtimeData.map((item) => {
                  // 24시간 타이틀 확인
                  const userTitle = getUserDailyTitle(item.userId);
                  const titleEffect = userTitle ? getTitleEffect(userTitle.effect) : null;
                  
                  return (
                    <div 
                      key={item.id} 
                      className="flex h-full flex-col gap-2 rounded-lg w-[180px] flex-shrink-0 cursor-pointer snap-start select-none"
                      style={{ scrollSnapAlign: 'start', scrollSnapStop: 'always' }}
                      onClick={() => handleItemClickWithDragCheck(item, 'realtime')}
                    >
                      <div 
                        className={`relative w-full aspect-[1/1.2] rounded-lg overflow-hidden hover:opacity-90 transition-opacity ${
                          titleEffect ? `${titleEffect.border} ${titleEffect.shadow} ${titleEffect.glow}` : 'shadow-md'
                        }`}
                      >
                        {/* 동영상이 있으면 동영상 표시, 없으면 이미지 */}
                        {item.videos && item.videos.length > 0 ? (
                          <video
                            src={item.videos[0]}
                            className="w-full h-full object-cover"
                            autoPlay
                            loop
                            muted
                            playsInline
                            onMouseEnter={(e) => e.target.play()}
                            onMouseLeave={(e) => e.target.pause()}
                          />
                        ) : (
                          <div 
                            className="w-full h-full bg-center bg-no-repeat bg-cover"
                            style={{ backgroundImage: `url("${item.image}")` }}
                          />
                        )}
                        {/* 그라데이션 오버레이 */}
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.3))' }}></div>
                        
                        {/* 우측상단: 24시간 타이틀 배지 */}
                        {userTitle && (
                          <div style={{ 
                            position: 'absolute', 
                            top: '8px', 
                            right: '8px', 
                            zIndex: 30,
                            background: `linear-gradient(135deg, #fbbf24, #f97316)`,
                            padding: '4px 8px',
                            borderRadius: '9999px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <span style={{ fontSize: '12px' }}>{userTitle.icon}</span>
                            <span style={{ 
                              fontSize: '10px', 
                              fontWeight: 'bold', 
                              color: 'white',
                              textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                            }}>
                              {titleEffect?.badge || '👑'}
                            </span>
                          </div>
                        )}
                        
                        {/* 좌측상단: 카테고리 아이콘 */}
                        {item.categoryName && (
                          <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 1 }}>
                            <span style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              width: '40px', 
                              height: '40px', 
                              borderRadius: '50%', 
                              fontSize: '24px',
                              fontWeight: 'bold',
                              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))'
                            }}>
                              {item.categoryName === '개화 상황' && '🌸'}
                              {item.categoryName === '맛집 정보' && '🍜'}
                              {(!item.categoryName || !['개화 상황', '맛집 정보'].includes(item.categoryName)) && '🏞️'}
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
                          {item.title && (
                            <p style={{ 
                              color: 'white', 
                              fontSize: '14px', 
                              fontWeight: 'bold', 
                              lineHeight: '1.2',
                              textShadow: '0 2px 8px rgba(0,0,0,0.8)',
                              margin: 0
                            }}>
                              {item.title}
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
                              {item.time}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              </div>
            </div>
          )}
        </section>

        {/* 실시간 밀집 지역 섹션 */}
        <section className="pt-8">
          <div className="flex items-center justify-between px-4 pb-3">
            <h2 className="text-text-light dark:text-text-dark text-[22px] font-bold leading-tight tracking-[-0.015em]">
              실시간 밀집 지역
            </h2>
            <button 
              onClick={() => navigate('/detail?filter=crowded')}
              className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-transparent text-text-subtle-light dark:text-text-subtle-dark text-sm font-bold leading-normal tracking-[0.015em] hover:text-primary transition-colors"
            >
              <span className="truncate">더보기</span>
            </button>
          </div>

          {crowdedData.length === 0 ? (
            <div className="flex flex-col items-center justify-center w-full py-12 px-4">
              <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-4">
                people
              </span>
              <p className="text-gray-500 dark:text-gray-400 text-center text-base font-medium mb-2">
                아직 밀집 지역 정보가 없어요
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-center text-sm mb-4">
                첫 번째로 현장 정보를 공유해보세요!
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
            <div 
              ref={crowdedScrollRef}
              onMouseDown={(e) => handleMouseDown(e, crowdedScrollRef)}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              className="flex overflow-x-scroll overflow-y-hidden [-ms-scrollbar-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory scroll-smooth"
              style={{ 
                scrollBehavior: 'smooth', 
                WebkitOverflowScrolling: 'touch',
                scrollSnapType: 'x mandatory',
                scrollPaddingLeft: '16px'
              }}
            >
              <div className="flex items-stretch px-4 gap-3 pb-2">
                {crowdedData.map((item) => (
                <div 
                  key={item.id} 
                  className="flex h-full flex-col gap-2 rounded-lg w-[180px] flex-shrink-0 cursor-pointer snap-start select-none"
                  style={{ scrollSnapAlign: 'start', scrollSnapStop: 'always' }}
                  onClick={() => handleItemClickWithDragCheck(item, 'crowded')}
                >
                  <div 
                      className="relative w-full aspect-[1/1.2] rounded-lg overflow-hidden hover:opacity-90 transition-opacity shadow-md"
                    >
                      {/* 동영상이 있으면 동영상 표시, 없으면 이미지 */}
                      {item.videos && item.videos.length > 0 ? (
                        <video
                          src={item.videos[0]}
                          className="w-full h-full object-cover"
                          autoPlay
                          loop
                          muted
                          playsInline
                          onMouseEnter={(e) => e.target.play()}
                          onMouseLeave={(e) => e.target.pause()}
                        />
                      ) : (
                        <div 
                          className="w-full h-full bg-center bg-no-repeat bg-cover"
                          style={{ backgroundImage: `url("${item.image}")` }}
                        />
                      )}
                      {/* 그라데이션 오버레이 */}
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.3))' }}></div>
                      
                      {/* 좌측상단: 카테고리 아이콘만 */}
                      {item.categoryName && (
                        <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 1 }}>
                          <span style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            width: '40px', 
                            height: '40px', 
                            borderRadius: '50%', 
                            fontSize: '24px',
                            fontWeight: 'bold',
                            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))'
                          }}>
                            {item.categoryName === '개화 상황' && '🌸'}
                            {item.categoryName === '맛집 정보' && '🍜'}
                            {(!item.categoryName || !['개화 상황', '맛집 정보'].includes(item.categoryName)) && '🏞️'}
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
                          {item.title && (
                            <p style={{ 
                              color: 'white', 
                              fontSize: '14px', 
                              fontWeight: 'bold', 
                              lineHeight: '1.2',
                              textShadow: '0 2px 8px rgba(0,0,0,0.8)',
                              margin: 0
                            }}>
                              {item.title}
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
                              {item.time}
                            </p>
                          )}
                        </div>
                    </div>
                  </div>
                </div>
              ))}
              </div>
            </div>
          )}
        </section>

        {/* 추천 장소 섹션 */}
        <section className="pt-8">
          <div className="flex items-center justify-between px-4 pb-3">
            <h2 className="text-text-light dark:text-text-dark text-[22px] font-bold leading-tight tracking-[-0.015em]">
              추천 장소
            </h2>
            <button 
              onClick={() => navigate('/detail?filter=recommended')}
              className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-transparent text-text-subtle-light dark:text-text-subtle-dark text-sm font-bold leading-normal tracking-[0.015em] hover:text-primary transition-colors"
            >
              <span className="truncate">더보기</span>
            </button>
          </div>

            <div 
              ref={categoryScrollRef}
              onMouseDown={(e) => handleMouseDown(e, categoryScrollRef)}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={(e) => {
                const touch = e.touches[0];
                handleMouseDown({ pageX: touch.pageX, preventDefault: () => {} }, categoryScrollRef);
              }}
              onTouchMove={(e) => {
                const touch = e.touches[0];
                handleMouseMove({ pageX: touch.pageX, preventDefault: () => {} });
              }}
              onTouchEnd={handleMouseUp}
              className="flex gap-2 px-4 pb-4 overflow-x-auto overflow-y-hidden [-ms-scrollbar-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth cursor-grab active:cursor-grabbing"
              style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch', userSelect: 'none' }}
            >
            {categories.map((category) => (
              <button
                key={category}
                  onClick={() => !hasMoved && setSelectedCategory(category)}
                  className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 select-none ${
                  selectedCategory === category
                    ? 'bg-primary/20 text-primary scale-105 shadow-md'
                    : 'bg-card-light dark:bg-card-dark text-text-subtle-light dark:text-text-subtle-dark hover:bg-primary/10 hover:scale-105'
                }`}
              >
                #{category}
              </button>
            ))}
          </div>

          {recommendedData.length === 0 ? (
            <div className="flex flex-col items-center justify-center w-full py-12 px-4">
              <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-4">
                recommend
              </span>
              <p className="text-gray-500 dark:text-gray-400 text-center text-base font-medium mb-2">
                추천 장소가 아직 없어요
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-center text-sm mb-4">
                첫 번째로 추천 장소를 공유해보세요!
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
            <div 
              ref={recommendedScrollRef}
              onMouseDown={(e) => handleMouseDown(e, recommendedScrollRef)}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              className="flex overflow-x-scroll overflow-y-hidden [-ms-scrollbar-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory scroll-smooth"
              style={{ 
                scrollBehavior: 'smooth', 
                WebkitOverflowScrolling: 'touch',
                scrollSnapType: 'x mandatory',
                scrollPaddingLeft: '16px'
              }}
            >
              <div className="flex items-stretch px-4 gap-3 pb-2">
                {(filteredRecommendedData.length > 0 ? filteredRecommendedData : recommendedData.filter(item => item.category === selectedCategory)).map((item) => (
                <div 
                  key={item.id} 
                  className="flex h-full flex-col gap-2 rounded-lg w-[180px] flex-shrink-0 cursor-pointer snap-start select-none"
                  style={{ scrollSnapAlign: 'start', scrollSnapStop: 'always' }}
                  onClick={() => handleItemClickWithDragCheck(item, 'recommended')}
                >
                  <div 
                      className="relative w-full aspect-[1/1.2] rounded-lg overflow-hidden hover:opacity-90 transition-opacity shadow-md"
                    >
                      {/* 동영상이 있으면 동영상 표시, 없으면 이미지 */}
                      {item.videos && item.videos.length > 0 ? (
                        <video
                          src={item.videos[0]}
                          className="w-full h-full object-cover"
                          autoPlay
                          loop
                          muted
                          playsInline
                          onMouseEnter={(e) => e.target.play()}
                          onMouseLeave={(e) => e.target.pause()}
                        />
                      ) : (
                        <div 
                          className="w-full h-full bg-center bg-no-repeat bg-cover"
                          style={{ backgroundImage: `url("${item.image}")` }}
                        />
                      )}
                      {/* 그라데이션 오버레이 */}
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.3))' }}></div>
                      
                      {/* 좌측상단: 카테고리 아이콘만 */}
                      {item.categoryName && (
                        <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 1 }}>
                          <span style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            width: '40px', 
                            height: '40px', 
                            borderRadius: '50%', 
                            fontSize: '24px',
                            fontWeight: 'bold',
                            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))'
                          }}>
                            {item.categoryName === '개화 상황' && '🌸'}
                            {item.categoryName === '맛집 정보' && '🍜'}
                            {(!item.categoryName || !['개화 상황', '맛집 정보'].includes(item.categoryName)) && '🏞️'}
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
                          {item.title && (
                            <p style={{ 
                              color: 'white', 
                              fontSize: '14px', 
                              fontWeight: 'bold', 
                              lineHeight: '1.2',
                              textShadow: '0 2px 8px rgba(0,0,0,0.8)',
                              margin: 0
                            }}>
                              {item.title}
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
                              {item.time}
                            </p>
                          )}
                        </div>
                    </div>
                  </div>
                </div>
              ))}
              </div>
            </div>
          )}
        </section>
        </main>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default MainScreen;


















































