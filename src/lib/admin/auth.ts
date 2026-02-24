'use server';

import { createClient } from '@/lib/supabase/server';
import { AdminUser, AdminRole, hasPermission } from '@/types/admin';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

/**
 * Get the current admin user from the session
 */
export async function getCurrentAdmin(): Promise<AdminUser | null> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }
  
  // Check if user is an admin
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('*')
    .eq('id', user.id)
    .eq('is_active', true)
    .single();
  
  if (!adminUser) {
    return null;
  }
  
  return {
    ...adminUser,
    email: user.email,
    full_name: user.user_metadata?.full_name || null,
  } as AdminUser;
}

/**
 * Require admin authentication - throws if not authenticated
 */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getCurrentAdmin();
  
  if (!admin) {
    redirect('/admin/login');
  }
  
  return admin;
}

/**
 * Require specific permission
 */
export async function requirePermission(permission: string): Promise<AdminUser> {
  const admin = await requireAdmin();
  
  if (!hasPermission(admin.role, permission)) {
    throw new Error('Insufficient permissions');
  }
  
  return admin;
}

/**
 * Check if current user has admin access
 */
export async function isAdmin(): Promise<boolean> {
  const admin = await getCurrentAdmin();
  return admin !== null;
}

/**
 * Check if current user has specific permission
 */
export async function checkPermission(permission: string): Promise<boolean> {
  const admin = await getCurrentAdmin();
  if (!admin) return false;
  return hasPermission(admin.role, permission);
}

/**
 * Update admin last login timestamp
 */
export async function updateLastLogin(adminId: string): Promise<void> {
  const supabase = await createClient();
  
  await supabase
    .from('admin_users')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', adminId);
}

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
