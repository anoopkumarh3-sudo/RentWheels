import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Fetch or create profile row in public.profiles
  const fetchProfile = useCallback(async (authUserId, userEmail, userMetadata = {}) => {
    if (!authUserId) {
      setProfile(null)
      return null
    }

    try {
      // Calculate dynamic host earnings & trips from bookings on user's vehicles
      let userTotalEarnings = 0
      let userTotalTrips = 0
      let userTotalHours = 0

      try {
        const { data: userVehicles } = await supabase
          .from('vehicles')
          .select('id')
          .eq('owner_id', authUserId)

        if (userVehicles && userVehicles.length > 0) {
          const vIds = userVehicles.map(v => v.id)
          const { data: hostBookings } = await supabase
            .from('bookings')
            .select('id, total_amount, total_hours, booking_status, payment_status')
            .in('vehicle_id', vIds)

          if (hostBookings) {
            const countedBookingIds = new Set()
            hostBookings.forEach(b => {
              if (countedBookingIds.has(b.id)) return
              countedBookingIds.add(b.id)
              if (b.payment_status === 'paid' || b.booking_status === 'approved') {
                userTotalEarnings += Number(b.total_amount || 0)
                userTotalTrips += 1
                userTotalHours += Number(b.total_hours || 0)
              }
            })
          }
        }
      } catch (calcErr) {
        console.warn('Profile host earnings computation note:', calcErr)
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUserId)
        .maybeSingle()

      if (data) {
        const loadedProfile = {
          id: data.id,
          full_name: data.full_name || userMetadata.full_name || 'RentWheels User',
          email: data.email || userEmail,
          phone: data.phone || userMetadata.phone || '',
          profile_image: data.profile_image || null,
          role_title: 'Verified Host & Driver',
          member_since: new Date(data.created_at || Date.now()).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
          rating: 0,
          total_trips: userTotalTrips,
          total_rental_hours: userTotalHours,
          total_earnings: userTotalEarnings
        }
        setProfile(loadedProfile)
        return loadedProfile
      }

      // If no profile exists yet in the profiles table, automatically create one
      const initialName = userMetadata.full_name || (userEmail ? userEmail.split('@')[0] : 'RentWheels User')
      const initialPhone = userMetadata.phone || ''

      try {
        const { data: inserted, error: insertError } = await supabase
          .from('profiles')
          .insert([
            {
              id: authUserId,
              full_name: initialName,
              email: userEmail,
              phone: initialPhone,
              created_at: new Date().toISOString()
            }
          ])
          .select()
          .single()

        if (!insertError && inserted) {
          const newProfile = {
            id: inserted.id,
            full_name: inserted.full_name || initialName,
            email: inserted.email || userEmail,
            phone: inserted.phone || initialPhone,
            profile_image: inserted.profile_image || null,
            role_title: 'Verified Host & Driver',
            member_since: new Date(inserted.created_at || Date.now()).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
            rating: 0,
            total_trips: 0,
            total_rental_hours: 0,
            total_earnings: 0
          }
          setProfile(newProfile)
          return newProfile
        }
      } catch (insertErr) {
        console.warn('Profile auto-insert note:', insertErr)
      }

      // Clean in-memory fallback if insert policy requires email confirmation first
      const fallbackProfile = {
        id: authUserId,
        full_name: initialName,
        email: userEmail,
        phone: initialPhone,
        profile_image: null,
        role_title: 'Verified Host & Driver',
        member_since: new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
        rating: 0,
        total_trips: 0,
        total_rental_hours: 0,
        total_earnings: 0
      }
      setProfile(fallbackProfile)
      return fallbackProfile
    } catch (err) {
      console.warn('Profile fetch warning:', err.message)
      return null
    }
  }, [])

  // Restore active session on mount
  useEffect(() => {
    let mounted = true

    async function initializeAuth() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.warn('Supabase getSession note:', error.message)
        }

        if (session?.user && mounted) {
          setUser(session.user)
          await fetchProfile(session.user.id, session.user.email, session.user.user_metadata)
        } else if (mounted) {
          setUser(null)
          setProfile(null)
        }
      } catch (err) {
        console.warn('Auth initialization exception:', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    initializeAuth()

    // Listen to real-time auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user)
        await fetchProfile(session.user.id, session.user.email, session.user.user_metadata)
      } else {
        setUser(null)
        setProfile(null)
      }
      setLoading(false)
    })

    return () => {
      mounted = false
      subscription?.unsubscribe()
    }
  }, [fetchProfile])

  // 1. Email and Password Registration
  const registerWithEmail = async ({ email, password, fullName, phone }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) throw error

      if (data.user) {
        // Attempt creating corresponding profile row in public.profiles
        try {
          await supabase.from('profiles').insert([
            {
              id: data.user.id,
              full_name: fullName,
              email: email,
              phone: phone,
              created_at: new Date().toISOString()
            }
          ])
        } catch (profileErr) {
          console.warn('Profile registration insert note:', profileErr.message)
        }

        setUser(data.user)
        setProfile({
          id: data.user.id,
          full_name: fullName,
          email: email,
          phone: phone,
          profile_image: null,
          role_title: 'Verified Host & Driver',
          member_since: new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
          rating: 0,
          total_trips: 0,
          total_rental_hours: 0,
          total_earnings: 0
        })

        return { success: true, user: data.user, requiresVerification: !data.session }
      }
      return { success: false, error: 'Registration could not be completed' }
    } catch (err) {
      console.error('Registration failed:', err)
      return { success: false, error: err.message || 'Registration failed' }
    }
  }

  // 2. Email and Password Login
  const loginWithEmail = async ({ email, password }) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      if (data.user) {
        setUser(data.user)
        await fetchProfile(data.user.id, data.user.email, data.user.user_metadata)
        return { success: true, user: data.user }
      }
      return { success: false, error: 'User not found' }
    } catch (err) {
      console.error('Login failed:', err)
      return { success: false, error: err.message || 'Invalid credentials' }
    }
  }

  // 3. Logout
  const logout = async () => {
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.warn('SignOut note:', err)
    } finally {
      setUser(null)
      setProfile(null)
    }
  }

  // 4. Forgot Password
  const sendPasswordResetEmail = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })
      if (error) throw error
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message || 'Failed to send reset email' }
    }
  }

  // 5. Update Password
  const updatePassword = async (newPassword) => {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message || 'Failed to update password' }
    }
  }

  // 6. Update Profile in public.profiles
  const updateProfile = async (updates) => {
    if (!user) {
      return { success: false, error: 'You must be signed in to update your profile.' }
    }

    const newFullName = updates.fullName || updates.full_name || profile?.full_name || ''
    const newPhone = updates.phone !== undefined ? updates.phone : (profile?.phone || '')
    const newImage = updates.profile_image !== undefined ? updates.profile_image : (profile?.profile_image || null)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: newFullName,
          phone: newPhone,
          profile_image: newImage,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) {
        console.warn('Supabase profile update warning:', error.message)
        // If row doesn't exist yet, insert it
        await supabase.from('profiles').upsert({
          id: user.id,
          email: user.email,
          full_name: newFullName,
          phone: newPhone,
          profile_image: newImage,
          updated_at: new Date().toISOString()
        })
      }

      setProfile(prev => ({
        ...(prev || {}),
        id: user.id,
        email: user.email,
        full_name: newFullName,
        phone: newPhone,
        profile_image: newImage
      }))

      return { success: true }
    } catch (err) {
      return { success: false, error: err.message || 'Failed to save profile' }
    }
  }

  const value = {
    user,
    profile,
    loading,
    isAuthenticated: !!user,
    registerWithEmail,
    loginWithEmail,
    logout,
    sendPasswordResetEmail,
    updatePassword,
    updateProfile,
    refreshProfile: () => user && fetchProfile(user.id, user.email, user.user_metadata)
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
