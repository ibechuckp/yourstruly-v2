import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/circles/invites - List user's pending circle invites
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: invites, error } = await supabase
    .from('circle_members')
    .select(`
      id,
      circle_id,
      created_at,
      circle:circles (
        id,
        name,
        description
      ),
      inviter:profiles!circle_members_invited_by_fkey (
        id,
        full_name,
        avatar_url
      )
    `)
    .eq('user_id', user.id)
    .eq('invite_status', 'pending')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('List invites error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ invites })
}
