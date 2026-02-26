'use client';

import { useState, useEffect, useCallback } from 'react';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  thumbnail: string;
  provider: string;
  variant?: {
    id: string;
    name: string;
    attributes?: Record<string, string>;
  };
}

interface CartState {
  items: CartItem[];
  updatedAt: number;
}

const CART_STORAGE_KEY = 'yt_marketplace_cart';

/**
 * useCart - Shopping cart hook with localStorage persistence
 */
export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed: CartState = JSON.parse(stored);
        setItems(parsed.items || []);
      }
    } catch (err) {
      console.error('Failed to load cart:', err);
    }
    setIsLoaded(true);
  }, []);

  // Save cart to localStorage when items change
  useEffect(() => {
    if (isLoaded) {
      try {
        const state: CartState = {
          items,
          updatedAt: Date.now(),
        };
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
      } catch (err) {
        console.error('Failed to save cart:', err);
      }
    }
  }, [items, isLoaded]);

  // Add item to cart
  const addItem = useCallback((item: CartItem) => {
    setItems(prev => {
      // Check if item already exists (same id and variant)
      const existingIndex = prev.findIndex(
        i => i.id === item.id && i.variant?.id === item.variant?.id
      );

      if (existingIndex >= 0) {
        // Update quantity
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + item.quantity,
        };
        return updated;
      }

      // Add new item
      return [...prev, item];
    });
  }, []);

  // Update item quantity
  const updateQuantity = useCallback((itemId: string, variantId: string | undefined, quantity: number) => {
    setItems(prev => {
      if (quantity <= 0) {
        // Remove item
        return prev.filter(i => !(i.id === itemId && i.variant?.id === variantId));
      }

      return prev.map(item => {
        if (item.id === itemId && item.variant?.id === variantId) {
          return { ...item, quantity };
        }
        return item;
      });
    });
  }, []);

  // Remove item from cart
  const removeItem = useCallback((itemId: string, variantId?: string) => {
    setItems(prev => prev.filter(i => !(i.id === itemId && i.variant?.id === variantId)));
  }, []);

  // Clear cart
  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  // Calculate totals
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return {
    items,
    cartCount,
    cartTotal,
    isLoaded,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
  };
}
