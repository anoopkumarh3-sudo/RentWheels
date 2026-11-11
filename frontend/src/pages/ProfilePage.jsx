
import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import UserAvatar from '../components/common/UserAvatar'
import { uploadProfileImage } from '../lib/storageService'
import { message } from 'antd'

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, profile, updateProfile, loading } = useAuth()

  const [formData, setFormData] = useState({
    fullName: profile?.full_name || '',
    email: profile?.email || user?.email || '',
    phone: profile?.phone || '',
    bio: 'Passionate road tripper and proud member of the RentWheels Mobility Club.',
    licenseNumber: 'KA-05-2018-0091823',
    profile_image: profile?.profile_image || null
  })

  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        fullName: profile.full_name || prev.fullName,
        email: profile.email || user?.email || prev.email,
        phone: profile.phone || prev.phone,
        profile_image: profile.profile_image || prev.profile_image
      }))
    }
  }, [profile, user])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Handle actual profile picture upload to Supabase Storage
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      message.error('Please select an image file (PNG, JPG, WebP).')
      return
    }

    if (!user) {
      message.warning('Please sign in to upload a profile photo.')
      return
    }

    setUploadingPhoto(true)
    const res = await uploadProfileImage(file, user.id)
    setUploadingPhoto(false)

    if (res.success && res.url) {
      setFormData(prev => ({ ...prev, profile_image: res.url }))
      // Auto-save photo to profiles table
      await updateProfile({ ...formData, profile_image: res.url })
      message.success('Profile photo uploaded and saved successfully!')
    } else {
      message.error(res.error || 'Failed to upload profile photo.')
    }
  }

  const handleRemovePhoto = async () => {
    setFormData(prev => ({ ...prev, profile_image: null }))
    await updateProfile({ ...formData, profile_image: null })
    message.info('Switched back to clean initials avatar.')
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)

    const res = await updateProfile(formData)
    setSaving(false)

    if (res.success) {
      message.success('Profile details saved successfully!')
    } else {
      message.error(res.error || 'Failed to update profile.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="bg-surface-card rounded-3xl border border-border-purple-tint p-10 text-center flex flex-col items-center max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-lavender-subtle text-primary flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-[32px]">account_circle</span>
        </div>
        <h2 className="text-xl font-bold text-on-surface">Sign in to view your profile</h2>
        <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">
          Please sign in or register an account to manage your profile, vehicle listings, and bookings.
        </p>
        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={() => navigate('/login')}
            className="px-5 py-2.5 rounded-xl bg-primary-container text-on-primary font-bold text-xs shadow-md"
          >
            Sign In
          </button>
          <button
            onClick={() => navigate('/register')}
            className="px-5 py-2.5 rounded-xl bg-surface-container-low text-on-surface font-bold text-xs border border-border-purple-tint"
          >
            Register
          </button>
        </div>
      </div>
    )
  }

  const userName = formData.fullName || user?.email?.split('@')[0] || 'RentWheels User'
  const userRole = profile?.role_title || 'Verified Host & Driver'

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <nav className="flex items-center gap-1.5 text-xs text-on-surface-variant font-semibold mb-2">
          <Link to="/home" className="hover:text-primary">Home</Link>
          <span>/</span>
          <span className="text-primary font-bold">My Profile</span>
        </nav>

        <h1 className="text-2xl sm:text-4xl font-extrabold text-on-surface tracking-tight">
          Unified Account Profile
        </h1>
        <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
          One account to manage your host listings, renter trips, and personal credentials.
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-surface-card rounded-3xl border border-border-purple-tint p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="relative group">
            <UserAvatar
              name={userName}
              imageUrl={formData.profile_image}
              size="2xl"
              showBadge={true}
            />

            {/* Quick Upload overlay */}
            <label
              htmlFor="avatar-upload"
              className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity text-white text-xs font-semibold"
              title="Upload custom photo"
            >
              {uploadingPhoto ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <span className="material-symbols-outlined text-[20px]">photo_camera</span>
              )}
            </label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={uploadingPhoto}
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-on-surface">{userName}</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-lavender-subtle text-primary text-xs font-bold border border-primary-fixed-dim/40">
                {userRole}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">{formData.email}</p>

            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs font-semibold text-on-surface-variant">
              <span>Member since {profile?.member_since || 'Nov 2026'}</span>
              <span>•</span>
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Active Account</span>
              </span>

              {formData.profile_image && (
                <>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="text-primary hover:underline font-bold"
                  >
                    Reset to Initials
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Real Stats pill (defaults to ₹0 for clean account) */}
        <div className="p-4 rounded-2xl bg-surface-container-low border border-border-purple-tint/60 text-right sm:self-auto self-start">
          <div className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Lifetime Host Payouts</div>
          <div className="text-xl sm:text-2xl font-extrabold text-primary">₹{(profile?.total_earnings || 0).toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-on-surface-variant mt-0.5">{profile?.total_trips || 0} Trips Completed</div>
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSave} className="bg-surface-card rounded-3xl border border-border-purple-tint p-6 sm:p-8 shadow-sm flex flex-col gap-6">
        <div className="border-b border-border-purple-tint pb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-on-surface">Personal Information</h3>
            <p className="text-xs text-on-surface-variant mt-0.5">Used for identity matching on rental bookings and vehicle listings.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
              Full Name
            </label>
            <input
              type="text"
              name="fullName"
              required
              value={formData.fullName}
              onChange={handleInputChange}
              className="w-full h-11 px-3.5 bg-surface-container-low border border-border-purple-tint rounded-xl text-sm font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container/20"
            />
            <span className="text-[11px] text-on-surface-variant mt-1 inline-block">
              Initials <span className="font-bold text-primary">"{userName ? userName.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() : 'U'}"</span> are auto-generated from your full name.
            </span>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
              Email Address (Supabase Auth)
            </label>
            <input
              type="email"
              name="email"
              disabled
              value={formData.email}
              className="w-full h-11 px-3.5 bg-surface-container border border-border-purple-tint rounded-xl text-sm font-semibold text-on-surface-variant cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              required
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full h-11 px-3.5 bg-surface-container-low border border-border-purple-tint rounded-xl text-sm font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container/20"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
              Indian Driving License
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                name="licenseNumber"
                value={formData.licenseNumber}
                onChange={handleInputChange}
                className="w-full h-11 px-3.5 bg-surface-container-low border border-border-purple-tint rounded-xl text-sm font-semibold text-on-surface uppercase focus:outline-none"
              />
              <span className="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 shrink-0">
                Verified
              </span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
            Bio & Community Introduction
          </label>
          <textarea
            name="bio"
            rows={3}
            value={formData.bio}
            onChange={handleInputChange}
            className="w-full p-3.5 bg-surface-container-low border border-border-purple-tint rounded-xl text-sm font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container/20 resize-none"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-purple-tint">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-primary-container hover:bg-electric-violet-hover text-on-primary font-bold text-xs shadow-md shadow-primary/20 flex items-center gap-1.5 transition-all"
          >
            {saving ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">save</span>
                <span>Save Profile Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
