import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentAdmin } from '@/lib/admin/auth'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/admin/verifications/[id] - Get single verification details
export async function GET(request: NextRequest, { params }: RouteParams) {
  const admin = await getCurrentAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const supabase = createAdminClient()

  // Get the verification with related data
  const { data: verification, error } = await supabase
    .from('death_verifications')
    .select(`
      *,
      profiles:claimed_user_id (
        id,
        full_name,
        date_of_birth,
        avatar_url,
        account_status,
        city,
        state,
        country,
        biography,
        created_at
      ),
      reviewer:reviewer_id (
        id,
        email
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Verification not found' }, { status: 404 })
    }
    console.error('Query error:', error)
    return NextResponse.json({ error: 'Failed to fetch verification' }, { status: 500 })
  }

  // If there's a document, generate a signed URL for viewing
  let documentSignedUrl: string | null = null
  if (verification.document_url) {
    const { data: signedUrlData } = await supabase.storage
      .from('verification-documents')
      .createSignedUrl(verification.document_url, 3600) // 1 hour expiry

    documentSignedUrl = signedUrlData?.signedUrl || null
  }

  // Get user's email if we have a claimed_user_id
  let profileEmail: string | null = null
  if (verification.claimed_user_id) {
    const { data: authData } = await supabase.auth.admin.getUserById(verification.claimed_user_id)
    profileEmail = authData?.user?.email || null
  }

  return NextResponse.json({
    verification: {
      ...verification,
      document_signed_url: documentSignedUrl,
      profile_email: profileEmail,
    },
  })
}
