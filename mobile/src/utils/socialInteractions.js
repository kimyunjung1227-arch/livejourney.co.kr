/**
 * 소셜 기능 유틸리티
 * 좋아요, 댓글, 북마크 관리
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// 좋아요 토글
export const toggleLike = async (postId) => {
  try {
    const likesJson = await AsyncStorage.getItem('likedPosts');
    const likes = likesJson ? JSON.parse(likesJson) : {};
    const isLiked = likes[postId] || false;
    
    // 현재 사용자 정보
    const userJson = await AsyncStorage.getItem('user');
    const currentUser = userJson ? JSON.parse(userJson) : {};
    const userId = currentUser.id;
    
    // 게시물 정보 가져오기
    const postsJson = await AsyncStorage.getItem('uploadedPosts');
    const posts = postsJson ? JSON.parse(postsJson) : [];
    const post = posts.find(p => p.id === postId);
    
    if (!post) {
      return {
        isLiked: !isLiked,
        newCount: 0
      };
    }
    
    const oldLikes = post.likes || 0;
    const isMyPost = post.userId === userId;
    
    likes[postId] = !isLiked;
    await AsyncStorage.setItem('likedPosts', JSON.stringify(likes));
    
    // 게시물의 좋아요 수 업데이트
    const updatedPosts = posts.map(p => {
      if (p.id === postId) {
        const newLikes = (p.likes || 0) + (isLiked ? -1 : 1);
        return { ...p, likes: Math.max(0, newLikes) };
      }
      return p;
    });
    
    await AsyncStorage.setItem('uploadedPosts', JSON.stringify(updatedPosts));
    
    const updatedPost = updatedPosts.find(p => p.id === postId);
    const newLikeCount = updatedPost?.likes || 0;
    
    return {
      isLiked: !isLiked,
      newCount: newLikeCount
    };
  } catch (error) {
    console.error('좋아요 토글 실패:', error);
    return {
      isLiked: false,
      newCount: 0
    };
  }
};

// 좋아요 여부 확인
export const isPostLiked = async (postId) => {
  try {
    const likesJson = await AsyncStorage.getItem('likedPosts');
    const likes = likesJson ? JSON.parse(likesJson) : {};
    return likes[postId] || false;
  } catch (error) {
    console.error('좋아요 확인 실패:', error);
    return false;
  }
};

// 댓글 추가
export const addComment = async (postId, comment, username = '익명') => {
  try {
    const postsJson = await AsyncStorage.getItem('uploadedPosts');
    const posts = postsJson ? JSON.parse(postsJson) : [];
    
    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        const newComment = {
          id: `comment-${Date.now()}`,
          user: username,
          content: comment,
          timestamp: new Date().toISOString(),
          avatar: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`
        };
        
        return {
          ...post,
          comments: [...(post.comments || []), newComment]
        };
      }
      return post;
    });
    
    await AsyncStorage.setItem('uploadedPosts', JSON.stringify(updatedPosts));
    
    return {
      success: true,
      comment: updatedPosts.find(p => p.id === postId)?.comments?.slice(-1)[0]
    };
  } catch (error) {
    console.error('댓글 추가 실패:', error);
    return {
      success: false,
      error: error.message
    };
  }
};



