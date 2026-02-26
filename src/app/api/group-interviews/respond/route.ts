import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET /api/group-interviews/respond?token=xxx - Load group interview for participant
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Get participant and group interview
    const { data: participant, error: pError } = await supabase
      .from('group_interview_participants')
      .select(`
        *,
        group_interview:group_interviews(
          id,
          title,
          description,
          questions,
          allow_video,
          allow_audio,
          allow_text,
          deadline,
          status,
          user_id,
          profiles:profiles!group_interviews_user_id_fkey(
            full_name,
            avatar_url
          )
        ),
        responses:group_interview_responses(*)
      `)
      .eq('access_token', token)
      .single()

    if (pError || !participant) {
      return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 })
    }

    const groupInterview = (participant as any).group_interview

    // Check if interview is active
    if (groupInterview.status !== 'active') {
      return NextResponse.json({ 
        error: groupInterview.status === 'closed' 
          ? 'This group interview has been closed' 
          : 'This group interview is not available'
      }, { status: 403 })
    }

    // Check deadline
    if (groupInterview.deadline && new Date(groupInterview.deadline) < new Date()) {
      return NextResponse.json({ error: 'The deadline for this group interview has passed' }, { status: 403 })
    }

    // Update participant status if first view
    if (participant.status === 'pending') {
      await supabase
        .from('group_interview_participants')
        .update({ 
          status: 'viewed',
          viewed_at: new Date().toISOString()
        })
        .eq('id', participant.id)
    }

    // Get owner info
    const owner = groupInterview.profiles

    return NextResponse.json({
      participant: {
        id: participant.id,
        name: participant.name,
        status: participant.status,
      },
      groupInterview: {
        id: groupInterview.id,
        title: groupInterview.title,
        description: groupInterview.description,
        questions: groupInterview.questions,
        allow_video: groupInterview.allow_video,
        allow_audio: groupInterview.allow_audio,
        allow_text: groupInterview.allow_text,
        deadline: groupInterview.deadline,
      },
      owner: {
        name: owner?.full_name || 'Someone',
        avatar_url: owner?.avatar_url,
      },
      responses: participant.responses || [],
    })
  } catch (error) {
    console.error('Error in GET /api/group-interviews/respond:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/group-interviews/respond - Submit a response
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, question_id, response_type, response_text, media_url, media_duration_seconds } = body

    if (!token || !question_id || !response_type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Get participant
    const { data: participant, error: pError } = await supabase
      .from('group_interview_participants')
      .select('id, group_interview_id, status, group_interviews!inner(status, questions)')
      .eq('access_token', token)
      .single()

    if (pError || !participant) {
      return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 })
    }

    const groupInterview = (participant as any).group_interviews

    // Verify interview is active
    if (groupInterview.status !== 'active') {
      return NextResponse.json({ error: 'This group interview is not accepting responses' }, { status: 403 })
    }

    // Verify question exists
    const questions = groupInterview.questions as any[]
    if (!questions.find((q: any) => q.id === question_id)) {
      return NextResponse.json({ error: 'Invalid question' }, { status: 400 })
    }

    // Update participant status
    if (participant.status === 'pending' || participant.status === 'viewed') {
      await supabase
        .from('group_interview_participants')
        .update({ 
          status: 'in_progress',
          started_at: participant.status === 'pending' || participant.status === 'viewed' 
            ? new Date().toISOString() 
            : undefined
        })
        .eq('id', participant.id)
    }

    // Upsert response (allow updating)
    const { data: response, error: rError } = await supabase
      .from('group_interview_responses')
      .upsert({
        group_interview_id: participant.group_interview_id,
        participant_id: participant.id,
        question_id,
        response_type,
        response_text: response_text || null,
        media_url: media_url || null,
        media_duration_seconds: media_duration_seconds || null,
        transcription_status: response_type === 'text' ? 'completed' : 'pending',
      }, {
        onConflict: 'participant_id,question_id',
      })
      .select()
      .single()

    if (rError) {
      console.error('Error saving response:', rError)
      return NextResponse.json({ error: 'Failed to save response' }, { status: 500 })
    }

    return NextResponse.json({ response })
  } catch (error) {
    console.error('Error in POST /api/group-interviews/respond:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/group-interviews/respond - Mark as complete
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('group_interview_participants')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('access_token', token)
      .select()
      .single()

    if (error) {
      console.error('Error marking complete:', error)
      return NextResponse.json({ error: 'Failed to mark as complete' }, { status: 500 })
    }

    return NextResponse.json({ participant: data })
  } catch (error) {
    console.error('Error in PUT /api/group-interviews/respond:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
