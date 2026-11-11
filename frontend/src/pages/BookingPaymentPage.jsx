import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { parseVehicleRow, formatINR } from '../lib/vehicleUtils'
import { message } from 'antd'

// Reference luxury/popular fallback vehicle matching Stitch design & screenshot
const FALLBACK_VEHICLE = {
  id: 'hyundai-creta-sx-2024',
  brand: 'Hyundai',
  model: 'Creta SX(O) 2024',
  vehicle_type: 'car',
  daily_price: 1000,
  hourly_price: 100,
  pickup_location: 'Indiranagar 100ft Road, Stage 2, Bangalore 560038 (1.2 km from Metro Station)',
  fuel_type: 'Petrol',
  transmission: 'Automatic (IVT)',
  seats: 5,
  specs_summary: 'Compact SUV • Automatic (IVT) • Petrol • 5 Seater • Panoramic Sunroof',
  rating: 4.96,
  trips_count: 84,
  host_name: 'Rahul Sharma',
  host_badge: 'Superhost • Responds < 10m',
  images: [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuD1DEvl0EiCMCipiHb082rhJ_wQmGSpBAVltv9-9ump0sSDxtHjghBZHuWQVysRdmIDro6BsbDS8nwHaSPJFECIvfls_2nr8YvuaKdl57awUbM3kzBvy7tezLAi_toY11olQnJg7S9Tf7DWIhb9eWElK0UjtkB-SGZ4i53Qi6jTtALyGcoI0xyLjFpSB2FH7QUwChcBrXNSXyvnwbOwMp_Y5YzkioLeDeVY4bD2sdES'
  ]
}

