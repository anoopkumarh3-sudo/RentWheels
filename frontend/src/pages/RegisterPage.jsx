import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { message } from 'antd'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { registerWithEmail } = useAuth()
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    termsAgreed: false
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      message.error('Passwords do not match!')
      return
    }

    if (formData.password.length < 6) {
      message.warning('Password must be at least 6 characters long.')
      return
    }

    if (!formData.termsAgreed) {
      message.warning('Please accept the Terms of Service to register.')
      return
    }

    setLoading(true)
    const res = await registerWithEmail({
      email: formData.email,
      password: formData.password,
      fullName: formData.fullName,
      phone: formData.phone
    })
    setLoading(false)

    if (res.success) {
      if (res.requiresVerification) {
        message.info('Account created! Please verify your email.')
        navigate(`/verify-email?email=${encodeURIComponent(formData.email)}`)
      } else {
        message.success('Welcome to RentWheels! Account created successfully.')
        navigate('/home')
      }
    } else {
      message.error(res.error || 'Registration failed.')
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4 sm:p-6 lg:p-10">
      <div className="w-full max-w-5xl bg-surface-card rounded-3xl border border-border-purple-tint shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[660px]">
        {/* Left Side: Visual Branding */}
        <div className="lg:col-span-5 relative hidden lg:flex flex-col justify-between p-8 bg-gradient-to-br from-primary to-primary-container text-white overflow-hidden">
          <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="flex items-center gap-2.5 z-10">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-[22px]">directions_car</span>
            </div>
            <span className="font-heading text-xl font-extrabold tracking-tight">RentWheels</span>
          </div>

          <div className="z-10 my-auto">
            <div className="inline-block px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold uppercase tracking-wider mb-4">
              Single Account Mobility
            </div>
            <h2 className="text-3xl font-extrabold leading-tight">
              Rent when you need. <br />Earn when you don't.
            </h2>
            <p className="text-white/80 text-sm mt-3 leading-relaxed">
              Join thousands of verified renters and vehicle owners in India's modern peer-to-peer vehicle sharing community.
            </p>
          </div>

          <div className="z-10 text-xs text-white/60">
            © 2026 RentWheels Club. All rights reserved.
          </div>
        </div>

        {/* Right Side: Registration Form */}
        <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface">Create Account</h1>
                <p className="text-sm text-on-surface-variant mt-1">One unified account to rent and host vehicles.</p>
              </div>
              <Link to="/" className="lg:hidden w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[18px]">home</span>
              </Link>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
                    person
                  </span>
                  <input
                    type="text"
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="e.g. Alex Morgan"
                    className="w-full h-10 pl-10 pr-4 bg-surface-container-low border border-border-purple-tint rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
                    mail
                  </span>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@example.com"
                    className="w-full h-10 pl-10 pr-4 bg-surface-container-low border border-border-purple-tint rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
                    call
                  </span>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    className="w-full h-10 pl-10 pr-4 bg-surface-container-low border border-border-purple-tint rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full h-10 px-3.5 bg-surface-container-low border border-border-purple-tint rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full h-10 px-3.5 bg-surface-container-low border border-border-purple-tint rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all"
                  />
                </div>
              </div>

              <div className="flex items-start gap-2 my-1">
                <input
                  type="checkbox"
                  name="termsAgreed"
                  id="termsAgreed"
                  checked={formData.termsAgreed}
                  onChange={handleChange}
                  className="mt-0.5 rounded text-primary focus:ring-primary"
                />
                <label htmlFor="termsAgreed" className="text-xs text-on-surface-variant select-none leading-tight">
                  I agree to the RentWheels Community Guidelines, Vehicle Damage Policy, and Terms of Service.
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-primary-container hover:bg-electric-violet-hover text-on-primary font-bold text-sm rounded-xl shadow-lg shadow-primary-container/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-1"
              >
                {loading ? (
                  <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <span>Create Free Account</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-border-purple-tint text-center">
              <p className="text-xs text-on-surface-variant">
                Already have an account?{' '}
                <Link to="/login" className="font-bold text-primary hover:underline">
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
