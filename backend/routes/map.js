const express = require('express');
const router = express.Router();

// 지도 데이터 조회
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: [],
    message: '지도 데이터 조회 API'
  });
});

module.exports = router;

