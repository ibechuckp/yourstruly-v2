import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { processMessage } from '@/lib/conversation-engine/engine';
import { createInitialState, EngineState } from '@/lib/conversation-engine/types';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      message,
      engineState,
      context = 'engagement',
      userName,
      userProfile,
    } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 });
    }

    const state: EngineState = engineState || createInitialState();

    const result = await processMessage({
      message: message.trim(),
      engineState: state,
      context,
      userName: userName || 'Friend',
      userProfile,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Conversation engine error:', error);
    return NextResponse.json({ error: 'Engine error' }, { status: 500 });
  }
}
