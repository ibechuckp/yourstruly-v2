import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logAdminAction } from '@/lib/admin/audit';
import { AuditActions } from '@/lib/admin/audit-actions';

// GET /api/admin/engagement/prompts/:id - Get single prompt
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('prompt_templates')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Failed to fetch prompt:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prompt' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/engagement/prompts/:id - Update prompt
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get existing prompt for audit log
    const { data: existing } = await supabase
      .from('prompt_templates')
      .select('*')
      .eq('id', id)
      .single();
    
    if (!existing) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }
    
    const body = await request.json();
    
    const { data, error } = await supabase
      .from('prompt_templates')
      .update({
        type: body.type,
        category: body.category || null,
        subcategory: body.subcategory || null,
        prompt_text: body.prompt_text,
        prompt_variations: body.prompt_variations || [],
        target_interest: body.target_interest || null,
        target_skill: body.target_skill || null,
        target_hobby: body.target_hobby || null,
        target_religion: body.target_religion || null,
        target_field: body.target_field || null,
        is_active: body.is_active ?? true,
        priority_boost: body.priority_boost || 0,
        cooldown_days: body.cooldown_days || 30,
        seasonal_months: body.seasonal_months || [],
        anniversary_based: body.anniversary_based || false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Log the action
    await logAdminAction(
      AuditActions.ENGAGEMENT_PROMPT_UPDATE,
      'prompt_template',
      id,
      existing,
      data
    );
    
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Failed to update prompt:', error);
    return NextResponse.json(
      { error: 'Failed to update prompt' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/engagement/prompts/:id - Delete prompt
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get existing prompt for audit log
    const { data: existing } = await supabase
      .from('prompt_templates')
      .select('*')
      .eq('id', id)
      .single();
    
    if (!existing) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }
    
    const { error } = await supabase
      .from('prompt_templates')
      .delete()
      .eq('id', id);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Log the action
    await logAdminAction(
      AuditActions.ENGAGEMENT_PROMPT_DELETE,
      'prompt_template',
      id,
      existing,
      {}
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete prompt:', error);
    return NextResponse.json(
      { error: 'Failed to delete prompt' },
      { status: 500 }
    );
  }
}
