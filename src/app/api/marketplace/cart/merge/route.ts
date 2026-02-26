import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { Cart, CartItem } from '@/types/marketplace';

// POST: Merge local cart with server cart (for when user logs in)
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { localCart } = body;

    if (!localCart || !localCart.items || localCart.items.length === 0) {
      return NextResponse.json({ message: 'No local cart to merge' });
    }

    // Fetch existing server cart
    const { data: serverCart } = await supabase
      .from('marketplace_carts')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const mergedItems: CartItem[] = [...(serverCart?.items || [])];

    // Merge local items into server cart
    for (const localItem of localCart.items) {
      const existingIndex = mergedItems.findIndex(item =>
        item.product.id === localItem.product.id &&
        item.selectedVariant?.id === localItem.selectedVariant?.id &&
        item.isGift === localItem.isGift &&
        item.postscriptId === localItem.postscriptId
      );

      if (existingIndex >= 0) {
        // Update quantity of existing item (take the higher quantity)
        const existingItem = mergedItems[existingIndex];
        const newQuantity = Math.max(existingItem.quantity, localItem.quantity);
        mergedItems[existingIndex] = {
          ...existingItem,
          quantity: newQuantity,
          total: newQuantity * existingItem.priceAtAdd,
        };
      } else {
        // Add new item with new ID
        mergedItems.push({
          ...localItem,
          id: `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        });
      }
    }

    // Calculate totals
    const subtotal = mergedItems.reduce((sum, item) => sum + item.total, 0);
    const providers = new Set(mergedItems.map(item => item.product.provider));
    const shipping = providers.size > 0 ? 5.99 + (providers.size - 1) * 3.99 : 0;
    const tax = Math.round(subtotal * 0.08 * 100) / 100;
    const total = Math.round((subtotal + shipping + tax) * 100) / 100;

    // Upsert merged cart
    const { data: updatedCart, error: updateError } = await supabase
      .from('marketplace_carts')
      .upsert({
        id: serverCart?.id || `cart_${user.id}`,
        user_id: user.id,
        items: mergedItems,
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
      console.error('Cart merge error:', updateError);
      return NextResponse.json({ error: 'Failed to merge cart' }, { status: 500 });
    }

    const cart: Cart = {
      id: updatedCart.id,
      userId: updatedCart.user_id,
      items: updatedCart.items,
      subtotal: updatedCart.subtotal,
      tax: updatedCart.tax,
      shipping: updatedCart.shipping,
      total: updatedCart.total,
      createdAt: updatedCart.created_at,
      updatedAt: updatedCart.updated_at,
    };

    return NextResponse.json({ cart, merged: true });
  } catch (error) {
    console.error('Cart merge error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
