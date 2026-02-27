'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Heart, 
  MessageCircle, 
  Users, 
  BookOpen, 
  Image, 
  Bell,
  ChevronRight,
  RefreshCw,
  Sparkles,
  Star,
  Trophy,
  Zap,
  Camera,
  Brain
} from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface ActivityActor {
  id: string
  name: string
  avatar_url?: string
}

interface ActivityItem {
  id: string
  type: 'memory_shared' | 'wisdom_shared' | 'circle_message' | 'circle_invite' | 'circle_content' | 'wisdom_comment' | 'xp_earned'
  title: string
  description: string
  timestamp: string
  actor?: ActivityActor
  thumbnail?: string
  link: string
  metadata?: Record<string, any>
  xp?: number
  isNew?: boolean
}

// XP completion that can be added externally
export interface XPCompletion {
  id: string
  type: string
  icon: string
  title: string
  xp: number
  photoUrl?: string
  contactName?: string
  timestamp: string
}

// Use warm, cohesive colors that match the cream/terra cotta theme
const ACTIVITY_ICONS: Record<string, { icon: typeof Heart; color: string; bg: string }> = {
  memory_shared: { icon: Image, color: 'text-[#C35F33]', bg: 'bg-[#C35F33]/10' },
  wisdom_shared: { icon: BookOpen, color: 'text-[#4A3552]', bg: 'bg-[#4A3552]/10' },
  circle_message: { icon: MessageCircle, color: 'text-[#406A56]', bg: 'bg-[#406A56]/10' },
  circle_invite: { icon: Users, color: 'text-[#8DACAB]', bg: 'bg-[#8DACAB]/15' },
  circle_content: { icon: Heart, color: 'text-[#C35F33]', bg: 'bg-[#C35F33]/10' },
  wisdom_comment: { icon: MessageCircle, color: 'text-[#4A3552]', bg: 'bg-[#4A3552]/10' },
  xp_earned: { icon: Zap, color: 'text-[#406A56]', bg: 'bg-[#406A56]/10' },
  photo_backstory: { icon: Camera, color: 'text-[#D9C61A]', bg: 'bg-[#D9C61A]/15' },
  knowledge: { icon: Brain, color: 'text-[#C35F33]', bg: 'bg-[#C35F33]/10' },
  quick_question: { icon: Users, color: 'text-[#406A56]', bg: 'bg-[#406A56]/10' },
  missing_info: { icon: Users, color: 'text-[#8DACAB]', bg: 'bg-[#8DACAB]/15' },
}

function formatRelativeTime(timestamp: string): string {
  try {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
  } catch {
    return 'recently'
  }
}

function ActivityItemCard({ activity, index }: { activity: ActivityItem; index: number }) {
  const config = ACTIVITY_ICONS[activity.type] || ACTIVITY_ICONS.memory_shared
  const Icon = config.icon
  const isXPActivity = activity.type === 'xp_earned' || activity.xp

  // XP earned activity gets special celebration styling
  if (isXPActivity && activity.isNew) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ 
          type: 'spring',
          stiffness: 400,
          damping: 20,
          delay: index * 0.05 
        }}
        className="relative overflow-hidden"
      >
        {/* Subtle celebration effect */}
        <Link 
          href={activity.link}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#406A56]/5 border border-[#406A56]/15 hover:bg-[#406A56]/10 transition-all group"
        >
          {/* XP Icon - warm green, smaller */}
          <div className="flex-shrink-0 relative">
            <div className="w-7 h-7 rounded-full bg-[#406A56] flex items-center justify-center shadow-sm">
              <Sparkles size={12} className="text-white" />
            </div>
          </div>

          {/* Content with XP badge - compact single line when possible */}
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#406A56] text-white text-[10px] font-semibold flex-shrink-0">
                +{activity.xp} XP
              </span>
              <p className="text-xs text-gray-700 line-clamp-2 flex-1">
                {activity.description}
              </p>
            </div>
            <span className="text-[10px] text-gray-400 flex-shrink-0 mt-0.5">
              {formatRelativeTime(activity.timestamp)}
            </span>
          </div>

          {/* Thumbnail - smaller */}
          {activity.thumbnail && (
            <div className="flex-shrink-0">
              <img 
                src={activity.thumbnail} 
                alt=""
                className="w-8 h-8 rounded-md object-cover shadow-sm ring-1 ring-[#406A56]/20"
              />
            </div>
          )}
        </Link>
      </motion.div>
    )
  }

  // Regular activity - compact single-row layout
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link 
        href={activity.link}
        className="flex items-start gap-2 px-3 py-2 rounded-lg hover:bg-[#406A56]/5 transition-colors group"
      >
        {/* Avatar or Icon - smaller */}
        <div className="flex-shrink-0 relative mt-0.5">
          {activity.actor?.avatar_url ? (
            <div className="relative">
              <img 
                src={activity.actor.avatar_url} 
                alt={activity.actor.name}
                className="w-7 h-7 rounded-full object-cover border border-white shadow-sm"
              />
              <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full ${config.bg} flex items-center justify-center shadow-sm`}>
                <Icon size={8} className={config.color} />
              </div>
            </div>
          ) : activity.actor ? (
            <div className="relative">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#406A56] to-[#4a7a64] flex items-center justify-center text-white font-medium text-[10px] shadow-sm">
                {activity.actor.name.charAt(0).toUpperCase()}
              </div>
              <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full ${config.bg} flex items-center justify-center shadow-sm`}>
                <Icon size={8} className={config.color} />
              </div>
            </div>
          ) : (
            <div className={`w-7 h-7 rounded-full ${config.bg} flex items-center justify-center`}>
              <Icon size={14} className={config.color} />
            </div>
          )}
        </div>

        {/* Content - compact inline */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex items-center gap-1.5">
            {/* Show XP badge for non-new XP activities too */}
            {activity.xp && !activity.isNew && (
              <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded-full bg-[#D9C61A]/20 text-[#8a7c08] text-[9px] font-semibold flex-shrink-0">
                <Sparkles size={7} />
                +{activity.xp}
              </span>
            )}
            <p className="text-xs text-gray-700 line-clamp-2 flex-1">
              {activity.description}
            </p>
          </div>
          <span className="text-[10px] text-gray-400 flex-shrink-0 mt-0.5">
            {formatRelativeTime(activity.timestamp)}
          </span>
        </div>

        {/* Thumbnail - smaller */}
        {activity.thumbnail && (
          <div className="flex-shrink-0 mt-0.5">
            <img 
              src={activity.thumbnail} 
              alt=""
              className="w-7 h-7 rounded-md object-cover shadow-sm group-hover:shadow-md transition-shadow"
            />
          </div>
        )}

        {/* Arrow indicator on hover */}
        <ChevronRight 
          size={12} 
          className="flex-shrink-0 mt-1 text-gray-300 group-hover:text-[#406A56] transition-colors"
        />
      </Link>
    </motion.div>
  )
}

