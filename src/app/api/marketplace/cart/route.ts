import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { Cart, CartItem } from '@/types/marketplace';

const MARKUP_MULTIPLIER = 1.3; // 30% markup

// GET: Fetch user's cart
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch cart from database
    const { data: cartData, error: cartError } = await supabase
      .from('marketplace_carts')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (cartError && cartError.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      console.error('Cart fetch error:', cartError);
      return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 });
    }

    if (!cartData) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
    }

    const cart: Cart = {
      id: cartData.id,
      userId: cartData.user_id,
      items: cartData.items || [],
      subtotal: cartData.subtotal || 0,
      tax: cartData.tax || 0,
      shipping: cartData.shipping || 0,
      total: cartData.total || 0,
      shippingAddress: cartData.shipping_address,
      estimatedDelivery: cartData.estimated_delivery,
      createdAt: cartData.created_at,
      updatedAt: cartData.updated_at,
    };

    return NextResponse.json({ cart });
  } catch (error) {
    console.error('Cart GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Add item to cart
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      productId,
      quantity = 1,
      selectedVariant,
      selectedColor,
      selectedSize,
      isGift = false,
      giftMessage,
      giftWrap,
      postscriptId,
      scheduledDeliveryDate,
    } = body;

    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    // Fetch or create cart
    const { data: cartData, error: cartError } = await supabase
      .from('marketplace_carts')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (cartError && cartError.code !== 'PGRST116') {
      console.error('Cart fetch error:', cartError);
      return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 });
    }

    // Fetch product details (from your products API or database)
    // For now, we'll expect the product data to come from the client
    // In production, you'd fetch this from your products table/API
    const { product } = body;
    
    if (!product) {
      return NextResponse.json({ error: 'Product data required' }, { status: 400 });
    }

    // Calculate price with markup
    const basePrice = selectedVariant?.price || product.price;
    const markedUpPrice = Math.round(basePrice * MARKUP_MULTIPLIER * 100) / 100;

    // Create new cart item
    const newItem: CartItem = {
      id: `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      product,
      quantity,
      selectedVariant,
      selectedColor,
      selectedSize,
      isGift,
      giftMessage,
      giftWrap,
      postscriptId,
      scheduledDeliveryDate,
      priceAtAdd: markedUpPrice,
      total: quantity * markedUpPrice,
    };

    const items: CartItem[] = cartData?.items || [];
    
    // Check if item already exists
    const existingIndex = items.findIndex(item =>
      item.product.id === productId &&
      item.selectedVariant?.id === selectedVariant?.id &&
      item.isGift === isGift &&
      item.postscriptId === postscriptId
    );

    if (existingIndex >= 0) {
      // Update existing item
      items[existingIndex] = {
        ...items[existingIndex],
        quantity: items[existingIndex].quantity + quantity,
        total: (items[existingIndex].quantity + quantity) * items[existingIndex].priceAtAdd,
      };
    } else {
      // Add new item
      items.push(newItem);
    }

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const providers = new Set(items.map(item => item.product.provider));
    const shipping = providers.size > 0 ? 5.99 + (providers.size - 1) * 3.99 : 0;
    const tax = Math.round(subtotal * 0.08 * 100) / 100;
    const total = Math.round((subtotal + shipping + tax) * 100) / 100;

    // Upsert cart
    const { data: updatedCart, error: updateError } = await supabase
      .from('marketplace_carts')
      .upsert({
        id: cartData?.id || `cart_${user.id}`,
        user_id: user.id,
        items,
        subtotal,
        tax,
        shipping,
        total,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      })
      .select()
      .single();

    if (updateError) {
      console.error('Cart update error:', updateError);
      return NextResponse.json({ error: 'Failed to update cart' }, { status: 500 });
    }

    return NextResponse.json({ 
      cart: {
        id: updatedCart.id,
        userId: updatedCart.user_id,
        items: updatedCart.items,
        subtotal: updatedCart.subtotal,
        tax: updatedCart.tax,
        shipping: updatedCart.shipping,
        total: updatedCart.total,
        createdAt: updatedCart.created_at,
        updatedAt: updatedCart.updated_at,
      },
      addedItem: newItem 
    });
  } catch (error) {
    console.error('Cart POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Update cart (quantity or full cart)
export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    
    // Full cart update
    if (body.cart) {
      const { cart } = body;
      
      const { data: updatedCart, error: updateError } = await supabase
        .from('marketplace_carts')
        .upsert({
          id: cart.id || `cart_${user.id}`,
          user_id: user.id,
          items: cart.items,
          subtotal: cart.subtotal,
          tax: cart.tax,
          shipping: cart.shipping,
          total: cart.total,
          shipping_address: cart.shippingAddress,
          estimated_delivery: cart.estimatedDelivery,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        })
        .select()
        .single();

      if (updateError) {
        console.error('Cart update error:', updateError);
        return NextResponse.json({ error: 'Failed to update cart' }, { status: 500 });
      }

      return NextResponse.json({ cart: updatedCart });
    }
    
    // Single item quantity update
    const { itemId, quantity } = body;
    
    if (!itemId || quantity === undefined) {
      return NextResponse.json({ error: 'Item ID and quantity required' }, { status: 400 });
    }

    // Fetch current cart
    const { data: existingCart, error: existingCartError } = await supabase
      .from('marketplace_carts')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (existingCartError) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
    }

    // Update item quantity
    let updatedItems: CartItem[] = existingCart.items || [];
    
    if (quantity <= 0) {
      updatedItems = updatedItems.filter(item => item.id !== itemId);
    } else {
      updatedItems = updatedItems.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            quantity,
            total: quantity * item.priceAtAdd,
          };
        }
        return item;
      });
    }

    // Recalculate totals
    const subtotal = updatedItems.reduce((sum, item) => sum + item.total, 0);
    const providers = new Set(updatedItems.map(item => item.product.provider));
    const shipping = providers.size > 0 ? 5.99 + (providers.size - 1) * 3.99 : 0;
    const tax = Math.round(subtotal * 0.08 * 100) / 100;
    const total = Math.round((subtotal + shipping + tax) * 100) / 100;

    // Update cart
    const { data: resultCart, error: resultError } = await supabase
      .from('marketplace_carts')
      .update({
        items: updatedItems,
        subtotal,
        tax,
        shipping,
        total,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .select()
      .single();

    if (resultError) {
      console.error('Cart update error:', resultError);
      return NextResponse.json({ error: 'Failed to update cart' }, { status: 500 });
    }

    return NextResponse.json({ cart: resultCart });
  } catch (error) {
    console.error('Cart PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Remove item or clear cart
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get('itemId');

    if (itemId) {
      // Remove single item
      const { data: cartData, error: cartError } = await supabase
        .from('marketplace_carts')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (cartError) {
        return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
      }

      const items = (cartData.items || []).filter((item: CartItem) => item.id !== itemId);
      
      // Recalculate totals
      const subtotal = items.reduce((sum: number, item: CartItem) => sum + item.total, 0);
      const providers = new Set(items.map((item: CartItem) => item.product.provider));
      const shipping = providers.size > 0 ? 5.99 + (providers.size - 1) * 3.99 : 0;
      const tax = Math.round(subtotal * 0.08 * 100) / 100;
      const total = Math.round((subtotal + shipping + tax) * 100) / 100;

      const { error: updateError } = await supabase
        .from('marketplace_carts')
        .update({
          items,
          subtotal,
          tax,
          shipping,
          total,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (updateError) {
        return NextResponse.json({ error: 'Failed to remove item' }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    // Clear entire cart
    const { error: clearError } = await supabase
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

    if (clearError) {
      return NextResponse.json({ error: 'Failed to clear cart' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cart DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
