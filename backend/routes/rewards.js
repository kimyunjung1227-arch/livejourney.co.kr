const express = require('express');
const router = express.Router();
const { Reward, BADGES } = require('../models/Reward');

// 모든 뱃지 정보 조회
router.get('/badges', (req, res) => {
  res.json({
    success: true,
    badges: BADGES
  });
});

// 사용자의 획득한 뱃지 조회
router.get('/user/:userId', async (req, res) => {
  try {
    const badges = await Reward.getUserBadges(req.params.userId);
    
    res.json({
      success: true,
      badges
    });
  } catch (error) {
    console.error('뱃지 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '뱃지를 조회할 수 없습니다.'
    });
  }
});

// 뱃지 확인 및 지급 (수동 트리거)
router.post('/check/:userId', async (req, res) => {
  try {
    const newBadges = await Reward.checkAndAwardBadges(req.params.userId);
    
    res.json({
      success: true,
      newBadges,
      message: newBadges.length > 0
        ? `${newBadges.length}개의 새로운 뱃지를 획득했습니다!`
        : '새로운 뱃지가 없습니다.'
    });
  } catch (error) {
    console.error('뱃지 확인 오류:', error);
    res.status(500).json({
      success: false,
      error: '뱃지 확인 중 오류가 발생했습니다.'
    });
  }
});

module.exports = router;




















