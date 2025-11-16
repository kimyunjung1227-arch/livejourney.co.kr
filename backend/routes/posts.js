const express = require('express');
const router = express.Router();

// 게시물 목록 조회
router.get('/', (req, res) => {
  res.json({
    success: true,
    posts: [],
    message: '게시물 목록 조회 API'
  });
});

// 게시물 상세 조회
router.get('/:id', (req, res) => {
  res.json({
    success: true,
    post: null,
    message: '게시물 상세 조회 API'
  });
});

// 게시물 생성
router.post('/', (req, res) => {
  res.json({
    success: true,
    post: null,
    message: '게시물 생성 API'
  });
});

// 게시물 수정
router.put('/:id', (req, res) => {
  res.json({
    success: true,
    message: '게시물 수정 API'
  });
});

// 게시물 삭제
router.delete('/:id', (req, res) => {
  res.json({
    success: true,
    message: '게시물 삭제 API'
  });
});

module.exports = router;

