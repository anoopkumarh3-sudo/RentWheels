import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { message } from 'antd'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const { updatePassword } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      message.error('Passwords do not match!')
      return
    }

    if (password.length < 6) {
      message.warning('Password must be at least 6 characters long.')
      return
    }

    setLoading(true)
    const res = await updatePassword(password)
    setLoading(false)

    if (res.success) {
      message.success('Password updated successfully! You can now log in.')
      navigate('/login')
    } else {
      message.error(res.error || 'Failed to update password.')
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4 sm:p-6 lg:p-10">
      <div className="w-full max-w-md bg-surface-card rounded-3xl border border-border-purple-tint shadow-2xl p-6 sm:p-10">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-9 h-9 rounded-xl bg-primary-container flex items-center justify-center text-on-primary">
            <span className="material-symbols-outlined text-[22px]">lock</span>
          </div>
          <span className="font-heading text-xl font-extrabold text-on-surface">RentWheels</span>
        </div>

        <h1 className="text-2xl font-extrabold text-on-surface">Set New Password</h1>
        <p className="text-sm text-on-surface-variant mt-1 mb-6">
          Enter your new password below to secure your RentWheels account.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
              New Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-11 px-3.5 bg-surface-container-low border border-border-purple-tint rounded-xl text-sm font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-11 px-3.5 bg-surface-container-low border border-border-purple-tint rounded-xl text-sm font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container/20"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-primary-container hover:bg-electric-violet-hover text-on-primary font-bold text-sm rounded-xl shadow-lg shadow-primary-container/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <span>Save New Password</span>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-border-purple-tint text-center">
          <Link to="/login" className="text-xs font-bold text-primary hover:underline">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}

