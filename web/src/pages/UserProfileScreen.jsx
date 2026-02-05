import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';
import { useAuth } from '../contexts/AuthContext';
import { getEarnedBadgesForUser, BADGES, getBadgeDisplayName } from '../utils/badgeSystem';
import { getCoordinatesByLocation } from '../utils/regionLocationMapping';
import { follow, unfollow, isFollowing, getFollowerCount, getFollowingCount } from '../utils/followSystem';
import { logger } from '../utils/logger';
import { getDisplayImageUrl } from '../api/upload';

const UserProfileScreen = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [representativeBadge, setRepresentativeBadge] = useState(null);
  const [stats, setStats] = useState({ posts: 0 });
  const [loading, setLoading] = useState(true);
  const [showAllBadges, setShowAllBadges] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null); // 여행 지도 핀 클릭 시 가벼운 사진상세 모달용
  const [isFollow, setIsFollow] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);

  // 지도 관련
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (!userId) {
      navigate(-1);
      return;
    }

    // userId가 변경되면 상태 완전 초기화
    setLoading(true);
    setUser(null);
    setUserPosts([]);
    setEarnedBadges([]);
    setRepresentativeBadge(null);
    setStats({ posts: 0 });
    setShowAllBadges(false);

    // 해당 사용자의 정보 찾기 (게시물에서)
    const uploadedPosts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');

    // userId 매칭 (일관된 로직 - PostDetailScreen과 동일)
    const userPost = uploadedPosts.find(p => {
      // userId 추출 로직 (PostDetailScreen과 동일)
      let postUserId = p.userId;

      // p.user가 문자열인 경우
      if (!postUserId && typeof p.user === 'string') {
        postUserId = p.user;
      }

      // p.user가 객체인 경우
      if (!postUserId && p.user && typeof p.user === 'object') {
        postUserId = p.user.id || p.user.userId;
      }

      // 그 외의 경우
      if (!postUserId) {
        postUserId = p.user;
      }

      // 문자열 비교를 위해 모두 문자열로 변환
      return String(postUserId) === String(userId);
    });

    if (userPost) {
      const postUserId = userPost.userId ||
        (typeof userPost.user === 'string' ? userPost.user : userPost.user?.id) ||
        userPost.user;
      const foundUser = {
        id: String(userId), // 일관성을 위해 문자열로 변환
        username: (typeof userPost.user === 'string' ? userPost.user : userPost.user?.username) ||
          String(postUserId) ||
          '사용자',
        profileImage: null
      };
      setUser(foundUser);
    } else {
      // 사용자 정보를 찾을 수 없으면 기본값
      setUser({
        id: String(userId),
        username: '사용자',
        profileImage: null
      });
    }

    // 뱃지 로드 - 실제 구현된 뱃지 시스템 사용
    const badges = getEarnedBadgesForUser(userId) || [];
    setEarnedBadges(badges);

    // 대표 뱃지 로드
    const repBadgeJson = localStorage.getItem(`representativeBadge_${userId}`);
    if (repBadgeJson) {
      const repBadge = JSON.parse(repBadgeJson);
      setRepresentativeBadge(repBadge);
    } else if (badges && badges.length > 0) {
      // 대표 뱃지가 없으면 "획득한 뱃지들(badges)" 중에서 대표 뱃지를 선택
      // userId 기반 해시로 일관된 인덱스 선택
      let badgeIndex = 0;
      if (userId) {
        const hash = userId.toString().split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        badgeIndex = hash % badges.length;
      }
      const repFromEarned = badges[badgeIndex];
      localStorage.setItem(`representativeBadge_${userId}`, JSON.stringify(repFromEarned));
      setRepresentativeBadge(repFromEarned);
    }

    // 해당 사용자의 게시물 로드 (일관된 로직)
    const posts = uploadedPosts.filter(post => {
      // userId 추출 로직 (PostDetailScreen과 동일)
      let postUserId = post.userId;

      // post.user가 문자열인 경우
      if (!postUserId && typeof post.user === 'string') {
        postUserId = post.user;
      }

      // post.user가 객체인 경우
      if (!postUserId && post.user && typeof post.user === 'object') {
        postUserId = post.user.id || post.user.userId;
      }

      // 그 외의 경우
      if (!postUserId) {
        postUserId = post.user;
      }

      // 문자열 비교를 위해 모두 문자열로 변환
      return String(postUserId) === String(userId);
    });
    setUserPosts(posts);

    // 사용 가능한 날짜 목록 (최신순) - 사진/동영상이 있는 게시물 + 로컬 날짜 기준(필터와 동일)
    const postsWithMedia = posts.filter(
      p => (p.images && p.images.length > 0) || p.image || p.imageUrl || (p.videos && p.videos.length > 0)
    );
    const dateSet = new Set();
    postsWithMedia.forEach(post => {
      const raw = post.createdAt || post.timestamp;
      if (raw == null || raw === '') return;
      const d = new Date(raw);
      if (isNaN(d.getTime())) return;
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      dateSet.add(`${y}-${m}-${day}`);
    });
    const dates = [...dateSet].sort((a, b) => new Date(b) - new Date(a));
    setAvailableDates(dates);

    setStats({ posts: posts.length });

    setLoading(false);

    // cleanup 함수: userId가 변경될 때 이전 상태 완전 초기화
    return () => {
      setLoading(true);
      setUser(null);
      setUserPosts([]);
      setEarnedBadges([]);
      setRepresentativeBadge(null);
      setStats({ posts: 0 });
      setShowAllBadges(false);
      setSelectedDate('');
      setAvailableDates([]);
    };
  }, [userId, navigate]);

  // 팔로우 / 팔로워·팔로잉 수 로드 및 followsUpdated 구독
  useEffect(() => {
    if (!userId) return;
    const load = () => {
      setFollowerCount(getFollowerCount(userId));
      setFollowingCount(getFollowingCount(userId));
      setIsFollow(isFollowing(null, userId));
    };
    load();
    window.addEventListener('followsUpdated', load);
    return () => window.removeEventListener('followsUpdated', load);
  }, [userId]);

  // 날짜별 필터된 게시물 (지도 + 그리드 공통) + 항상 날짜순(최신순) 정렬
  const filteredUserPosts = React.useMemo(() => {
    let list = userPosts;
    if (selectedDate) {
      const filterDate = new Date(selectedDate);
      filterDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(filterDate);
      nextDay.setDate(nextDay.getDate() + 1);
      list = userPosts.filter(post => {
        const postDate = new Date(post.createdAt || post.timestamp || Date.now());
        postDate.setHours(0, 0, 0, 0);
        return postDate >= filterDate && postDate < nextDay;
      });
    }
    // 사용자가 올린 피드를 날짜순(최신순)으로 정렬
    return [...list].sort((a, b) => {
      const ta = (a.createdAt || a.timestamp || 0) ? new Date(a.createdAt || a.timestamp).getTime() : 0;
      const tb = (b.createdAt || b.timestamp || 0) ? new Date(b.createdAt || b.timestamp).getTime() : 0;
      return tb - ta;
    });
  }, [userPosts, selectedDate]);

  // 지도에 표시할 수 있는 게시물 (filteredUserPosts 중 coordinates 또는 지역명으로 좌표 추출 가능)
  const postsForMap = React.useMemo(() => {
    return filteredUserPosts.filter(post => {
      const coords = post.coordinates || getCoordinatesByLocation(post.detailedLocation || post.location);
      return coords && coords.lat != null && coords.lng != null;
    });
  }, [filteredUserPosts]);

  // 여행 지도 초기화 (다른 사용자 프로필에서 해당 사용자의 여행 경로 표시)
  const initTravelMap = useCallback(() => {
    if (!mapRef.current || postsForMap.length === 0) {
      setMapLoading(false);
      return;
    }
    if (!window.kakao || !window.kakao.maps) {
      setMapLoading(false);
      return;
    }

    setMapLoading(true);
    try {
      markersRef.current.forEach(markerData => {
        try {
          if (markerData.overlay) markerData.overlay.setMap(null);
          if (markerData.marker) markerData.marker.setMap(null);
          if (markerData.polyline) markerData.polyline.setMap(null);
        } catch (_) { }
      });
      markersRef.current = [];

      const container = mapRef.current;
      if (!container || container.offsetWidth === 0) {
        setMapLoading(false);
        return;
      }

      let centerLat = 37.5665, centerLng = 126.9780, level = 6;
      const first = postsForMap[0];
      const firstCoords = first.coordinates || getCoordinatesByLocation(first.detailedLocation || first.location);
      if (firstCoords) {
        centerLat = firstCoords.lat;
        centerLng = firstCoords.lng;
        level = 5;
      }

      let map = mapInstance.current;
      if (!map) {
        map = new window.kakao.maps.Map(container, {
          center: new window.kakao.maps.LatLng(centerLat, centerLng),
          level: level,
        });
        mapInstance.current = map;
      } else {
        map.setCenter(new window.kakao.maps.LatLng(centerLat, centerLng));
        map.setLevel(level);
      }

      const pathCoordinates = [];
      const sorted = [...postsForMap].sort((a, b) =>
        new Date(a.createdAt || a.timestamp || 0) - new Date(b.createdAt || b.timestamp || 0)
      );

      sorted.forEach((post, index) => {
        const coords = post.coordinates || getCoordinatesByLocation(post.detailedLocation || post.location);
        if (!coords) return;
        const position = new window.kakao.maps.LatLng(coords.lat, coords.lng);
        pathCoordinates.push(position);

        const imageUrl = getDisplayImageUrl(post.images?.[0] || post.imageUrl || post.image || post.thumbnail);
        const el = document.createElement('div');
        el.innerHTML = `
          <button class="relative w-10 h-10 border-2 border-white shadow-md rounded-md overflow-hidden hover:scale-110 transition-all cursor-pointer" style="z-index:${index}" data-post-id="${post.id}">
            <img class="w-full h-full object-cover" src="${imageUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHJ4PSI0IiBmaWxsPSIjRjNGNEY2Ii8+PHBhdGggZD0iTTIwIDE0QzE3IDE0IDE1IDE2IDE1IDE5YzAgMyAyIDUgNSA1czUtMiA1LTVjMC0zLTIuODEtNS01IDVaIiBmaWxsPSIjOUI5Q0E1Ii8+PC9zdmc+'}" alt="${post.location || '여행지'}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHJ4PSI0IiBmaWxsPSIjRjNGNEY2Ii8+PHBhdGggZD0iTTIwIDE0YzAgMC0zIDItNSAycy01LTItNS0yIiBmaWxsPSIjOUI5Q0E1Ii8+PC9zdmc+';" />
          </button>
        `;
        const btn = el.querySelector('button');
        if (btn) {
          btn.addEventListener('click', () => {
            const idx = filteredUserPosts.findIndex(p => p.id === post.id);
            setSelectedPost({ post, allPosts: filteredUserPosts, currentPostIndex: idx >= 0 ? idx : 0 });
          });
        }
        const overlay = new window.kakao.maps.CustomOverlay({ position, content: el, yAnchor: 1, zIndex: index });
        overlay.setMap(map);
        markersRef.current.push({ overlay });
      });

      if (pathCoordinates.length >= 2) {
        const polyline = new window.kakao.maps.Polyline({
          path: pathCoordinates,
          strokeWeight: 3,
          strokeColor: '#14B8A6',
          strokeOpacity: 0.7,
          strokeStyle: 'solid',
        });
        polyline.setMap(map);
        markersRef.current.push({ polyline });
      }

      if (markersRef.current.length > 0) {
        const bounds = new window.kakao.maps.LatLngBounds();
        markersRef.current.forEach(md => {
          if (md.overlay) bounds.extend(md.overlay.getPosition());
        });
        if (markersRef.current.filter(md => md.overlay).length > 1) {
          map.setBounds(bounds);
        } else {
          const first = markersRef.current.find(md => md.overlay);
          if (first) map.setCenter(first.overlay.getPosition());
        }
      }
    } catch (err) {
      logger.warn('여행 지도 초기화 오류:', err);
    } finally {
      setMapLoading(false);
    }
  }, [postsForMap, filteredUserPosts]);

  useEffect(() => {
    if (postsForMap.length > 0) {
      const t = setTimeout(initTravelMap, 100);
      return () => {
        clearTimeout(t);
        markersRef.current.forEach(md => {
          try {
            if (md.overlay) md.overlay.setMap(null);
            if (md.polyline) md.polyline.setMap(null);
          } catch (_) { }
        });
        markersRef.current = [];
      };
    } else {
      setMapLoading(false);
    }
  }, [postsForMap.length, initTravelMap]);

  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-secondary-light dark:text-text-secondary-dark">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="screen-layout bg-background-light dark:bg-background-dark relative h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col">
      <div className="screen-content flex flex-col flex-1 min-h-0 overflow-hidden">
        {/* 헤더 (고정) */}
        <header className="screen-header flex-shrink-0 bg-white dark:bg-gray-900 flex items-center p-4 justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex size-12 shrink-0 items-center justify-center text-text-primary-light dark:text-text-primary-dark hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-2xl">arrow_back</span>
          </button>
          <h1 className="text-text-primary-light dark:text-text-primary-dark text-base font-semibold">프로필</h1>
          <div className="w-12"></div>
        </header>

        {/* 메인 컨텐츠 (스크롤 영역: 프로필·통계·날짜·지도·피드) */}
        <div
          className="screen-body flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain"
          style={{ minHeight: 0, WebkitOverflowScrolling: 'touch' }}
        >
          {/* 프로필 정보 */}
          <div className="bg-white dark:bg-gray-900 px-6 py-6">
            <div className="flex items-start gap-4 mb-4">
              {/* 프로필 사진 */}
              <div className="flex-shrink-0">
                {user.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt="Profile"
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-teal-100 dark:bg-teal-900 flex items-center justify-center">
                    <span className="material-symbols-outlined text-teal-600 dark:text-teal-400 text-4xl">person</span>
                  </div>
                )}
              </div>

              {/* 사용자 정보 */}
              <div className="flex-1 min-w-0">
                {/* 프로필 이름, 팔로우 버튼, 대표 뱃지, 획득 뱃지 숫자를 한 줄에 가로 배치 */}
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h2 className="text-text-primary-light dark:text-text-primary-dark text-lg font-bold">
                    {user.username || '사용자'}
                  </h2>
                  {/* 팔로우 버튼: 로그인 + 다른 사용자 프로필일 때만 (이름 옆) */}
                  {currentUser && String(currentUser.id) !== String(userId) && (
                    <button
                      onClick={() => {
                        if (followLoading) return;
                        setFollowLoading(true);
                        if (isFollow) {
                          unfollow(userId);
                          setIsFollow(false);
                          setFollowerCount((c) => Math.max(0, c - 1));
                        } else {
                          follow(userId);
                          setIsFollow(true);
                          setFollowerCount((c) => c + 1);
                        }
                        setFollowLoading(false);
                      }}
                      disabled={followLoading}
                      className={`shrink-0 py-1.5 px-3 rounded-lg text-sm font-semibold transition-colors ${isFollow
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                        : 'bg-primary text-white'
                        }`}
                    >
                      {isFollow ? '팔로잉' : '팔로우'}
                    </button>
                  )}
                  {/* 대표 뱃지 */}
                  {representativeBadge && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-primary/20 border-2 border-primary rounded-full">
                      <span className="text-xl">{representativeBadge.icon}</span>
                      <span className="text-xs font-semibold text-primary max-w-[80px] truncate">
                        {representativeBadge.name}
                      </span>
                    </div>
                  )}

                  {/* 획득한 뱃지 개수 표시 */}
                  {earnedBadges.length > (representativeBadge ? 1 : 0) && (
                    <button
                      onClick={() => setShowAllBadges(true)}
                      className="min-w-[32px] h-8 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center px-1 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        +{earnedBadges.length - (representativeBadge ? 1 : 0)}
                      </span>
                    </button>
                  )}
                </div>

              </div>
            </div>
          </div>

          {/* 통계 정보 */}
          <div className="bg-white dark:bg-gray-900 px-6 py-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-around flex-wrap gap-y-2">
              <div className="text-center min-w-[52px]">
                <div className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">{stats.posts}</div>
                <div className="text-[10px] text-gray-600 dark:text-gray-400 mt-0.5">게시물</div>
              </div>
              <div className="text-center min-w-[52px]">
                <div className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">{followerCount}</div>
                <div className="text-[10px] text-gray-600 dark:text-gray-400 mt-0.5">팔로워</div>
              </div>
              <div className="text-center min-w-[52px]">
                <div className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">{followingCount}</div>
                <div className="text-[10px] text-gray-600 dark:text-gray-400 mt-0.5">팔로잉</div>
              </div>
            </div>
          </div>

          {/* 날짜별 검색 - 여행 지도와 여행 기록에 공통 적용 */}
          {userPosts.length > 0 && availableDates.length > 0 && (
            <div className="bg-white dark:bg-gray-900 px-4 py-3 border-t border-gray-100 dark:border-gray-800">
              <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mb-2">날짜별 보기</p>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setSelectedDate('')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${!selectedDate
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                >
                  전체
                </button>
                {availableDates.slice(0, 7).map((date) => {
                  const dateObj = new Date(date);
                  const label = dateObj.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
                  const isSelected = selectedDate === date;
                  return (
                    <button
                      key={date}
                      onClick={() => setSelectedDate(isSelected ? '' : date)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${isSelected
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                    >
                      {label}
                    </button>
                  );
                })}
                {availableDates.length > 7 && (
                  <button
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'date';
                      input.max = new Date().toISOString().split('T')[0];
                      input.value = selectedDate || '';
                      input.onchange = (e) => { if (e.target.value) setSelectedDate(e.target.value); };
                      input.click();
                    }}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    + 더보기
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 여행 지도 - 이 사용자가 다녀온 장소를 지도에 표시 (다른 사용자도 볼 수 있음) */}
          {userPosts.length > 0 && (
            <div className="bg-white dark:bg-gray-900 px-4 py-4 border-t border-gray-100 dark:border-gray-800">
              <h3 className="text-base font-bold text-text-primary-light dark:text-text-primary-dark mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">map</span>
                {user.username || '사용자'}의 여행 지도
              </h3>
              {filteredUserPosts.length === 0 ? (
                <div className="h-40 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                    이 날짜에 등록한 게시물이 없습니다
                  </p>
                </div>
              ) : postsForMap.length === 0 ? (
                <div className="h-40 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                    {selectedDate ? '이 날짜에 위치 정보가 있는 장소가 없습니다' : '방문한 장소 중 위치 정보가 있는 곳이 없습니다'}
                  </p>
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                  <div ref={mapRef} className="w-full h-48" />
                  {mapLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 여행 기록 탭 */}
          <div className="bg-white dark:bg-gray-900 px-6 py-6 border-t border-gray-100 dark:border-gray-800">
            {userPosts.length === 0 ? (
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-4 block">
                  photo_library
                </span>
                <p className="text-text-secondary-light dark:text-text-secondary-dark">
                  아직 업로드한 사진이 없습니다
                </p>
              </div>
            ) : filteredUserPosts.length === 0 ? (
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-4 block">
                  event_busy
                </span>
                <p className="text-text-secondary-light dark:text-text-secondary-dark">
                  이 날짜에 등록한 게시물이 없습니다
                </p>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-2 gap-4">
                  {filteredUserPosts.map((post, index) => (
                    <div
                      key={post.id || index}
                      onClick={() => {
                        const currentIndex = filteredUserPosts.findIndex(p => p.id === post.id);
                        navigate(`/post/${post.id}`, {
                          state: {
                            post: post,
                            allPosts: filteredUserPosts,
                            currentPostIndex: currentIndex >= 0 ? currentIndex : 0
                          }
                        });
                      }}
                      className="cursor-pointer"
                    >
                      {/* 이미지 */}
                      <div className="aspect-square relative overflow-hidden rounded-lg mb-2">
                        {post.videos && post.videos.length > 0 ? (
                          <video
                            src={post.videos[0]}
                            className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                            muted
                            loop
                            playsInline
                          />
                        ) : (
                          <img
                            src={post.imageUrl || post.images?.[0] || post.image}
                            alt={post.location}
                            className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                          />
                        )}
                      </div>

                      {/* 이미지 밖 하단 텍스트 */}
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark line-clamp-2">
                          {post.note || post.location || '여행 기록'}
                        </p>
                        {post.tags && post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {post.tags.slice(0, 3).map((tag, tagIndex) => (
                              <span key={tagIndex} className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                                #{typeof tag === 'string' ? tag.replace('#', '') : tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <BottomNavigation />

      {/* 게시물 상세화면 모달 - 지도화면과 동일하게 화면 내 절대위치 오버레이 */}
      {
        selectedPost && (
          <div
            onClick={() => setSelectedPost(null)}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'white',
                borderRadius: '20px',
                width: '100%',
                maxWidth: 'calc(100% - 40px)',
                maxHeight: 'calc(100vh - 200px)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
              }}
            >
              {/* 헤더 */}
              <div style={{
                padding: '16px',
                borderBottom: '1px solid #f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <h2 style={{
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#333'
                }}>
                  {selectedPost.post.location || selectedPost.post.detailedLocation || '여행지'}
                </h2>
                <button
                  onClick={() => setSelectedPost(null)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '16px',
                    border: 'none',
                    background: '#f5f5f5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#666' }}>
                    close
                  </span>
                </button>
              </div>

              {/* 이미지 */}
              <div style={{
                width: '100%',
                aspectRatio: '4/3',
                overflow: 'hidden',
                background: '#f5f5f5'
              }}>
                <img
                  src={getDisplayImageUrl(selectedPost.post.images?.[0] || selectedPost.post.imageUrl || selectedPost.post.image || selectedPost.post.thumbnail)}
                  alt={selectedPost.post.location || '여행지'}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>

              {/* 내용 */}
              <div style={{
                padding: '16px',
                overflowY: 'auto',
                flex: 1
              }}>
                {selectedPost.post.note && (
                  <p style={{
                    margin: '0 0 12px 0',
                    fontSize: '14px',
                    color: '#666',
                    lineHeight: '1.6'
                  }}>
                    {selectedPost.post.note}
                  </p>
                )}

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginTop: '12px',
                  paddingTop: '12px',
                  borderTop: '1px solid #f0f0f0'
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#00BCD4' }}>
                    location_on
                  </span>
                  <span style={{
                    fontSize: '13px',
                    color: '#999'
                  }}>
                    {selectedPost.post.detailedLocation || selectedPost.post.location || '위치 정보 없음'}
                  </span>
                </div>

                <button
                  onClick={() => {
                    setSelectedPost(null);
                    navigate(`/post/${selectedPost.post.id}`, {
                      state: {
                        post: selectedPost.post,
                        allPosts: selectedPost.allPosts,
                        currentPostIndex: selectedPost.currentPostIndex
                      }
                    });
                  }}
                  style={{
                    width: '100%',
                    marginTop: '16px',
                    padding: '12px',
                    background: '#00BCD4',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  전체 보기
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* 뱃지 모두보기 모달 */}
      {
        showAllBadges && (
          <div
            className="fixed inset-0 bg-black/50 z-[200] flex items-end justify-center"
            onClick={() => setShowAllBadges(false)}
          >
            <div
              className="bg-white dark:bg-gray-900 w-full max-w-[360px] rounded-3xl overflow-hidden mb-2 mx-2 flex flex-col"
              onClick={(e) => e.stopPropagation()}
              style={{ maxHeight: 'calc(100vh - 16px)' }}
            >
              {/* 모달 헤더 */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">획득한 뱃지</h2>
                <button
                  onClick={() => setShowAllBadges(false)}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* 뱃지 그리드 - 스크롤 가능 */}
              <div className="p-4 overflow-y-auto flex-1" style={{ maxHeight: 'calc(100vh - 120px)' }}>
                <div className="grid grid-cols-3 gap-4">
                  {earnedBadges.map((badge, index) => {
                    const isRepresentative = representativeBadge?.name === badge.name;
                    return (
                      <div
                        key={index}
                        className="flex flex-col items-center"
                      >
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 ${isRepresentative
                          ? 'bg-primary/20 border-2 border-primary'
                          : 'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                          }`}>
                          <span className="text-3xl">{badge.icon}</span>
                        </div>
                        <p className="text-xs font-semibold text-gray-900 dark:text-white text-center mb-1">
                          {getBadgeDisplayName(badge)}
                        </p>
                        {isRepresentative && (
                          <span className="text-[10px] font-bold text-white bg-primary px-2 py-0.5 rounded">
                            대표
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default UserProfileScreen;

