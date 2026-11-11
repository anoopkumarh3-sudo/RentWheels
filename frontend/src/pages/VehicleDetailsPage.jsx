import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { parseVehicleRow, formatINR } from '../lib/vehicleUtils'
import UserAvatar from '../components/common/UserAvatar'
import { message } from 'antd'

export default function VehicleDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [vehicle, setVehicle] = useState(null)
  const [owner, setOwner] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Default dates: tomorrow 09:00 AM to 2 days later 18:00 PM
  const now = new Date()
  const defaultStart = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
  const defaultEnd = new Date(now.getTime() + 72 * 60 * 60 * 1000).toISOString().slice(0, 16)

  const [startDateTime, setStartDateTime] = useState(defaultStart)
  const [endDateTime, setEndDateTime] = useState(defaultEnd)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  // Fetch vehicle by id from Supabase
  useEffect(() => {
    async function loadVehicleDetails() {
      setLoading(true)
      setError(null)

      try {
        const { data, error: vError } = await supabase
          .from('vehicles')
          .select('*')
          .eq('id', id)
          .single()

        if (vError || !data) {
          setError('Vehicle listing not found or is no longer available.')
          setVehicle(null)
          return
        }

        const parsed = parseVehicleRow(data)
        setVehicle(parsed)

        // Fetch owner profile
        if (parsed.owner_id) {
          const { data: ownerData } = await supabase
            .from('profiles')
            .select('id, full_name, profile_image, phone')
            .eq('id', parsed.owner_id)
            .maybeSingle()

          if (ownerData) {
            setOwner(ownerData)
          }
        }
      } catch (err) {
        console.error('Error fetching vehicle details:', err)
        setError('Failed to load vehicle details.')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      loadVehicleDetails()
    }
  }, [id])

  // Calculate duration and price breakdown
  const calculation = useMemo(() => {
    if (!vehicle) {
      return { totalHours: 0, totalDays: 0, rentalFee: 0, insuranceFee: 99, totalAmount: 99, isValid: false }
    }

    const start = new Date(startDateTime).getTime()
    const end = new Date(endDateTime).getTime()

    if (isNaN(start) || isNaN(end) || end <= start) {
      return { totalHours: 0, totalDays: 0, rentalFee: 0, insuranceFee: 99, totalAmount: 99, isValid: false }
    }

    const diffHours = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60)))
    const diffDays = Number((diffHours / 24).toFixed(1))

    let rentalFee = 0
    if (diffHours >= 24) {
      const fullDays = Math.floor(diffHours / 24)
      const remHours = diffHours % 24
      rentalFee = (fullDays * vehicle.daily_price) + (remHours * vehicle.hourly_price)
    } else {
      rentalFee = diffHours * vehicle.hourly_price
    }

    const insuranceFee = 99
    const totalAmount = rentalFee + insuranceFee

    return {
      totalHours: diffHours,
      totalDays: diffDays,
      rentalFee,
      insuranceFee,
      totalAmount,
      isValid: true
    }
  }, [startDateTime, endDateTime, vehicle])

  const isOwner = user?.id && vehicle?.owner_id === user.id

  const handleProceed = () => {
    if (isOwner) {
      message.warning('You are the owner of this vehicle. Self-booking is not allowed.')
      return
    }

    if (!calculation.isValid) {
      message.error('Please select a valid return date and time after the pickup time.')
      return
    }

    const checkoutUrl = `/checkout/${vehicle.id}?start=${encodeURIComponent(startDateTime)}&end=${encodeURIComponent(endDateTime)}`

    if (!user) {
      message.info('Please sign in to confirm your booking and proceed to checkout.')
      navigate('/login', { state: { returnUrl: checkoutUrl } })
      return
    }

    navigate(checkoutUrl)
  }

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs font-bold text-on-surface-variant">Loading vehicle details...</span>
      </div>
    )
  }

  if (error || !vehicle) {
    return (
      <div className="bg-surface-card rounded-3xl border border-border-purple-tint p-12 text-center flex flex-col items-center max-w-md mx-auto my-12">
        <div className="w-16 h-16 rounded-2xl bg-lavender-subtle text-primary flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-[32px]">directions_car</span>
        </div>
        <h2 className="text-xl font-bold text-on-surface">Vehicle Not Found</h2>
        <p className="text-xs sm:text-sm text-on-surface-variant mt-2 leading-relaxed">
          {error || 'This vehicle is currently unavailable or has been unlisted by its owner.'}
        </p>
        <button
          onClick={() => navigate('/explore')}
          className="mt-6 px-6 py-2.5 rounded-xl bg-primary-container text-on-primary font-bold text-xs shadow-md"
        >
          Browse All Vehicles
        </button>
      </div>
    )
  }

  const primaryImage = vehicle.images?.[selectedImageIndex] || vehicle.images?.[0]
  const ownerName = owner?.full_name || 'Verified RentWheels Host'
  const ownerImage = owner?.profile_image || null

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-on-surface-variant font-semibold">
        <Link to="/home" className="hover:text-primary">Home</Link>
        <span>/</span>
        <Link to="/explore" className="hover:text-primary">Explore</Link>
        <span>/</span>
        <span className="text-primary font-bold">{vehicle.brand} {vehicle.model}</span>
      </nav>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Gallery, Specs, Description & Map (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Main Image Banner */}
          <div className="bg-surface-card rounded-3xl border border-border-purple-tint overflow-hidden shadow-sm">
            <div className="relative aspect-[16/10] w-full bg-surface-container">
              <img
                src={primaryImage}
                alt={`${vehicle.brand} ${vehicle.model}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4 flex gap-2">
                <span className="px-3 py-1 rounded-full bg-primary text-white text-xs font-bold uppercase tracking-wider shadow-md">
                  {vehicle.vehicle_type}
                </span>
                <span className="px-3 py-1 rounded-full bg-surface-card/90 backdrop-blur-md text-emerald-600 text-xs font-bold shadow-md flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Instant Booking</span>
                </span>
              </div>
            </div>

            {/* Thumbnail selector */}
            {vehicle.images?.length > 1 && (
              <div className="flex items-center gap-3 p-4 overflow-x-auto border-t border-border-purple-tint bg-surface-container-low">
                {vehicle.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative w-20 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                      selectedImageIndex === idx ? 'border-primary ring-2 ring-primary/20 scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-surface-card border border-border-purple-tint flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Category</span>
              <span className="text-sm font-bold text-on-surface capitalize mt-1">{vehicle.vehicle_type}</span>
            </div>
            <div className="p-4 rounded-2xl bg-surface-card border border-border-purple-tint flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Fuel Type</span>
              <span className="text-sm font-bold text-on-surface mt-1">{vehicle.fuel_type || 'Petrol'}</span>
            </div>
            <div className="p-4 rounded-2xl bg-surface-card border border-border-purple-tint flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Transmission</span>
              <span className="text-sm font-bold text-on-surface mt-1">{vehicle.transmission || 'Automatic'}</span>
            </div>
            <div className="p-4 rounded-2xl bg-surface-card border border-border-purple-tint flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Seating</span>
              <span className="text-sm font-bold text-on-surface mt-1">{vehicle.seats || (vehicle.vehicle_type === 'car' ? 5 : 2)} Persons</span>
            </div>
          </div>

          {/* Description Card */}
          <div className="bg-surface-card rounded-3xl border border-border-purple-tint p-6 sm:p-8 shadow-sm">
            <h2 className="text-lg font-bold text-on-surface mb-3">Vehicle Overview</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              {vehicle.description || 'Well-maintained personal vehicle available for hourly and daily self-drive rentals on RentWheels.'}
            </p>
          </div>

          {/* Verified Owner Card */}
          <div className="bg-surface-card rounded-3xl border border-border-purple-tint p-6 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <UserAvatar
                name={ownerName}
                imageUrl={ownerImage}
                size="lg"
                showBadge={true}
              />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-on-surface">{ownerName}</h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                    Verified Host
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant mt-0.5">RentWheels Community Host</p>
              </div>
            </div>

            {isOwner && (
              <span className="px-3 py-1 bg-lavender-subtle text-primary rounded-xl text-xs font-bold">
                Your Listing
              </span>
            )}
          </div>

          {/* Pickup Location Hub */}
          <div className="bg-surface-card rounded-3xl border border-border-purple-tint p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-bold text-on-surface">Pickup Location Hub</h3>
                <p className="text-xs text-on-surface-variant">{vehicle.pickup_location}</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-lavender-subtle text-primary text-xs font-bold">
                Bengaluru Hub
              </span>
            </div>

            <div className="relative h-44 w-full rounded-2xl overflow-hidden bg-surface-container-low border border-border-purple-tint flex items-center justify-center">
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-xl">
                  <span className="material-symbols-outlined text-[24px]">location_on</span>
                </div>
                <div className="mt-2 bg-surface-card px-3 py-1.5 rounded-xl shadow-sm border border-border-purple-tint text-xs font-bold text-on-surface text-center">
                  <div>{vehicle.pickup_location}</div>
                  <div className="text-[10px] text-primary font-semibold">Exact address shared upon host confirmation</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Booking Widget (5 Cols) */}
        <div className="lg:col-span-5 sticky top-24">
          <div className="bg-surface-card rounded-3xl border border-border-purple-tint p-6 shadow-xl flex flex-col gap-5">
            {/* Rates Header */}
            <div className="flex items-baseline justify-between border-b border-border-purple-tint pb-4">
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-primary">{formatINR(vehicle.hourly_price)}</span>
                  <span className="text-xs text-on-surface-variant font-semibold">/hour</span>
                </div>
                <div className="text-xs text-on-surface-variant mt-0.5">
                  or <span className="font-bold text-on-surface">{formatINR(vehicle.daily_price)}</span> per day
                </div>
              </div>

              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                vehicle.availability_status === 'available'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {vehicle.availability_status === 'available' ? 'Available' : 'Paused'}
              </span>
            </div>

            {/* Rental Date/Time Pickers */}
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Pickup Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={startDateTime}
                  onChange={(e) => setStartDateTime(e.target.value)}
                  className="w-full h-11 px-3.5 bg-surface-container-low border border-border-purple-tint rounded-xl text-xs sm:text-sm font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container/20 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Return Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={endDateTime}
                  onChange={(e) => setEndDateTime(e.target.value)}
                  className="w-full h-11 px-3.5 bg-surface-container-low border border-border-purple-tint rounded-xl text-xs sm:text-sm font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container/20 cursor-pointer"
                />
              </div>
            </div>

            {/* Price Breakdown - Clickable to proceed directly to checkout */}
            {calculation.isValid && (
              <div
                onClick={handleProceed}
                className="p-4 rounded-2xl bg-surface-container-low border border-border-purple-tint/60 flex flex-col gap-2 cursor-pointer hover:border-primary-container/60 hover:bg-lavender-subtle/40 transition-all group"
                title="Click to proceed to Checkout & Payment"
              >
                <div className="flex justify-between text-xs text-on-surface-variant font-semibold">
                  <span>Duration</span>
                  <span className="font-bold text-on-surface">{calculation.totalHours} hrs ({calculation.totalDays} days)</span>
                </div>
                <div className="flex justify-between text-xs text-on-surface-variant font-semibold">
                  <span>Base Rental Fee</span>
                  <span className="font-bold text-on-surface">{formatINR(calculation.rentalFee)}</span>
                </div>
                <div className="flex justify-between text-xs text-on-surface-variant font-semibold">
                  <span>Standard Insurance</span>
                  <span className="font-bold text-on-surface">{formatINR(calculation.insuranceFee)}</span>
                </div>
                <div className="pt-2 border-t border-border-purple-tint flex justify-between items-baseline">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">Estimated Total</span>
                    <span className="material-symbols-outlined text-[16px] text-primary group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                  </div>
                  <span className="text-lg font-extrabold text-primary">{formatINR(calculation.totalAmount)}</span>
                </div>
              </div>
            )}

            {/* Self-booking warning or Action CTA */}
            {isOwner ? (
              <div className="p-3.5 rounded-2xl bg-lavender-subtle text-primary border border-primary-fixed-dim/40 text-center">
                <p className="text-xs font-bold">You are the host of this vehicle.</p>
                <button
                  type="button"
                  onClick={() => navigate('/list-vehicle')}
                  className="mt-2 w-full py-2 bg-primary-container text-on-primary rounded-xl text-xs font-bold hover:bg-electric-violet-hover transition-colors"
                >
                  Manage Listing in Host Hub
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleProceed}
                disabled={vehicle.availability_status !== 'available'}
                className="w-full py-3.5 rounded-xl bg-primary-container hover:bg-electric-violet-hover disabled:bg-surface-container disabled:text-on-surface-variant/40 text-on-primary font-bold text-sm shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">calendar_today</span>
                <span>Request Booking</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
