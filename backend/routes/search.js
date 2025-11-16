const express = require('express');
const router = express.Router();

// 검색
router.get('/', (req, res) => {
  res.json({
    success: true,
    results: [],
    message: '검색 API'
  });
});

module.exports = router;

