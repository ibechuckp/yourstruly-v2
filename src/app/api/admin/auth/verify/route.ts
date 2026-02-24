import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user from session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check if user is an admin (use admin client to bypass RLS)
    const adminSupabase = createAdminClient();
    const { data: adminUser, error: adminError } = await adminSupabase
      .from('admin_users')
      .select('*')
      .eq('id', user.id)
      .eq('is_active', true)
      .single();

    if (adminError || !adminUser) {
      return NextResponse.json(
        { error: 'Access denied - not an admin user' },
        { status: 403 }
      );
    }

    // Update last login
    await adminSupabase
      .from('admin_users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id);

    return NextResponse.json({ 
      success: true,
      admin: {
        id: adminUser.id,
        role: adminUser.role,
      }
    });
  } catch (error) {
    console.error('Admin verify error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
