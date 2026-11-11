import React, { useState, useEffect, useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { parseVehicleRow } from '../lib/vehicleUtils'
import VehicleCard from '../components/common/VehicleCard'

export default function ExplorePage() {
  const [searchParams] = useSearchParams()
  const initialQuery = searchParams.get('q') || ''

  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)

  const [searchKeyword, setSearchKeyword] = useState(initialQuery)
  const [selectedLocation, setSelectedLocation] = useState('all')
  const [selectedType, setSelectedType] = useState('all')
  const [sortBy, setSortBy] = useState('recommended')
  const [maxPrice, setMaxPrice] = useState(500) // max hourly price

  const locations = [
    { id: 'all', label: 'All Hubs' },
    { id: 'Koramangala', label: 'Koramangala, Bengaluru' },
    { id: 'Indiranagar', label: 'Indiranagar, Bengaluru' },
    { id: 'HSR Layout', label: 'HSR Layout, Bengaluru' },
    { id: 'Whitefield', label: 'Whitefield, Bengaluru' },
    { id: 'JP Nagar', label: 'JP Nagar, Bengaluru' },
  ]

  // Query live vehicles from Supabase
  useEffect(() => {
    async function fetchLiveVehicles() {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('vehicles')
          .select('*')

        if (!error && data) {
          setVehicles(data.map(parseVehicleRow))
        } else {
          setVehicles([])
        }
      } catch (err) {
        setVehicles([])
      } finally {
        setLoading(false)
      }
    }

    fetchLiveVehicles()
  }, [])

  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      // Keyword match
      if (searchKeyword.trim()) {
        const q = searchKeyword.toLowerCase()
        const matchTitle = `${v.brand || ''} ${v.model || ''}`.toLowerCase().includes(q)
        const matchLoc = (v.pickup_location || '').toLowerCase().includes(q)
        const matchType = (v.vehicle_type || '').toLowerCase().includes(q)
        if (!matchTitle && !matchLoc && !matchType) return false
      }

      // Type match
      if (selectedType !== 'all' && v.vehicle_type !== selectedType) {
        return false
      }

      // Location match
      if (selectedLocation !== 'all' && !(v.pickup_location || '').includes(selectedLocation)) {
        return false
      }

      // Price match
      if (v.hourly_price && v.hourly_price > maxPrice) {
        return false
      }

      return true
    }).sort((a, b) => {
      if (sortBy === 'price_asc') return (a.hourly_price || 0) - (b.hourly_price || 0)
      if (sortBy === 'price_desc') return (b.hourly_price || 0) - (a.hourly_price || 0)
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0)
      return 0
    })
  }, [vehicles, searchKeyword, selectedLocation, selectedType, sortBy, maxPrice])

  const handleReset = () => {
    setSearchKeyword('')
    setSelectedLocation('all')
    setSelectedType('all')
    setSortBy('recommended')
    setMaxPrice(500)
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header & Breadcrumb */}
      <div>
        <nav className="flex items-center gap-1.5 text-xs text-on-surface-variant font-semibold mb-2">
          <Link to="/home" className="hover:text-primary">Home</Link>
          <span>/</span>
          <span className="text-primary font-bold">Explore Vehicles</span>
        </nav>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-on-surface tracking-tight">
              Explore Available Vehicles
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
              Find verified cars, bikes or scooters for your next journey.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-card border border-border-purple-tint shadow-sm text-xs font-semibold text-on-surface">
            <span className={`w-2.5 h-2.5 rounded-full ${filteredVehicles.length > 0 ? 'bg-status-success animate-pulse' : 'bg-gray-400'}`}></span>
            <span>{filteredVehicles.length} Vehicles Available</span>
          </div>
        </div>
      </div>

      {/* Horizontal Search Panel */}
      <section className="bg-surface-card rounded-2xl border border-border-purple-tint p-4 sm:p-5 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          {/* Keyword Search */}
          <div className="lg:col-span-4 flex items-center gap-2.5 px-3.5 h-12 bg-surface-container-low rounded-xl focus-within:ring-2 focus-within:ring-primary-container/20 border border-border-purple-tint/50">
            <span className="material-symbols-outlined text-[20px] text-primary shrink-0">search</span>
            <div className="flex flex-col min-w-0 flex-1">
              <label className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider leading-none">Vehicle</label>
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Search Creta, Hunter 350, Ather..."
                className="bg-transparent text-xs sm:text-sm text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none truncate w-full mt-0.5"
              />
            </div>
            {searchKeyword && (
              <button onClick={() => setSearchKeyword('')} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>

          {/* Location Select */}
          <div className="lg:col-span-4 flex items-center gap-2.5 px-3.5 h-12 bg-surface-container-low rounded-xl focus-within:ring-2 focus-within:ring-primary-container/20 border border-border-purple-tint/50">
            <span className="material-symbols-outlined text-[20px] text-primary shrink-0">location_on</span>
            <div className="flex flex-col min-w-0 flex-1">
              <label className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider leading-none">Pickup Hub</label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="bg-transparent text-xs sm:text-sm text-on-surface font-semibold focus:outline-none truncate w-full mt-0.5 cursor-pointer"
              >
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Vehicle Type Tabs */}
          <div className="lg:col-span-4 flex items-center justify-between sm:justify-end gap-1.5 overflow-x-auto py-1">
            {['all', 'car', 'bike', 'scooter'].map(type => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3 py-2 rounded-xl text-xs font-bold capitalize transition-all shrink-0 ${
                  selectedType === type
                    ? 'bg-primary-container text-on-primary shadow-sm'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-lavender-subtle hover:text-primary'
                }`}
              >
                {type === 'all' ? 'All Types' : `${type}s`}
              </button>
            ))}
          </div>
        </div>

        {/* Second Row: Max Hourly Price & Sort */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 pt-3 border-t border-border-purple-tint">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Max Rate: <span className="text-primary font-bold">₹{maxPrice}/hr</span>
            </span>
            <input
              type="range"
              min="40"
              max="500"
              step="10"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-36 accent-primary cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-surface-container-low border border-border-purple-tint rounded-lg px-2.5 py-1 text-xs font-semibold text-on-surface focus:outline-none cursor-pointer"
            >
              <option value="recommended">Recommended</option>
              <option value="price_asc">Price: Low to High (₹)</option>
              <option value="price_desc">Price: High to Low (₹)</option>
              <option value="rating">Top Customer Rated</option>
            </select>

            {(searchKeyword || selectedLocation !== 'all' || selectedType !== 'all' || maxPrice < 500) && (
              <button
                onClick={handleReset}
                className="text-xs text-error font-bold hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">refresh</span>
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Results Grid or Clean Professional Empty State */}
      {loading ? (
        <div className="py-16 text-center flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
          <span className="text-xs font-bold text-on-surface-variant">Loading vehicles...</span>
        </div>
      ) : filteredVehicles.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVehicles.map(vehicle => (
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
          </div>
        </div>
      )}
    </div>
  )
}
