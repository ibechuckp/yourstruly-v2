import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkAdminAuth } from '@/lib/auth/admin';

// GET /api/admin/billing/subscribers
export async function GET(request: NextRequest) {
  const auth = await checkAdminAuth();
  if (!auth.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || 'all';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 20;
  const offset = (page - 1) * limit;

  const supabase = await createClient();

  // Query subscriptions joined with profiles and billing_plans
  let query = supabase
    .from('subscriptions')
    .select(`
      id,
      user_id,
      plan_id,
      status,
      current_period_start,
      current_period_end,
      cancel_at_period_end,
      created_at,
      profiles!inner(full_name, email, avatar_url),
      billing_plans(name, slug, interval)
    `, { count: 'exact' });

  if (status !== 'all') {
    query = query.eq('status', status);
  }

  if (search) {
    query = query.or(`profiles.email.ilike.%${search}%,profiles.full_name.ilike.%${search}%`);
  }

  const { data: subscribers, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    // If the join fails (table doesn't exist or no FK), try a simpler query
    console.error('Subscribers query error:', error);
    
    // Fallback: try querying subscriptions alone
    const { data: fallback, count: fbCount, error: fbError } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (fbError) {
      return NextResponse.json({ error: fbError.message }, { status: 500 });
    }

    return NextResponse.json({
      subscribers: fallback || [],
      total: fbCount || 0,
      page,
      totalPages: Math.ceil((fbCount || 0) / limit),
    });
  }

  return NextResponse.json({
    subscribers: subscribers || [],
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
  });
}
