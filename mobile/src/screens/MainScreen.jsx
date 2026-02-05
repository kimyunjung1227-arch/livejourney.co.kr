
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Image,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Dimensions,
  FlatList,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { COLORS, SPACING } from '../constants/styles';
import { getTimeAgo, filterRecentPosts } from '../utils/timeUtils';
import { getRegionIcon } from '../utils/regionIcons';
import { getCombinedPosts } from '../utils/mockData';
import { getRecommendedRegions, RECOMMENDATION_TYPES } from '../utils/recommendationEngine';
import { ScreenLayout, ScreenContent, ScreenHeader, ScreenBody } from '../components/ScreenLayout';
import { getWeatherByRegion } from '../utils/weatherApi';

// 카드 크기 (웹과 동일한 퍼센트 기준)
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const REALTIME_CARD_WIDTH = SCREEN_WIDTH * 0.54; // 웹: 54%
const CROWDED_CARD_WIDTH = SCREEN_WIDTH * 0.38; // 웹: 38%
const RECOMMEND_CARD_WIDTH = SCREEN_WIDTH * 0.85; // 웹: 85%

const WeatherWidget = ({ region = '서울' }) => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const data = await getWeatherByRegion(region);
        if (data.success) setWeather(data.weather);
      } catch (error) {
        console.error('날씨 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchWeather();
  }, [region]);

  if (loading || !weather) return null;

  return (
    <View style={styles.weatherWidget}>
      <Text style={styles.weatherIcon}>{weather.icon}</Text>
      <View style={styles.weatherTextContainer}>
        <Text style={styles.weatherTemp}>{weather.temperature}</Text>
        <Text style={styles.weatherCondition}>{weather.condition}</Text>
      </View>
    </View>
  );
};

