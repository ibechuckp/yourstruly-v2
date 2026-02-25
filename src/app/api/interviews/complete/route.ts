import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role for database operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/interviews/complete
// Mark interview session as completed
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, accessToken } = body;

    if (!sessionId || !accessToken) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate session token
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('interview_sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('access_token', accessToken)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 403 });
    }

    // Update session status
    const { error: updateError } = await supabaseAdmin
      .from('interview_sessions')
      .update({ 
        status: 'completed', 
        completed_at: new Date().toISOString() 
      })
      .eq('id', sessionId);

    if (updateError) {
      console.error('Failed to complete session:', updateError);
      return NextResponse.json({ error: 'Failed to complete session' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Complete session error:', error);
    return NextResponse.json({ 
      error: 'Failed to complete session',
      details: error.message 
    }, { status: 500 });
  }
}
