const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const { PointHistory } = require('../models/Point');
const { Reward } = require('../models/Reward');

// ============================================
// 게시물 목록 조회
// ============================================
router.get('/', async (req, res) => {
  try {
    const {
      region,
      category,
      user,
      limit = 50,
      offset = 0,
      sort = '-createdAt'
    } = req.query;
    
    // 필터 구성
    const filter = { isPublic: true, isBlocked: false };
    
    if (region && region !== '전체') {
      filter.location = region;
    }
    
    if (category && category !== 'all') {
      filter.category = category;
    }
    
    if (user) {
      filter.user = user;
    }
    
    // 쿼리 실행
    const posts = await Post.find(filter)
      .sort(sort)
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .populate('user', 'username profileImage points level')
      .lean();
    
    const total = await Post.countDocuments(filter);
    
    res.json({
      success: true,
      posts,
      total,
      hasMore: parseInt(offset) + parseInt(limit) < total
    });
  } catch (error) {
    console.error('게시물 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '게시물을 조회할 수 없습니다.'
    });
  }
});

// ============================================
// 게시물 생성
// ============================================
router.post('/', async (req, res) => {
  try {
    const {
      userId,
      imageUrl,
      images,
      location,
      detailedLocation,
      placeName,
      category,
      tags,
      note,
      description,
      coordinates
    } = req.body;
    
    // 필수 필드 검증
    if (!userId || (!imageUrl && !images) || !location) {
      return res.status(400).json({
        success: false,
        error: '필수 필드가 누락되었습니다. (userId, imageUrl/images, location)'
      });
    }
    
    // 이미지 배열 처리 (단일 이미지도 배열로 변환)
    const imageArray = images ? images : (imageUrl ? [imageUrl] : []);
    
    // 새 게시물 생성
    const newPost = new Post({
      user: userId,
      images: imageArray,
      location,
      detailedLocation: detailedLocation || '',
      placeName: placeName || '',
      category: category || 'general',
      tags: tags || [],
      note: note || description || '',
      coordinates: coordinates || null,
      isPublic: true,
      isBlocked: false,
      likes: 0,
      likedBy: [],
      comments: [],
      views: 0
    });
    
    await newPost.save();
    
    // 포인트 지급 (게시물 작성)
    try {
      await PointHistory.awardPoints(userId, '게시물 작성', {
        postId: newPost._id
      });
    } catch (pointError) {
      console.warn('포인트 지급 실패:', pointError);
      // 포인트 지급 실패해도 게시물 생성은 성공으로 처리
    }
    
    res.status(201).json({
      success: true,
      post: newPost,
      message: '게시물이 성공적으로 생성되었습니다.'
    });
  } catch (error) {
    console.error('게시물 생성 오류:', error);
    res.status(500).json({
      success: false,
      error: '게시물 생성 중 오류가 발생했습니다.'
    });
  }
});

// ============================================
// 특정 게시물 조회
// ============================================
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('user', 'username profileImage points level badges')
      .populate('comments.user', 'username profileImage');
    
    if (!post || !post.isPublic) {
      return res.status(404).json({
        success: false,
        error: '게시물을 찾을 수 없습니다.'
      });
    }
    
    // 조회수 증가
    await post.incrementViews();
    
    res.json({
      success: true,
      post
    });
  } catch (error) {
    console.error('게시물 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '게시물을 조회할 수 없습니다.'
    });
  }
});

// ============================================
// 게시물 좋아요
// ============================================
router.post('/:id/like', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: '사용자 ID가 필요합니다.'
      });
    }
    
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        error: '게시물을 찾을 수 없습니다.'
      });
    }
    
    const liked = await post.addLike(userId);
    
    if (liked) {
      // 포인트 지급 (게시물 작성자에게)
      await PointHistory.awardPoints(post.user, '게시물 좋아요 받음', {
        postId: post._id
      });
    }
    
    res.json({
      success: true,
      likes: post.likes,
      liked
    });
  } catch (error) {
    console.error('좋아요 처리 오류:', error);
    res.status(500).json({
      success: false,
      error: '좋아요 처리 중 오류가 발생했습니다.'
    });
  }
});

// ============================================
// 게시물 좋아요 취소
// ============================================
router.delete('/:id/like', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: '사용자 ID가 필요합니다.'
      });
    }
    
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        error: '게시물을 찾을 수 없습니다.'
      });
    }
    
    const unliked = await post.removeLike(userId);
    
    res.json({
      success: true,
      likes: post.likes,
      unliked
    });
  } catch (error) {
    console.error('좋아요 취소 오류:', error);
    res.status(500).json({
      success: false,
      error: '좋아요 취소 중 오류가 발생했습니다.'
    });
  }
});

// ============================================
// 댓글 추가
// ============================================
router.post('/:id/comments', async (req, res) => {
  try {
    const { userId, text } = req.body;
    
    if (!userId || !text) {
      return res.status(400).json({
        success: false,
        error: '사용자 ID와 댓글 내용이 필요합니다.'
      });
    }
    
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        error: '게시물을 찾을 수 없습니다.'
      });
    }
    
    const comment = await post.addComment(userId, text);
    
    // 포인트 지급 (댓글 작성자에게)
    await PointHistory.awardPoints(userId, '댓글 작성', {
      postId: post._id
    });
    
    res.json({
      success: true,
      comment
    });
  } catch (error) {
    console.error('댓글 추가 오류:', error);
    res.status(500).json({
      success: false,
      error: '댓글 추가 중 오류가 발생했습니다.'
    });
  }
});

// ============================================
// 게시물 삭제
// ============================================
router.delete('/:id', async (req, res) => {
  try {
    const { userId } = req.body;
    
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        error: '게시물을 찾을 수 없습니다.'
      });
    }
    
    // 권한 확인
    if (post.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: '게시물을 삭제할 권한이 없습니다.'
      });
    }
    
    await post.remove();
    
    res.json({
      success: true,
      message: '게시물이 삭제되었습니다.'
    });
  } catch (error) {
    console.error('게시물 삭제 오류:', error);
    res.status(500).json({
      success: false,
      error: '게시물 삭제 중 오류가 발생했습니다.'
    });
  }
});

module.exports = router;




















