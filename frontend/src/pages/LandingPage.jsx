import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import VehicleCard from '../components/common/VehicleCard'

export default function LandingPage() {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadVehicles() {
      try {
        const { data, error } = await supabase
          .from('vehicles')
          .select('*')
          .eq('availability_status', 'available')
          .limit(3)

        if (!error && data) {
          setVehicles(data)
        }
      } catch (err) {
        setVehicles([])
      } finally {
        setLoading(false)
      }
    }

    loadVehicles()
  }, [])

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Top Navbar */}
      <header className="fixed top-0 left-0 right-0 w-full z-50 bg-surface-card/90 backdrop-blur-xl border-b border-border-purple-tint">
        <div className="h-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary-container flex items-center justify-center text-on-primary shadow-sm">
              <span className="material-symbols-outlined text-[22px]">directions_car</span>
            </div>
            <div className="flex flex-col">
              <span className="font-heading text-lg font-extrabold tracking-tight text-on-surface">RentWheels</span>
              <span className="text-[10px] text-primary font-bold uppercase tracking-wider">Mobility Club</span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm font-bold text-on-surface hover:text-primary px-3 py-2 rounded-xl transition-colors"
            >
              Log In
            </Link>
            <Link
              to="/register"
              className="text-sm font-bold bg-primary-container text-on-primary hover:bg-electric-violet-hover px-4 py-2 rounded-xl shadow-md shadow-primary/20 active:scale-95 transition-all"
            >
              Create Account
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16 flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-16 sm:py-24 bg-gradient-to-b from-surface via-surface-container-low/40 to-surface">
          <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary-fixed/30 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-secondary-fixed/30 rounded-full blur-3xl pointer-events-none"></div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left Column */}
              <div className="lg:col-span-6 flex flex-col items-start">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-lavender-subtle text-primary border border-primary-fixed-dim/50 shadow-sm mb-6">
                  <span className="w-2 h-2 rounded-full bg-electric-violet-bright animate-pulse"></span>
                  <span className="text-xs font-bold uppercase tracking-wider">PEER-TO-PEER MOBILITY</span>
                </div>

                <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold text-on-surface tracking-tight leading-[1.15]">
                  Find Your Ride. <br />
                  <span className="text-primary-container">Share Your Wheels.</span>
                </h1>

                <p className="text-base sm:text-lg text-on-surface-variant leading-relaxed max-w-xl mt-5">
                  Peer-to-peer vehicle rental marketplace. Discover verified cars, bikes and scooters near you. Rent by the hour or day, or earn with your own idle vehicle.
                </p>

                <div className="flex flex-wrap items-center gap-4 mt-8 w-full sm:w-auto">
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center gap-2 bg-primary-container hover:bg-electric-violet-hover text-on-primary font-bold text-base px-7 py-3.5 rounded-xl shadow-lg shadow-primary-container/25 active:scale-95 transition-all"
                  >
                    <span>Create Account</span>
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </Link>

                  <Link
                    to="/explore"
                    className="inline-flex items-center justify-center gap-2 bg-surface-card hover:bg-lavender-subtle text-on-surface font-bold text-base px-7 py-3.5 rounded-xl border border-border-subtle active:scale-95 transition-all shadow-sm"
                  >
                    <span className="material-symbols-outlined text-primary text-lg">search</span>
                    <span>Browse Vehicles</span>
                  </Link>
                </div>

                {/* Trust Badges */}
                <div className="flex flex-wrap items-center gap-y-2 gap-x-6 mt-10 pt-6 border-t border-border-purple-tint text-on-surface-variant text-xs sm:text-sm font-semibold">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-status-success text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                      check_circle
                    </span>
                    <span>Verified Hosts & Drivers</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-status-success text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                      security
                    </span>
                    <span>₹1 Crore Protection</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-status-success text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                      bolt
                    </span>
                    <span>Instant Digital Booking</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Platform Overview Card */}
              <div className="lg:col-span-6 flex justify-center">
                <div className="relative w-full rounded-3xl overflow-hidden bg-surface-card border border-border-purple-tint shadow-2xl p-8 flex flex-col justify-between min-h-[360px] bg-gradient-to-br from-surface-card to-surface-container-low">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-container text-white text-xs font-bold uppercase tracking-wider mb-4 shadow-sm">
                      <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
                      <span>Single Account Platform</span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-extrabold text-on-surface leading-snug">
                      Rent when you need. <br />Earn when you don't.
                    </h2>

                    <p className="text-xs sm:text-sm text-on-surface-variant mt-3 leading-relaxed max-w-md">
                      One registered account lets you both rent vehicles from nearby hosts and list your own personal vehicles with custom hourly and daily rates in Indian Rupees (₹).
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-6 border-t border-border-purple-tint mt-6">
                    <div className="p-3.5 rounded-2xl bg-surface-card border border-border-purple-tint">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary">For Renters</span>
                      <div className="text-xs font-bold text-on-surface mt-0.5">Instant booking with zero security deposit friction.</div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-surface-card border border-border-purple-tint">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">For Hosts</span>
                      <div className="text-xs font-bold text-on-surface mt-0.5">Complete control to approve or decline rental requests.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Vehicles Section */}
        <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-primary">POPULAR NEAR YOU</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-on-surface mt-1">Available Marketplace Rides</h2>
            </div>
            <Link
              to="/explore"
              className="inline-flex items-center gap-1 text-primary font-bold text-sm hover:underline"
            >
              <span>Explore All Vehicles</span>
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </Link>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs font-bold text-on-surface-variant">
              Loading vehicles...
            </div>
          ) : vehicles.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {vehicles.map(vehicle => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} />
              ))}
            </div>
          ) : (
            /* Exact Professional Empty State requested by user */
            <div className="bg-surface-card rounded-3xl border border-border-purple-tint p-12 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-lavender-subtle text-primary flex items-center justify-center mb-4 shadow-sm">
                <span className="material-symbols-outlined text-[32px]">directions_car</span>
              </div>
              <h3 className="text-lg font-bold text-on-surface">No vehicles available yet</h3>
              <p className="text-xs sm:text-sm text-on-surface-variant max-w-md mt-1.5 leading-relaxed">
                Be the first to list your vehicle! Share your car, motorcycle, or scooter with verified drivers and earn income.
              </p>
              <div className="flex items-center gap-3 mt-6">
                <Link
                  to="/list-vehicle"
                  className="px-6 py-2.5 rounded-xl bg-primary-container text-on-primary font-bold text-xs hover:bg-electric-violet-hover transition-all shadow-md shadow-primary/20 flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">add_circle</span>
                  <span>List Your Vehicle</span>
                </Link>
                <Link
                  to="/explore"
                  className="px-5 py-2.5 rounded-xl bg-surface-container-low text-on-surface font-bold text-xs hover:bg-lavender-subtle transition-all"
                >
                  Explore Marketplace
                </Link>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface-card border-t border-border-purple-tint py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary-container flex items-center justify-center text-on-primary">
              <span className="material-symbols-outlined text-[16px]">directions_car</span>
            </div>
            <span className="font-bold text-sm text-on-surface">RentWheels</span>
            <span className="text-xs text-on-surface-variant">© 2026. Peer-to-Peer Vehicle Marketplace.</span>
          </div>

          <div className="flex items-center gap-6 text-xs font-semibold text-on-surface-variant">
            <Link to="/explore" className="hover:text-primary">Explore Vehicles</Link>
            <Link to="/list-vehicle" className="hover:text-primary">Host a Vehicle</Link>
            <Link to="/login" className="hover:text-primary">Sign In</Link>
            <span className="text-primary font-bold">Indian Rupee (₹) Pricing</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
