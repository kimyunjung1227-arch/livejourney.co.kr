import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import { initStatusBar } from './utils/statusBar'

// Pages
import WelcomeScreen from './pages/WelcomeScreen'
import StartScreen from './pages/StartScreen'
import OnboardingScreen from './pages/OnboardingScreen'
import AuthCallbackScreen from './pages/AuthCallbackScreen'
import MainScreen from './pages/MainScreen'
import MagazineDetailScreen from './pages/MagazineDetailScreen'
import SearchScreen from './pages/SearchScreen'
import HashtagScreen from './pages/HashtagScreen'
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
import PrivacyPolicyScreen from './pages/PrivacyPolicyScreen'
import TermsAndPoliciesScreen from './pages/TermsAndPoliciesScreen'
import LocationTermsScreen from './pages/LocationTermsScreen'
import YouthPolicyScreen from './pages/YouthPolicyScreen'
import MarketingConsentScreen from './pages/MarketingConsentScreen'
import OpenSourceLicensesScreen from './pages/OpenSourceLicensesScreen'
import BusinessInfoScreen from './pages/BusinessInfoScreen'
import TermsOfServiceScreen from './pages/TermsOfServiceScreen'
import NotificationsScreen from './pages/NotificationsScreen'
import InterestPlacesScreen from './pages/InterestPlacesScreen'
import RealtimeFeedScreen from './pages/RealtimeFeedScreen'
import CrowdedPlaceScreen from './pages/CrowdedPlaceScreen'
import RecommendedPlaceScreen from './pages/RecommendedPlaceScreen'
import ChatScreen from './pages/ChatScreen'
import ChatWriteScreen from './pages/ChatWriteScreen'

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
          <div className="page-wrapper">
            <Routes>
              {/* 1. 스플래시 → 2. 온보딩 → 3. 로그인(StartScreen) */}
              <Route path="/" element={<WelcomeScreen />} />
              <Route path="/onboarding" element={<OnboardingScreen />} />
              <Route path="/start" element={<StartScreen />} />
              <Route path="/auth/callback" element={<AuthCallbackScreen />} />
              {/* 로그인 없이도 접근 가능한 페이지 */}
              <Route path="/main" element={<MainScreen />} />
              <Route path="/magazine/:id" element={<MagazineDetailScreen />} />
              <Route path="/realtime-feed" element={<RealtimeFeedScreen />} />
              <Route path="/crowded-place" element={<CrowdedPlaceScreen />} />
              <Route path="/recommended-place" element={<RecommendedPlaceScreen />} />
              <Route path="/chat" element={<ChatScreen />} />
              <Route path="/chat/write" element={<ChatWriteScreen />} />
              <Route path="/search" element={<SearchScreen />} />
              <Route path="/hashtags" element={<HashtagScreen />} />
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
              <Route path="/privacy-policy" element={<PrivacyPolicyScreen />} />
              <Route path="/location-terms" element={<LocationTermsScreen />} />
              <Route path="/youth-policy" element={<YouthPolicyScreen />} />
              <Route path="/marketing-consent" element={<MarketingConsentScreen />} />
              <Route path="/opensource-licenses" element={<OpenSourceLicensesScreen />} />
              <Route path="/business-info" element={<BusinessInfoScreen />} />
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




























