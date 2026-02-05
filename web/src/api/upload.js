import api from './axios';
import { logger } from '../utils/logger';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const UPLOAD_ORIGIN = API_BASE.replace(/\/api\/?$/, '');

/**
 * 표시용 이미지/동영상 URL로 변환
 * - 상대 경로(/uploads/...) → 서버 풀 URL
 * - http/https/blob 은 그대로 반환
 * - url 이 객체면 url.url 또는 url.src 등 문자열로 추출 후 변환
 */
export const getDisplayImageUrl = (url) => {
  if (url == null) return '';
  const raw = typeof url === 'string' ? url : (url.url || url.src || url.href || '');
  if (!raw || typeof raw !== 'string') return '';
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('blob:')) {
    return trimmed;
  }
  if (trimmed.startsWith('/')) {
    return `${UPLOAD_ORIGIN}${trimmed}`;
  }
  return trimmed;
};

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
    logger.log('⚠️ 백엔드 없음 - 임시 URL 반환');
    logger.warn('💡 이미지가 서버에 업로드되지 않았습니다. 백엔드 서버를 확인해주세요.');
    
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
    logger.error('이미지 업로드 실패:', error);
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

// 단일 동영상 업로드 (최대 100MB)
export const uploadVideo = async (file) => {
  try {
    const formData = new FormData();
    formData.append('video', file);

    const response = await api.post('/upload/video', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    const data = response.data;
    return { success: true, url: data.url || data.videoUrl, ...data };
  } catch (error) {
    logger.log('⚠️ 동영상 백엔드 없음 - Blob URL 반환');
    const blobUrl = URL.createObjectURL(file);
    return { success: true, url: blobUrl, isTemporary: true };
  }
};















