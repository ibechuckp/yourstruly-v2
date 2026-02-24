import { AdminRole } from '@/types/admin';

/**
 * Get admin role display name
 */
export function getRoleDisplayName(role: AdminRole): string {
  const names: Record<AdminRole, string> = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    support: 'Support',
    billing: 'Billing',
    content_moderator: 'Content Moderator',
    readonly: 'Read Only',
  };
  return names[role];
}

/**
 * Get admin role badge color
 */
export function getRoleBadgeColor(role: AdminRole): string {
  const colors: Record<AdminRole, string> = {
    super_admin: 'bg-purple-100 text-purple-800 border-purple-200',
    admin: 'bg-blue-100 text-blue-800 border-blue-200',
    support: 'bg-green-100 text-green-800 border-green-200',
    billing: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    content_moderator: 'bg-orange-100 text-orange-800 border-orange-200',
    readonly: 'bg-gray-100 text-gray-800 border-gray-200',
  };
  return colors[role];
}
