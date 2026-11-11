import React, { useState } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { message } from 'antd'

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const email = searchParams.get('email') || 'your registered email'

  const [resending, setResending] = useState(false)
  const [countdown, setCountdown] = useState(0)

  const handleResend = async () => {
    if (countdown > 0) return

    setResending(true)
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      })

      if (error) {
        message.error(error.message || 'Failed to resend verification email.')
      } else {
        message.success('Verification email resent! Please check your inbox.')
        setCountdown(60)
        const timer = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(timer)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      }
    } catch (err) {
      message.error(err.message)
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4 sm:p-6 lg:p-10">
      <div className="w-full max-w-md bg-surface-card rounded-3xl border border-border-purple-tint shadow-2xl p-6 sm:p-10 text-center">
        {/* Brand Icon */}
        <div className="w-16 h-16 rounded-2xl bg-lavender-subtle text-primary flex items-center justify-center mx-auto mb-5 shadow-sm">
          <span className="material-symbols-outlined text-[36px]">mark_email_unread</span>
        </div>

        <span className="px-3 py-1 rounded-full bg-lavender-subtle text-primary text-xs font-bold uppercase tracking-wider mb-3 inline-block">
          Verification Required
        </span>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface">Verify Your Email</h1>
        <p className="text-xs sm:text-sm text-on-surface-variant mt-2 leading-relaxed">
          We have sent a verification link to <br />
          <span className="font-bold text-primary break-all">{email}</span>.
        </p>

        <div className="my-6 p-4 rounded-2xl bg-surface-container-low border border-border-purple-tint/60 text-left text-xs text-on-surface-variant flex flex-col gap-2">
          <div className="flex items-start gap-2">
            <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">info</span>
            <span>Click the verification link in the email to activate your account.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">folder</span>
            <span>If you don't see the email, check your Spam or Junk folder.</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleResend}
            disabled={resending || countdown > 0}
            className="w-full h-11 bg-primary-container hover:bg-electric-violet-hover disabled:bg-gray-300 text-on-primary font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            {resending ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : countdown > 0 ? (
              <span>Resend in {countdown}s</span>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">outgoing_mail</span>
                <span>Resend Verification Email</span>
              </>
            )}
          </button>

          <Link
            to="/login"
            className="w-full h-11 bg-surface-container-low hover:bg-lavender-subtle text-on-surface font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center"
          >
            Already verified? Sign In
          </Link>
        </div>

        <div className="mt-6 pt-5 border-t border-border-purple-tint">
          <Link to="/" className="text-xs font-bold text-on-surface-variant hover:text-primary">
            ← Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  )
}

