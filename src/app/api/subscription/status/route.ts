import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch subscription with plan details
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select(`
        *,
        plan:plan_id (*)
      `)
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing', 'past_due'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('Error fetching subscription:', error);
      return NextResponse.json(
        { error: 'Failed to fetch subscription' },
        { status: 500 }
      );
    }

    // Get profile for subscription status
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status, current_plan_id')
      .eq('id', user.id)
      .single();

    // Fetch all active plans for reference
    const { data: plans } = await supabase
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    return NextResponse.json({
      subscription: subscription || null,
      profile: {
        subscription_status: profile?.subscription_status || 'free',
        current_plan_id: profile?.current_plan_id,
      },
      plans: plans || [],
    });
  } catch (error: any) {
    console.error('Error in subscription status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
