import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts"

interface CreateOrderPayload {
  booking_id: string
}

serve(async (req: Request) => {
  // 1. Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 2. Read Server-Side Credentials Securely
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID')
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')

    if (!razorpayKeyId || !razorpayKeySecret) {
      return new Response(
        JSON.stringify({ error: "Razorpay credentials are not configured on the server." }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Supabase service credentials are missing on the server." }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Authenticate User via Authorization Header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header." }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseAuthClient = createClient(supabaseUrl, supabaseAnonKey || supabaseServiceRoleKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user }, error: userError } = await supabaseAuthClient.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Invalid or expired auth token." }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 4. Parse & Validate Request Body
    const body: CreateOrderPayload = await req.json()
    const { booking_id } = body

    if (!booking_id) {
      return new Response(
        JSON.stringify({ error: "booking_id is required." }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 5. Query Trusted Database Data Using Service Role Client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)

    const { data: booking, error: bookingErr } = await supabaseAdmin
      .from('bookings')
      .select('*, vehicles(*)')
      .eq('id', booking_id)
      .single()

    if (bookingErr || !booking) {
      return new Response(
        JSON.stringify({ error: "Booking not found in database." }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify ownership: authenticated user must be the renter
    if (booking.renter_id && booking.renter_id !== user.id) {
      return new Response(
        JSON.stringify({ error: "Forbidden: You are not authorized to pay for this booking." }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Prevent paying for already completed bookings
    if (booking.payment_status === 'paid') {
      return new Response(
        JSON.stringify({ error: "This booking has already been paid and verified." }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 6. Trusted Amount Calculation from Database Record (Never Trust Browser Amount)
    const trustedAmount = Number(booking.total_amount)
    if (!trustedAmount || trustedAmount <= 0) {
      return new Response(
        JSON.stringify({ error: "Invalid booking total amount in database." }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const amountInPaise = Math.round(trustedAmount * 100)
    const receiptId = `rcpt_${booking.id.replace(/-/g, '').slice(0, 12)}_${Date.now().toString().slice(-4)}`

    // 7. Create Razorpay Order via Official API
    const credentials = btoa(`${razorpayKeyId}:${razorpayKeySecret}`)
    const orderPayload = {
      amount: amountInPaise,
      currency: "INR",
      receipt: receiptId,
      notes: {
        booking_id: booking.id,
        renter_id: user.id,
        vehicle_id: booking.vehicle_id || "fleet"
      }
    }

    const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(orderPayload)
    })

    if (!razorpayResponse.ok) {
      const errorData = await razorpayResponse.json()
      console.error("Razorpay order creation error:", errorData)
      return new Response(
        JSON.stringify({ error: "Failed to create Razorpay order.", details: errorData }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const razorpayOrder = await razorpayResponse.json()

    // 8. Return Secure Checkout Details to Client
    return new Response(
      JSON.stringify({
        order_id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key_id: razorpayKeyId,
        booking_id: booking.id,
        receipt: receiptId
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err: any) {
    console.error("Unhandled exception in create-razorpay-order:", err)
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error." }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

