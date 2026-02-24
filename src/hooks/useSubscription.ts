'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Plan {
  id: string;
  name: string;
  limits: {
    memories_per_month: number;
    storage_gb: number;
    ai_interviews: number;
    family_members: number;
    video_messages: number;
    postscripts: number;
  };
}

interface Subscription {
  id: string;
  status: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  plan_id: string;
  plan: Plan;
}

interface UseSubscriptionReturn {
  subscription: Subscription | null;
  profile: {
    subscription_status: string;
    current_plan_id: string | null;
  } | null;
  plan: Plan | null;
  isLoading: boolean;
  isActive: boolean;
  isPremium: boolean;
  error: Error | null;
  refetch: () => void;
  checkFeatureLimit: (feature: keyof Plan['limits'], currentUsage: number) => {
    allowed: boolean;
    remaining: number;
    limit: number;
  };
}

export function useSubscription(): UseSubscriptionReturn {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [profile, setProfile] = useState<{ subscription_status: string; current_plan_id: string | null } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClient();

  const fetchSubscription = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/subscription/status');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch subscription');
      }

      setSubscription(data.subscription);
      setProfile(data.profile);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        fetchSubscription();
      } else {
        // Reset state when no user to prevent data leakage
        setSubscription(null);
        setProfile(null);
        setError(null);
      }
    };
    checkAuthAndFetch();
  }, [fetchSubscription]);

  const isActive = ['active', 'trialing'].includes(subscription?.status || profile?.subscription_status || '');
  const isPremium = isActive && profile?.subscription_status !== 'free';

  const checkFeatureLimit = useCallback((
    feature: keyof Plan['limits'],
    currentUsage: number
  ) => {
    const plan = subscription?.plan;
    const limit = plan?.limits?.[feature] ?? 0;

    // -1 means unlimited
    if (limit === -1) {
      return { allowed: true, remaining: Infinity, limit };
    }

    const remaining = limit - currentUsage;
    return { allowed: remaining > 0, remaining, limit };
  }, [subscription]);

  return {
    subscription,
    profile,
    plan: subscription?.plan || null,
    isLoading,
    isActive,
    isPremium,
    error,
    refetch: fetchSubscription,
    checkFeatureLimit,
  };
}

// Hook for tracking usage against limits
export function useFeatureLimit(feature: keyof Plan['limits'], currentUsage: number) {
  const { checkFeatureLimit, isLoading } = useSubscription();
  
  const result = checkFeatureLimit(feature, currentUsage);
  
  return {
    ...result,
    isLoading,
  };
}
