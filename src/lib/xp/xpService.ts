/**
 * XP System Service
 * 
 * Handles all XP-related operations including:
 * - Awarding XP for actions
 * - Tracking streaks
 * - Managing PostScript balance
 * - League interactions
 */

import { SupabaseClient } from '@supabase/supabase-js'

// XP amounts for each action
export const XP_REWARDS = {
  // Daily
  DAILY_LOGIN: 10,
  STREAK_BONUS: 5,
  
  // Content creation
  ADD_MEMORY: 25,
  MEMORY_WITH_PHOTO: 10,  // Bonus
  MEMORY_WITH_VOICE: 15,  // Bonus
  ADD_CONTACT: 15,
  WRITE_POSTSCRIPT: 20,
  
  // Profile completion (one-time)
  COMPLETE_INTERESTS: 100,
  COMPLETE_SKILLS: 100,
  COMPLETE_PERSONALITY: 100,
  COMPLETE_BIO: 50,
  COMPLETE_CREDO: 50,
  COMPLETE_LIFE_GOALS: 100,
  UPLOAD_AVATAR: 50,
  
  // Photo & Media
  UPLOAD_PHOTO: 2,          // Max 50/day (100 XP daily cap)
  ADD_PHOTO_CAPTION: 5,     // Short description
  ADD_PHOTO_BACKSTORY: 15,  // Full context
  TAG_PERSON_IN_PHOTO: 5,   // Link face to contact
  CONFIRM_FACE_MATCH: 3,    // Verify AI suggestion
  CREATE_MEMORY_FROM_PHOTOS: 25,
  
  // Contact completion
  COMPLETE_CONTACT: 50,     // Bonus when contact has: name+email/phone+relation+DOB+address
  
  // Engagement
  INVITE_FRIEND: 200,
  ANSWER_INTERVIEW: 30,
  AI_CHAT: 5,  // Max 10/day
  
  // Streak milestones
  STREAK_7_DAYS: 50,
  STREAK_30_DAYS: 200,
  STREAK_100_DAYS: 500,
  STREAK_365_DAYS: 2000,
}

// XP costs
export const XP_COSTS = {
  POSTSCRIPT: 200, // Trade XP for postscript credit
  STREAK_FREEZE: 200,
  PREMIUM_THEME: 300,
}

export interface UserXP {
  user_id: string
  total_xp: number
  available_xp: number
  level: number
  current_streak: number
  longest_streak: number
  last_activity_date: string | null
  streak_freezes: number
  postscripts_available: number
  postscripts_used: number
  is_premium: boolean
}

export interface XPTransaction {
  id: string
  amount: number
  action: string
  description: string | null
  created_at: string
}

export class XPService {
  constructor(private supabase: SupabaseClient) {}

