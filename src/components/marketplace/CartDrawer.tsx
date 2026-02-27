'use client';

import { Fragment, useState } from 'react';
import Image from 'next/image';
import { Dialog, Transition } from '@headlessui/react';
import {
  XMarkIcon,
  ShoppingCartIcon,
  MinusIcon,
  PlusIcon,
  TrashIcon,
  TruckIcon,
  GiftIcon,
} from '@heroicons/react/24/outline';
import { useCart } from '@/hooks/useCart';
import { ProviderType } from '@/types/marketplace';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const providerNames: Record<ProviderType, string> = {
  flowers: '💐 Flowers',
  gifts: '🎁 Gifts',
  prints: '🖼️ Prints',
};

const providerColors: Record<ProviderType, string> = {
  flowers: 'bg-pink-50 border-pink-200',
  gifts: 'bg-purple-50 border-purple-200',
  prints: 'bg-blue-50 border-blue-200',
};

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const {
    items,
    cartCount: itemCount,
    cartTotal,
    isLoaded,
    removeItem,
    updateQuantity,
    clearCart,
  } = useCart();
  
  // Calculate derived values
  const subtotal = cartTotal;
  const shipping = items.length > 0 ? 9.99 : 0; // Flat rate estimate
  const tax = subtotal * 0.08; // Estimate 8% tax
  const total = subtotal + shipping + tax;
  const isLoading = !isLoaded;
  const error = null;
  
  // Group items by provider
  const itemsByProvider = items.reduce((acc, item) => {
    const provider = item.provider || 'other';
    if (!acc[provider]) acc[provider] = [];
    acc[provider].push(item);
    return acc;
  }, {} as Record<string, typeof items>);
  
  const subtotalByProvider = Object.entries(itemsByProvider).reduce((acc, [provider, providerItems]) => {
    acc[provider] = providerItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    return acc;
  }, {} as Record<string, number>);

  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    try {
      const response = await fetch('/api/marketplace/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Checkout failed');
      }

      const { url } = await response.json();
      
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      console.error('Checkout error:', err);
      alert(err instanceof Error ? err.message : 'Failed to start checkout');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents);
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col bg-white shadow-xl">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-6 sm:px-6 border-b">
                      <Dialog.Title className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                        <ShoppingCartIcon className="h-6 w-6" />
                        Your Cart
                        {itemCount > 0 && (
                          <span className="ml-2 rounded-full bg-rose-500 px-2.5 py-0.5 text-sm font-medium text-white">
                            {itemCount}
                          </span>
                        )}
                      </Dialog.Title>
                      <button
                        type="button"
                        className="relative -m-2 p-2 text-gray-400 hover:text-gray-500 transition-colors"
                        onClick={onClose}
                      >
                        <span className="sr-only">Close panel</span>
                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                      </button>
                    </div>

                    {/* Cart Content */}
                    <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
                      {isLoading ? (
                        <div className="flex items-center justify-center h-40">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500" />
                        </div>
                      ) : error ? (
                        <div className="text-center text-red-600 py-8">
                          <p>{error}</p>
                          <button
                            onClick={() => window.location.reload()}
                            className="mt-2 text-sm text-rose-600 hover:text-rose-500"
                          >
                            Try again
                          </button>
                        </div>
                      ) : items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                          <ShoppingCartIcon className="h-16 w-16 text-gray-300 mb-4" />
                          <h3 className="text-lg font-medium text-gray-900">Your cart is empty</h3>
                          <p className="mt-1 text-sm text-gray-500">
                            Add some thoughtful gifts for your loved ones
                          </p>
                          <button
                            onClick={onClose}
                            className="mt-6 px-6 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
                          >
                            Continue Shopping
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-8">
                          {/* Items grouped by provider */}
                          {(Object.entries(itemsByProvider) as [ProviderType, typeof items][]).map(
                            ([provider, providerItems]) => (
                              <div key={provider} className={`rounded-lg border p-4 ${providerColors[provider]}`}>
                                <h3 className="font-semibold text-gray-900 mb-4">
                                  {providerNames[provider]}
                                </h3>
                                <ul className="divide-y divide-gray-200">
                                  {providerItems.map((item) => (
                                    <li key={item.id} className="py-4 first:pt-0 last:pb-0">
                                      <div className="flex items-start gap-4">
                                        {/* Product Image */}
                                        <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-white">
                                          <Image
                                            src={item.thumbnail || '/images/placeholder.png'}
                                            alt={item.name}
                                            fill
                                            className="object-cover"
                                          />
                                        </div>

                                        {/* Product Details */}
                                        <div className="flex-1 min-w-0">
                                          <h4 className="text-sm font-medium text-gray-900 truncate">
                                            {item.name}
                                          </h4>
                                          
                                          {/* Variant/Options */}
                                          {item.variant && (
                                            <p className="mt-0.5 text-xs text-gray-500">
                                              {item.variant.name}
                                            </p>
                                          )}

                                          {/* Price */}
                                          <p className="mt-1 text-sm font-medium text-gray-900">
                                            {formatPrice(item.price)}
                                          </p>

                                          {/* Quantity Controls */}
                                          <div className="flex items-center gap-3 mt-2">
                                            <div className="flex items-center border border-gray-300 rounded-lg bg-white">
                                              <button
                                                onClick={() => updateQuantity(item.id, item.variant?.id, item.quantity - 1)}
                                                className="p-1.5 hover:bg-gray-100 rounded-l-lg transition-colors"
                                                disabled={item.quantity <= 1}
                                              >
                                                <MinusIcon className="h-4 w-4" />
                                              </button>
                                              <span className="px-3 text-sm font-medium min-w-[2rem] text-center">
                                                {item.quantity}
                                              </span>
                                              <button
                                                onClick={() => updateQuantity(item.id, item.variant?.id, item.quantity + 1)}
                                                className="p-1.5 hover:bg-gray-100 rounded-r-lg transition-colors"
                                              >
                                                <PlusIcon className="h-4 w-4" />
                                              </button>
                                            </div>
                                            <button
                                              onClick={() => removeItem(item.id, item.variant?.id)}
                                              className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                                            >
                                              <TrashIcon className="h-4 w-4" />
                                            </button>
                                          </div>
                                        </div>

                                        {/* Item Total */}
                                        <div className="text-right">
                                          <p className="text-sm font-semibold text-gray-900">
                                            {formatPrice(item.price * item.quantity)}
                                          </p>
                                        </div>
                                      </div>
                                    </li>
                                  ))}
                                </ul>

                                {/* Provider Subtotal */}
                                <div className="mt-4 pt-3 border-t border-gray-300/50 flex justify-between text-sm">
                                  <span className="text-gray-600">Subtotal</span>
                                  <span className="font-medium text-gray-900">
                                    {formatPrice(subtotalByProvider[provider] || 0)}
                                  </span>
                                </div>
                              </div>
                            )
                          )}

                          {/* Clear Cart Button */}
                          {items.length > 0 && (
                            <button
                              onClick={clearCart}
                              className="w-full text-sm text-gray-500 hover:text-red-600 transition-colors"
                            >
                              Clear cart
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Footer - Totals & Checkout */}
                    {items.length > 0 && (
                      <div className="border-t border-gray-200 px-4 py-6 sm:px-6">
                        {/* Shipping Estimate */}
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                          <TruckIcon className="h-5 w-5" />
                          <span>Estimated shipping: {formatPrice(shipping)}</span>
                        </div>

                        {/* Totals */}
                        <div className="space-y-2 mb-6">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Subtotal</span>
                            <span className="text-gray-900">{formatPrice(subtotal)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Shipping</span>
                            <span className="text-gray-900">{formatPrice(shipping)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Estimated Tax</span>
                            <span className="text-gray-900">{formatPrice(tax)}</span>
                          </div>
                          <div className="flex justify-between text-base font-semibold pt-2 border-t">
                            <span className="text-gray-900">Total</span>
                            <span className="text-gray-900">{formatPrice(total)}</span>
                          </div>
                        </div>

                        {/* Checkout Button */}
                        <button
                          onClick={handleCheckout}
                          disabled={checkoutLoading}
                          className="w-full flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-rose-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {checkoutLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                              Processing...
                            </>
                          ) : (
                            'Proceed to Checkout'
                          )}
                        </button>

                        <p className="mt-4 text-center text-xs text-gray-500">
                          Secure checkout powered by Stripe
                        </p>
                      </div>
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

// Cart Button Component (for navbar)
export function CartButton({ onClick }: { onClick: () => void }) {
  const { cartCount, isLoaded } = useCart();

  return (
    <button
      onClick={onClick}
      className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
      aria-label="Open cart"
    >
      <ShoppingCartIcon className="h-6 w-6" />
      {isLoaded && cartCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-xs font-medium text-white">
          {cartCount > 99 ? '99+' : cartCount}
        </span>
      )}
    </button>
  );
}
