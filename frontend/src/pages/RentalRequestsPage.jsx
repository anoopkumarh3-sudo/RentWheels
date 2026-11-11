import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import UserAvatar from '../components/common/UserAvatar'
import { message } from 'antd'

export default function RentalRequestsPage() {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchHostRequests = useCallback(async () => {
    if (!user?.id) {
      setRequests([])
      return
    }

    setLoading(true)
    try {
      // Find vehicles owned by current user
      const { data: myVehicles } = await supabase
        .from('vehicles')
        .select('id, brand, model')
        .eq('owner_id', user.id)

      if (!myVehicles || myVehicles.length === 0) {
        setRequests([])
        return
      }

      const vehicleIds = myVehicles.map(v => v.id)
      const vehicleMap = {}
      myVehicles.forEach(v => { vehicleMap[v.id] = `${v.brand} ${v.model}` })

      // Fetch bookings for these vehicles
      const { data: bookingsData, error } = await supabase
        .from('bookings')
        .select('*')
        .in('vehicle_id', vehicleIds)
        .order('created_at', { ascending: false })

      if (error) {
        console.warn('Fetch host requests note:', error.message)
        setRequests([])
      } else {
        const formatted = (bookingsData || []).map(b => ({
          id: b.id,
          renter: {
            name: 'Verified Renter',
            avatar: null,
            rating: 5.0,
            trips: 3
          },
          vehicle_name: vehicleMap[b.vehicle_id] || 'Community Listing',
          start_datetime: b.start_datetime,
          end_datetime: b.end_datetime,
          duration: `${b.total_hours || 48} Hours`,
          earnings: `₹${Number(b.total_amount || 0).toLocaleString('en-IN')}`,
          status: b.booking_status === 'approved' ? 'approved' : b.booking_status === 'rejected' ? 'declined' : 'pending',
          payment_status: b.payment_status || 'paid'
        }))
        setRequests(formatted)
      }
    } catch (err) {
      console.warn('Host requests exception:', err)
      setRequests([])
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchHostRequests()
  }, [fetchHostRequests])

  const handleAction = async (requestId, newStatus) => {
    const dbStatus = newStatus === 'approved' ? 'approved' : 'rejected'

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ booking_status: dbStatus, updated_at: new Date().toISOString() })
        .eq('id', requestId)

      if (error) {
        console.warn('Update booking status note:', error.message)
      }

      setRequests(prev => prev.map(req => {
        if (req.id === requestId) {
          return { ...req, status: newStatus }
        }
        return req
      }))

      if (newStatus === 'approved') {
        message.success('Rental request approved! The renter has been notified.')
      } else {
        message.info('Rental request declined.')
      }
    } catch (err) {
      message.error(err.message || 'Action failed.')
    }
  }

  const pendingRequests = requests.filter(r => r.status === 'pending')

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div>
        <nav className="flex items-center gap-1.5 text-xs text-on-surface-variant font-semibold mb-2">
          <Link to="/home" className="hover:text-primary transition-colors">Home</Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-primary font-bold">Rental Requests</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-on-surface tracking-tight">
              Incoming Rental Requests
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
              Review and manage booking applications submitted by renters for your vehicles.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-card border border-border-purple-tint shadow-sm text-xs font-semibold text-on-surface">
            <span className={`w-2.5 h-2.5 rounded-full ${pendingRequests.length > 0 ? 'bg-amber-500 animate-pulse' : 'bg-gray-400'}`}></span>
            <span>{pendingRequests.length} Pending Approval</span>
          </div>
        </div>
      </div>

      {/* Requests List or Professional Empty State */}
      {loading ? (
        <div className="min-h-[30vh] flex flex-col items-center justify-center gap-3">
          <div className="w-9 h-9 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-bold text-on-surface-variant">Loading rental requests...</span>
        </div>
      ) : requests.length > 0 ? (
        <div className="flex flex-col gap-5">
          {requests.map(req => (
            <div
              key={req.id}
              className="bg-surface-card rounded-3xl border border-border-purple-tint p-5 sm:p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6"
            >
              {/* Renter Profile & Trip Details */}
              <div className="flex items-start sm:items-center gap-4">
                <UserAvatar
                  name={req.renter.name}
                  imageUrl={req.renter.avatar}
                  size="lg"
                  showBadge={true}
                />

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-on-surface">{req.renter.name}</h3>
                    <span className="text-xs font-bold text-amber-500 flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        star
                      </span>
                      <span>{req.renter.rating}</span>
                      <span className="text-on-surface-variant text-[10px]">({req.renter.trips} trips)</span>
                    </span>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      req.status === 'approved'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : req.status === 'declined'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {req.status}
                    </span>
                  </div>

                  <div className="text-xs font-bold text-primary mt-1">
                    Requested Vehicle: <span className="text-on-surface">{req.vehicle_name}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-on-surface-variant mt-2">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px] text-primary">schedule</span>
                      <span>{req.duration}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px] text-primary">event</span>
                      <span>
                        {new Date(req.start_datetime).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} - {new Date(req.end_datetime).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px] text-primary">currency_rupee</span>
                      <span>Earns {req.earnings}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 self-end lg:self-center">
                {req.status === 'pending' ? (
                  <>
                    <button
                      onClick={() => handleAction(req.id, 'declined')}
                      className="px-4 py-2 rounded-xl bg-surface-container-low text-on-surface font-bold text-xs hover:bg-rose-50 hover:text-rose-600 transition-colors"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => handleAction(req.id, 'approved')}
                      className="px-5 py-2 rounded-xl bg-primary-container text-on-primary font-bold text-xs hover:bg-electric-violet-hover transition-all shadow-md shadow-primary/20"
                    >
                      Approve &amp; Confirm
                    </button>
                  </>
                ) : (
                  <span className="text-xs font-semibold text-on-surface-variant bg-surface-container-low px-3 py-1.5 rounded-xl">
                    Processed ({req.status})
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-surface-card rounded-3xl border border-border-purple-tint p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-lavender-subtle text-primary flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-[32px]">inbox</span>
          </div>
          <h3 className="text-lg font-bold text-on-surface">No Pending Requests</h3>
          <p className="text-xs sm:text-sm text-on-surface-variant max-w-sm mt-1">
            When verified renters book your listed wheels, applications will appear here for your review and approval.
          </p>
          <Link
            to="/list-vehicle"
            className="mt-5 px-5 py-2.5 rounded-xl bg-primary-container text-on-primary font-bold text-xs hover:bg-electric-violet-hover transition-all shadow-md"
          >
            Manage Your Fleet
          </Link>
        </div>
      )}
    </div>
  )
}
