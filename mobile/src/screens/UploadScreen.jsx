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
  const reanalysisTimerRef = useRef(null);

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
      const newBadges = await checkNewBadges();
      
      if (newBadges.length > 0) {
        const badge = newBadges[0];
        const awarded = await awardBadge(badge);
        
        if (awarded) {
          setEarnedBadge(badge);
          setShowBadgeModal(true);
          await gainExp(`뱃지 획득 (${badge.difficulty})`);
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('뱃지 체크 실패:', error);
      return false;
    }
  }, []);

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
      const username = user?.username || savedUser.username || '모사모';
      
      const uploadedPost = {
        id: `local-${Date.now()}`,
        userId: user?.id || savedUser.id || 'test_user_001',
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
        placeName: formData.location
      };
      
      const existingPostsJson = await AsyncStorage.getItem('uploadedPosts');
      const existingPosts = existingPostsJson ? JSON.parse(existingPostsJson) : [];
      await AsyncStorage.setItem('uploadedPosts', JSON.stringify([uploadedPost, ...existingPosts]));
      
      setUploadProgress(100);
      setShowSuccessModal(true);
      
      setTimeout(async () => {
        const expResult = await gainExp('사진 업로드');
        if (expResult.levelUp) {
          console.log(`Level up! Lv.${expResult.newLevel}`);
        }
        
        const earnedTitle = await checkAndAwardTitles(user?.id || savedUser.id || 'test_user_001');
        if (earnedTitle) {
          console.log(`24-hour title earned: ${earnedTitle.name}`);
          await gainExp('24시간 타이틀');
        }
        
        const earnedBadgeResult = await checkAndAwardBadge();
        
        if (!earnedBadgeResult) {
          setTimeout(() => {
            setShowSuccessModal(false);
            navigation.navigate('MainTab');
          }, 2000);
        }
      }, 500);
    } catch (error) {
      console.error('Upload failed:', error);
      Alert.alert('오류', '업로드에 실패했습니다. 다시 시도해주세요');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [formData, user, navigation, checkAndAwardBadge]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="close" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>업로드: 여행 기록</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {/* 사진 추가 */}
            <View style={styles.section}>
              {formData.images.length === 0 && formData.videos.length === 0 ? (
                <TouchableOpacity
                  style={styles.addPhotoButton}
                  onPress={() => setShowPhotoOptions(true)}
                  activeOpacity={0.9}
                >
                  <Ionicons name="add-circle" size={64} color={COLORS.primary} />
                  <Text style={styles.addPhotoText}>사진 추가</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.photoGrid}>
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
                        <Ionicons name="close-circle" size={24} color={COLORS.backgroundLight} />
                      </TouchableOpacity>
                    </View>
                  ))}
                  {formData.videos.map((video, index) => (
                    <View key={`video-${index}`} style={styles.photoItem}>
                      <View style={styles.videoPlaceholder}>
                        <Ionicons name="videocam" size={32} color={COLORS.textSubtle} />
                        <Text style={styles.videoText}>동영상</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.removePhotoButton}
                        onPress={() => setFormData(prev => ({
                          ...prev,
                          videos: prev.videos.filter((_, i) => i !== index),
                          videoFiles: prev.videoFiles.filter((_, i) => i !== index)
                        }))}
                      >
                        <Ionicons name="close-circle" size={24} color={COLORS.backgroundLight} />
                      </TouchableOpacity>
                    </View>
                  ))}
                  <TouchableOpacity
                    style={styles.addMoreButton}
                    onPress={() => setShowPhotoOptions(true)}
                    activeOpacity={0.9}
                  >
                    <Ionicons name="add" size={32} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* 위치 태그 */}
            <View style={styles.section}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>위치 태그</Text>
                {loadingLocation && (
                  <Text style={styles.loadingText}>현재 위치 감지 중...</Text>
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
                <Text style={styles.label}>해시태그</Text>
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
                  <Text style={styles.aiLoadingText}>AI가 이미지를 분석하고 있습니다...</Text>
                </View>
              )}

              {!loadingAITags && formData.aiCategoryName && formData.images.length > 0 && (
                <View style={styles.aiCategoryContainer}>
                  <Text style={styles.aiCategoryEmoji}>{formData.aiCategoryIcon}</Text>
                  <View style={styles.aiCategoryInfo}>
                    <Text style={styles.aiCategoryLabel}>AI 자동 분류</Text>
                    <Text style={styles.aiCategoryName}>{formData.aiCategoryName}</Text>
                  </View>
                  <View style={styles.aiCategoryBadge}>
                    <Text style={styles.aiCategoryBadgeText}>자동</Text>
                  </View>
                </View>
              )}

              {!loadingAITags && autoTags.length > 0 && (
                <View style={styles.autoTagsContainer}>
                  <View style={styles.autoTagsHeader}>
                    <View style={styles.autoTagsHeaderLeft}>
                      <Ionicons name="sparkles" size={16} color={COLORS.primary} />
                      <Text style={styles.autoTagsTitle}>AI 추천 태그</Text>
                      <Text style={styles.autoTagsSubtitle}>(클릭하여 추가)</Text>
                    </View>
                    {formData.imageFiles.length > 0 && (
                      <TouchableOpacity
                        onPress={() => {
                          const firstFile = formData.imageFiles[0];
                          if (firstFile) {
                            analyzeImageAndGenerateTags(firstFile.uri, formData.location, formData.note);
                          }
                        }}
                      >
                        <Text style={styles.reanalyzeButton}>재분석</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <View style={styles.autoTagsList}>
                    {autoTags.map((tag) => (
                      <TouchableOpacity
                        key={tag}
                        style={styles.autoTagButton}
                        onPress={() => addAutoTag(tag)}
                      >
                        <Text style={styles.autoTagText}>{tag}</Text>
                        <Ionicons name="add-circle" size={16} color={COLORS.primary} />
                      </TouchableOpacity>
                    ))}
                  </View>
                  <Text style={styles.autoTagsNote}>
                    AI가 이미지를 분석해서 자동으로 생성한 태그입니다
                  </Text>
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
              <Text style={styles.label}>개인 노트</Text>
              <TextInput
                style={styles.noteInput}
                placeholder="내용을 입력하세요"
                placeholderTextColor={COLORS.textSubtle}
                value={formData.note}
                onChangeText={(text) => setFormData(prev => ({ ...prev, note: text }))}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
            </View>
          </View>
        </ScrollView>

        {/* 업로드 버튼 */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.uploadButton,
              (uploading || formData.images.length === 0) && styles.uploadButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={uploading || formData.images.length === 0}
          >
            <Text style={[
              styles.uploadButtonText,
              (uploading || formData.images.length === 0) && styles.uploadButtonTextDisabled
            ]}>
              {uploading ? '업로드 중..' : '업로드'}
            </Text>
          </TouchableOpacity>
        </View>

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
                <Text style={styles.badgeIcon}>{earnedBadge?.icon || '🏆'}</Text>
                <View style={styles.badgeNewBadge}>
                  <Text style={styles.badgeNewText}>NEW!</Text>
                </View>
              </View>
              <Text style={styles.badgeTitle}>축하합니다!</Text>
              <Text style={styles.badgeName}>{earnedBadge?.name || '뱃지'}</Text>
              <View style={styles.badgeDifficultyContainer}>
                <View style={[
                  styles.badgeDifficultyBadge,
                  earnedBadge?.difficulty === '상' && styles.badgeDifficultyHigh,
                  earnedBadge?.difficulty === '중' && styles.badgeDifficultyMedium,
                  earnedBadge?.difficulty === '하' && styles.badgeDifficultyLow
                ]}>
                  <Text style={styles.badgeDifficultyText}>
                    난이도: {earnedBadge?.difficulty || '하'}
                  </Text>
                </View>
              </View>
              <Text style={styles.badgeMessage}>뱃지를 획득했습니다!</Text>
              <Text style={styles.badgeDescription}>
                {earnedBadge?.description || '여행 기록을 계속 쌓아가며 더 많은 뱃지를 획득해보세요!'}
              </Text>
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
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.backgroundLight,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerPlaceholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SPACING.md,
    gap: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  addPhotoButton: {
    height: 200,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
  addPhotoText: {
    ...TYPOGRAPHY.h3,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  photoItem: {
    width: (SCREEN_WIDTH - SPACING.md * 2 - SPACING.sm * 2) / 3,
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
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
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
  },
  addMoreButton: {
    width: (SCREEN_WIDTH - SPACING.md * 2 - SPACING.sm * 2) / 3,
    aspectRatio: 1,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  label: {
    ...TYPOGRAPHY.body,
    fontWeight: '500',
    color: COLORS.text,
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
    height: 56,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    backgroundColor: COLORS.backgroundLight,
  },
  locationButton: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: COLORS.primary + '10',
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
    height: 56,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    backgroundColor: COLORS.backgroundLight,
  },
  addTagButton: {
    paddingHorizontal: SPACING.md,
    height: 56,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addTagButtonText: {
    ...TYPOGRAPHY.body,
    fontWeight: 'bold',
    color: COLORS.backgroundLight,
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
  aiCategoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.primary + '10',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.primary + '30',
  },
  aiCategoryEmoji: {
    fontSize: 32,
  },
  aiCategoryInfo: {
    flex: 1,
  },
  aiCategoryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 4,
  },
  aiCategoryName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  aiCategoryBadge: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  aiCategoryBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  autoTagsContainer: {
    marginTop: SPACING.md,
  },
  autoTagsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  autoTagsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  autoTagsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  autoTagsSubtitle: {
    fontSize: 12,
    color: COLORS.textSubtle,
  },
  reanalyzeButton: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  autoTagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  autoTagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 999,
    backgroundColor: COLORS.primary + '10',
    borderWidth: 2,
    borderColor: COLORS.primary + '30',
  },
  autoTagText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  autoTagsNote: {
    fontSize: 12,
    color: COLORS.textSubtle,
    marginTop: SPACING.xs,
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
    minHeight: 120,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: SPACING.md,
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    backgroundColor: COLORS.backgroundLight,
    marginTop: SPACING.sm,
  },
  footer: {
    padding: SPACING.md,
    backgroundColor: COLORS.backgroundLight,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  uploadButton: {
    width: '100%',
    height: 56,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  uploadButtonText: {
    ...TYPOGRAPHY.h3,
    fontWeight: 'bold',
    color: COLORS.backgroundLight,
  },
  uploadButtonTextDisabled: {
    color: COLORS.textSubtle,
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
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
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
  },
  badgeIconContainer: {
    position: 'relative',
    marginBottom: SPACING.lg,
  },
  badgeIcon: {
    fontSize: 64,
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
});

export default UploadScreen;
