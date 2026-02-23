import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Helper to check membership
async function checkMembership(supabase: any, circleId: string, userId: string) {
  const { data } = await supabase
    .from('circle_members')
    .select('id, role')
    .eq('circle_id', circleId)
    .eq('user_id', userId)
    .eq('invite_status', 'accepted')
    .single()
  return data
}

// GET /api/circles/[id]/votes - List active votes
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
  const status = searchParams.get('status') || 'active'
  const includeAll = searchParams.get('include_all') === 'true'

  let query = supabase
    .from('circle_votes')
    .select(`
      *,
      initiator:profiles!circle_votes_initiated_by_fkey (
        id,
        full_name,
        avatar_url
      ),
      target:profiles!circle_votes_target_user_id_fkey (
        id,
        full_name,
        avatar_url
      )
    `)
    .eq('circle_id', circleId)
    .order('created_at', { ascending: false })

  if (!includeAll) {
    query = query.eq('status', status)
  }

  const { data: votes, error } = await query

  if (error) {
    console.error('List votes error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Check which votes the user has voted on
  const voteIds = votes?.map(v => v.id) || []
  const { data: userBallots } = await supabase
    .from('circle_vote_ballots')
    .select('vote_id, vote')
    .eq('user_id', user.id)
    .in('vote_id', voteIds)

  const userVoteMap = new Map(userBallots?.map(b => [b.vote_id, b.vote]) || [])

  const enrichedVotes = votes?.map(v => ({
    ...v,
    my_vote: userVoteMap.get(v.id) || null,
    can_vote: ['owner', 'admin'].includes(membership.role) && v.status === 'active'
  }))

  return NextResponse.json({ votes: enrichedVotes })
}

// POST /api/circles/[id]/votes - Initiate vote (admin only)
// Body: { vote_type, target_user_id? }
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

  const body = await request.json()
  const { vote_type, target_user_id, expires_in_days = 7 } = body

  const validVoteTypes = ['remove_member', 'promote_admin', 'demote_admin', 'delete_circle']
  if (!vote_type || !validVoteTypes.includes(vote_type)) {
    return NextResponse.json({ 
      error: `Invalid vote_type. Must be one of: ${validVoteTypes.join(', ')}` 
    }, { status: 400 })
  }

  // Validate target_user_id for member-related votes
  if (['remove_member', 'promote_admin', 'demote_admin'].includes(vote_type)) {
    if (!target_user_id) {
      return NextResponse.json({ error: 'target_user_id required for this vote type' }, { status: 400 })
    }

    // Check target is a member
    const { data: targetMember } = await supabase
      .from('circle_members')
      .select('role')
      .eq('circle_id', circleId)
      .eq('user_id', target_user_id)
      .eq('invite_status', 'accepted')
      .single()

    if (!targetMember) {
      return NextResponse.json({ error: 'Target user is not a member of this circle' }, { status: 400 })
    }

    // Can't vote on owner
    if (targetMember.role === 'owner') {
      return NextResponse.json({ error: 'Cannot initiate vote against the owner' }, { status: 400 })
    }

    // Validate vote type makes sense for target's current role
    if (vote_type === 'promote_admin' && targetMember.role === 'admin') {
      return NextResponse.json({ error: 'User is already an admin' }, { status: 400 })
    }
    if (vote_type === 'demote_admin' && targetMember.role === 'member') {
      return NextResponse.json({ error: 'User is not an admin' }, { status: 400 })
    }
  }

  // Check for existing active vote of same type
  const { data: existingVote } = await supabase
    .from('circle_votes')
    .select('id')
    .eq('circle_id', circleId)
    .eq('vote_type', vote_type)
    .eq('status', 'active')
    .eq('target_user_id', target_user_id || null)
    .single()

  if (existingVote) {
    return NextResponse.json({ 
      error: 'An active vote of this type already exists',
      existing_vote_id: existingVote.id
    }, { status: 409 })
  }

  // Create the vote
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + expires_in_days)

  const { data: vote, error } = await supabase
    .from('circle_votes')
    .insert({
      circle_id: circleId,
      vote_type,
      target_user_id: target_user_id || null,
      initiated_by: user.id,
      expires_at: expiresAt.toISOString()
    })
    .select(`
      *,
      initiator:profiles!circle_votes_initiated_by_fkey (
        id,
        full_name,
        avatar_url
      ),
      target:profiles!circle_votes_target_user_id_fkey (
        id,
        full_name,
        avatar_url
      )
    `)
    .single()

  if (error) {
    console.error('Create vote error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // TODO: Notify all admins about the new vote

  return NextResponse.json({ vote }, { status: 201 })
}
