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
  Sparkles,
  ArrowLeft,
  Filter
} from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow, format } from 'date-fns'

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

const ACTIVITY_ICONS: Record<string, { icon: typeof Heart; color: string; bg: string; label: string }> = {
  memory_shared: { icon: Image, color: 'text-amber-600', bg: 'bg-amber-100', label: 'Memories' },
  wisdom_shared: { icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-100', label: 'Wisdom' },
  circle_message: { icon: MessageCircle, color: 'text-[#406A56]', bg: 'bg-[#406A56]/10', label: 'Messages' },
  circle_invite: { icon: Users, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Invites' },
  circle_content: { icon: Heart, color: 'text-rose-600', bg: 'bg-rose-100', label: 'Shared' },
  wisdom_comment: { icon: MessageCircle, color: 'text-purple-600', bg: 'bg-purple-100', label: 'Comments' },
}

function formatRelativeTime(timestamp: string): string {
  try {
    const date = new Date(timestamp)
    const now = new Date()
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffHours < 24) {
      return formatDistanceToNow(date, { addSuffix: true })
    } else if (diffHours < 48) {
      return 'Yesterday'
    } else {
      return format(date, 'MMM d, yyyy')
    }
  } catch {
    return 'recently'
  }
}

function ActivityItemCard({ activity, index }: { activity: ActivityItem; index: number }) {
  const config = ACTIVITY_ICONS[activity.type] || ACTIVITY_ICONS.memory_shared
  const Icon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <Link 
        href={activity.link}
        className="flex items-start gap-4 p-4 rounded-2xl bg-white/70 backdrop-blur-sm border border-[#406A56]/10 hover:bg-white hover:shadow-md transition-all group"
      >
        {/* Avatar or Icon */}
        <div className="flex-shrink-0 relative">
          {activity.actor?.avatar_url ? (
            <div className="relative">
              <img 
                src={activity.actor.avatar_url} 
                alt={activity.actor.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
              />
              <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full ${config.bg} flex items-center justify-center shadow-sm border border-white`}>
                <Icon size={12} className={config.color} />
              </div>
            </div>
          ) : activity.actor ? (
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#406A56] to-[#4a7a64] flex items-center justify-center text-white font-semibold text-lg shadow-sm">
                {activity.actor.name.charAt(0).toUpperCase()}
              </div>
              <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full ${config.bg} flex items-center justify-center shadow-sm border border-white`}>
                <Icon size={12} className={config.color} />
              </div>
            </div>
          ) : (
            <div className={`w-12 h-12 rounded-full ${config.bg} flex items-center justify-center`}>
              <Icon size={20} className={config.color} />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 leading-snug">
            {activity.description}
          </p>
          {activity.title && activity.title !== activity.description && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-1">
              {activity.title}
            </p>
          )}
          <p className="text-xs text-gray-400 mt-2">
            {formatRelativeTime(activity.timestamp)}
          </p>
        </div>

        {/* Thumbnail */}
        {activity.thumbnail && (
          <div className="flex-shrink-0">
            <img 
              src={activity.thumbnail} 
              alt=""
              className="w-16 h-16 rounded-xl object-cover shadow-sm group-hover:shadow-md transition-shadow"
            />
          </div>
        )}

        {/* Arrow */}
        <ChevronRight 
          size={20} 
          className="flex-shrink-0 text-gray-300 group-hover:text-[#406A56] transition-colors"
        />
      </Link>
    </motion.div>
  )
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string | null>(null)

  const fetchActivities = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true)
    else setIsLoading(true)
    
    try {
      const res = await fetch('/api/activity?limit=50')
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

  const filteredActivities = filter 
    ? activities.filter(a => a.type === filter)
    : activities

  const filterOptions = Object.entries(ACTIVITY_ICONS).map(([type, config]) => ({
    type,
    ...config
  }))

  return (
    <div className="pb-8 pb-24">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#F2F1E5] via-[#FAF7E8] to-[#F5EFE0] -z-10" />

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard"
              className="p-2 rounded-xl bg-white/70 hover:bg-white border border-[#406A56]/10 transition-colors"
            >
              <ArrowLeft size={20} className="text-[#406A56]" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Activity</h1>
              <p className="text-sm text-gray-500">
                {activities.length} recent updates
              </p>
            </div>
          </div>
          <button
            onClick={() => fetchActivities(true)}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-white/70 hover:bg-white border border-[#406A56]/10 transition-colors disabled:opacity-50"
          >
            <RefreshCw 
              size={18} 
              className={`text-[#406A56] ${isRefreshing ? 'animate-spin' : ''}`}
            />
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setFilter(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex-shrink-0 ${
              filter === null 
                ? 'bg-[#406A56] text-white' 
                : 'bg-white/70 text-gray-600 hover:bg-white border border-[#406A56]/10'
            }`}
          >
            All
          </button>
          {filterOptions.map(opt => {
            const Icon = opt.icon
            return (
              <button
                key={opt.type}
                onClick={() => setFilter(filter === opt.type ? null : opt.type)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex-shrink-0 flex items-center gap-2 ${
                  filter === opt.type 
                    ? 'bg-[#406A56] text-white' 
                    : 'bg-white/70 text-gray-600 hover:bg-white border border-[#406A56]/10'
                }`}
              >
                <Icon size={14} />
                {opt.label}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles size={28} className="text-[#D9C61A]" />
              </motion.div>
              <span className="text-sm text-gray-400">Loading activity...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Bell size={32} className="text-gray-300" />
              <span className="text-sm text-gray-400">{error}</span>
              <button
                onClick={() => fetchActivities()}
                className="text-sm text-[#406A56] hover:underline"
              >
                Try again
              </button>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-16 h-16 rounded-full bg-[#406A56]/5 flex items-center justify-center">
                <Sparkles size={28} className="text-[#406A56]/40" />
              </div>
              <span className="text-lg text-gray-500">
                {filter ? 'No activity in this category' : 'No recent activity'}
              </span>
              <span className="text-sm text-gray-400 text-center max-w-md">
                Activity from shared memories, wisdom, and circles will appear here
              </span>
            </div>
          ) : (
            <AnimatePresence>
              {filteredActivities.map((activity, index) => (
                <ActivityItemCard 
                  key={activity.id} 
                  activity={activity} 
                  index={index}
                />
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  )
}
