import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';
import { seedMockData } from '../utils/mockUploadData';
import { getUnreadCount } from '../utils/notifications';
import { getTimeAgo, filterRecentPosts } from '../utils/timeUtils';
import { getInterestPlaces, toggleInterestPlace } from '../utils/interestPlaces';
import { getRegionIcon } from '../utils/regionIcons';
import { logger } from '../utils/logger';
import { getRecommendedRegions, RECOMMENDATION_TYPES } from '../utils/recommendationEngine';

const MainScreen = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState(null);
  const [popularTags, setPopularTags] = useState([]);

  const [realtimeData, setRealtimeData] = useState([]);
  const [crowdedData, setCrowdedData] = useState([]);
  const [recommendedData, setRecommendedData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [interestPlaces, setInterestPlaces] = useState([]);
  const [selectedInterest, setSelectedInterest] = useState(null);
  const [showAddInterestModal, setShowAddInterestModal] = useState(false);
  const [newInterestPlace, setNewInterestPlace] = useState('');
  const [deleteConfirmPlace, setDeleteConfirmPlace] = useState(null);
  const [hoveredPlaceIndex, setHoveredPlaceIndex] = useState(null);
  const realtimeScrollRef = useRef(null);
  const crowdedScrollRef = useRef(null);
  const recommendedScrollRef = useRef(null);
  const tagScrollRef = useRef(null);
  const interestScrollRef = useRef(null);
  const themeScrollRef = useRef(null);
  const magazineScrollRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [currentScrollRef, setCurrentScrollRef] = useState(null);
  const [hasMoved, setHasMoved] = useState(false);
  const [isInterestSectionVisible, setIsInterestSectionVisible] = useState(true);
  const [interestOpacity, setInterestOpacity] = useState(1);
  const scrollY = useRef(0);
  
  // SOS 알림
  const [nearbySosRequests, setNearbySosRequests] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [dismissedSosIds, setDismissedSosIds] = useState(() => {
    // localStorage에서 지워진 알림 ID 목록 불러오기
    try {
      const saved = localStorage.getItem('dismissedSosIds_v1');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('지워진 SOS 알림 ID 로드 실패:', error);
      return [];
    }
  });
  
  // 위도/경도 거리 계산 (km)
  const getDistanceKm = (lat1, lon1, lat2, lon2) => {
    const toRad = (v) => (v * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };
  
  // SOS 요청 로드 및 주변 요청 필터링
  const loadSosRequests = useCallback(() => {
    try {
      const sosJson = localStorage.getItem('sosRequests_v1');
      const sosRequests = sosJson ? JSON.parse(sosJson) : [];
      
      if (!currentLocation) {
        setNearbySosRequests([]);
        return;
      }
      
      const nearby = sosRequests.filter((req) => {
        if (req.status !== 'open' || !req.coordinates) return false;
        const d = getDistanceKm(
          currentLocation.latitude,
          currentLocation.longitude,
          req.coordinates.lat,
          req.coordinates.lng
        );
        // 반경 5km 이내 SOS만 표시 (메인화면에서는 더 넓은 범위)
        return d <= 5;
      });
      
      setNearbySosRequests(nearby);
    } catch (error) {
      console.error('SOS 요청 로드 실패:', error);
    }
  }, [currentLocation]);
  
  // 현재 위치 가져오기
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error('위치 가져오기 실패:', error);
        }
      );
    }
  }, []);
  
  // SOS 요청 로드
  useEffect(() => {
    loadSosRequests();
    
    // 주기적으로 SOS 요청 확인 (30초마다)
    const interval = setInterval(() => {
      loadSosRequests();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [loadSosRequests]);

  // 관심 지역/장소로 필터링된 데이터
  const filteredRealtimeData = useMemo(() => {
    if (!selectedInterest) return realtimeData;
    return realtimeData.filter(item => {
      const location = item.location || item.title || '';
      return location.includes(selectedInterest) || selectedInterest.includes(location);
    });
  }, [realtimeData, selectedInterest]);

  const filteredCrowdedData = useMemo(() => {
    if (!selectedInterest) return crowdedData;
    return crowdedData.filter(item => {
      const location = item.location || item.title || '';
      return location.includes(selectedInterest) || selectedInterest.includes(location);
    });
  }, [crowdedData, selectedInterest]);

  // 모든 게시물에서 태그 수집 및 인기 태그 계산
  const extractPopularTags = useCallback((posts) => {
    const tagCountMap = new Map();
    
    posts.forEach(post => {
      const tags = post.tags || [];
      tags.forEach(tag => {
        const cleanTag = typeof tag === 'string' ? tag.replace(/^#+/, '').trim() : String(tag).replace(/^#+/, '').trim();
        if (cleanTag && cleanTag.length >= 2) {
          tagCountMap.set(cleanTag, (tagCountMap.get(cleanTag) || 0) + 1);
        }
      });
    });
    
    const sortedTags = Array.from(tagCountMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag]) => tag);
    
    return sortedTags;
  }, []);

  const filteredRecommendedData = useMemo(() => {
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
  }, [recommendedData, selectedTag]);

  // 추천 타입 선택 (기본값: 개화 정보)
  const [selectedRecommendationType, setSelectedRecommendationType] = useState('blooming');
  
  // 실제 게시물 데이터 기반 추천 지역
  const [recommendedRegions, setRecommendedRegions] = useState([]);
  
  // 선택된 추천 타입에 맞는 추천 지역
  const selectedRecommendation = useMemo(
    () => RECOMMENDATION_TYPES.find((type) => type.id === selectedRecommendationType) || RECOMMENDATION_TYPES[0],
    [selectedRecommendationType]
  );

  // 웹 메인 전용: 여행 매거진 카드 데이터
  const travelMagazineArticles = useMemo(() => ([
    {
      id: 'web-weekend-jeju',
      regionName: '제주',
      detailedLocation: '애월·협재',
      title: '이번 주말, 꼭 가봐야 하는 제주 서쪽 노을 드라이브',
      tagLine: '노을이 제일 예쁜 서쪽 해안 도로',
      summary: '애월에서 협재까지, 서쪽 해안을 따라 드라이브하면서 노을 맛집만 골라 들르는 1일 코스.',
      coverImage: 'https://images.unsplash.com/photo-1542367592-8849eb950fd8?auto=format&fit=crop&w=1200&q=80',
      content: [
        {
          type: 'text',
          title: '1. 오후, 애월 카페 거리에서 천천히 출발',
          body: '비행기에서 내려 숙소에 짐을 풀었다면, 애월 카페 거리에서 가벼운 브런치로 시작해 보세요.\n\n바다를 내려다보는 테라스 자리에 앉으면, 파도 소리와 함께 오늘 루트를 여유롭게 정리할 수 있어요.'
        },
        {
          type: 'image',
          caption: '애월 바다를 바라보는 테라스 카페',
          imageUrl: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80'
        },
        {
          type: 'text',
          title: '2. 협재·금능에서 맞이하는 황금빛 노을',
          body: '해가 지기 1시간 전쯤, 협재해수욕장 쪽으로 이동해 보세요.\n\n하얀 모래와 에메랄드빛 바다 위로 해가 천천히 떨어지면서, 실감나는 그림 같은 풍경이 펼쳐집니다.'
        },
        {
          type: 'image',
          caption: '협재에서 바라본 서쪽 노을',
          imageUrl: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1200&q=80'
        }
      ]
    },
    {
      id: 'web-weekend-busan',
      regionName: '부산',
      detailedLocation: '해운대·청사포',
      title: '현지인처럼 걷는 해운대·청사포 산책 루트',
      tagLine: '바다와 카페를 번갈아 걷는 산책 코스',
      summary: '해운대 해변에서 시작해 청사포까지, 기차선로와 바다를 따라 걷는 감성 산책 루트.',
      coverImage: 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?auto=format&fit=crop&w=1200&q=80',
      content: [
        {
          type: 'text',
          title: '1. 해운대 모래사장에서 천천히 몸 풀기',
          body: '아침에는 해운대 해변을 가볍게 걸으며 하루를 시작해 보세요.\n\n생각보다 파도가 잔잔해서, 신발을 벗고 물에 살짝 발을 담그고 걷기에도 좋아요.'
        },
        {
          type: 'image',
          caption: '한적한 오전의 해운대 해변',
          imageUrl: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80'
        },
        {
          type: 'text',
          title: '2. 청사포 다릿돌 전망대에서 바다 한 번 더',
          body: '해운대에서 미포를 지나 청사포까지 이어지는 해변 산책로는, 부산 현지인들도 자주 찾는 코스예요.\n\n유리 바닥으로 바다가 내려다보이는 다릿돌 전망대는 꼭 한 번 올라가 보세요.'
        },
        {
          type: 'image',
          caption: '청사포 다릿돌 전망대에서 내려다본 바다',
          imageUrl: 'https://images.unsplash.com/photo-1526481280695-3c687fd543c4?auto=format&fit=crop&w=1200&q=80'
        }
      ]
    },
    {
      id: 'web-weekend-seoul',
      regionName: '서울',
      detailedLocation: '잠실·반포',
      title: '멀리 가지 않아도, 도심에서 즐기는 한강 야경 산책',
      tagLine: '퇴근 후에도 가능한 도심 야경 코스',
      summary: '잠실·반포·여의도, 굳이 멀리 떠나지 않아도 충분히 여행 같은 한강 야경 산책 루트.',
      coverImage: 'https://images.unsplash.com/photo-1519181245277-cffeb31da2fb?auto=format&fit=crop&w=1200&q=80',
      content: [
        {
          type: 'text',
          title: '1. 해 질 무렵, 잠실대교 아래에서 시작하기',
          body: '해가 지기 시작할 때쯤, 잠실대교 근처 한강공원으로 가 보세요.\n\n하늘이 분홍빛으로 물들기 시작하면 롯데타워와 한강이 함께 들어오는, 서울다운 풍경을 볼 수 있어요.'
        },
        {
          type: 'image',
          caption: '야경이 예쁜 잠실 일대 한강 뷰',
          imageUrl: 'https://images.unsplash.com/photo-1549692520-acc6669e2f0c?auto=format&fit=crop&w=1200&q=80'
        },
        {
          type: 'text',
          title: '2. 반포대교 분수와 함께 마무리',
          body: '조금 더 여유가 있다면 반포대교 달빛무지개분수 시간에 맞춰 이동해 보세요.\n\n분수와 다리 불빛, 그리고 강가에 앉아 있는 사람들까지 합쳐져, 멀리 가지 않아도 여행 온 듯한 기분이 듭니다.'
        },
        {
          type: 'image',
          caption: '반포대교 분수와 한강 야경',
          imageUrl: 'https://images.unsplash.com/photo-1526481280695-3c687fd543c4?auto=format&fit=crop&w=1200&q=80'
        }
      ]
    },
  ]), []);

  const updateNotificationCount = useCallback(() => {
    setUnreadNotificationCount(getUnreadCount());
  }, []);

  const loadMockData = useCallback(() => {
    // 목업 데이터 생성
    seedMockData();
    
    // localStorage에서 직접 가져오기 (getPosts는 async이므로)
    const allPosts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');
    logger.log(`📸 전체 게시물 (기록): ${allPosts.length}개`);
    
    // 배열인지 확인
    if (!Array.isArray(allPosts)) {
      logger.error('게시물 데이터가 배열이 아닙니다:', allPosts);
      setRealtimeData([]);
      setCrowdedData([]);
      setRecommendedData([]);
      return;
    }
    
    const posts = filterRecentPosts(allPosts, 2);
    logger.log(`📊 메인화면 노출 게시물 (2일 이내): ${posts.length}개`);
    
    const realtimeFormatted = posts.slice(0, 30).map((post) => {
      const dynamicTime = getTimeAgo(post.timestamp || post.createdAt || post.time);
      
      return {
        id: post.id,
        images: post.images || [],
        videos: post.videos || [],
        image: (post.images && post.images.length > 0) ? post.images[0] : 
               (post.videos && post.videos.length > 0) ? post.videos[0] : 
               (post.image || ''),
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
        aiLabels: post.aiLabels
      };
    });
    
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    const crowdedFormatted = posts
      .filter(post => {
        const postTime = post.timestamp || post.createdAt || post.time;
        const timestamp = typeof postTime === 'number' ? postTime : new Date(postTime).getTime();
        return timestamp >= oneHourAgo;
      })
      .slice(0, 20)
      .map((post) => {
        const dynamicTime = getTimeAgo(post.timestamp || post.createdAt || post.time);
        
        return {
          id: post.id,
          images: post.images || [],
          videos: post.videos || [],
          image: (post.images && post.images.length > 0) ? post.images[0] : 
                 (post.videos && post.videos.length > 0) ? post.videos[0] : 
                 (post.image || ''),
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
          content: post.note || `${post.location}의 인기 명소!`,
          note: post.note,
          tags: post.tags || [],
          coordinates: post.coordinates,
          likes: post.likes || 0,
          comments: post.comments || [],
          questions: post.questions || [],
          qnaList: [],
          aiLabels: post.aiLabels,
          crowdLevel: post.crowdLevel || 'medium'
        };
      });
    
    const recommendedFormatted = posts.slice(0, 10).map((post) => {
      const dynamicTime = getTimeAgo(post.timestamp || post.createdAt || post.time);
      
      return {
        id: post.id,
        images: post.images || [],
        videos: post.videos || [],
        image: (post.images && post.images.length > 0) ? post.images[0] : 
               (post.videos && post.videos.length > 0) ? post.videos[0] : 
               (post.image || ''),
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
        content: post.note || `${post.location} 추천!`,
        note: post.note,
        tags: post.tags || [],
        coordinates: post.coordinates,
        likes: post.likes || 0,
        comments: post.comments || [],
        questions: post.questions || [],
        qnaList: [],
        aiLabels: post.aiLabels,
        weather: post.weather,
        crowdLevel: post.crowdLevel
      };
    });
    
    setRealtimeData(realtimeFormatted);
    setCrowdedData(crowdedFormatted);
    setRecommendedData(recommendedFormatted);
    
    const tags = extractPopularTags(posts);
    setPopularTags(tags);
    
    // 실제 게시물 데이터 기반 추천 지역 계산
    const recommended = getRecommendedRegions(allPosts, selectedRecommendationType);
    setRecommendedRegions(recommended);
    
    logger.log('📊 메인화면 Mock 데이터 로드:', {
      realtime: realtimeFormatted.length,
      crowded: crowdedFormatted.length,
      recommended: recommendedFormatted.length,
      popularTags: tags.length,
      recommendedRegions: recommended.length
    });
  }, [getTimeAgo, extractPopularTags, selectedTag, selectedRecommendationType]);


  const fetchPosts = useCallback(async () => {
    setLoading(true);
      setError(null);
      
    try {
      // localStorage에서 직접 가져오기
      loadMockData();
    } catch (err) {
      logger.error('게시물 로드 실패:', err);
      setError(err.message);
      loadMockData();
    } finally {
      setLoading(false);
    }
  }, [loadMockData]);

  const loadInterestPlaces = useCallback(() => {
    const places = getInterestPlaces();
    setInterestPlaces(places);
    logger.log(`⭐ 관심 지역/장소 로드: ${places.length}개`);
  }, []);

  const handleAddInterestPlace = useCallback(() => {
    if (!newInterestPlace.trim()) return;
    
    const added = toggleInterestPlace(newInterestPlace.trim());
    if (added) {
      loadInterestPlaces();
      setNewInterestPlace('');
      setShowAddInterestModal(false);
    }
  }, [newInterestPlace, loadInterestPlaces]);

  const handleDeleteInterestPlace = useCallback((placeName) => {
    toggleInterestPlace(placeName);
    loadInterestPlaces();
    setDeleteConfirmPlace(null);
    if (selectedInterest === placeName) {
      setSelectedInterest(null);
    }
  }, [loadInterestPlaces, selectedInterest]);

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  }, [searchQuery, navigate]);

  const handleSearchFocus = useCallback(() => {
    navigate('/search');
  }, [navigate]);

  const handleItemClickWithDragCheck = useCallback((item, sectionType) => {
    if (!hasMoved) {
      navigate(`/post/${item.id}`, { 
        state: { 
          post: item,
          sectionType,
          fromMain: true
        }
      });
    }
    setHasMoved(false);
  }, [hasMoved, navigate]);

  const handleMouseDown = useCallback((e, scrollRef) => {
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
    const walk = (x - startX) * 1.2;
    
    if (Math.abs(walk) > 5) {
      setHasMoved(true);
    }
    
    if (currentScrollRef.current) {
      currentScrollRef.current.scrollLeft = scrollLeft - walk;
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

  // 스크롤 이벤트 핸들러
  const handleScroll = useCallback((e) => {
    const currentScrollY = e.target.scrollTop;
    const scrollingDown = currentScrollY > scrollY.current;
    
    // 스크롤 시작 (10px 이상)하면 관심지역 섹션만 숨기기 (부드러운 애니메이션)
    if (currentScrollY > 10 && scrollingDown) {
      // 페이드 아웃
      setInterestOpacity(0);
      setTimeout(() => setIsInterestSectionVisible(false), 200);
    } else if (currentScrollY <= 10) {
      setIsInterestSectionVisible(true);
      // 페이드 인
      setInterestOpacity(1);
    }
    
    scrollY.current = currentScrollY;
  }, []);

  useEffect(() => {
      fetchPosts();
    updateNotificationCount();
      loadInterestPlaces();
  }, [fetchPosts, updateNotificationCount, loadInterestPlaces]);

  // 랜딩페이지 phone-screen 구조 그대로 적용
  return (
    <>
      <div className="phone-screen" style={{ 
        background: '#f8fafc',
        borderRadius: '32px',
        overflow: 'hidden',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}>
        {/* 상태바 영역 (시스템 UI 제거, 공간만 유지) */}
        <div style={{ height: '20px' }} />
        
        {/* 앱 헤더 */}
        <div className="app-header" style={{ 
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          background: 'transparent',
          color: '#111827'
        }}>
          <span className="app-title" style={{ 
            fontSize: '20px',
            fontWeight: 800,
            letterSpacing: '-0.8px',
            color: '#111827',
            fontFamily: "'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
          }}>Live Journey</span>
            <button 
              onClick={() => navigate('/notifications')}
            className="icon-btn"
            style={{ 
              fontSize: '24px',
              cursor: 'pointer',
              color: '#374151',
              fontWeight: 300,
              background: 'none',
              border: 'none',
              padding: 0,
              position: 'relative'
            }}
          >
            <span className="material-symbols-outlined">notifications</span>
              {unreadNotificationCount > 0 && (
              <span style={{ 
                position: 'absolute',
                top: '1.5px',
                right: '1.5px',
                width: '10px',
                height: '10px',
                background: '#00BCD4',
                borderRadius: '50%'
              }}></span>
              )}
            </button>
        </div>

        {/* SOS 알림 배너 - 로고와 검색창 사이 */}
        {nearbySosRequests.length > 0 && !dismissedSosIds.includes(nearbySosRequests[0]?.id) && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px 8px 16px',
            gap: '8px'
          }}>
            <button
              onClick={() => navigate('/map')}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                backgroundColor: '#ff6b35',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(255, 107, 53, 0.2)',
                textAlign: 'left'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'white' }}>warning</span>
              <span style={{
                flex: 1,
                fontSize: '11px',
                fontWeight: '600',
                color: 'white',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                현재 당신 근처에 도움이 필요한 사람이 있습니다
              </span>
              <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'white' }}>chevron_right</span>
            </button>
            <button
              onClick={() => {
                if (nearbySosRequests[0]?.id) {
                  const newDismissedIds = [...dismissedSosIds, nearbySosRequests[0].id];
                  setDismissedSosIds(newDismissedIds);
                  // localStorage에 저장해서 영구적으로 유지
                  try {
                    localStorage.setItem('dismissedSosIds_v1', JSON.stringify(newDismissedIds));
                  } catch (error) {
                    console.error('지워진 SOS 알림 ID 저장 실패:', error);
                  }
                }
              }}
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 107, 53, 0.2)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#ff6b35' }}>close</span>
            </button>
          </div>
        )}

        {/* 검색바 - 크게 키움 */}
        <div className="app-search-bar" style={{ 
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '14px 20px',
          margin: '12px 16px',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          minHeight: '56px'
        }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
            <span className="material-symbols-outlined search-icon" style={{ 
              fontSize: '24px',
              fontWeight: 400,
              color: '#00BCD4'
            }}>search</span>
                <input
              type="text"
                  placeholder="어디로 떠나볼까요? 🌏"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={handleSearchFocus}
              style={{ 
                border: 'none',
                outline: 'none',
                flex: 1,
                fontSize: '16px',
                color: '#374151',
                background: 'transparent',
                fontWeight: 400
              }}
            />
          </form>
        </div>

        {/* 관심 지역 (스토리 스타일) - 스크롤시 숨김 (부드러운 애니메이션) */}
        {isInterestSectionVisible && (
          <div style={{ 
            opacity: interestOpacity,
            transition: 'opacity 0.2s ease-out'
          }}>
            <div style={{ padding: '0 16px 6px 16px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
                marginBottom: '6px'
          }}>
            <h3 style={{ 
              fontSize: '16px', 
              fontWeight: 700, 
              color: '#111827',
              margin: 0
            }}>
              관심 지역/장소
            </h3>
            {interestPlaces.length === 0 && (
              <span style={{ 
                fontSize: '12px', 
                color: '#9CA3AF',
                fontWeight: 400
              }}>
                관심지역을 추가해보세요
              </span>
            )}
          </div>
        </div>
        <div 
          className="interest-places"
          ref={interestScrollRef}
          onMouseDown={(e) => handleMouseDown(e, interestScrollRef)}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          style={{ 
            display: 'flex',
                gap: '10px',
                padding: '0 16px 6px 16px',
            overflowX: 'auto',
            scrollbarWidth: 'none'
          }}
        >
              {/* 관심 지역/장소들 */}
              {interestPlaces.map((place, index) => {
                const isSelected = selectedInterest === place.name;
            const regionIcon = getRegionIcon(place.name);
            const isHovered = hoveredPlaceIndex === index;
                return (
              <div
                    key={index}
                className={`interest-item ${isSelected ? 'active' : ''}`}
                style={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  minWidth: '52px',
                  position: 'relative'
                }}
                onMouseEnter={() => setHoveredPlaceIndex(index)}
                onMouseLeave={() => setHoveredPlaceIndex(null)}
              >
                <button
                    onClick={() => {
                      if (!hasMoved) {
                        setSelectedInterest(isSelected ? null : place.name);
                      }
                    }}
                  style={{ 
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    width: '100%'
                  }}
                >
                  <div 
                    className="interest-avatar"
                    style={{ 
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      background: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '22px',
                      border: isSelected ? '2px solid #00BCD4' : '2px solid transparent',
                      boxShadow: isSelected ? '0 0 0 2px #E0F7FA' : 'none',
                      color: '#4B5563'
                    }}
                  >
                    {regionIcon}
                    </div>
                  <span className="interest-name" style={{ 
                    fontSize: '10px',
                    fontWeight: 500,
                    color: isSelected ? '#00BCD4' : '#374151',
                    textAlign: 'center',
                    whiteSpace: 'nowrap'
                  }}>
                      {place.name}
                    </span>
                  </button>
                {isHovered && (
            <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirmPlace(place.name);
                    }}
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      width: '20px',
                      height: '20px',
                      background: 'white',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      border: '1px solid #E5E7EB',
                      cursor: 'pointer',
                      zIndex: 10
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#EF4444' }}>close</span>
            </button>
                )}
          </div>
            );
          })}
          
          {/* 추가 버튼 - 우측으로 배치 */}
          <div className="interest-item" style={{ 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            minWidth: '52px'
          }}>
            <button
              onClick={() => {
                if (!hasMoved) {
                  setShowAddInterestModal(true);
                }
              }}
              style={{ 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              <div className="interest-avatar" style={{ 
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                border: '1.5px dashed #9CA3AF',
                color: '#9CA3AF'
              }}>
                <span className="material-symbols-outlined" style={{ fontWeight: 300, fontSize: '22px' }}>add_circle</span>
              </div>
              <span className="interest-name" style={{ 
                fontSize: '10px',
                fontWeight: 500,
                color: '#9CA3AF',
                textAlign: 'center',
                whiteSpace: 'nowrap'
              }}>
                추가
              </span>
            </button>
          </div>
            </div>
          </div>
        )}
        
        {/* 실시간 피드 */}
        <div className="app-content" style={{ 
          padding: '0 0 100px 0',
          flex: 1,
          overflowY: 'auto',
          scrollbarWidth: 'none'
        }} onScroll={handleScroll}>
          {/* 실시간 여행 피드 섹션 */}
          <div className="feed-section" style={{ marginBottom: '20px' }}>
            <div className="section-header-main" style={{ 
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              padding: '0 16px 12px 16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ 
                  fontSize: '15px',
                  fontWeight: 700,
                  color: '#111827',
                  margin: 0
                }}>🔥 지금 여기는</h3>
                <span className="live-badge" style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 10px',
                  background: '#FFF8E1',
                  borderRadius: '12px',
                  fontSize: '10px',
                  fontWeight: 700,
                  color: '#FFA000'
                }}>
                  <span className="live-dot" style={{ 
                    width: '5px',
                    height: '5px',
                    background: '#ef4444',
                    borderRadius: '50%',
                    animation: 'pulse 1.5s ease-in-out infinite'
                  }}></span>
                  <span>LIVE</span>
              </span>
              </div>
              <button
                onClick={() => navigate('/realtime-feed')}
                className="more-btn"
                style={{ 
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#00BCD4',
                  cursor: 'pointer',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                더보기
              </button>
              </div>
            </div>
            
            {/* 횡스크롤 카드 */}
            {filteredRealtimeData.length > 0 ? (
            <div 
                className="horizontal-scroll"
              ref={realtimeScrollRef}
              onMouseDown={(e) => handleMouseDown(e, realtimeScrollRef)}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              style={{ 
                  display: 'flex',
                  gap: '12px',
                  padding: '0 16px',
                  overflowX: 'auto',
                  scrollbarWidth: 'none',
                  paddingBottom: '4px',
                scrollBehavior: 'smooth', 
                WebkitOverflowScrolling: 'touch',
                  cursor: 'grab',
                userSelect: 'none',
                scrollSnapType: 'x mandatory',
                scrollPadding: '0 16px' // 첫/마지막 카드 양쪽 선 잘 안 잘리도록
              }}
            >
                {filteredRealtimeData.map((item, index) => (
                    <div 
                      key={item.id} 
                    className="scroll-card"
                    style={{ 
                      flexShrink: 0,
                      width: '180px', // 두 장 정도 보이게 유지
                      borderRadius: '12px',
                      overflow: 'hidden',
                      background: 'white',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                      cursor: 'pointer',
                      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                      animation: `fadeInSlide 0.5s ease-out ${index * 0.1}s both`,
                      scrollSnapAlign: 'start',
                    }}
                      onClick={() => handleItemClickWithDragCheck(item, 'realtime')}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.12)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
                    }}
                  >
                    <div className="scroll-image" style={{ 
                      position: 'relative',
                      width: '100%',
                      height: '200px',
                      overflow: 'hidden'
                    }}>
                        {item.videos && item.videos.length > 0 ? (
                          <video
                            src={item.videos[0]}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            autoPlay
                            loop
                            muted
                            playsInline
                            draggable={false}
                          />
                        ) : (
                          <img
                            src={item.image || 'https://images.unsplash.com/photo-1524222717473-730000096953?w=800&auto=format&fit=crop&q=80'}
                            alt={item.location || '여행 사진'}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                            onError={(e) => {
                              e.currentTarget.src = 'https://images.unsplash.com/photo-1524222717473-730000096953?w=800&auto=format&fit=crop&q=80';
                            }}
                            draggable={false}
                          />
                        )}
                      {item.time && (
                        <div className="scroll-badge" style={{ 
                        position: 'absolute', 
                          top: '8px',
                          right: '8px',
                          background: 'rgba(0, 0, 0, 0.7)',
                          backdropFilter: 'blur(10px)',
                              color: 'white', 
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '4px 8px',
                          borderRadius: '10px'
                        }}>
                          {item.time}
                        </div>
                      )}
                    </div>
                    <div className="scroll-info" style={{ 
                      padding: '10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}>
                      <span className="scroll-location" style={{ 
                              fontSize: '12px', 
                        fontWeight: 600,
                        color: '#111827',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {item.location ? `📍 ${item.location}` : item.title || '위치 정보 없음'}
                      </span>
                      <span className="scroll-user" style={{ 
                        fontSize: '11px',
                        color: '#6B7280'
                      }}>
                        {item.user || '여행자'}
                      </span>
                        </div>
                      </div>
                ))}
                    </div>
            ) : (
              <div style={{ padding: '40px 16px', textAlign: 'center', color: '#6B7280' }}>
                아직 게시물이 없습니다.
            </div>
          )}
          </div>

          {/* 혼잡도 정보 섹션 */}
          <div className="feed-section" style={{ marginBottom: '20px' }}>
            <div className="section-header-main" style={{ 
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0 16px 12px 16px'
            }}>
              <h3 style={{ 
                fontSize: '15px',
                fontWeight: 700,
                color: '#111827',
                margin: 0
              }}>👥 지금 가장 붐비는 곳</h3>
              <span className="more-btn" style={{ 
                fontSize: '12px',
                fontWeight: 600,
                color: '#00BCD4',
                cursor: 'pointer'
              }}>더보기</span>
            </div>
            
            {filteredCrowdedData.length > 0 ? (
            <div 
                className="horizontal-scroll"
              ref={crowdedScrollRef}
              onMouseDown={(e) => handleMouseDown(e, crowdedScrollRef)}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              style={{ 
                  display: 'flex',
                  gap: '12px',
                  padding: '0 16px',
                  overflowX: 'auto',
                  scrollbarWidth: 'none',
                  paddingBottom: '4px',
                scrollBehavior: 'smooth', 
                WebkitOverflowScrolling: 'touch',
                  cursor: 'grab',
                  userSelect: 'none'
              }}
            >
                {filteredCrowdedData.map((item) => {
                  const getCrowdLevel = () => {
                    if (item.crowdLevel) return item.crowdLevel;
                    if (item.tags && item.tags.some(tag => tag.includes('혼잡') || tag.includes('붐빔'))) return 'high';
                    if (item.tags && item.tags.some(tag => tag.includes('보통'))) return 'medium';
                    return 'low';
                  };
                  const crowdLevel = getCrowdLevel();
                  const crowdText = crowdLevel === 'high' ? '매우 혼잡' : crowdLevel === 'medium' ? '보통' : '여유';
                  const crowdBadgeClass = crowdLevel === 'high' ? 'high' : crowdLevel === 'medium' ? 'medium' : 'low';
                  
                  return (
                  <div 
                    key={item.id} 
                      className="scroll-card-small"
                      style={{ 
                        flexShrink: 0,
                        width: '140px',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        background: 'white',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                        cursor: 'pointer'
                      }}
                    onClick={() => handleItemClickWithDragCheck(item, 'crowded')}
                  >
                      <div className="scroll-image-small" style={{ 
                        position: 'relative',
                        width: '100%',
                        height: '140px',
                        overflow: 'hidden'
                      }}>
                      {item.videos && item.videos.length > 0 ? (
                        <video
                          src={item.videos[0]}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          autoPlay
                          loop
                          muted
                          playsInline
                        />
                      ) : (
                        <img
                          src={item.image || 'https://images.unsplash.com/photo-1524222717473-730000096953?w=800&auto=format&fit=crop&q=80'}
                          alt={item.location || '여행 사진'}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1524222717473-730000096953?w=800&auto=format&fit=crop&q=80';
                          }}
                        />
                      )}
                        <div className={`crowd-badge ${crowdBadgeClass}`} style={{ 
                        position: 'absolute', 
                          top: '8px',
                          right: '8px',
                          fontSize: '9px',
                          fontWeight: 700,
                          padding: '4px 8px',
                          borderRadius: '8px',
                          background: crowdLevel === 'high' ? 'rgba(239, 68, 68, 0.9)' : crowdLevel === 'medium' ? 'rgba(245, 158, 11, 0.9)' : 'rgba(16, 185, 129, 0.9)',
                          color: 'white'
                        }}>
                          {crowdText}
                        </div>
                      </div>
                      <div className="scroll-info-small" style={{ 
                        padding: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '3px'
                      }}>
                        <span className="scroll-location-small" style={{ 
                          fontSize: '11px',
                          fontWeight: 600,
                          color: '#111827',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {item.location || item.title || '위치 정보 없음'}
                        </span>
                        <span className="scroll-time-small" style={{ 
                          fontSize: '10px',
                          color: '#6B7280'
                        }}>
                          {item.time ? `${item.time} 업데이트` : '방금 전 업데이트'}
                        </span>
                  </div>
                </div>
                );
              })}
              </div>
            ) : (
              <div style={{ padding: '40px 16px', textAlign: 'center', color: '#6B7280' }}>
                아직 혼잡도 정보가 없습니다.
            </div>
          )}
          </div>
          
          {/* 상세 게시물 (추천 여행지 피드) */}
          <div className="feed-section" style={{ marginBottom: '20px' }}>
            <div className="section-header-main" style={{ 
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0 16px 12px 16px'
            }}>
              <h3 style={{ 
                fontSize: '15px',
                fontWeight: 700,
                color: '#111827',
                margin: 0
              }}>✨ 추천 여행지</h3>
          </div>

            {/* 추천 여행지 섹션 - 실제 게시물 데이터 기반 */}
            <div style={{ padding: '0 16px 10px 16px' }}>
              {selectedRecommendation && (
                <p style={{ 
                  fontSize: '12px', 
                  color: '#6B7280',
                  margin: '0 0 6px 0'
                }}>
                  {selectedRecommendation.description}
                </p>
              )}

              {/* 추천 타입 탭 */}
              <div
                ref={themeScrollRef}
                onMouseDown={(e) => handleMouseDown(e, themeScrollRef)}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                style={{ 
                display: 'flex',
                gap: '8px',
                marginBottom: '8px',
                overflowX: 'auto',
                scrollBehavior: 'smooth',
                WebkitOverflowScrolling: 'touch'
              }}>
                {RECOMMENDATION_TYPES.map((type) => {
                  const isActive = type.id === selectedRecommendationType;
                  return (
                    <button
                      key={type.id}
                      onClick={() => {
                        setSelectedRecommendationType(type.id);
                        // 추천 지역 다시 계산
                        const allPosts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');
                        const recommended = getRecommendedRegions(allPosts, type.id);
                        setRecommendedRegions(recommended);
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '999px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        backgroundColor: isActive ? '#00BCD4' : '#E5E7EB',
                        color: isActive ? '#FFFFFF' : '#4B5563',
                      }}
                    >
                      {type.name}
                    </button>
                  );
                })}
              </div>

              {/* 추천 지역 카드 리스트 (실제 게시물 데이터 기반) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {recommendedRegions.length > 0 ? (
                  recommendedRegions.map((region) => (
                    <button
                      key={region.regionName}
                      onClick={() =>
                        navigate(`/region/${region.regionName}`, {
                          state: {
                            region: { name: region.regionName }
                          }
                        })
                      }
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        padding: '8px 10px',
                        borderRadius: '12px',
                        border: 'none',
                        backgroundColor: '#FFFFFF',
                        boxShadow: '0 1px 4px rgba(15, 23, 42, 0.06)',
                        cursor: 'pointer',
                      }}
                    >
                      {/* 지역 대표 사진 (실제 게시물 이미지 또는 기본 이미지) */}
                      <div
                        style={{
                          width: '72px',
                          height: '54px',
                          borderRadius: '10px',
                          overflow: 'hidden',
                          marginRight: '10px',
                          backgroundColor: '#E5E7EB',
                          flexShrink: 0,
                        }}
                      >
                        {region.image ? (
                          <img
                            src={region.image}
                            alt={region.regionName}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '100%',
                              height: '100%',
                              backgroundImage: `url("https://source.unsplash.com/featured/?${encodeURIComponent(
                                region.regionName + ' travel landscape'
                              )}")`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                            }}
                          />
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%' }}>
                          <span
                            style={{
                              fontSize: '13px',
                              fontWeight: 700,
                              color: '#111827',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {region.regionName}
                          </span>
                          {region.badge && (
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 600,
                                color: '#00BCD4',
                                backgroundColor: '#E0F7FA',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {region.badge}
                            </span>
                          )}
                        </div>
                        <span
                          style={{
                            fontSize: '11px',
                            color: '#6B7280',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            width: '100%',
                          }}
                        >
                          {region.description}
                        </span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div style={{ 
                    padding: '20px',
                    textAlign: 'center',
                    color: '#6B7280',
                    fontSize: '13px'
                  }}>
                    {selectedRecommendationType === 'blooming' 
                      ? '개화상태 80% 이상인 지역이 아직 없습니다.'
                      : '추천 지역이 아직 없습니다.'}
                  </div>
                )}
              </div>
            </div>

            {/* 추천 게시물 피드는 숨김 처리 (추천 지역 카드만 표시) */}
            {false && filteredRecommendedData.map((item) => (
              <div 
                key={item.id} 
                className="feed-card"
                style={{ 
                  background: 'white',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  margin: '0 16px 14px 16px',
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.06)',
                  cursor: 'pointer'
                }}
                onClick={() => handleItemClickWithDragCheck(item, 'recommended')}
              >
                <div className="card-header" style={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '11px'
                }}>
                  <div className="user-info" style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '9px'
                  }}>
                    <div className="user-avatar" style={{ 
                      width: '34px',
                      height: '34px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #E0F7FA 0%, #00BCD4 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '17px'
                    }}>
                      {item.userId ? String(item.userId).charAt(0) : '👤'}
          </div>
                    <div className="user-details" style={{ 
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1px'
                    }}>
                      <span className="user-name" style={{ 
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#111827'
                      }}>
                        {item.user || '여행자'}
              </span>
                      <span className="post-time" style={{ 
                        fontSize: '10px',
                        color: '#6B7280'
                      }}>
                        {item.time || '방금 전'}
                      </span>
            </div>
                  </div>
                  {item.location && (
                    <button
                      className="location-badge"
                      onClick={(e) => {
                        e.stopPropagation(); // 카드 클릭 이벤트와 분리
                        navigate(`/region/${item.location}`, {
                          state: {
                            region: { name: item.location }
                          }
                        });
                      }}
                      style={{ 
                        fontSize: '10px',
                        fontWeight: 600,
                        color: '#00BCD4',
                        background: '#E0F7FA',
                        padding: '4px 8px',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'opacity 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                    >
                      📍 {item.location}
                    </button>
                  )}
            </div>
                <div className="card-image" style={{ 
                  position: 'relative',
                  width: '100%',
                  height: '220px',
                  background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
                  overflow: 'hidden'
                }}>
                      {item.videos && item.videos.length > 0 ? (
                        <video
                          src={item.videos[0]}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          autoPlay
                          loop
                          muted
                          playsInline
                        />
                      ) : (
                        <img
                          src={item.image || 'https://images.unsplash.com/photo-1524222717473-730000096953?w=800&auto=format&fit=crop&q=80'}
                          alt={item.location || '여행 사진'}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1524222717473-730000096953?w=800&auto=format&fit=crop&q=80';
                          }}
                        />
                      )}
                  <div className="live-indicator" style={{ 
                        position: 'absolute', 
                    top: '10px',
                    right: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '5px 11px',
                    background: 'rgba(0, 0, 0, 0.75)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '16px',
                    fontSize: '10px',
                    fontWeight: 700,
                    color: 'white'
                  }}>
                    <span className="live-pulse" style={{ 
                      width: '5px',
                      height: '5px',
                      background: '#ef4444',
                      borderRadius: '50%',
                      animation: 'pulse 1.5s ease-in-out infinite'
                    }}></span>
                    <span>{item.time || 'LIVE'}</span>
                  </div>
                </div>
                <div className="card-info" style={{ padding: '11px' }}>
                  <div className="info-tags" style={{ 
                    display: 'flex',
                    gap: '5px',
                    marginBottom: '9px',
                    flexWrap: 'wrap'
                  }}>
                    {item.category && (
                      <span className="tag" style={{ 
                        fontSize: '10px',
                        fontWeight: 600,
                        color: '#374151',
                        background: '#F3F4F6',
                        padding: '4px 9px',
                        borderRadius: '8px'
                      }}>
                        {item.category === '자연' ? '🏞️' : item.category === '맛집' ? '🍜' : item.category === '카페' ? '☕' : '📍'} {item.category}
                      </span>
                    )}
                    {item.weather && (
                      <span className="tag" style={{ 
                        fontSize: '10px',
                        fontWeight: 600,
                        color: '#374151',
                        background: '#F3F4F6',
                        padding: '4px 9px',
                        borderRadius: '8px'
                      }}>
                        {item.weather}
                      </span>
                    )}
                    {item.crowdLevel && (
                      <span className="tag" style={{ 
                        fontSize: '10px',
                        fontWeight: 600,
                        color: '#374151',
                        background: '#F3F4F6',
                        padding: '4px 9px',
                        borderRadius: '8px'
                      }}>
                        {item.crowdLevel === 'high' ? '👥 매우 혼잡' : item.crowdLevel === 'medium' ? '👥 보통' : '👥 여유'}
                      </span>
                    )}
                  </div>
                  {item.note && (
                    <p className="post-text" style={{ 
                              fontSize: '12px', 
                      lineHeight: '1.5',
                      color: '#1F2937',
                      marginBottom: '10px'
                    }}>
                      "{item.note}"
                            </p>
                          )}
                  <div className="card-actions" style={{ 
                    display: 'flex',
                    gap: '14px',
                    paddingTop: '9px',
                    borderTop: '1px solid #F3F4F6'
                  }}>
                    <span className="action-btn" style={{ 
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#4B5563'
                    }}>❤️ {item.likes || 0}</span>
                    <span className="action-btn" style={{ 
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#4B5563'
                    }}>💬 {item.comments?.length || 0}</span>
                    <span className="action-btn" style={{ 
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#4B5563',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '14px', margin: 0 }}>bookmark</span>
                    </span>
                        </div>
                    </div>
                  </div>
            ))}
                </div>

          {/* 여행 매거진 섹션 – 추천 여행지 하단 */}
          {/* 나중에 고객들이 많이 모이고 나면 큐레이션해서 보여주는 것으로 변경 예정 */}
          {false && (
          <div className="feed-section" style={{ marginBottom: '20px' }}>
            <div className="section-header-main" style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              padding: '0 16px 12px 16px',
              gap: '4px'
            }}>
              <h3 style={{
                fontSize: '15px',
                fontWeight: 700,
                color: '#111827',
                margin: 0
              }}>📰 여행 매거진</h3>
              <p style={{
                fontSize: '12px',
                color: '#6B7280',
                margin: 0
              }}>이번 주말 꼭 가봐야 하는 장소</p>
            </div>

            <div
              ref={magazineScrollRef}
              onMouseDown={(e) => handleMouseDown(e, magazineScrollRef)}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              style={{
              display: 'flex',
              overflowX: 'auto',
              padding: '0 16px 16px 16px',
                gap: '12px',
                scrollBehavior: 'smooth',
                WebkitOverflowScrolling: 'touch',
                cursor: 'grab',
                userSelect: 'none'
              }}
            >
              {travelMagazineArticles.map((article) => (
                <div
                  key={article.id}
                  style={{
                    minWidth: '220px',
                    maxWidth: '240px',
                    borderRadius: '16px',
                    background: '#FFFFFF',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                  onClick={() => navigate(`/magazine/${article.id}`, { state: { magazine: article } })}
                >
                  <div style={{
                    position: 'relative',
                    width: '100%',
                    height: '140px',
                    background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundImage: `url("https://source.unsplash.com/featured/?${encodeURIComponent(article.regionName + ' travel landscape')}")`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }} />
                    <div style={{
                      position: 'absolute',
                      left: 8,
                      bottom: 8,
                      padding: '4px 8px',
                      borderRadius: 999,
                      backgroundColor: 'rgba(0,0,0,0.6)',
                      color: '#FFFFFF',
                      fontSize: '10px',
                      fontWeight: 600
                    }}>
                      {article.tagLine}
                    </div>
                  </div>
                  <div style={{ padding: '10px 12px 12px 12px' }}>
                    <div style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#00BCD4',
                      marginBottom: '2px'
                    }}>
                      {article.regionName}
                    </div>
                    <div style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#111827',
                      lineHeight: 1.4
                    }}>
                      {article.title}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          )}
        </div>
        
        {/* 바텀 네비게이션 */}
        <BottomNavigation />
      </div>

      {/* 관심 지역/장소 추가 모달 */}
      {showAddInterestModal && (
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-end" onClick={() => setShowAddInterestModal(false)}>
          <div className="w-full bg-white dark:bg-gray-900 rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">관심 지역/장소 추가</h3>
              <button
                onClick={() => {
                  setShowAddInterestModal(false);
                  setNewInterestPlace('');
                }}
                className="w-8 h-8 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                지역 또는 장소 이름
              </label>
              <input
                type="text"
                value={newInterestPlace}
                onChange={(e) => setNewInterestPlace(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddInterestPlace();
                  }
                }}
                placeholder="예: 제주, 부산 해운대, 경주 불국사"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                autoFocus
              />
              
              {newInterestPlace.trim() && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">미리보기</p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-2xl">{getRegionIcon(newInterestPlace.trim())}</span>
                    </div>
                    <span className="text-base font-semibold text-gray-900 dark:text-white">
                      {newInterestPlace.trim()}
                    </span>
              </div>
            </div>
          )}
            </div>
            
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setShowAddInterestModal(false);
                  setNewInterestPlace('');
                }}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleAddInterestPlace}
                disabled={!newInterestPlace.trim()}
                className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-colors ${
                  newInterestPlace.trim()
                    ? 'bg-primary text-white hover:bg-primary-dark'
                    : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed'
                }`}
              >
                추가
              </button>
        </div>
      </div>
        </div>
      )}

      {/* 관심 지역/장소 삭제 확인 모달 */}
      {deleteConfirmPlace && (
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center" onClick={() => setDeleteConfirmPlace(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-[80%] max-w-[320px] shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 text-center">
              관심 지역/장소 삭제
            </h3>
            <p className="text-base text-gray-600 dark:text-gray-400 mb-6 text-center">
              "{deleteConfirmPlace}"을(를) 삭제하시겠어요?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmPlace(null)}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => handleDeleteInterestPlace(deleteConfirmPlace)}
                className="flex-1 px-4 py-3 rounded-xl font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                삭제
              </button>
    </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MainScreen;
