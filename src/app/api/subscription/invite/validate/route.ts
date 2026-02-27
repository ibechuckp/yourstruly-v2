import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * GET /api/subscription/invite/validate?token=xxx
 * Validate an invite token and return invite details
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // Find the seat with this invite token
    const { data: seat, error } = await adminClient
      .from('subscription_seats')
      .select(`
        id,
        email,
        status,
        subscription_id,
        subscription:user_subscriptions(
          user_id,
          status,
          plan:subscription_plans(name)
        )
      `)
      .eq('invite_token', token)
      .single()

    if (error || !seat) {
      return NextResponse.json({ error: 'Invalid or expired invite' }, { status: 404 })
    }

    // Check if subscription is still active
    const subscription = Array.isArray(seat.subscription) ? seat.subscription[0] : seat.subscription
    const plan = Array.isArray(subscription?.plan) ? subscription?.plan[0] : subscription?.plan
    if (subscription?.status !== 'active' || plan?.name !== 'premium') {
      return NextResponse.json({ error: 'This subscription is no longer active' }, { status: 400 })
    }

    // Check if invite was already removed
    if (seat.status === 'removed') {
      return NextResponse.json({ error: 'This invite has been revoked' }, { status: 400 })
    }

    // Get inviter profile
    const { data: inviterProfile } = await adminClient
      .from('profiles')
      .select('full_name, email')
      .eq('id', subscription?.user_id)
      .single()

    return NextResponse.json({
      invite: {
        id: seat.id,
        email: seat.email,
        status: seat.status,
        inviter: inviterProfile
      }
    })
  } catch (err) {
    console.error('Validate invite error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
