'use client';

import { useState } from 'react';
import { Check, HardDrive, Users, Video, MessageCircle, Download, Mail, Image, Scroll, Cloud, Mic } from 'lucide-react';
import { formatPrice } from '@/lib/stripe';

interface Plan {
  id: string;
  name: string;
  description: string;
  price_monthly: number | null;
  price_yearly: number | null;
  currency: string;
  features: Array<{
    name: string;
    value: string;
    icon: string;
  }>;
  is_popular: boolean;
  stripe_price_id: string | null;
}

interface PricingTableProps {
  plans: Plan[];
  currentPlanId?: string | null;
  onSelectPlan: (plan: Plan, billingCycle: 'monthly' | 'yearly') => void;
  loading?: boolean;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  hard_drive: HardDrive,
  cloud: Cloud,
  mic: Mic,
  user: Users,
  users: Users,
  video: Video,
  message_circle: MessageCircle,
  download: Download,
  mail: Mail,
  image: Image,
  scroll: Scroll,
};

export function PricingTable({ plans, currentPlanId, onSelectPlan, loading }: PricingTableProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const getIcon = (iconName: string) => {
    const Icon = iconMap[iconName] || Check;
    return <Icon className="w-4 h-4" />;
  };

  return (
    <div className="w-full">
      {/* Billing toggle */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex items-center p-1 bg-white/80 backdrop-blur-sm rounded-xl border border-[#406A56]/10">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              billingCycle === 'monthly'
                ? 'bg-[#406A56] text-white shadow-sm'
                : 'text-[#406A56] hover:bg-[#406A56]/5'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              billingCycle === 'yearly'
                ? 'bg-[#406A56] text-white shadow-sm'
                : 'text-[#406A56] hover:bg-[#406A56]/5'
            }`}
          >
            Yearly
            <span className="text-xs bg-[#D9C61A] text-[#2d2d2d] px-2 py-0.5 rounded-full">
              Save 17%
            </span>
          </button>
        </div>
      </div>

      {/* Plans grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrentPlan = currentPlanId === plan.id;
          const price = billingCycle === 'yearly' 
            ? plan.price_yearly 
            : plan.price_monthly;
          const isFree = !price || price === 0;

          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl p-6 transition-all ${
                plan.is_popular
                  ? 'bg-white shadow-xl border-2 border-[#406A56] scale-105'
                  : 'bg-white/80 backdrop-blur-sm border border-[#406A56]/10 hover:shadow-lg'
              }`}
            >
              {/* Popular badge */}
              {plan.is_popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-[#D9C61A] text-[#2d2d2d] text-xs font-semibold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Current plan badge */}
              {isCurrentPlan && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-[#406A56] text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Current Plan
                  </span>
                </div>
              )}

              {/* Plan header */}
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-[#2d2d2d] mb-1">{plan.name}</h3>
                <p className="text-sm text-gray-500">{plan.description}</p>
              </div>

              {/* Price */}
              <div className="text-center mb-6">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-[#406A56]">
                    {formatPrice(price, plan.currency)}
                  </span>
                  {!isFree && billingCycle === 'yearly' && (
                    <span className="text-gray-400">/year</span>
                  )}
                  {!isFree && billingCycle === 'monthly' && (
                    <span className="text-gray-400">/mo</span>
                  )}
                </div>
                {billingCycle === 'yearly' && !isFree && (
                  <p className="text-sm text-gray-400 mt-1">
                    ${((price || 0) / 100 / 12).toFixed(2)}/month billed annually
                  </p>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="text-[#406A56] mt-0.5">
                      {getIcon(feature.icon)}
                    </span>
                    <span className="text-sm text-gray-600">
                      <span className="font-medium text-gray-900">{feature.name}:</span>{' '}
                      {feature.value}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <button
                onClick={() => onSelectPlan(plan, billingCycle)}
                disabled={isCurrentPlan || loading}
                className={`w-full py-3 rounded-xl font-semibold transition-all ${
                  isCurrentPlan
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : plan.is_popular
                    ? 'bg-[#406A56] text-white hover:bg-[#355a48] shadow-md'
                    : 'bg-[#406A56]/10 text-[#406A56] hover:bg-[#406A56]/20'
                }`}
              >
                {loading
                  ? 'Loading...'
                  : isCurrentPlan
                  ? 'Current Plan'
                  : isFree
                  ? 'Get Started Free'
                  : billingCycle === 'yearly'
                  ? 'Start Yearly'
                  : 'Start Monthly'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
