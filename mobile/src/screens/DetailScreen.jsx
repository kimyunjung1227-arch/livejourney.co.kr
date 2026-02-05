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
import { ScreenLayout, ScreenContent, ScreenHeader, ScreenBody } from '../components/ScreenLayout';

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

  useEffect(() => {
    if (filter) {
      setActiveTab(filter);
    }
  }, [filter]);
  const [selectedCategory, setSelectedCategory] = useState('자연');
  const [displayedItems, setDisplayedItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const pageRef = useRef(0);

  const [realtimeData, setRealtimeData] = useState([]);
  const [crowdedData, setCrowdedData] = useState([]);
  const [recommendedData, setRecommendedData] = useState([]);
  const [currentUserCount, setCurrentUserCount] = useState(0);

  const categories = useMemo(() => ['자연', '힐링', '액티비티', '맛집', '카페'], []);

  const tabs = useMemo(() => [
    { id: 'realtime', label: '지금 여기는!' },
    { id: 'crowded', label: '지금 사람 많은 곳!' },
    { id: 'recommended', label: '추천 장소' }
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

      // 현재 사용자 수 계산 (최근 2일 이내 게시물을 올린 고유 사용자 수)
      const uniqueUserIds = new Set();
      posts.forEach(post => {
        const userId = post.userId ||
          (typeof post.user === 'string' ? post.user : post.user?.id) ||
          post.user;
        if (userId) {
          uniqueUserIds.add(String(userId));
        }
      });
      const userCount = uniqueUserIds.size;
      setCurrentUserCount(userCount);

      if (posts.length === 0) {
        setRealtimeData([]);
        setCrowdedData([]);
        setRecommendedData([]);
        setCurrentUserCount(0);
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
    <ScreenLayout>
      <ScreenContent>
        {/* 헤더 - 웹과 동일한 구조 */}
        <ScreenHeader>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.textPrimaryLight} />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>
                {activeTab === 'realtime' && '지금 여기는!'}
                {activeTab === 'crowded' && '지금 사람 많은 곳!'}
                {activeTab === 'recommended' && '추천 장소'}
              </Text>
              {activeTab === 'realtime' && currentUserCount > 0 && (
                <Text style={styles.headerSubtitle}>
                  현재 {currentUserCount}명이 활동 중
                </Text>
              )}
            </View>
            <View style={styles.headerPlaceholder} />
          </View>
        </ScreenHeader>

        {/* 메인 컨텐츠 - 웹과 동일한 구조 */}
        <ScreenBody>

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
                {activeTab === 'realtime' && '아직 지금 이곳의 모습이 올라오지 않았어요'}
                {activeTab === 'crowded' && '아직 어디가 붐비는지 정보가 없어요'}
                {activeTab === 'recommended' && '추천 장소가 아직 없어요'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'realtime' && '지금 보고 있는 장소와 분위기, 날씨가 보이도록 한 장만 남겨 주세요'}
                {activeTab === 'crowded' && '지금 있는 곳의 상황과 느낌을 남겨 주면 다른 사람들의 선택에 도움이 돼요'}
                {activeTab === 'recommended' && '첫 번째로 추천 장소를 공유해보세요!'}
              </Text>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={() => navigation.navigate('UploadTab')}
              >
                <Ionicons name="add-circle" size={20} color="white" />
                <Text style={styles.uploadButtonText}>첫 사진 올리기</Text>
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
        </ScreenBody>
      </ScreenContent>
    </ScreenLayout>
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
    paddingHorizontal: SPACING.md, // p-4
    paddingVertical: SPACING.md, // p-4
    backgroundColor: COLORS.backgroundLight, // bg-white
    borderBottomWidth: 1,
    borderBottomColor: '#E4E4E7', // border-zinc-200
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  backButton: {
    width: 40, // size-10 = 40px
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8, // rounded-lg
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22, // text-[22px] (웹과 동일)
    fontWeight: 'bold',
    color: COLORS.text, // text-text-primary-light (웹과 동일)
    letterSpacing: -0.33, // tracking-[-0.015em] = -0.33px (웹과 동일)
    lineHeight: 26.4, // leading-tight (웹과 동일)
  },
  headerSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  headerPlaceholder: {
    width: 40, // w-10 = 40px
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E4E4E7', // border-zinc-200
    backgroundColor: COLORS.backgroundLight,
    paddingHorizontal: SPACING.md,
  },
  tab: {
    flex: 1,
    flexDirection: 'column', // flex flex-col (웹과 동일)
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: SPACING.sm, // pt-2 = 8px (웹과 동일)
    paddingBottom: 13, // pb-[13px] = 13px (웹과 동일)
    paddingHorizontal: SPACING.sm, // px-2 = 8px (웹과 동일)
    borderBottomWidth: 3, // border-b-[3px] (웹과 동일)
    borderBottomColor: 'transparent', // border-b-transparent (비활성화, 웹과 동일)
  },
  tabActive: {
    borderBottomColor: COLORS.primary, // border-b-primary (웹과 동일)
  },
  tabText: {
    fontSize: 14, // text-sm = 14px (웹과 동일)
    fontWeight: 'bold',
    color: COLORS.textSubtle, // text-text-subtle-light (비활성화, 웹과 동일)
    letterSpacing: 0.21, // tracking-[0.015em] = 0.21px (웹과 동일)
    lineHeight: 20, // leading-normal (웹과 동일)
  },
  tabTextActive: {
    color: COLORS.primary, // text-primary (웹과 동일)
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
    paddingHorizontal: SPACING.md, // px-4
    paddingVertical: SPACING.sm, // py-2
    borderRadius: 999, // rounded-full
    backgroundColor: COLORS.borderLight, // bg-card-light
    marginRight: SPACING.sm, // gap-2
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)', // ring-1 ring-inset ring-black/10
  },
  categoryButtonActive: {
    backgroundColor: COLORS.primary, // bg-primary
    borderColor: 'transparent',
  },
  categoryButtonText: {
    fontSize: 14, // text-sm
    fontWeight: '600', // font-semibold
    color: COLORS.text, // text-text-light
  },
  categoryButtonTextActive: {
    color: COLORS.backgroundLight, // text-white
  },
  gridContainer: {
    padding: SPACING.md, // p-4 = 16px
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 0, // gap-4는 각 아이템의 marginBottom으로 처리
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyTitle: {
    fontSize: 16, // text-base = 16px (웹과 동일)
    fontWeight: '500', // font-medium (웹과 동일)
    color: '#6B7280', // text-gray-500 (웹과 동일)
    marginTop: SPACING.md, // mb-4 = 16px (웹과 동일)
    marginBottom: SPACING.sm, // mb-2 = 8px (웹과 동일)
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14, // text-sm = 14px (웹과 동일)
    color: '#9CA3AF', // text-gray-400 (웹과 동일)
    textAlign: 'center',
    marginBottom: SPACING.md, // mb-4 = 16px (웹과 동일)
    maxWidth: 320, // max-w-xs = 320px (웹과 동일)
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm, // gap-2 = 8px (웹과 동일)
    backgroundColor: COLORS.primary, // bg-primary (웹과 동일)
    paddingHorizontal: SPACING.lg, // px-6 = 24px (웹과 동일)
    paddingVertical: 12, // py-3 = 12px (웹과 동일)
    borderRadius: 999, // rounded-full (웹과 동일)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5, // shadow-lg (웹과 동일)
  },
  uploadButtonText: {
    color: 'white', // text-white (웹과 동일)
    fontSize: 16, // text-base = 16px (웹과 동일)
    fontWeight: '600', // font-semibold (웹과 동일)
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
    marginBottom: SPACING.md, // gap-4 = 16px
  },
  postImageContainer: {
    width: '100%',
    aspectRatio: 4 / 5, // aspect-[4/5]
    borderRadius: 12, // rounded-lg
    overflow: 'hidden',
    marginBottom: 12, // mb-3 = 12px
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
  likeBadge: {
    position: 'absolute',
    bottom: 12, // bottom-3 = 12px (웹과 동일)
    right: 12, // right-3 = 12px (웹과 동일)
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4, // gap-1 = 4px (웹과 동일)
    backgroundColor: 'rgba(255,255,255,0.9)', // bg-white/90 backdrop-blur-sm (웹과 동일)
    paddingHorizontal: 12, // px-3 = 12px (웹과 동일)
    paddingVertical: 6, // py-1.5 = 6px (웹과 동일)
    borderRadius: 999, // rounded-full (웹과 동일)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // shadow-md (웹과 동일)
  },
  likeCount: {
    fontSize: 14, // text-sm = 14px (웹과 동일)
    fontWeight: '600', // font-semibold (웹과 동일)
    color: '#374151', // text-gray-700 (웹과 동일)
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
    fontSize: 16, // text-base = 16px
    fontWeight: 'bold',
    color: COLORS.text, // text-text-primary-light
    flex: 1,
  },
  timeText: {
    fontSize: 12, // text-xs = 12px
    color: COLORS.textSecondary, // text-text-secondary-light
  },
  subLocationText: {
    fontSize: 14, // text-sm = 14px
    color: COLORS.textSecondary, // text-text-secondary-light
    marginTop: 2, // mt-0.5 = 2px
  },
  tagsScroll: {
    marginVertical: SPACING.xs,
  },
  tagsScrollContent: {
    gap: SPACING.xs,
  },
  tagBadge: {
    backgroundColor: COLORS.primary + '1A', // bg-primary/10
    paddingHorizontal: 10, // px-2.5 = 10px
    paddingVertical: 4, // py-1 = 4px
    borderRadius: 999, // rounded-full
    marginRight: 6, // gap-1.5 = 6px
  },
  tagText: {
    fontSize: 12, // text-xs
    fontWeight: '500', // font-medium
    color: COLORS.primary, // text-primary
  },
  noteText: {
    fontSize: 14, // text-sm = 14px
    color: COLORS.textSecondary, // text-text-secondary-light
    lineHeight: 20, // line-clamp-2 (대략 2줄)
  },
});

export default DetailScreen;

