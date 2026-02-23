import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Helper to check membership
async function checkMembership(supabase: any, circleId: string, userId: string) {
  const { data } = await supabase
    .from('circle_members')
    .select('id, role')
    .eq('circle_id', circleId)
    .eq('user_id', userId)
    .eq('invite_status', 'accepted')
    .single()
  return data
}

// GET /api/circles/[id]/messages - Circle messages (paginated)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: circleId } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check membership
  const membership = await checkMembership(supabase, circleId, user.id)
  if (!membership) {
    return NextResponse.json({ error: 'Not a member of this circle' }, { status: 403 })
  }

  const searchParams = request.nextUrl.searchParams
  const limit = parseInt(searchParams.get('limit') || '50')
  const before = searchParams.get('before') // cursor-based pagination
  const after = searchParams.get('after')

  let query = supabase
    .from('circle_messages')
    .select(`
      id,
      content,
      media_url,
      media_type,
      reply_to_id,
      
      edited_at,
      created_at,
      sender:profiles!circle_messages_sender_id_fkey (
        id,
        full_name,
        avatar_url
      ),
      reply_to:circle_messages!circle_messages_reply_to_id_fkey (
        id,
        content,
        sender:profiles!circle_messages_sender_id_fkey (
          id,
          full_name
        )
      )
    `)
    .eq('circle_id', circleId)
    
    .order('created_at', { ascending: false })
    .limit(limit)

  // Cursor-based pagination
  if (before) {
    query = query.lt('created_at', before)
  }
  if (after) {
    query = query.gt('created_at', after)
  }

  const { data: messages, error } = await query

  if (error) {
    console.error('List messages error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Reverse for chronological order when returning
  const orderedMessages = messages?.reverse() || []

  // Determine if there are more messages
  let hasMore = false
  if (messages && messages.length === limit) {
    const { count } = await supabase
      .from('circle_messages')
      .select('*', { count: 'exact', head: true })
      .eq('circle_id', circleId)
      
      .lt('created_at', messages[messages.length - 1]?.created_at)
    hasMore = (count || 0) > 0
  }

  return NextResponse.json({ 
    messages: orderedMessages,
    has_more: hasMore,
    cursor: {
      before: orderedMessages[0]?.created_at || null,
      after: orderedMessages[orderedMessages.length - 1]?.created_at || null
    }
  })
}

// POST /api/circles/[id]/messages - Send message to circle
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: circleId } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check membership
  const membership = await checkMembership(supabase, circleId, user.id)
  if (!membership) {
    return NextResponse.json({ error: 'Not a member of this circle' }, { status: 403 })
  }

  const body = await request.json()
  const { content, media_url, media_type, reply_to_id } = body

  // Validate content
  if (!content && !media_url) {
    return NextResponse.json({ error: 'Message must have content or media' }, { status: 400 })
  }

  if (content && content.length > 5000) {
    return NextResponse.json({ error: 'Message too long (max 5000 characters)' }, { status: 400 })
  }

  // Validate reply_to if provided
  if (reply_to_id) {
    const { data: replyTarget } = await supabase
      .from('circle_messages')
      .select('id')
      .eq('id', reply_to_id)
      .eq('circle_id', circleId)
      
      .single()

    if (!replyTarget) {
      return NextResponse.json({ error: 'Reply target not found' }, { status: 400 })
    }
  }

  const { data: message, error } = await supabase
    .from('circle_messages')
    .insert({
      circle_id: circleId,
      sender_id: user.id,
      content: content?.trim() || null,
      media_url: media_url || null,
      media_type: media_type || null,
      reply_to_id: reply_to_id || null
    })
    .select(`
      id,
      content,
      media_url,
      media_type,
      reply_to_id,
      
      edited_at,
      created_at,
      sender:profiles!circle_messages_sender_id_fkey (
        id,
        full_name,
        avatar_url
      ),
      reply_to:circle_messages!circle_messages_reply_to_id_fkey (
        id,
        content,
        sender:profiles!circle_messages_sender_id_fkey (
          id,
          full_name
        )
      )
    `)
    .single()

  if (error) {
    console.error('Send message error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message }, { status: 201 })
}

// PATCH /api/circles/[id]/messages?message_id=xxx - Edit message
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: circleId } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const messageId = searchParams.get('message_id')

  if (!messageId) {
    return NextResponse.json({ error: 'message_id is required' }, { status: 400 })
  }

  // Get message and verify ownership
  const { data: message } = await supabase
    .from('circle_messages')
    .select('id, sender_id')
    .eq('id', messageId)
    .eq('circle_id', circleId)
    .single()

  if (!message) {
    return NextResponse.json({ error: 'Message not found' }, { status: 404 })
  }

  if (message.sender_id !== user.id) {
    return NextResponse.json({ error: 'Can only edit your own messages' }, { status: 403 })
  }

  const body = await request.json()
  const { content } = body

  if (!content || content.trim().length === 0) {
    return NextResponse.json({ error: 'Content cannot be empty' }, { status: 400 })
  }

  if (content.length > 5000) {
    return NextResponse.json({ error: 'Message too long (max 5000 characters)' }, { status: 400 })
  }

  const { data: updated, error } = await supabase
    .from('circle_messages')
    .update({
      content: content.trim(),
      edited_at: new Date().toISOString()
    })
    .eq('id', messageId)
    .select(`
      id,
      content,
      media_url,
      media_type,
      reply_to_id,
      
      edited_at,
      created_at,
      sender:profiles!circle_messages_sender_id_fkey (
        id,
        full_name,
        avatar_url
      )
    `)
    .single()

  if (error) {
    console.error('Edit message error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: updated })
}

// DELETE /api/circles/[id]/messages?message_id=xxx - Delete message
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: circleId } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const messageId = searchParams.get('message_id')

  if (!messageId) {
    return NextResponse.json({ error: 'message_id is required' }, { status: 400 })
  }

  // Get message
  const { data: message } = await supabase
    .from('circle_messages')
    .select('id, sender_id')
    .eq('id', messageId)
    .eq('circle_id', circleId)
    .single()

  if (!message) {
    return NextResponse.json({ error: 'Message not found' }, { status: 404 })
  }

  if (message.sender_id !== user.id) {
    return NextResponse.json({ error: 'Can only delete your own messages' }, { status: 403 })
  }

  // Soft delete
  const { error } = await supabase
    .from('circle_messages')
    .update({
      
      deleted_at: new Date().toISOString()
    })
    .eq('id', messageId)

  if (error) {
    console.error('Delete message error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
