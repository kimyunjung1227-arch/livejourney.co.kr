import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';
import { createPost } from '../api/posts';
import { uploadImage } from '../api/upload';
import { useAuth } from '../contexts/AuthContext';
import { notifyBadge } from '../utils/notifications';
import { safeSetItem, logLocalStorageStatus } from '../utils/localStorageManager';
import { checkNewBadges, awardBadge, hasSeenBadge, markBadgeAsSeen } from '../utils/badgeSystem';
import { analyzeImageForTags, getRecommendedTags } from '../utils/aiImageAnalyzer';
import { getCurrentTimestamp, getTimeAgo } from '../utils/timeUtils';
import { checkAndAwardTitles } from '../utils/dailyTitleSystem';
import { gainExp } from '../utils/levelSystem';

const UploadScreen = () => {
  const navigate = useNavigate();
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
    if (!navigator.geolocation) return;

    setLoadingLocation(true);
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const { latitude, longitude } = position.coords;
      
      if (window.kakao && window.kakao.maps && window.kakao.maps.services) {
        const geocoder = new window.kakao.maps.services.Geocoder();
        
        geocoder.coord2Address(longitude, latitude, (result, status) => {
          if (status === window.kakao.maps.services.Status.OK && result[0]) {
            const address = result[0].address;
            const roadAddress = result[0].road_address;
            
            let locationName = '';
            let detailedAddress = '';
            
            if (roadAddress) {
              const parts = roadAddress.address_name.split(' ');
              locationName = parts.slice(0, 3).join(' ')
                .replace('특별시', '')
                .replace('광역시', '')
                .replace('특별자치시', '')
                .replace('특별자치도', '')
                .trim();
              detailedAddress = roadAddress.address_name;
            } else {
              const parts = address.address_name.split(' ');
              locationName = parts.slice(0, 3).join(' ')
                .replace('특별시', '')
                .replace('광역시', '')
                .replace('특별자치시', '')
                .replace('특별자치도', '')
                .trim();
              detailedAddress = address.address_name;
            }
            
            setFormData(prev => ({
              ...prev,
              location: locationName,
              coordinates: { lat: latitude, lng: longitude },
              address: detailedAddress,
              detailedLocation: locationName
            }));
            setLoadingLocation(false);
          } else {
            setFormData(prev => ({
              ...prev,
              location: '서울',
              coordinates: { lat: latitude, lng: longitude }
            }));
            setLoadingLocation(false);
          }
        });
      } else {
        setFormData(prev => ({
          ...prev,
          location: '서울',
          coordinates: { lat: latitude, lng: longitude }
        }));
        setLoadingLocation(false);
      }
    } catch (error) {
      console.error('위치 감지 실패:', error);
      setLoadingLocation(false);
    }
  }, []);

  const analyzeImageAndGenerateTags = useCallback(async (file, location = '', note = '') => {
    setLoadingAITags(true);
    try {
      const analysisResult = await analyzeImageForTags(file, location, note);
      
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
  }, [formData.location, formData.note]);

  const handleImageSelect = useCallback(async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const MAX_SIZE = 50 * 1024 * 1024;
    const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 동영상은 100MB까지
    
    const imageFiles = [];
    const videoFiles = [];
    
    files.forEach(file => {
      const isVideo = file.type.startsWith('video/');
      const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_SIZE;
      
      if (file.size > maxSize) {
        alert(`${file.name}은(는) ${isVideo ? '100MB' : '50MB'}를 초과합니다`);
        return;
      }
      
      if (isVideo) {
        videoFiles.push(file);
      } else {
        imageFiles.push(file);
      }
    });

    const imageUrls = imageFiles.map(file => URL.createObjectURL(file));
    const videoUrls = videoFiles.map(file => URL.createObjectURL(file));
    const isFirstMedia = formData.images.length === 0 && formData.videos.length === 0;
    
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...imageUrls],
      imageFiles: [...prev.imageFiles, ...imageFiles],
      videos: [...prev.videos, ...videoUrls],
      videoFiles: [...prev.videoFiles, ...videoFiles]
    }));

    if (isFirstMedia && (imageFiles.length > 0 || videoFiles.length > 0)) {
      getCurrentLocation();
      const firstFile = imageFiles[0] || videoFiles[0];
      if (firstFile && !firstFile.type.startsWith('video/')) {
        analyzeImageAndGenerateTags(firstFile, formData.location, formData.note);
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
        analyzeImageAndGenerateTags(formData.imageFiles[0], formData.location, formData.note);
      }
    }, 1000);
    
    return () => {
      if (reanalysisTimerRef.current) {
        clearTimeout(reanalysisTimerRef.current);
      }
    };
  }, [formData.location, formData.note, formData.imageFiles, analyzeImageAndGenerateTags]);

  const handlePhotoOptionSelect = useCallback((option) => {
    setShowPhotoOptions(false);
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*';
    input.multiple = true;
    
    if (option === 'camera') {
      input.capture = 'environment';
    }
    
    input.onchange = handleImageSelect;
    input.click();
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
      console.log('태그 추가:', cleanTag);
    }
  }, [formData.tags]);

  const checkAndAwardBadge = useCallback(() => {
    console.log('Badge check started');
    
    const newBadges = checkNewBadges();
    console.log('New badges available:', newBadges);
    
    if (newBadges.length > 0) {
      const badge = newBadges[0];
      
      console.log(`Badge earned: ${badge.name}`);
      console.log(`Difficulty: ${badge.difficulty}`);
      
      const awarded = awardBadge(badge);
      
      if (awarded) {
        notifyBadge(badge.name, badge.difficulty);
        console.log('Notification sent');
        
        setEarnedBadge(badge);
        setShowBadgeModal(true);
        console.log('Badge modal shown:', { earnedBadge: badge, showBadgeModal: true });
        
        console.log(`Badge completed: ${badge.name}`);
        
        gainExp(`뱃지 획득 (${badge.difficulty})`);
        
        console.log('========================================');
        
        return true;
      }
    }
    
    console.log('Badge requirements not met');
    console.log('========================================');
    return false;
  }, []);

  const handleSubmit = useCallback(async () => {
    console.log('Upload started!');
    console.log('Image count:', formData.images.length);
    console.log('Location:', formData.location);
    
    if (formData.images.length === 0 && formData.videos.length === 0) {
      alert('사진 또는 동영상을 추가해주세요');
      return;
    }

    if (!formData.location.trim()) {
      alert('위치를 입력해주세요');
      return;
    }

    console.log('Validation passed - proceeding with upload');

    try {
      setUploading(true);
      setUploadProgress(10);
      console.log('Upload state set');
      
      const uploadedImageUrls = [];
      const uploadedVideoUrls = [];
      
      const aiCategory = formData.aiCategory || 'scenic';
      const aiCategoryName = formData.aiCategoryName || '추천 장소';
      const aiLabels = formData.tags || [];
      
      console.log('AI category:', aiCategoryName);
      
      const totalFiles = formData.imageFiles.length + formData.videoFiles.length;
      let uploadedCount = 0;
      
      // 이미지 업로드
      if (formData.imageFiles.length > 0) {
        for (let i = 0; i < formData.imageFiles.length; i++) {
          const file = formData.imageFiles[i];
          uploadedCount++;
          setUploadProgress(20 + (uploadedCount * 40 / totalFiles));
          
          try {
            const uploadResult = await uploadImage(file);
            if (uploadResult.success && uploadResult.url) {
              uploadedImageUrls.push(uploadResult.url);
            }
          } catch (uploadError) {
            uploadedImageUrls.push(formData.images[i]);
          }
        }
      } else {
        uploadedImageUrls.push(...formData.images);
      }
      
      // 동영상 업로드 (동일한 uploadImage 함수 사용, 백엔드에서 처리)
      if (formData.videoFiles.length > 0) {
        for (let i = 0; i < formData.videoFiles.length; i++) {
          const file = formData.videoFiles[i];
          uploadedCount++;
          setUploadProgress(20 + (uploadedCount * 40 / totalFiles));
          
          try {
            const uploadResult = await uploadImage(file);
            if (uploadResult.success && uploadResult.url) {
              uploadedVideoUrls.push(uploadResult.url);
            }
          } catch (uploadError) {
            uploadedVideoUrls.push(formData.videos[i]);
          }
        }
      } else {
        uploadedVideoUrls.push(...formData.videos);
      }
      
      setUploadProgress(60);
      
      const postData = {
        images: uploadedImageUrls.length > 0 ? uploadedImageUrls : formData.images,
        videos: uploadedVideoUrls.length > 0 ? uploadedVideoUrls : formData.videos,
        content: formData.note || `${formData.location}에서의 여행 기록`,
        location: {
          name: formData.location,
          lat: 37.5665,
          lon: 126.9780,
          region: '지역',
          country: '대한민국'
        },
        tags: formData.tags.map(tag => tag.replace('#', '')),
        isRealtime: true
      };
      
      setUploadProgress(80);
      
      try {
        const result = await createPost(postData);
        
        if (result.success) {
          setUploadProgress(100);
          setShowSuccessModal(true);
          
          console.log('Backend upload success! Checking badges...');
          
          setTimeout(() => {
            console.log('Badge check timer running');
            const earnedBadge = checkAndAwardBadge();
            
            console.log('Badge earned result:', earnedBadge);
            
            if (!earnedBadge) {
              console.log('Navigate to main in 2 seconds...');
              setTimeout(() => {
                setShowSuccessModal(false);
                navigate('/main');
              }, 2000);
            } else {
              console.log('Badge earned! Showing badge modal...');
            }
          }, 500);
        }
      } catch (postError) {
        console.log('Backend API failed - using localStorage');
        
        const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const username = user?.username || savedUser.username || '모사모';
        
        const uploadedPost = {
          id: `local-${Date.now()}`,
          userId: user?.id || 'test_user_001',
          images: uploadedImageUrls.length > 0 ? uploadedImageUrls : formData.images,
          videos: uploadedVideoUrls.length > 0 ? uploadedVideoUrls : formData.videos,
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
        
        logLocalStorageStatus();
        
        const existingPosts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');
        const saveResult = safeSetItem('uploadedPosts', JSON.stringify([uploadedPost, ...existingPosts]));
        
        if (!saveResult.success) {
          console.error('localStorage save failed:', saveResult.message);
          throw new Error(saveResult.message || 'localStorage save failed');
        }
        
        window.dispatchEvent(new Event('newPostsAdded'));
        
        setUploadProgress(100);
        setShowSuccessModal(true);
        
        console.log('Upload success! Checking badges & titles...');
        
        setTimeout(() => {
          console.log('Badge check timer running');
          
          const expResult = gainExp('사진 업로드');
          if (expResult.levelUp) {
            console.log(`Level up! Lv.${expResult.newLevel}`);
          }
          
          const earnedTitle = checkAndAwardTitles(user.id);
          if (earnedTitle) {
            console.log(`24-hour title earned: ${earnedTitle.name}`);
            gainExp('24시간 타이틀');
          }
          
          const earnedBadge = checkAndAwardBadge();
          
          console.log('Badge earned result:', earnedBadge);
          
          if (!earnedBadge) {
            console.log('Navigate to main in 2 seconds...');
            setTimeout(() => {
              setShowSuccessModal(false);
              navigate('/main');
            }, 2000);
          } else {
            console.log('Badge earned! Showing badge modal...');
          }
        }, 500);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('업로드에 실패했습니다. 다시 시도해주세요');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [formData, user, navigate, checkAndAwardBadge]);

  return (
    <div className="screen-layout bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark">
      <div className="screen-content">
        <header className="screen-header flex h-16 items-center border-b border-subtle-light/50 dark:border-subtle-dark/50 bg-white dark:bg-gray-900 shadow-sm px-4">
          <button 
            onClick={() => navigate(-1)}
            className="flex size-10 shrink-0 items-center justify-center rounded-full text-text-light dark:text-text-dark"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
          <h1 className="flex-1 text-center text-lg font-bold">업로드: 여행 기록</h1>
          <div className="w-10"></div>
        </header>

        <main className="flex-1 pb-4">
          <div className="p-4 space-y-6">
            <div>
              {formData.images.length === 0 ? (
                <button
                  onClick={() => setShowPhotoOptions(true)}
                  className="flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-subtle-light dark:border-subtle-dark px-6 py-20 text-center w-full hover:border-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-5xl text-primary">add_circle</span>
                  <p className="text-lg font-bold">사진 추가</p>
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    {formData.images.map((image, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                        <img src={image} alt={`preview-${index}`} className="w-full h-full object-cover" />
                        <button
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            images: prev.images.filter((_, i) => i !== index),
                            imageFiles: prev.imageFiles.filter((_, i) => i !== index)
                          }))}
                          className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1"
                        >
                          <span className="material-symbols-outlined text-base">close</span>
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => setShowPhotoOptions(true)}
                      className="aspect-square rounded-lg border-2 border-dashed border-subtle-light dark:border-subtle-dark flex items-center justify-center hover:border-primary transition-colors"
                    >
                      <span className="material-symbols-outlined text-4xl text-primary">add</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="flex flex-col">
                <div className="flex items-center justify-between pb-2">
                  <p className="text-base font-medium">위치 태그</p>
                  {loadingLocation && (
                    <span className="text-xs text-primary">현재 위치 감지 중...</span>
                  )}
                </div>
                <div className="flex w-full flex-1 items-stretch gap-2">
                  <input
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg border border-subtle-light dark:border-subtle-dark bg-background-light dark:bg-background-dark focus:border-primary focus:ring-0 h-14 p-4 text-base font-normal placeholder:text-placeholder-light dark:placeholder:text-placeholder-dark"
                    placeholder="어디에서 찍은 사진인가요? (예: 서울 남산, 부산 해운대)"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  />
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={loadingLocation}
                    className="flex items-center justify-center rounded-lg border border-subtle-light dark:border-subtle-dark bg-primary/10 dark:bg-primary/20 hover:bg-primary/20 dark:hover:bg-primary/30 px-4 text-primary transition-colors disabled:opacity-50"
                    title="현재 위치 자동 감지"
                  >
                    <span className="material-symbols-outlined">my_location</span>
                  </button>
                </div>
              </label>
            </div>

            <div>
              <label className="flex flex-col">
                <div className="flex items-center justify-between pb-2">
                  <p className="text-base font-medium">해시태그</p>
                  {loadingAITags && (
                    <span className="text-xs text-primary">AI 분석 중...</span>
                  )}
                </div>
                <div className="flex w-full items-stretch gap-2">
                  <input
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg border border-subtle-light dark:border-subtle-dark bg-background-light dark:bg-background-dark focus:border-primary focus:ring-0 h-14 p-4 text-base font-normal placeholder:text-placeholder-light dark:placeholder:text-placeholder-dark"
                    placeholder="#여행 #추억"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <button
                    onClick={addTag}
                    className="flex shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg h-14 px-5 bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors"
                  >
                    <span>추가</span>
                  </button>
                </div>
              </label>
              
              {loadingAITags && (
                <div className="mt-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                      AI가 이미지를 분석하고 있습니다...
                    </p>
                  </div>
                </div>
              )}
              
              {!loadingAITags && formData.aiCategoryName && formData.images.length > 0 && (
                <div className="mt-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{formData.aiCategoryIcon}</span>
                    <div className="flex-1">
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mb-0.5">
                        AI 자동 분류
                      </p>
                      <p className="text-base font-bold text-blue-900 dark:text-blue-100">
                        {formData.aiCategoryName}
                      </p>
                    </div>
                    <span className="text-xs bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-3 py-1.5 rounded-full font-bold">
                      자동
                    </span>
                  </div>
                </div>
              )}
              
              {!loadingAITags && autoTags.length > 0 && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                      <span className="material-symbols-outlined text-base">auto_awesome</span>
                      <span className="font-semibold">AI 추천 태그</span>
                      <span className="text-xs text-zinc-500">(클릭하여 추가)</span>
                    </p>
                    {formData.imageFiles.length > 0 && (
                      <button
                        type="button"
                        onClick={() => analyzeImageAndGenerateTags(formData.imageFiles[0], formData.location, formData.note)}
                        className="text-xs text-primary hover:text-primary/80 font-semibold flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>refresh</span>
                        재분석
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {autoTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => addAutoTag(tag)}
                        className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/30 dark:to-blue-900/30 hover:from-primary/20 hover:to-primary/10 py-2 px-4 text-sm font-semibold text-purple-700 dark:text-purple-300 hover:text-primary dark:hover:text-orange-300 transition-all border-2 border-purple-200 dark:border-purple-700 hover:border-primary hover:scale-105 active:scale-95 shadow-sm"
                      >
                        <span>{tag}</span>
                        <span className="material-symbols-outlined text-base">add_circle</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-2">
                    AI가 이미지를 분석해서 자동으로 생성한 태그입니다
                  </p>
                </div>
              )}
              
              {formData.tags.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">내 태그</p>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <div
                        key={tag}
                        className="flex items-center gap-1.5 rounded-full bg-primary/20 dark:bg-primary/30 py-1.5 pl-3 pr-2 text-sm text-primary dark:text-orange-300"
                      >
                        <span>{tag}</span>
                        <button
                          onClick={() => removeTag(tag)}
                          className="flex items-center justify-center"
                        >
                          <span className="material-symbols-outlined text-base">cancel</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="flex flex-col">
                <p className="text-base font-medium pb-2">개인 노트</p>
                <textarea
                  className="form-textarea w-full rounded-lg border border-subtle-light dark:border-subtle-dark bg-background-light dark:bg-background-dark focus:border-primary focus:ring-0 p-4 text-base font-normal placeholder:text-placeholder-light dark:placeholder:text-placeholder-dark"
                  placeholder="내용을 입력하세요"
                  rows="5"
                  value={formData.note}
                  onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                />
              </label>
            </div>
          </div>
        </main>

        <footer className="sticky bottom-0 z-10 p-4 bg-background-light dark:bg-background-dark border-t border-subtle-light/50 dark:border-subtle-dark/50">
          <button
            onClick={() => {
              console.log('Upload button clicked');
              console.log('Current state:', { 
                uploading, 
                imageCount: formData.images.length,
                location: formData.location,
                disabled: uploading || formData.images.length === 0 
              });
              handleSubmit();
            }}
            disabled={uploading || formData.images.length === 0}
            className={`flex w-full min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-14 px-4 text-lg font-bold transition-colors ${
              uploading || formData.images.length === 0
                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-primary text-white hover:bg-primary/90'
            }`}
          >
            <span className="truncate">{uploading ? '업로드 중..' : '업로드'}</span>
          </button>
        </footer>

        {showPhotoOptions && (
          <div 
            className="fixed inset-0 bg-black/50 z-30 flex items-end"
            onClick={() => setShowPhotoOptions(false)}
          >
            <div 
              className="w-full bg-background-light dark:bg-background-dark rounded-t-3xl p-6 space-y-3"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-center mb-4">사진 선택</h3>
              <button
                onClick={() => handlePhotoOptionSelect('camera')}
                className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-800 border border-subtle-light dark:border-subtle-dark rounded-lg h-14 px-4 text-base font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="material-symbols-outlined">photo_camera</span>
                <span>촬영하기</span>
              </button>
              <button
                onClick={() => handlePhotoOptionSelect('gallery')}
                className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-800 border border-subtle-light dark:border-subtle-dark rounded-lg h-14 px-4 text-base font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="material-symbols-outlined">photo_library</span>
                <span>갤러리에서 선택하기</span>
              </button>
              <button
                onClick={() => setShowPhotoOptions(false)}
                className="w-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-lg h-14 px-4 text-base font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        )}

        {showSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 p-4">
            <div className="w-full max-w-sm transform flex-col rounded-xl bg-white dark:bg-[#221910] p-6 shadow-2xl transition-all">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div className="flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30">
                    <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-5xl">
                      check_circle
                    </span>
                  </div>
                  <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping"></div>
                </div>
              </div>

              <h1 className="text-[#181411] dark:text-gray-100 text-[22px] font-bold leading-tight tracking-[-0.015em] text-center pb-2">
                업로드 완료!
              </h1>
              
              <p className="text-gray-700 dark:text-gray-300 text-base font-normal leading-normal pb-4 text-center">
                여행 기록이 성공적으로 업로드되었습니다
              </p>

              <div className="mt-2">
                <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
                  업로드 중.. {uploadProgress}%
                </p>
              </div>
            </div>
          </div>
        )}

        {showBadgeModal && earnedBadge && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 animate-fade-in">
            <div className="w-full max-w-sm transform rounded-3xl bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-zinc-800 dark:to-zinc-900 p-8 shadow-2xl border-4 border-primary animate-scale-up">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-yellow-400 via-orange-400 to-orange-500 shadow-2xl">
                    <span className="text-6xl">{earnedBadge.icon || '🏆'}</span>
                  </div>
                  <div className="absolute inset-0 rounded-full bg-yellow-400/40 animate-ping"></div>
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-xl animate-bounce">
                    NEW!
                  </div>
                </div>
              </div>

              <h1 className="text-3xl font-bold text-center mb-3 text-zinc-900 dark:text-white">
                축하합니다!
              </h1>
              
              <p className="text-xl font-bold text-center text-primary mb-2">
                {earnedBadge.name || earnedBadge}
              </p>
              
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                  earnedBadge.difficulty === '상' ? 'bg-purple-500 text-white' :
                  earnedBadge.difficulty === '중' ? 'bg-blue-500 text-white' :
                  'bg-green-500 text-white'
                }`}>
                  난이도: {earnedBadge.difficulty || '하'}
                </div>
              </div>
              
              <p className="text-base font-medium text-center text-zinc-700 dark:text-zinc-300 mb-6">
                뱃지를 획득했습니다!
              </p>
              
              <p className="text-sm text-center text-zinc-600 dark:text-zinc-400 mb-8">
                {earnedBadge.description || '여행 기록을 계속 쌓아가며 더 많은 뱃지를 획득해보세요!'}
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    console.log('Navigate to profile');
                    setShowBadgeModal(false);
                    setShowSuccessModal(false);
                    navigate('/profile');
                  }}
                  className="w-full bg-primary text-white py-4 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                >
                  내 프로필에서 확인하기
                </button>
                <button
                  onClick={() => {
                    console.log('Navigate to main');
                    setShowBadgeModal(false);
                    setShowSuccessModal(false);
                    navigate('/main');
                  }}
                  className="w-full bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 py-4 rounded-xl font-semibold hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-all transform hover:scale-105 active:scale-95"
                >
                  메인으로 가기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
};

export default UploadScreen;










































