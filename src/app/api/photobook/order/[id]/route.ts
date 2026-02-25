import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { createOrder as createProdigiOrder, getOrderStatus as getProdigiOrderStatus } from '@/lib/marketplace/providers/prodigi'

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET /api/photobook/order/[id] - Get order status
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  const { id } = await context.params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: order, error } = await supabase
    .from('photobook_orders')
    .select(`
      id,
      project_id,
      status,
      prodigi_order_id,
      stripe_payment_intent_id,
      shipping_name,
      shipping_line1,
      shipping_line2,
      shipping_city,
      shipping_state,
      shipping_zip,
      shipping_country,
      shipping_method,
      product_cost,
      markup_amount,
      shipping_cost,
      tax_amount,
      total_amount,
      currency,
      tracking_number,
      tracking_url,
      created_at,
      updated_at,
      photobook_projects (
        id,
        title,
        cover_image_url,
        product_name
      )
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    console.error('Order fetch error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // If order has a Prodigi order ID, fetch latest status
  if (order.prodigi_order_id) {
    try {
      const prodigiStatus = await getProdigiOrderStatus(order.prodigi_order_id)
      
      // Map Prodigi status to our status
      const statusMap: Record<string, string> = {
        'Draft': 'processing',
        'AwaitingPayment': 'processing',
        'InProgress': 'processing',
        'Shipped': 'shipped',
        'Complete': 'delivered',
        'Cancelled': 'cancelled',
        'OnHold': 'on_hold',
      }

      const newStatus = statusMap[prodigiStatus.status] || order.status

      // Update tracking if available
      if (prodigiStatus.tracking && prodigiStatus.tracking.length > 0) {
        const tracking = prodigiStatus.tracking[0]
        const adminSupabase = createAdminClient()
        await adminSupabase
          .from('photobook_orders')
          .update({
            status: newStatus,
            tracking_number: tracking.number,
            tracking_url: tracking.url,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)

        order.status = newStatus
        order.tracking_number = tracking.number
        order.tracking_url = tracking.url
      } else if (newStatus !== order.status) {
        const adminSupabase = createAdminClient()
        await adminSupabase
          .from('photobook_orders')
          .update({
            status: newStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)

        order.status = newStatus
      }
    } catch (prodigiError) {
      console.error('Failed to fetch Prodigi status:', prodigiError)
      // Continue with cached status
    }
  }

  return NextResponse.json({ order })
}

// POST /api/photobook/order/[id] - Webhook for Prodigi status updates
// Also handles payment confirmation and order submission to Prodigi
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  const { id } = await context.params
  
  // Check if this is a webhook from Prodigi
  const prodigiSignature = request.headers.get('X-Prodigi-Signature')
  
  if (prodigiSignature) {
    // Handle Prodigi webhook
    return handleProdigiWebhook(request, id)
  }

  // Otherwise, handle payment confirmation (from our frontend after Stripe payment)
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { action, payment_intent_id } = body

  if (action !== 'confirm_payment') {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  // Fetch order
  const { data: order, error: orderError } = await supabase
    .from('photobook_orders')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (orderError || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  if (order.status !== 'pending_payment') {
    return NextResponse.json(
      { error: 'Order is not pending payment' },
      { status: 400 }
    )
  }

  // Verify payment intent matches
  if (payment_intent_id && payment_intent_id !== order.stripe_payment_intent_id) {
    return NextResponse.json(
      { error: 'Payment intent mismatch' },
      { status: 400 }
    )
  }

  try {
    // Fetch project with pages to get asset URLs
    const { data: project } = await supabase
      .from('photobook_projects')
      .select(`
        *,
        photobook_pages (
          id,
          page_number,
          page_type,
          content
        )
      `)
      .eq('id', order.project_id)
      .single()

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Build assets array from page content
    // Content is expected to have image URLs for each page
    const assets = project.photobook_pages
      ?.sort((a: { page_number: number }, b: { page_number: number }) => a.page_number - b.page_number)
      .map((page: { page_number: number; page_type: string; content: { image_url?: string } }) => ({
        printArea: page.page_type === 'front_cover' ? 'cover' 
          : page.page_type === 'back_cover' ? 'backCover' 
          : `page${page.page_number}`,
        url: page.content?.image_url || '',
      }))
      .filter((asset: { url: string }) => asset.url) || []

    // Submit order to Prodigi
    const prodigiOrder = await createProdigiOrder({
      items: [{
        sku: project.product_sku,
        copies: 1,
        assets,
        attributes: {
          pageCount: project.page_count,
        },
      }],
      recipient: {
        name: order.shipping_name,
        address: {
          line1: order.shipping_line1,
          line2: order.shipping_line2 || undefined,
          townOrCity: order.shipping_city,
          stateOrCounty: order.shipping_state || undefined,
          postalOrZipCode: order.shipping_zip,
          countryCode: order.shipping_country,
        },
        email: user.email || undefined,
      },
      shippingMethod: order.shipping_method as 'standard' | 'express' | 'overnight',
      merchantReference: order.id,
      idempotencyKey: order.idempotency_key,
    })

    // Update order with Prodigi order ID
    const adminSupabase = createAdminClient()
    await adminSupabase
      .from('photobook_orders')
      .update({
        status: 'processing',
        prodigi_order_id: prodigiOrder.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    return NextResponse.json({
      success: true,
      order: {
        id,
        status: 'processing',
        prodigi_order_id: prodigiOrder.id,
      },
    })

  } catch (error) {
    console.error('Failed to submit order to Prodigi:', error)
    
    // Update order status to error
    const adminSupabase = createAdminClient()
    await adminSupabase
      .from('photobook_orders')
      .update({
        status: 'error',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    return NextResponse.json(
      { error: 'Failed to submit order to fulfillment provider' },
      { status: 500 }
    )
  }
}

// Handle Prodigi webhook updates
async function handleProdigiWebhook(request: NextRequest, orderId: string) {
  const body = await request.json()
  
  // TODO: Verify webhook signature
  // const signature = request.headers.get('X-Prodigi-Signature')
  
  const { event, data } = body

  if (!event || !data) {
    return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 })
  }

  const adminSupabase = createAdminClient()

  // Find order by Prodigi order ID or merchant reference
  const { data: order, error: orderError } = await adminSupabase
    .from('photobook_orders')
    .select('id, status')
    .or(`prodigi_order_id.eq.${data.orderId},id.eq.${data.merchantReference}`)
    .single()

  if (orderError || !order) {
    console.error('Order not found for webhook:', data.orderId || data.merchantReference)
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  // Map Prodigi events to status updates
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  switch (event) {
    case 'order.status.changed':
      const statusMap: Record<string, string> = {
        'InProgress': 'processing',
        'Shipped': 'shipped',
        'Complete': 'delivered',
        'Cancelled': 'cancelled',
        'OnHold': 'on_hold',
      }
      if (data.status && statusMap[data.status]) {
        updates.status = statusMap[data.status]
      }
      break

    case 'shipment.created':
    case 'shipment.dispatched':
      updates.status = 'shipped'
      if (data.tracking) {
        updates.tracking_number = data.tracking.number
        updates.tracking_url = data.tracking.url
      }
      break

    case 'order.completed':
      updates.status = 'delivered'
      break

    case 'order.cancelled':
      updates.status = 'cancelled'
      if (data.reason) {
        updates.error_message = data.reason
      }
      break

    default:
      console.log('Unhandled Prodigi event:', event)
  }

  if (Object.keys(updates).length > 1) { // More than just updated_at
    await adminSupabase
      .from('photobook_orders')
      .update(updates)
      .eq('id', order.id)
  }

  return NextResponse.json({ received: true })
}
