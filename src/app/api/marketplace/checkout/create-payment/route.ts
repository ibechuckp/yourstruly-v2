import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
});

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  variant?: {
    id: string;
    name: string;
  };
}

interface ShippingAddress {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

/**
 * POST /api/marketplace/checkout/create-payment
 * Creates a Stripe PaymentIntent for the checkout
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await request.json();
    const {
      items,
      shippingAddress,
      isGift,
      giftMessage,
    }: {
      items: CartItem[];
      shippingAddress: ShippingAddress;
      isGift?: boolean;
      giftMessage?: string;
    } = body;

    // Validate items
    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items in cart' }, { status: 400 });
    }

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = subtotal > 50 ? 0 : 5.99;
    const tax = subtotal * 0.08; // 8% estimated tax
    const total = subtotal + shipping + tax;

    // Convert to cents for Stripe
    const amountCents = Math.round(total * 100);

    // Create line items description
    const description = items
      .map(item => `${item.name}${item.variant ? ` (${item.variant.name})` : ''} x${item.quantity}`)
      .join(', ');

    // Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        user_id: user?.id || 'guest',
        items_count: items.length.toString(),
        items_json: JSON.stringify(items.map(i => ({
          id: i.id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          variant_id: i.variant?.id,
        }))),
        shipping_name: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
        shipping_email: shippingAddress.email,
        shipping_address: `${shippingAddress.address1}, ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zipCode}`,
        is_gift: isGift ? 'true' : 'false',
        gift_message: giftMessage || '',
      },
      description: description.substring(0, 1000), // Stripe limit
      receipt_email: shippingAddress.email,
      shipping: {
        name: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
        phone: shippingAddress.phone || undefined,
        address: {
          line1: shippingAddress.address1,
          line2: shippingAddress.address2 || undefined,
          city: shippingAddress.city,
          state: shippingAddress.state,
          postal_code: shippingAddress.zipCode,
          country: shippingAddress.country || 'US',
        },
      },
    });

    // Optionally store order in database
    if (user) {
      await supabase.from('marketplace_orders').insert({
        user_id: user.id,
        stripe_payment_intent_id: paymentIntent.id,
        status: 'pending',
        items: items,
        subtotal,
        shipping,
        tax,
        total,
        shipping_address: shippingAddress,
        is_gift: isGift || false,
        gift_message: giftMessage || null,
      }).select().single();
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });

  } catch (error) {
    console.error('Create payment error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}
