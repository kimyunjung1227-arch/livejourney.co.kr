import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  ScrollView,
  Image,
  TextInput,
  Animated,
  PanResponder,
  Modal,
  Alert,
  Share,
  StatusBar,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/styles';
// import { BlurView } from 'expo-blur'; // 필요시 설치 후 사용

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BOTTOM_TAB_HEIGHT = 68;

const MapScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [posts, setPosts] = useState([]);
  const [visiblePins, setVisiblePins] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [sheetOffset, setSheetOffset] = useState(0);
  const [isSheetHidden, setIsSheetHidden] = useState(false);
  const [sheetHeight, setSheetHeight] = useState(200);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showSOSModal, setShowSOSModal] = useState(false);
  const [selectedSOSLocation, setSelectedSOSLocation] = useState(null);
  const [sosQuestion, setSosQuestion] = useState('');
  const [isSelectingLocation, setIsSelectingLocation] = useState(false);
  const [isRouteMode, setIsRouteMode] = useState(false); // 경로 모드 활성화 여부
  const [selectedRoutePins, setSelectedRoutePins] = useState([]); // 선택된 경로 핀들
  
  const sheetRef = useRef(null);
  const dragHandleRef = useRef(null);
  const sheetOffsetAnim = useRef(new Animated.Value(0)).current;
  const startY = useRef(0);

  // 네비게이션 바 숨기기
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  useEffect(() => {
    loadLocation();
    loadPosts();
  }, []);

  useEffect(() => {
    // visiblePins 업데이트 (현재는 posts를 그대로 사용)
    setVisiblePins(posts.map((post, index) => ({
      id: post.id || index,
      title: post.location || post.detailedLocation || '여행지',
      image: post.images?.[0] || post.image || '',
      lat: post.coordinates?.lat,
      lng: post.coordinates?.lng,
      post: post
    })));
  }, [posts]);

  const loadLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('위치 권한이 거부되었습니다.');
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error) {
      console.error('위치 가져오기 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async () => {
    try {
      const postsJson = await AsyncStorage.getItem('uploadedPosts');
      const allPosts = postsJson ? JSON.parse(postsJson) : [];
      
      const postsWithLocation = allPosts.filter(
        post => post.coordinates && post.coordinates.lat && post.coordinates.lng
      );
      
      setPosts(postsWithLocation);
    } catch (error) {
      console.error('게시물 로드 실패:', error);
    }
  };

  const updateVisiblePins = () => {
    // 현재는 모든 posts를 visiblePins로 설정 (실제 지도 구현 시 bounds 기반 필터링)
    setVisiblePins(posts.map((post, index) => ({
      id: post.id || index,
      title: post.location || post.detailedLocation || '여행지',
      image: post.images?.[0] || post.image || '',
      lat: post.coordinates?.lat,
      lng: post.coordinates?.lng,
      post: post
    })));
  };

  const handleZoomIn = () => {
    // 실제 지도 구현 시 사용
    console.log('줌 인');
  };

  const handleZoomOut = () => {
    // 실제 지도 구현 시 사용
    console.log('줌 아웃');
  };

  const handleCenterLocation = () => {
    // 실제 지도 구현 시 사용
    console.log('현재 위치로 이동');
  };

  // 핀을 경로에 추가하는 핸들러
  const handlePinSelectForRoute = (pin, index) => {
    if (!isRouteMode) {
      // 경로 모드가 아니면 경로 모드를 활성화하도록 안내
      Alert.alert(
        '경로 모드',
        '경로에 추가하려면 먼저 "경로 만들기" 버튼을 눌러주세요.',
        [
          { text: '취소', style: 'cancel' },
          { text: '경로 모드 켜기', onPress: () => setIsRouteMode(true) }
        ]
      );
      return;
    }

    const pinData = {
      post: pin.post,
      lat: pin.lat,
      lng: pin.lng,
      title: pin.title,
      image: pin.image,
      index
    };
    
    // 이미 선택된 핀인지 확인
    const isAlreadySelected = selectedRoutePins.some(p => p.post.id === pin.post.id);
    
    if (isAlreadySelected) {
      // 이미 선택된 핀은 제거
      const newPins = selectedRoutePins.filter(p => p.post.id !== pin.post.id);
      setSelectedRoutePins(newPins);
    } else {
      // 새로운 핀 추가
      const newPins = [...selectedRoutePins, pinData];
      setSelectedRoutePins(newPins);
    }
  };

  // 경로 모드 토글
  const toggleRouteMode = () => {
    const newMode = !isRouteMode;
    
    if (!newMode && selectedRoutePins.length > 0) {
      // 경로 모드 종료 시 경로 초기화 확인
      Alert.alert(
        '경로 모드 종료',
        '경로 모드를 종료하면 선택한 핀들이 초기화됩니다. 계속하시겠습니까?',
        [
          { text: '취소', style: 'cancel' },
          { 
            text: '종료', 
            onPress: () => {
              setIsRouteMode(false);
              setSelectedRoutePins([]);
              // 바텀 시트 다시 표시
              setIsSheetHidden(false);
              setSheetOffset(0);
              Animated.spring(sheetOffsetAnim, {
                toValue: 0,
                useNativeDriver: true,
              }).start();
            }
          }
        ]
      );
    } else {
      // 경로 모드 시작 또는 종료
      setIsRouteMode(newMode);
      if (newMode) {
        // 경로 모드 시작 시 바텀 시트 숨기기
        const hideOffset = sheetHeight + 20;
        setIsSheetHidden(true);
        setSheetOffset(hideOffset);
        Animated.spring(sheetOffsetAnim, {
          toValue: hideOffset,
          useNativeDriver: true,
        }).start();
      } else {
        // 경로 모드 종료 시 선택된 핀 초기화 및 바텀 시트 다시 표시
        setSelectedRoutePins([]);
        setIsSheetHidden(false);
        setSheetOffset(0);
        Animated.spring(sheetOffsetAnim, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    }
  };

  // 경로 초기화
  const clearRoute = () => {
    if (selectedRoutePins.length > 0) {
      Alert.alert(
        '경로 초기화',
        '선택한 모든 핀을 제거하시겠습니까?',
        [
          { text: '취소', style: 'cancel' },
          { 
            text: '초기화', 
            onPress: () => {
              setSelectedRoutePins([]);
            }
          }
        ]
      );
    } else {
      setSelectedRoutePins([]);
    }
  };

  // 경로 저장
  const saveRoute = async () => {
    if (selectedRoutePins.length < 2) {
      Alert.alert('알림', '경로를 만들려면 최소 2개 이상의 핀을 선택해주세요.');
      return;
    }

    const routeData = {
      id: `route-${Date.now()}`,
      pins: selectedRoutePins.map(pin => ({
        id: pin.post.id,
        location: pin.title,
        lat: pin.lat,
        lng: pin.lng,
        image: pin.image
      })),
      createdAt: new Date().toISOString()
    };

    try {
      const existingRoutesJson = await AsyncStorage.getItem('savedRoutes');
      const existingRoutes = existingRoutesJson ? JSON.parse(existingRoutesJson) : [];
      const updatedRoutes = [routeData, ...existingRoutes];
      await AsyncStorage.setItem('savedRoutes', JSON.stringify(updatedRoutes));
      Alert.alert('성공', '경로가 저장되었습니다!');
    } catch (error) {
      console.error('경로 저장 실패:', error);
      Alert.alert('오류', '경로 저장에 실패했습니다.');
    }
  };

  // 경로 공유
  const shareRoute = async () => {
    if (selectedRoutePins.length < 2) {
      Alert.alert('알림', '경로를 만들려면 최소 2개 이상의 핀을 선택해주세요.');
      return;
    }

    const routeData = {
      pins: selectedRoutePins.map(pin => ({
        location: pin.title,
        lat: pin.lat,
        lng: pin.lng
      }))
    };

    const shareUrl = `여행 경로: ${selectedRoutePins.map(p => p.title).join(' → ')}`;
    
    try {
      await Share.share({
        message: `${selectedRoutePins.length}개의 장소를 포함한 여행 경로를 공유합니다.\n${shareUrl}`,
        title: '여행 경로 공유'
      });
    } catch (error) {
      console.error('공유 실패:', error);
      Alert.alert('오류', '경로 공유에 실패했습니다.');
    }
  };

  const handleSOSRequest = () => {
    setIsSelectingLocation(true);
    setShowSOSModal(true);
  };

  const handleShowSheet = () => {
    setSheetOffset(0);
    setIsSheetHidden(false);
    Animated.spring(sheetOffsetAnim, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
  };

  // 드래그 핸들러
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        setIsDragging(true);
        startY.current = evt.nativeEvent.pageY;
      },
      onPanResponderMove: (evt, gestureState) => {
        const deltaY = gestureState.dy;
        // 아래로 드래그만 허용
        if (deltaY > 0) {
          setSheetOffset(deltaY);
          sheetOffsetAnim.setValue(deltaY);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        setIsDragging(false);
        const threshold = sheetHeight * 0.5;
        
        if (gestureState.dy > threshold) {
          // 시트 숨김
          const hideOffset = sheetHeight + 20;
          setSheetOffset(hideOffset);
          setIsSheetHidden(true);
          Animated.spring(sheetOffsetAnim, {
            toValue: hideOffset,
            useNativeDriver: true,
          }).start();
        } else {
          // 원래 위치로
          setSheetOffset(0);
          setIsSheetHidden(false);
          Animated.spring(sheetOffsetAnim, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {/* 지도 컨테이너 - 전체 화면에 지도가 보이도록 */}
      <View style={styles.mapContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>지도를 불러오는 중...</Text>
          </View>
        ) : (
          <View style={styles.mapPlaceholder}>
            <Ionicons name="map-outline" size={64} color={COLORS.textSubtle} />
            <Text style={styles.placeholderText}>지도 기능 준비 중</Text>
            <Text style={styles.placeholderSubtext}>
              {posts.length}개의 게시물이 지도에 표시됩니다
            </Text>
          </View>
        )}
      </View>

      {/* 검색바 - 투명 배경으로 지도가 보이도록 */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={24} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="지역 검색"
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => navigation.navigate('Search')}
          />
        </View>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={updateVisiblePins}
        >
          <View style={styles.refreshButtonBlur}>
            <Ionicons name="refresh" size={24} color="#666" />
          </View>
        </TouchableOpacity>
      </View>

      {/* 도움 요청 버튼 - 검색창과 분리, 투명 배경, 지도 위에 오버레이 (웹과 동일) */}
      <View style={styles.sosButtonContainer}>
        <TouchableOpacity
          style={styles.sosButton}
          onPress={handleSOSRequest}
          activeOpacity={0.8}
        >
          <View style={styles.sosButtonBlur}>
            <Text style={styles.sosButtonText}>지금 상황 알아보기</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* 경로 모드 토글 버튼 */}
      <View style={[
        styles.routeModeButtonContainer,
        { bottom: isRouteMode ? (selectedRoutePins.length >= 2 ? 200 : 120) : (isSheetHidden ? 120 : sheetHeight + 16 + BOTTOM_TAB_HEIGHT) }
      ]}>
        <TouchableOpacity
          style={[
            styles.routeModeButton,
            isRouteMode && styles.routeModeButtonActive
          ]}
          onPress={toggleRouteMode}
          activeOpacity={0.8}
        >
          <Ionicons 
            name="map" 
            size={20} 
            color={isRouteMode ? COLORS.textWhite : COLORS.text} 
          />
          <Text style={[
            styles.routeModeButtonText,
            isRouteMode && styles.routeModeButtonTextActive
          ]}>
            {isRouteMode ? '경로 모드' : '경로 만들기'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 선택된 핀 개수 배지 (경로 모드일 때만 표시) */}
      {isRouteMode && selectedRoutePins.length > 0 && (
        <View style={[
          styles.pinCountBadge,
          { 
            top: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 70 : 110,
            bottom: 'auto'
          }
        ]}>
          <Ionicons name="location" size={16} color={COLORS.textWhite} />
          <Text style={styles.pinCountBadgeText}>
            {selectedRoutePins.length}개 선택됨
          </Text>
        </View>
      )}

      {/* 경로 관리 버튼들 (경로 모드일 때만 표시) */}
      {isRouteMode && (
        <View style={[
          styles.routeControlsContainer,
          { bottom: BOTTOM_TAB_HEIGHT + 16, right: 16, left: 'auto' }
        ]}>
          <View style={styles.routeControls}>
            {selectedRoutePins.length > 0 && (
              <TouchableOpacity
                style={styles.routeControlButton}
                onPress={clearRoute}
                activeOpacity={0.8}
              >
                <Text style={styles.routeControlButtonText}>초기화</Text>
              </TouchableOpacity>
            )}
            {selectedRoutePins.length >= 2 && (
              <View style={styles.routeActionButtons}>
                <TouchableOpacity
                  style={[styles.routeControlButton, styles.routeControlButtonPrimary]}
                  onPress={saveRoute}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.routeControlButtonText, styles.routeControlButtonTextPrimary]}>
                    저장
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.routeControlButton, styles.routeControlButtonSuccess]}
                  onPress={shareRoute}
                  activeOpacity={0.8}
                >
                  <Ionicons name="share" size={16} color={COLORS.textWhite} />
                  <Text style={[styles.routeControlButtonText, styles.routeControlButtonTextSuccess]}>
                    공유
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      )}

      {/* 지도 컨트롤 버튼들 - 경로 모드일 때는 숨김 */}
      {!isRouteMode && (
        <View style={[
          styles.mapControls,
          { bottom: isSheetHidden ? 120 : sheetHeight + 16 + BOTTOM_TAB_HEIGHT }
        ]}>
          <TouchableOpacity style={styles.controlButton} onPress={handleZoomIn}>
            <Ionicons name="add" size={20} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={handleZoomOut}>
            <Ionicons name="remove" size={20} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={handleCenterLocation}>
            <Ionicons name="locate" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      )}

      {/* 사진 다시 보기 버튼 - 시트가 숨겨졌고 경로 모드가 아닐 때만 표시 */}
      {isSheetHidden && !isRouteMode && (
        <TouchableOpacity
          style={styles.showSheetButton}
          onPress={handleShowSheet}
          activeOpacity={0.8}
        >
          <Ionicons name="images" size={20} color={COLORS.primary} />
          <Text style={styles.showSheetButtonText}>사진 다시 보기</Text>
        </TouchableOpacity>
      )}

      {/* 주변 장소 바텀 시트 - 경로 모드가 아닐 때만 보임, 아래로 슬라이드 가능 (웹과 동일) */}
      {!isSelectingLocation && !isRouteMode && (
        <Animated.View
          ref={sheetRef}
          style={[
            styles.bottomSheet,
            {
              transform: [{ translateY: sheetOffsetAnim }],
            }
          ]}
          onLayout={(event) => {
            const { height } = event.nativeEvent.layout;
            setSheetHeight(height);
          }}
        >
          {/* 드래그 핸들 */}
          <View
            ref={dragHandleRef}
            {...panResponder.panHandlers}
            style={styles.dragHandle}
          >
            <View style={styles.dragHandleBar} />
          </View>

          {/* 시트 헤더 */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetHeaderTitle}>주변 장소</Text>
          </View>

          {/* 주변 장소 스크롤 - 4개 이상일 때만 좌우 슬라이드 가능 */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sheetScrollContent}
            pagingEnabled={false}
            snapToInterval={visiblePins.length >= 4 ? 102 : undefined} // 4개 이상일 때만 스냅
            snapToAlignment="start"
            decelerationRate="fast"
            scrollEventThrottle={16}
            scrollEnabled={visiblePins.length >= 4} // 4개 이상일 때만 스크롤 가능
          >
            {visiblePins.length > 0 ? (
              visiblePins.map((pin, index) => {
                const isSelected = selectedRoutePins.some(p => p.post.id === pin.post.id);
                const selectedIndex = selectedRoutePins.findIndex(p => p.post.id === pin.post.id);
                
                return (
                <TouchableOpacity
                  key={pin.id || index}
                  style={[
                    styles.pinCard,
                    isSelected && styles.pinCardSelected
                  ]}
                  activeOpacity={0.8}
                  onPress={() => {
                    // 경로 모드일 때는 경로에 추가, 아니면 게시물 상세 보기
                    if (isRouteMode) {
                      handlePinSelectForRoute(pin, index);
                    } else {
                      // 즉시 상세화면 표시
                      const postData = { 
                        post: pin.post, 
                        allPosts: posts, 
                        currentPostIndex: index 
                      };
                      setSelectedPost(postData);
                    }
                  }}
                  onLongPress={() => {
                    // 길게 누르면 경로 모드가 아니어도 경로에 추가할 수 있도록 (선택사항)
                    if (!isRouteMode) {
                      Alert.alert(
                        '경로 모드',
                        '경로에 추가하려면 먼저 "경로 만들기" 버튼을 눌러주세요.',
                        [
                          { text: '취소', style: 'cancel' },
                          { text: '경로 모드 켜기', onPress: () => setIsRouteMode(true) }
                        ]
                      );
                    }
                  }}
                >
                  {pin.image ? (
                    <Image
                      source={{ uri: pin.image }}
                      style={styles.pinCardImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.pinCardImage, styles.pinCardImagePlaceholder]}>
                      <Ionicons name="image-outline" size={24} color={COLORS.textSubtle} />
                    </View>
                  )}
                  <View style={styles.pinCardInfo}>
                    <Text style={styles.pinCardTitle} numberOfLines={1}>
                      {pin.title}
                    </Text>
                  </View>
                  {isSelected && (
                    <View style={styles.pinCardBadge}>
                      <Text style={styles.pinCardBadgeText}>
                        {selectedIndex + 1}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
              })
            ) : (
              <View style={styles.emptyPinsContainer}>
                <Text style={styles.emptyPinsText}>표시할 장소가 없습니다</Text>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      )}

      {/* 게시물 상세화면 모달 (웹과 동일) */}
      {selectedPost && (
        <Modal
          visible={!!selectedPost}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedPost(null)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setSelectedPost(null)}
          >
            <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
              {/* 헤더 */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalHeaderTitle}>
                  {selectedPost.post.location || selectedPost.post.detailedLocation || '여행지'}
                </Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setSelectedPost(null)}
                >
                  <Ionicons name="close" size={20} color="#666" />
                </TouchableOpacity>
              </View>

              {/* 이미지 */}
              {selectedPost.post.images?.[0] && (
                <Image
                  source={{ uri: selectedPost.post.images[0] }}
                  style={styles.modalImage}
                  resizeMode="cover"
                />
              )}

              {/* 내용 */}
              <ScrollView style={styles.modalBody}>
                {selectedPost.post.note && (
                  <Text style={styles.modalNote}>{selectedPost.post.note}</Text>
                )}
                <TouchableOpacity
                  style={styles.modalViewPostButton}
                  onPress={() => {
                    setSelectedPost(null);
                    navigation.navigate('PostDetail', {
                      postId: selectedPost.post.id,
                      post: selectedPost.post,
                      allPosts: selectedPost.allPosts,
                      currentPostIndex: selectedPost.currentPostIndex
                    });
                  }}
                >
                  <Text style={styles.modalViewPostButtonText}>게시물 보기</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* SOS 요청 모달 (웹과 동일) */}
      {showSOSModal && (
        <Modal
          visible={showSOSModal}
          transparent
          animationType="slide"
          onRequestClose={() => {
            setShowSOSModal(false);
            setIsSelectingLocation(false);
          }}
        >
          <View style={styles.sosModalOverlay}>
            <View style={styles.sosModalContent}>
              <View style={styles.sosModalHeader}>
                <Text style={styles.sosModalTitle}>도움 요청</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowSOSModal(false);
                    setIsSelectingLocation(false);
                  }}
                >
                  <Ionicons name="close" size={24} color={COLORS.text} />
                </TouchableOpacity>
              </View>
              <Text style={styles.sosModalDescription}>
                지도에서 위치를 선택하거나 궁금한 내용을 입력해주세요.
              </Text>
              <TextInput
                style={styles.sosModalInput}
                placeholder="예: 이 근처에 주차장이 있나요?"
                placeholderTextColor={COLORS.textSubtle}
                value={sosQuestion}
                onChangeText={setSosQuestion}
                multiline
              />
              <TouchableOpacity
                style={styles.sosModalSubmitButton}
                onPress={() => {
                  // SOS 요청 저장 로직 (웹과 동일)
                  Alert.alert('알림', '도움 요청이 등록되었습니다.');
                  setShowSOSModal(false);
                  setIsSelectingLocation(false);
                  setSosQuestion('');
                }}
              >
                <Text style={styles.sosModalSubmitButtonText}>요청하기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  mapContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: BOTTOM_TAB_HEIGHT,
    zIndex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    gap: SPACING.md,
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  // 검색바 (투명 배경, blur)
  searchBarContainer: {
    position: 'absolute',
    top: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 50,
    left: 16,
    right: 16,
    zIndex: 10,
    flexDirection: 'row',
    gap: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 28,
    minHeight: 52,
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontWeight: '400',
  },
  refreshButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  refreshButtonBlur: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 26,
  },
  // SOS 버튼
  sosButtonContainer: {
    position: 'absolute',
    top: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 70 : 110,
    left: 16,
    zIndex: 10,
  },
  sosButton: {
    borderRadius: 20,
  },
  sosButtonBlur: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  sosButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  // 지도 컨트롤 버튼들 (웹과 동일)
  mapControls: {
    position: 'absolute',
    right: 16,
    zIndex: 30,
    gap: 8,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  // 사진 다시 보기 버튼 (웹과 동일)
  showSheetButton: {
    position: 'absolute',
    bottom: 120,
    left: '50%',
    transform: [{ translateX: -SCREEN_WIDTH / 4 }],
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    zIndex: 25,
  },
  showSheetButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  // 바텀 시트 (웹과 동일)
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: BOTTOM_TAB_HEIGHT,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.4,
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  dragHandle: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  dragHandleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#d4d4d8',
    borderRadius: 2,
  },
  sheetHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f4f4f5',
  },
  sheetHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  sheetScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    gap: 12,
    minHeight: 110,
  },
  pinCard: {
    width: 90,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    flexDirection: 'column', // 사진이 위, 지역명이 아래
  },
  pinCardImage: {
    width: '100%',
    height: 90,
  },
  pinCardImagePlaceholder: {
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinCardInfo: {
    padding: 6,
    backgroundColor: 'white',
  },
  pinCardTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
  },
  pinCardSelected: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  pinCardBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  pinCardBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  emptyPinsContainer: {
    width: SCREEN_WIDTH - 32,
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyPinsText: {
    fontSize: 14,
    color: '#999',
  },
  // 모달 (웹과 동일)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '100%',
    maxWidth: SCREEN_WIDTH - 40,
    maxHeight: SCREEN_HEIGHT - 200,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: '#f5f5f5',
  },
  modalBody: {
    padding: 16,
  },
  modalNote: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 16,
  },
  modalViewPostButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalViewPostButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  // SOS 모달 (웹과 동일)
  sosModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sosModalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  sosModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sosModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  sosModalDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  sosModalInput: {
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: 12,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 16,
  },
  sosModalSubmitButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  sosModalSubmitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // 경로 모드 버튼
  routeModeButtonContainer: {
    position: 'absolute',
    left: 16,
    zIndex: 30,
  },
  routeModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  routeModeButtonActive: {
    backgroundColor: COLORS.primary,
  },
  routeModeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  routeModeButtonTextActive: {
    color: COLORS.textWhite,
  },
  // 경로 관리 컨트롤
  routeControlsContainer: {
    position: 'absolute',
    right: 16,
    zIndex: 30,
  },
  routeControls: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
    gap: 8,
    alignItems: 'flex-end',
  },
  routeActionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  routeControlButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    minWidth: 60,
  },
  routeControlButtonPrimary: {
    backgroundColor: COLORS.primary,
  },
  routeControlButtonSuccess: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  routeControlButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  routeControlButtonTextPrimary: {
    color: COLORS.textWhite,
  },
  routeControlButtonTextSuccess: {
    color: COLORS.textWhite,
  },
  // 선택된 핀 개수 배지
  pinCountBadge: {
    position: 'absolute',
    left: 16,
    zIndex: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  pinCountBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textWhite,
  },
});

export default MapScreen;
