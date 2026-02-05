/**
 * AsyncStorage 관리 유틸리티 (Mobile)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * 모든 사진 데이터 완전 삭제 (이미지 URL, base64 등 모든 이미지 데이터 제거)
 */
export const removeAllImageData = async () => {
  try {
    const postsJson = await AsyncStorage.getItem('uploadedPosts');
    const posts = postsJson ? JSON.parse(postsJson) : [];
    let removedCount = 0;
    let totalImagesRemoved = 0;
    
    const cleanedPosts = posts.map(post => {
      const hasImages = (post.images && post.images.length > 0) || 
                       (post.videos && post.videos.length > 0) ||
                       (post.image && post.image) ||
                       (post.thumbnail && post.thumbnail);
      
      if (hasImages) {
        removedCount++;
        const imageCount = (post.images?.length || 0) + (post.videos?.length || 0);
        totalImagesRemoved += imageCount;
      }
      
      // 모든 이미지 관련 데이터 제거
      const cleaned = {
        ...post,
        images: [],
        videos: [],
        image: null,
        thumbnail: null,
        imageCount: 0,
        videoCount: 0
      };
      
      // imageFiles, videoFiles 같은 파일 참조도 제거
      delete cleaned.imageFiles;
      delete cleaned.videoFiles;
      
      return cleaned;
    });
    
    await AsyncStorage.setItem('uploadedPosts', JSON.stringify(cleanedPosts));
    console.log(`🗑️ 모든 사진 데이터 삭제 완료: ${removedCount}개 게시물에서 ${totalImagesRemoved}개의 이미지/동영상 제거`);
    return { 
      success: true, 
      postsCleaned: removedCount, 
      imagesRemoved: totalImagesRemoved 
    };
  } catch (error) {
    console.error('사진 데이터 삭제 실패:', error);
    return { success: false, error: error.message };
  }
};
