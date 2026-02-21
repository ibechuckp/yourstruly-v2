'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { XPService, UserXP, XP_REWARDS, XP_COSTS } from '@/lib/xp/xpService'

export function useXP() {
  const [userXP, setUserXP] = useState<UserXP | null>(null)
  const [loading, setLoading] = useState(true)
  const [xpService, setXPService] = useState<XPService | null>(null)
  
  const supabase = createClient()

  useEffect(() => {
    const service = new XPService(supabase)
    setXPService(service)
    
    const loadXP = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const xp = await service.getUserXP(user.id)
      setUserXP(xp)
      setLoading(false)
    }

    loadXP()
  }, [])

  // Award XP and refresh state
  const awardXP = useCallback(async (
    action: string,
    amount: number,
    description?: string
  ) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !xpService) return null

    const newTotal = await xpService.awardXP(user.id, action, amount, description)
    
    // Refresh state
    const updated = await xpService.getUserXP(user.id)
    setUserXP(updated)
    
    return newTotal
  }, [xpService, supabase])

  // Record activity (for streaks)
  const recordActivity = useCallback(async (activityType: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !xpService) return null

    const result = await xpService.recordActivity(user.id, activityType)
    
    // Refresh state
    const updated = await xpService.getUserXP(user.id)
    setUserXP(updated)
    
    return result
  }, [xpService, supabase])

  // Award profile completion XP
  const awardProfileCompletion = useCallback(async (section: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !xpService) return false

    const awarded = await xpService.awardProfileCompletionXP(user.id, section)
    
    if (awarded) {
      const updated = await xpService.getUserXP(user.id)
      setUserXP(updated)
    }
    
    return awarded
  }, [xpService, supabase])

  // Purchase PostScript with XP
  const purchasePostScript = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !xpService) return false

    const success = await xpService.purchasePostScript(user.id)
    
    if (success) {
      const updated = await xpService.getUserXP(user.id)
      setUserXP(updated)
    }
    
    return success
  }, [xpService, supabase])

  // Use a PostScript
  const usePostScript = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !xpService) return false

    const success = await xpService.usePostScript(user.id)
    
    if (success) {
      const updated = await xpService.getUserXP(user.id)
      setUserXP(updated)
    }
    
    return success
  }, [xpService, supabase])

  // Check if can afford something
  const canAfford = useCallback((cost: number) => {
    return (userXP?.available_xp || 0) >= cost
  }, [userXP])

  return {
    // State
    userXP,
    loading,
    
    // Computed
    totalXP: userXP?.total_xp || 0,
    availableXP: userXP?.available_xp || 0,
    level: userXP?.level || 1,
    streak: userXP?.current_streak || 0,
    longestStreak: userXP?.longest_streak || 0,
    postscriptsAvailable: userXP?.postscripts_available || 0,
    isPremium: userXP?.is_premium || false,
    
    // Actions
    awardXP,
    recordActivity,
    awardProfileCompletion,
    purchasePostScript,
    usePostScript,
    canAfford,
    
    // Constants
    XP_REWARDS,
    XP_COSTS,
  }
}
