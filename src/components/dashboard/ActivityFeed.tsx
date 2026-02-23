'use client'

import { useState, useEffect } from 'react'
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
  Sparkles
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
  type: 'memory_shared' | 'wisdom_shared' | 'circle_message' | 'circle_invite' | 'circle_content' | 'wisdom_comment'
  title: string
  description: string
  timestamp: string
  actor?: ActivityActor
  thumbnail?: string
  link: string
  metadata?: Record<string, any>
}

const ACTIVITY_ICONS: Record<string, { icon: typeof Heart; color: string; bg: string }> = {
  memory_shared: { icon: Image, color: 'text-amber-600', bg: 'bg-amber-100' },
  wisdom_shared: { icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-100' },
  circle_message: { icon: MessageCircle, color: 'text-[#406A56]', bg: 'bg-[#406A56]/10' },
  circle_invite: { icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
  circle_content: { icon: Heart, color: 'text-rose-600', bg: 'bg-rose-100' },
  wisdom_comment: { icon: MessageCircle, color: 'text-purple-600', bg: 'bg-purple-100' },
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

export default function ActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-[#406A56]/10 shadow-sm overflow-hidden">
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
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <div className="w-12 h-12 rounded-full bg-[#406A56]/5 flex items-center justify-center">
              <Sparkles size={20} className="text-[#406A56]/40" />
            </div>
            <span className="text-sm text-gray-500">No recent activity</span>
            <span className="text-xs text-gray-400 text-center px-4">
              Activity from shared memories, wisdom, and circles will appear here
            </span>
          </div>
        ) : (
          <AnimatePresence>
            {activities.map((activity, index) => (
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
