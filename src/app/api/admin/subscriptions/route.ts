import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkAdminAuth, unauthorizedResponse } from '@/lib/auth/admin'

// GET - Fetch all subscription settings and stats
export async function GET(request: NextRequest) {
  // Verify admin access
  const auth = await checkAdminAuth()
  if (!auth.isAdmin) {
    return unauthorizedResponse(auth.error)
  }

  try {
    const supabase = createAdminClient()

    // Fetch all data in parallel
    const [plansRes, pricingRes, featuresRes, statsRes] = await Promise.all([
      supabase.from('subscription_plans').select('*').order('price_cents'),
      supabase.from('seat_pricing').select('*').order('min_seat'),
      supabase.from('feature_definitions').select('*').order('category, name'),
      getSubscriptionStats(supabase)
    ])

    return NextResponse.json({
      plans: plansRes.data || [],
      seatPricing: pricingRes.data || [],
      features: featuresRes.data || [],
      stats: statsRes
    })
  } catch (err) {
    console.error('Admin subscriptions GET error:', err)
    return NextResponse.json({ error: 'Failed to load data' }, { status: 500 })
  }
}

// PUT - Update subscription settings
export async function PUT(request: NextRequest) {
  // Verify admin access
  const auth = await checkAdminAuth()
  if (!auth.isAdmin) {
    return unauthorizedResponse(auth.error)
  }

  try {
    const supabase = createAdminClient()
    const { plans, seatPricing, features } = await request.json()

    // Update plans
    if (plans && Array.isArray(plans)) {
      for (const plan of plans) {
        await supabase
          .from('subscription_plans')
          .update({
            price_cents: plan.price_cents,
            storage_limit_bytes: plan.storage_limit_bytes,
            updated_at: new Date().toISOString()
          })
          .eq('id', plan.id)
      }
    }

    // Update seat pricing
    if (seatPricing && Array.isArray(seatPricing)) {
      for (const tier of seatPricing) {
        await supabase
          .from('seat_pricing')
          .update({
            price_cents: tier.price_cents,
            updated_at: new Date().toISOString()
          })
          .eq('id', tier.id)
      }
    }

    // Update feature defaults
    if (features && Array.isArray(features)) {
      for (const feature of features) {
        await supabase
          .from('feature_definitions')
          .update({
            default_free: feature.default_free,
            default_premium: feature.default_premium
          })
          .eq('id', feature.id)
      }

      // Also update the plan features JSONB based on feature_definitions
      await syncPlanFeatures(supabase)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Admin subscriptions PUT error:', err)
    return NextResponse.json({ error: 'Failed to save changes' }, { status: 500 })
  }
}

async function getSubscriptionStats(supabase: any) {
  // Total users
  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  // Subscriptions by plan
  const { data: subsByPlan } = await supabase
    .from('user_subscriptions')
    .select(`
      id,
      plan:subscription_plans(name, price_cents)
    `)
    .eq('status', 'active')

  let freeUsers = 0
  let premiumUsers = 0
  let monthlyRevenue = 0

  if (subsByPlan) {
    for (const sub of subsByPlan) {
      if (sub.plan?.name === 'free') {
        freeUsers++
      } else if (sub.plan?.name === 'premium') {
        premiumUsers++
        monthlyRevenue += sub.plan.price_cents || 0
      }
    }
  }

  // Total seats
  const { count: totalSeats } = await supabase
    .from('subscription_seats')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  // Add seat revenue
  const { data: paidSeats } = await supabase
    .from('subscription_seats')
    .select('seat_number')
    .eq('status', 'active')
    .gte('seat_number', 3)

  if (paidSeats) {
    const { data: seatPricing } = await supabase
      .from('seat_pricing')
      .select('*')
      .order('min_seat')

    for (const seat of paidSeats) {
      const tier = seatPricing?.find(
        (p: any) => seat.seat_number >= p.min_seat && seat.seat_number <= p.max_seat
      )
      if (tier) {
        monthlyRevenue += tier.price_cents
      }
    }
  }

  return {
    total_users: totalUsers || 0,
    free_users: freeUsers,
    premium_users: premiumUsers,
    total_seats: totalSeats || 0,
    monthly_revenue: monthlyRevenue
  }
}

async function syncPlanFeatures(supabase: any) {
  // Get all features
  const { data: features } = await supabase
    .from('feature_definitions')
    .select('key, default_free, default_premium')

  if (!features) return

  // Build feature objects
  const freeFeatures: Record<string, boolean> = {}
  const premiumFeatures: Record<string, boolean> = {}

  for (const f of features) {
    freeFeatures[f.key] = f.default_free
    premiumFeatures[f.key] = f.default_premium
  }

  // Update plans
  await supabase
    .from('subscription_plans')
    .update({ features: freeFeatures })
    .eq('name', 'free')

  await supabase
    .from('subscription_plans')
    .update({ features: premiumFeatures })
    .eq('name', 'premium')
}
