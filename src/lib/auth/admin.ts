import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export interface AdminCheckResult {
  isAdmin: boolean
  userId: string | null
  error?: string
}

/**
 * Check if the current user is an admin
 * Checks against admin_users table in database
 */
export async function checkAdminAuth(): Promise<AdminCheckResult> {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return { isAdmin: false, userId: null, error: 'Not authenticated' }
    }

    // Check admin_users table (use admin client to bypass RLS)
    const adminSupabase = createAdminClient()
    const { data: adminUser, error: adminError } = await adminSupabase
      .from('admin_users')
      .select('id')
      .eq('id', user.id)
      .eq('is_active', true)
      .single()

    if (adminError || !adminUser) {
      return { isAdmin: false, userId: user.id, error: 'Admin access required' }
    }

    return { isAdmin: true, userId: user.id }
  } catch (err) {
    return { isAdmin: false, userId: null, error: 'Auth check failed' }
  }
}

/**
 * Helper to create unauthorized response
 */
export function unauthorizedResponse(message = 'Unauthorized') {
  return new Response(JSON.stringify({ error: message }), {
    status: 403,
    headers: { 'Content-Type': 'application/json' }
  })
}
