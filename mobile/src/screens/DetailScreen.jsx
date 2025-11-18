import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  FlatList,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/styles';
import { filterRecentPosts, getTimeAgo } from '../utils/timeUtils';
import { isPostLiked } from '../utils/socialInteractions';

// PostItem 컴포넌트 (DetailScreen 전용)
const PostItem = ({ item, index, onPress }) => {
  const [isLiked, setIsLiked] = useState(false);
  const imageUrl = item.imageUrl || item.images?.[0] || item.image;
  const likeCount = item.likes || item.likeCount || 0;

  useEffect(() => {
    const checkLike = async () => {
      const liked = await isPostLiked(item.id);
      setIsLiked(liked);
    };
    checkLike();
  }, [item.id]);

  return (
    <TouchableOpacity
      style={detailStyles.postItem}
      onPress={() => onPress(item, index)}
      activeOpacity={0.9}
    >
      {/* 이미지 */}
      <View style={detailStyles.postImageContainer}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={detailStyles.postImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[detailStyles.postImage, detailStyles.postImagePlaceholder]}>
            <Ionicons name="image-outline" size={32} color={COLORS.textSubtle} />
          </View>
        )}

        {/* 좌측 상단 카테고리 아이콘 */}
        {item.categoryName && (
          <View style={detailStyles.categoryIcon}>
            <Text style={detailStyles.categoryEmoji}>
              {item.categoryName === '개화 상황' && '🌸'}
              {item.categoryName === '맛집 정보' && '🍜'}
              {(!item.categoryName || !['개화 상황', '맛집 정보'].includes(item.categoryName)) && '🏞️'}
            </Text>
          </View>
        )}

        {/* 우측 하단 하트 아이콘 */}
        <View style={detailStyles.likeBadge}>
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={16}
            color={isLiked ? COLORS.error : COLORS.text}
          />
          <Text style={detailStyles.likeCount}>{likeCount}</Text>
        </View>
      </View>

      {/* 이미지 밖 하단 텍스트 */}
      <View style={detailStyles.postTextContainer}>
        <View style={detailStyles.locationRow}>
          <Text style={detailStyles.locationText} numberOfLines={1}>
            {item.detailedLocation || item.placeName || item.location || '여행지'}
          </Text>
          {item.time && (
            <Text style={detailStyles.timeText}>{item.time}</Text>
          )}
        </View>
        {item.detailedLocation && item.detailedLocation !== item.location && (
          <Text style={detailStyles.subLocationText} numberOfLines={1}>
            {item.location}
          </Text>
        )}
        {item.tags && item.tags.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={detailStyles.tagsScroll}
            contentContainerStyle={detailStyles.tagsScrollContent}
          >
            {item.tags.slice(0, 5).map((tag, tagIndex) => (
              <View key={tagIndex} style={detailStyles.tagBadge}>
                <Text style={detailStyles.tagText}>
                  #{typeof tag === 'string' ? tag.replace('#', '') : tag}
                </Text>
              </View>
            ))}
          </ScrollView>
        )}
        {item.note && (
          <Text style={detailStyles.noteText} numberOfLines={2}>
            {item.note}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { filter } = route.params || {};
  const [activeTab, setActiveTab] = useState(filter || 'realtime');
  const [selectedCategory, setSelectedCategory] = useState('자연');
  const [displayedItems, setDisplayedItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const pageRef = useRef(0);
  
  const [realtimeData, setRealtimeData] = useState([]);
  const [crowdedData, setCrowdedData] = useState([]);
  const [recommendedData, setRecommendedData] = useState([]);
  
  const categories = useMemo(() => ['자연', '힐링', '액티비티', '맛집', '카페'], []);

  const tabs = useMemo(() => [
    { id: 'realtime', label: '실시간 정보' },
    { id: 'crowded', label: '실시간 밀집 지역' },
    { id: 'recommended', label: '추천 지역' }
  ], []);

  // 표시할 데이터 가져오기
  const getDisplayData = useCallback(() => {
    switch (activeTab) {
      case 'realtime':
        return realtimeData;
      case 'crowded':
        return crowdedData;
      case 'recommended':
        return recommendedData.filter(item => item.category === selectedCategory);
      default:
        return realtimeData;
    }
  }, [activeTab, selectedCategory, realtimeData, crowdedData, recommendedData]);

  // 시간을 숫자로 변환하는 함수 (정렬용)
  const timeToMinutes = (timeLabel) => {
    if (timeLabel === '방금') return 0;
    if (timeLabel.includes('분 전')) return parseInt(timeLabel);
    if (timeLabel.includes('시간 전')) return parseInt(timeLabel) * 60;
    if (timeLabel.includes('일 전')) return parseInt(timeLabel) * 24 * 60;
    return 999999;
  };

  // 모든 데이터 로드
  const loadAllData = useCallback(async () => {
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
      
      const realtimeFormatted = posts.slice(0, 100).map((post) => ({
        id: `realtime-${post.id}`,
        images: post.images || [],
        videos: post.videos || [],
        image: post.images?.[0] || post.videos?.[0] || '',
        title: post.location,
        location: post.location,
        detailedLocation: post.detailedLocation || post.placeName || post.location,
        time: post.timeLabel || getTimeAgo(post.timestamp || post.createdAt || post.time),
        user: post.user || '여행자',
        badge: post.categoryName || '여행러버',
        category: post.category,
        categoryName: post.categoryName,
        aiLabels: post.aiLabels,
        tags: post.tags || post.aiLabels || [],
        note: post.note || post.content,
        likes: post.likes || post.likeCount || 0,
        timestamp: post.timestamp || post.createdAt || post.time,
      }));
      
      const crowdedFormatted = posts
        .filter((_, idx) => idx % 2 === 0)
        .slice(0, 80)
        .map((post) => ({
          id: `crowded-${post.id}`,
          images: post.images || [],
          videos: post.videos || [],
          image: post.images?.[0] || post.videos?.[0] || '',
          title: post.location,
          location: post.location,
          detailedLocation: post.detailedLocation || post.placeName || post.location,
          badge: '인기',
          time: post.timeLabel || getTimeAgo(post.timestamp || post.createdAt || post.time),
          user: post.user || '여행자',
          category: post.category,
          categoryName: post.categoryName,
          aiLabels: post.aiLabels,
          tags: post.tags || post.aiLabels || [],
          note: post.note || post.content,
          likes: post.likes || post.likeCount || 0,
          timestamp: post.timestamp || post.createdAt || post.time,
        }));
      
      const recommendedFormatted = posts.slice(0, 200).map((post, idx) => {
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
          id: `recommended-${post.id}`,
          images: post.images || [],
          videos: post.videos || [],
          image: post.images?.[0] || post.videos?.[0] || '',
          title: post.location,
          location: post.location,
          detailedLocation: post.detailedLocation || post.placeName || post.location,
          badge: '추천',
          category: assignedCategory,
          categoryName: post.categoryName,
          tags: post.tags || [assignedCategory],
          time: post.timeLabel || getTimeAgo(post.timestamp || post.createdAt || post.time),
          user: post.user || '여행자',
          aiLabels: post.aiLabels,
          note: post.note || post.content,
          likes: post.likes || post.likeCount || 0,
          timestamp: post.timestamp || post.createdAt || post.time,
        };
      });
      
      setRealtimeData(realtimeFormatted);
      setCrowdedData(crowdedFormatted);
      setRecommendedData(recommendedFormatted);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    }
  }, []);

  // 더 많은 아이템 로드
  const loadMoreItems = useCallback(() => {
    const baseData = getDisplayData();
    if (baseData.length === 0) {
      setDisplayedItems([]);
      return;
    }
    
    const itemsPerPage = 12;
    const startIndex = pageRef.current * itemsPerPage;
    
    if (startIndex >= baseData.length) {
      return;
    }
    
    const remainingItems = baseData.length - startIndex;
    const itemsToLoad = Math.min(itemsPerPage, remainingItems);
    
    const newItems = baseData.slice(startIndex, startIndex + itemsToLoad);
    setDisplayedItems(prev => [...prev, ...newItems]);
    pageRef.current += 1;
  }, [getDisplayData]);

  // 초기 데이터 로드
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // 탭 또는 카테고리 변경 시 스크롤 초기화
  useEffect(() => {
    pageRef.current = 0;
    setDisplayedItems([]);
    loadMoreItems();
  }, [activeTab, selectedCategory, loadMoreItems]);

  const handleItemPress = useCallback((item, index) => {
    const allPosts = getDisplayData();
    const currentIndex = allPosts.findIndex(p => p.id === item.id);
    navigation.navigate('PostDetail', {
      postId: item.id,
      post: item,
      allPosts: allPosts,
      currentPostIndex: currentIndex >= 0 ? currentIndex : 0,
    });
  }, [navigation, getDisplayData]);

  const renderPostItem = useCallback(({ item, index }) => {
    return <PostItem item={item} index={index} onPress={handleItemPress} />;
  }, [handleItemPress]);

  const currentDisplayData = useMemo(() => getDisplayData(), [getDisplayData]);

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {activeTab === 'realtime' && '실시간 정보'}
          {activeTab === 'crowded' && '실시간 밀집지역'}
          {activeTab === 'recommended' && '추천 장소'}
        </Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {/* 탭 */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              activeTab === tab.id && styles.tabActive
            ]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={[
              styles.tabText,
              activeTab === tab.id && styles.tabTextActive
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 카테고리 필터 (추천 지역 탭일 때만) */}
      {activeTab === 'recommended' && (
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
              <Text style={[
                styles.categoryButtonText,
                selectedCategory === category && styles.categoryButtonTextActive
              ]}>
                #{category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* 게시물 그리드 */}
      {displayedItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name={activeTab === 'realtime' ? 'time-outline' : activeTab === 'crowded' ? 'people-outline' : 'star-outline'}
            size={64}
            color={COLORS.textSubtle}
          />
          <Text style={styles.emptyTitle}>
            {activeTab === 'realtime' && '실시간 정보가 아직 없어요'}
            {activeTab === 'crowded' && '밀집 지역 정보가 아직 없어요'}
            {activeTab === 'recommended' && '추천 장소가 아직 없어요'}
          </Text>
          <Text style={styles.emptySubtitle}>
            첫 번째로 여행 정보를 공유하고{'\n'}다른 사용자들과 함께 만들어가요!
          </Text>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => navigation.navigate('UploadTab')}
          >
            <Text style={styles.uploadButtonText}>정보 공유하기</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={displayedItems}
          renderItem={renderPostItem}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.gridContainer}
          columnWrapperStyle={styles.gridRow}
          onEndReached={loadMoreItems}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isLoading ? (
              <View style={styles.loadingFooter}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.loadingText}>사진 불러오는 중...</Text>
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.backgroundLight,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerPlaceholder: {
    width: 40,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.backgroundLight,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.primary,
  },
  categoryFilter: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
    backgroundColor: COLORS.backgroundLight,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  categoryButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 999,
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
  gridContainer: {
    padding: SPACING.md,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  uploadButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 999,
  },
  uploadButtonText: {
    color: COLORS.backgroundLight,
    fontSize: 16,
    fontWeight: '600',
  },
  loadingFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.primary,
  },
});

// DetailScreen 전용 스타일
const detailStyles = StyleSheet.create({
  postItem: {
    width: (SCREEN_WIDTH - SPACING.md * 3) / 2,
    marginBottom: SPACING.md,
  },
  postImageContainer: {
    width: '100%',
    aspectRatio: 4 / 5,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.borderLight,
    position: 'relative',
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
  categoryIcon: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryEmoji: {
    fontSize: 24,
  },
  likeBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  likeCount: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  postTextContainer: {
    marginTop: SPACING.sm,
    gap: SPACING.xs,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  locationText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
  },
  timeText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  subLocationText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  tagsScroll: {
    marginVertical: SPACING.xs,
  },
  tagsScrollContent: {
    gap: SPACING.xs,
  },
  tagBadge: {
    backgroundColor: COLORS.primary + '10',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginRight: SPACING.xs,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.primary,
  },
  noteText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});

export default DetailScreen;

