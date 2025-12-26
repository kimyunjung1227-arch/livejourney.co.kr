import React, { useState, useEffect, useCallback } from 'react';
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
import { toggleInterestPlace, isInterestPlace } from '../utils/interestPlaces';
import { ScreenLayout, ScreenContent, ScreenHeader, ScreenBody } from '../components/ScreenLayout';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// PostItem 컴포넌트 (RegionDetailScreen 전용)
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
      style={regionStyles.postItem}
      onPress={() => onPress(item, index)}
      activeOpacity={0.9}
    >
      {/* 이미지 */}
      <View style={regionStyles.postImageContainer}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={regionStyles.postImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[regionStyles.postImage, regionStyles.postImagePlaceholder]}>
            <Ionicons name="image-outline" size={32} color={COLORS.textSubtle} />
          </View>
        )}

        {/* 우측 하단 하트 아이콘 */}
        <View style={regionStyles.likeBadge}>
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={16}
            color={isLiked ? COLORS.error : COLORS.text}
          />
          <Text style={regionStyles.likeCount}>{likeCount}</Text>
        </View>
      </View>

      {/* 이미지 밖 하단 텍스트 */}
      <View style={regionStyles.postTextContainer}>
        <View style={regionStyles.locationRow}>
          <Text style={regionStyles.locationText} numberOfLines={1}>
            {item.detailedLocation || item.placeName || item.location || '여행지'}
          </Text>
          {item.time && (
            <Text style={regionStyles.timeText}>{item.time}</Text>
          )}
        </View>
        {item.detailedLocation && item.detailedLocation !== item.location && (
          <Text style={regionStyles.subLocationText} numberOfLines={1}>
            {item.location}
          </Text>
        )}
        {item.tags && item.tags.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={regionStyles.tagsScroll}
            contentContainerStyle={regionStyles.tagsScrollContent}
          >
            {item.tags.slice(0, 5).map((tag, tagIndex) => (
              <View key={tagIndex} style={regionStyles.tagBadge}>
                <Text style={regionStyles.tagText}>
                  #{typeof tag === 'string' ? tag.replace('#', '') : tag}
                </Text>
              </View>
            ))}
          </ScrollView>
        )}
        {item.note && (
          <Text style={regionStyles.noteText} numberOfLines={2}>
            {item.note}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const RegionDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { regionName, focusLocation } = route.params || {};
  const region = route.params?.region || { name: regionName || '서울' };

  const [realtimePhotos, setRealtimePhotos] = useState([]);
  const [bloomPhotos, setBloomPhotos] = useState([]);
  const [touristSpots, setTouristSpots] = useState([]);
  const [foodPhotos, setFoodPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isInterest, setIsInterest] = useState(false);

  // 시간을 숫자로 변환하는 함수 (정렬용)
  const timeToMinutes = useCallback((timeLabel) => {
    if (timeLabel === '방금') return 0;
    if (timeLabel.includes('분 전')) return parseInt(timeLabel);
    if (timeLabel.includes('시간 전')) return parseInt(timeLabel) * 60;
    if (timeLabel.includes('일 전')) return parseInt(timeLabel) * 24 * 60;
    return 999999;
  }, []);

  // 지역 데이터 로드
  const loadRegionData = useCallback(async () => {
    try {
      setLoading(true);
      const uploadedPostsJson = await AsyncStorage.getItem('uploadedPosts');
      let uploadedPosts = uploadedPostsJson ? JSON.parse(uploadedPostsJson) : [];
      
      // 2일 이상 된 게시물 필터링
      uploadedPosts = filterRecentPosts(uploadedPosts, 2);
      
      let regionPosts = uploadedPosts
        .filter(post => post.location?.includes(region.name) || post.location === region.name);

      // 매거진 등에서 상세 위치(focusLocation)가 넘어온 경우, 해당 위치 중심으로 한 번 더 필터링
      if (focusLocation) {
        const focus = focusLocation.toLowerCase();
        regionPosts = regionPosts.filter(post => {
          const detailed = (post.detailedLocation || post.placeName || '').toLowerCase();
          const locText = (post.location || '').toLowerCase();
          return detailed.includes(focus) || locText.includes(focus);
        });
        console.log(`🎯 상세 위치 필터 적용: ${focusLocation} → ${regionPosts.length}개 게시물`);
      }

      regionPosts = regionPosts
        .sort((a, b) => {
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
          time: post.timeLabel || getTimeAgo(post.timestamp || post.createdAt || post.time),
          timeLabel: post.timeLabel || getTimeAgo(post.timestamp || post.createdAt || post.time),
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
          time: post.timeLabel || getTimeAgo(post.timestamp || post.createdAt || post.time),
          timeLabel: post.timeLabel || getTimeAgo(post.timestamp || post.createdAt || post.time),
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
          time: post.timeLabel || getTimeAgo(post.timestamp || post.createdAt || post.time),
          timeLabel: post.timeLabel || getTimeAgo(post.timestamp || post.createdAt || post.time),
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
          time: post.timeLabel || getTimeAgo(post.timestamp || post.createdAt || post.time),
          timeLabel: post.timeLabel || getTimeAgo(post.timestamp || post.createdAt || post.time),
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
    } catch (error) {
      console.error('지역 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  }, [region.name, timeToMinutes]);

  useEffect(() => {
    loadRegionData();
  }, [loadRegionData]);

  const handlePostPress = (post, index, allPosts) => {
    navigation.navigate('PostDetail', {
      postId: post.id,
      post: post,
      allPosts: allPosts,
      currentPostIndex: index,
    });
  };

  const renderSection = (title, data, sectionType) => {
    if (data.length === 0) {
      return (
        <View style={styles.emptySection}>
          <Ionicons name="images-outline" size={48} color={COLORS.textSubtle} />
          <Text style={styles.emptyText}>
            {sectionType === 'realtime' && `${region.name}의 실시간 정보가 없어요`}
            {sectionType === 'spots' && '추천 장소가 아직 없어요'}
            {sectionType === 'bloom' && '개화 정보가 아직 없어요'}
            {sectionType === 'food' && '맛집 정보가 아직 없어요'}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {data.length > 6 && (
            <TouchableOpacity
              onPress={() => {
                navigation.navigate('RegionCategory', {
                  regionName: region.name,
                  type: sectionType,
                });
              }}
            >
              <Text style={styles.moreButton}>더보기</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.gridContainer}>
          {data.map((item, index) => (
            <PostItem
              key={item.id || index}
              item={item}
              index={index}
              onPress={(item, idx) => handlePostPress(item, idx, data)}
            />
          ))}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <ScreenLayout>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>로딩 중...</Text>
        </View>
      </ScreenLayout>
    );
  }

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
            <Text style={styles.headerTitle}>{region.name}</Text>
            <View style={styles.headerPlaceholder} />
          </View>
        </ScreenHeader>

        {/* 메인 컨텐츠 - 웹과 동일한 구조 */}
        <ScreenBody>
        {/* 날씨/교통 정보 */}
        <View style={styles.infoBar}>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>☀️</Text>
            <Text style={styles.infoText}>맑음, 27℃</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>🚗</Text>
            <Text style={styles.infoText}>교통 원활</Text>
          </View>
        </View>

        {/* 현장 실시간 정보 */}
        {renderSection('현장 실시간 정보', realtimePhotos, 'realtime')}

        {/* 가볼만한곳 */}
        {renderSection(`🏞️ ${region.name} 가볼만한곳`, touristSpots, 'spots')}

        {/* 개화 상황 */}
        {renderSection('🌸 개화 상황', bloomPhotos, 'bloom')}

        {/* 맛집 정보 */}
        {renderSection('🍜 맛집 정보', foodPhotos, 'food')}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md, // p-4
    paddingTop: SPACING.md, // p-4
    paddingBottom: 12, // pb-3 = 12px
    backgroundColor: COLORS.backgroundLight, // bg-white
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB', // border-gray-200
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  backButton: {
    width: 48, // size-12 = 48px
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8, // rounded-lg
  },
  headerTitle: {
    fontSize: 18, // text-lg = 18px
    fontWeight: 'bold',
    color: COLORS.text, // text-content-light
    letterSpacing: -0.27, // tracking-[-0.015em] = -0.27px
    lineHeight: 21.6, // leading-tight
    flex: 1,
    textAlign: 'center',
  },
  headerPlaceholder: {
    width: 48, // w-12 = 48px
  },
  scrollView: {
    flex: 1,
  },
  infoBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    paddingTop: SPACING.lg,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoIcon: {
    fontSize: 16,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
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
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.md,
    justifyContent: 'space-between',
  },
  emptySection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.md,
  },
  emptyText: {
    marginTop: SPACING.md,
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

// RegionDetailScreen 전용 스타일
const regionStyles = StyleSheet.create({
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
    bottom: 12, // bottom-3 = 12px
    right: 12, // right-3 = 12px
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4, // gap-1 = 4px
    backgroundColor: 'rgba(255,255,255,0.9)', // bg-white/90
    paddingHorizontal: 12, // px-3 = 12px
    paddingVertical: 6, // py-1.5 = 6px
    borderRadius: 999, // rounded-full
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, // shadow-md
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
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});

export default RegionDetailScreen;
