import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
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
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/styles';

import { getTimeAgo } from '../utils/timeUtils';
import { toggleLike, isPostLiked, addComment } from '../utils/socialInteractions';
import { toggleInterestPlace, isInterestPlace } from '../utils/interestPlaces';
import { ScreenLayout, ScreenContent, ScreenHeader, ScreenBody } from '../components/ScreenLayout';
import { BADGES, getEarnedBadgesForUser } from '../utils/badgeSystem';
import { getUserLevel } from '../utils/levelSystem';

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
  const [isFavorited, setIsFavorited] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentPostIndexState, setCurrentPostIndexState] = useState(currentPostIndex || 0);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post?.likes || 0);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const [representativeBadge, setRepresentativeBadge] = useState(null);
  const [userBadges, setUserBadges] = useState([]);
  const [authorLevelInfo, setAuthorLevelInfo] = useState(null);
  
  // 하트 애니메이션 값
  const heartScale = useRef(new Animated.Value(0)).current;
  const heartOpacity = useRef(new Animated.Value(0)).current;
  const pulseScale = useRef(new Animated.Value(0)).current;
  const pulseOpacity = useRef(new Animated.Value(0)).current;
  
  // 댓글 입력창 ref
  const commentInputRef = useRef(null);
  const commentInputSectionRef = useRef(null);

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

  // 게시물 작성자 ID를 일관된 방식으로 계산 (다른 화면과 동일한 로직)
  const postAuthorId = useMemo(() => {
    if (!post) return null;
    let authorId = post.userId;
    
    if (!authorId && typeof post.user === 'string') {
      authorId = post.user;
    }
    
    if (!authorId && post.user && typeof post.user === 'object') {
      authorId = post.user.id || post.user.userId;
    }
    
    if (!authorId) {
      authorId = post.user;
    }
    
    return authorId ? String(authorId) : null;
  }, [post]);

  // 대표 뱃지 로드
  const loadRepresentativeBadge = useCallback(async (userId) => {
    if (!userId) return;
    
    try {
      const repBadgeJson = await AsyncStorage.getItem(`representativeBadge_${userId}`);
      if (repBadgeJson) {
        const repBadge = JSON.parse(repBadgeJson);
        setRepresentativeBadge(repBadge);
      } else {
        // 대표 뱃지가 없으면 임의로 설정 (실제 뱃지 시스템의 뱃지 사용)
        const availableBadges = Object.values(BADGES).map(badge => ({
          name: badge.name,
          icon: badge.icon,
          description: badge.description,
          difficulty: badge.difficulty
        }));
        
        const hash = userId.toString().split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const badgeIndex = hash % availableBadges.length;
        const mockRepBadge = availableBadges[badgeIndex];
        await AsyncStorage.setItem(`representativeBadge_${userId}`, JSON.stringify(mockRepBadge));
        setRepresentativeBadge(mockRepBadge);
      }
      
      // 사용자의 모든 뱃지 로드 (사진 상세에서는 대표 뱃지만 사용)
      const badges = await getEarnedBadgesForUser(userId);
      setUserBadges(badges || []);
      
      // 레벨 정보 로드 (작성자 기준)
      // 현재 레벨 시스템은 로컬 전체 기준이라, 작성자/뷰어 구분은 없지만
      // UI 상으로는 "작성자의 레벨"처럼 표시
      const levelInfo = await getUserLevel();
      setAuthorLevelInfo(levelInfo);
    } catch (error) {
      console.error('뱃지 로드 실패:', error);
    }
  }, []);

  // 게시물 데이터 가져오기
  const fetchPost = useCallback(async () => {
    if (!postId && !passedPost) {
      setLoading(false);
      return;
    }

    try {
      let currentPost = null;
      
      if (passedPost) {
        currentPost = passedPost;
      } else {
        // AsyncStorage에서 게시물 찾기
        const uploadedPostsJson = await AsyncStorage.getItem('uploadedPosts');
        const uploadedPosts = uploadedPostsJson ? JSON.parse(uploadedPostsJson) : [];
        currentPost = uploadedPosts.find(p => p.id === postId);
      }

      if (currentPost) {
        setPost(currentPost);
        setLiked(await isPostLiked(currentPost.id));
        setLikeCount(currentPost.likes || 0);
        setComments([...(currentPost.comments || []), ...(currentPost.qnaList || [])]);
        
        // 대표 뱃지 / 작성자 정보 로드
        const postUserId =
          currentPost.userId ||
          (typeof currentPost.user === 'string' ? currentPost.user : currentPost.user?.id) ||
          currentPost.user;
        if (postUserId) {
          await loadRepresentativeBadge(postUserId);
        }
      }
    } catch (error) {
      console.error('게시물 불러오기 실패:', error);
    } finally {
      setLoading(false);
    }
  }, [postId, passedPost, loadRepresentativeBadge]);

  // 좋아요 처리
  const handleLike = useCallback(async () => {
    if (!post) return;
    
    const wasLiked = liked;
    // 즉각적으로 UI 업데이트
    const newLikedState = !liked;
    setLiked(newLikedState);
    
    const result = await toggleLike(post.id);
    // 결과에 따라 상태 업데이트
    setLiked(result.isLiked);
    setLikeCount(result.newCount);
    
    // 좋아요를 누를 때만 애니메이션 표시 (좋아요 취소가 아닐 때)
    if (result.isLiked && !wasLiked) {
      setShowHeartAnimation(true);
      heartScale.setValue(0);
      heartOpacity.setValue(1);
      pulseScale.setValue(0);
      pulseOpacity.setValue(0.8);
      
      // 큰 하트 애니메이션: 부드럽게 나타났다가 사라짐
      Animated.parallel([
        Animated.sequence([
          Animated.spring(heartScale, {
            toValue: 1.3,
            tension: 40,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.timing(heartScale, {
            toValue: 1.0,
            duration: 150,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.delay(300),
          Animated.timing(heartOpacity, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
        // 펄스 링 애니메이션 (큰 하트 강조 효과)
        Animated.parallel([
          Animated.sequence([
            Animated.timing(pulseScale, {
              toValue: 2.5,
              duration: 600,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(pulseOpacity, {
              toValue: 0,
              duration: 600,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]).start(() => {
        setShowHeartAnimation(false);
        heartScale.setValue(0);
        heartOpacity.setValue(0);
        pulseScale.setValue(0);
        pulseOpacity.setValue(0.8);
      });
    }
  }, [post, liked, heartScale, heartOpacity, pulseScale, pulseOpacity]);

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

  // 초기 즐겨찾기 상태 확인
  useEffect(() => {
    if (post) {
      isInterestPlace(post.location || post.placeName).then(setIsFavorited);
    }
  }, [post]);

  if (loading) {
    return (
      <ScreenLayout>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </ScreenLayout>
    );
  }

  if (!post) {
    return (
      <ScreenLayout>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>게시물을 찾을 수 없습니다.</Text>
        </View>
      </ScreenLayout>
    );
  }

  const locationText = post?.location || post?.title || '여행지';
  const detailedLocationText = post?.detailedLocation || post?.placeName || null;
  // 작성자 이름을 일관된 방식으로 계산
  let userName = '여행자';
  if (post?.user) {
    if (typeof post.user === 'string') {
      userName = post.user;
    } else if (typeof post.user === 'object') {
      userName = post.user.username || post.user.name || post.user.id || '여행자';
    }
  } else if (post?.userId) {
    userName = String(post.userId);
  }
  const userBadge = post?.badge || '여행러버';
  const timeText = post?.time || (post?.timestamp ? getTimeAgo(post.timestamp) : '방금 전');
  const categoryName = post?.categoryName || null;

  return (
    <ScreenLayout>
      <ScreenContent>
      {/* 하트 애니메이션 오버레이 */}
      {showHeartAnimation && (
        <View style={styles.heartAnimationContainer} pointerEvents="none">
          {/* 펄스 링 (큰 하트 강조 효과) */}
          <Animated.View
            style={[
              styles.pulseRing,
              {
                transform: [{ scale: pulseScale }],
                opacity: pulseOpacity,
              },
            ]}
          />
          
          {/* 큰 중앙 하트 */}
          <Animated.View
            style={[
              styles.heartAnimation,
              {
                transform: [{ scale: heartScale }],
                opacity: heartOpacity,
              },
            ]}
          >
            <Ionicons name="heart" size={120} color="#ef4444" />
          </Animated.View>
        </View>
      )}

      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#181410" />
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

        {/* 스크롤 가능한 컨텐츠 - 웹과 동일한 구조 */}
        <ScreenBody>
          {/* 작성자 정보 */}
          <View style={styles.authorSection}>
            <TouchableOpacity
              style={styles.authorInfo}
              onPress={() => {
                if (postAuthorId) {
                  navigation.navigate('UserProfile', { userId: postAuthorId, username: userName });
                }
              }}
            >
              <View style={styles.avatar}>
                <Ionicons name="person" size={24} color={COLORS.textSubtle} />
              </View>
              <View style={styles.authorText}>
                <View style={styles.authorNameRow}>
                  <Text style={styles.authorName}>{userName}</Text>
                  {representativeBadge && (
                    <View style={styles.representativeBadgeInPost}>
                      <Text style={styles.representativeBadgeIconInPost}>
                        {representativeBadge.icon}
                      </Text>
                      <Text style={styles.representativeBadgeNameInPost} numberOfLines={1}>
                        {representativeBadge.name}
                      </Text>
                    </View>
                  )}
                </View>
                {/* 작성자 레벨 표시 */}
                <View style={styles.authorLevelRow}>
                  <Text style={styles.authorLevelText}>
                    {authorLevelInfo
                      ? `Lv. ${authorLevelInfo.level} ${authorLevelInfo.title}`
                      : 'Lv. 1 여행 입문자'}
                  </Text>
                </View>
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

          {/* 좋아요/관심/댓글 */}
          <View style={styles.actionsSection}>
            <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
              {liked ? (
                <Ionicons
                  name="heart"
                  size={28}
                  color="#ef4444"
                />
              ) : (
                <Ionicons
                  name="heart-outline"
                  size={28}
                  color={COLORS.text}
                />
              )}
              <Text style={styles.actionText}>{likeCount}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => {
                // 댓글 입력창으로 포커스 (스크롤은 자동으로 됨)
                setTimeout(() => {
                  commentInputRef.current?.focus();
                }, 100);
              }}
            >
              <Ionicons name="chatbubble-outline" size={28} color={COLORS.text} />
              <Text style={styles.actionText}>{comments.length}</Text>
            </TouchableOpacity>
        </View>

          {/* 댓글 섹션 */}
          {comments.length > 0 && (
            <View style={styles.commentsSection}>
              <Text style={styles.commentsTitle}>댓글 {comments.length}</Text>
              {comments.map((comment, index) => {
                const postUserId = post?.userId || 
                                  (typeof post?.user === 'string' ? post.user : post?.user?.id) ||
                                  post?.user;
                const commentUserId = comment.userId || 
                                     (typeof comment.user === 'string' ? comment.user : comment.user?.id) ||
                                     comment.user;
                const isAuthor = postUserId && commentUserId && postUserId === commentUserId;
                
                return (
                  <View key={comment.id || index} style={styles.commentItem}>
                    <View style={styles.commentAvatar}>
                      <Ionicons name="person" size={20} color={COLORS.textSubtle} />
                    </View>
                    <View style={styles.commentContent}>
                      <View style={styles.commentHeader}>
                        <Text style={styles.commentUser}>
                          {comment.user || comment.username || '익명'}
                        </Text>
                        {isAuthor && (
                          <View style={styles.authorBadgeComment}>
                            <Text style={styles.authorBadgeText}>작성자</Text>
                          </View>
                        )}
                        {comment.timestamp && (
                          <Text style={styles.commentTime}>
                            {getTimeAgo(comment.timestamp)}
                          </Text>
                        )}
                      </View>
                      <Text style={styles.commentText}>
                        {comment.content || comment.comment || comment.text}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* 댓글 입력 */}
          <View ref={commentInputSectionRef} style={styles.commentInputSection}>
            <View style={styles.commentInputContainer}>
              <TextInput
                ref={commentInputRef}
                style={styles.commentInput}
                placeholder="댓글을 입력하세요..."
                value={commentText}
                onChangeText={setCommentText}
                multiline
                placeholderTextColor={COLORS.textSecondary}
                editable={true}
                selectTextOnFocus={false}
              />
              <TouchableOpacity
                style={[styles.commentSubmitButton, !commentText.trim() && styles.commentSubmitButtonDisabled]}
                onPress={async () => {
                  if (!commentText.trim() || !post) return;
                  
                  try {
                    const userJson = await AsyncStorage.getItem('user');
                    const user = userJson ? JSON.parse(userJson) : {};
                    const username = user.username || user.name || '익명';
                    const userId = user.id;
                    
                    await addComment(post.id, commentText.trim(), username, userId);
                    
                    // 게시물 다시 로드하여 댓글 목록 업데이트
                    const uploadedPostsJson = await AsyncStorage.getItem('uploadedPosts');
                    const uploadedPosts = uploadedPostsJson ? JSON.parse(uploadedPostsJson) : [];
                    const updatedPost = uploadedPosts.find(p => p.id === post.id);
                    
                    if (updatedPost) {
                      setPost(updatedPost);
                      setComments([...(updatedPost.comments || []), ...(updatedPost.qnaList || [])]);
                    }
                    
                    setCommentText('');
                  } catch (error) {
                    console.error('댓글 추가 실패:', error);
                  }
                }}
                disabled={!commentText.trim()}
              >
                <Ionicons 
                  name="send" 
                  size={20} 
                  color={commentText.trim() ? COLORS.primary : COLORS.textSecondary} 
                />
              </TouchableOpacity>
            </View>
          </View>
        </ScreenBody>
      </View>
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
    width: 48, // size-12 = 48px (웹과 동일)
    height: 48, // size-12 = 48px (웹과 동일)
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8, // rounded-lg (웹과 동일)
  },
  content: {

    flex: 1,
  },
  mediaContainer: {
    width: SCREEN_WIDTH,
    aspectRatio: 4 / 3, // aspect-[4/3] (웹과 동일)
    position: 'relative',
    backgroundColor: 'white', // bg-white (웹과 동일)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // shadow-md (웹과 동일)
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
  authorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  authorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  representativeBadgeInPost: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    backgroundColor: COLORS.primary + '20',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  authorLevelRow: {
    marginTop: 4,
  },
  authorLevelText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  representativeBadgeIconInPost: {
    fontSize: 16,
  },
  representativeBadgeNameInPost: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
    maxWidth: 70,
  },
  authorBadge: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  userBadgesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  userBadgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: COLORS.borderLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  userBadgeItemRepresentative: {
    backgroundColor: COLORS.primary + '20',
    borderColor: COLORS.primary,
  },
  userBadgeIcon: {
    fontSize: 12,
  },
  userBadgeName: {
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.primary,
    maxWidth: 50,
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
  commentsSection: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  commentUser: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  authorBadgeComment: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  authorBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  commentTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 'auto',
  },
  commentText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  commentInputSection: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.backgroundLight,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.sm,
  },
  commentInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.background,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 14,
    color: COLORS.text,
  },
  commentSubmitButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentSubmitButtonDisabled: {
    opacity: 0.5,
  },
  heartAnimationContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    pointerEvents: 'none',
  },
  heartAnimation: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: COLORS.error,
    backgroundColor: 'transparent',
  },
});

export default PostDetailScreen;

