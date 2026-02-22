'use client'

import React, { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ChevronLeft, Send, Calendar, Clock, CheckCircle, 
  Edit2, Trash2, Eye, User, Mail, Phone
} from 'lucide-react'
import Link from 'next/link'
import '@/styles/home.css'
import Modal from '@/components/ui/Modal'

interface PostScript {
  id: string
  title: string
  message: string | null
  recipient_name: string
  recipient_email: string | null
  recipient_phone: string | null
  delivery_type: 'date' | 'event' | 'after_passing'
  delivery_date: string | null
  delivery_event: string | null
  delivery_recurring: boolean
  requires_confirmation: boolean
  video_url: string | null
  status: 'draft' | 'scheduled' | 'sent' | 'opened'
  created_at: string
  sent_at: string | null
  opened_at: string | null
  recipient?: {
    id: string
    name: string
    relationship: string | null
    profile_photo_url: string | null
  } | null
  attachments?: Array<{
    id: string
    file_url: string
    file_type: string
    file_name: string
  }>
}

const EVENT_LABELS: Record<string, string> = {
  birthday: 'Birthday',
  wedding: 'Wedding',
  graduation: 'Graduation',
  anniversary: 'Anniversary',
  first_child: 'First Child',
  '18th_birthday': '18th Birthday',
  '21st_birthday': '21st Birthday',
  retirement: 'Retirement',
  tough_times: 'When Times Are Tough',
  proud_moment: 'When You\'re Proud',
  christmas: 'Christmas',
  new_year: 'New Year'
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Not set'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { 
    weekday: 'long',
    month: 'long', 
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
    case 'draft': return <Clock size={16} />
    case 'scheduled': return <Calendar size={16} />
    case 'sent': return <Send size={16} />
    case 'opened': return <CheckCircle size={16} />
    default: return <Clock size={16} />
  }
}

