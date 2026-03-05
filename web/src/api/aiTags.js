/**
 * AI 기반 해시태그 생성 API
 * 멀티모달 AI를 활용한 센스 있는 태그 생성
 */
import api from './axios';
import { logger } from '../utils/logger';

/**
 * 이미지 파일을 FormData로 변환하여 AI 태그 생성 API 호출
 * @param {File} imageFile - 이미지 파일
 * @param {string} location - 위치 정보
 * @param {Object} exifData - EXIF 데이터 (GPS, 날짜 등)
 * @returns {Promise<Object>} 태그 생성 결과
 */
export const generateAITags = async (imageFile, location = '', exifData = null) => {
  try {
    logger.log('📤 AI 태그 생성 API 호출 시작');
    logger.log('  이미지 파일:', imageFile?.name, imageFile?.size, 'bytes');
    logger.log('  위치:', location);
    logger.log('  EXIF 데이터:', exifData ? '있음' : '없음');
    
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('location', location);
    
    if (exifData) {
      formData.append('exifData', JSON.stringify(exifData));
    }

    logger.log('  API 엔드포인트:', '/upload/analyze-tags');
    const response = await api.post('/upload/analyze-tags', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000 // 30초 타임아웃
    });

    logger.log('  API 응답 받음:', {
      success: response.data?.success,
      tagsCount: response.data?.tags?.length || 0,
      method: response.data?.method,
      message: response.data?.message,
      전체응답: response.data
    });

    if (response.data && response.data.success) {
      logger.log('✅ AI 태그 생성 성공!');
      return {
        success: true,
        tags: response.data.tags || [],
        caption: response.data.caption || null,
        method: response.data.method || 'multimodal-ai'
      };
    }

    // AI 미사용 시 로컬 분석으로 자동 전환되므로 경고 1줄만 (개발 시에만 상세 로그)
    logger.debug('AI 태그 건너뜀 → 로컬 분석 사용. 이유:', response.data?.message || 'AI 응답 없음');
    return {
      success: false,
      tags: [],
      message: response.data?.message || 'AI 태그 생성 실패'
    };
  } catch (error) {
    // 백엔드 없음(ERR_NETWORK) 등 실패 시 null 반환 → 로컬 분석으로 폴백
    const isNetworkError = error.code === 'ERR_NETWORK' || error.message === 'Network Error';
    if (isNetworkError) {
      logger.warn('⚠️ AI 태그 API 사용 불가(백엔드 미연결) → 로컬 태그 사용');
    } else {
      logger.warn('❌ AI 태그 생성 실패:', error.message);
    }
    return null;
  }
};
