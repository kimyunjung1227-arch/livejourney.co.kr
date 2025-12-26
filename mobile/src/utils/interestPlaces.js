/**
 * 관심 지역/장소 시스템 (통합) - Mobile Version
 * 지역 알림 + 즐겨찾기 장소를 하나로!
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * 관심 지역/장소 추가/제거
 */
export const toggleInterestPlace = async (place) => {
  try {
    const interestsJson = await AsyncStorage.getItem('interestPlaces');
    const interests = interestsJson ? JSON.parse(interestsJson) : [];
    const placeName = typeof place === 'string' ? place : (place.name || place.location);
    const index = interests.findIndex(p => p.name === placeName);
    
    if (index > -1) {
      // 이미 있으면 제거
      interests.splice(index, 1);
      console.log(`⭐ 관심 지역/장소 해제: ${placeName}`);
    } else {
      // 새로 추가
      const newPlace = typeof place === 'string' 
        ? { name: place, addedAt: new Date().toISOString() }
        : { 
            name: placeName,
            location: place.location || placeName,
            region: place.region || placeName.split(' ')[0],
            coordinates: place.coordinates,
            addedAt: new Date().toISOString()
          };
      
      interests.push(newPlace);
      console.log(`⭐ 관심 지역/장소 추가: ${placeName}`);
    }
    
    await AsyncStorage.setItem('interestPlaces', JSON.stringify(interests));
    
    return index === -1; // true면 추가됨, false면 제거됨
  } catch (error) {
    console.error('관심 지역/장소 토글 오류:', error);
    return false;
  }
};

/**
 * 관심 지역/장소인지 확인
 */
export const isInterestPlace = async (placeName) => {
  try {
    const interestsJson = await AsyncStorage.getItem('interestPlaces');
    const interests = interestsJson ? JSON.parse(interestsJson) : [];
    return interests.some(p => 
      p.name === placeName || 
      p.location === placeName ||
      placeName.includes(p.name) ||
      p.name.includes(placeName)
    );
  } catch (error) {
    console.error('관심 지역/장소 확인 오류:', error);
    return false;
  }
};

/**
 * 모든 관심 지역/장소 가져오기
 */
export const getInterestPlaces = async () => {
  try {
    const interestsJson = await AsyncStorage.getItem('interestPlaces');
    return interestsJson ? JSON.parse(interestsJson) : [];
  } catch (error) {
    console.error('관심 목록 조회 오류:', error);
    return [];
  }
};

/**
 * 새 게시물이 관심 지역/장소인지 확인하고 알림 발송
 */
export const checkAndNotifyInterestPlace = async (post) => {
  try {
    const postLocation = post.location || post.placeName || '';
    if (!postLocation) return;
    
    const interests = await getInterestPlaces();
    const matchedPlace = interests.find(p => 
      postLocation.includes(p.name) || 
      p.name.includes(postLocation) ||
      (p.location && (postLocation.includes(p.location) || p.location.includes(postLocation)))
    );
    
    if (matchedPlace) {
      console.log(`⭐ 관심 지역/장소에 새 게시물: ${matchedPlace.name}`);
      
      // 모바일 푸시 알림 (React Native)
      // TODO: expo-notifications 사용하여 구현
    }
  } catch (error) {
    console.error('관심 지역/장소 알림 발송 오류:', error);
  }
};

/**
 * 관심 지역/장소 통계
 */
export const getInterestPlaceStats = async () => {
  const places = await getInterestPlaces();
  
  const regions = [];
  const specificPlaces = [];
  
  places.forEach(place => {
    if (place.name.length <= 3) {
      regions.push(place);
    } else {
      specificPlaces.push(place);
    }
  });
  
  return {
    total: places.length,
    regions: regions.length,
    places: specificPlaces.length
  };
};

export default {
  toggleInterestPlace,
  isInterestPlace,
  getInterestPlaces,
  checkAndNotifyInterestPlace,
  getInterestPlaceStats
};




