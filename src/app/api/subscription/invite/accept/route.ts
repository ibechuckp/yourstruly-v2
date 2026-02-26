import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/subscription/invite/accept
 * Accept a seat invitation
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'You must be logged in to accept an invite' }, { status: 401 })
    }

    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    // Find the seat with this invite token
    const { data: seat, error: seatError } = await adminClient
      .from('subscription_seats')
      .select(`
        id,
        email,
        status,
        subscription_id,
        subscription:user_subscriptions(
          id,
          user_id,
          status,
          plan:subscription_plans(name)
        )
      `)
      .eq('invite_token', token)
      .single()

    if (seatError || !seat) {
      return NextResponse.json({ error: 'Invalid or expired invite' }, { status: 404 })
    }

    // Verify the invite email matches the user's email (case insensitive)
    if (seat.email?.toLowerCase() !== user.email?.toLowerCase()) {
      return NextResponse.json({ 
        error: 'This invite was sent to a different email address' 
      }, { status: 403 })
    }

    // Check if subscription is still active
    if (seat.subscription?.status !== 'active' || seat.subscription?.plan?.name !== 'premium') {
      return NextResponse.json({ error: 'This subscription is no longer active' }, { status: 400 })
    }

    // Check if invite was removed
    if (seat.status === 'removed') {
      return NextResponse.json({ error: 'This invite has been revoked' }, { status: 400 })
    }

    // Check if already accepted
    if (seat.status === 'active') {
      return NextResponse.json({ error: 'Invite already accepted' }, { status: 400 })
    }

    // Check if user already has their own active subscription
    const { data: existingSub } = await adminClient
      .from('user_subscriptions')
      .select('id, plan:subscription_plans(name)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (existingSub?.plan?.name === 'premium') {
      return NextResponse.json({ 
        error: 'You already have your own Premium subscription' 
      }, { status: 400 })
    }

    // Check if user is already a seat on another subscription
    const { data: existingSeat } = await adminClient
      .from('subscription_seats')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (existingSeat) {
      return NextResponse.json({ 
        error: 'You are already a member of another subscription' 
      }, { status: 400 })
    }

    // Accept the invite - update the seat
    const { error: updateError } = await adminClient
      .from('subscription_seats')
      .update({
        user_id: user.id,
        status: 'active',
        accepted_at: new Date().toISOString(),
        invite_token: null // Clear token after use
      })
      .eq('id', seat.id)

    if (updateError) {
      console.error('Failed to accept invite:', updateError)
      return NextResponse.json({ error: 'Failed to accept invite' }, { status: 500 })
    }

    // If user has a free subscription, mark it as inactive (they're now on a seat)
    if (existingSub) {
      await adminClient
        .from('user_subscriptions')
        .update({ status: 'cancelled' })
        .eq('id', existingSub.id)
    }

    return NextResponse.json({ 
      success: true,
      message: 'Invite accepted successfully'
    })
  } catch (err) {
    console.error('Accept invite error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
