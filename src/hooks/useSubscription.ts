'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  UserSubscription, 
  SubscriptionPlan, 
  SubscriptionSeat,
  StorageBreakdown,
  SubscriptionWithDetails,
  FeatureKey,
  SeatPricing,
  calculateTotalMonthlyCost
} from '@/types/subscription'

interface SeatsData {
  seats: SubscriptionSeat[]
  pricing: SeatPricing[]
  maxSeats: number
}

interface UseSubscriptionReturn {
  subscription: SubscriptionWithDetails | null
  isLoading: boolean
  error: string | null
  isPremium: boolean
  hasFeature: (feature: FeatureKey) => boolean
  getStoragePercentage: () => number
  isStorageFull: () => boolean
  refetch: () => Promise<void>
  // Seat management
  seats: SeatsData | null
  seatsLoading: boolean
  fetchSeats: () => Promise<void>
  inviteSeat: (email: string) => Promise<void>
  removeSeat: (seatId: string) => Promise<void>
  resendInvite: (seatId: string) => Promise<void>
}

export function useSubscription(): UseSubscriptionReturn {
  const [subscription, setSubscription] = useState<SubscriptionWithDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [seatPricing, setSeatPricing] = useState<SeatPricing[]>([])
  
  // Seat management state
  const [seats, setSeats] = useState<SeatsData | null>(null)
  const [seatsLoading, setSeatsLoading] = useState(false)
  
  const supabase = createClient()

  const fetchSubscription = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setSubscription(null)
        return
      }

      // Fetch user subscription with plan
      const { data: subData, error: subError } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          plan:subscription_plans(*)
        `)
        .eq('user_id', user.id)
        .single()

      // Fetch seat pricing for cost calculation
      const { data: pricingData } = await supabase
        .from('seat_pricing')
        .select('*')
        .order('min_seat')
      
      if (pricingData) {
        setSeatPricing(pricingData)
      }

      // If no subscription, create default free subscription
      if (subError?.code === 'PGRST116' || !subData) {
        // Get free plan
        const { data: freePlan } = await supabase
          .from('subscription_plans')
          .select('*')
          .eq('name', 'free')
          .single()

        if (freePlan) {
          // Create free subscription for user
          const { data: newSub } = await supabase
            .from('user_subscriptions')
            .insert({
              user_id: user.id,
              plan_id: freePlan.id,
              status: 'active',
              storage_used_bytes: 0
            })
            .select(`*, plan:subscription_plans(*)`)
            .single()

          if (newSub) {
            const fullSub = await buildFullSubscription(newSub, user.id, pricingData || [])
            setSubscription(fullSub)
          }
        }
        return
      }

      const fullSub = await buildFullSubscription(subData, user.id, pricingData || [])
      setSubscription(fullSub)

    } catch (err) {
      console.error('Error fetching subscription:', err)
      setError('Failed to load subscription')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const buildFullSubscription = async (
    subData: any, 
    userId: string,
    pricing: SeatPricing[]
  ): Promise<SubscriptionWithDetails> => {
    // Fetch seats
    const { data: seatsData } = await supabase
      .from('subscription_seats')
      .select('*')
      .eq('subscription_id', subData.id)
      .order('seat_number')

    // Fetch storage breakdown from multiple sources
    const storageByType = {
      video: 0,
      image: 0,
      audio: 0,
      document: 0
    }
    let totalBytes = 0

    // 1. Check storage_usage table (legacy/explicit tracking)
    const { data: storageData } = await supabase
      .from('storage_usage')
      .select('content_type, size_bytes')
      .eq('user_id', userId)

    if (storageData) {
      storageData.forEach(item => {
        storageByType[item.content_type as keyof typeof storageByType] += item.size_bytes
        totalBytes += item.size_bytes
      })
    }

    // 2. Calculate from memory_media (actual uploaded files)
    const { data: mediaData } = await supabase
      .from('memory_media')
      .select('file_size, file_type, memory_id')
      .eq('memory_id', supabase.from('memories').select('id').eq('user_id', userId))
    
    // Alternative: Direct query for user's media
    const { data: userMedia } = await supabase
      .from('memory_media')
      .select('file_size, file_type, memories!inner(user_id)')
      .eq('memories.user_id', userId)

    if (userMedia) {
      userMedia.forEach((item: any) => {
        const size = item.file_size || 0
        const type = item.file_type || 'document'
        
        // Map file_type to category
        if (type.startsWith('video') || type === 'video') {
          storageByType.video += size
        } else if (type.startsWith('image') || type === 'image') {
          storageByType.image += size
        } else if (type.startsWith('audio') || type === 'audio') {
          storageByType.audio += size
        } else {
          storageByType.document += size
        }
        totalBytes += size
      })
    }

    // 3. Estimate text content size (memories descriptions)
    const { data: memoriesData } = await supabase
      .from('memories')
      .select('description')
      .eq('user_id', userId)

    if (memoriesData) {
      const textBytes = memoriesData.reduce((acc, m) => {
        return acc + (m.description?.length || 0) * 2 // UTF-16 estimate
      }, 0)
      storageByType.document += textBytes
      totalBytes += textBytes
    }

    const limitBytes = subData.plan?.storage_limit_bytes || 10737418240 // 10GB default

    const storage: StorageBreakdown = {
      total_bytes: totalBytes,
      limit_bytes: limitBytes,
      percentage: (totalBytes / limitBytes) * 100,
      by_type: storageByType
    }

    // Calculate monthly cost
    const seatCount = seatsData?.filter(s => s.status === 'active').length || 1
    const monthly_cost_cents = calculateTotalMonthlyCost(
      subData.plan?.price_cents || 0,
      seatCount,
      pricing
    )

    return {
      ...subData,
      seats: seatsData || [],
      storage,
      monthly_cost_cents
    }
  }

  useEffect(() => {
    fetchSubscription()
  }, [fetchSubscription])

  const isPremium = subscription?.plan?.name === 'premium' && subscription?.status === 'active'

  const hasFeature = useCallback((feature: FeatureKey): boolean => {
    if (!subscription?.plan?.features) {
      return false // Default to no access
    }
    return !!subscription.plan.features[feature]
  }, [subscription])

  const getStoragePercentage = useCallback((): number => {
    return subscription?.storage?.percentage || 0
  }, [subscription])

  const isStorageFull = useCallback((): boolean => {
    return getStoragePercentage() >= 100
  }, [getStoragePercentage])

  // Seat management functions
  const fetchSeats = useCallback(async () => {
    try {
      setSeatsLoading(true)
      const response = await fetch('/api/subscription/seats')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch seats')
      }

      setSeats({
        seats: data.seats || [],
        pricing: data.pricing || [],
        maxSeats: data.maxSeats || 10
      })
    } catch (err) {
      console.error('Error fetching seats:', err)
    } finally {
      setSeatsLoading(false)
    }
  }, [])

  const inviteSeat = useCallback(async (email: string) => {
    const response = await fetch('/api/subscription/seats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to send invite')
    }

    // Refresh seats list
    await fetchSeats()
  }, [fetchSeats])

  const removeSeat = useCallback(async (seatId: string) => {
    const response = await fetch(`/api/subscription/seats?seatId=${seatId}`, {
      method: 'DELETE'
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to remove seat')
    }

    // Refresh seats list
    await fetchSeats()
  }, [fetchSeats])

  const resendInvite = useCallback(async (seatId: string) => {
    const response = await fetch('/api/subscription/seats', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seatId })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to resend invite')
    }
  }, [])

  return {
    subscription,
    isLoading,
    error,
    isPremium,
    hasFeature,
    getStoragePercentage,
    isStorageFull,
    refetch: fetchSubscription,
    // Seat management
    seats,
    seatsLoading,
    fetchSeats,
    inviteSeat,
    removeSeat,
    resendInvite
  }
}
