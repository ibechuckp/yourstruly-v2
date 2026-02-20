import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/memories/[id]/share - Share memory with contacts
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
  const { contact_ids, can_comment = true, can_add_media = true } = body

  if (!contact_ids || !Array.isArray(contact_ids) || contact_ids.length === 0) {
    return NextResponse.json({ error: 'No contacts provided' }, { status: 400 })
  }

  // Verify contacts belong to user
  const { data: validContacts } = await supabase
    .from('contacts')
    .select('id, email, phone')
    .eq('user_id', user.id)
    .in('id', contact_ids)

  if (!validContacts || validContacts.length === 0) {
    return NextResponse.json({ error: 'No valid contacts found' }, { status: 400 })
  }

  // Create share records
  const shareRecords = validContacts.map(contact => ({
    memory_id: memoryId,
    owner_id: user.id,
    contact_id: contact.id,
    can_comment,
    can_add_media,
    notify_email: contact.email,
    notify_phone: contact.phone,
  }))

  const { data: shares, error } = await supabase
    .from('memory_shares')
    .upsert(shareRecords, { onConflict: 'memory_id,contact_id' })
    .select()

  if (error) {
    console.error('Share error:', error)
    return NextResponse.json({ error: 'Failed to share memory' }, { status: 500 })
  }

  return NextResponse.json({ shares })
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
      contact:contacts(id, name, email, phone, relationship_type)
    `)
    .eq('memory_id', memoryId)
    .eq('owner_id', user.id)

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch shares' }, { status: 500 })
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
  const contactId = searchParams.get('contact_id')

  if (!contactId) {
    return NextResponse.json({ error: 'contact_id required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('memory_shares')
    .delete()
    .eq('memory_id', memoryId)
    .eq('owner_id', user.id)
    .eq('contact_id', contactId)

  if (error) {
    return NextResponse.json({ error: 'Failed to remove share' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
