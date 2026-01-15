import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';
import { createPost } from '../api/posts';
import { uploadImage } from '../api/upload';
import { useAuth } from '../contexts/AuthContext';
import { notifyBadge } from '../utils/notifications';
import { safeSetItem, logLocalStorageStatus } from '../utils/localStorageManager';
import { checkNewBadges, awardBadge, hasSeenBadge, markBadgeAsSeen, calculateUserStats } from '../utils/badgeSystem';
import { checkAndNotifyInterestPlace } from '../utils/interestPlaces';
import { analyzeImageForTags } from '../utils/aiImageAnalyzer';
import { getWeatherByRegion } from '../api/weather';
import { getCurrentTimestamp, getTimeAgo } from '../utils/timeUtils';
import { gainExp } from '../utils/levelSystem';
import { getBadgeCongratulationMessage, getBadgeDifficultyEffects } from '../utils/badgeMessages';
import { logger } from '../utils/logger';

const UploadScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
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
  const weatherTagWhitelist = new Set([
    '맑음', '맑은날씨', '청명한날씨', '화창한날씨', '쾌청한날씨',
    '흐림', '흐린날씨', '구름많음', '구름조금',
    '비', '소나기', '장마', '강수', '우천', '우천주의',
    '눈', '강설', '눈발', '함박눈', '소낙눈',
    '바람', '강풍', '미풍', '시원한바람', '따뜻한바람',
    '안개', '짙은안개', '옅은안개',
    '습도', '건조', '습함', '쾌적한습도',
    '체감온도', '체감온도낮음', '체감온도높음', '쾌적한온도',
    '일출', '일몰', '황금시간대', '블루아워', '골든아워',
    '자외선', '자외선강함', '자외선주의', '자외선약함',
    '봄날씨', '여름날씨', '가을날씨', '겨울날씨'
  ]);

  const normalizeTag = (tag) => (tag || '').replace('#', '').trim();

  const dedupeHashtags = (tags) => {
    const map = new Map();
    (tags || []).forEach((tag) => {
      const cleaned = normalizeTag(tag);
      if (!cleaned) return;
      const key = cleaned.toLowerCase();
      if (!map.has(key)) {
        map.set(key, `#${cleaned}`);
      }
    });
    return Array.from(map.values());
  };

  const isWeatherTag = (tag) => {
    const cleaned = normalizeTag(tag);
    if (!cleaned) return false;
    if (weatherTagWhitelist.has(cleaned)) return true;
    if (cleaned.includes('날씨')) return true;
    if (cleaned.includes('구름') || cleaned.includes('비') || cleaned.includes('눈')) return true;
    return false;
  };

  const buildWeatherTagsFromCondition = (condition, temperatureText = '') => {
    const tags = [];
    const tempValue = parseInt(temperatureText.replace('℃', ''), 10);
    const normalized = (condition || '').trim();

    if (!normalized) return tags;

    if (normalized.includes('맑음')) {
      tags.push('맑음', '맑은날씨', '청명한날씨');
    } else if (normalized.includes('구름')) {
      tags.push('구름많음', '흐림');
    } else if (normalized.includes('흐림')) {
      tags.push('흐림', '흐린날씨');
    } else if (normalized.includes('비')) {
      tags.push('비', '우천', '강수');
    } else if (normalized.includes('눈')) {
      tags.push('눈', '강설');
    } else if (normalized.includes('안개')) {
      tags.push('안개', '옅은안개');
    }

    if (!Number.isNaN(tempValue)) {
      if (tempValue >= 30) {
        tags.push('체감온도높음', '자외선주의');
      } else if (tempValue <= 0) {
        tags.push('체감온도낮음');
      }
    }

    return tags;
  };
  const [loadingAITags, setLoadingAITags] = useState(false);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [earnedBadge, setEarnedBadge] = useState(null);
  const reanalysisTimerRef = useRef(null);

  // 지도 관련 ref
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

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
      logger.error('위치 감지 실패:', error);
      setLoadingLocation(false);
    }
  }, []);

  // 업로드 화면 내 소형 지도 초기화
  useEffect(() => {
    if (!window.kakao || !window.kakao.maps) return;

    const initSmallMap = () => {
      if (!mapContainerRef.current) return;

      const kakao = window.kakao;

      // 초기 중심: 선택된 좌표 또는 서울
      const centerLat = formData.coordinates?.lat || 37.5665;
      const centerLng = formData.coordinates?.lng || 126.9780;

      let map = mapInstanceRef.current;

      if (!map) {
        map = new kakao.maps.Map(mapContainerRef.current, {
          center: new kakao.maps.LatLng(centerLat, centerLng),
          level: 5
        });
        mapInstanceRef.current = map;

        // 클릭으로 위치 선택
        kakao.maps.event.addListener(map, 'click', (mouseEvent) => {
          const latlng = mouseEvent.latLng;

          // 마커 없으면 생성, 있으면 위치만 이동
          if (!markerRef.current) {
            markerRef.current = new kakao.maps.Marker({
              position: latlng,
              map
            });
          } else {
            markerRef.current.setPosition(latlng);
          }

          // 좌표 → 주소 변환
          if (kakao.maps.services) {
            const geocoder = new kakao.maps.services.Geocoder();
            geocoder.coord2Address(latlng.getLng(), latlng.getLat(), (result, status) => {
              if (status === kakao.maps.services.Status.OK && result[0]) {
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
                } else if (address) {
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
                  coordinates: { lat: latlng.getLat(), lng: latlng.getLng() },
                  address: detailedAddress,
                  detailedLocation: locationName
                }));
              } else {
                setFormData(prev => ({
                  ...prev,
                  coordinates: { lat: latlng.getLat(), lng: latlng.getLng() }
                }));
              }
            });
          } else {
            setFormData(prev => ({
              ...prev,
              coordinates: { lat: latlng.getLat(), lng: latlng.getLng() }
            }));
          }
        });
      } else {
        // 이미 생성된 경우 중심만 이동
        map.setCenter(new kakao.maps.LatLng(centerLat, centerLng));
      }

      // 선택된 좌표가 있으면 마커 위치 동기화
      if (formData.coordinates) {
        const pos = new kakao.maps.LatLng(formData.coordinates.lat, formData.coordinates.lng);
        if (!markerRef.current) {
          markerRef.current = new kakao.maps.Marker({
            position: pos,
            map
          });
        } else {
          markerRef.current.setPosition(pos);
        }
      }
    };

    // 카카오맵이 로드되어 있으면 바로, 아니면 약간 대기
    setTimeout(initSmallMap, 200);
  }, [formData.coordinates, formData.location]);

  const analyzeImageAndGenerateTags = useCallback(async (file, location = '', note = '') => {
    // 사진 파일이 없으면 분석하지 않음
    if (!file) {
      setAutoTags([]);
      return;
    }
    
    setLoadingAITags(true);
    try {
      const analysisResult = await analyzeImageForTags(file, location, note);
      const regionName = location?.split(' ')[0] || location || '';
      let weatherTags = [];
      
      if (regionName) {
        try {
          const weatherResult = await getWeatherByRegion(regionName);
          if (weatherResult?.success && weatherResult.weather) {
            weatherTags = buildWeatherTagsFromCondition(
              weatherResult.weather.condition,
              weatherResult.weather.temperature
            );
          }
        } catch (weatherError) {
          logger.warn('날씨 태그 생성 실패 (무시):', weatherError);
        }
      }
      
      if (analysisResult.success && analysisResult.tags && analysisResult.tags.length > 0) {
        // 5개로 제한
        const limitedTags = analysisResult.tags.slice(0, 5);
        
        // 현재 등록된 태그 목록 가져오기 (# 제거하여 비교)
        const existingTags = formData.tags.map(tag => 
          tag.startsWith('#') ? tag.substring(1).toLowerCase() : tag.toLowerCase()
        );
        
        // 이미 등록된 태그는 제외하고, 한국어 태그만 필터링
        const filteredTags = limitedTags
          .filter(tag => {
            const tagWithoutHash = tag.startsWith('#') ? tag.substring(1) : tag;
            const tagLower = tagWithoutHash.toLowerCase();
            // 이미 등록된 태그가 아닌지 확인
            const notExists = !existingTags.includes(tagLower);
            // 한국어인지 확인 (한글, 공백, 숫자만 허용)
            const isKorean = /^[가-힣\s\d]+$/.test(tagWithoutHash);
            // 날씨 중심 태그만 추천
            return notExists && isKorean && isWeatherTag(tagWithoutHash);
          })
          .slice(0, 5); // 최대 5개로 제한
        
        const mergedTags = [
          ...weatherTags.map(tag => `#${normalizeTag(tag)}`),
          ...filteredTags.map(tag => (tag.startsWith('#') ? tag : `#${tag}`))
        ];
        
        const dedupedTags = Array.from(
          new Map(mergedTags.map(tag => [normalizeTag(tag).toLowerCase(), `#${normalizeTag(tag)}`])).values()
        ).filter(tag => isWeatherTag(tag));
        
        let hashtagged = dedupedTags.slice(0, 5);
        
        if (hashtagged.length === 0) {
          const currentMonth = new Date().getMonth() + 1;
          const fallbackTags = currentMonth >= 3 && currentMonth <= 5
            ? ['봄날씨', '화창한날씨', '일출', '골든아워', '쾌적한온도']
            : currentMonth >= 6 && currentMonth <= 8
              ? ['여름날씨', '맑음', '청명한날씨', '자외선주의', '체감온도높음']
              : currentMonth >= 9 && currentMonth <= 11
                ? ['가을날씨', '쾌청한날씨', '일몰', '황금시간대', '쾌적한온도']
                : ['겨울날씨', '맑음', '청명한날씨', '일출', '체감온도낮음'];
          hashtagged = fallbackTags.map(tag => `#${tag}`);
        }
        
        setAutoTags(dedupeHashtags(hashtagged));
        setFormData(prev => ({
          ...prev,
          aiCategory: analysisResult.category,
          aiCategoryName: analysisResult.categoryName,
          aiCategoryIcon: analysisResult.categoryIcon
        }));
        
      } else {
        // 분석 실패 시 날씨 중심 기본 태그 제공 (5개)
        const existingTags = formData.tags.map(tag => 
          tag.startsWith('#') ? tag.substring(1).toLowerCase() : tag.toLowerCase()
        );
        const currentMonth = new Date().getMonth() + 1;
        let defaultTags = [];
        
        if (currentMonth >= 3 && currentMonth <= 5) {
          defaultTags = ['봄날씨', '화창한날씨', '일출', '골든아워', '쾌적한온도'];
        } else if (currentMonth >= 6 && currentMonth <= 8) {
          defaultTags = ['여름날씨', '맑음', '청명한날씨', '자외선주의', '체감온도높음'];
        } else if (currentMonth >= 9 && currentMonth <= 11) {
          defaultTags = ['가을날씨', '쾌청한날씨', '일몰', '황금시간대', '쾌적한온도'];
        } else {
          defaultTags = ['겨울날씨', '맑음', '청명한날씨', '일출', '체감온도낮음'];
        }
        
        const filteredTags = defaultTags
          .filter(tag => {
            const tagLower = tag.toLowerCase();
            return !existingTags.includes(tagLower);
          })
          .slice(0, 5);
        
        const fallbackMerged = [
          ...weatherTags.map(tag => `#${normalizeTag(tag)}`),
          ...filteredTags.map(tag => `#${normalizeTag(tag)}`)
        ];
        const fallbackDeduped = Array.from(
          new Map(fallbackMerged.map(tag => [normalizeTag(tag).toLowerCase(), `#${normalizeTag(tag)}`])).values()
        ).filter(tag => isWeatherTag(tag));
        setAutoTags(dedupeHashtags(fallbackDeduped).slice(0, 5));
        
        setFormData(prev => ({
          ...prev,
          aiCategory: 'scenic',
          aiCategoryName: '추천 장소',
          aiCategoryIcon: '📍'
        }));
      }
      
    } catch (error) {
      logger.error('AI 분석 실패:', error);
      // 에러 발생 시에도 날씨 중심 기본 태그 제공 (5개)
      const existingTags = formData.tags.map(tag => 
        tag.startsWith('#') ? tag.substring(1).toLowerCase() : tag.toLowerCase()
      );
      const currentMonth = new Date().getMonth() + 1;
      let defaultTags = [];
      
      if (currentMonth >= 3 && currentMonth <= 5) {
        defaultTags = ['봄날씨', '화창한날씨', '일출', '골든아워', '쾌적한온도'];
      } else if (currentMonth >= 6 && currentMonth <= 8) {
        defaultTags = ['여름날씨', '맑음', '청명한날씨', '자외선주의', '체감온도높음'];
      } else if (currentMonth >= 9 && currentMonth <= 11) {
        defaultTags = ['가을날씨', '쾌청한날씨', '일몰', '황금시간대', '쾌적한온도'];
      } else {
        defaultTags = ['겨울날씨', '맑음', '청명한날씨', '일출', '체감온도낮음'];
      }
      
      const filteredTags = defaultTags
        .filter(tag => !existingTags.includes(tag.toLowerCase()))
        .slice(0, 5);
      
      const fallbackMerged = filteredTags.map(tag => `#${normalizeTag(tag)}`);
      const fallbackDeduped = Array.from(
        new Map(fallbackMerged.map(tag => [normalizeTag(tag).toLowerCase(), `#${normalizeTag(tag)}`])).values()
      ).filter(tag => isWeatherTag(tag));
      setAutoTags(dedupeHashtags(fallbackDeduped).slice(0, 5));
      
      setFormData(prev => ({
        ...prev,
        aiCategory: 'scenic',
        aiCategoryName: '추천 장소',
        aiCategoryIcon: '📍'
      }));
    } finally {
      setLoadingAITags(false);
    }
  }, [formData.location, formData.note, formData.tags]);

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
      // 사진 파일만 분석 (동영상은 제외)
      const firstImageFile = imageFiles[0];
      if (firstImageFile && !firstImageFile.type.startsWith('video/')) {
        analyzeImageAndGenerateTags(firstImageFile, formData.location, formData.note);
      }
    }
  }, [formData.images.length, formData.videos.length, formData.location, formData.note, getCurrentLocation, analyzeImageAndGenerateTags]);


  useEffect(() => {
    if (formData.imageFiles.length === 0) return;
    
    if (reanalysisTimerRef.current) {
      clearTimeout(reanalysisTimerRef.current);
    }
    
    reanalysisTimerRef.current = setTimeout(() => {
      // 사진 파일이 있을 때만 재분석
      if (formData.imageFiles.length > 0 && (formData.location || formData.note)) {
        analyzeImageAndGenerateTags(formData.imageFiles[0], formData.location, formData.note);
      }
    }, 1000);
    
    return () => {
      if (reanalysisTimerRef.current) {
        clearTimeout(reanalysisTimerRef.current);
      }
    };
  }, [formData.location, formData.note, formData.imageFiles, analyzeImageAndGenerateTags]);

  // 태그가 변경될 때마다 자동 태그에서 이미 등록된 태그 제거
  useEffect(() => {
    if (autoTags.length === 0) return;
    
    const existingTags = formData.tags.map(tag => 
      tag.replace('#', '').toLowerCase()
    );
    
    setAutoTags(prev => {
      const filtered = prev.filter(tag => {
        const tagClean = tag.replace('#', '').toLowerCase();
        return !existingTags.includes(tagClean);
      });
      return dedupeHashtags(filtered);
    });
  }, [formData.tags, autoTags.length]);

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
    const cleaned = normalizeTag(tagInput);
    if (!cleaned) return;
    
    const exists = formData.tags.some(tag => {
      return normalizeTag(tag).toLowerCase() === cleaned.toLowerCase();
    });
    
    if (!exists) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, `#${cleaned}`]
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
    
    const alreadyExists = formData.tags.some(t => {
      const tClean = t.replace('#', '').toLowerCase();
      return tClean === cleanTag.toLowerCase();
    });
    
    if (!alreadyExists) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag.startsWith('#') ? tag : `#${cleanTag}`]
      }));
      // 추가된 태그를 자동 태그 목록에서 제거
      setAutoTags(prev => prev.filter(t => {
        const tClean = t.replace('#', '').toLowerCase();
        return tClean !== cleanTag.toLowerCase();
      }));
      logger.log('태그 추가:', cleanTag);
    }
  }, [formData.tags]);

  const checkAndAwardBadge = useCallback(() => {
    logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.log('🏆 뱃지 체크 및 획득 시작');
    logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
      // 사용자 통계 계산
      const uploadedPosts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');
      const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const currentUser = user || savedUser;
      const currentUserId = currentUser?.id || savedUser?.id || 'test_user_001';
      
      // 내 게시물만 필터링
      const myPosts = uploadedPosts.filter(p => p.userId === currentUserId);
      
      logger.log(`📊 사용자 통계 계산 중... (총 ${myPosts.length}개 게시물)`);
      
      // 통계 계산
      const stats = calculateUserStats(myPosts, currentUser);
      
      logger.debug('📈 계산된 통계:', {
        totalPosts: stats.totalPosts,
        totalLikes: stats.totalLikes,
        visitedRegions: stats.visitedRegions
      });
      
      // 뱃지 체크 (통계 전달!)
      const newBadges = checkNewBadges(stats);
      logger.log(`📋 발견된 새 뱃지: ${newBadges.length}개`);
      
      if (newBadges.length > 0) {
        // 모든 새 뱃지 획득 처리
        let awardedCount = 0;
        
        newBadges.forEach((badge, index) => {
          logger.log(`\n🎯 뱃지 ${index + 1}/${newBadges.length} 처리 중: ${badge.name}`);
          logger.debug(`   난이도: ${badge.difficulty}`);
          logger.debug(`   설명: ${badge.description}`);
          
          const awarded = awardBadge(badge);
          
          if (awarded) {
            awardedCount++;
            logger.log(`   ✅ 뱃지 획득 성공: ${badge.name}`);
            
            // 첫 번째 뱃지만 모달 표시
            if (index === 0) {
              notifyBadge(badge.name, badge.difficulty);
              logger.log('   📢 알림 전송 완료');
              
              setEarnedBadge(badge);
              setShowBadgeModal(true);
              setBadgeAnimationKey(prev => prev + 1); // 애니메이션 트리거
              logger.log('   🎉 뱃지 모달 표시');
              
              gainExp(`뱃지 획득 (${badge.difficulty})`);
            }
          } else {
            logger.log(`   ❌ 뱃지 획득 실패: ${badge.name}`);
          }
        });
        
        logger.log(`\n✅ 총 ${awardedCount}개의 뱃지 획득 완료`);
        logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        return awardedCount > 0;
      } else {
        logger.log('📭 획득 가능한 새 뱃지가 없습니다');
        logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        return false;
      }
    } catch (error) {
      logger.error('❌ 뱃지 체크 오류:', error);
      logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return false;
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    logger.log('Upload started!');
    logger.debug('Image count:', formData.images.length);
    logger.debug('Location:', formData.location);
    
    if (formData.images.length === 0 && formData.videos.length === 0) {
      alert('사진 또는 동영상을 추가해주세요');
      return;
    }

    if (!formData.location.trim()) {
      alert('위치를 입력해주세요');
      return;
    }

    logger.log('Validation passed - proceeding with upload');

    try {
      setUploading(true);
      setUploadProgress(10);
      
      const uploadedImageUrls = [];
      const uploadedVideoUrls = [];
      
      const aiCategory = formData.aiCategory || 'scenic';
      const aiCategoryName = formData.aiCategoryName || '추천 장소';
      const aiLabels = formData.tags || [];
      
      logger.debug('AI category:', aiCategoryName);
      
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
          // 백엔드 업로드 성공 시에도 localStorage에 저장 (뱃지 시스템을 위해)
          const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
          const currentUser = user || savedUser;
          const username = currentUser?.username || currentUser?.email?.split('@')[0] || '모사모';
          const currentUserId = currentUser?.id || savedUser?.id || 'test_user_001';
          
          const backendPost = result.post || result.data;
          
          // 이미지 URL 확인 및 설정
          const finalImages = uploadedImageUrls.length > 0 
            ? uploadedImageUrls 
            : (formData.images && formData.images.length > 0 ? formData.images : []);
          const finalVideos = uploadedVideoUrls.length > 0 
            ? uploadedVideoUrls 
            : (formData.videos && formData.videos.length > 0 ? formData.videos : []);
          
          logger.log('📸 최종 이미지/동영상 (백엔드):', {
            images: finalImages.length,
            videos: finalVideos.length,
            imageUrls: finalImages,
            videoUrls: finalVideos
          });
          
          if (finalImages.length === 0 && finalVideos.length === 0) {
            logger.error('❌ 이미지 또는 동영상이 없습니다!');
            alert('이미지 또는 동영상이 업로드되지 않았습니다');
            setUploading(false);
            setUploadProgress(0);
            return;
          }
          
          // 지역 정보 추출 (첫 번째 단어를 지역으로 사용)
          const region = formData.location?.split(' ')[0] || '기타';
          
          const uploadedPost = {
            id: backendPost?._id || backendPost?.id || `backend-${Date.now()}`,
            userId: currentUserId,
            images: finalImages,
            videos: finalVideos,
            location: formData.location,
            tags: formData.tags,
            note: formData.note,
            timestamp: backendPost?.createdAt || getCurrentTimestamp(),
            createdAt: backendPost?.createdAt || getCurrentTimestamp(),
            timeLabel: getTimeAgo(new Date(backendPost?.createdAt || Date.now())),
            user: username,
            likes: backendPost?.likesCount || 0,
            isNew: true,
            isLocal: false,
            category: aiCategory,
            categoryName: aiCategoryName,
            aiLabels: aiLabels,
            coordinates: formData.coordinates,
            detailedLocation: formData.location,
            placeName: formData.location,
            region: region // 지역 정보 추가
          };
          
          // localStorage에는 이미지를 저장하지 않음 (용량 문제)
          // 메타데이터만 저장하고, 이미지는 서버에서 불러옴
          const sanitizedPost = {
            ...uploadedPost,
            images: [], // localStorage에는 이미지 저장 안 함
            videos: [], // localStorage에는 비디오 저장 안 함
            // 이미지 개수만 저장 (표시용)
            imageCount: finalImages.length,
            videoCount: finalVideos.length,
            // 첫 번째 이미지 썸네일만 저장 (서버 URL이 있는 경우)
            thumbnail: finalImages.length > 0 && finalImages[0].startsWith('http') ? finalImages[0] : null
          };
          
          console.log('💾 localStorage 저장 (이미지 제외):', {
            게시물ID: sanitizedPost.id,
            이미지수: sanitizedPost.imageCount,
            비디오수: sanitizedPost.videoCount,
            썸네일: sanitizedPost.thumbnail ? '있음' : '없음'
          });
          
          const existingPosts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');
          const updatedPosts = [sanitizedPost, ...existingPosts];
          
          // JSON 문자열 크기 확인
          const jsonString = JSON.stringify(updatedPosts);
          const jsonSizeMB = (jsonString.length / (1024 * 1024)).toFixed(2);
          console.log(`📊 저장할 데이터 크기: ${jsonSizeMB} MB (이미지 제외)`);
          
          const saveResult = safeSetItem('uploadedPosts', jsonString);
          
          if (!saveResult.success) {
            console.error('❌ localStorage 저장 실패:', saveResult);
            console.log('💡 게시물은 서버에 업로드되었습니다.');
          } else {
            logger.log('✅ 백엔드 업로드 성공 및 localStorage 저장 완료:', {
              저장된게시물수: updatedPosts.length,
              새게시물ID: sanitizedPost.id,
              이미지수: sanitizedPost.imageCount,
              비디오수: sanitizedPost.videoCount
            });
          }
          
          setUploadProgress(100);
          setShowSuccessModal(true);
          
          logger.log('Backend upload success! Checking badges...');
          
          // 관심 지역/장소 알림 발송
          setTimeout(async () => {
            logger.log('🔔 관심 지역/장소 알림 체크 중...');
            await checkAndNotifyInterestPlace(uploadedPost);
          }, 200);
          
          // 게시물 업데이트 이벤트 발생 (localStorage 저장 후)
          setTimeout(() => {
            logger.log('📢 게시물 업데이트 이벤트 발생 (백엔드)');
            window.dispatchEvent(new Event('newPostsAdded'));
            window.dispatchEvent(new Event('postsUpdated'));
            logger.log('✅ 이벤트 전송 완료');
          }, 100); // 50ms -> 100ms로 증가하여 저장 완료 대기
          
          // 데이터 저장 완료 후 뱃지 체크 (더 긴 지연 시간)
          setTimeout(() => {
            logger.debug('Badge check timer running');
            
            // localStorage 저장 확인
            const verifyPosts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');
            const verifyPost = verifyPosts.find(p => p.id === uploadedPost.id);
            logger.debug('🔍 저장 확인 (백엔드):', {
              저장된게시물수: verifyPosts.length,
              새게시물존재: !!verifyPost,
              새게시물이미지: verifyPost?.images?.length || 0
            });
            
            // 사진 업로드 시 레벨 상승 (실제 업로드만)
            const expResult = gainExp('사진 업로드');
            if (expResult.levelUp) {
              logger.log(`Level up! Lv.${expResult.newLevel}`);
              window.dispatchEvent(new CustomEvent('levelUp', { 
                detail: { 
                  newLevel: expResult.newLevel
                } 
              }));
            }
            
            logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            logger.log('🏆 뱃지 체크 시작');
            const earnedBadge = checkAndAwardBadge();
            logger.debug('Badge earned result:', earnedBadge);
            logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            
            // 뱃지 진행률 업데이트 이벤트 발생
            window.dispatchEvent(new Event('badgeProgressUpdated'));
            
            if (!earnedBadge) {
              logger.debug('Navigate to main in 2 seconds...');
              setTimeout(() => {
                setShowSuccessModal(false);
                navigate('/main');
              }, 2000);
            } else {
              logger.log('Badge earned! Showing badge modal...');
            }
          }, 1000); // 500ms -> 1000ms로 증가하여 데이터 저장 완료 대기
        }
      } catch (postError) {
        logger.warn('Backend API failed - using localStorage');
        
        const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const currentUser = user || savedUser;
        const username = currentUser?.username || currentUser?.email?.split('@')[0] || '모사모';
        const currentUserId = currentUser?.id || savedUser?.id || 'test_user_001';
        
        logger.log('📸 게시물 저장 정보:', {
          userId: currentUserId,
          username: username,
          images: uploadedImageUrls.length > 0 ? uploadedImageUrls.length : formData.images.length,
          location: formData.location
        });
        
        // 이미지 URL 확인 및 설정
        const finalImages = uploadedImageUrls.length > 0 
          ? uploadedImageUrls 
          : (formData.images && formData.images.length > 0 ? formData.images : []);
        const finalVideos = uploadedVideoUrls.length > 0 
          ? uploadedVideoUrls 
          : (formData.videos && formData.videos.length > 0 ? formData.videos : []);
        
        logger.log('📸 최종 이미지/동영상:', {
          images: finalImages.length,
          videos: finalVideos.length,
          imageUrls: finalImages,
          videoUrls: finalVideos
        });
        
        if (finalImages.length === 0 && finalVideos.length === 0) {
          logger.error('❌ 이미지 또는 동영상이 없습니다!');
          alert('이미지 또는 동영상을 추가해주세요');
          setUploading(false);
          setUploadProgress(0);
          return;
        }
        
        // 지역 정보 추출 (첫 번째 단어를 지역으로 사용)
        const region = formData.location?.split(' ')[0] || '기타';
        
        const uploadedPost = {
          id: `local-${Date.now()}`,
          userId: currentUserId,
          images: finalImages,
          videos: finalVideos,
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
        
        logLocalStorageStatus();
        
        const existingPosts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');
        const updatedPosts = [uploadedPost, ...existingPosts];
        const saveResult = safeSetItem('uploadedPosts', JSON.stringify(updatedPosts));
        
        if (!saveResult.success) {
          logger.error('localStorage save failed:', saveResult.message);
          throw new Error(saveResult.message || 'localStorage save failed');
        }
        
        logger.log('✅ 게시물 저장 완료:', {
          저장된게시물수: updatedPosts.length,
          새게시물ID: uploadedPost.id,
          새게시물userId: uploadedPost.userId
        });
        
        // 게시물 업데이트 이벤트 발생 (뱃지 진행률 업데이트를 위해)
        // localStorage 저장 후 이벤트 발생
        setTimeout(() => {
          logger.log('📢 게시물 업데이트 이벤트 발생 (localStorage)');
          window.dispatchEvent(new Event('newPostsAdded'));
          window.dispatchEvent(new Event('postsUpdated'));
          logger.log('✅ 이벤트 전송 완료');
        }, 100); // 50ms -> 100ms로 증가하여 저장 완료 대기
        
        setUploadProgress(100);
        setShowSuccessModal(true);
        
        logger.log('Upload success! Checking badges & titles...');
        
        // 관심 지역/장소 알림 발송
        setTimeout(async () => {
          logger.log('🔔 관심 지역/장소 알림 체크 중...');
          await checkAndNotifyInterestPlace(uploadedPost);
        }, 200);
        
        // 데이터 저장 완료 후 뱃지 체크 (더 긴 지연 시간)
        setTimeout(() => {
          logger.debug('Badge check timer running');
          
          // localStorage 저장 확인
          const verifyPosts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');
          const verifyPost = verifyPosts.find(p => p.id === uploadedPost.id);
          logger.debug('🔍 저장 확인:', {
            저장된게시물수: verifyPosts.length,
            새게시물존재: !!verifyPost,
            새게시물이미지: verifyPost?.images?.length || 0
          });
          
          // 사진 업로드 시 레벨 상승 (실제 업로드만)
          const expResult = gainExp('사진 업로드');
          if (expResult.levelUp) {
            logger.log(`Level up! Lv.${expResult.newLevel}`);
            window.dispatchEvent(new CustomEvent('levelUp', { 
              detail: { 
                newLevel: expResult.newLevel
              } 
            }));
          }
          
          logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          logger.log('🏆 뱃지 체크 시작');
          const earnedBadge = checkAndAwardBadge();
          logger.debug('Badge earned result:', earnedBadge);
          logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          
          // 뱃지 진행률 업데이트 이벤트 발생
          window.dispatchEvent(new Event('badgeProgressUpdated'));
          
            // 뱃지가 없으면 메인으로 이동
            if (!earnedBadge) {
            logger.debug('Navigate to main in 2 seconds...');
            setTimeout(() => {
              setShowSuccessModal(false);
              navigate('/main');
            }, 2000);
          } else {
            logger.log('Badge or Title earned! Showing modal...');
          }
        }, 500);
      }
    } catch (error) {
      logger.error('Upload failed:', error);
      alert('업로드에 실패했습니다. 다시 시도해주세요');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [formData, user, navigate, checkAndAwardBadge]);

  return (
    <>
      <div className="phone-screen" style={{ 
        background: '#f8fafc',
        borderRadius: '32px',
        overflow: 'hidden',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}>
        {/* 상태바 영역 (시스템 UI 제거, 공간만 유지) */}
        <div style={{ height: '20px' }} />
        
        {/* 앱 헤더 */}
        <header className="app-header" style={{ 
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          background: 'transparent',
          color: '#111827'
        }}>
          <button 
            onClick={() => {
              if (location.state?.fromMap) {
                navigate('/main');
              } else {
                navigate(-1);
              }
            }}
            className="flex size-10 shrink-0 items-center justify-center text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <span className="text-xl">←</span>
          </button>
          <h1 className="flex-1 text-center text-lg font-bold" style={{ 
            fontSize: '18px',
            fontWeight: 700,
            color: '#111827',
            fontFamily: "'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
          }}>업로드: 여행 기록</h1>
          <div className="w-10"></div>
        </header>

        {/* 앱 컨텐츠 */}
        <main className="app-content" style={{ 
          flex: 1,
          overflowY: 'auto',
          paddingBottom: '100px',
          padding: '0 16px 100px 16px'
        }}>
          <div className="p-4 space-y-5">
            {/* 1단계: 사진 / 동영상 선택 */}
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">STEP 1</p>
              <p className="text-base font-bold mb-2">사진 / 동영상 선택</p>
              {(formData.images.length === 0 && formData.videos.length === 0) ? (
                <button
                  onClick={() => setShowPhotoOptions(true)}
                  className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-subtle-light dark:border-subtle-dark px-6 py-12 text-center w-full hover:border-primary transition-colors"
                >
                  <p className="text-base font-bold">사진 또는 동영상 추가</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">최대 10개까지</p>
                </button>
              ) : (
                <div 
                  className="flex gap-2 overflow-x-scroll overflow-y-hidden pb-2 -mx-4 px-4 snap-x snap-mandatory scroll-smooth cursor-grab active:cursor-grabbing select-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" 
                  style={{ 
                    WebkitOverflowScrolling: 'touch',
                    scrollBehavior: 'smooth'
                  }}
                  onMouseDown={(e) => {
                    // 버튼 클릭인 경우 드래그 방지
                    if (e.target.closest('button')) return;
                    
                    const slider = e.currentTarget;
                    let isDown = true;
                    let startX = e.pageX - slider.offsetLeft;
                    let scrollLeft = slider.scrollLeft;
                    slider.style.cursor = 'grabbing';

                    const handleMouseMove = (e) => {
                      if (!isDown) return;
                      e.preventDefault();
                      const x = e.pageX - slider.offsetLeft;
                      const walk = (x - startX) * 2;
                      slider.scrollLeft = scrollLeft - walk;
                    };

                    const handleMouseUp = () => {
                      isDown = false;
                      slider.style.cursor = 'grab';
                    };

                    const handleMouseLeave = () => {
                      isDown = false;
                      slider.style.cursor = 'grab';
                    };

                    document.addEventListener('mousemove', handleMouseMove);
                    document.addEventListener('mouseup', handleMouseUp);
                    slider.addEventListener('mouseleave', handleMouseLeave);

                    // 한 번만 실행되도록 이벤트 제거 함수
                    const cleanup = () => {
                      document.removeEventListener('mousemove', handleMouseMove);
                      document.removeEventListener('mouseup', handleMouseUp);
                      slider.removeEventListener('mouseleave', handleMouseLeave);
                      slider.removeEventListener('mouseup', cleanup);
                    };
                    
                    slider.addEventListener('mouseup', cleanup);
                  }}
                >
                  {/* 이미지들 */}
                  {formData.images.map((image, index) => (
                    <div key={`img-${index}`} className="relative w-24 h-24 flex-shrink-0 rounded overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 snap-start">
                      <img 
                        src={image} 
                        alt={`preview-${index}`} 
                        className="w-full h-full object-cover" 
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFormData(prev => ({
                            ...prev,
                            images: prev.images.filter((_, i) => i !== index),
                            imageFiles: prev.imageFiles.filter((_, i) => i !== index)
                          }));
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1 hover:bg-black/90 transition-colors z-10"
                      >
                        <span className="text-xs">×</span>
                      </button>
                    </div>
                  ))}
                  
                  {/* 동영상들 */}
                  {formData.videos.map((video, index) => (
                    <div key={`vid-${index}`} className="relative w-24 h-24 flex-shrink-0 rounded overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 snap-start">
                      <video 
                        src={video} 
                        className="w-full h-full object-cover"
                        muted
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <span className="text-white text-lg drop-shadow-lg">▶</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFormData(prev => ({
                            ...prev,
                            videos: prev.videos.filter((_, i) => i !== index),
                            videoFiles: prev.videoFiles.filter((_, i) => i !== index)
                          }));
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1 hover:bg-black/90 transition-colors z-10"
                      >
                        <span className="text-xs">×</span>
                      </button>
                    </div>
                  ))}
                  
                  {/* 추가 버튼 (최대 10개까지) */}
                  {(formData.images.length + formData.videos.length) < 10 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowPhotoOptions(true);
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="w-24 h-24 flex-shrink-0 rounded border-2 border-dashed border-subtle-light dark:border-subtle-dark flex items-center justify-center hover:border-primary transition-colors bg-gray-50 dark:bg-gray-800/50 snap-start z-10"
                    >
                      <span className="text-xl text-primary">+</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 2단계: 지도에서 위치 선택 */}
            <div>
              <label className="flex flex-col">
                <div className="flex items-center justify-between pb-2">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">STEP 2</p>
                    <p className="text-base font-medium">지도로 위치 선택</p>
                  </div>
                  {loadingLocation && (
                    <span className="text-xs text-primary">위치 감지 중...</span>
                  )}
                </div>
                {/* 지도 미리보기 영역 */}
                <div className="w-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 mb-3">
                  <div 
                    ref={mapContainerRef}
                    style={{
                      width: '100%',
                      height: '200px'
                    }}
                  />
                </div>
                {/* 현재 선택된 위치 텍스트 & 현재 위치 버튼 */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {formData.location
                        ? `선택된 위치: ${formData.location}`
                        : '지도를 눌러 위치를 선택해주세요.'}
                    </p>
                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      disabled={loadingLocation}
                      className="flex items-center justify-center rounded-full border border-subtle-light dark:border-subtle-dark bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 px-3 h-8 text-xs font-medium text-primary transition-colors disabled:opacity-50"
                      title="현재 위치로 지도 이동"
                    >
                      내 위치
                    </button>
                  </div>
                  {/* 텍스트 입력은 보조로 유지 (자동 완성된 위치 수정용) */}
                  <input
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg border border-subtle-light dark:border-subtle-dark bg-background-light dark:bg-background-dark focus:border-primary focus:ring-0 h-10 px-3 text-sm font-normal placeholder:text-placeholder-light dark:placeholder:text-placeholder-dark"
                    placeholder="위치 이름을 수정하거나 직접 입력할 수 있어요 (예: 서울 남산, 부산 해운대)"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  />
                </div>
              </label>
            </div>

            {/* 3단계: 태그 & 설명 */}
            <div>
              <label className="flex flex-col">
                <div className="flex items-center justify-between pb-2">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">STEP 3</p>
                    <p className="text-base font-medium">태그 추가</p>
                  </div>
                  {loadingAITags && (
                    <span className="text-xs text-primary">AI 분석 중...</span>
                  )}
                </div>
                <div className="flex w-full items-stretch gap-2">
                  <input
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg border border-subtle-light dark:border-subtle-dark bg-background-light dark:bg-background-dark focus:border-primary focus:ring-0 h-12 p-3 text-sm font-normal placeholder:text-placeholder-light dark:placeholder:text-placeholder-dark"
                    placeholder="#맑음 #화창한날씨 #일출"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <button
                    onClick={addTag}
                    className="flex shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-4 bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors"
                  >
                    <span>추가</span>
                  </button>
                </div>
              </label>
              
              {loadingAITags && (
                <div className="mt-3 p-3 bg-primary/5 dark:bg-primary/10 rounded-lg border border-primary/15 dark:border-primary/25">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm font-medium text-primary dark:text-primary-soft">
                      AI가 이미지를 분석하고 있습니다...
                    </p>
                  </div>
                </div>
              )}
              
              
              {!loadingAITags && autoTags.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1.5">AI 추천 태그</p>
                  <div className="flex flex-wrap gap-1.5">
                    {autoTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => addAutoTag(tag)}
                        className="rounded-full bg-primary/10 dark:bg-primary/15 hover:bg-primary/15 dark:hover:bg-primary/20 py-1 px-2.5 text-xs font-medium text-primary dark:text-primary-soft transition-all border border-primary/20 dark:border-primary/30"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
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
                          className="flex items-center justify-center text-primary dark:text-orange-300 hover:opacity-70"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="flex flex-col">
                <div className="flex items-center justify-between pb-2">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">STEP 4 (선택)</p>
                    <p className="text-base font-medium">지역 / 상황 설명</p>
                  </div>
                </div>
                <div className="relative">
                  <textarea
                    className="form-textarea w-full rounded-lg border border-subtle-light dark:border-subtle-dark bg-background-light dark:bg-background-dark focus:border-primary focus:ring-0 p-3 text-sm font-normal placeholder:text-placeholder-light dark:placeholder:text-placeholder-dark resize-none"
                    placeholder="지금 이 지역과 상황이 어떤지(분위기, 사람, 날씨 등)를 간단히 적어주세요"
                    rows="3"
                    value={formData.note}
                    onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                    style={{ 
                      maxHeight: '100px',
                      overflowY: 'auto'
                    }}
                  />
                </div>
              </label>
            </div>

            {/* 업로드 버튼 */}
            <div className="mt-6">
              <button
                onClick={() => {
                  logger.debug('Upload button clicked');
                  logger.debug('Current state:', { 
                    uploading, 
                    imageCount: formData.images.length,
                    location: formData.location,
                    disabled: uploading || formData.images.length === 0 
                  });
                  handleSubmit();
                }}
                disabled={uploading || formData.images.length === 0 || !formData.location.trim()}
                className={`flex w-full items-center justify-center rounded-xl h-14 px-4 text-lg font-bold transition-all shadow-lg ${
                  uploading || formData.images.length === 0 || !formData.location.trim()
                    ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-primary text-white hover:bg-primary/90 hover:shadow-xl active:scale-95'
                }`}
              >
                {uploading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    <span>업로드 중...</span>
                  </>
                ) : (
                  <span>📤 여행 기록 업로드하기</span>
                )}
              </button>
              {(formData.images.length === 0 || !formData.location.trim()) && (
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
                  {formData.images.length === 0 ? '사진을 추가해주세요' : '위치를 입력해주세요'}
                </p>
              )}
            </div>
          </div>
        </main>

        {/* 하단 네비게이션 바 */}
        <BottomNavigation />

        {showPhotoOptions && (
          <div 
            className="absolute inset-0 bg-black/50 z-[60] flex flex-col justify-end"
            onClick={() => setShowPhotoOptions(false)}
            style={{ bottom: 0 }}
          >
            <div 
              className="w-full bg-white dark:bg-gray-900 rounded-t-3xl p-6 space-y-3 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              style={{ marginBottom: '80px', maxWidth: '100%' }}
            >
              <h3 className="text-lg font-bold text-center mb-4">사진 선택</h3>
              <button
                onClick={() => handlePhotoOptionSelect('camera')}
                className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-800 border border-subtle-light dark:border-subtle-dark rounded-lg h-14 px-4 text-base font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <span>촬영하기</span>
              </button>
              <button
                onClick={() => handlePhotoOptionSelect('gallery')}
                className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-800 border border-subtle-light dark:border-subtle-dark rounded-lg h-14 px-4 text-base font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <span>갤러리에서 선택하기</span>
              </button>
            </div>
            {/* 취소 버튼 - 네비게이션 바 위치 */}
            <button
              onClick={() => setShowPhotoOptions(false)}
              className="absolute bottom-0 left-0 right-0 w-full flex items-center justify-center bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 h-20 px-4 text-base font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors z-[61]"
              style={{ 
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.05)'
              }}
            >
              취소
            </button>
          </div>
        )}

        {showSuccessModal && (
          <div className="absolute inset-0 z-[200] flex items-center justify-center bg-black/40 dark:bg-black/60 p-4">
            <div className="w-full max-w-sm transform flex-col rounded-xl bg-white dark:bg-[#221910] p-6 shadow-2xl transition-all">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div className="flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30">
                    <span className="text-green-600 dark:text-green-400 text-5xl">
                      ✓
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
          <div className="absolute inset-0 z-[200] flex items-center justify-center bg-black/70 p-4 animate-fade-in">
            <div className="w-full max-w-sm transform rounded-3xl bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-zinc-800 dark:to-zinc-900 p-8 shadow-2xl border-4 border-primary animate-scale-up">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-primary via-primary to-accent shadow-2xl">
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
                  earnedBadge.difficulty === '상' ? 'bg-primary-dark text-white' :
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
                    logger.debug('Navigate to profile');
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
                    logger.debug('Navigate to main');
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
    </>
  );
};

export default UploadScreen;










































