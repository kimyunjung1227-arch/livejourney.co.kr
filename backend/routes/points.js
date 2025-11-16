const express = require('express');
const router = express.Router();

// 포인트 조회
router.get('/', (req, res) => {
  res.json({
    success: true,
    points: 0,
    message: '포인트 조회 API'
  });
});

module.exports = router;

