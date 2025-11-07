const express = require('express');
const router = express.Router();

// 개인정보 처리방침
router.get('/privacy', (req, res) => {
  res.json({
    success: true,
    policy: {
      title: '개인정보 처리방침',
      lastUpdated: '2024-01-01',
      content: 'LiveJourney 개인정보 처리방침...'
    }
  });
});

// 서비스 이용약관
router.get('/terms', (req, res) => {
  res.json({
    success: true,
    terms: {
      title: '서비스 이용약관',
      lastUpdated: '2024-01-01',
      content: 'LiveJourney 서비스 이용약관...'
    }
  });
});

module.exports = router;




















