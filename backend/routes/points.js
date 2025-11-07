const express = require('express');
const router = express.Router();
const { PointHistory, POINT_RULES } = require('../models/Point');

// 포인트 규칙 조회
router.get('/rules', (req, res) => {
  res.json({
    success: true,
    rules: POINT_RULES
  });
});

// 사용자 포인트 히스토리 조회
router.get('/history/:userId', async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    
    const result = await PointHistory.getUserHistory(
      req.params.userId,
      parseInt(limit),
      parseInt(offset)
    );
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('포인트 히스토리 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '포인트 히스토리를 조회할 수 없습니다.'
    });
  }
});

// 포인트 통계 조회
router.get('/stats/:userId', async (req, res) => {
  try {
    const stats = await PointHistory.getStatistics(req.params.userId);
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('포인트 통계 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '포인트 통계를 조회할 수 없습니다.'
    });
  }
});

module.exports = router;




















