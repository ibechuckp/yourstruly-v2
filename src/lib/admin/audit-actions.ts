// Common action types for consistency
// This is a separate file because 'use server' files can only export async functions

export const AuditActions = {
  // User actions
  USER_CREATE: 'user:create',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  USER_SUSPEND: 'user:suspend',
  USER_UNSUSPEND: 'user:unsuspend',
  USER_IMPERSONATE: 'user:impersonate',
  
  // Feature flag actions
  FEATURE_FLAG_CREATE: 'feature_flag:create',
  FEATURE_FLAG_UPDATE: 'feature_flag:update',
  FEATURE_FLAG_DELETE: 'feature_flag:delete',
  FEATURE_FLAG_TOGGLE: 'feature_flag:toggle',
  
  // System settings
  SYSTEM_SETTING_UPDATE: 'system_setting:update',
  
  // Admin actions
  ADMIN_CREATE: 'admin:create',
  ADMIN_UPDATE: 'admin:update',
  ADMIN_DELETE: 'admin:delete',
  ADMIN_ROLE_CHANGE: 'admin:role_change',
  
  // Content moderation
  CONTENT_APPROVE: 'content:approve',
  CONTENT_REJECT: 'content:reject',
  CONTENT_FLAG: 'content:flag',
  
  // Billing
  SUBSCRIPTION_UPDATE: 'subscription:update',
  REFUND_PROCESS: 'refund:process',
  COUPON_CREATE: 'coupon:create',
  COUPON_UPDATE: 'coupon:update',
  
  // AI config
  AI_MODEL_UPDATE: 'ai_model:update',
  PROMPT_UPDATE: 'prompt:update',
  
  // Engagement prompts
  ENGAGEMENT_PROMPT_CREATE: 'engagement_prompt:create',
  ENGAGEMENT_PROMPT_UPDATE: 'engagement_prompt:update',
  ENGAGEMENT_PROMPT_DELETE: 'engagement_prompt:delete',
  ENGAGEMENT_PROMPT_TOGGLE: 'engagement_prompt:toggle',
  
  // Auth
  ADMIN_LOGIN: 'admin:login',
  ADMIN_LOGOUT: 'admin:logout',
} as const;

export type AuditAction = typeof AuditActions[keyof typeof AuditActions];
