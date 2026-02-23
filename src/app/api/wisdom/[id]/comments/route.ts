import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/wisdom/[id]/comments - Get comments for a wisdom entry
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

  // Verify user owns this knowledge entry
  const { data: knowledge } = await supabase
    .from('knowledge_entries')
    .select('id')
    .eq('id', knowledgeId)
    .eq('user_id', user.id)
    .single()

  if (!knowledge) {
    return NextResponse.json({ error: 'Wisdom entry not found' }, { status: 404 })
  }

  const { data: comments, error } = await supabase
    .from('knowledge_comments')
    .select(`
      *,
      contact:contacts(id, name, email, relationship_type)
    `)
    .eq('knowledge_id', knowledgeId)
    .eq('is_hidden', false)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Comments fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
  }

  return NextResponse.json({ comments })
}

// POST /api/wisdom/[id]/comments - Add a comment (for shared contacts via token)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: knowledgeId } = await params
  const supabase = await createClient()
  
  const body = await request.json()
  const { content, share_token, contact_id } = body

  if (!content || !content.trim()) {
    return NextResponse.json({ error: 'Comment content required' }, { status: 400 })
  }

  // Check if this is an owner adding on behalf, or a shared contact via token
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    // Owner adding a comment - verify they own it
    const { data: knowledge } = await supabase
      .from('knowledge_entries')
      .select('id, user_id')
      .eq('id', knowledgeId)
      .eq('user_id', user.id)
      .single()

    if (!knowledge) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // If contact_id provided, use that; otherwise it's owner's own comment
    if (contact_id) {
      const { data: contact } = await supabase
        .from('contacts')
        .select('id, name')
        .eq('id', contact_id)
        .eq('user_id', user.id)
        .single()

      if (!contact) {
        return NextResponse.json({ error: 'Invalid contact' }, { status: 400 })
      }

      const { data: comment, error } = await supabase
        .from('knowledge_comments')
        .insert({
          knowledge_id: knowledgeId,
          contact_id: contact.id,
          contact_name: contact.name,
          content: content.trim(),
        })
        .select()
        .single()

      if (error) {
        console.error('Comment insert error:', error)
        return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 })
      }

      return NextResponse.json({ comment })
    }
  }

  // Shared contact via token
  if (share_token) {
    const { data: share } = await supabase
      .from('knowledge_shares')
      .select(`
        *,
        contact:contacts(id, name)
      `)
      .eq('knowledge_id', knowledgeId)
      .eq('share_token', share_token)
      .eq('can_comment', true)
      .single()

    if (!share || !share.contact) {
      return NextResponse.json({ error: 'Invalid or expired share link' }, { status: 403 })
    }

    const { data: comment, error } = await supabase
      .from('knowledge_comments')
      .insert({
        knowledge_id: knowledgeId,
        contact_id: share.contact.id,
        contact_name: share.contact.name,
        content: content.trim(),
      })
      .select()
      .single()

    if (error) {
      console.error('Comment insert error:', error)
      return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 })
    }

    return NextResponse.json({ comment })
  }

  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

// DELETE /api/wisdom/[id]/comments - Hide/delete a comment (owner only)
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
  const commentId = searchParams.get('comment_id')

  if (!commentId) {
    return NextResponse.json({ error: 'comment_id required' }, { status: 400 })
  }

  // Verify user owns the knowledge entry
  const { data: knowledge } = await supabase
    .from('knowledge_entries')
    .select('id')
    .eq('id', knowledgeId)
    .eq('user_id', user.id)
    .single()

  if (!knowledge) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  // Soft delete by setting is_hidden
  const { error } = await supabase
    .from('knowledge_comments')
    .update({ is_hidden: true, hidden_at: new Date().toISOString() })
    .eq('id', commentId)
    .eq('knowledge_id', knowledgeId)

  if (error) {
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
