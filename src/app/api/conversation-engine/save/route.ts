import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { EngineState } from '@/lib/conversation-engine/types';

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
    const { engineState, saveType } = body as {
      engineState: EngineState;
      saveType: 'memory' | 'wisdom';
    };

    if (saveType === 'memory' && engineState.activeCandidate) {
      const candidate = engineState.activeCandidate;
      const fragments = candidate.fragments;

      // Build a natural title from the event fragment
      const eventFrag = fragments.find((f) => f.type === 'event');
      const title = eventFrag?.value || 'A Memory';

      // Build description from all fragments
      const description = fragments
        .map((f) => {
          const labels: Record<string, string> = {
            event: 'What happened',
            location: 'Where',
            person: 'Who was there',
            time: 'When',
            emotion: 'How it felt',
            meaning: 'Why it matters',
          };
          return `**${labels[f.type] || f.type}:** ${f.value}`;
        })
        .join('\n\n');

      // Build tags from fragment types and values
      const tags = ['ai-captured', ...fragments.map((f) => f.type)];

      const locationFrag = fragments.find((f) => f.type === 'location');
      const timeFrag = fragments.find((f) => f.type === 'time');

      const { data: memory, error } = await supabase
        .from('memories')
        .insert({
          user_id: user.id,
          title,
          description,
          memory_type: 'story',
          location_name: locationFrag?.value || null,
          tags,
          memory_date:
            timeFrag?.value || new Date().toISOString().split('T')[0],
        })
        .select()
        .single();

      if (error) {
        console.error('Memory save error:', error);
        return NextResponse.json(
          { error: 'Failed to save memory' },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        type: 'memory',
        id: memory.id,
      });
    } else if (saveType === 'wisdom') {
      // Save the most recent wisdom entry
      const wisdom =
        engineState.wisdomEntries[engineState.wisdomEntries.length - 1];
      if (!wisdom) {
        return NextResponse.json(
          { error: 'No wisdom to save' },
          { status: 400 },
        );
      }

      const { data: entry, error } = await supabase
        .from('knowledge_entries')
        .insert({
          user_id: user.id,
          category: 'life_lesson',
          prompt_text: 'Captured during conversation',
          response_text: wisdom.statement,
          word_count: wisdom.statement.split(/\s+/).length,
          tags: ['ai-captured', 'wisdom'],
        })
        .select()
        .single();

      if (error) {
        console.error('Wisdom save error:', error);
        return NextResponse.json(
          { error: 'Failed to save wisdom' },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        type: 'wisdom',
        id: entry.id,
      });
    }

    return NextResponse.json(
      { error: 'Invalid save type' },
      { status: 400 },
    );
  } catch (error) {
    console.error('Save error:', error);
    return NextResponse.json({ error: 'Save failed' }, { status: 500 });
  }
}
