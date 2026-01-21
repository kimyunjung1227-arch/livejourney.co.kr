import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import BottomNavigation from '../components/BottomNavigation';
import { getUnreadCount } from '../utils/notifications';
import { getEarnedBadges, getBadgeDisplayName } from '../utils/badgeSystem';
import { getUserLevel } from '../utils/levelSystem';
import { getCoordinatesByLocation } from '../utils/regionLocationMapping';
import { follow, unfollow, isFollowing, getFollowerCount, getFollowingCount, getFollowerIds, getFollowingIds } from '../utils/followSystem';
import { logger } from '../utils/logger';

const ProfileScreen = () => {
  const navigate = useNavigate();
  const { user: authUser, logout, isAuthenticated } = useAuth();
  const [user, setUser] = useState(null);
  const [myPosts, setMyPosts] = useState([]);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [representativeBadge, setRepresentativeBadge] = useState(null);
  const [showBadgeSelector, setShowBadgeSelector] = useState(false);
  const [levelInfo, setLevelInfo] = useState(null);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [activeTab, setActiveTab] = useState('my'); // 'my' | 'map'
  
  // 지도 관련
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const [mapLoading, setMapLoading] = useState(true);
  
  // 날짜 필터
  const [selectedDate, setSelectedDate] = useState('');
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [showFollowListModal, setShowFollowListModal] = useState(false);
  const [followListType, setFollowListType] = useState('follower'); // 'follower' | 'following'
  const [followListIds, setFollowListIds] = useState([]);

  // 모든 Hook을 먼저 선언한 후 useEffect 실행
  useEffect(() => {
    if (!isAuthenticated) return;
    // localStorage에서 사용자 정보 로드
    const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
    // authUser가 있으면 우선 사용, 없으면 localStorage에서 로드한 값 사용
    const userData = authUser || savedUser;
    if (userData && Object.keys(userData).length > 0) {
      setUser(userData);
    }

    // 획득한 뱃지 로드
    const badges = getEarnedBadges();
    setEarnedBadges(badges);
    logger.log('🏆 프로필 화면 - 획득한 뱃지 로드:', badges.length);

    // 대표 뱃지 로드 (반드시 획득한 뱃지 중에서 선택)
    const userId = userData?.id;
    let savedRepBadgeJson = userId 
      ? localStorage.getItem(`representativeBadge_${userId}`) || localStorage.getItem('representativeBadge')
      : localStorage.getItem('representativeBadge');

    let repBadge = null;
    if (savedRepBadgeJson) {
      try {
        repBadge = JSON.parse(savedRepBadgeJson);
      } catch {
        repBadge = null;
      }
    }

    // 저장된 대표 뱃지가 있지만, 현재 획득한 뱃지 목록에 없으면 무효 처리
    if (repBadge && !badges.some(b => b.name === repBadge.name)) {
      repBadge = null;
    }

    // 대표 뱃지가 없고, 획득한 뱃지가 있다면 그 안에서 하나를 대표로 선택
    if (!repBadge && badges && badges.length > 0) {
      let badgeIndex = 0;
      if (userId) {
        const hash = userId.toString().split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        badgeIndex = hash % badges.length;
      }
      repBadge = badges[badgeIndex];
      localStorage.setItem(`representativeBadge_${userId}`, JSON.stringify(repBadge));
    }

    if (repBadge) {
      setRepresentativeBadge(repBadge);
    }

    // 레벨 정보 로드
    const userLevelInfo = getUserLevel();
    setLevelInfo(userLevelInfo);
    logger.debug('📊 레벨 정보:', userLevelInfo);

    // 내가 업로드한 게시물 로드 (영구 보관 - 필터링 없음!)
    const uploadedPosts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');
    const userPosts = uploadedPosts.filter(post => post.userId === userId);
    
    logger.log('📊 프로필 화면 - 내 게시물 로드 (영구 보관)');
    logger.debug('  전체 게시물:', uploadedPosts.length);
    logger.debug('  내 게시물 (모두):', userPosts.length);
    logger.debug('  사용자 ID:', userId);
    
    setMyPosts(userPosts);
    setFilteredPosts(userPosts);
    
    // 사용 가능한 날짜 목록 추출
    const dates = [...new Set(
      userPosts
        .map(post => {
          const date = new Date(post.createdAt || post.timestamp || Date.now());
          return date.toISOString().split('T')[0]; // YYYY-MM-DD 형식
        })
        .filter(Boolean)
    )].sort((a, b) => new Date(b) - new Date(a));
    setAvailableDates(dates);

    // 알림 개수 업데이트
    setUnreadNotificationCount(getUnreadCount());

    // 알림 이벤트 리스너
    const handleNotificationUpdate = () => {
      setUnreadNotificationCount(getUnreadCount());
    };

    // 게시물 업데이트 이벤트 리스너
    const handlePostsUpdate = () => {
      logger.log('🔄 프로필 화면 - 게시물 업데이트 이벤트 수신');
      setTimeout(() => {
        const updatedPosts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');
        // 프로필에서는 필터링 없이 모든 내 게시물 표시
        const updatedUserPosts = updatedPosts.filter(post => {
          const postUserId = post.userId || 
                            (typeof post.user === 'string' ? post.user : post.user?.id) ||
                            post.user;
          return postUserId === userId;
        });
        logger.debug('🔄 게시물 업데이트 (영구 보관):', {
          전체게시물: updatedPosts.length,
          내게시물: updatedUserPosts.length,
          사용자ID: userId
        });
        
        const previousPostsCount = myPosts.length;
        setMyPosts(updatedUserPosts);
        
        // 사용 가능한 날짜 목록 업데이트
        const dates = [...new Set(
          updatedUserPosts
            .map(post => {
              const date = new Date(post.createdAt || post.timestamp || Date.now());
              return date.toISOString().split('T')[0]; // YYYY-MM-DD 형식
            })
            .filter(Boolean)
        )].sort((a, b) => new Date(b) - new Date(a));
        setAvailableDates(dates);
        
        // 새 게시물이 추가되면 해당 날짜로 자동 선택 (선택된 날짜가 없을 때만)
        if (updatedUserPosts.length > previousPostsCount && !selectedDate && activeTab === 'map') {
          const newPost = updatedUserPosts.find(p => !myPosts.find(op => op.id === p.id));
          if (newPost) {
            const newPostDate = new Date(newPost.createdAt || newPost.timestamp || Date.now());
            const dateStr = newPostDate.toISOString().split('T')[0];
            if (dates.includes(dateStr)) {
              setSelectedDate(dateStr);
            }
          }
        }
        
        // 레벨 정보도 업데이트
        const updatedLevelInfo = getUserLevel();
        setLevelInfo(updatedLevelInfo);
      }, 100);
    };

    // 뱃지 업데이트 이벤트 리스너
    const handleBadgeUpdate = () => {
      const updatedBadges = getEarnedBadges();
      setEarnedBadges(updatedBadges);
      logger.log('🏆 뱃지 업데이트:', updatedBadges.length);
    };

    // 레벨 업데이트 이벤트 리스너
    const handleLevelUpdate = () => {
      const updatedLevelInfo = getUserLevel();
      setLevelInfo(updatedLevelInfo);
      logger.debug('📊 레벨 업데이트:', updatedLevelInfo);
    };

    // 사용자 정보 업데이트 이벤트 리스너
    const handleUserUpdate = () => {
      const updatedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const userData = authUser || updatedUser;
      if (userData && Object.keys(userData).length > 0) {
        setUser(userData);
      }
    };

    window.addEventListener('notificationUpdate', handleNotificationUpdate);
    window.addEventListener('newPostsAdded', handlePostsUpdate);
    window.addEventListener('storage', handlePostsUpdate);
    window.addEventListener('badgeEarned', handleBadgeUpdate);
    window.addEventListener('levelUp', handleLevelUpdate);
    window.addEventListener('userUpdated', handleUserUpdate);
    
    return () => {
      window.removeEventListener('notificationUpdate', handleNotificationUpdate);
      window.removeEventListener('newPostsAdded', handlePostsUpdate);
      window.removeEventListener('storage', handlePostsUpdate);
      window.removeEventListener('badgeEarned', handleBadgeUpdate);
      window.removeEventListener('levelUp', handleLevelUpdate);
      window.removeEventListener('userUpdated', handleUserUpdate);
    };
  }, [isAuthenticated, authUser]);

  // 팔로워/팔로잉 수 로드 및 followsUpdated 구독
  useEffect(() => {
    const u = authUser || user;
    const uid = u?.id;
    if (!isAuthenticated || !uid) return;
    const load = () => {
      setFollowerCount(getFollowerCount(uid));
      setFollowingCount(getFollowingCount(uid));
    };
    load();
    window.addEventListener('followsUpdated', load);
    return () => window.removeEventListener('followsUpdated', load);
  }, [isAuthenticated, authUser, user?.id]);

  // 날짜 필터 적용
  useEffect(() => {
    if (activeTab === 'map') {
      let filtered = [...myPosts];
      
      if (selectedDate) {
        const filterDate = new Date(selectedDate);
        filterDate.setHours(0, 0, 0, 0);
        const nextDay = new Date(filterDate);
        nextDay.setDate(nextDay.getDate() + 1);
        
        filtered = filtered.filter(post => {
          const postDate = new Date(post.createdAt || post.timestamp || Date.now());
          postDate.setHours(0, 0, 0, 0);
          return postDate >= filterDate && postDate < nextDay;
        });
      }
      
      setFilteredPosts(filtered);
    } else {
      setFilteredPosts(myPosts);
    }
  }, [myPosts, selectedDate, activeTab]);
  
  // 새 게시물 추가 시 해당 날짜로 자동 선택
  useEffect(() => {
    if (myPosts.length > 0 && !selectedDate && activeTab === 'map') {
      const latestPost = myPosts[0];
      if (latestPost) {
        const latestPostDate = new Date(latestPost.createdAt || latestPost.timestamp || Date.now());
        const dateStr = latestPostDate.toISOString().split('T')[0];
        // availableDates에 해당 날짜가 있으면 자동 선택
        if (availableDates.includes(dateStr)) {
          setSelectedDate(dateStr);
        }
      }
    }
  }, [myPosts.length, availableDates, activeTab]);

  // 지도 초기화 및 마커 표시
  const initMap = useCallback(() => {
    logger.log('🗺️ 지도 초기화 시작', {
      kakaoLoaded: !!window.kakao, 
      mapRefExists: !!mapRef.current, 
      activeTab, 
      postsCount: filteredPosts.length 
    });

    if (!window.kakao || !window.kakao.maps) {
      logger.debug('⏳ Kakao Map API 로딩 대기...');
      setTimeout(initMap, 100);
      return;
    }

    if (!mapRef.current) {
      logger.debug('⏳ 지도 컨테이너 대기...');
      setTimeout(initMap, 100);
      return;
    }

    if (activeTab !== 'map') {
      logger.debug('⏸️ 지도 탭이 아님, 초기화 중단');
      return;
    }

    try {
      // 기존 마커 및 선 제거
      markersRef.current.forEach(markerData => {
        if (markerData.overlay) {
          markerData.overlay.setMap(null);
        }
        if (markerData.marker) {
          markerData.marker.setMap(null);
        }
        if (markerData.polyline) {
          markerData.polyline.setMap(null);
        }
      });
      markersRef.current = [];

      // 기존 지도 인스턴스 확인 (재사용 가능하면 재사용)
      // innerHTML 사용하지 않음 - React DOM 충돌 방지

      // 지도 컨테이너 가져오기 (innerHTML 사용하지 않음 - React DOM 충돌 방지)
      const container = mapRef.current;

      // 게시물이 있으면 첫 번째 게시물 위치로, 없으면 서울로
      let centerLat = 37.5665;
      let centerLng = 126.9780;
      let level = 6;

      if (filteredPosts.length > 0) {
        const firstPost = filteredPosts[0];
        const coords = firstPost.coordinates || getCoordinatesByLocation(firstPost.detailedLocation || firstPost.location);
        if (coords) {
          centerLat = coords.lat;
          centerLng = coords.lng;
          level = 5;
          logger.debug('📍 첫 게시물 위치로 지도 중심 설정:', coords);
        }
      }

      // 지도 컨테이너 크기 확인
      if (container.offsetWidth === 0 || container.offsetHeight === 0) {
        logger.warn('⚠️ 지도 컨테이너 크기가 0입니다. 재시도...');
        setTimeout(initMap, 200);
        return;
      }

      logger.log('✅ 지도 생성 시작:', { centerLat, centerLng, level, containerSize: { width: container.offsetWidth, height: container.offsetHeight } });

      // 기존 지도 인스턴스가 있으면 재사용, 없으면 새로 생성
      let map = mapInstance.current;
      
      if (!map) {
        // 지도 생성
        map = new window.kakao.maps.Map(container, {
          center: new window.kakao.maps.LatLng(centerLat, centerLng),
          level: level
        });
        mapInstance.current = map;
      } else {
        // 기존 지도 재사용 - 중심점과 레벨만 업데이트
        map.setCenter(new window.kakao.maps.LatLng(centerLat, centerLng));
        map.setLevel(level);
      }
      
        logger.log('✅ 지도 인스턴스 생성 완료');
      
      // 지도가 완전히 로드될 때까지 대기
      const tilesLoadedHandler = () => {
        logger.debug('✅ 지도 타일 로드 완료');
        setMapLoading(false);
        // 지도 로드 후 마커 생성
        createMarkersAfterMapLoad(map);
      };
      
      window.kakao.maps.event.addListener(map, 'tilesloaded', tilesLoadedHandler);
      
      // 타임아웃 설정 (지도가 로드되지 않아도 진행)
      setTimeout(() => {
        logger.warn('⏰ 지도 로드 타임아웃, 마커 생성 진행');
        setMapLoading(false);
        // 타임아웃 후에도 마커 생성 시도
        if (markersRef.current.length === 0) {
          createMarkersAfterMapLoad(map);
        }
      }, 2000);
      
      // 즉시 마커 생성 시도 (지도가 이미 로드된 경우)
      setTimeout(() => {
        if (markersRef.current.length === 0) {
          createMarkersAfterMapLoad(map);
        }
      }, 500);

      // 마커 생성 함수 (지도 로드 후 호출)
      const createMarkersAfterMapLoad = (map) => {
        logger.log('📍 마커 생성 시작:', filteredPosts.length);
        
        // 기존 마커 및 선 제거
        markersRef.current.forEach(markerData => {
          if (markerData.overlay) {
            markerData.overlay.setMap(null);
          }
          if (markerData.marker) {
            markerData.marker.setMap(null);
          }
          if (markerData.polyline) {
            markerData.polyline.setMap(null);
          }
        });
        markersRef.current = [];
        
        const bounds = new window.kakao.maps.LatLngBounds();
        let hasValidMarker = false;

        // 기본 마커 생성 함수 (먼저 정의)
        const createDefaultMarker = (post, index, position, map) => {
          const marker = new window.kakao.maps.Marker({
            position: position,
            map: map
          });

          const infoWindow = new window.kakao.maps.InfoWindow({
            content: `
              <div style="padding: 12px; min-width: 200px; max-width: 300px;">
                <div style="font-weight: bold; margin-bottom: 4px; font-size: 14px;">${post.location || '여행지'}</div>
                ${post.note ? `<div style="font-size: 12px; color: #666; margin-top: 4px;">${post.note}</div>` : ''}
              </div>
            `,
            removable: true
          });

          window.kakao.maps.event.addListener(marker, 'click', () => {
            const currentIndex = filteredPosts.findIndex(p => p.id === post.id);
            navigate(`/post/${post.id}`, {
              state: {
                post: post,
                allPosts: filteredPosts,
                currentPostIndex: currentIndex >= 0 ? currentIndex : 0
              }
            });
          });

          window.kakao.maps.event.addListener(marker, 'mouseover', () => {
            infoWindow.open(map, marker);
          });

          window.kakao.maps.event.addListener(marker, 'mouseout', () => {
            infoWindow.close();
          });

          markersRef.current.push({ marker: marker, overlay: null, post: post });
          hasValidMarker = true;
        };

        // 마커 생성 함수 (MapScreen과 동일한 스타일)
        const createMarker = (post, index, map, bounds) => {
          const coords = post.coordinates || getCoordinatesByLocation(post.detailedLocation || post.location);
          if (!coords) return;

          const position = new window.kakao.maps.LatLng(coords.lat, coords.lng);
          bounds.extend(position);

          // 모든 경우에 이미지 마커 사용 (blob URL 포함) - MapScreen과 동일
          const imageUrl = post.images?.[0] || post.imageUrl || post.image;
          
          const el = document.createElement('div');
          el.innerHTML = `
            <button 
              class="pin-btn relative w-12 h-12 border-3 border-white shadow-lg rounded-md overflow-hidden hover:scale-110 transition-all duration-200 cursor-pointer" 
              style="z-index: ${index}" 
              data-post-id="${post.id}"
              data-post-index="${index}"
            >
              <img 
                class="w-full h-full object-cover" 
                src="${imageUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiByeD0iNCIgZmlsbD0iI0YzRjRGNiIvPgo8cGF0aCBkPSJNMjQgMTZDMjAgMTYgMTcgMTkgMTcgMjNDMTcgMjcgMjAgMzAgMjQgMzBDMjggMzAgMzEgMjcgMzEgMjNDMzEgMTkgMjggMTYgMjQgMTZaIiBmaWxsPSIjOUI5Q0E1Ii8+CjxwYXRoIGQ9Ik0yNCAzMkMyMCAzMiAxNyAyOSAxNyAyNUMxNyAyMSAyMCAxOCAyNCAxOEMyOCAxOCAzMSAyMSAzMSAyNUMzMSAyOSAyOCAzMiAyNCAzMloiIGZpbGw9IiM5QjlDQTUiLz4KPC9zdmc+'} 
                alt="${post.location || '여행지'}"
                onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiByeD0iNCIgZmlsbD0iI0YzRjRGNiIvPgo8cGF0aCBkPSJNMjQgMTZDMjAgMTYgMTcgMTkgMTcgMjNDMTcgMjcgMjAgMzAgMjQgMzBDMjggMzAgMzEgMjcgMzEgMjNDMzEgMTkgMjggMTYgMjQgMTZaIiBmaWxsPSIjOUI5Q0E1Ii8+CjxwYXRoIGQ9Ik0yNCAzMkMyMCAzMiAxNyAyOSAxNyAyNUMxNyAyMSAyMCAxOCAyNCAxOEMyOCAxOCAzMSAyMSAzMSAyNUMzMSAyOSAyOCAzMiAyNCAzMloiIGZpbGw9IiM5QjlDQTUiLz4KPC9zdmc+';"
              />
            </button>
          `;

          // 클릭 이벤트 핸들러
          const button = el.querySelector('button');
          if (button) {
            button.addEventListener('click', () => {
              const currentIndex = filteredPosts.findIndex(p => p.id === post.id);
              navigate(`/post/${post.id}`, {
                state: {
                  post: post,
                  allPosts: filteredPosts,
                  currentPostIndex: currentIndex >= 0 ? currentIndex : 0
                }
              });
            });

            button.addEventListener('mouseenter', () => {
              button.style.transform = 'scale(1.1)';
            });

            button.addEventListener('mouseleave', () => {
              button.style.transform = 'scale(1)';
            });
          }

          // CustomOverlay 생성
          const overlay = new window.kakao.maps.CustomOverlay({
            position: position,
            content: el,
            yAnchor: 1,
            zIndex: index
          });

          overlay.setMap(map);

          // 인포윈도우 생성
          const infoWindow = new window.kakao.maps.InfoWindow({
            content: `
              <div style="padding: 12px; min-width: 200px; max-width: 300px;">
                ${imageUrl ? `
                  <img 
                    src="${imageUrl}" 
                    alt="${post.location || '여행지'}"
                    style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;"
                    onerror="this.style.display='none'"
                  />
                ` : ''}
                <div style="font-weight: bold; margin-bottom: 4px; font-size: 14px;">${post.location || '여행지'}</div>
                ${post.note ? `<div style="font-size: 12px; color: #666; margin-top: 4px;">${post.note}</div>` : ''}
              </div>
            `,
            removable: true
          });

          // 임시 마커 (인포윈도우 표시용)
          const tempMarker = new window.kakao.maps.Marker({ 
            position: position
          });

          // 마우스오버 이벤트
          if (button) {
            button.addEventListener('mouseenter', () => {
              infoWindow.open(map, tempMarker);
            });

            button.addEventListener('mouseleave', () => {
              infoWindow.close();
            });
          }

          markersRef.current.push({ 
            id: post.id, 
            marker: null, 
            overlay: overlay, 
            post: post, 
            element: el.firstChild 
          });
          hasValidMarker = true;
        };

        // 필터링된 게시물에 대해 마커 생성 및 좌표 수집
        const sortedPosts = [...filteredPosts].sort((a, b) => {
          const dateA = new Date(a.createdAt || a.timestamp || 0);
          const dateB = new Date(b.createdAt || b.timestamp || 0);
          return dateA - dateB;
        });
        
        const pathCoordinates = [];
        sortedPosts.forEach((post, index) => {
          createMarker(post, index, map, bounds);
          const coords = post.coordinates || getCoordinatesByLocation(post.detailedLocation || post.location);
          if (coords && coords.lat && coords.lng) {
            pathCoordinates.push(new window.kakao.maps.LatLng(coords.lat, coords.lng));
          }
        });

        // 경로 선 그리기 (2개 이상의 좌표가 있을 때)
        if (pathCoordinates.length >= 2) {
          const polyline = new window.kakao.maps.Polyline({
            path: pathCoordinates,
            strokeWeight: 3,
            strokeColor: '#14B8A6', // primary 색상
            strokeOpacity: 0.7,
            strokeStyle: 'solid'
          });
          polyline.setMap(map);
          markersRef.current.push({ polyline: polyline });
        }

        // 마커 생성 완료 후 지도 범위 조정
        setTimeout(() => {
          if (markersRef.current.length > 0) {
            const validBounds = new window.kakao.maps.LatLngBounds();
            markersRef.current.forEach(markerData => {
              if (markerData.overlay) {
                const position = markerData.overlay.getPosition();
                validBounds.extend(position);
              } else if (markerData.marker) {
                const position = markerData.marker.getPosition();
                validBounds.extend(position);
              }
            });
            
            if (markersRef.current.length > 1) {
              map.setBounds(validBounds);
              logger.debug('✅ 지도 범위 조정 완료 (여러 마커)');
            } else if (markersRef.current.length === 1) {
              // 마커가 하나일 때는 해당 위치로 이동
              const firstMarker = markersRef.current[0];
              if (firstMarker.overlay) {
                map.setCenter(firstMarker.overlay.getPosition());
                map.setLevel(5);
              } else if (firstMarker.marker) {
                map.setCenter(firstMarker.marker.getPosition());
                map.setLevel(5);
              }
              logger.debug('✅ 지도 중심 이동 완료 (단일 마커)');
            }
          }
        }, 500);
      };
    } catch (error) {
      logger.error('지도 초기화 오류:', error);
      setMapLoading(false);
    }
  }, [filteredPosts, activeTab, navigate, selectedDate]);

  // 탭 변경 또는 날짜 변경 시 지도 초기화
  useEffect(() => {
    if (activeTab === 'map') {
      logger.log('🗺️ 나의 기록 지도 탭 활성화 또는 날짜 변경');
      setMapLoading(true);
      
      // 기존 마커 및 선 제거
      markersRef.current.forEach(markerData => {
        try {
          if (markerData.overlay) {
            markerData.overlay.setMap(null);
          }
          if (markerData.marker) {
            markerData.marker.setMap(null);
          }
          if (markerData.polyline) {
            markerData.polyline.setMap(null);
          }
        } catch (error) {
          logger.warn('마커 제거 오류 (무시):', error);
        }
      });
      markersRef.current = [];
      
      // DOM이 완전히 렌더링된 후 지도 초기화
      const initTimer = setTimeout(() => {
        console.log('⏰ 지도 초기화 타이머 실행');
        if (mapRef.current) {
          logger.debug('✅ mapRef 준비됨, 지도 초기화 시작');
          initMap();
        } else {
          logger.warn('⚠️ mapRef 아직 준비 안됨, 재시도...');
          // mapRef가 아직 준비되지 않았으면 다시 시도
          const retryTimer = setTimeout(() => {
            if (mapRef.current) {
              logger.log('✅ mapRef 재시도 성공, 지도 초기화');
              initMap();
            } else {
              logger.error('❌ mapRef를 찾을 수 없습니다');
              setMapLoading(false);
            }
          }, 500);
          
          return () => clearTimeout(retryTimer);
        }
      }, 500);
      
      return () => {
        clearTimeout(initTimer);
      };
    } else {
      // 다른 탭으로 전환 시 지도 정리
      logger.log('🗑️ 다른 탭으로 전환, 지도 정리');
      if (mapInstance.current) {
        // 마커 제거
        markersRef.current.forEach(markerData => {
          try {
            if (markerData.overlay) {
              markerData.overlay.setMap(null);
            }
            if (markerData.marker) {
              markerData.marker.setMap(null);
            }
            if (markerData.polyline) {
              markerData.polyline.setMap(null);
            }
          } catch (error) {
            logger.warn('마커 제거 오류 (무시):', error);
          }
        });
        markersRef.current = [];
        // 지도 인스턴스는 유지 (다음 탭 전환 시 재사용 가능)
        // mapInstance.current = null; // 주석 처리: React DOM 충돌 방지
      }
      setMapLoading(false);
    }
  }, [activeTab, filteredPosts, initMap, selectedDate]);

  const handleLogout = () => {
    // 로그아웃 플래그 설정
    sessionStorage.setItem('justLoggedOut', 'true');
    
    // 로그아웃 처리
    logout();
    
    // 시작 화면으로 이동
    navigate('/', { replace: true });
  };

  const toggleEditMode = () => {
    if (isEditMode) {
      // 편집 모드 종료
      setSelectedPhotos([]);
    }
    setIsEditMode(!isEditMode);
  };

  const togglePhotoSelection = (postId) => {
    if (selectedPhotos.includes(postId)) {
      setSelectedPhotos(selectedPhotos.filter(id => id !== postId));
    } else {
      setSelectedPhotos([...selectedPhotos, postId]);
    }
  };

  const deleteSelectedPhotos = () => {
    if (selectedPhotos.length === 0) {
      alert('삭제할 사진을 선택해주세요.');
      return;
    }

    if (!confirm(`선택한 ${selectedPhotos.length}개의 사진을 삭제하시겠습니까?`)) {
      return;
    }

    // localStorage에서 선택된 사진 삭제
    const allPosts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');
    const filteredPosts = allPosts.filter(post => !selectedPhotos.includes(post.id));
    localStorage.setItem('uploadedPosts', JSON.stringify(filteredPosts));

    // 내 게시물 목록 업데이트
    const userId = user?.id || authUser?.id;
    const updatedMyPosts = filteredPosts.filter(post => post.userId === userId);
    setMyPosts(updatedMyPosts);

    // 편집 모드 종료
    setSelectedPhotos([]);
    setIsEditMode(false);

    alert(`${selectedPhotos.length}개의 사진이 삭제되었습니다.`);
  };

  // 대표 뱃지 선택
  const selectRepresentativeBadge = (badge) => {
    const currentUser = user || authUser;
    const userId = currentUser?.id;
    if (userId) {
      localStorage.setItem(`representativeBadge_${userId}`, JSON.stringify(badge));
    }
    localStorage.setItem('representativeBadge', JSON.stringify(badge)); // 호환성 유지
    setRepresentativeBadge(badge);
    setShowBadgeSelector(false);
    
    // user 정보 업데이트
    if (currentUser) {
      const updatedUser = { ...currentUser, representativeBadge: badge };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
    
    logger.log('✅ 대표 뱃지 선택:', badge.name);
  };

  // 대표 뱃지 제거
  const removeRepresentativeBadge = () => {
    const currentUser = user || authUser;
    const userId = currentUser?.id;
    if (userId) {
      localStorage.removeItem(`representativeBadge_${userId}`);
    }
    localStorage.removeItem('representativeBadge'); // 호환성 유지
    setRepresentativeBadge(null);
    
    if (currentUser) {
      const updatedUser = { ...currentUser, representativeBadge: null };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
    
    logger.log('❌ 대표 뱃지 제거');
  };


  const badgeCount = earnedBadges.length;

  // 프로필 화면 안에서 사용할 소셜 로그인 핸들러
  const handleSocialLogin = async (provider) => {
    setLoginLoading(true);
    setLoginError('');

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const providerLower = provider.toLowerCase();
      let authEndpoint = '';

      if (providerLower === 'kakao') {
        authEndpoint = `${apiUrl}/api/auth/kakao`;
      } else if (providerLower === 'naver') {
        authEndpoint = `${apiUrl}/api/auth/naver`;
      } else if (providerLower === 'google') {
        authEndpoint = `${apiUrl}/api/auth/google`;
      } else {
        throw new Error('지원하지 않는 소셜 로그인 제공자입니다.');
      }

      window.location.href = authEndpoint;
    } catch (error) {
      console.error('소셜 로그인 실패:', error);
      setLoginError(`${provider} 로그인에 실패했습니다.`);
      setLoginLoading(false);
    }
  };

  // 로그인되지 않은 경우: 프로필 화면 안에서 소셜 로그인 카드 표시
  if (!isAuthenticated) {
    return (
      <div className="screen-layout bg-white dark:bg-zinc-900">
        <div className="screen-content">
          {/* 헤더 */}
          <header className="screen-header bg-white dark:bg-gray-900 flex items-center p-4 justify-between shadow-sm">
            <h1 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">
              프로필
            </h1>
          </header>

          {/* 소셜 로그인 화면 - 화면 정중앙 배치 */}
          <main
            className="flex-1 flex flex-col items-center justify-center px-6 py-8"
            style={{ minHeight: 'calc(100vh - 160px)' }}
          >
            <div className="w-full max-w-md text-center">
              {/* 상단 카피 */}
              <div className="mb-8">
                <p className="text-xs font-semibold text-primary mb-1 tracking-[0.15em] uppercase">
                  LIVEJOURNEY
                </p>
                <p className="text-lg font-bold text-gray-900 dark:text-white leading-snug">
                  실시간 여행 현황 검증의 기준,<br />라이브저니
                </p>
              </div>

              {/* 소셜 로그인 버튼들 */}
              <div className="flex flex-col items-center gap-3 mb-3">
                {/* 카카오 로그인 */}
                <button 
                  onClick={() => handleSocialLogin('Kakao')}
                  disabled={loginLoading}
                  className="flex cursor-pointer items-center justify-center gap-3 rounded-full h-12 px-6 bg-[#FEE500] text-[#000000] text-sm font-bold tracking-tight hover:bg-[#fdd835] active:bg-[#fbc02d] transition-all shadow-md disabled:opacity-50 w-full max-w-sm"
                  style={{ touchAction: 'manipulation' }}
                >
                  <span className="material-symbols-outlined text-base bg-black text-[#FEE500] rounded-full w-6 h-6 flex items-center justify-center">
                    chat
                  </span>
                  <span className="truncate">카카오로 시작하기</span>
                </button>

                {/* 구글 로그인 */}
                <button 
                  onClick={() => handleSocialLogin('Google')}
                  disabled={loginLoading}
                  className="flex cursor-pointer items-center justify-center gap-3 rounded-full h-12 px-6 bg-white dark:bg-gray-900 text-[#1F1F1F] dark:text-white text-sm font-semibold tracking-tight border border-zinc-300 dark:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-gray-800 active:bg-zinc-100 transition-all shadow-sm disabled:opacity-50 w-full max-w-sm"
                  style={{ touchAction: 'manipulation' }}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="truncate">구글로 시작하기</span>
                </button>
              </div>

              {/* 에러 메시지 */}
              {loginError && (
                <div className="mt-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-2.5 rounded-lg text-xs font-medium text-center">
                  {loginError}
                </div>
              )}

              {/* 로딩 상태 */}
              {loginLoading && (
                <div className="mt-3 flex items-center justify-center gap-2 text-primary dark:text-primary-soft">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  <span className="text-xs font-medium">로그인 중...</span>
                </div>
              )}
            </div>
          </main>
        </div>

        {/* 하단 네비게이션 */}
        <BottomNavigation unreadNotificationCount={0} />
      </div>
    );
  }

  // 사용자 정보가 아직 로드되지 않은 경우
  if (isAuthenticated && !user && !authUser) {
    return (
      <div className="screen-layout bg-background-light dark:bg-background-dark">
        <div className="screen-content">
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="text-text-secondary-light dark:text-text-secondary-dark">사용자 정보를 불러오는 중...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 현재 사용자 정보 (user 또는 authUser)
  const currentUser = user || authUser;

  return (
    <div className="screen-layout bg-background-light dark:bg-background-dark">
      <div className="screen-content">
        {/* 헤더 */}
        <header className="screen-header bg-white dark:bg-gray-900 flex items-center p-4 justify-between">
          <button 
            onClick={() => navigate('/main')}
            className="flex size-12 shrink-0 items-center justify-center text-text-primary-light dark:text-text-primary-dark hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-2xl">arrow_back</span>
          </button>
          <h1 className="text-text-primary-light dark:text-text-primary-dark text-base font-semibold">프로필</h1>
          <button 
            onClick={() => navigate('/settings')}
            className="flex size-12 shrink-0 items-center justify-center text-text-primary-light dark:text-text-primary-dark hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-2xl">settings</span>
          </button>
        </header>

        {/* 메인 컨텐츠 */}
        <div className="screen-body">
          {/* 프로필 정보 */}
          <div className="bg-white dark:bg-gray-900 px-6 py-6">
          <div className="flex items-center gap-4 mb-4">
            {/* 프로필 사진 */}
            <div className="flex-shrink-0">
              {currentUser?.profileImage && currentUser.profileImage !== 'default' ? (
                <img 
                  src={currentUser.profileImage} 
                  alt="Profile" 
                  className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <span className="material-symbols-outlined text-gray-500 dark:text-gray-400 text-4xl">person</span>
                </div>
              )}
            </div>

            {/* 사용자 정보 */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h2 className="text-text-primary-light dark:text-text-primary-dark text-lg font-bold">
                  {currentUser?.username || '모사모'}
                </h2>
                {/* 대표 뱃지 - 클릭 가능 */}
                <button
                  onClick={() => {
                    if (earnedBadges.length > 0) {
                      setShowBadgeSelector(true);
                    } else {
                      alert('아직 획득한 뱃지가 없습니다.');
                    }
                  }}
                  disabled={earnedBadges.length === 0}
                  className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-primary-soft to-accent-soft rounded-full border-2 border-primary/30 hover:border-primary/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {representativeBadge ? (
                    <>
                      <span className="text-base leading-none" role="img" aria-label={representativeBadge.name}>
                        {representativeBadge.icon || '🏆'}
                      </span>
                      <span className="text-xs font-bold text-primary">{representativeBadge.name}</span>
                    </>
                  ) : (
                    <span className="text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark">뱃지 없음</span>
                  )}
                </button>
                {/* 뱃지 모아보기 버튼 - 플러스 아이콘 */}
                <button
                  onClick={() => navigate('/badges')}
                  className="flex items-center justify-center w-7 h-7 bg-primary/10 hover:bg-primary/20 rounded-full transition-colors"
                  title="뱃지 모아보기"
                >
                  <span className="material-symbols-outlined text-primary text-base">add</span>
                </button>
              </div>
              <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm">
                {levelInfo ? `Lv. ${levelInfo.level} ${levelInfo.title}` : 'Lv. 1 여행 입문자'}
              </p>
              {/* 경험치 바 */}
              {levelInfo && levelInfo.level < 100 && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                      EXP {levelInfo.expInCurrentLevel.toLocaleString()} / {levelInfo.expNeededForNextLevel.toLocaleString()}
                    </span>
                    <span className="text-xs font-bold text-primary">
                      {levelInfo.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all duration-500"
                      style={{ width: `${levelInfo.progress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 게시물 / 팔로워 / 팔로잉 - 게시물이 맨 앞 */}
          <div className="flex items-center justify-around py-4 border-t border-gray-100 dark:border-gray-800">
            <div className="text-center min-w-[52px]">
              <div className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">{myPosts.length}</div>
              <div className="text-[10px] text-gray-600 dark:text-gray-400 mt-0.5">게시물</div>
            </div>
            <button
              type="button"
              onClick={() => {
                const uid = (authUser || user)?.id;
                if (uid) { setFollowListIds(getFollowerIds(uid)); setFollowListType('follower'); setShowFollowListModal(true); }
              }}
              className="text-center min-w-[52px] hover:opacity-80 transition-opacity"
            >
              <div className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">{followerCount}</div>
              <div className="text-[10px] text-gray-600 dark:text-gray-400 mt-0.5">팔로워</div>
            </button>
            <button
              type="button"
              onClick={() => {
                const uid = (authUser || user)?.id;
                if (uid) { setFollowListIds(getFollowingIds(uid)); setFollowListType('following'); setShowFollowListModal(true); }
              }}
              className="text-center min-w-[52px] hover:opacity-80 transition-opacity"
            >
              <div className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">{followingCount}</div>
              <div className="text-[10px] text-gray-600 dark:text-gray-400 mt-0.5">팔로잉</div>
            </button>
          </div>

          {/* 프로필 편집 버튼 */}
          <button
            onClick={() => {
              logger.debug('🔧 프로필 편집 버튼 클릭 → /profile/edit으로 이동');
              navigate('/profile/edit');
            }}
            className="w-full bg-gray-100 dark:bg-gray-800 text-text-primary-light dark:text-text-primary-dark py-2.5 px-4 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            프로필 편집
          </button>
        </div>

        {/* 기록 탭 */}
        <div className="bg-white dark:bg-gray-900 px-6 py-6 border-t border-gray-100 dark:border-gray-800">
          {/* 탭 전환 */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('my')}
              className={`flex-1 py-3 px-2 rounded-xl font-semibold transition-all text-sm whitespace-nowrap ${
                activeTab === 'my'
                  ? 'bg-primary text-white shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-800 text-text-secondary-light dark:text-text-secondary-dark hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              📸 내 사진
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`flex-1 py-3 px-2 rounded-xl font-semibold transition-all text-sm whitespace-nowrap ${
                activeTab === 'map'
                  ? 'bg-primary text-white shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-800 text-text-secondary-light dark:text-text-secondary-dark hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              🗺️ 나의 기록 지도
            </button>
          </div>

          {/* 편집 버튼 (내 사진 탭에서만) */}
          {activeTab === 'my' && myPosts.length > 0 && (
            <div className="flex items-center justify-end mb-4">
                {isEditMode && selectedPhotos.length > 0 && (
                  <button 
                    onClick={deleteSelectedPhotos}
                  className="text-red-500 text-sm font-semibold mr-2"
                  >
                    삭제 ({selectedPhotos.length})
                  </button>
                )}
                <button 
                  onClick={toggleEditMode}
                  className={`text-sm font-semibold ${isEditMode ? 'text-primary' : 'text-text-secondary-light dark:text-text-secondary-dark'}`}
                >
                  {isEditMode ? '완료' : '편집'}
                </button>
              </div>
            )}

          {/* 내 사진 탭 (타임라인 형식) */}
          {activeTab === 'my' && myPosts.length === 0 && (
            <div className="text-center py-8">
              <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-4 block">
                add_photo_alternate
              </span>
              <p className="text-text-secondary-light dark:text-text-secondary-dark text-base font-medium mb-2">
                아직 올린 사진이 없어요
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mb-4">
                내 지역의 실시간 사진을 올려<br />
                나만의 발자취를 만들어보세요!
              </p>
              <button
                onClick={() => navigate('/upload')}
                className="bg-primary text-white py-3 px-6 rounded-full font-semibold hover:bg-primary/90 transition-colors shadow-lg inline-flex items-center gap-2"
              >
                <span className="material-symbols-outlined">add_a_photo</span>
                첫 사진 올리기
              </button>
            </div>
          )}

          {activeTab === 'my' && myPosts.length > 0 && (
            <div className="space-y-6">
              {Object.entries(
                myPosts.reduce((acc, post) => {
                  const date = new Date(post.createdAt || Date.now());
                  const dateKey = date.toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  });
                  if (!acc[dateKey]) acc[dateKey] = [];
                  acc[dateKey].push(post);
                  return acc;
                }, {})
              )
                .sort((a, b) => new Date(b[1][0].createdAt) - new Date(a[1][0].createdAt))
                .map(([date, posts]) => (
                  <div key={date}>
                    {/* 날짜 헤더 */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-xl">calendar_today</span>
                        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">{date}</h3>
                      </div>
                      <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{posts.length}장</span>
                    </div>

                    {/* 사진 그리드 */}
                    <div className="grid grid-cols-2 gap-4">
                      {posts.map((post, index) => {
                        const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '{}');
                        const isLiked = likedPosts[post.id] || false;
                        const likeCount = post.likes || post.likeCount || 0;
                        const allPosts = myPosts;
                        const currentIndex = allPosts.findIndex(p => p.id === post.id);
                        
                        return (
                          <div
                            key={post.id || index}
                            onClick={(e) => {
                              if (isEditMode) {
                                togglePhotoSelection(post.id);
                              } else {
                                navigate(`/post/${post.id}`, {
                                  state: {
                                    post: post,
                                    allPosts: allPosts,
                                    currentPostIndex: currentIndex >= 0 ? currentIndex : 0
                                  }
                                });
                              }
                            }}
                            className="cursor-pointer"
                          >
                            {/* 이미지 */}
                            <div className="aspect-square relative overflow-hidden rounded-lg mb-2">
                              {post.videos && post.videos.length > 0 ? (
                                <video
                                  src={post.videos[0]}
                                  className="w-full h-full object-cover"
                                  muted
                                  loop
                                  playsInline
                                />
                              ) : (
                                <img
                                  src={post.imageUrl || post.images?.[0] || post.image}
                                  alt={post.location}
                                  className={`w-full h-full object-cover transition-all duration-300 ${
                                    isEditMode ? 'hover:opacity-70' : 'hover:scale-110'
                                  }`}
                                />
                              )}
                              
                              {/* 우측 하단 하트 아이콘 */}
                              {!isEditMode && (
                                <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-white/80 backdrop-blur-sm rounded-full px-2 py-1">
                                  <span className={`material-symbols-outlined text-sm ${isLiked ? 'text-red-500 fill' : 'text-gray-600'}`}>
                                    favorite
                                  </span>
                                  <span className="text-xs font-semibold text-gray-700">{likeCount}</span>
                                </div>
                              )}
                              
                              {/* 편집 모드 체크박스 */}
                              {isEditMode && (
                                <div className="absolute top-2 right-2">
                                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                    selectedPhotos.includes(post.id)
                                      ? 'bg-primary border-primary'
                                      : 'bg-white border-gray-300'
                                  }`}>
                                    {selectedPhotos.includes(post.id) && (
                                      <span className="material-symbols-outlined text-white text-sm">check</span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {/* 이미지 밖 하단 텍스트 */}
                            <div className="space-y-1">
                              <p className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark line-clamp-2">
                                {post.note || post.location || '기록'}
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
                        );
                      })}
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* 나의 기록 지도 탭 */}
          {activeTab === 'map' && (
            <div>
              {myPosts.length === 0 ? (
                <div className="text-center py-12">
                  <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-4 block">
                    explore
                  </span>
                  <p className="text-text-secondary-light dark:text-text-secondary-dark text-base font-medium mb-2">
                    아직 기록이 없어요
                  </p>
                  <p className="text-gray-400 dark:text-gray-500 text-sm mb-4">
                    내 지역의 실시간 사진을 올리면<br />
                    여기에 나의 기록으로 표시돼요!
                  </p>
                  <button
                    onClick={() => navigate('/map')}
                    className="bg-primary text-white py-3 px-6 rounded-full font-semibold hover:bg-primary/90 transition-colors shadow-lg inline-flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined">explore</span>
                    지도에서 시작하기
                  </button>
                </div>
              ) : (
                <div>
                  {/* 날짜 필터 - 가벼운 디자인 */}
                  {availableDates.length > 0 && (
                    <div className="mb-3 flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => setSelectedDate('')}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                          !selectedDate
                            ? 'bg-primary text-white shadow-sm'
                            : 'bg-white/95 backdrop-blur-md text-gray-700 border border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        전체
                      </button>
                      {availableDates.slice(0, 7).map((date) => {
                        const dateObj = new Date(date);
                        const dateStr = dateObj.toLocaleDateString('ko-KR', {
                          month: 'short',
                          day: 'numeric',
                        });
                        const isSelected = selectedDate === date;
                        return (
                          <button
                            key={date}
                            onClick={() => setSelectedDate(isSelected ? '' : date)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                              isSelected
                                ? 'bg-primary text-white shadow-sm'
                                : 'bg-white/95 backdrop-blur-md text-gray-700 border border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            {dateStr}
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
                            input.onchange = (e) => {
                              if (e.target.value) {
                                setSelectedDate(e.target.value);
                              }
                            };
                            input.click();
                          }}
                          className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/95 backdrop-blur-md text-gray-700 border border-gray-200 hover:bg-gray-50 transition-all"
                        >
                          + 더보기
                        </button>
                      )}
                    </div>
                  )}

                  {/* 지도 영역 */}
                  <div 
                    ref={mapRef}
                    id="travel-map" 
                    className="w-full h-96 rounded-xl overflow-hidden mb-4 bg-gray-100 dark:bg-gray-800"
                    style={{ minHeight: '384px', position: 'relative' }}
                  >
                    {mapLoading && (
                      <div className="absolute inset-0 w-full h-full flex items-center justify-center text-gray-400 bg-gray-100 dark:bg-gray-800 z-10">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                          <p className="text-sm">지도를 불러오는 중...</p>
                        </div>
                      </div>
                    )}

                    {/* 여행 통계 - 지도 하단 오버레이 */}
                    {filteredPosts.length > 0 && (() => {
                    // 이동 거리 계산
                    const getDistanceKm = (lat1, lon1, lat2, lon2) => {
                      const toRad = (v) => (v * Math.PI) / 180;
                      const R = 6371;
                      const dLat = toRad(lat2 - lat1);
                      const dLon = toRad(lon2 - lon1);
                      const a =
                        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                        Math.cos(toRad(lat1)) *
                          Math.cos(toRad(lat2)) *
                          Math.sin(dLon / 2) *
                          Math.sin(dLon / 2);
                      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                      return R * c;
                    };

                    const sortedPosts = [...filteredPosts].sort((a, b) => {
                      const dateA = new Date(a.createdAt || a.timestamp || 0);
                      const dateB = new Date(b.createdAt || b.timestamp || 0);
                      return dateA - dateB;
                    });

                    let totalDistance = 0;
                    for (let i = 0; i < sortedPosts.length - 1; i++) {
                      const post1 = sortedPosts[i];
                      const post2 = sortedPosts[i + 1];
                      const coords1 = post1.coordinates || getCoordinatesByLocation(post1.detailedLocation || post1.location);
                      const coords2 = post2.coordinates || getCoordinatesByLocation(post2.detailedLocation || post2.location);
                      
                      if (coords1 && coords2 && coords1.lat && coords1.lng && coords2.lat && coords2.lng) {
                        totalDistance += getDistanceKm(coords1.lat, coords1.lng, coords2.lat, coords2.lng);
                      }
                    }

                    // 방문한 곳 목록 (중복 제거)
                    const visitedPlaces = [...new Set(
                      filteredPosts
                        .filter(post => post.location || post.detailedLocation)
                        .map(post => post.location || post.detailedLocation)
                    )];

                      return (
                        <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-center gap-3">
                          <div className="px-3 py-1.5 bg-white/95 backdrop-blur-md rounded-full border border-white/50 shadow-sm flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-primary text-sm">straighten</span>
                            <span className="text-xs font-semibold text-gray-700">
                              {totalDistance.toFixed(1)}km
                            </span>
                          </div>
                          <div className="px-3 py-1.5 bg-white/95 backdrop-blur-md rounded-full border border-white/50 shadow-sm flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-primary text-sm">place</span>
                            <span className="text-xs font-semibold text-gray-700">
                              {visitedPlaces.length}곳
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* 지역별 사진 수 */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">📍 지역</h3>
                    {Object.entries(
                      filteredPosts.reduce((acc, post) => {
                        const location = post.location || '기타';
                        acc[location] = (acc[location] || 0) + 1;
                        return acc;
                      }, {})
                    )
                      .sort((a, b) => b[1] - a[1])
                      .map(([location, count]) => (
                        <div
                          key={location}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                          onClick={() => {
                            setActiveTab('my');
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-xl">location_on</span>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{location}</span>
                          </div>
                          <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full">
                            {count}장
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
        </div>

        {/* 대표 뱃지 선택 모달 */}
        {showBadgeSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl">
            {/* 헤더 */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-bold">🏆 대표 뱃지 선택</h2>
              <button 
                onClick={() => setShowBadgeSelector(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* 뱃지 리스트 */}
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {representativeBadge && (
                <button
                  onClick={removeRepresentativeBadge}
                  className="w-full mb-3 p-3 bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-800 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                >
                  <div className="flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-red-500">close</span>
                    <span className="text-red-500 font-semibold text-sm">대표 뱃지 제거</span>
                  </div>
                </button>
              )}

              <div className="grid grid-cols-2 gap-3">
                {earnedBadges.map((badge, index) => (
                  <button
                    key={index}
                    onClick={() => selectRepresentativeBadge(badge)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      representativeBadge?.name === badge.name
                        ? 'bg-gradient-to-br from-primary/20 to-accent/20 border-primary shadow-lg'
                        : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary/50'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-5xl leading-none" role="img" aria-label={getBadgeDisplayName(badge)}>
                        {badge.icon || '🏆'}
                      </span>
                      <p className="text-sm font-bold text-center">{getBadgeDisplayName(badge)}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        badge.difficulty === '상' ? 'bg-primary-dark text-white' :
                        badge.difficulty === '중' ? 'bg-blue-500 text-white' :
                        'bg-green-500 text-white'
                      }`}>
                        {badge.difficulty}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        )}

        {/* 팔로워 / 팔로잉 목록 모달 - 핸드폰 화면사이즈에 맞춤 */}
        {showFollowListModal && (
          <div
            className="fixed inset-0 z-[100] flex flex-col bg-white dark:bg-gray-900 w-full max-w-[414px] mx-auto min-h-[100dvh] pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]"
            onClick={() => setShowFollowListModal(false)}
          >
            <div
              className="flex-1 min-h-0 w-full flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                <h2 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">
                  {followListType === 'follower' ? '팔로워' : '팔로잉'}
                </h2>
                <button
                  onClick={() => setShowFollowListModal(false)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>
              <div className="px-4 pt-4 pb-6 overflow-y-auto flex-1 min-h-0">
                {followListIds.length === 0 ? (
                  <p className="text-center py-8 text-text-secondary-light dark:text-text-secondary-dark text-sm">
                    {followListType === 'follower' ? '팔로워가 없습니다' : '팔로우 중인 사용자가 없습니다'}
                  </p>
                ) : (
                  (() => {
                    const posts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');
                    const currentUserData = authUser || user;
                    const myId = currentUserData?.id;

                    const resolveUserInfo = (uid) => {
                      if (String(uid) === String(myId) && currentUserData) {
                        return {
                          username: currentUserData.username || '사용자',
                          profileImage: currentUserData.profileImage || null,
                        };
                      }
                      const p = posts.find((post) => {
                        const pu = post.userId || (typeof post.user === 'string' ? post.user : post.user?.id);
                        return String(pu) === String(uid);
                      });
                      if (!p) return { username: '사용자', profileImage: null };
                      if (!p.user) return { username: '사용자', profileImage: null };
                      if (typeof p.user === 'string') {
                        return { username: p.user, profileImage: null };
                      }
                      return {
                        username: p.user?.username || '사용자',
                        profileImage: p.user?.profileImage || null,
                      };
                    };

                    const getRepBadge = (uid) => {
                      try {
                        const j = localStorage.getItem(`representativeBadge_${uid}`);
                        return j ? JSON.parse(j) : null;
                      } catch {
                        return null;
                      }
                    };

                    return followListIds.map((uid) => {
                      const { username, profileImage } = resolveUserInfo(uid);
                      const repBadge = getRepBadge(uid);
                      return (
                        <div
                          key={uid}
                          className="flex items-center justify-between gap-3 py-3 pb-4 border-b border-gray-100 dark:border-gray-800 last:border-b-0 last:pb-3"
                        >
                          <button
                            type="button"
                            onClick={() => { setShowFollowListModal(false); navigate(`/user/${uid}`); }}
                            className="flex items-center gap-3 flex-1 min-w-0 text-left"
                          >
                            {/* 프로필 이미지 */}
                            <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 bg-teal-100 dark:bg-teal-900 flex items-center justify-center">
                              {profileImage ? (
                                <img src={profileImage} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="material-symbols-outlined text-teal-600 dark:text-teal-400 text-2xl">person</span>
                              )}
                            </div>
                            {/* 사용자 이름 + 대표 뱃지 */}
                            <div className="flex-1 min-w-0 flex flex-col items-start gap-1">
                              <span className="font-semibold text-text-primary-light dark:text-text-primary-dark truncate w-full text-left">
                                {username}
                              </span>
                              {repBadge && (
                                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/20 border border-primary/50 flex-shrink-0">
                                  <span className="text-sm">{repBadge.icon}</span>
                                  <span className="text-xs font-semibold text-primary truncate max-w-[100px]">{repBadge.name}</span>
                                </div>
                              )}
                            </div>
                          </button>
                          {/* 팔로우 버튼: 언제든 팔로우/팔로잉 취소 가능 */}
                          {myId && String(uid) !== String(myId) && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isFollowing(null, uid)) {
                                  unfollow(uid);
                                  if (followListType === 'following') {
                                    setFollowListIds((prev) => prev.filter((id) => String(id) !== String(uid)));
                                  }
                                } else {
                                  follow(uid);
                                }
                              }}
                              className={`shrink-0 py-2 px-4 rounded-xl text-sm font-semibold transition-colors ${
                                isFollowing(null, uid)
                                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700'
                                  : 'bg-primary text-white hover:bg-primary/90'
                              }`}
                            >
                              {isFollowing(null, uid) ? '팔로잉' : '팔로우'}
                            </button>
                          )}
                        </div>
                      );
                    });
                  })()
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
};

export default ProfileScreen;







