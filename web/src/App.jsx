import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import StatusBar from './components/StatusBar'
import MockDataLoader from './components/MockDataLoader'

// Pages
import WelcomeScreen from './pages/WelcomeScreen'
import StartScreen from './pages/StartScreen'
import AuthCallbackScreen from './pages/AuthCallbackScreen'
import MainScreen from './pages/MainScreen'
import SearchScreen from './pages/SearchScreen'
import DetailScreen from './pages/DetailScreen'
import PostDetailScreen from './pages/PostDetailScreen'
import RegionDetailScreen from './pages/RegionDetailScreen'
import RegionCategoryScreen from './pages/RegionCategoryScreen'
import UploadScreen from './pages/UploadScreen'
import MapScreen from './pages/MapScreen'
import ProfileScreen from './pages/ProfileScreen'
import EditProfileScreen from './pages/EditProfileScreen'
import PersonalInfoEditScreen from './pages/PersonalInfoEditScreen'
import PasswordChangeScreen from './pages/PasswordChangeScreen'
import AccountConnectionScreen from './pages/AccountConnectionScreen'
import AccountDeleteScreen from './pages/AccountDeleteScreen'
import AccountDeleteConfirmScreen from './pages/AccountDeleteConfirmScreen'
import BadgeListScreen from './pages/BadgeListScreen'
import BadgeAchievementScreen from './pages/BadgeAchievementScreen'
import PointsScreen from './pages/PointsScreen'
import PointsHistoryScreen from './pages/PointsHistoryScreen'
import PointsUsageGuideScreen from './pages/PointsUsageGuideScreen'
import PointsShopScreen from './pages/PointsShopScreen'
import PointsCategoryScreen from './pages/PointsCategoryScreen'
import PointsProductDetailScreen from './pages/PointsProductDetailScreen'
import ExchangeSuccessScreen from './pages/ExchangeSuccessScreen'
import MyCouponsScreen from './pages/MyCouponsScreen'
import SettingsScreen from './pages/SettingsScreen'
import FeedUpdateFrequencyScreen from './pages/FeedUpdateFrequencyScreen'
import NoticesScreen from './pages/NoticesScreen'
import FAQScreen from './pages/FAQScreen'
import InquiryScreen from './pages/InquiryScreen'
import TermsAndPoliciesScreen from './pages/TermsAndPoliciesScreen'
import TermsOfServiceScreen from './pages/TermsOfServiceScreen'
import NotificationsScreen from './pages/NotificationsScreen'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          <StatusBar />
          <MockDataLoader />
          <div className="page-wrapper">
            <Routes>
              <Route path="/" element={<WelcomeScreen />} />
              <Route path="/start" element={<StartScreen />} />
              <Route path="/auth/callback" element={<AuthCallbackScreen />} />
              <Route path="/main" element={<ProtectedRoute><MainScreen /></ProtectedRoute>} />
              <Route path="/search" element={<ProtectedRoute><SearchScreen /></ProtectedRoute>} />
              <Route path="/detail" element={<ProtectedRoute><DetailScreen /></ProtectedRoute>} />
              <Route path="/post/:id" element={<ProtectedRoute><PostDetailScreen /></ProtectedRoute>} />
              <Route path="/region/:regionName" element={<ProtectedRoute><RegionDetailScreen /></ProtectedRoute>} />
              <Route path="/region/:regionName/category" element={<ProtectedRoute><RegionCategoryScreen /></ProtectedRoute>} />
              <Route path="/upload" element={<ProtectedRoute><UploadScreen /></ProtectedRoute>} />
              <Route path="/map" element={<ProtectedRoute><MapScreen /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><ProfileScreen /></ProtectedRoute>} />
              <Route path="/profile/edit" element={<ProtectedRoute><EditProfileScreen /></ProtectedRoute>} />
              <Route path="/personal-info-edit" element={<ProtectedRoute><PersonalInfoEditScreen /></ProtectedRoute>} />
              <Route path="/password-change" element={<ProtectedRoute><PasswordChangeScreen /></ProtectedRoute>} />
              <Route path="/account-connection" element={<ProtectedRoute><AccountConnectionScreen /></ProtectedRoute>} />
              <Route path="/account-delete" element={<ProtectedRoute><AccountDeleteScreen /></ProtectedRoute>} />
              <Route path="/account-delete/confirm" element={<ProtectedRoute><AccountDeleteConfirmScreen /></ProtectedRoute>} />
              <Route path="/badges" element={<ProtectedRoute><BadgeListScreen /></ProtectedRoute>} />
              <Route path="/badge-achievement/:badgeId" element={<ProtectedRoute><BadgeAchievementScreen /></ProtectedRoute>} />
              <Route path="/badge/achievement" element={<ProtectedRoute><BadgeAchievementScreen /></ProtectedRoute>} />
              <Route path="/points" element={<ProtectedRoute><PointsScreen /></ProtectedRoute>} />
              <Route path="/points/history" element={<ProtectedRoute><PointsHistoryScreen /></ProtectedRoute>} />
              <Route path="/points/guide" element={<ProtectedRoute><PointsUsageGuideScreen /></ProtectedRoute>} />
              <Route path="/points/shop" element={<ProtectedRoute><PointsShopScreen /></ProtectedRoute>} />
              <Route path="/points/category/:category" element={<ProtectedRoute><PointsCategoryScreen /></ProtectedRoute>} />
              <Route path="/points/product/:productId" element={<ProtectedRoute><PointsProductDetailScreen /></ProtectedRoute>} />
              <Route path="/exchange-success" element={<ProtectedRoute><ExchangeSuccessScreen /></ProtectedRoute>} />
              <Route path="/coupons" element={<ProtectedRoute><MyCouponsScreen /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><SettingsScreen /></ProtectedRoute>} />
              <Route path="/feed-update-frequency" element={<ProtectedRoute><FeedUpdateFrequencyScreen /></ProtectedRoute>} />
              <Route path="/notices" element={<ProtectedRoute><NoticesScreen /></ProtectedRoute>} />
              <Route path="/faq" element={<ProtectedRoute><FAQScreen /></ProtectedRoute>} />
              <Route path="/inquiry" element={<ProtectedRoute><InquiryScreen /></ProtectedRoute>} />
              <Route path="/terms-and-policies" element={<ProtectedRoute><TermsAndPoliciesScreen /></ProtectedRoute>} />
              <Route path="/terms-of-service" element={<ProtectedRoute><TermsOfServiceScreen /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><NotificationsScreen /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App


























