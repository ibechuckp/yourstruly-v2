import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { Order } from '@/types/marketplace';

// GET: List user's orders
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const status = searchParams.get('status');

    // Build query
    let query = supabase
      .from('marketplace_orders')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: orders, error, count } = await query;

    if (error) {
      console.error('Orders fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }

    const formattedOrders: Order[] = (orders || []).map((order) => ({
      id: order.id,
      orderNumber: order.id,
      userId: order.user_id,
      status: order.status,
      items: order.items || [],
      subtotal: order.subtotal || 0,
      tax: order.tax || 0,
      shipping: order.shipping || 0,
      discount: order.discount,
      total: order.total || 0,
      shippingAddress: order.shipping_address || {},
      billingAddress: order.billing_address || {},
      scheduledDeliveryDate: order.scheduled_delivery_date,
      isGift: order.is_gift || false,
      giftMessage: order.gift_message,
      providerOrderIds: order.provider_order_ids,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
    }));

    return NextResponse.json({
      orders: formattedOrders,
      total: count || 0,
      page,
      limit,
      hasMore: (count || 0) > page * limit,
    });
  } catch (error) {
    console.error('Orders GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create order from successful checkout (called by webhook or success page)
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      orderNumber,
      items,
      subtotal,
      tax,
      shipping,
      total,
      shippingAddress,
      billingAddress,
      stripeSessionId,
      stripePaymentIntentId,
      isGift,
      giftMessage,
      scheduledDeliveryDate,
    } = body;

    if (!orderNumber || !items || items.length === 0) {
      return NextResponse.json({ error: 'Order number and items required' }, { status: 400 });
    }

    // Check if order already exists
    const { data: existingOrder } = await supabase
      .from('marketplace_orders')
      .select('id, status')
      .eq('id', orderNumber)
      .single();

    if (existingOrder && existingOrder.status !== 'pending') {
      return NextResponse.json({ 
        order: existingOrder,
        message: 'Order already exists',
      });
    }

    // Create or update order
    const orderData = {
      id: orderNumber,
      user_id: user.id,
      status: 'processing',
      items,
      subtotal,
      tax,
      shipping,
      total,
      shipping_address: shippingAddress,
      billing_address: billingAddress,
      stripe_session_id: stripeSessionId,
      stripe_payment_intent_id: stripePaymentIntentId,
      is_gift: isGift || items.some((item: CartItem) => item.isGift),
      gift_message: giftMessage || items.find((item: CartItem) => item.giftMessage)?.giftMessage,
      scheduled_delivery_date: scheduledDeliveryDate,
      created_at: existingOrder ? undefined : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: order, error } = await supabase
      .from('marketplace_orders')
      .upsert(orderData, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('Order create error:', error);
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    // Clear user's cart after successful order
    await supabase
      .from('marketplace_carts')
      .update({
        items: [],
        subtotal: 0,
        tax: 0,
        shipping: 0,
        total: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    const formattedOrder: Order = {
      id: order.id,
      orderNumber: order.id,
      userId: order.user_id,
      status: order.status,
      items: order.items,
      subtotal: order.subtotal,
      tax: order.tax,
      shipping: order.shipping,
      discount: order.discount,
      total: order.total,
      shippingAddress: order.shipping_address,
      billingAddress: order.billing_address,
      scheduledDeliveryDate: order.scheduled_delivery_date,
      isGift: order.is_gift,
      giftMessage: order.gift_message,
      providerOrderIds: order.provider_order_ids,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
    };

    return NextResponse.json({ order: formattedOrder }, { status: 201 });
  } catch (error) {
    console.error('Orders POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
