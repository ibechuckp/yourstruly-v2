'use client';

import { useEffect, useState } from 'react';
import { PricingTable, SubscriptionStatus, UpgradeModal, BillingPortalLink } from '@/components/subscription';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

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

interface Subscription {
  id: string;
  status: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  plan: Plan;
}

export default function SubscriptionSettings() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [profile, setProfile] = useState<{ subscription_status: string; current_plan_id: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  useEffect(() => {
    // Check for success/canceled query params
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      setNotification({ type: 'success', message: 'Subscription updated successfully!' });
      fetchSubscriptionData();
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('canceled') === 'true') {
      setNotification({ type: 'error', message: 'Checkout was canceled. No changes were made.' });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const fetchSubscriptionData = async () => {
    try {
      const response = await fetch('/api/subscription/status');
      const data = await response.json();

      if (response.ok) {
        setPlans(data.plans);
        setSubscription(data.subscription);
        setProfile(data.profile);
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (plan: Plan, billingCycle: 'monthly' | 'yearly') => {
    setSelectedPlan(plan);
    setSelectedBillingCycle(billingCycle);
    setShowUpgradeModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#406A56]" />
      </div>
    );
  }

  const currentPlanId = profile?.current_plan_id;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#2d2d2d]">Subscription</h1>
        <p className="text-gray-500 mt-1">Manage your plan and billing</p>
      </div>

      {/* Notifications */}
      {notification && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
          notification.type === 'success' 
            ? 'bg-[#406A56]/10 text-[#406A56]' 
            : 'bg-red-50 text-red-600'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          {notification.message}
        </div>
      )}

      {/* Current Status */}
      {subscription && (
        <div className="glass-card p-6 mb-8">
          <h2 className="text-lg font-semibold text-[#2d2d2d] mb-4">Current Plan</h2>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <SubscriptionStatus
              status={subscription.status}
              planName={subscription.plan?.name}
              currentPeriodEnd={subscription.current_period_end}
              cancelAtPeriodEnd={subscription.cancel_at_period_end}
            />
            <BillingPortalLink />
          </div>
          {subscription.cancel_at_period_end && (
            <p className="mt-4 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
              Your subscription will cancel at the end of the billing period. 
              You can resume it anytime from the billing portal.
            </p>
          )}
        </div>
      )}

      {/* Plans */}
      <div className="glass-card p-8">
        <h2 className="text-lg font-semibold text-[#2d2d2d] mb-6">Choose Your Plan</h2>
        <PricingTable
          plans={plans}
          currentPlanId={currentPlanId}
          onSelectPlan={handleSelectPlan}
          loading={loading}
        />
      </div>

      {/* FAQ */}
      <div className="mt-8 glass-card p-6">
        <h2 className="text-lg font-semibold text-[#2d2d2d] mb-4">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-[#2d2d2d] mb-1">Can I change plans anytime?</h3>
            <p className="text-sm text-gray-500">Yes, you can upgrade or downgrade at any time. Prorated charges will apply.</p>
          </div>
          <div>
            <h3 className="font-medium text-[#2d2d2d] mb-1">What happens if I cancel?</h3>
            <p className="text-sm text-gray-500">You&apos;ll keep access until the end of your billing period, then revert to the free plan.</p>
          </div>
          <div>
            <h3 className="font-medium text-[#2d2d2d] mb-1">Is my payment information secure?</h3>
            <p className="text-sm text-gray-500">Yes, we use Stripe for secure payment processing. We never store your card details.</p>
          </div>
        </div>
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        plan={selectedPlan}
        billingCycle={selectedBillingCycle}
      />
    </div>
  );
}
