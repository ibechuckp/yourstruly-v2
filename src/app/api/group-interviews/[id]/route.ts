import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/group-interviews/[id] - Get a specific group interview with participants
export async function GET(
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

    const { data, error } = await supabase
      .from('group_interviews')
      .select(`
        *,
        participants:group_interview_participants(
          *,
          contact:contacts(id, name, avatar_url),
          responses:group_interview_responses(*)
        )
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Group interview not found' }, { status: 404 })
      }
      console.error('Error fetching group interview:', error)
      return NextResponse.json({ error: 'Failed to fetch group interview' }, { status: 500 })
    }

    // Calculate stats
    const participant_count = data.participants?.length || 0
    const completed_count = data.participants?.filter((p: any) => p.status === 'completed').length || 0
    const response_count = data.participants?.reduce((acc: number, p: any) => acc + (p.responses?.length || 0), 0) || 0

    return NextResponse.json({ 
      groupInterview: {
        ...data,
        participant_count,
        completed_count,
        response_count,
      }
    })
  } catch (error) {
    console.error('Error in GET /api/group-interviews/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/group-interviews/[id] - Update a group interview
export async function PUT(
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

    // Only allow updating certain fields
    const allowedFields = ['title', 'description', 'questions', 'allow_video', 'allow_audio', 'allow_text', 'deadline', 'status']
    const updates: Record<string, any> = {}
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field]
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('group_interviews')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating group interview:', error)
      return NextResponse.json({ error: 'Failed to update group interview' }, { status: 500 })
    }

    return NextResponse.json({ groupInterview: data })
  } catch (error) {
    console.error('Error in PUT /api/group-interviews/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/group-interviews/[id] - Delete a group interview
export async function DELETE(
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

    const { error } = await supabase
      .from('group_interviews')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting group interview:', error)
      return NextResponse.json({ error: 'Failed to delete group interview' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/group-interviews/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
