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
  Keyboard,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/styles';
import { getRegionDefaultImage } from '../utils/regionDefaultImages';
import { filterRecentPosts, getTimeAgo } from '../utils/timeUtils';
import { getCombinedPosts } from '../utils/mockData';
import { ScreenLayout, ScreenContent, ScreenHeader, ScreenBody } from '../components/ScreenLayout';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 한글 초성 추출 함수
const getChosung = (str) => {
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
};

// 초성 매칭 함수
const matchChosung = (text, search) => {
  const textChosung = getChosung(text);
  const searchChosung = getChosung(search);
  return textChosung.includes(searchChosung) || textChosung.includes(search);
};

const DEFAULT_HASHTAGS = ['바다', '힐링', '맛집', '자연', '꽃', '일출', '카페', '여행', '휴양', '등산', '야경', '축제', '해변', '산', '전통', '한옥', '감귤', '벚꽃', '단풍', '도시'];

const SearchScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredRegions, setFilteredRegions] = useState([]);
  const [filteredHashtags, setFilteredHashtags] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [allPosts, setAllPosts] = useState([]);
  const [selectedHashtag, setSelectedHashtag] = useState(null);
  const [searchCount, setSearchCount] = useState(0);
  const [weatherData, setWeatherData] = useState({}); // 지역별 날씨 정보

  // 추천 지역 데이터 (메모이제이션)
  const recommendedRegions = useMemo(() => [
    { id: 1, name: '서울', keywords: ['도시', '쇼핑', '명동', '강남', '홍대', '경복궁', '궁궐', '한강', '야경', '카페', '맛집'] },
    { id: 2, name: '부산', keywords: ['바다', '해변', '해운대', '광안리', '야경', '횟집', '수산시장', '자갈치', '항구', '서핑'] },
    { id: 3, name: '대구', keywords: ['도시', '근대', '골목', '김광석길', '동성로', '쇼핑', '약령시', '팔공산', '치맥', '맥주'] },
    { id: 4, name: '인천', keywords: ['차이나타운', '짜장면', '월미도', '야경', '인천공항', '바다', '항구', '송도', '근대'] },
    { id: 5, name: '광주', keywords: ['도시', '무등산', '양동시장', '충장로', '예술', '문화', '민주화', '역사'] },
    { id: 6, name: '대전', keywords: ['도시', '과학', '엑스포', '성심당', '빵', '한밭수목원', '대청호', '계족산'] },
    { id: 7, name: '울산', keywords: ['공업', '항구', '대왕암공원', '간절곶', '일출', '고래', '울산대교', '태화강'] },
    { id: 8, name: '세종', keywords: ['행정', '정부', '신도시', '계획도시', '공원', '호수공원', '도담동'] },
    { id: 9, name: '수원', keywords: ['화성', '성곽', '수원갈비', '행궁', '화성행궁', '전통', '맛집'] },
    { id: 10, name: '용인', keywords: ['에버랜드', '놀이공원', '민속촌', '한국민속촌', '가족'] },
    { id: 11, name: '성남', keywords: ['도시', '판교', 'IT', '테크노', '카페'] },
    { id: 12, name: '고양', keywords: ['일산', '호수공원', '킨텍스', '전시', '꽃축제'] },
    { id: 13, name: '부천', keywords: ['도시', '만화박물관', '애니메이션', '영화'] },
    { id: 14, name: '안양', keywords: ['도시', '안양천', '예술공원'] },
    { id: 15, name: '파주', keywords: ['헤이리', '출판단지', '임진각', 'DMZ', '예술', '북카페'] },
    { id: 16, name: '평택', keywords: ['항구', '미군기지', '송탄'] },
    { id: 17, name: '화성', keywords: ['융건릉', '용주사', '제부도', '바다'] },
    { id: 18, name: '김포', keywords: ['공항', '김포공항', '한강', '애기봉'] },
    { id: 19, name: '광명', keywords: ['동굴', '광명동굴', 'KTX'] },
    { id: 20, name: '이천', keywords: ['도자기', '쌀', '온천', '세라피아'] },
    { id: 21, name: '양평', keywords: ['자연', '두물머리', '세미원', '힐링', '강', '수목원'] },
    { id: 22, name: '가평', keywords: ['남이섬', '쁘띠프랑스', '아침고요수목원', '자연', '힐링', '계곡'] },
    { id: 23, name: '포천', keywords: ['아트밸리', '허브아일랜드', '산정호수', '자연'] },
    { id: 24, name: '춘천', keywords: ['닭갈비', '호수', '남이섬', '소양강', '스카이워크', '맛집'] },
    { id: 25, name: '강릉', keywords: ['바다', '커피', '카페', '경포대', '정동진', '일출', '해변', '순두부'] },
    { id: 26, name: '속초', keywords: ['바다', '설악산', '산', '등산', '오징어', '수산시장', '아바이마을', '회'] },
    { id: 27, name: '원주', keywords: ['치악산', '등산', '산', '자연'] },
    { id: 28, name: '동해', keywords: ['바다', '해변', '추암', '촛대바위', '일출'] },
    { id: 29, name: '태백', keywords: ['산', '탄광', '눈꽃축제', '겨울', '스키'] },
    { id: 30, name: '삼척', keywords: ['바다', '동굴', '환선굴', '대금굴', '해변'] },
    { id: 31, name: '평창', keywords: ['스키', '겨울', '올림픽', '산', '용평'] },
    { id: 32, name: '양양', keywords: ['바다', '서핑', '해변', '낙산사', '하조대'] },
    { id: 33, name: '제주', keywords: ['섬', '바다', '한라산', '오름', '돌하르방', '흑돼지', '감귤', '휴양', '힐링'] },
    { id: 34, name: '서귀포', keywords: ['바다', '섬', '폭포', '정방폭포', '천지연', '감귤', '자연'] }
  ], []);

  // 추천 카드: 사용자가 올린 정보만 사용, 다양한 카테고리별 짧은 설명
  const diverseRegionCards = useMemo(() => {
    const cat = (s) => String(s || '').toLowerCase();
    const str = (arr) => (Array.isArray(arr) ? arr : []).map((x) => (typeof x === 'string' ? x : (x?.name || x?.label || ''))).join(' ');
    const groups = new Map();
    for (const post of allPosts) {
      const loc = post.location || post.placeName || '';
      const r = recommendedRegions.find((re) => loc.includes(re.name) || re.name.includes(loc));
      if (!r) continue;
      const c = cat(post.categoryName || post.category || '');
      const t = cat(str(post.tags) + ' ' + str(post.aiLabels));
      let type = '명소';
      if (/꽃|개화|bloom|flower|벚꽃|매화/.test(c + t)) type = '개화';
      else if (/맛집|음식|food|밥|식당/.test(c + t)) type = '맛집';
      else if (/카페|coffee|cafe|커피/.test(c + t)) type = '카페';
      else if (/바다|해변|beach|sea/.test(c + t)) type = '해변';
      else if (/산|등산|mountain/.test(c + t)) type = '등산';
      else if (/야경|night/.test(c + t)) type = '야경';
      else if (/일출|일몰|sunrise|sunset/.test(c + t)) type = '일출일몰';
      const key = `${r.name}|${type}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(post);
    }
    const cards = [];
    const labels = { 개화: '개화정보', 맛집: '맛집정보', 카페: '카페정보', 해변: '해변정보', 등산: '등산정보', 야경: '야경정보', 일출일몰: '일출일몰', 명소: '가볼만한 곳' };
    const bloomPcts = [70, 75, 80, 85, 90, 95];
    for (const [key, posts] of groups) {
      const [name, type] = key.split('|');
      const sorted = [...posts].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      const p = sorted[0];
      let shortDesc = `${name}의 필수 여행지`;
      if (type === '개화') shortDesc = `개화상태 ${bloomPcts[(name.length + posts.length) % bloomPcts.length]}% 이상`;
      else if (type === '맛집') shortDesc = '웨이팅 필수 맛집';
      else if (type === '카페') shortDesc = '추천 카페';
      else if (type === '해변') shortDesc = '아름다운 해변';
      else if (type === '등산') shortDesc = '등산 명소';
      else if (type === '야경') shortDesc = '야경이 예쁜 곳';

      cards.push({
        name,
        category: type,
        categoryLabel: labels[type] || '가볼만한 곳',
        image: p.image || (p.images && p.images[0]),
        shortDesc,
        count: posts.length,
        time: getTimeAgo(p.timestamp || p.createdAt),
      });
    }
    return cards.sort((a, b) => b.count - a.count).slice(0, 12);
  }, [allPosts, recommendedRegions]);

  // 해시태그 칩: 전체 게시물에서 태그 수집, 빈도순 상위 24개. 없으면 기본 인기 해시태그 사용
  const hashtagChips = useMemo(() => {
    const norm = (s) => String(s || '').replace(/^#+/, '').trim().toLowerCase();
    const getDisplay = (t) => (typeof t === 'string' ? t : (t?.name || t?.label || '')).replace(/^#+/, '').trim();
    const map = new Map();
    allPosts.forEach((p) => {
      const tags = [
        ...(p.tags || []).map((t) => (typeof t === 'string' ? t : (t?.name || t?.label || ''))),
        ...(p.aiLabels || []).map((l) => (typeof l === 'string' ? l : (l?.name || l?.label || '')))
      ].filter(Boolean);
      tags.forEach((raw) => {
        const n = norm(raw);
        if (!n || n.length < 2) return;
        if (!map.has(n)) map.set(n, { display: getDisplay(raw) || n, count: 0 });
        map.get(n).count += 1;
      });
    });
    const fromPosts = Array.from(map.entries())
      .map(([n, { display, count }]) => ({ key: n, display, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 24);
    if (fromPosts.length > 0) return fromPosts;
    return DEFAULT_HASHTAGS.map((d) => ({ key: d.toLowerCase(), display: d, count: 0 }));
  }, [allPosts]);

  // 선택된 해시태그에 해당하는 게시물 (웹과 동일)
  const hashtagPostResults = useMemo(() => {
    if (!selectedHashtag) return [];
    const norm = (s) => String(s || '').replace(/^#+/, '').trim().toLowerCase();
    const getPostTags = (p) => [
      ...(p.tags || []).map((t) => (typeof t === 'string' ? t : (t?.name || t?.label || ''))),
      ...(p.aiLabels || []).map((l) => (typeof l === 'string' ? l : (l?.name || l?.label || '')))
    ];
    const target = norm(selectedHashtag);
    return allPosts.filter((p) => {
      const pt = getPostTags(p).map(norm).filter(Boolean);
      return pt.some((pTag) => pTag === target || (pTag.includes(target) && target.length >= 2));
    });
  }, [allPosts, selectedHashtag]);

  const incrementSearchCount = useCallback(() => {
    const nextCount = searchCount + 1;
    setSearchCount(nextCount);
    AsyncStorage.setItem('searchCount', String(nextCount));
  }, [searchCount]);

  // 검색어 기준 지역 매칭·정렬: 완전일치 > 앞글자일치 > 포함 > 초성순
  const getMatchingRegions = useCallback((searchTerm, raw) => {
    if (!searchTerm || !raw) return [];
    return recommendedRegions
      .map((region) => {
        const name = region.name.toLowerCase();
        let rank = 99;
        if (name === searchTerm) rank = 0;
        else if (name.startsWith(searchTerm)) rank = 1;
        else if (name.includes(searchTerm)) rank = 2;
        else if (matchChosung(region.name, raw)) rank = 3;
        else return null;
        return { region, rank };
      })
      .filter(Boolean)
      .sort((a, b) => a.rank - b.rank || a.region.name.length - b.region.name.length)
      .map((x) => x.region);
  }, [recommendedRegions]);

  // 검색어 입력 핸들러: 지역 + 해시태그 자동완성
  const handleSearchInput = useCallback((value) => {
    setSearchQuery(value);
    if (value.trim()) {
      const raw = value.replace(/^#+/, '').trim();
      const searchTerm = raw.toLowerCase();

      // 지역 매칭 (웹과 동일한 랭킹 시스템)
      setFilteredRegions(getMatchingRegions(searchTerm, raw));

      // 해시태그 매칭
      const hMatched = (hashtagChips || []).filter(h =>
        h.key.includes(searchTerm) || h.display.toLowerCase().includes(searchTerm)
      );
      setFilteredHashtags(hMatched);
      setShowSuggestions(true);
    } else {
      setFilteredRegions([]);
      setFilteredHashtags([]);
      setShowSuggestions(false);
    }
  }, [getMatchingRegions, hashtagChips]);

  const handleSuggestionClick = useCallback((regionName) => {
    incrementSearchCount();
    setSearchQuery(regionName);
    setShowSuggestions(false);
    Keyboard.dismiss();

    const updated = recentSearches.includes(regionName) ? recentSearches : [regionName, ...recentSearches.slice(0, 3)];
    setRecentSearches(updated);
    AsyncStorage.setItem('recentSearches', JSON.stringify(updated));

    navigation.navigate('RegionDetail', { regionName, region: { name: regionName } });
  }, [recentSearches, navigation, incrementSearchCount]);

  const handleHashtagSuggestionClick = useCallback((display) => {
    incrementSearchCount();
    setSelectedHashtag(display);
    setSearchQuery('');
    setShowSuggestions(false);
    Keyboard.dismiss();
  }, [incrementSearchCount]);

  // 검색 핸들러
  const handleSearch = useCallback(() => {
    if (!searchQuery.trim()) return;
    incrementSearchCount();
    const raw = searchQuery.replace(/^#+/, '').trim();
    const searchTerm = raw.toLowerCase();

    // 1) 지역 먼저
    const matched = getMatchingRegions(searchTerm, raw);
    if (matched.length > 0) {
      handleSuggestionClick(matched[0].name);
      return;
    }

    // 2) 해시태그 매칭
    const hFound = (hashtagChips || []).find(h => h.key === searchTerm || h.display.toLowerCase() === searchTerm);
    if (hFound) {
      handleHashtagSuggestionClick(hFound.display);
      return;
    }

    Alert.alert('알림', '검색 결과가 없습니다.');
  }, [searchQuery, getMatchingRegions, hashtagChips, incrementSearchCount, handleSuggestionClick, handleHashtagSuggestionClick]);

  const handleClearRecentSearches = useCallback(() => {
    Alert.alert(
      '최근 검색어 삭제',
      '최근 검색어를 모두 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            setRecentSearches([]);
            await AsyncStorage.removeItem('recentSearches');
          }
        },
      ]
    );
  }, []);

  const handleDeleteRecentSearch = useCallback(async (searchToDelete) => {
    const updated = recentSearches.filter(s => s !== searchToDelete);
    setRecentSearches(updated);
    await AsyncStorage.setItem('recentSearches', JSON.stringify(updated));
  }, [recentSearches]);


  // 날씨 정보 가져오기 (Mock 데이터)
  const getWeatherForRegion = useCallback((regionName) => {
    const mockWeatherData = {
      '서울': { icon: '☀️', temperature: '23℃' },
      '부산': { icon: '🌤️', temperature: '25℃' },
      '제주': { icon: '🌧️', temperature: '20℃' },
      '인천': { icon: '☁️', temperature: '22℃' },
      '대전': { icon: '☀️', temperature: '24℃' },
      '대구': { icon: '☀️', temperature: '26℃' },
    };
    return mockWeatherData[regionName] || { icon: '☀️', temperature: '23℃' };
  }, []);

  // 지역별 날씨 정보 가져오기
  useEffect(() => {
    if (!diverseRegionCards || diverseRegionCards.length === 0) return;

    const weatherMap = {};
    diverseRegionCards.forEach((card) => {
      weatherMap[card.name] = getWeatherForRegion(card.name);
    });
    setWeatherData(weatherMap);
  }, [diverseRegionCards, getWeatherForRegion]);

  // 초기 데이터 로드 (전체 게시물, 최근 검색어, 검색 횟수)
  useEffect(() => {
    const loadData = async () => {
      try {
        const localPosts = await AsyncStorage.getItem('uploadedPosts');
        const parsed = JSON.parse(localPosts || '[]');
        setAllPosts(getCombinedPosts(Array.isArray(parsed) ? parsed : []));

        const savedRecentData = await AsyncStorage.getItem('recentSearches');
        if (savedRecentData) setRecentSearches(JSON.parse(savedRecentData));

        const count = await AsyncStorage.getItem('searchCount');
        if (count) setSearchCount(parseInt(count, 10));
      } catch (e) {
        console.error('데이터 로드 실패:', e);
      }
    };

    loadData();

    // 초기 검색어 처리 (초기화 시 한 번만)
    if (route.params?.initialQuery) {
      const q = route.params.initialQuery;
      setSearchQuery(q);
      if (q.startsWith('#')) {
        const tag = q.replace(/^#+/, '').trim();
        setSelectedHashtag(tag);
      }
    }

    // 데이터 변경 감지 (간소화된 방식)
    const interval = setInterval(async () => {
      const localPosts = await AsyncStorage.getItem('uploadedPosts');
      if (localPosts) {
        setAllPosts(getCombinedPosts(JSON.parse(localPosts)));
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <ScreenLayout style={{ backgroundColor: '#ffffff' }}>
      <ScreenContent scrollable={false}>
        {/* 헤더 - 웹과 동일 (최소화) */}
        <View style={styles.headerMinimal}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {/* 검색창 - 웹과 동일한 스타일 (고정) */}
        <View style={styles.searchContainer} ref={searchContainerRef}>
          <View style={styles.searchInputWrapper}>
            <Ionicons name="search" size={22} color={COLORS.primary} style={{ marginRight: 10 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="어디로 떠나볼까요?"
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={handleSearchInput}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
          </View>

          {/* 검색 결과 - 웹과 동일한 스타일 */}
          {showSuggestions && (filteredRegions.length > 0 || filteredHashtags.length > 0 || searchQuery.trim()) && (
            <View style={styles.suggestionsContainer}>
              {filteredRegions.length > 0 || filteredHashtags.length > 0 ? (
                <ScrollView style={{ maxHeight: 360 }} bounces={false}>
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
                  {filteredHashtags.length > 0 && (
                    <View>
                      {filteredRegions.length > 0 && <View style={styles.suggestionDivider} />}
                      <View style={styles.suggestionHeader}>
                        <Text style={styles.suggestionHeaderText}>해시태그</Text>
                      </View>
                      {filteredHashtags.map((h) => (
                        <TouchableOpacity
                          key={h.key}
                          style={styles.suggestionItem}
                          onPress={() => handleHashtagSuggestionClick(h.display)}
                        >
                          <Ionicons name="label" size={20} color={COLORS.primary} />
                          <Text style={styles.suggestionText}>#{h.display}</Text>
                          {h.count > 0 && <Text style={styles.suggestionCount}>({h.count}장)</Text>}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </ScrollView>
              ) : (
                <View style={styles.noResultsContainer}>
                  <Ionicons name="search-outline" size={48} color="#9CA3AF" />
                  <Text style={styles.noResultsText}>검색 결과가 없습니다</Text>
                  <Text style={styles.noResultsSubtext}>지역명이나 #해시태그를 입력해보세요</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* 메인 컨텐츠 - 웹과 동일한 구조 */}
        <ScreenBody style={{ flex: 1, minHeight: 0 }}>
          {/* 최근 검색한 지역 - 웹과 동일 */}
          {recentSearches.length > 0 && (
            <View style={[styles.recentSection, showSuggestions && { opacity: 0.3 }]}>
              <View style={styles.recentSectionHeader}>
                <Text style={styles.recentSectionTitle}>최근 검색한 지역</Text>
                <TouchableOpacity onPress={handleClearRecentSearches}>
                  <Text style={styles.recentClearButton}>지우기</Text>
                </TouchableOpacity>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.recentScroll}
                scrollEnabled={!showSuggestions}
                pointerEvents={showSuggestions ? 'none' : 'auto'}
              >
                <View style={{ flexDirection: 'row', paddingHorizontal: 16, gap: 8, paddingBottom: 8 }}>
                  {recentSearches.map((search, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[styles.recentSearchButton, index === 0 && styles.recentSearchButtonActive]}
                      onPress={() => handleSuggestionClick(search)}
                    >
                      <Text style={[styles.recentSearchText, index === 0 && styles.recentSearchTextActive]}>{search}</Text>
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          handleDeleteRecentSearch(search);
                        }}
                        style={styles.deleteButton}
                      >
                        <Ionicons name="close" size={16} color={index === 0 ? COLORS.primary : '#9CA3AF'} />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* 지금 가장 핫한 추천 여행지 - 웹과 동일 (w-[20vw] = 20% 너비) */}
          <View style={[styles.diverseSection, showSuggestions && { opacity: 0.3 }]}>
            <Text style={styles.diverseSectionTitle}>지금 가장 핫한 추천 여행지</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.diverseScroll}
              snapToInterval={SCREEN_WIDTH * 0.2 + 16}
              decelerationRate="fast"
              snapToAlignment="start"
            >
              {diverseRegionCards.length === 0 ? (
                <View style={styles.emptyDiverseContainer}>
                  <Ionicons name="camera-outline" size={48} color="#D1D5DB" />
                  <Text style={styles.emptyDiverseText}>사용자가 올린 여행 정보가 아직 없어요</Text>
                  <Text style={styles.emptyDiverseSubtext}>첫 사진을 올리면 여기 추천에 반영돼요</Text>
                </View>
              ) : (
                <>
                  {diverseRegionCards.map((card, index) => {
                    const categoryColors = {
                      '개화': '#F97316', '맛집': '#EF4444', '카페': '#8B4513', '해변': '#0EA5E9',
                      '등산': '#10B981', '야경': '#6366F1', '일출일몰': '#F59E0B', '축제': '#EC4899',
                      '문화': '#8B5CF6', '액티비티': '#14B8A6', '명소': '#64748B'
                    };
                    const tagBg = categoryColors[card.category] || '#8B5CF6';
                    const displayImage = card.image || getRegionDefaultImage(card.name);
                    const weather = weatherData[card.name];
                    return (
                      <TouchableOpacity
                        key={`${card.name}-${card.category}-${index}`}
                        style={styles.diverseCard}
                        onPress={() => handleSuggestionClick(card.name)}
                        activeOpacity={0.9}
                      >
                        <View style={styles.diverseImageContainer}>
                          <Image source={{ uri: displayImage }} style={styles.diverseImage} resizeMode="cover" />
                          <View style={[styles.diverseTag, { backgroundColor: tagBg }]}>
                            <Text style={styles.diverseTagText}>{card.categoryLabel}</Text>
                          </View>
                          {weather && (
                            <View style={styles.weatherBadge}>
                              <Text style={styles.weatherIcon}>{weather.icon}</Text>
                              <Text style={styles.weatherTemp}>{weather.temperature}</Text>
                            </View>
                          )}
                        </View>
                        <View style={styles.diverseInfo}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <Text style={styles.diverseName}>{card.name}</Text>
                            {card.time && (
                              <Text style={styles.diverseTime}>🕐 {card.time}</Text>
                            )}
                          </View>
                          <Text style={styles.diverseCategory}>{card.categoryLabel}</Text>
                          <Text style={styles.diverseDesc} numberOfLines={1}>{card.shortDesc}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                  <View style={{ width: SCREEN_WIDTH * 0.2 }} />
                </>
              )}
            </ScrollView>
          </View>

          {/* 해시태그 - 웹과 동일 (가로 스크롤) */}
          {hashtagChips.length > 0 && (
            <View style={[styles.hashtagSection, showSuggestions && { opacity: 0.3 }]}>
              <View style={styles.hashtagSectionHeader}>
                <Text style={styles.hashtagSectionTitle}>해시태그</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Hashtags')}>
                  <Text style={styles.hashtagMoreButton}>태그 전체보기</Text>
                </TouchableOpacity>
              </View>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={styles.hashtagScroll}
                snapToInterval={100}
                decelerationRate="fast"
                snapToAlignment="start"
              >
                {hashtagChips.map(({ key, display }) => {
                  const isSelected = selectedHashtag && (selectedHashtag || '').replace(/^#+/, '').trim().toLowerCase() === key;
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[styles.hashtagChip, isSelected && styles.hashtagChipActive]}
                      onPress={() => {
                        if (isSelected) {
                          setSelectedHashtag(null);
                        } else {
                          incrementSearchCount();
                          setSelectedHashtag(display);
                        }
                      }}
                    >
                      <Text style={[styles.hashtagChipText, isSelected && styles.hashtagChipTextActive]}>
                        #{display}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* 선택된 해시태그 사진 그리드 - 웹과 동일 (3x3) */}
          {selectedHashtag && (
            <View style={[styles.hashtagPostSection, showSuggestions && { opacity: 0.3 }]}>
              <View style={styles.hashtagPostHeader}>
                <Text style={styles.hashtagPostTitle}>#{selectedHashtag} ({hashtagPostResults.length}장)</Text>
                <TouchableOpacity onPress={() => setSelectedHashtag(null)}>
                  <Text style={styles.hashtagPostClose}>해제</Text>
                </TouchableOpacity>
              </View>
              {hashtagPostResults.length > 0 ? (
                <View style={styles.hashtagPostGrid}>
                  {hashtagPostResults.map((post) => {
                    const img = post.images?.[0] || post.image;
                    const id = post.id || post._id;
                    const upTime = getTimeAgo(post.timestamp || post.createdAt);
                    return (
                      <TouchableOpacity
                        key={id || (post.timestamp || 0)}
                        style={styles.hashtagPostItem}
                        onPress={() => navigation.navigate('PostDetail', { post })}
                      >
                        {img ? (
                          <Image source={{ uri: img }} style={styles.hashtagPostImage} />
                        ) : (
                          <View style={styles.hashtagPostPlaceholder}>
                            <Ionicons name="image-outline" size={24} color="#9CA3AF" />
                          </View>
                        )}
                        <View style={styles.hashtagPostTimeBadge}>
                          <Text style={styles.hashtagPostTimeText}>🕐 {upTime}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.hashtagPostEmpty}>
                  <Text style={styles.hashtagPostEmptyText}>이 해시태그가 달린 사진이 없습니다</Text>
                </View>
              )}
            </View>
          )}
        </ScreenBody>
      </ScreenContent>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  headerMinimal: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#fff',
  }, // 웹: px-4 pt-4 pb-2
  backButton: { 
    width: 40, 
    height: 40, 
    justifyContent: 'center', 
    alignItems: 'center',
    borderRadius: 8,
  }, // 웹: size-10 rounded-lg

  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#fff',
    position: 'relative',
    zIndex: 30,
  }, // 웹: px-4 pb-4
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB', // 웹: border-gray-200
  }, // 웹: rounded-xl border border-gray-200
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    height: 48,
  }, // 웹과 동일

  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 16,
    right: 16,
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.primary + '30', // 웹: ring-2 ring-primary/30
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
    overflow: 'hidden',
    maxHeight: 360, // 웹: maxHeight: 'calc(60px * 6)'
  }, // 웹: rounded-2xl shadow-2xl ring-2 ring-primary/30
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6', // 웹: border-gray-100
    height: 60, // 웹: h-[60px]
  },
  suggestionText: { fontSize: 16, fontWeight: '600', color: '#1c140d' }, // 웹과 동일
  suggestionDivider: { height: 1, backgroundColor: '#F3F4F6', marginHorizontal: 0 }, // 웹: border-gray-100
  suggestionHeader: { padding: 8, paddingLeft: 16, backgroundColor: '#FAFAFA' }, // 웹: bg-gray-50/50
  suggestionHeaderText: { fontSize: 12, fontWeight: '500', color: '#6B7280' }, // 웹과 동일
  suggestionCount: { fontSize: 14, color: '#6B7280', marginLeft: 'auto' }, // 웹과 동일

  noResultsContainer: { padding: 24, alignItems: 'center' }, // 웹: px-4 py-6
  noResultsText: { marginTop: 8, fontSize: 14, fontWeight: '500', color: '#6B7280' }, // 웹과 동일
  noResultsSubtext: { marginTop: 4, fontSize: 12, color: '#9CA3AF' }, // 웹과 동일

  recentSection: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 12 }, // 웹: px-6 pt-5 pb-3
  recentSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }, // 웹과 동일
  recentSectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1c140d', letterSpacing: -0.015 }, // 웹과 동일
  recentClearButton: { fontSize: 14, color: '#6B7280', fontWeight: '500' }, // 웹과 동일
  recentScroll: { gap: 8 }, // 웹: gap-2
  recentSearchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999, // 웹: rounded-full
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)', // 웹: ring-1 ring-inset ring-black/10
    gap: 6, // 웹: gap-1.5
  },
  recentSearchButtonActive: { 
    backgroundColor: COLORS.primary + '20', // 웹: bg-primary/20
    borderColor: 'transparent',
  },
  recentSearchText: { fontSize: 14, fontWeight: '500', color: '#1c140d' }, // 웹과 동일
  recentSearchTextActive: { color: COLORS.primary, fontWeight: '700' }, // 웹과 동일
  deleteButton: { marginLeft: 4 },

  diverseSection: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 16 }, // 웹: px-4 pt-5 pb-4
  diverseSectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#000', marginBottom: 16, letterSpacing: -0.015 }, // 웹과 동일
  diverseScroll: { gap: 16, paddingHorizontal: 16 }, // 웹: gap-4
  diverseCard: {
    width: SCREEN_WIDTH * 0.2, // 웹: w-[20vw]
    borderRadius: 16, // 웹: rounded-2xl
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
    marginRight: 4, // 웹: mx-1
  },
  diverseImageContainer: {
    height: 160, // 웹: h-40
    position: 'relative',
    overflow: 'hidden',
  },
  diverseImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  diverseOverlay: { position: 'absolute', top: 0, left: 0, right: 0, height: '40%' },
  diverseTag: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  diverseTagText: { fontSize: 12, fontWeight: '600', color: '#fff' }, // 웹: text-xs font-semibold
  diverseInfo: { padding: 12 }, // 웹: p-3
  diverseName: { fontSize: 14, fontWeight: 'bold', color: '#000' }, // 웹: text-sm font-bold
  diverseTime: { fontSize: 10, color: '#9CA3AF' }, // 웹: text-[10px] text-gray-400
  diverseCategory: { fontSize: 11, fontWeight: '500', color: '#6B7280', marginBottom: 2 }, // 웹: text-[11px] text-gray-500
  diverseDesc: { fontSize: 11, fontWeight: '500', color: '#4B5563' }, // 웹: text-[11px] text-gray-600

  weatherBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)', // 웹: bg-black/60
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  weatherIcon: { fontSize: 12 },
  weatherTemp: { fontSize: 12, fontWeight: '600', color: '#fff' }, // 웹: text-xs font-semibold

  hashtagSection: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 }, // 웹: px-4 pt-2 pb-3
  hashtagSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }, // 웹과 동일
  hashtagSectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#000' }, // 웹과 동일
  hashtagMoreButton: { fontSize: 12, fontWeight: '500', color: COLORS.primary }, // 웹과 동일
  hashtagScroll: { gap: 8, paddingHorizontal: 16 }, // 웹: gap-2
  hashtagChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 9999, // 웹: rounded-full
    backgroundColor: '#F3F4F6', // 웹: bg-gray-100
    borderWidth: 0,
  },
  hashtagChipActive: { backgroundColor: COLORS.primary, borderWidth: 0 }, // 웹과 동일
  hashtagChipText: { fontSize: 14, fontWeight: '500', color: '#1F2937' }, // 웹: text-gray-800
  hashtagChipTextActive: { color: '#fff' }, // 웹과 동일

  hashtagPostSection: { paddingHorizontal: 16, paddingTop: 0, paddingBottom: 16 }, // 웹: px-4 pt-0 pb-4
  hashtagPostHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }, // 웹과 동일
  hashtagPostTitle: { fontSize: 14, fontWeight: 'bold', color: '#000' }, // 웹과 동일
  hashtagPostClose: { fontSize: 12, color: '#6B7280' }, // 웹과 동일
  hashtagPostGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 6, // 웹: gap-1.5
  },
  hashtagPostItem: { 
    width: (SCREEN_WIDTH - 32 - 12) / 3, // 웹: grid-cols-3, gap-1.5
    aspectRatio: 1, 
    borderRadius: 4, 
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F3F4F6',
  },
  hashtagPostImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  hashtagPostPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  hashtagPostTimeBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  hashtagPostTimeText: { fontSize: 9, color: '#fff', textAlign: 'center' }, // 웹: text-[9px]
  hashtagPostEmpty: { paddingVertical: 16, alignItems: 'center' },
  hashtagPostEmptyText: { fontSize: 14, color: '#6B7280' }, // 웹과 동일
});

export default SearchScreen;
