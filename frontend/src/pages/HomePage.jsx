import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { parseVehicleRow } from '../lib/vehicleUtils'
import VehicleCard from '../components/common/VehicleCard'

export default function HomePage() {
  const { profile } = useAuth()
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)

  const categories = [
    { id: 'all', label: 'All Rides', icon: 'apps' },
    { id: 'car', label: 'Cars & SUVs', icon: 'directions_car' },
    { id: 'bike', label: 'Cruiser Bikes', icon: 'two_wheeler' },
    { id: 'scooter', label: 'Electric Scooters', icon: 'electric_scooter' },
  ]

  // Fetch actual vehicle listings from Supabase
  useEffect(() => {
    async function fetchLiveVehicles() {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('vehicles')
          .select('*')
          .eq('availability_status', 'available')

        if (error) {
          console.warn('Vehicles query note:', error.message)
          setVehicles([])
        } else {
          setVehicles((data || []).map(parseVehicleRow))
        }
      } catch (err) {
        console.warn('Vehicles fetch exception:', err)
        setVehicles([])
      } finally {
        setLoading(false)
      }
    }

    fetchLiveVehicles()
  }, [])

  const filteredVehicles = selectedCategory === 'all'
    ? vehicles
    : vehicles.filter(v => v.vehicle_type === selectedCategory)

  const userName = profile?.full_name || 'Anoop Kumar'

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-primary to-primary-container text-white p-6 sm:p-10 shadow-xl">
        <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-white/5 skew-x-12 pointer-events-none"></div>

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold uppercase tracking-wider mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Welcome back, {userName}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            Ready to hit the road today?
          </h1>
          <p className="text-white/80 text-sm sm:text-base mt-2.5 leading-relaxed">
            Peer-to-peer vehicle sharing community. Rent vehicles from verified hosts or earn by listing your idle ride.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-primary font-bold text-sm shadow-md hover:bg-gray-100 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">explore</span>
              <span>Find Nearby Rides</span>
            </Link>

            <Link
              to="/list-vehicle"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-sm border border-white/20 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span>List Your Vehicle</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Action Cards Row */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Reservation Status Card */}
        <div className="bg-surface-card rounded-2xl border border-border-purple-tint p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-primary mb-2">
              <span>Rental Trips</span>
              <span className="material-symbols-outlined text-primary text-[18px]">calendar_today</span>
            </div>
            <h3 className="text-base font-bold text-on-surface">No Active Trips</h3>
            <p className="text-xs text-on-surface-variant mt-1">
              You don't have any upcoming vehicle reservations. Browse available cars and bikes to plan your next journey.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-border-purple-tint">
            <Link to="/explore" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
              <span>Browse Vehicles</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </Link>
          </div>
        </div>

        {/* Host Opportunity Card */}
        <div className="bg-surface-card rounded-2xl border border-border-purple-tint p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-secondary mb-2">
              <span>Host Opportunity</span>
              <span className="material-symbols-outlined text-primary text-[18px]">monetization_on</span>
            </div>
            <h3 className="text-base font-bold text-on-surface">Earn with your Idle Vehicle</h3>
            <p className="text-xs text-on-surface-variant mt-1">
              List your car, bike or scooter. Set your own hourly and daily rental prices in Indian Rupees (₹).
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-border-purple-tint">
            <Link to="/list-vehicle" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
              <span>Start by Listing a Vehicle</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </Link>
          </div>
        </div>

        {/* Safety & Coverage Card */}
        <div className="bg-surface-card rounded-2xl border border-border-purple-tint p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-tertiary mb-2">
              <span>RentWheels Trust</span>
              <span className="material-symbols-outlined text-emerald-600 text-[18px]">shield</span>
            </div>
            <h3 className="text-base font-bold text-on-surface">Comprehensive Cover</h3>
            <p className="text-xs text-on-surface-variant mt-1">
              Every trip includes roadside assistance, zero-liability host coverage, and verified driver credentials.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-border-purple-tint flex items-center gap-2 text-xs text-on-surface-variant font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>24/7 Roadside Assistance</span>
          </div>
        </div>
      </section>

      {/* Explore Category Filters & Real Listings Section */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-on-surface">Browse by Vehicle Category</h2>
            <p className="text-xs sm:text-sm text-on-surface-variant">Select a category to filter verified community listings.</p>
          </div>

          {/* Category Chips */}
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-primary-container text-on-primary shadow-md'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-lavender-subtle hover:text-primary'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Real Vehicle Listings or Clean Professional Empty State */}
        {loading ? (
          <div className="py-16 text-center flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
            <span className="text-xs font-bold text-on-surface-variant">Loading verified vehicles...</span>
          </div>
        ) : filteredVehicles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-2">
            {filteredVehicles.map(vehicle => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
        ) : (
          /* Exact Professional Empty State requested by user */
          <div className="bg-surface-card rounded-3xl border border-border-purple-tint p-12 text-center flex flex-col items-center justify-center mt-2">
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
    </div>
  )
}
