import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/circles/invites/[id] - Accept or decline an invite
// Body: { action: 'accept' | 'decline' }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: memberId } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { action } = body

  if (!action || !['accept', 'decline'].includes(action)) {
    return NextResponse.json({ error: 'Action must be "accept" or "decline"' }, { status: 400 })
  }

  // Find the pending invite for this user
  const { data: member, error: findError } = await supabase
    .from('circle_members')
    .select(`
      id,
      circle_id,
      user_id,
      invite_status,
      circle:circles (
        id,
        name
      )
    `)
    .eq('id', memberId)
    .eq('user_id', user.id)
    .eq('invite_status', 'pending')
    .single()

  if (findError || !member) {
    return NextResponse.json({ error: 'Invite not found or already processed' }, { status: 404 })
  }

  if (action === 'accept') {
    // Accept the invite
    const { error: updateError } = await supabase
      .from('circle_members')
      .update({
        invite_status: 'accepted',
        joined_at: new Date().toISOString()
      })
      .eq('id', memberId)

    if (updateError) {
      console.error('Accept invite error:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    const circle = Array.isArray(member.circle) ? member.circle[0] : member.circle

    return NextResponse.json({
      success: true,
      message: `You've joined "${circle?.name}"!`,
      circle_id: member.circle_id
    })
  } else {
    // Decline - remove the membership record
    const { error: deleteError } = await supabase
      .from('circle_members')
      .delete()
      .eq('id', memberId)

    if (deleteError) {
      console.error('Decline invite error:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Invite declined'
    })
  }
}

// GET /api/circles/invites/[id] - Get invite details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: memberId } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: member, error } = await supabase
    .from('circle_members')
    .select(`
      id,
      circle_id,
      invite_status,
      created_at,
      circle:circles (
        id,
        name,
        description
      ),
      inviter:profiles!circle_members_invited_by_fkey (
        id,
        full_name,
        avatar_url
      )
    `)
    .eq('id', memberId)
    .eq('user_id', user.id)
    .single()

  if (error || !member) {
    return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
  }

  return NextResponse.json({ invite: member })
}
