import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  Modal,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/styles';
import { useAuth } from '../contexts/AuthContext';
import { analyzeImageForTags, getRecommendedTags } from '../utils/aiImageAnalyzer';
import { getCurrentTimestamp, getTimeAgo } from '../utils/timeUtils';
import { checkAndAwardTitles } from '../utils/dailyTitleSystem';
import { gainExp } from '../utils/levelSystem';
import { checkNewBadges, awardBadge } from '../utils/badgeSystem';
import { getBadgeCongratulationMessage, getBadgeDifficultyEffects } from '../utils/badgeMessages';
import { checkAndNotifyInterestPlace } from '../utils/interestPlaces';
import { ScreenLayout, ScreenContent, ScreenHeader, ScreenBody } from '../components/ScreenLayout';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const UploadScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [formData, setFormData] = useState({
    images: [],
    imageFiles: [],
    videos: [],
    videoFiles: [],
    location: '',
    tags: [],
    note: '',
    coordinates: null,
    aiCategory: 'scenic',
    aiCategoryName: '추천 장소',
    aiCategoryIcon: '📍'
  });
  const [tagInput, setTagInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [autoTags, setAutoTags] = useState([]);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [loadingAITags, setLoadingAITags] = useState(false);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [earnedBadge, setEarnedBadge] = useState(null);
  const [showTitleModal, setShowTitleModal] = useState(false);
  const [earnedTitle, setEarnedTitle] = useState(null);
  const reanalysisTimerRef = useRef(null);
  
  // 뱃지 모달 애니메이션
  const badgeIconScale = useRef(new Animated.Value(0)).current;
  const badgeIconRotation = useRef(new Animated.Value(0)).current;
  const badgeGlowOpacity = useRef(new Animated.Value(0)).current;
  const badgeSparkleOpacity = useRef(new Animated.Value(0)).current;

  const getCurrentLocation = useCallback(async () => {
    try {
      setLoadingLocation(true);
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 필요', '위치 정보를 사용하려면 권한이 필요합니다.');
        setLoadingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;
      
      // 역지오코딩 (주소 변환)
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (reverseGeocode && reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        const parts = [];
        
        if (address.city) parts.push(address.city);
        if (address.district) parts.push(address.district);
        if (address.street) parts.push(address.street);
        
        let locationName = parts.slice(0, 2).join(' ')
          .replace('특별시', '')
          .replace('광역시', '')
          .replace('특별자치시', '')
          .replace('특별자치도', '')
          .trim();
        
        if (!locationName) {
          locationName = address.city || address.district || '서울';
        }
        
        setFormData(prev => ({
          ...prev,
          location: locationName,
          coordinates: { lat: latitude, lng: longitude },
          detailedLocation: locationName
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          location: '서울',
          coordinates: { lat: latitude, lng: longitude }
        }));
      }
      
      setLoadingLocation(false);
    } catch (error) {
      console.error('위치 감지 실패:', error);
      setFormData(prev => ({
        ...prev,
        location: '서울',
        coordinates: { lat: 37.5665, lng: 126.9780 }
      }));
      setLoadingLocation(false);
    }
  }, []);

  const analyzeImageAndGenerateTags = useCallback(async (imageUri, location = '', note = '') => {
    setLoadingAITags(true);
    try {
      const analysisResult = await analyzeImageForTags(imageUri, location, note);
      
      if (analysisResult.success) {
        const hashtagged = analysisResult.tags.map(tag => 
          tag.startsWith('#') ? tag : `#${tag}`
        );
        
        setAutoTags(hashtagged);
        setFormData(prev => ({
          ...prev,
          aiCategory: analysisResult.category,
          aiCategoryName: analysisResult.categoryName,
          aiCategoryIcon: analysisResult.categoryIcon
        }));
      } else {
        const recommendedTags = getRecommendedTags('all');
        setAutoTags(recommendedTags.map(tag => `#${tag}`).slice(0, 8));
        
        setFormData(prev => ({
          ...prev,
          aiCategory: 'scenic',
          aiCategoryName: '추천 장소',
          aiCategoryIcon: '📍'
        }));
      }
    } catch (error) {
      console.error('AI 분석 실패:', error);
      const defaultTags = ['여행', '추억', '풍경', '힐링', '맛집'];
      setAutoTags(defaultTags.map(tag => `#${tag}`));
      
      setFormData(prev => ({
        ...prev,
        aiCategory: 'scenic',
        aiCategoryName: '추천 장소',
        aiCategoryIcon: '📍'
      }));
    } finally {
      setLoadingAITags(false);
    }
  }, []);

  const handleImageSelect = useCallback(async (result) => {
    if (result.canceled) return;

    const assets = result.assets || [];
    if (assets.length === 0) return;

    const MAX_SIZE = 50 * 1024 * 1024;
    const MAX_VIDEO_SIZE = 100 * 1024 * 1024;
    
    const imageFiles = [];
    const videoFiles = [];
    const imageUris = [];
    const videoUris = [];
    
    for (const asset of assets) {
      const isVideo = asset.type?.startsWith('video/') || asset.uri?.includes('video');
      const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_SIZE;
      
      if (asset.fileSize && asset.fileSize > maxSize) {
        Alert.alert('파일 크기 초과', `${asset.fileName || '파일'}은(는) ${isVideo ? '100MB' : '50MB'}를 초과합니다`);
        continue;
      }
      
      if (isVideo) {
        videoFiles.push(asset);
        videoUris.push(asset.uri);
      } else {
        imageFiles.push(asset);
        imageUris.push(asset.uri);
      }
    }

    const isFirstMedia = formData.images.length === 0 && formData.videos.length === 0;
    
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...imageUris],
      imageFiles: [...prev.imageFiles, ...imageFiles],
      videos: [...prev.videos, ...videoUris],
      videoFiles: [...prev.videoFiles, ...videoFiles]
    }));

    if (isFirstMedia && (imageFiles.length > 0 || videoFiles.length > 0)) {
      getCurrentLocation();
      const firstFile = imageFiles[0] || videoFiles[0];
      if (firstFile && !firstFile.type?.startsWith('video/')) {
        analyzeImageAndGenerateTags(firstFile.uri, formData.location, formData.note);
      }
    }
  }, [formData.images.length, formData.videos.length, formData.location, formData.note, getCurrentLocation, analyzeImageAndGenerateTags]);

  useEffect(() => {
    if (formData.imageFiles.length === 0) return;
    
    if (reanalysisTimerRef.current) {
      clearTimeout(reanalysisTimerRef.current);
    }
    
    reanalysisTimerRef.current = setTimeout(() => {
      if (formData.location || formData.note) {
        const firstFile = formData.imageFiles[0];
        if (firstFile) {
          analyzeImageAndGenerateTags(firstFile.uri, formData.location, formData.note);
        }
      }
    }, 1000);
    
    return () => {
      if (reanalysisTimerRef.current) {
        clearTimeout(reanalysisTimerRef.current);
      }
    };
  }, [formData.location, formData.note, formData.imageFiles, analyzeImageAndGenerateTags]);

  const handlePhotoOptionSelect = useCallback(async (option) => {
    setShowPhotoOptions(false);
    
    try {
      if (option === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('권한 필요', '카메라를 사용하려면 권한이 필요합니다.');
          return;
        }
        
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.All,
          allowsEditing: true,
          quality: 0.8,
          allowsMultipleSelection: false,
        });
        
        handleImageSelect(result);
      } else {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
          Alert.alert('권한 필요', '갤러리를 사용하려면 권한이 필요합니다.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      quality: 0.8,
      allowsMultipleSelection: true,
    });

        handleImageSelect(result);
      }
    } catch (error) {
      console.error('이미지 선택 실패:', error);
      Alert.alert('오류', '이미지를 선택하는 중 오류가 발생했습니다.');
    }
  }, [handleImageSelect]);

  const addTag = useCallback(() => {
    if (tagInput.trim() && !formData.tags.includes(`#${tagInput.trim()}`)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, `#${tagInput.trim()}`]
      }));
      setTagInput('');
    }
  }, [tagInput, formData.tags]);

  const removeTag = useCallback((tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  }, []);

  const addAutoTag = useCallback((tag) => {
    const cleanTag = tag.replace('#', '');
    
    const alreadyExists = formData.tags.some(t => 
      t.replace('#', '') === cleanTag
    );
    
    if (!alreadyExists) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, cleanTag]
      }));
      setAutoTags(prev => prev.filter(t => t.replace('#', '') !== cleanTag));
    }
  }, [formData.tags]);

  const checkAndAwardBadge = useCallback(async () => {
    try {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🏆 뱃지 체크 시작');
      
      // 데이터 저장 확인
      const postsJson = await AsyncStorage.getItem('uploadedPosts');
      const posts = postsJson ? JSON.parse(postsJson) : [];
      console.log(`📊 저장된 게시물 수: ${posts.length}개`);
      
      const newBadges = await checkNewBadges();
      console.log(`📋 발견된 새 뱃지: ${newBadges.length}개`);
      
      if (newBadges.length > 0) {
        const badge = newBadges[0];
        console.log(`🎁 뱃지 획득 시도: ${badge.name} (난이도: ${badge.difficulty})`);
        const awarded = await awardBadge(badge);
        
        if (awarded) {
          console.log(`✅ 뱃지 획득 성공: ${badge.name}`);
          setEarnedBadge(badge);
          await gainExp(`뱃지 획득 (${badge.difficulty})`);
          
          // 애니메이션 시작
          startBadgeAnimation(badge.difficulty);
          
          // 뱃지 모달 표시 (약간의 지연을 두어 애니메이션이 시작되도록)
          setTimeout(() => {
            setShowBadgeModal(true);
            console.log('🎉 뱃지 모달 표시');
          }, 300);
          
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          return true;
        } else {
          console.log(`⚠️ 뱃지 획득 실패: ${badge.name}`);
        }
      } else {
        console.log('❌ 획득 가능한 새 뱃지 없음');
      }
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return false;
    } catch (error) {
      console.error('❌ 뱃지 체크 실패:', error);
      console.error('에러 상세:', error.stack);
      return false;
    }
  }, [startBadgeAnimation]);

  // 뱃지 애니메이션 시작 함수
  const startBadgeAnimation = useCallback((difficulty) => {
    const effects = getBadgeDifficultyEffects(difficulty);
    
    // 애니메이션 값 초기화
    badgeIconScale.setValue(0);
    badgeIconRotation.setValue(0);
    badgeGlowOpacity.setValue(0);
    badgeSparkleOpacity.setValue(0);
    
    // 난이도별 애니메이션
    if (difficulty === '상') {
      // 화려한 효과: 스케일 + 회전 + 글로우 + 반짝임
      Animated.parallel([
        Animated.sequence([
          Animated.spring(badgeIconScale, {
            toValue: effects.iconScale,
            friction: 3,
            tension: 40,
            useNativeDriver: true,
          }),
          Animated.timing(badgeIconScale, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(badgeIconRotation, {
            toValue: 1,
            duration: effects.animationDuration,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(badgeGlowOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.loop(
            Animated.sequence([
              Animated.timing(badgeGlowOpacity, {
                toValue: 0.5,
                duration: 1000,
                useNativeDriver: true,
              }),
              Animated.timing(badgeGlowOpacity, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
              }),
            ])
          ),
        ]),
        Animated.sequence([
          Animated.timing(badgeSparkleOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.loop(
            Animated.sequence([
              Animated.timing(badgeSparkleOpacity, {
                toValue: 0.3,
                duration: 800,
                useNativeDriver: true,
              }),
              Animated.timing(badgeSparkleOpacity, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
              }),
            ])
          ),
        ]),
      ]).start();
    } else if (difficulty === '중') {
      // 중간 효과: 스케일 + 글로우
      Animated.parallel([
        Animated.spring(badgeIconScale, {
          toValue: effects.iconScale,
          friction: 4,
          tension: 30,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(badgeGlowOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.loop(
            Animated.sequence([
              Animated.timing(badgeGlowOpacity, {
                toValue: 0.6,
                duration: 1200,
                useNativeDriver: true,
              }),
              Animated.timing(badgeGlowOpacity, {
                toValue: 1,
                duration: 1200,
                useNativeDriver: true,
              }),
            ])
          ),
        ]),
      ]).start();
    } else {
      // 간단한 효과: 스케일만
      Animated.spring(badgeIconScale, {
        toValue: 1,
        friction: 5,
        tension: 20,
        useNativeDriver: true,
      }).start();
    }
  }, [badgeIconScale, badgeIconRotation, badgeGlowOpacity, badgeSparkleOpacity]);

  const handleSubmit = useCallback(async () => {
    if (formData.images.length === 0 && formData.videos.length === 0) {
      Alert.alert('알림', '사진 또는 동영상을 추가해주세요');
      return;
    }

    if (!formData.location.trim()) {
      Alert.alert('알림', '위치를 입력해주세요');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(10);
      
      const aiCategory = formData.aiCategory || 'scenic';
      const aiCategoryName = formData.aiCategoryName || '추천 장소';
      const aiLabels = formData.tags || [];
      
      setUploadProgress(60);
      
      const userJson = await AsyncStorage.getItem('user');
      const savedUser = userJson ? JSON.parse(userJson) : {};
      const currentUser = user || savedUser;
      const username = currentUser?.username || currentUser?.email?.split('@')[0] || '모사모';
      const currentUserId = currentUser?.id || savedUser?.id || 'test_user_001';
      
      console.log('📸 게시물 저장 정보:', {
        userId: currentUserId,
        username: username,
        images: formData.images.length,
        location: formData.location
      });
      
      // 지역 정보 추출 (첫 번째 단어를 지역으로 사용)
      const region = formData.location?.split(' ')[0] || '기타';
      
      const uploadedPost = {
        id: `local-${Date.now()}`,
        userId: currentUserId,
        images: formData.images,
        videos: formData.videos,
        location: formData.location,
        tags: formData.tags,
        note: formData.note,
        timestamp: getCurrentTimestamp(),
        createdAt: getCurrentTimestamp(),
        timeLabel: getTimeAgo(new Date()),
        user: username,
        likes: 0,
        isNew: true,
        isLocal: true,
        category: aiCategory,
        categoryName: aiCategoryName,
        aiLabels: aiLabels,
        coordinates: formData.coordinates,
        detailedLocation: formData.location,
        placeName: formData.location,
        region: region // 지역 정보 추가
      };
      
      const existingPostsJson = await AsyncStorage.getItem('uploadedPosts');
      const existingPosts = existingPostsJson ? JSON.parse(existingPostsJson) : [];
      const updatedPosts = [uploadedPost, ...existingPosts];
      await AsyncStorage.setItem('uploadedPosts', JSON.stringify(updatedPosts));
      
      console.log('✅ 게시물 저장 완료:', {
        저장된게시물수: updatedPosts.length,
        새게시물ID: uploadedPost.id,
        새게시물userId: uploadedPost.userId
      });
      
      setUploadProgress(100);
      setShowSuccessModal(true);
      
      // 데이터 저장 완료 대기 후 뱃지 체크
      setTimeout(async () => {
        // 사진 업로드 시 레벨 상승 (실제 업로드만)
        const expResult = await gainExp('사진 업로드');
        if (expResult.levelUp) {
          console.log(`Level up! Lv.${expResult.newLevel}`);
        }
        
        // 뱃지 체크 (타이틀보다 먼저 체크)
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🏆 뱃지 체크 시작');
        const earnedBadgeResult = await checkAndAwardBadge();
        console.log('뱃지 체크 완료 - 진행률 업데이트됨');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        // 뱃지를 획득했으면 성공 모달 닫고 뱃지 모달 표시
        if (earnedBadgeResult) {
          console.log('✅ 뱃지 획득! 성공 모달 닫고 뱃지 모달 표시');
          setShowSuccessModal(false);
          // 뱃지 모달은 checkAndAwardBadge에서 이미 표시됨
          return;
        }
        
        // 타이틀 체크 (뱃지가 없을 때만)
        const earnedTitleResult = await checkAndAwardTitles(user?.id || savedUser.id || 'test_user_001');
        if (earnedTitleResult) {
          console.log(`24-hour title earned: ${earnedTitleResult.name}`);
          setEarnedTitle(earnedTitleResult);
          setShowSuccessModal(false); // 성공 모달 닫기
          setShowTitleModal(true);
          await gainExp('24시간 타이틀');
          return;
        }
        
        // 뱃지도 타이틀도 없으면 성공 모달만 표시 후 메인으로 이동
        setTimeout(() => {
          setShowSuccessModal(false);
          navigation.navigate('MainTab');
        }, 2000);
      }, 1000); // 500ms -> 1000ms로 증가하여 데이터 저장 완료 대기
    } catch (error) {
      console.error('Upload failed:', error);
      Alert.alert('오류', '업로드에 실패했습니다. 다시 시도해주세요');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [formData, user, navigation, checkAndAwardBadge]);

  return (
    <ScreenLayout>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* 헤더 - 웹과 동일한 구조 (ScreenContent 밖) */}
        <ScreenHeader>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>업로드: 여행 기록</Text>
            <View style={styles.headerPlaceholder} />
          </View>
        </ScreenHeader>

        {/* 메인 컨텐츠 - 웹과 동일한 구조 */}
        <ScreenContent>
          <ScreenBody>
            <View style={styles.content}>
            {/* 사진 추가 */}
            <View style={styles.section}>
              {formData.images.length === 0 && formData.videos.length === 0 ? (
                <TouchableOpacity
                  style={styles.addPhotoButton}
                  onPress={() => setShowPhotoOptions(true)}
                  activeOpacity={0.9}
                >
                  <Ionicons name="add-circle" size={48} color={COLORS.primary} />
                  <Text style={styles.addPhotoText}>사진 또는 동영상 추가</Text>
                  <Text style={styles.addPhotoSubtext}>최대 10개까지</Text>
                </TouchableOpacity>
              ) : (
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={true}
                  style={styles.photoScrollView}
                  contentContainerStyle={styles.photoScrollContent}
                  bounces={false}
                >
                  {formData.images.map((image, index) => (
                    <View key={index} style={styles.photoItem}>
                      <Image source={{ uri: image }} style={styles.photoImage} resizeMode="cover" />
                      <TouchableOpacity
                        style={styles.removePhotoButton}
                        onPress={() => setFormData(prev => ({
                          ...prev,
                          images: prev.images.filter((_, i) => i !== index),
                          imageFiles: prev.imageFiles.filter((_, i) => i !== index)
                        }))}
                      >
                        <Ionicons name="close" size={12} color="white" />
                      </TouchableOpacity>
                    </View>
                  ))}
                  {formData.videos.map((video, index) => (
                    <View key={`video-${index}`} style={styles.photoItem}>
                      <View style={styles.videoPlaceholder}>
                        <Ionicons name="videocam" size={20} color={COLORS.textSubtle} />
                      </View>
                      <TouchableOpacity
                        style={styles.removePhotoButton}
                        onPress={() => setFormData(prev => ({
                          ...prev,
                          videos: prev.videos.filter((_, i) => i !== index),
                          videoFiles: prev.videoFiles.filter((_, i) => i !== index)
                        }))}
                      >
                        <Ionicons name="close" size={12} color="white" />
                      </TouchableOpacity>
                    </View>
                  ))}
                  {(formData.images.length + formData.videos.length) < 10 && (
                    <TouchableOpacity
                      style={styles.addMoreButton}
                      onPress={() => setShowPhotoOptions(true)}
                      activeOpacity={0.9}
                    >
                      <Ionicons name="add" size={20} color={COLORS.primary} />
                    </TouchableOpacity>
                  )}
                </ScrollView>
              )}
            </View>

            {/* 위치 태그 */}
            <View style={styles.section}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>📍 어디에서 찍었나요?</Text>
                {loadingLocation && (
                  <Text style={styles.loadingText}>위치 감지 중...</Text>
                )}
              </View>
              <View style={styles.locationInputRow}>
                <TextInput
                  style={styles.locationInput}
                  placeholder="어디에서 찍은 사진인가요? (예: 서울 남산, 부산 해운대)"
                  placeholderTextColor={COLORS.textSubtle}
                  value={formData.location}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
                />
                <TouchableOpacity
                  style={styles.locationButton}
                  onPress={getCurrentLocation}
                  disabled={loadingLocation}
                >
                  <Ionicons name="location" size={20} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* 해시태그 */}
            <View style={styles.section}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>🏷️ 태그 추가</Text>
                {loadingAITags && (
                  <Text style={styles.loadingText}>AI 분석 중...</Text>
                )}
              </View>
              <View style={styles.tagInputRow}>
                <TextInput
                  style={styles.tagInput}
                  placeholder="#여행 #추억"
                  placeholderTextColor={COLORS.textSubtle}
                  value={tagInput}
                  onChangeText={setTagInput}
                  onSubmitEditing={addTag}
                  returnKeyType="done"
                />
                <TouchableOpacity
                  style={styles.addTagButton}
                  onPress={addTag}
                >
                  <Text style={styles.addTagButtonText}>추가</Text>
                </TouchableOpacity>
              </View>

              {loadingAITags && (
                <View style={styles.aiLoadingContainer}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                  <Text style={styles.aiLoadingText}>AI 분석 중...</Text>
                </View>
              )}

              {!loadingAITags && autoTags.length > 0 && (
                <View style={styles.autoTagsContainer}>
                  <Text style={styles.autoTagsTitle}>AI 추천 태그</Text>
                  <View style={styles.autoTagsList}>
                    {autoTags.map((tag) => (
                      <TouchableOpacity
                        key={tag}
                        style={styles.autoTagButton}
                        onPress={() => addAutoTag(tag)}
                      >
                        <Text style={styles.autoTagText}>{tag}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {formData.tags.length > 0 && (
                <View style={styles.myTagsContainer}>
                  <Text style={styles.myTagsTitle}>내 태그</Text>
                  <View style={styles.myTagsList}>
                    {formData.tags.map((tag) => (
                      <View key={tag} style={styles.myTagBadge}>
                        <Text style={styles.myTagText}>{tag}</Text>
                        <TouchableOpacity onPress={() => removeTag(tag)}>
                          <Ionicons name="close-circle" size={16} color={COLORS.primary} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* 개인 노트 */}
            <View style={styles.section}>
              <Text style={styles.label}>✍️ 이 순간의 이야기 (선택사항)</Text>
              <TextInput
                style={styles.noteInput}
                placeholder="내용을 입력하세요"
                placeholderTextColor={COLORS.textSubtle}
                value={formData.note}
                onChangeText={(text) => setFormData(prev => ({ ...prev, note: text }))}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* 업로드 버튼 */}
            <View style={styles.uploadButtonContainer}>
              <TouchableOpacity
                style={[
                  styles.uploadButton,
                  (uploading || formData.images.length === 0 || !formData.location.trim()) && styles.uploadButtonDisabled
                ]}
                onPress={handleSubmit}
                disabled={uploading || formData.images.length === 0 || !formData.location.trim()}
                activeOpacity={0.8}
              >
                {uploading ? (
                  <>
                    <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />
                    <Text style={styles.uploadButtonText}>업로드 중...</Text>
                  </>
                ) : (
                  <Text style={styles.uploadButtonText}>📤 여행 기록 업로드하기</Text>
                )}
              </TouchableOpacity>
              {(formData.images.length === 0 || !formData.location.trim()) && (
                <Text style={styles.uploadHint}>
                  {formData.images.length === 0 ? '사진을 추가해주세요' : '위치를 입력해주세요'}
                </Text>
              )}
            </View>
            </View>
          </ScreenBody>
        </ScreenContent>

        {/* 사진 선택 모달 */}
        <Modal
          visible={showPhotoOptions}
          transparent
          animationType="slide"
          onRequestClose={() => setShowPhotoOptions(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowPhotoOptions(false)}
          >
            <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
              <Text style={styles.modalTitle}>사진 선택</Text>
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => handlePhotoOptionSelect('camera')}
              >
                <Ionicons name="camera" size={24} color={COLORS.text} />
                <Text style={styles.modalOptionText}>촬영하기</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => handlePhotoOptionSelect('gallery')}
              >
                <Ionicons name="images" size={24} color={COLORS.text} />
                <Text style={styles.modalOptionText}>갤러리에서 선택하기</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setShowPhotoOptions(false)}
              >
                <Text style={styles.modalCancelText}>취소</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* 성공 모달 */}
        <Modal
          visible={showSuccessModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowSuccessModal(false)}
        >
          <View style={styles.successModalOverlay}>
            <View style={styles.successModalContent}>
              <View style={styles.successIconContainer}>
                <Ionicons name="checkmark-circle" size={80} color={COLORS.success} />
              </View>
              <Text style={styles.successTitle}>업로드 완료!</Text>
              <Text style={styles.successMessage}>
                여행 기록이 성공적으로 업로드되었습니다
              </Text>
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
                </View>
                <Text style={styles.progressText}>업로드 중.. {uploadProgress}%</Text>
              </View>
            </View>
          </View>
        </Modal>

        {/* 뱃지 모달 */}
        <Modal
          visible={showBadgeModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowBadgeModal(false)}
        >
          <View style={styles.badgeModalOverlay}>
            <View style={styles.badgeModalContent}>
              <View style={styles.badgeIconContainer}>
                {earnedBadge && (() => {
                  const effects = getBadgeDifficultyEffects(earnedBadge.difficulty);
                  const rotation = badgeIconRotation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  });
                  
                  return (
                    <>
                      {/* 글로우 효과 (중, 상 난이도) */}
                      {earnedBadge.difficulty !== '하' && (
                        <Animated.View
                          style={[
                            styles.badgeGlow,
                            {
                              opacity: badgeGlowOpacity,
                              backgroundColor: effects.glowColor,
                              transform: [{ scale: badgeIconScale }],
                            },
                          ]}
                        />
                      )}
                      {/* 아이콘 */}
                      <Animated.View
                        style={{
                          transform: [
                            { scale: badgeIconScale },
                            { rotate: earnedBadge.difficulty === '상' ? rotation : '0deg' },
                          ],
                        }}
                      >
                        <Text style={styles.badgeIcon}>{earnedBadge.icon || '🏆'}</Text>
                      </Animated.View>
                      {/* 반짝임 효과 (상 난이도만) */}
                      {earnedBadge.difficulty === '상' && (
                        <Animated.View
                          style={[
                            styles.badgeSparkle,
                            { opacity: badgeSparkleOpacity },
                          ]}
                        >
                          <Text style={styles.badgeSparkleText}>✨</Text>
                        </Animated.View>
                      )}
                      <View style={styles.badgeNewBadge}>
                        <Text style={styles.badgeNewText}>NEW!</Text>
                      </View>
                    </>
                  );
                })()}
              </View>
              {earnedBadge && (() => {
                const message = getBadgeCongratulationMessage(earnedBadge.name);
                return (
                  <>
                    <Text style={styles.badgeTitle}>{message.title}</Text>
                    <Text style={styles.badgeName}>{earnedBadge.name}</Text>
                    <View style={styles.badgeDifficultyContainer}>
                      <View style={[
                        styles.badgeDifficultyBadge,
                        earnedBadge.difficulty === '상' && styles.badgeDifficultyHigh,
                        earnedBadge.difficulty === '중' && styles.badgeDifficultyMedium,
                        earnedBadge.difficulty === '하' && styles.badgeDifficultyLow
                      ]}>
                        <Text style={styles.badgeDifficultyText}>
                          난이도: {earnedBadge.difficulty || '하'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.badgeSubtitle}>{message.subtitle}</Text>
                    <Text style={styles.badgeMessage}>{message.message}</Text>
                  </>
                );
              })()}
              <View style={styles.badgeButtons}>
                <TouchableOpacity
                  style={styles.badgeButtonPrimary}
                  onPress={() => {
                    setShowBadgeModal(false);
                    setShowSuccessModal(false);
                    navigation.navigate('ProfileTab');
                  }}
                >
                  <Text style={styles.badgeButtonPrimaryText}>내 프로필에서 확인하기</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.badgeButtonSecondary}
                  onPress={() => {
                    setShowBadgeModal(false);
                    setShowSuccessModal(false);
                    navigation.navigate('MainTab');
                  }}
                >
                  <Text style={styles.badgeButtonSecondaryText}>메인으로 가기</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* 타이틀 획득 축하 모달 */}
        <Modal
          visible={showTitleModal}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setShowTitleModal(false);
            setShowSuccessModal(false);
            navigation.navigate('MainTab');
          }}
        >
          <View style={styles.titleModalOverlay}>
            <View style={styles.titleModalContent}>
              <View style={styles.titleIconContainer}>
                <View style={styles.titleIconCircle}>
                  <Text style={styles.titleIcon}>{earnedTitle?.icon || '👑'}</Text>
                </View>
                <View style={styles.titleNewBadge}>
                  <Text style={styles.titleNewText}>VIP</Text>
                </View>
              </View>
              <Text style={styles.titleModalTitle}>축하합니다!</Text>
              <Text style={styles.titleModalName}>{earnedTitle?.name || '타이틀'}</Text>
              <View style={styles.titleCategoryContainer}>
                <View style={styles.titleCategoryBadge}>
                  <Text style={styles.titleCategoryText}>
                    {earnedTitle?.category || '24시간 타이틀'}
                  </Text>
                </View>
              </View>
              <Text style={styles.titleModalMessage}>24시간 타이틀을 획득했습니다!</Text>
              <Text style={styles.titleModalDescription}>
                {earnedTitle?.description || '오늘 하루 동안 이 타이틀을 유지할 수 있습니다!'}
              </Text>
              <View style={styles.titleButtons}>
                <TouchableOpacity
                  style={styles.titleButtonPrimary}
                  onPress={() => {
                    setShowTitleModal(false);
                    setShowSuccessModal(false);
                    navigation.navigate('MainTab');
                  }}
                >
                  <Text style={styles.titleButtonPrimaryText}>확인</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12, // py-3 = 12px (웹: padding: 12px 16px)
    paddingHorizontal: SPACING.md, // px-4 = 16px (웹: padding: 12px 16px)
    backgroundColor: 'transparent', // 웹: background: transparent
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 64, // h-16 = 64px
    paddingHorizontal: SPACING.md, // px-4
    backgroundColor: COLORS.backgroundLight, // bg-white
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight + '80', // border-subtle-light/50
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 20,
  },
  closeButton: {
    width: 40, // size-10 = 40px
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8, // rounded-lg (웹과 동일)
  },
  headerTitle: {
    fontSize: 18, // text-lg = 18px (웹: fontSize: '18px')
    fontWeight: '700', // font-bold (웹: fontWeight: 700)
    color: COLORS.text, // text-gray-900 (웹: color: '#111827')
    flex: 1,
    textAlign: 'center',
  },
  headerPlaceholder: {
    width: 40, // w-10 = 40px
  },
  content: {
    padding: SPACING.md, // p-4 = 16px (웹: padding: '0 16px 100px 16px'에서 내부 div는 p-4)
    gap: SPACING.md, // space-y-4 = 16px (웹: space-y-4)
  },
  section: {
    marginBottom: SPACING.md,
  },
  addPhotoButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: 48,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  addPhotoText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  addPhotoSubtext: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  photoScrollView: {
    marginHorizontal: -SPACING.md,
    maxHeight: 120,
  },
  photoScrollContent: {
    paddingHorizontal: SPACING.md,
    paddingRight: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  photoItem: {
    width: 100,
    height: 100,
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  videoText: {
    fontSize: 12,
    color: COLORS.textSubtle,
  },
  removePhotoButton: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 999,
    padding: 3,
  },
  addMoreButton: {
    width: 100,
    height: 100,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 0,
  },
  photoCountContainer: {
    marginTop: SPACING.sm,
    alignItems: 'center',
  },
  photoCountText: {
    fontSize: 12,
    color: COLORS.textSubtle,
    textAlign: 'center',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  label: {
    fontSize: 16, // text-base = 16px
    fontWeight: '500', // font-medium
    color: COLORS.text, // text-text-light
  },
  loadingText: {
    fontSize: 12,
    color: COLORS.primary,
  },
  locationInputRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'center',
  },
  locationInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    fontSize: 15,
    fontWeight: 'normal',
    color: COLORS.text,
    backgroundColor: COLORS.backgroundLight,
  },
  locationButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primary + '1A',
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagInputRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'center',
  },
  tagInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    fontSize: 15,
    fontWeight: 'normal',
    color: COLORS.text,
    backgroundColor: COLORS.backgroundLight,
  },
  addTagButton: {
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addTagButtonText: {
    fontSize: 14, // text-sm = 14px
    fontWeight: 'bold',
    color: COLORS.backgroundLight, // text-white
  },
  aiLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.primary + '10',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  aiLoadingText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.primary,
  },
  autoTagsContainer: {
    marginTop: SPACING.sm,
  },
  autoTagsTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  autoTagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  autoTagButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.primary + '10',
    borderWidth: 1,
    borderColor: COLORS.primary + '20',
  },
  autoTagText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.primary,
  },
  myTagsContainer: {
    marginTop: SPACING.md,
  },
  myTagsTitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  myTagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  myTagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 999,
    backgroundColor: COLORS.primary + '20',
  },
  myTagText: {
    fontSize: 14,
    color: COLORS.primary,
  },
  noteInput: {
    width: '100%',
    minHeight: 80,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: SPACING.md,
    fontSize: 15,
    fontWeight: 'normal',
    color: COLORS.text,
    backgroundColor: COLORS.backgroundLight,
    marginTop: SPACING.sm,
  },
  uploadButtonContainer: {
    marginTop: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  uploadButton: {
    width: '100%',
    height: 56,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  uploadButtonDisabled: {
    backgroundColor: COLORS.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  uploadButtonText: {
    ...TYPOGRAPHY.h3,
    fontWeight: 'bold',
    color: COLORS.backgroundLight,
    fontSize: 16,
  },
  uploadButtonTextDisabled: {
    color: COLORS.textSubtle,
  },
  uploadHint: {
    fontSize: 12,
    color: COLORS.textSubtle,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.backgroundLight,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  modalTitle: {
    ...TYPOGRAPHY.h2,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalOptionText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
  },
  modalCancel: {
    padding: SPACING.md,
    backgroundColor: COLORS.borderLight,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.text,
  },
  successModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  successModalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 16,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  successIconContainer: {
    marginBottom: SPACING.md,
  },
  successTitle: {
    ...TYPOGRAPHY.h2,
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  successMessage: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  progressContainer: {
    width: '100%',
    marginTop: SPACING.md,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: COLORS.borderLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.textSubtle,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  badgeModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
    zIndex: 1000, // 다른 모달보다 위에 표시
  },
  badgeModalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 24,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 4,
    borderColor: COLORS.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  badgeIconContainer: {
    position: 'relative',
    marginBottom: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeIcon: {
    fontSize: 64,
    zIndex: 2,
  },
  badgeGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    opacity: 0.3,
    zIndex: 1,
  },
  badgeSparkle: {
    position: 'absolute',
    top: -20,
    right: -20,
    zIndex: 3,
  },
  badgeSparkleText: {
    fontSize: 32,
  },
  badgeNewBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: COLORS.error,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeNewText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.backgroundLight,
  },
  badgeTitle: {
    ...TYPOGRAPHY.h1,
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  badgeName: {
    ...TYPOGRAPHY.h2,
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.md,
  },
  badgeDifficultyContainer: {
    marginBottom: SPACING.md,
  },
  badgeDifficultyBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 999,
    backgroundColor: COLORS.success,
  },
  badgeDifficultyHigh: {
    backgroundColor: '#9333ea',
  },
  badgeDifficultyMedium: {
    backgroundColor: '#3b82f6',
  },
  badgeDifficultyLow: {
    backgroundColor: COLORS.success,
  },
  badgeDifficultyText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.backgroundLight,
  },
  badgeMessage: {
    ...TYPOGRAPHY.body,
    fontWeight: '500',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  badgeDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  badgeButtons: {
    width: '100%',
    gap: SPACING.md,
  },
  badgeButtonPrimary: {
    width: '100%',
    paddingVertical: SPACING.md,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  badgeButtonPrimaryText: {
    ...TYPOGRAPHY.body,
    fontWeight: 'bold',
    color: COLORS.backgroundLight,
  },
  badgeButtonSecondary: {
    width: '100%',
    paddingVertical: SPACING.md,
    borderRadius: 12,
    backgroundColor: COLORS.borderLight,
    alignItems: 'center',
  },
  badgeButtonSecondaryText: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.text,
  },
  // 타이틀 모달 스타일
  titleModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  titleModalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFF5F0',
    borderRadius: 24,
    padding: SPACING.xl,
    borderWidth: 4,
    borderColor: COLORS.primary,
  },
  titleIconContainer: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
    position: 'relative',
  },
  titleIconCircle: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleIcon: {
    fontSize: 64,
  },
  titleNewBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  titleNewText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  titleModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  titleModalName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#B45309',
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  titleCategoryContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  titleCategoryBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 9999,
  },
  titleCategoryText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  titleModalMessage: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  titleModalDescription: {
    fontSize: 14,
    color: COLORS.textSubtle,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  titleButtons: {
    gap: SPACING.sm,
  },
  titleButtonPrimary: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  titleButtonPrimaryText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default UploadScreen;
