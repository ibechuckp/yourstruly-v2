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
  photo_backstory: { icon: Camera, color: 'text-[#C35F33]', bg: 'bg-[#C35F33]/10' },
  knowledge: { icon: Brain, color: 'text-[#4A3552]', bg: 'bg-[#4A3552]/10' },
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
          className="flex items-start gap-3 p-3 rounded-xl bg-[#406A56]/5 border border-[#406A56]/15 hover:bg-[#406A56]/10 transition-all group"
        >
          {/* XP Icon - warm green */}
          <div className="flex-shrink-0 relative">
            <div className="w-10 h-10 rounded-full bg-[#406A56] flex items-center justify-center shadow-sm">
              <Sparkles size={16} className="text-white" />
            </div>
          </div>

          {/* Content with XP badge */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#406A56] text-white text-xs font-semibold">
                +{activity.xp} XP
              </span>
              <span className="text-xs text-[#406A56]/70">earned</span>
            </div>
            <p className="text-sm text-gray-700 leading-snug line-clamp-2">
              {activity.description}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {formatRelativeTime(activity.timestamp)}
            </p>
          </div>

          {/* Thumbnail */}
          {activity.thumbnail && (
            <div className="flex-shrink-0">
              <img 
                src={activity.thumbnail} 
                alt=""
                className="w-12 h-12 rounded-lg object-cover shadow-sm ring-1 ring-[#406A56]/20"
              />
            </div>
          )}
        </Link>
      </motion.div>
    )
  }

  // Regular activity
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link 
        href={activity.link}
        className="flex items-start gap-3 p-3 rounded-xl hover:bg-[#406A56]/5 transition-colors group"
      >
        {/* Avatar or Icon */}
        <div className="flex-shrink-0 relative">
          {activity.actor?.avatar_url ? (
            <div className="relative">
              <img 
                src={activity.actor.avatar_url} 
                alt={activity.actor.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
              />
              <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${config.bg} flex items-center justify-center shadow-sm`}>
                <Icon size={10} className={config.color} />
              </div>
            </div>
          ) : activity.actor ? (
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#406A56] to-[#4a7a64] flex items-center justify-center text-white font-medium text-sm shadow-sm">
                {activity.actor.name.charAt(0).toUpperCase()}
              </div>
              <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${config.bg} flex items-center justify-center shadow-sm`}>
                <Icon size={10} className={config.color} />
              </div>
            </div>
          ) : (
            <div className={`w-10 h-10 rounded-full ${config.bg} flex items-center justify-center`}>
              <Icon size={18} className={config.color} />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Show XP badge for non-new XP activities too */}
          {activity.xp && !activity.isNew && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#D9C61A]/20 text-[#8a7c08] text-[10px] font-semibold mb-1">
              <Sparkles size={8} />
              +{activity.xp} XP
            </span>
          )}
          <p className="text-sm text-gray-800 leading-snug line-clamp-2">
            {activity.description}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {formatRelativeTime(activity.timestamp)}
          </p>
        </div>

        {/* Thumbnail */}
        {activity.thumbnail && (
          <div className="flex-shrink-0">
            <img 
              src={activity.thumbnail} 
              alt=""
              className="w-12 h-12 rounded-lg object-cover shadow-sm group-hover:shadow-md transition-shadow"
            />
          </div>
        )}

        {/* Arrow indicator on hover */}
        <ChevronRight 
          size={16} 
          className="flex-shrink-0 text-gray-300 group-hover:text-[#406A56] transition-colors"
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
    <div className="bg-[#F2F1E5] rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#406A56]/10">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#406A56]/10 flex items-center justify-center">
            <Bell size={12} className="text-[#406A56]" />
          </div>
          <h3 className="text-sm font-semibold text-gray-800">Recent Activity</h3>
        </div>
        <button
          onClick={() => fetchActivities(true)}
          disabled={isRefreshing}
          className="p-1.5 rounded-lg hover:bg-[#406A56]/10 transition-colors disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw 
            size={14} 
            className={`text-[#406A56] ${isRefreshing ? 'animate-spin' : ''}`}
          />
        </button>
      </div>

      {/* Content */}
      <div className="divide-y divide-[#406A56]/5">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            >
              <Sparkles size={20} className="text-[#D9C61A]" />
            </motion.div>
            <span className="text-xs text-gray-400">Loading activity...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <Bell size={20} className="text-gray-300" />
            <span className="text-xs text-gray-400">{error}</span>
            <button
              onClick={() => fetchActivities()}
              className="text-xs text-[#406A56] hover:underline"
            >
              Try again
            </button>
          </div>
        ) : mergedActivities().length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <div className="w-12 h-12 rounded-full bg-[#406A56]/5 flex items-center justify-center">
              <Sparkles size={20} className="text-[#406A56]/40" />
            </div>
            <span className="text-sm text-gray-500">No recent activity</span>
            <span className="text-xs text-gray-400 text-center px-4">
              Complete prompts to earn XP and see your progress here!
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

      {/* Footer - See All */}
      {activities.length > 0 && (
        <div className="px-4 py-2 border-t border-[#406A56]/10 bg-[#406A56]/5">
          <Link 
            href="/dashboard/activity"
            className="flex items-center justify-center gap-1 text-xs text-[#406A56] hover:text-[#2d4d3d] transition-colors font-medium"
          >
            See all activity
            <ChevronRight size={12} />
          </Link>
        </div>
      )}
    </div>
  )
}
