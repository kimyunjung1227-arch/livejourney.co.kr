import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';
import { getPost } from '../api/posts';
import { getDisplayImageUrl } from '../api/upload';
import { useAuth } from '../contexts/AuthContext';
import { getWeatherByRegion } from '../api/weather';
import { getTimeAgo } from '../utils/dateUtils';
import { toggleLike, isPostLiked, addComment, getPostAccuracyCount, hasUserMarkedAccurate, toggleAccuracyFeedback } from '../utils/socialInteractions';
import { toggleInterestPlace, isInterestPlace } from '../utils/interestPlaces';
import { getEarnedBadgesForUser } from '../utils/badgeSystem';
import { getUserLevel } from '../utils/levelSystem';
import { follow, unfollow, isFollowing } from '../utils/followSystem';
import { logger } from '../utils/logger';

// 영어 태그를 한국어로 번역
const tagTranslations = {
  // 자연/풍경
  'nature': '자연',
  'landscape': '풍경',
  'mountain': '산',
  'beach': '해변',
  'forest': '숲',
  'river': '강',
  'lake': '호수',
  'sunset': '일몰',
  'sunrise': '일출',
  'sky': '하늘',
  'cloud': '구름',
  'tree': '나무',
  'flower': '꽃',
  'cherry blossom': '벚꽃',
  'autumn': '가을',
  'spring': '봄',
  'summer': '여름',
  'winter': '겨울',
  'snow': '눈',
  'rain': '비',

  // 음식
  'food': '음식',
  'restaurant': '맛집',
  'cafe': '카페',
  'coffee': '커피',
  'dessert': '디저트',
  'korean food': '한식',
  'japanese food': '일식',
  'chinese food': '중식',
  'western food': '양식',
  'street food': '길거리음식',
  'seafood': '해산물',
  'meat': '고기',
  'vegetable': '채소',
  'fruit': '과일',
  'bread': '빵',
  'noodle': '면요리',
  'rice': '밥',

  // 건물/장소
  'building': '건물',
  'architecture': '건축',
  'temple': '사찰',
  'palace': '궁궐',
  'castle': '성',
  'tower': '타워',
  'bridge': '다리',
  'park': '공원',
  'garden': '정원',
  'street': '거리',
  'alley': '골목',
  'market': '시장',
  'shop': '상점',
  'mall': '쇼핑몰',

  // 활동
  'travel': '여행',
  'trip': '여행',
  'hiking': '등산',
  'camping': '캠핑',
  'picnic': '피크닉',
  'festival': '축제',
  'event': '이벤트',
  'concert': '공연',
  'exhibition': '전시',
  'shopping': '쇼핑',
  'walking': '산책',

  // 동물
  'animal': '동물',
  'dog': '강아지',
  'cat': '고양이',
  'bird': '새',
  'fish': '물고기',

  // 기타
  'photo': '사진',
  'photography': '사진',
  'art': '예술',
  'culture': '문화',
  'history': '역사',
  'traditional': '전통',
  'modern': '현대',
  'vintage': '빈티지',
  'night': '밤',
  'day': '낮',
  'morning': '아침',
  'evening': '저녁',
  'beautiful': '아름다운',
  'pretty': '예쁜',
  'cute': '귀여운',
  'cool': '멋진',
  'amazing': '놀라운',
  'scenic': '경치좋은'
};

const PostDetailScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { postId } = useParams();
  const { user } = useAuth();
  const { post: passedPost, fromMap, selectedPinId, allPins, mapState, allPosts, currentPostIndex } = location.state || {};

  const [post, setPost] = useState(passedPost);
  const [loading, setLoading] = useState(!passedPost);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentPostIndexState, setCurrentPostIndexState] = useState(currentPostIndex || 0);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post?.likes || 0);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [isFavorited, setIsFavorited] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [representativeBadge, setRepresentativeBadge] = useState(null);
  const [userBadges, setUserBadges] = useState([]);
  const [authorLevelInfo, setAuthorLevelInfo] = useState(null);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const [isFollowAuthor, setIsFollowAuthor] = useState(false);
  const [accuracyMarked, setAccuracyMarked] = useState(false);
  const [accuracyCount, setAccuracyCount] = useState(0);
  const [weatherInfo, setWeatherInfo] = useState({
    icon: '☀️',
    condition: '맑음',
    temperature: '20°C',
    loading: true
  });

  // 터치 스와이프 (좌우)
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  // 상하 스와이프 (게시물 간 이동) - 인스타그램 스타일
  const [verticalTouchStart, setVerticalTouchStart] = useState(0);
  const [verticalTouchEnd, setVerticalTouchEnd] = useState(0);
  const [isVerticalSwipe, setIsVerticalSwipe] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  // 이미지 영역에서의 터치 추적
  const [isImageAreaTouch, setIsImageAreaTouch] = useState(false);

  // 미니 지도
  const miniMapRef = useRef(null);
  const miniMapInstance = useRef(null);
  const scrollContentRef = useRef(null);
  const nextPostSentinelRef = useRef(null);

  // 슬라이드 가능한 게시물 목록
  const slideablePosts = useMemo(() => {
    if (allPosts && Array.isArray(allPosts) && allPosts.length > 0) {
      return allPosts;
    }
    return passedPost ? [passedPost] : [];
  }, [allPosts, passedPost]);

  // 미디어 배열 (이미지 + 동영상), 표시용 풀 URL로 변환
  const mediaItems = useMemo(() => {
    const rawImages = post?.images?.length
      ? post.images
      : (post?.image ? [post.image] : post?.thumbnail ? [post.thumbnail] : []);
    const rawVideos = post?.videos || [];
    return [
      ...rawImages.map(img => ({ type: 'image', url: getDisplayImageUrl(img) })),
      ...rawVideos.map(vid => ({ type: 'video', url: getDisplayImageUrl(vid) }))
    ];
  }, [post]);

  const images = useMemo(() => {
    const raw = post?.images?.length
      ? post.images
      : (post?.image ? [post.image] : post?.thumbnail ? [post.thumbnail] : []);
    return raw.map(getDisplayImageUrl);
  }, [post]);

  // Q&A 포맷 변환 (useCallback)
  const formatQnA = useCallback((questions) => {
    return questions.map((q, idx) => {
      const items = [{
        id: `q-${idx}`,
        type: 'question',
        user: q.user?.username || '익명',
        content: q.question,
        time: getTimeAgo(q.createdAt),
        avatar: q.user?.profileImage || `https://i.pravatar.cc/150?img=${idx + 1}`
      }];

      if (q.answer) {
        items.push({
          id: `a-${idx}`,
          type: 'answer',
          user: q.answeredBy?.username || '작성자',
          isAuthor: true,
          content: q.answer,
          time: getTimeAgo(q.createdAt),
          avatar: q.answeredBy?.profileImage || `https://i.pravatar.cc/150?img=${idx + 10}`
        });
      }

      return items;
    }).flat();
  }, [getTimeAgo]);

  // 게시물 데이터 가져오기 (useCallback)
  const fetchPost = useCallback(async () => {
    if (!postId && !passedPost) {
      alert('게시물 정보가 없습니다.');
      navigate(-1);
      return;
    }

    if (passedPost) {
      setPost(passedPost);
      const allComments = [...(passedPost.comments || []), ...(passedPost.qnaList || [])];
      setComments(allComments);
      setLikeCount(passedPost.likes || 0);
      setLiked(isPostLiked(passedPost.id));
      setIsFavorited(isInterestPlace(passedPost.location || passedPost.placeName));
      setAccuracyMarked(hasUserMarkedAccurate(passedPost.id));
      setAccuracyCount(getPostAccuracyCount(passedPost.id));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // 먼저 localStorage에서 찾기 (Mock 데이터 또는 로컬 업로드)
      const localPosts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');
      const localPost = localPosts.find(p =>
        p.id === postId ||
        p.id === `uploaded-${postId}` ||
        p.id === `realtime-${postId}` ||
        p.id === `crowded-${postId}` ||
        p.id === `recommend-${postId}`
      );

      if (localPost) {
        logger.log('✅ localStorage에서 게시물 찾음:', localPost.id);
        setPost(localPost);
        const allComments = [...(localPost.comments || []), ...(localPost.qnaList || [])];
        setComments(allComments);
        setLikeCount(localPost.likes || 0);
        setLiked(isPostLiked(localPost.id));
        setIsFavorited(isInterestPlace(localPost.location || localPost.placeName));
        setAccuracyMarked(hasUserMarkedAccurate(localPost.id));
        setAccuracyCount(getPostAccuracyCount(localPost.id));
        setLoading(false);
        return;
      }

      // localStorage에 없으면 API 호출 (네트워크 오류는 조용히 처리)
      logger.log('🔍 API에서 게시물 조회 중:', postId);
      const response = await getPost(postId);
      if (response.success && response.post) {
        setPost(response.post);
        setQnaList(formatQnA(response.post.questions || []));
        setLikeCount(response.post.likesCount || 0);
      } else {
        // DB 미연결 또는 로컬 전용 게시물 → 이전 화면으로
        navigate(-1);
      }
    } catch (error) {
      if (error.code === 'ERR_NETWORK' || error.code === 'ERR_CONNECTION_REFUSED') {
        navigate(-1);
      } else if (error.response?.status === 404) {
        // 게시물 없음(로컬 전용 ID 등) → 조용히 이전으로
        navigate(-1);
      } else if (error.response?.status === 500) {
        logger.error('게시물 조회 서버 오류:', error.response?.data);
        navigate(-1);
      } else {
        logger.error('❌ 게시물 불러오기 실패:', error);
        navigate(-1);
      }
    } finally {
      setLoading(false);
    }
  }, [postId, passedPost, navigate, formatQnA]);

  // 정보 정확도 평가 상태 동기화 (API에서 로드한 경우 등)
  useEffect(() => {
    if (!post?.id) return;
    setAccuracyMarked(hasUserMarkedAccurate(post.id));
    setAccuracyCount(getPostAccuracyCount(post.id));
  }, [post?.id]);

  // 정보가 정확해요 버튼 클릭
  const handleAccuracyClick = useCallback(() => {
    if (!post?.id) return;
    const result = toggleAccuracyFeedback(post.id);
    setAccuracyMarked(result.marked);
    setAccuracyCount(result.newCount);
  }, [post?.id]);

  // 좋아요 처리
  const handleFavorite = useCallback(() => {
    if (!post) return;

    const place = {
      name: post.location || post.placeName || '장소',
      location: post.location || post.placeName,
      region: post.region || post.location?.split(' ')[0],
      coordinates: post.coordinates
    };

    const newState = toggleInterestPlace(place);
    setIsFavorited(newState);

    // 토스트 메시지
    if (newState) {
      console.log(`⭐ "${place.name}" 관심 장소 추가!`);
    } else {
      console.log(`⭐ "${place.name}" 관심 장소 해제`);
    }
  }, [post]);

  const handleLike = useCallback(() => {
    if (!post) return;

    const wasLiked = liked;
    const optimisticLiked = !liked;

    // 먼저 UI를 낙관적으로 업데이트
    setLiked(optimisticLiked);
    setLikeCount((prev) => {
      const base = typeof prev === 'number' ? prev : 0;
      return Math.max(0, base + (optimisticLiked ? 1 : -1));
    });

    const result = toggleLike(post.id);

    // localStorage 기반 게시물이면 util에서 계산한 카운트를 신뢰
    if (result.existsInStorage) {
      setLiked(result.isLiked);
      setLikeCount(result.newCount);
    } else {
      // 서버에서 불러온 게시물인 경우: 화면의 낙관적 업데이트 유지
      setLiked(optimisticLiked);
    }

    // 좋아요를 누를 때만 애니메이션 표시 (좋아요 취소가 아닐 때)
    if (result.isLiked && !wasLiked) {
      setShowHeartAnimation(true);

      // 애니메이션 완료 후 숨기기
      setTimeout(() => {
        setShowHeartAnimation(false);
      }, 1000);
    }

    logger.log(result.isLiked ? '❤️ 좋아요!' : '💔 좋아요 취소');
  }, [post, liked]);


  // 이미지 스와이프 (useCallback)
  const handleImageSwipe = useCallback((direction) => {
    const maxIndex = mediaItems.length > 0 ? mediaItems.length : images.length;

    if (maxIndex <= 1) {
      // 이미지가 1개 이하면 슬라이드 불가
      return;
    }

    if (direction === 'left') {
      // 왼쪽 버튼 클릭: 다음 이미지 (마지막이면 첫 번째로)
      const nextIndex = currentImageIndex < maxIndex - 1
        ? currentImageIndex + 1
        : 0;
      setCurrentImageIndex(nextIndex);
    } else if (direction === 'right') {
      // 오른쪽 버튼 클릭: 이전 이미지 (첫 번째면 마지막으로)
      const prevIndex = currentImageIndex > 0
        ? currentImageIndex - 1
        : maxIndex - 1;
      setCurrentImageIndex(prevIndex);
    }
  }, [currentImageIndex, images.length, mediaItems.length]);

  // 댓글 추가 핸들러
  const handleAddComment = useCallback(() => {
    if (!post || !commentText.trim()) return;

    const username = user?.username || '익명';
    const text = commentText.trim();

    // uploadedPosts에 존재하는지 먼저 확인
    const uploadedPosts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');
    const existsInStorage = uploadedPosts.some((p) => p.id === post.id);

    if (existsInStorage) {
      // 기존 로컬 업로드 게시물: util을 통해 댓글 + 저장까지 처리
      const newComments = addComment(post.id, text, username);
      if (Array.isArray(newComments) && newComments.length > 0) {
        setComments(newComments);
      } else {
        // 방어적으로 현재 UI에만 추가
        const newComment = {
          id: `comment-${Date.now()}`,
          user: username,
          content: text,
          timestamp: new Date().toISOString(),
          avatar: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`
        };
        setComments((prev) => [...prev, newComment]);
      }
    } else {
      // 서버/목업 기반 게시물: 로컬 state에서만 댓글 추가 (화면상 반영)
      const newComment = {
        id: `comment-${Date.now()}`,
        user: username,
        content: text,
        timestamp: new Date().toISOString(),
        avatar: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`
      };
      setComments((prev) => [...prev, newComment]);
    }

    setCommentText('');
    console.log('💬 댓글 추가:', text);
  }, [post, commentText, user]);

  // 게시물 변경 (상하/좌우 스와이프 모두 지원)
  const changePost = useCallback((direction) => {
    if (!slideablePosts || slideablePosts.length === 0 || isTransitioning) return;

    let newIndex;
    if (slideablePosts.length === 1) {
      // 게시물이 1개면 변경하지 않음
      return;
    }

    setIsTransitioning(true);

    if (direction === 'up' || direction === 'left') {
      // 위로 또는 왼쪽으로: 이전 게시물 (첫 번째면 마지막으로)
      newIndex = currentPostIndexState > 0
        ? currentPostIndexState - 1
        : slideablePosts.length - 1;
    } else {
      // 아래로 또는 오른쪽으로: 다음 게시물 (마지막이면 첫 번째로)
      newIndex = currentPostIndexState < slideablePosts.length - 1
        ? currentPostIndexState + 1
        : 0;
    }

    setCurrentPostIndexState(newIndex);
    const newPost = slideablePosts[newIndex];
    setPost(newPost);
    setCurrentImageIndex(0);
    setLiked(isPostLiked(newPost.id));
    setLikeCount(newPost.likes || 0);
    setComments([...(newPost.comments || []), ...(newPost.qnaList || [])]);

    // 스크롤을 맨 위로 이동
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // 전환 애니메이션 완료 후 플래그 해제
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  }, [slideablePosts, currentPostIndexState, isTransitioning]);

  // 터치/마우스 스와이프 제스처 (좌우 + 상하)
  const handleStart = (e) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setTouchStart(clientX);
    setVerticalTouchStart(clientY);
    setIsVerticalSwipe(false);
  };

  const handleMove = (e) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setTouchEnd(clientX);
    setVerticalTouchEnd(clientY);

    // 상하 움직임이 좌우 움직임보다 크면 상하 스와이프로 판단 (인스타그램 스타일)
    const horizontalDistance = Math.abs(clientX - touchStart);
    const verticalDistance = Math.abs(clientY - verticalTouchStart);

    // 상하 움직임이 더 크고, 최소 5px 이상이면 상하 스와이프로 판단
    if (verticalDistance > horizontalDistance && verticalDistance > 5) {
      setIsVerticalSwipe(true);
    }
  };

  const handleEnd = () => {
    if (!touchStart || !touchEnd || !verticalTouchStart || !verticalTouchEnd) {
      setTouchStart(0);
      setTouchEnd(0);
      setVerticalTouchStart(0);
      setVerticalTouchEnd(0);
      setIsImageAreaTouch(false);
      return;
    }

    const horizontalDistance = Math.abs(touchStart - touchEnd);
    const verticalDistance = Math.abs(verticalTouchStart - verticalTouchEnd);

    if (isVerticalSwipe) {
      // 상하 스와이프 - 인스타그램 스타일 (직관적인 방향)
      // 아래로 스와이프 (아래로 당기기) = 다음 게시물
      // 위로 스와이프 (위로 올리기) = 이전 게시물
      const verticalDistance = verticalTouchStart - verticalTouchEnd;
      const isDownSwipe = verticalDistance > 30; // 아래로 당기기 = 다음 게시물
      const isUpSwipe = verticalDistance < -30; // 위로 올리기 = 이전 게시물

      if (isDownSwipe) {
        changePost('down'); // 다음 게시물
      } else if (isUpSwipe) {
        changePost('up'); // 이전 게시물
      }
    } else if (horizontalDistance > verticalDistance) {
      // 좌우 스와이프가 상하 스와이프보다 큰 경우
      const distance = touchStart - touchEnd;
      const isLeftSwipe = distance > 50;
      const isRightSwipe = distance < -50;

      // 이미지 영역에서의 터치인지 확인
      if (isImageAreaTouch) {
        // 이미지 영역: 이미지가 여러 개면 이미지 간 이동, 1개면 게시물 간 이동
        const maxIndex = mediaItems.length > 0 ? mediaItems.length : images.length;

        if (maxIndex > 1) {
          // 이미지가 여러 개면 이미지 간 이동
          if (isLeftSwipe) {
            // 왼쪽으로 스와이프: 다음 이미지 (마지막이면 첫 번째로)
            const nextIndex = currentImageIndex < maxIndex - 1
              ? currentImageIndex + 1
              : 0;
            setCurrentImageIndex(nextIndex);
          }

          if (isRightSwipe) {
            // 오른쪽으로 스와이프: 이전 이미지 (첫 번째면 마지막으로)
            const prevIndex = currentImageIndex > 0
              ? currentImageIndex - 1
              : maxIndex - 1;
            setCurrentImageIndex(prevIndex);
          }
        } else {
          // 이미지가 1개면 게시물 간 이동
          if (isLeftSwipe) {
            // 왼쪽으로 스와이프: 다음 게시물
            changePost('right');
          } else if (isRightSwipe) {
            // 오른쪽으로 스와이프: 이전 게시물
            changePost('left');
          }
        }
      } else {
        // 이미지 영역 외부: 게시물 간 이동
        if (isLeftSwipe) {
          // 왼쪽으로 스와이프: 다음 게시물
          changePost('right');
        } else if (isRightSwipe) {
          // 오른쪽으로 스와이프: 이전 게시물
          changePost('left');
        }
      }
    }

    setTouchStart(0);
    setTouchEnd(0);
    setVerticalTouchStart(0);
    setVerticalTouchEnd(0);
    setIsImageAreaTouch(false);
    setIsVerticalSwipe(false);
  };

  // 마우스 이벤트 핸들러
  const handleMouseDown = (e) => {
    e.preventDefault();
    handleStart(e);
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseUp = () => {
    handleEnd();
    document.removeEventListener('mousemove', handleMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  // 터치 이벤트 핸들러
  const handleTouchStart = (e) => {
    handleStart(e);
  };

  const handleTouchMove = (e) => {
    // 이미지 영역에서만 preventDefault (스크롤 허용을 위해)
    if (isImageAreaTouch) {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const horizontalDistance = Math.abs(clientX - touchStart);
      const verticalDistance = Math.abs(clientY - verticalTouchStart);

      // 좌우 움직임이 상하 움직임보다 크면 preventDefault (이미지 스와이프)
      if (horizontalDistance > verticalDistance && horizontalDistance > 10) {
        e.preventDefault();
      }
    }
    // 이미지 영역이 아니면 preventDefault 하지 않음 (스크롤 허용)
    handleMove(e);
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  // 대표 뱃지 / 사용자 뱃지 / 레벨 로드
  useEffect(() => {
    if (!post) return;

    const postUserId =
      post?.userId ||
      (typeof post?.user === 'string' ? post.user : post?.user?.id) ||
      post?.user;

    if (!postUserId) return;

    // 1) 사용자 전체 뱃지 먼저 계산 (사진 상세에서는 대표 뱃지만 사용하지만,
    //    추후 확장에 대비해 일단 로드해 둠)
    const badges = getEarnedBadgesForUser(postUserId) || [];
    setUserBadges(badges);

    // 2) 저장된 대표 뱃지 로드
    let repBadge = null;
    const repBadgeJson = localStorage.getItem(`representativeBadge_${postUserId}`);
    if (repBadgeJson) {
      try {
        repBadge = JSON.parse(repBadgeJson);
      } catch {
        repBadge = null;
      }
    }

    // 3) 없으면 보유 뱃지 중 하나를 대표 뱃지로 사용
    if (!repBadge && badges.length > 0) {
      // 난이도/정렬 등의 로직이 생기면 여기서 변경
      repBadge = badges[0];
      localStorage.setItem(`representativeBadge_${postUserId}`, JSON.stringify(repBadge));
    }

    // 4) 그래도 없으면, 포스트에 들어있는 텍스트 배지를 대표 뱃지처럼 보여줌
    if (!repBadge) {
      const fallbackBadgeName =
        (post?.user && typeof post.user === 'object' && post.user.badges?.[0]) ||
        post?.badge ||
        null;

      if (fallbackBadgeName) {
        repBadge = {
          name: fallbackBadgeName,
          icon: '🏅',
        };
      }
    }

    if (repBadge) {
      setRepresentativeBadge(repBadge);
    }

    // 5) 레벨 정보 로드 (작성자 기준)
    const levelInfo = getUserLevel();
    setAuthorLevelInfo(levelInfo);
  }, [post]);

  // 초기 데이터 로드
  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  // PC 키보드: 아래/위 화살표·PageDown/PageUp으로 다음/이전 게시물
  useEffect(() => {
    const onKeyDown = (e) => {
      if (slideablePosts.length <= 1) return;
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        changePost('down');
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        changePost('up');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [slideablePosts.length, changePost]);

  const locationText = useMemo(() => post?.location?.name || post?.location || post?.title || '여행지', [post]);
  const detailedLocationText = useMemo(() => post?.detailedLocation || post?.placeName || null, [post]);
  const addressText = useMemo(() => post?.address || null, [post]);
  const userName = useMemo(() => post?.user?.username || post?.user || '실시간정보왕', [post]);
  const userBadge = useMemo(() => post?.user?.badges?.[0] || post?.badge || '여행러버', [post]);
  // EXIF에서 추출한 촬영 날짜 우선 사용
  const photoDate = useMemo(() => post?.photoDate || post?.exifData?.photoDate || null, [post]);
  // 상세 화면용 촬영 시간 라벨 (예: "2/10 14:30 촬영")
  const captureLabel = useMemo(() => {
    const src = photoDate || post?.timestamp || post?.createdAt;
    if (!src) return null;
    const d = new Date(src);
    if (Number.isNaN(d.getTime())) return null;
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${month}/${day} ${hours}:${minutes} 촬영`;
  }, [photoDate, post]);
  const categoryName = useMemo(() => post?.categoryName || null, [post]);
  // EXIF에서 검증된 위치 정보
  const verifiedLocation = useMemo(() => post?.verifiedLocation || post?.exifData?.gpsCoordinates ? locationText : null, [post, locationText]);
  const hasExifData = useMemo(() => !!(post?.exifData || post?.photoDate || post?.verifiedLocation), [post]);

  // 공유 기능 - useMemo 정의 후에!
  const handleShare = useCallback(async () => {
    const shareData = {
      title: `${locationText} - LiveJourney`,
      text: `${detailedLocationText || locationText}의 실시간 정보를 확인해보세요!`,
      url: window.location.href
    };

    try {
      // Web Share API 지원 확인
      if (navigator.share) {
        await navigator.share(shareData);
        logger.log('✅ 공유 성공!');
        // 공유는 포인트 없음 (악용 가능성 높음)
      } else {
        // Web Share API 미지원 시 URL 복사
        await navigator.clipboard.writeText(window.location.href);
        alert('✅ 링크가 복사되었습니다!\n\n다른 사람에게 공유해보세요!');
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        logger.error('공유 실패:', error);
        // Fallback: URL 복사
        try {
          await navigator.clipboard.writeText(window.location.href);
          alert('✅ 링크가 복사되었습니다!\n다른 사람에게 공유해보세요.');
        } catch (clipboardError) {
          alert('공유에 실패했습니다.');
        }
      }
    }
  }, [locationText, detailedLocationText]);

  // 날씨 정보 가져오기 - useMemo 정의 후에 실행
  useEffect(() => {
    if (post && locationText) {
      const fetchWeather = async (forceRefresh = false) => {
        try {
          setWeatherInfo(prev => ({ ...prev, loading: true }));

          // 게시물 생성 시간 확인
          const postCreatedAt = post.createdAt || post.timestamp || post.photoDate;
          const postTime = postCreatedAt ? new Date(postCreatedAt).getTime() : Date.now();
          const currentTime = Date.now();
          const hoursSincePost = (currentTime - postTime) / (1000 * 60 * 60); // 시간 단위
          const isOlderThan48Hours = hoursSincePost >= 48;

          logger.log(`📅 게시물 시간 정보:`, {
            postCreatedAt,
            hoursSincePost: hoursSincePost.toFixed(2),
            isOlderThan48Hours
          });

          // 48시간 이상 지난 게시물은 저장된 날씨 정보 사용하거나 표시하지 않음
          if (isOlderThan48Hours) {
            if (post.weather) {
              logger.log(`⏰ 48시간 이상 지난 게시물 - 저장된 날씨 정보 사용`);
              setWeatherInfo({
                icon: post.weather.icon,
                condition: post.weather.condition,
                temperature: post.weather.temperature,
                loading: false
              });
            } else {
              logger.log(`⏰ 48시간 이상 지난 게시물 - 날씨 정보 없음 (현재 날씨 호출 안함)`);
              setWeatherInfo(prev => ({ ...prev, loading: false, condition: '정보 없음', temperature: '' }));
            }
            return;
          }

          // 48시간 이내인 경우만 현재 날씨 가져오기
          const result = await getWeatherByRegion(locationText, forceRefresh);
          if (result.success) {
            setWeatherInfo({
              icon: result.weather.icon,
              condition: result.weather.condition,
              temperature: result.weather.temperature,
              loading: false
            });
          } else {
            setWeatherInfo(prev => ({ ...prev, loading: false }));
          }
        } catch (error) {
          console.error('날씨 정보 조회 실패:', error);
          setWeatherInfo(prev => ({ ...prev, loading: false }));
        }
      };

      fetchWeather();

      // 48시간 이상 지난 게시물은 주기적 갱신하지 않음
      const postCreatedAt = post.createdAt || post.timestamp || post.photoDate;
      const postTime = postCreatedAt ? new Date(postCreatedAt).getTime() : Date.now();
      const currentTime = Date.now();
      const hoursSincePost = (currentTime - postTime) / (1000 * 60 * 60);
      const isOlderThan48Hours = hoursSincePost >= 48;

      if (!isOlderThan48Hours) {
        // 날씨 정보 주기적 갱신 (5분마다) - 48시간 이내 게시물만
        const weatherInterval = setInterval(() => {
          logger.log(`🔄 날씨 정보 자동 갱신: ${locationText}`);
          fetchWeather(true); // 강제 새로고침
        }, 5 * 60 * 1000);

        return () => {
          clearInterval(weatherInterval);
        };
      }
    }
  }, [post, locationText]);

  // 작성자 팔로우 여부 로드 및 followsUpdated 구독
  const postUserId = post ? (post.userId || (typeof post.user === 'string' ? post.user : post.user?.id) || post.user) : null;
  useEffect(() => {
    if (!postUserId) return;
    const load = () => setIsFollowAuthor(isFollowing(null, postUserId));
    load();
    window.addEventListener('followsUpdated', load);
    return () => window.removeEventListener('followsUpdated', load);
  }, [postUserId]);

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background-light dark:bg-background-dark">
        <p className="text-gray-500">게시물을 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div
      className="screen-layout bg-background-light dark:bg-background-dark"
      style={{ height: '100vh', overflow: 'hidden', position: 'relative', paddingTop: 0 }}
    >
      <div
        ref={scrollContentRef}
        className="screen-content"
        style={{ height: '100%', overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch', paddingTop: 0 }}
      >
        {/* 헤더를 absolute로 변경하여 이미지 위에 오버레이 */}
        <div
          className="screen-header flex items-center p-4 pb-2 absolute top-0 left-0 right-0 z-40 pointer-events-none bg-transparent"
          style={{ paddingTop: `calc(env(safe-area-inset-top, 0px) + 16px)` }}
        >
          <button
            onClick={() => {
              // 항상 직전 화면으로만 이동 (예: 메인 '지금 여기는' 피드 → 상세 → 뒤로가기)
              navigate(-1);
            }}
            className="text-black flex shrink-0 items-center justify-center pointer-events-auto rounded-full"
            style={{
              width: 44,
              height: 44,
              backgroundColor: 'rgba(15,23,42,0.45)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)'
            }}
          >
            <span className="material-symbols-outlined text-2xl text-white">arrow_back</span>
          </button>
        </div>

        {/* 하트 애니메이션 오버레이 */}
        {showHeartAnimation && (
          <div className="absolute inset-0 flex items-center justify-center z-[9999] pointer-events-none">
            {/* 펄스 링 (큰 하트 강조 효과) */}
            <div className="pulse-ring"></div>

            {/* 큰 중앙 하트 */}
            <div className="heart-animation">
              <span className="text-[120px]" style={{ color: '#ef4444' }}>♥️</span>
            </div>
          </div>
        )}

        {/* 게시물 간 이동 가이드 화살표 (가벼운 스타일) */}
        {slideablePosts.length > 1 && (
          <>
            <div className="fixed left-2 top-[35vh] z-10 pointer-events-none">
              <span className="material-symbols-outlined text-white/25 text-lg">chevron_left</span>
            </div>
            <div className="fixed right-2 top-[35vh] z-10 pointer-events-none">
              <span className="material-symbols-outlined text-white/25 text-lg">chevron_right</span>
            </div>
          </>
        )}

        <div className="flex w-full bg-transparent dark:bg-transparent" style={{ marginTop: 0 }}>
          <div
            className="image-swipe-area w-full gap-1 overflow-hidden bg-white dark:bg-gray-900 flex relative shadow-md"
            style={{ height: '60vh', minHeight: '330px', marginTop: '-64px' }}
            onTouchStart={(e) => {
              setIsImageAreaTouch(true);
              handleTouchStart(e);
            }}
            onTouchMove={(e) => {
              // 이미지 영역에서는 preventDefault로 스크롤 방지
              e.preventDefault();
              handleTouchMove(e);
            }}
            onMouseDown={(e) => {
              setIsImageAreaTouch(true);
              handleMouseDown(e);
            }}
          >
            <div
              className="w-full overflow-hidden"
            >
              <div
                className="flex transition-transform duration-300 ease-in-out"
                style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
              >
                {mediaItems.length > 0 ? mediaItems.map((media, index) => (
                  <div
                    key={index}
                    className="w-full flex-shrink-0 relative"
                    style={{ height: '60vh', minHeight: '330px' }}
                  >
                    {media.type === 'video' ? (
                      <video
                        src={media.url}
                        className="w-full h-full object-cover"
                        autoPlay
                        loop
                        muted
                        playsInline
                        controls={false}
                      />
                    ) : (
                      <img
                        src={media.url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                )) : images.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt=""
                    className="w-full flex-shrink-0 object-cover"
                    style={{ height: '60vh', minHeight: '330px' }}
                  />
                ))}
              </div>
            </div>

            {(mediaItems.length > 1 || images.length > 1) && (
              <>
                {/* 페이지 인디케이터 - 클릭 가능 */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                  {(mediaItems.length > 0 ? mediaItems : images).map((_, index) => (
                    <div
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${index === currentImageIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/70'
                        }`}
                    ></div>
                  ))}
                </div>

                {/* 좌우 화살표 버튼 - 검정 원형 배경 */}
                <button
                  onClick={() => handleImageSwipe('right')}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black text-white rounded-full w-12 h-12 flex items-center justify-center hover:bg-black/80 transition-colors z-10"
                >
                  <span className="material-symbols-outlined text-3xl">chevron_left</span>
                </button>
                <button
                  onClick={() => handleImageSwipe('left')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black text-white rounded-full w-12 h-12 flex items-center justify-center hover:bg-black/80 transition-colors z-10"
                >
                  <span className="material-symbols-outlined text-3xl">chevron_right</span>
                </button>
              </>
            )}
          </div>
        </div>

        <main className="flex flex-col bg-white dark:bg-gray-900" style={{ minHeight: 'auto' }}>
          {/* 통합 정보 - 작성자 정보 + 내용 */}
          <div className="px-4 pt-4 pb-3">
            {/* 👤 작성자 정보 */}
            <div className="flex items-center justify-between mb-4">
                <div
                  className="flex gap-3 items-center cursor-pointer hover:opacity-80 transition-opacity flex-1"
                  onClick={() => {
                    // userId 추출 (여러 형태 지원)
                    const postUserId = post?.userId ||
                      (typeof post?.user === 'string' ? post.user : post?.user?.id) ||
                      post?.user;
                    const currentUserId = user?.id;

                    logger.log('프로필 이동:', { postUserId, currentUserId, isSame: postUserId === currentUserId });

                    // 현재 사용자와 다른 사용자일 때만 프로필로 이동
                    if (postUserId && postUserId !== currentUserId) {
                      navigate(`/user/${postUserId}`);
                    } else if (postUserId && postUserId === currentUserId) {
                      // 내 프로필이면 프로필 탭으로 이동
                      navigate('/profile');
                    }
                  }}
                >
                  <div
                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-12 w-12 ring-2 ring-primary/20 flex-shrink-0"
                    style={{ backgroundImage: `url("${post?.userAvatar || 'https://i.pravatar.cc/150?u=' + userName}")` }}
                  ></div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[#181410] dark:text-white text-base font-bold leading-tight truncate">
                        {userName}
                      </p>
                      {representativeBadge && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-primary/20 border-2 border-primary rounded-full flex-shrink-0">
                          <span className="text-base">{representativeBadge.icon}</span>
                          <span className="text-xs font-semibold text-primary max-w-[80px] truncate">
                            {representativeBadge.name}
                          </span>
                        </div>
                      )}
                      <span className="material-symbols-outlined text-lg text-gray-400 flex-shrink-0">chevron_right</span>
                    </div>
                    {/* 작성자 레벨 표시 */}
                    <div className="mt-1">
                      <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                        {authorLevelInfo
                          ? `Lv. ${authorLevelInfo.level} ${authorLevelInfo.title}`
                          : 'Lv. 1 여행 입문자'}
                      </p>
                    </div>
                  </div>
                </div>
                {/* 팔로우 버튼: 로그인 + 다른 사용자 게시물일 때만 */}
                {postUserId && user?.id && String(postUserId) !== String(user.id) && (
                  <button
                    onClick={(e) => { e.stopPropagation(); if (isFollowAuthor) { unfollow(postUserId); setIsFollowAuthor(false); } else { follow(postUserId); setIsFollowAuthor(true); } }}
                    className={`shrink-0 py-2 px-4 rounded-xl text-sm font-semibold ${isFollowAuthor ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400' : 'bg-primary text-white'}`}
                  >
                    {isFollowAuthor ? '팔로잉' : '팔로우'}
                  </button>
                )}
              </div>

            {/* 📍 위치 정보 */}
            <div className="flex items-start gap-3 mb-4">
              <span className="material-symbols-outlined text-primary text-2xl flex-shrink-0">location_on</span>
              <div className="flex-1">
                <div className="flex items-center flex-wrap gap-2 mb-2">
                  <p className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    {verifiedLocation || detailedLocationText || locationText}
                  </p>
                  {categoryName && (
                    <span className="text-xs font-semibold text-white bg-primary px-3 py-1 rounded-full">
                      {categoryName.includes('개화') && '🌸'}
                      {categoryName.includes('맛집') && '🍜'}
                      {!categoryName.includes('개화') && !categoryName.includes('맛집') && '🏞️'}
                      {' '}{categoryName}
                    </span>
                  )}
                </div>
                {detailedLocationText && detailedLocationText !== locationText && (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">{locationText}</p>
                )}
                {addressText && (
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-3">{addressText}</p>
                )}
                <div className="flex items-center flex-wrap gap-3 text-sm mb-3">
                  <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                    <span className="material-symbols-outlined !text-lg">schedule</span>
                    <span>
                      {captureLabel || post?.time || (post?.createdAt ? getTimeAgo(post.createdAt) : '방금 전')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                    {weatherInfo.loading ? (
                      <>
                        <span className="material-symbols-outlined !text-lg">wb_sunny</span>
                        <span>로딩중...</span>
                      </>
                    ) : (
                      <>
                        <span className="!text-lg">{weatherInfo.icon}</span>
                        <span>{weatherInfo.condition}, {weatherInfo.temperature}</span>
                      </>
                    )}
                  </div>
                </div>
                {/* 지도에서 보기 버튼 */}
                {fromMap && allPins && mapState && (
                  <button
                    onClick={() => navigate('/map', { state: { mapState, selectedPinId } })}
                    className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm font-semibold"
                  >
                    <span className="material-symbols-outlined text-lg">map</span>
                    <span>지도에서 주변 보기</span>
                  </button>
                )}
              </div>
            </div>

            {/* 📝 작성자 노트 */}
            <div className="flex items-start gap-3 mb-4">
              <span className="material-symbols-outlined text-primary text-2xl flex-shrink-0">edit_note</span>
              <div className="flex-1">
                {(post?.note || post?.content) ? (
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {post.note || post.content}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    작성자가 남긴 노트가 없습니다
                  </p>
                )}
              </div>
            </div>

            {/* 🏷️ 해시태그 */}
              <div className="flex items-start gap-3 mb-4">
                <span className="material-symbols-outlined text-primary text-2xl flex-shrink-0">tag</span>
                <div className="flex-1">
                  {(() => {
                    const getText = (t) =>
                      (typeof t === 'string'
                        ? (t || '').replace(/^#+/, '')
                        : String(t?.name ?? t?.label ?? '')).trim();
                    const seen = new Set();
                    const merged = [];

                    [...(post?.tags || []), ...(post?.aiLabels || [])].forEach((t) => {
                      const raw = getText(t);
                      const key = raw.toLowerCase();
                      if (!key || seen.has(key)) return;
                      seen.add(key);
                      merged.push(raw);
                    });

                    return merged.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {merged.map((tagText, index) => {
                          const korean = tagTranslations[tagText.toLowerCase()] || tagText;
                          const handleTagClick = () => {
                            // 원본 태그 텍스트(앞의 # 제거)를 그대로 HashtagScreen으로 전달
                            const raw = (tagText || '').replace(/^#+/, '').trim();
                            navigate(`/hashtags?tag=${encodeURIComponent(raw)}`);
                          };
                          return (
                            <button
                              key={`tag-${index}`}
                              type="button"
                              onClick={handleTagClick}
                              className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-primary/10 text-primary hover:bg-primary/20 active:bg-primary/30 transition-colors cursor-pointer"
                            >
                              #{korean}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 dark:text-gray-500">태그가 없습니다</p>
                    );
                  })()}
                </div>
              </div>
          </div>

          {/* 정보가 정확해요 - 다른 사용자들이 정보 정확도 평가 */}
          <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">이 정보가 도움이 되었나요?</p>
            <button
              type="button"
              onClick={handleAccuracyClick}
              className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-colors ${
                accuracyMarked
                  ? 'bg-primary/15 text-primary border-2 border-primary'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-2 border-transparent hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <span className={`material-symbols-outlined text-xl ${accuracyMarked ? 'text-primary' : ''}`} style={accuracyMarked ? { fontVariationSettings: "'FILL' 1" } : {}}>
                check_circle
              </span>
              <span>정보가 정확해요</span>
              {accuracyCount > 0 && (
                <span className="text-primary font-bold">({accuracyCount})</span>
              )}
            </button>
          </div>

          {/* 인터랙션 바 - 좋아요, 댓글, 공유 */}
          <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              {/* 좋아요 */}
              <button
                onClick={handleLike}
                className="flex items-center gap-2"
              >
                <span className={`material-symbols-outlined text-2xl ${liked ? 'text-red-500' : 'text-gray-600 dark:text-gray-400'}`} style={liked ? { fontVariationSettings: "'FILL' 1" } : {}}>
                  {liked ? 'favorite' : 'favorite_border'}
                </span>
                <span className={`text-base font-semibold ${liked ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}>
                  {likeCount}
                </span>
              </button>

              {/* 댓글 */}
              <button
                onClick={() => {
                  const input = document.getElementById('comment-input');
                  if (input) {
                    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setTimeout(() => {
                      input.focus();
                    }, 300);
                  }
                }}
                className="flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-2xl text-gray-600 dark:text-gray-400">chat_bubble_outline</span>
                <span className="text-base font-semibold text-gray-700 dark:text-gray-300">{comments.length}</span>
              </button>
            </div>

            {/* 공유 */}
            <button
              onClick={handleShare}
              className="flex items-center"
            >
              <span className="material-symbols-outlined text-2xl text-gray-600 dark:text-gray-400">ios_share</span>
            </button>
          </div>

          {/* 댓글 섹션 */}
          <div className="flex flex-col gap-3 px-4 py-3 bg-white dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#181410] dark:text-white">
                댓글 & 질문 {comments.length > 0 && `(${comments.length})`}
              </h2>
            </div>

            {/* 댓글 목록 */}
            {comments.length > 0 && (
              <div className="flex flex-col gap-3 mt-2">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <div
                      className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-8 w-8 flex-shrink-0"
                      style={{ backgroundImage: `url("${comment.avatar}")` }}
                    ></div>
                    <div className="flex flex-col flex-1">
                      <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg rounded-tl-none">
                        <p className="text-sm font-bold text-[#181410] dark:text-white">
                          {comment.user}
                        </p>
                        <p className="text-sm text-gray-800 dark:text-gray-300 mt-1">
                          {comment.content}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {getTimeAgo(comment.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 댓글 입력 */}
            <div className="flex gap-2 items-center mt-4">
              <input
                id="comment-input"
                className="flex-1 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl h-14 px-4 text-sm text-[#181410] dark:text-white placeholder:text-gray-400 placeholder:text-sm focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none cursor-text"
                placeholder="댓글이나 질문을 입력하세요 💬"
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                onClick={(e) => e.target.focus()}
              />
              <button
                onClick={handleAddComment}
                disabled={!commentText.trim()}
                className={`flex-shrink-0 rounded-xl h-14 px-6 flex items-center justify-center font-bold text-base transition-colors ${commentText.trim()
                  ? 'bg-primary text-white hover:bg-primary/90'
                  : 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
              >
                전송
              </button>
            </div>
            {/* 하단 스크롤 시 다음 게시물로 이동 감지 */}
            {slideablePosts.length > 1 && currentPostIndexState < slideablePosts.length - 1 && (
              <div ref={nextPostSentinelRef} style={{ height: 1, width: '100%', visibility: 'hidden' }} aria-hidden="true" />
            )}
          </div>
        </main>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default PostDetailScreen;



