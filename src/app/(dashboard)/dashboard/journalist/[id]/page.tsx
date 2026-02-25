'use client'

import { useState, useEffect, use } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronLeft, User, Play, Copy, Check,
  MessageSquare, FileText, Sparkles, Clock, 
  ExternalLink, Trash2, Plus, X, CheckCircle, RefreshCw, Send
} from 'lucide-react'
import Link from 'next/link'

interface Session {
  id: string
  title: string
  status: string
  access_token: string
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
  audio_url: string
  text_response: string
  transcript: string
  duration: number
  ai_summary: string
  created_at: string
}

interface QuestionBankItem {
  id: string
  question_text: string
  category: string
  is_favorite: boolean
}

const CATEGORIES = [
  { id: 'childhood', label: 'Childhood', emoji: '💒' },
  { id: 'relationships', label: 'Relationships', emoji: '❤️' },
  { id: 'career', label: 'Career', emoji: '💼' },
  { id: 'wisdom', label: 'Wisdom', emoji: '🦉' },
  { id: 'adversity', label: 'Challenges', emoji: '💪' },
  { id: 'fun', label: 'Fun', emoji: '🎉' },
  { id: 'custom', label: 'My Questions', emoji: '✨' },
]

export default function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const searchParams = useSearchParams()
  const [session, setSession] = useState<Session | null>(null)
  const [questions, setQuestions] = useState<SessionQuestion[]>([])
  const [responses, setResponses] = useState<VideoResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  
  // Follow-up modal state
  const [showFollowupModal, setShowFollowupModal] = useState(false)
  const [questionBank, setQuestionBank] = useState<QuestionBankItem[]>([])
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [customQuestion, setCustomQuestion] = useState('')
  const [sendingFollowup, setSendingFollowup] = useState(false)
  
  const supabase = createClient()

  useEffect(() => {
    loadSession()
  }, [id])

  // Auto-open follow-up modal if ?followup=true
  useEffect(() => {
    if (searchParams.get('followup') === 'true' && session) {
      openFollowupModal()
    }
  }, [searchParams, session])

  const loadSession = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: sessionData } = await supabase
      .from('interview_sessions')
      .select(`*, contact:contacts(id, full_name, phone, email)`)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!sessionData) {
      setLoading(false)
      return
    }

    setSession(sessionData)

    const { data: questionsData } = await supabase
      .from('session_questions')
      .select('*')
      .eq('session_id', id)
      .order('sort_order')

    setQuestions(questionsData || [])

    const { data: responsesData } = await supabase
      .from('video_responses')
      .select('*')
      .eq('session_id', id)
      .order('created_at')

    setResponses(responsesData || [])
    setLoading(false)
  }

  const loadQuestionBank = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('interview_questions')
      .select('id, question_text, category, is_favorite')
      .or(`user_id.eq.${user.id},is_system.eq.true`)
      .order('is_favorite', { ascending: false })
      .order('use_count', { ascending: false })

    if (data) {
      const existingQuestionTexts = questions.map(q => q.question_text)
      setQuestionBank(data.filter(q => !existingQuestionTexts.includes(q.question_text)))
    }
  }

  const openFollowupModal = () => {
    loadQuestionBank()
    setShowFollowupModal(true)
  }

  const sendFollowupQuestion = async () => {
    if (!session || (!selectedQuestion && !customQuestion.trim())) return

    setSendingFollowup(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    try {
      const questionText = selectedQuestion 
        ? questionBank.find(q => q.id === selectedQuestion)?.question_text 
        : customQuestion.trim()

      // Save custom question if provided
      let questionId = selectedQuestion
      if (customQuestion.trim() && !selectedQuestion) {
        const { data: savedQuestion } = await supabase
          .from('interview_questions')
          .insert({
            user_id: user.id,
            question_text: customQuestion.trim(),
            category: 'custom',
            is_system: false
          })
          .select()
          .single()
        questionId = savedQuestion?.id
      }

      await supabase.from('session_questions').insert({
        session_id: session.id,
        question_id: questionId,
        question_text: questionText,
        sort_order: questions.length,
        status: 'pending'
      })

      await supabase
        .from('interview_sessions')
        .update({ status: 'sent' })
        .eq('id', session.id)

      // Send notification
      await fetch('/api/interviews/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          type: 'followup',
          contactEmail: session.contact?.email,
          contactPhone: session.contact?.phone,
          contactName: session.contact?.full_name
        })
      })

      setShowFollowupModal(false)
      setSelectedQuestion(null)
      setCustomQuestion('')
      loadSession()
    } catch (error) {
      console.error('Error sending followup:', error)
      alert('Failed to send follow-up question')
    } finally {
      setSendingFollowup(false)
    }
  }

  const getInterviewLink = () => `${window.location.origin}/interview/${session?.access_token}`

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
    })
  }

  const handleDelete = async () => {
    if (!confirm('Delete this interview? All responses will be lost.')) return
    await supabase.from('interview_sessions').delete().eq('id', id)
    window.location.href = '/dashboard/journalist'
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-[#406A56]/10 text-[#406A56]'
      case 'recording': return 'bg-blue-50 text-blue-600'
      case 'sent': return 'bg-[#D9C61A]/10 text-[#9a8c12]'
      default: return 'bg-gray-100 text-gray-500'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F2F1E5] flex items-center justify-center">
        <div className="text-[#666]">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#F2F1E5] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#666] mb-4">Session not found</p>
          <Link href="/dashboard/journalist" className="text-[#C35F33] hover:underline">
            Back to interviews
          </Link>
        </div>
      </div>
    )
  }

  const answeredCount = responses.length
  const totalDuration = responses.reduce((sum, r) => sum + (r.duration || 0), 0)

  return (
    <div className="min-h-screen bg-[#F2F1E5]">
      {/* Header */}
      <header className="px-6 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/dashboard/journalist" 
                className="p-2.5 bg-white/80 backdrop-blur-sm rounded-xl text-[#406A56] hover:bg-white transition-all shadow-sm"
              >
                <ChevronLeft size={20} />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-[#2d2d2d]">{session.title}</h1>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[#888] text-sm">with {session.contact?.full_name}</span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${getStatusStyle(session.status)}`}>
                    {session.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={openFollowupModal}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#4A3552] hover:bg-[#5d4466] text-white rounded-xl transition-all shadow-sm"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">Ask More</span>
              </button>
              <button
                onClick={copyLink}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#D9C61A]/20 hover:bg-[#D9C61A]/30 text-[#9a8c12] rounded-xl transition-all"
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
                <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>
              <button
                onClick={handleDelete}
                className="p-2.5 bg-white/80 text-[#888] hover:text-red-500 rounded-xl transition-all shadow-sm"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="px-6 pb-12">
        <div className="max-w-4xl mx-auto">
          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center shadow-sm">
              <p className="text-[#888] text-sm">Answered</p>
              <p className="text-2xl font-bold text-[#2d2d2d]">{answeredCount}/{questions.length}</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center shadow-sm">
              <p className="text-[#888] text-sm">Duration</p>
              <p className="text-2xl font-bold text-[#2d2d2d]">{formatDuration(totalDuration)}</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center shadow-sm">
              <p className="text-[#888] text-sm">Created</p>
              <p className="text-lg font-semibold text-[#2d2d2d]">{formatDate(session.created_at)}</p>
            </div>
          </div>

          {/* Interview Link */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 mb-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#888] text-sm mb-1">Interview Link</p>
                <p className="text-[#2d2d2d] text-sm font-mono truncate max-w-lg">{getInterviewLink()}</p>
              </div>
              <a
                href={getInterviewLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 bg-[#406A56]/10 hover:bg-[#406A56]/20 text-[#406A56] rounded-lg transition-all"
              >
                <ExternalLink size={16} />
                Open
              </a>
            </div>
          </div>

          {/* Questions & Responses */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-[#2d2d2d] flex items-center gap-2">
              <MessageSquare size={18} className="text-[#4A3552]" />
              Questions & Responses
            </h2>

            {questions.map((question, index) => {
              const response = getQuestionResponse(question.id)
              const hasResponse = !!response

              return (
                <motion.div
                  key={question.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-white/80 backdrop-blur-sm rounded-xl overflow-hidden shadow-sm ${
                    hasResponse ? 'ring-2 ring-[#406A56]/20' : ''
                  }`}
                >
                  {/* Question */}
                  <div className="p-5 border-b border-gray-100">
                    <div className="flex items-start gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                        hasResponse ? 'bg-[#406A56] text-white' : 'bg-gray-100 text-[#888]'
                      }`}>
                        {hasResponse ? <CheckCircle size={16} /> : index + 1}
                      </div>
                      <p className="text-[#2d2d2d] flex-1 leading-relaxed">{question.question_text}</p>
                    </div>
                  </div>

                  {/* Response */}
                  {response ? (
                    <div className="p-5 bg-[#406A56]/5">
                      {/* Video/Audio Player */}
                      {response.video_url && (
                        <div className="mb-4">
                          <video
                            src={response.video_url}
                            controls
                            className="w-full max-h-80 rounded-lg bg-black"
                          />
                        </div>
                      )}
                      
                      {response.audio_url && !response.video_url && (
                        <div className="mb-4 p-4 bg-white rounded-lg flex items-center gap-4">
                          <Play size={20} className="text-[#4A3552]" />
                          <audio src={response.audio_url} controls className="flex-1" />
                          <span className="text-[#888] text-sm">{formatDuration(response.duration)}</span>
                        </div>
                      )}

                      {/* Transcript */}
                      {(response.transcript || response.text_response) && (
                        <div className="mb-4">
                          <div className="flex items-center gap-2 text-[#888] text-sm mb-2">
                            <FileText size={14} />
                            Response
                          </div>
                          <p className="text-[#2d2d2d] text-sm bg-white rounded-lg p-4 leading-relaxed">
                            {response.transcript || response.text_response}
                          </p>
                        </div>
                      )}

                      {/* AI Summary */}
                      {response.ai_summary && (
                        <div className="flex items-start gap-2 p-3 bg-[#D9C61A]/10 rounded-lg">
                          <Sparkles size={14} className="text-[#9a8c12] mt-0.5" />
                          <p className="text-sm text-[#666]">{response.ai_summary}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-5 text-center text-[#888]">
                      <Clock size={20} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Awaiting response...</p>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>
      </main>

      {/* Follow-up Modal */}
      <AnimatePresence>
        {showFollowupModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowFollowupModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#F2F1E5] rounded-2xl max-w-lg w-full max-h-[80vh] overflow-hidden shadow-xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center px-6 py-4 border-b border-[#E8E7DC]">
                <h3 className="text-lg font-semibold text-[#2d2d2d]">Ask a Follow-up Question</h3>
                <button 
                  onClick={() => setShowFollowupModal(false)}
                  className="p-2 hover:bg-white/50 rounded-lg transition-all"
                >
                  <X size={20} className="text-[#666]" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {/* Custom Question at TOP */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-[#2d2d2d] mb-2">
                    Write your own question:
                  </label>
                  <textarea
                    value={customQuestion}
                    onChange={(e) => { setCustomQuestion(e.target.value); setSelectedQuestion(null); setSelectedCategory(null) }}
                    placeholder="What's a story you've never told anyone?"
                    rows={2}
                    className="w-full px-4 py-3 bg-white border border-[#E8E7DC] rounded-xl text-[#2d2d2d] placeholder-[#aaa] focus:outline-none focus:ring-2 focus:ring-[#406A56] resize-none"
                  />
                </div>

                {/* Or divider */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px bg-[#E8E7DC]" />
                  <span className="text-[#888] text-xs">or browse by category</span>
                  <div className="flex-1 h-px bg-[#E8E7DC]" />
                </div>

                {/* Horizontal Scrollable Categories */}
                <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => { setSelectedCategory(cat.id); setCustomQuestion('') }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                        selectedCategory === cat.id
                          ? 'bg-[#4A3552] text-white'
                          : 'bg-white/70 text-[#2d2d2d] hover:bg-white'
                      }`}
                    >
                      <span>{cat.emoji}</span>
                      <span className="text-sm font-medium">{cat.label}</span>
                    </button>
                  ))}
                </div>

                {/* Question Bank - filtered by category */}
                {selectedCategory && (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {questionBank
                      .filter(q => selectedCategory === 'custom' ? !q.is_favorite : q.category === selectedCategory)
                      .slice(0, 8)
                      .map((question) => (
                      <button
                        key={question.id}
                        onClick={() => { setSelectedQuestion(question.id); setCustomQuestion('') }}
                        className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all ${
                          selectedQuestion === question.id
                            ? 'bg-[#406A56]/10 ring-2 ring-[#406A56]'
                            : 'bg-white/70 hover:bg-white'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          selectedQuestion === question.id
                            ? 'border-[#406A56] bg-[#406A56]'
                            : 'border-[#ccc]'
                        }`}>
                          {selectedQuestion === question.id && <CheckCircle size={12} className="text-white" />}
                        </div>
                        <span className="text-sm text-[#2d2d2d]">{question.question_text}</span>
                      </button>
                    ))}
                    {questionBank.filter(q => selectedCategory === 'custom' ? !q.is_favorite : q.category === selectedCategory).length === 0 && (
                      <p className="text-center text-[#888] text-sm py-4">No questions in this category</p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#E8E7DC] bg-white/50">
                <button
                  onClick={() => setShowFollowupModal(false)}
                  className="px-4 py-2.5 text-[#666] hover:text-[#2d2d2d] rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={sendFollowupQuestion}
                  disabled={sendingFollowup || (!selectedQuestion && !customQuestion.trim())}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#406A56] hover:bg-[#4a7a64] disabled:opacity-50 text-white rounded-xl transition-all"
                >
                  {sendingFollowup ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Send Question
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
