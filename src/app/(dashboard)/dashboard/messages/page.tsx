'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  ConversationList, 
  MessageThread, 
  CircleMessageThread,
  Conversation, 
  Message,
  Poll,
  ScheduleProposal
} from '@/components/messages'
import TornEdge from '@/components/ui/TornEdge'

// ============================================
// MOCK DATA
// ============================================
const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: '1',
    name: 'Mom',
    lastMessage: 'That sounds wonderful! Can\'t wait to hear more about your trip 💕',
    timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 mins ago
    unreadCount: 2,
    type: 'direct',
    isOnline: true,
  },
  {
    id: '2',
    name: 'Grandpa\'s Stories',
    lastMessage: 'I added some photos from the war years that you mentioned...',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    unreadCount: 0,
    type: 'memory-thread',
    linkedMemoryId: 'mem-123',
    linkedMemoryTitle: 'World War II Letters',
    participants: 4,
    participantsList: [
      { id: 'uncle-joe', name: 'Uncle Joe' },
      { id: 'aunt-mary', name: 'Aunt Mary' },
      { id: 'cousin-sam', name: 'Cousin Sam' },
    ],
    pinnedMessages: ['m1'],
  },
  {
    id: '3',
    name: 'Sarah Chen',
    lastMessage: 'The recipe collection is looking amazing!',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8), // 8 hours ago
    unreadCount: 0,
    type: 'direct',
    isOnline: false,
  },
  {
    id: '4',
    name: 'Wedding Anniversary',
    lastMessage: 'John: Remember to add the toast from Uncle Mike!',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    unreadCount: 5,
    type: 'memory-thread',
    linkedMemoryId: 'mem-456',
    linkedMemoryTitle: '25th Anniversary',
    participants: 8,
    participantsList: [
      { id: 'sister', name: 'Emily' },
      { id: 'john', name: 'John' },
      { id: 'uncle-mike', name: 'Uncle Mike' },
      { id: 'dad', name: 'Dad' },
      { id: 'mom-2', name: 'Mom' },
    ],
  },
  {
    id: '5',
    name: 'David Thompson',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    lastMessage: 'Thanks for sharing those childhood photos!',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
    unreadCount: 0,
    type: 'direct',
  },
  {
    id: '6',
    name: 'Family Recipes',
    lastMessage: 'Lisa: Just added grandma\'s apple pie recipe 🥧',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72), // 3 days ago
    unreadCount: 0,
    type: 'memory-thread',
    linkedMemoryId: 'mem-789',
    linkedMemoryTitle: 'Kitchen Memories',
    participants: 6,
    participantsList: [
      { id: 'lisa', name: 'Lisa' },
      { id: 'tom', name: 'Tom' },
      { id: 'grandma', name: 'Grandma Rose' },
    ],
  },
]

