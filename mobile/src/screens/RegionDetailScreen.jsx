import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/styles';
import { filterRecentPosts, getTimeAgo } from '../utils/timeUtils';
import { isPostLiked } from '../utils/socialInteractions';
import { toggleInterestPlace, isInterestPlace } from '../utils/interestPlaces';
import { ScreenLayout, ScreenContent, ScreenHeader, ScreenBody } from '../components/ScreenLayout';
import { getLandmarksByRegion, isPostMatchingLandmarks } from '../utils/regionLandmarks';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// PostItem 컴포넌트 (RegionDetailScreen 전용)
const PostItem = ({ item, index, onPress }) => {
  const [isLiked, setIsLiked] = useState(false);
  const imageUrl = item.imageUrl || item.images?.[0] || item.image;
  const likeCount = item.likes || item.likeCount || 0;

  useEffect(() => {
    const checkLike = async () => {
      const liked = await isPostLiked(item.id);
      setIsLiked(liked);
    };
    checkLike();
  }, [item.id]);

  return (
    <TouchableOpacity
      style={regionStyles.postItem}
      onPress={() => onPress(item, index)}
      activeOpacity={0.9}
    >
      {/* 이미지 */}
      <View style={regionStyles.postImageContainer}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={regionStyles.postImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[regionStyles.postImage, regionStyles.postImagePlaceholder]}>
            <Ionicons name="image-outline" size={32} color={COLORS.textSubtle} />
          </View>
        )}

        {/* 우측 하단 하트 아이콘 */}
        <View style={regionStyles.likeBadge}>
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={16}
            color={isLiked ? COLORS.error : COLORS.text}
          />
          <Text style={regionStyles.likeCount}>{likeCount}</Text>
        </View>
      </View>

      {/* 이미지 밖 하단 텍스트 */}
      <View style={regionStyles.postTextContainer}>
        <View style={regionStyles.locationRow}>
          <Text style={regionStyles.locationText} numberOfLines={1}>
            {item.detailedLocation || item.placeName || item.location || '여행지'}
          </Text>
          {item.time && (
            <Text style={regionStyles.timeText}>{item.time}</Text>
          )}
        </View>
        {item.detailedLocation && item.detailedLocation !== item.location && (
          <Text style={regionStyles.subLocationText} numberOfLines={1}>
            {item.location}
          </Text>
        )}
        {item.tags && item.tags.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={regionStyles.tagsScroll}
            contentContainerStyle={regionStyles.tagsScrollContent}
          >
            {item.tags.slice(0, 5).map((tag, tagIndex) => (
              <View key={tagIndex} style={regionStyles.tagBadge}>
                <Text style={regionStyles.tagText}>
                  #{typeof tag === 'string' ? tag.replace('#', '') : tag}
                </Text>
              </View>
            ))}
          </ScrollView>
        )}
        {item.note && (
          <Text style={regionStyles.noteText} numberOfLines={2}>
            {item.note}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const RegionDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { regionName, focusLocation } = route.params || {};
  const region = route.params?.region || { name: regionName || '서울' };

  const [realtimePhotos, setRealtimePhotos] = useState([]);
  const [bloomPhotos, setBloomPhotos] = useState([]);
  const [touristSpots, setTouristSpots] = useState([]);
  const [foodPhotos, setFoodPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isInterest, setIsInterest] = useState(false);
  const [selectedLandmarks, setSelectedLandmarks] = useState([]); // 선택된 명소 ID 목록
  const [showLandmarkModal, setShowLandmarkModal] = useState(false); // 명소 선택 모달 표시 여부
  
  const [weatherInfo, setWeatherInfo] = useState({
    icon: '☀️',
    condition: '맑음',
    temperature: '27℃',
    loading: false
  });
  
  const [trafficInfo, setTrafficInfo] = useState({
    icon: '🚗',
    status: '교통 원활',
    loading: false
  });

  // 시간을 숫자로 변환하는 함수 (정렬용)
  const timeToMinutes = useCallback((timeLabel) => {
    if (timeLabel === '방금') return 0;
    if (timeLabel.includes('분 전')) return parseInt(timeLabel);
    if (timeLabel.includes('시간 전')) return parseInt(timeLabel) * 60;
    if (timeLabel.includes('일 전')) return parseInt(timeLabel) * 24 * 60;
    return 999999;
  }, []);

  // 지역 데이터 로드
  const loadRegionData = useCallback(async () => {
    try {
      setLoading(true);
      const uploadedPostsJson = await AsyncStorage.getItem('uploadedPosts');
      let uploadedPosts = uploadedPostsJson ? JSON.parse(uploadedPostsJson) : [];
      
      // 2일 이상 된 게시물 필터링
      uploadedPosts = filterRecentPosts(uploadedPosts, 2);
      
      let regionPosts = uploadedPosts
        .filter(post => post.location?.includes(region.name) || post.location === region.name);

      // 매거진 등에서 상세 위치(focusLocation)가 넘어온 경우, 해당 위치 중심으로 한 번 더 필터링
      if (focusLocation) {
        const focus = focusLocation.toLowerCase();
        regionPosts = regionPosts.filter(post => {
          const detailed = (post.detailedLocation || post.placeName || '').toLowerCase();
          const locText = (post.location || '').toLowerCase();
          return detailed.includes(focus) || locText.includes(focus);
        });
        console.log(`🎯 상세 위치 필터 적용: ${focusLocation} → ${regionPosts.length}개 게시물`);
      }

      // 선택된 명소로 필터링
      if (selectedLandmarks.length > 0) {
        regionPosts = regionPosts.filter(post => 
          isPostMatchingLandmarks(post, selectedLandmarks, region.name)
        );
        console.log(`🏛️ 명소 필터 적용: ${selectedLandmarks.length}개 명소 → ${regionPosts.length}개 게시물`);
      }

      regionPosts = regionPosts
        .sort((a, b) => {
          const timeA = timeToMinutes(a.timeLabel || '방금');
          const timeB = timeToMinutes(b.timeLabel || '방금');
          return timeA - timeB;
        });
      
      const bloomPosts = regionPosts
        .filter(post => post.category === 'bloom')
        .map(post => ({
          ...post, // 원본 게시물의 모든 필드 포함
          id: post.id,
          images: post.images || [],
          videos: post.videos || [],
          image: post.images?.[0] || post.videos?.[0] || post.image,
          time: post.timeLabel || getTimeAgo(post.timestamp || post.createdAt || post.time),
          timeLabel: post.timeLabel || getTimeAgo(post.timestamp || post.createdAt || post.time),
          category: post.categoryName,
          categoryName: post.categoryName,
          labels: post.aiLabels,
          detailedLocation: post.detailedLocation || post.placeName,
          placeName: post.placeName,
          address: post.address,
          location: post.location,
          tags: post.tags || post.aiLabels || [],
          note: post.note || post.content,
          likes: post.likes || post.likeCount || 0,
          user: post.user || '여행자',
          userId: post.userId,
          comments: post.comments || [],
          qnaList: post.qnaList || [],
          timestamp: post.timestamp || post.createdAt || post.time,
        }));
      
      const touristPosts = regionPosts
        .filter(post => post.category === 'landmark' || post.category === 'scenic')
        .map(post => ({
          ...post, // 원본 게시물의 모든 필드 포함
          id: post.id,
          images: post.images || [],
          videos: post.videos || [],
          image: post.images?.[0] || post.videos?.[0] || post.image,
          time: post.timeLabel || getTimeAgo(post.timestamp || post.createdAt || post.time),
          timeLabel: post.timeLabel || getTimeAgo(post.timestamp || post.createdAt || post.time),
          category: post.categoryName,
          categoryName: post.categoryName,
          labels: post.aiLabels,
          detailedLocation: post.detailedLocation || post.placeName,
          placeName: post.placeName,
          address: post.address,
          location: post.location,
          tags: post.tags || post.aiLabels || [],
          note: post.note || post.content,
          likes: post.likes || post.likeCount || 0,
          user: post.user || '여행자',
          userId: post.userId,
          comments: post.comments || [],
          qnaList: post.qnaList || [],
          timestamp: post.timestamp || post.createdAt || post.time,
        }));
      
      const foodPosts = regionPosts
        .filter(post => post.category === 'food')
        .map(post => ({
          ...post, // 원본 게시물의 모든 필드 포함
          id: post.id,
          images: post.images || [],
          videos: post.videos || [],
          image: post.images?.[0] || post.videos?.[0] || post.image,
          time: post.timeLabel || getTimeAgo(post.timestamp || post.createdAt || post.time),
          timeLabel: post.timeLabel || getTimeAgo(post.timestamp || post.createdAt || post.time),
          category: post.categoryName,
          categoryName: post.categoryName,
          labels: post.aiLabels,
          detailedLocation: post.detailedLocation || post.placeName,
          placeName: post.placeName,
          address: post.address,
          location: post.location,
          tags: post.tags || post.aiLabels || [],
          note: post.note || post.content,
          likes: post.likes || post.likeCount || 0,
          user: post.user || '여행자',
          userId: post.userId,
          comments: post.comments || [],
          qnaList: post.qnaList || [],
          timestamp: post.timestamp || post.createdAt || post.time,
        }));
      
      const realtimePosts = regionPosts
        .map(post => ({
          ...post, // 원본 게시물의 모든 필드 포함
          id: post.id,
          images: post.images || [],
          videos: post.videos || [],
          image: post.images?.[0] || post.videos?.[0] || post.image,
          time: post.timeLabel || getTimeAgo(post.timestamp || post.createdAt || post.time),
          timeLabel: post.timeLabel || getTimeAgo(post.timestamp || post.createdAt || post.time),
          category: post.categoryName || '일반',
          categoryName: post.categoryName,
          labels: post.aiLabels,
          detailedLocation: post.detailedLocation || post.placeName,
          placeName: post.placeName,
          address: post.address,
          location: post.location,
          tags: post.tags || post.aiLabels || [],
          note: post.note || post.content,
          likes: post.likes || post.likeCount || 0,
          user: post.user || '여행자',
          userId: post.userId,
          comments: post.comments || [],
          qnaList: post.qnaList || [],
          timestamp: post.timestamp || post.createdAt || post.time,
        }));
      
      setBloomPhotos(bloomPosts.slice(0, 6));
      setTouristSpots(touristPosts.slice(0, 6));
      setFoodPhotos(foodPosts.slice(0, 6));
      setRealtimePhotos(realtimePosts.slice(0, 6));
    } catch (error) {
      console.error('지역 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  }, [region.name, timeToMinutes, selectedLandmarks]);

  // 날씨 정보 가져오기
  const fetchWeatherData = useCallback(async () => {
    setWeatherInfo(prev => ({ ...prev, loading: true }));
    try {
      // Mock 데이터 (실제로는 API 호출)
      const mockWeatherData = {
        '서울': { icon: '☀️', condition: '맑음', temperature: '23℃' },
        '부산': { icon: '🌤️', condition: '구름조금', temperature: '25℃' },
        '제주': { icon: '🌧️', condition: '비', temperature: '20℃' },
        '인천': { icon: '☁️', condition: '흐림', temperature: '22℃' },
        '대전': { icon: '☀️', condition: '맑음', temperature: '24℃' },
        '대구': { icon: '☀️', condition: '맑음', temperature: '26℃' },
        '광주': { icon: '🌤️', condition: '구름조금', temperature: '24℃' },
        '울산': { icon: '🌤️', condition: '구름조금', temperature: '25℃' },
        '강릉': { icon: '☀️', condition: '맑음', temperature: '21℃' },
        '경주': { icon: '☀️', condition: '맑음', temperature: '24℃' }
      };
      
      const mockWeather = mockWeatherData[region.name] || mockWeatherData['서울'];
      setWeatherInfo({
        ...mockWeather,
        loading: false
      });
    } catch (error) {
      console.error('날씨 정보 조회 실패:', error);
      setWeatherInfo(prev => ({ ...prev, loading: false }));
    }
  }, [region.name]);

  // 교통 정보 가져오기
  const fetchTrafficData = useCallback(async () => {
    setTrafficInfo(prev => ({ ...prev, loading: true }));
    try {
      // Mock 데이터 (실제로는 API 호출)
      const mockTrafficData = {
        '서울': { icon: '🚙', status: '교통 보통' },
        '부산': { icon: '🚗', status: '교통 원활' },
        '제주': { icon: '🚗', status: '교통 원활' },
        '인천': { icon: '🚙', status: '교통 보통' },
        '대전': { icon: '🚗', status: '교통 원활' },
        '대구': { icon: '🚗', status: '교통 원활' },
        '광주': { icon: '🚗', status: '교통 원활' },
        '울산': { icon: '🚗', status: '교통 원활' },
        '강릉': { icon: '🚗', status: '교통 원활' },
        '경주': { icon: '🚗', status: '교통 원활' }
      };
      
      const mockTraffic = mockTrafficData[region.name] || { icon: '🚗', status: '교통 원활' };
      setTrafficInfo({
        ...mockTraffic,
        loading: false
      });
    } catch (error) {
      console.error('교통 정보 조회 실패:', error);
      setTrafficInfo(prev => ({ ...prev, loading: false }));
    }
  }, [region.name]);

  useEffect(() => {
    loadRegionData();
    fetchWeatherData();
    fetchTrafficData();
  }, [loadRegionData, fetchWeatherData, fetchTrafficData]);

  const handlePostPress = (post, index, allPosts) => {
    navigation.navigate('PostDetail', {
      postId: post.id,
      post: post,
      allPosts: allPosts,
      currentPostIndex: index,
    });
  };

  const renderSection = (title, data, sectionType, showLandmarkButton = false) => {
    if (data.length === 0) {
      return (
        <View style={styles.emptySection}>
          <Ionicons name="images-outline" size={48} color={COLORS.textSubtle} />
          <Text style={styles.emptyText}>
            {sectionType === 'realtime' && `${region.name}의 실시간 정보가 없어요`}
            {sectionType === 'spots' && '추천 장소가 아직 없어요'}
            {sectionType === 'bloom' && '개화 정보가 아직 없어요'}
            {sectionType === 'food' && '맛집 정보가 아직 없어요'}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <View style={styles.sectionHeaderRight}>
            {showLandmarkButton && sectionType === 'realtime' && getLandmarksByRegion(region.name).length > 0 && (
              <TouchableOpacity
                style={styles.landmarkButtonInSection}
                onPress={() => setShowLandmarkModal(true)}
              >
                <Text style={styles.landmarkButtonInSectionText}>
                  {selectedLandmarks.length > 0 
                    ? `주요 명소 (${selectedLandmarks.length})`
                    : '주요 명소보기'
                  }
                </Text>
              </TouchableOpacity>
            )}
            {data.length > 6 && !showLandmarkButton && (
              <TouchableOpacity
                onPress={() => {
                  navigation.navigate('RegionCategory', {
                    regionName: region.name,
                    type: sectionType,
                  });
                }}
              >
                <Text style={styles.moreButton}>더보기</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        <View style={styles.gridContainer}>
          {data.map((item, index) => (
            <PostItem
              key={item.id || index}
              item={item}
              index={index}
              onPress={(item, idx) => handlePostPress(item, idx, data)}
            />
          ))}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <ScreenLayout>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>로딩 중...</Text>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout>
      <ScreenContent>
        {/* 헤더 - 웹과 동일한 구조 */}
        <ScreenHeader>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.textPrimaryLight} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{region.name}</Text>
            <View style={styles.headerPlaceholder} />
          </View>
          
          {/* 날씨/교통 정보 - 지역 이름 바로 아래 */}
          <View style={styles.infoBar}>
            <View style={styles.infoItem}>
              {weatherInfo.loading ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <>
                  <Text style={styles.infoIcon}>{weatherInfo.icon}</Text>
                  <Text style={styles.infoText}>
                    {weatherInfo.condition}, {weatherInfo.temperature}
                  </Text>
                </>
              )}
            </View>
            <View style={styles.infoItem}>
              {trafficInfo.loading ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <>
                  <Text style={styles.infoIcon}>{trafficInfo.icon}</Text>
                  <Text style={styles.infoText}>{trafficInfo.status}</Text>
                </>
              )}
            </View>
          </View>
        </ScreenHeader>

        {/* 메인 컨텐츠 - 웹과 동일한 구조 */}
        <ScreenBody>

        {/* 현장 실시간 정보 */}
        {renderSection('현장 실시간 정보', realtimePhotos, 'realtime', true)}

        {/* 가볼만한곳 */}
        {renderSection(`🏞️ ${region.name} 가볼만한곳`, touristSpots, 'spots')}

        {/* 개화 상황 */}
        {renderSection('🌸 개화 상황', bloomPhotos, 'bloom')}

        {/* 맛집 정보 */}
        {renderSection('🍜 맛집 정보', foodPhotos, 'food')}
        </ScreenBody>
      </ScreenContent>

      {/* 명소 선택 모달 */}
      <Modal
        visible={showLandmarkModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLandmarkModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{region.name} 주요 명소</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowLandmarkModal(false)}
              >
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalDescription}>
                보고 싶은 명소를 선택하세요. 선택한 명소의 사진만 표시됩니다.
              </Text>
              
              <View style={styles.landmarkList}>
                {getLandmarksByRegion(region.name).map((landmark) => {
                  const isSelected = selectedLandmarks.includes(landmark.id);
                  return (
                    <TouchableOpacity
                      key={landmark.id}
                      style={[
                        styles.landmarkItem,
                        isSelected && styles.landmarkItemSelected
                      ]}
                      onPress={() => {
                        if (isSelected) {
                          setSelectedLandmarks(selectedLandmarks.filter(id => id !== landmark.id));
                        } else {
                          setSelectedLandmarks([...selectedLandmarks, landmark.id]);
                        }
                      }}
                    >
                      <View style={styles.landmarkItemContent}>
                        <Text style={[
                          styles.landmarkItemName,
                          isSelected && styles.landmarkItemNameSelected
                        ]}>
                          {landmark.name}
                        </Text>
                      </View>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                      )}
                      {!isSelected && (
                        <Ionicons name="ellipse-outline" size={24} color={COLORS.textSecondary} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => {
                  setSelectedLandmarks([]);
                  setShowLandmarkModal(false);
                }}
              >
                <Text style={styles.modalButtonCancelText}>초기화</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonConfirm}
                onPress={() => {
                  setShowLandmarkModal(false);
                  loadRegionData();
                }}
              >
                <Text style={styles.modalButtonConfirmText}>
                  {selectedLandmarks.length > 0 ? `${selectedLandmarks.length}개 선택됨` : '확인'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md, // p-4
    paddingTop: SPACING.md, // p-4
    paddingBottom: 12, // pb-3 = 12px
    backgroundColor: COLORS.backgroundLight, // bg-white
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB', // border-gray-200
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  backButton: {
    width: 48, // size-12 = 48px
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8, // rounded-lg
  },
  headerTitle: {
    fontSize: 18, // text-lg = 18px
    fontWeight: 'bold',
    color: COLORS.text, // text-content-light
    letterSpacing: -0.27, // tracking-[-0.015em] = -0.27px
    lineHeight: 21.6, // leading-tight
    flex: 1,
    textAlign: 'center',
  },
  headerPlaceholder: {
    width: 48, // w-12 = 48px
  },
  scrollView: {
    flex: 1,
  },
  infoBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    paddingTop: SPACING.sm,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoIcon: {
    fontSize: 16,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  section: {
    marginTop: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  sectionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h2,
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  moreButton: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  landmarkButtonInSection: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
    backgroundColor: COLORS.primaryLight,
  },
  landmarkButtonInSectionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.md,
    justifyContent: 'space-between',
  },
  emptySection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.md,
  },
  emptyText: {
    marginTop: SPACING.md,
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  landmarkButtonContainer: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  landmarkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
  },
  landmarkButtonText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  landmarkClearButton: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.backgroundLight,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    padding: SPACING.md,
    maxHeight: 400,
  },
  modalDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  landmarkList: {
    gap: SPACING.sm,
  },
  landmarkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  landmarkItemSelected: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  landmarkItemContent: {
    flex: 1,
  },
  landmarkItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  landmarkItemNameSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  modalButtonCancel: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    alignItems: 'center',
  },
  modalButtonCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  modalButtonConfirm: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  modalButtonConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textWhite,
  },
});

// RegionDetailScreen 전용 스타일
const regionStyles = StyleSheet.create({
  postItem: {
    width: (SCREEN_WIDTH - SPACING.md * 3) / 2,
    marginBottom: SPACING.md, // gap-4 = 16px
  },
  postImageContainer: {
    width: '100%',
    aspectRatio: 4 / 5, // aspect-[4/5]
    borderRadius: 12, // rounded-lg
    overflow: 'hidden',
    marginBottom: 12, // mb-3 = 12px
    backgroundColor: COLORS.borderLight,
    position: 'relative',
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  postImagePlaceholder: {
    backgroundColor: COLORS.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  likeBadge: {
    position: 'absolute',
    bottom: 12, // bottom-3 = 12px
    right: 12, // right-3 = 12px
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4, // gap-1 = 4px
    backgroundColor: 'rgba(255,255,255,0.9)', // bg-white/90
    paddingHorizontal: 12, // px-3 = 12px
    paddingVertical: 6, // py-1.5 = 6px
    borderRadius: 999, // rounded-full
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, // shadow-md
    shadowRadius: 4,
    elevation: 3,
  },
  likeCount: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  postTextContainer: {
    marginTop: SPACING.sm,
    gap: SPACING.xs,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  locationText: {
    fontSize: 16, // text-base = 16px
    fontWeight: 'bold',
    color: COLORS.text, // text-text-primary-light
    flex: 1,
  },
  timeText: {
    fontSize: 12, // text-xs = 12px
    color: COLORS.textSecondary, // text-text-secondary-light
  },
  subLocationText: {
    fontSize: 14, // text-sm = 14px
    color: COLORS.textSecondary, // text-text-secondary-light
    marginTop: 2, // mt-0.5 = 2px
  },
  tagsScroll: {
    marginVertical: SPACING.xs,
  },
  tagsScrollContent: {
    gap: SPACING.xs,
  },
  tagBadge: {
    backgroundColor: COLORS.primary + '1A', // bg-primary/10
    paddingHorizontal: 10, // px-2.5 = 10px
    paddingVertical: 4, // py-1 = 4px
    borderRadius: 999, // rounded-full
    marginRight: 6, // gap-1.5 = 6px
  },
  tagText: {
    fontSize: 12, // text-xs
    fontWeight: '500', // font-medium
    color: COLORS.primary, // text-primary
  },
  noteText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});

export default RegionDetailScreen;
