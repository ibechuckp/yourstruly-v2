'use server';

import { createClient } from '@/lib/supabase/server';
import { AuditLog, AuditLogFilter } from '@/types/admin';
import { headers } from 'next/headers';

/**
 * Log an admin action to the audit log
 */
export async function logAdminAction(
  action: string,
  entityType: string,
  entityId?: string,
  oldValues?: Record<string, unknown>,
  newValues?: Record<string, unknown>
): Promise<string | null> {
  try {
    const supabase = await createClient();
    const headersList = await headers();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn('Attempted to log admin action without authenticated user');
      return null;
    }
    
    // Get client IP and user agent
    const forwardedFor = headersList.get('x-forwarded-for');
    const realIp = headersList.get('x-real-ip');
    const ipAddress = forwardedFor?.split(',')[0] || realIp || '127.0.0.1';
    const userAgent = headersList.get('user-agent') || null;
    
    // Insert audit log
    const { data, error } = await supabase
      .from('audit_logs')
      .insert({
        admin_id: user.id,
        admin_email: user.email,
        action,
        entity_type: entityType,
        entity_id: entityId || null,
        old_values: oldValues || null,
        new_values: newValues || null,
        ip_address: ipAddress,
        user_agent: userAgent,
      })
      .select('id')
      .single();
    
    if (error) {
      console.error('Failed to create audit log:', error);
      return null;
    }
    
    return data.id;
  } catch (error) {
    console.error('Error in logAdminAction:', error);
    return null;
  }
}

/**
 * Get audit logs with filtering and pagination
 */
export async function getAuditLogs(
  filter: AuditLogFilter = {},
  page: number = 1,
  limit: number = 50
): Promise<{ logs: AuditLog[]; total: number }> {
  const supabase = await createClient();
  
  let query = supabase
    .from('audit_logs')
    .select('*', { count: 'exact' });
  
  // Apply filters
  if (filter.action) {
    query = query.eq('action', filter.action);
  }
  
  if (filter.entityType) {
    query = query.eq('entity_type', filter.entityType);
  }
  
  if (filter.adminId) {
    query = query.eq('admin_id', filter.adminId);
  }
  
  if (filter.startDate) {
    query = query.gte('created_at', filter.startDate);
  }
  
  if (filter.endDate) {
    query = query.lte('created_at', filter.endDate);
  }
  
  if (filter.search) {
    query = query.or(`action.ilike.%${filter.search}%,entity_type.ilike.%${filter.search}%,admin_email.ilike.%${filter.search}%`);
  }
  
  // Pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  
  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to);
  
  if (error) {
    console.error('Failed to fetch audit logs:', error);
    throw new Error('Failed to fetch audit logs');
  }
  
  return {
    logs: data as AuditLog[],
    total: count || 0,
  };
}

/**
 * Get recent audit logs for a specific entity
 */
export async function getEntityAuditLogs(
  entityType: string,
  entityId: string,
  limit: number = 20
): Promise<AuditLog[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('Failed to fetch entity audit logs:', error);
    return [];
  }
  
  return data as AuditLog[];
}

/**
 * Get audit log statistics
 */
export async function getAuditStats(days: number = 7): Promise<{
  totalActions: number;
  actionsByType: Record<string, number>;
  topAdmins: { admin_email: string; count: number }[];
}> {
  const supabase = await createClient();
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  // Get total actions
  const { count: totalActions } = await supabase
    .from('audit_logs')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startDate.toISOString());
  
  // Get actions by type
  const { data: actionsByTypeData } = await supabase
    .from('audit_logs')
    .select('action')
    .gte('created_at', startDate.toISOString());
  
  const actionsByType: Record<string, number> = {};
  actionsByTypeData?.forEach((log) => {
    actionsByType[log.action] = (actionsByType[log.action] || 0) + 1;
  });
  
  // Get top admins
  const { data: topAdminsData } = await supabase
    .from('audit_logs')
    .select('admin_email')
    .gte('created_at', startDate.toISOString());
  
  const adminCounts: Record<string, number> = {};
  topAdminsData?.forEach((log) => {
    if (log.admin_email) {
      adminCounts[log.admin_email] = (adminCounts[log.admin_email] || 0) + 1;
    }
  });
  
  const topAdmins = Object.entries(adminCounts)
    .map(([admin_email, count]) => ({ admin_email, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  return {
    totalActions: totalActions || 0,
    actionsByType,
    topAdmins,
  };
}

// Common action types for consistency
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
  
  // Auth
  ADMIN_LOGIN: 'admin:login',
  ADMIN_LOGOUT: 'admin:logout',
} as const;
