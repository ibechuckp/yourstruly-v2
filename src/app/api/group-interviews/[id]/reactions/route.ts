import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/group-interviews/[id]/reactions - Add/update/remove reaction on a response
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { response_id, emoji } = body

    if (!response_id) {
      return NextResponse.json({ error: 'response_id is required' }, { status: 400 })
    }

    // Verify ownership of group interview
    const { data: response, error: rError } = await supabase
      .from('group_interview_responses')
      .select('id, reactions, group_interviews!inner(user_id)')
      .eq('id', response_id)
      .eq('group_interview_id', id)
      .single()

    if (rError || !response) {
      return NextResponse.json({ error: 'Response not found' }, { status: 404 })
    }

    if ((response as any).group_interviews?.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Update reactions
    const currentReactions = (response.reactions || {}) as Record<string, string>
    
    if (emoji) {
      // Add or update reaction
      currentReactions[user.id] = emoji
    } else {
      // Remove reaction
      delete currentReactions[user.id]
    }

    const { data: updated, error: uError } = await supabase
      .from('group_interview_responses')
      .update({ reactions: currentReactions })
      .eq('id', response_id)
      .select()
      .single()

    if (uError) {
      console.error('Error updating reaction:', uError)
      return NextResponse.json({ error: 'Failed to update reaction' }, { status: 500 })
    }

    return NextResponse.json({ response: updated })
  } catch (error) {
    console.error('Error in POST /api/group-interviews/[id]/reactions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
