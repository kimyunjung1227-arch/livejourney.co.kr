const passport = require('passport');
const KakaoStrategy = require('passport-kakao').Strategy;
const NaverStrategy = require('passport-naver-v2').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

// 세션에 사용자 ID 저장
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// 세션에서 사용자 정보 가져오기
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// ============================================
// 카카오 로그인 전략
// ============================================
if (process.env.KAKAO_CLIENT_ID && process.env.KAKAO_CLIENT_SECRET) {
  passport.use(
    new KakaoStrategy(
      {
        clientID: process.env.KAKAO_CLIENT_ID,
        clientSecret: process.env.KAKAO_CLIENT_SECRET,
        callbackURL: process.env.KAKAO_CALLBACK_URL || 'http://localhost:5000/api/auth/kakao/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // 기존 사용자 찾기
          let user = await User.findOne({
            socialId: profile.id,
            socialProvider: 'kakao'
          });

          if (!user) {
            // 새 사용자 생성
            user = new User({
              socialId: profile.id,
              socialProvider: 'kakao',
              username: profile.username || profile.displayName || `kakao_${profile.id}`,
              email: profile._json?.kakao_account?.email,
              profileImage: profile._json?.properties?.profile_image,
            });
            await user.save();
          } else {
            // 마지막 로그인 시간 업데이트
            user.lastLogin = new Date();
            await user.save();
          }

          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
}

// ============================================
// 네이버 로그인 전략
// ============================================
if (process.env.NAVER_CLIENT_ID && process.env.NAVER_CLIENT_SECRET) {
  passport.use(
    new NaverStrategy(
      {
        clientID: process.env.NAVER_CLIENT_ID,
        clientSecret: process.env.NAVER_CLIENT_SECRET,
        callbackURL: process.env.NAVER_CALLBACK_URL || 'http://localhost:5000/api/auth/naver/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // 기존 사용자 찾기
          let user = await User.findOne({
            socialId: profile.id,
            socialProvider: 'naver'
          });

          if (!user) {
            // 새 사용자 생성
            user = new User({
              socialId: profile.id,
              socialProvider: 'naver',
              username: profile.name || profile.nickname || `naver_${profile.id}`,
              email: profile.email,
              profileImage: profile.profile_image,
            });
            await user.save();
          } else {
            // 마지막 로그인 시간 업데이트
            user.lastLogin = new Date();
            await user.save();
          }

          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
}

// ============================================
// 구글 로그인 전략
// ============================================
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // 기존 사용자 찾기
          let user = await User.findOne({
            socialId: profile.id,
            socialProvider: 'google'
          });

          if (!user) {
            // 새 사용자 생성
            user = new User({
              socialId: profile.id,
              socialProvider: 'google',
              username: profile.displayName || `google_${profile.id}`,
              email: profile.emails?.[0]?.value,
              profileImage: profile.photos?.[0]?.value,
            });
            await user.save();
          } else {
            // 마지막 로그인 시간 업데이트
            user.lastLogin = new Date();
            await user.save();
          }

          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
}

module.exports = passport;

