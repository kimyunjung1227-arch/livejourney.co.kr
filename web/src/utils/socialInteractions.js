/**
 * 소셜 기능 유틸리티
 * 좋아요, 댓글, 북마크 관리
 */

import { notifyLikeMilestone, notifyTotalLikesMilestone, notifyNewLike } from './browserNotifications';

// 좋아요 토글
export const toggleLike = (postId) => {
  const likes = JSON.parse(localStorage.getItem('likedPosts') || '{}');
  const isLiked = likes[postId] || false;
  
  // 현재 사용자 정보
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = currentUser.id;
  
  // 게시물 정보 가져오기
  const posts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');
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
  localStorage.setItem('likedPosts', JSON.stringify(likes));
  
  // 게시물의 좋아요 수 업데이트
  const updatedPosts = posts.map(p => {
    if (p.id === postId) {
      const newLikes = (p.likes || 0) + (isLiked ? -1 : 1);
      return { ...p, likes: Math.max(0, newLikes) };
    }
    return p;
  });
  
  localStorage.setItem('uploadedPosts', JSON.stringify(updatedPosts));
  
  const updatedPost = updatedPosts.find(p => p.id === postId);
  const newLikeCount = updatedPost?.likes || 0;
  
  // 좋아요가 증가했고, 내 게시물인 경우 브라우저 푸시 알림 발송
  if (!isLiked && isMyPost && newLikeCount > oldLikes) {
    // 개별 게시물 좋아요 수 기준점 알림
    notifyLikeMilestone(postId, newLikeCount, post.location || '여행지');
    
    // 새로운 좋아요 알림 (앱 외부에서)
    notifyNewLike(postId, post.location || '여행지', newLikeCount);
    
    // 총 좋아요 수 계산 및 기준점 알림
    const myPosts = updatedPosts.filter(p => p.userId === userId);
    const previousTotal = myPosts.reduce((sum, p) => {
      if (p.id === postId) {
        return sum + oldLikes;
      }
      return sum + (p.likes || 0);
    }, 0);
    const totalLikes = myPosts.reduce((sum, p) => sum + (p.likes || 0), 0);
    
    notifyTotalLikesMilestone(totalLikes, previousTotal);
  }
  
  return {
    isLiked: !isLiked,
    newCount: newLikeCount
  };
};

// 좋아요 여부 확인
export const isPostLiked = (postId) => {
  const likes = JSON.parse(localStorage.getItem('likedPosts') || '{}');
  return likes[postId] || false;
};

// 댓글 추가
export const addComment = (postId, comment, username = '익명') => {
  const posts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');
  
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
  
  localStorage.setItem('uploadedPosts', JSON.stringify(updatedPosts));
  
  const post = updatedPosts.find(p => p.id === postId);
  return post?.comments || [];
};

// 북마크 토글
export const toggleBookmark = (post) => {
  const bookmarks = JSON.parse(localStorage.getItem('bookmarkedPosts') || '[]');
  const isBookmarked = bookmarks.some(b => b.id === post.id);
  
  let updatedBookmarks;
  if (isBookmarked) {
    updatedBookmarks = bookmarks.filter(b => b.id !== post.id);
  } else {
    updatedBookmarks = [...bookmarks, post];
  }
  
  localStorage.setItem('bookmarkedPosts', JSON.stringify(updatedBookmarks));
  
  return {
    isBookmarked: !isBookmarked,
    totalBookmarks: updatedBookmarks.length
  };
};

// 북마크 여부 확인
export const isPostBookmarked = (postId) => {
  const bookmarks = JSON.parse(localStorage.getItem('bookmarkedPosts') || '[]');
  return bookmarks.some(b => b.id === postId);
};

// 북마크 목록 가져오기
export const getBookmarkedPosts = () => {
  return JSON.parse(localStorage.getItem('bookmarkedPosts') || '[]');
};


