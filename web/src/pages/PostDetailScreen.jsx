import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';
import { getPost, likePost, addQuestion } from '../api/posts';
import { useAuth } from '../contexts/AuthContext';
import { notifyPoints } from '../utils/notifications';
import { tryEarnPoints } from '../utils/pointsSystem';
import { getWeatherByRegion } from '../api/weather';

const PostDetailScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { postId } = useParams();
  const { user } = useAuth();
  const { post: passedPost } = location.state || {};

  const [post, setPost] = useState(passedPost);
  const [loading, setLoading] = useState(!passedPost);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post?.likesCount || 0);
  const [question, setQuestion] = useState('');
  const [qnaList, setQnaList] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [weatherInfo, setWeatherInfo] = useState({
    icon: '☀️',
    condition: '맑음',
    temperature: '20°C',
    loading: true
  });

  // 시간 포맷 변환 (useCallback)
  const getTimeAgo = useCallback((date) => {
    const now = new Date();
    const postDate = new Date(date);
    const diffMs = now - postDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    return `${diffDays}일 전`;
  }, []);

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
      setQnaList(passedPost.qnaList || []);
      setLikeCount(passedPost.likesCount || 0);
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
        setQnaList(localPost.qnaList || []);
        setLikeCount(localPost.likesCount || localPost.likes || 0);
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

  // 좋아요 처리 (토글 가능!)
  const handleLike = useCallback(async () => {
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      // 즉시 UI 업데이트 (토글!)
      const newLiked = !liked;
      const newCount = newLiked ? likeCount + 1 : likeCount - 1;
      setLiked(newLiked);
      setLikeCount(newCount);
      
      console.log(`${newLiked ? '❤️ 좋아요 추가' : '💔 좋아요 취소'}: ${post.id}`);

      const postIdToUse = post._id || post.id;
      
      // 로컬 데이터는 state만 업데이트
      if (!postIdToUse || postIdToUse.toString().includes('-')) {
        if (newLiked) {
          const result = tryEarnPoints('좋아요', postIdToUse);
          if (result.success) {
            notifyPoints(result.points, '좋아요');
          } else if (result.reason === 'cooldown') {
            // 쿨다운 중에는 좋아요는 되지만 포인트는 안 줌
            console.log('⏰ 좋아요는 가능하지만 포인트 쿨다운 중');
          } else if (result.message) {
            alert(result.message);
            // 한도 초과 시 좋아요 취소
            setLiked(liked);
            setLikeCount(likeCount);
            return;
          }
        }
        return;
      }

      // API 호출 (네트워크 오류는 조용히 처리)
      const response = await likePost(postIdToUse);
      if (response.success) {
        // API 응답으로 최종 확정
        setLiked(response.liked);
        setLikeCount(response.likesCount);
        
        if (response.liked) {
          const result = tryEarnPoints('좋아요', postIdToUse);
          if (result.success) {
            notifyPoints(result.points, '좋아요');
          } else if (result.message && result.reason !== 'cooldown') {
            alert(result.message);
          }
        }
      }
    } catch (error) {
      // 네트워크 오류는 조용히 무시 (이미 UI 업데이트 완료)
      if (error.code !== 'ERR_NETWORK' && error.code !== 'ERR_CONNECTION_REFUSED') {
        console.error('좋아요 실패:', error);
        // 실패 시 원래대로 되돌림
        setLiked(liked);
        setLikeCount(likeCount);
      }
    }
  }, [user, post, liked, likeCount]);

  // 질문 등록 (useCallback)
  const handleSendQuestion = useCallback(async () => {
    if (!question.trim()) {
      alert('질문을 입력해주세요.');
      return;
    }
    
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      setSubmitting(true);
      const postIdToUse = post._id || post.id;
      
      // 로컬 데이터 (Mock/업로드)인 경우
      if (!postIdToUse || postIdToUse.toString().includes('-')) {
        console.log('📝 로컬 게시물에 질문 등록:', postIdToUse);
        
        const newQuestion = {
          id: `local-q-${Date.now()}`,
          type: 'question',
          user: user.username || '나',
          content: question,
          time: '방금',
          avatar: user.profileImage || 'https://via.placeholder.com/40'
        };
        
        // 화면에 즉시 표시
        const updatedQnaList = [...qnaList, newQuestion];
        setQnaList(updatedQnaList);
        
        // localStorage에도 저장
        try {
          const localPosts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');
          const postIndex = localPosts.findIndex(p => 
            p.id === postIdToUse || 
            p.id === `uploaded-${postIdToUse}` ||
            p.id === `realtime-${postIdToUse}` ||
            p.id === `crowded-${postIdToUse}` ||
            p.id === `recommend-${postIdToUse}`
          );
          
          if (postIndex !== -1) {
            // 게시물에 질문 추가
            if (!localPosts[postIndex].qnaList) {
              localPosts[postIndex].qnaList = [];
            }
            localPosts[postIndex].qnaList.push(newQuestion);
            
            // localStorage 업데이트
            localStorage.setItem('uploadedPosts', JSON.stringify(localPosts));
            console.log('✅ localStorage에 질문 저장 완료!');
          }
        } catch (error) {
          console.error('localStorage 저장 실패:', error);
        }
        
        setQuestion('');
        
        // 포인트 획득 시도
        const result = tryEarnPoints('질문 작성', `${postIdToUse}_${Date.now()}`);
        if (result.success) {
          notifyPoints(result.points, '질문 작성');
          alert(`✅ 질문이 등록되었습니다!\n포인트 ${result.points}P를 획득했습니다.`);
        } else if (result.message) {
          alert(`✅ 질문이 등록되었습니다!\n\n⚠️ ${result.message}`);
        } else {
          alert('✅ 질문이 등록되었습니다!');
        }
        return;
      }

      // API를 통한 질문 등록
      console.log('🔍 API를 통해 질문 등록:', postIdToUse);
      const response = await addQuestion(postIdToUse, question);
      if (response.success) {
        const newQuestion = {
          id: response.question._id,
          type: 'question',
          user: user.username,
          content: question,
          time: '방금',
          avatar: user.profileImage || 'https://via.placeholder.com/40'
        };
        setQnaList([...qnaList, newQuestion]);
        setQuestion('');
        
        // 포인트 획득 시도
        const result = tryEarnPoints('질문 작성', `${postIdToUse}_${Date.now()}`);
        if (result.success) {
          notifyPoints(result.points, '질문 작성');
          alert(`✅ 질문이 등록되었습니다!\n포인트 ${result.points}P를 획득했습니다.`);
        } else if (result.message) {
          alert(`✅ 질문이 등록되었습니다!\n\n⚠️ ${result.message}`);
        } else {
          alert('✅ 질문이 등록되었습니다!');
        }
      }
    } catch (error) {
      // 네트워크 오류는 조용히 처리
      if (error.code !== 'ERR_NETWORK' && error.code !== 'ERR_CONNECTION_REFUSED') {
        console.error('❌ 질문 등록 실패:', error);
        alert('질문 등록에 실패했습니다.');
      }
    } finally {
      setSubmitting(false);
    }
  }, [question, user, post, qnaList]);

  // 이미지 스와이프 (useCallback)
  const handleImageSwipe = useCallback((direction) => {
    if (direction === 'left' && currentImageIndex < images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    } else if (direction === 'right' && currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  }, [currentImageIndex]);

  // 초기 데이터 로드
  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  // 이미지 배열 (useMemo) - 먼저 정의
  const images = useMemo(() => 
    post?.images || (post?.image ? [post.image] : [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAuQD6UVDY8Zj1lLvuh-jXx2a7MWZ7EehcGjjrvuunpEYhg8CUN-UEciHT5HAy9SeWSK1-fE8LhjG8Gzz3xoeckZij4ZVPemMw9-nzvve8C4sDBTLSMmwEH3s4ykQbumGqoOQeXp44POQQOpYUz4_1b9u35CfXGOoxaeMP3x0PbHho7ID3cbvNmrM5S39_rhBtzhOgp-AGY3I-8XBQCtqXWRwq4XXNEAj26oWc5KlUayXQ0ZHm5qBgyCMXQ7IC5l6Q09gsdt2fZ4009'
    ]),
    [post]
  );
  
  const locationText = useMemo(() => post?.location?.name || post?.location || post?.title || '여행지', [post]);
  const detailedLocationText = useMemo(() => post?.detailedLocation || post?.placeName || null, [post]);
  const addressText = useMemo(() => post?.address || null, [post]);
  const userName = useMemo(() => post?.user?.username || post?.user || '실시간정보왕', [post]);
  const userBadge = useMemo(() => post?.user?.badges?.[0] || post?.badge || '여행러버', [post]);
  const timeText = useMemo(() => post?.time || (post?.createdAt ? getTimeAgo(post.createdAt) : '방금 전'), [post, getTimeAgo]);
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
    <div className="flex h-full w-full flex-col bg-background-light dark:bg-background-dark">
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="flex items-center bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm p-4 pb-2 justify-between sticky top-0 z-10">
          <button 
            onClick={() => navigate(-1)}
            className="text-[#181410] dark:text-white flex size-12 shrink-0 items-center"
          >
            <span className="material-symbols-outlined text-2xl">arrow_back</span>
          </button>
          <div className="flex w-12 items-center justify-end">
            <button 
              onClick={() => alert('더보기 메뉴')}
              className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 bg-transparent text-[#181410] dark:text-white gap-2 text-base font-bold leading-normal tracking-[0.015em] min-w-0 p-0"
            >
              <span className="material-symbols-outlined text-2xl">more_vert</span>
            </button>
          </div>
        </div>

        <div className="flex w-full bg-background-light dark:bg-background-dark">
          <div className="w-full gap-1 overflow-hidden bg-background-light dark:bg-background-dark aspect-[4/3] flex relative">
            <div className="w-full overflow-hidden">
              <div 
                className="flex transition-transform duration-300 ease-in-out"
                style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
              >
                {images.map((image, index) => (
                  <div
                    key={index}
                    className="w-full flex-shrink-0 bg-center bg-no-repeat bg-cover aspect-[4/3]"
                    style={{ backgroundImage: `url("${image}")` }}
                  ></div>
                ))}
              </div>
            </div>

            {images.length > 1 && (
              <>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {images.map((_, index) => (
                    <div
                      key={index}
                      className={`h-1.5 rounded-full transition-all ${
                        index === currentImageIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/50'
                      }`}
                    ></div>
                  ))}
                </div>

                {currentImageIndex > 0 && (
                  <button
                    onClick={() => handleImageSwipe('right')}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 backdrop-blur-sm text-white rounded-full w-10 h-10 flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined">chevron_left</span>
                  </button>
                )}
                {currentImageIndex < images.length - 1 && (
                  <button
                    onClick={() => handleImageSwipe('left')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 backdrop-blur-sm text-white rounded-full w-10 h-10 flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        <main className="p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-3 items-center cursor-pointer">
              <div
                className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-10 w-10"
                style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBmqhlNyURK2oHutCqs0XjqQdUbYLEIw3Fjyr9GN8AIkmL-_HX4k5P5P4nLUvuxwIg-wP6shqONVg0iiP-s-n6C2-XParwlSyFTZidJV97x3KU1TTOWzd3_pEmNWHkiyjJFzoB24bPKitU6ZzZvEW435KDcEQHZUBOnGlHOVMfvf7QEOkfGRCPywYOZmkeTwUuhfPqmOTfmWZdGrP6TByVTEA9H1q3oZUgp3VRxzCPOQmnOt1kKVUir_711ENBZiDYZtyFXSfsjri-z")' }}
              ></div>
              <div className="flex flex-col">
                <p className="text-[#181410] dark:text-white text-base font-bold leading-tight tracking-[-0.015em]">
                  {userName}
                </p>
                <p className="text-primary text-sm font-semibold leading-normal">
                  🎖️ {userBadge}
                </p>
              </div>
            </div>
          </div>

          {/* 통합 정보 박스 - 지역 + 노트 + 해시태그 */}
          <div className="bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl p-5 border border-orange-100 dark:border-orange-800/30 shadow-md">
            
            {/* 📍 위치 정보 */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-primary text-2xl">location_on</span>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">위치 정보</h3>
              </div>
              <div className="pl-8">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    {detailedLocationText || locationText}
                  </p>
                  {categoryName && (
                    <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      {categoryName === '개화 상황' && '🌸'}
                      {categoryName === '추천 장소' && '🏞️'}
                      {categoryName === '맛집 정보' && '🍜'}
                      {categoryName === '가볼만한곳' && '🏞️'}
                      {' '}{categoryName}
                    </span>
                  )}
                </div>
                {detailedLocationText && detailedLocationText !== locationText && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{locationText}</p>
                )}
                {addressText && (
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">{addressText}</p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                    <span className="material-symbols-outlined !text-sm">schedule</span>
                    <span>{timeText}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                    {weatherInfo.loading ? (
                      <>
                        <span className="material-symbols-outlined !text-sm">wb_sunny</span>
                        <span>로딩중...</span>
                      </>
                    ) : (
                      <>
                        <span className="!text-sm">{weatherInfo.icon}</span>
                        <span>{weatherInfo.condition}, {weatherInfo.temperature}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 📝 개인 노트 */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-primary text-2xl">edit_note</span>
                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">작성자의 노트</h3>
              </div>
              <div className="pl-8">
                {(post?.note || post?.content) ? (
                  <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                    {post.note || post.content}
                  </p>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                    작성자가 남긴 노트가 없습니다.
                  </p>
                )}
              </div>
            </div>

            {/* 🏷️ 해시태그 - 항상 표시 */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-primary text-2xl">tag</span>
                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">태그</h3>
              </div>
              <div className="pl-8">
                {((post?.tags && post.tags.length > 0) || (post?.aiLabels && post.aiLabels.length > 0)) ? (
                  <div className="flex flex-wrap gap-2">
                    {/* 태그 표시 (문자열) */}
                    {(post?.tags || []).map((tag, index) => (
                      <span 
                        key={`tag-${index}`}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer"
                      >
                        #{typeof tag === 'string' ? tag : tag.name || '태그'}
                      </span>
                    ))}
                    {/* AI 라벨 표시 (객체에서 name만 추출) */}
                    {(post?.aiLabels || []).map((label, index) => (
                      <span 
                        key={`ai-${index}`}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors cursor-pointer"
                      >
                        #{typeof label === 'string' ? label : label.name || '라벨'}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                    태그가 없습니다.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 py-2 border-b border-gray-200 dark:border-gray-700">
            <button 
              onClick={handleLike}
              className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
            >
              <span className={`material-symbols-outlined text-2xl ${liked ? 'text-red-500' : ''}`} style={liked ? { fontVariationSettings: "'FILL' 1" } : {}}>
                {liked ? 'favorite' : 'favorite_border'}
              </span>
              <span className="text-sm font-medium">{likeCount}</span>
            </button>
            <button 
              onClick={handleShare}
              className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-2xl">ios_share</span>
            </button>
          </div>

          <div className="flex flex-col gap-4 py-4">
            <h2 className="text-lg font-bold text-[#181410] dark:text-white">질문하기</h2>

            <div className="flex gap-2 items-center">
              <input
                className="flex-grow bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded-lg h-12 px-4 text-[#181410] dark:text-white placeholder:text-gray-500 focus:ring-primary focus:border-primary focus:outline-none"
                placeholder="현장 상황에 대한 질문을 입력하세요."
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendQuestion()}
              />
              <button
                onClick={handleSendQuestion}
                disabled={!question.trim() || submitting}
                className={`flex-shrink-0 rounded-lg h-12 w-16 flex items-center justify-center font-bold transition-colors ${
                  question.trim() && !submitting
                    ? 'bg-primary text-white hover:bg-primary/90'
                    : 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                {submitting ? '...' : '전송'}
              </button>
            </div>

            <div className="flex flex-col gap-4 mt-4">
              {qnaList.map((item) => (
                <div 
                  key={item.id} 
                  className={`flex gap-3 ${item.type === 'answer' ? 'ml-8' : ''}`}
                >
                  <div
                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-8 w-8 flex-shrink-0"
                    style={{ backgroundImage: `url("${item.avatar}")` }}
                  ></div>
                  <div className="flex flex-col flex-1">
                    <div className={`p-3 rounded-lg rounded-tl-none ${
                      item.type === 'answer'
                        ? 'bg-primary/10 dark:bg-primary/20'
                        : 'bg-gray-100 dark:bg-gray-800'
                    }`}>
                      <p className="text-sm font-bold text-[#181410] dark:text-white">
                        {item.user}
                        {item.isAuthor && (
                          <span className="text-primary text-xs font-semibold ml-1.5">작성자</span>
                        )}
                      </p>
                      <p className="text-sm text-gray-800 dark:text-gray-300 mt-1">
                        {item.content}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {item.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default PostDetailScreen;











































