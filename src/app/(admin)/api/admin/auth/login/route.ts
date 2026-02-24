import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { logAdminAction } from '@/lib/admin/audit';
import { AuditActions } from '@/lib/admin/audit-actions';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Attempt to sign in
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if user is an admin (use admin client to bypass RLS)
    const adminSupabase = createAdminClient();
    const { data: adminUser, error: adminError } = await adminSupabase
      .from('admin_users')
      .select('*')
      .eq('id', authData.user.id)
      .eq('is_active', true)
      .single();

    if (adminError || !adminUser) {
      // Sign out the user since they're not an admin
      await supabase.auth.signOut();
      
      return NextResponse.json(
        { error: 'Access denied - not an admin user' },
        { status: 403 }
      );
    }

    // Update last login (use admin client to bypass RLS)
    await adminSupabase
      .from('admin_users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', authData.user.id);

    // Log the login action
    await logAdminAction(
      AuditActions.ADMIN_LOGIN,
      'admin_user',
      authData.user.id,
      undefined,
      { ip: request.headers.get('x-forwarded-for') || 'unknown' }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
