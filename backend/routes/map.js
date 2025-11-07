const express = require('express');
const router = express.Router();
const Post = require('../models/Post');

// 지도 영역 내의 게시물 조회
router.get('/posts', async (req, res) => {
  try {
    const { region, category } = req.query;
    
    const filter = { isPublic: true, isBlocked: false };
    
    if (region && region !== '전체') {
      filter.location = region;
    }
    
    if (category && category !== 'all') {
      filter.category = category;
    }
    
    const posts = await Post.find(filter)
      .select('_id images location detailedLocation placeName coordinates likes user createdAt')
      .populate('user', 'username')
      .sort('-createdAt')
      .limit(500); // 지도용이므로 제한
    
    res.json({
      success: true,
      posts
    });
  } catch (error) {
    console.error('지도 게시물 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '게시물을 조회할 수 없습니다.'
    });
  }
});

module.exports = router;




















