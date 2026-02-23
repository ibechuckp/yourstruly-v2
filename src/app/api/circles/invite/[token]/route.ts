import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/circles/invite/[token] - Validate invite link, return circle info
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const supabase = await createClient()
  
  // Invite links can be checked without auth for preview
  // But we'll check if user is logged in to show personalized info

  const { data: { user } } = await supabase.auth.getUser()

  // Find the invite
  const { data: invite, error } = await supabase
    .from('circle_invites')
    .select(`
      id,
      circle_id,
      max_uses,
      use_count,
      expires_at,
      is_active,
      created_at,
      circle:circles (
        id,
        name,
        description,
        is_private,
        created_at
      ),
      created_by_user:profiles!circle_invites_created_by_fkey (
        id,
        full_name,
        avatar_url
      )
    `)
    .eq('token', token)
    .single()

  if (error || !invite) {
    return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
  }

  // Check if invite is valid
  const now = new Date()
  const expiresAt = new Date(invite.expires_at)
  
  if (!invite.is_active) {
    return NextResponse.json({ 
      error: 'This invite link has been deactivated',
      valid: false 
    }, { status: 410 })
  }

  if (expiresAt < now) {
    return NextResponse.json({ 
      error: 'This invite link has expired',
      valid: false 
    }, { status: 410 })
  }

  if (invite.use_count >= invite.max_uses) {
    return NextResponse.json({ 
      error: 'This invite link has reached its maximum uses',
      valid: false 
    }, { status: 410 })
  }

  // Check if circle is deleted
  if (!invite.circle) {
    return NextResponse.json({ 
      error: 'The circle no longer exists',
      valid: false 
    }, { status: 410 })
  }

  // Get member count
  const { count: memberCount } = await supabase
    .from('circle_members')
    .select('*', { count: 'exact', head: true })
    .eq('circle_id', invite.circle_id)
    .eq('invite_status', 'accepted')

  // Check if user is already a member
  let alreadyMember = false
  if (user) {
    const { data: membership } = await supabase
      .from('circle_members')
      .select('invite_status')
      .eq('circle_id', invite.circle_id)
      .eq('user_id', user.id)
      .single()

    alreadyMember = membership?.invite_status === 'accepted'
  }

  return NextResponse.json({
    valid: true,
    invite: {
      id: invite.id,
      expires_at: invite.expires_at,
      uses_remaining: invite.max_uses - invite.use_count,
      created_by: invite.created_by_user
    },
    circle: {
      ...invite.circle,
      member_count: memberCount || 0
    },
    user_status: user ? {
      authenticated: true,
      already_member: alreadyMember
    } : {
      authenticated: false,
      already_member: false
    }
  })
}

// POST /api/circles/invite/[token] - Accept invite
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Must be logged in to accept invite' }, { status: 401 })
  }

  // Find the invite
  const { data: invite, error } = await supabase
    .from('circle_invites')
    .select(`
      id,
      circle_id,
      max_uses,
      use_count,
      expires_at,
      is_active,
      created_by,
      circle:circles (
        id,
        name,
        is_deleted
      )
    `)
    .eq('token', token)
    .single()

  if (error || !invite) {
    return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
  }

  // Validate invite
  const now = new Date()
  const expiresAt = new Date(invite.expires_at)
  
  if (!invite.is_active) {
    return NextResponse.json({ error: 'This invite link has been deactivated' }, { status: 410 })
  }

  if (expiresAt < now) {
    return NextResponse.json({ error: 'This invite link has expired' }, { status: 410 })
  }

  if (invite.use_count >= invite.max_uses) {
    return NextResponse.json({ error: 'This invite link has reached its maximum uses' }, { status: 410 })
  }

  // circle is an array from Supabase join
  const circle = Array.isArray(invite.circle) ? invite.circle[0] : invite.circle
  if (!circle || circle.is_deleted) {
    return NextResponse.json({ error: 'The circle no longer exists' }, { status: 410 })
  }

  // Check if already a member
  const { data: existingMember } = await supabase
    .from('circle_members')
    .select('id, invite_status')
    .eq('circle_id', invite.circle_id)
    .eq('user_id', user.id)
    .single()

  if (existingMember) {
    if (existingMember.invite_status === 'accepted') {
      return NextResponse.json({ error: 'You are already a member of this circle' }, { status: 409 })
    }
    
    // If pending, accept the existing invite
    if (existingMember.invite_status === 'pending') {
      const { data: updatedMember } = await supabase
        .from('circle_members')
        .update({
          invite_status: 'accepted',
          joined_at: new Date().toISOString()
        })
        .eq('id', existingMember.id)
        .select()
        .single()

      // Increment use count
      await supabase
        .from('circle_invites')
        .update({ use_count: invite.use_count + 1 })
        .eq('id', invite.id)

      return NextResponse.json({ 
        success: true,
        member: updatedMember,
        circle: invite.circle
      })
    }
  }

  // Create new membership
  const { data: member, error: memberError } = await supabase
    .from('circle_members')
    .insert({
      circle_id: invite.circle_id,
      user_id: user.id,
      role: 'member',
      status: 'accepted',
      invited_by: invite.created_by,
      joined_at: new Date().toISOString()
    })
    .select()
    .single()

  if (memberError) {
    console.error('Accept invite error:', memberError)
    return NextResponse.json({ error: memberError.message }, { status: 500 })
  }

  // Increment use count
  await supabase
    .from('circle_invites')
    .update({ use_count: invite.use_count + 1 })
    .eq('id', invite.id)

  return NextResponse.json({ 
    success: true,
    member,
    circle: invite.circle
  }, { status: 201 })
}
