import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { logAdminAction, AuditActions } from '@/lib/admin/audit';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user before signing out
    const { data: { user } } = await supabase.auth.getUser();

    // Log the logout action
    if (user) {
      await logAdminAction(
        AuditActions.ADMIN_LOGOUT,
        'admin_user',
        user.id
      );
    }

    // Sign out
    await supabase.auth.signOut();

    return NextResponse.redirect(new URL('/admin/login', request.url));
  } catch (error) {
    console.error('Admin logout error:', error);
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }
}
