import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';
import { addNotification } from '../utils/notifications';
import { getLocationByCoordinates } from '../utils/locationCoordinates';

const MapScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const sheetRef = useRef(null);
  const dragHandleRef = useRef(null);
  const markersRef = useRef([]);
  const currentLocationMarkerRef = useRef(null);
  const [map, setMap] = useState(null);
  const [posts, setPosts] = useState([]);
  const [visiblePins, setVisiblePins] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [sheetOffset, setSheetOffset] = useState(0); // 시트 오프셋 (0 = 보임, 큰 값 = 숨김)
  const [mapInitialized, setMapInitialized] = useState(false);
  const [isSheetHidden, setIsSheetHidden] = useState(false); // 시트가 완전히 숨겨졌는지 여부
  const [sheetHeight, setSheetHeight] = useState(200); // 시트의 실제 높이
  const [selectedPost, setSelectedPost] = useState(null); // 선택된 게시물 (상세화면용)
  const [showSOSModal, setShowSOSModal] = useState(false); // 도움 요청 모달 표시 여부
  const [selectedSOSLocation, setSelectedSOSLocation] = useState(null); // 선택된 도움 요청 위치
  const [sosQuestion, setSosQuestion] = useState(''); // 궁금한 내용
  const [isSelectingLocation, setIsSelectingLocation] = useState(false); // 지도에서 위치 선택 중인지 여부
  const [showAdModal, setShowAdModal] = useState(false); // 광고 모달 표시 여부
  const [pendingSOSRequest, setPendingSOSRequest] = useState(null); // 광고를 보기 전 대기 중인 도움 요청
  const sosMarkerRef = useRef(null); // 도움 요청 위치 마커
  const centerMarkerRef = useRef(null); // 지도 중심 고정 마커 (HTML 요소)
  const crosshairRef = useRef(null); // 가운데 표시선 (십자선)
  const locationPreviewMapRef = useRef(null); // 위치 미리보기 작은 지도

  // 현재 위치 가져오기 (먼저 실행)
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentLocation(loc);
          
          // 위치를 가져온 후 지도 초기화
          if (!mapInitialized) {
            initializeMap(loc);
          } else if (map) {
            // 지도가 이미 초기화되어 있으면 현재 위치 마커 업데이트
            updateCurrentLocationMarker(map, loc);
          }
        },
        (error) => {
          console.error('위치 가져오기 실패:', error);
          // 위치 가져오기 실패 시 기본 위치로 초기화
          if (!mapInitialized) {
            initializeMap({ lat: 37.5665, lng: 126.9780 });
          }
        }
      );
    } else {
      // geolocation 지원 안 할 경우 기본 위치로 초기화
      if (!mapInitialized) {
        initializeMap({ lat: 37.5665, lng: 126.9780 });
      }
    }
  }, []);

  const initializeMap = (initialCenter) => {
    const initMap = () => {
      if (!window.kakao || !window.kakao.maps) {
        setTimeout(initMap, 100);
        return;
      }

      const container = mapRef.current;
      if (!container) return;

      const selectedPin = location.state?.selectedPin;
      const sosLocation = location.state?.sosLocation;
      const center = selectedPin
        ? new window.kakao.maps.LatLng(selectedPin.lat, selectedPin.lng)
        : sosLocation
        ? new window.kakao.maps.LatLng(sosLocation.lat, sosLocation.lng)
        : new window.kakao.maps.LatLng(initialCenter.lat, initialCenter.lng);

      const options = {
        center: center,
        level: selectedPin ? 3 : 4
      };

      const kakaoMap = new window.kakao.maps.Map(container, options);
      setMap(kakaoMap);
      setMapInitialized(true);

      // 현재 위치 마커 추가
      if (initialCenter) {
        updateCurrentLocationMarker(kakaoMap, initialCenter);
      }

      loadPosts(kakaoMap);

      // 지도 범위 변경 시 보이는 핀 업데이트
      window.kakao.maps.event.addListener(kakaoMap, 'bounds_changed', () => {
        updateVisiblePins(kakaoMap);
      });

      // 초기 보이는 핀 업데이트
      setTimeout(() => updateVisiblePins(kakaoMap), 500);
    };

    initMap();
  };

  const updateCurrentLocationMarker = (kakaoMap, location) => {
    // 기존 현재 위치 마커 제거
    if (currentLocationMarkerRef.current) {
      currentLocationMarkerRef.current.setMap(null);
    }

    const position = new window.kakao.maps.LatLng(location.lat, location.lng);

    // 현재 위치 마커 생성 (하늘색 원점 + 여러 파동 - 더 잘 보이게 강화)
    const el = document.createElement('div');
    el.innerHTML = `
      <div style="
        position: relative;
        width: 56px;
        height: 56px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <!-- 파동 1 -->
        <div style="
          position: absolute;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background-color: rgba(135, 206, 250, 0.25);
          animation: pulse1 2s infinite;
        "></div>
        <!-- 파동 2 -->
        <div style="
          position: absolute;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background-color: rgba(135, 206, 250, 0.2);
          animation: pulse2 2s infinite;
        "></div>
        <!-- 파동 3 -->
        <div style="
          position: absolute;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background-color: rgba(135, 206, 250, 0.15);
          animation: pulse3 2s infinite;
        "></div>
        <!-- 하늘색 원점 -->
        <div style="
          position: relative;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background-color: #87CEEB;
          border: 4px solid rgba(255, 255, 255, 1);
          box-shadow: 0 3px 10px rgba(0,0,0,0.4);
          z-index: 10;
        "></div>
      </div>
      <style>
        @keyframes pulse1 {
          0% {
            transform: scale(1);
            opacity: 0.25;
          }
          100% {
            transform: scale(3);
            opacity: 0;
          }
        }
        @keyframes pulse2 {
          0% {
            transform: scale(1);
            opacity: 0.2;
          }
          100% {
            transform: scale(3.5);
            opacity: 0;
          }
        }
        @keyframes pulse3 {
          0% {
            transform: scale(1);
            opacity: 0.15;
          }
          100% {
            transform: scale(4);
            opacity: 0;
          }
        }
      </style>
    `;

    const overlay = new window.kakao.maps.CustomOverlay({
      position: position,
      content: el,
      yAnchor: 0.5,
      xAnchor: 0.5,
      zIndex: 1000
    });

    overlay.setMap(kakaoMap);
    currentLocationMarkerRef.current = overlay;
  };

  const loadPosts = async (kakaoMap) => {
    try {
      const postsJson = localStorage.getItem('uploadedPosts');
      const allPosts = postsJson ? JSON.parse(postsJson) : [];
      
      const validPosts = allPosts.filter(post => {
        return post.coordinates || post.location || post.detailedLocation;
      });

      setPosts(validPosts);
      createMarkers(validPosts, kakaoMap);
    } catch (error) {
      console.error('게시물 로드 실패:', error);
    }
  };

  const getCoordinatesByLocation = (locationName) => {
    const defaultCoords = {
      '서울': { lat: 37.5665, lng: 126.9780 },
      '부산': { lat: 35.1796, lng: 129.0756 },
      '제주': { lat: 33.4996, lng: 126.5312 },
      '인천': { lat: 37.4563, lng: 126.7052 },
      '대구': { lat: 35.8714, lng: 128.6014 },
      '대전': { lat: 36.3504, lng: 127.3845 },
      '광주': { lat: 35.1595, lng: 126.8526 },
      '수원': { lat: 37.2636, lng: 127.0286 },
      '용인': { lat: 37.2411, lng: 127.1776 },
      '성남': { lat: 37.4201, lng: 127.1268 }
    };

    if (!locationName) return null;

    for (const [region, coords] of Object.entries(defaultCoords)) {
      if (locationName.includes(region)) {
        return coords;
      }
    }

    return { lat: 37.5665, lng: 126.9780 };
  };

  const createMarkers = (posts, kakaoMap) => {
    markersRef.current.forEach(markerData => {
      if (markerData.overlay) {
        markerData.overlay.setMap(null);
      }
    });
    markersRef.current = [];

    const bounds = new window.kakao.maps.LatLngBounds();
    let hasValidMarker = false;

    posts.forEach((post, index) => {
      const coords = post.coordinates || getCoordinatesByLocation(post.detailedLocation || post.location);
      if (!coords) return;

      const position = new window.kakao.maps.LatLng(coords.lat, coords.lng);
      bounds.extend(position);

      // 게시물의 첫 번째 이미지 사용
      const imageUrl = post.images?.[0] || post.imageUrl || post.image || post.thumbnail;
      
      const el = document.createElement('div');
      el.innerHTML = `
        <button 
          class="pin-btn" 
          style="
            z-index: ${index};
            width: 50px;
            height: 50px;
            border: 3px solid white;
            border-radius: 4px;
            box-shadow: 0 3px 12px rgba(0,0,0,0.3);
            overflow: hidden;
            cursor: pointer;
            padding: 0;
            margin: 0;
            background: #f5f5f5;
            transition: transform 0.2s ease;
          " 
          data-post-id="${post.id}"
        >
          <img 
            style="
              width: 100%;
              height: 100%;
              object-fit: cover;
              display: block;
            " 
            src="${imageUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iNCIgZmlsbD0iI0YzRjRGNiIvPgo8cGF0aCBkPSJNMjAgMTNDMTcuMjQgMTMgMTUgMTUuMjQgMTUgMThDMTUgMjAuNzYgMTcuMjQgMjMgMjAgMjNDMjIuNzYgMjMgMjUgMjAuNzYgMjUgMThDMjUgMTUuMjQgMjIuNzYgMTMgMjAgMTNaIiBmaWxsPSIjOUI5Q0E1Ii8+Cjwvc3ZnPg=='} 
            alt="${post.location || '여행지'}"
            onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iNCIgZmlsbD0iI0YzRjRGNiIvPgo8cGF0aCBkPSJNMjAgMTNDMTcuMjQgMTMgMTUgMTUuMjQgMTUgMThDMTUgMjAuNzYgMTcuMjQgMjMgMjAgMjNDMjIuNzYgMjMgMjUgMjAuNzYgMjUgMThDMjUgMTUuMjQgMjIuNzYgMTMgMjAgMTNaIiBmaWxsPSIjOUI5Q0E1Ii8+Cjwvc3ZnPg==';"
          />
        </button>
      `;

      const button = el.querySelector('button');
      if (button) {
        button.addEventListener('click', (e) => {
          e.stopPropagation();
          setSelectedPost({ post, allPosts: posts, currentPostIndex: index });
        });

        button.addEventListener('mouseenter', () => {
          button.style.transform = 'scale(1.15)';
          button.style.boxShadow = '0 4px 16px rgba(0,0,0,0.4)';
        });

        button.addEventListener('mouseleave', () => {
          button.style.transform = 'scale(1)';
          button.style.boxShadow = '0 3px 12px rgba(0,0,0,0.3)';
        });
      }

      const overlay = new window.kakao.maps.CustomOverlay({
        position: position,
        content: el,
        yAnchor: 1,
        xAnchor: 0.5,
        zIndex: index
      });

      overlay.setMap(kakaoMap);

      markersRef.current.push({ overlay, post, position });
      hasValidMarker = true;
    });

    const selectedPin = location.state?.selectedPin;
    const sosLocation = location.state?.sosLocation;
    if (selectedPin) {
      kakaoMap.setCenter(new window.kakao.maps.LatLng(selectedPin.lat, selectedPin.lng));
      kakaoMap.setLevel(3);
    } else if (sosLocation) {
      kakaoMap.setCenter(new window.kakao.maps.LatLng(sosLocation.lat, sosLocation.lng));
      kakaoMap.setLevel(3);
    }
  };

  const updateVisiblePins = (kakaoMap) => {
    if (!kakaoMap) return;

    const bounds = kakaoMap.getBounds();
    const visible = markersRef.current
      .filter(markerData => {
        const position = markerData.position;
        return bounds.contain(position);
      })
      .map(markerData => ({
        id: markerData.post.id,
        title: markerData.post.location || markerData.post.detailedLocation || '여행지',
        image: markerData.post.images?.[0] || markerData.post.imageUrl || markerData.post.image || markerData.post.thumbnail,
        lat: markerData.position.getLat(),
        lng: markerData.position.getLng(),
        post: markerData.post
      }));

    setVisiblePins(visible);
  };

  const handleDragStart = (e) => {
    setIsDragging(true);
    setStartY(e.type === 'mousedown' ? e.clientY : e.touches[0].clientY);
  };

  const handleDragMove = (e) => {
    if (!isDragging) return;
    const clientY = e.type === 'mousemove' ? e.clientY : e.touches[0].clientY;
    const deltaY = clientY - startY;
    // 아래로 드래그만 허용 (양수만)
    if (deltaY > 0) {
      setSheetOffset(deltaY);
    }
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    // 100px 이상 드래그하면 시트를 완전히 숨김
    const sheetElement = sheetRef.current;
    if (sheetElement) {
      const sheetHeight = sheetElement.offsetHeight;
      const threshold = sheetHeight * 0.5; // 시트 높이의 50% 이상 드래그하면 숨김
      
      if (sheetOffset > threshold) {
        setSheetOffset(sheetHeight + 20); // 시트를 완전히 숨김 (약간의 여유 공간 추가)
        setIsSheetHidden(true);
      } else {
        setSheetOffset(0); // 원래 위치로
        setIsSheetHidden(false);
      }
    } else {
      setSheetOffset(0);
      setIsSheetHidden(false);
    }
  };

  const handleShowSheet = () => {
    setSheetOffset(0);
    setIsSheetHidden(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
      document.addEventListener('touchmove', handleDragMove);
      document.addEventListener('touchend', handleDragEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);
        document.removeEventListener('touchmove', handleDragMove);
        document.removeEventListener('touchend', handleDragEnd);
      };
    }
  }, [isDragging, sheetOffset]);

  // 시트 높이 업데이트
  useEffect(() => {
    if (sheetRef.current) {
      const updateSheetHeight = () => {
        if (sheetRef.current) {
          setSheetHeight(sheetRef.current.offsetHeight);
        }
      };
      updateSheetHeight();
      window.addEventListener('resize', updateSheetHeight);
      return () => window.removeEventListener('resize', updateSheetHeight);
    }
  }, [visiblePins]);

  const handleZoomIn = () => {
    if (map) {
      const level = map.getLevel();
      if (level > 1) {
        map.setLevel(level - 1);
      }
    }
  };

  const handleZoomOut = () => {
    if (map) {
      const level = map.getLevel();
      if (level < 14) {
        map.setLevel(level + 1);
      }
    }
  };

  const handleCenterLocation = () => {
    if (map && currentLocation) {
      const moveLatLon = new window.kakao.maps.LatLng(currentLocation.lat, currentLocation.lng);
      map.panTo(moveLatLon);
      map.setLevel(3);
    }
  };

  const handleSOSRequest = () => {
    // 도움 요청 모달 열기
    setSelectedSOSLocation(null);
    setIsSelectingLocation(false);
    setShowSOSModal(true);
  };

  // 도움 요청 위치 마커 업데이트
  const updateSOSMarker = (kakaoMap, location) => {
    // 기존 마커 제거
    if (sosMarkerRef.current) {
      sosMarkerRef.current.setMap(null);
      sosMarkerRef.current = null;
    }
    // 핀 마커 생성 코드 삭제됨
  };

  // 지도 중심 마커 표시/제거 (위치 선택 모드일 때)
  useEffect(() => {
    if (!mapContainerRef.current || !isSelectingLocation) {
      // 마커 및 표시선 제거
      if (centerMarkerRef.current) {
        centerMarkerRef.current.remove();
        centerMarkerRef.current = null;
      }
      if (crosshairRef.current) {
        crosshairRef.current.remove();
        crosshairRef.current = null;
      }
      return;
    }

    // 지도 컨테이너에 중심 마커 생성 (지도 위에 오버레이)
    const mapContainer = mapContainerRef.current;
    
    // 십자선 표시선 생성
    const crosshair = document.createElement('div');
    crosshair.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 40px;
      height: 40px;
      pointer-events: none;
      z-index: 1001;
    `;
    crosshair.innerHTML = `
      <div style="
        position: relative;
        width: 100%;
        height: 100%;
      ">
        <div style="
          position: absolute;
          top: 50%;
          left: 0;
          width: 100%;
          height: 2px;
          background: rgba(0, 188, 212, 0.6);
          transform: translateY(-50%);
        "></div>
        <div style="
          position: absolute;
          left: 50%;
          top: 0;
          width: 2px;
          height: 100%;
          background: rgba(0, 188, 212, 0.6);
          transform: translateX(-50%);
        "></div>
      </div>
    `;
    mapContainer.appendChild(crosshair);
    crosshairRef.current = crosshair;
    
    // 핀 마커 생성
    const marker = document.createElement('div');
    marker.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -100%);
      width: 36px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
      z-index: 1002;
    `;
    
    marker.innerHTML = `
      <div style="
        position: relative;
        width: 0;
        height: 0;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg width="36" height="40" viewBox="0 0 36 40" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 8px rgba(0,0,0,0.3));">
          <path d="M18 0C12.477 0 8 4.477 8 10C8 17 18 40 18 40C18 40 28 17 28 10C28 4.477 23.523 0 18 0Z" fill="#00BCD4"/>
          <circle cx="18" cy="10" r="6" fill="#0097A7"/>
        </svg>
      </div>
    `;

    mapContainer.appendChild(marker);
    centerMarkerRef.current = marker;

    // 지도 중심이 변경될 때마다 위치 업데이트
    const handleCenterChanged = () => {
      if (!map) return;
      const center = map.getCenter();
      const location = {
        lat: center.getLat(),
        lng: center.getLng()
      };
      setSelectedSOSLocation(location);
    };

    // 초기 위치 설정
    handleCenterChanged();
    if (map && window.kakao && window.kakao.maps) {
      window.kakao.maps.event.addListener(map, 'center_changed', handleCenterChanged);
    }

    return () => {
      if (centerMarkerRef.current && mapContainer.contains(centerMarkerRef.current)) {
        centerMarkerRef.current.remove();
        centerMarkerRef.current = null;
      }
      if (crosshairRef.current && mapContainer.contains(crosshairRef.current)) {
        crosshairRef.current.remove();
        crosshairRef.current = null;
      }
      if (map && window.kakao && window.kakao.maps) {
        window.kakao.maps.event.removeListener(map, 'center_changed', handleCenterChanged);
      }
    };
  }, [map, isSelectingLocation]);

  // 위치 미리보기 지도 생성/업데이트
  useEffect(() => {
    if (!selectedSOSLocation || !showSOSModal || isSelectingLocation) {
      // 지도 제거
      if (locationPreviewMapRef.current) {
        locationPreviewMapRef.current.marker.setMap(null);
        locationPreviewMapRef.current.map = null;
        locationPreviewMapRef.current = null;
      }
      return;
    }

    const initPreviewMap = () => {
      if (!window.kakao || !window.kakao.maps) {
        setTimeout(initPreviewMap, 100);
        return;
      }

      const container = document.getElementById('location-preview-map');
      if (!container) {
        setTimeout(initPreviewMap, 100);
        return;
      }

      // 기존 지도 제거
      if (locationPreviewMapRef.current) {
        locationPreviewMapRef.current.marker.setMap(null);
        locationPreviewMapRef.current.map = null;
      }

      // 새 지도 생성
      const map = new window.kakao.maps.Map(container, {
        center: new window.kakao.maps.LatLng(selectedSOSLocation.lat, selectedSOSLocation.lng),
        level: 4
      });

      // 커스텀 핀 마커 생성 (메인 컬러, 가운데 원은 흰색, 가로 넓게)
      const markerEl = document.createElement('div');
      markerEl.innerHTML = `
        <div style="
          position: relative;
          width: 48px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg width="48" height="40" viewBox="0 0 48 40" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 8px rgba(0,0,0,0.3));">
            <path d="M24 0C18.477 0 14 4.477 14 10C14 17 24 40 24 40C24 40 34 17 34 10C34 4.477 29.523 0 24 0Z" fill="#00BCD4"/>
            <circle cx="24" cy="10" r="6" fill="white"/>
          </svg>
        </div>
      `;

      const marker = new window.kakao.maps.CustomOverlay({
        position: new window.kakao.maps.LatLng(selectedSOSLocation.lat, selectedSOSLocation.lng),
        content: markerEl,
        yAnchor: 1,
        xAnchor: 0.5,
        zIndex: 1001
      });

      marker.setMap(map);

      locationPreviewMapRef.current = { map, marker };
    };

    initPreviewMap();

    return () => {
      if (locationPreviewMapRef.current) {
        locationPreviewMapRef.current.marker.setMap(null);
        locationPreviewMapRef.current.map = null;
        locationPreviewMapRef.current = null;
      }
    };
  }, [selectedSOSLocation, showSOSModal, isSelectingLocation]);

  // 도움 요청 제출
  const handleSOSSubmit = () => {
    if (!selectedSOSLocation) {
      alert('위치를 선택해주세요.');
      return;
    }
    if (!sosQuestion.trim()) {
      alert('궁금한 내용을 입력해주세요.');
      return;
    }

    // 도움 요청 데이터 저장 (아직 저장하지 않음)
    const newSOSRequest = {
      id: `sos-${Date.now()}`,
      coordinates: selectedSOSLocation,
      question: sosQuestion.trim(),
      status: 'open',
      createdAt: new Date().toISOString(),
      userId: 'current-user' // TODO: 실제 사용자 ID로 교체
    };

    // 모달 닫고 광고 모달 표시
    setShowSOSModal(false);
    setPendingSOSRequest(newSOSRequest);
    setShowAdModal(true);
  };

  // 광고를 본 후 도움 요청 완료
  const handleAdComplete = () => {
    if (!pendingSOSRequest) return;

    try {
      // 기존 SOS 요청 로드
      const existingSOS = JSON.parse(localStorage.getItem('sosRequests_v1') || '[]');
      
      // 저장 (외부 서버에 저장된 것처럼 처리)
      const updatedSOS = [pendingSOSRequest, ...existingSOS];
      localStorage.setItem('sosRequests_v1', JSON.stringify(updatedSOS));

      // 질문 내용 요약 (속보형)
      const questionText = pendingSOSRequest.question || '';
      const questionSnippet = questionText.length > 35 
        ? questionText.substring(0, 35) + '...' 
        : questionText;

      // 위치 정보 가져오기 (좌표로부터 지역명 추출)
      const locationName = pendingSOSRequest.coordinates 
        ? getLocationByCoordinates(pendingSOSRequest.coordinates.lat, pendingSOSRequest.coordinates.lng)
        : '근처 지역';

      // 라이브저니 스타일 알림 생성 (속보형 + 개인화)
      // 속보형: 궁금증을 유발하는 텍스트 스니펫
      const notificationTitle = `[${locationName} 실시간 속보] 📢 "${questionSnippet}"`;
      
      // 개인화된 가치: 따뜻한 메시지 + 실시간성 강조
      const notificationMessage = `${locationName}에서 지금 상황을 물어보고 있어요. 실시간 정보를 공유해주시면 도움이 될 거예요! 🗺️`;

      // 외부 알림 시스템에 저장 (다른 사용자들에게 알림이 가는 것처럼)
      // 실제로는 localStorage에 저장되어 다른 사용자의 메인 화면에서 알림으로 표시됨
      addNotification({
        type: 'system',
        title: notificationTitle,
        message: notificationMessage,
        icon: 'location_on',
        iconBg: 'bg-blue-100 dark:bg-blue-900/20',
        iconColor: 'text-blue-500',
        link: '/map',
        data: { 
          sosRequest: pendingSOSRequest,
          type: 'sos_request'
        }
      });

      // 초기화
      setShowAdModal(false);
      setPendingSOSRequest(null);
      setSosQuestion('');
      setIsSelectingLocation(false);
      setSelectedSOSLocation(null);
      
      // 마커 제거
      if (sosMarkerRef.current) {
        sosMarkerRef.current.setMap(null);
        sosMarkerRef.current = null;
      }

      // 외부 시스템에서 알림이 전송된 것처럼 메시지 표시
      alert('도움 요청이 등록되었습니다.\n근처에 있는 분들에게 알림이 전송되었습니다.');
    } catch (error) {
      console.error('도움 요청 저장 실패:', error);
      alert('도움 요청 등록에 실패했습니다. 다시 시도해주세요.');
      setShowAdModal(false);
      setPendingSOSRequest(null);
    }
  };

  // 도움 요청 모달 닫기
  const handleSOSModalClose = () => {
    setShowSOSModal(false);
    setSosQuestion('');
    setIsSelectingLocation(false);
    setSelectedSOSLocation(null);
    
    // 중심 마커 제거
    if (centerMarkerRef.current) {
      centerMarkerRef.current.remove();
      centerMarkerRef.current = null;
    }
    
    // 표시선 제거
    if (crosshairRef.current) {
      crosshairRef.current.remove();
      crosshairRef.current = null;
    }
    
    // SOS 마커 제거
    if (sosMarkerRef.current) {
      sosMarkerRef.current.setMap(null);
      sosMarkerRef.current = null;
    }
    
    // 위치 미리보기 지도 제거
    if (locationPreviewMapRef.current) {
      locationPreviewMapRef.current.marker.setMap(null);
      locationPreviewMapRef.current.map = null;
      locationPreviewMapRef.current = null;
    }
  };

  // 지도에서 위치 선택하기 시작
  const handleStartLocationSelection = () => {
    setIsSelectingLocation(true);
    setShowSOSModal(false); // 모달 닫기
    
    // 기존 SOS 마커 제거 (중심 마커로 대체됨)
    if (sosMarkerRef.current) {
      sosMarkerRef.current.setMap(null);
      sosMarkerRef.current = null;
    }
  };

  const getLocationIcon = (locationName) => {
    if (!locationName) return 'location_on';
    if (locationName.includes('산') || locationName.includes('봉')) return 'landscape';
    if (locationName.includes('해') || locationName.includes('바다') || locationName.includes('해변')) return 'beach_access';
    if (locationName.includes('카페') || locationName.includes('커피')) return 'local_cafe';
    if (locationName.includes('맛집') || locationName.includes('식당')) return 'restaurant';
    return 'location_on';
  };

  return (
    <>
      <style>
        {`
          .sheet-scroll-container::-webkit-scrollbar {
            height: 6px;
          }
          .sheet-scroll-container::-webkit-scrollbar-track {
            background: transparent;
          }
          .sheet-scroll-container::-webkit-scrollbar-thumb {
            background: #d4d4d8;
            border-radius: 3px;
          }
          .sheet-scroll-container::-webkit-scrollbar-thumb:hover {
            background: #a1a1aa;
          }
        `}
      </style>
      <div className="phone-screen" style={{ 
        background: 'transparent',
        borderRadius: '32px',
        overflow: 'hidden',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}>
      {/* 지도 컨테이너 - 전체 화면에 지도가 보이도록 */}
      <main 
        ref={mapContainerRef}
        style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: '68px',
        overflow: 'hidden',
        zIndex: 1,
          pointerEvents: 'auto',
          width: '100%',
          height: '100%'
        }}
      >
        <div 
          ref={mapRef}
          style={{
            width: '100%',
            height: '100%',
            pointerEvents: 'auto',
            position: 'relative'
          }}
        />
      </main>

      {/* 상태바 영역 (시스템 UI 제거, 공간만 유지) */}
      <div style={{ 
        height: '20px',
        position: 'relative',
        zIndex: 10
      }} />

      {/* 검색바 - 투명 배경으로 지도가 보이도록 */}
      <div style={{
        padding: '16px',
        background: 'transparent',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        position: 'relative',
        zIndex: 10,
        pointerEvents: 'none'
      }}>
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '28px',
          padding: '12px 20px',
          gap: '12px',
          minHeight: '52px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
          pointerEvents: 'auto'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#666' }}>
            search
          </span>
          <input
            type="text"
            placeholder="지역 검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => navigate('/search')}
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: '16px',
              color: '#333',
              fontWeight: '400'
            }}
          />
        </div>
        <button
          onClick={() => {
            if (map) {
              updateVisiblePins(map);
            }
          }}
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '26px',
            border: 'none',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
            pointerEvents: 'auto'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#666' }}>
            refresh
          </span>
        </button>
      </div>

      {/* 도움 요청 버튼 - 검색창과 분리, 투명 배경, 지도 위에 오버레이 */}
      <div style={{
        padding: '8px 16px',
        background: 'transparent',
        display: 'flex',
        justifyContent: 'flex-start',
        position: 'relative',
        zIndex: 10,
        pointerEvents: 'none'
      }}>
        <button
          onClick={handleSOSRequest}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px 12px',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            transition: 'all 0.2s',
            width: 'fit-content',
            pointerEvents: 'auto'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 1)';
            e.currentTarget.style.transform = 'scale(1.02)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)';
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
          }}
        >
          <span style={{
            fontSize: '13px',
            fontWeight: '600',
            color: '#00BCD4'
          }}>
            지금 상황 알아보기
          </span>
        </button>
      </div>

      {/* 지도 컨트롤 버튼들 - 시트 상태에 따라 두 가지 고정 위치 */}
      <div style={{
          position: 'absolute',
          right: '16px', // 항상 오른쪽 고정
          bottom: isSheetHidden ? '120px' : `${68 + sheetHeight + 16}px`, // 시트 올라와 있을 때: 시트 오른쪽 상단 (시트 위쪽에 약간의 여유 공간), 시트 내려갔을 때: 오른쪽 하단
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          zIndex: 30,
          transition: 'all 0.3s ease-out',
          pointerEvents: 'auto'
        }}>
          <button
            onClick={handleZoomIn}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '20px',
              border: 'none',
              background: 'white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#333' }}>
              add
            </span>
          </button>
          <button
            onClick={handleZoomOut}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '20px',
              border: 'none',
              background: 'white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#333' }}>
              remove
            </span>
          </button>
          <button
            onClick={handleCenterLocation}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '20px',
              border: 'none',
              background: 'white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#00BCD4' }}>
              my_location
            </span>
          </button>
      </div>

      {/* 사진 다시 보기 버튼 - 시트가 숨겨졌을 때만 표시, 조금 위로 배치 */}
      {isSheetHidden && (
          <button
            onClick={handleShowSheet}
            style={{
              position: 'absolute',
              bottom: '120px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px 24px',
              background: 'white',
              borderRadius: '24px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              transition: 'all 0.2s',
              zIndex: 25
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateX(-50%) scale(1.05)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateX(-50%) scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#00BCD4' }}>
              photo_library
            </span>
            <span style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#333'
            }}>
              사진 다시 보기
            </span>
        </button>
      )}

      {/* 주변 장소 바텀 시트 - 항상 보임, 아래로 슬라이드 가능, 가벼운 스타일 */}
      {!isSelectingLocation && (
      <div
        ref={sheetRef}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: '68px',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          borderTopLeftRadius: '20px',
          borderTopRightRadius: '20px',
          transform: `translateY(${sheetOffset}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
          maxHeight: '40vh',
          zIndex: 20
        }}
      >
        <div
          ref={dragHandleRef}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          style={{
            padding: '12px 0',
            display: 'flex',
            justifyContent: 'center',
            cursor: 'grab',
            touchAction: 'none'
          }}
        >
          <div style={{
            width: '40px',
            height: '4px',
            backgroundColor: '#d4d4d8',
            borderRadius: '2px'
          }} />
        </div>

        <div style={{
          padding: '8px 16px 12px',
          borderBottom: '1px solid #f4f4f5'
        }}>
          <h1 style={{
            fontSize: '18px',
            fontWeight: 'bold',
            margin: 0
          }}>주변 장소</h1>
        </div>

        <div 
          className="sheet-scroll-container"
          style={{ 
            flex: 1,
            overflowX: 'auto',
            overflowY: 'hidden',
            padding: '16px 16px 24px 16px',
            display: 'flex',
            gap: '12px',
            minHeight: '110px',
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'thin',
            scrollbarColor: '#d4d4d8 transparent'
          }}>
          {visiblePins.length > 0 ? (
            visiblePins.map((pin, index) => (
              <div
                key={pin.id || index}
                onClick={() => {
                  // 지도를 해당 위치로 이동
                  if (map && pin.lat && pin.lng) {
                    const position = new window.kakao.maps.LatLng(pin.lat, pin.lng);
                    map.panTo(position);
                    map.setLevel(3); // 적절한 확대 레벨로 설정
                  }
                }}
                style={{
                  minWidth: '90px',
                  width: '90px',
                  flexShrink: 0,
                  borderRadius: '12px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  position: 'relative',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  background: '#f5f5f5',
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                }}
              >
                {pin.image && (
                  <img
                    src={pin.image}
                    alt={pin.title}
                    style={{
                      width: '100%',
                      height: '90px',
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
                <div style={{
                  padding: '6px',
                  background: 'white'
                }}>
                  <p style={{
                    margin: 0,
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#333',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {pin.title}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div style={{
              width: '100%',
              padding: '40px 20px',
              textAlign: 'center',
              color: '#999',
              fontSize: '14px'
            }}>
              표시할 장소가 없습니다
            </div>
          )}
        </div>
      </div>
      )}

      {/* 게시물 상세화면 모달 - 핸드폰 화면 안에서만 표시 */}
      {selectedPost && (
        <div
          onClick={() => setSelectedPost(null)}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: '68px',
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
                src={selectedPost.post.images?.[0] || selectedPost.post.imageUrl || selectedPost.post.image || selectedPost.post.thumbnail}
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
      )}

      {/* 위치 선택 모드 하단 안내 */}
      {isSelectingLocation && (
        <div style={{
          position: 'absolute',
          bottom: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1003,
          width: 'calc(100% - 32px)',
          maxWidth: '400px'
        }}>
          <div style={{
            background: 'white',
            padding: '16px 20px',
            borderRadius: '16px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <span style={{
              fontSize: '15px',
              fontWeight: '600',
              color: '#00BCD4',
              textAlign: 'center'
            }}>
              위치를 설정하세요
            </span>
            <button
              onClick={() => {
                setIsSelectingLocation(false);
                // 선택된 위치에 일반 마커 표시
                if (map && selectedSOSLocation) {
                  updateSOSMarker(map, selectedSOSLocation);
                }
                setShowSOSModal(true);
              }}
              style={{
                width: '100%',
                padding: '14px',
                background: '#00BCD4',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: '600',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#00ACC1';
                e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#00BCD4';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              완료
            </button>
          </div>
        </div>
      )}

      {/* 도움 요청 모달 */}
      {showSOSModal && !isSelectingLocation && (
        <>
        {/* 모달 배경 - 지도가 보이도록 반투명 */}
        <div
          onClick={handleSOSModalClose}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: '68px',
            background: 'rgba(0, 0, 0, 0.3)',
            zIndex: 1000,
            pointerEvents: 'auto'
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: '68px',
            zIndex: 1001,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            pointerEvents: 'none'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '24px',
              width: '100%',
              maxWidth: '400px',
              maxHeight: '70vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
              pointerEvents: 'auto'
            }}
          >
            {/* 헤더 */}
            <div style={{
              padding: '16px 20px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #f0f0f0'
            }}>
              <span style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#333'
              }}>
                도움 요청
              </span>
              <button
                onClick={handleSOSModalClose}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '14px',
                  border: 'none',
                  background: '#f5f5f5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#666' }}>
                  close
                </span>
              </button>
            </div>

            {/* 내용 */}
            <div style={{
              padding: '16px 20px',
              overflowY: 'auto',
              flex: 1
            }}>
              {/* 위치 선택 */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '10px'
                }}>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#333'
                  }}>
                    위치
                  </span>
                  {selectedSOSLocation && (
                    <span style={{
                      fontSize: '12px',
                      color: '#00BCD4',
                      fontWeight: '600'
                    }}>
                      선택됨
                    </span>
                  )}
                </div>
                
                {selectedSOSLocation && (
                  <div style={{
                    marginBottom: '10px',
                    padding: '0',
                    background: '#f0f9fa',
                    border: '1px solid #00BCD4',
                    borderRadius: '12px',
                    overflow: 'hidden'
                  }}>
                    <div
                      id="location-preview-map"
                      style={{
                        width: '100%',
                        height: '120px',
                        borderRadius: '12px'
                      }}
                    />
                  </div>
                )}
                
                <button
                  onClick={handleStartLocationSelection}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#f5f5f5',
                    border: '1px solid #e0e0e0',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#666',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#eeeeee';
                    e.currentTarget.style.borderColor = '#00BCD4';
                    e.currentTarget.style.color = '#00BCD4';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f5f5f5';
                    e.currentTarget.style.borderColor = '#e0e0e0';
                    e.currentTarget.style.color = '#666';
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    map
                  </span>
                  {selectedSOSLocation ? '위치 다시 선택하기' : '지도에서 위치 선택하기'}
                </button>
              </div>

              {/* 내용 입력 */}
              <div>
                <span style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#333',
                  display: 'block',
                  marginBottom: '10px'
                }}>
                  내용
                </span>
                <textarea
                  value={sosQuestion}
                  onChange={(e) => setSosQuestion(e.target.value)}
                  placeholder="무엇이 궁금하신가요?"
                  style={{
                    width: '100%',
                    minHeight: '80px',
                    padding: '12px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    outline: 'none',
                    lineHeight: '1.6',
                    background: '#fafafa'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#00BCD4';
                    e.target.style.background = 'white';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e0e0e0';
                    e.target.style.background = '#fafafa';
                  }}
                />
              </div>
            </div>

            {/* 하단 버튼 */}
            <div style={{
              padding: '12px 20px 16px',
              borderTop: '1px solid #f0f0f0',
              background: '#fafafa'
            }}>
              <button
                onClick={handleSOSSubmit}
                disabled={!selectedSOSLocation || !sosQuestion.trim()}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: selectedSOSLocation && sosQuestion.trim() ? '#00BCD4' : '#ddd',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: 'bold',
                  cursor: selectedSOSLocation && sosQuestion.trim() ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
                onMouseEnter={(e) => {
                  if (selectedSOSLocation && sosQuestion.trim()) {
                    e.currentTarget.style.background = '#00ACC1';
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedSOSLocation && sosQuestion.trim()) {
                    e.currentTarget.style.background = '#00BCD4';
                    e.currentTarget.style.transform = 'scale(1)';
                  }
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  send
                </span>
                요청하기
              </button>
            </div>
          </div>
        </div>
        </>
      )}

      {/* 광고 모달 */}
      {showAdModal && (
        <div
          onClick={() => {
            // 광고를 봐야 하므로 외부 클릭으로 닫히지 않도록
          }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: '68px',
            background: 'rgba(0, 0, 0, 0.7)',
            zIndex: 2000,
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
              borderRadius: '24px',
              width: '100%',
              maxWidth: '400px',
              maxHeight: '80vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
            }}
          >
            {/* 광고 헤더 */}
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #f0f0f0',
              textAlign: 'center'
            }}>
              <h2 style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#333'
              }}>
                광고를 시청해주세요
              </h2>
              <p style={{
                margin: '8px 0 0 0',
                fontSize: '14px',
                color: '#666'
              }}>
                광고를 보시면 도움 요청이 완료됩니다
              </p>
            </div>

            {/* 광고 영역 */}
            <div style={{
              padding: '20px',
              background: '#f5f5f5',
              minHeight: '200px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1
            }}>
              <div style={{
                width: '100%',
                height: '200px',
                background: 'linear-gradient(135deg, #00BCD4 0%, #0097A7 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '18px',
                fontWeight: '600'
              }}>
                광고 영역
                <br />
                <span style={{ fontSize: '14px', opacity: 0.9, marginTop: '8px', display: 'block' }}>
                  (실제 광고 서비스 연동 필요)
                </span>
              </div>
            </div>

            {/* 확인 버튼 */}
            <div style={{
              padding: '16px 20px 20px',
              borderTop: '1px solid #f0f0f0',
              background: '#fafafa'
            }}>
              <button
                onClick={handleAdComplete}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: '#00BCD4',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#00ACC1';
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#00BCD4';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                광고 시청 완료
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 하단 네비게이션 바 */}
      <BottomNavigation />
    </div>
    </>
  );
};

export default MapScreen;
