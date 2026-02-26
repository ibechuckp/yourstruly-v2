import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/group-interviews/[id]/participants - Add participants to a group interview
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

    // Verify ownership
    const { data: groupInterview, error: giError } = await supabase
      .from('group_interviews')
      .select('id, status')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (giError || !groupInterview) {
      return NextResponse.json({ error: 'Group interview not found' }, { status: 404 })
    }

    const body = await request.json()
    const { participants } = body

    if (!participants?.length) {
      return NextResponse.json({ error: 'At least one participant is required' }, { status: 400 })
    }

    // Format participants for insertion
    const participantsToInsert = participants.map((p: any) => ({
      group_interview_id: id,
      contact_id: p.contact_id || null,
      name: p.name,
      email: p.email || null,
      phone: p.phone || null,
      status: 'pending',
    }))

    const { data, error } = await supabase
      .from('group_interview_participants')
      .insert(participantsToInsert)
      .select()

    if (error) {
      console.error('Error adding participants:', error)
      return NextResponse.json({ error: 'Failed to add participants' }, { status: 500 })
    }

    // If group interview is still in draft, activate it
    if (groupInterview.status === 'draft') {
      await supabase
        .from('group_interviews')
        .update({ status: 'active' })
        .eq('id', id)
    }

    return NextResponse.json({ participants: data }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/group-interviews/[id]/participants:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/group-interviews/[id]/participants - Remove a participant
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

    const { searchParams } = new URL(request.url)
    const participantId = searchParams.get('participantId')

    if (!participantId) {
      return NextResponse.json({ error: 'participantId is required' }, { status: 400 })
    }

    // Verify ownership via group interview
    const { data: participant, error: pError } = await supabase
      .from('group_interview_participants')
      .select('id, group_interviews!inner(user_id)')
      .eq('id', participantId)
      .eq('group_interview_id', id)
      .single()

    if (pError || !participant || (participant as any).group_interviews?.user_id !== user.id) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 })
    }

    const { error } = await supabase
      .from('group_interview_participants')
      .delete()
      .eq('id', participantId)

    if (error) {
      console.error('Error removing participant:', error)
      return NextResponse.json({ error: 'Failed to remove participant' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/group-interviews/[id]/participants:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
