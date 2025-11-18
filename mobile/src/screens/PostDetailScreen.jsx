import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  PanResponder,
  Animated,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/styles';
import { getTimeAgo } from '../utils/timeUtils';
import { toggleLike, isPostLiked, addComment } from '../utils/socialInteractions';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 영어 태그를 한국어로 번역
const tagTranslations = {
  'nature': '자연', 'landscape': '풍경', 'mountain': '산', 'beach': '해변', 'forest': '숲',
  'river': '강', 'lake': '호수', 'sunset': '일몰', 'sunrise': '일출', 'sky': '하늘',
  'cloud': '구름', 'tree': '나무', 'flower': '꽃', 'cherry blossom': '벚꽃',
  'autumn': '가을', 'spring': '봄', 'summer': '여름', 'winter': '겨울', 'snow': '눈', 'rain': '비',
  'food': '음식', 'restaurant': '맛집', 'cafe': '카페', 'coffee': '커피', 'dessert': '디저트',
  'korean food': '한식', 'japanese food': '일식', 'chinese food': '중식', 'western food': '양식',
  'street food': '길거리음식', 'seafood': '해산물', 'meat': '고기', 'vegetable': '채소',
  'building': '건물', 'architecture': '건축', 'temple': '사찰', 'palace': '궁궐', 'castle': '성',
  'tower': '타워', 'bridge': '다리', 'park': '공원', 'garden': '정원', 'street': '거리',
  'alley': '골목', 'market': '시장', 'shop': '상점', 'mall': '쇼핑몰',
  'travel': '여행', 'trip': '여행', 'hiking': '등산', 'camping': '캠핑', 'picnic': '피크닉',
  'festival': '축제', 'event': '이벤트', 'concert': '공연', 'exhibition': '전시',
  'shopping': '쇼핑', 'walking': '산책', 'animal': '동물', 'dog': '강아지', 'cat': '고양이',
  'bird': '새', 'fish': '물고기', 'photo': '사진', 'photography': '사진', 'art': '예술',
  'culture': '문화', 'history': '역사', 'traditional': '전통', 'modern': '현대',
  'vintage': '빈티지', 'night': '밤', 'day': '낮', 'morning': '아침', 'evening': '저녁',
  'beautiful': '아름다운', 'pretty': '예쁜', 'cute': '귀여운', 'cool': '멋진',
  'amazing': '놀라운', 'scenic': '경치좋은'
};

const PostDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { postId, post: passedPost, allPosts, currentPostIndex } = route.params || {};

  const [post, setPost] = useState(passedPost);
  const [loading, setLoading] = useState(!passedPost);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentPostIndexState, setCurrentPostIndexState] = useState(currentPostIndex || 0);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post?.likes || 0);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // 슬라이드 가능한 게시물 목록
  const slideablePosts = useMemo(() => {
    if (allPosts && Array.isArray(allPosts) && allPosts.length > 0) {
      return allPosts;
    }
    return passedPost ? [passedPost] : [];
  }, [allPosts, passedPost]);

  // 미디어 배열 (이미지 + 동영상)
  const mediaItems = useMemo(() => {
    const images = post?.images || (post?.image ? [post.image] : []);
    const videos = post?.videos || [];
    return [...images.map(img => ({ type: 'image', url: img })), ...videos.map(vid => ({ type: 'video', url: vid }))];
  }, [post]);

  // 게시물 데이터 가져오기
  const fetchPost = useCallback(async () => {
    if (!postId && !passedPost) {
      setLoading(false);
      return;
    }

    try {
      if (passedPost) {
        setPost(passedPost);
        setLiked(await isPostLiked(passedPost.id));
        setLikeCount(passedPost.likes || 0);
        setComments([...(passedPost.comments || []), ...(passedPost.qnaList || [])]);
        setLoading(false);
        return;
      }

      // AsyncStorage에서 게시물 찾기
      const uploadedPostsJson = await AsyncStorage.getItem('uploadedPosts');
      const uploadedPosts = uploadedPostsJson ? JSON.parse(uploadedPostsJson) : [];
      const foundPost = uploadedPosts.find(p => p.id === postId);

      if (foundPost) {
        setPost(foundPost);
        setLiked(await isPostLiked(foundPost.id));
        setLikeCount(foundPost.likes || 0);
        setComments([...(foundPost.comments || []), ...(foundPost.qnaList || [])]);
      }
    } catch (error) {
      console.error('게시물 불러오기 실패:', error);
    } finally {
      setLoading(false);
    }
  }, [postId, passedPost]);

  // 좋아요 처리
  const handleLike = useCallback(async () => {
    if (!post) return;
    
    const result = await toggleLike(post.id);
    setLiked(result.isLiked);
    setLikeCount(result.newCount);
  }, [post]);

  // 이미지 스와이프
  const handleImageSwipe = useCallback((direction) => {
    const maxIndex = mediaItems.length;
    
    if (maxIndex <= 1) return;
    
    if (direction === 'left') {
      const nextIndex = currentImageIndex < maxIndex - 1 ? currentImageIndex + 1 : 0;
      setCurrentImageIndex(nextIndex);
    } else if (direction === 'right') {
      const prevIndex = currentImageIndex > 0 ? currentImageIndex - 1 : maxIndex - 1;
      setCurrentImageIndex(prevIndex);
    }
  }, [currentImageIndex, mediaItems.length]);

  // 상하 스와이프로 게시물 변경
  const changePost = useCallback(async (direction) => {
    if (!slideablePosts || slideablePosts.length === 0 || isTransitioning) return;
    
    if (slideablePosts.length === 1) return;
    
    setIsTransitioning(true);
    
    let newIndex;
    if (direction === 'up') {
      newIndex = currentPostIndexState > 0 ? currentPostIndexState - 1 : slideablePosts.length - 1;
    } else {
      newIndex = currentPostIndexState < slideablePosts.length - 1 ? currentPostIndexState + 1 : 0;
    }
    
    setCurrentPostIndexState(newIndex);
    const newPost = slideablePosts[newIndex];
    setPost(newPost);
    setCurrentImageIndex(0);
    setLiked(await isPostLiked(newPost.id));
    setLikeCount(newPost.likes || 0);
    setComments([...(newPost.comments || []), ...(newPost.qnaList || [])]);
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  }, [slideablePosts, currentPostIndexState, isTransitioning]);

  // PanResponder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        // 터치 시작
      },
      onPanResponderMove: (evt, gestureState) => {
        // 이동 중
      },
      onPanResponderRelease: (evt, gestureState) => {
        const { dx, dy } = gestureState;
        const horizontalDistance = Math.abs(dx);
        const verticalDistance = Math.abs(dy);
        
        // 상하 움직임이 좌우 움직임보다 크면 상하 스와이프
        if (verticalDistance > horizontalDistance && verticalDistance > 30) {
          if (dy > 0) {
            // 아래로 스와이프: 다음 게시물
            changePost('down');
          } else {
            // 위로 스와이프: 이전 게시물
            changePost('up');
          }
        } else if (horizontalDistance > 30) {
          // 좌우 스와이프: 이미지 간 이동
          if (dx > 0) {
            handleImageSwipe('right');
          } else {
            handleImageSwipe('left');
          }
        }
      },
    })
  ).current;

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>게시물을 찾을 수 없습니다.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const locationText = post?.location || post?.title || '여행지';
  const detailedLocationText = post?.detailedLocation || post?.placeName || null;
  const userName = post?.user || post?.userId || '여행자';
  const userBadge = post?.badge || '여행러버';
  const timeText = post?.time || (post?.timestamp ? getTimeAgo(post.timestamp) : '방금 전');
  const categoryName = post?.categoryName || null;

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
      </View>

      {/* 메인 컨텐츠 - 스와이프 가능 */}
      <View style={styles.content} {...panResponder.panHandlers}>
        {/* 이미지/비디오 영역 */}
        <View style={styles.mediaContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentOffset={{ x: currentImageIndex * SCREEN_WIDTH, y: 0 }}
            scrollEnabled={false}
          >
            {mediaItems.map((media, index) => (
              <View key={index} style={styles.mediaItem}>
                {media.type === 'video' ? (
                  <View style={styles.videoPlaceholder}>
                    <Text style={styles.videoText}>동영상 재생</Text>
                  </View>
                ) : (
                  <Image
                    source={{ uri: media.url }}
                    style={styles.mediaImage}
                    resizeMode="cover"
                  />
                )}
              </View>
            ))}
          </ScrollView>

          {/* 페이지 인디케이터 */}
          {mediaItems.length > 1 && (
            <View style={styles.indicatorContainer}>
              {mediaItems.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.indicator,
                    index === currentImageIndex && styles.indicatorActive
                  ]}
                />
              ))}
            </View>
          )}

          {/* 좌우 화살표 버튼 */}
          {mediaItems.length > 1 && (
            <>
              <TouchableOpacity
                style={[styles.arrowButton, styles.arrowLeft]}
                onPress={() => handleImageSwipe('right')}
              >
                <Ionicons name="chevron-back" size={24} color={COLORS.backgroundLight} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.arrowButton, styles.arrowRight]}
                onPress={() => handleImageSwipe('left')}
              >
                <Ionicons name="chevron-forward" size={24} color={COLORS.backgroundLight} />
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* 스크롤 가능한 컨텐츠 */}
        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* 작성자 정보 */}
          <View style={styles.authorSection}>
            <TouchableOpacity
              style={styles.authorInfo}
              onPress={() => {
                const postUserId = post?.userId;
                if (postUserId) {
                  navigation.navigate('UserProfile', { userId: postUserId });
                }
              }}
            >
              <View style={styles.avatar}>
                <Ionicons name="person" size={24} color={COLORS.textSubtle} />
              </View>
              <View style={styles.authorText}>
                <Text style={styles.authorName}>{userName}</Text>
                <Text style={styles.authorBadge}>🎖️ {userBadge}</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* 위치 정보 */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="location" size={24} color={COLORS.primary} />
              <View style={styles.infoContent}>
                <View style={styles.locationRow}>
                  <Text style={styles.locationText}>
                    {detailedLocationText || locationText}
                  </Text>
                  {categoryName && (
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryEmoji}>
                        {categoryName === '개화 상황' && '🌸'}
                        {categoryName === '맛집 정보' && '🍜'}
                        {(!categoryName || !['개화 상황', '맛집 정보'].includes(categoryName)) && '🏞️'}
                      </Text>
                      <Text style={styles.categoryText}>{categoryName}</Text>
                    </View>
                  )}
                </View>
                {detailedLocationText && detailedLocationText !== locationText && (
                  <Text style={styles.subLocationText}>{locationText}</Text>
                )}
                <View style={styles.timeRow}>
                  <Ionicons name="time-outline" size={16} color={COLORS.textSecondary} />
                  <Text style={styles.timeText}>{timeText}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* 해시태그 */}
          {((post?.tags && post.tags.length > 0) || (post?.aiLabels && post.aiLabels.length > 0)) && (
            <View style={styles.tagsSection}>
              <Ionicons name="pricetag" size={24} color={COLORS.primary} />
              <View style={styles.tagsContainer}>
                {(post.tags || []).map((tag, index) => {
                  const tagText = typeof tag === 'string' ? tag.replace('#', '') : tag.name || '태그';
                  const koreanTag = tagTranslations[tagText.toLowerCase()] || tagText;
                  return (
                    <View key={`tag-${index}`} style={styles.tag}>
                      <Text style={styles.tagText}>#{koreanTag}</Text>
                    </View>
                  );
                })}
                {(post.aiLabels || []).map((label, index) => {
                  const labelText = typeof label === 'string' ? label : (label?.name || label?.label || String(label || ''));
                  const koreanLabel = labelText && typeof labelText === 'string' 
                    ? (tagTranslations[labelText.toLowerCase()] || labelText)
                    : String(labelText || '');
                  return (
                    <View key={`ai-${index}`} style={styles.tag}>
                      <Text style={styles.tagText}>#{koreanLabel}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* 내용 */}
          {post?.note && (
            <View style={styles.noteSection}>
              <Text style={styles.noteText}>{post.note}</Text>
            </View>
          )}

          {/* 좋아요/댓글 */}
          <View style={styles.actionsSection}>
            <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
              <Ionicons
                name={liked ? 'heart' : 'heart-outline'}
                size={28}
                color={liked ? COLORS.error : COLORS.text}
              />
              <Text style={styles.actionText}>{likeCount}</Text>
            </TouchableOpacity>
            <View style={styles.actionButton}>
              <Ionicons name="chatbubble-outline" size={28} color={COLORS.text} />
              <Text style={styles.actionText}>{comments.length}</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
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
  errorText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  header: {
    flexDirection: 'row',
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
  content: {
    flex: 1,
  },
  mediaContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.75,
    position: 'relative',
  },
  mediaItem: {
    width: SCREEN_WIDTH,
    height: '100%',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  indicatorContainer: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  indicatorActive: {
    width: 24,
    backgroundColor: COLORS.backgroundLight,
  },
  arrowButton: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -20 }],
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowLeft: {
    left: 12,
  },
  arrowRight: {
    right: 12,
  },
  scrollContent: {
    flex: 1,
  },
  authorSection: {
    padding: SPACING.md,
    backgroundColor: COLORS.backgroundLight,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorText: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  authorBadge: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  infoCard: {
    margin: SPACING.md,
    padding: SPACING.lg,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  infoContent: {
    flex: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  locationText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  categoryEmoji: {
    fontSize: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.backgroundLight,
  },
  subLocationText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: SPACING.xs,
  },
  timeText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  tagsSection: {
    flexDirection: 'row',
    gap: SPACING.md,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  tagsContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  tag: {
    backgroundColor: COLORS.primary + '10',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  noteSection: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.md,
  },
  noteText: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.text,
  },
  actionsSection: {
    flexDirection: 'row',
    gap: SPACING.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
});

export default PostDetailScreen;
