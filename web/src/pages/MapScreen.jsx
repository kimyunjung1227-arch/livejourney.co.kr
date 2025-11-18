import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';
import { getCoordinatesByLocation, searchRegions } from '../utils/regionLocationMapping';
import { filterRecentPosts } from '../utils/timeUtils';
import { toggleLike, isPostLiked } from '../utils/socialInteractions';
import { getTimeAgo } from '../utils/timeUtils';

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

const MapScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const pinsRef = useRef([]);
  
  const [allPins, setAllPins] = useState([]);
  const [visiblePins, setVisiblePins] = useState([]);
  const [mapLoading, setMapLoading] = useState(true);
  const [selectedPinId, setSelectedPinId] = useState(null);
  
  // 게시물 팝업
  const [showPostPopup, setShowPostPopup] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  
  // 팝업 상태를 ref로도 저장 (전역 함수에서 접근하기 위해)
  const popupStateRef = useRef({
    setShowPostPopup,
    setSelectedPost,
    setSelectedPinId,
    pinsRef,
    allPins: []
  });
  
  // ref 업데이트
  useEffect(() => {
    popupStateRef.current = {
      setShowPostPopup,
      setSelectedPost,
      setSelectedPinId,
      pinsRef,
      allPins: allPins
    };
  }, [allPins]);
  
  // 검색
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  
  // 하단 시트
  const [showSheet, setShowSheet] = useState(true);
  const sheetRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  
  // 사진 리스트 마우스 드래그
  const photoListRef = useRef(null);
  const [isPhotoListDragging, setIsPhotoListDragging] = useState(false);
  const [photoListStartX, setPhotoListStartX] = useState(0);
  const [photoListScrollLeft, setPhotoListScrollLeft] = useState(0);
  const [photoListDragDistance, setPhotoListDragDistance] = useState(0);
  const [isPhotoListMouseDown, setIsPhotoListMouseDown] = useState(false);
  
  // 초기화
  useEffect(() => {
    const init = () => {
      if (!window.kakao || !window.kakao.maps) {
        setTimeout(init, 100);
        return;
      }

      if (!mapRef.current) {
        setTimeout(init, 100);
        return;
      }

      try {
        // 이전 지도 상태가 있으면 복원, 없으면 현재 위치 또는 서울로 초기화
        const savedMapState = location.state?.mapState;
        
        if (savedMapState) {
          // 저장된 지도 상태로 복원
          const map = new window.kakao.maps.Map(mapRef.current, {
            center: new window.kakao.maps.LatLng(savedMapState.lat, savedMapState.lng),
            level: savedMapState.level
          });
          mapInstance.current = map;
          setMapLoading(false);
          
          // 시트 상태도 복원
          if (typeof savedMapState.showSheet !== 'undefined') {
            setShowSheet(savedMapState.showSheet);
          }
          
          loadAllData();
          
          // 상태 복원 후 location.state 정리 (다음 방문 시 영향 없도록)
          window.history.replaceState({}, document.title);
        } else if (navigator.geolocation) {
          // 현재 위치 가져오기
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              const map = new window.kakao.maps.Map(mapRef.current, {
                center: new window.kakao.maps.LatLng(latitude, longitude),
                level: 4
              });
              mapInstance.current = map;
              setMapLoading(false);
              
              // 내 위치 마커 표시
              const currentPos = new window.kakao.maps.LatLng(latitude, longitude);
              const markerContent = document.createElement('div');
              markerContent.innerHTML = `
                <div style="
                  position: relative;
                  width: 24px;
                  height: 24px;
                ">
                  <!-- 펄스 링 -->
                  <div style="
                    position: absolute;
                    top: -8px;
                    left: -8px;
                    width: 40px;
                    height: 40px;
                    background: rgba(255, 107, 53, 0.3);
                    border-radius: 50%;
                    animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
                  "></div>
                  <!-- 메인 핀 -->
                  <div style="
                    position: absolute;
                    width: 24px;
                    height: 24px;
                    background: linear-gradient(135deg, #ff6b35, #f7931e);
                    border: 3px solid white;
                    border-radius: 50%;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.4);
                  "></div>
                </div>
              `;
              
              // CSS 애니메이션 추가 (한 번만)
              if (!document.getElementById('myLocationPingStyle')) {
                const style = document.createElement('style');
                style.id = 'myLocationPingStyle';
                style.textContent = `
                  @keyframes ping {
                    75%, 100% {
                      transform: scale(2);
                      opacity: 0;
                    }
                  }
                `;
                document.head.appendChild(style);
              }
              
              const customOverlay = new window.kakao.maps.CustomOverlay({
                position: currentPos,
                content: markerContent,
                yAnchor: 0.5
              });
              
              customOverlay.setMap(map);
              window.myLocationMarker = customOverlay;
              
              loadAllData();
            },
            () => {
              const map = new window.kakao.maps.Map(mapRef.current, {
                center: new window.kakao.maps.LatLng(37.5665, 126.9780),
                level: 4
              });
              mapInstance.current = map;
              setMapLoading(false);
              loadAllData();
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
          );
        } else {
          const map = new window.kakao.maps.Map(mapRef.current, {
            center: new window.kakao.maps.LatLng(37.5665, 126.9780),
            level: 4
          });
          mapInstance.current = map;
          setMapLoading(false);
          loadAllData();
        }
      } catch (error) {
        console.error('지도 생성 실패:', error);
        setTimeout(init, 500);
      }
    };

    init();
  }, []);

  // 내 위치 마커 표시 함수
  const showMyLocationMarker = useCallback((latitude, longitude) => {
    if (!mapInstance.current) return;
    
    // 기존 마커 제거
    if (window.myLocationMarker) {
      window.myLocationMarker.setMap(null);
    }
    
    const currentPos = new window.kakao.maps.LatLng(latitude, longitude);
    
    const markerContent = document.createElement('div');
    markerContent.innerHTML = `
      <div style="
        position: relative;
        width: 24px;
        height: 24px;
      ">
        <!-- 펄스 링 -->
        <div style="
          position: absolute;
          top: -8px;
          left: -8px;
          width: 40px;
          height: 40px;
          background: rgba(255, 107, 53, 0.3);
          border-radius: 50%;
          animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
        "></div>
        <!-- 메인 핀 -->
        <div style="
          position: absolute;
          width: 24px;
          height: 24px;
          background: linear-gradient(135deg, #ff6b35, #f7931e);
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        "></div>
      </div>
    `;
    
    // CSS 애니메이션 추가 (한 번만)
    if (!document.getElementById('myLocationPingStyle')) {
      const style = document.createElement('style');
      style.id = 'myLocationPingStyle';
      style.textContent = `
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    const customOverlay = new window.kakao.maps.CustomOverlay({
      position: currentPos,
      content: markerContent,
      yAnchor: 0.5
    });
    
    customOverlay.setMap(mapInstance.current);
    
    // 전역 변수에 저장 (나중에 제거 가능하도록)
    window.myLocationMarker = customOverlay;
  }, []);

  // 1. 보이는 핀 업데이트 (제일 먼저!)
  const updateVisiblePins = useCallback(() => {
    if (!mapInstance.current || allPins.length === 0) {
      return;
    }

    const bounds = mapInstance.current.getBounds();
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();

    const visible = allPins.filter(p =>
      p.lat >= sw.getLat() && p.lat <= ne.getLat() &&
      p.lng >= sw.getLng() && p.lng <= ne.getLng()
    );

    setVisiblePins(visible);
  }, [allPins]);

  // 2. 핀 생성
  const createPins = useCallback((pins) => {
    if (!mapInstance.current) return;
    
    pinsRef.current.forEach(({ overlay }) => {
      if (overlay && overlay.setMap) {
        overlay.setMap(null);
      }
    });
    pinsRef.current = [];

    // 전역 핸들러 설정 (ref를 통해 최신 상태 접근)
    window.handleMapPinClick = (pinId) => {
      const state = popupStateRef.current;
      
      // allPins에서 핀 찾기 (ref를 통해 최신 데이터 접근)
      const pin = state.allPins.find(p => p.id === pinId);
      
      if (pin && mapInstance.current && state.setShowPostPopup && state.setSelectedPost) {
        // 선택된 핀 강조
        state.setSelectedPinId(pinId);
        
        // 모든 핀의 스타일 업데이트 (안전하게 처리)
        if (state.pinsRef && state.pinsRef.current && Array.isArray(state.pinsRef.current)) {
          state.pinsRef.current.forEach((pinRef) => {
            if (!pinRef || !pinRef.element) return;
            
            const { id, element } = pinRef;
            if (!element || !element.style) return;
            
            try {
              if (id === pinId) {
                // 선택된 핀: 크기 증가 + 주황색 테두리
                element.style.transform = 'scale(1.3)';
                element.style.borderWidth = '4px';
                element.style.borderColor = '#ff6b35';
                element.style.zIndex = '9999';
              } else {
                // 다른 핀: 기본 스타일
                element.style.transform = 'scale(1)';
                element.style.borderWidth = '3px';
                element.style.borderColor = 'white';
                element.style.zIndex = '1';
              }
            } catch (error) {
              console.warn('핀 스타일 업데이트 실패:', error);
            }
          });
        }
        
        // 팝업에 게시물 정보 표시
        state.setSelectedPost(pin.post);
        state.setShowPostPopup(true);
      }
    };

    pins.forEach((pin, i) => {
      const pos = new window.kakao.maps.LatLng(pin.lat, pin.lng);
      
      const el = document.createElement('div');
      el.innerHTML = `
        <button 
          class="pin-btn relative w-12 h-12 border-3 border-white shadow-lg rounded-md overflow-hidden hover:scale-110 transition-all duration-200 cursor-pointer" 
          style="z-index: ${i}" 
          onclick="window.handleMapPinClick('${pin.id}')"
        >
          <img class="w-full h-full object-cover" src="${pin.image}" alt="${pin.title}"/>
        </button>
      `;

      const overlay = new window.kakao.maps.CustomOverlay({
        position: pos,
        content: el,
        yAnchor: 1,
        zIndex: i
      });

      overlay.setMap(mapInstance.current);
      pinsRef.current.push({ id: pin.id, overlay, element: el.firstChild });
    });

  }, [navigate, updateVisiblePins]);

  // 3. 데이터 로드
  const loadAllData = useCallback(() => {
    let posts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');
    posts = filterRecentPosts(posts, 2);
    
    const pins = posts
      .map((p) => {
        const coords = p.coordinates || getCoordinatesByLocation(p.detailedLocation || p.location);
        if (!coords || !p.images?.[0]) return null;
        
        return {
          id: p.id,
          lat: coords.lat,
          lng: coords.lng,
          image: p.images[0],
          title: p.detailedLocation || p.location,
          categoryName: p.categoryName,
          post: p
        };
      })
      .filter(Boolean);

    setAllPins(pins);
    if (pins.length > 0 && mapInstance.current) {
      createPins(pins);
      // 지도가 완전히 렌더링된 후 visiblePins 업데이트 (하단 시트 동기화)
      setTimeout(() => updateVisiblePins(), 300);
    }
  }, [createPins, updateVisiblePins]);

  useEffect(() => {
    if (allPins.length > 0 && mapInstance.current) {
      const listener = window.kakao.maps.event.addListener(mapInstance.current, 'idle', updateVisiblePins);
      return () => window.kakao.maps.event.removeListener(mapInstance.current, 'idle', listener);
    }
  }, [allPins, updateVisiblePins]);

  // PostDetailScreen에서 돌아왔을 때 선택된 핀 강조
  useEffect(() => {
    if (location.state?.selectedPinId && pinsRef.current.length > 0) {
      const pinId = location.state.selectedPinId;
      setSelectedPinId(pinId);
      
      // 핀 강조 스타일 적용
      setTimeout(() => {
        pinsRef.current.forEach(({ id, element }) => {
          if (element) {
            if (id === pinId) {
              element.style.transform = 'scale(1.3)';
              element.style.borderWidth = '4px';
              element.style.borderColor = '#ff6b35';
              element.style.zIndex = '9999';
            } else {
              element.style.transform = 'scale(1)';
              element.style.borderWidth = '3px';
              element.style.borderColor = 'white';
              element.style.zIndex = '1';
            }
          }
        });
      }, 500);
    }
  }, [location.state]);

  // 한글 초성 추출
  const getChosung = useCallback((str) => {
    const CHOSUNG = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
    let result = '';
    
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i) - 44032;
      if (code > -1 && code < 11172) {
        result += CHOSUNG[Math.floor(code / 588)];
      } else {
        result += str.charAt(i);
      }
    }
    return result;
  }, []);

  // 초성 매칭
  const matchChosung = useCallback((text, search) => {
    const textChosung = getChosung(text);
    const searchChosung = getChosung(search);
    return textChosung.includes(searchChosung) || text.includes(search);
  }, [getChosung]);

  // 검색
  const handleSearchChange = (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    
    if (q.trim()) {
      // searchRegions가 이미 초성 검색 지원
      const results = searchRegions(q);
      setSearchResults(results.slice(0, 10));
    } else {
      setSearchResults([]);
    }
  };

  const selectRegion = useCallback((region) => {
    const coords = getCoordinatesByLocation(region);
    if (coords && mapInstance.current) {
      mapInstance.current.setCenter(new window.kakao.maps.LatLng(coords.lat, coords.lng));
      mapInstance.current.setLevel(4);
    }
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  }, []);

  // 새로고침
  const refresh = () => {
    pinsRef.current.forEach(({ overlay }) => overlay.setMap(null));
    pinsRef.current = [];
    loadAllData();
  };

  // 더보기 화면에서 선택된 핀으로 이동
  useEffect(() => {
    if (location.state?.selectedPin && mapInstance.current) {
      const { lat, lng, id } = location.state.selectedPin;
      const targetPos = new window.kakao.maps.LatLng(lat, lng);
      mapInstance.current.setCenter(targetPos);
      mapInstance.current.setLevel(2);
      setSelectedPinId(id);
      setShowSheet(true);
      setTimeout(() => updateVisiblePins(), 300);
      window.history.replaceState({}, document.title);
    }
  }, [location.state, updateVisiblePins]);

  // 사진 리스트 마우스 드래그 시작
  const handlePhotoListMouseDown = (e) => {
    if (!photoListRef.current) return;
    setIsPhotoListMouseDown(true);
    setIsPhotoListDragging(false);
    setPhotoListDragDistance(0);
    setPhotoListStartX(e.pageX - photoListRef.current.offsetLeft);
    setPhotoListScrollLeft(photoListRef.current.scrollLeft);
    photoListRef.current.style.cursor = 'grab';
  };

  // 사진 리스트 마우스 드래그 이동
  const handlePhotoListMouseMove = (e) => {
    // 마우스 다운 상태가 아니면 무시
    if (!isPhotoListMouseDown || !photoListRef.current) return;
    
    const x = e.pageX - photoListRef.current.offsetLeft;
    const distance = Math.abs(x - photoListStartX);
    setPhotoListDragDistance(distance);
    
    if (distance > 5) {
      // 5px 이상 움직이면 드래그로 간주
      setIsPhotoListDragging(true);
      e.preventDefault();
      const walk = (x - photoListStartX) * 2; // 스크롤 속도
      photoListRef.current.scrollLeft = photoListScrollLeft - walk;
      photoListRef.current.style.cursor = 'grabbing';
    }
  };

  // 사진 리스트 마우스 드래그 종료
  const handlePhotoListMouseUp = () => {
    setIsPhotoListMouseDown(false);
    setIsPhotoListDragging(false);
    setPhotoListDragDistance(0);
    if (photoListRef.current) {
      photoListRef.current.style.cursor = 'grab';
    }
  };

  // 시트 드래그
  const sheetDragStart = useCallback((e) => {
    setIsDragging(true);
    const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
    setDragStart(clientY);
  }, []);

  const sheetDragMove = useCallback((e) => {
    if (!isDragging || !sheetRef.current) return;
    
    const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
    const deltaY = clientY - dragStart;
    
    if (deltaY >= 0) {
      sheetRef.current.style.transform = `translateY(${deltaY}px)`;
      sheetRef.current.style.transition = 'none';
    }
  }, [isDragging, dragStart]);

  const sheetDragEnd = useCallback(() => {
    if (!sheetRef.current) return;
    
    const transform = sheetRef.current.style.transform;
    const translateY = transform ? parseInt(transform.match(/translateY\((.+)px\)/)?.[1] || 0) : 0;
    
    if (translateY > 80) {
      sheetRef.current.style.transform = 'translateY(100%)';
      sheetRef.current.style.transition = 'transform 0.3s ease';
      setTimeout(() => setShowSheet(false), 300);
    } else {
      sheetRef.current.style.transform = 'translateY(0)';
      sheetRef.current.style.transition = 'transform 0.3s ease';
    }
    
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    
    const handleMove = (e) => sheetDragMove(e);
    const handleUp = () => sheetDragEnd();
    
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleUp);
    
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [isDragging, sheetDragMove, sheetDragEnd]);

  return (
    <div 
      style={{ 
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        backgroundColor: '#e4e4e7',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)'
      }}
    >
      {/* 지도 영역 - 전체 화면 */}
      <div 
        ref={mapRef} 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0
        }}
      />

      {/* 지도 로딩 */}
      {mapLoading && (
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50
        }}>
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-lg font-semibold">지도 로딩 중...</p>
          </div>
        </div>
      )}

      {/* 상단 - 검색바 + 새로고침 */}
      <div style={{
        position: 'absolute',
        top: 'env(safe-area-inset-top, 0px)',
        left: 0,
        right: 0,
        zIndex: 40,
        padding: '16px'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => setShowSearch(true)} 
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '12px 16px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              border: 'none'
            }}
          >
            <span className="material-symbols-outlined text-zinc-500">search</span>
            <span className="text-zinc-500 text-sm">지역 검색</span>
          </button>
          <button 
            onClick={refresh} 
            style={{
              width: '48px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              border: 'none'
            }}
          >
            <span className="material-symbols-outlined">refresh</span>
          </button>
        </div>
      </div>

      {/* 우측 컨트롤 */}
      <div style={{
        position: 'absolute',
        right: '16px',
        bottom: showSheet ? '320px' : '140px',
        zIndex: 40,
        transition: 'bottom 0.3s'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <button 
              onClick={() => mapInstance.current?.setLevel(mapInstance.current.getLevel() - 1)} 
              style={{
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                backgroundColor: 'transparent'
              }}
            >
              <span className="material-symbols-outlined">add</span>
            </button>
            <div style={{ height: '1px', backgroundColor: '#d4d4d8' }} />
            <button 
              onClick={() => mapInstance.current?.setLevel(mapInstance.current.getLevel() + 1)} 
              style={{
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                backgroundColor: 'transparent'
              }}
            >
              <span className="material-symbols-outlined">remove</span>
            </button>
          </div>
          <button 
            onClick={() => {
              if (!navigator.geolocation) {
                alert('위치 서비스를 사용할 수 없습니다.');
                return;
              }
              
              navigator.geolocation.getCurrentPosition(
                (position) => {
                  const { latitude, longitude } = position.coords;
                  
                  if (mapInstance.current) {
                    const currentPos = new window.kakao.maps.LatLng(latitude, longitude);
                    mapInstance.current.setCenter(currentPos);
                    mapInstance.current.setLevel(3);
                    
                    // 내 위치 마커 표시
                    showMyLocationMarker(latitude, longitude);
                  }
                },
                (error) => {
                  console.error('위치 가져오기 실패:', error);
                  
                  let errorMessage = '위치를 가져올 수 없습니다.';
                  
                  switch (error.code) {
                    case error.PERMISSION_DENIED:
                      errorMessage = '위치 권한이 거부되었습니다.\n설정에서 위치 권한을 허용해주세요.';
                      break;
                    case error.POSITION_UNAVAILABLE:
                      errorMessage = '위치 정보를 사용할 수 없습니다.';
                      break;
                    case error.TIMEOUT:
                      errorMessage = '위치 요청 시간이 초과되었습니다.';
                      break;
                  }
                  
                  alert(errorMessage);
                },
                {
                  enableHighAccuracy: true, // 높은 정확도
                  timeout: 10000, // 10초 타임아웃
                  maximumAge: 0 // 캐시 사용 안 함
                }
              );
            }}
            style={{
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              border: 'none'
            }}
          >
            <span className="material-symbols-outlined">my_location</span>
          </button>
        </div>
      </div>

      {/* 시트 열기 버튼 */}
      {!showSheet && (
        <div style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: '100px',
          zIndex: 40,
          display: 'flex',
          justifyContent: 'center'
        }}>
          <button 
            onClick={() => setShowSheet(true)} 
            className="bg-primary text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-2"
          >
            <span className="material-symbols-outlined">photo_library</span>
            <span className="font-semibold">사진 다시 보기</span>
          </button>
        </div>
      )}

      {/* 하단 시트 - 네비게이션 바로 위 */}
      {showSheet && (
        <div 
          ref={sheetRef}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 'calc(68px + env(safe-area-inset-bottom, 0px))',
            height: '240px',
            backgroundColor: 'white',
            borderTopLeftRadius: '24px',
            borderTopRightRadius: '24px',
            boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
            zIndex: 40,
            display: 'flex',
            flexDirection: 'column',
            paddingBottom: '12px'
          }}
        >
          {/* 드래그 핸들 */}
          <div 
            onPointerDown={sheetDragStart}
            onTouchStart={sheetDragStart}
            style={{
              padding: '16px',
              cursor: 'grab',
              touchAction: 'none',
              userSelect: 'none'
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '12px'
            }}>
              <div style={{
                width: '64px',
                height: '6px',
                backgroundColor: '#d4d4d8',
                borderRadius: '9999px'
              }} />
            </div>
            
            <h3 style={{
              fontSize: '16px',
              fontWeight: 'bold',
              margin: 0
            }}>주변 장소</h3>
          </div>

          {/* 사진 리스트 - 스크롤 가능 */}
          {visiblePins.length === 0 ? (
            <div style={{ 
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 16px 40px 16px'
            }}>
              <div style={{
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px'
              }}>
                <svg width="50" height="60" viewBox="0 0 50 60" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: '8px' }}>
                  {/* 하단 그림자 타원 */}
                  <ellipse cx="25" cy="56" rx="8" ry="2.5" fill="#d4d4d8" opacity="0.3"/>
                  {/* 핀 외곽선 (역 물방울 모양) */}
                  <path 
                    d="M 25 5 
                       C 15 5, 8 12, 8 22 
                       C 8 30, 15 40, 25 52
                       C 35 40, 42 30, 42 22
                       C 42 12, 35 5, 25 5 Z" 
                    fill="none"
                    stroke="#a1a1aa" 
                    strokeWidth="2.5"
                  />
                  {/* 내부 원 */}
                  <circle cx="25" cy="22" r="6" fill="none" stroke="#a1a1aa" strokeWidth="2.5"/>
                </svg>
                <p style={{
                  fontSize: '13px',
                  color: '#71717a',
                  fontWeight: '600',
                  margin: 0
                }}>이 지역에 사진이 없어요</p>
              </div>
            </div>
          ) : (
            <div style={{ 
              padding: '0 16px 16px 16px',
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              minHeight: 0
            }}>
              <div 
                ref={photoListRef}
                onMouseDown={handlePhotoListMouseDown}
                onMouseMove={handlePhotoListMouseMove}
                onMouseUp={handlePhotoListMouseUp}
                onMouseLeave={handlePhotoListMouseUp}
                style={{
                  display: 'flex',
                  gap: '12px',
                  overflowX: 'auto',
                  paddingTop: '4px',
                  paddingBottom: '16px',
                  scrollSnapType: 'x mandatory',
                  scrollPaddingLeft: '16px',
                  WebkitOverflowScrolling: 'touch',
                  cursor: 'grab',
                  userSelect: 'none'
                }}
                className="hide-scrollbar"
              >
                {visiblePins.map((pin) => (
                  <button 
                    key={pin.id}
                    onClick={(e) => {
                      // 드래그가 아닌 경우에만 클릭 처리
                      if (photoListDragDistance > 5 || isPhotoListDragging) {
                        e.preventDefault();
                        e.stopPropagation();
                        return;
                      }
                      
                      e.preventDefault();
                      e.stopPropagation();
                      
                      // 선택된 핀 강조만 수행 (지도 이동 없음)
                      setSelectedPinId(pin.id);
                      
                      // 지도에 있는 핀 강조 표시
                      const highlightPin = () => {
                        if (!pinsRef.current || !Array.isArray(pinsRef.current)) {
                          console.warn('pinsRef.current가 없거나 배열이 아님');
                          return;
                        }
                        
                        console.log('🔵 핀 강조 시작, 총 핀 개수:', pinsRef.current.length);
                        console.log('🔵 찾을 핀 ID:', pin.id);
                        
                        let found = false;
                        pinsRef.current.forEach((pinRef, index) => {
                          if (!pinRef) {
                            console.warn(`핀 ${index}: pinRef가 null`);
                            return;
                          }
                          
                          const { id, element } = pinRef;
                          console.log(`핀 ${index}: id=${id}, element=`, element);
                          
                          if (!element) {
                            console.warn(`핀 ${index}: element가 없음`);
                            return;
                          }
                          
                          if (!element.style) {
                            console.warn(`핀 ${index}: element.style가 없음`);
                            return;
                          }
                          
                          try {
                            if (id === pin.id) {
                              found = true;
                              console.log('🔵 핀 찾음! 강조 적용:', id);
                              
                              // 선택된 핀: 크기 증가 + 주황색 테두리 강조
                              element.style.transform = 'scale(1.5)';
                              element.style.borderWidth = '4px';
                              element.style.borderColor = '#ff6b35';
                              element.style.zIndex = '9999';
                              element.style.transition = 'all 0.3s ease';
                              element.style.boxShadow = '0 0 0 4px rgba(255, 107, 53, 0.3), 0 4px 12px rgba(255, 107, 53, 0.4)';
                              
                              // 버튼 내부 이미지도 확인
                              const img = element.querySelector('img');
                              if (img) {
                                img.style.transition = 'all 0.3s ease';
                              }
                            } else {
                              // 다른 핀: 기본 스타일
                              element.style.transform = 'scale(1)';
                              element.style.borderWidth = '3px';
                              element.style.borderColor = 'white';
                              element.style.zIndex = '1';
                              element.style.boxShadow = 'none';
                            }
                          } catch (error) {
                            console.error(`핀 ${index} 스타일 업데이트 실패:`, error);
                          }
                        });
                        
                        if (!found) {
                          console.warn('🔴 핀을 찾을 수 없음:', pin.id);
                        }
                      };
                      
                      // 즉시 실행하고, 약간의 지연 후에도 다시 시도
                      highlightPin();
                      setTimeout(highlightPin, 100);
                      setTimeout(highlightPin, 300);
                    }}
                    style={{
                      flexShrink: 0,
                      border: 'none',
                      background: 'none',
                      padding: 0,
                      scrollSnapAlign: 'start',
                      scrollSnapStop: 'always',
                      pointerEvents: isPhotoListDragging ? 'none' : 'auto'
                    }}
                  >
                    <div style={{ width: '96px', position: 'relative' }}>
                      <img 
                        src={pin.image} 
                        alt={pin.title} 
                        style={{
                          width: '100%',
                          aspectRatio: '1',
                          borderRadius: '12px',
                          objectFit: 'cover',
                          boxShadow: selectedPinId === pin.id 
                            ? '0 0 0 3px #ff6b35, 0 4px 12px rgba(255, 107, 53, 0.4)' 
                            : '0 2px 8px rgba(0,0,0,0.1)',
                          transform: selectedPinId === pin.id ? 'scale(1.05)' : 'scale(1)',
                          transition: 'all 0.3s ease'
                        }}
                      />
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
                        borderRadius: '12px'
                      }} />
                      
                      {/* 좌측상단: 카테고리 아이콘 */}
                      {pin.post?.categoryName && (
                        <div style={{ position: 'absolute', top: '8px', left: '8px', zIndex: 1 }}>
                          <span style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            width: '32px', 
                            height: '32px', 
                            fontSize: '18px',
                            filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.4))',
                            background: 'transparent'
                          }}>
                            {pin.post.categoryName === '개화 상황' && '🌸'}
                            {pin.post.categoryName === '맛집 정보' && '🍜'}
                            {(!pin.post.categoryName || !['개화 상황', '맛집 정보'].includes(pin.post.categoryName)) && '🏞️'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div style={{
                      width: '96px',
                      marginTop: '6px',
                      marginBottom: '8px'
                    }}>
                      <p style={{
                        fontSize: '12px',
                        fontWeight: '600',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color: '#18181b',
                        margin: 0,
                        lineHeight: '1.3'
                      }}>{pin.title}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 검색 모달 */}
      {showSearch && (
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.3)',
          zIndex: 50
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            width: '100%',
            backgroundColor: 'white',
            borderBottomLeftRadius: '16px',
            borderBottomRightRadius: '16px',
            maxHeight: '75vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              padding: '16px',
              borderBottom: '1px solid #e4e4e7'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px'
              }}>
                <h2 style={{
                  fontSize: '18px',
                  fontWeight: 'bold'
                }}>지역 검색</h2>
                <button 
                  onClick={() => setShowSearch(false)} 
                  style={{
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '9999px',
                    backgroundColor: '#e4e4e7',
                    border: 'none'
                  }}
                >
                  <span className="material-symbols-outlined text-zinc-600">close</span>
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <span 
                  className="material-symbols-outlined" 
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#71717a'
                  }}
                >search</span>
                <input 
                  type="text" 
                  value={searchQuery} 
                  onChange={handleSearchChange} 
                  style={{
                    width: '100%',
                    borderRadius: '9999px',
                    backgroundColor: '#f4f4f5',
                    padding: '12px 16px 12px 40px',
                    border: 'none'
                  }}
                  placeholder="지역 검색 (예: ㄱ, ㅅ, 서울, 부산)" 
                  autoFocus 
                />
              </div>
            </div>

            <div style={{
              padding: '16px',
              overflowY: 'auto'
            }}>
              {searchQuery && searchResults.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {searchResults.slice(0, 8).map((r, i) => (
                    <button 
                      key={i} 
                      onClick={() => selectRegion(r)} 
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        borderRadius: '8px',
                        backgroundColor: '#f4f4f5',
                        border: 'none'
                      }}
                    >
                      <span className="material-symbols-outlined text-primary">location_on</span>
                      <span style={{ fontWeight: '600' }}>{r}</span>
                    </button>
                  ))}
                </div>
              ) : searchQuery ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '48px 0'
                }}>
                  <span className="material-symbols-outlined text-5xl text-zinc-300 mb-3">search_off</span>
                  <p style={{ color: '#71717a', fontSize: '15px', fontWeight: '600' }}>"{searchQuery}" 검색 결과가 없어요</p>
                  <p style={{ color: '#a1a1aa', fontSize: '13px', marginTop: '8px' }}>다른 지역명을 입력해보세요</p>
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '48px 0'
                }}>
                  <span className="material-symbols-outlined text-5xl text-zinc-300 mb-3">travel_explore</span>
                  <p style={{ color: '#71717a', fontSize: '15px', fontWeight: '600', marginBottom: '8px' }}>지역을 검색하세요</p>
                  <div style={{ textAlign: 'center', color: '#a1a1aa', fontSize: '13px' }}>
                    <p>💡 초성 검색 가능</p>
                    <p style={{ marginTop: '4px' }}>예: ㄱ → 강릉, 경주</p>
                    <p style={{ marginTop: '4px' }}>예: ㅅ → 서울, 수원</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 게시물 상세 팝업 - 모바일 프레임 안에서만 표시 */}
      {showPostPopup && selectedPost && (
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => {
            setShowPostPopup(false);
            setSelectedPost(null);
          }}
        >
          <div 
            style={{
              backgroundColor: 'white',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '500px',
              maxHeight: `calc(100% - env(safe-area-inset-top, 0px) - 80px)`,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px',
              borderBottom: '1px solid #e4e4e7'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 'bold',
                margin: 0
              }}>사진 정보</h3>
              <button
                onClick={() => {
                  setShowPostPopup(false);
                  setSelectedPost(null);
                }}
                style={{
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  backgroundColor: '#f4f4f5',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
              </button>
            </div>

            {/* 스크롤 가능한 컨텐츠 */}
            <div style={{
              overflowY: 'auto',
              flex: 1,
              padding: '16px'
            }}>
              {/* 이미지/동영상 */}
              <div style={{
                width: '100%',
                aspectRatio: '4/3',
                borderRadius: '12px',
                overflow: 'hidden',
                marginBottom: '16px',
                backgroundColor: '#f4f4f5'
              }}>
                {selectedPost.videos && selectedPost.videos.length > 0 ? (
                  <video
                    src={selectedPost.videos[0]}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    autoPlay
                    loop
                    muted
                    playsInline
                    controls
                  />
                ) : (
                  <img
                    src={selectedPost.images?.[0] || selectedPost.image}
                    alt={selectedPost.location}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                )}
              </div>

              {/* 작성자 정보 */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#e4e4e7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#71717a' }}>person</span>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    margin: 0,
                    marginBottom: '4px'
                  }}>
                    {selectedPost.user || selectedPost.userId || '여행자'}
                  </p>
                  {selectedPost.categoryName && (
                    <p style={{
                      fontSize: '12px',
                      color: '#71717a',
                      margin: 0
                    }}>
                      {selectedPost.categoryName}
                    </p>
                  )}
                </div>
              </div>

              {/* 위치 정보 */}
              <div style={{
                marginBottom: '16px',
                padding: '12px',
                backgroundColor: '#f4f4f5',
                borderRadius: '12px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px'
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#ff6b35' }}>location_on</span>
                  <p style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    margin: 0
                  }}>
                    {selectedPost.detailedLocation || selectedPost.placeName || selectedPost.location || '여행지'}
                  </p>
                </div>
                {selectedPost.detailedLocation && selectedPost.detailedLocation !== selectedPost.location && (
                  <p style={{
                    fontSize: '14px',
                    color: '#71717a',
                    margin: '4px 0 0 28px'
                  }}>
                    {selectedPost.location}
                  </p>
                )}
                {selectedPost.timeLabel && (
                  <p style={{
                    fontSize: '12px',
                    color: '#a1a1aa',
                    margin: '4px 0 0 28px'
                  }}>
                    {selectedPost.timeLabel}
                  </p>
                )}
              </div>

              {/* 태그 */}
              {(selectedPost.tags && selectedPost.tags.length > 0) || (selectedPost.aiLabels && selectedPost.aiLabels.length > 0) ? (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px'
                  }}>
                    {(selectedPost.tags || []).map((tag, index) => {
                      const tagText = typeof tag === 'string' ? tag.replace('#', '') : tag.name || '태그';
                      const koreanTag = tagTranslations[tagText.toLowerCase()] || tagText;
                      return (
                        <span
                          key={index}
                          style={{
                            fontSize: '12px',
                            fontWeight: '500',
                            color: '#ff6b35',
                            backgroundColor: '#fff5f0',
                            padding: '6px 12px',
                            borderRadius: '20px'
                          }}
                        >
                          #{koreanTag}
                        </span>
                      );
                    })}
                    {(selectedPost.aiLabels || []).map((label, index) => {
                      // label이 문자열이 아닐 수 있으므로 안전하게 처리
                      const labelText = typeof label === 'string' ? label : (label?.name || label?.label || String(label || ''));
                      const koreanLabel = labelText && typeof labelText === 'string' 
                        ? (tagTranslations[labelText.toLowerCase()] || labelText)
                        : String(labelText || '');
                      return (
                        <span
                          key={`ai-${index}`}
                          style={{
                            fontSize: '12px',
                            fontWeight: '500',
                            color: '#ff6b35',
                            backgroundColor: '#fff5f0',
                            padding: '6px 12px',
                            borderRadius: '20px'
                          }}
                        >
                          #{koreanLabel}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {/* 내용 */}
              {selectedPost.note && (
                <div style={{
                  marginBottom: '16px',
                  padding: '12px',
                  backgroundColor: '#fafafa',
                  borderRadius: '12px'
                }}>
                  <p style={{
                    fontSize: '14px',
                    lineHeight: '1.6',
                    color: '#18181b',
                    margin: 0,
                    whiteSpace: 'pre-wrap'
                  }}>
                    {selectedPost.note}
                  </p>
                </div>
              )}

              {/* 좋아요/댓글 */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '24px',
                padding: '12px 0',
                borderTop: '1px solid #e4e4e7',
                borderBottom: '1px solid #e4e4e7'
              }}>
                <button
                  onClick={() => {
                    if (!selectedPost) return;
                    const result = toggleLike(selectedPost.id);
                    setSelectedPost({
                      ...selectedPost,
                      likes: result.newCount
                    });
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                >
                  <span className={`material-symbols-outlined ${isPostLiked(selectedPost.id) ? 'text-red-500 fill' : 'text-gray-600'}`} style={{ fontSize: '24px' }}>
                    favorite
                  </span>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#18181b'
                  }}>
                    {selectedPost.likes || selectedPost.likeCount || 0}
                  </span>
                </button>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#71717a' }}>comment</span>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#18181b'
                  }}>
                    {(selectedPost.comments || []).length + (selectedPost.qnaList || []).length}
                  </span>
                </div>
              </div>

              {/* 상세 보기 버튼 */}
              <button
                onClick={() => {
                  setShowPostPopup(false);
                  navigate(`/post/${selectedPost.id}`, {
                    state: {
                      post: selectedPost,
                      fromMap: true,
                      selectedPinId: selectedPinId,
                      allPins: allPins,
                      mapState: mapInstance.current ? {
                        lat: mapInstance.current.getCenter().getLat(),
                        lng: mapInstance.current.getCenter().getLng(),
                        level: mapInstance.current.getLevel(),
                        showSheet: showSheet
                      } : null
                    }
                  });
                }}
                style={{
                  width: '100%',
                  marginTop: '16px',
                  padding: '14px',
                  backgroundColor: '#ff6b35',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                상세 보기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 네비게이션 바 - 최하단 고정 */}
      <div style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 50
      }}>
        <BottomNavigation />
      </div>
    </div>
  );
};

export default MapScreen;

