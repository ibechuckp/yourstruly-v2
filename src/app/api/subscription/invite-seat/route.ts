import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { subscriptionId, email } = await request.json()

    if (!subscriptionId || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify user owns this subscription
    const { data: subscription } = await adminClient
      .from('user_subscriptions')
      .select('*, plan:subscription_plans(name)')
      .eq('id', subscriptionId)
      .eq('user_id', user.id)
      .single()

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    if (subscription.plan?.name !== 'premium') {
      return NextResponse.json({ error: 'Seats require Premium plan' }, { status: 403 })
    }

    // Check current seat count
    const { data: currentSeats } = await adminClient
      .from('subscription_seats')
      .select('*')
      .eq('subscription_id', subscriptionId)
      .in('status', ['active', 'pending'])

    const seatCount = (currentSeats?.length || 0) + 1 // +1 for owner
    if (seatCount >= 10) {
      return NextResponse.json({ error: 'Maximum 10 seats allowed' }, { status: 400 })
    }

    // Check if email already invited
    const existingInvite = currentSeats?.find(s => s.email === email)
    if (existingInvite) {
      return NextResponse.json({ error: 'Email already invited' }, { status: 400 })
    }

    // Generate invite token
    const inviteToken = crypto.randomBytes(32).toString('hex')
    const nextSeatNumber = seatCount + 1

    // Create seat
    const { data: seat, error } = await adminClient
      .from('subscription_seats')
      .insert({
        subscription_id: subscriptionId,
        seat_number: nextSeatNumber,
        email: email,
        invite_token: inviteToken,
        invite_sent_at: new Date().toISOString(),
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error('Seat insert error:', error)
      return NextResponse.json({ error: 'Failed to create seat' }, { status: 500 })
    }

    // TODO: Send invite email via Resend
    // const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/accept-invite?token=${inviteToken}`
    // await sendInviteEmail(email, inviteUrl, user.email)

    return NextResponse.json({ 
      success: true, 
      seat,
      message: 'Invite created (email sending coming soon)'
    })
  } catch (err) {
    console.error('Invite seat error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
