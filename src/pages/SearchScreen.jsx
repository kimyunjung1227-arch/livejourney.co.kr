import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';
import { seedMockData } from '../utils/mockUploadData';
import { getRegionDefaultImage, getRegionDisplayImage } from '../utils/regionDefaultImages';
import { filterRecentPosts } from '../utils/timeUtils';

const SearchScreen = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredRegions, setFilteredRegions] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [regionRepresentativePhotos, setRegionRepresentativePhotos] = useState({});

  const recommendedScrollRef = useRef(null);
  const recentScrollRef = useRef(null);
  const searchContainerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [currentScrollRef, setCurrentScrollRef] = useState(null);
  const [hasMoved, setHasMoved] = useState(false);

  // 추천 지역 데이터 (메모이제이션) - 기본 이미지는 getRegionDefaultImage 사용
  const recommendedRegions = useMemo(() => [
    { id: 1, name: '서울', image: getRegionDefaultImage('서울'), keywords: ['도시', '쇼핑', '명동', '강남', '홍대', '경복궁', '궁궐', '한강', '야경', '카페', '맛집'] },
    { id: 2, name: '부산', image: getRegionDefaultImage('부산'), keywords: ['바다', '해변', '해운대', '광안리', '야경', '횟집', '수산시장', '자갈치', '항구', '서핑'] },
    { id: 3, name: '대구', image: getRegionDefaultImage('대구'), keywords: ['도시', '근대', '골목', '김광석길', '동성로', '쇼핑', '약령시', '팔공산', '치맥', '맥주'] },
    { id: 4, name: '인천', image: getRegionDefaultImage('인천'), keywords: ['차이나타운', '짜장면', '월미도', '야경', '인천공항', '바다', '항구', '송도', '근대'] },
    { id: 5, name: '광주', image: getRegionDefaultImage('광주'), keywords: ['도시', '무등산', '양동시장', '충장로', '예술', '문화', '민주화', '역사'] },
    { id: 6, name: '대전', image: getRegionDefaultImage('대전'), keywords: ['도시', '과학', '엑스포', '성심당', '빵', '한밭수목원', '대청호', '계족산'] },
    { id: 7, name: '울산', image: getRegionDefaultImage('울산'), keywords: ['공업', '항구', '대왕암공원', '간절곶', '일출', '고래', '울산대교', '태화강'] },
    { id: 8, name: '세종', image: getRegionDefaultImage('세종'), keywords: ['행정', '정부', '신도시', '계획도시', '공원', '호수공원', '도담동'] },
    { id: 9, name: '수원', image: getRegionDefaultImage('수원'), keywords: ['화성', '성곽', '수원갈비', '행궁', '화성행궁', '전통', '맛집'] },
    { id: 10, name: '용인', image: getRegionDefaultImage('용인'), keywords: ['에버랜드', '놀이공원', '민속촌', '한국민속촌', '가족'] },
    { id: 11, name: '성남', image: getRegionDefaultImage('성남'), keywords: ['도시', '판교', 'IT', '테크노', '카페'] },
    { id: 12, name: '고양', image: getRegionDefaultImage('고양'), keywords: ['일산', '호수공원', '킨텍스', '전시', '꽃축제'] },
    { id: 13, name: '부천', image: getRegionDefaultImage('부천'), keywords: ['도시', '만화박물관', '애니메이션', '영화'] },
    { id: 14, name: '안양', image: getRegionDefaultImage('안양'), keywords: ['도시', '안양천', '예술공원'] },
    { id: 15, name: '파주', image: getRegionDefaultImage('파주'), keywords: ['헤이리', '출판단지', '임진각', 'DMZ', '예술', '북카페'] },
    { id: 16, name: '평택', image: getRegionDefaultImage('평택'), keywords: ['항구', '미군기지', '송탄'] },
    { id: 17, name: '화성', image: getRegionDefaultImage('화성'), keywords: ['융건릉', '용주사', '제부도', '바다'] },
    { id: 18, name: '김포', image: getRegionDefaultImage('김포'), keywords: ['공항', '김포공항', '한강', '애기봉'] },
    { id: 19, name: '광명', image: getRegionDefaultImage('광명'), keywords: ['동굴', '광명동굴', 'KTX'] },
    { id: 20, name: '이천', image: getRegionDefaultImage('이천'), keywords: ['도자기', '쌀', '온천', '세라피아'] },
    { id: 21, name: '양평', image: getRegionDefaultImage('양평'), keywords: ['자연', '두물머리', '세미원', '힐링', '강', '수목원'] },
    { id: 22, name: '가평', image: getRegionDefaultImage('가평'), keywords: ['남이섬', '쁘띠프랑스', '아침고요수목원', '자연', '힐링', '계곡'] },
    { id: 23, name: '포천', image: getRegionDefaultImage('포천'), keywords: ['아트밸리', '허브아일랜드', '산정호수', '자연'] },
    { id: 24, name: '춘천', image: getRegionDefaultImage('춘천'), keywords: ['닭갈비', '호수', '남이섬', '소양강', '스카이워크', '맛집'] },
    { id: 25, name: '강릉', image: getRegionDefaultImage('강릉'), keywords: ['바다', '커피', '카페', '경포대', '정동진', '일출', '해변', '순두부'] },
    { id: 26, name: '속초', image: getRegionDefaultImage('속초'), keywords: ['바다', '설악산', '산', '등산', '오징어', '수산시장', '아바이마을', '회'] },
    { id: 27, name: '원주', image: getRegionDefaultImage('원주'), keywords: ['치악산', '등산', '산', '자연'] },
    { id: 28, name: '동해', image: getRegionDefaultImage('동해'), keywords: ['바다', '해변', '추암', '촛대바위', '일출'] },
    { id: 29, name: '태백', image: getRegionDefaultImage('태백'), keywords: ['산', '탄광', '눈꽃축제', '겨울', '스키'] },
    { id: 30, name: '삼척', image: getRegionDefaultImage('삼척'), keywords: ['바다', '동굴', '환선굴', '대금굴', '해변'] },
    { id: 31, name: '평창', image: getRegionDefaultImage('평창'), keywords: ['스키', '겨울', '올림픽', '산', '용평'] },
    { id: 32, name: '양양', image: getRegionDefaultImage('양양'), keywords: ['바다', '서핑', '해변', '낙산사', '하조대'] },
    { id: 33, name: '청주', image: getRegionDefaultImage('청주'), keywords: ['도시', '직지', '인쇄', '상당산성', '문화'] },
    { id: 34, name: '충주', image: getRegionDefaultImage('충주'), keywords: ['호수', '충주호', '탄금대', '사과', '자연'] },
    { id: 35, name: '제천', image: getRegionDefaultImage('제천'), keywords: ['약초', '한방', '청풍호', '의림지', '자연'] },
    { id: 36, name: '천안', image: getRegionDefaultImage('천안'), keywords: ['호두과자', '독립기념관', '역사', '맛집'] },
    { id: 37, name: '아산', image: getRegionDefaultImage('아산'), keywords: ['온양온천', '온천', '현충사', '이순신', '역사'] },
    { id: 38, name: '공주', image: getRegionDefaultImage('공주'), keywords: ['역사', '백제', '공산성', '무령왕릉', '전통', '문화재'] },
    { id: 39, name: '보령', image: getRegionDefaultImage('보령'), keywords: ['바다', '머드', '축제', '해수욕장', '대천'] },
    { id: 40, name: '서산', image: getRegionDefaultImage('서산'), keywords: ['바다', '간월암', '마애삼존불', '석불', '역사'] },
    { id: 41, name: '당진', image: getRegionDefaultImage('당진'), keywords: ['바다', '왜목마을', '일출', '일몰'] },
    { id: 42, name: '부여', image: getRegionDefaultImage('부여'), keywords: ['역사', '백제', '궁남지', '정림사지', '문화재', '전통'] },
    { id: 43, name: '전주', image: getRegionDefaultImage('전주'), keywords: ['한옥', '전통', '한옥마을', '비빔밥', '콩나물국밥', '맛집', '한복'] },
    { id: 44, name: '군산', image: getRegionDefaultImage('군산'), keywords: ['근대', '역사', '이성당', '빵', '항구', '경암동'] },
    { id: 45, name: '익산', image: getRegionDefaultImage('익산'), keywords: ['역사', '백제', '미륵사지', '보석', '문화재'] },
    { id: 46, name: '정읍', image: getRegionDefaultImage('정읍'), keywords: ['내장산', '단풍', '산', '등산', '자연'] },
    { id: 47, name: '남원', image: getRegionDefaultImage('남원'), keywords: ['춘향', '전통', '광한루', '지리산', '산'] },
    { id: 48, name: '목포', image: getRegionDefaultImage('목포'), keywords: ['바다', '항구', '유달산', '갓바위', '회', '해산물'] },
    { id: 49, name: '여수', image: getRegionDefaultImage('여수'), keywords: ['바다', '밤바다', '야경', '낭만', '케이블카', '오동도', '향일암'] },
    { id: 50, name: '순천', image: getRegionDefaultImage('순천'), keywords: ['순천만', '정원', '갈대', '습지', '자연', '생태'] },
    { id: 51, name: '광양', image: getRegionDefaultImage('광양'), keywords: ['매화', '꽃', '섬진강', '불고기', '맛집'] },
    { id: 52, name: '담양', image: getRegionDefaultImage('담양'), keywords: ['대나무', '죽녹원', '메타세쿼이아', '자연', '힐링'] },
    { id: 53, name: '보성', image: getRegionDefaultImage('보성'), keywords: ['녹차', '차밭', '자연', '힐링', '드라이브'] },
    { id: 54, name: '포항', image: getRegionDefaultImage('포항'), keywords: ['바다', '호미곶', '일출', '과메기', '회', '항구'] },
    { id: 55, name: '경주', image: getRegionDefaultImage('경주'), keywords: ['역사', '문화재', '불국사', '석굴암', '첨성대', '신라', '전통'] },
    { id: 56, name: '구미', image: getRegionDefaultImage('구미'), keywords: ['공업', 'IT', '도시'] },
    { id: 57, name: '안동', image: getRegionDefaultImage('안동'), keywords: ['하회마을', '전통', '한옥', '탈춤', '간고등어', '역사'] },
    { id: 58, name: '김천', image: getRegionDefaultImage('김천'), keywords: ['직지사', '산', '사찰', '포도'] },
    { id: 59, name: '영주', image: getRegionDefaultImage('영주'), keywords: ['부석사', '소수서원', '사찰', '역사', '전통'] },
    { id: 60, name: '창원', image: getRegionDefaultImage('창원'), keywords: ['도시', '공업', '진해', '벚꽃', '축제'] },
    { id: 61, name: '진주', image: getRegionDefaultImage('진주'), keywords: ['진주성', '역사', '비빔밥', '맛집', '남강'] },
    { id: 62, name: '통영', image: getRegionDefaultImage('통영'), keywords: ['바다', '케이블카', '한려수도', '회', '해산물', '섬'] },
    { id: 63, name: '사천', image: getRegionDefaultImage('사천'), keywords: ['바다', '해변', '항공', '공항'] },
    { id: 64, name: '김해', image: getRegionDefaultImage('김해'), keywords: ['가야', '역사', '공항', '김해공항', '수로왕릉'] },
    { id: 65, name: '거제', image: getRegionDefaultImage('거제'), keywords: ['바다', '섬', '해금강', '외도', '조선소'] },
    { id: 66, name: '양산', image: getRegionDefaultImage('양산'), keywords: ['통도사', '사찰', '신불산', '산', '자연'] },
    { id: 67, name: '제주', image: getRegionDefaultImage('제주'), keywords: ['섬', '바다', '한라산', '오름', '돌하르방', '흑돼지', '감귤', '휴양', '힐링'] },
    { id: 68, name: '서귀포', image: getRegionDefaultImage('서귀포'), keywords: ['바다', '섬', '폭포', '정방폭포', '천지연', '감귤', '자연'] }
  ], []);

  // 추천 지역 계산 (사진이 많은 순으로 정렬)
  const topRegions = useMemo(() => {
    // 사진이 있는 지역들 (사진 개수 순으로 정렬)
    const regionsWithPhotos = Object.entries(regionRepresentativePhotos)
      .filter(([_, photo]) => photo.hasUploadedPhoto && photo.count > 0)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([regionName, photo]) => ({
        name: regionName,
        ...photo
      }));
    
    return regionsWithPhotos;
  }, [regionRepresentativePhotos]);

  // 한글 초성 추출 함수 (useCallback)
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

  // 초성 매칭 함수 (useCallback)
  const matchChosung = useCallback((text, search) => {
    const textChosung = getChosung(text);
    const searchChosung = getChosung(search);
    
    // 초성 매칭: 검색어의 초성이 지역명 초성에 포함되는지
    const matches = textChosung.includes(searchChosung) || textChosung.includes(search);
    
    return matches;
  }, [getChosung]);

  // 지역별 대표 사진 로드 (useCallback)
  const loadRegionPhotos = useCallback(() => {
    let uploadedPosts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');
    
    // 2일 이상 된 게시물 필터링 ⭐
    uploadedPosts = filterRecentPosts(uploadedPosts, 2);
    console.log(`📊 검색화면 - 2일 이내 게시물: ${uploadedPosts.length}개`);
    
    // Mock 데이터 생성 비활성화 - 프로덕션 모드
    if (uploadedPosts.length === 0) {
      console.log('📭 최근 2일 이내 업로드된 게시물이 없습니다.');
    }
    
    const photosByRegion = {};

    recommendedRegions.forEach(region => {
      const regionName = region.name;
      
      const regionPosts = uploadedPosts.filter(post => {
        const postLocation = post.location || '';
        return postLocation.includes(regionName) || 
               regionName.includes(postLocation) ||
               postLocation === regionName;
      });
      
      // 업로드된 사진이 있으면 사용, 없으면 기본 이미지 사용
      if (regionPosts.length > 0) {
        const randomIndex = Math.floor(Math.random() * Math.min(regionPosts.length, 5));
        const representativePost = regionPosts[randomIndex];
        
        photosByRegion[regionName] = {
          image: representativePost.images?.[0] || representativePost.image,
          category: representativePost.categoryName,
          detailedLocation: representativePost.detailedLocation || representativePost.placeName,
          count: regionPosts.length,
          time: representativePost.timeLabel || '방금',
          hasUploadedPhoto: true
        };
      } else {
        // 업로드된 사진이 없으면 기본 대표 이미지 사용
        photosByRegion[regionName] = {
          image: getRegionDefaultImage(regionName),
          category: '추천 장소',
          detailedLocation: `${regionName}의 아름다운 풍경`,
          count: 0,
          time: null,
          hasUploadedPhoto: false
        };
      }
    });

    setRegionRepresentativePhotos(photosByRegion);
    console.log(`🖼️ 지역별 대표 사진 로드: ${Object.keys(photosByRegion).length}개 지역 (업로드: ${Object.values(photosByRegion).filter(p => p.hasUploadedPhoto).length}개, 기본: ${Object.values(photosByRegion).filter(p => !p.hasUploadedPhoto).length}개)`);
  }, [recommendedRegions]);

  // 검색어 입력 핸들러 (useCallback)
  const handleSearchInput = useCallback((e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    console.log('🔍 검색 입력:', value);
    
    if (value.trim()) {
      const searchTerm = value.toLowerCase();
      const filtered = recommendedRegions.filter(region => {
        const matchesName = region.name.toLowerCase().includes(searchTerm);
        const matchesChosung = matchChosung(region.name, value);
        const matches = matchesName || matchesChosung;
        
        if (matches) {
          console.log(`  ✅ 매칭: ${region.name} (이름:${matchesName}, 초성:${matchesChosung})`);
        }
        
        return matches;
      });
      
      console.log(`📊 검색 결과: ${filtered.length}개`, filtered.map(r => r.name));
      
      setFilteredRegions(filtered);
      setShowSuggestions(true);
    } else {
      setFilteredRegions([]);
      setShowSuggestions(false);
    }
  }, [recommendedRegions, matchChosung]);

  // 검색 핸들러 (useCallback)
  const handleSearch = useCallback((e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const searchTerm = searchQuery.trim();
      
      const matchedRegions = recommendedRegions.filter(region => {
        const matchesName = region.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesChosung = matchChosung(region.name, searchTerm);
        return matchesName || matchesChosung;
      });
      
      if (matchedRegions.length > 0) {
        const targetRegion = matchedRegions[0];
        
        if (!recentSearches.includes(targetRegion.name)) {
          setRecentSearches([targetRegion.name, ...recentSearches.slice(0, 3)]);
        }
        
        navigate(`/region/${targetRegion.name}`, { state: { region: { name: targetRegion.name } } });
        
        setSearchQuery('');
        setShowSuggestions(false);
      } else {
        alert('검색 결과가 없습니다. 다른 검색어를 입력해주세요.');
      }
    }
  }, [searchQuery, recommendedRegions, matchChosung, recentSearches, navigate]);

  // 자동완성 항목 클릭 (useCallback)
  const handleSuggestionClick = useCallback((regionName) => {
    setSearchQuery(regionName);
    setShowSuggestions(false);
    
    if (!recentSearches.includes(regionName)) {
      setRecentSearches([regionName, ...recentSearches.slice(0, 3)]);
    }
    
    navigate(`/region/${regionName}`, { state: { region: { name: regionName } } });
  }, [recentSearches, navigate]);

  const handleRecentSearchClick = useCallback((search) => {
    navigate(`/region/${search}`, { state: { region: { name: search } } });
  }, [navigate]);

  const handleClearRecentSearches = useCallback(() => {
    if (window.confirm('최근 검색어를 모두 삭제하시겠습니까?')) {
      setRecentSearches([]);
    }
  }, []);

  const handleRegionClick = useCallback((regionName) => {
    navigate(`/region/${regionName}`, { state: { region: { name: regionName } } });
  }, [navigate]);

  // 마우스 드래그 스크롤 핸들러 (useCallback)
  const handleMouseDown = useCallback((e, scrollRef) => {
    setIsDragging(true);
    setHasMoved(false);
    setCurrentScrollRef(scrollRef);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
    scrollRef.current.style.cursor = 'grabbing';
    scrollRef.current.style.userSelect = 'none';
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !currentScrollRef) return;
    e.preventDefault();
    const x = e.pageX - currentScrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.2;
    
    if (Math.abs(walk) > 5) {
      setHasMoved(true);
    }
    
    if (currentScrollRef.current) {
      currentScrollRef.current.scrollLeft = scrollLeft - walk;
    }
  }, [isDragging, currentScrollRef, startX, scrollLeft]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    if (currentScrollRef) {
      currentScrollRef.current.style.cursor = 'grab';
      currentScrollRef.current.style.userSelect = 'auto';
    }
    setCurrentScrollRef(null);
  }, [currentScrollRef]);

  const handleMouseLeave = useCallback(() => {
    if (isDragging && currentScrollRef) {
      currentScrollRef.current.style.cursor = 'grab';
      currentScrollRef.current.style.userSelect = 'auto';
    }
    setIsDragging(false);
    setCurrentScrollRef(null);
  }, [isDragging, currentScrollRef]);

  const handleRegionClickWithDragCheck = useCallback((regionName) => {
    if (!hasMoved) {
      handleRegionClick(regionName);
    }
  }, [hasMoved, handleRegionClick]);

  const handleRecentSearchClickWithDragCheck = useCallback((search) => {
    if (!hasMoved) {
      handleRecentSearchClick(search);
    }
  }, [hasMoved, handleRecentSearchClick]);


  // URL 파라미터 확인
  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      setSearchQuery(query);
    }
  }, [searchParams]);

  // 지역별 대표 사진 로드 (자동 업데이트 제거)
  useEffect(() => {
    loadRegionPhotos();
    
    // 게시물 업데이트 이벤트 리스너
    const handlePostsUpdate = () => {
      console.log('🔄 검색 화면 - 게시물 업데이트 감지');
      setTimeout(() => {
        console.log('📸 검색 화면 - 지역 사진 새로고침 시작');
        loadRegionPhotos();
        console.log('✅ 검색 화면 - 지역 사진 새로고침 완료');
      }, 200); // 데이터 저장 완료 대기
    };
    
    window.addEventListener('postsUpdated', handlePostsUpdate);
    window.addEventListener('newPostsAdded', handlePostsUpdate);
    
    return () => {
      window.removeEventListener('postsUpdated', handlePostsUpdate);
      window.removeEventListener('newPostsAdded', handlePostsUpdate);
    };
  }, [loadRegionPhotos]);

  // 외부 클릭 시 자동완성 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="screen-layout text-text-light dark:text-text-dark bg-background-light dark:bg-background-dark">
      <div className="screen-content">
        {/* 헤더 */}
        <div className="screen-header flex items-center p-4 justify-between bg-white dark:bg-gray-900 shadow-sm relative z-50">
          <button 
            onClick={() => navigate(-1)}
            className="flex size-12 shrink-0 items-center justify-center text-[#1c140d] dark:text-background-light hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-2xl">arrow_back</span>
          </button>
          <h1 className="text-[#1c140d] dark:text-background-light text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">
            LiveJourney
          </h1>
          <div className="flex w-12 items-center justify-end"></div>
        </div>

        {/* 메인 컨텐츠 */}
        <div className="screen-body">
          {/* 검색창 + 결과 영역 - sticky */}
          <div className="px-4 py-3 sticky top-16 z-30 bg-white dark:bg-gray-900 relative">
          <form onSubmit={handleSearch}>
            <label className="flex flex-col min-w-40 h-14 w-full">
              <div className="flex w-full flex-1 items-stretch rounded-full h-full">
                <div className="text-primary flex border-none bg-background-light dark:bg-[#2F2418] items-center justify-center w-14 rounded-l-full border-r-0 ring-1 ring-inset ring-black/10 dark:ring-white/10 shadow-sm">
                  <span className="material-symbols-outlined">search</span>
                </div>
                <input
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden text-[#1c140d] dark:text-background-light focus:outline-0 focus:ring-0 border-none bg-background-light dark:bg-[#2F2418] focus:border-none h-full placeholder:text-[#9e7147] dark:placeholder:text-gray-500 px-4 rounded-r-full border-l-0 pl-2 text-base font-normal leading-normal ring-1 ring-inset ring-black/10 dark:ring-white/10 shadow-sm ring-l-0"
                  placeholder="지역 검색 (예: ㄱ, ㅅ, 서울, 부산)"
                  value={searchQuery}
                  onChange={handleSearchInput}
                  onFocus={() => {
                    if (searchQuery.trim() && filteredRegions.length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                />
              </div>
            </label>
          </form>

          {/* 검색 결과 - 추천 지역 위에 오버레이로 표시 */}
          {showSuggestions && (filteredRegions.length > 0 || searchQuery.trim()) && (
            <div 
              ref={searchContainerRef} 
              className="mt-3 absolute left-4 right-4 z-[100]"
              style={{ top: 'calc(100% + 12px)' }}
            >
              {filteredRegions.length > 0 ? (
                <div 
                  className="bg-white dark:bg-[#2F2418] rounded-2xl shadow-2xl ring-2 ring-primary/30 dark:ring-primary/50 overflow-y-auto"
                  style={{ maxHeight: 'calc(60px * 6)' }}
                >
                  {filteredRegions.map((region) => (
                    <div
                      key={region.id}
                      onClick={() => handleSuggestionClick(region.name)}
                      className="flex items-center gap-3 px-4 py-4 hover:bg-gray-50 dark:hover:bg-[#3a2d1f] cursor-pointer transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0 h-[60px]"
                    >
                      <span className="material-symbols-outlined text-primary">location_on</span>
                      <span className="text-[#1c140d] dark:text-background-light font-semibold text-base">
                        {region.name}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white dark:bg-[#2F2418] rounded-2xl shadow-2xl ring-2 ring-red-300 dark:ring-red-800 px-4 py-6 text-center">
                  <span className="material-symbols-outlined text-gray-400 text-4xl mb-2">search_off</span>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">검색 결과가 없습니다</p>
                  <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">다른 검색어를 입력해주세요</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 추천 지역 */}
        <h2 className={`text-[#1c140d] dark:text-background-light text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5 ${showSuggestions ? 'opacity-30' : ''}`}>
          추천 지역
        </h2>

        {topRegions.length === 0 ? (
          <div className={`px-4 py-12 text-center ${showSuggestions ? 'opacity-30' : ''}`}>
            <span className="material-symbols-outlined text-gray-400 text-6xl mb-4">explore</span>
            <p className="text-gray-600 dark:text-gray-400 text-base font-bold mb-2">
              아직 추천할 지역이 없어요
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-sm">
              사진이 올라오면 인기 지역을 추천해드릴게요
            </p>
          </div>
        ) : (
          <div 
            ref={recommendedScrollRef}
            onMouseDown={(e) => handleMouseDown(e, recommendedScrollRef)}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            className={`flex overflow-x-scroll overflow-y-hidden [-ms-scrollbar-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory scroll-smooth ${showSuggestions ? 'opacity-30 pointer-events-none' : ''}`}
            style={{ 
              scrollBehavior: 'smooth', 
              WebkitOverflowScrolling: 'touch',
              scrollSnapType: 'x mandatory',
              scrollPaddingLeft: '16px'
            }}
          >
            <div className="flex items-stretch px-4 gap-3 pb-2">
              {topRegions.map((region) => {
                const displayImage = region.image;
                
                return (
                  <div 
                    key={region.name} 
                    className="flex h-full flex-col gap-2 rounded-lg w-[280px] flex-shrink-0 cursor-pointer snap-start select-none"
                    style={{ scrollSnapAlign: 'start', scrollSnapStop: 'always' }}
                    onClick={() => handleRegionClickWithDragCheck(region.name)}
                  >
                    <div 
                      className="relative w-full bg-center bg-no-repeat aspect-[4/3] bg-cover rounded-lg overflow-hidden hover:opacity-90 transition-opacity shadow-md"
                      style={{ backgroundImage: `url("${displayImage}")` }}
                    >
                      {/* 그라데이션 오버레이 */}
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.3))' }}></div>
                      
                      
                      {/* 좌측하단: 지역 이름 + 위치정보 + 업로드시간 */}
                      <div style={{ 
                        position: 'absolute', 
                        left: 0, 
                        bottom: 0, 
                        right: 0, 
                        padding: '12px', 
                        background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
                        zIndex: 10
                      }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <p style={{ 
                            color: 'white', 
                            fontSize: '16px', 
                            fontWeight: 'bold', 
                            lineHeight: '1.2',
                            textShadow: '0 2px 8px rgba(0,0,0,0.8)',
                            margin: 0
                          }}>
                            {region.name}
                          </p>
                          {region.detailedLocation && (
                            <p style={{ 
                              color: 'white', 
                              fontSize: '13px', 
                              fontWeight: 'bold', 
                              lineHeight: '1.2',
                              textShadow: '0 2px 8px rgba(0,0,0,0.8)',
                              margin: 0
                            }}>
                              {region.detailedLocation}
                            </p>
                          )}
                          {region.time && (
                            <p style={{ 
                              color: 'rgba(255,255,255,0.9)', 
                              fontSize: '12px', 
                              fontWeight: '600', 
                              lineHeight: '1.2',
                              textShadow: '0 2px 8px rgba(0,0,0,0.8)',
                              margin: 0
                            }}>
                              {region.time}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 최근 검색 지역 */}
        <div className={`flex items-baseline justify-between px-4 pb-3 pt-8 ${showSuggestions ? 'opacity-30' : ''}`}>
          <h2 className="text-[#1c140d] dark:text-background-light text-[22px] font-bold leading-tight tracking-[-0.015em]">
            최근 검색지역
          </h2>
          <button 
            onClick={handleClearRecentSearches}
            className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
          >
            지우기
          </button>
        </div>

        {recentSearches.length === 0 ? (
          <div className={`px-4 pb-8 ${showSuggestions ? 'opacity-30' : ''}`}>
            <p className="text-sm text-gray-500 dark:text-gray-400">최근 검색한 지역이 없습니다.</p>
          </div>
        ) : (
          <div 
            ref={recentScrollRef}
            onMouseDown={(e) => handleMouseDown(e, recentScrollRef)}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            className={`flex overflow-x-scroll overflow-y-hidden [-ms-scrollbar-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory pb-8 scroll-smooth ${showSuggestions ? 'opacity-30 pointer-events-none' : ''}`}
            style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}
          >
            <div className="flex items-center px-4 gap-2">
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => handleRecentSearchClickWithDragCheck(search)}
                  className={`flex-shrink-0 cursor-pointer items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition-colors snap-start select-none ${
                    index === 0
                      ? 'bg-primary/20 dark:bg-primary/30 text-primary dark:text-[#FFC599]'
                      : 'bg-background-light dark:bg-[#2F2418] text-[#1c140d] dark:text-background-light ring-1 ring-inset ring-black/10 dark:ring-white/10 shadow-sm hover:bg-primary/10'
                  }`}
                >
                  <span>{search}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default SearchScreen;










































