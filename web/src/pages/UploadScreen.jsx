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
    location: '',
    tags: [],
    note: '',
    coordinates: null,
    aiCategory: 'scenic',
    aiCategoryName: 'Ï∂îÏ≤ú ?•ÏÜå',
    aiCategoryIcon: '?èûÔ∏?
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

  // ?ÑÏû¨ ?ÑÏπò ?êÎèô Í∞êÏ?
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
      
      // Kakao Maps GeocoderÎ°?Ï£ºÏÜå Î≥Ä??      if (window.kakao && window.kakao.maps && window.kakao.maps.services) {
        const geocoder = new window.kakao.maps.services.Geocoder();
        
        geocoder.coord2Address(longitude, latitude, (result, status) => {
          if (status === window.kakao.maps.services.Status.OK && result[0]) {
            const address = result[0].address;
            const roadAddress = result[0].road_address;
            
            // Ï£ºÏÜå?êÏÑú ?ÅÏÑ∏ ÏßÄ??™Ö Ï∂îÏ∂ú (?? "?úÏö∏?πÎ≥Ñ??Í∞ïÎÇ®Íµ???Çº?? ??"?úÏö∏ Í∞ïÎÇ®Íµ???Çº??)
            let locationName = '';
            let detailedAddress = '';
            
            if (roadAddress) {
              const parts = roadAddress.address_name.split(' ');
              // ?ÅÏÑ∏?ïÎ≥¥ÍπåÏ? ?¨Ìï® (????+ Íµ?Íµ?+ ????Î©?
              locationName = parts.slice(0, 3).join(' ')
                .replace('?πÎ≥Ñ??, '')
                .replace('Í¥ëÏó≠??, '')
                .replace('?πÎ≥Ñ?êÏπò??, '')
                .replace('?πÎ≥Ñ?êÏπò??, '')
                .trim();
              detailedAddress = roadAddress.address_name;
            } else {
              const parts = address.address_name.split(' ');
              // ?ÅÏÑ∏?ïÎ≥¥ÍπåÏ? ?¨Ìï®
              locationName = parts.slice(0, 3).join(' ')
                .replace('?πÎ≥Ñ??, '')
                .replace('Í¥ëÏó≠??, '')
                .replace('?πÎ≥Ñ?êÏπò??, '')
                .replace('?πÎ≥Ñ?êÏπò??, '')
                .trim();
              detailedAddress = address.address_name;
            }
            
            setFormData(prev => ({
              ...prev,
              location: locationName, // ?ÅÏÑ∏ ÏßÄ??™Ö (Î¨∏Ïûê)
              coordinates: { lat: latitude, lng: longitude },
              address: detailedAddress,
              detailedLocation: locationName
            }));
          } else {
            setFormData(prev => ({
              ...prev,
              location: '?úÏö∏',
              coordinates: { lat: latitude, lng: longitude }
            }));
          }
        });
      } else {
        setFormData(prev => ({
          ...prev,
          location: '?úÏö∏', // Î¨∏ÏûêÎ°??úÏãú
          coordinates: { lat: latitude, lng: longitude }
        }));
      }
    } catch (error) {
      console.error('?ÑÏπò Í∞êÏ? ?§Ìå®:', error);
    } finally {
      setLoadingLocation(false);
    }
  }, []);

  // AI ?¥Î?ÏßÄ Î∂ÑÏÑù Î∞??¥Ïãú?úÍ∑∏ ?êÎèô ?ùÏÑ±
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
        // Î∂ÑÏÑù ?§Ìå® ???ÑÏπò/Ïπ¥ÌÖåÍ≥†Î¶¨ Í∏∞Î∞ò Ï∂îÏ≤ú ?úÍ∑∏
        const recommendedTags = getRecommendedTags('all');
        setAutoTags(recommendedTags.map(tag => `#${tag}`).slice(0, 8));
        
        // Í∏∞Î≥∏ Ïπ¥ÌÖåÍ≥†Î¶¨ ?§Ï†ï
        setFormData(prev => ({
          ...prev,
          aiCategory: 'scenic',
          aiCategoryName: 'Ï∂îÏ≤ú ?•ÏÜå',
          aiCategoryIcon: '?èûÔ∏?
        }));
      }
      
    } catch (error) {
      console.error('??AI Î∂ÑÏÑù ?§Ìå®:', error);
      // Í∏∞Î≥∏ ?úÍ∑∏ ?úÍ≥µ
      const defaultTags = ['?¨Ìñâ', 'Ï∂îÏñµ', '?çÍ≤Ω', '?êÎßÅ', 'ÎßõÏßë'];
      setAutoTags(defaultTags.map(tag => `#${tag}`));
      
      // Í∏∞Î≥∏ Ïπ¥ÌÖåÍ≥†Î¶¨ ?§Ï†ï
      setFormData(prev => ({
        ...prev,
        aiCategory: 'scenic',
        aiCategoryName: 'Ï∂îÏ≤ú ?•ÏÜå',
        aiCategoryIcon: '?èûÔ∏?
      }));
    } finally {
      setLoadingAITags(false);
    }
  }, [formData.location, formData.note]);

  // ?¥Î?ÏßÄ ?†ÌÉù ?∏Îì§??(useCallback)
  const handleImageSelect = useCallback(async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const MAX_SIZE = 50 * 1024 * 1024;
    const validFiles = files.filter(file => {
      if (file.size > MAX_SIZE) {
        alert(`${file.name}?Ä(?? 50MBÎ•?Ï¥àÍ≥º?©Îãà??`);
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

    if (isFirstImage) {
      getCurrentLocation();
      if (validFiles[0]) {
        analyzeImageAndGenerateTags(validFiles[0], formData.location, formData.note);
      }
    }
  }, [formData.images.length, formData.location, formData.note, getCurrentLocation, analyzeImageAndGenerateTags]);

  // ?ÑÏπò/?∏Ìä∏ Î≥ÄÍ≤????êÎèô ?¨Î∂Ñ??(?îÎ∞î?¥Ïä§ 1Ï¥?
  useEffect(() => {
    // ?¥Î?ÏßÄÍ∞Ä ?àÍ≥†, ?ÑÏπò???∏Ìä∏Í∞Ä ?àÏùÑ ?åÎßå
    if (formData.imageFiles.length === 0) return;
    
    // ?¥Ï†Ñ ?Ä?¥Î®∏ Ï∑®ÏÜå
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

  // ?¨ÏßÑ ?µÏÖò ?†ÌÉù (useCallback)
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

  // ?úÍ∑∏ Ï∂îÍ? (useCallback)
  const addTag = useCallback(() => {
    if (tagInput.trim() && !formData.tags.includes(`#${tagInput.trim()}`)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, `#${tagInput.trim()}`]
      }));
      setTagInput('');
    }
  }, [tagInput, formData.tags]);

  // ?úÍ∑∏ ?úÍ±∞ (useCallback)
  const removeTag = useCallback((tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  }, []);

  // AI ?êÎèô ?úÍ∑∏ Ï∂îÍ? (useCallback)
  const addAutoTag = useCallback((tag) => {
    // # ?úÍ±∞???úÏàò ?úÍ∑∏Î™?    const cleanTag = tag.replace('#', '');
    
    // Ï§ëÎ≥µ ?ïÏù∏ (# ?†Î¨¥ ?ÅÍ??ÜÏù¥)
    const alreadyExists = formData.tags.some(t => 
      t.replace('#', '') === cleanTag
    );
    
    if (!alreadyExists) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, cleanTag] // # ?ÜÏù¥ ?Ä??      }));
      // Ï∂îÍ????úÍ∑∏??Ï∂îÏ≤ú Î™©Î°ù?êÏÑú ?úÍ±∞
      setAutoTags(prev => prev.filter(t => t.replace('#', '') !== cleanTag));
      console.log('???úÍ∑∏ Ï∂îÍ?:', cleanTag);
    }
  }, [formData.tags]);

  // Î±ÉÏ? ?ïÏù∏ Î∞??òÏó¨ (useCallback) - ?úÏù¥?ÑÎ≥Ñ ?¨Ïù∏??ÏßÄÍ∏?  const checkAndAwardBadge = useCallback(() => {
    console.log('?îç ========== Î±ÉÏ? Ï≤¥ÌÅ¨ ?úÏûë (?úÏù¥???úÏä§?? ==========');
    
    // ?àÎ°ú ?çÎìù??Î±ÉÏ? ?ïÏù∏
    const newBadges = checkNewBadges();
    
    console.log('?èÜ ?çÎìù Í∞Ä?•Ìïú Î±ÉÏ?:', newBadges);
    
    if (newBadges.length > 0) {
      // Ï≤?Î≤àÏß∏ ??Î±ÉÏ?Îß??úÏãú (??Î≤àÏóê ?òÎÇò??
      const badge = newBadges[0];
      
      console.log(`?éâ Î±ÉÏ? ?çÎìù: ${badge.name}`);
      console.log(`   ?úÏù¥?? ${badge.difficulty}`);
      
      // Î±ÉÏ? ?òÏó¨
      const awarded = awardBadge(badge);
      
      if (awarded) {
        // ?åÎ¶º Î∞úÏÉù
        notifyBadge(badge.name, badge.difficulty);
        console.log('?îî ?åÎ¶º Î∞úÏÉù ?ÑÎ£å');
        
        // Î±ÉÏ? Î™®Îã¨ ?úÏãú
        console.log('?éØ Î±ÉÏ? Î™®Îã¨ Ï¶âÏãú ?úÏãú...');
        setEarnedBadge(badge);
        setShowBadgeModal(true);
        console.log('??Î±ÉÏ? Î™®Îã¨ state ?ÖÎç∞?¥Ìä∏:', { earnedBadge: badge, showBadgeModal: true });
        
        console.log(`?èÜ Î±ÉÏ? ?çÎìù ?ÑÎ£å: ${badge.name}`);
        
        // Î±ÉÏ? ?çÎìù Í≤ΩÌóòÏπ?        gainExp(`Î±ÉÏ? ?çÎìù (${badge.difficulty})`);
        
        console.log('========================================');
        
        return true;
      }
    }
    
    console.log('?πÔ∏è Î±ÉÏ? ?çÎìù Ï°∞Í±¥ ÎØ∏Îã¨??);
    console.log('========================================');
    return false;
  }, []);

  // ?ÖÎ°ú???úÏ∂ú (useCallback)
  const handleSubmit = useCallback(async () => {
    console.log('?? ?ÖÎ°ú???úÏûë!');
    console.log('?ì∏ ?¥Î?ÏßÄ Í∞úÏàò:', formData.images.length);
    console.log('?ìç ?ÑÏπò:', formData.location);
    
    if (formData.images.length === 0) {
      alert('?¨ÏßÑ??Ï∂îÍ??¥Ï£º?∏Ïöî.');
      return;
    }

    if (!formData.location.trim()) {
      alert('?ÑÏπòÎ•??ÖÎ†•?¥Ï£º?∏Ïöî.');
      return;
    }

    console.log('???†Ìö®??Í≤Ä???µÍ≥º - ?ÖÎ°ú??ÏßÑÌñâ');

    try {
      setUploading(true);
      setUploadProgress(10);
      console.log('???ÖÎ°ú???ÅÌÉú ?§Ï†ï ?ÑÎ£å');
      
      const uploadedImageUrls = [];
      
      // AIÍ∞Ä ?¥Î? Î∂ÑÏÑù??Ïπ¥ÌÖåÍ≥†Î¶¨ ?¨Ïö© ‚≠?      const aiCategory = formData.aiCategory || 'scenic';
      const aiCategoryName = formData.aiCategoryName || 'Ï∂îÏ≤ú ?•ÏÜå';
      const aiLabels = formData.tags || [];
      
      console.log('?éØ AI Î∂ÑÏÑù Ïπ¥ÌÖåÍ≥†Î¶¨ ?¨Ïö©:', aiCategoryName);
      
      if (formData.imageFiles.length > 0) {
        for (let i = 0; i < formData.imageFiles.length; i++) {
          const file = formData.imageFiles[i];
          setUploadProgress(20 + (i * 40 / formData.imageFiles.length));
          
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
      
      setUploadProgress(60);
      
      const postData = {
        images: uploadedImageUrls.length > 0 ? uploadedImageUrls : formData.images,
        content: formData.note || `${formData.location}?êÏÑú???¨Ìñâ Í∏∞Î°ù`,
        location: {
          name: formData.location,
          lat: 37.5665,
          lon: 126.9780,
          region: 'ÏßÄ??,
          country: '?Ä?úÎ?Íµ?
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
          
          console.log('??Î∞±Ïóî???ÖÎ°ú???±Í≥µ! Î±ÉÏ? Ï≤¥ÌÅ¨ ?úÏûë...');
          
          // localStorage ?Ä????Ï∂©Î∂Ñ??ÏßÄ?∞ÏùÑ ?êÍ≥† Î±ÉÏ? ?ïÏù∏
          setTimeout(() => {
            console.log('??Î±ÉÏ? Ï≤¥ÌÅ¨ ?Ä?¥Î®∏ ?§Ìñâ (Î∞±Ïóî??');
            // Î±ÉÏ? ?ïÏù∏ Î∞??çÎìù
            const earnedBadge = checkAndAwardBadge();
            
            console.log('?éØ Î±ÉÏ? ?çÎìù ?¨Î?:', earnedBadge);
            
            // Î±ÉÏ?Î•??çÎìù?òÏ? Î™ªÌïú Í≤ΩÏö∞?êÎßå ?êÎèô?ºÎ°ú Î©îÏù∏?ºÎ°ú ?¥Îèô
            if (!earnedBadge) {
              console.log('??2Ï¥???Î©îÏù∏?ºÎ°ú ?¥Îèô...');
              setTimeout(() => {
                setShowSuccessModal(false);
                navigate('/main');
              }, 2000);
            } else {
              console.log('?èÜ Î±ÉÏ? ?çÎìù! Î±ÉÏ? Î™®Îã¨ ?ÄÍ∏?Ï§?..');
            }
            // Î±ÉÏ?Î•??çÎìù??Í≤ΩÏö∞ Î±ÉÏ? Î™®Îã¨?êÏÑú ?¨Ïö©?êÍ? ?†ÌÉù
          }, 500);
        }
      } catch (postError) {
        console.log('?†Ô∏è Î∞±Ïóî??API ?§Ìå® - localStorage???Ä??);
        
        // localStorage?êÏÑú user ?ïÎ≥¥ Í∞Ä?∏Ïò§Í∏?(?ÜÏúºÎ©?Í∏∞Î≥∏Í∞?
        const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const username = user?.username || savedUser.username || 'Î™®ÏÇ¨Î™?;
        
        const uploadedPost = {
          id: `local-${Date.now()}`,
          userId: user?.id || 'test_user_001', // ?ÑÏû¨ ?¨Ïö©??ID Ï∂îÍ?!
          images: uploadedImageUrls.length > 0 ? uploadedImageUrls : formData.images,
          location: formData.location,
          tags: formData.tags,
          note: formData.note,
          timestamp: getCurrentTimestamp(), // ISO 8601 ?ïÏãù timestamp ‚≠?          createdAt: getCurrentTimestamp(), // ?∏Ìôò?±ÏùÑ ?ÑÌï¥
          timeLabel: getTimeAgo(new Date()), // ?ôÏ†Å Í≥ÑÏÇ∞ (?ÑÏû¨??"Î∞©Í∏à")
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
        
        // localStorage ?ÅÌÉú Î°úÍπÖ
        logLocalStorageStatus();
        
        const existingPosts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');
        const saveResult = safeSetItem('uploadedPosts', JSON.stringify([uploadedPost, ...existingPosts]));
        
        if (!saveResult.success) {
          console.error('??localStorage ?Ä???§Ìå®:', saveResult.message);
          throw new Error(saveResult.message || 'localStorage ?Ä?•Ïóê ?§Ìå®?àÏäµ?àÎã§.');
        }
        
        // ?¥Î≤§??Î∞úÏÉù - Î©îÏù∏?îÎ©¥ ?ÖÎç∞?¥Ìä∏
        window.dispatchEvent(new Event('newPostsAdded'));
        
        setUploadProgress(100);
        setShowSuccessModal(true);
        
        // ?±Í≥µ Î™®Îã¨ ?úÏãú
        console.log('???ÖÎ°ú???±Í≥µ! Î±ÉÏ? & ?Ä?¥Ì? Ï≤¥ÌÅ¨ ?úÏûë...');
        
        // localStorage ?Ä????Ï∂©Î∂Ñ??ÏßÄ?∞ÏùÑ ?êÍ≥† Î±ÉÏ? & ?Ä?¥Ì? ?ïÏù∏
        setTimeout(() => {
          console.log('??Î±ÉÏ? Ï≤¥ÌÅ¨ ?Ä?¥Î®∏ ?§Ìñâ');
          
          // Í≤ΩÌóòÏπ??çÎìù
          const expResult = gainExp('?¨ÏßÑ ?ÖÎ°ú??);
          if (expResult.levelUp) {
            console.log(`?éâ ?àÎ≤®?? Lv.${expResult.newLevel}`);
          }
          
          // 24?úÍ∞Ñ ?Ä?¥Ì? Ï≤¥ÌÅ¨
          const earnedTitle = checkAndAwardTitles(user.id);
          if (earnedTitle) {
            console.log(`?ëë 24?úÍ∞Ñ ?Ä?¥Ì? ?çÎìù: ${earnedTitle.name}`);
            gainExp('24?úÍ∞Ñ ?Ä?¥Ì?'); // ?Ä?¥Ì? Í≤ΩÌóòÏπ?          }
          
          // Î±ÉÏ? ?ïÏù∏ Î∞??çÎìù
          const earnedBadge = checkAndAwardBadge();
          
          console.log('?éØ Î±ÉÏ? ?çÎìù ?¨Î?:', earnedBadge);
          
          // Î±ÉÏ?Î•??çÎìù?òÏ? Î™ªÌïú Í≤ΩÏö∞?êÎßå ?êÎèô?ºÎ°ú Î©îÏù∏?ºÎ°ú ?¥Îèô
          if (!earnedBadge) {
            console.log('??2Ï¥???Î©îÏù∏?ºÎ°ú ?¥Îèô...');
            setTimeout(() => {
              setShowSuccessModal(false);
              navigate('/main');
            }, 2000);
          } else {
            console.log('?èÜ Î±ÉÏ? ?çÎìù! Î±ÉÏ? Î™®Îã¨ ?ÄÍ∏?Ï§?..');
          }
          // Î±ÉÏ?Î•??çÎìù??Í≤ΩÏö∞ Î±ÉÏ? Î™®Îã¨?êÏÑú ?¨Ïö©?êÍ? ?†ÌÉù
        }, 500);
      }
    } catch (error) {
      console.error('?ÖÎ°ú???§Ìå®:', error);
      alert('?ÖÎ°ú?úÏóê ?§Ìå®?àÏäµ?àÎã§. ?§Ïãú ?úÎèÑ?¥Ï£º?∏Ïöî.');
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
          <h1 className="flex-1 text-center text-lg font-bold">?àÎ°ú???¨Ìñâ Í∏∞Î°ù</h1>
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
                  <p className="text-lg font-bold">?¨ÏßÑ Ï∂îÍ?</p>
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
                  <p className="text-base font-medium">?ÑÏπò ?úÍ∑∏</p>
                  {loadingLocation && (
                    <span className="text-xs text-primary">?ìç ?ÑÏπò Í∞êÏ? Ï§?..</span>
                  )}
                </div>
                <div className="flex w-full flex-1 items-stretch gap-2">
                  <input
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg border border-subtle-light dark:border-subtle-dark bg-background-light dark:bg-background-dark focus:border-primary focus:ring-0 h-14 p-4 text-base font-normal placeholder:text-placeholder-light dark:placeholder:text-placeholder-dark"
                    placeholder="?¥Îîî?êÏÑú Ï∞çÏ? ?¨ÏßÑ?∏Í??? (?? ?úÏö∏ ?®ÏÇ∞, Î∂Ä???¥Ïö¥?Ä)"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  />
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={loadingLocation}
                    className="flex items-center justify-center rounded-lg border border-subtle-light dark:border-subtle-dark bg-primary/10 dark:bg-primary/20 hover:bg-primary/20 dark:hover:bg-primary/30 px-4 text-primary transition-colors disabled:opacity-50"
                    title="???ÑÏπò ?êÎèô Í∞êÏ?"
                  >
                    <span className="material-symbols-outlined">my_location</span>
                  </button>
                </div>
              </label>
            </div>

            <div>
              <label className="flex flex-col">
                <div className="flex items-center justify-between pb-2">
                  <p className="text-base font-medium">?¥Ïãú?úÍ∑∏</p>
                  {loadingAITags && (
                    <span className="text-xs text-primary">?§ñ AI Î∂ÑÏÑù Ï§?..</span>
                  )}
                </div>
                <div className="flex w-full items-stretch gap-2">
                  <input
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg border border-subtle-light dark:border-subtle-dark bg-background-light dark:bg-background-dark focus:border-primary focus:ring-0 h-14 p-4 text-base font-normal placeholder:text-placeholder-light dark:placeholder:text-placeholder-dark"
                    placeholder="#?¨Ìñâ #Ï∂îÏñµ"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <button
                    onClick={addTag}
                    className="flex shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg h-14 px-5 bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors"
                  >
                    <span>Ï∂îÍ?</span>
                  </button>
                </div>
              </label>
              
              {/* AI Î∂ÑÏÑù Ï§??úÏãú */}
              {loadingAITags && (
                <div className="mt-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                      ?§ñ AIÍ∞Ä ?¥Î?ÏßÄÎ•?Î∂ÑÏÑù?òÍ≥† ?àÏäµ?àÎã§...
                    </p>
                  </div>
                </div>
              )}
              
              {/* AI Î∂ÑÏÑù Í≤∞Í≥º - Ïπ¥ÌÖåÍ≥†Î¶¨ ?úÏãú */}
              {!loadingAITags && formData.aiCategoryName && formData.images.length > 0 && (
                <div className="mt-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{formData.aiCategoryIcon}</span>
                    <div className="flex-1">
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mb-0.5">
                        ?§ñ AI ?êÎèô Î∂ÑÎ•ò
                      </p>
                      <p className="text-base font-bold text-blue-900 dark:text-blue-100">
                        {formData.aiCategoryName}
                      </p>
                    </div>
                    <span className="text-xs bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-3 py-1.5 rounded-full font-bold">
                      ?êÎèô
                    </span>
                  </div>
                </div>
              )}
              
              {/* AI Ï∂îÏ≤ú ?úÍ∑∏ */}
              {!loadingAITags && autoTags.length > 0 && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                      <span className="material-symbols-outlined text-base">auto_awesome</span>
                      <span className="font-semibold">?§ñ AI Ï∂îÏ≤ú ?úÍ∑∏</span>
                      <span className="text-xs text-zinc-500">(??ïòÎ©?Ï∂îÍ???</span>
                    </p>
                    {formData.imageFiles.length > 0 && (
                      <button
                        type="button"
                        onClick={() => analyzeImageAndGenerateTags(formData.imageFiles[0], formData.location, formData.note)}
                        className="text-xs text-primary hover:text-primary/80 font-semibold flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>refresh</span>
                        ?¨Î∂Ñ??                      </button>
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
                    ?í° AIÍ∞Ä ?¥Î?ÏßÄÎ•?Î∂ÑÏÑù?¥ÏÑú ?êÎèô?ºÎ°ú ?ùÏÑ±???úÍ∑∏?ÖÎãà??                  </p>
                </div>
              )}
              
              {/* Ï∂îÍ????úÍ∑∏ */}
              {formData.tags.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">???úÍ∑∏</p>
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
                <p className="text-base font-medium pb-2">Í∞úÏù∏ ?∏Ìä∏</p>
                <textarea
                  className="form-textarea w-full rounded-lg border border-subtle-light dark:border-subtle-dark bg-background-light dark:bg-background-dark focus:border-primary focus:ring-0 p-4 text-base font-normal placeholder:text-placeholder-light dark:placeholder:text-placeholder-dark"
                  placeholder="?¥Ïö©???ÖÎ†•?òÏÑ∏??
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
              console.log('?ñ±Ô∏??ÖÎ°ú??Î≤ÑÌäº ?¥Î¶≠??');
              console.log('?ìä ?ÑÏû¨ ?ÅÌÉú:', { 
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
            <span className="truncate">{uploading ? '?ÖÎ°ú??Ï§?..' : '?ÖÎ°ú??}</span>
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
              <h3 className="text-lg font-bold text-center mb-4">?¨ÏßÑ ?†ÌÉù</h3>
              <button
                onClick={() => handlePhotoOptionSelect('camera')}
                className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-800 border border-subtle-light dark:border-subtle-dark rounded-lg h-14 px-4 text-base font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="material-symbols-outlined">photo_camera</span>
                <span>Ï¥¨ÏòÅ?òÍ∏∞</span>
              </button>
              <button
                onClick={() => handlePhotoOptionSelect('gallery')}
                className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-800 border border-subtle-light dark:border-subtle-dark rounded-lg h-14 px-4 text-base font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="material-symbols-outlined">photo_library</span>
                <span>Í∞§Îü¨Î¶¨Ïóê???†ÌÉù?òÍ∏∞</span>
              </button>
              <button
                onClick={() => setShowPhotoOptions(false)}
                className="w-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-lg h-14 px-4 text-base font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Ï∑®ÏÜå
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
                ?ÖÎ°ú???ÑÎ£å!
              </h1>
              
              <p className="text-gray-700 dark:text-gray-300 text-base font-normal leading-normal pb-4 text-center">
                ?¨Ìñâ Í∏∞Î°ù???±Í≥µ?ÅÏúºÎ°??ÖÎ°ú?úÎêò?àÏäµ?àÎã§.
              </p>

              <div className="mt-2">
                <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
                  ?ÖÎ°ú??Ï§?.. {uploadProgress}%
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Î±ÉÏ? ?çÎìù Î™®Îã¨ */}
        {/* ?èÜ Î±ÉÏ? ?çÎìù Î™®Îã¨ - ÏµúÏÉÅ???àÏù¥??(?úÏù¥??& ?¨Ïù∏???úÏãú) */}
        {showBadgeModal && earnedBadge && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 animate-fade-in">
            <div className="w-full max-w-sm transform rounded-3xl bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-zinc-800 dark:to-zinc-900 p-8 shadow-2xl border-4 border-primary animate-scale-up">
              {/* Î±ÉÏ? ?ÑÏù¥ÏΩ?*/}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-yellow-400 via-orange-400 to-orange-500 shadow-2xl">
                    <span className="text-6xl">{earnedBadge.icon || '?èÜ'}</span>
                  </div>
                  <div className="absolute inset-0 rounded-full bg-yellow-400/40 animate-ping"></div>
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-xl animate-bounce">
                    NEW!
                  </div>
                </div>
              </div>

              {/* Ï∂ïÌïò Î©îÏãúÏßÄ */}
              <h1 className="text-3xl font-bold text-center mb-3 text-zinc-900 dark:text-white">
                ?éâ Ï∂ïÌïò?©Îãà??
              </h1>
              
              <p className="text-xl font-bold text-center text-primary mb-2">
                {earnedBadge.name || earnedBadge}
              </p>
              
              {/* ?úÏù¥??*/}
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                  earnedBadge.difficulty === '?? ? 'bg-purple-500 text-white' :
                  earnedBadge.difficulty === 'Ï§? ? 'bg-blue-500 text-white' :
                  'bg-green-500 text-white'
                }`}>
                  ?úÏù¥?? {earnedBadge.difficulty || 'Ï§?}
                </div>
              </div>
              
              <p className="text-base font-medium text-center text-zinc-700 dark:text-zinc-300 mb-6">
                Î±ÉÏ?Î•??çÎìù?àÏäµ?àÎã§!
              </p>
              
              <p className="text-sm text-center text-zinc-600 dark:text-zinc-400 mb-8">
                {earnedBadge.description || '?¨Ìñâ Í∏∞Î°ù??Í≥ÑÏÜç ?®Í∏∞Í≥???ÎßéÏ? Î±ÉÏ?Î•??çÎìù?¥Î≥¥?∏Ïöî!'} ?åü
              </p>

              {/* Î≤ÑÌäº */}
              <div className="space-y-3">
                <button
                  onClick={() => {
                    console.log('?îÑ ?ÑÎ°ú?ÑÎ°ú ?¥Îèô');
                    setShowBadgeModal(false);
                    setShowSuccessModal(false);
                    navigate('/profile');
                  }}
                  className="w-full bg-primary text-white py-4 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                >
                  ?èÜ ?ÑÎ°ú?ÑÏóê???ïÏù∏?òÍ∏∞
                </button>
                <button
                  onClick={() => {
                    console.log('?îÑ Î©îÏù∏?ºÎ°ú ?¥Îèô');
                    setShowBadgeModal(false);
                    setShowSuccessModal(false);
                    navigate('/main');
                  }}
                  className="w-full bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 py-4 rounded-xl font-semibold hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-all transform hover:scale-105 active:scale-95"
                >
                  Î©îÏù∏?ºÎ°ú Í∞ÄÍ∏?                </button>
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









































