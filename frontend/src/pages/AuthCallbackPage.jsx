import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { message } from 'antd'

export default function AuthCallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    async function handleAuthCallback() {
      try {
        // Exchange code/tokens from URL hash or query params
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          message.error(`Verification error: ${error.message}`)
          navigate('/login')
          return
        }

        if (session) {
          message.success('Email verified successfully! Welcome to RentWheels.')
          navigate('/home')
        } else {
          // If no session yet, listen to state change
          const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
              message.success('Authentication confirmed! Welcome.')
              navigate('/home')
            }
          })

          setTimeout(() => {
            subscription?.unsubscribe()
            navigate('/home')
          }, 2000)
        }
      } catch (err) {
        console.error('Callback error:', err)
        navigate('/login')
      }
    }

    handleAuthCallback()
  }, [navigate])

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6 text-center">
      <div className="bg-surface-card rounded-3xl border border-border-purple-tint p-8 max-w-sm w-full shadow-xl flex flex-col items-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <h2 className="text-lg font-bold text-on-surface">Confirming Verification...</h2>
        <p className="text-xs text-on-surface-variant mt-1">Please wait while we activate your RentWheels session.</p>
      </div>
    </div>
  )
}

