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
    // 백엔드 실패 시 로컬 처리 (Base64)
    console.log('⚠️ 백엔드 없음 - 로컬에서 이미지 처리');
    try {
      const base64 = await fileToBase64(file);
      return {
        success: true,
        url: base64, // Base64 이미지 URL
        analysis: {
          category: 'general',
          categoryName: '일반',
          labels: []
        }
      };
    } catch (base64Error) {
      console.error('이미지 변환 실패:', base64Error);
      throw base64Error;
    }
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















