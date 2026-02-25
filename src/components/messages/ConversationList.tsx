'use client'

import { useState } from 'react'
import { Search, MessageSquare, Brain, Users, CircleDot, LucideIcon } from 'lucide-react'
import ConversationItem from './ConversationItem'
import { Conversation } from './types'
import TornEdge from '@/components/ui/TornEdge'

type FilterType = 'all' | 'memory-threads' | 'direct' | 'circles'

interface ConversationListProps {
  conversations: Conversation[]
  activeId: string | null
  onSelect: (conversation: Conversation) => void
}

export default function ConversationList({
  conversations,
  activeId,
  onSelect
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')

  const filters: { id: FilterType; label: string; icon: LucideIcon }[] = [
    { id: 'all', label: 'All', icon: MessageSquare },
    { id: 'circles', label: 'Circles', icon: CircleDot },
    { id: 'memory-threads', label: 'Memory Threads', icon: Brain },
    { id: 'direct', label: 'Direct', icon: Users },
  ]

  const filteredConversations = conversations.filter(conv => {
    // Search filter
    const matchesSearch = !searchQuery || 
      conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
    
    // Type filter
    const matchesFilter = filter === 'all' ||
      (filter === 'memory-threads' && conv.type === 'memory-thread') ||
      (filter === 'direct' && conv.type === 'direct') ||
      (filter === 'circles' && conv.type === 'circle')

    return matchesSearch && matchesFilter
  })

  const unreadCount = conversations.reduce((acc, c) => acc + c.unreadCount, 0)

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[#406A56]/10 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#2d2d2d]">Messages</h2>
          {unreadCount > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-[#C35F33]/15 text-[#C35F33] text-xs font-semibold">
              {unreadCount} new
            </span>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search 
            size={16} 
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#406A56]/50" 
          />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-[#406A56]/5 border border-[#406A56]/10 rounded-xl text-sm text-[#2d2d2d] placeholder:text-[#999] focus:outline-none focus:border-[#406A56]/30 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Filter Tabs with Torn Edges */}
      <div className="px-4 py-3 border-b border-[#406A56]/10 flex-shrink-0">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {filters.map(({ id, label, icon: Icon }, index) => (
            <div key={id} className="relative">
              <button
                onClick={() => setFilter(id)}
                className={`relative flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-all rounded-t-lg ${
                  filter === id
                    ? 'bg-[#406A56] text-white'
                    : 'bg-[#F8F6EE] text-[#666] hover:bg-white hover:text-[#406A56] border border-b-0 border-[#406A56]/10'
                }`}
              >
                <Icon size={13} />
                <span>{label}</span>
              </button>
              {/* Torn bottom edge */}
              <div className="absolute -bottom-[6px] left-0 right-0">
                <TornEdge 
                  variant={(['a', 'b', 'c', 'd', 'e'] as const)[index % 5]} 
                  position="bottom" 
                  color={filter === id ? '#406A56' : '#F8F6EE'} 
                  height={8} 
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto p-2 min-h-0">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center px-4">
            <div className="w-12 h-12 rounded-full bg-[#406A56]/10 flex items-center justify-center mb-3">
              <MessageSquare size={20} className="text-[#406A56]/50" />
            </div>
            <p className="text-sm text-[#666]">
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredConversations.map(conversation => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isActive={conversation.id === activeId}
                onClick={() => onSelect(conversation)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
