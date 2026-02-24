import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { logAdminAction } from '@/lib/admin/audit';
import { AuditActions } from '@/lib/admin/audit-actions';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminSupabase = createAdminClient();
    
    // Check admin
    const { data: adminUser } = await adminSupabase
      .from('admin_users')
      .select('id')
      .eq('id', user.id)
      .eq('is_active', true)
      .single();

    if (!adminUser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Fetch AI settings
    const { data: settings } = await adminSupabase
      .from('system_settings')
      .select('*')
      .eq('category', 'ai');

    return NextResponse.json({ settings: settings || [] });
  } catch (error) {
    console.error('Get AI config error:', error);
    return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminSupabase = createAdminClient();
    
    // Check admin
    const { data: adminUser } = await adminSupabase
      .from('admin_users')
      .select('id')
      .eq('id', user.id)
      .eq('is_active', true)
      .single();

    if (!adminUser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { config, systemPrompt, interviewPrompt } = await request.json();

    // Save settings to database
    const settingsToSave = [
      { key: 'chat_model', value: config.models?.chat, category: 'ai' },
      { key: 'embedding_model', value: config.models?.embedding, category: 'ai' },
      { key: 'embedding_provider', value: config.embeddingProvider, category: 'ai' },
      { key: 'chat_provider', value: config.chatProvider, category: 'ai' },
      { key: 'system_prompt', value: systemPrompt, category: 'ai' },
      { key: 'interview_prompt', value: interviewPrompt, category: 'ai' },
    ].filter(s => s.value !== undefined);

    for (const setting of settingsToSave) {
      await adminSupabase
        .from('system_settings')
        .upsert({
          key: setting.key,
          value: setting.value,
          category: setting.category,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'key' });
    }

    // Log the change
    await logAdminAction(
      AuditActions.AI_MODEL_UPDATE,
      'ai_config',
      'global',
      undefined,
      { config, systemPrompt: systemPrompt?.slice(0, 100) }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Save AI config error:', error);
    return NextResponse.json({ error: 'Failed to save config' }, { status: 500 });
  }
}
