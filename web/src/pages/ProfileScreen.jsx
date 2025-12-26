import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import BottomNavigation from '../components/BottomNavigation';
import { getUnreadCount } from '../utils/notifications';
import { getEarnedBadges } from '../utils/badgeSystem';
import { getUserLevel } from '../utils/levelSystem';
import { filterRecentPosts } from '../utils/timeUtils';
import { getCoordinatesByLocation } from '../utils/regionLocationMapping';
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
  const [activeTab, setActiveTab] = useState('my'); // 'my' | 'map' | 'timeline'
  
  // 지도 관련
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const [mapLoading, setMapLoading] = useState(true);

  // 모든 Hook을 먼저 선언한 후 useEffect 실행
  useEffect(() => {
    // 로그인되지 않은 경우 useEffect 실행 안함
    if (!isAuthenticated) return;
    // localStorage에서 사용자 정보 로드
    const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(savedUser);

    // 획득한 뱃지 로드
    const badges = getEarnedBadges();
    setEarnedBadges(badges);
    logger.log('🏆 프로필 화면 - 획득한 뱃지 로드:', badges.length);

    // 대표 뱃지 로드 (반드시 획득한 뱃지 중에서 선택)
    const userId = savedUser?.id;
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
        setMyPosts(updatedUserPosts);
        
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

    window.addEventListener('notificationUpdate', handleNotificationUpdate);
    window.addEventListener('newPostsAdded', handlePostsUpdate);
    window.addEventListener('storage', handlePostsUpdate);
    window.addEventListener('badgeEarned', handleBadgeUpdate);
    window.addEventListener('levelUp', handleLevelUpdate);
    
    return () => {
      window.removeEventListener('notificationUpdate', handleNotificationUpdate);
      window.removeEventListener('newPostsAdded', handlePostsUpdate);
      window.removeEventListener('storage', handlePostsUpdate);
      window.removeEventListener('badgeEarned', handleBadgeUpdate);
      window.removeEventListener('levelUp', handleLevelUpdate);
    };
  }, []);

  // 지도 초기화 및 마커 표시
  const initMap = useCallback(() => {
    logger.log('🗺️ 지도 초기화 시작', {
      kakaoLoaded: !!window.kakao, 
      mapRefExists: !!mapRef.current, 
      activeTab, 
      postsCount: myPosts.length 
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
      // 기존 마커 제거
      markersRef.current.forEach(markerData => {
        if (markerData.overlay) {
          markerData.overlay.setMap(null);
        }
        if (markerData.marker) {
          markerData.marker.setMap(null);
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

      if (myPosts.length > 0) {
        const firstPost = myPosts[0];
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
        logger.log('📍 마커 생성 시작:', myPosts.length);
        
        // 기존 마커 제거
        markersRef.current.forEach(markerData => {
          if (markerData.overlay) {
            markerData.overlay.setMap(null);
          }
          if (markerData.marker) {
            markerData.marker.setMap(null);
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
            const currentIndex = myPosts.findIndex(p => p.id === post.id);
            navigate(`/post/${post.id}`, {
              state: {
                post: post,
                allPosts: myPosts,
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
              const currentIndex = myPosts.findIndex(p => p.id === post.id);
              navigate(`/post/${post.id}`, {
                state: {
                  post: post,
                  allPosts: myPosts,
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

        // 모든 게시물에 대해 마커 생성
        myPosts.forEach((post, index) => {
          createMarker(post, index, map, bounds);
        });

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
  }, [myPosts, activeTab, navigate]);

  // 탭 변경 시 지도 초기화
  useEffect(() => {
    if (activeTab === 'map') {
      logger.log('🗺️ 나의 기록 지도 탭 활성화');
      setMapLoading(true);
      
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
  }, [activeTab, myPosts, initMap]);

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
    const userId = user.id;
    const updatedMyPosts = filteredPosts.filter(post => post.userId === userId);
    setMyPosts(updatedMyPosts);

    // 편집 모드 종료
    setSelectedPhotos([]);
    setIsEditMode(false);

    alert(`${selectedPhotos.length}개의 사진이 삭제되었습니다.`);
  };

  // 대표 뱃지 선택
  const selectRepresentativeBadge = (badge) => {
    const userId = user?.id;
    if (userId) {
      localStorage.setItem(`representativeBadge_${userId}`, JSON.stringify(badge));
    }
    localStorage.setItem('representativeBadge', JSON.stringify(badge)); // 호환성 유지
    setRepresentativeBadge(badge);
    setShowBadgeSelector(false);
    
    // user 정보 업데이트
    const updatedUser = { ...user, representativeBadge: badge };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    
    logger.log('✅ 대표 뱃지 선택:', badge.name);
  };

  // 대표 뱃지 제거
  const removeRepresentativeBadge = () => {
    const userId = user?.id;
    if (userId) {
      localStorage.removeItem(`representativeBadge_${userId}`);
    }
    localStorage.removeItem('representativeBadge'); // 호환성 유지
    setRepresentativeBadge(null);
    
    const updatedUser = { ...user, representativeBadge: null };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    
    logger.log('❌ 대표 뱃지 제거');
  };

  // 사용자가 없을 때 계정연결하기 화면 표시
  if (!user || !authUser) {
    return (
      <div className="screen-layout bg-background-light dark:bg-background-dark">
        {/* 계정 연결 안내 화면은 스크롤 없이 한 화면에 고정 */}
        <div className="screen-content" style={{ overflow: 'hidden' }}>
          {/* 헤더 */}
          <header className="screen-header bg-white dark:bg-gray-900 flex items-center p-4 justify-between">
            <button 
              onClick={() => navigate('/main')}
              className="flex size-12 shrink-0 items-center justify-center text-text-primary-light dark:text-text-primary-dark hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined text-2xl">arrow_back</span>
            </button>
            <h1 className="text-text-primary-light dark:text-text-primary-dark text-base font-semibold">프로필</h1>
            <div className="w-12"></div>
          </header>

          {/* 계정연결하기 유도 화면 - 살짝 상단으로 올린 레이아웃 */}
          <div className="screen-body flex flex-col items-center justify-start px-6 pt-16 pb-8">
            <div className="w-full max-w-sm text-center">
              {/* 아이콘 */}
              <div className="mb-6 flex justify-center">
                <div className="w-24 h-24 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-5xl">account_circle</span>
        </div>
              </div>

              {/* 제목 */}
              <h2 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark mb-2">
                계정을 연결해주세요
              </h2>
              <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm mb-8">
                계정을 연결하면 기록을 저장하고<br />
                뱃지를 획득할 수 있어요
              </p>

              {/* 계정연결하기 버튼 */}
              <button
                onClick={() => {
                  // 소셜로그인 화면으로 이동
                  sessionStorage.setItem('showLoginScreen', 'true');
                  navigate('/start');
                }}
                className="w-full bg-primary text-white py-4 px-6 rounded-xl font-bold text-base hover:bg-primary/90 transition-colors shadow-lg flex items-center justify-center gap-2 mb-4"
              >
                <span className="material-symbols-outlined">link</span>
                계정연결하기
              </button>

              {/* 안내 메시지 */}
              <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                소셜 로그인으로 간편하게 시작할 수 있어요
              </p>
            </div>
          </div>
        </div>

        <BottomNavigation />
      </div>
    );
  }

  const badgeCount = earnedBadges.length;

  // 로그인되지 않은 경우 로그인 유도 화면 렌더링
  if (!isAuthenticated) {
    return (
      <div className="relative flex h-full w-full flex-col bg-white dark:bg-zinc-900">
        {/* 헤더 */}
        <div className="sticky top-0 z-10 flex items-center justify-between bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">프로필</h1>
        </div>

        {/* 로그인 유도 컨텐츠 */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-24 h-24 mb-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <span className="material-symbols-outlined text-6xl text-gray-400 dark:text-gray-500">
              person
            </span>
          </div>
          
          <h2 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark mb-3">
            로그인이 필요합니다
          </h2>
          
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-6 max-w-sm">
            로그인하시면 게시물 업로드, 뱃지 획득, 커뮤니티 참여 등 다양한 기능을 사용하실 수 있습니다.
          </p>

          <button
            onClick={() => navigate('/start')}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-full font-semibold hover:bg-primary-dark active:scale-95 transition-all shadow-lg"
          >
            <span className="material-symbols-outlined text-xl">login</span>
            <span>로그인 / 회원가입</span>
          </button>

          <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-semibold">로그인하면 이용 가능:</p>
            <div className="flex flex-col gap-2 text-left">
              <div className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
                <span className="material-symbols-outlined text-base text-primary">check_circle</span>
                <span>여행 사진 업로드 및 공유</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
                <span className="material-symbols-outlined text-base text-primary">check_circle</span>
                <span>뱃지 획득 및 레벨 시스템</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
                <span className="material-symbols-outlined text-base text-primary">check_circle</span>
                <span>다른 여행자 팔로우 및 소통</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
                <span className="material-symbols-outlined text-base text-primary">check_circle</span>
                <span>맞춤 추천 및 알림</span>
              </div>
            </div>
          </div>
        </div>

        {/* 하단 네비게이션 */}
        <BottomNavigation unreadNotificationCount={0} />
      </div>
    );
  }

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
              {user.profileImage && user.profileImage !== 'default' ? (
                <img 
                  src={user.profileImage} 
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
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-text-primary-light dark:text-text-primary-dark text-lg font-bold">
                  {user.username || '모사모'}
                </h2>
                {/* 대표 뱃지 */}
                {representativeBadge && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-primary-soft to-accent-soft rounded-full border-2 border-primary/30">
                    <span className="text-base leading-none" role="img" aria-label={representativeBadge.name}>
                      {representativeBadge.icon || '🏆'}
                    </span>
                    <span className="text-xs font-bold text-primary">{representativeBadge.name}</span>
                  </div>
                )}
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

        {/* 획득한 뱃지 섹션 */}
        <div className="bg-white dark:bg-gray-900 px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">workspace_premium</span>
              <h3 className="text-text-primary-light dark:text-text-primary-dark text-base font-bold">
                획득한 뱃지
              </h3>
            </div>
            {/* 뱃지 모아보기 버튼 - 작게 */}
            <button
              onClick={() => navigate('/badges')}
              className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 rounded-full transition-colors"
            >
              <span className="text-xs font-semibold text-primary">모아보기</span>
              <span className="text-xs font-bold text-primary">{badgeCount}</span>
              <span className="material-symbols-outlined text-primary text-sm">chevron_right</span>
            </button>
          </div>

          {badgeCount === 0 ? (
            <div className="text-center py-6">
              <div className="relative inline-block mb-4">
                <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <span className="material-symbols-outlined text-gray-300 dark:text-gray-600 text-5xl">workspace_premium</span>
                </div>
                <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold">
                  0
                </span>
              </div>
              <p className="text-text-primary-light dark:text-text-primary-dark text-sm font-medium mb-1">
                아직 획득한 뱃지가 없어요
              </p>
              <p className="text-text-secondary-light dark:text-text-secondary-dark text-xs mb-4">
                기록을 남기고 뱃지를 획득해보세요!
              </p>
              <button
                onClick={() => navigate('/upload')}
                className="w-full bg-primary text-white py-3 px-6 rounded-xl font-semibold hover:bg-primary/90 transition-colors shadow-lg flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">add_circle</span>
                첫 기록하기
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* 대표 뱃지 선택 버튼 */}
              <button
                onClick={() => setShowBadgeSelector(true)}
                className="w-full text-left"
              >
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary-soft to-accent-soft rounded-xl border-2 border-primary/30 hover:border-primary/50 transition-all">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary text-2xl">military_tech</span>
                    <div>
                      <p className="text-text-primary-light dark:text-text-primary-dark font-bold text-sm">대표 뱃지</p>
                      <p className="text-text-secondary-light dark:text-text-secondary-dark text-xs">
                        {representativeBadge ? representativeBadge.name : '뱃지를 선택해주세요'}
                      </p>
                    </div>
                  </div>
                  {representativeBadge && (
                    <div className="flex items-center gap-2">
                      <span className="text-3xl leading-none" role="img" aria-label={representativeBadge.name}>
                        {representativeBadge.icon || '🏆'}
                      </span>
                    </div>
                  )}
                </div>
              </button>
            </div>
          )}
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
            <button
              onClick={() => setActiveTab('timeline')}
              className={`flex-1 py-3 px-2 rounded-xl font-semibold transition-all text-sm whitespace-nowrap ${
                activeTab === 'timeline'
                  ? 'bg-primary text-white shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-800 text-text-secondary-light dark:text-text-secondary-dark hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              📅 타임라인
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

          {/* 내 사진 탭 */}
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
            <div className="grid grid-cols-2 gap-4">
              {myPosts.map((post, index) => {
                const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '{}');
                const isLiked = likedPosts[post.id] || false;
                const likeCount = post.likes || post.likeCount || 0;
                
                return (
                  <div
                    key={post.id || index}
                    onClick={(e) => {
                      if (isEditMode) {
                        togglePhotoSelection(post.id);
                      } else {
                        const currentIndex = myPosts.findIndex(p => p.id === post.id);
                        navigate(`/post/${post.id}`, {
                          state: {
                            post: post,
                            allPosts: myPosts,
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
                  </div>

                  {/* 지역별 사진 수 */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">📍 지역</h3>
                    {Object.entries(
                      myPosts.reduce((acc, post) => {
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

          {/* 타임라인 탭 */}
          {activeTab === 'timeline' && (
            <div>
              {myPosts.length === 0 ? (
                <div className="text-center py-12">
                  <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-4 block">
                    event_note
                  </span>
                  <p className="text-text-secondary-light dark:text-text-secondary-dark text-base font-medium mb-2">
                    아직 기록이 없어요
                  </p>
                  <p className="text-gray-400 dark:text-gray-500 text-sm">
                    사진을 올리면 타임라인으로 정리돼요!
                  </p>
                </div>
              ) : (
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
                        <div className="grid grid-cols-3 gap-2 mb-4">
                          {posts.map((post, index) => {
                            const allPosts = myPosts;
                            const currentIndex = allPosts.findIndex(p => p.id === post.id);
                            return (
                            <div
                              key={post.id || index}
                                onClick={() => navigate(`/post/${post.id}`, {
                                  state: {
                                    post: post,
                                    allPosts: allPosts,
                                    currentPostIndex: currentIndex >= 0 ? currentIndex : 0
                                  }
                                })}
                              className="cursor-pointer group"
                            >
                              <div className="aspect-square relative overflow-hidden rounded-lg">
                                <img
                                  src={post.imageUrl || post.images?.[0] || 'https://images.unsplash.com/photo-1524222717473-730000096953?w=800&auto=format&fit=crop&q=80'}
                                  alt={post.location}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-all duration-300"
                                  onError={(e) => {
                                    e.currentTarget.src = 'https://images.unsplash.com/photo-1524222717473-730000096953?w=800&auto=format&fit=crop&q=80';
                                  }}
                                />
                                {/* 카테고리 아이콘 */}
                                <div className="absolute top-2 left-2">
                                  <div className="text-2xl drop-shadow-lg">
                                    {post.category === 'blooming' && '🌸'}
                                    {post.category === 'snow' && '❄️'}
                                    {post.category === 'autumn' && '🍁'}
                                    {post.category === 'festival' && '🎉'}
                                    {post.category === 'crowd' && '👥'}
                                    {post.category === 'general' && '📷'}
                                  </div>
                                </div>
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">
                                {post.location}
                              </p>
                            </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
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
                      <span className="text-5xl leading-none" role="img" aria-label={badge.name}>
                        {badge.icon || '🏆'}
                      </span>
                      <p className="text-sm font-bold text-center">{badge.name}</p>
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
      </div>

      <BottomNavigation />
    </div>
  );
};

export default ProfileScreen;







