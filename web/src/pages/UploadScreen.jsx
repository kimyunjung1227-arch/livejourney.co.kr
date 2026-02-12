import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';
import { createPost } from '../api/posts';
import { uploadImage, uploadVideo } from '../api/upload';
import { useAuth } from '../contexts/AuthContext';
import { notifyBadge } from '../utils/notifications';
import { safeSetItem, logLocalStorageStatus } from '../utils/localStorageManager';
import { checkNewBadges, awardBadge, hasSeenBadge, markBadgeAsSeen, calculateUserStats } from '../utils/badgeSystem';
import { checkAndNotifyInterestPlace } from '../utils/interestPlaces';
import { analyzeImageForTags } from '../utils/aiImageAnalyzer';
import { getWeatherByRegion } from '../api/weather';
import { getCurrentTimestamp, getTimeAgo } from '../utils/timeUtils';
import { getBadgeCongratulationMessage, getBadgeDifficultyEffects } from '../utils/badgeMessages';
import { logger } from '../utils/logger';
import { extractExifData, convertGpsToAddress } from '../utils/exifExtractor';
import { useHorizontalDragScroll } from '../hooks/useHorizontalDragScroll';

const UploadScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { handleDragStart } = useHorizontalDragScroll();
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
    aiCategoryIcon: '📍',
    exifData: null, // EXIF 데이터 (날짜, GPS 등)
    photoDate: null, // 사진 촬영 날짜
    verifiedLocation: null // EXIF에서 추출한 검증된 위치
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
      // 첫 번째 이미지 파일에서 EXIF 데이터 추출
      const firstImageFile = imageFiles[0];
      if (firstImageFile && !firstImageFile.type.startsWith('video/')) {
        try {
          logger.log('📸 EXIF 데이터 추출 시작...');
          const exifData = await extractExifData(firstImageFile);

          if (exifData) {
            logger.log('✅ EXIF 데이터 추출 성공:', {
              hasDate: !!exifData.photoDate,
              hasGPS: !!exifData.gpsCoordinates,
              photoDate: exifData.photoDate,
              gps: exifData.gpsCoordinates
            });

            // EXIF에서 날짜 정보가 있으면 사용
            let photoDate = null;
            if (exifData.photoDate) {
              photoDate = exifData.photoDate;
            }

            // EXIF에서 GPS 좌표가 있으면 주소로 변환
            let verifiedLocation = null;
            let exifCoordinates = null;

            if (exifData.gpsCoordinates) {
              exifCoordinates = {
                lat: exifData.gpsCoordinates.lat,
                lng: exifData.gpsCoordinates.lng
              };

              // GPS 좌표를 주소로 변환
              try {
                verifiedLocation = await convertGpsToAddress(
                  exifData.gpsCoordinates.lat,
                  exifData.gpsCoordinates.lng
                );

                if (verifiedLocation) {
                  logger.log('📍 EXIF GPS 주소 변환 성공:', verifiedLocation);
                }
              } catch (error) {
                logger.warn('GPS 주소 변환 실패:', error);
              }
            }

            // formData 업데이트
            setFormData(prev => ({
              ...prev,
              exifData: exifData,
              photoDate: photoDate,
              verifiedLocation: verifiedLocation,
              // EXIF에서 위치 정보가 있으면 자동으로 설정 (사용자가 입력하지 않은 경우)
              location: prev.location || verifiedLocation || '',
              // EXIF에서 좌표가 있으면 사용
              coordinates: prev.coordinates || exifCoordinates || null
            }));
          } else {
            logger.log('ℹ️ EXIF 데이터 없음 - 기본 위치 감지 사용');
            // EXIF 데이터가 없으면 기본 위치 감지 사용
            getCurrentLocation();
          }
        } catch (error) {
          logger.warn('EXIF 추출 실패:', error);
          // EXIF 추출 실패 시 기본 위치 감지 사용
          getCurrentLocation();
        }

        // AI 이미지 분석
        analyzeImageAndGenerateTags(firstImageFile, formData.location, formData.note);
      } else {
        // 동영상만 있는 경우 기본 위치 감지
        getCurrentLocation();
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

          const awarded = awardBadge(badge, { region: stats?.topRegionName });
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

              // 경험치 시스템 제거됨
              // gainExp(`뱃지 획득 (${badge.difficulty})`);
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

    // 촬영 시점 제약: 당일(24시간 이내)에 촬영된 사진만 업로드 허용
    if (formData.images.length > 0) {
      const now = Date.now();
      const photoTs = formData.photoDate
        ? new Date(formData.photoDate).getTime()
        : (formData.exifData?.photoTimestamp ?? null);

      if (!photoTs || Number.isNaN(photoTs)) {
        alert('촬영일 정보가 없는 사진은 업로드할 수 없어요.\n당일(24시간 이내)에 촬영한 사진만 올려주세요.');
        return;
      }

      const diffHours = (now - photoTs) / (1000 * 60 * 60);
      if (diffHours > 24) {
        alert('당일(24시간 이내)에 촬영된 사진만 업로드할 수 있어요.\n다른 사진을 선택해주세요.');
        return;
      }
    }

    logger.log('Validation passed - proceeding with upload');

    try {
      setUploading(true);
      setUploadProgress(10);

      const uploadedImageUrls = [];
      const uploadedVideoUrls = [];

      const aiCategory = formData.aiCategory || 'scenic';
      const aiCategoryName = formData.aiCategoryName || '추천 장소';

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

      // 동영상 업로드 (uploadVideo 사용)
      if (formData.videoFiles.length > 0) {
        for (let i = 0; i < formData.videoFiles.length; i++) {
          const file = formData.videoFiles[i];
          uploadedCount++;
          setUploadProgress(20 + (uploadedCount * 40 / totalFiles));

          try {
            const uploadResult = await uploadVideo(file);
            if (uploadResult.success && uploadResult.url) {
              uploadedVideoUrls.push(uploadResult.url);
            } else {
              uploadedVideoUrls.push(formData.videos[i]);
            }
          } catch (uploadError) {
            uploadedVideoUrls.push(formData.videos[i]);
          }
        }
      } else {
        uploadedVideoUrls.push(...formData.videos);
      }

      setUploadProgress(60);

      // EXIF에서 추출한 좌표 사용 (없으면 기본값)
      const coordinates = formData.coordinates || (formData.exifData?.gpsCoordinates ? {
        lat: formData.exifData.gpsCoordinates.lat,
        lng: formData.exifData.gpsCoordinates.lng
      } : { lat: 37.5665, lng: 126.9780 });

      const postData = {
        images: uploadedImageUrls.length > 0 ? uploadedImageUrls : formData.images,
        videos: uploadedVideoUrls.length > 0 ? uploadedVideoUrls : formData.videos,
        content: formData.note || `${formData.location}에서의 여행 기록`,
        location: {
          name: formData.verifiedLocation || formData.location,
          lat: coordinates.lat,
          lon: coordinates.lng,
          region: formData.location?.split(' ')[0] || '지역',
          country: '대한민국'
        },
        tags: formData.tags.map(tag => tag.replace('#', '')),
        isRealtime: true,
        photoDate: formData.photoDate || null, // EXIF 촬영 날짜
        exifData: formData.exifData ? {
          photoDate: formData.exifData.photoDate,
          gpsCoordinates: formData.exifData.gpsCoordinates,
          cameraMake: formData.exifData.cameraMake,
          cameraModel: formData.exifData.cameraModel
        } : null // EXIF 메타데이터
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

          // EXIF에서 추출한 촬영 날짜 사용 (없으면 현재 시간)
          const photoTimestamp = formData.photoDate
            ? new Date(formData.photoDate).getTime()
            : (backendPost?.createdAt ? new Date(backendPost.createdAt).getTime() : Date.now());

          // 업로드 시점의 날씨 정보 가져오기
          let weatherAtUpload = null;
          try {
            const weatherResult = await getWeatherByRegion(region);
            if (weatherResult?.success && weatherResult.weather) {
              weatherAtUpload = {
                icon: weatherResult.weather.icon,
                condition: weatherResult.weather.condition,
                temperature: weatherResult.weather.temperature,
                fetchedAt: Date.now() // 날씨 정보를 가져온 시점
              };
            }
          } catch (weatherError) {
            logger.warn('업로드 시 날씨 정보 가져오기 실패 (무시):', weatherError);
          }

          const uploadedPost = {
            id: backendPost?._id || backendPost?.id || `backend-${Date.now()}`,
            userId: currentUserId,
            images: finalImages,
            videos: finalVideos,
            location: formData.location,
            tags: formData.tags,
            note: formData.note,
            timestamp: photoTimestamp,
            createdAt: backendPost?.createdAt || getCurrentTimestamp(),
            photoDate: formData.photoDate || null, // EXIF에서 추출한 촬영 날짜
            timeLabel: getTimeAgo(new Date(photoTimestamp)),
            user: username,
            likes: backendPost?.likesCount || 0,
            isNew: true,
            isLocal: false,
            category: aiCategory,
            categoryName: aiCategoryName,
            coordinates: formData.coordinates || (formData.exifData?.gpsCoordinates ? {
              lat: formData.exifData.gpsCoordinates.lat,
              lng: formData.exifData.gpsCoordinates.lng
            } : null),
            detailedLocation: formData.verifiedLocation || formData.location,
            placeName: formData.location,
            region: region, // 지역 정보 추가
            weather: weatherAtUpload, // 업로드 시점의 날씨 정보 저장
            exifData: formData.exifData ? {
              photoDate: formData.exifData.photoDate,
              gpsCoordinates: formData.exifData.gpsCoordinates,
              cameraMake: formData.exifData.cameraMake,
              cameraModel: formData.exifData.cameraModel
            } : null, // EXIF 메타데이터 (신뢰할 수 있는 정보)
            verifiedLocation: formData.verifiedLocation || null // EXIF에서 검증된 위치
          };

          // localStorage에도 이미지/동영상 URL 저장 (표시용; 서버 또는 blob URL)
          const sanitizedPost = {
            ...uploadedPost,
            images: finalImages,
            videos: finalVideos,
            imageCount: finalImages.length,
            videoCount: finalVideos.length,
            thumbnail: finalImages.length > 0 ? finalImages[0] : null
          };

          logger.log('💾 localStorage 저장 (이미지 제외):', {
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
          logger.log(`📊 저장할 데이터 크기: ${jsonSizeMB} MB (이미지 제외)`);

          const saveResult = safeSetItem('uploadedPosts', jsonString);

          if (!saveResult.success) {
            logger.error('❌ localStorage 저장 실패:', saveResult);
            logger.log('💡 게시물은 서버에 업로드되었습니다.');
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
            // 경험치 시스템 제거됨
            /*
            const expResult = gainExp('사진 업로드');
            if (expResult.levelUp) {
              logger.log(`Level up! Lv.${expResult.newLevel}`);
              window.dispatchEvent(new CustomEvent('levelUp', { 
                detail: { 
                  newLevel: expResult.newLevel
                } 
              }));
            }
            */

            logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            logger.log('🏆 뱃지 체크 시작');
            const earnedBadge = checkAndAwardBadge();
            logger.debug('Badge earned result:', earnedBadge);
            logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

            // 뱃지 진행률 업데이트 이벤트 발생
            window.dispatchEvent(new Event('badgeProgressUpdated'));

            if (earnedBadge) {
              logger.log('Badge earned! Showing badge modal...');
              setShowBadgeModal(true);
              // 뱃지 모달 표시 후 3초 뒤 메인으로 이동
              setTimeout(() => {
                setShowSuccessModal(false);
                setShowBadgeModal(false);
                navigate('/main');
              }, 3000);
            } else {
              logger.debug('Navigate to main in 2 seconds...');
              setTimeout(() => {
                setShowSuccessModal(false);
                navigate('/main');
              }, 2000);
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

        // EXIF에서 추출한 촬영 날짜 사용 (없으면 현재 시간)
        const photoTimestamp = formData.photoDate
          ? new Date(formData.photoDate).getTime()
          : Date.now();

        // 업로드 시점의 날씨 정보 가져오기
        let weatherAtUpload = null;
        try {
          const weatherResult = await getWeatherByRegion(region);
          if (weatherResult?.success && weatherResult.weather) {
            weatherAtUpload = {
              icon: weatherResult.weather.icon,
              condition: weatherResult.weather.condition,
              temperature: weatherResult.weather.temperature,
              fetchedAt: Date.now() // 날씨 정보를 가져온 시점
            };
          }
        } catch (weatherError) {
          logger.warn('업로드 시 날씨 정보 가져오기 실패 (무시):', weatherError);
        }

        // localStorage에 이미지/동영상 URL 저장 (서버 URL 또는 blob URL)
        const uploadedPost = {
          id: `local-${Date.now()}`,
          userId: currentUserId,
          images: finalImages,
          videos: finalVideos,
          imageCount: finalImages.length,
          videoCount: finalVideos.length,
          location: formData.location,
          tags: formData.tags,
          note: formData.note,
          timestamp: photoTimestamp,
          createdAt: getCurrentTimestamp(),
          photoDate: formData.photoDate || null, // EXIF에서 추출한 촬영 날짜
          timeLabel: getTimeAgo(new Date(photoTimestamp)),
          user: username,
          likes: 0,
          isNew: true,
          isLocal: true,
          category: aiCategory,
          categoryName: aiCategoryName,
          coordinates: formData.coordinates || (formData.exifData?.gpsCoordinates ? {
            lat: formData.exifData.gpsCoordinates.lat,
            lng: formData.exifData.gpsCoordinates.lng
          } : null),
          detailedLocation: formData.verifiedLocation || formData.location,
          placeName: formData.location,
          region: region, // 지역 정보 추가
          weather: weatherAtUpload, // 업로드 시점의 날씨 정보 저장
          exifData: formData.exifData ? {
            photoDate: formData.exifData.photoDate,
            gpsCoordinates: formData.exifData.gpsCoordinates,
            cameraMake: formData.exifData.cameraMake,
            cameraModel: formData.exifData.cameraModel
          } : null, // EXIF 메타데이터 (신뢰할 수 있는 정보)
          verifiedLocation: formData.verifiedLocation || null // EXIF에서 검증된 위치
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

          logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          logger.log('🏆 뱃지 체크 시작');
          const earnedBadge = checkAndAwardBadge();
          logger.debug('Badge earned result:', earnedBadge);
          logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

          // 뱃지 진행률 업데이트 이벤트 발생
          window.dispatchEvent(new Event('badgeProgressUpdated'));

          if (earnedBadge) {
            logger.log('Badge or Title earned! Showing modal...');
            setShowBadgeModal(true);
            // 뱃지 모달 표시 후 3초 뒤 메인으로 이동
            setTimeout(() => {
              setShowSuccessModal(false);
              setShowBadgeModal(false);
              navigate('/main');
            }, 3000);
          } else {
            logger.debug('Navigate to main in 2 seconds...');
            setTimeout(() => {
              setShowSuccessModal(false);
              navigate('/main');
            }, 2000);
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
        background: '#ffffff',
        borderRadius: '32px',
        overflow: 'hidden',
        height: '100vh',
        maxHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}>
        {/* 상태바 영역 (시스템 UI 제거, 공간만 유지) */}
        <div style={{ height: '20px' }} />

        {/* 앱 헤더 - 개인 기록 느낌 */}
        <header className="app-header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          background: 'transparent',
          color: '#111827',
          borderBottom: '1px solid rgba(0, 0, 0, 0.05)'
        }}>
          <button
            onClick={() => {
              if (location.state?.fromMap) {
                navigate('/main');
              } else {
                navigate(-1);
              }
            }}
            className="flex size-12 shrink-0 items-center justify-center text-content-light dark:text-content-dark hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-2xl">arrow_back</span>
          </button>
          <div className="flex-1 text-center">
            <h1 className="text-lg font-bold" style={{
              fontSize: '18px',
              fontWeight: 700,
              color: '#00BCD4',
              fontFamily: "'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              marginBottom: '2px'
            }}>나의 여행 기록</h1>
            <p className="text-xs text-gray-500" style={{ fontSize: '12px' }}>
              {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}
            </p>
          </div>
          <div className="w-10"></div>
        </header>

        {/* 앱 컨텐츠 */}
        <main className="app-content" style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          paddingBottom: '160px',
          padding: '0 16px 160px 16px',
          background: 'transparent',
          WebkitOverflowScrolling: 'touch',
          minHeight: 0
        }}>
          <div className="pt-4 space-y-5">
            {/* 사진 / 동영상 선택 — 단일 큰 박스 */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 px-1">사진 / 동영상</h3>

              {(formData.images.length === 0 && formData.videos.length === 0) ? (
                <button
                  type="button"
                  onClick={() => setShowPhotoOptions(true)}
                  className="w-full rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/60 flex flex-col items-center justify-center text-center hover:border-primary hover:bg-primary-soft/20 transition-colors"
                  style={{
                    minHeight: '160px',
                    maxHeight: '50vh',
                    padding: '24px 16px'
                  }}
                >
                  {/* 가운데 플러스 버튼 */}
                  <div className="flex items-center justify-center mb-3">
                    <div className="w-14 h-14 rounded-full border-2 border-primary/60 bg-white flex items-center justify-center shadow-sm">
                      <span className="material-symbols-outlined text-3xl text-primary">add</span>
                    </div>
                  </div>
                  {/* 플러스 아래 문구 */}
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                    사진, 동영상 추가하기
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    동영상은 파일당 100MB까지 업로드할 수 있어요
                  </p>
                </button>
              ) : (
                <div className="space-y-3">
                  {/* 개수 요약 */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-700 dark:text-gray-300 px-1">
                    {formData.images.length > 0 && (
                      <span>사진 {formData.images.length}장</span>
                    )}
                    {formData.videos.length > 0 && (
                      <span>동영상 {formData.videos.length}개</span>
                    )}
                  </div>

                  {/* 가로 한 줄 슬라이드 미리보기 */}
                  <div
                    className="flex gap-2 overflow-x-auto pb-1 -mx-1 scrollbar-thin [&::-webkit-scrollbar]:h-1"
                    onMouseDown={(e) => { if (!e.target.closest('button')) handleDragStart(e); }}
                  >
                    {formData.images.map((image, index) => (
                    <div
                        key={`img-row-${index}`}
                        className="relative flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 bg-gray-100"
                    >
                        <img src={image} alt="" className="w-full h-full object-cover" />
                        <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setFormData(prev => ({
                            ...prev,
                            images: prev.images.filter((_, i) => i !== index),
                            imageFiles: prev.imageFiles.filter((_, i) => i !== index)
                            }));
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white text-gray-800 border border-gray-300 shadow-md flex items-center justify-center text-xs font-bold hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors"
                        >
                        ×
                        </button>
                    </div>
                    ))}

                    {formData.videos.map((video, index) => (
                      <div
                        key={`vid-row-${index}`}
                        className="relative flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 bg-gray-100"
                      >
                        <video src={video} className="w-full h-full object-cover" muted />
                        <span className="absolute inset-0 flex items-center justify-center text-white text-xs drop-shadow">▶</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFormData(prev => ({
                              ...prev,
                              videos: prev.videos.filter((_, i) => i !== index),
                              videoFiles: prev.videoFiles.filter((_, i) => i !== index)
                            }));
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                          className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center text-xs hover:bg-black/80"
                        >
                          ×
                        </button>
                      </div>
                    ))}

                    {/* 업로드 개수 제한 없이 항상 + 버튼 노출 */}
                    <button
                      type="button"
                      onClick={() => setShowPhotoOptions(true)}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="flex-shrink-0 w-24 h-24 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:border-primary hover:text-primary text-2xl font-light"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 위치 입력 */}
            <div>
              <label className="flex flex-col">
                <p className="text-base font-semibold text-gray-800 mb-3">위치</p>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl border border-primary-soft bg-white focus:border-primary focus:ring-2 focus:ring-primary-soft min-h-[48px] h-12 px-4 text-base font-normal placeholder:text-gray-400"
                      placeholder="위치를 입력하세요"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    />
                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      disabled={loadingLocation}
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '20px',
                        border: 'none',
                        background: 'white',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: loadingLocation ? 'not-allowed' : 'pointer',
                        opacity: loadingLocation ? 0.5 : 1,
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        if (!loadingLocation) {
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                      title="현재 위치 자동 입력"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#00BCD4' }}>
                        {loadingLocation ? 'hourglass_empty' : 'my_location'}
                      </span>
                    </button>
                  </div>
                  {loadingLocation && (
                    <p className="text-xs text-primary mt-1">위치를 찾고 있어요...</p>
                  )}
                </div>
              </label>
            </div>

            {/* 태그 */}
            <div>
              <label className="flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-base font-semibold text-gray-800">태그</p>
                  {loadingAITags && (
                    <span className="text-xs text-primary">AI 분석 중...</span>
                  )}
                </div>
                <div className="flex w-full items-stretch gap-2">
                  <input
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl border border-primary-soft bg-white focus:border-primary focus:ring-2 focus:ring-primary-soft min-h-[48px] h-12 px-4 text-base font-normal placeholder:text-gray-400"
                    placeholder="#맑음 #화창한날씨"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <button
                    onClick={addTag}
                    className="flex shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl min-h-[48px] h-12 px-5 bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-all"
                  >
                    <span>추가</span>
                  </button>
                </div>
              </label>

              {loadingAITags && (
                <div className="mt-3 p-3 bg-primary-soft/50 rounded-lg border border-primary-soft">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs font-medium text-primary">
                      AI 분석 중...
                    </p>
                  </div>
                </div>
              )}


              {!loadingAITags && autoTags.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-1.5">추천 태그</p>
                  <div className="flex flex-wrap gap-1.5">
                    {autoTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => addAutoTag(tag)}
                        className="rounded-full bg-primary-soft hover:bg-primary/10 border border-primary-soft hover:border-primary py-1 px-2.5 text-xs font-medium text-primary transition-all"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {formData.tags.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-gray-600 mb-1.5">내 태그</p>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <div
                        key={tag}
                        className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft border border-primary/20 py-2 px-4 min-h-[40px] text-sm text-primary font-semibold leading-tight"
                      >
                        <span>{tag}</span>
                        <button
                          onClick={() => removeTag(tag)}
                          className="flex items-center justify-center text-primary hover:text-primary-dark hover:bg-primary/20 rounded-full w-6 h-6 min-w-[24px] min-h-[24px] text-base transition-colors"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 설명 (선택) */}
            <div>
              <label className="flex flex-col">
                <p className="text-base font-semibold text-gray-800 mb-3">설명 (선택)</p>
                <div className="relative">
                  <textarea
                    className="form-textarea w-full rounded-xl border border-primary-soft bg-white focus:border-primary focus:ring-2 focus:ring-primary-soft p-4 text-base font-normal placeholder:text-gray-400 resize-none leading-relaxed min-h-[100px]"
                    placeholder="이 순간의 느낌이나 생각을 적어보세요"
                    rows="3"
                    value={formData.note}
                    onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                    style={{
                      maxHeight: '140px',
                      overflowY: 'auto',
                      lineHeight: '1.5'
                    }}
                  />
                </div>
              </label>
            </div>
          </div>
        </main>

        {/* 하단 고정 업로드 버튼 바 (네비게이션 위에 항상 보이도록) */}
        <footer
          className="flex-shrink-0"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 80,
            padding: '6px 16px 10px',
            background: 'rgba(255,255,255,0.98)',
            borderTop: '1px solid rgba(148, 163, 184, 0.2)'
          }}
        >
          <div className="w-full">
            <button
              onClick={() => {
                logger.debug('Upload button clicked');
                logger.debug('Current state:', {
                  uploading,
                  imageCount: formData.images.length,
                  videoCount: formData.videos.length,
                  location: formData.location,
                  disabled: uploading || (formData.images.length + formData.videos.length) === 0
                });
                handleSubmit();
              }}
              disabled={uploading || (formData.images.length + formData.videos.length) === 0 || !formData.location.trim()}
              className={`flex w-full items-center justify-center rounded-full min-h-[44px] h-11 px-4 text-sm font-semibold text-white transition-all ${uploading || (formData.images.length + formData.videos.length) === 0 || !formData.location.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-primary hover:bg-primary-dark active:scale-[0.98] transform'
                }`}
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  <span>업로드 중...</span>
                </>
              ) : (
                <span>업로드하기</span>
              )}
            </button>
            {((formData.images.length + formData.videos.length) === 0 || !formData.location.trim()) && (
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
                {(formData.images.length + formData.videos.length) === 0 ? '사진 또는 동영상을 추가해주세요' : '위치를 입력해주세요'}
              </p>
            )}
          </div>
        </footer>

        {/* 하단 네비게이션 바 */}
        <BottomNavigation />

        {/* 업로드 중 로딩 모달 */}
        {uploading && (
          <div className="absolute inset-0 z-[200] flex items-center justify-center bg-black/60 dark:bg-black/80 p-4">
            <div className="w-full max-w-sm transform flex-col rounded-xl bg-white dark:bg-[#221910] p-8 shadow-2xl transition-all">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="flex items-center justify-center w-24 h-24 rounded-full bg-primary/10">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping"></div>
                </div>
              </div>

              <h1 className="text-[#181411] dark:text-gray-100 text-[24px] font-bold leading-tight tracking-[-0.015em] text-center mb-2">
                업로드 중...
              </h1>

              <p className="text-gray-600 dark:text-gray-400 text-base font-normal leading-normal pb-6 text-center">
                여행 기록을 업로드하고 있습니다
              </p>

              {/* 진행률 바 */}
              <div className="mb-4">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {uploadProgress < 30 ? '파일 준비 중...' :
                      uploadProgress < 60 ? '이미지 업로드 중...' :
                        uploadProgress < 80 ? '게시물 저장 중...' :
                          uploadProgress < 100 ? '처리 중...' : '완료!'}
                  </p>
                  <p className="text-sm font-semibold text-primary">
                    {uploadProgress}%
                  </p>
                </div>
              </div>

              {/* 단계 표시 */}
              <div className="flex justify-center gap-2 mt-4">
                <div className={`w-2 h-2 rounded-full transition-all ${uploadProgress >= 20 ? 'bg-primary' : 'bg-gray-300'}`}></div>
                <div className={`w-2 h-2 rounded-full transition-all ${uploadProgress >= 60 ? 'bg-primary' : 'bg-gray-300'}`}></div>
                <div className={`w-2 h-2 rounded-full transition-all ${uploadProgress >= 80 ? 'bg-primary' : 'bg-gray-300'}`}></div>
                <div className={`w-2 h-2 rounded-full transition-all ${uploadProgress >= 100 ? 'bg-primary' : 'bg-gray-300'}`}></div>
              </div>
            </div>
          </div>
        )}

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
              <h3 className="text-lg font-bold text-center mb-4">사진 또는 동영상 선택</h3>
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

              {uploadProgress < 100 ? (
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
              ) : (
                <p className="text-sm text-center text-gray-500 dark:text-gray-400 mt-2">
                  잠시 후 메인 화면으로 이동합니다...
                </p>
              )}
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
                <div className={`px-3 py-1 rounded-full text-sm font-bold ${earnedBadge.difficulty === '상' ? 'bg-primary-dark text-white' :
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










