const MOCK_MESSAGES: Record<string, Message[]> = {
  '1': [
    {
      id: 'm1',
      senderId: 'user-1',
      senderName: 'You',
      content: 'Hi Mom! Just wanted to share some exciting news 🎉',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      type: 'text',
      isOwn: true,
      status: 'read',
    },
    {
      id: 'm2',
      senderId: 'mom',
      senderName: 'Mom',
      content: 'Oh! What is it? Tell me everything! 😊',
      timestamp: new Date(Date.now() - 1000 * 60 * 25),
      type: 'text',
      isOwn: false,
      reactions: [
        { emoji: '❤️', count: 1, users: ['user-1'], userReacted: true }
      ],
    },
    {
      id: 'm3',
      senderId: 'user-1',
      senderName: 'You',
      content: 'I\'m planning a trip to visit you next month! I\'ve already booked the flights.',
      timestamp: new Date(Date.now() - 1000 * 60 * 20),
      type: 'text',
      isOwn: true,
      status: 'read',
    },
    {
      id: 'm4',
      senderId: 'mom',
      senderName: 'Mom',
      content: 'That sounds wonderful! Can\'t wait to hear more about your trip 💕',
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
      type: 'text',
      isOwn: false,
    },
    {
      id: 'm5',
      senderId: 'mom',
      senderName: 'Mom',
      content: 'I\'ll prepare your favorite room and we can make those cookies you love!',
      timestamp: new Date(Date.now() - 1000 * 60 * 4),
      type: 'text',
      isOwn: false,
    },
  ],
  '2': [
    {
      id: 'm1',
      senderId: 'uncle-joe',
      senderName: 'Uncle Joe',
      content: 'I found some old letters from grandpa\'s time in the service.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
      type: 'text',
      isOwn: false,
      isPinned: true,
      reactions: [
        { emoji: '❤️', count: 3, users: ['user-1', 'aunt-mary', 'cousin-sam'], userReacted: true },
        { emoji: '😮', count: 2, users: ['user-1', 'aunt-mary'], userReacted: true },
      ],
    },
    {
      id: 'm2',
      senderId: 'user-1',
      senderName: 'You',
      content: 'That\'s incredible! Can you scan them? @Uncle Joe',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
      type: 'text',
      isOwn: true,
      status: 'read',
      mentions: [
        { userId: 'uncle-joe', userName: 'Uncle Joe', startIndex: 36, endIndex: 46 }
      ],
    },
    {
      id: 'm3',
      senderId: 'uncle-joe',
      senderName: 'Uncle Joe',
      imageUrl: 'https://images.unsplash.com/photo-1567016376408-0226e4d0c1ea?w=400&h=300&fit=crop',
      content: 'Here\'s one of the letters',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
      type: 'image',
      isOwn: false,
    },
    {
      id: 'm4',
      senderId: 'aunt-mary',
      senderName: 'Aunt Mary',
      content: 'Oh my, I remember him reading these to us when we were kids!',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2.5),
      type: 'text',
      isOwn: false,
      reactions: [
        { emoji: '🙏', count: 2, users: ['user-1', 'uncle-joe'], userReacted: true },
      ],
    },
    {
      id: 'm5',
      senderId: 'user-1',
      senderName: 'You',
      content: 'I added some photos from the war years that you mentioned...',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      type: 'text',
      isOwn: true,
      status: 'delivered',
    },
  ],
  '4': [
    {
      id: 'm1',
      senderId: 'sister',
      senderName: 'Emily',
      content: 'Everyone, let\'s coordinate on the speeches for the anniversary party! 🎊',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 28),
      type: 'text',
      isOwn: false,
      isPinned: true,
    },
    {
      id: 'm2',
      senderId: 'user-1',
      senderName: 'You',
      content: 'Great idea! I can put together a slideshow with old photos.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 27),
      type: 'text',
      isOwn: true,
      status: 'read',
      reactions: [
        { emoji: '👍', count: 4, users: ['sister', 'john', 'dad', 'mom-2'], userReacted: false },
      ],
    },
    {
      id: 'm3',
      senderId: 'john',
      senderName: 'John',
      voiceDuration: 45,
      content: '',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 26),
      type: 'voice',
      isOwn: false,
    },
    {
      id: 'm4',
      senderId: 'sister',
      senderName: 'Emily',
      content: 'John, that recording of dad\'s old stories is perfect! 😭',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 25),
      type: 'text',
      isOwn: false,
    },
    {
      id: 'poll-1',
      senderId: 'sister',
      senderName: 'Emily',
      content: '',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24.5),
      type: 'poll',
      isOwn: false,
      poll: {
        question: 'What theme should we use for decorations?',
        options: [
          { id: 'opt1', text: 'Vintage Garden Party 🌸', votes: 4, voters: ['user-1', 'john', 'dad', 'mom-2'], userVoted: true },
          { id: 'opt2', text: 'Classic Elegance ✨', votes: 2, voters: ['sister', 'uncle-mike'], userVoted: false },
          { id: 'opt3', text: 'Rustic Farmhouse 🌾', votes: 1, voters: [], userVoted: false },
        ],
        multiSelect: false,
        totalVotes: 7,
      },
    },
    {
      id: 'schedule-1',
      senderId: 'john',
      senderName: 'John',
      content: '',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24.2),
      type: 'schedule',
      isOwn: false,
      schedule: {
        title: 'Pre-party Planning Meeting',
        description: 'Let\'s finalize everything!',
        slots: [
          { id: 'slot1', datetime: new Date(Date.now() + 1000 * 60 * 60 * 48), votes: 5, voters: ['user-1', 'sister', 'john', 'dad', 'mom-2'], userVoted: true },
          { id: 'slot2', datetime: new Date(Date.now() + 1000 * 60 * 60 * 72), votes: 3, voters: ['uncle-mike', 'dad', 'mom-2'], userVoted: false },
          { id: 'slot3', datetime: new Date(Date.now() + 1000 * 60 * 60 * 96), votes: 2, voters: ['sister', 'john'], userVoted: false },
        ],
        creatorId: 'john',
        finalizedSlot: 'slot1',
      },
    },
    {
      id: 'm5',
      senderId: 'john',
      senderName: 'John',
      content: 'Remember to add the toast from Uncle Mike!',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
      type: 'text',
      isOwn: false,
    },
  ],
}

