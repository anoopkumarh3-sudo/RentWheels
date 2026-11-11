import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-bold text-on-surface-variant">Loading RentWheels...</span>
        </div>
      </div>
    )
  }

  // If user is authenticated, render protected page
  // For easy college evaluation demo, user fallback also permits exploring
  if (!user && !localStorage.getItem('rentwheels_demo_auth')) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

