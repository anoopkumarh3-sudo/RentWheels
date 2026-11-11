import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { parseVehicleRow } from '../lib/vehicleUtils'
import StatusBadge from '../components/common/StatusBadge'
import { message } from 'antd'

const DEFAULT_TRIP_IMAGE = 'https://lh3.googleusercontent.com/aida-public/AB6AXuD1DEvl0EiCMCipiHb082rhJ_wQmGSpBAVltv9-9ump0sSDxtHjghBZHuWQVysRdmIDro6BsbDS8nwHaSPJFECIvfls_2nr8YvuaKdl57awUbM3kzBvy7tezLAi_toY11olQnJg7S9Tf7DWIhb9eWElK0UjtkB-SGZ4i53Qi6jTtALyGcoI0xyLjFpSB2FH7QUwChcBrXNSXyvnwbOwMp_Y5YzkioLeDeVY4bD2sdES'

export default function MyBookingsPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('all')
  const [bookingsList, setBookingsList] = useState([])
  const [loading, setLoading] = useState(false)

  const tabs = [
    { id: 'all', label: 'All Trips' },
    { id: 'active', label: 'Active & Upcoming' },
    { id: 'completed', label: 'Completed' },
    { id: 'cancelled', label: 'Cancelled' }
  ]

  const fetchUserBookings = useCallback(async () => {
    if (!user?.id) {
      setBookingsList([])
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, vehicles(*)')
        .eq('renter_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.warn('Fetch user bookings note:', error.message)
        setBookingsList([])
      } else {
        const parsed = (data || []).map(b => {
          const v = b.vehicles ? parseVehicleRow(b.vehicles) : null
          return {
            ...b,
            vehicle: {
              brand: v?.brand || 'Hyundai',
              model: v?.model || 'Creta SX(O) 2024',
              image: v?.images?.[0] || DEFAULT_TRIP_IMAGE,
              pickup_location: v?.pickup_location || 'Indiranagar Smart Hub, Bengaluru'
            }
          }
        })
        setBookingsList(parsed)
      }
    } catch (err) {
      console.warn('Bookings fetch exception:', err)
      setBookingsList([])
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchUserBookings()
  }, [fetchUserBookings])

  const filteredBookings = bookingsList.filter(b => {
    if (activeTab === 'all') return true
    if (activeTab === 'active') return b.booking_status === 'approved' || b.booking_status === 'requested' || b.booking_status === 'confirmed'
    if (activeTab === 'completed') return b.booking_status === 'completed'
    if (activeTab === 'cancelled') return b.booking_status === 'cancelled'
    return true
  })

  const handleCancelBooking = async (bookingId) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ booking_status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', bookingId)
        .eq('renter_id', user?.id)

      if (error) {
        console.warn('Cancel booking note:', error.message)
      }

      setBookingsList(prev => prev.map(b => {
        if (b.id === bookingId) {
          return { ...b, booking_status: 'cancelled' }
        }
        return b
      }))
      message.info('Booking has been cancelled.')
    } catch (err) {
      message.error(err.message || 'Failed to cancel booking.')
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div>
        <nav className="flex items-center gap-1.5 text-xs text-on-surface-variant font-semibold mb-2">
          <Link to="/home" className="hover:text-primary transition-colors">Home</Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-primary font-bold">My Bookings</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-on-surface tracking-tight">
              My Rental Trips
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
              Track your reservations, view pickup hubs, and manage your trips.
            </p>
          </div>

          <Link
            to="/explore"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-container text-on-primary font-bold text-xs hover:bg-electric-violet-hover self-start sm:self-auto transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>Book New Ride</span>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border-purple-tint pb-1 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
              activeTab === tab.id
                ? 'bg-primary-container text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:bg-lavender-subtle hover:text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="min-h-[30vh] flex flex-col items-center justify-center gap-3">
          <div className="w-9 h-9 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-bold text-on-surface-variant">Loading your trips...</span>
        </div>
      ) : filteredBookings.length > 0 ? (
        <div className="flex flex-col gap-4">
          {filteredBookings.map(item => (
            <div
              key={item.id}
              className="bg-surface-card rounded-3xl border border-border-purple-tint p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col lg:flex-row lg:items-center justify-between gap-5"
            >
              {/* Vehicle & Trip Info */}
              <div className="flex items-start sm:items-center gap-4">
                <img
                  src={item.vehicle?.image || DEFAULT_TRIP_IMAGE}
                  alt={item.vehicle?.model}
                  className="w-24 h-20 sm:w-28 sm:h-24 rounded-2xl object-cover shrink-0 border border-border-purple-tint bg-surface-container"
                />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                      {item.vehicle?.brand}
                    </span>
                    <StatusBadge status={item.booking_status} />
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-on-surface">
                    {item.vehicle?.model}
                  </h3>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-on-surface-variant mt-2">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px] text-primary">event</span>
                      <span>
                        {new Date(item.start_datetime).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} - {new Date(item.end_datetime).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px] text-primary">schedule</span>
                      <span>{item.total_hours} Hours</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px] text-primary">location_on</span>
                      <span>{item.vehicle?.pickup_location}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Price and Actions */}
              <div className="flex sm:items-center justify-between lg:justify-end gap-5 pt-3 lg:pt-0 border-t lg:border-t-0 border-border-purple-tint">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Total Paid</div>
                  <div className="text-xl font-extrabold text-primary">₹{Number(item.total_amount).toLocaleString('en-IN')}</div>
                  <div className="text-[10px] text-emerald-600 font-semibold">Razorpay Test Mode</div>
                </div>

                <div className="flex items-center gap-2">
                  {item.vehicle_id && (
                    <Link
                      to={`/vehicle/${item.vehicle_id}`}
                      className="px-3.5 py-2 rounded-xl bg-surface-container-low text-on-surface font-bold text-xs hover:bg-lavender-subtle transition-colors"
                    >
                      View Vehicle
                    </Link>
                  )}

                  {(item.booking_status === 'approved' || item.booking_status === 'requested' || item.booking_status === 'confirmed') && (
                    <button
                      onClick={() => handleCancelBooking(item.id)}
                      className="px-3.5 py-2 rounded-xl bg-red-50 text-error font-bold text-xs hover:bg-red-100 transition-colors"
                    >
                      Cancel Trip
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Clean Professional Empty State */
        <div className="bg-surface-card rounded-3xl border border-border-purple-tint p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-lavender-subtle text-primary flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-[32px]">calendar_today</span>
          </div>
          <h3 className="text-lg font-bold text-on-surface">No bookings in this category</h3>
          <p className="text-xs sm:text-sm text-on-surface-variant max-w-sm mt-1">
            Browse our community fleet to find and rent your next ride easily.
          </p>
          <Link
            to="/explore"
            className="mt-5 px-5 py-2.5 rounded-xl bg-primary-container text-on-primary font-bold text-xs hover:bg-electric-violet-hover transition-all shadow-md"
          >
            Explore Vehicles
          </Link>
        </div>
      )}
    </div>
  )
}
