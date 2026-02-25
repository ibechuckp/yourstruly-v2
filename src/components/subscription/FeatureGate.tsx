'use client'

import { ReactNode } from 'react'
import { Lock, Sparkles } from 'lucide-react'
import { useSubscription } from '@/hooks/useSubscription'
import { FeatureKey } from '@/types/subscription'
import Link from 'next/link'
import './subscription.css'

interface FeatureGateProps {
  feature: FeatureKey
  children: ReactNode
  fallback?: ReactNode
  showOverlay?: boolean
  title?: string
  message?: string
}

/**
 * Gates content based on subscription feature access.
 * 
 * Usage:
 * <FeatureGate feature="ai_chat">
 *   <AIChatComponent />
 * </FeatureGate>
 */
export function FeatureGate({
  feature,
  children,
  fallback,
  showOverlay = true,
  title = 'Premium Feature',
  message = 'Upgrade to Premium to unlock this feature'
}: FeatureGateProps) {
  const { hasFeature, isLoading } = useSubscription()

  // While loading, show children (optimistic)
  if (isLoading) {
    return <>{children}</>
  }

  // User has access
  if (hasFeature(feature)) {
    return <>{children}</>
  }

  // No access - show fallback or locked overlay
  if (fallback) {
    return <>{fallback}</>
  }

  if (!showOverlay) {
    return null
  }

  // Show locked overlay
  return (
    <div className="feature-locked">
      {children}
      <div className="feature-locked-overlay">
        <div className="feature-locked-icon">
          <Lock size={24} />
        </div>
        <div className="feature-locked-title">{title}</div>
        <div className="feature-locked-message">{message}</div>
        <Link href="/dashboard/subscription">
          <button className="feature-locked-cta">
            <Sparkles size={16} style={{ marginRight: 8 }} />
            Upgrade to Premium
          </button>
        </Link>
      </div>
    </div>
  )
}

/**
 * Simple hook for checking feature access without UI
 */
export function useFeatureAccess(feature: FeatureKey): boolean {
  const { hasFeature, isLoading } = useSubscription()
  
  if (isLoading) return true // Optimistic
  return hasFeature(feature)
}

/**
 * Higher-order component version
 */
export function withFeatureGate<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  feature: FeatureKey,
  options?: Omit<FeatureGateProps, 'feature' | 'children'>
) {
  return function GatedComponent(props: P) {
    return (
      <FeatureGate feature={feature} {...options}>
        <WrappedComponent {...props} />
      </FeatureGate>
    )
  }
}
