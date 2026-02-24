'use client';

import { useState } from 'react';
import { X, ArrowRight, Check, Loader2 } from 'lucide-react';
import { getStripe } from '@/lib/stripe';

interface Plan {
  id: string;
  name: string;
  stripe_price_id: string | null;
}

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: Plan | null;
  billingCycle: 'monthly' | 'yearly';
}

export function UpgradeModal({ isOpen, onClose, plan, billingCycle }: UpgradeModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !plan) return null;

  const handleUpgrade = async () => {
    if (!plan.stripe_price_id) {
      // Free plan - just close modal
      onClose();
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: plan.stripe_price_id,
          planId: plan.id,
          billingCycle,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      const stripeClient = await getStripe() as any;
      if (stripeClient) {
        await stripeClient.redirectToCheckout({ sessionId: data.sessionId });
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white/90 backdrop-blur-[24px] border border-white/50 rounded-[20px] shadow-[0_4px_16px_rgba(195,95,51,0.06),0_20px_60px_rgba(0,0,0,0.1)] w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#406A56] to-[#5A8A72] p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-2xl font-bold text-white">Upgrade to {plan.name}</h2>
          <p className="text-white/80 mt-1">
            Unlock premium features and preserve your legacy
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Features preview */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 text-[#406A56]">
              <Check className="w-5 h-5" />
              <span className="font-medium">Unlimited memories</span>
            </div>
            <div className="flex items-center gap-3 text-[#406A56]">
              <Check className="w-5 h-5" />
              <span className="font-medium">AI-powered interviews</span>
            </div>
            <div className="flex items-center gap-3 text-[#406A56]">
              <Check className="w-5 h-5" />
              <span className="font-medium">Share with family</span>
            </div>
            <div className="flex items-center gap-3 text-[#406A56]">
              <Check className="w-5 h-5" />
              <span className="font-medium">Video messages</span>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* CTA */}
          <button
            onClick={handleUpgrade}
            disabled={isLoading}
            className="w-full py-4 bg-[#406A56] text-white rounded-xl font-semibold hover:bg-[#355a48] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Preparing checkout...
              </>
            ) : (
              <>
                Continue to Checkout
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          <p className="text-center text-sm text-gray-400 mt-4">
            Secure payment powered by Stripe
          </p>
        </div>
      </div>
    </div>
  );
}
