const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

// 간단한 로그인/회원가입 (소셜 로그인은 추후 구현)
router.post('/login', async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({
        success: false,
        error: '사용자 이름이 필요합니다.'
      });
    }
    
    // 기존 사용자 찾기 또는 생성
    let user = await User.findOne({ username });
    
    if (!user) {
      user = new User({
        username,
        socialProvider: 'local'
      });
      await user.save();
    }
    
    // 마지막 로그인 시간 업데이트
    user.lastLogin = new Date();
    await user.save();
    
    res.json({
      success: true,
      user: user.toJSON(),
      message: user.createdAt === user.updatedAt ? '회원가입 완료!' : '로그인 성공!'
    });
  } catch (error) {
    console.error('로그인 오류:', error);
    res.status(500).json({
      success: false,
      error: '로그인 처리 중 오류가 발생했습니다.'
    });
  }
});

// 사용자 확인
router.get('/me', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: '인증이 필요합니다.'
      });
    }
    
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: '사용자를 찾을 수 없습니다.'
      });
    }
    
    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('사용자 확인 오류:', error);
    res.status(500).json({
      success: false,
      error: '사용자 정보를 가져올 수 없습니다.'
    });
  }
});

// ============================================
// 소셜 로그인 라우트
// ============================================

// 카카오 로그인
router.get('/kakao', passport.authenticate('kakao'));

router.get('/kakao/callback', 
  passport.authenticate('kakao', { 
    failureRedirect: process.env.FRONTEND_URL || 'http://localhost:3000' 
  }),
  (req, res) => {
    // 로그인 성공
    const token = generateToken(req.user._id);
    const user = encodeURIComponent(JSON.stringify(req.user.toJSON()));
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback?token=${token}&user=${user}`);
  }
);

// 네이버 로그인
router.get('/naver', passport.authenticate('naver'));

router.get('/naver/callback',
  passport.authenticate('naver', {
    failureRedirect: process.env.FRONTEND_URL || 'http://localhost:3000'
  }),
  (req, res) => {
    // 로그인 성공
    const token = generateToken(req.user._id);
    const user = encodeURIComponent(JSON.stringify(req.user.toJSON()));
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback?token=${token}&user=${user}`);
  }
);

// 구글 로그인
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
  passport.authenticate('google', {
    failureRedirect: process.env.FRONTEND_URL || 'http://localhost:3000'
  }),
  (req, res) => {
    // 로그인 성공
    const token = generateToken(req.user._id);
    const user = encodeURIComponent(JSON.stringify(req.user.toJSON()));
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback?token=${token}&user=${user}`);
  }
);

module.exports = router;





















