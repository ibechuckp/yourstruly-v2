'use client'

import { useState, useRef } from 'react'
import { format } from 'date-fns'
import { 
  Mic, Check, CheckCheck, Pin, Reply, MoreHorizontal, Smile,
  Download, FileIcon, X
} from 'lucide-react'
import { Message, Reaction } from './types'

// Quick reaction emojis
const QUICK_REACTIONS = ['❤️', '👍', '😂', '😮', '😢', '🙏']

interface MessageBubbleProps {
  message: Message
  showAvatar: boolean
  showName: boolean
  onReact?: (messageId: string, emoji: string) => void
  onPin?: (messageId: string) => void
  onReply?: (message: Message) => void
}

export default function MessageBubble({ 
  message, 
  showAvatar,
  showName,
  onReact,
  onPin,
  onReply
}: MessageBubbleProps) {
  const [showReactions, setShowReactions] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const initials = message.senderName
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const formatVoiceDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // Render content with @mentions highlighted
  const renderContentWithMentions = (content: string) => {
    if (!message.mentions?.length) return content
    
    let lastIndex = 0
    const parts: React.ReactNode[] = []
    
    const sortedMentions = [...message.mentions].sort((a, b) => a.startIndex - b.startIndex)
    
    sortedMentions.forEach((mention, i) => {
      // Text before mention
      if (mention.startIndex > lastIndex) {
        parts.push(content.slice(lastIndex, mention.startIndex))
      }
      // Mention
      parts.push(
        <span 
          key={i} 
          className={`font-semibold ${
            message.isOwn ? 'text-[#D9C61A]' : 'text-[#406A56]'
          }`}
        >
          @{mention.userName}
        </span>
      )
      lastIndex = mention.endIndex
    })
    
    // Remaining text
    if (lastIndex < content.length) {
      parts.push(content.slice(lastIndex))
    }
    
    return <>{parts}</>
  }

  const handleReactionClick = (emoji: string) => {
    onReact?.(message.id, emoji)
    setShowReactions(false)
  }

  return (
    <div 
      className={`group flex gap-3 ${message.isOwn ? 'flex-row-reverse' : ''} relative`}
      onMouseLeave={() => {
        setShowReactions(false)
        setShowMenu(false)
      }}
    >
      {/* Pinned indicator */}
      {message.isPinned && (
        <div className="absolute -top-4 left-12 flex items-center gap-1 text-[10px] text-[#C35F33]">
          <Pin size={10} />
          <span className="font-medium">Pinned</span>
        </div>
      )}

      {/* Avatar */}
      <div className="flex-shrink-0 w-9">
        {showAvatar && !message.isOwn && (
          message.senderAvatar ? (
            <img
              src={message.senderAvatar}
              alt={message.senderName}
              className="w-9 h-9 rounded-full object-cover"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#406A56]/20 to-[#8DACAB]/30 flex items-center justify-center text-xs font-semibold text-[#406A56]">
              {initials}
            </div>
          )
        )}
      </div>

      {/* Message Content */}
      <div className={`max-w-[70%] ${message.isOwn ? 'items-end' : 'items-start'}`}>
        {/* Sender name */}
        {showName && !message.isOwn && (
          <p className="text-xs font-semibold text-[#406A56] mb-1 px-1">
            {message.senderName}
          </p>
        )}

        {/* Reply preview */}
        {message.replyTo && (
          <div className={`mb-1 px-3 py-1.5 rounded-lg text-xs border-l-2 ${
            message.isOwn 
              ? 'bg-white/10 border-white/30 text-white/80'
              : 'bg-[#406A56]/5 border-[#406A56]/30 text-[#666]'
          }`}>
            <span className="font-semibold">{message.replyTo.senderName}</span>
            <p className="truncate opacity-80">{message.replyTo.content}</p>
          </div>
        )}

        {/* Bubble */}
        <div
          className={`relative rounded-2xl px-4 py-2.5 ${
            message.isPinned ? 'ring-2 ring-[#C35F33]/30' : ''
          } ${
            message.isOwn
              ? 'bg-[#406A56] text-white rounded-br-md'
              : 'bg-white border border-[#406A56]/10 text-[#2d2d2d] rounded-bl-md'
          }`}
        >
          {/* Action buttons - appear on hover */}
          <div className={`absolute top-1 ${message.isOwn ? '-left-24' : '-right-24'} hidden group-hover:flex items-center gap-0.5 bg-white rounded-lg shadow-lg border border-[#406A56]/10 p-0.5`}>
            <button
              onClick={() => setShowReactions(!showReactions)}
              className="p-1.5 rounded-md hover:bg-[#406A56]/10 text-[#666] hover:text-[#406A56] transition-colors"
              title="React"
            >
              <Smile size={14} />
            </button>
            <button
              onClick={() => onReply?.(message)}
              className="p-1.5 rounded-md hover:bg-[#406A56]/10 text-[#666] hover:text-[#406A56] transition-colors"
              title="Reply"
            >
              <Reply size={14} />
            </button>
            <button
              onClick={() => onPin?.(message.id)}
              className={`p-1.5 rounded-md hover:bg-[#406A56]/10 transition-colors ${
                message.isPinned ? 'text-[#C35F33]' : 'text-[#666] hover:text-[#406A56]'
              }`}
              title={message.isPinned ? 'Unpin' : 'Pin'}
            >
              <Pin size={14} />
            </button>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-md hover:bg-[#406A56]/10 text-[#666] hover:text-[#406A56] transition-colors"
              title="More"
            >
              <MoreHorizontal size={14} />
            </button>
          </div>

          {/* Quick reactions picker */}
          {showReactions && (
            <div className={`absolute bottom-full mb-1 ${message.isOwn ? 'right-0' : 'left-0'} flex items-center gap-0.5 bg-white rounded-full shadow-lg border border-[#406A56]/10 px-2 py-1`}>
              {QUICK_REACTIONS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => handleReactionClick(emoji)}
                  className="w-8 h-8 text-lg hover:scale-125 hover:bg-[#406A56]/10 rounded-full transition-all"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* Text message */}
          {message.type === 'text' && (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {renderContentWithMentions(message.content)}
            </p>
          )}

          {/* Image message */}
          {message.type === 'image' && message.imageUrl && (
            <div className="space-y-2">
              <div className="relative rounded-lg overflow-hidden">
                <img
                  src={message.imageUrl}
                  alt="Shared image"
                  className="max-w-full max-h-64 object-cover rounded-lg"
                />
              </div>
              {message.content && (
                <p className="text-sm leading-relaxed">{renderContentWithMentions(message.content)}</p>
              )}
            </div>
          )}

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="space-y-2 mt-2">
              {message.attachments.map(attachment => (
                <div 
                  key={attachment.id}
                  className={`flex items-center gap-2 p-2 rounded-lg ${
                    message.isOwn ? 'bg-white/10' : 'bg-[#406A56]/5'
                  }`}
                >
                  {attachment.type === 'image' && attachment.thumbnailUrl ? (
                    <img 
                      src={attachment.thumbnailUrl} 
                      alt={attachment.name}
                      className="w-10 h-10 rounded object-cover"
                    />
                  ) : (
                    <div className={`w-10 h-10 rounded flex items-center justify-center ${
                      message.isOwn ? 'bg-white/20' : 'bg-[#406A56]/10'
                    }`}>
                      <FileIcon size={18} className={message.isOwn ? 'text-white' : 'text-[#406A56]'} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium truncate ${message.isOwn ? 'text-white' : 'text-[#2d2d2d]'}`}>
                      {attachment.name}
                    </p>
                    {attachment.size && (
                      <p className={`text-[10px] ${message.isOwn ? 'text-white/70' : 'text-[#666]'}`}>
                        {formatFileSize(attachment.size)}
                      </p>
                    )}
                  </div>
                  <button className={`p-1.5 rounded-lg ${
                    message.isOwn 
                      ? 'hover:bg-white/20 text-white' 
                      : 'hover:bg-[#406A56]/10 text-[#406A56]'
                  }`}>
                    <Download size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Voice message */}
          {message.type === 'voice' && (
            <div className="flex items-center gap-3 min-w-[180px]">
              <button className={`w-8 h-8 rounded-full flex items-center justify-center ${
                message.isOwn 
                  ? 'bg-white/20 text-white hover:bg-white/30' 
                  : 'bg-[#406A56]/10 text-[#406A56] hover:bg-[#406A56]/20'
              } transition-colors`}>
                <Mic size={14} />
              </button>
              <div className="flex-1">
                {/* Waveform placeholder */}
                <div className="flex items-center gap-0.5 h-6">
                  {[...Array(20)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-1 rounded-full ${
                        message.isOwn ? 'bg-white/40' : 'bg-[#406A56]/30'
                      }`}
                      style={{ height: `${Math.random() * 100}%`, minHeight: '4px' }}
                    />
                  ))}
                </div>
              </div>
              <span className={`text-xs font-medium ${
                message.isOwn ? 'text-white/70' : 'text-[#666]'
              }`}>
                {formatVoiceDuration(message.voiceDuration || 0)}
              </span>
            </div>
          )}

          {/* Poll */}
          {message.type === 'poll' && message.poll && (
            <div className="space-y-3">
              <p className={`font-semibold text-sm ${message.isOwn ? 'text-white' : 'text-[#2d2d2d]'}`}>
                📊 {message.poll.question}
              </p>
              <div className="space-y-2">
                {message.poll.options.map(option => {
                  const percentage = message.poll!.totalVotes > 0 
                    ? Math.round((option.votes / message.poll!.totalVotes) * 100) 
                    : 0
                  return (
                    <button
                      key={option.id}
                      className={`w-full relative overflow-hidden rounded-lg p-2.5 text-left transition-all ${
                        option.userVoted
                          ? message.isOwn 
                            ? 'bg-white/30 ring-2 ring-white/50' 
                            : 'bg-[#406A56]/20 ring-2 ring-[#406A56]/50'
                          : message.isOwn 
                            ? 'bg-white/10 hover:bg-white/20' 
                            : 'bg-[#406A56]/5 hover:bg-[#406A56]/10'
                      }`}
                    >
                      {/* Progress bar */}
                      <div 
                        className={`absolute inset-y-0 left-0 ${
                          message.isOwn ? 'bg-white/20' : 'bg-[#406A56]/10'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                      <div className="relative flex items-center justify-between">
                        <span className="text-xs font-medium">{option.text}</span>
                        <span className="text-[10px] opacity-70">{percentage}%</span>
                      </div>
                    </button>
                  )
                })}
              </div>
              <p className={`text-[10px] ${message.isOwn ? 'text-white/60' : 'text-[#666]'}`}>
                {message.poll.totalVotes} vote{message.poll.totalVotes !== 1 ? 's' : ''}
                {message.poll.multiSelect && ' · Multiple choice'}
              </p>
            </div>
          )}

          {/* Schedule proposal */}
          {message.type === 'schedule' && message.schedule && (
            <div className="space-y-3">
              <div>
                <p className={`font-semibold text-sm ${message.isOwn ? 'text-white' : 'text-[#2d2d2d]'}`}>
                  📅 {message.schedule.title}
                </p>
                {message.schedule.description && (
                  <p className={`text-xs mt-0.5 ${message.isOwn ? 'text-white/70' : 'text-[#666]'}`}>
                    {message.schedule.description}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                {message.schedule.slots.map(slot => {
                  const isFinalized = message.schedule!.finalizedSlot === slot.id
                  return (
                    <button
                      key={slot.id}
                      className={`w-full rounded-lg p-2.5 text-left transition-all ${
                        isFinalized
                          ? 'bg-[#D9C61A]/30 ring-2 ring-[#D9C61A]'
                          : slot.userVoted
                            ? message.isOwn 
                              ? 'bg-white/30 ring-2 ring-white/50' 
                              : 'bg-[#406A56]/20 ring-2 ring-[#406A56]/50'
                            : message.isOwn 
                              ? 'bg-white/10 hover:bg-white/20' 
                              : 'bg-[#406A56]/5 hover:bg-[#406A56]/10'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">
                          {format(slot.datetime, 'EEE, MMM d · h:mm a')}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          isFinalized
                            ? 'bg-[#D9C61A] text-[#2d2d2d]'
                            : message.isOwn ? 'bg-white/20' : 'bg-[#406A56]/10'
                        }`}>
                          {isFinalized ? '✓ Confirmed' : `${slot.votes} available`}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Reactions display */}
        {message.reactions && message.reactions.length > 0 && (
          <div className={`flex flex-wrap gap-1 mt-1 ${message.isOwn ? 'justify-end' : 'justify-start'}`}>
            {message.reactions.map(reaction => (
              <button
                key={reaction.emoji}
                onClick={() => handleReactionClick(reaction.emoji)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors ${
                  reaction.userReacted
                    ? 'bg-[#406A56]/20 border border-[#406A56]/30'
                    : 'bg-white border border-[#406A56]/10 hover:border-[#406A56]/30'
                }`}
              >
                <span>{reaction.emoji}</span>
                <span className="text-[10px] text-[#666]">{reaction.count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Timestamp & Status */}
        <div className={`flex items-center gap-1.5 mt-1 px-1 ${
          message.isOwn ? 'justify-end' : 'justify-start'
        }`}>
          <span className="text-[10px] text-[#999]">
            {format(message.timestamp, 'h:mm a')}
          </span>
          {message.isOwn && message.status && (
            <span className="text-[#406A56]">
              {message.status === 'read' ? (
                <CheckCheck size={12} />
              ) : (
                <Check size={12} />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
