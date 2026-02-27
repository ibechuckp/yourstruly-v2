import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Use service role for database operations

// POST /api/interviews/skip
// Skip a question in an interview session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, questionId, accessToken, isLastQuestion } = body;

    if (!sessionId || !questionId || !accessToken) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate session token
    const { data: session, error: sessionError } = await createAdminClient()
      .from('interview_sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('access_token', accessToken)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 403 });
    }

    // Mark question as skipped
    const { error: updateError } = await createAdminClient()
      .from('session_questions')
      .update({ status: 'skipped' })
      .eq('id', questionId);

    if (updateError) {
      console.error('Failed to skip question:', updateError);
      return NextResponse.json({ error: 'Failed to skip question' }, { status: 500 });
    }

    // If this was the last question, complete the session
    if (isLastQuestion) {
      await createAdminClient()
        .from('interview_sessions')
        .update({ 
          status: 'completed', 
          completed_at: new Date().toISOString() 
        })
        .eq('id', sessionId);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Skip question error:', error);
    return NextResponse.json({ 
      error: 'Failed to skip question',
      details: error.message 
    }, { status: 500 });
  }
}
