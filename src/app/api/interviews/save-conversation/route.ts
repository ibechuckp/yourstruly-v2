import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Exchange {
  question: string;
  response: string;
  audioUrl?: string;
}

// POST /api/interviews/save-conversation
// Save multiple exchanges from an interview conversation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sessionId,
      questionId,
      accessToken,
      exchanges,
      originalQuestion,
    } = body;

    if (!sessionId || !questionId || !accessToken || !exchanges?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate session
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('interview_sessions')
      .select('id, user_id, title, contact_id')
      .eq('id', sessionId)
      .eq('access_token', accessToken)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 403 });
    }

    // Get contact
    let contact: { id: string; full_name: string } | null = null;
    if (session.contact_id) {
      const { data: contactData } = await supabaseAdmin
        .from('contacts')
        .select('id, full_name')
        .eq('id', session.contact_id)
        .single();
      contact = contactData;
    }

    if (!contact) {
      return NextResponse.json({ error: 'No contact linked to session' }, { status: 400 });
    }

    // Build full transcript from all exchanges
    const fullTranscript = (exchanges as Exchange[])
      .map((ex, i) => `Q${i + 1}: ${ex.question}\nA${i + 1}: ${ex.response}`)
      .join('\n\n');

    // Generate summary using AI
    let summary = '';
    try {
      const summaryResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-summary`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: fullTranscript,
          type: 'interview',
        }),
      });
      
      if (summaryResponse.ok) {
        const data = await summaryResponse.json();
        summary = data.summary || '';
      }
    } catch (e) {
      // Summary generation is optional
      console.log('Summary generation skipped');
    }

    // If no AI summary, create a simple one
    if (!summary) {
      summary = `Interview with ${contact.full_name} about: "${originalQuestion}" - ${exchanges.length} responses captured.`;
    }

    // Save the video response record
    const { data: responseRecord, error: responseError } = await supabaseAdmin
      .from('video_responses')
      .insert({
        session_id: sessionId,
        session_question_id: questionId,
        user_id: session.user_id,
        contact_id: contact.id,
        video_url: 'conversation',
        video_key: 'conversation',
        transcript: fullTranscript,
        ai_summary: summary,
        answer_type: 'conversation',
        duration: 0,
      })
      .select()
      .single();

    if (responseError) {
      console.error('Failed to save response:', responseError);
      return NextResponse.json({ 
        error: 'Failed to save response',
        details: responseError.message
      }, { status: 500 });
    }

    // Mark question as answered
    await supabaseAdmin
      .from('session_questions')
      .update({ status: 'answered' })
      .eq('id', questionId);

    // Create memory for the interviewer
    const { data: memoryRecord } = await supabaseAdmin
      .from('memories')
      .insert({
        user_id: session.user_id,
        title: `Interview: ${originalQuestion.slice(0, 50)}${originalQuestion.length > 50 ? '...' : ''}`,
        content: fullTranscript,
        memory_type: 'interview',
        source: 'video_journalist',
        ai_summary: summary,
        metadata: {
          interview_session: sessionId,
          question: originalQuestion,
          answered_by: contact.full_name,
          session_title: session.title,
          exchange_count: exchanges.length,
          response_id: responseRecord.id,
        },
      })
      .select()
      .single();

    return NextResponse.json({ 
      success: true,
      responseId: responseRecord.id,
      memoryId: memoryRecord?.id,
      exchangeCount: exchanges.length,
    });
  } catch (error: any) {
    console.error('Save conversation error:', error);
    return NextResponse.json({ 
      error: 'Failed to save conversation',
      details: error.message 
    }, { status: 500 });
  }
}
