import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/wisdom/[id]/share - Share wisdom with contacts
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: knowledgeId } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify knowledge entry belongs to user
  const { data: knowledge } = await supabase
    .from('knowledge_entries')
    .select('id')
    .eq('id', knowledgeId)
    .eq('user_id', user.id)
    .single()

  if (!knowledge) {
    return NextResponse.json({ error: 'Wisdom entry not found' }, { status: 404 })
  }

  const body = await request.json()
  const { contact_ids, can_comment = true } = body

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
    knowledge_id: knowledgeId,
    owner_id: user.id,
    contact_id: contact.id,
    can_comment,
    notify_email: contact.email,
    notify_phone: contact.phone,
  }))

  const { data: shares, error } = await supabase
    .from('knowledge_shares')
    .upsert(shareRecords, { onConflict: 'knowledge_id,contact_id' })
    .select()

  if (error) {
    console.error('Share error:', error)
    return NextResponse.json({ error: 'Failed to share wisdom' }, { status: 500 })
  }

  return NextResponse.json({ shares })
}

// GET /api/wisdom/[id]/share - Get shares for a wisdom entry
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: knowledgeId } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: shares, error } = await supabase
    .from('knowledge_shares')
    .select(`
      *,
      contact:contacts(id, name, email, phone, relationship_type)
    `)
    .eq('knowledge_id', knowledgeId)
    .eq('owner_id', user.id)

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch shares' }, { status: 500 })
  }

  return NextResponse.json({ shares })
}

// DELETE /api/wisdom/[id]/share - Remove a share
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: knowledgeId } = await params
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
    .from('knowledge_shares')
    .delete()
    .eq('knowledge_id', knowledgeId)
    .eq('owner_id', user.id)
    .eq('contact_id', contactId)

  if (error) {
    return NextResponse.json({ error: 'Failed to remove share' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