export default function PostScriptDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  
  const [postscript, setPostscript] = useState<PostScript | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchPostScript()
  }, [id])

  async function fetchPostScript() {
    setLoading(true)
    try {
      const res = await fetch(`/api/postscripts/${id}`)
      const data = await res.json()
      
      if (data.postscript) {
        setPostscript(data.postscript)
      }
    } catch (error) {
      console.error('Error fetching postscript:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/postscripts/${id}`, { method: 'DELETE' })
      if (res.ok) {
        router.push('/dashboard/postscripts')
      }
    } catch (error) {
      console.error('Error deleting postscript:', error)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#C35F33] border-t-transparent" />
      </div>
    )
  }

  if (!postscript) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">PostScript not found</p>
          <Link href="/dashboard/postscripts" className="text-[#C35F33] hover:underline">
            Back to PostScripts
          </Link>
        </div>
      </div>
    )
  }

  const initials = postscript.recipient_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="min-h-screen relative pb-24">
      {/* Warm background */}
      <div className="home-background">
        <div className="home-blob home-blob-1" />
        <div className="home-blob home-blob-2" />
        <div className="home-blob home-blob-3" />
      </div>

      <div className="relative z-10 p-6 max-w-2xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <Link 
            href="/dashboard/postscripts" 
            className="flex items-center gap-2 px-3 py-2 bg-white/80 backdrop-blur-sm rounded-xl 
                     text-gray-600 hover:text-gray-900 transition-all border border-gray-200 shadow-sm"
          >
            <ChevronLeft size={18} />
            <span>Back</span>
          </Link>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push(`/dashboard/postscripts/new?edit=${id}`)}
              className="p-2.5 bg-white/80 backdrop-blur-sm text-gray-400 hover:text-gray-700 
                       rounded-xl transition-all border border-gray-200 shadow-sm"
            >
              <Edit2 size={18} />
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2.5 bg-white/80 backdrop-blur-sm text-gray-400 hover:text-red-500 
                       rounded-xl transition-all border border-gray-200 shadow-sm"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </header>

        {/* Main Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl overflow-hidden shadow-sm">
          {/* Hero Section */}
          <div className="bg-gradient-to-br from-[#C35F33] to-[#D9C61A] p-6 text-white">
            <div className="flex items-start gap-4">
              {/* Recipient Avatar */}
              {postscript.recipient?.profile_photo_url ? (
                <img 
                  src={postscript.recipient.profile_photo_url} 
                  alt={postscript.recipient_name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-white/30"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center 
                              text-white font-semibold text-xl border-2 border-white/30">
                  {initials}
                </div>
              )}
              
              <div className="flex-1">
                <h1 className="text-2xl font-bold mb-1">{postscript.title}</h1>
                <p className="text-white/80">
                  To: {postscript.recipient_name}
                  {postscript.recipient?.relationship && (
                    <span className="text-white/60"> • {postscript.recipient.relationship}</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Status & Delivery Info */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex flex-wrap gap-4">
              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(postscript.status)}`}>
                  {getStatusIcon(postscript.status)}
                  <span className="capitalize">{postscript.status}</span>
                </span>
              </div>

              {/* Delivery Info */}
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar size={16} />
                <span className="text-sm">
                  {postscript.delivery_type === 'date' 
                    ? formatDate(postscript.delivery_date)
                    : postscript.delivery_type === 'after_passing'
                      ? "After I'm gone"
                      : EVENT_LABELS[postscript.delivery_event || ''] || postscript.delivery_event
                  }
                </span>
              </div>

              {postscript.delivery_recurring && (
                <span className="text-sm text-amber-600 flex items-center gap-1">
                  🔄 Repeats annually
                </span>
              )}
            </div>
          </div>

          {/* Recipient Details */}
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-3">Recipient Details</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-gray-700">
                <User size={16} className="text-gray-400" />
                <span>{postscript.recipient_name}</span>
              </div>
              {postscript.recipient_email && (
                <div className="flex items-center gap-3 text-gray-700">
                  <Mail size={16} className="text-gray-400" />
                  <span>{postscript.recipient_email}</span>
                </div>
              )}
              {postscript.recipient_phone && (
                <div className="flex items-center gap-3 text-gray-700">
                  <Phone size={16} className="text-gray-400" />
                  <span>{postscript.recipient_phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Message Content */}
          <div className="p-6">
            <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-3">Message</h3>
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap">{postscript.message || 'No message content'}</p>
            </div>
          </div>

          {/* Video if exists */}
          {postscript.video_url && (
            <div className="p-6 border-t border-gray-100">
              <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-3">Video Message</h3>
              <video 
                src={postscript.video_url} 
                controls 
                className="w-full rounded-xl"
              />
            </div>
          )}

          {/* Attachments */}
          {postscript.attachments && postscript.attachments.length > 0 && (
            <div className="p-6 border-t border-gray-100">
              <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-3">Attachments</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {postscript.attachments.map(att => (
                  <div key={att.id} className="bg-gray-50 rounded-xl p-3">
                    <a 
                      href={att.file_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-[#C35F33] hover:underline truncate block"
                    >
                      {att.file_name || 'Attachment'}
                    </a>
                    <p className="text-xs text-gray-500">{att.file_type}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="p-6 bg-gray-50 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Created</p>
                <p className="text-gray-700">{formatDate(postscript.created_at)}</p>
              </div>
              {postscript.sent_at && (
                <div>
                  <p className="text-gray-500">Sent</p>
                  <p className="text-gray-700">{formatDate(postscript.sent_at)}</p>
                </div>
              )}
              {postscript.opened_at && (
                <div>
                  <p className="text-gray-500">Opened</p>
                  <p className="text-gray-700">{formatDate(postscript.opened_at)}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Preview Button */}
        <div className="mt-6 flex justify-center">
          <button className="flex items-center gap-2 px-6 py-3 bg-white/80 backdrop-blur-sm 
                           text-gray-700 rounded-xl font-medium hover:bg-white transition-colors
                           border border-gray-200 shadow-sm">
            <Eye size={18} />
            Preview as Recipient
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={showDeleteConfirm} 
        onClose={() => setShowDeleteConfirm(false)} 
        title="Delete PostScript"
      >
        <p className="text-white/70 mb-6">
          Are you sure you want to delete "{postscript.title}"? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setShowDeleteConfirm(false)}
            className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50"
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
