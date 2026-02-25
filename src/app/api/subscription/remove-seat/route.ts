import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { seatId } = await request.json()

    if (!seatId) {
      return NextResponse.json({ error: 'Missing seat ID' }, { status: 400 })
    }

    // Get the seat and verify ownership
    const { data: seat } = await adminClient
      .from('subscription_seats')
      .select(`
        *,
        subscription:user_subscriptions(user_id)
      `)
      .eq('id', seatId)
      .single()

    if (!seat) {
      return NextResponse.json({ error: 'Seat not found' }, { status: 404 })
    }

    // Verify user owns the subscription
    if (seat.subscription?.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Can't remove seat 1 (owner)
    if (seat.seat_number === 1) {
      return NextResponse.json({ error: 'Cannot remove owner seat' }, { status: 400 })
    }

    // Mark seat as removed
    const { error } = await adminClient
      .from('subscription_seats')
      .update({ 
        status: 'removed',
        user_id: null 
      })
      .eq('id', seatId)

    if (error) {
      console.error('Remove seat error:', error)
      return NextResponse.json({ error: 'Failed to remove seat' }, { status: 500 })
    }

    // TODO: Send notification to removed user
    // TODO: Rebalance seat numbers to close gaps?

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Remove seat error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
