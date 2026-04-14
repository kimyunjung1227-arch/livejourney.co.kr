import api from './axios';

// 이미지를 Base64로 변환
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
};

// 단일 이미지 업로드
export const uploadImage = async (file) => {
  try {
    // 먼저 백엔드 시도
    const formData = new FormData();
    formData.append('image', file);

    const response = await api.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    // 백엔드 실패 시 임시 URL 반환 (Base64는 용량이 너무 커서 사용 안 함)
    console.log('⚠️ 백엔드 없음 - 임시 URL 반환');
    console.warn('💡 이미지가 서버에 업로드되지 않았습니다. 백엔드 서버를 확인해주세요.');
    
    // Blob URL 생성 (메모리에만 존재, localStorage에 저장되지 않음)
    const blobUrl = URL.createObjectURL(file);
    
    return {
      success: true,
      url: blobUrl, // Blob URL (임시)
      isTemporary: true, // 임시 URL임을 표시
      analysis: {
        category: 'general',
        categoryName: '일반',
        labels: []
      }
    };
  }
};

// 다중 이미지 업로드
export const uploadImages = async (files) => {
  try {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });

    const response = await api.post('/upload/images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('이미지 업로드 실패:', error);
    throw error;
  }
};

// 프로필 이미지 업로드
export const uploadProfileImage = async (file) => {
  try {
    const formData = new FormData();
    formData.append('profile', file);

    const response = await api.post('/upload/profile', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('프로필 이미지 업로드 실패:', error);
    throw error;
  }
};

// 업로드된 이미지/동영상 경로를 브라우저에서 표시 가능한 URL로 정규화
// - 기존 코드에서 이 유틸을 기대하고 있어, 최소 동작을 보장합니다.
export const getDisplayImageUrl = (raw) => {
  if (!raw) return '';
  const s = String(raw);
  if (/^(https?:)?\/\//i.test(s)) return s;
  if (/^(data:|blob:)/i.test(s)) return s;
  // 상대경로는 그대로 반환 (서빙 환경에 따라 base가 붙음)
  return s;
};















