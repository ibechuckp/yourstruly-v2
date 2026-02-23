import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Helper to check membership
async function checkMembership(supabase: any, circleId: string, userId: string) {
  const { data } = await supabase
    .from('circle_members')
    .select('id, role, user_id')
    .eq('circle_id', circleId)
    .eq('user_id', userId)
    .eq('invite_status', 'accepted')
    .single()
  return data
}

// DELETE /api/circles/[id]/members/[memberId] - Remove member (admin only, or self-leave)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  const { id: circleId, memberId } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get the target member
  const { data: targetMember } = await supabase
    .from('circle_members')
    .select('id, user_id, role')
    .eq('id', memberId)
    .eq('circle_id', circleId)
    .single()

  if (!targetMember) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  }

  // Check if self-leave
  const isSelfLeave = targetMember.user_id === user.id

  if (isSelfLeave) {
    // Can't leave if you're the owner
    if (targetMember.role === 'owner') {
      return NextResponse.json({ 
        error: 'Owner cannot leave. Transfer ownership first or delete the circle.' 
      }, { status: 400 })
    }
  } else {
    // Admin removing someone else
    const membership = await checkMembership(supabase, circleId, user.id)
    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Can't remove the owner
    if (targetMember.role === 'owner') {
      return NextResponse.json({ error: 'Cannot remove the owner' }, { status: 400 })
    }

    // If removing an admin, check for a passed vote
    if (targetMember.role === 'admin') {
      const { data: passedVote } = await supabase
        .from('circle_votes')
        .select('id')
        .eq('circle_id', circleId)
        .eq('vote_type', 'remove_member')
        .eq('target_user_id', targetMember.user_id)
        .eq('status', 'passed')
        .single()

      if (!passedVote) {
        return NextResponse.json({ 
          error: 'A vote is required to remove an admin.',
          require_vote: true
        }, { status: 409 })
      }
    }
  }

  // Remove the member
  const { error } = await supabase
    .from('circle_members')
    .delete()
    .eq('id', memberId)

  if (error) {
    console.error('Remove member error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

// PATCH /api/circles/[id]/members/[memberId] - Update role (requires vote for admin changes)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  const { id: circleId, memberId } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get current user's membership
  const membership = await checkMembership(supabase, circleId, user.id)
  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  // Get the target member
  const { data: targetMember } = await supabase
    .from('circle_members')
    .select('id, user_id, role, invite_status')
    .eq('id', memberId)
    .eq('circle_id', circleId)
    .single()

  if (!targetMember) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  }

  const body = await request.json()
  const { role, status } = body

  // Handle status update (accept/decline pending invite for self)
  if (status && targetMember.user_id === user.id) {
    if (!['accepted', 'declined'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const updateData: Record<string, any> = { status }
    if (status === 'accepted') {
      updateData.joined_at = new Date().toISOString()
    }

    const { data: updated, error } = await supabase
      .from('circle_members')
      .update(updateData)
      .eq('id', memberId)
      .select()
      .single()

    if (error) {
      console.error('Update member status error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ member: updated })
  }

  // Handle role update
  if (role) {
    if (!['member', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role. Use "member" or "admin"' }, { status: 400 })
    }

    // Can't change owner's role
    if (targetMember.role === 'owner') {
      return NextResponse.json({ error: 'Cannot change owner role' }, { status: 400 })
    }

    // Promoting to admin
    if (role === 'admin' && targetMember.role === 'member') {
      // Only owner can promote to admin directly, others need a vote
      if (membership.role !== 'owner') {
        const { data: passedVote } = await supabase
          .from('circle_votes')
          .select('id')
          .eq('circle_id', circleId)
          .eq('vote_type', 'promote_admin')
          .eq('target_user_id', targetMember.user_id)
          .eq('status', 'passed')
          .single()

        if (!passedVote) {
          return NextResponse.json({ 
            error: 'A vote is required to promote a member to admin.',
            require_vote: true
          }, { status: 409 })
        }
      }
    }

    // Demoting from admin
    if (role === 'member' && targetMember.role === 'admin') {
      // Check for a passed vote
      const { data: passedVote } = await supabase
        .from('circle_votes')
        .select('id')
        .eq('circle_id', circleId)
        .eq('vote_type', 'demote_admin')
        .eq('target_user_id', targetMember.user_id)
        .eq('status', 'passed')
        .single()

      if (!passedVote && membership.role !== 'owner') {
        return NextResponse.json({ 
          error: 'A vote is required to demote an admin.',
          require_vote: true
        }, { status: 409 })
      }
    }

    const { data: updated, error } = await supabase
      .from('circle_members')
      .update({ role })
      .eq('id', memberId)
      .select()
      .single()

    if (error) {
      console.error('Update member role error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ member: updated })
  }

  return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
}