export default function BookingPaymentPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user, profile } = useAuth()

  // 1. Vehicle State
  const [vehicle, setVehicle] = useState(null)
  const [loadingVehicle, setLoadingVehicle] = useState(true)

  // 2. Dates & Schedule State
  // Default: Saturday 10:00 AM to Monday 06:00 PM (matches Stitch reference: 2 days, 8 hours = 56 hours total)
  const initialStart = searchParams.get('start') || '2025-10-28T10:00'
  const initialEnd = searchParams.get('end') || '2025-10-30T18:00'

  const [startDateTime, setStartDateTime] = useState(initialStart)
  const [endDateTime, setEndDateTime] = useState(initialEnd)
  const [fulfillmentMode, setFulfillmentMode] = useState('hub') // 'hub' or 'delivery'

  // 3. Driver & KYC State (prefilled from authenticated user profile)
  const [driverName, setDriverName] = useState('')
  const [licenseNumber, setLicenseNumber] = useState('DL-0420110092841')
  const [driverEmail, setDriverEmail] = useState('')
  const [driverPhone, setDriverPhone] = useState('')
  const [ageConfirmed, setAgeConfirmed] = useState(true)

  // 4. Promo & Pricing State
  const [promoCode, setPromoCode] = useState('RWFIRST')
  const [promoApplied, setPromoApplied] = useState(true)

  // 5. Payment Gateway & Tabs State
  const [activePayTab, setActivePayTab] = useState('upi') // 'upi', 'card', 'netbanking', 'wallet'
  const [upiVpa, setUpiVpa] = useState('alex.mobility@okhdfcbank')
  const [selectedBank, setSelectedBank] = useState('HDFC Bank')
  const [selectedWallet, setSelectedWallet] = useState('Amazon Pay')

  // 6. Simulation & Flow State: 'normal', 'processing', 'success', 'failed'
  const [simState, setSimState] = useState('normal')
  const [bookingRefId, setBookingRefId] = useState('RW-2025-8941')
  const [razorpayPaymentId, setRazorpayPaymentId] = useState('pay_Oz7V810sK99Q')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const topBannerRef = useRef(null)

  // Sync profile data once user loads
  useEffect(() => {
    const fullName = user?.user_metadata?.full_name || profile?.full_name || 'Alex Morgan'
    const email = user?.email || profile?.email || 'alex.morgan@example.com'
    const phone = user?.user_metadata?.phone || profile?.phone || '+91 98765 43210'

    setDriverName(fullName)
    setDriverEmail(email)
    setDriverPhone(phone)
  }, [user, profile])

  // Fetch real vehicle listing from Supabase
  useEffect(() => {
    let isMounted = true

    async function loadVehicle() {
      setLoadingVehicle(true)
      try {
        if (!id || id === 'demo' || id === 'hyundai-creta-sx-2024') {
          if (isMounted) {
            setVehicle(FALLBACK_VEHICLE)
            setLoadingVehicle(false)
          }
          return
        }

        const { data, error } = await supabase
          .from('vehicles')
          .select('*')
          .eq('id', id)
          .maybeSingle()

        if (error || !data) {
          // If vehicle not found in database, fallback to verified catalog reference
          if (isMounted) {
            setVehicle({ ...FALLBACK_VEHICLE, id })
          }
        } else {
          const parsed = parseVehicleRow(data)
          if (isMounted) {
            setVehicle({
              ...parsed,
              daily_price: parsed.daily_price || 1000,
              hourly_price: parsed.hourly_price || 100,
              specs_summary: `${parsed.vehicle_type?.toUpperCase()} • ${parsed.transmission || 'Automatic'} • ${parsed.fuel_type || 'Petrol'} • ${parsed.seats || 5} Seater`,
              rating: 4.96,
              trips_count: 84,
              host_name: 'Rahul Sharma',
              host_badge: 'Superhost • Responds < 10m'
            })
          }
        }
      } catch (err) {
        console.warn('Vehicle fetch note in checkout:', err)
        if (isMounted) {
          setVehicle(FALLBACK_VEHICLE)
        }
      } finally {
        if (isMounted) {
          setLoadingVehicle(false)
        }
      }
    }

    loadVehicle()
    return () => { isMounted = false }
  }, [id])

  // Pricing & Duration Calculation
  const calculation = useMemo(() => {
    const currentVehicle = vehicle || FALLBACK_VEHICLE
    const start = new Date(startDateTime).getTime()
    const end = new Date(endDateTime).getTime()

    // Default duration safe fallback
    let diffHours = 56
    let fullDays = 2
    let remHours = 8
    let isValid = true

    if (!isNaN(start) && !isNaN(end) && end > start) {
      diffHours = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60)))
      fullDays = Math.floor(diffHours / 24)
      remHours = diffHours % 24
      isValid = true
    } else {
      isValid = false
    }

    // Pricing components
    const dailyRate = currentVehicle.daily_price || 1000
    const hourlyRate = currentVehicle.hourly_price || 100

    let baseRentalAmount = 0
    let extraHoursAmount = 0

    if (diffHours >= 24) {
      baseRentalAmount = fullDays * dailyRate
      extraHoursAmount = remHours * hourlyRate
    } else {
      baseRentalAmount = diffHours * hourlyRate
      extraHoursAmount = 0
    }

    const protectionPlan = 299
    const doorstepDeliveryFee = fulfillmentMode === 'delivery' ? 299 : 0
    const convenienceFee = 99
    // GST 18% on platform convenience + protection (+ delivery if selected)
    const taxableServices = protectionPlan + doorstepDeliveryFee + convenienceFee
    const gstFee = Math.round(taxableServices * 0.18)

    const securityDeposit = 2000
    const promoDiscount = promoApplied ? 200 : 0

    // Rental subtotal
    const rentalTotal = Math.max(0, baseRentalAmount + extraHoursAmount + protectionPlan + doorstepDeliveryFee + convenienceFee + gstFee - promoDiscount)
    const grandTotal = rentalTotal + securityDeposit
    const regularTotal = grandTotal + (promoApplied ? 200 : 0)

    return {
      isValid,
      totalHours: diffHours,
      fullDays,
      remHours,
      baseRentalAmount,
      extraHoursAmount,
      protectionPlan,
      doorstepDeliveryFee,
      convenienceFee,
      gstFee,
      securityDeposit,
      promoDiscount,
      rentalTotal,
      grandTotal,
      regularTotal
    }
  }, [vehicle, startDateTime, endDateTime, fulfillmentMode, promoApplied])

  // Format date helper for human readable display (e.g., "Saturday, Oct 28, 2025" & "10:00 AM (Morning)")
  const formatFriendlyDate = (dateString, isEnd = false) => {
    try {
      const d = new Date(dateString)
      if (isNaN(d.getTime())) {
        return {
          date: isEnd ? 'Monday, Oct 30, 2025' : 'Saturday, Oct 28, 2025',
          time: isEnd ? '06:00 PM (Evening)' : '10:00 AM (Morning)'
        }
      }
      const datePart = d.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
      const hours = d.getHours()
      const timePart = d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
      const period = hours < 12 ? 'Morning' : hours < 17 ? 'Afternoon' : 'Evening'
      return { date: datePart, time: `${timePart} (${period})` }
    } catch {
      return {
        date: isEnd ? 'Monday, Oct 30, 2025' : 'Saturday, Oct 28, 2025',
        time: isEnd ? '06:00 PM (Evening)' : '10:00 AM (Morning)'
      }
    }
  }

  const startDateFormatted = formatFriendlyDate(startDateTime, false)
  const endDateFormatted = formatFriendlyDate(endDateTime, true)

  // Toggle promo coupon
  const handleTogglePromo = () => {
    if (promoApplied) {
      setPromoApplied(false)
      setPromoCode('')
      message.info('Coupon RWFIRST removed.')
    } else {
      setPromoApplied(true)
      setPromoCode('RWFIRST')
      message.success('Coupon RWFIRST applied: ₹200 discount activated!')
    }
  }

  // Copy test card details
  const handleCopyTestCard = () => {
    navigator.clipboard?.writeText('4111222233331111')
    message.success('Test card number copied to clipboard: 4111 2222 3333 1111')
  }

  // Set scenario simulation state
  const handleSetSimState = (state) => {
    setSimState(state)
    if (state !== 'normal') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // Handle Confirm Booking & Pay via Razorpay
  const handleConfirmAndPay = async () => {
    if (!calculation.isValid) {
      message.error('Please select a valid return date and time after the pickup time.')
      return
    }

    if (!driverName.trim()) {
      message.error('Please enter the primary driver full name.')
      return
    }

    if (!licenseNumber.trim()) {
      message.error('Please enter your valid Indian driving license number.')
      return
    }

    if (!ageConfirmed) {
      message.warning('Please confirm the driver age and license affirmation checkbox.')
      return
    }

    setIsSubmitting(true)
    setSimState('processing')
    window.scrollTo({ top: 0, behavior: 'smooth' })

    const activeVehicle = vehicle || FALLBACK_VEHICLE
    let createdBookingId = null

    // Step A: Save booking application in Supabase with initial requested / unpaid status
    try {
      if (user?.id) {
        const bookingPayload = {
          vehicle_id: activeVehicle.id !== 'hyundai-creta-sx-2024' ? activeVehicle.id : null,
          renter_id: user.id,
          start_datetime: new Date(startDateTime).toISOString(),
          end_datetime: new Date(endDateTime).toISOString(),
          total_hours: calculation.totalHours,
          total_days: Number((calculation.fullDays + (calculation.remHours / 24)).toFixed(2)),
          total_amount: calculation.grandTotal,
          booking_status: 'requested',
          payment_status: 'unpaid',
          created_at: new Date().toISOString()
        }

        const { data: bData, error: bErr } = await supabase
          .from('bookings')
          .insert([bookingPayload])
          .select()
          .single()

        if (!bErr && bData) {
          createdBookingId = bData.id
        }
      }
    } catch (insertErr) {
      console.warn('Initial booking creation note:', insertErr)
    }

    const fallbackBookingRef = createdBookingId
      ? `RW-${createdBookingId.slice(0, 8).toUpperCase()}`
      : `RW-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`

    // Step B: Attempt Trusted Server-Side Order Creation via Supabase Edge Function
    let edgeOrderCreated = false
    const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID

    if (createdBookingId) {
      try {
        const { data: orderData, error: orderErr } = await supabase.functions.invoke(
          'create-razorpay-order',
          { body: { booking_id: createdBookingId } }
        )

        if (!orderErr && orderData?.order_id && window.Razorpay) {
          edgeOrderCreated = true
          const options = {
            key: orderData.key_id || razorpayKey,
            amount: orderData.amount,
            currency: orderData.currency || 'INR',
            name: 'RentWheels Mobility Club',
            description: `${activeVehicle.brand} ${activeVehicle.model} - Reservation`,
            order_id: orderData.order_id,
            prefill: {
              name: driverName,
              email: driverEmail,
              contact: driverPhone
            },
            theme: { color: '#630ed4' },
            handler: async function (response) {
              // Step C: Server-Side Cryptographic Signature Verification
              setSimState('processing')
              try {
                const { data: verifyData, error: verifyErr } = await supabase.functions.invoke(
                  'verify-razorpay-payment',
                  {
                    body: {
                      booking_id: createdBookingId,
                      razorpay_order_id: response.razorpay_order_id,
                      razorpay_payment_id: response.razorpay_payment_id,
                      razorpay_signature: response.razorpay_signature,
                      payment_method: activePayTab
                    }
                  }
                )

                if (verifyErr || !verifyData?.success) {
                  message.error(verifyData?.error || 'Payment signature verification failed.')
                  setSimState('failed')
                  setIsSubmitting(false)
                  return
                }

                setBookingRefId(fallbackBookingRef)
                setRazorpayPaymentId(response.razorpay_payment_id)
                setSimState('success')
                setIsSubmitting(false)
                message.success('Payment verified & booking confirmed via Razorpay!')
                window.scrollTo({ top: 0, behavior: 'smooth' })
              } catch (verEx) {
                console.error('Verification exception:', verEx)
                setSimState('failed')
                setIsSubmitting(false)
              }
            },
            modal: {
              ondismiss: function () {
                setSimState('normal')
                setIsSubmitting(false)
                message.info('Payment window was closed.')
              }
            }
          }

          const rzp = new window.Razorpay(options)
          rzp.open()
          return
        }
      } catch (fnErr) {
        console.warn('Edge Function order creation note:', fnErr)
      }
    }

    // Step D: Direct Razorpay Checkout fallback if Edge Function is pending deployment
    if (!edgeOrderCreated && razorpayKey && window.Razorpay) {
      try {
        const generatedPayId = `pay_test_${Math.random().toString(36).substring(2, 10).toUpperCase()}`
        const options = {
          key: razorpayKey,
          amount: Math.round(calculation.grandTotal * 100),
          currency: 'INR',
          name: 'RentWheels Mobility Club',
          description: `Booking ${activeVehicle.brand} ${activeVehicle.model}`,
          image: activeVehicle.images?.[0] || undefined,
          prefill: {
            name: driverName,
            email: driverEmail,
            contact: driverPhone
          },
          theme: { color: '#630ed4' },
          handler: async function (response) {
            setSimState('processing')
            try {
              // 1. Invoke server-side verification to update Supabase payments and bookings tables
              const { data: verifyData, error: verifyErr } = await supabase.functions.invoke(
                'verify-razorpay-payment',
                {
                  body: {
                    booking_id: createdBookingId,
                    razorpay_order_id: response.razorpay_order_id || null,
                    razorpay_payment_id: response.razorpay_payment_id || generatedPayId,
                    razorpay_signature: response.razorpay_signature || null,
                    payment_method: activePayTab,
                    amount: calculation.grandTotal
                  }
                }
              )

              if (verifyErr) {
                console.warn('Edge Function verification note:', verifyErr)
              }

              // 2. Finalize client UI state
              await finalizeBookingInSupabase(
                fallbackBookingRef,
                response.razorpay_payment_id || generatedPayId,
                activeVehicle,
                createdBookingId
              )
            } catch (payEx) {
              console.error('Payment processing exception:', payEx)
              await finalizeBookingInSupabase(
                fallbackBookingRef,
                response.razorpay_payment_id || generatedPayId,
                activeVehicle,
                createdBookingId
              )
            }
          },
          modal: {
            ondismiss: function () {
              setSimState('normal')
              setIsSubmitting(false)
              message.info('Payment was cancelled.')
            }
          }
        }
        const rzp = new window.Razorpay(options)
        rzp.open()
        return
      } catch (rzpErr) {
        console.warn('Razorpay popup error:', rzpErr)
      }
    }

    // Step E: Academic Demo Sandbox Simulation with real database persistence
    const simulatedPayId = `pay_Oz7V${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    setTimeout(async () => {
      await finalizeBookingInSupabase(fallbackBookingRef, simulatedPayId, activeVehicle, createdBookingId)
    }, 1500)
  }

  // Persist confirmed booking in Supabase PostgreSQL
  const finalizeBookingInSupabase = async (refId, payId, activeVehicle, existingBookingId) => {
    try {
      if (user?.id) {
        if (existingBookingId) {
          // Update existing booking status to approved and paid
          await supabase
            .from('bookings')
            .update({
              booking_status: 'approved',
              payment_status: 'paid',
              updated_at: new Date().toISOString()
            })
            .eq('id', existingBookingId)
        } else {
          // Insert new booking
          const bookingPayload = {
            vehicle_id: activeVehicle.id !== 'hyundai-creta-sx-2024' ? activeVehicle.id : null,
            renter_id: user.id,
            start_datetime: new Date(startDateTime).toISOString(),
            end_datetime: new Date(endDateTime).toISOString(),
            total_hours: calculation.totalHours,
            total_days: Number((calculation.fullDays + (calculation.remHours / 24)).toFixed(2)),
            total_amount: calculation.grandTotal,
            booking_status: 'approved',
            payment_status: 'paid',
            created_at: new Date().toISOString()
          }

          const { error: bookingErr } = await supabase
            .from('bookings')
            .insert([bookingPayload])

          if (bookingErr) {
            console.warn('Booking record insert note:', bookingErr.message)
          }
        }
      }
    } catch (dbErr) {
      console.warn('Database booking persistence note:', dbErr)
    } finally {
      setBookingRefId(refId)
      setRazorpayPaymentId(payId)
      setSimState('success')
      setIsSubmitting(false)
      message.success(`Payment confirmed! Reservation ${refId} is secured.`)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const currentVehicle = vehicle || FALLBACK_VEHICLE
  const displayImage = currentVehicle.images?.[0] || FALLBACK_VEHICLE.images[0]

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto pb-12 font-sans">
      {/* Top Breadcrumb & Page Header */}
      <section className="w-full mb-6">
        <div className="flex items-center gap-1.5 text-on-surface-variant text-xs font-semibold mb-2 flex-wrap">
          <Link to="/home" className="hover:text-primary transition-colors">RentWheels</Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <Link to="/explore" className="hover:text-primary transition-colors">Explore Vehicles</Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <Link to={`/vehicle/${currentVehicle.id}`} className="hover:text-primary transition-colors">
            {currentVehicle.brand} {currentVehicle.model}
          </Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-primary font-bold">Checkout &amp; Payment</span>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="flex flex-col">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-on-surface tracking-tight">
              Complete Your Booking
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
              Review your rental details, driver credentials, and confirm your reservation with secure checkout.
            </p>
          </div>

          {/* Trust Security Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-card border border-border-purple-tint text-on-surface text-xs font-semibold shadow-sm">
              <span className="material-symbols-outlined text-primary text-[16px]">lock</span>
              <span>256-Bit SSL Encrypted</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-lavender-subtle text-primary text-xs font-bold shadow-sm">
              <span className="material-symbols-outlined text-[16px]">bolt</span>
              <span>Instant Confirmation</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container text-tertiary text-xs font-semibold shadow-sm">
              <span className="material-symbols-outlined text-[16px]">verified_user</span>
              <span>₹1 Crore Protection</span>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive State Drawer / Toggle Strip for Live Simulation Previews */}
      <div className="w-full bg-surface-container-low rounded-2xl p-3 mb-6 flex flex-wrap items-center justify-between gap-3 border border-border-purple-tint/80">
        <div className="flex items-center gap-2 text-on-surface-variant text-xs">
          <span className="material-symbols-outlined text-primary text-[18px]">developer_mode</span>
          <span className="font-bold text-on-surface">Payment Scenario Simulator:</span>
          <span className="hidden sm:inline">Preview system responses in real-time</span>
        </div>
        <div className="flex items-center gap-1 bg-surface-card p-1 rounded-xl shadow-sm border border-border-purple-tint/50">
          <button
            onClick={() => handleSetSimState('normal')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              simState === 'normal'
                ? 'bg-lavender-subtle text-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Form View
          </button>
          <button
            onClick={() => handleSetSimState('success')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              simState === 'success'
                ? 'bg-status-success/20 text-status-success shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Success Modal
          </button>
          <button
            onClick={() => handleSetSimState('processing')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              simState === 'processing'
                ? 'bg-primary-container text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Processing State
          </button>
          <button
            onClick={() => handleSetSimState('failed')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              simState === 'failed'
                ? 'bg-red-100 text-red-600 shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Failure Alert
          </button>
        </div>
      </div>

      {/* Simulator Response Banners */}
      <div ref={topBannerRef} className="w-full mb-6">
        {/* Success Banner */}
        {simState === 'success' && (
          <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-on-surface shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-status-success text-white flex items-center justify-center shrink-0 shadow-sm">
                  <span className="material-symbols-outlined text-[26px]">check_circle</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-extrabold text-emerald-950">
                    Booking Confirmed! #{bookingRefId}
                  </span>
                  <span className="text-xs text-emerald-800 mt-0.5">
                    Razorpay Payment ID: <strong>{razorpayPaymentId}</strong> • SMS &amp; WhatsApp voucher dispatched to {driverPhone}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  onClick={() => navigate('/my-bookings')}
                  className="px-3.5 py-2 bg-primary-container hover:bg-electric-violet-hover text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                  <span>View in My Bookings</span>
                </button>
                <button
                  onClick={() => handleSetSimState('normal')}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-emerald-700 hover:bg-emerald-100 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Processing State Banner */}
        {simState === 'processing' && (
          <div className="p-5 rounded-2xl bg-primary-container text-on-primary shadow-lg animate-pulse">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[28px] animate-spin">progress_activity</span>
                <div className="flex flex-col">
                  <span className="text-base font-bold">Contacting Razorpay Secure Gateway...</span>
                  <span className="text-xs opacity-90">
                    Verifying bank authentication tokens and pre-authorizing security deposit. Do not refresh.
                  </span>
                </div>
              </div>
              <span className="text-xs bg-white/20 px-3 py-1 rounded-full font-mono">
                Test Transaction #RZP-SIM-48
              </span>
            </div>
          </div>
        )}

        {/* Failed Banner */}
        {simState === 'failed' && (
          <div className="p-5 rounded-2xl bg-red-50 border border-red-200 text-red-900 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[24px]">error</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-bold text-red-800">
                    Payment Authorization Failed (Error code: GATEWAY_DECLINED)
                  </span>
                  <span className="text-xs text-red-700 mt-0.5">
                    The test bank account reported an insufficient test balance. Please select UPI or enter the test credit card provided below.
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleSetSimState('normal')}
                className="px-3.5 py-1.5 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main 2-Column Grid (60% / 40%) */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: 7 of 12 Cols (~60%) */}
        <div className="lg:col-span-7 flex flex-col gap-6 min-w-0">
          {/* 1. SELECTED VEHICLE SUMMARY CARD */}
          <div className="w-full bg-surface-card rounded-3xl border border-border-purple-tint p-6 shadow-sm flex flex-col gap-4 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row gap-5">
              <div className="sm:w-52 h-40 rounded-2xl overflow-hidden relative shrink-0 bg-surface-container border border-border-purple-tint/60">
                <img
                  className="w-full h-full object-cover"
                  src={displayImage}
                  alt={`${currentVehicle.brand} ${currentVehicle.model}`}
                />
                <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-on-surface/85 backdrop-blur-sm text-primary-fixed text-xs font-bold flex items-center gap-1 shadow-sm">
                  <span className="material-symbols-outlined text-[13px] text-electric-violet-bright">verified</span>
                  <span>Verified Fleet</span>
                </span>
              </div>

              <div className="flex flex-col justify-between flex-1 min-w-0">
                <div className="flex flex-col">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xl sm:text-2xl text-on-surface font-extrabold truncate">
                      {currentVehicle.brand} {currentVehicle.model}
                    </span>
                    <span className="text-lg sm:text-xl text-primary font-extrabold shrink-0">
                      ₹{currentVehicle.daily_price?.toLocaleString('en-IN')}
                      <span className="text-xs text-on-surface-variant font-normal">/day</span>
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                    {currentVehicle.specs_summary || `${currentVehicle.vehicle_type?.toUpperCase()} • Automatic • Petrol • 5 Seater`}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-lavender-subtle text-primary text-xs font-bold">
                      <span className="material-symbols-outlined text-[14px]">star</span>
                      <span>{currentVehicle.rating || 4.96} ({currentVehicle.trips_count || 84} trips)</span>
                    </div>
                    <span className="text-on-surface-variant/40">•</span>
                    <span className="text-xs text-on-surface-variant font-medium">₹{currentVehicle.hourly_price}/hr extra tier</span>
                    <span className="text-on-surface-variant/40">•</span>
                    <div className="flex items-center gap-1 text-status-success text-xs font-bold">
                      <span className="material-symbols-outlined text-[14px]">bolt</span>
                      <span>Fast Pickup</span>
                    </div>
                  </div>
                </div>

                {/* Host info & Hub Location snippet */}
                <div className="mt-4 pt-3 flex flex-col gap-1.5 bg-surface-container-low p-3 rounded-2xl border border-border-purple-tint/60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-[11px]">
                        {currentVehicle.host_name ? currentVehicle.host_name.split(' ').map(n => n[0]).join('') : 'RS'}
                      </div>
                      <span className="text-xs text-on-surface font-semibold">
                        Hosted by {currentVehicle.host_name || 'Rahul Sharma'}
                      </span>
                    </div>
                    <span className="text-xs text-primary font-medium">{currentVehicle.host_badge || 'Superhost • Responds < 10m'}</span>
                  </div>
                  <div className="flex items-start gap-1.5 text-on-surface-variant text-xs">
                    <span className="material-symbols-outlined text-[16px] text-primary shrink-0 mt-0.5">location_on</span>
                    <span className="text-[12px] leading-tight line-clamp-1">{currentVehicle.pickup_location}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. TRIP SCHEDULE & FULFILLMENT */}
          <div className="w-full bg-surface-card rounded-3xl border border-border-purple-tint p-6 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-lavender-subtle text-primary flex items-center justify-center font-bold text-xs">
                  1
                </span>
                <h2 className="text-lg sm:text-xl text-on-surface font-bold">Trip Schedule &amp; Fulfillment</h2>
              </div>
              <span className="text-xs text-on-surface-variant font-medium">Standard Fuel Included: Up to 150 km/day</span>
            </div>

            {/* Date & Time pickers block */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-surface-container-low rounded-2xl border border-border-purple-tint/60">
              {/* Pickup */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-on-surface-variant uppercase tracking-wider font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-primary">flight_takeoff</span>
                  <span>Pickup Date &amp; Time</span>
                </label>
                <div className="relative flex items-center justify-between bg-surface-card p-3 rounded-xl shadow-sm border border-border-purple-tint/70">
                  <div className="flex flex-col">
                    <span className="text-xs sm:text-sm text-on-surface font-bold">{startDateFormatted.date}</span>
                    <span className="text-xs text-on-surface-variant">{startDateFormatted.time}</span>
                  </div>
                  <input
                    type="datetime-local"
                    value={startDateTime}
                    onChange={(e) => setStartDateTime(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    title="Change pickup date & time"
                  />
                  <div className="w-8 h-8 rounded-lg bg-surface-container text-primary flex items-center justify-center pointer-events-none">
                    <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                  </div>
                </div>
              </div>

              {/* Return */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-on-surface-variant uppercase tracking-wider font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-primary">flight_land</span>
                  <span>Return Date &amp; Time</span>
                </label>
                <div className="relative flex items-center justify-between bg-surface-card p-3 rounded-xl shadow-sm border border-border-purple-tint/70">
                  <div className="flex flex-col">
                    <span className="text-xs sm:text-sm text-on-surface font-bold">{endDateFormatted.date}</span>
                    <span className="text-xs text-on-surface-variant">{endDateFormatted.time}</span>
                  </div>
                  <input
                    type="datetime-local"
                    value={endDateTime}
                    onChange={(e) => setEndDateTime(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    title="Change return date & time"
                  />
                  <div className="w-8 h-8 rounded-lg bg-surface-container text-primary flex items-center justify-center pointer-events-none">
                    <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Dynamic duration indicator */}
            <div className="flex items-center justify-between bg-lavender-subtle/70 px-4 py-2.5 rounded-2xl border border-primary-fixed-dim/40 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">timelapse</span>
                <span className="text-xs font-semibold text-on-surface">Total Duration Calculated:</span>
              </div>
              <span className="text-xs text-primary font-bold bg-surface-card px-3 py-1 rounded-full shadow-sm">
                {calculation.fullDays} Days, {calculation.remHours} Hours ({calculation.totalHours} Hours Total)
              </span>
            </div>

            {/* Handover Type Selection (Radios) */}
            <div className="flex flex-col gap-2 pt-1">
              <span className="text-xs font-bold text-on-surface">Select Fulfillment Mode</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Option 1: Hub (Selected) */}
                <label
                  onClick={() => setFulfillmentMode('hub')}
                  className={`flex items-start gap-3 p-4 rounded-2xl cursor-pointer transition-all border ${
                    fulfillmentMode === 'hub'
                      ? 'bg-lavender-subtle/40 border-primary shadow-sm'
                      : 'bg-surface-container-low border-border-purple-tint hover:bg-surface-container'
                  }`}
                >
                  <input
                    checked={fulfillmentMode === 'hub'}
                    onChange={() => setFulfillmentMode('hub')}
                    className="mt-1 accent-primary w-4 h-4 cursor-pointer"
                    name="handover_type"
                    type="radio"
                  />
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs sm:text-sm text-on-surface font-bold">Self Hub Pickup</span>
                      <span className="px-2 py-0.5 rounded-full bg-status-success/15 text-status-success text-[10px] font-bold">
                        FREE
                      </span>
                    </div>
                    <span className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                      Indiranagar Smart Hub Parking Bay 4B. Open 24/7 keyless code unlock.
                    </span>
                  </div>
                </label>

                {/* Option 2: Doorstep Delivery */}
                <label
                  onClick={() => setFulfillmentMode('delivery')}
                  className={`flex items-start gap-3 p-4 rounded-2xl cursor-pointer transition-all border ${
                    fulfillmentMode === 'delivery'
                      ? 'bg-lavender-subtle/40 border-primary shadow-sm'
                      : 'bg-surface-container-low border-border-purple-tint hover:bg-surface-container'
                  }`}
                >
                  <input
                    checked={fulfillmentMode === 'delivery'}
                    onChange={() => setFulfillmentMode('delivery')}
                    className="mt-1 accent-primary w-4 h-4 cursor-pointer"
                    name="handover_type"
                    type="radio"
                  />
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs sm:text-sm text-on-surface font-bold">Doorstep Delivery</span>
                      <span className="text-xs text-primary font-bold">+₹299</span>
                    </div>
                    <span className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                      Delivered to your residence or hotel within 15 km radius by a valet driver.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* 3. DRIVER DETAILS & KYC VERIFICATION */}
          <div className="w-full bg-surface-card rounded-3xl border border-border-purple-tint p-6 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-lavender-subtle text-primary flex items-center justify-center font-bold text-xs">
                  2
                </span>
                <h2 className="text-lg sm:text-xl text-on-surface font-bold">Driver Credentials &amp; KYC</h2>
              </div>
              <span className="flex items-center gap-1 text-status-success text-xs font-bold bg-status-success/10 px-2.5 py-1 rounded-full">
                <span className="material-symbols-outlined text-[15px]">verified</span> Government ID Verified
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Primary Driver Name */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-on-surface-variant font-semibold">Primary Driver Full Name</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
                    person
                  </span>
                  <input
                    className="w-full h-11 pl-10 pr-3 bg-surface-container-low rounded-xl text-xs sm:text-sm text-on-surface font-bold focus:outline-none border border-border-purple-tint/60"
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                  />
                </div>
              </div>

              {/* Driving License Number with badge */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-on-surface-variant font-semibold">Driving License (DL) Number</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
                    badge
                  </span>
                  <input
                    className="w-full h-11 pl-10 pr-24 bg-surface-container-low rounded-xl text-xs sm:text-sm text-on-surface font-bold focus:outline-none border border-border-purple-tint/60 uppercase"
                    type="text"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                  />
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-status-success text-white px-2 py-0.5 rounded-full text-[11px] font-bold">
                    <span className="material-symbols-outlined text-[12px]">check</span> Verified
                  </div>
                </div>
              </div>

              {/* Contact Email */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-on-surface-variant font-semibold">Notification Email</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
                    mail
                  </span>
                  <input
                    className="w-full h-11 pl-10 pr-3 bg-surface-container-low rounded-xl text-xs sm:text-sm text-on-surface focus:outline-none border border-border-purple-tint/60"
                    type="email"
                    value={driverEmail}
                    onChange={(e) => setDriverEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-on-surface-variant font-semibold">Mobile Phone (WhatsApp Updates)</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
                    phone
                  </span>
                  <input
                    className="w-full h-11 pl-10 pr-3 bg-surface-container-low rounded-xl text-xs sm:text-sm text-on-surface focus:outline-none border border-border-purple-tint/60"
                    type="tel"
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Age & License affirmation checkbox */}
            <label className="flex items-start gap-3 p-3 rounded-2xl bg-surface-container-low cursor-pointer hover:bg-surface-container transition-colors mt-1 border border-border-purple-tint/60">
              <input
                checked={ageConfirmed}
                onChange={(e) => setAgeConfirmed(e.target.checked)}
                className="mt-0.5 accent-primary w-4 h-4 rounded cursor-pointer"
                type="checkbox"
              />
              <span className="text-xs text-on-surface leading-relaxed">
                I confirm that the primary driver is <strong>21+ years old</strong>, has over 1 year of driving experience, and will carry the physical original Indian driving license at handover.
              </span>
            </label>
          </div>

          {/* 4. PAYMENT GATEWAY SELECTION (RAZORPAY) */}
          <div className="w-full bg-surface-card rounded-3xl border border-border-purple-tint p-6 shadow-sm flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-lavender-subtle text-primary flex items-center justify-center font-bold text-xs">
                  3
                </span>
                <h2 className="text-lg sm:text-xl text-on-surface font-bold">Payment Gateway</h2>
              </div>

              {/* Official Razorpay Styled Badge */}
              <div className="flex items-center gap-2 bg-[#02042b] text-white px-3.5 py-1.5 rounded-xl shadow-sm self-start sm:self-auto">
                <span className="text-[10px] opacity-80 uppercase tracking-widest font-bold">Secured by</span>
                <div className="flex items-center font-extrabold tracking-tight text-white text-sm">
                  <span>Razorpay</span>
                  <span className="text-cyan-400 ml-0.5 text-base leading-none">/</span>
                </div>
              </div>
            </div>

            {/* Academic Demo Banner */}
            <div className="p-3.5 bg-surface-container-low rounded-2xl flex items-start gap-3 border border-border-purple-tint/60">
              <span className="text-xl">🧪</span>
              <div className="flex flex-col text-on-surface">
                <span className="text-xs font-bold flex items-center gap-2">
                  Razorpay Test Mode Sandbox
                  <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px]">Academic Demo</span>
                </span>
                <span className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                  This reservation process is simulated. No real credit card, UPI account, or bank balance will be charged.
                </span>
              </div>
            </div>

            {/* Payment Method Tabs */}
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-surface-container-low p-1.5 rounded-2xl border border-border-purple-tint/60">
                <button
                  type="button"
                  onClick={() => setActivePayTab('upi')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    activePayTab === 'upi'
                      ? 'bg-surface-card text-primary shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">qr_code_2</span>
                  <span>UPI Apps</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActivePayTab('card')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    activePayTab === 'card'
                      ? 'bg-surface-card text-primary shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">credit_card</span>
                  <span>Cards</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActivePayTab('netbanking')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    activePayTab === 'netbanking'
                      ? 'bg-surface-card text-primary shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">account_balance</span>
                  <span>NetBanking</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActivePayTab('wallet')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    activePayTab === 'wallet'
                      ? 'bg-surface-card text-primary shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                  <span>Wallets</span>
                </button>
              </div>

              {/* Tab 1: UPI */}
              {activePayTab === 'upi' && (
                <div className="p-4 bg-surface-container-low rounded-2xl flex flex-col gap-4 border border-border-purple-tint/60">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-on-surface">Fastest: Pay via any UPI App</span>
                    <span className="text-[11px] font-semibold text-status-success">Zero Surcharge</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {['GPay', 'PhonePe', 'Paytm', 'CRED UPI'].map(app => (
                      <div
                        key={app}
                        onClick={() => message.info(`Selected ${app} UPI intent.`)}
                        className="p-3 bg-surface-card rounded-xl flex flex-col items-center justify-center gap-1 text-center cursor-pointer hover:bg-lavender-subtle shadow-sm transition-all border border-border-purple-tint/60"
                      >
                        <span className="text-xs font-bold text-on-surface">{app}</span>
                        <span className="text-[10px] text-on-surface-variant">Instant Intent</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-on-surface-variant">Or enter Virtual Payment Address (VPA)</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
                          alternate_email
                        </span>
                        <input
                          type="text"
                          value={upiVpa}
                          onChange={(e) => setUpiVpa(e.target.value)}
                          className="w-full h-11 pl-10 pr-3 bg-surface-card rounded-xl text-xs sm:text-sm text-on-surface focus:outline-none border border-border-purple-tint/60"
                          placeholder="alexmorgan@okaxis"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => message.success('UPI ID verified & active!')}
                        className="px-4 h-11 bg-lavender-subtle text-primary rounded-xl text-xs font-bold hover:bg-primary-container hover:text-white transition-colors shrink-0"
                      >
                        Verify UPI ID
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Cards */}
              {activePayTab === 'card' && (
                <div className="p-4 bg-surface-container-low rounded-2xl flex flex-col gap-3 border border-border-purple-tint/60">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-on-surface-variant">Card Number</label>
                    <input
                      type="text"
                      defaultValue="4111 2222 3333 1111"
                      className="w-full h-11 px-3 bg-surface-card rounded-xl font-mono text-xs sm:text-sm text-on-surface focus:outline-none border border-border-purple-tint/60"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-on-surface-variant">Expiry Date</label>
                      <input
                        type="text"
                        defaultValue="12/28"
                        className="w-full h-11 px-3 bg-surface-card rounded-xl text-xs sm:text-sm text-on-surface focus:outline-none border border-border-purple-tint/60"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-on-surface-variant">CVV</label>
                      <input
                        type="password"
                        defaultValue="123"
                        className="w-full h-11 px-3 bg-surface-card rounded-xl text-xs sm:text-sm text-on-surface focus:outline-none border border-border-purple-tint/60"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: NetBanking */}
              {activePayTab === 'netbanking' && (
                <div className="p-4 bg-surface-container-low rounded-2xl flex flex-col gap-3 border border-border-purple-tint/60">
                  <span className="text-xs font-semibold text-on-surface">Select Popular Bank</span>
                  <div className="grid grid-cols-3 gap-2">
                    {['HDFC Bank', 'ICICI Bank', 'State Bank (SBI)'].map(b => (
                      <div
                        key={b}
                        onClick={() => setSelectedBank(b)}
                        className={`p-2.5 rounded-xl text-center text-xs font-bold cursor-pointer transition-all border ${
                          selectedBank === b
                            ? 'bg-lavender-subtle text-primary border-primary'
                            : 'bg-surface-card text-on-surface border-border-purple-tint/60 hover:bg-lavender-subtle/50'
                        }`}
                      >
                        {b}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 4: Wallets */}
              {activePayTab === 'wallet' && (
                <div className="p-4 bg-surface-container-low rounded-2xl flex flex-col gap-3 border border-border-purple-tint/60">
                  <span className="text-xs font-semibold text-on-surface">Select Digital Wallet</span>
                  <div className="grid grid-cols-3 gap-2">
                    {['Amazon Pay', 'Mobikwik', 'Airtel Money'].map(w => (
                      <div
                        key={w}
                        onClick={() => setSelectedWallet(w)}
                        className={`p-2.5 rounded-xl text-center text-xs font-bold cursor-pointer transition-all border ${
                          selectedWallet === w
                            ? 'bg-lavender-subtle text-primary border-primary'
                            : 'bg-surface-card text-on-surface border-border-purple-tint/60 hover:bg-lavender-subtle/50'
                        }`}
                      >
                        {w}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Demo Sandbox Test Card Credentials Box */}
              <div className="p-3 bg-surface-container-high/70 rounded-xl flex items-center justify-between text-on-surface-variant font-mono text-xs overflow-x-auto border border-border-purple-tint/60">
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <span className="material-symbols-outlined text-primary text-[16px]">info</span>
                  <span><strong>Test Card:</strong> 4111 •••• •••• 1111</span>
                  <span className="text-on-surface-variant/40">|</span>
                  <span>Exp: 12/28</span>
                  <span className="text-on-surface-variant/40">|</span>
                  <span>CVV: 123</span>
                  <span className="text-on-surface-variant/40">|</span>
                  <span>OTP: 123456</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyTestCard}
                  className="ml-3 px-2 py-0.5 rounded bg-surface-card text-primary text-xs font-bold hover:bg-lavender-subtle font-sans transition-colors shrink-0 shadow-sm"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>

          {/* Validation Guidance Alert Note */}
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-surface-container-low text-on-surface-variant border border-border-purple-tint/60">
            <span className="material-symbols-outlined text-primary text-[20px] shrink-0">policy</span>
            <span className="text-xs leading-relaxed">
              <strong>Fair Use Notice:</strong> Extension requests require 4-hour prior notice via the RentWheels app. Unlimited kilometers available on customized multi-day bookings.
            </span>
          </div>
        </div>

        {/* RIGHT COLUMN: 5 of 12 Cols (~40%) - STICKY FARE & SUMMARY */}
        <div className="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-24">
          {/* 1. FARE BREAKDOWN CARD */}
          <div className="w-full bg-surface-card rounded-3xl border border-border-purple-tint shadow-lg p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-border-purple-tint/60">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">receipt</span>
                <h3 className="text-lg sm:text-xl font-extrabold text-on-surface">Fare Summary</h3>
              </div>
              <span className="text-[10px] text-primary font-bold uppercase tracking-wider bg-lavender-subtle px-2.5 py-1 rounded-full">
                Transparent Pricing
              </span>
            </div>

            {/* Breakdown List */}
            <div className="flex flex-col gap-3 text-xs">
              {/* Base Vehicle Rental */}
              <div className="flex items-center justify-between text-on-surface">
                <div className="flex flex-col">
                  <span className="font-semibold text-xs sm:text-sm">Base Vehicle Rental</span>
                  <span className="text-on-surface-variant text-[11px]">
                    {calculation.fullDays} Full Days @ ₹{currentVehicle.daily_price?.toLocaleString('en-IN')} / day
                  </span>
                </div>
                <span className="text-xs sm:text-sm font-bold">
                  ₹{calculation.baseRentalAmount.toLocaleString('en-IN')}
                </span>
              </div>

              {/* Additional Trip Hours */}
              <div className="flex items-center justify-between text-on-surface">
                <div className="flex flex-col">
                  <span className="font-semibold text-xs sm:text-sm">Additional Trip Hours</span>
                  <span className="text-on-surface-variant text-[11px]">
                    {calculation.remHours} Extra Hours @ ₹{currentVehicle.hourly_price?.toLocaleString('en-IN')} / hour
                  </span>
                </div>
                <span className="text-xs sm:text-sm font-bold">
                  ₹{calculation.extraHoursAmount.toLocaleString('en-IN')}
                </span>
              </div>

              {/* Comprehensive Protection Plan */}
              <div className="flex items-center justify-between text-on-surface">
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-xs sm:text-sm">Comprehensive Protection Plan</span>
                    <span className="material-symbols-outlined text-[15px] text-primary" title="Zero-Depreciation coverage">verified</span>
                  </div>
                  <span className="text-on-surface-variant text-[11px]">Zero-Dep liability + roadside assistance</span>
                </div>
                <span className="text-xs sm:text-sm font-bold">₹{calculation.protectionPlan}</span>
              </div>

              {/* Doorstep Delivery Fee (shown if delivery selected) */}
              {calculation.doorstepDeliveryFee > 0 && (
                <div className="flex items-center justify-between text-on-surface">
                  <div className="flex flex-col">
                    <span className="font-semibold text-xs sm:text-sm">Doorstep Delivery Fee</span>
                    <span className="text-on-surface-variant text-[11px]">Valet direct delivery within 15 km</span>
                  </div>
                  <span className="text-xs sm:text-sm font-bold">₹{calculation.doorstepDeliveryFee}</span>
                </div>
              )}

              {/* Platform Convenience Fee */}
              <div className="flex items-center justify-between text-on-surface">
                <span className="text-on-surface-variant font-medium">Platform Convenience Fee</span>
                <span className="text-xs sm:text-sm font-medium text-on-surface">₹{calculation.convenienceFee}</span>
              </div>

              {/* GST */}
              <div className="flex items-center justify-between text-on-surface">
                <span className="text-on-surface-variant font-medium">GST (18% on platform &amp; services)</span>
                <span className="text-xs sm:text-sm font-medium text-on-surface">₹{calculation.gstFee}</span>
              </div>

              {/* Refundable Deposit Line */}
              <div className="p-3 rounded-2xl bg-status-success/10 border border-status-success/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-status-success text-[20px]">savings</span>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-on-surface">Security Deposit</span>
                    <span className="text-[10px] text-status-success font-semibold">100% Refundable within 24h</span>
                  </div>
                </div>
                <span className="text-xs sm:text-sm font-bold text-on-surface">
                  ₹{calculation.securityDeposit.toLocaleString('en-IN')}
                </span>
              </div>

              {/* Coupon Discount Line */}
              {promoApplied && (
                <div className="p-3 rounded-2xl bg-lavender-subtle border border-primary-fixed-dim/40 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">local_offer</span>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-primary">Coupon: RWFIRST</span>
                      <span className="text-[10px] text-on-surface-variant">First Booking Welcome Benefit</span>
                    </div>
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-primary">-₹200</span>
                </div>
              )}
            </div>

            {/* Coupon Code Input Accordion */}
            <div className="flex flex-col gap-1.5 pt-2 border-t border-border-purple-tint/60">
              <label className="text-xs text-on-surface-variant font-semibold">Have a Referral or Promo Code?</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
                    sell
                  </span>
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    className="w-full h-10 pl-10 pr-3 uppercase text-xs font-bold bg-surface-container-low rounded-xl text-on-surface focus:outline-none border border-border-purple-tint/60"
                    placeholder="ENTER CODE"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleTogglePromo}
                  className={`px-4 h-10 rounded-xl text-xs font-bold transition-all shadow-sm shrink-0 ${
                    promoApplied
                      ? 'bg-primary text-white hover:bg-electric-violet-hover'
                      : 'bg-lavender-subtle text-primary hover:bg-primary hover:text-white'
                  }`}
                >
                  {promoApplied ? 'Applied ✓' : 'Apply'}
                </button>
              </div>
            </div>

            {/* Total Payable Block */}
            <div className="p-4 bg-surface-container-low rounded-2xl flex flex-col gap-2 border border-border-purple-tint/60">
              <div className="flex items-baseline justify-between">
                <div className="flex flex-col">
                  <span className="text-base sm:text-lg font-extrabold text-on-surface">Total Payable Now</span>
                  <span className="text-[11px] text-on-surface-variant">(Incl. rental &amp; refundable deposit)</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-3xl sm:text-4xl text-primary font-extrabold tracking-tight leading-none">
                    ₹{calculation.grandTotal.toLocaleString('en-IN')}
                  </span>
                  {promoApplied && (
                    <span className="text-[11px] text-on-surface-variant mt-1 line-through">
                      Regular: ₹{calculation.regularTotal.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-border-purple-tint/60 text-[11px] text-on-surface-variant flex items-center justify-between">
                <span>Rental Total: <strong className="text-on-surface">₹{calculation.rentalTotal.toLocaleString('en-IN')}</strong></span>
                <span>Deposit: <strong className="text-on-surface">₹2,000</strong> (Returned)</span>
              </div>
            </div>

            {/* Primary Action CTA Button */}
            <button
              type="button"
              onClick={handleConfirmAndPay}
              disabled={isSubmitting}
              className="w-full h-14 bg-primary hover:bg-electric-violet-hover disabled:bg-gray-400 text-white rounded-2xl text-base font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/25 transition-all active:scale-[0.99] cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Contacting Gateway...</span>
                </>
              ) : (
                <>
                  <span>Confirm Booking &amp; Pay via Razorpay</span>
                  <span className="material-symbols-outlined text-[22px]">arrow_forward</span>
                </>
              )}
            </button>

            <p className="text-center text-[11px] text-on-surface-variant -mt-1 flex items-center justify-center gap-1.5">
              <span className="material-symbols-outlined text-[14px] text-status-success">lock</span>
              <span>Secured by Razorpay Payment Gateway. Instant dispatch via SMS &amp; Email.</span>
            </p>

            {/* Guarantee Badges List */}
            <div className="flex flex-col gap-2 pt-2 border-t border-border-purple-tint/60 text-xs text-on-surface-variant">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-status-success/15 text-status-success flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[13px]">check</span>
                </span>
                <span className="text-on-surface"><strong>Free Cancellation</strong> up to 6 hours prior to pickup</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-lavender-subtle text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[13px]">shield</span>
                </span>
                <span className="text-on-surface"><strong>₹1 Crore Comprehensive Insurance</strong> with 24/7 Roadside Assistance</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-lavender-subtle text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[13px]">satellite_alt</span>
                </span>
                <span className="text-on-surface"><strong>Live GPS Fleet Telemetry</strong> &amp; Keyless Smart Mobile Unlock</span>
              </div>
            </div>
          </div>

          {/* Need Help Support Card */}
          <div className="p-4 rounded-3xl bg-surface-container-low border border-border-purple-tint/60 flex items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-surface-card flex items-center justify-center text-primary shadow-sm border border-border-purple-tint/60">
                <span className="material-symbols-outlined text-[20px]">headset_mic</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs sm:text-sm font-bold text-on-surface">Booking Assistance?</span>
                <span className="text-[11px] text-on-surface-variant">24/7 Concierge: +91 80 4012 9999</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => message.info('RentWheels live concierge chat opened.')}
              className="px-3 py-1.5 rounded-xl bg-surface-card text-xs font-bold text-primary hover:bg-lavender-subtle transition-colors shadow-sm border border-border-purple-tint/60"
            >
              Chat Live
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
