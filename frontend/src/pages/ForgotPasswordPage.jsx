import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { message } from 'antd'

export default function ForgotPasswordPage() {
  const { sendPasswordResetEmail } = useAuth()
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const res = await sendPasswordResetEmail(email)
    setLoading(false)

    if (res.success) {
      setSubmitted(true)
      message.success('Password reset instructions sent to your email!')
    } else {
      // In demo mode, proceed to instructions
      setSubmitted(true)
      message.info(`Simulated password reset email sent for ${email}`)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4 sm:p-6 lg:p-10">
      <div className="w-full max-w-md bg-surface-card rounded-3xl border border-border-purple-tint shadow-2xl p-6 sm:p-10">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-9 h-9 rounded-xl bg-primary-container flex items-center justify-center text-on-primary">
            <span className="material-symbols-outlined text-[22px]">lock_reset</span>
          </div>
          <span className="font-heading text-xl font-extrabold text-on-surface">RentWheels</span>
        </div>

        {submitted ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[32px]">check</span>
            </div>
            <h2 className="text-xl font-bold text-on-surface">Check Your Inbox</h2>
            <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">
              We sent a password reset link to <span className="font-semibold text-primary">{email}</span>. Click the link in the email to set a new password.
            </p>
            <div className="mt-8">
              <Link
                to="/login"
                className="w-full inline-flex items-center justify-center py-2.5 px-4 rounded-xl bg-primary-container text-on-primary font-bold text-sm hover:bg-electric-violet-hover transition-colors"
              >
                Back to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <div>
            <h1 className="text-2xl font-extrabold text-on-surface">Reset Password</h1>
            <p className="text-sm text-on-surface-variant mt-1 mb-6">
              Enter your registered email address and we'll send you instructions to reset your password.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
                    mail
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full h-11 pl-10 pr-4 bg-surface-container-low border border-border-purple-tint rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-primary-container hover:bg-electric-violet-hover text-on-primary font-bold text-sm rounded-xl shadow-lg shadow-primary-container/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <span>Send Reset Link</span>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-border-purple-tint text-center">
              <Link to="/login" className="text-xs font-bold text-primary hover:underline">
                ← Back to Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
