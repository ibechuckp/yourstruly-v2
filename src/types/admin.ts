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

export interface AdminUserWithEmail extends AdminUser {
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
