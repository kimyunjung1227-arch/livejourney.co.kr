import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';
import { getCoordinatesByLocation, searchRegions } from '../utils/regionLocationMapping';
import { seedMockData } from '../utils/mockUploadData';

const MapScreen = () => {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const pinsRef = useRef([]); // { id, overlay, element } 저장
  
  const [allPins, setAllPins] = useState([]);
  const [visiblePins, setVisiblePins] = useState([]);
  const [selectedPinId, setSelectedPinId] = useState(null);
  const [detailPost, setDetailPost] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  
  // 검색
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  
  // 하단 시트
  const [showSheet, setShowSheet] = useState(true);
  const [showPhotoList, setShowPhotoList] = useState(false); // 전체 사진 목록 화면
  const sheetRef = useRef(null);
  const dragHandleRef = useRef(null);
  const [dragY, setDragY] = useState(0);
  const [dragStart, setDragStart] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  
  // 관성 스크롤용 ref
  const velocityRef = useRef(0);
  const lastYRef = useRef(0);
  const animationRef = useRef(null);
  
  // 사진 스크롤
  const scrollRef = useRef(null);
  const [scrollDrag, setScrollDrag] = useState(false);
  const [scrollStart, setScrollStart] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [hasMoved, setHasMoved] = useState(false);


  // 초기화
  useEffect(() => {
    console.log('🗺️ 지도 초기화 시작');
    
    const init = () => {
      // Kakao Map API 확인
      if (!window.kakao) {
        console.log('⏳ Kakao 객체 로딩 대기 중...');
        setTimeout(init, 100);
        return;
      }

      // Maps 객체 확인
      if (!window.kakao.maps) {
        console.log('⏳ Kakao Maps 로딩 대기 중...');
        setTimeout(init, 100);
        return;
      }

      // 맵 컨테이너 확인
      if (!mapRef.current) {
        console.log('⏳ 맵 컨테이너 대기 중...');
        setTimeout(init, 100);
        return;
      }

      // 지도 로드
      window.kakao.maps.load(() => {
        console.log('🎨 지도 생성 중...');
        
        try {
          const map = new window.kakao.maps.Map(mapRef.current, {
            center: new window.kakao.maps.LatLng(37.5665, 126.9780),
            level: 4
          });
          
          mapInstance.current = map;
          
          console.log('✅ 지도 생성 완료!');
          
          // 데이터 로드 - 직접 실행
          const posts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');
          
          // Mock 데이터가 없으면 즉시 생성!
          if (posts.length === 0) {
            console.log('⚠️ Mock 데이터가 없습니다! 즉시 생성...');
            seedMockData(1000);
          }
          
          // 다시 로드
          loadAllData();
        } catch (error) {
          console.error('❌ 지도 생성 실패:', error);
          setTimeout(init, 500); // 실패 시 재시도
        }
      });
    };

    init();
  }, []); // 빈 배열로 한 번만 실행

  // 데이터 로드
  const loadAllData = useCallback(() => {
    let posts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');
    
    // Mock 데이터가 없거나 적으면 1000개까지 추가 생성!
    if (posts.length < 1000) {
      console.log(`⚠️ Mock 데이터 부족! 현재: ${posts.length}개, 목표: 1000개`);
      const needCount = 1000 - posts.length;
      seedMockData(needCount);
      posts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');
      console.log(`✅ ${needCount}개 추가 생성 완료! 총 ${posts.length}개`);
    }
    
    console.log(`📊 ${posts.length}개 게시물 로드`);

    // 좌표가 있는 게시물만 핀으로 변환 (지역별 실제 위치!)
    const pins = posts
      .map((p) => {
        const coords = p.coordinates || getCoordinatesByLocation(p.detailedLocation || p.location);
        
        // 좌표가 없으면 핀 생성 안 함
        if (!coords) {
          return null;
        }
        
        const image = p.images?.[0] || p.image;
        
        // 이미지가 없으면 핀 생성 안 함
        if (!image) {
          return null;
        }
        
        return {
          id: p.id,
          lat: coords.lat,
          lng: coords.lng,
          image: image,
          title: p.detailedLocation || p.location,
          category: p.categoryName,
          categoryName: p.categoryName,
          location: p.location, // 지역명 추가
          post: p // 전체 게시물 데이터 포함
        };
      })
      .filter(Boolean); // null 제거

    console.log(`✅ ${pins.length}개 핀 데이터 준비 완료`);
    setAllPins(pins);
    
    // 최근 검색
    const s = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    setRecentSearches(s.slice(0, 5));
  }, []);

  // 핀 생성 (한 번만)
  const createPins = useCallback((pins) => {
    if (!mapInstance.current || pinsRef.current.length > 0) return;

    console.log(`🎨 핀 생성 시작: ${pins.length}개`);

    // window에 핀 클릭 함수 등록 (DOM에서 접근 가능하도록)
    window.handleMapPinClick = (pinId) => {
      console.log('🖱️ 핀 클릭! ID:', pinId);
      
      // 게시물 찾기
      const posts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');
      const foundPost = posts.find(p => p.id === pinId);
      
      if (foundPost) {
        console.log('✅ 게시물 찾음:', foundPost.location);
        
        // 핀 위치로 지도 이동
        const pin = pins.find(p => p.id === pinId);
        if (pin && mapInstance.current) {
          mapInstance.current.setCenter(new window.kakao.maps.LatLng(pin.lat, pin.lng));
          mapInstance.current.setLevel(3);
        }
        
        // 커스텀 이벤트로 React에 전달
        window.dispatchEvent(new CustomEvent('showPinDetail', { 
          detail: { post: foundPost, pinId } 
        }));
      } else {
        console.error('❌ 게시물 없음:', pinId);
      }
    };

    pins.forEach((pin, i) => {
      if (!pin.image) {
        console.warn(`⚠️ 이미지 없음: ${pin.title}`);
        return;
      }

      const pos = new window.kakao.maps.LatLng(pin.lat, pin.lng);
      
      const el = document.createElement('div');
      el.innerHTML = `
        <button 
          class="pin-btn relative w-12 h-12 border-2 border-white shadow-lg rounded-md overflow-hidden hover:scale-110 transition-all duration-200 cursor-pointer" 
          style="z-index: ${i}" 
          onclick="window.handleMapPinClick('${pin.id}')"
        >
          <img class="w-full h-full object-cover" src="${pin.image}" alt="${pin.title}" onerror="this.src='https://via.placeholder.com/200?text=No+Image'"/>
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

    console.log(`✅ ${pinsRef.current.length}개 핀 생성 완료 (클릭 가능)`);
  }, []);

  // 핀 상세 화면 표시 이벤트 리스너
  useEffect(() => {
    const handleShowPinDetail = (e) => {
      const { post, pinId } = e.detail;
      console.log('🎯 React에서 상세 화면 표시:', post.location);
      
      setSelectedPinId(pinId);
      setDetailPost(post);
      setShowDetail(true);
      setShowSheet(false);
      
      console.log('✅ 상세 화면 열림!');
    };
    
    window.addEventListener('showPinDetail', handleShowPinDetail);
    
    return () => {
      window.removeEventListener('showPinDetail', handleShowPinDetail);
    };
  }, []);

  // 보이는 핀 업데이트 (깜빡임 없음)
  const updateVisiblePins = useCallback(() => {
    if (!mapInstance.current || allPins.length === 0) {
      console.log('⚠️ 핀 업데이트 불가:', { 
        지도: mapInstance.current ? '✅' : '❌', 
        핀개수: allPins.length 
      });
      return;
    }

    const bounds = mapInstance.current.getBounds();
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();

    const visible = allPins.filter(p =>
      p.lat >= sw.getLat() && p.lat <= ne.getLat() &&
      p.lng >= sw.getLng() && p.lng <= ne.getLng()
    );

    console.log(`🗺️ 보이는 핀: ${visible.length}/${allPins.length}개`);
    setVisiblePins(visible);
    
    // show/hide만 (재생성 없음)
    const visibleIds = new Set(visible.map(p => p.id));
    pinsRef.current.forEach(({ id, overlay }) => {
      overlay.setMap(visibleIds.has(id) ? mapInstance.current : null);
    });
  }, [allPins]);

  // allPins 업데이트 시 핀 생성 및 표시
  useEffect(() => {
    if (allPins.length > 0 && mapInstance.current) {
      console.log(`🎨 ${allPins.length}개 핀으로 지도 업데이트`);
      
      // 기존 핀이 없으면 생성
      if (pinsRef.current.length === 0) {
        createPins(allPins);
      }
      
      // 보이는 핀 업데이트
      setTimeout(() => {
        updateVisiblePins();
      }, 300);
      
      // 지도 이동 시 필터링 이벤트 추가
      const listener = window.kakao.maps.event.addListener(mapInstance.current, 'idle', () => {
        updateVisiblePins();
      });
      
      return () => {
        window.kakao.maps.event.removeListener(mapInstance.current, 'idle', listener);
      };
    }
  }, [allPins, createPins, updateVisiblePins]);

  // 검색
  const handleSearchChange = (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    setSearchResults(q ? searchRegions(q) : []);
  };

  const selectRegion = useCallback((region) => {
    const coords = getCoordinatesByLocation(region);
    if (coords && mapInstance.current) {
      mapInstance.current.setCenter(new window.kakao.maps.LatLng(coords.lat, coords.lng));
      mapInstance.current.setLevel(4);
      
      const s = JSON.parse(localStorage.getItem('recentSearches') || '[]');
      localStorage.setItem('recentSearches', JSON.stringify([region, ...s.filter(x => x !== region)].slice(0, 10)));
      setRecentSearches([region, ...s.filter(x => x !== region)].slice(0, 5));
    }
    setShowSearch(false);
    setSearchQuery('');
  }, []);

  // 내 위치
  const myLocation = () => {
    navigator.geolocation?.getCurrentPosition(
      (p) => {
        mapInstance.current?.setCenter(new window.kakao.maps.LatLng(p.coords.latitude, p.coords.longitude));
        mapInstance.current?.setLevel(3);
      },
      () => alert('위치를 가져올 수 없습니다')
    );
  };

  // 새로고침
  const refresh = () => {
    console.log('🔄 지도 새로고침');
    
    // 기존 핀 제거
    pinsRef.current.forEach(({ overlay }) => overlay.setMap(null));
    pinsRef.current = [];
    
    // 데이터 다시 로드
    loadAllData();
    
    // 업데이트 확인
    setTimeout(() => {
      console.log(`새로고침 결과: ${allPins.length}개 핀, ${visiblePins.length}개 표시`);
    }, 1000);
  };

  // 시트 드래그 (아래로만, 부드럽게)
  const sheetDragStart = useCallback((e) => {
    e.preventDefault();
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setIsDragging(true);
    const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
    setDragStart(clientY);
    lastYRef.current = clientY;
    velocityRef.current = 0;
    setDragY(0);
  }, []);

  const sheetDragMove = useCallback((e) => {
    if (!isDragging || !sheetRef.current) return;
    e.preventDefault();
    
    const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
    const deltaY = clientY - dragStart; // 아래로 내리면 양수
    
    // 속도 계산 (관성용)
    velocityRef.current = clientY - lastYRef.current;
    lastYRef.current = clientY;
    
    // 아래로만 이동 가능 (deltaY > 0)
    if (deltaY >= 0) {
      // requestAnimationFrame으로 60fps 부드럽게
      animationRef.current = requestAnimationFrame(() => {
        if (sheetRef.current) {
          const smoothY = deltaY * 0.95; // 약간의 저항감 (더 부드럽게)
          setDragY(smoothY);
          sheetRef.current.style.transform = `translateY(${smoothY}px)`;
          sheetRef.current.style.transition = 'none';
        }
      });
    }
  }, [isDragging, dragStart]);

  const sheetDragEnd = useCallback(() => {
    setIsDragging(false);
    
    // 관성 적용 - 더 자연스럽게
    const finalDragY = dragY + (velocityRef.current * 10); // 속도 * 배율
    
    // 80px 이상 내렸거나 빠르게 내렸으면 시트 닫기
    if (finalDragY > 80 || velocityRef.current > 3) {
      if (sheetRef.current) {
        sheetRef.current.style.transform = 'translateY(100%)';
        sheetRef.current.style.transition = 'transform 0.5s cubic-bezier(0.32, 0.72, 0, 1)';
      }
      setTimeout(() => {
        setShowSheet(false);
        setDragY(0);
        if (sheetRef.current) {
          sheetRef.current.style.transform = '';
          sheetRef.current.style.transition = '';
        }
      }, 500);
    } else {
      // 원위치 - 부드러운 스프링 애니메이션
      if (sheetRef.current) {
        sheetRef.current.style.transform = 'translateY(0)';
        sheetRef.current.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
      }
      setTimeout(() => setDragY(0), 400);
    }
    
    velocityRef.current = 0;
  }, [dragY]);

  // 드래그 중일 때 전역 포인터 이벤트로 자연스럽게 이동
  useEffect(() => {
    if (!isDragging) return;
    
    const handleMove = (e) => sheetDragMove(e);
    const handleUp = () => sheetDragEnd();
    
    window.addEventListener('pointermove', handleMove, { passive: false });
    window.addEventListener('pointerup', handleUp, { passive: true });
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleUp, { passive: true });
    
    // 드래그 중 커서 스타일
    if (dragHandleRef.current) {
      dragHandleRef.current.style.cursor = 'grabbing';
    }
    
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
      
      if (dragHandleRef.current) {
        dragHandleRef.current.style.cursor = 'grab';
      }
    };
  }, [isDragging, sheetDragMove, sheetDragEnd]);

  // 사진 스크롤 (메인화면과 동일한 방식)
  const photoStart = useCallback((e) => {
    if (!scrollRef.current) return;
    setScrollDrag(true);
    setHasMoved(false);
    const x = e.type === 'touchstart' ? e.touches[0].pageX : e.pageX;
    setScrollStart(x - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
    scrollRef.current.style.cursor = 'grabbing';
    scrollRef.current.style.userSelect = 'none';
  }, []);

  const photoMove = useCallback((e) => {
    if (!scrollDrag || !scrollRef.current) return;
    e.preventDefault();
    const x = e.type === 'touchmove' ? e.touches[0].pageX : e.pageX;
    const walk = (x - scrollRef.current.offsetLeft - scrollStart) * 2.5; // 더 빠르고 부드럽게
    
    // 움직임 감지
    if (Math.abs(walk) > 5) {
      setHasMoved(true);
    }
    
    // requestAnimationFrame으로 부드러운 스크롤
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollLeft = scrollLeft - walk;
      }
    });
  }, [scrollDrag, scrollStart, scrollLeft]);

  const photoEnd = useCallback(() => {
    setScrollDrag(false);
    if (scrollRef.current) {
      scrollRef.current.style.cursor = 'grab';
      scrollRef.current.style.userSelect = 'auto';
    }
  }, []);

  // 사진 클릭 → 핀 위치로 이동 (드래그 체크)
  const photoClick = useCallback((pin) => {
    // 드래그 중이면 클릭 무시
    if (hasMoved) return;
    
    if (mapInstance.current) {
      mapInstance.current.setCenter(new window.kakao.maps.LatLng(pin.lat, pin.lng));
      mapInstance.current.setLevel(3);
    }
    setSelectedPinId(pin.id);
  }, [hasMoved]);

  return (
    <div className="flex h-full w-full flex-col bg-background-light dark:bg-background-dark">
      <div className="flex-1 relative overflow-hidden">
        <div ref={mapRef} className="absolute inset-0 bg-zinc-200" />

        {/* 상단 */}
        <div className="absolute top-0 left-0 right-0 z-20 p-4">
          <div className="flex gap-2">
            <button onClick={() => setShowSearch(true)} className="flex-1 flex items-center gap-2 bg-white dark:bg-zinc-800 rounded-lg px-4 py-3 shadow-lg">
              <span className="material-symbols-outlined text-zinc-500">search</span>
              <span className="text-zinc-500 text-sm">지역 검색</span>
            </button>
            <button onClick={refresh} className="w-12 h-12 flex items-center justify-center bg-white dark:bg-zinc-800 rounded-lg shadow-lg">
              <span className="material-symbols-outlined">refresh</span>
                  </button>
                </div>
          </div>

        {/* 우측 */}
        <div className="absolute right-4 z-20 transition-all duration-300" style={{ bottom: showSheet && !showPhotoList ? '220px' : '80px' }}>
          <div className="flex flex-col gap-2">
            <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg">
              <button onClick={() => mapInstance.current?.setLevel(mapInstance.current.getLevel() - 1)} className="w-10 h-10 flex items-center justify-center hover:bg-zinc-100">
                <span className="material-symbols-outlined">add</span>
                </button>
              <div className="h-px bg-zinc-300" />
              <button onClick={() => mapInstance.current?.setLevel(mapInstance.current.getLevel() + 1)} className="w-10 h-10 flex items-center justify-center hover:bg-zinc-100">
                <span className="material-symbols-outlined">remove</span>
              </button>
            </div>
            <button onClick={myLocation} className="w-10 h-10 flex items-center justify-center bg-white dark:bg-zinc-800 rounded-lg shadow-lg">
              <span className="material-symbols-outlined">my_location</span>
                              </button>
                            </div>
                          </div>

        {/* 시트 열기 - 사진 다시 보기 */}
        {!showSheet && !showPhotoList && (
          <div className="absolute bottom-0 left-0 right-0 z-20 p-4 flex justify-center">
            <button 
              onClick={() => {
                setShowSheet(true);
                setDragY(0);
              }} 
              className="bg-primary text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-2 hover:bg-primary/90 transition-all transform hover:scale-105 active:scale-95"
            >
              <span className="material-symbols-outlined">photo_library</span>
              <span className="font-semibold">사진 다시 보기 ({visiblePins.length}개)</span>
            </button>
                        </div>
        )}

        {/* 하단 시트 */}
        {showSheet && !showPhotoList && (
          <div className="absolute bottom-0 left-0 right-0 z-20">
            <div 
              ref={sheetRef} 
              className="bg-white dark:bg-zinc-800 rounded-t-2xl shadow-2xl"
              style={{ height: '200px' }}
            >
              <div 
                className="p-4 pb-2"
                onPointerDown={sheetDragStart}
              >
                <div className="flex justify-center py-2 -mt-2 -mx-4 cursor-grab active:cursor-grabbing touch-none">
                  <div
                    ref={dragHandleRef}
                    className="w-16 h-1.5 bg-zinc-300 dark:bg-zinc-600 rounded-full transition-all duration-200 hover:bg-zinc-400 dark:hover:bg-zinc-500 hover:w-20"
                    aria-label="아래로 드래그하여 닫기"
                  />
                  </div>
                  <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold">📍 주변 장소</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-500">{visiblePins.length}개</span>
                    {visiblePins.length > 0 && (
                    <button 
                        onClick={() => setShowPhotoList(true)}
                        className="text-xs font-semibold text-primary hover:text-primary/80"
                    >
                      더보기
                    </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-4 pb-4 overflow-y-auto" style={{ height: 'calc(200px - 80px)' }}>
                <div
                  ref={scrollRef}
                  onMouseDown={photoStart}
                  onMouseMove={photoMove}
                  onMouseUp={photoEnd}
                  onMouseLeave={photoEnd}
                  onTouchStart={photoStart}
                  onTouchMove={photoMove}
                  onTouchEnd={photoEnd}
                  className="flex gap-3 overflow-x-auto pb-2 scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory"
                  style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch', cursor: 'grab' }}
                >
                  {visiblePins.length === 0 ? (
                    <div className="w-full text-center py-6">
                      <span className="material-symbols-outlined text-4xl text-zinc-400">add_location</span>
                      <p className="text-sm text-zinc-500 mt-2">이 지역에 장소가 없어요</p>
                    </div>
                  ) : (
                    <>
                      {visiblePins.map((pin) => (
                        <button 
                          key={pin.id}
                          onClick={() => photoClick(pin)} 
                          className="flex-shrink-0 group snap-start select-none"
                        >
                          <div className="w-24 relative">
                            {pin.image ? (
                              <>
                                <img 
                                  src={pin.image} 
                                  alt={pin.title} 
                                  className="w-full aspect-square rounded-lg object-cover shadow-md group-hover:shadow-xl transition-all duration-200 group-hover:scale-105" 
                                  onError={(e) => {
                                    console.error(`이미지 로드 실패: ${pin.title}`);
                                    e.target.src = 'https://via.placeholder.com/200?text=No+Image';
                                  }}
                                  draggable="false"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-lg pointer-events-none"></div>
                              </>
                            ) : (
                              <div className="w-full aspect-square rounded-lg bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                                <span className="material-symbols-outlined text-zinc-400">image</span>
                              </div>
                            )}
                            {pin.categoryName && (
                              <div className="absolute top-1 left-1">
                                <span className="text-base font-bold bg-white/90 dark:bg-white/80 rounded-full w-7 h-7 flex items-center justify-center shadow-md">
                                  {pin.categoryName === '개화 상황' && '🌸'}
                                  {pin.categoryName === '추천 장소' && '🏞️'}
                                  {pin.categoryName === '맛집 정보' && '🍜'}
                                  {pin.categoryName === '가볼만한곳' && '🗺️'}
                                  {!['개화 상황', '추천 장소', '맛집 정보', '가볼만한곳'].includes(pin.categoryName) && '📷'}
                                </span>
                              </div>
                            )}
                          </div>
                          <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 mt-1.5 truncate w-24">{pin.title}</p>
                        </button>
                      ))}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
        )}

        {/* 전체 사진 목록 화면 */}
        {showPhotoList && (
          <div className="absolute inset-0 z-30 bg-white dark:bg-zinc-900 flex flex-col">
            {/* 헤더 */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-lg font-bold">📍 주변 장소 ({visiblePins.length}개)</h2>
                  <button 
                onClick={() => setShowPhotoList(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                <span className="material-symbols-outlined">close</span>
                  </button>
            </div>

            {/* 사진 그리드 */}
            <div className="flex-1 overflow-y-auto p-4">
              {visiblePins.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <span className="material-symbols-outlined text-6xl text-zinc-400 mb-4">add_location</span>
                  <p className="text-zinc-500 dark:text-zinc-400">이 지역에 장소가 없어요</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {visiblePins.map((pin) => (
                    <button
                      key={pin.id}
                      onClick={() => {
                        photoClick(pin);
                        setShowPhotoList(false);
                      }}
                      className="relative group aspect-square rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all"
                    >
                      {pin.image ? (
                      <>
                        <img
                          src={pin.image}
                            alt={pin.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/200?text=No+Image';
                            }}
                          />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                      </>
                      ) : (
                        <div className="w-full h-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                          <span className="material-symbols-outlined text-zinc-400">image</span>
                        </div>
                      )}
                      {/* 좌측상단: 카테고리 아이콘 */}
                      {pin.categoryName && (
                        <div className="absolute top-2 left-2">
                          <span className="text-lg font-bold bg-white/90 dark:bg-white/80 rounded-full w-9 h-9 flex items-center justify-center shadow-md backdrop-blur-sm">
                            {pin.categoryName === '개화 상황' && '🌸'}
                            {pin.categoryName === '추천 장소' && '🏞️'}
                            {pin.categoryName === '맛집 정보' && '🍜'}
                            {pin.categoryName === '가볼만한곳' && '🗺️'}
                            {!['개화 상황', '추천 장소', '맛집 정보', '가볼만한곳'].includes(pin.categoryName) && '📷'}
                          </span>
                        </div>
                      )}
                      {/* 하단: 지역정보 */}
                      <div className="absolute bottom-0 left-0 right-0 p-2">
                        <p className="text-white text-xs font-bold truncate drop-shadow-lg">📍 {pin.title}</p>
                      </div>
                  </button>
                ))}
                </div>
              )}
              </div>

            {/* 하단 지도보기 버튼 */}
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
                <button 
                onClick={() => setShowPhotoList(false)}
                className="w-full bg-primary text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
                >
                <span className="material-symbols-outlined">map</span>
                <span>지도보기</span>
                </button>
            </div>
          </div>
        )}
      </div>

      {/* 검색 */}
      {showSearch && (
        <div className="absolute inset-0 z-50 bg-black/30">
          <div className="absolute top-0 w-full bg-white dark:bg-zinc-900 rounded-b-2xl flex flex-col" style={{ maxHeight: '75vh' }}>
            {/* 헤더 */}
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold">지역 검색</h2>
                <button onClick={() => setShowSearch(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700">
                  <span className="material-symbols-outlined text-zinc-600">close</span>
                </button>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">search</span>
                <input type="text" value={searchQuery} onChange={handleSearchChange} className="w-full rounded-full bg-zinc-100 dark:bg-zinc-800 py-3 pl-10 pr-4 focus:ring-2 focus:ring-primary" placeholder="지역을 검색하세요" autoFocus />
              </div>
            </div>

            {/* 컨텐츠 */}
            <div className="p-4">
              {searchQuery && searchResults.length > 0 ? (
                <div>
                  <h3 className="font-bold mb-3">검색 결과</h3>
                  <div className="space-y-2">
                    {searchResults.slice(0, 8).map((r, i) => (
                      <button key={i} onClick={() => selectRegion(r)} className="w-full flex items-center gap-3 p-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                        <span className="material-symbols-outlined text-primary">location_on</span>
                        <span className="flex-1 text-left font-semibold">{r}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : searchQuery && searchResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <span className="material-symbols-outlined text-5xl text-zinc-300 dark:text-zinc-600 mb-3">search_off</span>
                  <p className="text-zinc-500 dark:text-zinc-400 text-center">
                    검색 결과가 없어요
                  </p>
                </div>
              ) : (
                <div>
                  {/* 최근 검색 */}
                  {recentSearches.length > 0 ? (
                    <div>
                      <h3 className="font-bold mb-3 text-zinc-900 dark:text-zinc-100">🕐 최근 검색</h3>
                      <div className="flex flex-wrap gap-2">
                        {recentSearches.map((r, i) => (
                          <button
                            key={i}
                            onClick={() => selectRegion(r)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-primary/10 dark:hover:bg-primary/20 border border-zinc-200 dark:border-zinc-700 hover:border-primary transition-colors"
                          >
                            <span className="material-symbols-outlined text-zinc-400 text-sm">tag</span>
                            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">#{r}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12">
                      <span className="material-symbols-outlined text-5xl text-zinc-300 dark:text-zinc-600 mb-3">search</span>
                      <p className="text-zinc-500 dark:text-zinc-400 text-center">
                        지역을 검색하세요
                      </p>
                    </div>
                  )}
                  </div>
                )}
            </div>
          </div>
                  </div>
                )}

      {/* 핀 상세 화면 - 지도 화면 내에서 표시 */}
      {showDetail && detailPost && (
        <div className="absolute inset-0 z-50 bg-black/60 flex items-end">
          <div className="w-full max-h-[85%] bg-white dark:bg-zinc-900 rounded-t-3xl flex flex-col shadow-2xl">
            {/* 드래그 바 */}
            <div className="p-3 flex justify-center">
              <div className="w-12 h-1.5 bg-zinc-300 dark:bg-zinc-600 rounded-full" />
            </div>

            {/* 헤더 */}
            <div className="flex items-center justify-between px-4 pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-xl font-bold">📸 {detailPost.detailedLocation || detailPost.location}</h2>
                    <button
                onClick={() => { 
                  setShowDetail(false); 
                  setDetailPost(null); 
                  setSelectedPinId(null);
                  setShowSheet(true); // 시트 다시 표시
                }} 
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* 사진 */}
              <div className="w-full aspect-square rounded-2xl overflow-hidden shadow-lg">
                <img 
                  src={detailPost.images?.[0]} 
                  alt={detailPost.location} 
                  className="w-full h-full object-cover" 
                />
              </div>

              {/* 위치 정보 */}
              <div className="bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20 rounded-2xl p-4 border border-primary/20">
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/20">
                    <span className="material-symbols-outlined text-primary text-xl">location_on</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1">{detailPost.detailedLocation || detailPost.location}</h3>
                    {detailPost.address && (
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">{detailPost.address}</p>
                    )}
                    {detailPost.categoryName && (
                      <span className="inline-block bg-primary text-white px-3 py-1 rounded-full text-xs font-bold mt-2">
                        {detailPost.categoryName}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* 작성자 노트 */}
              {detailPost.note && (
                <div className="bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-zinc-800 dark:to-zinc-900 rounded-2xl p-4 border-2 border-primary/30">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-primary">edit_note</span>
                    <h3 className="font-bold text-base">작성자의 노트</h3>
                  </div>
                  <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{detailPost.note}</p>
                </div>
              )}

              {/* 해시태그 */}
              {detailPost.aiLabels && detailPost.aiLabels.length > 0 && (
              <div>
                  <h3 className="font-semibold text-sm mb-2 text-zinc-600 dark:text-zinc-400">🏷️ 태그</h3>
                  <div className="flex flex-wrap gap-2">
                    {detailPost.aiLabels.slice(0, 5).map((label, idx) => {
                      const labelText = typeof label === 'string' ? label : label.name || label.description || '';
                      return (
                        <span key={idx} className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-3 py-1 rounded-full text-xs">
                          #{labelText}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 하단 버튼 */}
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setShowDetail(false);
                    setDetailPost(null);
                    setShowSheet(true);
                  }}
                  className="flex-1 bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white py-3 rounded-xl font-semibold hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
                >
                  닫기
                      </button>
                      <button
                  onClick={() => navigate(`/post/${detailPost.id}`, { state: { post: detailPost } })} 
                  className="flex-1 bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                      >
                  <span className="material-symbols-outlined text-lg">open_in_full</span>
                  <span>전체보기</span>
                      </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomNavigation />
    </div>
  );
};

export default MapScreen;
































