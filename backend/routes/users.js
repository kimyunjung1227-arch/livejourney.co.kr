const express = require('express');
const router = express.Router();

// 사용자 목록 조회
router.get('/', (req, res) => {
  res.json({
    success: true,
    users: [],
    message: '사용자 목록 조회 API'
  });
});

// 사용자 상세 조회
router.get('/:id', (req, res) => {
  res.json({
    success: true,
    user: null,
    message: '사용자 상세 조회 API'
  });
});

// 사용자 정보 수정
router.put('/:id', (req, res) => {
  res.json({
    success: true,
    message: '사용자 정보 수정 API'
  });
});

// 사용자 삭제
router.delete('/:id', (req, res) => {
  res.json({
    success: true,
    message: '사용자 삭제 API'
  });
});

module.exports = router;

