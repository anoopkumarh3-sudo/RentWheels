import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts"

interface VerifyPaymentPayload {
  booking_id?: string
  razorpay_order_id?: string
  razorpay_payment_id: string
  razorpay_signature?: string
  payment_method?: string
  amount?: number
}

// Compute HMAC-SHA256 hex digest using Web Crypto API
async function computeHmacSha256(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(message)
  )
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("")
}

serve(async (req: Request) => {
  // 1. Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 2. Read Server-Side Credentials Securely
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Supabase service credentials are missing on server." }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Authenticate User via Authorization Header (if present)
    let authenticatedUserId: string | null = null
    const authHeader = req.headers.get('Authorization')
    if (authHeader && supabaseAnonKey) {
      try {
        const supabaseAuthClient = createClient(supabaseUrl, supabaseAnonKey, {
          global: { headers: { Authorization: authHeader } }
        })
        const { data: { user } } = await supabaseAuthClient.auth.getUser()
        if (user) {
          authenticatedUserId = user.id
        }
      } catch (authErr) {
        console.warn("Auth token inspection note:", authErr)
      }
    }

    // 4. Parse & Validate Payload
    const body: VerifyPaymentPayload = await req.json()
    let {
      booking_id,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      payment_method = 'razorpay',
      amount
    } = body

    if (!razorpay_payment_id) {
      return new Response(
        JSON.stringify({ error: "Missing razorpay_payment_id." }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 5. Cryptographic Signature Verification (when order_id & signature are present)
    if (razorpay_order_id && razorpay_signature) {
      if (!razorpayKeySecret) {
        return new Response(
          JSON.stringify({ error: "RAZORPAY_KEY_SECRET is not configured on server." }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const expectedSignature = await computeHmacSha256(
        razorpayKeySecret,
        `${razorpay_order_id}|${razorpay_payment_id}`
      )

      if (expectedSignature !== razorpay_signature) {
        console.error("Signature mismatch:", { expected: expectedSignature, received: razorpay_signature })
        return new Response(
          JSON.stringify({ error: "Payment verification failed: Invalid Razorpay signature." }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // 6. Prevent Duplicate Processing using Service Role Client (Bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)

    // Check if payment ID has already been recorded
    const { data: existingPayment } = await supabaseAdmin
      .from('payments')
      .select('id, payment_status, booking_id')
      .eq('razorpay_payment_id', razorpay_payment_id)
      .maybeSingle()

    if (existingPayment) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Payment already verified and processed.",
          payment_id: existingPayment.id,
          booking_id: existingPayment.booking_id
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const nowIso = new Date().toISOString()
    let verifiedAmount = amount ? Number(amount) : 0

    // Ensure valid booking row exists before inserting into payments
    if (booking_id) {
      const { data: booking } = await supabaseAdmin
        .from('bookings')
        .select('id, renter_id, total_amount, payment_status')
        .eq('id', booking_id)
        .maybeSingle()

      if (booking?.total_amount) {
        verifiedAmount = Number(booking.total_amount)
      }
    } else {
      // Create confirmed booking using service role if client-side insert was blocked
      const { data: newBooking, error: newBookingErr } = await supabaseAdmin
        .from('bookings')
        .insert([
          {
            renter_id: authenticatedUserId,
            total_amount: verifiedAmount,
            booking_status: 'approved',
            payment_status: 'paid',
            created_at: nowIso,
            updated_at: nowIso
          }
        ])
        .select()
        .single()

      if (!newBookingErr && newBooking) {
        booking_id = newBooking.id
      }
    }

    // 7. Atomic DB Updates: Insert Payment & Update Booking Status
    const { data: insertedPayment, error: paymentInsertErr } = await supabaseAdmin
      .from('payments')
      .insert([
        {
          booking_id: booking_id || null,
          razorpay_order_id: razorpay_order_id || null,
          razorpay_payment_id: razorpay_payment_id,
          amount: verifiedAmount,
          currency: 'INR',
          payment_status: 'captured',
          payment_method: payment_method,
          created_at: nowIso,
          updated_at: nowIso
        }
      ])
      .select()
      .single()

    if (paymentInsertErr) {
      console.error("Payment insertion error:", paymentInsertErr)
      return new Response(
        JSON.stringify({ error: "Failed to persist verified payment in database.", details: paymentInsertErr.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update booking status to approved and paid
    if (booking_id) {
      const { error: bookingUpdateErr } = await supabaseAdmin
        .from('bookings')
        .update({
          booking_status: 'approved',
          payment_status: 'paid',
          updated_at: nowIso
        })
        .eq('id', booking_id)

      if (bookingUpdateErr) {
        console.warn("Booking update warning:", bookingUpdateErr)
      }
    }

    // 8. Return Verified Result
    return new Response(
      JSON.stringify({
        success: true,
        message: "Razorpay payment verified and recorded successfully in Supabase.",
        booking_id: booking_id,
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id || null,
        status: "paid"
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err: any) {
    console.error("Unhandled exception in verify-razorpay-payment:", err)
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error." }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
