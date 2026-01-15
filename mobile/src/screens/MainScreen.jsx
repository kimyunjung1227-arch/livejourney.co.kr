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
import { useTabBar } from '../contexts/TabBarContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = 180;
const CARD_HEIGHT = CARD_WIDTH * 1.2;

const MainScreen = () => {
  const navigation = useNavigation();
  const { hideTabBar, showTabBar } = useTabBar();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('�ڿ�');
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
  
  // SOS �˸�
  const [nearbySosRequests, setNearbySosRequests] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [dismissedSosIds, setDismissedSosIds] = useState([]);
  
  const categories = useMemo(() => ['�ڿ�', '����', '��Ƽ��Ƽ', '����', 'ī��'], []);
  
  // ����/�浵 �Ÿ� ���� (km)
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
  
  // SOS ��û �ε� �� �ֺ� ��û ���͸�
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
        // �ݰ� 5km �̳� SOS�� ǥ�� (����ȭ�鿡���� �� ���� ����)
        return d <= 5;
      });
      
      setNearbySosRequests(nearby);
    } catch (error) {
      console.error('SOS ��û �ε� ����:', error);
    }
  }, [currentLocation]);
  
  // ���� ��ġ ��������
  useEffect(() => {
    const getLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('��ġ ������ �źεǾ����ϴ�.');
          return;
        }
        
        const location = await Location.getCurrentPositionAsync({});
        setCurrentLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } catch (error) {
        console.error('��ġ �������� ����:', error);
      }
    };
    
    getLocation();
  }, []);
  
  // SOS ��û �ε�
  useEffect(() => {
    loadSosRequests();
    
    // �ֱ������� SOS ��û Ȯ�� (30�ʸ���)
    const interval = setInterval(() => {
      loadSosRequests();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [loadSosRequests]);
  
  // ī�װ����� ���� �÷� ����
  const getCategoryColor = (category) => {
    const colorMap = {
      '�ڿ�': COLORS.secondary2,      // Green
      '����': COLORS.secondary7,       // Teal
      '��Ƽ��Ƽ': COLORS.secondary4,   // Deep Orange
      '����': COLORS.secondary3,       // Pink
      'ī��': COLORS.secondary6,       // Indigo
    };
    return colorMap[category] || COLORS.primary;
  };
  
  const getCategoryColorSoft = (category) => {
    const colorMap = {
      '�ڿ�': COLORS.secondary2Soft,
      '����': COLORS.secondary7Soft,
      '��Ƽ��Ƽ': COLORS.secondary4Soft,
      '����': COLORS.secondary3Soft,
      'ī��': COLORS.secondary6Soft,
    };
    return colorMap[category] || COLORS.primary + '20';
  };
  
  // ���� ����/���ҷ� ���͸�
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
      // ���� ���� ����
      if (selectedInterest) {
        const location = item.location || item.title || '';
        if (!(location.includes(selectedInterest) || selectedInterest.includes(location))) {
          return false;
        }
      }
      // ī�װ��� ����
      return item.category === selectedCategory || item.tags?.includes(selectedCategory);
    }),
    [recommendedData, selectedCategory, selectedInterest]
  );
  
  // Mock ������ �ε�
  // ���� ����/���� �ε�
  const loadInterestPlaces = useCallback(async () => {
    try {
      const places = await getInterestPlaces();
      setInterestPlaces(places);
      console.log(`? ���� ����/���� �ε�: ${places.length}��`);
    } catch (error) {
      console.error('���� ���� �ε� ����:', error);
    }
  }, []);

  // 관심 지역/장소 추가
  const handleAddInterestPlace = useCallback(async () => {
    if (!newInterestPlace.trim()) {
      return;
    }
    
    try {
      await toggleInterestPlace(newInterestPlace.trim());
      await loadInterestPlaces();
      setNewInterestPlace('');
      setShowAddInterestModal(false);
    } catch (error) {
      console.error('관심 지역 추가 오류:', error);
    }
  }, [newInterestPlace, loadInterestPlaces]);

  const loadMockData = useCallback(async () => {
    try {
      // ���� ������ ���� (���� seedMockData�� ������ ����)
      // AsyncStorage�� �����Ͱ� ������ ����
      const existingPostsJson = await AsyncStorage.getItem('uploadedPosts');
      if (!existingPostsJson || JSON.parse(existingPostsJson).length === 0) {
        // ���� seedMockData ������ ���⿡ ���� �����ϰų�
        // ������ �⺻ ������ ����
        console.log('?? ���� ������ �ڵ� ���� (�� seedMockData�� ����)');
      }
      
      const postsJson = await AsyncStorage.getItem('uploadedPosts');
      let posts = postsJson ? JSON.parse(postsJson) : [];
      
      // ���� ����/���ҵ� �Բ� �ε�
      await loadInterestPlaces();
      
      console.log(`?? ��ü �Խù�: ${posts.length}��`);
      
      // �ֽż� ����
      posts.sort((a, b) => {
        const timeA = new Date(a.timestamp || a.createdAt || 0).getTime();
        const timeB = new Date(b.timestamp || b.createdAt || 0).getTime();
        return timeB - timeA;
      });
      
      // 2�� �̻� �� �Խù� ���͸� (���� ȭ�� ǥ�ÿ�)
      posts = filterRecentPosts(posts, 2);
      console.log(`?? ��ü �Խù� �� 2�� �̳� �Խù�: ${posts.length}��`);
      
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
          user: post.user || '������',
          userId: post.userId,
          badge: post.categoryName || '���෯��',
          category: post.category,
          categoryName: post.categoryName,
          content: post.note || `${post.location}�� �Ƹ��ٿ� ����!`,
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
      
      // 1�ð� �̳� �Խù��� ���͸�
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
            badge: '�α�',
            category: post.category || '�ڿ�',
            categoryName: post.categoryName,
            time: dynamicTime,
            timeLabel: dynamicTime,
            timestamp: post.timestamp || post.createdAt || post.time,
            user: post.user || '������',
            userId: post.userId,
            content: post.note || `${post.location}�� �α� ����!`,
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
        
        let assignedCategory = '�ڿ�';
        if (post.category === 'food') {
          assignedCategory = idx % 2 === 0 ? '����' : 'ī��';
        } else if (post.category === 'landmark' || post.category === 'scenic') {
          assignedCategory = idx % 2 === 0 ? '�ڿ�' : '����';
        } else if (post.category === 'bloom') {
          assignedCategory = '����';
        } else {
          assignedCategory = '��Ƽ��Ƽ';
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
          badge: '��õ',
          category: assignedCategory,
          categoryName: post.categoryName,
          tags: post.tags || [assignedCategory],
          time: dynamicTime,
          timeLabel: dynamicTime,
          timestamp: post.timestamp || post.createdAt || post.time,
          user: post.user || '������',
          userId: post.userId,
          content: post.note || `${post.location}�� �Ƹ��ٿ� ����!`,
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
    } catch (error) {
      console.error('������ �ε� ����:', error);
    }
  }, []);
  
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadMockData();
    setRefreshing(false);
  }, [loadMockData]);
  
  // ������ Ÿ��Ʋ �ε�
  const loadTodayTitles = useCallback(async () => {
    try {
      const titles = await getAllTodayTitles();
      setAllTodayTitles(titles);
      
      // ���� �������� Ÿ��Ʋ Ȯ��
      const userId = 'test_user_001'; // TODO: ���� ������ ID�� ����
      const userTitle = await getUserDailyTitle(userId);
      setDailyTitle(userTitle);
      
      // ���� ȹ���� Ÿ��Ʋ Ȯ��
      const newlyEarned = await AsyncStorage.getItem('newlyEarnedTitle');
      if (newlyEarned) {
        const titleData = JSON.parse(newlyEarned);
        setEarnedTitle(titleData);
        setShowTitleCelebration(true);
        await AsyncStorage.removeItem('newlyEarnedTitle');
      }
    } catch (error) {
      console.error('Ÿ��Ʋ �ε� ����:', error);
    }
  }, []);

  useEffect(() => {
    console.log('?? ����ȭ�� ���� - �ʱ� ������ �ε�');
    
    // Mock ������ ���� �ε�
    loadMockData();
    loadTodayTitles();
    
    // ������ Ÿ��Ʋ �ε�
    const loadUserTitle = async () => {
      try {
        const userJson = await AsyncStorage.getItem('user');
        const user = userJson ? JSON.parse(userJson) : {};
        if (user?.id) {
          const title = await getUserDailyTitle(user.id);
          setDailyTitle(title);
        }
      } catch (error) {
        console.error('������ Ÿ��Ʋ �ε� ����:', error);
      }
    };
    loadUserTitle();
    
    // Ÿ��Ʋ ������Ʈ �̺�Ʈ ������
    const handleTitleUpdate = async () => {
      try {
        const userJson = await AsyncStorage.getItem('user');
        const user = userJson ? JSON.parse(userJson) : {};
        if (user?.id) {
          const previousTitle = dailyTitle;
          const title = await getUserDailyTitle(user.id);
          setDailyTitle(title);
          
          // ���� Ÿ��Ʋ�� ȹ���� ���� ���� ���� ǥ��
          if (title && (!previousTitle || previousTitle.name !== title.name)) {
            setEarnedTitle(title);
            setShowTitleCelebration(true);
          }
        }
        // ������ ���� Ÿ��Ʋ�� ������Ʈ
        const todayTitles = await getAllTodayTitles();
        setAllTodayTitles(todayTitles);
      } catch (error) {
        console.error('Ÿ��Ʋ ������Ʈ ����:', error);
      }
    };
    
    // �Խù� ������Ʈ �� Ÿ��Ʋ�� ���ΰ�ħ
    const handlePostsUpdateForTitles = async () => {
      setTimeout(async () => {
        const todayTitles = await getAllTodayTitles();
        setAllTodayTitles(todayTitles);
      }, 200);
    };
    
    // newPostsAdded �̺�Ʈ ������ (���� ���ε� ��)
    const handleNewPosts = () => {
      console.log('?? �� �Խù� �߰��� - ȭ�� ������Ʈ!');
      setTimeout(() => {
        loadMockData();
      }, 100);
    };
    
    // postsUpdated �̺�Ʈ ������ (�Խù� ������Ʈ ��)
    const handlePostsUpdate = () => {
      console.log('?? �Խù� ������Ʈ - ȭ�� ���ΰ�ħ!');
      setTimeout(() => {
        loadMockData();
        handlePostsUpdateForTitles();
      }, 100);
    };
    
    // �̺�Ʈ ������ ���� (React Native������ DeviceEventEmitter ����)
    // ���� ������ �̺�Ʈ �ý����� ���� AsyncStorage ���� ���� ����
    const checkStorageChanges = setInterval(() => {
      // AsyncStorage ���� ������ ���� ����
      loadMockData();
      loadTodayTitles();
    }, 1000);
    
    // �ڵ� ���ΰ�ħ: 30�ʸ���
    const autoRefreshInterval = setInterval(() => {
      console.log('? �ڵ� ���ΰ�ħ (30��) - �ð� ������Ʈ');
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

  // ȭ�� ��Ŀ�� �� ������ ���ΰ�ħ (���ε� �� ���� ȭ������ ���ƿ� ��)
  useFocusEffect(
    useCallback(() => {
      console.log('?? ���� ȭ�� ��Ŀ�� - ������ ���ΰ�ħ');
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
  
  const PostCard = ({ item, sectionType }) => {
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
    
    // ���������� ������ ���� ���Ǻ��� �ٸ� ī�� ������
    if (sectionType === 'realtime') {
      // �ǽð� ���� �ǵ�: scroll-card ����
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
            {/* ���� ���� �ð� ���� */}
            {item.time && (
              <View style={styles.scrollBadge}>
                <Text style={styles.scrollBadgeText}>{item.time}</Text>
              </View>
            )}
          </View>
          <View style={styles.scrollInfo}>
            <Text style={styles.scrollLocation} numberOfLines={1}>
              {item.location ? `?? ${item.location}` : item.title || '��ġ ���� ����'}
            </Text>
            <Text style={styles.scrollUser} numberOfLines={1}>
              {item.user || '������'}
            </Text>
          </View>
        </TouchableOpacity>
      );
    } else if (sectionType === 'crowded') {
      // ȥ�⵵ ����: scroll-card-small ����
      const getCrowdLevel = (item) => {
        // ȥ�⵵ ������ ������ ����, ������ �⺻��
        if (item.crowdLevel) return item.crowdLevel;
        if (item.tags && item.tags.some(tag => tag.includes('ȥ��') || tag.includes('�պ�'))) return 'high';
        if (item.tags && item.tags.some(tag => tag.includes('����'))) return 'medium';
        return 'low';
      };
      const crowdLevel = getCrowdLevel(item);
      const crowdText = crowdLevel === 'high' ? '�ſ� ȥ��' : crowdLevel === 'medium' ? '����' : '����';
      
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
            {/* ���� ���� ȥ�⵵ ���� */}
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
              {item.location || item.title || '��ġ ���� ����'}
            </Text>
            <Text style={styles.scrollTimeSmall} numberOfLines={1}>
              {item.time ? `${item.time} ������Ʈ` : '���� �� ������Ʈ'}
            </Text>
          </View>
        </TouchableOpacity>
      );
    } else {
      // ��õ ������: feed-card ����
      return (
        <TouchableOpacity
          style={styles.feedCard}
          onPress={() => handleItemPress(item, sectionType)}
          activeOpacity={0.9}
        >
          {/* ī�� ���� */}
          <View style={styles.cardHeader}>
            <View style={styles.userInfo}>
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarEmoji}>
                  {userTitle?.icon || (item.userId ? String(item.userId).charAt(0) : '??')}
                </Text>
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.userName}>{item.user || '������'}</Text>
                <Text style={styles.postTime}>{item.time || '���� ��'}</Text>
              </View>
            </View>
            {item.location && (
              <View style={styles.locationBadge}>
                <Text style={styles.locationBadgeText}>?? {item.location}</Text>
              </View>
          )}
          </View>
          
          {/* ī�� �̹��� */}
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
            {/* ���� ���� LIVE �ε������� */}
            <View style={styles.liveIndicator}>
              <View style={styles.livePulse} />
              <Text style={styles.liveIndicatorText}>{item.time || 'LIVE'}</Text>
            </View>
          </View>
          
          {/* ī�� ���� */}
          <View style={styles.cardInfo}>
            {/* �±� */}
            <View style={styles.infoTags}>
              {item.category && (
                <View style={styles.tag}>
                  <Text style={styles.tagText}>
                    {item.category === '�ڿ�' ? '???' : item.category === '����' ? '??' : item.category === 'ī��' ? '?' : '??'} {item.category}
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
                    {item.crowdLevel === 'high' ? '?? �ſ� ȥ��' : item.crowdLevel === 'medium' ? '?? ����' : '?? ����'}
                </Text>
                </View>
              )}
            </View>
            
            {/* �Խù� �ؽ�Ʈ */}
            {item.note && (
              <Text style={styles.postText} numberOfLines={2}>
                "{item.note}"
                </Text>
              )}
            
            {/* �׼� ��ư */}
            <View style={styles.cardActions}>
              <Text style={styles.actionBtn}>?? {item.likes || 0}</Text>
              <Text style={styles.actionBtn}>?? {item.comments?.length || 0}</Text>
              <View style={styles.bookmarkButton}>
                <Ionicons name="bookmark-outline" size={14} color="#4B5563" />
              </View>
          </View>
        </View>
      </TouchableOpacity>
    );
    }
  };

  const renderPostCard = useCallback(({ item, sectionType }) => {
    return <PostCard item={item} sectionType={sectionType} />;
  }, [handleItemPress]);
  
  const renderSection = useCallback((title, data, sectionType, showMore = true, showLiveBadge = false) => {
    if (data.length === 0) {
      const emptyMessages = {
        '?? �ǽð� ���� �ǵ�': {
          icon: 'travel-explore',
          title: '���� ���� �̰��� ������ �ö����� �ʾҾ���',
          subtitle: '���� ���� �ִ� ���ҿ� ������, ������ ���̵��� �� �常 ���� �ּ���',
        },
        '?? ���� ���� �պ��� ��': {
          icon: 'people',
          title: '���� ���� ���� ������ ������',
          subtitle: 'ù ��°�� ���� ������ �����غ�����!',
        },
        '? ��õ ������': {
          icon: 'recommend',
          title: '��õ �������� ���� ������',
          subtitle: 'ù ��°�� ��õ �������� �����غ�����!',
        },
        // ���� Ÿ��Ʋ�� ���� (���� ȣȯ��)
        '���� ������!': {
          icon: 'travel-explore',
          title: '���� ���� �̰��� ������ �ö����� �ʾҾ���',
          subtitle: '���� ���� �ִ� ���ҿ� ������, ������ ���̵��� �� �常 ���� �ּ���',
        },
        '���� ���� ���� ��!': {
          icon: 'people',
          title: '���� ���� ���� ������ ������',
          subtitle: 'ù ��°�� ���� ������ �����غ�����!',
        },
        '��õ ����': {
          icon: 'recommend',
          title: '��õ ���Ұ� ���� ������',
          subtitle: 'ù ��°�� ��õ ���Ҹ� �����غ�����!',
        },
        // ���� Ÿ��Ʋ�� ���� (���� ȣȯ��)
        '�ǽð� ����': {
          icon: 'travel-explore',
          title: '���� ���� �̰��� ������ �ö����� �ʾҾ���',
          subtitle: '���� ���� �ִ� ���ҿ� ������, ������ ���̵��� �� �常 ���� �ּ���',
        },
        '�ǽð� ���� ����': {
          icon: 'people',
          title: '���� ���� ���� ������ ������',
          subtitle: 'ù ��°�� ���� ������ �����غ�����!',
        },
      };
      
      const message = emptyMessages[title] || {
        icon: 'images-outline',
        title: '���� ������ ���� ������ ������',
        subtitle: 'ù ��°�� ���� ������ �����غ�����!',
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
            <Text style={styles.emptyButtonText}>ù ���� �ø���</Text>
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
              <Text style={styles.moreButtonText}>������</Text>
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

  // ��ũ�� �̺�Ʈ �ڵ鷯
  const handleScroll = useCallback((event) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    const scrollingDown = currentScrollY > scrollY.current;
    const scrollingUp = currentScrollY < scrollY.current;
    
    // ��ũ�� ���� (10px �̻�)�ϸ� �������� ���Ǹ� ������ (�ε巯�� �ִϸ��̼�)
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
    
    // 스크롤 방향에 따라 네비게이션 바 숨기기/보이기
    const scrollDelta = Math.abs(currentScrollY - scrollY.current);
    if (scrollDelta > 5) { // 최소 스크롤 거리
      if (scrollingDown && currentScrollY > 50) {
        // 아래로 스크롤하면 네비게이션 바 숨기기
        hideTabBar();
      } else if (scrollingUp) {
        // 위로 스크롤하면 네비게이션 바 보이기
        showTabBar();
      }
    }
    
    scrollY.current = currentScrollY;
  }, [interestOpacity, hideTabBar, showTabBar]);
  
  return (
    <ScreenLayout>
      <ScreenContent 
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onScroll={handleScroll}
        enableTabBarControl={false}
      >
        {/* ���� ���� - �׻� ǥ�� */}
        <ScreenHeader>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>LiveJourney</Text>
          <View style={styles.headerRight}>
            {/* Ÿ��Ʋ ���� ��ư */}
            {dailyTitle && (
              <TouchableOpacity
                style={styles.titleButton}
                onPress={() => {
                  setEarnedTitle(dailyTitle);
                  setShowTitleCelebration(true);
                }}
              >
                <Text style={styles.titleButtonIcon}>{dailyTitle.icon || '??'}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Ionicons name="notifications-outline" size={26} color={COLORS.text} />
              {unreadNotificationCount > 0 && (
                <View style={styles.notificationBadge}>
                  <View style={styles.notificationDot} />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
        
        {/* SOS �˸� ���� - �ΰ��� �˻�â ���� */}
        {nearbySosRequests.length > 0 && !dismissedSosIds.includes(nearbySosRequests[0]?.id) && (
          <View style={styles.sosNotificationBannerInline}>
            <TouchableOpacity
              style={styles.sosNotificationBannerSmall}
              activeOpacity={0.9}
              onPress={() => navigation.navigate('Map')}
            >
              <Ionicons name="alert-circle" size={14} color="#ffffff" />
              <Text style={styles.sosNotificationTextSmall} numberOfLines={1}>
                ���� ���� ��ó�� ������ �ʿ��� ������ �ֽ��ϴ�
              </Text>
              <Ionicons name="chevron-forward" size={14} color="#ffffff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sosNotificationCloseButtonSmall}
              activeOpacity={0.7}
              onPress={() => {
                if (nearbySosRequests[0]?.id) {
                  setDismissedSosIds([...dismissedSosIds, nearbySosRequests[0].id]);
                }
              }}
            >
              <Ionicons name="close" size={14} color="#ffffff" />
            </TouchableOpacity>
          </View>
        )}
        
        {/* �˻�â */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={24} color={COLORS.primary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="������ ����������? ??"
            placeholderTextColor={COLORS.textSubtle}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => navigation.navigate('Search')}
          />
        </View>

        {/* �� ���� ����/���� - ��ũ�ѽ� ���� */}
        {isInterestSectionVisible && (
        <Animated.View style={{ opacity: interestOpacity }}>
          <View style={styles.interestPlacesContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.interestPlacesList}
            >
              {/* �߰� ��ư */}
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
                  {interestPlaces.length === 0 ? '����������\n�߰��غ�����' : '�߰�'}
                </Text>
              </TouchableOpacity>

              {/* ���� ����/���ҵ� */}
              {interestPlaces.map((place, index) => {
                const isSelected = selectedInterest === place.name;
              const regionIcon = getRegionIcon(place.name);
                return (
                <View key={index} style={styles.interestPlaceItem}>
                  <TouchableOpacity
                    style={styles.interestPlaceItemContent}
                    onPress={() => setSelectedInterest(isSelected ? null : place.name)}
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
        </ScreenHeader>

        {/* ���� ������ - ������������ ������ ���� */}
        <ScreenBody>
        {/* ���� ���� ���� �ȳ� */}
        {selectedInterest && (
          <View style={styles.selectedInterestBanner}>
            <Text style={styles.selectedInterestText}>
              ? "{selectedInterest}" ���� ������ ǥ�� ��
            </Text>
            <TouchableOpacity onPress={() => setSelectedInterest(null)}>
              <Text style={styles.selectedInterestButton}>��ü ����</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ?? �ǽð� ���� �ǵ� ���� - ������������ ������ ���� */}
        <View style={{ marginBottom: 20 }}>
          {renderSection('?? �ǽð� ���� �ǵ�', filteredRealtimeData, 'realtime', true, true)}
        </View>
        
        {/* ?? ���� ���� �պ��� �� ���� - ������������ ������ ���� */}
        <View style={{ marginBottom: 20 }}>
          {renderSection('?? ���� ���� �պ��� ��', filteredCrowdedData, 'crowded')}
        </View>
        
        {/* ? ��õ ������ ���� - ������������ ������ ���� */}
        <View style={{ marginBottom: 20 }}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>? ��õ ������</Text>
          </View>
          
          {/* ī�װ��� ���� */}
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
              <Text style={styles.emptyText}>���� ������ ���� ������ ������</Text>
            </View>
          ) : (
            <View>
              {filteredRecommendedData.map((item) => (
                <PostCard key={item.id} item={item} sectionType="recommended" />
              ))}
            </View>
          )}
        </View>
        </ScreenBody>

        {/* ������ Ÿ��Ʋ ���� */}
        {showTitleModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <Text style={styles.modalHeaderIcon}>??</Text>
                <Text style={styles.modalHeaderTitle}>������ Ÿ��Ʋ</Text>
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
                    <Text style={styles.modalTitleDetailIcon}>{selectedTitle.icon || '??'}</Text>
                    <View style={styles.modalTitleDetailContent}>
                      <Text style={styles.modalTitleDetailName}>{selectedTitle.name}</Text>
                      <Text style={styles.modalTitleDetailCategory}>{selectedTitle.category}</Text>
                    </View>
                  </View>
                  <View style={styles.modalTitleDescription}>
                    <Text style={styles.modalTitleDescriptionTitle}>ȹ�� ����</Text>
                    <Text style={styles.modalTitleDescriptionText}>{selectedTitle.description}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.modalBackButton}
                    onPress={() => setSelectedTitle(null)}
                  >
                    <Text style={styles.modalBackButtonText}>�������� ���ư���</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View>
                  {/* ȹ���� Ÿ��Ʋ */}
                  {allTodayTitles.length > 0 && (
                    <View style={styles.modalEarnedSection}>
                      <Text style={styles.modalSectionTitle}>
                        ȹ���� Ÿ��Ʋ ({allTodayTitles.length}��)
                      </Text>
                      {allTodayTitles.map((item, index) => (
                        <TouchableOpacity
                          key={`${item.userId}-${index}`}
                          style={styles.modalTitleItem}
                          onPress={() => setSelectedTitle(item.title)}
                        >
                          <Text style={styles.modalTitleItemIcon}>{item.title.icon || '??'}</Text>
                          <View style={styles.modalTitleItemContent}>
                            <Text style={styles.modalTitleItemName}>{item.title.name}</Text>
                            <Text style={styles.modalTitleItemCategory}>{item.title.category}</Text>
                          </View>
                          <Ionicons name="chevron-forward" size={20} color={COLORS.textSubtle} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {/* ���� Ÿ��Ʋ ���� */}
                  <View style={styles.modalAllSection}>
                    <Text style={styles.modalSectionTitle}>
                      ���� Ÿ��Ʋ ���� ({Object.keys(DAILY_TITLES).length}��)
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
                          <Text style={styles.modalTitleItemIcon}>{title.icon || '??'}</Text>
                          <View style={styles.modalTitleItemContent}>
                            <Text style={[
                              styles.modalTitleItemName,
                              isEarned && styles.modalTitleItemNameEarned
                            ]}>
                              {title.name}
                              {isEarned && <Text style={styles.modalTitleItemCheck}> ? ȹ��</Text>}
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

        {/* Ÿ��Ʋ ȹ�� ���� ���� - ������ �ٸ� ������ ��Ÿ�� */}
        {showTitleCelebration && earnedTitle && (
        <View style={styles.celebrationOverlay}>
          <View style={styles.celebrationContent}>
            <View style={styles.celebrationIconContainer}>
              <View style={styles.celebrationIconCircle}>
                <Text style={styles.celebrationIcon}>{earnedTitle.icon || '??'}</Text>
              </View>
              <View style={styles.celebrationBadge}>
                <Text style={styles.celebrationBadgeText}>VIP</Text>
              </View>
            </View>
            <Text style={styles.celebrationTitle}>�����մϴ�!</Text>
            <Text style={styles.celebrationName}>{earnedTitle.name}</Text>
            <View style={styles.celebrationCategoryContainer}>
              <View style={styles.celebrationCategoryBadge}>
                <Text style={styles.celebrationCategoryText}>
                  {earnedTitle.category || '24�ð� Ÿ��Ʋ'}
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
              <Text style={styles.celebrationButtonText}>Ȯ��</Text>
            </TouchableOpacity>
          </View>
        </View>
        )}
      </ScreenContent>

      {/* ���� ����/���� �߰� ���� */}
      <Modal
        visible={showAddInterestModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddInterestModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>���� ����/���� �߰�</Text>
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
              <Text style={styles.modalLabel}>���� �Ǵ� ���� �̸�</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="��: ����, �λ� �ؿ���, ���� �ұ���"
                placeholderTextColor={COLORS.textSubtle}
                value={newInterestPlace}
                onChangeText={setNewInterestPlace}
                autoFocus={true}
                onSubmitEditing={handleAddInterestPlace}
              />
              
              {newInterestPlace.trim() && (
                <View style={styles.modalPreview}>
                  <Text style={styles.modalPreviewLabel}>�̸�����</Text>
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
                <Text style={styles.modalButtonCancelText}>����</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm, !newInterestPlace.trim() && styles.modalButtonDisabled]}
                onPress={handleAddInterestPlace}
                disabled={!newInterestPlace.trim()}
              >
                <Text style={styles.modalButtonConfirmText}>�߰�</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ���� ����/���� ���� Ȯ�� ���� */}
      <Modal
        visible={deleteConfirmPlace !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDeleteConfirmPlace(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModalContainer}>
            <Text style={styles.deleteModalTitle}>���� ����/���� ����</Text>
            <Text style={styles.deleteModalMessage}>
              "{deleteConfirmPlace}"��(��) �����Ͻðھ���?
            </Text>
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setDeleteConfirmPlace(null)}
              >
                <Text style={styles.modalButtonCancelText}>����</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonDelete]}
                onPress={() => handleDeleteInterestPlace(deleteConfirmPlace)}
              >
                <Text style={styles.modalButtonDeleteText}>����</Text>
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
  header: {
    backgroundColor: COLORS.backgroundLight, // bg-white (����������: transparent)
    paddingHorizontal: 16, // px-4 = 16px (����������: padding: 12px 16px)
    paddingTop: 12, // py-3 = 12px (����������: padding: 12px 16px)
    paddingBottom: 12, // py-3 = 12px (����������: padding: 12px 16px)
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16, // 웹과 동일: padding: 12px 16px
    paddingTop: 12, // 웹과 동일: padding: 12px 16px
    paddingBottom: 12, // 웹과 동일: padding: 12px 16px
    marginBottom: 0,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12, // ����������: gap: 12px
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: 20, // ����������: font-size: 20px
    fontWeight: '800', // ����������: font-weight: 800
    color: COLORS.text, // ����������: color: var(--gray-900)
    letterSpacing: -0.8, // ����������: letter-spacing: -0.8px
    lineHeight: 24, // leading-tight
  },
  notificationButton: {
    width: 44, // w-11 h-11 = 44px
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12, // rounded-lg
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
    backgroundColor: COLORS.backgroundLight, // bg-white
    borderRadius: 12, // ����������: border-radius: 12px
    paddingHorizontal: 20, // �˻�â ũ�� Ű��
    paddingVertical: 14, // �˻�â ũ�� Ű��
    marginHorizontal: 16, // ����������: margin: 12px 16px
    marginTop: 12, // ����������: margin: 12px 16px
    marginBottom: 12, // ����������: margin: 12px 16px
    minHeight: 56, // �˻�â �ּ� ����
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, // ����������: box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08)
    shadowRadius: 8,
    elevation: 3,
    gap: 12, // �˻�â ũ�� Ű��
  },
  searchIcon: {
    fontSize: 24, // �˻�â ũ�� Ű��
    fontWeight: '400', // ����������: font-weight: 400
    color: COLORS.primary, // ����������: color: var(--primary)
  },
  searchInput: {
    ...TYPOGRAPHY.body,
    flex: 1,
    fontSize: 16, // �˻�â ũ�� Ű��
    fontWeight: '400',
    color: COLORS.text,
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
    paddingHorizontal: 16, // ����������: padding: 0 16px 12px 16px
    paddingBottom: 12, // ����������: padding: 0 16px 12px 16px
  },
  sectionTitle: {
    ...TYPOGRAPHY.h2,
    fontSize: 15, // ����������: font-size: 15px
    fontWeight: '700', // ����������: font-weight: 700
    color: COLORS.text, // ����������: color: var(--gray-900)
    margin: 0, // ����������: margin: 0
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
    fontSize: 12, // ����������: font-size: 12px
    fontWeight: '600', // ����������: font-weight: 600
    color: COLORS.primary, // ����������: color: var(--primary)
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
    gap: 4, // ����������: gap: 4px
    backgroundColor: '#FFF8E1', // ����������: background: var(--accent-light)
    paddingHorizontal: 10, // ����������: padding: 4px 10px
    paddingVertical: 4, // ����������: padding: 4px 10px
    borderRadius: 12, // ����������: border-radius: 12px
  },
  liveDot: {
    width: 5, // ����������: width: 5px (live-pulse)
    height: 5, // ����������: height: 5px
    borderRadius: 2.5, // ����������: border-radius: 50%
    backgroundColor: '#ef4444', // ����������: background: #ef4444
  },
  liveBadgeText: {
    fontSize: 10, // ����������: font-size: 10px
    fontWeight: '700', // ����������: font-weight: 700
    color: '#FFA000', // ����������: color: var(--accent-dark)
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
    // backgroundColor�� �������� ������
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
    // color�� �������� ������
  },
  horizontalList: {
    paddingHorizontal: 16, // ����������: padding: 0 16px
    paddingBottom: 4, // ����������: padding-bottom: 4px
    gap: 12, // ����������: gap: 12px
  },
  // ���������� ����: scroll-card (�ǽð� ���� �ǵ�)
  scrollCard: {
    width: 180, // ����������: width: 180px
    borderRadius: 12, // ����������: border-radius: 12px
    backgroundColor: COLORS.backgroundLight, // ����������: background: white
    marginRight: 12, // gap: 12px
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, // ����������: box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08)
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
    backdropFilter: 'blur(10px)', // backdrop-blur-[10px] (React Native������ ȿ�� ������)
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
    padding: 10, // p-2.5 = 10px (����������: padding: 10px)
    gap: 4, // gap-1 = 4px
  },
  scrollLocation: {
    fontSize: 12, // ����������: font-size: 12px
    fontWeight: '600', // ����������: font-weight: 600
    color: COLORS.text, // ����������: color: var(--gray-900)
    // whiteSpace: 'nowrap', // ����������: white-space: nowrap (React Native������ numberOfLines�� ó��)
    // overflow: 'hidden', // ����������: overflow: hidden
    // textOverflow: 'ellipsis', // ����������: text-overflow: ellipsis
  },
  scrollUser: {
    fontSize: 11, // ����������: font-size: 11px
    color: COLORS.textSecondary, // ����������: color: var(--gray-500)
  },
  // ���������� ����: scroll-card-small (ȥ�⵵ ����)
  scrollCardSmall: {
    width: 140, // ����������: width: 140px
    borderRadius: 10, // ����������: border-radius: 10px
    backgroundColor: COLORS.backgroundLight, // ����������: background: white
    marginRight: 12, // gap: 12px
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, // ����������: box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08)
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
    padding: 8, // p-2 = 8px (����������: padding: 8px)
    gap: 3, // gap-0.5 = 2px (����������: gap: 3px)
  },
  scrollLocationSmall: {
    fontSize: 11, // ����������: font-size: 11px
    fontWeight: '600', // ����������: font-weight: 600
    color: COLORS.text, // ����������: color: var(--gray-900)
    // whiteSpace: 'nowrap', // ����������: white-space: nowrap
    // overflow: 'hidden', // ����������: overflow: hidden
    // textOverflow: 'ellipsis', // ����������: text-overflow: ellipsis
  },
  scrollTimeSmall: {
    fontSize: 10, // ����������: font-size: 10px
    color: COLORS.textSecondary, // ����������: color: var(--gray-500)
  },
  // ���������� ����: feed-card (��õ ������)
  feedCard: {
    backgroundColor: COLORS.backgroundLight, // ����������: background: white
    borderRadius: 14, // ����������: border-radius: 14px
    marginHorizontal: SPACING.md, // ����������: margin: 0 16px 14px 16px
    marginBottom: 14, // ����������: margin: 0 16px 14px 16px
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, // ����������: box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06)
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 11, // p-[11px] (����������: padding: 11px)
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9, // gap-[9px] (����������: gap: 9px)
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
  },
  locationBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.primary,
  },
  cardImageContainer: {
    width: '100%',
    height: 220, // ����������: height: 220px
    position: 'relative',
    overflow: 'hidden',
    // ����������: background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)
  },
  cardImage: {
    width: '100%',
    height: '100%',
    // ����������: object-fit: cover, display: block
  },
  cardImagePlaceholder: {
    backgroundColor: COLORS.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  liveIndicator: {
    position: 'absolute',
    top: 10, // top-2.5 = 10px (����������: top: 10px)
    right: 10, // right-2.5 = 10px (����������: right: 10px)
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5, // gap-[5px] (����������: gap: 5px)
    paddingHorizontal: 11, // px-[11px] (����������: padding: 5px 11px)
    paddingVertical: 5, // py-[5px]
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    backdropFilter: 'blur(10px)', // backdrop-blur-[10px] (React Native������ ȿ�� ������)
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
    padding: 11, // p-[11px] (����������: padding: 11px)
  },
  infoTags: {
    flexDirection: 'row',
    gap: 5, // gap-[5px] (����������: gap: 5px)
    marginBottom: 9, // mb-[9px] (����������: margin-bottom: 9px)
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: COLORS.borderLight,
    paddingHorizontal: 9, // px-[9px] (����������: padding: 4px 9px)
    paddingVertical: 4, // py-1 = 4px
    borderRadius: 8, // rounded-lg
  },
  tagText: {
    fontSize: 10, // ����������: font-size: 10px
    fontWeight: '600', // ����������: font-weight: 600
    color: '#374151', // ����������: color: var(--gray-700)
  },
  postText: {
    fontSize: 12, // ����������: font-size: 12px
    lineHeight: 18, // ����������: line-height: 1.5 (12px * 1.5 = 18px)
    color: '#1F2937', // ����������: color: var(--gray-800)
    marginBottom: 10, // ����������: margin-bottom: 10px
  },
  cardActions: {
    flexDirection: 'row',
    gap: 14, // ����������: gap: 14px
    paddingTop: 9, // ����������: padding-top: 9px
    borderTopWidth: 1, // ����������: border-top: 1px solid var(--gray-100)
    borderTopColor: '#F3F4F6', // ����������: border-top: 1px solid var(--gray-100)
  },
  actionBtn: {
    fontSize: 11, // ����������: font-size: 11px
    fontWeight: '600', // ����������: font-weight: 600
    color: '#4B5563', // ����������: color: var(--gray-600)
  },
  bookmarkButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  // ���� ��Ÿ�� ���� (���� ȣȯ��)
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
  // �׶����̼� �������� - �� ������ �����ϰ� ����
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
    gap: 6, // gap: '6px' (�� ������ ����)
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
    marginTop: 0, // gap���� ó���ϹǷ� marginTop ����
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
    paddingVertical: 12, // py-3 = 12px (���� ����)
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
  // Ÿ��Ʋ ���� ��Ÿ��
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
  // ���� ��Ÿ��
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
  // ���� ���� ��Ÿ��
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
  // ���� ����/���� ��Ÿ��
  interestPlacesContainer: {
    paddingHorizontal: 0, // ����������: padding: 0 16px 14px 16px
    paddingBottom: 4, // ���� �� Ű��: 2px �� 4px
    paddingTop: 4, // ���� �� Ű��: 2px �� 4px
  },
  interestPlacesList: {
    flexDirection: 'row',
    gap: 10, // ���� �� Ű��: 8px �� 10px
    paddingHorizontal: 16, // ����������: padding: 0 16px 14px 16px
    paddingBottom: 6, // ���� �� Ű��: 4px �� 6px
    alignItems: 'center', // ����������: align-items: center
  },
  interestPlaceItem: {
    alignItems: 'center',
    minWidth: 52, // ���� �� Ű��: 46px �� 52px
    position: 'relative',
    gap: 4, // ���� �� Ű��: 3px �� 4px
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
    width: 46, // ���� �� Ű��: 40px �� 46px
    height: 46, // ���� �� Ű��: 40px �� 46px
    borderRadius: 23, // ���� �� Ű��: 20px �� 23px
    backgroundColor: COLORS.backgroundLight, // ���� ���� (����������: linear-gradient(135deg, var(--gray-100) 0%, var(--gray-200) 100%))
    borderWidth: 2, // ����: 2.5px �� 2px
    borderColor: 'transparent', // ����������: border: 2.5px solid transparent
    borderStyle: 'solid',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 0, // ����������: gap���� ó��
  },
  interestPlaceCircleActive: {
    backgroundColor: COLORS.backgroundLight, // ���� ����
    borderStyle: 'solid',
    borderColor: COLORS.primary, // ����������: border-color: var(--primary)
    borderWidth: 2, // ����: 2.5px �� 2px
  },
  interestPlaceCircleSelected: {
    borderColor: COLORS.primary, // ����������: border-color: var(--primary)
    // ����������: box-shadow: 0 0 0 2px var(--primary-light)
    shadowColor: COLORS.primaryLight,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 0,
  },
  interestPlaceIcon: {
    fontSize: 22, // ���� �� Ű��: 20px �� 22px
  },
  interestPlaceName: {
    fontSize: 10, // ���� �� Ű��: 9px �� 10px
    fontWeight: '500', // ����������: font-weight: 500
    color: COLORS.text, // ����������: color: var(--gray-700)
    textAlign: 'center',
    width: 52, // ���� �� Ű��: 46px �� 52px
    whiteSpace: 'nowrap', // ����������: white-space: nowrap
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
  // ���� ���� �߰� ���� ��Ÿ��
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
    width: 46, // ���� �� Ű��: 40px �� 46px
    height: 46, // ���� �� Ű��: 40px �� 46px
    borderRadius: 23, // ���� �� Ű��: 20px �� 23px
    backgroundColor: COLORS.background,
    borderWidth: 1.5, // ����: 2px �� 1.5px
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
    fontSize: 10, // ���� �� Ű��: 9px �� 10px
    textAlign: 'center',
    lineHeight: 13, // ���� �� Ű��: 12px �� 13px
  },
});

export default MainScreen;
