import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Helper to check membership
async function checkMembership(supabase: any, circleId: string, userId: string) {
  const { data } = await supabase
    .from('circle_members')
    .select('role')
    .eq('circle_id', circleId)
    .eq('user_id', userId)
    .eq('invite_status', 'accepted')
    .single()
  return data
}

// GET /api/circles/[id]/members - List members
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: circleId } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check membership
  const membership = await checkMembership(supabase, circleId, user.id)
  if (!membership) {
    return NextResponse.json({ error: 'Not a member of this circle' }, { status: 403 })
  }

  const searchParams = request.nextUrl.searchParams
  const status = searchParams.get('status') || 'accepted'

  const { data: members, error } = await supabase
    .from('circle_members')
    .select(`
      id,
      role,
      invite_status,
      joined_at,
      created_at,
      user:profiles!circle_members_user_id_fkey (
        id,
        full_name,
        avatar_url,
        email
      ),
      invited_by_user:profiles!circle_members_invited_by_fkey (
        id,
        full_name
      )
    `)
    .eq('circle_id', circleId)
    .eq('invite_status', status)
    .order('joined_at', { ascending: false, nullsFirst: false })

  if (error) {
    console.error('List members error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ members })
}

// POST /api/circles/[id]/members - Invite member (admin only)
// Body: { user_id } or { email } or { generate_link: true }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: circleId } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check admin membership
  const membership = await checkMembership(supabase, circleId, user.id)
  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  // Verify circle exists and is not deleted
  const { data: circle } = await supabase
    .from('circles')
    .select('id')
    .eq('id', circleId)
    .eq('is_deleted', false)
    .single()

  if (!circle) {
    return NextResponse.json({ error: 'Circle not found' }, { status: 404 })
  }

  const body = await request.json()
  const { user_id, email, generate_link } = body

  // Option 1: Generate invite link
  if (generate_link) {
    const { data: invite, error: inviteError } = await supabase
      .from('circle_invites')
      .insert({
        circle_id: circleId,
        created_by: user.id,
        max_uses: body.max_uses || 1,
        expires_at: body.expires_at || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single()

    if (inviteError) {
      console.error('Create invite error:', inviteError)
      return NextResponse.json({ error: inviteError.message }, { status: 500 })
    }

    return NextResponse.json({ 
      invite,
      invite_url: `/circles/invite/${invite.token}`
    }, { status: 201 })
  }

  // Option 2: Invite by user_id
  if (user_id) {
    // Check if user exists
    const { data: targetUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user_id)
      .single()

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if already a member
    const { data: existingMember } = await supabase
      .from('circle_members')
      .select('id, invite_status')
      .eq('circle_id', circleId)
      .eq('user_id', user_id)
      .single()

    if (existingMember) {
      if (existingMember.invite_status === 'accepted') {
        return NextResponse.json({ error: 'User is already a member' }, { status: 409 })
      }
      if (existingMember.invite_status === 'pending') {
        return NextResponse.json({ error: 'User already has a pending invite' }, { status: 409 })
      }
    }

    const { data: member, error: memberError } = await supabase
      .from('circle_members')
      .insert({
        circle_id: circleId,
        user_id: user_id,
        invited_by: user.id,
        role: 'member',
        invite_status: 'pending'
      })
      .select(`
        id,
        role,
        invite_status,
        created_at,
        user:profiles!circle_members_user_id_fkey (
          id,
          full_name,
          avatar_url
        )
      `)
      .single()

    if (memberError) {
      console.error('Invite member error:', memberError)
      return NextResponse.json({ error: memberError.message }, { status: 500 })
    }

    // TODO: Create notification for the invited user

    return NextResponse.json({ member }, { status: 201 })
  }

  // Option 3: Invite by email
  if (email) {
    // Look up user by email
    const { data: targetUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (targetUser) {
      // User exists, invite by user_id
      const { data: existingMember } = await supabase
        .from('circle_members')
        .select('id, invite_status')
        .eq('circle_id', circleId)
        .eq('user_id', targetUser.id)
        .single()

      if (existingMember) {
        if (existingMember.invite_status === 'accepted') {
          return NextResponse.json({ error: 'User is already a member' }, { status: 409 })
        }
        if (existingMember.invite_status === 'pending') {
          return NextResponse.json({ error: 'User already has a pending invite' }, { status: 409 })
        }
      }

      const { data: member, error: memberError } = await supabase
        .from('circle_members')
        .insert({
          circle_id: circleId,
          user_id: targetUser.id,
          invited_by: user.id,
          role: 'member',
          invite_status: 'pending'
        })
        .select(`
          id,
          role,
          invite_status,
          created_at,
          user:profiles!circle_members_user_id_fkey (
            id,
            full_name,
            avatar_url
          )
        `)
        .single()

      if (memberError) {
        console.error('Invite member by email error:', memberError)
        return NextResponse.json({ error: memberError.message }, { status: 500 })
      }

      return NextResponse.json({ member }, { status: 201 })
    }

    // User doesn't exist - generate invite link for email
    const { data: invite, error: inviteError } = await supabase
      .from('circle_invites')
      .insert({
        circle_id: circleId,
        created_by: user.id,
        max_uses: 1
      })
      .select()
      .single()

    if (inviteError) {
      console.error('Create email invite error:', inviteError)
      return NextResponse.json({ error: inviteError.message }, { status: 500 })
    }

    // TODO: Send email invitation

    return NextResponse.json({ 
      invite,
      invite_url: `/circles/invite/${invite.token}`,
      email_sent: false, // Would be true when email sending is implemented
      message: 'User not found. Invite link generated.'
    }, { status: 201 })
  }

  return NextResponse.json({ 
    error: 'Must provide user_id, email, or generate_link' 
  }, { status: 400 })
}
