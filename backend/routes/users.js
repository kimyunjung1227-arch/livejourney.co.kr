const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Post = require('../models/Post');

// 사용자 정보 조회
router.get('/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: '사용자를 찾을 수 없습니다.'
      });
    }
    
    // 사용자의 게시물 수 조회
    const postCount = await Post.countDocuments({ user: user._id, isPublic: true });
    
    res.json({
      success: true,
      user: {
        ...user.toObject(),
        postCount
      }
    });
  } catch (error) {
    console.error('사용자 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '사용자 정보를 조회할 수 없습니다.'
    });
  }
});

// 사용자 프로필 업데이트
router.put('/:userId', async (req, res) => {
  try {
    const { username, bio, profileImage } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      {
        $set: {
          ...(username && { username }),
          ...(bio !== undefined && { bio }),
          ...(profileImage !== undefined && { profileImage })
        }
      },
      { new: true, select: '-password' }
    );
    
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
    console.error('프로필 업데이트 오류:', error);
    res.status(500).json({
      success: false,
      error: '프로필 업데이트에 실패했습니다.'
    });
  }
});

module.exports = router;




















