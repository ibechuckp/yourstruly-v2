// Admin Portal Types

export type AdminRole = 'super_admin' | 'admin' | 'support' | 'billing' | 'content_moderator' | 'readonly';

export interface AdminUser {
  id: string;
  role: AdminRole;
  permissions: Record<string, boolean>;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
  email?: string;
  full_name?: string;
}

export interface AdminUserWithEmail extends Omit<AdminUser, 'email' | 'full_name'> {
  email: string;
  full_name: string | null;
}

export interface AuditLog {
  id: string;
  admin_id: string | null;
  admin_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string | null;
  enabled: boolean;
  targeting_type: 'global' | 'user' | 'rollout' | 'segment';
  targeting_config: Record<string, unknown>;
  rollout_percentage: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface SystemSetting {
  key: string;
  value: Record<string, unknown>;
  description: string | null;
  category: string;
  updated_at: string;
  updated_by: string | null;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  subscription_tier: string | null;
  subscription_status: string | null;
  is_active: boolean;
}

export interface AdminNavItem {
  label: string;
  href: string;
  icon: string;
  requiredRoles?: AdminRole[];
  badge?: number;
}

export interface AuditLogFilter {
  action?: string;
  entityType?: string;
  adminId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface UserFilter {
  search?: string;
  status?: 'active' | 'inactive' | 'all';
  subscriptionTier?: string;
  dateFrom?: string;
  dateTo?: string;
}

// ============================================================================
// BILLING & SUBSCRIPTIONS
// ============================================================================

export interface BillingPlan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_cents: number;
  currency: string;
  interval: 'month' | 'year' | 'lifetime';
  stripe_price_id: string | null;
  stripe_product_id: string | null;
  features: string[];
  limits: Record<string, number | boolean>;
  is_active: boolean;
  is_default: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  currency: string;
  max_redemptions: number | null;
  redemptions_count: number;
  min_purchase_cents: number | null;
  applicable_plans: string[];
  starts_at: string;
  expires_at: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionAdmin {
  id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_payment_method_id: string | null;
  billing_address: Record<string, unknown> | null;
  payment_status: 'active' | 'past_due' | 'canceled' | 'unpaid' | 'trialing';
  cancel_at_period_end: boolean;
  current_period_start: string | null;
  current_period_end: string | null;
  canceled_at: string | null;
  updated_at: string;
}

// ============================================================================
// MARKETPLACE ADMIN
// ============================================================================

export type MarketplaceProviderId = 'prodigi' | 'spocket' | 'floristone';

export interface MarketplaceProvider {
  id: MarketplaceProviderId;
  name: string;
  description: string | null;
  is_active: boolean;
  api_key_encrypted: string | null;
  api_endpoint: string | null;
  webhook_url: string | null;
  webhook_secret: string | null;
  rate_limit_per_minute: number;
  timeout_seconds: number;
  markup_percentage: number;
  settings: Record<string, unknown>;
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MarketplaceCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  provider: MarketplaceProviderId | null;
  parent_id: string | null;
  display_order: number;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface MarketplaceProduct {
  id: string;
  external_id: string | null;
  name: string;
  description: string | null;
  provider: MarketplaceProviderId | null;
  category_id: string | null;
  base_price_cents: number;
  sale_price_cents: number | null;
  cost_price_cents: number | null;
  currency: string;
  images: string[];
  variants: Array<{
    id: string;
    name: string;
    price?: number;
    inStock: boolean;
    options: Record<string, string>;
  }>;
  attributes: Record<string, unknown>;
  in_stock: boolean;
  stock_quantity: number | null;
  fulfillment_time_days: number;
  shipping_weight_oz: number | null;
  is_curated: boolean;
  curated_score: number | null;
  collections: string[];
  occasions: string[];
  emotional_impact: 'high' | 'medium' | 'low' | null;
  pairing_suggestions: string[];
  why_we_love_it: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface MarketplaceOrderAdmin {
  id: string;
  order_number: string;
  user_id: string;
  user_email: string | null;
  status: string;
  subtotal_cents: number;
  tax_cents: number;
  shipping_cents: number;
  discount_cents: number | null;
  total_cents: number;
  currency: string;
  shipping_address: Record<string, unknown> | null;
  is_gift: boolean;
  gift_message: string | null;
  scheduled_delivery_date: string | null;
  provider_order_ids: Record<string, string> | null;
  created_at: string;
  updated_at: string;
  item_count: number;
}

// ============================================================================
// AI CONFIGURATION
// ============================================================================

export type AIUseCase = 'interview' | 'chat' | 'rag' | 'image_generation' | 'voice_generation' | 'embeddings';
export type AIProvider = 'anthropic' | 'openai' | 'google' | 'ollama' | 'elevenlabs';

export interface AIModelConfig {
  id: string;
  name: string;
  use_case: AIUseCase;
  provider: AIProvider;
  model: string;
  api_key_env_var: string | null;
  temperature: number;
  max_tokens: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
  timeout_ms: number;
  retry_attempts: number;
  is_active: boolean;
  is_default: boolean;
  display_order: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface SystemPrompt {
  id: string;
  use_case: 'interview' | 'chat' | 'rag' | 'memory_creation' | 'wisdom_extraction' | 'postscript_generation';
  name: string;
  description: string | null;
  prompt_text: string;
  version: number;
  parent_id: string | null;
  variables: string[];
  is_active: boolean;
  is_default: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface RAGSettings {
  id: string;
  name: string;
  embedding_model: string;
  embedding_dimensions: number;
  chunk_size: number;
  chunk_overlap: number;
  retrieval_count: number;
  similarity_threshold: number;
  reranking_enabled: boolean;
  reranking_model: string | null;
  context_window_tokens: number;
  max_context_chunks: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VoiceCloneConfig {
  id: string;
  name: string;
  elevenlabs_voice_id: string;
  description: string | null;
  gender: 'male' | 'female' | 'neutral' | null;
  age_group: 'child' | 'young' | 'middle' | 'senior' | null;
  accent: string | null;
  use_case: 'narration' | 'chat' | 'interview' | 'memories' | null;
  sample_url: string | null;
  settings: {
    stability: number;
    similarity_boost: number;
    style: number;
    speaker_boost: boolean;
  };
  is_active: boolean;
  is_default: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// STRIPE WEBHOOKS
// ============================================================================

export interface StripeWebhookLog {
  id: string;
  event_id: string;
  event_type: string;
  data: Record<string, unknown>;
  processed_at: string;
  processing_status: 'pending' | 'processed' | 'failed' | 'ignored';
  error_message: string | null;
  created_at: string;
}

// Permissions matrix
export const ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  super_admin: ['*'],
  admin: [
    'users:read', 'users:write', 'users:suspend',
    'analytics:read',
    'billing:read', 'billing:write',
    'marketplace:read', 'marketplace:write',
    'ai:read', 'ai:write',
    'engagement:read', 'engagement:write',
    'moderation:read', 'moderation:write',
    'settings:read', 'settings:write',
    'audit:read'
  ],
  support: [
    'users:read', 'users:write',
    'analytics:read',
    'moderation:read', 'moderation:write',
    'audit:read'
  ],
  billing: [
    'users:read',
    'analytics:read',
    'billing:read', 'billing:write',
    'audit:read'
  ],
  content_moderator: [
    'users:read',
    'moderation:read', 'moderation:write',
    'engagement:read', 'engagement:write',
    'audit:read'
  ],
  readonly: [
    'users:read',
    'analytics:read',
    'audit:read'
  ]
};

export function hasPermission(role: AdminRole, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  if (permissions.includes('*')) return true;
  if (permissions.includes(permission)) return true;
  
  // Check wildcard permissions (e.g., 'users:read' matches 'users:*')
  const [resource, action] = permission.split(':');
  return permissions.includes(`${resource}:*`);
}
