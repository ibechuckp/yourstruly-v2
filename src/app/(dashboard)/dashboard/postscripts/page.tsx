'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Send, Calendar, Clock, CheckCircle, Mail, Plus,
  ChevronRight, Sparkles, Heart, User
} from 'lucide-react'
import Link from 'next/link'
import '@/styles/home.css'

interface PostScript {
  id: string
  title: string
  message: string | null
  recipient_name: string
  recipient_email: string | null
  delivery_type: 'date' | 'event' | 'after_passing'
  delivery_date: string | null
  delivery_event: string | null
  status: 'draft' | 'scheduled' | 'sent' | 'opened'
  created_at: string
  recipient?: {
    id: string
    full_name: string
    relationship_type: string | null
    avatar_url: string | null
  } | null
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Not scheduled'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  })
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'draft': return 'bg-gray-200 text-gray-700'
    case 'scheduled': return 'bg-amber-100 text-amber-700'
    case 'sent': return 'bg-blue-100 text-blue-700'
    case 'opened': return 'bg-green-100 text-green-700'
    default: return 'bg-gray-200 text-gray-700'
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'draft': return <Clock size={14} />
    case 'scheduled': return <Calendar size={14} />
    case 'sent': return <Send size={14} />
    case 'opened': return <CheckCircle size={14} />
    default: return <Clock size={14} />
  }
}

function PostScriptCard({ postscript }: { postscript: PostScript }) {
  const initials = postscript.recipient_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <Link href={`/dashboard/postscripts/${postscript.id}`}>
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 border border-gray-100 
                      shadow-sm hover:shadow-md transition-all group cursor-pointer">
        <div className="flex items-start gap-4">
          {/* Recipient Avatar */}
          <div className="flex-shrink-0">
            {postscript.recipient?.avatar_url ? (
              <img 
                src={postscript.recipient.avatar_url} 
                alt={postscript.recipient_name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#C35F33] to-[#D9C61A] 
                              flex items-center justify-center text-white font-medium">
                {initials}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-gray-900 truncate group-hover:text-[#C35F33] transition-colors">
                {postscript.title}
              </h3>
              <ChevronRight size={18} className="text-gray-400 group-hover:text-[#C35F33] transition-colors" />
            </div>
            
            <p className="text-sm text-gray-600 mb-2">
              To: {postscript.recipient_name}
              {postscript.recipient?.relationship_type && (
                <span className="text-gray-400"> • {postscript.recipient.relationship_type.replace(/_/g, ' ')}</span>
              )}
            </p>

            <div className="flex items-center gap-3 text-xs">
              {/* Status Badge */}
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${getStatusColor(postscript.status)}`}>
                {getStatusIcon(postscript.status)}
                <span className="capitalize">{postscript.status}</span>
              </span>

              {/* Delivery Info */}
              <span className="text-gray-500 flex items-center gap-1">
                <Calendar size={12} />
                {postscript.delivery_type === 'date' 
                  ? formatDate(postscript.delivery_date)
                  : postscript.delivery_type === 'after_passing'
                    ? 'After I\'m gone'
                    : postscript.delivery_event || 'Event'
                }
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function PostScriptsPage() {
  const [postscripts, setPostscripts] = useState<PostScript[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [stats, setStats] = useState({ total: 0, scheduled: 0, sent: 0, opened: 0 })

  useEffect(() => {
    fetchPostScripts()
  }, [filter])

  async function fetchPostScripts() {
    setLoading(true)
    try {
      const url = filter === 'all' 
        ? '/api/postscripts' 
        : `/api/postscripts?status=${filter}`
      
      const res = await fetch(url)
      const data = await res.json()
      
      if (data.postscripts) {
        setPostscripts(data.postscripts)
        
        // Calculate stats from all data
        if (filter === 'all') {
          const s = data.postscripts.reduce((acc: any, ps: PostScript) => {
            acc.total++
            acc[ps.status] = (acc[ps.status] || 0) + 1
            return acc
          }, { total: 0, draft: 0, scheduled: 0, sent: 0, opened: 0 })
          setStats(s)
        }
      }
    } catch (error) {
      console.error('Error fetching postscripts:', error)
    } finally {
      setLoading(false)
    }
  }

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'draft', label: 'Drafts' },
    { key: 'scheduled', label: 'Scheduled' },
    { key: 'sent', label: 'Sent' },
    { key: 'opened', label: 'Opened' }
  ]

  return (
    <div className="min-h-screen relative pb-24">
      {/* Warm background */}
      <div className="home-background">
        <div className="home-blob home-blob-1" />
        <div className="home-blob home-blob-2" />
        <div className="home-blob home-blob-3" />
      </div>

      <div className="relative z-10 p-6">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#C35F33] to-[#D9C61A] 
                              flex items-center justify-center shadow-lg">
                <Send size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Future Messages</h1>
                <p className="text-gray-600 text-sm">Schedule messages for your loved ones</p>
              </div>
            </div>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-gray-100">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-gray-100">
            <div className="text-2xl font-bold text-amber-600">{stats.scheduled || 0}</div>
            <div className="text-xs text-gray-500">Scheduled</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-gray-100">
            <div className="text-2xl font-bold text-blue-600">{stats.sent || 0}</div>
            <div className="text-xs text-gray-500">Sent</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-gray-100">
            <div className="text-2xl font-bold text-green-600">{stats.opened || 0}</div>
            <div className="text-xs text-gray-500">Opened</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all
                ${filter === f.key 
                  ? 'bg-[#C35F33] text-white' 
                  : 'bg-white/80 text-gray-600 hover:bg-white'
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* PostScript List */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#C35F33] border-t-transparent" />
            </div>
          ) : postscripts.length === 0 ? (
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-[#C35F33]/10 flex items-center justify-center mx-auto mb-4">
                <Mail size={32} className="text-[#C35F33]" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No messages yet</h3>
              <p className="text-gray-600 mb-6">
                Create your first future message to send to a loved one.
              </p>
              <Link 
                href="/dashboard/postscripts/new"
                className="inline-flex items-center gap-2 bg-[#C35F33] text-white px-6 py-3 rounded-full 
                           font-medium hover:bg-[#A84E2A] transition-colors"
              >
                <Plus size={20} />
                Create PostScript
              </Link>
            </div>
          ) : (
            postscripts.map(ps => (
              <PostScriptCard key={ps.id} postscript={ps} />
            ))
          )}
        </div>

        {/* FAB */}
        {postscripts.length > 0 && (
          <Link
            href="/dashboard/postscripts/new"
            className="fixed bottom-24 right-6 w-14 h-14 bg-[#C35F33] text-white rounded-full 
                       flex items-center justify-center shadow-lg hover:bg-[#A84E2A] 
                       transition-colors z-20"
          >
            <Plus size={28} />
          </Link>
        )}
      </div>
    </div>
  )
}