  // Get user's XP stats
  async getUserXP(userId: string): Promise<UserXP | null> {
    const { data, error } = await this.supabase
      .from('user_xp')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user XP:', error)
    }
    return data
  }

  // Award XP for an action
  async awardXP(
    userId: string,
    action: string,
    amount: number,
    description?: string,
    referenceType?: string,
    referenceId?: string
  ): Promise<number | null> {
    const { data, error } = await this.supabase.rpc('award_xp', {
      p_user_id: userId,
      p_amount: amount,
      p_action: action,
      p_description: description || null,
      p_reference_type: referenceType || null,
      p_reference_id: referenceId || null,
    })

    if (error) {
      console.error('Error awarding XP:', error)
      return null
    }
    return data
  }

  // Spend XP on something
  async spendXP(
    userId: string,
    amount: number,
    action: string,
    description?: string
  ): Promise<boolean> {
    const { data, error } = await this.supabase.rpc('spend_xp', {
      p_user_id: userId,
      p_amount: amount,
      p_action: action,
      p_description: description || null,
    })

    if (error) {
      console.error('Error spending XP:', error)
      return false
    }
    return data === true
  }

  // Record daily activity and update streak
  async recordActivity(
    userId: string,
    activityType: string
  ): Promise<{ streak: number; xpEarned: number } | null> {
    const { data, error } = await this.supabase.rpc('record_daily_activity', {
      p_user_id: userId,
      p_activity_type: activityType,
    })

    if (error) {
      console.error('Error recording activity:', error)
      return null
    }

    if (data && data.length > 0) {
      return {
        streak: data[0].streak,
        xpEarned: data[0].xp_earned,
      }
    }
    return null
  }

  // Check if profile section completion XP was already awarded
  async checkProfileCompletionXP(userId: string, section: string): Promise<boolean> {
    const { data } = await this.supabase
      .from('profile_completion_xp')
      .select('section')
      .eq('user_id', userId)
      .eq('section', section)
      .single()

    return !!data
  }

  // Award profile completion XP (one-time)
  async awardProfileCompletionXP(userId: string, section: string): Promise<boolean> {
    // Check if already awarded
    const alreadyAwarded = await this.checkProfileCompletionXP(userId, section)
    if (alreadyAwarded) return false

    const xpMap: Record<string, number> = {
      interests: XP_REWARDS.COMPLETE_INTERESTS,
      skills: XP_REWARDS.COMPLETE_SKILLS,
      personality: XP_REWARDS.COMPLETE_PERSONALITY,
      bio: XP_REWARDS.COMPLETE_BIO,
      credo: XP_REWARDS.COMPLETE_CREDO,
      life_goals: XP_REWARDS.COMPLETE_LIFE_GOALS,
      avatar: XP_REWARDS.UPLOAD_AVATAR,
    }

    const amount = xpMap[section]
    if (!amount) return false

    // Award XP
    await this.awardXP(userId, 'profile_completion', amount, `Completed ${section}`)

    // Mark as awarded
    await this.supabase
      .from('profile_completion_xp')
      .insert({ user_id: userId, section, xp_awarded: amount })

    return true
  }

  // Purchase PostScript with XP
  async purchasePostScript(userId: string): Promise<boolean> {
    const success = await this.spendXP(userId, XP_COSTS.POSTSCRIPT, 'buy_postscript', 'Purchased PostScript')
    
    if (success) {
      // Increment postscripts_available
      await this.supabase
        .from('user_xp')
        .update({ 
          postscripts_available: this.supabase.rpc('increment_field', { 
            field: 'postscripts_available' 
          })
        })
        .eq('user_id', userId)

      // Simpler update
      const { data: current } = await this.supabase
        .from('user_xp')
        .select('postscripts_available')
        .eq('user_id', userId)
        .single()

      if (current) {
        await this.supabase
          .from('user_xp')
          .update({ postscripts_available: current.postscripts_available + 1 })
          .eq('user_id', userId)
      }
    }

    return success
  }

  // Use a PostScript
  async usePostScript(userId: string): Promise<boolean> {
    const { data: userXP } = await this.supabase
      .from('user_xp')
      .select('postscripts_available, postscripts_used')
      .eq('user_id', userId)
      .single()

    if (!userXP || userXP.postscripts_available <= 0) {
      return false
    }

    await this.supabase
      .from('user_xp')
      .update({
        postscripts_available: userXP.postscripts_available - 1,
        postscripts_used: userXP.postscripts_used + 1,
      })
      .eq('user_id', userId)

    return true
  }

  // Get XP transaction history
  async getTransactions(userId: string, limit = 50): Promise<XPTransaction[]> {
    const { data, error } = await this.supabase
      .from('xp_transactions')
      .select('id, amount, action, description, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching transactions:', error)
      return []
    }
    return data || []
  }

  // Get league leaderboard
  async getLeaderboard(leagueId: string): Promise<Array<{
    user_id: string
    weekly_xp: number
    rank: number
    full_name: string
    avatar_url: string
  }>> {
    const { data, error } = await this.supabase
      .from('league_members')
      .select(`
        user_id,
        weekly_xp,
        rank,
        profiles!inner(full_name, avatar_url)
      `)
      .eq('league_id', leagueId)
      .order('weekly_xp', { ascending: false })
      .limit(20)

    if (error) {
      console.error('Error fetching leaderboard:', error)
      return []
    }

    return (data || []).map((m: any) => ({
      user_id: m.user_id,
      weekly_xp: m.weekly_xp,
      rank: m.rank,
      full_name: m.profiles?.full_name || 'Unknown',
      avatar_url: m.profiles?.avatar_url || '',
    }))
  }
}

// Hook for React components
export function createXPService(supabase: SupabaseClient): XPService {
  return new XPService(supabase)
}
