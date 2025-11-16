const express = require('express');
const router = express.Router();

// 보상 목록 조회
router.get('/', (req, res) => {
  res.json({
    success: true,
    rewards: [],
    message: '보상 목록 조회 API'
  });
});

module.exports = router;

