import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { estimateOrder } from '@/lib/marketplace/providers/prodigi'

// Markup percentage for photobook orders
const MARKUP_PERCENTAGE = 0.30 // 30%

// POST /api/photobook/quote - Get price quote from Prodigi with markup
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const {
    project_id,
    shipping_address, // { line1, line2?, city, state?, zip, countryCode }
    shipping_method = 'standard',
  } = body

  if (!project_id) {
    return NextResponse.json(
      { error: 'project_id is required' },
      { status: 400 }
    )
  }

  if (!shipping_address || !shipping_address.countryCode || !shipping_address.zip) {
    return NextResponse.json(
      { error: 'shipping_address with countryCode and zip is required' },
      { status: 400 }
    )
  }

  // Fetch project details
  const { data: project, error: projectError } = await supabase
    .from('photobook_projects')
    .select(`
      id,
      product_sku,
      page_count,
      cover_type,
      size
    `)
    .eq('id', project_id)
    .eq('user_id', user.id)
    .single()

  if (projectError || !project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  if (!project.product_sku) {
    return NextResponse.json(
      { error: 'Project does not have a product SKU configured' },
      { status: 400 }
    )
  }

  try {
    // Get quote from Prodigi
    const prodigiQuote = await estimateOrder(
      [{
        productId: project.product_sku,
        variantId: project.product_sku,
        quantity: 1,
        attributes: {
          pageCount: project.page_count,
          coverType: project.cover_type,
          size: project.size,
        },
      }],
      {
        line1: shipping_address.line1,
        line2: shipping_address.line2,
        city: shipping_address.city,
        state: shipping_address.state,
        zip: shipping_address.zip,
        countryCode: shipping_address.countryCode,
      }
    )

    // Apply 30% markup to product cost (not shipping)
    const productCostWithMarkup = prodigiQuote.subtotal * (1 + MARKUP_PERCENTAGE)
    const totalWithMarkup = productCostWithMarkup + prodigiQuote.shipping + prodigiQuote.tax

    // Round to 2 decimal places
    const roundTo2 = (n: number) => Math.round(n * 100) / 100

    const quote = {
      project_id,
      base_cost: roundTo2(prodigiQuote.subtotal),
      markup: roundTo2(prodigiQuote.subtotal * MARKUP_PERCENTAGE),
      product_cost: roundTo2(productCostWithMarkup),
      shipping_cost: roundTo2(prodigiQuote.shipping),
      tax: roundTo2(prodigiQuote.tax),
      total: roundTo2(totalWithMarkup),
      currency: prodigiQuote.currency,
      shipping_options: prodigiQuote.rates.map(rate => ({
        id: rate.id,
        name: rate.name,
        price: roundTo2(rate.price),
        currency: rate.currency,
        delivery_estimate: rate.minDays === rate.maxDays
          ? `${rate.minDays} days`
          : `${rate.minDays}-${rate.maxDays} days`,
      })),
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min expiry
    }

    return NextResponse.json({ quote })
  } catch (error) {
    console.error('Prodigi quote error:', error)
    return NextResponse.json(
      { error: 'Failed to get quote from fulfillment provider' },
      { status: 500 }
    )
  }
}
