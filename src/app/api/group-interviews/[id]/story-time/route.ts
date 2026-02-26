import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { StoryTimeData, GroupInterviewQuestion } from '@/types/group-interview'

// GET /api/group-interviews/[id]/story-time - Get Story Time view data
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

    // Get the group interview with all responses
    const { data: groupInterview, error: giError } = await supabase
      .from('group_interviews')
      .select(`
        *,
        participants:group_interview_participants(
          id,
          name,
          status,
          contact:contacts(id, name, avatar_url)
        )
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (giError || !groupInterview) {
      return NextResponse.json({ error: 'Group interview not found' }, { status: 404 })
    }

    // Get all responses
    const { data: responses, error: rError } = await supabase
      .from('group_interview_responses')
      .select(`
        *,
        participant:group_interview_participants(
          id,
          name,
          contact:contacts(id, name, avatar_url)
        )
      `)
      .eq('group_interview_id', id)
      .order('created_at', { ascending: true })

    if (rError) {
      console.error('Error fetching responses:', rError)
      return NextResponse.json({ error: 'Failed to fetch responses' }, { status: 500 })
    }

    const questions = groupInterview.questions as GroupInterviewQuestion[]

    // Group responses by question
    const questionGroups = questions.map(question => ({
      question,
      responses: (responses || [])
        .filter(r => r.question_id === question.id)
        .map(r => ({
          ...r,
          participant: r.participant,
        })),
    }))

    // Create flat slides array for carousel view
    const slides = questionGroups.flatMap(qg => 
      qg.responses.map(response => ({
        response,
        participant: response.participant,
        question: qg.question,
      }))
    )

    const storyTimeData: StoryTimeData = {
      groupInterview: {
        ...groupInterview,
        participant_count: groupInterview.participants?.length || 0,
        completed_count: groupInterview.participants?.filter((p: any) => p.status === 'completed').length || 0,
      },
      slides,
      questionGroups,
    }

    return NextResponse.json(storyTimeData)
  } catch (error) {
    console.error('Error in GET /api/group-interviews/[id]/story-time:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
