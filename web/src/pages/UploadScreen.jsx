import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';
import { createPost } from '../api/posts';
import { uploadImage } from '../api/upload';
import { useAuth } from '../contexts/AuthContext';
import { notifyPoints, notifyBadge } from '../utils/notifications';
import { tryEarnPoints } from '../utils/pointsSystem';
import { safeSetItem, logLocalStorageStatus } from '../utils/localStorageManager';
import { checkNewBadges, awardBadge, hasSeenBadge, markBadgeAsSeen } from '../utils/badgeSystem';

const UploadScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [formData, setFormData] = useState({
    images: [],
    imageFiles: [],
    location: '',
    tags: [],
    note: '',
    coordinates: null
  });
  const [tagInput, setTagInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [autoTags, setAutoTags] = useState([]);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [loadingAITags, setLoadingAITags] = useState(false);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [earnedBadge, setEarnedBadge] = useState(null);

  // 현재 위치 자동 감지
  const getCurrentLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      console.log('위치 서비스를 지원하지 않는 브라우저입니다.');
      return;
    }

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
      
      // Kakao Maps Geocoder로 주소 변환
      if (window.kakao && window.kakao.maps && window.kakao.maps.services) {
        const geocoder = new window.kakao.maps.services.Geocoder();
        
        geocoder.coord2Address(longitude, latitude, (result, status) => {
          if (status === window.kakao.maps.services.Status.OK && result[0]) {
            const address = result[0].address;
            const roadAddress = result[0].road_address;
            
            // 주소에서 상세 지역명 추출 (예: "서울특별시 강남구 역삼동" → "서울 강남구 역삼동")
            let locationName = '';
            let detailedAddress = '';
            
            if (roadAddress) {
              const parts = roadAddress.address_name.split(' ');
              // 상세정보까지 포함 (시/도 + 구/군 + 동/읍/면)
              locationName = parts.slice(0, 3).join(' ')
                .replace('특별시', '')
                .replace('광역시', '')
                .replace('특별자치시', '')
                .replace('특별자치도', '')
                .trim();
              detailedAddress = roadAddress.address_name;
            } else {
              const parts = address.address_name.split(' ');
              // 상세정보까지 포함
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
              location: locationName, // 상세 지역명 (문자)
              coordinates: { lat: latitude, lng: longitude },
              address: detailedAddress,
              detailedLocation: locationName
            }));
            
            console.log('📍 위치 자동 감지 (상세):', locationName);
          } else {
            // 주소 변환 실패 시 기본 지역명 사용
            setFormData(prev => ({
              ...prev,
              location: '서울', // 기본값 (문자)
              coordinates: { lat: latitude, lng: longitude }
            }));
            console.log('📍 주소 변환 실패 - 기본 지역명 사용');
          }
        });
      } else {
        // Kakao API가 없으면 기본 지역명 사용
        console.log('⚠️ Kakao API 없음 - 기본 지역명 사용');
        setFormData(prev => ({
          ...prev,
          location: '서울', // 문자로 표시
          coordinates: { lat: latitude, lng: longitude }
        }));
      }
    } catch (error) {
      console.error('위치 감지 실패:', error);
    } finally {
      setLoadingLocation(false);
    }
  }, []);

  // AI 이미지 분석 및 해시태그 자동 생성
  const analyzeImageAndGenerateTags = useCallback(async (file) => {
    setLoadingAITags(true);
    try {
      // 이미지 분석 (AI 카테고리 감지)
      const uploadResult = await uploadImage(file);
      
      if (uploadResult.analysis) {
        const { category, categoryName, labels } = uploadResult.analysis;
        
        // AI 라벨 기반 자동 해시태그 생성
        const generatedTags = [];
        
        // 카테고리 기반 태그
        if (categoryName) {
          generatedTags.push(`#${categoryName}`);
        }
        
        // 라벨 기반 태그
        if (labels && labels.length > 0) {
          labels.slice(0, 5).forEach(label => {
            generatedTags.push(`#${label}`);
          });
        }
        
        // 카테고리별 추천 태그
        const categoryTags = {
          'bloom': ['#꽃구경', '#개화시기', '#벚꽃', '#봄'],
          'food': ['#맛집', '#먹스타그램', '#음식', '#여행맛집'],
          'landmark': ['#명소', '#관광지', '#여행', '#포토스팟'],
          'scenic': ['#풍경', '#뷰맛집', '#자연', '#힐링']
        };
        
        if (category && categoryTags[category]) {
          categoryTags[category].forEach(tag => {
            if (!generatedTags.includes(tag)) {
              generatedTags.push(tag);
            }
          });
        }
        
        // 기본 여행 태그 추가
        if (!generatedTags.some(tag => tag.includes('여행'))) {
          generatedTags.push('#여행');
        }
        
        setAutoTags(generatedTags.slice(0, 8)); // 최대 8개
        console.log('🏷️ AI 자동 태그 생성:', generatedTags);
      }
    } catch (error) {
      console.error('AI 분석 실패:', error);
      // 기본 태그 제공
      setAutoTags(['#여행', '#추억', '#일상']);
    } finally {
      setLoadingAITags(false);
    }
  }, []);

  // 이미지 선택 핸들러 (useCallback)
  const handleImageSelect = useCallback(async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const MAX_SIZE = 50 * 1024 * 1024;
    const validFiles = files.filter(file => {
      if (file.size > MAX_SIZE) {
        alert(`${file.name}은(는) 50MB를 초과합니다.`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    const imageUrls = validFiles.map(file => URL.createObjectURL(file));
    const isFirstImage = formData.images.length === 0;
    
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...imageUrls],
      imageFiles: [...prev.imageFiles, ...validFiles]
    }));

    // 첫 번째 이미지 선택 시 자동 실행
    if (isFirstImage) {
      console.log('📸 첫 이미지 선택 - 자동 분석 시작');
      
      // 1. 현재 위치 자동 감지
      getCurrentLocation();
      
      // 2. AI 이미지 분석 및 해시태그 생성
      if (validFiles[0]) {
        analyzeImageAndGenerateTags(validFiles[0]);
      }
    }
  }, [formData.images.length, getCurrentLocation, analyzeImageAndGenerateTags]);

  // 사진 옵션 선택 (useCallback)
  const handlePhotoOptionSelect = useCallback((option) => {
    setShowPhotoOptions(false);
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    
    if (option === 'camera') {
      input.capture = 'environment';
    }
    
    input.onchange = handleImageSelect;
    input.click();
  }, [handleImageSelect]);

  // 태그 추가 (useCallback)
  const addTag = useCallback(() => {
    if (tagInput.trim() && !formData.tags.includes(`#${tagInput.trim()}`)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, `#${tagInput.trim()}`]
      }));
      setTagInput('');
    }
  }, [tagInput, formData.tags]);

  // 태그 제거 (useCallback)
  const removeTag = useCallback((tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  }, []);

  // AI 자동 태그 추가 (useCallback)
  const addAutoTag = useCallback((tag) => {
    if (!formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
      // 추가된 태그는 추천 목록에서 제거
      setAutoTags(prev => prev.filter(t => t !== tag));
    }
  }, [formData.tags]);

  // 뱃지 확인 및 수여 (useCallback) - 난이도별 포인트 지급
  const checkAndAwardBadge = useCallback(() => {
    console.log('🔍 ========== 뱃지 체크 시작 (난이도 시스템) ==========');
    
    // 새로 획득한 뱃지 확인
    const newBadges = checkNewBadges();
    
    console.log('🏆 획득 가능한 뱃지:', newBadges);
    
    if (newBadges.length > 0) {
      // 첫 번째 새 뱃지만 표시 (한 번에 하나씩)
      const badge = newBadges[0];
      
      console.log(`🎉 뱃지 획득: ${badge.name}`);
      console.log(`   난이도: ${badge.difficulty}`);
      console.log(`   포인트: +${badge.points}P`);
      
      // 뱃지 수여 및 포인트 지급
      const awarded = awardBadge(badge);
      
      if (awarded) {
        // 알림 발생
        notifyBadge(badge.name, badge.difficulty, badge.points);
        console.log('🔔 알림 발생 완료');
        
        // 뱃지 모달 표시
        console.log('🎯 뱃지 모달 즉시 표시...');
        setEarnedBadge(badge);
        setShowBadgeModal(true);
        console.log('✅ 뱃지 모달 state 업데이트:', { earnedBadge: badge, showBadgeModal: true });
        
        console.log(`🏆 뱃지 획득 완료: ${badge.name} (+${badge.points}P)`);
        console.log('========================================');
        
        return true;
      }
    }
    
    console.log('ℹ️ 뱃지 획득 조건 미달성');
    console.log('========================================');
    return false;
  }, []);

  // 업로드 제출 (useCallback)
  const handleSubmit = useCallback(async () => {
    console.log('🚀 업로드 시작!');
    console.log('📸 이미지 개수:', formData.images.length);
    console.log('📍 위치:', formData.location);
    
    if (formData.images.length === 0) {
      alert('사진을 추가해주세요.');
      return;
    }

    if (!formData.location.trim()) {
      alert('위치를 입력해주세요.');
      return;
    }

    console.log('✅ 유효성 검사 통과 - 업로드 진행');

    try {
      setUploading(true);
      setUploadProgress(10);
      console.log('⏳ 업로드 상태 설정 완료');
      
      const uploadedImageUrls = [];
      let aiCategory = 'general';
      let aiCategoryName = '일반';
      let aiLabels = [];
      
      if (formData.imageFiles.length > 0) {
        for (let i = 0; i < formData.imageFiles.length; i++) {
          const file = formData.imageFiles[i];
          setUploadProgress(20 + (i * 40 / formData.imageFiles.length));
          
          try {
            const uploadResult = await uploadImage(file);
            if (uploadResult.success && uploadResult.url) {
              uploadedImageUrls.push(uploadResult.url);
              
              if (i === 0 && uploadResult.analysis) {
                aiCategory = uploadResult.analysis.category || 'general';
                aiCategoryName = uploadResult.analysis.categoryName || '일반';
                aiLabels = uploadResult.analysis.labels || [];
              }
            }
          } catch (uploadError) {
            uploadedImageUrls.push(formData.images[i]);
          }
        }
      } else {
        uploadedImageUrls.push(...formData.images);
      }
      
      setUploadProgress(60);
      
      const postData = {
        images: uploadedImageUrls.length > 0 ? uploadedImageUrls : formData.images,
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
          
          console.log('✅ 백엔드 업로드 성공! 뱃지 체크 시작...');
          
          // 포인트 획득 시도 (백엔드 게시물 ID 사용)
          const backendPostId = result.post?._id || result.post?.id || `backend-${Date.now()}`;
          const pointResult = tryEarnPoints('게시물 작성', backendPostId);
          if (pointResult.success) {
            notifyPoints(pointResult.points, '게시물 작성');
          } else if (pointResult.message && pointResult.reason !== 'cooldown') {
            setTimeout(() => alert(`⚠️ ${pointResult.message}`), 500);
          }
          
          // localStorage 저장 후 충분한 지연을 두고 뱃지 확인
          setTimeout(() => {
            console.log('⏰ 뱃지 체크 타이머 실행 (백엔드)');
            // 뱃지 확인 및 획득
            const earnedBadge = checkAndAwardBadge();
            
            console.log('🎯 뱃지 획득 여부:', earnedBadge);
            
            // 뱃지를 획득하지 못한 경우에만 자동으로 메인으로 이동
            if (!earnedBadge) {
              console.log('⏳ 2초 후 메인으로 이동...');
              setTimeout(() => {
                setShowSuccessModal(false);
                navigate('/main');
              }, 2000);
            } else {
              console.log('🏆 뱃지 획득! 뱃지 모달 대기 중...');
            }
            // 뱃지를 획득한 경우 뱃지 모달에서 사용자가 선택
          }, 500);
        }
      } catch (postError) {
        console.log('⚠️ 백엔드 API 실패 - localStorage에 저장');
        
        // localStorage에서 user 정보 가져오기 (없으면 기본값)
        const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const username = user?.username || savedUser.username || '모사모';
        
        const uploadedPost = {
          id: `local-${Date.now()}`,
          userId: user?.id || 'test_user_001', // 현재 사용자 ID 추가!
          images: uploadedImageUrls.length > 0 ? uploadedImageUrls : formData.images,
          location: formData.location,
          tags: formData.tags,
          note: formData.note,
          time: new Date().toISOString(),
          timeLabel: '방금',
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
        
        // localStorage 상태 로깅
        logLocalStorageStatus();
        
        const existingPosts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');
        const saveResult = safeSetItem('uploadedPosts', JSON.stringify([uploadedPost, ...existingPosts]));
        
        if (!saveResult.success) {
          console.error('❌ localStorage 저장 실패:', saveResult.message);
          throw new Error(saveResult.message || 'localStorage 저장에 실패했습니다.');
        }
        
        // 이벤트 발생 - 메인화면 업데이트
        window.dispatchEvent(new Event('newPostsAdded'));
        
        setUploadProgress(100);
        setShowSuccessModal(true);
        
        // 성공 모달 표시
        console.log('✅ 업로드 성공! 포인트 및 뱃지 체크 시작...');
        
        // 포인트 획득 시도
        const pointResult = tryEarnPoints('게시물 작성', uploadedPost.id);
        if (pointResult.success) {
          notifyPoints(pointResult.points, '게시물 작성');
        } else if (pointResult.message && pointResult.reason !== 'cooldown') {
          setTimeout(() => alert(`⚠️ ${pointResult.message}`), 500);
        }
        
        // localStorage 저장 후 충분한 지연을 두고 뱃지 확인
        setTimeout(() => {
          console.log('⏰ 뱃지 체크 타이머 실행');
          // 뱃지 확인 및 획득
          const earnedBadge = checkAndAwardBadge();
          
          console.log('🎯 뱃지 획득 여부:', earnedBadge);
          
          // 뱃지를 획득하지 못한 경우에만 자동으로 메인으로 이동
          if (!earnedBadge) {
            console.log('⏳ 2초 후 메인으로 이동...');
            setTimeout(() => {
              setShowSuccessModal(false);
              navigate('/main');
            }, 2000);
          } else {
            console.log('🏆 뱃지 획득! 뱃지 모달 대기 중...');
          }
          // 뱃지를 획득한 경우 뱃지 모달에서 사용자가 선택
        }, 500);
      }
    } catch (error) {
      console.error('업로드 실패:', error);
      alert('업로드에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [formData, user, navigate, checkAndAwardBadge]);

  return (
    <div className="flex h-full w-full flex-col bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark">
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <header className="sticky top-0 z-10 flex h-16 items-center border-b border-subtle-light/50 dark:border-subtle-dark/50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm px-4">
          <button 
            onClick={() => navigate(-1)}
            className="flex size-10 shrink-0 items-center justify-center rounded-full text-text-light dark:text-text-dark"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
          <h1 className="flex-1 text-center text-lg font-bold">새로운 여행 기록</h1>
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
                    <span className="text-xs text-primary">📍 위치 감지 중...</span>
                  )}
                </div>
                <div className="flex w-full flex-1 items-stretch gap-2">
                  <input
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg border border-subtle-light dark:border-subtle-dark bg-background-light dark:bg-background-dark focus:border-primary focus:ring-0 h-14 p-4 text-base font-normal placeholder:text-placeholder-light dark:placeholder:text-placeholder-dark"
                    placeholder="어디에서 찍은 사진인가요?"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  />
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={loadingLocation}
                    className="flex items-center justify-center rounded-lg border border-subtle-light dark:border-subtle-dark bg-primary/10 dark:bg-primary/20 hover:bg-primary/20 dark:hover:bg-primary/30 px-4 text-primary transition-colors disabled:opacity-50"
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
                    <span className="text-xs text-primary">🤖 AI 분석 중...</span>
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
              
              {/* AI 추천 태그 */}
              {autoTags.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2 flex items-center gap-1">
                    <span className="material-symbols-outlined text-base">auto_awesome</span>
                    <span>AI 추천 태그</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {autoTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => addAutoTag(tag)}
                        className="flex items-center gap-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-primary/10 dark:hover:bg-primary/20 py-1.5 px-3 text-sm text-zinc-700 dark:text-zinc-300 hover:text-primary dark:hover:text-orange-300 transition-colors border border-zinc-200 dark:border-zinc-700"
                      >
                        <span>{tag}</span>
                        <span className="material-symbols-outlined text-base">add_circle</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* 추가된 태그 */}
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
              console.log('🖱️ 업로드 버튼 클릭됨!');
              console.log('📊 현재 상태:', { 
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
            <span className="truncate">{uploading ? '업로드 중...' : '업로드'}</span>
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
                여행 기록이 성공적으로 업로드되었습니다.
              </p>

              <div className="mt-2">
                <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
                  업로드 중... {uploadProgress}%
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 뱃지 획득 모달 */}
        {/* 🏆 뱃지 획득 모달 - 최상위 레이어 (난이도 & 포인트 표시) */}
        {showBadgeModal && earnedBadge && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 animate-fade-in">
            <div className="w-full max-w-sm transform rounded-3xl bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-zinc-800 dark:to-zinc-900 p-8 shadow-2xl border-4 border-primary animate-scale-up">
              {/* 뱃지 아이콘 */}
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

              {/* 축하 메시지 */}
              <h1 className="text-3xl font-bold text-center mb-3 text-zinc-900 dark:text-white">
                🎉 축하합니다!
              </h1>
              
              <p className="text-xl font-bold text-center text-primary mb-2">
                {earnedBadge.name || earnedBadge}
              </p>
              
              {/* 난이도 & 포인트 */}
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                  earnedBadge.difficulty === '상' ? 'bg-purple-500 text-white' :
                  earnedBadge.difficulty === '중' ? 'bg-blue-500 text-white' :
                  'bg-green-500 text-white'
                }`}>
                  난이도: {earnedBadge.difficulty || '중'}
                </div>
                <div className="px-3 py-1 rounded-full bg-primary text-white text-sm font-bold">
                  +{earnedBadge.points || 100}P
                </div>
              </div>
              
              <p className="text-base font-medium text-center text-zinc-700 dark:text-zinc-300 mb-6">
                뱃지를 획득했습니다!
              </p>
              
              <p className="text-sm text-center text-zinc-600 dark:text-zinc-400 mb-8">
                {earnedBadge.description || '여행 기록을 계속 남기고 더 많은 뱃지를 획득해보세요!'} 🌟
              </p>

              {/* 버튼 */}
              <div className="space-y-3">
                <button
                  onClick={() => {
                    console.log('🔄 프로필로 이동');
                    setShowBadgeModal(false);
                    setShowSuccessModal(false);
                    navigate('/profile');
                  }}
                  className="w-full bg-primary text-white py-4 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                >
                  🏆 프로필에서 확인하기
                </button>
                <button
                  onClick={() => {
                    console.log('🔄 메인으로 이동');
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






































