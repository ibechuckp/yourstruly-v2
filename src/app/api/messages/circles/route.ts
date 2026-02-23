import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/messages/circles - Get circles formatted as conversations for messages page
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's circles
  const { data: memberships, error: membershipError } = await supabase
    .from('circle_members')
    .select(`
      circle_id,
      role,
      circle:circles (
        id,
        name,
        description,
        created_at
      )
    `)
    .eq('user_id', user.id)
    .eq('invite_status', 'accepted')

  if (membershipError) {
    console.error('Get memberships error:', membershipError)
    return NextResponse.json({ error: membershipError.message }, { status: 500 })
  }

  if (!memberships || memberships.length === 0) {
    return NextResponse.json({ conversations: [] })
  }

  // Get circle IDs
  const circleIds = memberships.map(m => m.circle_id)

  // Get member counts for each circle
  const { data: memberCounts, error: countError } = await supabase
    .from('circle_members')
    .select('circle_id')
    .in('circle_id', circleIds)
    .eq('invite_status', 'accepted')

  // Count members per circle
  const memberCountMap: Record<string, number> = {}
  memberCounts?.forEach(mc => {
    memberCountMap[mc.circle_id] = (memberCountMap[mc.circle_id] || 0) + 1
  })

  // Get last message for each circle
  const conversations = await Promise.all(
    memberships.map(async (membership) => {
      const circle = Array.isArray(membership.circle) 
        ? membership.circle[0] 
        : membership.circle

      if (!circle?.id) return null

      // Get the latest message for this circle
      const { data: lastMessage } = await supabase
        .from('circle_messages')
        .select(`
          content,
          media_type,
          created_at,
          sender:profiles!circle_messages_sender_id_fkey (
            id,
            full_name
          )
        `)
        .eq('circle_id', circle.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      // Format last message preview
      let lastMessageText = 'No messages yet'
      let lastMessageTime = new Date(circle.created_at)

      if (lastMessage) {
        const sender = Array.isArray(lastMessage.sender) 
          ? lastMessage.sender[0] 
          : lastMessage.sender
        const senderName = sender?.id === user.id ? 'You' : sender?.full_name || 'Someone'
        
        if (lastMessage.media_type) {
          lastMessageText = `${senderName}: 📷 Photo`
        } else if (lastMessage.content) {
          lastMessageText = `${senderName}: ${lastMessage.content}`
        }
        lastMessageTime = new Date(lastMessage.created_at)
      }

      // TODO: Get unread count (would need a read_receipts table or similar)
      const unreadCount = 0

      return {
        id: `circle-${circle.id}`,
        circleId: circle.id,
        name: circle.name,
        lastMessage: lastMessageText,
        timestamp: lastMessageTime.toISOString(),
        unreadCount,
        type: 'circle',
        participants: memberCountMap[circle.id] || 0,
        circleDescription: circle.description
      }
    })
  )

  // Filter nulls and sort by timestamp
  const validConversations = conversations
    .filter(c => c !== null)
    .sort((a, b) => new Date(b!.timestamp).getTime() - new Date(a!.timestamp).getTime())

  return NextResponse.json({ conversations: validConversations })
}
