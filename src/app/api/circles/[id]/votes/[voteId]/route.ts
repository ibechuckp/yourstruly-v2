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

// GET /api/circles/[id]/votes/[voteId] - Vote details with current counts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; voteId: string }> }
) {
  const { id: circleId, voteId } = await params
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

  // Get vote details
  const { data: vote, error } = await supabase
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
    .eq('id', voteId)
    .eq('circle_id', circleId)
    .single()

  if (error || !vote) {
    return NextResponse.json({ error: 'Vote not found' }, { status: 404 })
  }

  // Get all ballots
  const { data: ballots } = await supabase
    .from('circle_vote_ballots')
    .select(`
      id,
      vote,
      created_at,
      voter:profiles!circle_vote_ballots_user_id_fkey (
        id,
        full_name,
        avatar_url
      )
    `)
    .eq('vote_id', voteId)
    .order('created_at', { ascending: true })

  // Get total admin count
  const { count: adminCount } = await supabase
    .from('circle_members')
    .select('*', { count: 'exact', head: true })
    .eq('circle_id', circleId)
    .eq('invite_status', 'accepted')
    .in('role', ['owner', 'admin'])

  // Check user's vote (voter is an array from Supabase join)
  const myBallot = ballots?.find(b => {
    const voter = Array.isArray(b.voter) ? b.voter[0] : b.voter
    return voter?.id === user.id
  })

  return NextResponse.json({ 
    vote: {
      ...vote,
      ballots,
      total_admins: adminCount || 0,
      votes_cast: ballots?.length || 0,
      my_vote: myBallot?.vote || null,
      can_vote: ['owner', 'admin'].includes(membership.role) && 
                vote.status === 'active' && 
                !myBallot
    }
  })
}

// POST /api/circles/[id]/votes/[voteId] - Cast vote (admin only)
// Body: { vote: 'yes' | 'no' }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; voteId: string }> }
) {
  const { id: circleId, voteId } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check admin membership
  const membership = await checkMembership(supabase, circleId, user.id)
  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return NextResponse.json({ error: 'Admin access required to vote' }, { status: 403 })
  }

  // Get the vote
  const { data: vote } = await supabase
    .from('circle_votes')
    .select('*')
    .eq('id', voteId)
    .eq('circle_id', circleId)
    .single()

  if (!vote) {
    return NextResponse.json({ error: 'Vote not found' }, { status: 404 })
  }

  if (vote.status !== 'active') {
    return NextResponse.json({ error: 'This vote is no longer active' }, { status: 400 })
  }

  if (new Date(vote.expires_at) < new Date()) {
    return NextResponse.json({ error: 'This vote has expired' }, { status: 400 })
  }

  // Check if already voted
  const { data: existingBallot } = await supabase
    .from('circle_vote_ballots')
    .select('id')
    .eq('vote_id', voteId)
    .eq('user_id', user.id)
    .single()

  if (existingBallot) {
    return NextResponse.json({ error: 'You have already voted' }, { status: 409 })
  }

  const body = await request.json()
  const { vote: voteChoice } = body

  if (!voteChoice || !['yes', 'no'].includes(voteChoice)) {
    return NextResponse.json({ error: 'Vote must be "yes" or "no"' }, { status: 400 })
  }

  // Cast the vote
  const { error: ballotError } = await supabase
    .from('circle_vote_ballots')
    .insert({
      vote_id: voteId,
      user_id: user.id,
      vote: voteChoice
    })

  if (ballotError) {
    console.error('Cast vote error:', ballotError)
    return NextResponse.json({ error: ballotError.message }, { status: 500 })
  }

  // The trigger will automatically update the vote tallies and check resolution

  // Get updated vote
  const { data: updatedVote } = await supabase
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
    .eq('id', voteId)
    .single()

  return NextResponse.json({ 
    success: true,
    vote: updatedVote,
    your_vote: voteChoice
  })
}
