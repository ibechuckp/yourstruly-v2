'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Cart, CartItem, Product, ProductVariant } from '@/types/marketplace';

const CART_STORAGE_KEY = 'yt_marketplace_cart';
const MARKUP_MULTIPLIER = 1.3; // 30% markup

interface AddToCartParams {
  product: Product;
  quantity?: number;
  selectedVariant?: ProductVariant;
  selectedColor?: string;
  selectedSize?: string;
  isGift?: boolean;
  giftMessage?: string;
  giftWrap?: boolean;
  postscriptId?: string;
  scheduledDeliveryDate?: string;
}

interface UseCartReturn {
  cart: Cart | null;
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  addItem: (params: AddToCartParams) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  syncCart: () => Promise<void>;
  
  // Grouped by provider
  itemsByProvider: Record<string, CartItem[]>;
  subtotalByProvider: Record<string, number>;
}

// Calculate price with markup
function applyMarkup(price: number): number {
  return Math.round(price * MARKUP_MULTIPLIER * 100) / 100;
}

// Generate unique cart item ID
function generateItemId(): string {
  return `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Calculate cart totals
function calculateTotals(items: CartItem[]): { subtotal: number; shipping: number; tax: number; total: number } {
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  
  // Estimate shipping based on providers
  const providers = new Set(items.map(item => item.product.provider));
  const baseShipping = 5.99;
  const additionalProviderShipping = 3.99;
  const shipping = providers.size > 0 
    ? baseShipping + (providers.size - 1) * additionalProviderShipping 
    : 0;
  
  // Estimate tax at 8%
  const tax = Math.round(subtotal * 0.08 * 100) / 100;
  
  const total = Math.round((subtotal + shipping + tax) * 100) / 100;
  
  return { subtotal, shipping, tax, total };
}

export function useCart(): UseCartReturn {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  const supabase = createClient();

  // Check auth state
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUserId(session?.user?.id || null);
    });
    
    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  // Load cart from localStorage or API
  const loadCart = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (userId) {
        // Authenticated: fetch from API
        const response = await fetch('/api/marketplace/cart');
        if (response.ok) {
          const data = await response.json();
          setCart(data.cart);
        } else if (response.status === 404) {
          // No cart yet, create empty one
          const emptyCart: Cart = {
            id: `cart_${userId}`,
            userId,
            items: [],
            subtotal: 0,
            tax: 0,
            shipping: 0,
            total: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setCart(emptyCart);
        } else {
          throw new Error('Failed to load cart');
        }
      } else {
        // Guest: load from localStorage
        const stored = localStorage.getItem(CART_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setCart(parsed);
        } else {
          const emptyCart: Cart = {
            id: `cart_guest_${Date.now()}`,
            sessionId: `session_${Date.now()}`,
            items: [],
            subtotal: 0,
            tax: 0,
            shipping: 0,
            total: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setCart(emptyCart);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cart');
      console.error('Cart load error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Save cart to localStorage or API
  const saveCart = useCallback(async (updatedCart: Cart) => {
    try {
      if (userId) {
        // Authenticated: save to API
        await fetch('/api/marketplace/cart', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cart: updatedCart }),
        });
      } else {
        // Guest: save to localStorage
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updatedCart));
      }
    } catch (err) {
      console.error('Cart save error:', err);
    }
  }, [userId]);

  // Load cart on mount and when auth changes
  useEffect(() => {
    loadCart();
  }, [loadCart]);

  // Add item to cart
  const addItem = useCallback(async ({
    product,
    quantity = 1,
    selectedVariant,
    selectedColor,
    selectedSize,
    isGift = false,
    giftMessage,
    giftWrap,
    postscriptId,
    scheduledDeliveryDate,
  }: AddToCartParams) => {
    if (!cart) return;
    
    setError(null);
    
    try {
      // Calculate price with markup
      const basePrice = selectedVariant?.price || product.price;
      const markedUpPrice = applyMarkup(basePrice);
      
      // Check if item already exists (same product, variant, and gift options)
      const existingIndex = cart.items.findIndex(item => 
        item.product.id === product.id &&
        item.selectedVariant?.id === selectedVariant?.id &&
        item.isGift === isGift &&
        item.postscriptId === postscriptId
      );
      
      let newItems: CartItem[];
      
      if (existingIndex >= 0) {
        // Update existing item quantity
        newItems = [...cart.items];
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          quantity: newItems[existingIndex].quantity + quantity,
          total: (newItems[existingIndex].quantity + quantity) * markedUpPrice,
        };
      } else {
        // Add new item
        const newItem: CartItem = {
          id: generateItemId(),
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
        newItems = [...cart.items, newItem];
      }
      
      const totals = calculateTotals(newItems);
      const updatedCart: Cart = {
        ...cart,
        items: newItems,
        ...totals,
        updatedAt: new Date().toISOString(),
      };
      
      setCart(updatedCart);
      await saveCart(updatedCart);
      
      // Also notify API for authenticated users
      if (userId) {
        await fetch('/api/marketplace/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: product.id,
            quantity,
            selectedVariant,
            selectedColor,
            selectedSize,
            isGift,
            giftMessage,
            giftWrap,
            postscriptId,
            scheduledDeliveryDate,
          }),
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item');
      console.error('Add to cart error:', err);
    }
  }, [cart, userId, saveCart]);

  // Remove item from cart
  const removeItem = useCallback(async (itemId: string) => {
    if (!cart) return;
    
    setError(null);
    
    try {
      const newItems = cart.items.filter(item => item.id !== itemId);
      const totals = calculateTotals(newItems);
      
      const updatedCart: Cart = {
        ...cart,
        items: newItems,
        ...totals,
        updatedAt: new Date().toISOString(),
      };
      
      setCart(updatedCart);
      await saveCart(updatedCart);
      
      if (userId) {
        await fetch(`/api/marketplace/cart?itemId=${itemId}`, {
          method: 'DELETE',
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove item');
      console.error('Remove from cart error:', err);
    }
  }, [cart, userId, saveCart]);

  // Update item quantity
  const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
    if (!cart) return;
    
    if (quantity <= 0) {
      return removeItem(itemId);
    }
    
    setError(null);
    
    try {
      const newItems = cart.items.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            quantity,
            total: quantity * item.priceAtAdd,
          };
        }
        return item;
      });
      
      const totals = calculateTotals(newItems);
      
      const updatedCart: Cart = {
        ...cart,
        items: newItems,
        ...totals,
        updatedAt: new Date().toISOString(),
      };
      
      setCart(updatedCart);
      await saveCart(updatedCart);
      
      if (userId) {
        await fetch('/api/marketplace/cart', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemId, quantity }),
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update quantity');
      console.error('Update quantity error:', err);
    }
  }, [cart, userId, removeItem, saveCart]);

  // Clear entire cart
  const clearCart = useCallback(async () => {
    if (!cart) return;
    
    setError(null);
    
    try {
      const emptyCart: Cart = {
        ...cart,
        items: [],
        subtotal: 0,
        tax: 0,
        shipping: 0,
        total: 0,
        updatedAt: new Date().toISOString(),
      };
      
      setCart(emptyCart);
      await saveCart(emptyCart);
      
      if (userId) {
        await fetch('/api/marketplace/cart', {
          method: 'DELETE',
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear cart');
      console.error('Clear cart error:', err);
    }
  }, [cart, userId, saveCart]);

  // Sync local cart with API (for when user logs in)
  const syncCart = useCallback(async () => {
    if (!userId) return;
    
    const localCart = localStorage.getItem(CART_STORAGE_KEY);
    if (!localCart) return;
    
    try {
      const parsed = JSON.parse(localCart);
      if (parsed.items && parsed.items.length > 0) {
        // Merge local cart with server cart
        await fetch('/api/marketplace/cart/merge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ localCart: parsed }),
        });
        
        // Clear local storage after merge
        localStorage.removeItem(CART_STORAGE_KEY);
        
        // Reload cart from server
        await loadCart();
      }
    } catch (err) {
      console.error('Cart sync error:', err);
    }
  }, [userId, loadCart]);

  // Group items by provider
  const itemsByProvider = useMemo(() => {
    if (!cart?.items) return {};
    
    return cart.items.reduce((acc, item) => {
      const provider = item.product.provider;
      if (!acc[provider]) {
        acc[provider] = [];
      }
      acc[provider].push(item);
      return acc;
    }, {} as Record<string, CartItem[]>);
  }, [cart?.items]);

  // Calculate subtotal by provider
  const subtotalByProvider = useMemo(() => {
    if (!cart?.items) return {};
    
    return cart.items.reduce((acc, item) => {
      const provider = item.product.provider;
      if (!acc[provider]) {
        acc[provider] = 0;
      }
      acc[provider] += item.total;
      return acc;
    }, {} as Record<string, number>);
  }, [cart?.items]);

  return {
    cart,
    items: cart?.items || [],
    itemCount: cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0,
    subtotal: cart?.subtotal || 0,
    shipping: cart?.shipping || 0,
    tax: cart?.tax || 0,
    total: cart?.total || 0,
    isLoading,
    error,
    
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    syncCart,
    
    itemsByProvider,
    subtotalByProvider,
  };
}

// Export for use in cart context if needed
export type { UseCartReturn, AddToCartParams };
