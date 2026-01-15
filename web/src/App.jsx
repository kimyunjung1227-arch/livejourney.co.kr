import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import MockDataLoader from './components/MockDataLoader'
import { initStatusBar } from './utils/statusBar'

// Pages
import WelcomeScreen from './pages/WelcomeScreen'
import StartScreen from './pages/StartScreen'
import AuthCallbackScreen from './pages/AuthCallbackScreen'
import MainScreen from './pages/MainScreen'
import MagazineDetailScreen from './pages/MagazineDetailScreen'
import SearchScreen from './pages/SearchScreen'
import DetailScreen from './pages/DetailScreen'
import PostDetailScreen from './pages/PostDetailScreen'
import RegionDetailScreen from './pages/RegionDetailScreen'
import UploadScreen from './pages/UploadScreen'
import MapScreen from './pages/MapScreen'
import MapPhotoGridScreen from './pages/MapPhotoGridScreen'
import ProfileScreen from './pages/ProfileScreen'
import UserProfileScreen from './pages/UserProfileScreen'
import EditProfileScreen from './pages/EditProfileScreen'
import PersonalInfoEditScreen from './pages/PersonalInfoEditScreen'
import PasswordChangeScreen from './pages/PasswordChangeScreen'
import AccountConnectionScreen from './pages/AccountConnectionScreen'
import AccountDeleteScreen from './pages/AccountDeleteScreen'
import AccountDeleteConfirmScreen from './pages/AccountDeleteConfirmScreen'
import BadgeListScreen from './pages/BadgeListScreen'
import BadgeAchievementScreen from './pages/BadgeAchievementScreen'
import MyCouponsScreen from './pages/MyCouponsScreen'
import SettingsScreen from './pages/SettingsScreen'
import FeedUpdateFrequencyScreen from './pages/FeedUpdateFrequencyScreen'
import NoticesScreen from './pages/NoticesScreen'
import FAQScreen from './pages/FAQScreen'
import InquiryScreen from './pages/InquiryScreen'
import TermsAndPoliciesScreen from './pages/TermsAndPoliciesScreen'
import TermsOfServiceScreen from './pages/TermsOfServiceScreen'
import NotificationsScreen from './pages/NotificationsScreen'
import InterestPlacesScreen from './pages/InterestPlacesScreen'
import RealtimeFeedScreen from './pages/RealtimeFeedScreen'

function App() {
  // StatusBar 초기화 (앱 시작 시 한 번만)
  useEffect(() => {
    initStatusBar();
  }, []);

  // 개발 환경에서는 basename 없이, 프로덕션에서는 BASE_URL 사용
  const basename = import.meta.env.PROD ? import.meta.env.BASE_URL : undefined;
  
  return (
    <AuthProvider>
      <Router basename={basename}>
        <div className="app-container">
          <MockDataLoader />
          <div className="page-wrapper">
            <Routes>
              <Route path="/" element={<WelcomeScreen />} />
              <Route path="/start" element={<StartScreen />} />
              <Route path="/auth/callback" element={<AuthCallbackScreen />} />
              {/* 로그인 없이도 접근 가능한 페이지 */}
              <Route path="/main" element={<MainScreen />} />
              <Route path="/magazine/:id" element={<MagazineDetailScreen />} />
              <Route path="/realtime-feed" element={<RealtimeFeedScreen />} />
              <Route path="/search" element={<SearchScreen />} />
              <Route path="/detail" element={<DetailScreen />} />
              <Route path="/post/:id" element={<PostDetailScreen />} />
              <Route path="/region/:regionName" element={<RegionDetailScreen />} />
              <Route path="/upload" element={<UploadScreen />} />
              <Route path="/map" element={<MapScreen />} />
              <Route path="/map/photos" element={<MapPhotoGridScreen />} />
              <Route path="/profile" element={<ProfileScreen />} />
              <Route path="/user/:userId" element={<UserProfileScreen />} />
              <Route path="/badges" element={<BadgeListScreen />} />
              <Route path="/badge-achievement/:badgeId" element={<BadgeAchievementScreen />} />
              <Route path="/badge/achievement" element={<BadgeAchievementScreen />} />
              <Route path="/coupons" element={<MyCouponsScreen />} />
              <Route path="/notifications" element={<NotificationsScreen />} />
              <Route path="/interest-places" element={<InterestPlacesScreen />} />
              <Route path="/notices" element={<NoticesScreen />} />
              <Route path="/faq" element={<FAQScreen />} />
              <Route path="/inquiry" element={<InquiryScreen />} />
              <Route path="/terms-and-policies" element={<TermsAndPoliciesScreen />} />
              <Route path="/terms-of-service" element={<TermsOfServiceScreen />} />
              {/* 로그인 필수 페이지 */}
              <Route path="/profile/edit" element={<ProtectedRoute><EditProfileScreen /></ProtectedRoute>} />
              <Route path="/personal-info-edit" element={<ProtectedRoute><PersonalInfoEditScreen /></ProtectedRoute>} />
              <Route path="/password-change" element={<ProtectedRoute><PasswordChangeScreen /></ProtectedRoute>} />
              <Route path="/account-connection" element={<ProtectedRoute><AccountConnectionScreen /></ProtectedRoute>} />
              <Route path="/account-delete" element={<ProtectedRoute><AccountDeleteScreen /></ProtectedRoute>} />
              <Route path="/account-delete/confirm" element={<ProtectedRoute><AccountDeleteConfirmScreen /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><SettingsScreen /></ProtectedRoute>} />
              <Route path="/feed-update-frequency" element={<ProtectedRoute><FeedUpdateFrequencyScreen /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App




























