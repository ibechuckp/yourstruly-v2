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

// Utility functions moved to ./utils.ts to avoid 'use server' issues
// Import getRoleDisplayName, getRoleBadgeColor from '@/lib/admin/utils'
