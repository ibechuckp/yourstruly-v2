// Subscription System Types

export interface SubscriptionPlan {
  id: string
  name: 'free' | 'premium'
  display_name: string
  description: string | null
  price_cents: number
  storage_limit_bytes: number
  is_active: boolean
  features: PlanFeatures
  created_at: string
  updated_at: string
}

export interface PlanFeatures {
  ai_chat: boolean
  video_memories: boolean
  interview_requests: number // -1 = unlimited
  marketplace_discount: number // percentage
  [key: string]: boolean | number
}

export interface SeatPricing {
  id: string
  min_seat: number
  max_seat: number
  price_cents: number
}

export interface FeatureDefinition {
  id: string
  key: string
  name: string
  description: string | null
  category: 'core' | 'ai' | 'storage' | 'marketplace' | 'social' | 'general'
  default_free: boolean
  default_premium: boolean
}

export interface UserSubscription {
  id: string
  user_id: string
  plan_id: string
  plan?: SubscriptionPlan
  status: 'active' | 'cancelled' | 'past_due' | 'trialing'
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  storage_used_bytes: number
  created_at: string
  updated_at: string
}

export interface SubscriptionSeat {
  id: string
  subscription_id: string
  seat_number: number
  user_id: string | null
  email: string | null
  invite_token: string | null
  invite_sent_at: string | null
  accepted_at: string | null
  status: 'pending' | 'active' | 'removed'
  created_at: string
  user?: {
    id: string
    email: string
    full_name: string | null
  }
}

export interface StorageUsage {
  id: string
  user_id: string
  content_type: 'video' | 'image' | 'audio' | 'document'
  file_key: string
  size_bytes: number
  created_at: string
}

// Computed types for UI
export interface StorageBreakdown {
  total_bytes: number
  limit_bytes: number
  percentage: number
  by_type: {
    video: number
    image: number
    audio: number
    document: number
  }
}

export interface SubscriptionWithDetails extends UserSubscription {
  plan: SubscriptionPlan
  seats: SubscriptionSeat[]
  storage: StorageBreakdown
  monthly_cost_cents: number // base + seat costs
}

// Feature check helper
export type FeatureKey = 
  | 'ai_chat'
  | 'ai_followups'
  | 'video_memories'
  | 'audio_memories'
  | 'image_memories'
  | 'interview_unlimited'
  | 'future_messages'
  | 'future_gifts'
  | 'marketplace_discount'
  | 'export_data'
  | 'priority_support'
  | 'custom_themes'
  | 'shared_memories'
  | 'advanced_search'
  | 'wisdom_categories'

// Pricing calculation helpers
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

export function calculateSeatCost(seatNumber: number, pricing: SeatPricing[]): number {
  const tier = pricing.find(p => seatNumber >= p.min_seat && seatNumber <= p.max_seat)
  return tier?.price_cents ?? 0
}

export function calculateTotalMonthlyCost(
  basePriceCents: number,
  seatCount: number,
  pricing: SeatPricing[]
): number {
  let total = basePriceCents
  for (let seat = 1; seat <= seatCount; seat++) {
    total += calculateSeatCost(seat, pricing)
  }
  return total
}
