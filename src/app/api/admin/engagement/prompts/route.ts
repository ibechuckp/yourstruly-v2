import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logAdminAction } from '@/lib/admin/audit';
import { AuditActions } from '@/lib/admin/audit-actions';

// GET /api/admin/engagement/prompts - List all prompts
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type');
    const search = searchParams.get('search');
    
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    let query = supabase
      .from('prompt_templates')
      .select('*', { count: 'exact' });
    
    if (type && type !== 'all') {
      query = query.eq('type', type);
    }
    
    if (search) {
      query = query.or(`prompt_text.ilike.%${search}%,id.ilike.%${search}%`);
    }
    
    const { data, error, count } = await query
      .order('updated_at', { ascending: false })
      .range(from, to);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({
      data,
      meta: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Failed to fetch prompts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prompts' },
      { status: 500 }
    );
  }
}

// POST /api/admin/engagement/prompts - Create new prompt
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    
    // Validate required fields
    if (!body.id || !body.type || !body.prompt_text) {
      return NextResponse.json(
        { error: 'Missing required fields: id, type, prompt_text' },
        { status: 400 }
      );
    }
    
    // Check if ID already exists
    const { data: existing } = await supabase
      .from('prompt_templates')
      .select('id')
      .eq('id', body.id)
      .single();
    
    if (existing) {
      return NextResponse.json(
        { error: 'A prompt with this ID already exists' },
        { status: 409 }
      );
    }
    
    const { data, error } = await supabase
      .from('prompt_templates')
      .insert({
        id: body.id,
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
      })
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Log the action
    await logAdminAction(
      AuditActions.ENGAGEMENT_PROMPT_CREATE,
      'prompt_template',
      data.id,
      {},
      data
    );
    
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Failed to create prompt:', error);
    return NextResponse.json(
      { error: 'Failed to create prompt' },
      { status: 500 }
    );
  }
}
