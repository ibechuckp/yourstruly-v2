import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getCurrentAdmin } from '@/lib/admin/auth'

// GET /api/admin/verifications - List all death verifications
export async function GET(request: NextRequest) {
  // Check admin auth
  const admin = await getCurrentAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') // pending, approved, rejected, needs_more_info
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const sortBy = searchParams.get('sort_by') || 'created_at'
  const sortOrder = searchParams.get('sort_order') || 'desc'
  const search = searchParams.get('search') // Search by name or email

  const supabase = createAdminClient()

  // Build query
  let query = supabase
    .from('death_verifications')
    .select(`
      *,
      profiles:claimed_user_id (
        id,
        full_name,
        date_of_birth,
        avatar_url,
        account_status
      ),
      reviewer:reviewer_id (
        id,
        email
      )
    `, { count: 'exact' })

  // Apply filters
  if (status) {
    query = query.eq('status', status)
  }

  if (search) {
    query = query.or(`claimant_name.ilike.%${search}%,claimant_email.ilike.%${search}%,deceased_name.ilike.%${search}%`)
  }

  // Apply sorting
  const validSortColumns = ['created_at', 'updated_at', 'status', 'ai_confidence_score']
  const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at'
  query = query.order(sortColumn, { ascending: sortOrder === 'asc' })

  // Apply pagination
  const offset = (page - 1) * limit
  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    console.error('Query error:', error)
    return NextResponse.json({ error: 'Failed to fetch verifications' }, { status: 500 })
  }

  // Get status counts for filters
  const { data: statusCounts } = await supabase
    .from('death_verifications')
    .select('status')

  const counts = {
    all: statusCounts?.length || 0,
    pending: statusCounts?.filter(v => v.status === 'pending').length || 0,
    approved: statusCounts?.filter(v => v.status === 'approved').length || 0,
    rejected: statusCounts?.filter(v => v.status === 'rejected').length || 0,
    needs_more_info: statusCounts?.filter(v => v.status === 'needs_more_info').length || 0,
  }

  return NextResponse.json({
    verifications: data,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
    counts,
  })
}
