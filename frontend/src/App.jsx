import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import { AuthProvider } from './context/AuthContext'

// Layout
import AppLayout from './components/layout/AppLayout'

// Pages
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import AuthCallbackPage from './pages/AuthCallbackPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import HomePage from './pages/HomePage'
import ExplorePage from './pages/ExplorePage'
import VehicleDetailsPage from './pages/VehicleDetailsPage'
import BookingPaymentPage from './pages/BookingPaymentPage'
import MyBookingsPage from './pages/MyBookingsPage'
import ListVehiclePage from './pages/ListVehiclePage'
import RentalRequestsPage from './pages/RentalRequestsPage'
import DashboardPage from './pages/DashboardPage'
import ProfilePage from './pages/ProfilePage'

export default function App() {
  // Ant Design Theme customization to match "Vivid Velvet Mobility" tokens
  const antTheme = {
    token: {
      colorPrimary: '#630ed4',
      colorSuccess: '#10B981',
      colorWarning: '#F59E0B',
      colorError: '#E11D48',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      borderRadius: 12,
    }
  }

  return (
    <ConfigProvider theme={antTheme}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Auth & Marketing Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Authenticated Dashboard / Marketplace Routes */}
            <Route element={<AppLayout />}>
              <Route path="/home" element={<HomePage />} />
              <Route path="/explore" element={<ExplorePage />} />
              <Route path="/vehicle/:id" element={<VehicleDetailsPage />} />
              <Route path="/checkout/:id" element={<BookingPaymentPage />} />
              <Route path="/my-bookings" element={<MyBookingsPage />} />
              <Route path="/list-vehicle" element={<ListVehiclePage />} />
              <Route path="/rental-requests" element={<RentalRequestsPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>

            {/* Catch-all fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ConfigProvider>
  )
}
