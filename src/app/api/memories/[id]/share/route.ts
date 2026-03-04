import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/memories/[id]/share - Share memory with users or via email
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: memoryId } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify memory belongs to user
  const { data: memory } = await supabase
    .from('memories')
    .select('id')
    .eq('id', memoryId)
    .eq('user_id', user.id)
    .single()

  if (!memory) {
    return NextResponse.json({ error: 'Memory not found' }, { status: 404 })
  }

  const body = await request.json()
  const { 
    contact_ids,  // Legacy: contact IDs (we'll look up their user_ids)
    user_ids,     // Direct user IDs to share with
    emails,       // Email addresses for external shares
    permission_level = 'contributor'
  } = body

  const shareRecords: Array<{
    memory_id: string
    shared_by_user_id: string
    shared_with_user_id?: string
    email?: string
    permission_level: string
    status: string
    shared_via: string
  }> = []

  // Handle contact_ids - look up their associated user_ids
  if (contact_ids && Array.isArray(contact_ids) && contact_ids.length > 0) {
    const { data: contacts } = await supabase
      .from('contacts')
      .select('id, user_id, email')
      .eq('user_id', user.id)  // contacts belonging to this user
      .in('id', contact_ids)

    for (const contact of contacts || []) {
      if (contact.user_id) {
        // Contact has an associated user account
        shareRecords.push({
          memory_id: memoryId,
          shared_by_user_id: user.id,
          shared_with_user_id: contact.user_id,
          permission_level,
          status: 'pending',
          shared_via: 'internal',
        })
      } else if (contact.email) {
        // Contact doesn't have account - send email invite
        shareRecords.push({
          memory_id: memoryId,
          shared_by_user_id: user.id,
          email: contact.email,
          permission_level,
          status: 'pending',
          shared_via: 'email',
        })
      }
    }
  }

  // Handle direct user_ids
  if (user_ids && Array.isArray(user_ids)) {
    for (const targetUserId of user_ids) {
      if (targetUserId !== user.id) {
        shareRecords.push({
          memory_id: memoryId,
          shared_by_user_id: user.id,
          shared_with_user_id: targetUserId,
          permission_level,
          status: 'pending',
          shared_via: 'internal',
        })
      }
    }
  }

  // Handle email addresses
  if (emails && Array.isArray(emails)) {
    for (const email of emails) {
      // Check if this email belongs to an existing user
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single()

      if (existingUser) {
        shareRecords.push({
          memory_id: memoryId,
          shared_by_user_id: user.id,
          shared_with_user_id: existingUser.id,
          permission_level,
          status: 'pending',
          shared_via: 'internal',
        })
      } else {
        shareRecords.push({
          memory_id: memoryId,
          shared_by_user_id: user.id,
          email,
          permission_level,
          status: 'pending',
          shared_via: 'email',
        })
      }
    }
  }

  if (shareRecords.length === 0) {
    return NextResponse.json({ error: 'No valid recipients provided' }, { status: 400 })
  }

  // Use upsert to avoid duplicate shares
  const { data: shares, error } = await supabase
    .from('memory_shares')
    .upsert(shareRecords, { 
      onConflict: 'memory_id,shared_with_user_id',
      ignoreDuplicates: true  // Skip duplicates silently
    })
    .select()

  if (error) {
    console.error('Share error:', error)
    return NextResponse.json({ error: 'Failed to share memory', details: error.message }, { status: 500 })
  }

  return NextResponse.json({ shares, created: shareRecords.length })
}

// GET /api/memories/[id]/share - Get shares for a memory
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: memoryId } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: shares, error } = await supabase
    .from('memory_shares')
    .select(`
      *,
      shared_with:profiles!memory_shares_shared_with_user_id_fkey(id, full_name, avatar_url, email)
    `)
    .eq('memory_id', memoryId)
    .eq('shared_by_user_id', user.id)

  if (error) {
    console.error('Fetch shares error:', error)
    return NextResponse.json({ error: 'Failed to fetch shares', details: error.message }, { status: 500 })
  }

  return NextResponse.json({ shares })
}

// DELETE /api/memories/[id]/share - Remove a share
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: memoryId } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const shareId = searchParams.get('share_id')
  const userId = searchParams.get('user_id')

  if (!shareId && !userId) {
    return NextResponse.json({ error: 'share_id or user_id required' }, { status: 400 })
  }

  let query = supabase
    .from('memory_shares')
    .delete()
    .eq('memory_id', memoryId)
    .eq('shared_by_user_id', user.id)

  if (shareId) {
    query = query.eq('id', shareId)
  } else if (userId) {
    query = query.eq('shared_with_user_id', userId)
  }

  const { error } = await query

  if (error) {
    console.error('Remove share error:', error)
    return NextResponse.json({ error: 'Failed to remove share', details: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
