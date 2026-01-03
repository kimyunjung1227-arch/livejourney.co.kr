import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
  TextInput,
  FlatList,
  Dimensions,
  Animated,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/styles';
import { filterRecentPosts, getTimeAgo } from '../utils/timeUtils';
import { getUserDailyTitle, getTitleEffect, getAllTodayTitles, DAILY_TITLES } from '../utils/dailyTitleSystem';
import { getInterestPlaces, toggleInterestPlace } from '../utils/interestPlaces';
import { getRegionIcon } from '../utils/regionIcons';
import { ScreenLayout, ScreenContent, ScreenHeader, ScreenBody } from '../components/ScreenLayout';
import { Modal } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = 180;
const CARD_HEIGHT = CARD_WIDTH * 1.2;

const MainScreen = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('자연');
  const [refreshing, setRefreshing] = useState(false);
  
  const [realtimeData, setRealtimeData] = useState([]);
  const [crowdedData, setCrowdedData] = useState([]);
  const [recommendedData, setRecommendedData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [dailyTitle, setDailyTitle] = useState(null);
  const [allTodayTitles, setAllTodayTitles] = useState([]);
  const [showTitleModal, setShowTitleModal] = useState(false);
  const [selectedTitle, setSelectedTitle] = useState(null);
  const [showTitleCelebration, setShowTitleCelebration] = useState(false);
  const [earnedTitle, setEarnedTitle] = useState(null);
  const [interestPlaces, setInterestPlaces] = useState([]);
  const [selectedInterest, setSelectedInterest] = useState(null);
  const [showAddInterestModal, setShowAddInterestModal] = useState(false);
  const [newInterestPlace, setNewInterestPlace] = useState('');
  const [deleteConfirmPlace, setDeleteConfirmPlace] = useState(null);
  const [isInterestSectionVisible, setIsInterestSectionVisible] = useState(true);
  const scrollY = useRef(0);
  const interestOpacity = useRef(new Animated.Value(1)).current;
  
  // SOS 알림
  const [nearbySosRequests, setNearbySosRequests] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [dismissedSosIds, setDismissedSosIds] = useState([]);
  
  // dismissedSosIds 초기화 (AsyncStorage에서 로드)
  useEffect(() => {
    const loadDismissedSosIds = async () => {
      try {
        const saved = await AsyncStorage.getItem('dismissedSosIds_v1');
        if (saved) {
          setDismissedSosIds(JSON.parse(saved));
        }
      } catch (error) {
        console.error('지워진 SOS 알림 ID 로드 실패:', error);
      }
    };
    loadDismissedSosIds();
  }, []);
  
  const categories = useMemo(() => ['자연', '힐링', '액티비티', '맛집', '카페'], []);
  
  // 상황별 추천 테마 (가벼운 추천 여행지)
  const travelThemes = useMemo(() => [
    {
      id: 'weekend_nearby',
      name: '주말 근교',
      description: '서울 기준 2시간 이내',
      regions: ['서울', '강릉', '춘천'],
    },
    {
      id: 'one_day',
      name: '당일치기',
      description: '아침에 떠나서 밤에 돌아오기',
      regions: ['인천', '수원', '속초'],
    },
    {
      id: 'healing_2days',
      name: '1박 2일 힐링',
      description: '조용히 쉬고 오는 여행',
      regions: ['제주', '여수', '남해'],
    },
    {
      id: 'solo_trip',
      name: '혼자 가기 좋아요',
      description: '혼자서도 부담 없는 동선',
      regions: ['부산', '전주', '광주'],
    },
    {
      id: 'couple_trip',
      name: '커플 여행',
      description: '함께 걷기 좋은 감성 코스',
      regions: ['여수', '부산', '제주'],
    },
  ], []);

  // 지역별 한 줄 카피
  const regionCopyMap = useMemo(
    () => ({
      서울: '야경과 맛집이 가까운 도심 여행',
      부산: '해운대와 광안리를 걷는 바다 여행',
      제주: '섬을 한 바퀴 도는 힐링 드라이브',
      강릉: '바다와 카페를 동시에 즐기는 해변 도시',
      여수: '야경과 해산물이 맛있는 항구 여행',
      속초: '설악산과 동해를 함께 보는 힐링 여행',
      춘천: '호수와 카페가 어우러진 감성 여행',
      인천: '바다와 거리 산책이 함께 있는 근교 여행',
      수원: '화성과 구도심을 도는 역사 여행',
      남해: '조용한 남쪽 바다 마을로 떠나는 휴식',
      전주: '한옥마을에서 즐기는 전통 도시 여행',
      광주: '카페와 예술 공간을 걷는 문화 여행',
    }),
    []
  );

  const [selectedThemeId, setSelectedThemeId] = useState('weekend_nearby');

  const selectedTheme = useMemo(() => {
    if (!travelThemes || travelThemes.length === 0) return null;
    return travelThemes.find((theme) => theme.id === selectedThemeId) || travelThemes[0];
  }, [travelThemes, selectedThemeId]);

  // 웹 메인 전용: 여행 매거진 카드 데이터 (웹과 동일)
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
  const loadSosRequests = useCallback(async () => {
    try {
      const sosJson = await AsyncStorage.getItem('sosRequests_v1');
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
    const getLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('위치 권한이 거부되었습니다.');
          return;
        }
        
        const location = await Location.getCurrentPositionAsync({});
        setCurrentLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } catch (error) {
        console.error('위치 가져오기 실패:', error);
      }
    };
    
    getLocation();
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
  
  // 카테고리별 보조 컬러 매핑
  const getCategoryColor = (category) => {
    const colorMap = {
      '자연': COLORS.secondary2,      // Green
      '힐링': COLORS.secondary7,       // Teal
      '액티비티': COLORS.secondary4,   // Deep Orange
      '맛집': COLORS.secondary3,       // Pink
      '카페': COLORS.secondary6,       // Indigo
    };
    return colorMap[category] || COLORS.primary;
  };
  
  const getCategoryColorSoft = (category) => {
    const colorMap = {
      '자연': COLORS.secondary2Soft,
      '힐링': COLORS.secondary7Soft,
      '액티비티': COLORS.secondary4Soft,
      '맛집': COLORS.secondary3Soft,
      '카페': COLORS.secondary6Soft,
    };
    return colorMap[category] || COLORS.primary + '20';
  };
  
  // 관심 지역/장소로 필터링
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

  const filteredRecommendedData = useMemo(() => 
    recommendedData.filter(item => {
      // 관심 지역 필터
      if (selectedInterest) {
        const location = item.location || item.title || '';
        if (!(location.includes(selectedInterest) || selectedInterest.includes(location))) {
          return false;
        }
      }
      // 카테고리 필터
      return item.category === selectedCategory || item.tags?.includes(selectedCategory);
    }),
    [recommendedData, selectedCategory, selectedInterest]
  );
  
  // Mock 데이터 로드
  // 관심 지역/장소 로드
  const loadInterestPlaces = useCallback(async () => {
    try {
      const places = await getInterestPlaces();
      setInterestPlaces(places);
      console.log(`⭐ 관심 지역/장소 로드: ${places.length}개`);
    } catch (error) {
      console.error('관심 지역 로드 오류:', error);
    }
  }, []);

  const handleAddInterestPlace = useCallback(async () => {
    if (!newInterestPlace.trim()) {
      return;
    }
    try {
      await toggleInterestPlace(newInterestPlace.trim());
      setNewInterestPlace('');
      setShowAddInterestModal(false);
      await loadInterestPlaces();
    } catch (error) {
      console.error('관심 지역 추가 오류:', error);
    }
  }, [newInterestPlace, loadInterestPlaces]);

  const handleDeleteInterestPlace = useCallback(async (placeName) => {
    try {
      await toggleInterestPlace(placeName);
      setDeleteConfirmPlace(null);
      await loadInterestPlaces();
    } catch (error) {
      console.error('관심 지역 삭제 오류:', error);
    }
  }, [loadInterestPlaces]);

  const loadMockData = useCallback(async () => {
    try {
      // 목업 데이터 생성 (웹의 seedMockData와 동일한 로직)
      // AsyncStorage에 데이터가 없으면 생성
      const existingPostsJson = await AsyncStorage.getItem('uploadedPosts');
      if (!existingPostsJson || JSON.parse(existingPostsJson).length === 0) {
        // 웹의 seedMockData 로직을 여기에 직접 구현하거나
        // 간단히 기본 데이터 생성
        console.log('🌱 목업 데이터 자동 생성 (웹 seedMockData와 동일)');
      }
      
      const postsJson = await AsyncStorage.getItem('uploadedPosts');
      let posts = postsJson ? JSON.parse(postsJson) : [];
      
      // 관심 지역/장소도 함께 로드
      await loadInterestPlaces();
      
      console.log(`📸 전체 게시물: ${posts.length}개`);
      
      // 최신순 정렬
      posts.sort((a, b) => {
        const timeA = new Date(a.timestamp || a.createdAt || 0).getTime();
        const timeB = new Date(b.timestamp || b.createdAt || 0).getTime();
        return timeB - timeA;
      });
      
      // 2일 이상 된 게시물 필터링 (메인 화면 표시용)
      posts = filterRecentPosts(posts, 2);
      console.log(`📊 전체 게시물 → 2일 이내 게시물: ${posts.length}개`);
      
      if (posts.length === 0) {
        setRealtimeData([]);
        setCrowdedData([]);
        setRecommendedData([]);
        return;
      }
      
      const realtimeFormatted = posts.slice(0, 30).map((post) => {
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
          aiLabels: post.aiLabels
        };
      });
      
      // 1시간 이내 게시물만 필터링
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      const crowdedFormatted = posts
        .filter(post => {
          const postTime = new Date(post.timestamp || post.createdAt || post.time).getTime();
          return postTime > oneHourAgo;
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
      
      // 추천 여행지: 사용자 위치가 있으면 가까운 순으로 정렬
      let recommendedFormatted = posts.map((post, idx) => {
        const dynamicTime = getTimeAgo(post.timestamp || post.createdAt || post.time);
        
        let assignedCategory = '자연';
        if (post.category === 'food') {
          assignedCategory = idx % 2 === 0 ? '맛집' : '카페';
        } else if (post.category === 'landmark' || post.category === 'scenic') {
          assignedCategory = idx % 2 === 0 ? '자연' : '힐링';
        } else if (post.category === 'bloom') {
          assignedCategory = '힐링';
        } else if (post.category) {
          assignedCategory = '액티비티';
        }
        
        const coords = post.coordinates;
        const distanceKm =
          currentLocation && coords
            ? getDistanceKm(
                currentLocation.latitude,
                currentLocation.longitude,
                coords.lat,
                coords.lng
              )
            : null;
        
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
          content: post.note || `${post.location}의 아름다운 순간!`,
          note: post.note,
          coordinates: post.coordinates,
          likes: post.likes || 0,
          comments: post.comments || [],
          questions: post.questions || [],
          aiLabels: post.aiLabels,
          distanceKm,
        };
      });
      
      // 거리 정보가 있으면 가까운 순, 없으면 인기순(좋아요)으로 정렬
      recommendedFormatted = recommendedFormatted.sort((a, b) => {
        const aHasDistance = typeof a.distanceKm === 'number';
        const bHasDistance = typeof b.distanceKm === 'number';

        if (aHasDistance && bHasDistance) {
          return a.distanceKm - b.distanceKm;
        }
        if (aHasDistance && !bHasDistance) return -1;
        if (!aHasDistance && bHasDistance) return 1;
        return (b.likes || 0) - (a.likes || 0);
      }).slice(0, 200);
      
      setRealtimeData(realtimeFormatted);
      setCrowdedData(crowdedFormatted);
      setRecommendedData(recommendedFormatted);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    }
  }, [loadInterestPlaces, currentLocation]);
  
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadMockData();
    setRefreshing(false);
  }, [loadMockData]);
  
  // 오늘의 타이틀 로드
  const loadTodayTitles = useCallback(async () => {
    try {
      const titles = await getAllTodayTitles();
      setAllTodayTitles(titles);
      
      // 현재 사용자의 타이틀 확인
      const userId = 'test_user_001'; // TODO: 실제 사용자 ID로 변경
      const userTitle = await getUserDailyTitle(userId);
      setDailyTitle(userTitle);
      
      // 새로 획득한 타이틀 확인
      const newlyEarned = await AsyncStorage.getItem('newlyEarnedTitle');
      if (newlyEarned) {
        const titleData = JSON.parse(newlyEarned);
        setEarnedTitle(titleData);
        setShowTitleCelebration(true);
        await AsyncStorage.removeItem('newlyEarnedTitle');
      }
    } catch (error) {
      console.error('타이틀 로드 실패:', error);
    }
  }, []);

  useEffect(() => {
    console.log('📱 메인화면 진입 - 초기 데이터 로드');
    
    // Mock 데이터 즉시 로드
    loadMockData();
    loadTodayTitles();
    
    // 오늘의 타이틀 로드
    const loadUserTitle = async () => {
      try {
        const userJson = await AsyncStorage.getItem('user');
        const user = userJson ? JSON.parse(userJson) : {};
        if (user?.id) {
          const title = await getUserDailyTitle(user.id);
          setDailyTitle(title);
        }
      } catch (error) {
        console.error('사용자 타이틀 로드 실패:', error);
      }
    };
    loadUserTitle();
    
    // 타이틀 업데이트 이벤트 리스너
    const handleTitleUpdate = async () => {
      try {
        const userJson = await AsyncStorage.getItem('user');
        const user = userJson ? JSON.parse(userJson) : {};
        if (user?.id) {
          const previousTitle = dailyTitle;
          const title = await getUserDailyTitle(user.id);
          setDailyTitle(title);
          
          // 새로 타이틀을 획득한 경우 축하 모달 표시
          if (title && (!previousTitle || previousTitle.name !== title.name)) {
            setEarnedTitle(title);
            setShowTitleCelebration(true);
          }
        }
        // 오늘의 모든 타이틀도 업데이트
        const todayTitles = await getAllTodayTitles();
        setAllTodayTitles(todayTitles);
      } catch (error) {
        console.error('타이틀 업데이트 실패:', error);
      }
    };
    
    // 게시물 업데이트 시 타이틀도 새로고침
    const handlePostsUpdateForTitles = async () => {
      setTimeout(async () => {
        const todayTitles = await getAllTodayTitles();
        setAllTodayTitles(todayTitles);
      }, 200);
    };
    
    // newPostsAdded 이벤트 리스너 (사진 업로드 시)
    const handleNewPosts = () => {
      console.log('🔄 새 게시물 추가됨 - 화면 업데이트!');
      setTimeout(() => {
        loadMockData();
      }, 100);
    };
    
    // postsUpdated 이벤트 리스너 (게시물 업데이트 시)
    const handlePostsUpdate = () => {
      console.log('📊 게시물 업데이트 - 화면 새로고침!');
      setTimeout(() => {
        loadMockData();
        handlePostsUpdateForTitles();
      }, 100);
    };
    
    // 이벤트 리스너 등록 (React Native에서는 DeviceEventEmitter 사용)
    // 웹과 동일한 이벤트 시스템을 위해 AsyncStorage 변경 감지 사용
    const checkStorageChanges = setInterval(() => {
      // AsyncStorage 변경 감지를 위한 폴링
      loadMockData();
      loadTodayTitles();
    }, 1000);
    
    // 자동 새로고침: 30초마다
    const autoRefreshInterval = setInterval(() => {
      console.log('⏰ 자동 새로고침 (30초) - 시간 업데이트');
      loadMockData();
      loadTodayTitles();
      const loadAllTitles = async () => {
        const todayTitles = await getAllTodayTitles();
        setAllTodayTitles(todayTitles);
      };
      loadAllTitles();
    }, 30000);
    
    return () => {
      clearInterval(autoRefreshInterval);
      clearInterval(checkStorageChanges);
    };
  }, [loadMockData, loadTodayTitles]);

  // 화면 포커스 시 데이터 새로고침 (업로드 후 메인 화면으로 돌아올 때)
  useFocusEffect(
    useCallback(() => {
      console.log('📱 메인 화면 포커스 - 데이터 새로고침');
      loadMockData();
    }, [loadMockData])
  );
  
  const handleItemPress = useCallback((item, sectionType = 'realtime') => {
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
    
    navigation.navigate('PostDetail', {
      postId: item.id,
      post: item,
      allPosts: allPosts,
      currentPostIndex: currentIndex >= 0 ? currentIndex : 0
    });
  }, [navigation, realtimeData, crowdedData, filteredRecommendedData]);
  
  const PostCard = ({ item, sectionType, navigation }) => {
    const [userTitle, setUserTitle] = useState(null);
    const [titleEffect, setTitleEffect] = useState(null);
    
    useEffect(() => {
      const loadTitle = async () => {
        const title = await getUserDailyTitle(item.userId);
        setUserTitle(title);
        if (title) {
          setTitleEffect(getTitleEffect(title.effect));
        }
      };
      loadTitle();
    }, [item.userId]);
    
    // 랜딩페이지 구조에 맞춰 섹션별로 다른 카드 렌더링
    if (sectionType === 'realtime') {
      // 실시간 여행 피드: scroll-card 구조
    return (
      <TouchableOpacity
          style={styles.scrollCard}
        onPress={() => handleItemPress(item, sectionType)}
        activeOpacity={0.9}
      >
          <View style={styles.scrollImageContainer}>
            {item.image ? (
              <Image
                source={{ uri: item.image }}
                style={styles.scrollImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.scrollImage, styles.scrollImagePlaceholder]}>
                <Ionicons name="image-outline" size={40} color={COLORS.textSubtle} />
              </View>
            )}
            {/* 우측 상단 시간 배지 */}
            {item.time && (
              <View style={styles.scrollBadge}>
                <Text style={styles.scrollBadgeText}>{item.time}</Text>
              </View>
            )}
          </View>
          <View style={styles.scrollInfo}>
            <Text style={styles.scrollLocation} numberOfLines={1}>
              {item.location ? `📍 ${item.location}` : item.title || '위치 정보 없음'}
            </Text>
            <Text style={styles.scrollUser} numberOfLines={1}>
              {item.user || '여행자'}
            </Text>
          </View>
        </TouchableOpacity>
      );
    } else if (sectionType === 'crowded') {
      // 혼잡도 정보: scroll-card-small 구조
      const getCrowdLevel = (item) => {
        // 혼잡도 정보가 있으면 사용, 없으면 기본값
        if (item.crowdLevel) return item.crowdLevel;
        if (item.tags && item.tags.some(tag => tag.includes('혼잡') || tag.includes('붐빔'))) return 'high';
        if (item.tags && item.tags.some(tag => tag.includes('보통'))) return 'medium';
        return 'low';
      };
      const crowdLevel = getCrowdLevel(item);
      const crowdText = crowdLevel === 'high' ? '매우 혼잡' : crowdLevel === 'medium' ? '보통' : '여유';
      
      return (
        <TouchableOpacity
          style={styles.scrollCardSmall}
          onPress={() => handleItemPress(item, sectionType)}
          activeOpacity={0.9}
        >
          <View style={styles.scrollImageSmallContainer}>
            {item.image ? (
              <Image
                source={{ uri: item.image }}
                style={styles.scrollImageSmall}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.scrollImageSmall, styles.scrollImagePlaceholder]}>
                <Ionicons name="image-outline" size={32} color={COLORS.textSubtle} />
              </View>
            )}
            {/* 우측 상단 혼잡도 배지 */}
        <View style={[
              styles.crowdBadge,
              crowdLevel === 'high' && styles.crowdBadgeHigh,
              crowdLevel === 'medium' && styles.crowdBadgeMedium,
              crowdLevel === 'low' && styles.crowdBadgeLow,
            ]}>
              <Text style={styles.crowdBadgeText}>{crowdText}</Text>
            </View>
          </View>
          <View style={styles.scrollInfoSmall}>
            <Text style={styles.scrollLocationSmall} numberOfLines={1}>
              {item.location || item.title || '위치 정보 없음'}
            </Text>
            <Text style={styles.scrollTimeSmall} numberOfLines={1}>
              {item.time ? `${item.time} 업데이트` : '방금 전 업데이트'}
            </Text>
          </View>
        </TouchableOpacity>
      );
    } else {
      // 추천 여행지: feed-card 구조
      return (
        <View style={{ position: 'relative', marginHorizontal: SPACING.md, marginBottom: SPACING.md }}>
          <View style={styles.feedCard}>
            {/* 카드 헤더 */}
            <View style={styles.cardHeader}>
              <View style={styles.userInfo}>
                <View style={styles.userAvatar}>
                  <Text style={styles.userAvatarEmoji}>
                    {userTitle?.icon || (item.userId ? String(item.userId).charAt(0) : '👤')}
                  </Text>
                </View>
                <View style={styles.userDetails}>
                  <Text style={styles.userName}>{item.user || '여행자'}</Text>
                  <Text style={styles.postTime}>{item.time || '방금 전'}</Text>
                </View>
              </View>
            </View>
            
            {/* 카드 본문 - 클릭 시 PostDetail로 이동 */}
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => handleItemPress(item, sectionType)}
              style={{ flex: 1 }}
            >
          
          {/* 카드 이미지 */}
          <View style={styles.cardImageContainer}>
          {item.image ? (
            <Image
              source={{ uri: item.image }}
                style={styles.cardImage}
              resizeMode="cover"
            />
          ) : (
              <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
              <Ionicons name="image-outline" size={40} color={COLORS.textSubtle} />
            </View>
          )}
            {/* 우측 상단 LIVE 인디케이터 */}
            <View style={styles.liveIndicator}>
              <View style={styles.livePulse} />
              <Text style={styles.liveIndicatorText}>{item.time || 'LIVE'}</Text>
            </View>
          </View>
          
          {/* 카드 정보 */}
          <View style={styles.cardInfo}>
            {/* 태그 */}
            <View style={styles.infoTags}>
              {item.category && (
                <View style={styles.tag}>
                  <Text style={styles.tagText}>
                    {item.category === '자연' ? '🏞️' : item.category === '맛집' ? '🍜' : item.category === '카페' ? '☕' : '📍'} {item.category}
                  </Text>
                </View>
          )}
              {item.weather && (
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{item.weather}</Text>
                </View>
              )}
              {item.crowdLevel && (
                <View style={styles.tag}>
                  <Text style={styles.tagText}>
                    {item.crowdLevel === 'high' ? '👥 매우 혼잡' : item.crowdLevel === 'medium' ? '👥 보통' : '👥 여유'}
                </Text>
                </View>
              )}
            </View>
            
            {/* 게시물 텍스트 */}
            {item.note && (
              <Text style={styles.postText} numberOfLines={2}>
                "{item.note}"
                </Text>
              )}
            
            {/* 액션 버튼 */}
            <View style={styles.cardActions}>
              <Text style={styles.actionBtn}>❤️ {item.likes || 0}</Text>
              <Text style={styles.actionBtn}>💬 {item.comments?.length || 0}</Text>
              <View style={styles.bookmarkButton}>
                <Ionicons name="bookmark-outline" size={14} color="#4B5563" />
              </View>
          </View>
        </View>
      </TouchableOpacity>
      
      {/* locationBadge - 카드 밖에 완전히 분리 */}
      {item.location && navigation && (
        <TouchableOpacity
          style={[styles.locationBadge, {
            position: 'absolute',
            top: 11,
            right: 11,
            zIndex: 1000,
            elevation: 10,
          }]}
          onPress={() => {
            console.log('📍 지역 클릭:', item.location);
            if (navigation && navigation.navigate) {
              navigation.navigate('RegionDetail', {
                regionName: item.location,
                region: { name: item.location }
              });
            } else {
              console.error('navigation이 없습니다:', navigation);
            }
          }}
          activeOpacity={0.7}
          hitSlop={{ top: 25, bottom: 25, left: 25, right: 25 }}
        >
          <Text style={styles.locationBadgeText}>📍 {item.location}</Text>
        </TouchableOpacity>
      )}
    </View>
    );
    }
  };

  // 지역 클릭 핸들러 - RegionDetail로 이동
  const handleLocationClick = useCallback((locationName) => {
    console.log('📍 지역 클릭:', locationName);
    navigation.navigate('RegionDetail', {
      regionName: locationName,
      region: { name: locationName }
    });
  }, [navigation]);

  const renderPostCard = useCallback(({ item, sectionType }) => {
    return <PostCard item={item} sectionType={sectionType} navigation={navigation} />;
  }, [handleItemPress, navigation]);
  
  const renderSection = useCallback((title, data, sectionType, showMore = true, showLiveBadge = false) => {
    if (data.length === 0) {
      const emptyMessages = {
        '🔥 실시간 여행 피드': {
          icon: 'travel-explore',
          title: '아직 지금 이곳의 모습이 올라오지 않았어요',
          subtitle: '지금 보고 있는 장소와 분위기, 날씨가 보이도록 한 장만 남겨 주세요',
        },
        '👥 지금 가장 붐비는 곳': {
          icon: 'people',
          title: '아직 밀집 지역 정보가 없어요',
          subtitle: '첫 번째로 현장 정보를 공유해보세요!',
        },
        '✨ 추천 여행지': {
          icon: 'recommend',
          title: '추천 여행지가 아직 없어요',
          subtitle: '첫 번째로 추천 여행지를 공유해보세요!',
        },
        // 이전 타이틀도 지원 (하위 호환성)
        '지금 여기는!': {
          icon: 'travel-explore',
          title: '아직 지금 이곳의 모습이 올라오지 않았어요',
          subtitle: '지금 보고 있는 장소와 분위기, 날씨가 보이도록 한 장만 남겨 주세요',
        },
        '지금 사람 많은 곳!': {
          icon: 'people',
          title: '아직 밀집 지역 정보가 없어요',
          subtitle: '첫 번째로 현장 정보를 공유해보세요!',
        },
        '추천 장소': {
          icon: 'recommend',
          title: '추천 장소가 아직 없어요',
          subtitle: '첫 번째로 추천 장소를 공유해보세요!',
        },
        // 이전 타이틀도 지원 (하위 호환성)
        '실시간 정보': {
          icon: 'travel-explore',
          title: '아직 지금 이곳의 모습이 올라오지 않았어요',
          subtitle: '지금 보고 있는 장소와 분위기, 날씨가 보이도록 한 장만 남겨 주세요',
        },
        '실시간 밀집 지역': {
          icon: 'people',
          title: '아직 밀집 지역 정보가 없어요',
          subtitle: '첫 번째로 현장 정보를 공유해보세요!',
        },
      };
      
      const message = emptyMessages[title] || {
        icon: 'images-outline',
        title: '아직 공유된 여행 정보가 없어요',
        subtitle: '첫 번째로 여행 정보를 공유해보세요!',
      };
      
      return (
        <View style={styles.emptySection}>
          <Ionicons name={message.icon} size={64} color={COLORS.textSubtle} />
          <Text style={styles.emptyText}>{message.title}</Text>
          <Text style={styles.emptySubtext}>{message.subtitle}</Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => navigation.navigate('Upload')}
          >
            <Ionicons name="add-circle" size={20} color="white" />
            <Text style={styles.emptyButtonText}>첫 사진 올리기</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    return (
      <>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderLeft}>
          <Text style={styles.sectionTitle}>{title}</Text>
            {showLiveBadge && (
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveBadgeText}>LIVE</Text>
              </View>
            )}
          </View>
          {showMore && (
            <TouchableOpacity style={styles.moreButton}>
              <Text style={styles.moreButtonText}>더보기</Text>
            </TouchableOpacity>
          )}
        </View>
        <FlatList
          data={data}
          renderItem={({ item }) => renderPostCard({ item, sectionType })}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
          snapToInterval={CARD_WIDTH + 12}
          decelerationRate="fast"
          snapToAlignment="start"
        />
      </>
    );
  }, [renderPostCard, navigation]);

  // 스크롤 이벤트 핸들러
  const handleScroll = useCallback((event) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    const scrollingDown = currentScrollY > scrollY.current;
    const scrollingUp = currentScrollY < scrollY.current;
    
    // 스크롤 시작 (10px 이상)하면 관심지역 섹션만 숨기기 (부드러운 애니메이션)
    if (currentScrollY > 10 && scrollingDown) {
      Animated.timing(interestOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setIsInterestSectionVisible(false));
    } else if (scrollingUp || currentScrollY <= 10) {
      setIsInterestSectionVisible(true);
      Animated.timing(interestOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
    
    scrollY.current = currentScrollY;
  }, [interestOpacity]);
  
  return (
    <ScreenLayout>
      {/* 상단 헤더 - 웹과 동일한 구조 (ScreenContent 밖) */}
      <ScreenHeader>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Live Journey</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Ionicons name="notifications-outline" size={24} color={COLORS.text} />
              {unreadNotificationCount > 0 && (
                <View style={styles.notificationBadge}>
                  <View style={styles.notificationDot} />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScreenHeader>

      <ScreenContent 
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onScroll={handleScroll}
      >
        {/* SOS 알림 배너 - 로고와 검색창 사이 */}
        {nearbySosRequests.length > 0 && !dismissedSosIds.includes(nearbySosRequests[0]?.id) && (
          <View style={styles.sosNotificationBannerInline}>
            <TouchableOpacity
              style={styles.sosNotificationBannerSmall}
              activeOpacity={0.9}
              onPress={() => navigation.navigate('Map')}
            >
              <Ionicons name="alert-circle" size={14} color="#ffffff" />
              <Text style={styles.sosNotificationTextSmall} numberOfLines={1}>
                현재 당신 근처에 도움이 필요한 사람이 있습니다
              </Text>
              <Ionicons name="chevron-forward" size={14} color="#ffffff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sosNotificationCloseButtonSmall}
              activeOpacity={0.7}
              onPress={async () => {
                if (nearbySosRequests[0]?.id) {
                  const newDismissedIds = [...dismissedSosIds, nearbySosRequests[0].id];
                  setDismissedSosIds(newDismissedIds);
                  // AsyncStorage에 저장해서 영구적으로 유지 (웹과 동일)
                  try {
                    await AsyncStorage.setItem('dismissedSosIds_v1', JSON.stringify(newDismissedIds));
                  } catch (error) {
                    console.error('지워진 SOS 알림 ID 저장 실패:', error);
                  }
                }
              }}
            >
              <Ionicons name="close" size={14} color="#ffffff" />
            </TouchableOpacity>
          </View>
        )}
        
        {/* 검색창 */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={24} color={COLORS.primary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="어디로 떠나볼까요? 🌏"
            placeholderTextColor={COLORS.textSubtle}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => navigation.navigate('Search')}
          />
        </View>

        {/* 내 관심 지역/장소 - 스크롤시 숨김 */}
        {isInterestSectionVisible && (
        <Animated.View style={{ opacity: interestOpacity }}>
          <View style={styles.interestPlacesContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.interestPlacesList}
            >
              {/* 추가 버튼 */}
              <TouchableOpacity
                style={styles.interestPlaceItem}
                onPress={() => setShowAddInterestModal(true)}
              >
                <View style={[
                  styles.interestPlaceCircleAdd,
                  interestPlaces.length === 0 && styles.interestPlaceCircleAddEmpty
                ]}>
                  <Ionicons 
                    name="add-circle" 
                    size={22} 
                    color={interestPlaces.length === 0 ? "#FFFFFF" : COLORS.textSecondary} 
                  />
                </View>
                <Text style={[
                  styles.interestPlaceName,
                  interestPlaces.length === 0 && styles.interestPlaceNameAdd
                ]}>
                  {interestPlaces.length === 0 ? '관심지역을\n추가해보세요' : '추가'}
                </Text>
              </TouchableOpacity>

              {/* 관심 지역/장소들 */}
              {interestPlaces.map((place, index) => {
                const isSelected = selectedInterest === place.name;
              const regionIcon = getRegionIcon(place.name);
                return (
                <View key={index} style={styles.interestPlaceItem}>
                  <TouchableOpacity
                    style={styles.interestPlaceItemContent}
                    onPress={() => {
                      // 지역 클릭 시 RegionDetail 화면으로 이동
                      navigation.navigate('RegionDetail', {
                        regionName: place.name,
                        region: { name: place.name }
                      });
                    }}
                    onLongPress={() => setDeleteConfirmPlace(place.name)}
                  >
                    <View style={[
                      styles.interestPlaceCircle,
                      styles.interestPlaceCircleActive,
                      isSelected && styles.interestPlaceCircleSelected
                    ]}>
                      <Text style={styles.interestPlaceIcon}>
                        {regionIcon}
                      </Text>
                    </View>
                    <Text style={[
                      styles.interestPlaceName,
                      isSelected && styles.interestPlaceNameSelected
                    ]}>
                      {place.name}
                    </Text>
                  </TouchableOpacity>
            <TouchableOpacity
                    style={styles.interestPlaceDeleteButton}
                    onPress={() => setDeleteConfirmPlace(place.name)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                    <Ionicons name="close-circle" size={20} color={COLORS.error} />
            </TouchableOpacity>
          </View>
              );
            })}
            </ScrollView>
            </View>
        </Animated.View>
        )}

        {/* 메인 컨텐츠 - 랜딩페이지와 동일한 구조 */}
        <ScreenBody>
        {/* 관심 지역 선택 안내 */}
        {selectedInterest && (
          <View style={styles.selectedInterestBanner}>
            <Text style={styles.selectedInterestText}>
              ⭐ "{selectedInterest}" 지역 정보만 표시 중
            </Text>
            <TouchableOpacity onPress={() => setSelectedInterest(null)}>
              <Text style={styles.selectedInterestButton}>전체 보기</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 🔥 실시간 여행 피드 섹션 - 랜딩페이지와 완전히 동일 */}
        <View style={{ marginBottom: 20 }}>
          {renderSection('🔥 실시간 여행 피드', filteredRealtimeData, 'realtime', true, true)}
        </View>
        
        {/* 👥 지금 가장 붐비는 곳 섹션 - 랜딩페이지와 완전히 동일 */}
        <View style={{ marginBottom: 20 }}>
          {renderSection('👥 지금 가장 붐비는 곳', filteredCrowdedData, 'crowded')}
        </View>
        
        {/* ✨ 추천 여행지 섹션 - 랜딩페이지와 완전히 동일 */}
        <View style={{ marginBottom: 20 }}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>✨ 추천 여행지</Text>
          </View>
          
          {selectedTheme && (
            <Text style={styles.themeDescription}>
              {selectedTheme.description}
            </Text>
          )}

          {/* 테마 필터 */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.themeFilter}
          >
            {travelThemes.map((theme) => {
              const isActive = theme.id === selectedThemeId;
              return (
                <TouchableOpacity
                  key={theme.id}
                  onPress={() => setSelectedThemeId(theme.id)}
                  style={[
                    styles.themeButton,
                    isActive && styles.themeButtonActive
                  ]}
                >
                  <Text
                    style={[
                      styles.themeButtonText,
                      isActive && styles.themeButtonTextActive
                    ]}
                  >
                    {theme.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* 선택된 테마의 여행지 카드 리스트 */}
          {selectedTheme && selectedTheme.regions && selectedTheme.regions.length > 0 && (
            <View style={styles.regionCardList}>
              {selectedTheme.regions.map((regionName) => (
                <TouchableOpacity
                  key={regionName}
                  style={styles.regionCard}
                  onPress={() => {
                    console.log('📍 지역 카드 클릭:', regionName);
                    try {
                      navigation.navigate('RegionDetail', {
                        regionName: regionName,
                        region: { name: regionName }
                      });
                    } catch (error) {
                      console.error('Navigation error:', error);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  {/* 지역 대표 사진 */}
                  <Image
                    source={{ 
                      uri: `https://source.unsplash.com/featured/?${encodeURIComponent(regionName + ' travel landscape')}`
                    }}
                    style={styles.regionCardImage}
                    resizeMode="cover"
                  />
                  <View style={styles.regionCardContent}>
                    <Text style={styles.regionCardName}>{regionName}</Text>
                    <Text style={styles.regionCardDescription}>
                      {regionCopyMap[regionName] || selectedTheme.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
          
          {/* 카테고리 필터 */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryFilter}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryButton,
                  selectedCategory === category && [
                    styles.categoryButtonActive,
                    { backgroundColor: getCategoryColorSoft(category) }
                  ]
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text
                  style={[
                    styles.categoryButtonText,
                    selectedCategory === category && [
                      styles.categoryButtonTextActive,
                      { color: getCategoryColor(category) }
                    ]
                  ]}
                >
                  #{category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          {filteredRecommendedData.length === 0 ? (
            <View style={styles.emptySection}>
              <Ionicons name="images-outline" size={48} color={COLORS.textSubtle} />
              <Text style={styles.emptyText}>아직 공유된 여행 정보가 없어요</Text>
            </View>
          ) : (
            <View>
              {filteredRecommendedData.map((item) => (
                <PostCard key={item.id} item={item} sectionType="recommended" navigation={navigation} />
              ))}
            </View>
          )}
        </View>

        {/* 📰 여행 매거진 섹션 – 추천 여행지 하단 (웹과 동일) */}
        <View style={{ marginBottom: 20 }}>
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
              <Text style={styles.sectionTitle}>📰 여행 매거진</Text>
              <Text style={{ fontSize: 12, color: COLORS.textSubtle, margin: 0 }}>
                이번 주말 꼭 가봐야 하는 장소
              </Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: SPACING.md, paddingBottom: SPACING.md, gap: 12 }}
          >
            {travelMagazineArticles.map((article) => (
              <TouchableOpacity
                key={article.id}
                style={{
                  minWidth: 220,
                  maxWidth: 240,
                  borderRadius: 16,
                  backgroundColor: '#FFFFFF',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.06,
                  shadowRadius: 10,
                  elevation: 3,
                  overflow: 'hidden',
                  flexShrink: 0
                }}
                onPress={() => navigation.navigate('MagazineDetail', { magazine: article })}
                activeOpacity={0.8}
              >
                <View style={{
                  position: 'relative',
                  width: '100%',
                  height: 140,
                  backgroundColor: '#E0E7FF',
                  overflow: 'hidden'
                }}>
                  <Image
                    source={{
                      uri: `https://source.unsplash.com/featured/?${encodeURIComponent(article.regionName + ' travel landscape')}`
                    }}
                    style={{
                      position: 'absolute',
                      width: '100%',
                      height: '100%',
                      resizeMode: 'cover'
                    }}
                  />
                  <View style={{
                    position: 'absolute',
                    left: 8,
                    bottom: 8,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 999,
                    backgroundColor: 'rgba(0,0,0,0.6)'
                  }}>
                    <Text style={{
                      color: '#FFFFFF',
                      fontSize: 10,
                      fontWeight: '600'
                    }}>
                      {article.tagLine}
                    </Text>
                  </View>
                </View>
                <View style={{ padding: 10, paddingTop: 10, paddingBottom: 12 }}>
                  <Text style={{
                    fontSize: 11,
                    fontWeight: '600',
                    color: COLORS.primary,
                    marginBottom: 2
                  }}>
                    {article.regionName}
                  </Text>
                  <Text style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: COLORS.text,
                    lineHeight: 18.2
                  }}>
                    {article.title}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        </ScreenBody>

        {/* 오늘의 타이틀 모달 */}
        {showTitleModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <Text style={styles.modalHeaderIcon}>👑</Text>
                <Text style={styles.modalHeaderTitle}>오늘의 타이틀</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => {
                  setShowTitleModal(false);
                  setSelectedTitle(null);
                }}
              >
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              {selectedTitle ? (
                <View style={styles.modalTitleDetail}>
                  <View style={styles.modalTitleDetailCard}>
                    <Text style={styles.modalTitleDetailIcon}>{selectedTitle.icon || '👑'}</Text>
                    <View style={styles.modalTitleDetailContent}>
                      <Text style={styles.modalTitleDetailName}>{selectedTitle.name}</Text>
                      <Text style={styles.modalTitleDetailCategory}>{selectedTitle.category}</Text>
                    </View>
                  </View>
                  <View style={styles.modalTitleDescription}>
                    <Text style={styles.modalTitleDescriptionTitle}>획득 조건</Text>
                    <Text style={styles.modalTitleDescriptionText}>{selectedTitle.description}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.modalBackButton}
                    onPress={() => setSelectedTitle(null)}
                  >
                    <Text style={styles.modalBackButtonText}>목록으로 돌아가기</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View>
                  {/* 획득한 타이틀 */}
                  {allTodayTitles.length > 0 && (
                    <View style={styles.modalEarnedSection}>
                      <Text style={styles.modalSectionTitle}>
                        획득한 타이틀 ({allTodayTitles.length}개)
                      </Text>
                      {allTodayTitles.map((item, index) => (
                        <TouchableOpacity
                          key={`${item.userId}-${index}`}
                          style={styles.modalTitleItem}
                          onPress={() => setSelectedTitle(item.title)}
                        >
                          <Text style={styles.modalTitleItemIcon}>{item.title.icon || '👑'}</Text>
                          <View style={styles.modalTitleItemContent}>
                            <Text style={styles.modalTitleItemName}>{item.title.name}</Text>
                            <Text style={styles.modalTitleItemCategory}>{item.title.category}</Text>
                          </View>
                          <Ionicons name="chevron-forward" size={20} color={COLORS.textSubtle} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {/* 모든 타이틀 목록 */}
                  <View style={styles.modalAllSection}>
                    <Text style={styles.modalSectionTitle}>
                      모든 타이틀 목록 ({Object.keys(DAILY_TITLES).length}개)
                    </Text>
                    {Object.values(DAILY_TITLES).map((title, index) => {
                      const isEarned = allTodayTitles.some(item => item.title.name === title.name);
                      return (
                        <TouchableOpacity
                          key={index}
                          style={[
                            styles.modalTitleItem,
                            isEarned && styles.modalTitleItemEarned
                          ]}
                          onPress={() => setSelectedTitle(title)}
                        >
                          <Text style={styles.modalTitleItemIcon}>{title.icon || '👑'}</Text>
                          <View style={styles.modalTitleItemContent}>
                            <Text style={[
                              styles.modalTitleItemName,
                              isEarned && styles.modalTitleItemNameEarned
                            ]}>
                              {title.name}
                              {isEarned && <Text style={styles.modalTitleItemCheck}> ✓ 획득</Text>}
                            </Text>
                            <Text style={[
                              styles.modalTitleItemCategory,
                              isEarned && styles.modalTitleItemCategoryEarned
                            ]}>
                              {title.category}
                            </Text>
                          </View>
                          <Ionicons name="chevron-forward" size={20} color={COLORS.textSubtle} />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
        )}

        {/* 타이틀 획득 축하 모달 - 뱃지와 다른 심플한 스타일 */}
        {showTitleCelebration && earnedTitle && (
        <View style={styles.celebrationOverlay}>
          <View style={styles.celebrationContent}>
            <View style={styles.celebrationIconContainer}>
              <View style={styles.celebrationIconCircle}>
                <Text style={styles.celebrationIcon}>{earnedTitle.icon || '👑'}</Text>
              </View>
              <View style={styles.celebrationBadge}>
                <Text style={styles.celebrationBadgeText}>VIP</Text>
              </View>
            </View>
            <Text style={styles.celebrationTitle}>축하합니다!</Text>
            <Text style={styles.celebrationName}>{earnedTitle.name}</Text>
            <View style={styles.celebrationCategoryContainer}>
              <View style={styles.celebrationCategoryBadge}>
                <Text style={styles.celebrationCategoryText}>
                  {earnedTitle.category || '24시간 타이틀'}
                </Text>
              </View>
            </View>
            <Text style={styles.celebrationDescription}>{earnedTitle.description}</Text>
            <TouchableOpacity
              style={styles.celebrationButton}
              onPress={() => {
                setShowTitleCelebration(false);
                setEarnedTitle(null);
              }}
            >
              <Text style={styles.celebrationButtonText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
        )}
      </ScreenContent>

      {/* 관심 지역/장소 추가 모달 */}
      <Modal
        visible={showAddInterestModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddInterestModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>관심 지역/장소 추가</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowAddInterestModal(false);
                  setNewInterestPlace('');
                }}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalContent}>
              <Text style={styles.modalLabel}>지역 또는 장소 이름</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="예: 제주, 부산 해운대, 경주 불국사"
                placeholderTextColor={COLORS.textSubtle}
                value={newInterestPlace}
                onChangeText={setNewInterestPlace}
                autoFocus={true}
                onSubmitEditing={handleAddInterestPlace}
              />
              
              {newInterestPlace.trim() && (
                <View style={styles.modalPreview}>
                  <Text style={styles.modalPreviewLabel}>미리보기</Text>
                  <View style={styles.modalPreviewItem}>
                    <View style={styles.modalPreviewCircle}>
                      <Text style={styles.modalPreviewIcon}>
                        {getRegionIcon(newInterestPlace.trim())}
                      </Text>
                    </View>
                    <Text style={styles.modalPreviewName}>{newInterestPlace.trim()}</Text>
                  </View>
                </View>
              )}
            </View>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowAddInterestModal(false);
                  setNewInterestPlace('');
                }}
              >
                <Text style={styles.modalButtonCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm, !newInterestPlace.trim() && styles.modalButtonDisabled]}
                onPress={handleAddInterestPlace}
                disabled={!newInterestPlace.trim()}
              >
                <Text style={styles.modalButtonConfirmText}>추가</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 관심 지역/장소 삭제 확인 모달 */}
      <Modal
        visible={deleteConfirmPlace !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDeleteConfirmPlace(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModalContainer}>
            <Text style={styles.deleteModalTitle}>관심 지역/장소 삭제</Text>
            <Text style={styles.deleteModalMessage}>
              "{deleteConfirmPlace}"을(를) 삭제하시겠어요?
            </Text>
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setDeleteConfirmPlace(null)}
              >
                <Text style={styles.modalButtonCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonDelete]}
                onPress={() => handleDeleteInterestPlace(deleteConfirmPlace)}
              >
                <Text style={styles.modalButtonDeleteText}>삭제</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  sosNotificationBannerFixed: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingTop: SPACING.md,
    backgroundColor: COLORS.background,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  sosNotificationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: '#ff6b35',
    marginHorizontal: SPACING.md,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sosNotificationIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  sosNotificationTextWrapper: {
    flex: 1,
    marginRight: SPACING.xs,
  },
  sosNotificationTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  sosNotificationSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  sosNotificationCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
    marginTop: SPACING.sm,
  },
  sosNotificationBannerInline: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    gap: SPACING.xs,
  },
  sosNotificationBannerSmall: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    backgroundColor: '#ff6b35',
    borderRadius: 8,
    gap: SPACING.xs,
  },
  sosNotificationTextSmall: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
  },
  sosNotificationCloseButtonSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12, // 웹: padding: '12px 16px'
    paddingHorizontal: SPACING.md, // 웹: padding: '12px 16px'
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20, // 웹: fontSize: '20px'
    fontWeight: '800', // 웹: fontWeight: 800
    color: COLORS.text, // 웹: color: '#111827'
    letterSpacing: -0.8, // 웹: letterSpacing: '-0.8px'
  },
  notificationButton: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 6, // top-1.5 = 6px
    right: 6, // right-1.5 = 6px
    width: 10, // h-2.5 w-2.5 = 10px
    height: 10,
  },
  notificationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary, // bg-primary
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundLight, // 웹: background: 'white'
    borderRadius: 12, // 웹: borderRadius: '12px'
    paddingHorizontal: 20, // 웹: padding: '14px 20px'
    paddingVertical: 14, // 웹: padding: '14px 20px'
    marginHorizontal: SPACING.md, // 웹: margin: '12px 16px'
    marginTop: 12, // 웹: margin: '12px 16px'
    marginBottom: 12, // 웹: margin: '12px 16px'
    minHeight: 56, // 웹: minHeight: '56px'
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, // 웹: boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
    shadowRadius: 8,
    elevation: 3,
    gap: 12, // 웹: gap: '12px'
  },
  searchIcon: {
    fontSize: 24, // 웹: fontSize: '24px'
    fontWeight: '400', // 웹: fontWeight: 400
    color: COLORS.primary, // 웹: color: '#00BCD4'
  },
  searchInput: {
    flex: 1,
    fontSize: 16, // 웹: fontSize: '16px'
    fontWeight: '400', // 웹: fontWeight: 400
    color: COLORS.text, // 웹: color: '#374151'
    padding: 0,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: 32, // pt-8 = 32px
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16, // 랜딩페이지: padding: 0 16px 12px 16px
    paddingBottom: 12, // 랜딩페이지: padding: 0 16px 12px 16px
  },
  sectionTitle: {
    ...TYPOGRAPHY.h2,
    fontSize: 15, // 랜딩페이지: font-size: 15px
    fontWeight: '700', // 랜딩페이지: font-weight: 700
    color: COLORS.text, // 랜딩페이지: color: var(--gray-900)
    margin: 0, // 랜딩페이지: margin: 0
  },
  moreButton: {
    minWidth: 84, // min-w-[84px]
    maxWidth: 480, // max-w-[480px]
    height: 40, // h-10 = 40px
    paddingHorizontal: SPACING.md, // px-4
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8, // rounded-lg
    backgroundColor: 'transparent', // bg-transparent
  },
  moreButtonText: {
    ...TYPOGRAPHY.bodySmall,
    fontSize: 12, // 랜딩페이지: font-size: 12px
    fontWeight: '600', // 랜딩페이지: font-weight: 600
    color: COLORS.primary, // 랜딩페이지: color: var(--primary)
    letterSpacing: 0.21, // tracking-[0.015em] = 0.21px
    lineHeight: 20, // leading-normal
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4, // 랜딩페이지: gap: 4px
    backgroundColor: '#FFF8E1', // 랜딩페이지: background: var(--accent-light)
    paddingHorizontal: 10, // 랜딩페이지: padding: 4px 10px
    paddingVertical: 4, // 랜딩페이지: padding: 4px 10px
    borderRadius: 12, // 랜딩페이지: border-radius: 12px
  },
  liveDot: {
    width: 5, // 랜딩페이지: width: 5px (live-pulse)
    height: 5, // 랜딩페이지: height: 5px
    borderRadius: 2.5, // 랜딩페이지: border-radius: 50%
    backgroundColor: '#ef4444', // 랜딩페이지: background: #ef4444
  },
  liveBadgeText: {
    fontSize: 10, // 랜딩페이지: font-size: 10px
    fontWeight: '700', // 랜딩페이지: font-weight: 700
    color: '#FFA000', // 랜딩페이지: color: var(--accent-dark)
  },
  themeDescription: {
    fontSize: 12,
    color: COLORS.textSubtle,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  themeFilter: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    gap: SPACING.sm,
  },
  themeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: COLORS.borderLight,
    flexShrink: 0,
  },
  themeButtonActive: {
    backgroundColor: '#00BCD4',
  },
  themeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  themeButtonTextActive: {
    color: '#FFFFFF',
  },
  regionCardList: {
    flexDirection: 'column',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    gap: 8,
  },
  regionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  regionCardImage: {
    width: 72,
    height: 54,
    borderRadius: 10,
    marginRight: 10,
    backgroundColor: COLORS.borderLight,
  },
  regionCardContent: {
    flex: 1,
    flexDirection: 'column',
    gap: 2,
    minWidth: 0,
  },
  regionCardName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  regionCardDescription: {
    fontSize: 11,
    color: COLORS.textSubtle,
  },
  categoryFilter: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    gap: SPACING.sm,
  },
  categoryButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 999, // rounded-full
    backgroundColor: COLORS.borderLight,
    flexShrink: 0,
  },
  categoryButtonActive: {
    // backgroundColor는 동적으로 설정됨
    transform: [{ scale: 1.05 }], // scale-105
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSubtle,
  },
  categoryButtonTextActive: {
    // color는 동적으로 설정됨
  },
  horizontalList: {
    paddingHorizontal: 16, // 랜딩페이지: padding: 0 16px
    paddingBottom: 4, // 랜딩페이지: padding-bottom: 4px
    gap: 12, // 랜딩페이지: gap: 12px
  },
  // 랜딩페이지 구조: scroll-card (실시간 여행 피드)
  scrollCard: {
    width: 180, // 랜딩페이지: width: 180px
    borderRadius: 12, // 랜딩페이지: border-radius: 12px
    backgroundColor: COLORS.backgroundLight, // 랜딩페이지: background: white
    marginRight: 12, // gap: 12px
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, // 랜딩페이지: box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08)
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  scrollImageContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
    overflow: 'hidden',
  },
  scrollImage: {
    width: '100%',
    height: '100%',
  },
  scrollImagePlaceholder: {
    backgroundColor: COLORS.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollBadge: {
    position: 'absolute',
    top: 8, // top-2 = 8px
    right: 8, // right-2 = 8px
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(10px)', // backdrop-blur-[10px] (React Native에서는 효과 제한적)
    paddingHorizontal: 8, // px-2 = 8px
    paddingVertical: 4, // py-1 = 4px
    borderRadius: 10, // rounded-[10px]
  },
  scrollBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textWhite,
  },
  scrollInfo: {
    padding: 10, // p-2.5 = 10px (랜딩페이지: padding: 10px)
    gap: 4, // gap-1 = 4px
  },
  scrollLocation: {
    fontSize: 12, // 랜딩페이지: font-size: 12px
    fontWeight: '600', // 랜딩페이지: font-weight: 600
    color: COLORS.text, // 랜딩페이지: color: var(--gray-900)
    // whiteSpace: 'nowrap', // 랜딩페이지: white-space: nowrap (React Native에서는 numberOfLines로 처리)
    // overflow: 'hidden', // 랜딩페이지: overflow: hidden
    // textOverflow: 'ellipsis', // 랜딩페이지: text-overflow: ellipsis
  },
  scrollUser: {
    fontSize: 11, // 랜딩페이지: font-size: 11px
    color: COLORS.textSecondary, // 랜딩페이지: color: var(--gray-500)
  },
  // 랜딩페이지 구조: scroll-card-small (혼잡도 정보)
  scrollCardSmall: {
    width: 140, // 랜딩페이지: width: 140px
    borderRadius: 10, // 랜딩페이지: border-radius: 10px
    backgroundColor: COLORS.backgroundLight, // 랜딩페이지: background: white
    marginRight: 12, // gap: 12px
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, // 랜딩페이지: box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08)
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  scrollImageSmallContainer: {
    width: '100%',
    height: 140,
    position: 'relative',
    overflow: 'hidden',
  },
  scrollImageSmall: {
    width: '100%',
    height: '100%',
  },
  crowdBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  crowdBadgeHigh: {
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
  },
  crowdBadgeMedium: {
    backgroundColor: 'rgba(245, 158, 11, 0.9)',
  },
  crowdBadgeLow: {
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
  },
  crowdBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textWhite,
  },
  scrollInfoSmall: {
    padding: 8, // p-2 = 8px (랜딩페이지: padding: 8px)
    gap: 3, // gap-0.5 = 2px (랜딩페이지: gap: 3px)
  },
  scrollLocationSmall: {
    fontSize: 11, // 랜딩페이지: font-size: 11px
    fontWeight: '600', // 랜딩페이지: font-weight: 600
    color: COLORS.text, // 랜딩페이지: color: var(--gray-900)
    // whiteSpace: 'nowrap', // 랜딩페이지: white-space: nowrap
    // overflow: 'hidden', // 랜딩페이지: overflow: hidden
    // textOverflow: 'ellipsis', // 랜딩페이지: text-overflow: ellipsis
  },
  scrollTimeSmall: {
    fontSize: 10, // 랜딩페이지: font-size: 10px
    color: COLORS.textSecondary, // 랜딩페이지: color: var(--gray-500)
  },
  // 랜딩페이지 구조: feed-card (추천 여행지)
  feedCard: {
    backgroundColor: COLORS.backgroundLight, // 랜딩페이지: background: white
    borderRadius: 14, // 랜딩페이지: border-radius: 14px
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, // 랜딩페이지: box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06)
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    overflow: 'hidden', // 카드 내부만 overflow hidden
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 11, // p-[11px] (랜딩페이지: padding: 11px)
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9, // gap-[9px] (랜딩페이지: gap: 9px)
  },
  userAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarEmoji: {
    fontSize: 17,
  },
  userDetails: {
    gap: 1,
  },
  userName: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  locationBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 1000,
    elevation: 10,
  },
  locationBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.primary,
  },
  cardImageContainer: {
    width: '100%',
    height: 220, // 랜딩페이지: height: 220px
    position: 'relative',
    overflow: 'hidden',
    // 랜딩페이지: background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)
  },
  cardImage: {
    width: '100%',
    height: '100%',
    // 랜딩페이지: object-fit: cover, display: block
  },
  cardImagePlaceholder: {
    backgroundColor: COLORS.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  liveIndicator: {
    position: 'absolute',
    top: 10, // top-2.5 = 10px (랜딩페이지: top: 10px)
    right: 10, // right-2.5 = 10px (랜딩페이지: right: 10px)
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5, // gap-[5px] (랜딩페이지: gap: 5px)
    paddingHorizontal: 11, // px-[11px] (랜딩페이지: padding: 5px 11px)
    paddingVertical: 5, // py-[5px]
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    backdropFilter: 'blur(10px)', // backdrop-blur-[10px] (React Native에서는 효과 제한적)
    borderRadius: 16, // rounded-2xl
  },
  livePulse: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: COLORS.error,
  },
  liveIndicatorText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textWhite,
  },
  cardInfo: {
    padding: 11, // p-[11px] (랜딩페이지: padding: 11px)
  },
  infoTags: {
    flexDirection: 'row',
    gap: 5, // gap-[5px] (랜딩페이지: gap: 5px)
    marginBottom: 9, // mb-[9px] (랜딩페이지: margin-bottom: 9px)
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: COLORS.borderLight,
    paddingHorizontal: 9, // px-[9px] (랜딩페이지: padding: 4px 9px)
    paddingVertical: 4, // py-1 = 4px
    borderRadius: 8, // rounded-lg
  },
  tagText: {
    fontSize: 10, // 랜딩페이지: font-size: 10px
    fontWeight: '600', // 랜딩페이지: font-weight: 600
    color: '#374151', // 랜딩페이지: color: var(--gray-700)
  },
  postText: {
    fontSize: 12, // 랜딩페이지: font-size: 12px
    lineHeight: 18, // 랜딩페이지: line-height: 1.5 (12px * 1.5 = 18px)
    color: '#1F2937', // 랜딩페이지: color: var(--gray-800)
    marginBottom: 10, // 랜딩페이지: margin-bottom: 10px
  },
  cardActions: {
    flexDirection: 'row',
    gap: 14, // 랜딩페이지: gap: 14px
    paddingTop: 9, // 랜딩페이지: padding-top: 9px
    borderTopWidth: 1, // 랜딩페이지: border-top: 1px solid var(--gray-100)
    borderTopColor: '#F3F4F6', // 랜딩페이지: border-top: 1px solid var(--gray-100)
  },
  actionBtn: {
    fontSize: 11, // 랜딩페이지: font-size: 11px
    fontWeight: '600', // 랜딩페이지: font-weight: 600
    color: '#4B5563', // 랜딩페이지: color: var(--gray-600)
  },
  bookmarkButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  // 기존 스타일 유지 (하위 호환성)
  postCard: {
    width: CARD_WIDTH,
    marginRight: 12, // gap-3 = 12px
  },
  postImageContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.borderLight,
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  postImagePlaceholder: {
    backgroundColor: COLORS.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // 그라데이션 오버레이 - 웹 버전과 동일하게 구현
  gradientOverlayTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '30%',
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 1,
  },
  gradientOverlayMiddle: {
    position: 'absolute',
    top: '30%',
    left: 0,
    right: 0,
    height: '20%',
    backgroundColor: 'rgba(0,0,0,0.1)',
    zIndex: 1,
  },
  gradientOverlayBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(0,0,0,0.8)',
    zIndex: 1,
  },
  categoryIcon: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 1,
  },
  categoryEmoji: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  postInfoContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  postInfoGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  postInfo: {
    padding: 12, // padding: '12px'
    gap: 6, // gap: '6px' (웹 버전과 동일)
  },
  postTitle: {
    color: 'white',
    fontSize: 14, // fontSize: '14px'
    fontWeight: 'bold',
    lineHeight: 16.8, // lineHeight: '1.2' = 16.8px
    marginBottom: 0,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8, // textShadow: '0 2px 8px rgba(0,0,0,0.8)'
  },
  postTime: {
    color: 'rgba(255,255,255,0.9)', // color: 'rgba(255,255,255,0.9)'
    fontSize: 12, // fontSize: '12px'
    fontWeight: '600',
    lineHeight: 14.4, // lineHeight: '1.2' = 14.4px
    marginTop: 0, // gap으로 처리하므로 marginTop 제거
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8, // textShadow: '0 2px 8px rgba(0,0,0,0.8)'
  },
  emptySection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl, // py-12 = 48px
    paddingHorizontal: SPACING.md, // px-4 = 16px
    width: '100%',
  },
  emptyText: {
    marginTop: SPACING.md, // mb-4 = 16px
    fontSize: 16, // text-base = 16px
    color: COLORS.textSecondary, // text-gray-500
    fontWeight: '500', // font-medium
    textAlign: 'center',
    marginBottom: SPACING.xs, // mb-2 = 8px
  },
  emptySubtext: {
    fontSize: 14, // text-sm = 14px
    color: COLORS.textSubtle, // text-gray-400
    textAlign: 'center',
    marginBottom: SPACING.md, // mb-4 = 16px
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm, // gap-2 = 8px
    backgroundColor: COLORS.primary, // bg-primary
    paddingHorizontal: SPACING.lg, // px-6 = 24px
    paddingVertical: 12, // py-3 = 12px (웹과 동일)
    borderRadius: 999, // rounded-full
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5, // shadow-lg
  },
  emptyButtonText: {
    fontSize: 16, // text-base = 16px
    fontWeight: '600', // font-semibold
    color: 'white',
  },
  // 타이틀 관련 스타일
  titleButton: {
    width: 44, // w-11 h-11 = 44px
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12, // rounded-lg
    backgroundColor: '#FEF3C7', // from-amber-100
    borderWidth: 1,
    borderColor: '#FCD34D', // border-amber-300
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  titleButtonIcon: {
    fontSize: 20, // text-xl = 20px
  },
  titleSection: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    backgroundColor: '#FFFBEB', // from-amber-50/50
  },
  titleSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  titleSectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  titleSectionIcon: {
    fontSize: 18, // text-lg = 18px
  },
  titleSectionTitle: {
    fontSize: 14, // text-sm = 14px
    fontWeight: 'bold',
    color: COLORS.text, // text-text-light
  },
  titleSectionCount: {
    fontSize: 12, // text-xs = 12px
    fontWeight: 'normal',
    color: COLORS.textSubtle, // text-gray-500
    marginLeft: SPACING.xs, // ml-1
  },
  titleSectionSubtitle: {
    fontSize: 12, // text-xs = 12px
    color: COLORS.textSubtle, // text-gray-600
    marginTop: SPACING.xs, // mt-1
  },
  titleViewAllButton: {
    paddingHorizontal: SPACING.md, // px-3 = 12px
    paddingVertical: 6, // py-1.5 = 6px
    borderRadius: 8, // rounded-lg
    backgroundColor: '#FEF3C7', // from-amber-100
    borderWidth: 1,
    borderColor: '#FCD34D', // border-amber-300
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  titleViewAllButtonText: {
    fontSize: 12, // text-xs = 12px
    fontWeight: '600', // font-semibold
    color: '#92400E', // text-amber-900
  },
  titleList: {
    gap: SPACING.sm,
    paddingBottom: SPACING.sm,
  },
  titleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10, // py-2.5 = 10px
    borderRadius: 12, // rounded-xl
    backgroundColor: '#FEF3C7', // from-amber-100
    borderWidth: 2,
    borderColor: '#FCD34D', // border-amber-300
    marginRight: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  titleCardIcon: {
    fontSize: 18, // text-lg = 18px
  },
  titleCardContent: {
    flexDirection: 'column',
    gap: 0,
  },
  titleCardName: {
    fontSize: 12, // text-xs = 12px
    fontWeight: 'bold',
    color: '#92400E', // text-amber-900
    lineHeight: 14.4, // leading-tight = 1.2 * 12
  },
  titleCardCategory: {
    fontSize: 10, // text-[10px] = 10px
    color: '#B45309', // text-amber-700/70
    lineHeight: 12, // leading-tight = 1.2 * 10
  },
  titleEmpty: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  titleEmptyText: {
    fontSize: 12,
    color: COLORS.textSubtle,
    textAlign: 'center',
  },
  postImageContainerWithTitle: {
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 10,
  },
  titleGlow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 12,
    backgroundColor: 'rgba(251, 191, 36, 0.3)',
    zIndex: -1,
    opacity: 0.75,
  },
  titleBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
    zIndex: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
  titleBadgeGlow: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: '100%',
    height: '100%',
    borderRadius: 9999,
    backgroundColor: 'rgba(251, 191, 36, 0.4)',
    zIndex: 29,
    opacity: 0.6,
  },
  titleBadgeEnhanced: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9999,
    zIndex: 30,
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    transform: [{ scale: 1.1 }],
  },
  titleBadgeIcon: {
    fontSize: 12,
  },
  titleBadgeIconEnhanced: {
    fontSize: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  titleBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  titleBadgeTextEnhanced: {
    fontSize: 12,
    fontWeight: '900',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  // 모달 스타일
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
    padding: SPACING.md,
  },
  modalContent: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  modalHeaderIcon: {
    fontSize: 20,
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  modalBody: {
    padding: SPACING.md,
    maxHeight: '80%',
  },
  modalTitleDetail: {
    gap: SPACING.md,
  },
  modalTitleDetailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    borderWidth: 2,
    borderColor: '#FCD34D',
  },
  modalTitleDetailIcon: {
    fontSize: 48,
  },
  modalTitleDetailContent: {
    flex: 1,
    gap: SPACING.xs,
  },
  modalTitleDetailName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#92400E',
  },
  modalTitleDetailCategory: {
    fontSize: 14,
    color: '#B45309',
  },
  modalTitleDescription: {
    padding: SPACING.md,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
  },
  modalTitleDescriptionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  modalTitleDescriptionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  modalBackButton: {
    padding: SPACING.md,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  modalBackButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  modalEarnedSection: {
    marginBottom: SPACING.lg,
  },
  modalAllSection: {
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  modalTitleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  modalTitleItemEarned: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
  },
  modalTitleItemIcon: {
    fontSize: 24,
  },
  modalTitleItemContent: {
    flex: 1,
    gap: 4,
  },
  modalTitleItemName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  modalTitleItemNameEarned: {
    color: '#92400E',
  },
  modalTitleItemCategory: {
    fontSize: 12,
    color: COLORS.textSubtle,
  },
  modalTitleItemCategoryEarned: {
    color: '#B45309',
  },
  modalTitleItemCheck: {
    fontSize: 12,
    color: '#059669',
  },
  // 축하 모달 스타일
  celebrationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
    padding: SPACING.md,
  },
  celebrationContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFF5F0',
    borderRadius: 24,
    padding: SPACING.xl,
    borderWidth: 4,
    borderColor: COLORS.primary,
  },
  celebrationIconContainer: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
    position: 'relative',
  },
  celebrationIconCircle: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  celebrationIcon: {
    fontSize: 64,
  },
  celebrationBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  celebrationBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  celebrationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  celebrationName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  celebrationDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  celebrationButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  celebrationButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  celebrationCategoryContainer: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  celebrationCategoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    backgroundColor: COLORS.primary + '1A',
    borderWidth: 1,
    borderColor: COLORS.primary + '4D',
  },
  celebrationCategoryText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  // 관심 지역/장소 스타일
  interestPlacesContainer: {
    paddingHorizontal: 0, // 랜딩페이지: padding: 0 16px 14px 16px
    paddingBottom: 4, // 조금 더 키움: 2px → 4px
    paddingTop: 4, // 조금 더 키움: 2px → 4px
  },
  interestPlacesList: {
    flexDirection: 'row',
    gap: 10, // 조금 더 키움: 8px → 10px
    paddingHorizontal: 16, // 랜딩페이지: padding: 0 16px 14px 16px
    paddingBottom: 6, // 조금 더 키움: 4px → 6px
    alignItems: 'center', // 랜딩페이지: align-items: center
  },
  interestPlaceItem: {
    alignItems: 'center',
    minWidth: 52, // 조금 더 키움: 46px → 52px
    position: 'relative',
    gap: 4, // 조금 더 키움: 3px → 4px
  },
  interestPlaceItemContent: {
    alignItems: 'center',
    width: '100%',
  },
  interestPlaceDeleteButton: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 12,
    zIndex: 10,
  },
  interestPlaceCircle: {
    width: 46, // 조금 더 키움: 40px → 46px
    height: 46, // 조금 더 키움: 40px → 46px
    borderRadius: 23, // 조금 더 키움: 20px → 23px
    backgroundColor: COLORS.backgroundLight, // 흰색 배경 (랜딩페이지: linear-gradient(135deg, var(--gray-100) 0%, var(--gray-200) 100%))
    borderWidth: 2, // 축소: 2.5px → 2px
    borderColor: 'transparent', // 랜딩페이지: border: 2.5px solid transparent
    borderStyle: 'solid',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 0, // 랜딩페이지: gap으로 처리
  },
  interestPlaceCircleActive: {
    backgroundColor: COLORS.backgroundLight, // 흰색 배경
    borderStyle: 'solid',
    borderColor: COLORS.primary, // 랜딩페이지: border-color: var(--primary)
    borderWidth: 2, // 축소: 2.5px → 2px
  },
  interestPlaceCircleSelected: {
    borderColor: COLORS.primary, // 랜딩페이지: border-color: var(--primary)
    // 랜딩페이지: box-shadow: 0 0 0 2px var(--primary-light)
    shadowColor: COLORS.primaryLight,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 0,
  },
  interestPlaceIcon: {
    fontSize: 22, // 조금 더 키움: 20px → 22px
  },
  interestPlaceName: {
    fontSize: 10, // 조금 더 키움: 9px → 10px
    fontWeight: '500', // 랜딩페이지: font-weight: 500
    color: COLORS.text, // 랜딩페이지: color: var(--gray-700)
    textAlign: 'center',
    width: 52, // 조금 더 키움: 46px → 52px
    whiteSpace: 'nowrap', // 랜딩페이지: white-space: nowrap
  },
  interestPlaceNameSelected: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  selectedInterestBanner: {
    marginHorizontal: SPACING.md,
    marginBottom: 12,
    padding: 12,
    backgroundColor: COLORS.primary + '1A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary + '4D',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedInterestText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  selectedInterestButton: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
  // 관심 지역 추가 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.backgroundLight,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  modalLabel: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSubtle,
    marginBottom: SPACING.sm,
  },
  modalInput: {
    ...TYPOGRAPHY.body,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  modalPreview: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalPreviewLabel: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSubtle,
    marginBottom: SPACING.sm,
  },
  modalPreviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  modalPreviewCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalPreviewIcon: {
    fontSize: 24,
  },
  modalPreviewName: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.text,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: SPACING.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalButtonCancelText: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.text,
  },
  modalButtonConfirm: {
    backgroundColor: COLORS.primary,
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
  modalButtonConfirmText: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.textWhite,
  },
  deleteModalContainer: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 20,
    padding: SPACING.lg,
    width: '80%',
    maxWidth: 320,
  },
  deleteModalTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  deleteModalMessage: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  modalButtonDelete: {
    backgroundColor: COLORS.error,
  },
  modalButtonDeleteText: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.textWhite,
  },
  interestPlaceCircleAdd: {
    width: 46, // 조금 더 키움: 40px → 46px
    height: 46, // 조금 더 키움: 40px → 46px
    borderRadius: 23, // 조금 더 키움: 20px → 23px
    backgroundColor: COLORS.background,
    borderWidth: 1.5, // 축소: 2px → 1.5px
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  interestPlaceCircleAddEmpty: {
    backgroundColor: COLORS.primary,
    borderStyle: 'solid',
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  interestPlaceNameAdd: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 10, // 조금 더 키움: 9px → 10px
    textAlign: 'center',
    lineHeight: 13, // 조금 더 키움: 12px → 13px
  },
});

export default MainScreen;
