import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';
import { seedMockData } from '../utils/mockUploadData';
import { getPosts } from '../api/posts';
import { getUnreadCount } from '../utils/notifications';
import { getTimeAgo, updatePostTimes, filterRecentPosts } from '../utils/timeUtils';
import { getUserDailyTitle, getTitleEffect, getAllTodayTitles, DAILY_TITLES } from '../utils/dailyTitleSystem';
import { initializeTitlePosts } from '../utils/titlePostsMockData';

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
  const [titleHallPosts, setTitleHallPosts] = useState([]);
  const titleHallScrollRef = useRef(null);
  const [dailyTitle, setDailyTitle] = useState(null);
  const [allTodayTitles, setAllTodayTitles] = useState([]);
  const [showTitleModal, setShowTitleModal] = useState(false);
  const [selectedTitle, setSelectedTitle] = useState(null);
  const [showTitleCelebration, setShowTitleCelebration] = useState(false);
  const [earnedTitle, setEarnedTitle] = useState(null);

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

  // 타이틀 명예의 전당용 게시물 업데이트 (localStorage 기반)
  const updateTitleHallPosts = useCallback(() => {
    try {
      const posts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');
      if (!Array.isArray(posts) || posts.length === 0) {
        setTitleHallPosts([]);
        return;
      }

      // 타이틀을 가진 사용자의 게시물만 필터링
      const hallPosts = posts
        .filter((post) => post.userId && getUserDailyTitle(post.userId))
        .sort((a, b) => {
          const timeA = new Date(a.timestamp || a.createdAt || 0).getTime();
          const timeB = new Date(b.timestamp || b.createdAt || 0).getTime();
          return timeB - timeA;
        })
        .slice(0, 8)
        .map((post) => ({
          id: post.id,
          images: post.images || [],
          image: post.images?.[0] || '',
          location: post.location,
          note: post.note,
          userId: post.userId,
          timestamp: post.timestamp || post.createdAt,
        }));

      setTitleHallPosts(hallPosts);
    } catch (e) {
      console.error('타이틀 명예의 전당 게시물 업데이트 실패:', e);
      setTitleHallPosts([]);
    }
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
    // localStorage에서 모든 게시물 가져오기 (기록은 유지)
    const allPosts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');
    console.log(`📸 전체 게시물 (기록): ${allPosts.length}개`);
    
    // 2일 이내 게시물만 필터링 (메인 화면 노출용)
    // 2일 이상 된 게시물은 localStorage에 저장되어 있지만 화면에는 표시 안 함
    let posts = filterRecentPosts(allPosts, 2);
    console.log(`📊 메인화면 노출 게시물 (2일 이내): ${posts.length}개`);
    // 메인 화면에서는 "오늘의 타이틀"을 이미 획득한 사용자의 게시물은 제외
    posts = posts.filter((post) => {
      if (!post.userId) return true;
      const userTitle = getUserDailyTitle(post.userId);
      return !userTitle;
    });

    // 최신순 정렬
    posts.sort((a, b) => {
      const timeA = new Date(a.timestamp || a.createdAt || 0).getTime();
      const timeB = new Date(b.timestamp || b.createdAt || 0).getTime();
      return timeB - timeA;
    });
    
    // 2일 이내 게시물이 없으면 빈 배열 설정
    if (posts.length === 0) {
      console.log('📭 최근 2일 이내 업로드된 사진이 없습니다 (기록은 유지됨)');
      setRealtimeData([]);
      setCrowdedData([]);
      setRecommendedData([]);
      return;
    }
    
    // 2일 이내 게시물만 표시 (최대 30개)
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
    
    // 1시간 이내 게시물만 필터링 (인기 섹션)
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
    
    // 2일 이내 게시물만 표시 (최대 200개)
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
    // 타이틀 명예의 전당 업데이트
    updateTitleHallPosts();
  }, [getTimeAgo, updateTitleHallPosts]);

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
    // 업로드된 게시물 기준으로도 명예의 전당 갱신
    updateTitleHallPosts();
  }, [updateTitleHallPosts]);

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
    
    // 타이틀 예시 데이터 및 명예의 전당용 게시물 초기화 (항상 예시를 볼 수 있도록)
    initializeTitlePosts();
    
    // Mock 데이터 + 업로드 데이터 즉시 로드 (사진 바로 표시!)
    loadMockData();
    loadUploadedPosts();
    updateTitleHallPosts();
    updateNotificationCount();
    
    console.log('✅ Mock 데이터 로드 완료 - 화면 즉시 표시!');
    
    // 오늘의 타이틀 로드
    const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (savedUser?.id) {
      const title = getUserDailyTitle(savedUser.id);
      setDailyTitle(title);
    }
    
    // 백엔드 연결은 백그라운드에서 (비차단)
    setTimeout(() => {
      fetchPosts();
    }, 100);
    
      const handleNotificationChange = () => {
      updateNotificationCount();
    };
    
    // 타이틀 업데이트 이벤트 리스너
    const handleTitleUpdate = () => {
      const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (savedUser?.id) {
        const previousTitle = dailyTitle;
        const title = getUserDailyTitle(savedUser.id);
        setDailyTitle(title);
        
        // 새로 타이틀을 획득한 경우 축하 모달 표시
        if (title && (!previousTitle || previousTitle.name !== title.name)) {
          setEarnedTitle(title);
          setShowTitleCelebration(true);
        }
      }
      // 오늘의 모든 타이틀도 업데이트
      const todayTitles = getAllTodayTitles();
      setAllTodayTitles(todayTitles);
    };
    
    // 게시물 업데이트 시 타이틀도 새로고침
      const handlePostsUpdateForTitles = () => {
      setTimeout(() => {
        const todayTitles = getAllTodayTitles();
        setAllTodayTitles(todayTitles);
        updateTitleHallPosts();
      }, 200);
    };
    
    // newPostsAdded 이벤트 리스너 (사진 업로드 시)
      const handleNewPosts = () => {
      console.log('🔄 메인 화면 - 새 게시물 추가됨!');
      // 약간의 지연을 두고 업데이트 (localStorage 저장 완료 대기)
      setTimeout(() => {
        console.log('📸 메인 화면 - 데이터 새로고침 시작');
        loadMockData();
        loadUploadedPosts();
        updateTitleHallPosts();
        console.log('✅ 메인 화면 - 데이터 새로고침 완료');
      }, 200); // 100ms -> 200ms로 증가
    };
    
    // postsUpdated 이벤트 리스너 (게시물 업데이트 시)
      const handlePostsUpdate = () => {
      console.log('📊 메인 화면 - 게시물 업데이트!');
      // 약간의 지연을 두고 업데이트 (localStorage 저장 완료 대기)
      setTimeout(() => {
        console.log('📸 메인 화면 - 데이터 새로고침 시작');
        loadMockData();
        loadUploadedPosts();
        handlePostsUpdateForTitles();
        console.log('✅ 메인 화면 - 데이터 새로고침 완료');
      }, 200); // 100ms -> 200ms로 증가
    };
    
    // 알림 개수 업데이트
    window.addEventListener('notificationCountChanged', handleNotificationChange);
    window.addEventListener('newPostsAdded', handleNewPosts);
    window.addEventListener('postsUpdated', handlePostsUpdate);
    window.addEventListener('titleUpdated', handleTitleUpdate);
    
    // 자동 새로고침: 30초마다 데이터 및 시간 업데이트 ⏰
    const autoRefreshInterval = setInterval(() => {
      console.log('⏰ 자동 새로고침 (30초) - 시간 업데이트');
      loadUploadedPosts();
      loadMockData(); // 시간도 자동으로 재계산됨
      // 타이틀도 자동 새로고침
      const todayTitles = getAllTodayTitles();
      setAllTodayTitles(todayTitles);
      updateTitleHallPosts();
    }, 30000);
    
    return () => {
      window.removeEventListener('notificationCountChanged', handleNotificationChange);
      window.removeEventListener('newPostsAdded', handleNewPosts);
      window.removeEventListener('postsUpdated', handlePostsUpdate);
      window.removeEventListener('titleUpdated', handleTitleUpdate);
      clearInterval(autoRefreshInterval);
    };
  }, [fetchPosts, loadUploadedPosts, loadMockData, updateNotificationCount, updateTitleHallPosts]);

  return (
    <div className="screen-layout text-text-light dark:text-text-dark bg-background-light dark:bg-background-dark">
      {/* 메인 스크롤 영역 */}
      <div className="screen-content">
        {/* 상단 헤더 - sticky */}
        <div className="screen-header bg-white dark:bg-gray-900 border-b border-border-light/50 dark:border-border-dark/50 shadow-sm relative z-50">
        <div className="flex items-center px-4 py-3 justify-between">
          <h2 className="text-xl font-bold leading-tight tracking-[-0.015em]">LiveJourney</h2>
          <div className="flex items-center gap-2">
            {/* 타이틀 축하 버튼 */}
            {dailyTitle && (
              <button
                onClick={() => {
                  setEarnedTitle(dailyTitle);
                  setShowTitleCelebration(true);
                }}
                className="relative flex items-center justify-center w-11 h-11 rounded-lg bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 border border-amber-300 dark:border-amber-600 hover:shadow-md transition-all"
                title="타이틀 확인"
              >
                <span className="text-xl">{dailyTitle.icon || '👑'}</span>
              </button>
            )}
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
        {/* 오늘의 타이틀 목록 - 실시간 정보 위에 눈에 띄게 표시 */}
        <section className="px-4 pt-4 pb-3 bg-gradient-to-b from-amber-50/50 to-transparent dark:from-amber-900/10 dark:to-transparent">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-text-light dark:text-text-dark flex items-center gap-2">
                <span className="text-lg">👑</span>
                오늘의 타이틀
                <span className="text-xs font-normal text-gray-500 dark:text-gray-400 ml-1">
                  ({allTodayTitles.length}개)
                </span>
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                타이틀을 클릭하면 획득 조건을 확인할 수 있어요
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowTitleModal(true)}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 border border-amber-300 dark:border-amber-600 text-xs font-semibold text-amber-900 dark:text-amber-200 hover:shadow-md transition-all whitespace-nowrap"
              >
                모아보기
              </button>
            </div>
          </div>
          {titleHallPosts.length > 0 ? (
            // 타이틀을 획득한 사용자가 있으면, 이 영역을 오늘의 명예의 전당으로 사용
            <div className="mt-2">
              <p className="text-[11px] text-gray-600 dark:text-gray-400 mb-2">
                오늘 타이틀을 획득한 사용자들이 명예의 전당에 올라왔어요.
              </p>
              <div
                ref={titleHallScrollRef}
                onMouseDown={(e) => handleMouseDown(e, titleHallScrollRef)}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {titleHallPosts.map((post) => {
                  const userTitle = getUserDailyTitle(post.userId);
                  const titleEffect = userTitle ? getTitleEffect(userTitle.effect) : null;
                  return (
                    <div
                      key={post.id}
                      onClick={() => navigate(`/post/${post.id}`)}
                      className="relative flex-shrink-0 w-16 h-16 md:w-20 md:h-20 flex items-center justify-center cursor-pointer group"
                    >
                      {/* 후광 + 그림자 (타이틀마다 다른 색감) */}
                      <div
                        className={`absolute inset-0 rounded-full blur-md opacity-80 transition-opacity ${
                          titleEffect ? titleEffect.shadow : 'shadow-lg shadow-primary/40'
                        }`}
                      />
                      {/* 메달 썸네일 */}
                      <div
                        className={`relative w-full h-full rounded-full overflow-hidden border-4 bg-gray-200 dark:bg-gray-800 transition-transform duration-200 group-hover:scale-105 ${
                          titleEffect ? `${titleEffect.border} ${titleEffect.glow}` : 'border-primary'
                        }`}
                      >
                        <img
                          src={
                            post.image ||
                            'https://images.unsplash.com/photo-1524222717473-730000096953?w=800&auto=format&fit=crop&q=80'
                          }
                          alt={post.location || '타이틀 게시물'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src =
                              'https://images.unsplash.com/photo-1524222717473-730000096953?w=800&auto=format&fit=crop&q=80';
                          }}
                        />
                        {/* 상단 작은 타이틀 아이콘 배지 (글씨 최소화) */}
                        {userTitle && (
                          <div className="absolute -top-1 left-0 right-0 flex justify-center">
                            <div className="w-6 h-6 rounded-full bg-primary/95 text-[11px] text-white font-semibold shadow-md flex items-center justify-center border border-white/70 group-hover:scale-110 transition-transform">
                              <span>{userTitle.icon}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            // 아직 타이틀을 획득한 사용자가 없을 때만 안내 문구 표시
            <div className="px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-dashed border-gray-300 dark:border-gray-600">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                오늘의 타이틀은 아직 비어 있어요. 지금 바로 활동을 시작해서 타이틀을 획득하고, 명예의 전당에 올라가 보세요!
              </p>
            </div>
          )}

        </section>

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
                          titleEffect ? `${titleEffect.border} ${titleEffect.shadow}` : 'shadow-md border border-border-light'
                        }`}
                        style={userTitle ? { position: 'relative' } : {}}
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
                          <img
                            src={item.image || 'https://images.unsplash.com/photo-1524222717473-730000096953?w=800&auto=format&fit=crop&q=80'}
                            alt={item.location || '여행 사진'}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = 'https://images.unsplash.com/photo-1524222717473-730000096953?w=800&auto=format&fit=crop&q=80';
                            }}
                          />
                        )}
                        {/* 그라데이션 오버레이 */}
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.3))' }}></div>
                        
                        {/* 우측상단: 24시간 타이틀 배지 - 심플하게 */}
                        {userTitle && (
                          <div 
                            style={{ 
                              position: 'absolute', 
                              top: '8px', 
                              right: '8px', 
                              zIndex: 30
                            }}
                          >
                            <div className="px-2.5 py-1 rounded-full bg-primary/90 text-white text-[10px] font-bold flex items-center gap-1 shadow-md">
                              <span>{userTitle.icon}</span>
                              <span>{titleEffect?.badge || '오늘의 타이틀'}</span>
                            </div>
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
                {crowdedData.map((item) => {
                  // 24시간 타이틀 확인
                  const userTitle = getUserDailyTitle(item.userId);
                  const titleEffect = userTitle ? getTitleEffect(userTitle.effect) : null;
                  
                  return (
                  <div 
                    key={item.id} 
                    className="flex h-full flex-col gap-2 rounded-lg w-[180px] flex-shrink-0 cursor-pointer snap-start select-none"
                    style={{ scrollSnapAlign: 'start', scrollSnapStop: 'always' }}
                    onClick={() => handleItemClickWithDragCheck(item, 'crowded')}
                  >
                      <div 
                          className={`relative w-full aspect-[1/1.2] rounded-lg overflow-hidden hover:opacity-90 transition-opacity ${
                           titleEffect ? `${titleEffect.border} ${titleEffect.shadow}` : 'shadow-md border border-border-light'
                          }`}
                          style={userTitle ? { position: 'relative' } : {}}
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
                        <img
                          src={item.image || 'https://images.unsplash.com/photo-1524222717473-730000096953?w=800&auto=format&fit=crop&q=80'}
                          alt={item.location || '여행 사진'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1524222717473-730000096953?w=800&auto=format&fit=crop&q=80';
                          }}
                        />
                      )}
                      {/* 그라데이션 오버레이 */}
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.3))' }}></div>
                      
                        {/* 우측상단: 24시간 타이틀 배지 - 심플하게 */}
                      {userTitle && (
                         <div 
                           style={{ 
                             position: 'absolute', 
                             top: '8px', 
                             right: '8px', 
                             zIndex: 30
                           }}
                         >
                           <div className="px-2.5 py-1 rounded-full bg-primary/90 text-white text-[10px] font-bold flex items-center gap-1 shadow-md">
                             <span>{userTitle.icon}</span>
                             <span>{titleEffect?.badge || '오늘의 타이틀'}</span>
                           </div>
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
                {(filteredRecommendedData.length > 0 ? filteredRecommendedData : recommendedData.filter(item => item.category === selectedCategory)).map((item) => {
                  // 24시간 타이틀 확인
                  const userTitle = getUserDailyTitle(item.userId);
                  const titleEffect = userTitle ? getTitleEffect(userTitle.effect) : null;
                  
                  return (
                  <div 
                    key={item.id} 
                    className="flex h-full flex-col gap-2 rounded-lg w-[180px] flex-shrink-0 cursor-pointer snap-start select-none"
                    style={{ scrollSnapAlign: 'start', scrollSnapStop: 'always' }}
                    onClick={() => handleItemClickWithDragCheck(item, 'recommended')}
                  >
                      <div 
                          className={`relative w-full aspect-[1/1.2] rounded-lg overflow-hidden hover:opacity-90 transition-opacity ${
                           titleEffect ? `${titleEffect.border} ${titleEffect.shadow}` : 'shadow-md border border-border-light'
                          }`}
                          style={userTitle ? { position: 'relative' } : {}}
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
                        <img
                          src={item.image || 'https://images.unsplash.com/photo-1524222717473-730000096953?w=800&auto=format&fit=crop&q=80'}
                          alt={item.location || '여행 사진'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1524222717473-730000096953?w=800&auto=format&fit=crop&q=80';
                          }}
                        />
                      )}
                      {/* 그라데이션 오버레이 */}
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.3))' }}></div>
                      
                        {/* 우측상단: 24시간 타이틀 배지 - 심플하게 */}
                      {userTitle && (
                         <div 
                           style={{ 
                             position: 'absolute', 
                             top: '8px', 
                             right: '8px', 
                             zIndex: 30
                           }}
                         >
                           <div className="px-2.5 py-1 rounded-full bg-primary/90 text-white text-[10px] font-bold flex items-center gap-1 shadow-md">
                             <span>{userTitle.icon}</span>
                             <span>{titleEffect?.badge || '오늘의 타이틀'}</span>
                           </div>
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
        </main>

        {/* 오늘의 타이틀 모달 - 핸드폰 프레임 안에서만 표시 */}
        {showTitleModal && (
          <div 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 50,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              padding: '16px'
            }}
            onClick={() => {
              setShowTitleModal(false);
              setSelectedTitle(null);
            }}
          >
            <div 
              className="w-full bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden"
              style={{
                maxHeight: 'calc(100% - 80px)',
                maxWidth: '100%'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 헤더 */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-bold text-text-light dark:text-text-dark flex items-center gap-2">
                <span className="text-xl">👑</span>
                오늘의 타이틀
              </h2>
              <button 
                onClick={() => {
                  setShowTitleModal(false);
                  setSelectedTitle(null);
                }}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <span className="material-symbols-outlined text-text-light dark:text-text-dark">close</span>
              </button>
              </div>

              {/* 컨텐츠 */}
              <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(100% - 120px)' }}>
              {selectedTitle ? (
                // 선택된 타이틀 상세 정보
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 border-2 border-amber-300 dark:border-amber-600">
                    <span className="text-5xl">{selectedTitle.icon || '👑'}</span>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-amber-900 dark:text-amber-200 mb-1">
                        {selectedTitle.name}
                      </h3>
                      <p className="text-sm text-amber-800/80 dark:text-amber-200/80">
                        {selectedTitle.category}
                      </p>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60">
                    <h4 className="text-sm font-bold text-text-light dark:text-text-dark mb-2">획득 조건</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {selectedTitle.description}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedTitle(null);
                    }}
                    className="w-full py-2 px-4 rounded-lg bg-gray-100 dark:bg-gray-800 text-text-light dark:text-text-dark text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    목록으로 돌아가기
                  </button>
                </div>
              ) : (
                // 전체 타이틀 + 명예의 전당을 한 시트에서 함께 표시
                <div className="space-y-4">
                  {/* 획득한 타이틀 */}
                  {allTodayTitles.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold text-text-light dark:text-text-dark mb-2">
                        획득한 타이틀 ({allTodayTitles.length}개)
                      </h3>
                      <div className="grid grid-cols-1 gap-2">
                        {allTodayTitles.map((item, index) => (
                          <div
                            key={`${item.userId}-${index}`}
                            className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 border border-amber-300 dark:border-amber-600 cursor-pointer hover:shadow-md transition-all"
                            onClick={() => setSelectedTitle(item.title)}
                          >
                            <span className="text-2xl">{item.title.icon || '👑'}</span>
                            <div className="flex-1">
                              <p className="text-sm font-bold text-amber-900 dark:text-amber-200">
                                {item.title.name}
                              </p>
                              <p className="text-xs text-amber-700/70 dark:text-amber-300/70">
                                {item.title.category}
                              </p>
                            </div>
                            <span className="material-symbols-outlined text-amber-600 dark:text-amber-400">chevron_right</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 오늘의 타이틀 명예의 전당 - 같은 시트 안에서 함께 보기 (더 특별한 스타일) */}
                  {titleHallPosts.length > 0 && (
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-800">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-bold text-text-light dark:text-text-dark flex items-center gap-1.5">
                          <span className="text-base">🏅</span>
                          타이틀 명예의 전당
                        </h3>
                        <button
                          onClick={() => navigate('/title-posts')}
                          className="text-[11px] font-semibold text-primary hover:underline"
                        >
                          전체 보기
                        </button>
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-2">
                        오늘 타이틀을 획득한 순간들이 동그란 메달처럼 모여 있어요.
                      </p>
                      <div className="grid grid-cols-4 gap-3 mt-1">
                        {titleHallPosts.map((post) => {
                          const userTitle = getUserDailyTitle(post.userId);
                          const titleEffect = userTitle ? getTitleEffect(userTitle.effect) : null;
                          return (
                            <div
                              key={post.id}
                              onClick={() => navigate(`/post/${post.id}`)}
                              className="relative w-full aspect-square flex items-center justify-center cursor-pointer group"
                            >
                              {/* 외곽 후광 */}
                              <div className={`absolute inset-0 rounded-full blur-md opacity-70 transition-opacity ${
                                titleEffect ? titleEffect.shadow : 'shadow-lg shadow-primary/40'
                              }`} />
                              {/* 메달 형태 썸네일 */}
                              <div
                                className={`relative w-[90%] h-[90%] rounded-full overflow-hidden border-4 bg-gray-200 dark:bg-gray-800 transition-transform duration-200 group-hover:scale-105 ${
                                  titleEffect ? titleEffect.border : 'border-primary'
                                }`}
                              >
                                <img
                                  src={post.image || 'https://images.unsplash.com/photo-1524222717473-730000096953?w=800&auto=format&fit=crop&q=80'}
                                  alt={post.location || '타이틀 게시물'}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.src = 'https://images.unsplash.com/photo-1524222717473-730000096953?w=800&auto=format&fit=crop&q=80';
                                  }}
                                />
                                {/* 상단 작은 타이틀 배지 */}
                                {userTitle && (
                                  <div className="absolute -top-1 left-1 right-1 flex justify-center">
                                    <div className="px-1.5 py-0.5 rounded-full bg-primary/90 text-[9px] text-white font-semibold shadow-md flex items-center gap-0.5">
                                      <span>{userTitle.icon}</span>
                                      <span className="truncate max-w-[48px]">
                                        {userTitle.name}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 모든 타이틀 목록 */}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                    <h3 className="text-sm font-bold text-text-light dark:text-text-dark mb-3">
                      모든 타이틀 목록 ({Object.keys(DAILY_TITLES).length}개)
                    </h3>
                    <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto">
                      {Object.values(DAILY_TITLES).map((title, index) => {
                        const isEarned = allTodayTitles.some(item => item.title.name === title.name);
                        return (
                          <div
                            key={index}
                            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer hover:shadow-md transition-all ${
                              isEarned
                                ? 'bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 border-amber-300 dark:border-amber-600'
                                : 'bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700'
                            }`}
                            onClick={() => setSelectedTitle(title)}
                          >
                            <span className="text-2xl">{title.icon || '👑'}</span>
                            <div className="flex-1">
                              <p className={`text-sm font-bold ${isEarned ? 'text-amber-900 dark:text-amber-200' : 'text-gray-700 dark:text-gray-300'}`}>
                                {title.name}
                                {isEarned && <span className="ml-2 text-xs">✓ 획득</span>}
                              </p>
                              <p className={`text-xs ${isEarned ? 'text-amber-700/70 dark:text-amber-300/70' : 'text-gray-500 dark:text-gray-400'}`}>
                                {title.category}
                              </p>
                            </div>
                            <span className="material-symbols-outlined text-gray-400 dark:text-gray-500">chevron_right</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
              </div>
          </div>
        </div>
        )}

        {/* 타이틀 획득 축하 모달 - 뱃지와 다른 심플한 스타일 (앱 컬러 시스템) */}
        {showTitleCelebration && earnedTitle && (
          <div className="absolute inset-0 z-[10000] flex items-center justify-center bg-black/70 p-4" style={{ position: 'absolute' }}>
            <div className="w-full max-w-sm transform rounded-3xl bg-background-light dark:bg-card-dark p-8 shadow-2xl border-4 border-primary animate-scale-up">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  {/* 심플한 아이콘 원 - primary 컬러 단색 */}
                  <div className="flex items-center justify-center w-32 h-32 rounded-full bg-primary shadow-xl">
                    <span className="text-6xl">{earnedTitle.icon || '👑'}</span>
                  </div>
                  {/* 단일 펄스 효과 */}
                  <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping"></div>
                  {/* VIP 배지 */}
                  <div className="absolute -top-2 -right-2 bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg animate-bounce">
                    VIP
                  </div>
                </div>
              </div>

              <h1 className="text-3xl font-bold text-center mb-3 text-text-primary-light dark:text-text-primary-dark">
                축하합니다!
              </h1>
              
              <p className="text-xl font-bold text-center text-primary mb-2">
                {earnedTitle.name}
              </p>
              
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="px-3 py-1 rounded-full text-sm font-bold bg-primary/10 text-primary border border-primary/30">
                  {earnedTitle.category || '24시간 타이틀'}
                </div>
              </div>
              
              <p className="text-base font-medium text-center text-text-secondary-light dark:text-text-secondary-dark mb-2">
                24시간 타이틀을 획득했습니다!
              </p>
              
              <p className="text-sm text-center text-text-subtle-light dark:text-text-subtle-dark mb-8 leading-relaxed">
                {earnedTitle.description || '오늘 하루 동안 이 타이틀을 유지할 수 있습니다!'}
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    setShowTitleCelebration(false);
                    setEarnedTitle(null);
                    navigate('/profile');
                  }}
                  className="w-full py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg transform hover:scale-105 active:scale-95 text-lg"
                >
                  프로필에서 확인하기
                </button>
                <button
                  onClick={() => {
                    setShowTitleCelebration(false);
                    setEarnedTitle(null);
                    navigate('/title-posts');
                  }}
                  className="w-full py-3 bg-subtle-light dark:bg-subtle-dark text-text-primary-light dark:text-text-primary-dark font-semibold rounded-xl hover:bg-border-light dark:hover:bg-border-dark transition-all"
                >
                  타이틀 명예의 전당
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default MainScreen;


















































