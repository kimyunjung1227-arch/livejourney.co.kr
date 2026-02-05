/**
 * 소셜 기능 유틸리티
 * 좋아요, 댓글, 북마크 관리
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { checkNewBadges, awardBadge, calculateUserStats } from './badgeSystem';

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
    
    // 좋아요를 받았을 때 (내 게시물에 좋아요가 추가되었을 때) 뱃지 체크
    if (!isLiked && isMyPost && newLikeCount > oldLikes) {
      console.log('🎯 좋아요 받음 - 뱃지 체크 시작');
      console.log(`   게시물 ID: ${postId}`);
      console.log(`   사용자 ID: ${userId}`);
      console.log(`   이전 좋아요: ${oldLikes}, 현재 좋아요: ${newLikeCount}`);
      
      // 내 게시물들의 총 좋아요 수 계산
      const myPosts = updatedPosts.filter(p => {
        const postUserId = p.userId || 
                          (typeof p.user === 'string' ? p.user : p.user?.id) ||
                          p.user;
        return postUserId === userId;
      });
      const totalLikes = myPosts.reduce((sum, p) => sum + (p.likes || 0), 0);
      console.log(`   내 게시물 수: ${myPosts.length}개`);
      console.log(`   총 좋아요 수: ${totalLikes}개`);
      
      // 비동기로 뱃지 체크 (모달 표시는 컴포넌트에서 처리)
      setTimeout(async () => {
        try {
          // 데이터가 저장되었는지 확인
          const verifyPostsJson = await AsyncStorage.getItem('uploadedPosts');
          const verifyPosts = verifyPostsJson ? JSON.parse(verifyPostsJson) : [];
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
          const userJson = await AsyncStorage.getItem('user');
          const currentUser = userJson ? JSON.parse(userJson) : {};
          const stats = calculateUserStats(verifyMyPosts, currentUser);
          const newBadges = await checkNewBadges(stats);
          console.log(`📋 발견된 새 뱃지: ${newBadges.length}개`);

          if (newBadges.length > 0) {
            const badge = newBadges[0];
            console.log(`🎁 뱃지 획득 시도: ${badge.name}`);
            const awarded = await awardBadge(badge, { region: stats?.topRegionName });
            
            if (awarded) {
              console.log(`✅ 뱃지 획득 성공: ${badge.name}`);
              // 뱃지 획득 이벤트 발생
              const { DeviceEventEmitter } = require('react-native');
              DeviceEventEmitter.emit('badgeEarned', badge);
            } else {
              console.log(`❌ 뱃지 획득 실패: ${badge.name}`);
            }
          } else {
            console.log('📭 획득 가능한 새 뱃지 없음');
            console.log('📊 현재 통계:', stats);
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
export const addComment = async (postId, comment, username = '익명', userId = null) => {
  try {
    const postsJson = await AsyncStorage.getItem('uploadedPosts');
    const posts = postsJson ? JSON.parse(postsJson) : [];
    
    // 현재 사용자 정보 가져오기
    if (!userId) {
      const userJson = await AsyncStorage.getItem('user');
      const user = userJson ? JSON.parse(userJson) : {};
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



