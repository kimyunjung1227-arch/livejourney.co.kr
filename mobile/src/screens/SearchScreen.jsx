import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/styles';
import { getRegionDefaultImage, getRegionDisplayImage } from '../utils/regionDefaultImages';
import { filterRecentPosts } from '../utils/timeUtils';
import { ScreenLayout, ScreenContent, ScreenHeader, ScreenBody } from '../components/ScreenLayout';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SearchScreen = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredRegions, setFilteredRegions] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [regionRepresentativePhotos, setRegionRepresentativePhotos] = useState({});

  // 추천 지역 데이터 (메모이제이션)
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

  // 계절별 추천 지역 (사진이 많은 순 + 계절 가중치)
  const topRegions = useMemo(() => {
    // 현재 계절 감지
    const month = new Date().getMonth() + 1;
    let currentSeason = '';
    let seasonRegions = [];
    
    if (month >= 3 && month <= 5) {
      // 봄: 벚꽃, 꽃
      currentSeason = '봄';
      seasonRegions = ['진해', '여수', '제주', '서울', '부산', '창원', '거제'];
    } else if (month >= 6 && month <= 8) {
      // 여름: 바다, 해변
      currentSeason = '여름';
      seasonRegions = ['부산', '제주', '강릉', '속초', '여수', '통영', '거제', '포항'];
    } else if (month >= 9 && month <= 11) {
      // 가을: 단풍
      currentSeason = '가을';
      seasonRegions = ['설악산', '속초', '내장산', '정읍', '오대산', '평창', '가평', '춘천'];
    } else {
      // 겨울: 눈, 스키
      currentSeason = '겨울';
      seasonRegions = ['평창', '태백', '설악산', '속초', '강릉', '제주', '대관령'];
    }
    
    // 사진이 있는 지역들
    const allRegionsWithPhotos = Object.entries(regionRepresentativePhotos)
      .filter(([_, photo]) => photo.hasUploadedPhoto && photo.count > 0)
      .map(([regionName, photo]) => {
        // 계절 가중치 계산 (계절 추천 지역이면 가중치 추가)
        const seasonBonus = seasonRegions.includes(regionName) ? photo.count * 0.5 : 0;
        const weightedScore = photo.count + seasonBonus;
        
        return {
        name: regionName,
          ...photo,
          weightedScore
        };
      });
    
    // 가중치 순으로 정렬
    allRegionsWithPhotos.sort((a, b) => b.weightedScore - a.weightedScore);
    
    // 상위 4개 선택
    const topRegionsWithPhotos = allRegionsWithPhotos.slice(0, 4).map(({ weightedScore, ...region }) => region);
    
    // 사진이 있는 지역이 4개 미만이면 계절별 기본 지역으로 채우기
    if (topRegionsWithPhotos.length < 4) {
      const usedRegionNames = new Set(topRegionsWithPhotos.map(r => r.name));
      const defaultRegions = seasonRegions
        .filter(regionName => !usedRegionNames.has(regionName))
        .slice(0, 4 - topRegionsWithPhotos.length)
        .map(regionName => {
          const region = recommendedRegions.find(r => r.name === regionName);
          return {
            name: regionName,
            image: region?.image || getRegionDefaultImage(regionName),
            category: '추천 장소',
            detailedLocation: `${regionName}의 아름다운 풍경`,
            count: 0,
            time: null,
            hasUploadedPhoto: false
          };
        });
      
      // 기본 지역도 없으면 전체 지역에서 선택
      if (defaultRegions.length < 4 - topRegionsWithPhotos.length) {
        const remainingCount = 4 - topRegionsWithPhotos.length - defaultRegions.length;
        const additionalRegions = recommendedRegions
          .filter(r => !usedRegionNames.has(r.name) && !defaultRegions.some(d => d.name === r.name))
          .slice(0, remainingCount)
          .map(region => ({
            name: region.name,
            image: getRegionDefaultImage(region.name),
            category: '추천 장소',
            detailedLocation: `${region.name}의 아름다운 풍경`,
            count: 0,
            time: null,
            hasUploadedPhoto: false
          }));
        
        return [...topRegionsWithPhotos, ...defaultRegions, ...additionalRegions].slice(0, 4);
      }
      
      return [...topRegionsWithPhotos, ...defaultRegions].slice(0, 4);
    }
    
    return topRegionsWithPhotos;
  }, [regionRepresentativePhotos, recommendedRegions]);

  // 한글 초성 추출 함수
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

  // 초성 매칭 함수
  const matchChosung = useCallback((text, search) => {
    const textChosung = getChosung(text);
    const searchChosung = getChosung(search);
    
    const matches = textChosung.includes(searchChosung) || textChosung.includes(search);
    return matches;
  }, [getChosung]);

  // 지역별 대표 사진 로드
  const loadRegionPhotos = useCallback(async () => {
    try {
      const uploadedPostsJson = await AsyncStorage.getItem('uploadedPosts');
      let uploadedPosts = uploadedPostsJson ? JSON.parse(uploadedPostsJson) : [];
      
      // 2일 이상 된 게시물 필터링
      uploadedPosts = filterRecentPosts(uploadedPosts, 2);
      
      const photosByRegion = {};

      recommendedRegions.forEach(region => {
        const regionName = region.name;
        
        const regionPosts = uploadedPosts.filter(post => {
          const postLocation = post.location || '';
          return postLocation.includes(regionName) || 
                 regionName.includes(postLocation) ||
                 postLocation === regionName;
        });
        
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
    } catch (error) {
      console.error('지역별 대표 사진 로드 실패:', error);
    }
  }, [recommendedRegions]);

  // 검색어 입력 핸들러
  const handleSearchInput = useCallback((value) => {
    setSearchQuery(value);
    
    if (value.trim()) {
      const searchTerm = value.toLowerCase();
      const filtered = recommendedRegions.filter(region => {
        const matchesName = region.name.toLowerCase().includes(searchTerm);
        const matchesChosung = matchChosung(region.name, value);
        return matchesName || matchesChosung;
      });
      
      setFilteredRegions(filtered);
      setShowSuggestions(true);
    } else {
      setFilteredRegions([]);
      setShowSuggestions(false);
    }
  }, [recommendedRegions, matchChosung]);

  // 검색 핸들러
  const handleSearch = useCallback(() => {
    if (searchQuery.trim()) {
      const searchTerm = searchQuery.trim();
      
      const matchedRegions = recommendedRegions.filter(region => {
        const matchesName = region.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesChosung = matchChosung(region.name, searchTerm);
        return matchesName || matchesChosung;
      });
      
      if (matchedRegions.length > 0) {
        const targetRegion = matchedRegions[0];
        
        const updatedRecentSearches = recentSearches.includes(targetRegion.name)
          ? recentSearches
          : [targetRegion.name, ...recentSearches.slice(0, 3)];
        setRecentSearches(updatedRecentSearches);
        AsyncStorage.setItem('recentSearches', JSON.stringify(updatedRecentSearches));
        
        navigation.navigate('RegionDetail', {
          regionName: targetRegion.name,
          region: { name: targetRegion.name }
        });
        
        setSearchQuery('');
        setShowSuggestions(false);
      } else {
        Alert.alert('알림', '검색 결과가 없습니다. 다른 검색어를 입력해주세요.');
      }
    }
  }, [searchQuery, recommendedRegions, matchChosung, recentSearches, navigation]);

  // 자동완성 항목 클릭
  const handleSuggestionClick = useCallback((regionName) => {
    setSearchQuery(regionName);
    setShowSuggestions(false);
    
    const updatedRecentSearches = recentSearches.includes(regionName)
      ? recentSearches
      : [regionName, ...recentSearches.slice(0, 3)];
    setRecentSearches(updatedRecentSearches);
    AsyncStorage.setItem('recentSearches', JSON.stringify(updatedRecentSearches));
    
    navigation.navigate('RegionDetail', {
      regionName: regionName,
      region: { name: regionName }
    });
  }, [recentSearches, navigation]);

  const handleRecentSearchClick = useCallback((search) => {
    navigation.navigate('RegionDetail', {
      regionName: search,
      region: { name: search }
    });
  }, [navigation]);

  const handleClearRecentSearches = useCallback(() => {
    Alert.alert(
      '최근 검색어 삭제',
      '최근 검색어를 모두 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            setRecentSearches([]);
            AsyncStorage.removeItem('recentSearches');
          }
        }
      ]
    );
  }, []);

  // 개별 최근 검색어 삭제
  const handleDeleteRecentSearch = useCallback((searchToDelete, event) => {
    // 이벤트 전파 중지 (버튼 클릭 시 지역 이동 방지)
    if (event) {
      event.stopPropagation();
    }
    
    const updatedSearches = recentSearches.filter(search => search !== searchToDelete);
    setRecentSearches(updatedSearches);
    AsyncStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
  }, [recentSearches]);

  const handleRegionClick = useCallback((regionName) => {
    navigation.navigate('RegionDetail', {
      regionName: regionName,
      region: { name: regionName }
    });
  }, [navigation]);

  // 초기 데이터 로드
  useEffect(() => {
    loadRegionPhotos();
    
    // 최근 검색어 로드
    AsyncStorage.getItem('recentSearches').then(value => {
      if (value) {
        setRecentSearches(JSON.parse(value));
      }
    });
    
    // 게시물 업데이트 이벤트 리스너
    const handlePostsUpdate = () => {
      console.log('🔄 검색 화면 - 게시물 업데이트 이벤트 수신');
      setTimeout(() => {
        loadRegionPhotos();
      }, 100);
    };
    
    // React Native에서는 DeviceEventEmitter를 사용하거나 AsyncStorage 변경 감지
    // 간단하게 주기적으로 확인하는 방식 사용
    const checkInterval = setInterval(() => {
      // AsyncStorage 변경 감지를 위한 폴링 (1초마다)
      loadRegionPhotos();
    }, 1000);
    
    return () => {
      clearInterval(checkInterval);
    };
  }, [loadRegionPhotos]);

  return (
    <ScreenLayout>
      <ScreenContent scrollable={false}>
        {/* 헤더 - 웹과 동일한 구조 */}
        <ScreenHeader>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>지역 검색</Text>
            <View style={styles.headerPlaceholder} />
          </View>
        </ScreenHeader>

        {/* 검색창 - 헤더 바로 아래 */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputWrapper}>
              <View style={styles.searchIconContainer}>
                <Ionicons name="search" size={20} color={COLORS.primary} />
              </View>
              <TextInput
                style={styles.searchInput}
                placeholder="제주"
                placeholderTextColor="#9e7147"
                value={searchQuery}
                onChangeText={handleSearchInput}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
              />
            </View>

            {/* 검색 결과 - 추천 지역 위에 오버레이로 표시 (웹과 동일) */}
            {showSuggestions && (filteredRegions.length > 0 || searchQuery.trim()) && (
              <View style={styles.suggestionsContainer}>
              {filteredRegions.length > 0 ? (
                <View style={styles.suggestionsList}>
                  {filteredRegions.map((region) => (
                    <TouchableOpacity
                      key={region.id}
                      style={styles.suggestionItem}
                      onPress={() => handleSuggestionClick(region.name)}
                    >
                      <Ionicons name="location" size={20} color={COLORS.primary} />
                      <Text style={styles.suggestionText}>{region.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.noResultsContainer}>
                  <Ionicons name="search-outline" size={48} color={COLORS.textSubtle} />
                  <Text style={styles.noResultsText}>검색 결과가 없습니다</Text>
                  <Text style={styles.noResultsSubtext}>다른 검색어를 입력해주세요</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* 메인 컨텐츠 */}
        <ScreenBody>
        {/* 최근 검색한 지역 - 추천 지역 위에 배치 */}
        {recentSearches.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>최근 검색한 지역</Text>
              <TouchableOpacity onPress={handleClearRecentSearches}>
                <Text style={styles.clearButton}>지우기</Text>
              </TouchableOpacity>
          </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recentScroll}
            >
              {recentSearches.map((search, index) => {
                const secondaryColors = [
                  COLORS.secondary2,  // Green
                  COLORS.secondary5,  // Cyan
                  COLORS.secondary3,  // Pink
                  COLORS.secondary6,  // Indigo
                ];
                const secondaryColorsSoft = [
                  COLORS.secondary2Soft,
                  COLORS.secondary5Soft,
                  COLORS.secondary3Soft,
                  COLORS.secondary6Soft,
                ];
                const colorIndex = index % secondaryColors.length;
                const badgeColor = secondaryColors[colorIndex];
                const badgeColorSoft = secondaryColorsSoft[colorIndex];
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.recentSearchButton,
                      index === 0 && [
                        styles.recentSearchButtonActive,
                        { backgroundColor: badgeColorSoft, borderColor: badgeColor }
                      ]
                    ]}
                    onPress={() => handleRecentSearchClick(search)}
                  >
                    <Text style={[
                      styles.recentSearchText,
                      index === 0 && [
                        styles.recentSearchTextActive,
                        { color: badgeColor }
                      ]
                    ]}>
                      {search}
                    </Text>
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDeleteRecentSearch(search);
                      }}
                      style={styles.deleteButton}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="close-circle" size={18} color={COLORS.textSubtle} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
          )}

        {/* 추천 지역 - 2x2 그리드로 표시 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>추천 지역</Text>
          
          <View style={styles.recommendedGrid}>
            {topRegions.map((region, index) => {
              const displayImage = region.image;
              
              return (
                <TouchableOpacity
                  key={`${region.name}-${index}`}
                  style={styles.regionGridCard}
                  onPress={() => handleRegionClick(region.name)}
                  activeOpacity={0.9}
                >
                  <Image
                    source={{ uri: displayImage }}
                    style={styles.regionGridImage}
                    resizeMode="cover"
                  />
                  {/* 그라데이션 오버레이 - 랜딩 페이지와 동일 */}
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.7)']}
                    style={styles.regionGridOverlay}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 0, y: 1 }}
                  />
                  
                  {/* 하단 지역명 */}
                  <View style={styles.regionGridInfo}>
                    <Text style={styles.regionGridName}>{region.name}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        </ScreenBody>
      </ScreenContent>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, // p-4 = 16px
    paddingVertical: SPACING.md, // p-4 = 16px
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md, // p-4 = 16px
    paddingTop: SPACING.md, // p-4 = 16px
    paddingBottom: SPACING.sm, // pb-2 = 8px
    backgroundColor: COLORS.backgroundLight, // bg-white
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight + '80', // border-border-light/50
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2, // shadow-sm
    zIndex: 20,
  },
  backButton: {
    width: 48, // size-12 = 48px
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8, // rounded-lg
  },
  headerTitle: {
    fontSize: 18, // 이미지에 맞게 조정
    fontWeight: 'bold',
    color: '#1c140d', // text-[#1c140d]
    letterSpacing: -0.3,
    lineHeight: 22,
    flex: 1,
    textAlign: 'center',
  },
  headerPlaceholder: {
    width: 48, // w-12 = 48px
  },
  searchContainer: {
    paddingHorizontal: SPACING.md, // px-4 = 16px
    paddingTop: 0, // 헤더 바로 아래에 붙이기
    paddingBottom: 16, // pb-4 = 16px
    backgroundColor: COLORS.backgroundLight, // bg-white
    position: 'relative',
    zIndex: 30,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background, // bg-background-light (웹과 동일)
    borderRadius: 999, // rounded-full (웹과 동일)
    height: 56, // h-14 = 56px (웹과 동일)
    borderWidth: 0, // ring으로 처리 (웹과 동일)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1, // shadow-sm (웹과 동일)
  },
  searchIconContainer: {
    width: 56, // w-14 = 56px (웹과 동일)
    height: 56, // h-14 = 56px (웹과 동일)
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 999, // rounded-l-full (웹과 동일)
    borderBottomLeftRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)', // ring-1 ring-inset ring-black/10 (웹과 동일)
    borderRightWidth: 0,
  },
  searchInput: {
    flex: 1,
    fontSize: 16, // text-base = 16px (웹과 동일)
    fontWeight: 'normal', // font-normal (웹과 동일)
    color: '#1c140d', // text-[#1c140d] (웹과 동일)
    paddingLeft: SPACING.sm, // pl-2 = 8px (웹과 동일)
    paddingRight: SPACING.md, // px-4 = 16px (웹과 동일)
    height: 56, // h-14 = 56px (웹과 동일)
    borderTopRightRadius: 999, // rounded-r-full (웹과 동일)
    borderBottomRightRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)', // ring-1 ring-inset ring-black/10 (웹과 동일)
    borderLeftWidth: 0,
  },
  suggestionsContainer: {
    marginTop: SPACING.md,
    position: 'absolute', // 웹과 동일: 추천 지역 위에 오버레이
    top: '100%', // 검색창 아래
    left: 0,
    right: 0,
    zIndex: 50, // 추천 지역 위에 표시
  },
  suggestionsList: {
    backgroundColor: COLORS.backgroundLight, // bg-white
    borderRadius: 16, // rounded-2xl
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.primary + '4D', // ring-2 ring-primary/30
    maxHeight: 360, // maxHeight: 'calc(60px * 6)'
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md, // px-4 = 16px
    paddingVertical: SPACING.md, // py-4 = 16px
    gap: 12, // gap-3 = 12px
    height: 60, // h-[60px] = 60px
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border, // border-gray-100
  },
  suggestionText: {
    fontSize: 16, // text-base = 16px
    fontWeight: '600', // font-semibold
    color: COLORS.text, // text-[#1c140d]
  },
  noResultsContainer: {
    backgroundColor: COLORS.backgroundLight, // bg-white
    borderRadius: 16, // rounded-2xl
    paddingHorizontal: SPACING.md, // px-4 = 16px
    paddingVertical: SPACING.lg, // py-6 = 24px
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FCA5A5', // ring-2 ring-red-300
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8, // shadow-2xl
  },
  noResultsText: {
    marginTop: SPACING.sm, // mb-2 (아이콘 아래)
    fontSize: 14, // text-sm = 14px
    color: COLORS.textSecondary, // text-gray-500
    marginBottom: SPACING.xs,
  },
  noResultsSubtext: {
    fontSize: 12, // text-xs = 12px
    color: COLORS.textSubtle, // text-gray-400
    marginTop: SPACING.xs, // mt-1 = 4px
  },
  section: {
    paddingTop: 20,
    paddingHorizontal: SPACING.lg, // 여백 증가
    paddingBottom: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  sectionTitle: {
    fontSize: 18, // 이미지에 맞게 조정
    fontWeight: 'bold',
    color: COLORS.text, // text-[#1c140d]
    letterSpacing: -0.3,
    lineHeight: 22,
    paddingBottom: 12, // pb-3 = 12px
    paddingHorizontal: 0, // 섹션에서 이미 padding 있음
  },
  clearButton: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  emptySection: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyTitle: {
    marginTop: SPACING.md, // mb-4 (아이콘 아래)
    fontSize: 16, // text-base = 16px
    fontWeight: 'bold',
    color: COLORS.text, // text-gray-600
    marginBottom: SPACING.sm, // mb-2 = 8px
  },
  emptySubtitle: {
    fontSize: 14, // text-sm = 14px
    color: COLORS.textSubtle, // text-gray-400
    textAlign: 'center',
  },
  recommendedScroll: {
    paddingVertical: SPACING.sm,
    gap: SPACING.md,
  },
  regionCard: {
    width: 280,
    height: 220, // 세로로 더 긴 직사각형 비율
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: SPACING.md,
    position: 'relative',
  },
  regionImage: {
    width: '100%',
    height: '100%',
  },
  // 그라데이션 오버레이 - 웹 버전과 동일
  gradientOverlayTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '30%',
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 1,
  },
  gradientOverlayMiddle: {
    position: 'absolute',
    top: '30%',
    left: 0,
    right: 0,
    height: '20%',
    backgroundColor: 'rgba(0,0,0,0.1)',
    zIndex: 1,
  },
  gradientOverlayBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(0,0,0,0.8)',
    zIndex: 1,
  },
  regionCategoryIcon: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 1,
  },
  regionCategoryEmoji: {
    fontSize: 24,
  },
  regionInfoContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  regionInfoGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  regionInfo: {
    padding: 12, // padding: '12px'
    gap: 4, // gap: '4px'
  },
  regionName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    lineHeight: 19.2, // lineHeight: '1.2'
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    marginBottom: 0,
  },
  regionLocation: {
    fontSize: 13,
    fontWeight: 'bold',
    color: 'white',
    lineHeight: 15.6, // lineHeight: '1.2'
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    marginTop: 4,
    marginBottom: 0,
  },
  regionTime: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 14.4, // lineHeight: '1.2'
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    marginTop: 4,
  },
  emptyRecent: {
    paddingVertical: SPACING.lg,
  },
  emptyRecentText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  recentScroll: {
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  recentSearchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 999,
    backgroundColor: COLORS.borderLight,
    marginRight: SPACING.sm,
    gap: 6,
  },
  recentSearchButtonActive: {
    // backgroundColor와 borderColor는 동적으로 설정됨
    borderWidth: 2,
  },
  recentSearchText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  recentSearchTextActive: {
    // color는 동적으로 설정됨
    fontWeight: '600',
  },
  deleteButton: {
    marginLeft: 4,
    padding: 2,
  },
  // 추천 지역 2x2 그리드 스타일 (랜딩 페이지와 동일)
  recommendedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12, // 랜딩 페이지와 동일: gap: 12px
    paddingHorizontal: 0, // 섹션에서 이미 padding 있음
    paddingVertical: SPACING.sm,
  },
  regionGridCard: {
    width: (SCREEN_WIDTH - SPACING.lg * 2 - 12) / 2, // 2열 그리드 (gap 12px 반영)
    height: (SCREEN_WIDTH - SPACING.lg * 2 - 12) / 2, // 정사각형
    borderRadius: 12, // 랜딩 페이지와 동일: border-radius: 12px
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2, // box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1)
  },
  regionGridImage: {
    width: '100%',
    height: '100%',
  },
  regionGridOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '100%', // 그라데이션이 전체 높이에 적용되도록
    zIndex: 1,
  },
  regionGridInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 12, // 랜딩 페이지와 동일: padding: 12px
    paddingHorizontal: 12,
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  regionGridName: {
    fontSize: 14, // 랜딩 페이지와 동일: font-size: 14px
    fontWeight: '700', // 랜딩 페이지와 동일: font-weight: 700
    color: 'white',
    textAlign: 'center',
  },
});

export default SearchScreen;
