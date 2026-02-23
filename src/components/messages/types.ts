// ============================================
// MESSAGE TYPES & INTERFACES
// ============================================

export interface Reaction {
  emoji: string
  count: number
  users: string[] // user IDs who reacted
  userReacted: boolean // if current user reacted
}

export interface PollOption {
  id: string
  text: string
  votes: number
  voters: string[]
  userVoted: boolean
}

export interface Poll {
  question: string
  options: PollOption[]
  multiSelect: boolean
  expiresAt?: Date
  totalVotes: number
}

export interface ScheduleSlot {
  id: string
  datetime: Date
  votes: number
  voters: string[]
  userVoted: boolean
}

export interface ScheduleProposal {
  title: string
  description?: string
  slots: ScheduleSlot[]
  finalizedSlot?: string
  creatorId: string
}

export interface Attachment {
  id: string
  type: 'image' | 'file' | 'video'
  url: string
  name: string
  size?: number
  mimeType?: string
  thumbnailUrl?: string
}

export interface Mention {
  userId: string
  userName: string
  startIndex: number
  endIndex: number
}

export interface Message {
  id: string
  senderId: string
  senderName: string
  senderAvatar?: string
  content: string
  timestamp: Date
  type: 'text' | 'image' | 'voice' | 'poll' | 'schedule' | 'system'
  imageUrl?: string
  voiceDuration?: number
  isOwn: boolean
  status?: 'sent' | 'delivered' | 'read'
  // Thread collaboration features
  reactions?: Reaction[]
  isPinned?: boolean
  mentions?: Mention[]
  attachments?: Attachment[]
  poll?: Poll
  schedule?: ScheduleProposal
  replyTo?: {
    id: string
    senderName: string
    content: string
  }
}

export interface Conversation {
  id: string
  name: string
  avatarUrl?: string
  lastMessage: string
  timestamp: Date
  unreadCount: number
  type: 'direct' | 'memory-thread' | 'circle'
  linkedMemoryId?: string
  linkedMemoryTitle?: string
  participants?: number
  participantsList?: { id: string; name: string; avatar?: string }[]
  isOnline?: boolean
  pinnedMessages?: string[] // message IDs
  // Circle-specific fields
  circleId?: string
  circleDescription?: string
}

export interface ThreadSummary {
  summary: string
  keyPoints: string[]
  actionItems: string[]
  generatedAt: Date
}
