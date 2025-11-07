const express = require('express');
const router = express.Router();
const Post = require('../models/Post');

// 모든 지역 목록 조회
router.get('/', async (req, res) => {
  try {
    const locations = await Post.distinct('location', {
      isPublic: true,
      isBlocked: false
    });
    
    res.json({
      success: true,
      locations: locations.sort()
    });
  } catch (error) {
    console.error('지역 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '지역 목록을 조회할 수 없습니다.'
    });
  }
});

// 지역별 통계
router.get('/stats', async (req, res) => {
  try {
    const stats = await Post.aggregate([
      {
        $match: { isPublic: true, isBlocked: false }
      },
      {
        $group: {
          _id: '$location',
          postCount: { $sum: 1 },
          totalLikes: { $sum: '$likes' },
          totalViews: { $sum: '$views' }
        }
      },
      {
        $sort: { postCount: -1 }
      }
    ]);
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('지역 통계 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '지역 통계를 조회할 수 없습니다.'
    });
  }
});

module.exports = router;




















