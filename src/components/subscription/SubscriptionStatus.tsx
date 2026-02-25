'use client'

import { CheckCircle2, AlertCircle, Clock } from 'lucide-react'

interface SubscriptionStatusProps {
  subscription?: {
    id: string
    status: string
    current_period_end: string
    cancel_at_period_end: boolean
    plan: { id: string; name: string }
  } | null
  // Alternative props for simpler usage
  status?: string
  planName?: string
  currentPeriodEnd?: string
  cancelAtPeriodEnd?: boolean
  loading?: boolean
}

export function SubscriptionStatus({ 
  subscription,
  status: propStatus,
  planName: propPlanName,
  currentPeriodEnd: propPeriodEnd,
  cancelAtPeriodEnd: propCancelAt,
  loading 
}: SubscriptionStatusProps) {
  // Support both prop styles
  const status = subscription?.status || propStatus
  const planName = subscription?.plan?.name || propPlanName
  const periodEnd = subscription?.current_period_end || propPeriodEnd
  const isCanceling = subscription?.cancel_at_period_end || propCancelAt || false

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-200 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
      </div>
    )
  }

  if (!status || !planName) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <Clock size={20} className="text-gray-500" />
          </div>
          <div>
            <h3 className="font-semibold text-[#2d2d2d]">Free Plan</h3>
            <p className="text-sm text-gray-500">No active subscription</p>
          </div>
        </div>
      </div>
    )
  }

  const isActive = status === 'active'
  const endDate = periodEnd ? new Date(periodEnd).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }) : ''

  return (
    <div className={`rounded-2xl p-6 border ${
      isActive && !isCanceling 
        ? 'bg-green-50 border-green-200' 
        : isCanceling 
          ? 'bg-amber-50 border-amber-200'
          : 'bg-red-50 border-red-200'
    }`}>
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          isActive && !isCanceling 
            ? 'bg-green-100' 
            : isCanceling 
              ? 'bg-amber-100'
              : 'bg-red-100'
        }`}>
          {isActive && !isCanceling ? (
            <CheckCircle2 size={20} className="text-green-600" />
          ) : (
            <AlertCircle size={20} className={isCanceling ? 'text-amber-600' : 'text-red-600'} />
          )}
        </div>
        <div>
          <h3 className="font-semibold text-[#2d2d2d]">{planName}</h3>
          <p className={`text-sm ${
            isActive && !isCanceling 
              ? 'text-green-700' 
              : isCanceling 
                ? 'text-amber-700'
                : 'text-red-700'
          }`}>
            {endDate ? (
              isCanceling 
                ? `Cancels on ${endDate}`
                : isActive 
                  ? `Renews on ${endDate}`
                  : `Expired on ${endDate}`
            ) : 'Active'}
          </p>
        </div>
      </div>
    </div>
  )
}
