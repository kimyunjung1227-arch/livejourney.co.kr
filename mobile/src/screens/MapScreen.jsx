import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/styles';
import { getCoordinatesByLocation, searchRegions } from '../utils/regionLocationMapping';
import { filterRecentPosts, getTimeAgo } from '../utils/timeUtils';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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
  const navigation = useNavigation();
  const mapRef = useRef(null);
  
  const [allPins, setAllPins] = useState([]);
  const [visiblePins, setVisiblePins] = useState([]);
  const [mapLoading, setMapLoading] = useState(true);
  const [selectedPinId, setSelectedPinId] = useState(null);
  const [region, setRegion] = useState({
          latitude: 37.5665,
          longitude: 126.9780,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
  });
  
  // 게시물 팝업
  const [showPostPopup, setShowPostPopup] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  
  // 검색
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  
  // 하단 시트
  const [showSheet, setShowSheet] = useState(true);
  const [sheetHeight, setSheetHeight] = useState(240);
  const sheetPan = useRef(new Animated.Value(0)).current;
  const [isDragging, setIsDragging] = useState(false);
  
  // 사진 리스트 스크롤
  const photoListScrollRef = useRef(null);
  const [isPhotoListDragging, setIsPhotoListDragging] = useState(false);
  
  // 현재 위치
  const [currentLocation, setCurrentLocation] = useState(null);
  
  // 데이터 로드
  const loadAllData = useCallback(async () => {
    try {
      const postsJson = await AsyncStorage.getItem('uploadedPosts');
      let posts = postsJson ? JSON.parse(postsJson) : [];
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
      updateVisiblePins(pins);
      setMapLoading(false);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
      setMapLoading(false);
    }
  }, []);
  
  // 보이는 핀 업데이트
  const updateVisiblePins = useCallback((pins = allPins) => {
    if (!mapRef.current || pins.length === 0) {
      setVisiblePins([]);
      return;
    }
    
    // 지도 영역에 있는 핀만 필터링
    // react-native-maps는 bounds를 직접 제공하지 않으므로 region 기반으로 계산
    const visible = pins.filter(p => {
      const latDiff = Math.abs(p.lat - region.latitude);
      const lngDiff = Math.abs(p.lng - region.longitude);
      return latDiff <= region.latitudeDelta / 2 && lngDiff <= region.longitudeDelta / 2;
    });
    
    setVisiblePins(visible);
  }, [allPins, region]);
  
  // 지도 영역 변경 시
  const handleRegionChangeComplete = useCallback((newRegion) => {
    setRegion(newRegion);
    updateVisiblePins();
  }, [updateVisiblePins]);
  
  // 초기화
  useEffect(() => {
    loadAllData();
    
    // 현재 위치 가져오기
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          setCurrentLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
          
          // 지도 중심을 현재 위치로 이동
          if (mapRef.current) {
            mapRef.current.animateToRegion({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }, 1000);
          }
        }
      } catch (error) {
        console.error('위치 가져오기 실패:', error);
      }
    })();
  }, [loadAllData]);
  
  // 검색
  const handleSearchChange = (text) => {
    setSearchQuery(text);
    
    if (text.trim()) {
      const results = searchRegions(text);
      setSearchResults(results.slice(0, 10));
    } else {
      setSearchResults([]);
    }
  };
  
  const selectRegion = useCallback((regionName) => {
    const coords = getCoordinatesByLocation(regionName);
    if (coords && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: coords.lat,
        longitude: coords.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  }, []);
  
  // 새로고침
  const refresh = () => {
    loadAllData();
  };
  
  // 핀 클릭 핸들러
  const handlePinPress = (pin) => {
    setSelectedPinId(pin.id);
    setSelectedPost(pin.post);
    setShowPostPopup(true);
  };
  
  // 주변장소 시트 사진 클릭
  const handlePhotoPress = (pin) => {
    setSelectedPinId(pin.id);
    
    // 지도에 있는 핀으로 이동 (선택 사항)
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: pin.lat,
        longitude: pin.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 500);
    }
  };
  
  // 시트 드래그
  const sheetPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setIsDragging(true);
      },
      onPanResponderMove: (evt, gestureState) => {
        if (gestureState.dy > 0) {
          sheetPan.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        setIsDragging(false);
        
        if (gestureState.dy > 80) {
          // 시트 닫기
          Animated.timing(sheetPan, {
            toValue: SCREEN_HEIGHT,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            setShowSheet(false);
            sheetPan.setValue(0);
          });
        } else {
          // 시트 열기
          Animated.spring(sheetPan, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;
  
  return (
    <SafeAreaView style={styles.container}>
      {/* 지도 */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={region}
        onRegionChangeComplete={handleRegionChangeComplete}
        showsUserLocation={!!currentLocation}
        showsMyLocationButton={false}
      >
        {/* 사진 핀들 */}
        {allPins.map((pin) => {
          const isSelected = selectedPinId === pin.id;
          return (
            <Marker
              key={pin.id}
              coordinate={{ latitude: pin.lat, longitude: pin.lng }}
              identifier={pin.id}
              onPress={() => handlePinPress(pin)}
              anchor={{ x: 0.5, y: 1 }}
            >
              <Animated.View
                style={[
                  styles.pinContainer,
                  isSelected && styles.pinContainerSelected,
                  isSelected && {
                    transform: [{ scale: 1.5 }],
                  },
                ]}
              >
                <Image
                  source={{ uri: pin.image }}
                  style={styles.pinImage}
                  resizeMode="cover"
                />
                {isSelected && (
                  <View style={styles.pinSelectedBorder} />
                )}
              </Animated.View>
            </Marker>
          );
        })}
      </MapView>
      
      {/* 지도 로딩 */}
      {mapLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>지도 로딩 중...</Text>
        </View>
      )}
      
      {/* 상단 - 검색바 + 새로고침 */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => setShowSearch(true)}
        >
          <Ionicons name="search" size={20} color={COLORS.textSecondary} />
          <Text style={styles.searchButtonText}>지역 검색</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.refreshButton} onPress={refresh}>
          <Ionicons name="refresh" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>
      
      {/* 우측 컨트롤 */}
      <View style={styles.rightControls}>
        <View style={styles.zoomControls}>
          <TouchableOpacity
            style={styles.zoomButton}
            onPress={() => {
              if (mapRef.current) {
                mapRef.current.animateToRegion({
                  ...region,
                  latitudeDelta: region.latitudeDelta * 0.5,
                  longitudeDelta: region.longitudeDelta * 0.5,
                }, 300);
              }
            }}
          >
            <Ionicons name="add" size={20} color={COLORS.text} />
          </TouchableOpacity>
          <View style={styles.zoomDivider} />
          <TouchableOpacity
            style={styles.zoomButton}
            onPress={() => {
              if (mapRef.current) {
                mapRef.current.animateToRegion({
                  ...region,
                  latitudeDelta: region.latitudeDelta * 2,
                  longitudeDelta: region.longitudeDelta * 2,
                }, 300);
              }
            }}
          >
            <Ionicons name="remove" size={20} color={COLORS.text} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.locationButton}
          onPress={async () => {
            try {
              const { status } = await Location.requestForegroundPermissionsAsync();
              if (status === 'granted') {
                const location = await Location.getCurrentPositionAsync({});
                if (mapRef.current) {
                  mapRef.current.animateToRegion({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }, 1000);
                }
              }
            } catch (error) {
              console.error('위치 가져오기 실패:', error);
            }
          }}
        >
          <Ionicons name="locate" size={20} color={COLORS.text} />
        </TouchableOpacity>
      </View>
      
      {/* 시트 열기 버튼 */}
      {!showSheet && (
        <View style={styles.sheetOpenButtonContainer}>
          <TouchableOpacity
            style={styles.sheetOpenButton}
            onPress={() => setShowSheet(true)}
          >
            <Ionicons name="images" size={20} color={COLORS.backgroundLight} />
            <Text style={styles.sheetOpenButtonText}>사진 다시 보기</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* 하단 시트 - 주변 장소 */}
      {showSheet && (
        <Animated.View
          style={[
            styles.sheet,
            {
              transform: [{ translateY: sheetPan }],
            },
          ]}
          {...sheetPanResponder.panHandlers}
        >
          {/* 드래그 핸들 */}
          <View style={styles.sheetHandle}>
            <View style={styles.sheetHandleBar} />
            <Text style={styles.sheetTitle}>주변 장소</Text>
          </View>
          
          {/* 사진 리스트 */}
          {visiblePins.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="location-outline" size={50} color={COLORS.textSubtle} />
              <Text style={styles.emptyText}>이 지역에 사진이 없어요</Text>
            </View>
          ) : (
            <ScrollView
              ref={photoListScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.photoList}
              scrollEnabled={!isPhotoListDragging}
            >
              {visiblePins.map((pin) => (
                <TouchableOpacity
                  key={pin.id}
                  style={styles.photoItem}
                  onPress={() => handlePhotoPress(pin)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.photoImageContainer,
                    selectedPinId === pin.id && styles.photoImageContainerSelected
                  ]}>
                    <Image
                      source={{ uri: pin.image }}
                      style={styles.photoImage}
                      resizeMode="cover"
                    />
                    {pin.post?.categoryName && (
                      <View style={styles.categoryIcon}>
                        <Text style={styles.categoryEmoji}>
                          {pin.post.categoryName === '개화 상황' && '🌸'}
                          {pin.post.categoryName === '맛집 정보' && '🍜'}
                          {(!pin.post.categoryName || !['개화 상황', '맛집 정보'].includes(pin.post.categoryName)) && '🏞️'}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.photoTitle} numberOfLines={1}>
                    {pin.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </Animated.View>
      )}
      
      {/* 검색 모달 */}
      <Modal
        visible={showSearch}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSearch(false)}
      >
        <View style={styles.searchModal}>
          <View style={styles.searchModalContent}>
            <View style={styles.searchModalHeader}>
              <Text style={styles.searchModalTitle}>지역 검색</Text>
              <TouchableOpacity
                onPress={() => setShowSearch(false)}
                style={styles.searchModalCloseButton}
              >
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="지역 검색 (예: ㄱ, ㅅ, 서울, 부산)"
                value={searchQuery}
                onChangeText={handleSearchChange}
                autoFocus
              />
            </View>
            <ScrollView style={styles.searchResults}>
              {searchQuery && searchResults.length > 0 ? (
                searchResults.slice(0, 8).map((r, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.searchResultItem}
                    onPress={() => selectRegion(r)}
                  >
                    <Ionicons name="location" size={20} color={COLORS.primary} />
                    <Text style={styles.searchResultText}>{r}</Text>
                  </TouchableOpacity>
                ))
              ) : searchQuery ? (
                <View style={styles.searchEmpty}>
                  <Ionicons name="search-outline" size={48} color={COLORS.textSubtle} />
                  <Text style={styles.searchEmptyText}>"{searchQuery}" 검색 결과가 없어요</Text>
                  <Text style={styles.searchEmptySubtext}>다른 지역명을 입력해보세요</Text>
                </View>
              ) : (
                <View style={styles.searchEmpty}>
                  <Ionicons name="map-outline" size={48} color={COLORS.textSubtle} />
                  <Text style={styles.searchEmptyText}>지역을 검색하세요</Text>
                  <Text style={styles.searchEmptySubtext}>💡 초성 검색 가능</Text>
                  <Text style={styles.searchEmptySubtext}>예: ㄱ → 강릉, 경주</Text>
                  <Text style={styles.searchEmptySubtext}>예: ㅅ → 서울, 수원</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
      
      {/* 게시물 상세 팝업 */}
      <Modal
        visible={showPostPopup}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowPostPopup(false);
          setSelectedPost(null);
        }}
      >
        <TouchableOpacity
          style={styles.popupOverlay}
          activeOpacity={1}
          onPress={() => {
            setShowPostPopup(false);
            setSelectedPost(null);
          }}
        >
          <TouchableOpacity
            style={styles.popupContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <View style={styles.popupHeader}>
              <Text style={styles.popupTitle}>사진 정보</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowPostPopup(false);
                  setSelectedPost(null);
                }}
                style={styles.popupCloseButton}
              >
                <Ionicons name="close" size={20} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            
            {/* 스크롤 가능한 컨텐츠 */}
            <ScrollView style={styles.popupScrollContent} showsVerticalScrollIndicator={false}>
              {/* 이미지/동영상 */}
              <View style={styles.popupImageContainer}>
                {selectedPost?.videos && selectedPost.videos.length > 0 ? (
                  <Text style={styles.videoPlaceholder}>동영상 재생</Text>
                ) : (
                  <Image
                    source={{ uri: selectedPost?.images?.[0] || selectedPost?.image }}
                    style={styles.popupImage}
                    resizeMode="cover"
                  />
                )}
              </View>
              
              {/* 작성자 정보 */}
              <View style={styles.popupAuthor}>
                <View style={styles.popupAvatar}>
                  <Ionicons name="person" size={24} color={COLORS.textSecondary} />
                </View>
                <View style={styles.popupAuthorInfo}>
                  <Text style={styles.popupAuthorName}>
                    {selectedPost?.user || selectedPost?.userId || '여행자'}
                  </Text>
                  {selectedPost?.categoryName && (
                    <Text style={styles.popupCategory}>{selectedPost.categoryName}</Text>
                  )}
                </View>
              </View>
              
              {/* 위치 정보 */}
              <View style={styles.popupLocation}>
                <View style={styles.popupLocationRow}>
                  <Ionicons name="location" size={20} color={COLORS.primary} />
                  <Text style={styles.popupLocationText}>
                    {selectedPost?.detailedLocation || selectedPost?.placeName || selectedPost?.location || '여행지'}
                  </Text>
                </View>
                {selectedPost?.detailedLocation && selectedPost.detailedLocation !== selectedPost.location && (
                  <Text style={styles.popupLocationSubtext}>{selectedPost.location}</Text>
                )}
                {selectedPost?.timeLabel && (
                  <Text style={styles.popupTime}>{selectedPost.timeLabel}</Text>
                )}
              </View>
              
              {/* 태그 */}
              {((selectedPost?.tags && selectedPost.tags.length > 0) || (selectedPost?.aiLabels && selectedPost.aiLabels.length > 0)) && (
                <View style={styles.popupTags}>
                  {(selectedPost.tags || []).map((tag, index) => {
                    const tagText = typeof tag === 'string' ? tag.replace('#', '') : tag.name || '태그';
                    const koreanTag = tagTranslations[tagText.toLowerCase()] || tagText;
                    return (
                      <View key={index} style={styles.tag}>
                        <Text style={styles.tagText}>#{koreanTag}</Text>
                      </View>
                    );
                  })}
                  {(selectedPost.aiLabels || []).map((label, index) => {
                    const labelText = typeof label === 'string' ? label : (label?.name || label?.label || String(label || ''));
                    const koreanLabel = labelText && typeof labelText === 'string' 
                      ? (tagTranslations[labelText.toLowerCase()] || labelText)
                      : String(labelText || '');
                    return (
                      <View key={`ai-${index}`} style={styles.tag}>
                        <Text style={styles.tagText}>#{koreanLabel}</Text>
                      </View>
                    );
                  })}
                </View>
              )}
              
              {/* 내용 */}
              {selectedPost?.note && (
                <View style={styles.popupNote}>
                  <Text style={styles.popupNoteText}>{selectedPost.note}</Text>
                </View>
              )}
              
              {/* 좋아요/댓글 */}
              <View style={styles.popupActions}>
                <TouchableOpacity style={styles.popupActionButton}>
                  <Ionicons name="heart-outline" size={24} color={COLORS.text} />
                  <Text style={styles.popupActionText}>{selectedPost?.likes || selectedPost?.likeCount || 0}</Text>
                </TouchableOpacity>
                <View style={styles.popupActionButton}>
                  <Ionicons name="chatbubble-outline" size={24} color={COLORS.text} />
                  <Text style={styles.popupActionText}>
                    {(selectedPost?.comments || []).length + (selectedPost?.qnaList || []).length}
                  </Text>
                </View>
              </View>
              
              {/* 상세 보기 버튼 */}
              <TouchableOpacity
                style={styles.popupDetailButton}
                onPress={() => {
                  setShowPostPopup(false);
                  navigation.navigate('PostDetail', { postId: selectedPost?.id, post: selectedPost });
                }}
              >
                <Text style={styles.popupDetailButtonText}>상세 보기</Text>
              </TouchableOpacity>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  topBar: {
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.md,
    right: SPACING.md,
    flexDirection: 'row',
    gap: SPACING.sm,
    zIndex: 40,
  },
  searchButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 12,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchButtonText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  refreshButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rightControls: {
    position: 'absolute',
    right: SPACING.md,
    bottom: 320,
    zIndex: 40,
    gap: SPACING.sm,
  },
  zoomControls: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  zoomButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomDivider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  locationButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sheetOpenButtonContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 100,
    alignItems: 'center',
    zIndex: 40,
  },
  sheetOpenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  sheetOpenButtonText: {
    color: COLORS.backgroundLight,
    fontSize: 16,
    fontWeight: '600',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 68,
    height: 240,
    backgroundColor: COLORS.backgroundLight,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    zIndex: 40,
  },
  sheetHandle: {
    padding: SPACING.md,
  },
  sheetHandleBar: {
    width: 64,
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 999,
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyText: {
    marginTop: SPACING.md,
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  photoList: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    gap: SPACING.md,
  },
  photoItem: {
    width: 96,
    marginRight: SPACING.md,
  },
  photoImageContainer: {
    width: 96,
    height: 96,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: SPACING.xs,
    borderWidth: 3,
    borderColor: COLORS.backgroundLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  photoImageContainerSelected: {
    borderColor: COLORS.primary,
    borderWidth: 3,
    transform: [{ scale: 1.05 }],
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  categoryIcon: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 1,
  },
  categoryEmoji: {
    fontSize: 18,
  },
  photoTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    lineHeight: 16,
  },
  searchModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-start',
  },
  searchModalContent: {
    backgroundColor: COLORS.backgroundLight,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    maxHeight: '75%',
  },
  searchModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  searchModalCloseButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: COLORS.borderLight,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: SPACING.md,
    backgroundColor: COLORS.borderLight,
    borderRadius: 999,
    paddingHorizontal: SPACING.md,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: SPACING.md,
    fontSize: 14,
    color: COLORS.text,
  },
  searchResults: {
    maxHeight: 400,
    padding: SPACING.md,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    borderRadius: 8,
    backgroundColor: COLORS.borderLight,
    marginBottom: SPACING.sm,
  },
  searchResultText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  searchEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl,
  },
  searchEmptyText: {
    marginTop: SPACING.md,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  searchEmptySubtext: {
    marginTop: SPACING.xs,
    fontSize: 13,
    color: COLORS.textSubtle,
  },
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  popupContent: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 20,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  popupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  popupTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  popupCloseButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: COLORS.borderLight,
  },
  popupScrollContent: {
    padding: SPACING.md,
  },
  popupImageContainer: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    backgroundColor: COLORS.borderLight,
  },
  popupImage: {
    width: '100%',
    height: '100%',
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    color: COLORS.textSecondary,
  },
  popupAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  popupAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupAuthorInfo: {
    flex: 1,
  },
  popupAuthorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  popupCategory: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  popupLocation: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.borderLight,
    borderRadius: 12,
  },
  popupLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  popupLocationText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  popupLocationSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 28,
    marginTop: 4,
  },
  popupTime: {
    fontSize: 12,
    color: COLORS.textSubtle,
    marginLeft: 28,
    marginTop: 4,
  },
  popupTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  tag: {
    backgroundColor: '#fff5f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.primary,
  },
  popupNote: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
    backgroundColor: '#fafafa',
    borderRadius: 12,
  },
  popupNoteText: {
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.text,
  },
  popupActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  popupActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  popupActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  popupDetailButton: {
    width: '100%',
    padding: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  popupDetailButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.backgroundLight,
  },
  pinContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    overflow: 'visible',
    borderWidth: 3,
    borderColor: COLORS.backgroundLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  pinContainerSelected: {
    borderWidth: 4,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 10,
  },
  pinSelectedBorder: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 12,
    borderWidth: 4,
    borderColor: COLORS.primary,
    opacity: 0.3,
  },
  pinImage: {
    width: '100%',
    height: '100%',
  },
});

export default MapScreen;
