/**
 * AI 기반 해시태그 생성 API
 * 멀티모달 AI를 활용한 센스 있는 태그 생성
 */
import api from './axios';

/**
 * 이미지 파일을 FormData로 변환하여 AI 태그 생성 API 호출
 * @param {File} imageFile - 이미지 파일
 * @param {string} location - 위치 정보
 * @param {Object} exifData - EXIF 데이터 (GPS, 날짜 등)
 * @returns {Promise<Object>} 태그 생성 결과
 */
export const generateAITags = async (imageFile, location = '', exifData = null) => {
  try {
    console.log('📤 AI 태그 생성 API 호출 시작');
    console.log('  이미지 파일:', imageFile?.name, imageFile?.size, 'bytes');
    console.log('  위치:', location);
    console.log('  EXIF 데이터:', exifData ? '있음' : '없음');
    
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('location', location);
    
    if (exifData) {
      formData.append('exifData', JSON.stringify(exifData));
    }

    console.log('  API 엔드포인트:', '/upload/analyze-tags');
    const response = await api.post('/upload/analyze-tags', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000 // 30초 타임아웃
    });

    console.log('  API 응답 받음:', {
      success: response.data?.success,
      tagsCount: response.data?.tags?.length || 0,
      method: response.data?.method,
      message: response.data?.message,
      전체응답: response.data
    });

    if (response.data && response.data.success) {
      console.log('✅ AI 태그 생성 성공!');
      return {
        success: true,
        tags: response.data.tags || [],
        caption: response.data.caption || null,
        method: response.data.method || 'multimodal-ai'
      };
    }

    console.warn('⚠️ AI 태그 생성 실패 (success: false)');
    console.warn('  실패 이유:', response.data?.message);
    console.warn('  전체 응답:', response.data);
    return {
      success: false,
      tags: [],
      message: response.data?.message || 'AI 태그 생성 실패'
    };
  } catch (error) {
    // API 호출 실패 시 null 반환 (기존 방식으로 폴백)
    console.error('❌ AI 태그 생성 API 호출 실패:');
    console.error('  에러 메시지:', error.message);
    console.error('  응답 데이터:', error.response?.data);
    console.error('  상태 코드:', error.response?.status);
    console.error('  요청 URL:', error.config?.url);
    console.error('  전체 에러:', error);
    return null;
  }
};
