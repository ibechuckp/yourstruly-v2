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

// GET /api/circles/[id]/content - List content shared to circle
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
  const contentType = searchParams.get('content_type')
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = parseInt(searchParams.get('offset') || '0')

  let query = supabase
    .from('circle_content')
    .select(`
      id,
      content_type,
      content_id,
      created_at,
      sharer:profiles!circle_content_shared_by_fkey (
        id,
        full_name,
        avatar_url
      )
    `)
    .eq('circle_id', circleId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (contentType) {
    query = query.eq('content_type', contentType)
  }

  const { data: content, error } = await query

  if (error) {
    console.error('List circle content error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Enrich with actual content details
  const enrichedContent = await Promise.all(
    (content || []).map(async (item) => {
      let contentDetails = null
      
      if (item.content_type === 'memory') {
        const { data } = await supabase
          .from('memories')
          .select(`
            id,
            title,
            description,
            memory_date,
            memory_media (
              id,
              file_url,
              file_type,
              is_cover
            )
          `)
          .eq('id', item.content_id)
          .single()
        contentDetails = data
      } else if (item.content_type === 'knowledge') {
        const { data } = await supabase
          .from('knowledge_entries')
          .select('id, category, prompt_text, response_text')
          .eq('id', item.content_id)
          .single()
        contentDetails = data
      }
      // Add more content types as needed

      return {
        ...item,
        content: contentDetails
      }
    })
  )

  return NextResponse.json({ content: enrichedContent })
}

// POST /api/circles/[id]/content - Share content to circle
// Body: { content_type, content_id }
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
  const { content_type, content_id } = body

  const validContentTypes = ['memory', 'knowledge', 'conversation']
  if (!content_type || !validContentTypes.includes(content_type)) {
    return NextResponse.json({ 
      error: `Invalid content_type. Must be one of: ${validContentTypes.join(', ')}` 
    }, { status: 400 })
  }

  if (!content_id) {
    return NextResponse.json({ error: 'content_id is required' }, { status: 400 })
  }

  // Verify the user owns the content they're sharing
  let ownsContent = false
  
  if (content_type === 'memory') {
    const { data } = await supabase
      .from('memories')
      .select('id')
      .eq('id', content_id)
      .eq('user_id', user.id)
      .single()
    ownsContent = !!data
  } else if (content_type === 'knowledge') {
    const { data } = await supabase
      .from('knowledge_entries')
      .select('id')
      .eq('id', content_id)
      .eq('user_id', user.id)
      .single()
    ownsContent = !!data
  } else if (content_type === 'conversation') {
    // Check if user is a participant in the conversation
    const { data } = await supabase
      .from('conversation_participants')
      .select('id')
      .eq('conversation_id', content_id)
      .eq('user_id', user.id)
      .is('left_at', null)
      .single()
    ownsContent = !!data
  }

  if (!ownsContent) {
    return NextResponse.json({ error: 'You can only share content you own' }, { status: 403 })
  }

  // Check if already shared
  const { data: existing } = await supabase
    .from('circle_content')
    .select('id')
    .eq('circle_id', circleId)
    .eq('content_type', content_type)
    .eq('content_id', content_id)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'This content is already shared to this circle' }, { status: 409 })
  }

  // Share the content
  const { data: share, error } = await supabase
    .from('circle_content')
    .insert({
      circle_id: circleId,
      content_type,
      content_id,
      shared_by: user.id
    })
    .select(`
      id,
      content_type,
      content_id,
      created_at,
      sharer:profiles!circle_content_shared_by_fkey (
        id,
        full_name,
        avatar_url
      )
    `)
    .single()

  if (error) {
    console.error('Share content error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ share }, { status: 201 })
}

// DELETE /api/circles/[id]/content?content_id=xxx - Remove shared content
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
  const contentId = searchParams.get('content_id')

  if (!contentId) {
    return NextResponse.json({ error: 'content_id is required' }, { status: 400 })
  }

  // Get the share record
  const { data: share } = await supabase
    .from('circle_content')
    .select('id, shared_by')
    .eq('circle_id', circleId)
    .eq('id', contentId)
    .single()

  if (!share) {
    return NextResponse.json({ error: 'Content share not found' }, { status: 404 })
  }

  // Check if user is the sharer or an admin
  const membership = await checkMembership(supabase, circleId, user.id)
  const canDelete = share.shared_by === user.id || 
                    (membership && ['owner', 'admin'].includes(membership.role))

  if (!canDelete) {
    return NextResponse.json({ error: 'Not authorized to remove this content' }, { status: 403 })
  }

  const { error } = await supabase
    .from('circle_content')
    .delete()
    .eq('id', contentId)

  if (error) {
    console.error('Remove content error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
