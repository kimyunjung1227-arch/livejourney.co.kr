const express = require('express');
const router = express.Router();
const Post = require('../models/Post');

// 통합 검색
router.get('/', async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        error: '검색어를 입력해주세요.'
      });
    }
    
    const results = await Post.find({
      $or: [
        { location: { $regex: q, $options: 'i' } },
        { detailedLocation: { $regex: q, $options: 'i' } },
        { placeName: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } },
        { note: { $regex: q, $options: 'i' } }
      ],
      isPublic: true,
      isBlocked: false
    })
      .limit(parseInt(limit))
      .populate('user', 'username profileImage')
      .sort('-createdAt');
    
    res.json({
      success: true,
      results,
      count: results.length
    });
  } catch (error) {
    console.error('검색 오류:', error);
    res.status(500).json({
      success: false,
      error: '검색 중 오류가 발생했습니다.'
    });
  }
});

module.exports = router;




















