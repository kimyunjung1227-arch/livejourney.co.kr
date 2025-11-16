const express = require('express');
const router = express.Router();

// 위치 목록 조회
router.get('/', (req, res) => {
  res.json({
    success: true,
    locations: [],
    message: '위치 목록 조회 API'
  });
});

module.exports = router;

