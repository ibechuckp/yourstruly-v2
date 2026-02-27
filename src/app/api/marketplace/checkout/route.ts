import { createClient } from '@/lib/supabase/server';
import { getStripeServer } from '@/lib/stripe';
import { NextRequest, NextResponse } from 'next/server';
import { CartItem, ProviderType } from '@/types/marketplace';

// Note: 30% markup is already applied in the cart hook (priceAtAdd)

const providerShipping: Record<ProviderType, number> = {
  flowers: 14.99,
  gifts: 7.99,
  prints: 5.99,
};

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Please sign in to checkout' }, { status: 401 });
    }

    const body = await req.json();
    const { items } = body as { items: CartItem[] };

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    // Get or create Stripe customer
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email, full_name')
      .eq('id', user.id)
      .single();

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      // Create new Stripe customer
      const customer = await getStripeServer().customers.create({
        email: user.email || profile?.email,
        name: profile?.full_name,
        metadata: {
          userId: user.id,
        },
      });
      customerId = customer.id;

      // Save customer ID to profile
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    // Build line items with 30% markup applied
    // Note: prices in CartItem are already marked up from the hook
    const lineItems = items.map((item) => {
      // Convert to cents for Stripe
      const unitAmount = Math.round(item.priceAtAdd * 100);

      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.product.name,
            description: item.product.description?.substring(0, 500) || undefined,
            images: item.product.thumbnail ? [item.product.thumbnail] : undefined,
            metadata: {
              productId: item.product.id,
              provider: item.product.provider,
              variantId: item.selectedVariant?.id || '',
              isGift: item.isGift ? 'true' : 'false',
            },
          },
          unit_amount: unitAmount,
        },
        quantity: item.quantity,
      };
    });

    // Calculate shipping based on providers
    const providers = new Set(items.map(item => item.product.provider));
    let totalShipping = 0;
    providers.forEach((provider) => {
      totalShipping += providerShipping[provider] || 5.99;
    });

    // Add shipping as a line item (shipping is included in the shipping_options below)

    // Generate order number
    const orderNumber = `YT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Create checkout session
    const session = await getStripeServer().checkout.sessions.create({
      customer: customerId,
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/marketplace/checkout/success?session_id={CHECKOUT_SESSION_ID}&order=${orderNumber}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/marketplace?checkout=cancelled`,
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'GB', 'AU'],
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: {
              amount: 0,
              currency: 'usd',
            },
            display_name: 'Standard Shipping',
            delivery_estimate: {
              minimum: {
                unit: 'business_day',
                value: 5,
              },
              maximum: {
                unit: 'business_day',
                value: 10,
              },
            },
          },
        },
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: {
              amount: 1499,
              currency: 'usd',
            },
            display_name: 'Express Shipping',
            delivery_estimate: {
              minimum: {
                unit: 'business_day',
                value: 2,
              },
              maximum: {
                unit: 'business_day',
                value: 3,
              },
            },
          },
        },
      ],
      metadata: {
        userId: user.id,
        orderNumber,
        itemCount: items.length.toString(),
        providers: Array.from(providers).join(','),
      },
      payment_intent_data: {
        metadata: {
          userId: user.id,
          orderNumber,
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      phone_number_collection: {
        enabled: true,
      },
      custom_text: {
        submit: {
          message: 'Your order will be processed and shipped from our fulfillment partners.',
        },
      },
    });

    // Store pending order info
    await supabase
      .from('marketplace_orders')
      .upsert({
        id: orderNumber,
        user_id: user.id,
        status: 'pending',
        stripe_session_id: session.id,
        items: items,
        subtotal: items.reduce((sum, item) => sum + item.total, 0),
        shipping: totalShipping,
        tax: 0, // Will be calculated by Stripe
        total: 0, // Will be updated from webhook
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id',
      });

    return NextResponse.json({ 
      sessionId: session.id, 
      url: session.url,
      orderNumber,
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
