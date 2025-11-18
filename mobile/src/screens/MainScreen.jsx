import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
  Image,
  TextInput,
  FlatList,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/styles';
import { filterRecentPosts, getTimeAgo } from '../utils/timeUtils';
import { getUserDailyTitle, getTitleEffect } from '../utils/dailyTitleSystem';

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
  
  const categories = useMemo(() => ['자연', '힐링', '액티비티', '맛집', '카페'], []);
  
  const filteredRecommendedData = useMemo(() => 
    recommendedData.filter(item => 
      item.category === selectedCategory || item.tags?.includes(selectedCategory)
    ),
    [recommendedData, selectedCategory]
  );
  
  // Mock 데이터 로드
  const loadMockData = useCallback(async () => {
    try {
      const postsJson = await AsyncStorage.getItem('uploadedPosts');
      let posts = postsJson ? JSON.parse(postsJson) : [];
      
      // 2일 이상 된 게시물 필터링
      posts = filterRecentPosts(posts, 2);
      
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
          content: post.note || `${post.location}의 아름다운 순간!`,
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
      console.error('데이터 로드 실패:', error);
    }
  }, []);
  
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadMockData();
    setRefreshing(false);
  }, [loadMockData]);
  
  useEffect(() => {
    loadMockData();
    
    // 자동 새로고침: 30초마다
    const autoRefreshInterval = setInterval(() => {
      loadMockData();
    }, 30000);
    
    return () => clearInterval(autoRefreshInterval);
  }, [loadMockData]);
  
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
  
  const renderPostCard = useCallback(({ item, sectionType }) => {
    return (
      <TouchableOpacity
        style={styles.postCard}
        onPress={() => handleItemPress(item, sectionType)}
        activeOpacity={0.9}
      >
        <View style={styles.postImageContainer}>
          {item.image ? (
            <Image
              source={{ uri: item.image }}
              style={styles.postImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.postImage, styles.postImagePlaceholder]}>
              <Ionicons name="image-outline" size={40} color={COLORS.textSubtle} />
            </View>
          )}
          
          {/* 그라데이션 오버레이 */}
          <View style={styles.gradientOverlay} />
          
          {/* 좌측상단: 카테고리 아이콘 */}
          {item.categoryName && (
            <View style={styles.categoryIcon}>
              <Text style={styles.categoryEmoji}>
                {item.categoryName === '개화 상황' && '🌸'}
                {item.categoryName === '맛집 정보' && '🍜'}
                {(!item.categoryName || !['개화 상황', '맛집 정보'].includes(item.categoryName)) && '🏞️'}
              </Text>
            </View>
          )}
          
          {/* 좌측하단: 위치정보 + 업로드시간 */}
          <View style={styles.postInfo}>
            {item.title && (
              <Text style={styles.postTitle} numberOfLines={1}>
                {item.title}
              </Text>
            )}
            {item.time && (
              <Text style={styles.postTime} numberOfLines={1}>
                {item.time}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [handleItemPress]);
  
  const renderSection = useCallback((title, data, sectionType, showMore = true) => {
    if (data.length === 0) {
      return (
        <View style={styles.emptySection}>
          <Ionicons name="images-outline" size={48} color={COLORS.textSubtle} />
          <Text style={styles.emptyText}>아직 공유된 여행 정보가 없어요</Text>
        </View>
      );
    }
    
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {showMore && (
            <TouchableOpacity>
              <Text style={styles.moreButton}>더보기</Text>
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
          snapToInterval={CARD_WIDTH + SPACING.md}
          decelerationRate="fast"
          snapToAlignment="start"
        />
      </View>
    );
  }, [renderPostCard]);
  
  return (
    <SafeAreaView style={styles.container}>
      {/* 상단 헤더 */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>LiveJourney</Text>
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
        
        {/* 검색창 */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={COLORS.primary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="어디로 떠나볼까요? 🌏"
            placeholderTextColor={COLORS.textSubtle}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => navigation.navigate('Search')}
          />
        </View>
      </View>
      
      {/* 메인 컨텐츠 */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* 실시간 정보 섹션 */}
        {renderSection('실시간 정보', realtimeData, 'realtime')}
        
        {/* 실시간 밀집 지역 섹션 */}
        {renderSection('실시간 밀집 지역', crowdedData, 'crowded')}
        
        {/* 추천 지역 섹션 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>추천 지역</Text>
            <TouchableOpacity>
              <Text style={styles.moreButton}>더보기</Text>
            </TouchableOpacity>
          </View>
          
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
                  selectedCategory === category && styles.categoryButtonActive
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text
                  style={[
                    styles.categoryButtonText,
                    selectedCategory === category && styles.categoryButtonTextActive
                  ]}
                >
                  {category}
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
            <FlatList
              data={filteredRecommendedData}
              renderItem={({ item }) => renderPostCard({ item, sectionType: 'recommended' })}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
              snapToInterval={CARD_WIDTH + SPACING.md}
              decelerationRate="fast"
              snapToAlignment="start"
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.backgroundLight,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    fontWeight: 'bold',
  },
  notificationButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
  },
  notificationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 999,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.primary + '30',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    padding: 0,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h2,
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  moreButton: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textSubtle,
  },
  categoryFilter: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  categoryButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    backgroundColor: COLORS.borderLight,
    marginRight: SPACING.sm,
  },
  categoryButtonActive: {
    backgroundColor: COLORS.primary,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  categoryButtonTextActive: {
    color: COLORS.backgroundLight,
  },
  horizontalList: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  postCard: {
    width: CARD_WIDTH,
    marginRight: SPACING.md,
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
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    backgroundColor: 'rgba(0,0,0,0.3)',
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
  postInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    zIndex: 10,
  },
  postTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    lineHeight: 18,
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  postTime: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  emptySection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.md,
  },
  emptyText: {
    marginTop: SPACING.md,
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
});

export default MainScreen;
