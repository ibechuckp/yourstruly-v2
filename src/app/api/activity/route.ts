import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export type ActivityType = 
  | 'memory_shared' 
  | 'wisdom_shared' 
  | 'circle_message' 
  | 'circle_invite' 
  | 'circle_content'
  | 'wisdom_comment'

export interface ActivityItem {
  id: string
  type: ActivityType
  title: string
  description: string
  timestamp: string
  actor?: {
    id: string
    name: string
    avatar_url?: string
  }
  thumbnail?: string
  link: string
  metadata?: Record<string, any>
}

// GET /api/activity - Get aggregated activity feed
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)

  const activities: ActivityItem[] = []

  // 1. Shared memories (where I'm the recipient via contact)
  // First get my contact records (where someone has me as their contact)
  const { data: myContactRecords } = await supabase
    .from('contacts')
    .select('id, user_id')
    .eq('email', user.email)

  if (myContactRecords && myContactRecords.length > 0) {
    const contactIds = myContactRecords.map(c => c.id)
    
    const { data: memoryShares } = await supabase
      .from('memory_shares')
      .select(`
        id,
        created_at,
        memory:memories (
          id,
          title,
          description,
          media_url
        ),
        owner:profiles!memory_shares_owner_id_fkey (
          id,
          full_name,
          avatar_url
        )
      `)
      .in('contact_id', contactIds)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (memoryShares) {
      for (const share of memoryShares) {
        const memory = Array.isArray(share.memory) ? share.memory[0] : share.memory
        const owner = Array.isArray(share.owner) ? share.owner[0] : share.owner
        if (!memory || !owner) continue
        
        activities.push({
          id: `memory_share_${share.id}`,
          type: 'memory_shared',
          title: memory.title || 'A memory',
          description: `${owner.full_name} shared a memory with you`,
          timestamp: share.created_at,
          actor: {
            id: owner.id,
            name: owner.full_name,
            avatar_url: owner.avatar_url
          },
          thumbnail: memory.media_url,
          link: `/dashboard/memories/${memory.id}`,
          metadata: { memoryId: memory.id }
        })
      }
    }

    // 2. Shared wisdom (where I'm the recipient)
    const { data: wisdomShares } = await supabase
      .from('knowledge_shares')
      .select(`
        id,
        created_at,
        knowledge:knowledge_entries (
          id,
          title,
          category
        ),
        owner:profiles!knowledge_shares_owner_id_fkey (
          id,
          full_name,
          avatar_url
        )
      `)
      .in('contact_id', contactIds)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (wisdomShares) {
      for (const share of wisdomShares) {
        const knowledge = Array.isArray(share.knowledge) ? share.knowledge[0] : share.knowledge
        const owner = Array.isArray(share.owner) ? share.owner[0] : share.owner
        if (!knowledge || !owner) continue
        
        activities.push({
          id: `wisdom_share_${share.id}`,
          type: 'wisdom_shared',
          title: knowledge.title || 'Wisdom',
          description: `${owner.full_name} shared wisdom with you`,
          timestamp: share.created_at,
          actor: {
            id: owner.id,
            name: owner.full_name,
            avatar_url: owner.avatar_url
          },
          link: `/dashboard/wisdom/${knowledge.id}`,
          metadata: { knowledgeId: knowledge.id, category: knowledge.category }
        })
      }
    }
  }

  // 3. Circle messages (in circles I'm a member of)
  const { data: myCircleMemberships } = await supabase
    .from('circle_members')
    .select('circle_id')
    .eq('user_id', user.id)
    .eq('invite_status', 'accepted')

  if (myCircleMemberships && myCircleMemberships.length > 0) {
    const circleIds = myCircleMemberships.map(m => m.circle_id)
    
    const { data: circleMessages } = await supabase
      .from('circle_messages')
      .select(`
        id,
        content,
        media_url,
        created_at,
        circle_id,
        sender:profiles!circle_messages_sender_id_fkey (
          id,
          full_name,
          avatar_url
        ),
        circle:circles (
          id,
          name
        )
      `)
      .in('circle_id', circleIds)
      .neq('sender_id', user.id) // Don't show my own messages
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (circleMessages) {
      for (const msg of circleMessages) {
        const sender = Array.isArray(msg.sender) ? msg.sender[0] : msg.sender
        const circle = Array.isArray(msg.circle) ? msg.circle[0] : msg.circle
        if (!sender || !circle) continue
        
        activities.push({
          id: `circle_message_${msg.id}`,
          type: 'circle_message',
          title: circle.name,
          description: `${sender.full_name}: ${msg.content?.substring(0, 60) || 'sent media'}${msg.content && msg.content.length > 60 ? '...' : ''}`,
          timestamp: msg.created_at,
          actor: {
            id: sender.id,
            name: sender.full_name,
            avatar_url: sender.avatar_url
          },
          thumbnail: msg.media_url,
          link: `/dashboard/circles/${msg.circle_id}`,
          metadata: { circleId: msg.circle_id, messageId: msg.id }
        })
      }
    }

    // 4. Circle content (shared to circles I'm in)
    const { data: circleContent } = await supabase
      .from('circle_content')
      .select(`
        id,
        content_type,
        created_at,
        circle_id,
        memory:memories (
          id,
          title,
          media_url
        ),
        knowledge:knowledge_entries (
          id,
          title
        ),
        shared_by:profiles!circle_content_shared_by_fkey (
          id,
          full_name,
          avatar_url
        ),
        circle:circles (
          id,
          name
        )
      `)
      .in('circle_id', circleIds)
      .neq('shared_by', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (circleContent) {
      for (const content of circleContent) {
        const sharedBy = Array.isArray(content.shared_by) ? content.shared_by[0] : content.shared_by
        const circle = Array.isArray(content.circle) ? content.circle[0] : content.circle
        const memory = Array.isArray(content.memory) ? content.memory[0] : content.memory
        const knowledge = Array.isArray(content.knowledge) ? content.knowledge[0] : content.knowledge
        if (!sharedBy || !circle) continue
        
        const contentTitle = memory?.title || knowledge?.title || 'Content'
        const contentType = content.content_type === 'memory' ? 'a memory' : 'wisdom'
        
        activities.push({
          id: `circle_content_${content.id}`,
          type: 'circle_content',
          title: contentTitle,
          description: `${sharedBy.full_name} shared ${contentType} to ${circle.name}`,
          timestamp: content.created_at,
          actor: {
            id: sharedBy.id,
            name: sharedBy.full_name,
            avatar_url: sharedBy.avatar_url
          },
          thumbnail: memory?.media_url,
          link: content.content_type === 'memory' 
            ? `/dashboard/memories/${memory?.id}` 
            : `/dashboard/wisdom/${knowledge?.id}`,
          metadata: { circleId: content.circle_id }
        })
      }
    }
  }

  // 5. Pending circle invites
  const { data: pendingInvites } = await supabase
    .from('circle_members')
    .select(`
      id,
      created_at,
      circle:circles (
        id,
        name,
        description
      ),
      invited_by_user:profiles!circle_members_invited_by_fkey (
        id,
        full_name,
        avatar_url
      )
    `)
    .eq('user_id', user.id)
    .eq('invite_status', 'pending')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (pendingInvites) {
    for (const invite of pendingInvites) {
      const circle = Array.isArray(invite.circle) ? invite.circle[0] : invite.circle
      const invitedBy = Array.isArray(invite.invited_by_user) ? invite.invited_by_user[0] : invite.invited_by_user
      if (!circle) continue
      
      activities.push({
        id: `circle_invite_${invite.id}`,
        type: 'circle_invite',
        title: circle.name,
        description: invitedBy 
          ? `${invitedBy.full_name} invited you to join`
          : 'You have been invited to join',
        timestamp: invite.created_at,
        actor: invitedBy ? {
          id: invitedBy.id,
          name: invitedBy.full_name,
          avatar_url: invitedBy.avatar_url
        } : undefined,
        link: `/dashboard/circles/${circle.id}`,
        metadata: { circleId: circle.id, inviteId: invite.id }
      })
    }
  }

  // Sort all activities by timestamp (most recent first)
  activities.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  // Limit final result
  const limitedActivities = activities.slice(0, limit)

  return NextResponse.json({ 
    activities: limitedActivities,
    total: activities.length
  })
}
