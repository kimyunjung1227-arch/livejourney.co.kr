import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';
import { getPost, likePost, addQuestion } from '../api/posts';
import { useAuth } from '../contexts/AuthContext';
import { getWeatherByRegion } from '../api/weather';
import { getTimeAgo } from '../utils/dateUtils';
import { toggleLike, isPostLiked, addComment } from '../utils/socialInteractions';
import { toggleInterestPlace, isInterestPlace } from '../utils/interestPlaces';
import { getEarnedBadgesForUser } from '../utils/badgeSystem';
import { getUserLevel } from '../utils/levelSystem';

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
  
  // 슬라이드 가능한 게시물 목록
  const slideablePosts = useMemo(() => {
    if (allPosts && Array.isArray(allPosts) && allPosts.length > 0) {
      return allPosts;
    }
    return passedPost ? [passedPost] : [];
  }, [allPosts, passedPost]);

  // 미디어 배열 (이미지 + 동영상) (useMemo) - handleImageSwipe보다 먼저 정의
  const mediaItems = useMemo(() => {
    const images = post?.images || (post?.image ? [post.image] : []);
    const videos = post?.videos || [];
    // 이미지와 동영상을 합쳐서 하나의 배열로 만들기
    return [...images.map(img => ({ type: 'image', url: img })), ...videos.map(vid => ({ type: 'video', url: vid }))];
  }, [post]);
  
  const images = useMemo(() => 
    post?.images || (post?.image ? [post.image] : [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAuQD6UVDY8Zj1lLvuh-jXx2a7MWZ7EehcGjjrvuunpEYhg8CUN-UEciHT5HAy9SeWSK1-fE8LhjG8Gzz3xoeckZij4ZVPemMw9-nzvve8C4sDBTLSMmwEH3s4ykQbumGqoOQeXp44POQQOpYUz4_1b9u35CfXGOoxaeMP3x0PbHho7ID3cbvNmrM5S39_rhBtzhOgp-AGY3I-8XBQCtqXWRwq4XXNEAj26oWc5KlUayXQ0ZHm5qBgyCMXQ7IC5l6Q09gsdt2fZ4009'
    ]),
    [post]
  );

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
        console.log('✅ localStorage에서 게시물 찾음:', localPost.id);
        setPost(localPost);
        const allComments = [...(localPost.comments || []), ...(localPost.qnaList || [])];
        setComments(allComments);
        setLikeCount(localPost.likes || 0);
        setLiked(isPostLiked(localPost.id));
        setIsFavorited(isInterestPlace(localPost.location || localPost.placeName));
        setLoading(false);
        return;
      }
      
      // localStorage에 없으면 API 호출 (네트워크 오류는 조용히 처리)
      console.log('🔍 API에서 게시물 조회 중:', postId);
      const response = await getPost(postId);
      if (response.success && response.post) {
        setPost(response.post);
        setQnaList(formatQnA(response.post.questions || []));
        setLikeCount(response.post.likesCount || 0);
      } else {
        // 백엔드 미연결 시 조용히 돌아가기
        navigate(-1);
      }
    } catch (error) {
      // 네트워크 오류는 조용히 처리
      if (error.code === 'ERR_NETWORK' || error.code === 'ERR_CONNECTION_REFUSED') {
        navigate(-1);
      } else {
        console.error('❌ 게시물 불러오기 실패:', error);
        alert('게시물을 불러오는데 실패했습니다.');
        navigate(-1);
      }
    } finally {
      setLoading(false);
    }
  }, [postId, passedPost, navigate, formatQnA]);

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
    // 즉각적으로 UI 업데이트
    const newLikedState = !liked;
    setLiked(newLikedState);
    
    const result = toggleLike(post.id);
    setLiked(result.isLiked);
    setLikeCount(result.newCount);
    
    // 좋아요를 누를 때만 애니메이션 표시 (좋아요 취소가 아닐 때)
    if (result.isLiked && !wasLiked) {
      setShowHeartAnimation(true);
      
      // 애니메이션 완료 후 숨기기
      setTimeout(() => {
        setShowHeartAnimation(false);
      }, 1000);
    }
    
    console.log(result.isLiked ? '❤️ 좋아요!' : '💔 좋아요 취소');
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
    const newComments = addComment(post.id, commentText.trim(), username);
    setComments(newComments);
    setCommentText('');
    
    console.log('💬 댓글 추가:', commentText);
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
  
  const locationText = useMemo(() => post?.location?.name || post?.location || post?.title || '여행지', [post]);
  const detailedLocationText = useMemo(() => post?.detailedLocation || post?.placeName || null, [post]);
  const addressText = useMemo(() => post?.address || null, [post]);
  const userName = useMemo(() => post?.user?.username || post?.user || '실시간정보왕', [post]);
  const userBadge = useMemo(() => post?.user?.badges?.[0] || post?.badge || '여행러버', [post]);
  const timeText = useMemo(() => post?.time || (post?.createdAt ? getTimeAgo(post.createdAt) : '방금 전'), [post]);
  const categoryName = useMemo(() => post?.categoryName || null, [post]);

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
        console.log('✅ 공유 성공!');
        // 공유는 포인트 없음 (악용 가능성 높음)
      } else {
        // Web Share API 미지원 시 URL 복사
        await navigator.clipboard.writeText(window.location.href);
        alert('✅ 링크가 복사되었습니다!\n\n다른 사람에게 공유해보세요!');
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('공유 실패:', error);
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
      const fetchWeather = async () => {
        try {
          setWeatherInfo(prev => ({ ...prev, loading: true }));
          const result = await getWeatherByRegion(locationText);
          if (result.success) {
            setWeatherInfo({
              icon: result.weather.icon,
              condition: result.weather.condition,
              temperature: result.weather.temperature,
              loading: false
            });
          }
        } catch (error) {
          console.error('날씨 정보 조회 실패:', error);
          setWeatherInfo(prev => ({ ...prev, loading: false }));
        }
      };
      fetchWeather();
    }
  }, [post, locationText]);

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
      style={{ height: '100vh', overflow: 'hidden' }}
    >
      <div 
        className="screen-content"
        style={{ height: '100%', overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch' }}
      >
        <div className="screen-header flex items-center bg-white dark:bg-gray-900 p-4 pb-2 shadow-sm relative z-50">
          <button 
            onClick={() => {
              // 지도에서 왔다면 지도 상태를 유지하며 돌아가기
              if (location.state?.fromMap && location.state?.mapState) {
                navigate('/map', { state: { mapState: location.state.mapState } });
              } else {
                navigate(-1);
              }
            }}
            className="text-[#181410] dark:text-white flex size-12 shrink-0 items-center"
          >
            <span className="material-symbols-outlined text-2xl">arrow_back</span>
          </button>
        </div>

        {/* 하트 애니메이션 오버레이 */}
        {showHeartAnimation && (
          <div className="fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none">
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

        <div className="flex w-full bg-white dark:bg-gray-900">
          <div 
            className="image-swipe-area w-full gap-1 overflow-hidden bg-white dark:bg-gray-900 aspect-[4/3] flex relative shadow-md"
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
                    className="w-full flex-shrink-0 aspect-[4/3] relative"
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
                      <div
                        className="w-full h-full bg-center bg-no-repeat bg-cover"
                        style={{ backgroundImage: `url("${media.url}")` }}
                      />
                    )}
                  </div>
                )) : images.map((image, index) => (
                  <div
                    key={index}
                    className="w-full flex-shrink-0 bg-center bg-no-repeat bg-cover aspect-[4/3]"
                    style={{ backgroundImage: `url("${image}")` }}
                  ></div>
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
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                        index === currentImageIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/70'
                      }`}
                    ></div>
                  ))}
                </div>

                {/* 좌우 화살표 버튼 - 무한 슬라이드이므로 항상 표시 */}
                <button
                  onClick={() => handleImageSwipe('right')}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 backdrop-blur-sm text-white rounded-full w-12 h-12 flex items-center justify-center hover:bg-black/60 transition-colors z-10"
                >
                  <span className="material-symbols-outlined text-3xl">chevron_left</span>
                </button>
                <button
                  onClick={() => handleImageSwipe('left')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 backdrop-blur-sm text-white rounded-full w-12 h-12 flex items-center justify-center hover:bg-black/60 transition-colors z-10"
                >
                  <span className="material-symbols-outlined text-3xl">chevron_right</span>
                </button>
              </>
            )}
          </div>
        </div>

        <main className="flex flex-col bg-gray-50 dark:bg-gray-900" style={{ minHeight: 'auto' }}>
          {/* 작성자 정보 */}
          <div className="px-4 pt-5 pb-3 bg-white dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <div 
                className="flex gap-3 items-center cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => {
                  // userId 추출 (여러 형태 지원)
                  const postUserId = post?.userId || 
                                    (typeof post?.user === 'string' ? post.user : post?.user?.id) ||
                                    post?.user;
                  const currentUserId = user?.id;
                  
                  console.log('프로필 이동:', { postUserId, currentUserId, isSame: postUserId === currentUserId });
                  
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
                  className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-12 w-12 ring-2 ring-primary/20"
                  style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBmqhlNyURK2oHutCqs0XjqQdUbYLEIw3Fjyr9GN8AIkmL-_HX4k5P5P4nLUvuxwIg-wP6shqONVg0iiP-s-n6C2-XParwlSyFTZidJV97x3KU1TTOWzd3_pEmNWHkiyjJFzoB24bPKitU6ZzZvEW435KDcEQHZUBOnGlHOVMfvf7QEOkfGRCPywYOZmkeTwUuhfPqmOTfmWZdGrP6TByVTEA9H1q3oZUgp3VRxzCPOQmnOt1kKVUir_711ENBZiDYZtyFXSfsjri-z")' }}
                ></div>
                <div className="flex flex-col flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-[#181410] dark:text-white text-base font-bold leading-tight">
                      {userName}
                    </p>
                    {representativeBadge && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-primary/20 border-2 border-primary rounded-full">
                        <span className="text-base">{representativeBadge.icon}</span>
                        <span className="text-xs font-semibold text-primary max-w-[80px] truncate">
                          {representativeBadge.name}
                        </span>
                      </div>
                    )}
                    <span className="material-symbols-outlined text-lg text-gray-400">chevron_right</span>
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
            </div>
          </div>

          {/* 통합 정보 카드 - 하단 흐름형 */}
          <div className="mx-4 mt-3 mb-4 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-5 space-y-5">
              
              {/* 📍 위치 정보 */}
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary text-2xl flex-shrink-0">location_on</span>
                <div className="flex-1">
                  <div className="flex items-center flex-wrap gap-2 mb-2">
                    <p className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                      {detailedLocationText || locationText}
                    </p>
                    {categoryName && (
                      <span className="text-xs font-semibold text-white bg-primary px-3 py-1 rounded-full">
                        {categoryName === '개화 상황' && '🌸'}
                        {categoryName === '맛집 정보' && '🍜'}
                        {(!categoryName || !['개화 상황', '맛집 정보'].includes(categoryName)) && '🏞️'}
                        {' '}{categoryName || '추천 장소'}
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
                      <span>{timeText}</span>
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

              {/* 🏷️ 해시태그 */}
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary text-2xl flex-shrink-0">tag</span>
                <div className="flex-1">
                  {((post?.tags && post.tags.length > 0) || (post?.aiLabels && post.aiLabels.length > 0)) ? (
                    <div className="flex flex-wrap gap-2">
                      {/* 모든 태그를 동일한 스타일로 표시 (한국어로 번역) */}
                      {(post?.tags || []).map((tag, index) => {
                        const tagText = typeof tag === 'string' ? tag.replace('#', '') : tag.name || '태그';
                        const koreanTag = tagTranslations[tagText.toLowerCase()] || tagText;
                        return (
                          <span 
                            key={`tag-${index}`}
                            className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer"
                          >
                            #{koreanTag}
                          </span>
                        );
                      })}
                      {/* AI 라벨도 같은 스타일로 (한국어로 번역) */}
                      {(post?.aiLabels || []).map((label, index) => {
                        const labelText = typeof label === 'string' ? label.replace('#', '') : label.name || '라벨';
                        const koreanLabel = tagTranslations[labelText.toLowerCase()] || labelText;
                        return (
                          <span 
                            key={`ai-${index}`}
                            className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer"
                          >
                            #{koreanLabel}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                      태그가 없습니다
                    </p>
                  )}
                </div>
              </div>

              {/* 📝 작성자 노트 */}
              <div className="flex items-start gap-3">
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

            </div>
          </div>

          {/* 액션 버튼 - 크고 명확하게 */}
          <div className="px-4 py-4 flex items-center justify-between bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              {/* 좋아요 */}
              <button 
                onClick={handleLike}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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
                className="flex items-center gap-2 px-4 py-2.5 rounded-full hover:bg-primary/10 transition-colors"
              >
                <span className="material-symbols-outlined text-2xl text-gray-600 dark:text-gray-400">chat_bubble_outline</span>
                <span className="text-base font-semibold text-gray-700 dark:text-gray-300">{comments.length}</span>
              </button>
            </div>
            
            {/* 공유 */}
            <button 
              onClick={handleShare}
              className="flex items-center gap-2 px-3 py-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <span className="material-symbols-outlined text-2xl text-gray-600 dark:text-gray-400">ios_share</span>
            </button>
          </div>

          {/* 댓글 섹션 */}
          <div className="flex flex-col gap-4 px-4 py-5 bg-white dark:bg-gray-900">
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
                className={`flex-shrink-0 rounded-xl h-14 px-6 flex items-center justify-center font-bold text-base transition-colors ${
                  commentText.trim()
                    ? 'bg-primary text-white hover:bg-primary/90'
                    : 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                전송
              </button>
            </div>
          </div>
        </main>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default PostDetailScreen;



