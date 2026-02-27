import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentAdmin } from '@/lib/admin/auth'
import { sendDeathClaimStatusEmail } from '@/lib/email'

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

// PATCH /api/admin/verifications/[id] - Update verification status
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const admin = await getCurrentAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()
  const { status, reviewer_notes, transfer_access_to_claimant } = body

  // Validate status
  const validStatuses = ['pending', 'approved', 'rejected', 'needs_more_info']
  if (status && !validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Get current verification
  const { data: verification, error: fetchError } = await supabase
    .from('death_verifications')
    .select('*, profiles:claimed_user_id (id, full_name)')
    .eq('id', id)
    .single()

  if (fetchError || !verification) {
    return NextResponse.json({ error: 'Verification not found' }, { status: 404 })
  }

  // Build update object
  const updateData: Record<string, any> = {}
  
  if (status) {
    updateData.status = status
    updateData.reviewer_id = admin.id
    updateData.reviewed_at = new Date().toISOString()
  }
  
  if (reviewer_notes !== undefined) {
    updateData.reviewer_notes = reviewer_notes
  }
  
  if (transfer_access_to_claimant !== undefined) {
    updateData.transfer_access_to_claimant = transfer_access_to_claimant
  }

  // Update the verification
  const { data: updated, error: updateError } = await supabase
    .from('death_verifications')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (updateError) {
    console.error('Update error:', updateError)
    return NextResponse.json({ error: 'Failed to update verification' }, { status: 500 })
  }

  // If status changed to approved, update the profile to memorial status
  if (status === 'approved' && verification.claimed_user_id) {
    await supabase
      .from('profiles')
      .update({
        account_status: 'memorial',
        memorial_since: new Date().toISOString(),
        memorial_manager_email: verification.claimant_email,
      })
      .eq('id', verification.claimed_user_id)

    // Mark memorial conversion as completed
    await supabase
      .from('death_verifications')
      .update({ memorial_conversion_completed: true })
      .eq('id', id)
  }

  // Send status email to claimant
  if (status && status !== 'pending') {
    try {
      const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://yourstruly.love'
      
      await sendDeathClaimStatusEmail({
        recipientEmail: verification.claimant_email,
        claimantName: verification.claimant_name,
        deceasedName: verification.deceased_name,
        status: status as 'approved' | 'rejected' | 'needs_more_info',
        reviewerNotes: reviewer_notes || verification.reviewer_notes,
        accessLink: status === 'approved' && verification.claimed_user_id 
          ? `${APP_URL}/memorial/${verification.claimed_user_id}/manage` 
          : undefined,
      })
    } catch (emailError) {
      console.error('Failed to send status email:', emailError)
      // Don't fail the request, just log the error
    }
  }

  return NextResponse.json({ 
    verification: updated,
    message: `Verification ${status || 'updated'} successfully`
  })
}
