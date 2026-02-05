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
import { useAuth } from '../contexts/AuthContext';
import { follow, unfollow, isFollowing } from '../utils/followSystem';

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
  const { user } = useAuth();
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
  const [isFollowAuthor, setIsFollowAuthor] = useState(false);

  // 하트 애니메이션 값
  const heartScale = useRef(new Animated.Value(0)).current;
  const heartOpacity = useRef(new Animated.Value(0)).current;
  const pulseScale = useRef(new Animated.Value(0)).current;
  const pulseOpacity = useRef(new Animated.Value(0)).current;

  // 댓글 입력창 ref
  const commentInputRef = useRef(null);
  const commentInputSectionRef = useRef(null);

  // 슬라이드 가능한 게시물 목록 (allPosts가 없으면 AsyncStorage에서 로드)
  const [loadedAllPosts, setLoadedAllPosts] = useState(null);

  useEffect(() => {
    const loadAllPostsFromStorage = async () => {
      if (!allPosts || !Array.isArray(allPosts) || allPosts.length === 0) {
        try {
          const uploadedPostsJson = await AsyncStorage.getItem('uploadedPosts');
          const uploadedPosts = uploadedPostsJson ? JSON.parse(uploadedPostsJson) : [];
          if (uploadedPosts.length > 0) {
            setLoadedAllPosts(uploadedPosts);

            // 현재 게시물의 인덱스 찾기
            const currentPostId = passedPost?.id || postId;
            if (currentPostId) {
              const foundIndex = uploadedPosts.findIndex(p => p.id === currentPostId);
              if (foundIndex >= 0) {
                setCurrentPostIndexState(foundIndex);
              }
            }
          }
        } catch (error) {
          console.error('게시물 목록 로드 실패:', error);
        }
      }
    };
    loadAllPostsFromStorage();
  }, [allPosts, passedPost, postId]);

  const slideablePosts = useMemo(() => {
    if (allPosts && Array.isArray(allPosts) && allPosts.length > 0) {
      return allPosts;
    }
    if (loadedAllPosts && Array.isArray(loadedAllPosts) && loadedAllPosts.length > 0) {
      return loadedAllPosts;
    }
    return passedPost ? [passedPost] : [];
  }, [allPosts, loadedAllPosts, passedPost]);

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
      const levelInfo = await getUserLevel(userId);
      setAuthorLevelInfo(levelInfo);
    } catch (error) {
      console.error('뱃지 로드 실패:', error);
    }
  }, []);

  // 댓글 삭제 처리
  const handleDeleteComment = async (commentId) => {
    try {
      const postsJson = await AsyncStorage.getItem('uploadedPosts');
      const posts = postsJson ? JSON.parse(postsJson) : [];

      const updatedPosts = posts.map(p => {
        if (p.id === post.id) {
          return {
            ...p,
            comments: (p.comments || []).filter(c => c.id !== commentId)
          };
        }
        return p;
      });

      await AsyncStorage.setItem('uploadedPosts', JSON.stringify(updatedPosts));

      const updatedPost = updatedPosts.find(p => p.id === post.id);
      if (updatedPost) {
        setPost(updatedPost);
        setComments(updatedPost.comments || []);
      }
    } catch (error) {
      console.error('댓글 삭제 실패:', error);
    }
  };

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

  // 게시물 변경 (상하/좌우 스와이프 모두 지원)
  const changePost = useCallback(async (direction) => {
    if (!slideablePosts || slideablePosts.length === 0 || isTransitioning) {
      console.log('게시물 변경 불가:', { slideablePostsLength: slideablePosts?.length, isTransitioning });
      return;
    }

    if (slideablePosts.length === 1) {
      console.log('게시물이 1개뿐이므로 변경 불가');
      return;
    }

    setIsTransitioning(true);

    let newIndex;
    if (direction === 'up' || direction === 'left') {
      // 위로 또는 왼쪽으로: 이전 게시물
      newIndex = currentPostIndexState > 0 ? currentPostIndexState - 1 : slideablePosts.length - 1;
    } else {
      // 아래로 또는 오른쪽으로: 다음 게시물
      newIndex = currentPostIndexState < slideablePosts.length - 1 ? currentPostIndexState + 1 : 0;
    }

    console.log('게시물 변경:', { direction, currentIndex: currentPostIndexState, newIndex, totalPosts: slideablePosts.length });

    setCurrentPostIndexState(newIndex);
    const newPost = slideablePosts[newIndex];

    if (!newPost) {
      console.error('새 게시물을 찾을 수 없습니다:', newIndex);
      setIsTransitioning(false);
      return;
    }

    setPost(newPost);
    setCurrentImageIndex(0);
    setLiked(await isPostLiked(newPost.id));
    setLikeCount(newPost.likes || 0);
    setComments([...(newPost.comments || []), ...(newPost.qnaList || [])]);

    // 대표 뱃지 / 작성자 정보 로드
    const postUserId =
      newPost.userId ||
      (typeof newPost.user === 'string' ? newPost.user : newPost.user?.id) ||
      newPost.user;
    if (postUserId) {
      await loadRepresentativeBadge(postUserId);
    }

    // 즐겨찾기 상태 업데이트
    isInterestPlace(newPost.location || newPost.placeName).then(setIsFavorited);

    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  }, [slideablePosts, currentPostIndexState, isTransitioning, loadRepresentativeBadge]);

  // 이미지 영역용 PanResponder (이미지 간 이동 또는 게시물 간 이동)
  const imagePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false, // 이미지 영역은 터치를 가로채지 않음
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // 이미지가 여러 개일 때만 이미지 영역에서 처리
        return mediaItems.length > 1 && Math.abs(gestureState.dx) > 5;
      },
      onPanResponderRelease: (evt, gestureState) => {
        const { dx } = gestureState;
        const horizontalDistance = Math.abs(dx);

        if (horizontalDistance > 30 && mediaItems.length > 1) {
          // 이미지가 여러 개일 때만 이미지 간 이동
          if (dx > 0) {
            handleImageSwipe('right');
          } else {
            handleImageSwipe('left');
          }
        }
      },
    })
  ).current;

  // 전체 화면용 PanResponder (게시물 간 이동)
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

        console.log('스와이프 감지:', {
          dx,
          dy,
          horizontalDistance,
          verticalDistance,
          slideablePostsLength: slideablePosts.length,
          mediaItemsLength: mediaItems.length
        });

        // 좌우 움직임이 상하 움직임보다 크면 좌우 스와이프 (게시물 간 이동)
        // 임계값을 낮춰서 더 민감하게 반응하도록 (40 -> 30)
        if (horizontalDistance > verticalDistance && horizontalDistance > 30) {
          console.log('좌우 스와이프 감지 - 게시물 간 이동');
          if (dx > 0) {
            // 오른쪽으로 스와이프: 이전 게시물
            console.log('이전 게시물로 이동');
            changePost('left');
          } else {
            // 왼쪽으로 스와이프: 다음 게시물
            console.log('다음 게시물로 이동');
            changePost('right');
          }
        } else if (verticalDistance > horizontalDistance && verticalDistance > 30) {
          // 상하 스와이프: 게시물 간 이동 (기존 기능 유지)
          console.log('상하 스와이프 감지 - 게시물 간 이동');
          if (dy > 0) {
            // 아래로 스와이프: 다음 게시물
            changePost('down');
          } else {
            // 위로 스와이프: 이전 게시물
            changePost('up');
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

  // 팔로우 상태 확인
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (postAuthorId && user?.id && postAuthorId !== user.id) {
        const following = await isFollowing(user.id, postAuthorId);
        setIsFollowAuthor(following);
      }
    };
    checkFollowStatus();
  }, [postAuthorId, user?.id]);

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
    <ScreenLayout style={{ backgroundColor: COLORS.backgroundLight }}>
      <ScreenContent style={{ backgroundColor: COLORS.backgroundLight }}>
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

        {/* 헤더 - absolute로 이미지 위에 오버레이 (웹과 동일) */}
        <View style={styles.headerAbsolute} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.backButtonAbsolute}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>
        </View>

        {/* 메인 컨텐츠 - 스와이프 가능 */}
        <View style={styles.content} {...panResponder.panHandlers}>
          {/* 게시물 간 이동 가이드 화살표 (가벼운 스타일) */}
          {slideablePosts.length > 1 && (
            <>
              <View style={styles.postNavArrowLeft} pointerEvents="none">
                <Ionicons name="chevron-back" size={16} color="rgba(255,255,255,0.25)" />
              </View>
              <View style={styles.postNavArrowRight} pointerEvents="none">
                <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.25)" />
              </View>
            </>
          )}

          {/* 이미지/비디오 영역 - 웹과 동일한 55vh 높이 */}
          <View style={styles.mediaContainer}>
            <FlatList
              data={mediaItems}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(_, index) => index.toString()}
              onScroll={(e) => {
                const offset = e.nativeEvent.contentOffset.x;
                const index = Math.round(offset / SCREEN_WIDTH);
                setCurrentImageIndex(index);
              }}
              renderItem={({ item: media }) => (
                <View style={styles.mediaItem}>
                  {media.type === 'video' ? (
                    <View style={styles.videoPlaceholder}>
                      <Ionicons name="play-circle" size={64} color="white" />
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
              )}
            />

            {/* 페이지 인디케이터 - 웹과 동일한 스타일 */}
            {mediaItems.length > 1 && (
              <View style={styles.indicatorContainer}>
                {mediaItems.map((_, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => {
                      // FlatList scrollToIndex는 복잡하므로 간단히 인덱스만 업데이트
                      setCurrentImageIndex(index);
                    }}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.indicator,
                        index === currentImageIndex && styles.indicatorActive
                      ]}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* 좌우 화살표 버튼 - 웹과 동일한 검정 원형 배경 */}
            {mediaItems.length > 1 && (
              <>
                <TouchableOpacity
                  style={styles.arrowButtonLeft}
                  onPress={() => handleImageSwipe('right')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.arrowButtonRight}
                  onPress={() => handleImageSwipe('left')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* 게시물 간 이동 가이드 화살표 (가벼운 스타일) */}
          {slideablePosts.length > 1 && (
            <>
              <View style={styles.postNavArrowLeft} pointerEvents="none">
                <Ionicons name="chevron-back" size={18} color="rgba(255,255,255,0.3)" />
              </View>
              <View style={styles.postNavArrowRight} pointerEvents="none">
                <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.3)" />
              </View>
            </>
          )}

          {/* 스크롤 가능한 컨텐츠 - 웹과 동일한 구조 */}
          <ScreenBody style={{ backgroundColor: '#F9FAFB' }}>
            {/* 작성자 정보 - 웹과 동일: px-4 pt-3 pb-2 bg-white */}
            <View style={styles.authorSection}>
              <View style={styles.authorInfoRow}>
                <TouchableOpacity
                  style={styles.authorInfo}
                  onPress={() => {
                    if (postAuthorId) {
                      navigation.navigate('UserProfile', { userId: postAuthorId, username: userName });
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <Image
                    source={{ uri: post?.userAvatar || `https://i.pravatar.cc/150?u=${userName}` }}
                    style={styles.avatar}
                  />
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
                      <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                    </View>
                    {/* 작성자 레벨 표시 */}
                    <Text style={styles.authorLevelText}>
                      {authorLevelInfo
                        ? `Lv. ${authorLevelInfo.level} ${authorLevelInfo.title}`
                        : 'Lv. 1 여행 입문자'}
                    </Text>
                  </View>
                </TouchableOpacity>
                {/* 팔로우 버튼 - 웹과 동일 */}
                {postAuthorId && user?.id && postAuthorId !== user.id && (
                  <TouchableOpacity
                    style={[
                      styles.followButton,
                      isFollowAuthor && styles.followButtonActive
                    ]}
                    onPress={async () => {
                      if (isFollowAuthor) {
                        await unfollow(user.id, postAuthorId);
                        setIsFollowAuthor(false);
                      } else {
                        await follow(user.id, postAuthorId);
                        setIsFollowAuthor(true);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.followButtonText,
                      isFollowAuthor && styles.followButtonTextActive
                    ]}>
                      {isFollowAuthor ? '팔로잉' : '팔로우'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* 통합 정보 카드 - 웹과 동일: mx-4 mt-2 mb-3 bg-white rounded-2xl shadow-lg */}
            <View style={styles.infoCard}>
              {/* 📍 위치 정보 */}
              <View style={styles.infoRow}>
                <Ionicons name="location" size={24} color={COLORS.primary} style={styles.infoIcon} />
                <View style={styles.infoContent}>
                  <View style={styles.locationContainer}>
                    <Text style={styles.locationText}>
                      {detailedLocationText || locationText}
                    </Text>
                    {categoryName && (
                      <View style={styles.categoryBadge}>
                        <Text style={styles.categoryEmoji}>
                          {categoryName.includes('개화') && '🌸'}
                          {categoryName.includes('맛집') && '🍜'}
                          {!categoryName.includes('개화') && !categoryName.includes('맛집') && '🏞️'}
                        </Text>
                        <Text style={styles.categoryText}>{categoryName}</Text>
                      </View>
                    )}
                  </View>
                  {detailedLocationText && detailedLocationText !== locationText && (
                    <Text style={styles.subLocationText}>{locationText}</Text>
                  )}
                  <View style={styles.timeRow}>
                    <Ionicons name="time-outline" size={18} color="#6B7280" />
                    <Text style={styles.timeText}>{timeText}</Text>
                  </View>
                </View>
              </View>

              {/* 🏷️ 해시태그 */}
              {(() => {
                const getText = (t) => (typeof t === 'string' ? (t || '').replace(/^#+/, '').trim() : String(t?.name ?? t?.label ?? '').replace(/^#+/, '').trim());
                const seen = new Set();
                const merged = [];
                [...(post?.tags || []), ...(post?.aiLabels || [])].forEach((t) => {
                  const k = getText(t).toLowerCase();
                  if (!k || seen.has(k)) return;
                  seen.add(k);
                  merged.push(getText(t));
                });
                return merged.length > 0 ? (
                  <View style={styles.tagsRow}>
                    <Ionicons name="pricetag" size={24} color={COLORS.primary} style={styles.infoIcon} />
                    <View style={styles.tagsContainer}>
                      {merged.map((tagText, index) => {
                        const korean = tagTranslations[tagText.toLowerCase()] || tagText;
                        return (
                          <TouchableOpacity
                            key={`tag-${index}`}
                            style={styles.tag}
                            onPress={() => navigation.navigate('Search', { initialQuery: '#' + tagText })}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.tagText}>#{korean}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                ) : (
                  <View style={styles.tagsRow}>
                    <Ionicons name="pricetag" size={24} color={COLORS.primary} style={styles.infoIcon} />
                    <Text style={styles.emptyTagText}>태그가 없습니다</Text>
                  </View>
                );
              })()}

              {/* 📝 작성자 노트 */}
              <View style={styles.noteRow}>
                <Ionicons name="create-outline" size={24} color={COLORS.primary} style={styles.infoIcon} />
                <View style={styles.noteContent}>
                  {post?.note || post?.content ? (
                    <Text style={styles.noteText}>{post.note || post.content}</Text>
                  ) : (
                    <Text style={styles.emptyNoteText}>작성자가 남긴 노트가 없습니다</Text>
                  )}
                </View>
              </View>
            </View>

            {/* 인터랙션 바 - 웹과 동일: px-4 py-2 bg-white */}
            <View style={styles.actionsSection}>
              <View style={styles.leftActions}>
                <TouchableOpacity style={styles.actionButton} onPress={handleLike} activeOpacity={0.7}>
                  <Ionicons 
                    name={liked ? "heart" : "heart-outline"} 
                    size={24} 
                    color={liked ? "#EF4444" : "#6B7280"} 
                    style={liked ? { fontVariationSettings: "'FILL' 1" } : {}}
                  />
                  <Text style={[styles.actionText, liked && { color: "#EF4444" }]}>{likeCount}</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.actionButton} 
                  onPress={() => commentInputRef.current?.focus()}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chatbubble-outline" size={24} color="#6B7280" />
                  <Text style={styles.actionText}>{comments.length}</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.iconAction} activeOpacity={0.7}>
                <Ionicons name="share-social-outline" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* 댓글 섹션 - 웹과 동일: px-4 py-3 bg-white */}
            <View style={styles.commentsSection}>
              <Text style={styles.commentsTitle}>
                댓글 & 질문 {comments.length > 0 && `(${comments.length})`}
              </Text>

              {/* 댓글 목록 */}
              {comments.length > 0 && (
                <View style={styles.commentsList}>
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
                        <Image
                          source={{ uri: comment.avatar || `https://i.pravatar.cc/150?u=${comment.user}` }}
                          style={styles.commentAvatar}
                        />
                        <View style={styles.commentContent}>
                          <View style={styles.commentBubble}>
                            <Text style={styles.commentUser}>
                              {comment.user || comment.username || '익명'}
                            </Text>
                            <Text style={styles.commentText}>
                              {comment.content || comment.comment || comment.text}
                            </Text>
                          </View>
                          <Text style={styles.commentTime}>
                            {getTimeAgo(comment.timestamp)}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* 댓글 입력 - 웹과 동일: flex gap-2, input이 flex-1 bg-gray-100 rounded-xl h-14 */}
              <View ref={commentInputSectionRef} style={styles.commentInputSection}>
                <TextInput
                  ref={commentInputRef}
                  style={styles.commentInput}
                  placeholder="댓글이나 질문을 입력하세요 💬"
                  value={commentText}
                  onChangeText={setCommentText}
                  placeholderTextColor="#9CA3AF"
                  editable={true}
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
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.commentSubmitText,
                    !commentText.trim() && styles.commentSubmitTextDisabled
                  ]}>
                    전송
                  </Text>
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
  headerAbsolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16, // env(safe-area-inset-top) + 16px
    paddingBottom: 8,
    backgroundColor: 'transparent',
  },
  backButton: {
    width: 48, // size-12 = 48px (웹과 동일)
    height: 48, // size-12 = 48px (웹과 동일)
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8, // rounded-lg (웹과 동일)
  },
  backButtonAbsolute: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24, // rounded-full
    backgroundColor: 'transparent',
  },
  content: {

    flex: 1,
  },
  mediaContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.55, // 웹: 55vh
    minHeight: 350, // 웹: minHeight: 350px
    position: 'relative',
    backgroundColor: '#FFFFFF', // bg-white (웹과 동일)
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
    backgroundColor: '#fff',
  },
  imageCounter: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCounterText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  arrowButtonLeft: {
    position: 'absolute',
    left: 8,
    top: '50%',
    transform: [{ translateY: -24 }],
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#000000', // 웹: bg-black
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  arrowButtonRight: {
    position: 'absolute',
    right: 8,
    top: '50%',
    transform: [{ translateY: -24 }],
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#000000', // 웹: bg-black
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  // 게시물 간 이동 가이드 화살표 (가벼운 스타일)
  postNavArrowLeft: {
    position: 'absolute',
    left: 6,
    top: SCREEN_HEIGHT * 0.35,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  postNavArrowRight: {
    position: 'absolute',
    right: 6,
    top: SCREEN_HEIGHT * 0.35,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  scrollContent: {
    flex: 1,
  },
  authorSection: {
    paddingHorizontal: 16, // 웹: px-4
    paddingTop: 12, // 웹: pt-3
    paddingBottom: 8, // 웹: pb-2
    backgroundColor: COLORS.backgroundLight, // 웹: bg-white
  },
  authorInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12, // 웹: gap-3
    flex: 1,
  },
  avatar: {
    width: 48, // 웹: h-12 w-12
    height: 48,
    borderRadius: 24, // 웹: rounded-full
    backgroundColor: COLORS.border,
    borderWidth: 2,
    borderColor: COLORS.primary + '33', // 웹: ring-2 ring-primary/20
  },
  authorText: {
    flex: 1,
  },
  authorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8, // 웹: gap-2
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  authorName: {
    fontSize: 16, // 웹: text-base
    fontWeight: 'bold', // 웹: font-bold
    color: '#181410', // 웹: text-[#181410]
  },
  followButton: {
    paddingHorizontal: 16, // 웹: px-4
    paddingVertical: 8, // 웹: py-2
    borderRadius: 12, // 웹: rounded-xl
    backgroundColor: COLORS.primary, // 웹: bg-primary
  },
  followButtonActive: {
    backgroundColor: '#F3F4F6', // 웹: bg-gray-100
  },
  followButtonText: {
    fontSize: 14, // 웹: text-sm
    fontWeight: '600', // 웹: font-semibold
    color: '#FFFFFF', // 웹: text-white
  },
  followButtonTextActive: {
    color: '#6B7280', // 웹: text-gray-600
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
    fontSize: 12, // 웹: text-xs
    color: '#6B7280', // 웹: text-text-secondary-light
    marginTop: 4,
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
    marginHorizontal: 16, // 웹: mx-4
    marginTop: 8, // 웹: mt-2
    marginBottom: 12, // 웹: mb-3
    padding: 16, // 웹: p-4
    backgroundColor: COLORS.backgroundLight, // 웹: bg-white
    borderRadius: 16, // 웹: rounded-2xl
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5, // 웹: shadow-lg
    borderWidth: 1,
    borderColor: '#E5E7EB', // 웹: border-gray-200
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12, // 웹: gap-3
    marginBottom: 16, // 웹: space-y-4
  },
  infoIcon: {
    flexShrink: 0,
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
  tagsContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8, // 웹: gap-2
  },
  tag: {
    backgroundColor: COLORS.primary + '1A', // 웹: bg-primary/10
    paddingHorizontal: 12, // 웹: px-3
    paddingVertical: 6, // 웹: py-1.5
    borderRadius: 999, // 웹: rounded-full
  },
  tagText: {
    fontSize: 14, // 웹: text-sm
    fontWeight: '600', // 웹: font-semibold
    color: COLORS.primary, // 웹: text-primary
  },
  noteText: {
    fontSize: 14, // 웹: text-sm
    lineHeight: 20, // 웹: leading-relaxed
    color: '#374151', // 웹: text-gray-700
  },
  actionsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16, // 웹: px-4
    paddingVertical: 8, // 웹: py-2
    backgroundColor: COLORS.backgroundLight, // 웹: bg-white
  },
  leftActions: {
    flexDirection: 'row',
    gap: 16, // 웹: gap-4
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8, // 웹: gap-2
  },
  actionText: {
    fontSize: 16, // 웹: text-base
    fontWeight: '600', // 웹: font-semibold
    color: '#374151', // 웹: text-gray-700
  },
  iconAction: {
    padding: 4,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  commentsSection: {
    paddingHorizontal: 16, // 웹: px-4
    paddingVertical: 12, // 웹: py-3
    backgroundColor: COLORS.backgroundLight, // 웹: bg-white
  },
  commentsTitle: {
    fontSize: 18, // 웹: text-lg
    fontWeight: 'bold', // 웹: font-bold
    color: '#181410', // 웹: text-[#181410]
    marginBottom: 8, // 웹: mt-2
  },
  commentsList: {
    flexDirection: 'column',
    gap: 12, // 웹: gap-3
    marginTop: 8, // 웹: mt-2
  },
  commentItem: {
    flexDirection: 'row',
    gap: 12, // 웹: gap-3
  },
  commentAvatar: {
    width: 32, // 웹: h-8 w-8
    height: 32,
    borderRadius: 16, // 웹: rounded-full
    backgroundColor: '#F3F4F6',
  },
  commentContent: {
    flex: 1,
  },
  commentBubble: {
    backgroundColor: '#F3F4F6', // 웹: bg-gray-100
    padding: 12, // 웹: p-3
    borderRadius: 8, // 웹: rounded-lg
    borderTopLeftRadius: 0, // 웹: rounded-tl-none
  },
  commentUser: {
    fontSize: 14, // 웹: text-sm
    fontWeight: 'bold', // 웹: font-bold
    color: '#181410', // 웹: text-[#181410]
    marginBottom: 4, // 웹: mt-1
  },
  commentText: {
    fontSize: 14, // 웹: text-sm
    color: '#1F2937', // 웹: text-gray-800
    lineHeight: 20,
  },
  commentTime: {
    fontSize: 12, // 웹: text-xs
    color: '#6B7280', // 웹: text-gray-500
    marginTop: 4, // 웹: mt-1
  },
  commentInputSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8, // 웹: gap-2
    marginTop: 16, // 웹: mt-4
  },
  commentInput: {
    flex: 1,
    height: 56, // 웹: h-14
    paddingHorizontal: 16, // 웹: px-4
    backgroundColor: '#F3F4F6', // 웹: bg-gray-100
    borderRadius: 12, // 웹: rounded-xl
    fontSize: 14, // 웹: text-sm
    color: '#181410', // 웹: text-[#181410]
    borderWidth: 1,
    borderColor: '#D1D5DB', // 웹: border-gray-300
  },
  commentSubmitButton: {
    paddingHorizontal: 24, // 웹: px-6
    height: 56, // 웹: h-14
    borderRadius: 12, // 웹: rounded-xl
    backgroundColor: COLORS.primary, // 웹: bg-primary
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentSubmitButtonDisabled: {
    backgroundColor: '#D1D5DB', // 웹: bg-gray-300
  },
  commentSubmitText: {
    fontSize: 16, // 웹: text-base
    fontWeight: 'bold', // 웹: font-bold
    color: '#FFFFFF', // 웹: text-white
  },
  commentSubmitTextDisabled: {
    color: '#6B7280', // 웹: text-gray-500
  },
  heartAnimationContainer: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  heartAnimation: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: '#ef4444',
  },
});

export default PostDetailScreen;

