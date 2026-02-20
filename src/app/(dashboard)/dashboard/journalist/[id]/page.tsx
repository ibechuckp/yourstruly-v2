'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  ChevronLeft, User, Play, Pause, Copy, Check,
  MessageSquare, FileText, Sparkles, Clock, 
  ExternalLink, Trash2, Send
} from 'lucide-react'
import Link from 'next/link'

interface Session {
  id: string
  title: string
  status: string
  access_token: string
  sent_via: string
  sent_at: string
  completed_at: string
  created_at: string
  contact: {
    id: string
    full_name: string
    phone: string
    email: string
  }
}

interface SessionQuestion {
  id: string
  question_text: string
  sort_order: number
  status: string
  video_response?: VideoResponse
}

interface VideoResponse {
  id: string
  question_id: string
  video_url: string
  duration: number
  transcript: string
  ai_summary: string
  ai_topics: string[]
  created_at: string
}

export default function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [session, setSession] = useState<Session | null>(null)
  const [questions, setQuestions] = useState<SessionQuestion[]>([])
  const [responses, setResponses] = useState<VideoResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [playingVideo, setPlayingVideo] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadSession()
  }, [id])

  const loadSession = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Load session
    const { data: sessionData } = await supabase
      .from('interview_sessions')
      .select(`
        *,
        contact:contacts(id, full_name, phone, email)
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!sessionData) {
      setLoading(false)
      return
    }

    setSession(sessionData)

    // Load questions
    const { data: questionsData } = await supabase
      .from('session_questions')
      .select('*')
      .eq('session_id', id)
      .order('sort_order')

    setQuestions(questionsData || [])

    // Load video responses
    const { data: responsesData } = await supabase
      .from('video_responses')
      .select('*')
      .eq('session_id', id)
      .order('created_at')

    setResponses(responsesData || [])
    setLoading(false)
  }

  const getInterviewLink = () => {
    return `${window.location.origin}/interview/${session?.access_token}`
  }

  const copyLink = () => {
    navigator.clipboard.writeText(getInterviewLink())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getQuestionResponse = (questionId: string) => {
    return responses.find(r => r.question_id === questionId)
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const handleDelete = async () => {
    if (!confirm('Delete this interview session? All responses will be lost.')) return

    await supabase.from('interview_sessions').delete().eq('id', id)
    window.location.href = '/dashboard/journalist'
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-400'
      case 'recording':
        return 'bg-blue-500/20 text-blue-400'
      case 'sent':
        return 'bg-amber-500/20 text-amber-400'
      default:
        return 'bg-gray-500/20 text-gray-400'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white/60">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/60 mb-4">Session not found</p>
          <Link href="/dashboard/journalist" className="text-amber-500 hover:underline">
            Back to interviews
          </Link>
        </div>
      </div>
    )
  }

  const answeredCount = responses.length
  const totalQuestions = questions.length
  const totalDuration = responses.reduce((sum, r) => sum + (r.duration || 0), 0)

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard/journalist" 
              className="p-2 bg-gray-900/90 rounded-xl text-white/70 hover:text-white transition-all border border-white/10"
            >
              <ChevronLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">{session.title}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-white/50 text-sm">with {session.contact?.full_name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${getStatusBadge(session.status)}`}>
                  {session.status}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={copyLink}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition-all"
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
              <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>
            <button
              onClick={handleDelete}
              className="p-2.5 bg-gray-900/90 text-white/50 hover:text-red-500 rounded-xl transition-all border border-white/10"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto">
        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-900/90 rounded-xl p-4 border border-white/10 text-center">
            <p className="text-white/50 text-sm">Questions</p>
            <p className="text-2xl font-bold text-white">{answeredCount}/{totalQuestions}</p>
          </div>
          <div className="bg-gray-900/90 rounded-xl p-4 border border-white/10 text-center">
            <p className="text-white/50 text-sm">Total Duration</p>
            <p className="text-2xl font-bold text-white">{formatDuration(totalDuration)}</p>
          </div>
          <div className="bg-gray-900/90 rounded-xl p-4 border border-white/10 text-center">
            <p className="text-white/50 text-sm">Created</p>
            <p className="text-lg font-medium text-white">{formatDate(session.created_at)}</p>
          </div>
        </div>

        {/* Share Link */}
        <div className="bg-gray-900/90 rounded-xl p-4 border border-white/10 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/50 text-sm mb-1">Interview Link</p>
              <p className="text-white text-sm font-mono truncate max-w-lg">{getInterviewLink()}</p>
            </div>
            <a
              href={getInterviewLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
            >
              <ExternalLink size={16} />
              Open
            </a>
          </div>
        </div>

        {/* Questions & Responses */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <MessageSquare size={18} className="text-amber-500" />
            Questions & Responses
          </h2>

          {questions.map((question, index) => {
            const response = getQuestionResponse(question.id)
            const hasResponse = !!response

            return (
              <div
                key={question.id}
                className={`bg-gray-900/90 rounded-xl border transition-all ${
                  hasResponse ? 'border-green-500/30' : 'border-white/10'
                }`}
              >
                {/* Question */}
                <div className="p-4 border-b border-white/10">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      hasResponse ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/50'
                    }`}>
                      {index + 1}
                    </div>
                    <p className="text-white flex-1">{question.question_text}</p>
                  </div>
                </div>

                {/* Response */}
                {response ? (
                  <div className="p-4">
                    {/* Video Player */}
                    {response.video_url && (
                      <div className="mb-4">
                        <video
                          src={response.video_url}
                          controls
                          className="w-full max-h-80 rounded-lg bg-black"
                          onPlay={() => setPlayingVideo(response.id)}
                          onPause={() => setPlayingVideo(null)}
                        />
                        <div className="flex items-center gap-4 mt-2 text-white/50 text-sm">
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {formatDuration(response.duration)}
                          </span>
                          <span>{formatDate(response.created_at)}</span>
                        </div>
                      </div>
                    )}

                    {/* Transcript */}
                    {response.transcript && (
                      <div className="mb-4">
                        <div className="flex items-center gap-2 text-white/50 text-sm mb-2">
                          <FileText size={14} />
                          Transcript
                        </div>
                        <p className="text-white/80 text-sm bg-white/5 rounded-lg p-3">
                          {response.transcript}
                        </p>
                      </div>
                    )}

                    {/* AI Summary */}
                    {response.ai_summary && (
                      <div className="mb-4">
                        <div className="flex items-center gap-2 text-amber-500 text-sm mb-2">
                          <Sparkles size={14} />
                          AI Summary
                        </div>
                        <p className="text-white/80 text-sm bg-amber-500/10 rounded-lg p-3 border border-amber-500/20">
                          {response.ai_summary}
                        </p>
                      </div>
                    )}

                    {/* Topics */}
                    {response.ai_topics?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {response.ai_topics.map((topic, i) => (
                          <span key={i} className="px-2 py-1 bg-white/10 text-white/60 text-xs rounded-full">
                            {topic}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 text-center text-white/40">
                    <p className="text-sm">Awaiting response...</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
