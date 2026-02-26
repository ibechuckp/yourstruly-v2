import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CreateGroupInterviewRequest, GroupInterview } from '@/types/group-interview'

// GET /api/group-interviews - List user's group interviews
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let query = supabase
      .from('group_interviews')
      .select(`
        *,
        participants:group_interview_participants(count),
        responses:group_interview_responses(count)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching group interviews:', error)
      return NextResponse.json({ error: 'Failed to fetch group interviews' }, { status: 500 })
    }

    // Transform the count aggregates
    const interviews = data?.map(gi => ({
      ...gi,
      participant_count: gi.participants?.[0]?.count || 0,
      response_count: gi.responses?.[0]?.count || 0,
      participants: undefined,
      responses: undefined,
    }))

    return NextResponse.json({ groupInterviews: interviews })
  } catch (error) {
    console.error('Error in GET /api/group-interviews:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/group-interviews - Create a new group interview
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: CreateGroupInterviewRequest = await request.json()

    if (!body.title || !body.questions?.length) {
      return NextResponse.json(
        { error: 'Title and at least one question are required' },
        { status: 400 }
      )
    }

    // Format questions with IDs
    const questions = body.questions.map((q, index) => ({
      id: crypto.randomUUID(),
      text: q.text,
      order: index,
    }))

    const { data, error } = await supabase
      .from('group_interviews')
      .insert({
        user_id: user.id,
        title: body.title,
        description: body.description,
        questions,
        allow_video: body.allow_video ?? true,
        allow_audio: body.allow_audio ?? true,
        allow_text: body.allow_text ?? true,
        deadline: body.deadline,
        status: 'draft',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating group interview:', error)
      return NextResponse.json({ error: 'Failed to create group interview' }, { status: 500 })
    }

    return NextResponse.json({ groupInterview: data }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/group-interviews:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
