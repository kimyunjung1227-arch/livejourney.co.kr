/**
 * 소셜 기능 유틸리티
 * 좋아요, 댓글, 북마크 관리
 */

import { notifyLikeMilestone, notifyTotalLikesMilestone, notifyNewLike, notifyPostHelped } from './browserNotifications';
import { checkNewBadges, awardBadge, calculateUserStats } from './badgeSystem';

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
  
  // 좋아요가 증가했고, 내 게시물인 경우 알림 발송 및 뱃지 체크
  if (!isLiked && isMyPost && newLikeCount > oldLikes) {
    // 내 게시물이 도움되었습니다 알림 (앱 내부 + 브라우저 푸시)
    notifyPostHelped(postId, post.location || '여행지', newLikeCount);
    
    // 개별 게시물 좋아요 수 기준점 알림 (10, 50, 100명 등)
    notifyLikeMilestone(postId, newLikeCount, post.location || '여행지');
    
    // 내 게시물들의 총 좋아요 수 계산
    const myPosts = updatedPosts.filter(p => {
      const postUserId = p.userId || 
                        (typeof p.user === 'string' ? p.user : p.user?.id) ||
                        p.user;
      return postUserId === userId;
    });
    const previousTotal = myPosts.reduce((sum, p) => {
      if (p.id === postId) {
        return sum + oldLikes;
      }
      return sum + (p.likes || 0);
    }, 0);
    const totalLikes = myPosts.reduce((sum, p) => sum + (p.likes || 0), 0);
    
    notifyTotalLikesMilestone(totalLikes, previousTotal);
    
    // 뱃지 체크 (비동기로 처리)
    console.log('🎯 좋아요 받음 - 뱃지 체크 시작');
    console.log(`   게시물 ID: ${postId}`);
    console.log(`   사용자 ID: ${userId}`);
    console.log(`   이전 좋아요: ${oldLikes}, 현재 좋아요: ${newLikeCount}`);
    console.log(`   내 게시물 수: ${myPosts.length}개`);
    console.log(`   총 좋아요 수: ${totalLikes}개`);
    
    setTimeout(() => {
      try {
        // 데이터가 저장되었는지 확인
        const verifyPosts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');
        const verifyPost = verifyPosts.find(p => p.id === postId);
        const verifyMyPosts = verifyPosts.filter(p => {
          const postUserId = p.userId || 
                            (typeof p.user === 'string' ? p.user : p.user?.id) ||
                            p.user;
          return postUserId === userId;
        });
        const verifyTotalLikes = verifyMyPosts.reduce((sum, p) => sum + (p.likes || 0), 0);
        
        console.log('🔍 데이터 검증:');
        console.log(`   게시물 좋아요 수: ${verifyPost?.likes || 0}`);
        console.log(`   내 게시물 수: ${verifyMyPosts.length}개`);
        console.log(`   총 좋아요 수: ${verifyTotalLikes}개`);
        
        console.log('🔍 뱃지 체크 실행 중...');
        const newBadges = checkNewBadges();
        console.log(`📋 발견된 새 뱃지: ${newBadges.length}개`);
        
        if (newBadges.length > 0) {
          // 첫 좋아요 뱃지를 우선적으로 찾기
          const firstLikeBadge = newBadges.find(b => b.name === '첫 좋아요');
          const badge = firstLikeBadge || newBadges[0];
          
          console.log(`🎁 뱃지 획득 시도: ${badge.name}`);
          const awarded = awardBadge(badge);
          
          if (awarded) {
            console.log(`✅ 뱃지 획득 성공: ${badge.name}`);
            // 뱃지 획득 이벤트 발생
            window.dispatchEvent(new CustomEvent('badgeEarned', { detail: badge }));
          } else {
            console.log(`❌ 뱃지 획득 실패: ${badge.name}`);
          }
        } else {
          console.log('📭 획득 가능한 새 뱃지 없음');
          // 디버깅: 통계 다시 확인
          const stats = calculateUserStats();
          console.log('📊 현재 통계:', stats);
          console.log(`   totalLikes: ${stats.totalLikes}`);
          console.log(`   첫 좋아요 조건: ${stats.totalLikes >= 1}`);
        }
      } catch (error) {
        console.error('❌ 뱃지 체크 실패:', error);
      }
    }, 1000); // 500ms -> 1000ms로 증가하여 데이터 저장 시간 확보
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
export const addComment = (postId, comment, username = '익명', userId = null) => {
  const posts = JSON.parse(localStorage.getItem('uploadedPosts') || '[]');
  
  // 현재 사용자 정보 가져오기
  if (!userId) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    userId = user.id;
  }
  
  const updatedPosts = posts.map(post => {
    if (post.id === postId) {
      const newComment = {
        id: `comment-${Date.now()}`,
        user: username,
        userId: userId,
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