const MainScreen = () => {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [realtimeData, setRealtimeData] = useState([]);
  const [crowdedData, setCrowdedData] = useState([]);
  const [recommendedData, setRecommendedData] = useState([]);
  const [selectedRecommendTag, setSelectedRecommendTag] = useState('blooming');

  // 관심 장소 관련
  const [interestPlaces, setInterestPlaces] = useState([]);
  const [selectedInterest, setSelectedInterest] = useState(null);
  const [showAddInterestModal, setShowAddInterestModal] = useState(false);
  const [newInterestPlace, setNewInterestPlace] = useState('');
  const [deleteConfirmPlace, setDeleteConfirmPlace] = useState(null);

  // SOS 관련
  const [nearbySosRequests, setNearbySosRequests] = useState([]);

  // 검색창 애니메이션
  const [placeholderText, setPlaceholderText] = useState('어디로 떠나볼까요? ✈️');
  const placeholderIndex = useRef(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const recommendationKeywords = useMemo(() => [
    '제주도의 푸른 밤 🌊', '강남의 화려한 거리 ✨', '경주의 고즈넉한 산책 🍂',
    '부산의 활기찬 시장 🐟', '여수의 낭만 포차 🍶', '홍대의 힙한 거리 🎸', '서울숲의 피크닉 🌳',
  ], []);

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(fadeAnim, { toValue: 0, duration: 500, useNativeDriver: true }).start(() => {
        placeholderIndex.current = (placeholderIndex.current + 1) % recommendationKeywords.length;
        setPlaceholderText(recommendationKeywords[placeholderIndex.current]);
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [fadeAnim, recommendationKeywords]);

  const loadMockData = useCallback(async () => {
    try {
      const postsJson = await AsyncStorage.getItem('uploadedPosts');
      const localPosts = postsJson ? JSON.parse(postsJson) : [];
      const allPosts = getCombinedPosts(localPosts);
      const posts = filterRecentPosts(allPosts, 30);

      const transformPost = (post) => {
        const dynamicTime = getTimeAgo(post.timestamp || post.createdAt || post.time);
        const recentLikes = post.likes || 0;
        const surgeIndicator = recentLikes > 50 ? '급상승' : recentLikes > 20 ? '인기' : '실시간';

        const reasonTags = [];
        const possibleReasons = ['#지금_노을맛집', '#갑자기_공연중', '#재료소진_직전', '#지금_웨이팅_폭주', '#오늘_특가', '#인기_급상승', '#SNS_화제', '#포토존_신설'];

        // 간단한 태그 추출 로직 (Web과 동일하게)
        if (post.category === 'waiting') reasonTags.push('#지금_웨이팅_폭주');
        if (post.category === 'bloom') reasonTags.push('#지금_노을맛집');
        if (recentLikes > 50) reasonTags.push('#인기_급상승');

        if (reasonTags.length === 0) {
          reasonTags.push(possibleReasons[Math.floor(Math.random() * possibleReasons.length)]);
        }

        return {
          ...post,
          id: post.id,
          image: post.images?.[0] || post.image || '',
          time: dynamicTime,
          content: post.note || post.content || `${post.location}의 모습`,
          surgeIndicator,
          reasonTags: reasonTags.slice(0, 2),
        };
      };

      const transformedAll = posts.map(transformPost);

      // "지금 여기는" - 전체 게시물 중 최신순
      setRealtimeData(transformedAll.slice(0, 20));

      // "실시간 급상승 핫플" - 좋아요 많은 순 + 실제 핫한 태그 포함
      const hotPosts = [...transformedAll]
        .filter(p => (p.likes || 0) > 0 || (p.time && (p.time.includes('방금') || p.time.includes('분 전'))))
        .sort((a, b) => (b.likes || 0) - (a.likes || 0))
        .slice(0, 15);
      setCrowdedData(hotPosts.length > 0 ? hotPosts : transformedAll.slice(0, 15));

      const recs = getRecommendedRegions(allPosts, selectedRecommendTag);
      setRecommendedData(recs.slice(0, 10));

      // SOS 요청 로드 (목업 데이터에서 SOS 유형이 있다면 필터링 가능, 현재는 예시로 하나 추가)
      const sosJson = await AsyncStorage.getItem('sosRequests');
      const sosRequests = sosJson ? JSON.parse(sosJson) : [{ id: 'sos-1', status: 'open', location: '서울 강남구' }];
      setNearbySosRequests(sosRequests.filter(req => req.status === 'open'));

    } catch (e) {
      console.error('데이터 로드 실패:', e);
      // 에러 발생 시 최저한의 목업 데이터라도 설정
      const allPosts = getCombinedPosts([]);
      setRealtimeData(allPosts.slice(0, 10));
    }
  }, [selectedRecommendTag]);

  useEffect(() => { loadMockData(); }, [loadMockData]);

  useEffect(() => {
    const loadInterestPlaces = async () => {
      try {
        const initialPlaces = [{ id: 1, name: '제주도' }, { id: 2, name: '서울 강남' }, { id: 3, name: '부산 해운대' }];
        const stored = await AsyncStorage.getItem('interestPlaces');
        if (stored) setInterestPlaces(JSON.parse(stored));
        else {
          setInterestPlaces(initialPlaces);
          await AsyncStorage.setItem('interestPlaces', JSON.stringify(initialPlaces));
        }
      } catch (e) { console.error(e); }
    };
    loadInterestPlaces();
  }, []);

  const handleAddInterestPlace = async () => {
    if (!newInterestPlace.trim()) return;
    const newPlace = { id: Date.now(), name: newInterestPlace.trim() };
    const updated = [...interestPlaces, newPlace];
    setInterestPlaces(updated);
    await AsyncStorage.setItem('interestPlaces', JSON.stringify(updated));
    setNewInterestPlace('');
    setShowAddInterestModal(false);
  };

  const handleDeleteInterestPlace = async () => {
    if (!deleteConfirmPlace) return;
    const updated = interestPlaces.filter(p => p.name !== deleteConfirmPlace);
    setInterestPlaces(updated);
    await AsyncStorage.setItem('interestPlaces', JSON.stringify(updated));
    if (selectedInterest === deleteConfirmPlace) setSelectedInterest(null);
    setDeleteConfirmPlace(null);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadMockData();
    setRefreshing(false);
  }, [loadMockData]);

  const filteredInterestPosts = useMemo(() => {
    if (!selectedInterest) return [];
    const allPosts = [...realtimeData, ...crowdedData];
    return allPosts.filter(item => {
      const loc = item.location || '';
      return loc.includes(selectedInterest) || selectedInterest.includes(loc);
    }).filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
  }, [selectedInterest, realtimeData, crowdedData]);

  return (
    <ScreenLayout style={{ backgroundColor: '#fafafa' }}>
      <ScreenContent refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} enableTabBarControl={false}>
        <ScreenHeader style={styles.header}>
          <View style={styles.headerTop}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.headerLogo}>Live Journey</Text>
              <WeatherWidget />
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
              <Ionicons name="notifications-outline" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {/* SOS 알림 배너 (웹과 동일 디자인) */}
          {nearbySosRequests.length > 0 && (
            <TouchableOpacity
              style={styles.sosContainer}
              onPress={() => navigation.navigate('SOS')}
            >
              <LinearGradient
                colors={['#ff6b35', '#ff9e7d']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.sosBanner}
              >
                <View style={styles.sosBadge}>
                  <Text style={styles.sosBadgeText}>SOS</Text>
                </View>
                <Text style={styles.sosText}>주변에 도움이 필요한 이웃이 있습니다.</Text>
                <Ionicons name="chevron-forward" size={14} color="white" style={{ marginLeft: 'auto' }} />
              </LinearGradient>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.searchContainer} onPress={() => navigation.navigate('Search')} activeOpacity={0.9}>
            <Ionicons name="search" size={22} color={COLORS.primary} />
            <Animated.Text style={[styles.searchPlaceholder, { opacity: fadeAnim }]}>{placeholderText}</Animated.Text>
          </TouchableOpacity>

          <View style={styles.interestSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.interestTitle}>⭐ 관심 지역/장소</Text>
              {interestPlaces.length === 0 && <Text style={styles.interestSubtext}>관심지역을 추가해보세요</Text>}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.interestList}>
              {interestPlaces.map((place, idx) => (
                <TouchableOpacity key={idx} style={styles.interestItem} onPress={() => setSelectedInterest(selectedInterest === place.name ? null : place.name)}>
                  <View style={[styles.interestIconCircle, selectedInterest === place.name && styles.interestIconCircleSelected]}>
                    <Text style={styles.interestIcon}>{getRegionIcon(place.name)}</Text>
                    <TouchableOpacity style={styles.interestDeleteBtn} onPress={() => setDeleteConfirmPlace(place.name)}>
                      <Ionicons name="close-circle" size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.interestName, selectedInterest === place.name && styles.interestNameSelected]}>{place.name}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.interestItem} onPress={() => setShowAddInterestModal(true)}>
                <View style={styles.interestAddCircle}>
                  <Ionicons name="add" size={24} color={COLORS.primary} />
                </View>
                <Text style={styles.interestName}>추가</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </ScreenHeader>

        <ScreenBody>
          {selectedInterest ? (
            <View style={styles.mainPadding}>
              <View style={styles.interestBanner}>
                <Text style={styles.interestBannerText}>🏷️ "{selectedInterest}" 모아보기</Text>
                <TouchableOpacity onPress={() => setSelectedInterest(null)}><Text style={styles.interestBannerBtn}>전체 보기</Text></TouchableOpacity>
              </View>
              {filteredInterestPosts.length > 0 ? (
                <View style={styles.gridContainer}>
                  {filteredInterestPosts.map((post) => (
                    <TouchableOpacity key={post.id} style={styles.gridCard} onPress={() => navigation.navigate('PostDetail', { post })}>
                      <View style={styles.gridImageWrapper}>
                        <Image source={{ uri: post.image }} style={styles.gridImage} />
                        <View style={styles.gridLikeBadge}>
                          <Text style={styles.gridLikeText}>❤️ {post.likes}</Text>
                        </View>
                      </View>
                      <View style={styles.gridInfo}>
                        <Text style={styles.gridContent} numberOfLines={1}>{post.content}</Text>
                        <View style={styles.gridMeta}>
                          <Text style={styles.gridTime}>{post.time}</Text>
                          <Text style={styles.gridLocation} numberOfLines={1}>📍 {post.location}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyIcon}>📷</Text>
                  <Text style={styles.emptyText}>아직 이 지역의 사진이 없어요.</Text>
                  <Text style={styles.emptySubtext}>첫 번째 사진을 올려보세요!</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.mainPadding}>
              {/* 지금 여기는 */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.sectionTitle}>📍 지금 여기는</Text>
                    <View style={styles.liveBadge}><Text style={styles.liveBadgeText}>LIVE</Text></View>
                  </View>
                  <TouchableOpacity onPress={() => navigation.navigate('RealtimeFeed')}><Text style={styles.moreText}>더보기</Text></TouchableOpacity>
                </View>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false} 
                  contentContainerStyle={styles.horizontalScroll}
                  snapToInterval={REALTIME_CARD_WIDTH + 12}
                  decelerationRate="fast"
                  snapToAlignment="start"
                >
                  {realtimeData.map((post) => (
                    <TouchableOpacity key={post.id} style={styles.realtimeCard} onPress={() => navigation.navigate('PostDetail', { post })}>
                      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={{ width: '100%', height: '100%' }}>
                        {(post.images && post.images.length > 0 ? post.images : [post.image]).map((img, i) => (
                          <Image key={i} source={{ uri: img }} style={styles.cardFullImage} />
                        ))}
                      </ScrollView>
                      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.9)']} style={styles.cardGradient} />
                      <View style={styles.cardOverlay}>
                        <Text style={styles.cardLocation}>{post.location}</Text>
                        <Text style={styles.cardMeta}>{post.categoryLabel} · {post.time}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* 실시간 급상승 핫플 */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { fontSize: 18 }]}>🔥 실시간 급상승 핫플</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('CrowdedPlace')}><Text style={styles.moreText}>더보기</Text></TouchableOpacity>
                </View>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false} 
                  contentContainerStyle={styles.horizontalScroll}
                  snapToInterval={CROWDED_CARD_WIDTH + 12}
                  decelerationRate="fast"
                  snapToAlignment="start"
                >
                  {crowdedData.map((post) => (
                    <TouchableOpacity key={post.id} style={styles.crowdedCard} onPress={() => navigation.navigate('PostDetail', { post })}>
                      <View style={styles.crowdedImageWrapper}>
                        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={{ width: '100%', height: '100%' }}>
                          {(post.images && post.images.length > 0 ? post.images : [post.image]).map((img, i) => (
                            <Image key={i} source={{ uri: img }} style={styles.crowdedImage} />
                          ))}
                        </ScrollView>
                        <View style={styles.surgeBadge}>
                          <Text style={styles.surgeBadgeText}>
                            {post.surgeIndicator === '급상승' ? '🔥 급상승' : post.surgeIndicator === '인기' ? '⭐ 인기' : '⚡ 실시간'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.crowdedLocation}>{post.location}</Text>
                      {post.reasonTags && post.reasonTags.length > 0 && (
                        <View style={styles.reasonTagsRow}>
                          {post.reasonTags.map((tag, idx) => (
                            <View key={idx} style={styles.reasonTag}><Text style={styles.reasonTagText}>{tag}</Text></View>
                          ))}
                        </View>
                      )}
                      <Text style={styles.crowdedCategory}>{post.categoryLabel}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* 추천 여행지 */}
              <View style={styles.section}>
                <View style={styles.sectionHeaderCol}>
                  <Text style={[styles.sectionTitle, { fontSize: 18 }]}>✨ 추천 여행지</Text>
                  <Text style={styles.sectionSubtext}>
                    {RECOMMENDATION_TYPES.find(t => t.id === selectedRecommendTag)?.description}
                  </Text>
                </View>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false} 
                  contentContainerStyle={styles.tagScroll}
                  snapToInterval={100}
                  decelerationRate="fast"
                  snapToAlignment="start"
                >
                  {RECOMMENDATION_TYPES.map(tag => (
                    <TouchableOpacity key={tag.id} style={[styles.tagItem, selectedRecommendTag === tag.id && styles.tagItemActive]} onPress={() => setSelectedRecommendTag(tag.id)}>
                      <Text style={[styles.tagText, selectedRecommendTag === tag.id && styles.tagTextActive]}>{tag.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false} 
                  contentContainerStyle={styles.horizontalScroll}
                  snapToInterval={RECOMMEND_CARD_WIDTH + 12}
                  decelerationRate="fast"
                  snapToAlignment="center"
                >
                  {recommendedData.map((item, idx) => {
                    const allPosts = getCombinedPosts([]);
                    const regionPosts = allPosts.filter(p => p.location && p.location.includes(item.regionName));
                    const regionImages = [item.image, ...regionPosts.flatMap(p => p.images || [])].filter(Boolean).slice(0, 5);
                    
                    return (
                      <TouchableOpacity key={idx} style={styles.recommendCard} onPress={() => navigation.navigate('RegionDetail', { regionName: item.regionName })}>
                        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={{ width: '100%', height: '100%' }}>
                          {regionImages.map((img, i) => (
                            <Image key={i} source={{ uri: img }} style={styles.cardFullImage} />
                          ))}
                        </ScrollView>
                        <View style={styles.recommendBadge}><Text style={styles.recommendBadgeText}>추천</Text></View>
                        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.cardGradient} />
                        <View style={styles.cardOverlay}>
                          <Text style={styles.recommendTitle}>{item.title}</Text>
                          <Text style={styles.recommendDesc} numberOfLines={1}>{item.description}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
          )}
        </ScreenBody>
      </ScreenContent>

      <Modal visible={showAddInterestModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>관심 지역 추가</Text>
              <TouchableOpacity onPress={() => setShowAddInterestModal(false)}><Ionicons name="close" size={24} color="#333" /></TouchableOpacity>
            </View>
            <TextInput style={styles.modalInput} placeholder="예: 제주도, 강남, 부산" value={newInterestPlace} onChangeText={setNewInterestPlace} />
            <TouchableOpacity style={[styles.modalBtn, !newInterestPlace.trim() && styles.modalBtnDisabled]} onPress={handleAddInterestPlace} disabled={!newInterestPlace.trim()}>
              <Text style={styles.modalBtnText}>추가하기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={!!deleteConfirmPlace} transparent animationType="fade">
        <View style={styles.modalOverlayCenter}>
          <View style={styles.alertBox}>
            <Text style={styles.alertTitle}>관심 지역 삭제</Text>
            <Text style={styles.alertMsg}>'{deleteConfirmPlace}'을(를) 관심 지역에서 삭제하시겠습니까?</Text>
            <View style={styles.alertBtns}>
              <TouchableOpacity style={styles.alertBtnCancel} onPress={() => setDeleteConfirmPlace(null)}><Text style={styles.alertBtnCancelText}>취소</Text></TouchableOpacity>
              <TouchableOpacity style={styles.alertBtnDelete} onPress={handleDeleteInterestPlace}><Text style={styles.alertBtnDeleteText}>삭제</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  header: { backgroundColor: 'rgba(255, 255, 255, 0.9)', borderBottomWidth: 1, borderBottomColor: 'rgba(242, 244, 247, 0.8)' }, // 웹: background: 'rgba(255, 255, 255, 0.9)', borderBottom: '1px solid rgba(242, 244, 247, 0.8)'
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 }, // 웹과 동일
  headerLogo: { fontSize: 20, fontWeight: '900', color: COLORS.primary, letterSpacing: -0.5 }, // 웹과 동일
  weatherWidget: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f0f9ff', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(0,188,212,0.1)' },
  weatherIcon: { fontSize: 20 },
  weatherTextContainer: { marginLeft: 2 },
  weatherTemp: { fontSize: 13, fontWeight: 'bold', color: COLORS.primary, lineHeight: 14 },
  weatherCondition: { fontSize: 10, color: '#64748b', lineHeight: 12 },
  sosBadge: { backgroundColor: 'white', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginRight: 4 },
  sosBadgeText: { color: '#ff6b35', fontSize: 10, fontWeight: '900' },
  sosContainer: { paddingHorizontal: 16, paddingVertical: 8 }, // 웹: padding: '8px 16px'
  sosBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, shadowColor: '#ff6b35', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 15, elevation: 4 }, // 웹과 동일
  sosText: { color: 'white', fontSize: 13 }, // 웹과 동일
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.04,
    shadowRadius: 25,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9'
  }, // 웹: padding: '14px 18px'
  searchPlaceholder: { color: '#94a3b8', fontSize: 15, fontWeight: '500' }, // 웹과 동일
  interestSection: { paddingHorizontal: 16, paddingBottom: 24 }, // 웹: padding: '0 16px 24px'
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 12, marginBottom: 0 }, // 웹: padding: '0 0 12px 0'
  interestTitle: { fontSize: 17, fontWeight: '600', color: '#374151', letterSpacing: -0.3 }, // 웹과 동일
  interestSubtext: { fontSize: 12, color: '#9ca3af' }, // 웹과 동일
  interestList: { gap: 12, paddingBottom: 12 }, // 웹: padding: '0 0 12px 0'
  interestItem: { alignItems: 'center', gap: 4 }, // 웹과 동일
  interestIconCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', position: 'relative' }, // 웹과 동일
  interestIconCircleSelected: { backgroundColor: '#fff', borderWidth: 2, borderColor: COLORS.primary }, // 웹과 동일
  interestIcon: { fontSize: 24 }, // 웹과 동일
  interestDeleteBtn: { position: 'absolute', top: -4, right: -4, backgroundColor: '#fee2e2', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' }, // 웹: background: '#fee2e2', width: '20px', height: '20px'
  interestName: { fontSize: 12, color: '#64748b', fontWeight: '400' }, // 웹과 동일
  interestNameSelected: { color: COLORS.primary, fontWeight: '700' }, // 웹과 동일
  interestAddCircle: { width: 50, height: 50, borderRadius: 25, borderStyle: 'dashed', borderWidth: 1, borderColor: '#cbd5e1', backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' }, // 웹과 동일
  mainPadding: { paddingHorizontal: 16, paddingBottom: 20 }, // 웹: padding: '0 16px 20px'
  interestBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f0f9ff', padding: 12, marginHorizontal: 16, marginBottom: 16, borderRadius: 12 },
  interestBannerText: { fontWeight: '700', color: '#0284c7', fontSize: 14 },
  interestBannerBtn: { color: '#0284c7', fontSize: 12, fontWeight: '600' },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 16 },
  gridCard: { width: (SCREEN_WIDTH - 44) / 2, backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  gridImageWrapper: { height: 150, backgroundColor: '#eee', position: 'relative' },
  gridImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  gridLikeBadge: { position: 'absolute', bottom: 6, right: 6, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  gridLikeText: { fontSize: 10, fontWeight: '700', color: '#333' },
  gridInfo: { padding: 10 },
  gridContent: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 4 },
  gridMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  gridTime: { fontSize: 11, color: '#94a3b8' },
  gridLocation: { fontSize: 11, color: '#94a3b8', maxWidth: '60%' },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 14, color: '#94a3b8' },
  emptySubtext: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  section: { marginBottom: 24 }, // 웹: 24px
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 0, paddingBottom: 12, marginBottom: 0 }, // 웹: padding: '0 0 12px 0'
  sectionHeaderCol: { paddingHorizontal: 0, paddingBottom: 12, marginBottom: 0 }, // 웹: padding: '0 0 12px 0'
  sectionTitle: { fontSize: 19, fontWeight: '600', color: '#374151', letterSpacing: -0.5 }, // 웹과 동일
  sectionSubtext: { fontSize: 12, color: '#64748b', marginTop: 4 }, // 웹: margin: '4px 0 0 0'
  liveBadge: { backgroundColor: '#FFF8E1', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.3)' }, // 웹과 동일
  liveBadgeText: { fontSize: 10, color: '#F59E0B', fontWeight: '900' }, // 웹과 동일
  moreText: { fontSize: 13, fontWeight: '500', color: COLORS.primary }, // 웹과 동일
  horizontalScroll: { paddingHorizontal: 16, paddingBottom: 16, gap: 12 }, // 웹: padding: '0 0 16px 0', gap: '12px'
  realtimeCard: { width: REALTIME_CARD_WIDTH, height: 280, borderRadius: 28, overflow: 'hidden', backgroundColor: '#eee', elevation: 8, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 30, marginRight: 0 }, // 웹: boxShadow: '0 12px 30px rgba(0,0,0,0.12)'
  cardFullImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  cardGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%' },
  cardOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20 },
  cardLocation: { color: '#fff', fontSize: 18, fontWeight: '900', marginBottom: 4, letterSpacing: -0.02 },
  cardMeta: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '600' },
  crowdedCard: { width: CROWDED_CARD_WIDTH, marginRight: 0 }, // 웹: gap으로 간격 처리
  crowdedImageWrapper: { height: 120, borderRadius: 16, overflow: 'hidden', backgroundColor: '#eee', marginBottom: 8, position: 'relative' }, // 웹과 동일
  crowdedImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  surgeBadge: { position: 'absolute', top: 8, left: 8, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }, // 웹: backdropFilter 추가 불가하므로 약간 어둡게
  surgeBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700' }, // 웹과 동일
  crowdedLocation: { fontSize: 14, fontWeight: '800', color: '#111827', marginBottom: 4, paddingLeft: 4, letterSpacing: -0.3 }, // 웹과 동일
  reasonTagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, paddingLeft: 4, marginBottom: 4 }, // 웹과 동일
  reasonTag: { backgroundColor: '#FEE2E2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }, // 웹과 동일
  reasonTagText: { fontSize: 9, color: '#EF4444', fontWeight: '700' }, // 웹과 동일
  crowdedCategory: { fontSize: 11, color: COLORS.primary, fontWeight: '800', paddingLeft: 4 }, // 웹과 동일
  tagScroll: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 }, // 웹: padding: '0 0 12px 0'
  tagItem: { backgroundColor: '#f1f5f9', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 25, borderWidth: 1, borderColor: '#e2e8f0' }, // 웹과 동일
  tagItemActive: { backgroundColor: COLORS.primary, borderWidth: 0 }, // 웹: border: 'none'
  tagText: { color: '#64748b', fontSize: 13, fontWeight: '600' }, // 웹과 동일
  tagTextActive: { color: '#fff' }, // 웹과 동일
  recommendCard: { width: RECOMMEND_CARD_WIDTH, height: 240, borderRadius: 24, overflow: 'hidden', backgroundColor: '#eee', elevation: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 35, marginRight: 0 }, // 웹: boxShadow: '0 15px 35px rgba(0,0,0,0.1)'
  recommendBadge: { position: 'absolute', top: 12, left: 12, zIndex: 10, backgroundColor: 'rgba(0,188,212,0.95)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }, // 웹과 동일
  recommendBadgeText: { color: '#fff', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 }, // 웹과 동일
  recommendTitle: { color: '#fff', fontSize: 17, fontWeight: '800', marginBottom: 2 }, // 웹과 동일
  recommendDesc: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '500' }, // 웹과 동일
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  modalInput: { borderWidth: 2, borderColor: '#e2e8f0', pading: 16, borderRadius: 16, fontSize: 16, marginBottom: 24, padding: 16 },
  modalBtn: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 16, alignItems: 'center' },
  modalBtnDisabled: { backgroundColor: '#cbd5e1' },
  modalBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  modalOverlayCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  alertBox: { backgroundColor: '#fff', width: '85%', maxWidth: 300, padding: 24, borderRadius: 20, alignItems: 'center' },
  alertTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  alertMsg: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 24 },
  alertBtns: { flexDirection: 'row', gap: 8, width: '100%' },
  alertBtnCancel: { flex: 1, backgroundColor: '#f1f5f9', padding: 12, borderRadius: 12, alignItems: 'center' },
  alertBtnCancelText: { color: '#64748b', fontWeight: '600' },
  alertBtnDelete: { flex: 1, backgroundColor: '#ef4444', padding: 12, borderRadius: 12, alignItems: 'center' },
  alertBtnDeleteText: { color: '#fff', fontWeight: '600' },
});

export default MainScreen;
