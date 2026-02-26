import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { Order } from '@/types/marketplace';

// GET: Get single order details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId } = await params;

    const { data: order, error } = await supabase
      .from('marketplace_orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const formattedOrder: Order = {
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
    };

    return NextResponse.json({ order: formattedOrder });
  } catch (error) {
    console.error('Order GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH: Update order status (for admin/webhook use)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId } = await params;
    const body = await req.json();
    const { status, providerOrderIds, trackingInfo } = body;

    // Verify order belongs to user
    const { data: existingOrder, error: fetchError } = await supabase
      .from('marketplace_orders')
      .select('id, user_id')
      .eq('id', orderId)
      .single();

    if (fetchError || !existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (existingOrder.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (status) {
      updateData.status = status;
    }

    if (providerOrderIds) {
      updateData.provider_order_ids = providerOrderIds;
    }

    if (trackingInfo) {
      updateData.tracking_info = trackingInfo;
    }

    const { data: order, error: updateError } = await supabase
      .from('marketplace_orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) {
      console.error('Order update error:', updateError);
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Order PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Cancel order (only if pending/processing)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId } = await params;

    // Verify order belongs to user and is cancellable
    const { data: order, error: fetchError } = await supabase
      .from('marketplace_orders')
      .select('id, user_id, status')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Only allow cancellation for pending or processing orders
    if (!['pending', 'processing'].includes(order.status)) {
      return NextResponse.json({ 
        error: 'Cannot cancel order that has already shipped' 
      }, { status: 400 });
    }

    // Update status to cancelled
    const { error: updateError } = await supabase
      .from('marketplace_orders')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Order cancel error:', updateError);
      return NextResponse.json({ error: 'Failed to cancel order' }, { status: 500 });
    }

    // TODO: Trigger refund through Stripe if payment was captured

    return NextResponse.json({ 
      success: true, 
      message: 'Order cancelled successfully' 
    });
  } catch (error) {
    console.error('Order DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
