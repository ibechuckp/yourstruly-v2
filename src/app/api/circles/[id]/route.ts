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

// GET /api/circles/[id] - Get circle details (if member)
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

  // Get circle details with member count
  const { data: circle, error } = await supabase
    .from('circles')
    .select(`
      *,
      member_count:circle_members(count)
    `)
    .eq('id', circleId)
    
    .single()

  if (error || !circle) {
    return NextResponse.json({ error: 'Circle not found' }, { status: 404 })
  }

  // Get accepted member count
  const { count: memberCount } = await supabase
    .from('circle_members')
    .select('*', { count: 'exact', head: true })
    .eq('circle_id', circleId)
    .eq('invite_status', 'accepted')

  return NextResponse.json({ 
    circle: {
      ...circle,
      member_count: memberCount || 0,
      my_role: membership.role
    }
  })
}

// PATCH /api/circles/[id] - Update circle (admin only)
export async function PATCH(
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

  const body = await request.json()
  const { name, description } = body

  const updateData: Record<string, any> = {}
  
  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 })
    }
    if (name.length > 100) {
      return NextResponse.json({ error: 'Name must be 100 characters or less' }, { status: 400 })
    }
    updateData.name = name.trim()
  }
  
  if (description !== undefined) {
    updateData.description = description?.trim() || null
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const { data: circle, error } = await supabase
    .from('circles')
    .update(updateData)
    .eq('id', circleId)
    
    .select()
    .single()

  if (error) {
    console.error('Update circle error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ circle })
}

// DELETE /api/circles/[id] - Soft delete (requires vote check for multi-admin circles)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: circleId } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check owner status
  const membership = await checkMembership(supabase, circleId, user.id)
  if (!membership || membership.role !== 'owner') {
    return NextResponse.json({ error: 'Only the owner can delete a circle' }, { status: 403 })
  }

  // Check if there are other admins - if so, require a vote
  const { count: adminCount } = await supabase
    .from('circle_members')
    .select('*', { count: 'exact', head: true })
    .eq('circle_id', circleId)
    .eq('invite_status', 'accepted')
    .in('role', ['owner', 'admin'])

  if (adminCount && adminCount > 1) {
    // Check for a passed delete_circle vote
    const { data: passedVote } = await supabase
      .from('circle_votes')
      .select('id')
      .eq('circle_id', circleId)
      .eq('vote_type', 'delete_circle')
      .eq('status', 'passed')
      .single()

    if (!passedVote) {
      return NextResponse.json({ 
        error: 'Multiple admins exist. A vote is required to delete this circle.',
        require_vote: true
      }, { status: 409 })
    }
  }

  // Hard delete the circle (cascade will remove members)
  const { error } = await supabase
    .from('circles')
    .delete()
    .eq('id', circleId)

  if (error) {
    console.error('Delete circle error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