// Default messages for conversations without specific mock data
const DEFAULT_MESSAGES: Message[] = [
  {
    id: 'default-1',
    senderId: 'other',
    senderName: 'Contact',
    content: 'Looking forward to connecting more!',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    type: 'text',
    isOwn: false,
  },
]

// ============================================
// MAIN PAGE
// ============================================
export default function MessagesPage() {
  const router = useRouter()
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>(MOCK_CONVERSATIONS)
  const [messagesMap, setMessagesMap] = useState(MOCK_MESSAGES)
  const [loadingCircles, setLoadingCircles] = useState(true)

  // Fetch circle conversations on mount
  useEffect(() => {
    async function fetchCircleConversations() {
      try {
        const res = await fetch('/api/messages/circles')
        if (res.ok) {
          const data = await res.json()
          const circleConversations: Conversation[] = data.conversations.map((c: any) => ({
            id: c.id,
            name: c.name,
            lastMessage: c.lastMessage,
            timestamp: new Date(c.timestamp),
            unreadCount: c.unreadCount,
            type: 'circle' as const,
            participants: c.participants,
            circleId: c.circleId,
            circleDescription: c.circleDescription,
          }))
          
          // Merge with existing conversations (mock DMs and memory threads)
          setConversations(prev => {
            // Remove any existing circle conversations and add fresh ones
            const nonCircleConvos = prev.filter(c => c.type !== 'circle')
            const merged = [...nonCircleConvos, ...circleConversations].sort(
              (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            )
            
            // Set first conversation as active if none selected
            if (!activeConversation && merged.length > 0) {
              // Use setTimeout to avoid setting state during render
              setTimeout(() => setActiveConversation(merged[0]), 0)
            }
            
            return merged
          })
        }
      } catch (error) {
        console.error('Failed to fetch circle conversations:', error)
      } finally {
        setLoadingCircles(false)
      }
    }
    fetchCircleConversations()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectConversation = (conversation: Conversation) => {
    setActiveConversation(conversation)
    // Clear unread count
    setConversations(prev =>
      prev.map(c =>
        c.id === conversation.id ? { ...c, unreadCount: 0 } : c
      )
    )
  }

  // Navigate to circle detail page (alternative access point)
  const handleOpenCircleDetail = (circleId: string) => {
    router.push(`/dashboard/circles/${circleId}`)
  }

  const handleSendMessage = (
    content: string, 
    type: 'text' | 'image' | 'voice' | 'poll' | 'schedule',
    extras?: { poll?: Poll; schedule?: ScheduleProposal; replyTo?: Message }
  ) => {
    if (!activeConversation) return

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      senderId: 'user-1',
      senderName: 'You',
      content,
      timestamp: new Date(),
      type,
      isOwn: true,
      status: 'sent',
      poll: extras?.poll,
      schedule: extras?.schedule,
      replyTo: extras?.replyTo ? {
        id: extras.replyTo.id,
        senderName: extras.replyTo.senderName,
        content: extras.replyTo.content
      } : undefined,
    }

    setMessagesMap(prev => ({
      ...prev,
      [activeConversation.id]: [...(prev[activeConversation.id] || []), newMessage],
    }))

    // Update conversation preview
    const previewText = type === 'poll' 
      ? '📊 Poll created' 
      : type === 'schedule' 
        ? '📅 Times proposed' 
        : content
    
    setConversations(prev =>
      prev.map(c =>
        c.id === activeConversation.id
          ? { ...c, lastMessage: previewText, timestamp: new Date() }
          : c
      )
    )
  }

  const handleReact = (messageId: string, emoji: string) => {
    if (!activeConversation) return

    setMessagesMap(prev => {
      const messages = prev[activeConversation.id] || []
      return {
        ...prev,
        [activeConversation.id]: messages.map(msg => {
          if (msg.id !== messageId) return msg

          const reactions = [...(msg.reactions || [])]
          const existingIndex = reactions.findIndex(r => r.emoji === emoji)

          if (existingIndex >= 0) {
            const reaction = reactions[existingIndex]
            if (reaction.userReacted) {
              // Remove user's reaction
              if (reaction.count === 1) {
                reactions.splice(existingIndex, 1)
              } else {
                reactions[existingIndex] = {
                  ...reaction,
                  count: reaction.count - 1,
                  userReacted: false,
                  users: reaction.users.filter(u => u !== 'user-1')
                }
              }
            } else {
              // Add user's reaction
              reactions[existingIndex] = {
                ...reaction,
                count: reaction.count + 1,
                userReacted: true,
                users: [...reaction.users, 'user-1']
              }
            }
          } else {
            // New reaction
            reactions.push({
              emoji,
              count: 1,
              users: ['user-1'],
              userReacted: true
            })
          }

          return { ...msg, reactions }
        })
      }
    })
  }

  const handlePin = (messageId: string) => {
    if (!activeConversation) return

    setMessagesMap(prev => {
      const messages = prev[activeConversation.id] || []
      return {
        ...prev,
        [activeConversation.id]: messages.map(msg =>
          msg.id === messageId ? { ...msg, isPinned: !msg.isPinned } : msg
        )
      }
    })

    // Update conversation's pinned messages list
    setConversations(prev =>
      prev.map(c => {
        if (c.id !== activeConversation.id) return c
        const pinnedMessages = c.pinnedMessages || []
        const isPinned = pinnedMessages.includes(messageId)
        return {
          ...c,
          pinnedMessages: isPinned
            ? pinnedMessages.filter(id => id !== messageId)
            : [...pinnedMessages, messageId]
        }
      })
    )
  }

  const currentMessages = activeConversation
    ? messagesMap[activeConversation.id] || DEFAULT_MESSAGES
    : []

  return (
    <div className="min-h-screen bg-[#F2F1E5]">
      {/* Main Content - Full Height */}
      <main className="px-4 lg:px-6 py-4 lg:py-6">
        <div className="max-w-6xl mx-auto">
          {/* Messages Panel - Glass Card */}
          <div className="bg-white/80 backdrop-blur-xl rounded-[20px] shadow-lg border border-white/50 overflow-hidden h-[calc(100vh-140px)] lg:h-[calc(100vh-160px)]">
            <div className="flex h-full">
              {/* Conversation List - Left Panel */}
              <div 
                className={`w-full lg:w-[360px] border-r border-[#406A56]/10 bg-[#F2F1E5]/50 flex-shrink-0 flex flex-col ${
                  activeConversation ? 'hidden lg:flex' : 'flex'
                }`}
              >
                <ConversationList
                  conversations={conversations}
                  activeId={activeConversation?.id || null}
                  onSelect={handleSelectConversation}
                />
              </div>

              {/* Message Thread - Right Panel */}
              <div className={`flex-1 flex flex-col min-w-0 bg-white/40 ${!activeConversation ? 'hidden lg:flex' : 'flex'}`}>
                {activeConversation ? (
                  <>
                    {/* Mobile back button */}
                    <button
                      onClick={() => setActiveConversation(null)}
                      className="lg:hidden flex items-center gap-2 px-4 py-3 text-[#406A56] bg-white/60 border-b border-[#406A56]/10 flex-shrink-0 hover:bg-white/80 transition-all"
                    >
                      <ChevronLeft size={18} />
                      <span className="text-sm font-medium">Back to conversations</span>
                    </button>
                    <div className="flex-1 overflow-hidden min-h-0">
                      {activeConversation.type === 'circle' && activeConversation.circleId ? (
                        <CircleMessageThread
                          circleId={activeConversation.circleId}
                          circleName={activeConversation.name}
                          memberCount={activeConversation.participants || 0}
                          onOpenDetail={() => handleOpenCircleDetail(activeConversation.circleId!)}
                          onMessageSent={() => {
                            // Update conversation preview when message is sent
                            setConversations(prev =>
                              prev.map(c =>
                                c.id === activeConversation.id
                                  ? { ...c, lastMessage: 'You: Message sent', timestamp: new Date() }
                                  : c
                              )
                            )
                          }}
                        />
                      ) : (
                        <MessageThread
                          conversation={activeConversation}
                          messages={currentMessages}
                          onSendMessage={handleSendMessage}
                          onReact={handleReact}
                          onPin={handlePin}
                        />
                      )}
                    </div>
                  </>
                ) : (
                  /* Empty State with torn edge card */
                  <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-white/60 to-[#F2F1E5]/40">
                    <div className="relative">
                      <div className="absolute -top-2 left-4 right-4">
                        <TornEdge variant="d" position="top" color="white" height={8} />
                      </div>
                      <div className="text-center px-8 py-8 bg-white rounded-lg shadow-sm mx-4">
                        <div className="w-20 h-20 rounded-full bg-[#4A3552]/10 flex items-center justify-center mx-auto mb-4">
                          <MessageSquare size={32} className="text-[#4A3552]" />
                        </div>
                        <h3 className="text-lg font-semibold text-[#2d2d2d] mb-2">
                          Select a conversation
                        </h3>
                        <p className="text-sm text-[#666] max-w-sm">
                          Choose a conversation from the list to start messaging, 
                          or browse memory threads to collaborate with family.
                        </p>
                      </div>
                      <div className="absolute -bottom-2 left-4 right-4">
                        <TornEdge variant="c" position="bottom" color="white" height={8} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
