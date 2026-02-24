import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminSupabase = createAdminClient();
    const { data: adminUser } = await adminSupabase
      .from('admin_users')
      .select('id')
      .eq('id', user.id)
      .eq('is_active', true)
      .single();

    if (!adminUser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { message, model, systemPrompt } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 });
    }

    // Test with Claude (default)
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ 
        error: 'ANTHROPIC_API_KEY not configured',
        response: 'Error: API key not set. Add ANTHROPIC_API_KEY to your environment variables.'
      });
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const response = await anthropic.messages.create({
      model: model || 'claude-sonnet-4-20250514',
      max_tokens: 500,
      temperature: 0.7,
      system: systemPrompt || 'You are a helpful assistant.',
      messages: [{ role: 'user', content: message }],
    });

    const textBlock = response.content.find(block => block.type === 'text');
    const responseText = textBlock?.type === 'text' ? textBlock.text : 'No response generated';

    return NextResponse.json({ 
      response: responseText,
      model: model || 'claude-sonnet-4-20250514',
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      }
    });

  } catch (error) {
    console.error('AI test error:', error);
    return NextResponse.json({ 
      error: 'Test failed',
      response: (error as Error).message
    }, { status: 500 });
  }
}
