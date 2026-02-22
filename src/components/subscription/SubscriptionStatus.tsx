'use client';

import { useState, useEffect } from 'react';
import { Crown, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';

interface SubscriptionStatusProps {
  status: string;
  planName?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  compact?: boolean;
}

const statusConfig: Record<string, { label: string; icon: React.ReactNode; color: string; bgColor: string }> = {
  active: {
    label: 'Active',
    icon: <Crown className="w-4 h-4" />,
    color: 'text-[#406A56]',
    bgColor: 'bg-[#406A56]/10',
  },
  trialing: {
    label: 'Trial',
    icon: <CheckCircle2 className="w-4 h-4" />,
    color: 'text-[#D9C61A]',
    bgColor: 'bg-[#D9C61A]/10',
  },
  past_due: {
    label: 'Payment Due',
    icon: <AlertCircle className="w-4 h-4" />,
    color: 'text-[#C35F33]',
    bgColor: 'bg-[#C35F33]/10',
  },
  canceled: {
    label: 'Canceled',
    icon: <XCircle className="w-4 h-4" />,
    color: 'text-gray-500',
    bgColor: 'bg-gray-100',
  },
  free: {
    label: 'Free',
    icon: <CheckCircle2 className="w-4 h-4" />,
    color: 'text-gray-500',
    bgColor: 'bg-gray-100',
  },
};

export function SubscriptionStatus({
  status,
  planName,
  currentPeriodEnd,
  cancelAtPeriodEnd,
  compact = false,
}: SubscriptionStatusProps) {
  const [timeRemaining, setTimeRemaining] = useState('');

  const config = statusConfig[status] || statusConfig.free;

  useEffect(() => {
    if (!currentPeriodEnd) return;

    const updateTimeRemaining = () => {
      const end = new Date(currentPeriodEnd);
      const now = new Date();
      const diff = end.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('Expired');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      if (days === 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        setTimeRemaining(`${hours}h remaining`);
      } else if (days === 1) {
        setTimeRemaining('1 day left');
      } else {
        setTimeRemaining(`${days} days left`);
      }
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [currentPeriodEnd]);

  if (compact) {
    return (
      <Link
        href="/dashboard/settings"
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${config.bgColor} ${config.color} hover:opacity-80 transition-opacity`}
      >
        {config.icon}
        <span>{planName || config.label}</span>
        {timeRemaining && status !== 'free' && (
          <span className="text-xs opacity-70">• {timeRemaining}</span>
        )}
      </Link>
    );
  }

  return (
    <div className={`rounded-xl p-4 ${config.bgColor}`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg bg-white/50 ${config.color}`}>
          {config.icon}
        </div>
        <div>
          <p className={`font-semibold ${config.color}`}>
            {planName || config.label}
          </p>
          {timeRemaining && status !== 'free' && (
            <p className="text-sm text-gray-500">
              {cancelAtPeriodEnd 
                ? `Cancels in ${timeRemaining}`
                : `Renews in ${timeRemaining}`
              }
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
