import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentAdmin } from '@/lib/admin/auth'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST /api/admin/verifications/[id]/review - Approve or reject a verification
export async function POST(request: NextRequest, { params }: RouteParams) {
  const admin = await getCurrentAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()
  const { 
    action, // 'approve', 'reject', 'needs_more_info'
    notes,
    transfer_access, // boolean - whether to transfer account access to claimant
  } = body

  // Validate action
  const validActions = ['approve', 'reject', 'needs_more_info']
  if (!validActions.includes(action)) {
    return NextResponse.json(
      { error: 'Invalid action. Must be: approve, reject, or needs_more_info' },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()

  // Get the current verification
  const { data: verification, error: fetchError } = await supabase
    .from('death_verifications')
    .select('*, claimed_user_id')
    .eq('id', id)
    .single()

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      return NextResponse.json({ error: 'Verification not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Failed to fetch verification' }, { status: 500 })
  }

  // Map action to status
  const statusMap: Record<string, string> = {
    approve: 'approved',
    reject: 'rejected',
    needs_more_info: 'needs_more_info',
  }

  const newStatus = statusMap[action]

  // Update the verification record
  const { data: updated, error: updateError } = await supabase
    .from('death_verifications')
    .update({
      status: newStatus,
      reviewer_id: admin.id,
      reviewer_notes: notes || null,
      reviewed_at: new Date().toISOString(),
      transfer_access_to_claimant: action === 'approve' ? (transfer_access || false) : false,
    })
    .eq('id', id)
    .select()
    .single()

  if (updateError) {
    console.error('Update error:', updateError)
    return NextResponse.json({ error: 'Failed to update verification' }, { status: 500 })
  }

  // If approved, convert the account to memorial status
  if (action === 'approve' && verification.claimed_user_id) {
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        account_status: 'memorial',
        memorial_since: new Date().toISOString(),
        memorial_manager_email: transfer_access ? verification.claimant_email : null,
      })
      .eq('id', verification.claimed_user_id)

    if (profileError) {
      console.error('Profile update error:', profileError)
      // Don't fail the whole request, but log the error
    }

    // Mark memorial conversion as completed
    await supabase
      .from('death_verifications')
      .update({ memorial_conversion_completed: true })
      .eq('id', id)

    // TODO: Send email notifications
    // if (action === 'approve') {
    //   await sendApprovalEmail(verification.claimant_email, verification.claimant_name)
    // }
  }

  // TODO: Send email based on status
  // - Approved: Send confirmation with next steps
  // - Rejected: Send rejection notice with reason
  // - Needs More Info: Request additional documentation

  return NextResponse.json({
    success: true,
    verification: updated,
    message: action === 'approve' 
      ? 'Verification approved. Account has been converted to memorial status.'
      : action === 'reject'
      ? 'Verification rejected.'
      : 'Marked as needing more information.',
  })
}
