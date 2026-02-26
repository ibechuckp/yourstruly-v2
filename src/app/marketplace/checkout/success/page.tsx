'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  CheckCircle as CheckCircleIcon, 
  Truck as TruckIcon, 
  ShoppingBag as ShoppingBagIcon,
  ArrowRight as ArrowRightIcon,
  Mail as EnvelopeIcon,
} from 'lucide-react';
import { Order, CartItem, ProviderType } from '@/types/marketplace';

const providerNames: Record<ProviderType, string> = {
  flowers: '💐 Flowers',
  gifts: '🎁 Gifts',
  prints: '🖼️ Prints',
};

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const orderNumber = searchParams.get('order');

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderNumber) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/marketplace/orders/${orderNumber}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch order');
        }

        const data = await response.json();
        setOrder(data.order);

        // Clear the cart after successful order
        await fetch('/api/marketplace/cart', { method: 'DELETE' });
        
        // Also clear localStorage cart
        localStorage.removeItem('yt_marketplace_cart');
      } catch (err) {
        console.error('Error fetching order:', err);
        // Still show success even if we can't fetch order details
        // The webhook will process it
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderNumber, sessionId]);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Group items by provider
  const itemsByProvider = order?.items.reduce((acc, item) => {
    const provider = item.product.provider;
    if (!acc[provider]) {
      acc[provider] = [];
    }
    acc[provider].push(item);
    return acc;
  }, {} as Record<ProviderType, CartItem[]>) || {};

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto" />
          <p className="mt-4 text-gray-600">Loading your order...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircleIcon className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900">
            Thank you for your order!
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Your order has been placed successfully.
          </p>
        </div>

        {/* Order Number */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Order Number</p>
              <p className="text-xl font-bold text-gray-900">{orderNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Order Date</p>
              <p className="text-gray-900">
                {new Date().toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Email Confirmation */}
        <div className="flex items-center gap-3 bg-blue-50 rounded-lg p-4 mb-6">
          <EnvelopeIcon className="h-6 w-6 text-blue-600 flex-shrink-0" />
          <p className="text-sm text-blue-800">
            A confirmation email has been sent to your email address with your order details and tracking information.
          </p>
        </div>

        {/* Order Items */}
        {order?.items && order.items.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <ShoppingBagIcon className="h-5 w-5" />
                Order Items
              </h2>
            </div>

            <div className="divide-y divide-gray-200">
              {(Object.entries(itemsByProvider) as [ProviderType, CartItem[]][]).map(
                ([provider, items]) => (
                  <div key={provider} className="p-6">
                    <h3 className="text-sm font-medium text-gray-500 mb-4">
                      {providerNames[provider]}
                    </h3>
                    <ul className="space-y-4">
                      {items.map((item) => (
                        <li key={item.id} className="flex gap-4">
                          <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                            <Image
                              src={item.product.thumbnail || '/images/placeholder.png'}
                              alt={item.product.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900">
                              {item.product.name}
                            </h4>
                            {item.selectedVariant && (
                              <p className="mt-0.5 text-sm text-gray-500">
                                {item.selectedVariant.name}
                              </p>
                            )}
                            <p className="mt-1 text-sm text-gray-500">
                              Qty: {item.quantity}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              {formatPrice(item.total)}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              )}
            </div>

            {/* Order Totals */}
            {order && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-900">{formatPrice(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="text-gray-900">{formatPrice(order.shipping)}</span>
                  </div>
                  {order.tax > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax</span>
                      <span className="text-gray-900">{formatPrice(order.tax)}</span>
                    </div>
                  )}
                  {order.discount && order.discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount</span>
                      <span>-{formatPrice(order.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-semibold pt-2 border-t border-gray-200">
                    <span className="text-gray-900">Total</span>
                    <span className="text-gray-900">{formatPrice(order.total)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 text-center">
            <p className="text-gray-600">
              Your order details will be available shortly.
            </p>
          </div>
        )}

        {/* Shipping Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <TruckIcon className="h-6 w-6 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Shipping Information</h2>
          </div>
          <p className="text-sm text-gray-600">
            You&apos;ll receive tracking information via email once your items have shipped. 
            Please allow 3-5 business days for processing. Flowers are typically delivered 
            within 1-2 business days, while gifts and prints may take 5-10 business days.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/dashboard/orders"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            View Your Orders
          </Link>
          <Link
            href="/marketplace"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors"
          >
            Continue Shopping
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>

        {/* PostScript Callout */}
        <div className="mt-12 text-center p-6 bg-gradient-to-r from-rose-50 to-purple-50 rounded-xl border border-rose-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Send Gifts Automatically with PostScripts
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Set up scheduled gifts for birthdays, anniversaries, and special occasions. 
            Your loved ones will receive thoughtful gifts even when you can&apos;t be there.
          </p>
          <Link
            href="/dashboard/postscripts"
            className="inline-flex items-center gap-2 text-sm font-medium text-rose-600 hover:text-rose-700"
          >
            Learn about PostScripts
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
