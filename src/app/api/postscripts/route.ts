import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const limit = parseInt(searchParams.get('limit') || '50')

  let query = supabase
    .from('postscripts')
    .select(`
      *,
      recipient:contacts!recipient_contact_id(id, full_name, relationship_type, avatar_url),
      attachments:postscript_attachments(id, file_url, file_type)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching postscripts:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ postscripts: data })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const {
    recipient_contact_id,
    recipient_name,
    recipient_email,
    recipient_phone,
    title,
    message,
    video_url,
    audio_url,
    delivery_type = 'date',
    delivery_date,
    delivery_event,
    delivery_recurring = false,
    requires_confirmation = false,
    confirmation_contacts = [],
    has_gift = false,
    gift_type,
    gift_details,
    gift_budget,
    status = 'draft',
    attachments = []
  } = body

  // Validate required fields
  if (!title || !recipient_name) {
    return NextResponse.json(
      { error: 'Title and recipient name are required' },
      { status: 400 }
    )
  }

  // Create postscript - ensure empty strings become null for date fields
  const { data: postscript, error } = await supabase
    .from('postscripts')
    .insert({
      user_id: user.id,
      recipient_contact_id: recipient_contact_id || null,
      recipient_name,
      recipient_email: recipient_email || null,
      recipient_phone: recipient_phone || null,
      title,
      message: message || null,
      video_url: video_url || null,
      audio_url: audio_url || null,
      delivery_type,
      delivery_date: delivery_date || null,
      delivery_event: delivery_event || null,
      delivery_recurring,
      requires_confirmation,
      confirmation_contacts,
      has_gift,
      gift_type: gift_type || null,
      gift_details: gift_details || null,
      gift_budget: gift_budget || null,
      status
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating postscript:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Add attachments if provided
  if (attachments.length > 0) {
    const attachmentRecords = attachments.map((att: any) => ({
      postscript_id: postscript.id,
      file_url: att.file_url,
      file_key: att.file_key,
      file_type: att.file_type,
      file_name: att.file_name,
      file_size: att.file_size
    }))

    const { error: attError } = await supabase
      .from('postscript_attachments')
      .insert(attachmentRecords)

    if (attError) {
      console.error('Error adding attachments:', attError)
    }
  }

  return NextResponse.json({ postscript }, { status: 201 })
}
