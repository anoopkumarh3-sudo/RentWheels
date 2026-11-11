import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import UserAvatar from '../components/common/UserAvatar'
import { supabase } from '../lib/supabaseClient'

export default function DashboardPage() {
  const { profile, user } = useAuth()

  // Real state for user metrics (defaults to 0 for clean new accounts)
  const [stats, setStats] = useState({
    totalEarnings: 0,
    activeListingsCount: 0,
    totalBookingsCount: 0,
    rentalHours: 0,
    pendingRequestsCount: 0
  })
  const [recentActivities, setRecentActivities] = useState([])
  const [loading, setLoading] = useState(false)

  // Fetch real counts from Supabase if logged in
  useEffect(() => {
    async function loadAccountData() {
      if (!user?.id) {
        // Defaults to clean 0 state
        setStats({
          totalEarnings: 0,
          activeListingsCount: 0,
          totalBookingsCount: 0,
          rentalHours: 0,
          pendingRequestsCount: 0
        })
        setRecentActivities([])
        return
      }

      setLoading(true)
      try {
        // Fetch user's listings count from Supabase
        const { count: listingsCount } = await supabase
          .from('vehicles')
          .select('*', { count: 'exact', head: true })
          .eq('owner_id', user.id)

        // Fetch user's bookings count from Supabase
        const { count: bookingsCount } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('renter_id', user.id)

        setStats({
          totalEarnings: 0,
          activeListingsCount: listingsCount || 0,
          totalBookingsCount: bookingsCount || 0,
          rentalHours: 0,
          pendingRequestsCount: 0
        })
      } catch (err) {
        console.warn('Dashboard data fetch note:', err.message)
      } finally {
        setLoading(false)
      }
    }

    loadAccountData()
  }, [user])

  const userName = profile?.full_name || 'Anoop Kumar'
  const userPhoto = profile?.profile_image || null

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header with Professional User Identification */}
      <div>
        <nav className="flex items-center gap-1.5 text-xs text-on-surface-variant font-semibold mb-2">
          <Link to="/home" className="hover:text-primary">Home</Link>
          <span>/</span>
          <span className="text-primary font-bold">Dashboard</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <UserAvatar
              name={userName}
              imageUrl={userPhoto}
              size="lg"
              showBadge={true}
            />
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
                {userName}'s Dashboard
              </h1>
              <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
                Consolidated overview of your vehicle listings, bookings, and earnings.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="px-3.5 py-1.5 rounded-full bg-lavender-subtle text-primary text-xs font-bold border border-primary-fixed-dim/40 flex items-center gap-1.5 shadow-sm">
              <span className="material-symbols-outlined text-[16px]">verified</span>
              <span>{profile?.role_title || 'Verified Host & Driver'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards Row — Real Account Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1: Host Earnings */}
        <div className="bg-surface-card rounded-3xl border border-border-purple-tint p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            <span>Total Host Earnings</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">currency_rupee</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold text-on-surface">
              ₹{stats.totalEarnings.toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-on-surface-variant font-medium mt-1">
              {stats.totalEarnings === 0 ? 'No earnings recorded yet.' : 'Lifetime payouts settled'}
            </div>
          </div>
        </div>

        {/* Metric 2: Active Listings */}
        <div className="bg-surface-card rounded-3xl border border-border-purple-tint p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            <span>Vehicles Listed</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">directions_car</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold text-on-surface">
              {stats.activeListingsCount}
            </div>
            <div className="text-xs text-on-surface-variant font-medium mt-1">
              {stats.activeListingsCount === 0 ? 'No vehicles listed yet.' : `${stats.activeListingsCount} active on marketplace`}
            </div>
          </div>
        </div>

        {/* Metric 3: Rental Bookings */}
        <div className="bg-surface-card rounded-3xl border border-border-purple-tint p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            <span>Rental Bookings</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">calendar_today</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold text-on-surface">
              {stats.totalBookingsCount}
            </div>
            <div className="text-xs text-on-surface-variant font-medium mt-1">
              {stats.totalBookingsCount === 0 ? 'No bookings available.' : `${stats.totalBookingsCount} active reservations`}
            </div>
          </div>
        </div>

        {/* Metric 4: Rental Hours */}
        <div className="bg-surface-card rounded-3xl border border-border-purple-tint p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            <span>Rental Hours</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">schedule</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold text-on-surface">
              {stats.rentalHours} hrs
            </div>
            <div className="text-xs text-on-surface-variant font-medium mt-1">
              {stats.rentalHours === 0 ? '0 rental hours logged.' : 'Total hours driven'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Quick Actions & Clean Empty State Activity Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Quick Actions (5 Cols) */}
        <div className="lg:col-span-5 bg-surface-card rounded-3xl border border-border-purple-tint p-6 shadow-sm flex flex-col gap-4">
          <h2 className="text-base font-bold text-on-surface border-b border-border-purple-tint pb-3">
            Quick Actions
          </h2>

          <Link
            to="/list-vehicle"
            className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-container-low hover:bg-lavender-subtle border border-border-purple-tint/50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary flex items-center justify-center shrink-0 shadow-sm">
                <span className="material-symbols-outlined text-[20px]">add_circle</span>
              </div>
              <div>
                <div className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">
                  List Your Vehicle
                </div>
                <div className="text-xs text-on-surface-variant">
                  Start by listing your first vehicle
                </div>
              </div>
            </div>
            <span className="material-symbols-outlined text-primary text-[18px]">chevron_right</span>
          </Link>

          <Link
            to="/explore"
            className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-container-low hover:bg-lavender-subtle border border-border-purple-tint/50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <span className="material-symbols-outlined text-[20px]">search</span>
              </div>
              <div>
                <div className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">
                  Explore Rental Rides
                </div>
                <div className="text-xs text-on-surface-variant">
                  Find cars, bikes & scooters nearby
                </div>
              </div>
            </div>
            <span className="material-symbols-outlined text-primary text-[18px]">chevron_right</span>
          </Link>

          <Link
            to="/my-bookings"
            className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-container-low hover:bg-lavender-subtle border border-border-purple-tint/50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <span className="material-symbols-outlined text-[20px]">calendar_today</span>
              </div>
              <div>
                <div className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">
                  My Bookings
                </div>
                <div className="text-xs text-on-surface-variant">
                  Manage your rental reservations
                </div>
              </div>
            </div>
            <span className="material-symbols-outlined text-primary text-[18px]">chevron_right</span>
          </Link>
        </div>

        {/* Right: Activity Stream / Professional Empty State (7 Cols) */}
        <div className="lg:col-span-7 bg-surface-card rounded-3xl border border-border-purple-tint p-6 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-border-purple-tint pb-3">
            <h2 className="text-base font-bold text-on-surface">
              Recent Activity & Updates
            </h2>
            <span className="text-xs text-on-surface-variant font-medium">Real-time</span>
          </div>

          {recentActivities.length > 0 ? (
            <div className="flex flex-col gap-3.5">
              {recentActivities.map((act, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-2xl bg-surface-container-low border border-border-purple-tint/50">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[18px]">notifications</span>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-on-surface">{act.title}</div>
                    <div className="text-[11px] text-on-surface-variant mt-0.5">{act.description}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Professional Empty State */
            <div className="py-12 px-4 text-center flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-surface-container-low text-on-surface-variant flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-[28px] text-primary">inbox</span>
              </div>
              <h3 className="text-sm font-bold text-on-surface">No recent activity recorded</h3>
              <p className="text-xs text-on-surface-variant max-w-xs mt-1 leading-relaxed">
                As you book rides or list vehicles for rent, your transactions, booking approvals, and earnings will appear here.
              </p>
              <div className="flex items-center gap-3 mt-4">
                <Link
                  to="/list-vehicle"
                  className="px-4 py-2 rounded-xl bg-primary-container text-on-primary font-bold text-xs hover:bg-electric-violet-hover transition-all shadow-sm"
                >
                  List a Vehicle
                </Link>
                <Link
                  to="/explore"
                  className="px-4 py-2 rounded-xl bg-surface-container-low text-on-surface font-bold text-xs hover:bg-lavender-subtle transition-all"
                >
                  Browse Vehicles
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
