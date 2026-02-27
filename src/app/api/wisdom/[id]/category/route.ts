import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Valid wisdom categories
const VALID_CATEGORIES = [
  'life_lessons',
  'relationships', 
  'career',
  'parenting',
  'health',
  'spirituality',
  'creativity',
  'family',
  'values',
  'recipes',
  'advice',
  'other',
];

// PATCH /api/wisdom/[id]/category
// Update the category of a wisdom entry
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { category } = body;

    if (!category) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 });
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ 
        error: 'Invalid category', 
        validCategories: VALID_CATEGORIES 
      }, { status: 400 });
    }

    // Verify ownership and update
    const { data: wisdom, error: updateError } = await supabase
      .from('memories')
      .update({ 
        category,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .eq('memory_type', 'wisdom')
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update category:', updateError);
      return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
    }

    if (!wisdom) {
      return NextResponse.json({ error: 'Wisdom entry not found' }, { status: 404 });
    }

    // Also update the corresponding knowledge_entry if it exists
    // (knowledge_entries use enum, but we can still try)
    try {
      await supabase
        .from('knowledge_entries')
        .update({ updated_at: new Date().toISOString() })
        .eq('memory_id', id);
    } catch {
      // Ignore - knowledge entry may not exist or category enum may differ
    }

    return NextResponse.json({ 
      success: true, 
      wisdom,
      message: `Category updated to ${category}`,
    });

  } catch (error) {
    console.error('Update category error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