interface ActivityFeedProps {
  xpCompletions?: XPCompletion[]
}

export default function ActivityFeed({ xpCompletions = [] }: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Merge XP completions into activity feed
  const mergedActivities = useCallback((): ActivityItem[] => {
    const xpActivities: ActivityItem[] = xpCompletions.map(xp => ({
      id: `xp-${xp.id}`,
      type: 'xp_earned' as const,
      title: xp.title,
      description: xp.title,
      timestamp: xp.timestamp,
      link: xp.contactName ? '/dashboard/contacts' : '/dashboard/memories',
      thumbnail: xp.photoUrl,
      xp: xp.xp,
      isNew: true,
      metadata: { originalType: xp.type, contactName: xp.contactName }
    }))
    
    // Combine and sort by timestamp (newest first)
    return [...xpActivities, ...activities]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 15) // Limit to 15 items
  }, [xpCompletions, activities])

  const fetchActivities = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true)
    else setIsLoading(true)
    
    try {
      const res = await fetch('/api/activity?limit=10')
      if (!res.ok) throw new Error('Failed to fetch activities')
      const data = await res.json()
      setActivities(data.activities || [])
      setError(null)
    } catch (err) {
      console.error('Error fetching activities:', err)
      setError('Could not load activity')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchActivities()
  }, [])

  return (
    <div className="bg-[#FDF8F3] rounded-[20px] shadow-sm overflow-hidden border border-white/50 h-full flex flex-col max-h-full">
      {/* Header - compact */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 py-2 border-b border-[#406A56]/10">
        <div className="flex items-center gap-1.5">
          <Bell size={12} className="text-[#406A56]" />
          <h3 className="text-xs font-semibold text-gray-700">Recent Activity</h3>
        </div>
        <button
          onClick={() => fetchActivities(true)}
          disabled={isRefreshing}
          className="p-1 rounded-md hover:bg-[#406A56]/10 transition-colors disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw 
            size={12} 
            className={`text-[#406A56] ${isRefreshing ? 'animate-spin' : ''}`}
          />
        </button>
      </div>

      {/* Content - Scrollable, no dividers for compact look */}
      <div className="flex-1 min-h-0 overflow-y-auto py-1">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-4 gap-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            >
              <Sparkles size={14} className="text-[#D9C61A]" />
            </motion.div>
            <span className="text-[10px] text-gray-400">Loading...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-4 gap-1">
            <Bell size={14} className="text-gray-300" />
            <span className="text-[10px] text-gray-400">{error}</span>
            <button
              onClick={() => fetchActivities()}
              className="text-[10px] text-[#406A56] hover:underline"
            >
              Try again
            </button>
          </div>
        ) : mergedActivities().length === 0 ? (
          <div className="flex flex-col items-center justify-center py-4 gap-1">
            <div className="w-8 h-8 rounded-full bg-[#406A56]/5 flex items-center justify-center">
              <Sparkles size={14} className="text-[#406A56]/40" />
            </div>
            <span className="text-xs text-gray-500">No recent activity</span>
            <span className="text-[10px] text-gray-400 text-center px-2">
              Complete prompts to earn XP!
            </span>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {mergedActivities().map((activity, index) => (
              <ActivityItemCard 
                key={activity.id} 
                activity={activity} 
                index={index}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Footer - See All - compact */}
      {activities.length > 0 && (
        <div className="px-3 py-1.5 border-t border-[#406A56]/10 bg-[#406A56]/5">
          <Link 
            href="/dashboard/activity"
            className="flex items-center justify-center gap-1 text-[10px] text-[#406A56] hover:text-[#2d4d3d] transition-colors font-medium"
          >
            See all
            <ChevronRight size={10} />
          </Link>
        </div>
      )}
    </div>
  )
}
