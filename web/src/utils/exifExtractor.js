import exifr from 'exifr';
import { logger } from './logger';

/**
 * 이미지 파일에서 EXIF 데이터 추출 (날짜, GPS 좌표 등)
 * @param {File} file - 이미지 파일
 * @returns {Promise<Object>} EXIF 데이터 객체
 */
export const extractExifData = async (file) => {
  try {
    if (!file || !file.type.startsWith('image/')) {
      logger.debug('EXIF 추출: 이미지 파일이 아님');
      return null;
    }

    // EXIF 데이터 추출 (날짜, GPS, 카메라 정보 등)
    const exifData = await exifr.parse(file, {
      // 필요한 필드만 추출 (성능 최적화)
      pick: [
        'DateTimeOriginal',  // 촬영 날짜/시간
        'CreateDate',         // 생성 날짜
        'ModifyDate',         // 수정 날짜
        'GPSLatitude',        // 위도
        'GPSLongitude',       // 경도
        'GPSAltitude',        // 고도
        'GPSDateTime',        // GPS 날짜/시간
        'Make',               // 카메라 제조사
        'Model',              // 카메라 모델
        'Orientation',        // 방향
        'ImageWidth',         // 이미지 너비
        'ImageHeight'         // 이미지 높이
      ],
      translateKeys: false,
      translateValues: false,
      reviveValues: true,
      sanitize: true
    });

    if (!exifData) {
      logger.debug('EXIF 데이터 없음');
      return null;
    }

    logger.debug('📸 EXIF 데이터 추출 성공:', {
      hasDate: !!(exifData.DateTimeOriginal || exifData.CreateDate),
      hasGPS: !!(exifData.GPSLatitude && exifData.GPSLongitude),
      dateTime: exifData.DateTimeOriginal || exifData.CreateDate,
      gps: exifData.GPSLatitude && exifData.GPSLongitude 
        ? { lat: exifData.GPSLatitude, lng: exifData.GPSLongitude }
        : null
    });

    // 날짜 정보 정리
    let photoDate = null;
    if (exifData.DateTimeOriginal) {
      photoDate = new Date(exifData.DateTimeOriginal);
    } else if (exifData.CreateDate) {
      photoDate = new Date(exifData.CreateDate);
    } else if (exifData.GPSDateTime) {
      photoDate = new Date(exifData.GPSDateTime);
    } else if (exifData.ModifyDate) {
      photoDate = new Date(exifData.ModifyDate);
    }

    // GPS 좌표 정리
    let gpsCoordinates = null;
    if (exifData.GPSLatitude && exifData.GPSLongitude) {
      gpsCoordinates = {
        lat: parseFloat(exifData.GPSLatitude),
        lng: parseFloat(exifData.GPSLongitude),
        altitude: exifData.GPSAltitude ? parseFloat(exifData.GPSAltitude) : null
      };
    }

    return {
      // 날짜 정보
      photoDate: photoDate ? photoDate.toISOString() : null,
      photoTimestamp: photoDate ? photoDate.getTime() : null,
      dateTimeOriginal: exifData.DateTimeOriginal,
      createDate: exifData.CreateDate,
      
      // GPS 정보
      gpsCoordinates,
      gpsLatitude: exifData.GPSLatitude ? parseFloat(exifData.GPSLatitude) : null,
      gpsLongitude: exifData.GPSLongitude ? parseFloat(exifData.GPSLongitude) : null,
      gpsAltitude: exifData.GPSAltitude ? parseFloat(exifData.GPSAltitude) : null,
      
      // 카메라 정보
      cameraMake: exifData.Make || null,
      cameraModel: exifData.Model || null,
      
      // 이미지 정보
      imageWidth: exifData.ImageWidth || null,
      imageHeight: exifData.ImageHeight || null,
      orientation: exifData.Orientation || null,
      
      // 원본 EXIF 데이터 (필요시)
      raw: exifData
    };
  } catch (error) {
    logger.warn('EXIF 데이터 추출 실패:', error);
    return null;
  }
};

/**
 * 여러 이미지 파일에서 EXIF 데이터 일괄 추출
 * @param {File[]} files - 이미지 파일 배열
 * @returns {Promise<Array>} EXIF 데이터 배열
 */
export const extractExifDataFromFiles = async (files) => {
  if (!files || files.length === 0) {
    return [];
  }

  try {
    const results = await Promise.all(
      files.map(file => extractExifData(file))
    );
    
    return results.filter(result => result !== null);
  } catch (error) {
    logger.error('EXIF 일괄 추출 실패:', error);
    return [];
  }
};

/**
 * EXIF 날짜를 사용자 친화적인 형식으로 변환
 * @param {string|Date} date - 날짜 문자열 또는 Date 객체
 * @returns {string} 포맷된 날짜 문자열
 */
export const formatExifDate = (date) => {
  if (!date) return null;
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return null;
    
    const now = new Date();
    const diff = now.getTime() - dateObj.getTime();
    const daysDiff = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    // 오늘
    if (daysDiff === 0) {
      return '오늘';
    }
    // 어제
    if (daysDiff === 1) {
      return '어제';
    }
    // 며칠 전
    if (daysDiff < 7) {
      return `${daysDiff}일 전`;
    }
    // 몇 주 전
    if (daysDiff < 30) {
      const weeks = Math.floor(daysDiff / 7);
      return `${weeks}주 전`;
    }
    // 몇 달 전
    if (daysDiff < 365) {
      const months = Math.floor(daysDiff / 30);
      return `${months}개월 전`;
    }
    
    // 년도 표시
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    
    return `${year}.${month}.${day}`;
  } catch (error) {
    logger.warn('날짜 포맷 실패:', error);
    return null;
  }
};

/**
 * EXIF GPS 좌표를 주소로 변환 (카카오맵 API 사용)
 * @param {number} lat - 위도
 * @param {number} lng - 경도
 * @returns {Promise<string|null>} 주소 문자열
 */
export const convertGpsToAddress = async (lat, lng) => {
  if (!lat || !lng || !window.kakao || !window.kakao.maps) {
    return null;
  }

  try {
    return new Promise((resolve) => {
      const geocoder = new window.kakao.maps.services.Geocoder();
      
      geocoder.coord2Address(lng, lat, (result, status) => {
        if (status === window.kakao.maps.services.Status.OK && result[0]) {
          const address = result[0].address;
          const roadAddress = result[0].road_address;
          
          let locationName = '';
          
          if (roadAddress) {
            const parts = roadAddress.address_name.split(' ');
            locationName = parts.slice(0, 3).join(' ')
              .replace('특별시', '')
              .replace('광역시', '')
              .replace('특별자치시', '')
              .replace('특별자치도', '')
              .trim();
          } else if (address) {
            const parts = address.address_name.split(' ');
            locationName = parts.slice(0, 3).join(' ')
              .replace('특별시', '')
              .replace('광역시', '')
              .replace('특별자치시', '')
              .replace('특별자치도', '')
              .trim();
          }
          
          resolve(locationName || null);
        } else {
          resolve(null);
        }
      });
    });
  } catch (error) {
    logger.warn('GPS 주소 변환 실패:', error);
    return null;
  }
};
