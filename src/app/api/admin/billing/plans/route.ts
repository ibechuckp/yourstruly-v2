import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkAdminAuth } from '@/lib/auth/admin';

// GET /api/admin/billing/plans
export async function GET() {
  const auth = await checkAdminAuth();
  if (!auth.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const supabase = await createClient();
  const { data: plans, error } = await supabase
    .from('billing_plans')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Failed to fetch billing plans:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Normalize features from JSONB to string[]
  const normalized = (plans || []).map(p => ({
    ...p,
    features: Array.isArray(p.features) ? p.features : [],
    limits: p.limits || {},
  }));

  return NextResponse.json({ plans: normalized });
}

// POST /api/admin/billing/plans
export async function POST(request: NextRequest) {
  const auth = await checkAdminAuth();
  if (!auth.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const supabase = await createClient();
  const body = await request.json();

  const { data: plan, error } = await supabase
    .from('billing_plans')
    .insert({
      name: body.name,
      slug: body.slug,
      description: body.description || null,
      price_cents: body.price_cents,
      currency: body.currency || 'USD',
      interval: body.interval,
      stripe_price_id: body.stripe_price_id || null,
      stripe_product_id: body.stripe_product_id || null,
      features: body.features || [],
      limits: body.limits || {},
      is_active: body.is_active ?? true,
      is_default: body.is_default ?? false,
      display_order: body.display_order ?? 0,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create plan:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ plan });
}
