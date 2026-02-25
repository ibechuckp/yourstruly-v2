'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Video, Plus, Clock, CheckCircle, ChevronLeft, User, Play,
  Sparkles, ExternalLink, X, Search, Heart
} from 'lucide-react'
import Link from 'next/link'

interface Contact {
  id: string
  full_name: string
  phone: string
  email: string
}

interface Question {
  id: string
  question_text: string
  category: string
  is_system: boolean
  is_favorite: boolean
}

interface Session {
  id: string
  title: string
  status: string
  access_token: string
  created_at: string
  contact: {
    id: string
    full_name: string
  }
  session_questions: {
    id: string
    question_text: string
    status: string
  }[]
  video_responses: {
    id: string
    duration: number
    ai_summary: string
  }[]
}

const CATEGORIES = [
  { id: 'childhood', label: 'Childhood', emoji: '💒' },
  { id: 'relationships', label: 'Relationships', emoji: '❤️' },
  { id: 'career', label: 'Career', emoji: '💼' },
  { id: 'wisdom', label: 'Wisdom', emoji: '🦉' },
  { id: 'adversity', label: 'Challenges', emoji: '💪' },
  { id: 'fun', label: 'Fun', emoji: '🎉' },
  { id: 'history', label: 'History', emoji: '📜' },
  { id: 'spirituality', label: 'Faith', emoji: '🙏' },
  { id: 'custom', label: 'My Questions', emoji: '✨' },
]

export default function JournalistPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  
  // Modal state
  const [showNewSession, setShowNewSession] = useState(false)
  const [step, setStep] = useState<'contact' | 'question'>('contact')
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null) // Single question
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [sessionTitle, setSessionTitle] = useState('')
  const [customQuestion, setCustomQuestion] = useState('')
  const [creating, setCreating] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [sessionsRes, contactsRes, questionsRes] = await Promise.all([
      supabase
        .from('interview_sessions')
        .select(`
          *, contact:contacts(id, full_name),
          session_questions(id, question_text, status),
          video_responses(id, duration, ai_summary)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('contacts')
        .select('id, full_name, phone, email')
        .eq('user_id', user.id)
        .order('full_name'),
      supabase
        .from('interview_questions')
        .select('*')
        .or(`user_id.eq.${user.id},is_system.eq.true`)
        .order('category'),
    ])

    setSessions(sessionsRes.data || [])
    setContacts(contactsRes.data || [])
    setQuestions(questionsRes.data || [])
    setLoading(false)
  }

  const filteredQuestions = selectedCategory 
    ? questions.filter(q => 
        selectedCategory === 'custom' ? !q.is_system : q.category === selectedCategory
      )
    : []

  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact)
    setStep('question')
  }

  const handleSelectQuestion = (questionId: string) => {
    setSelectedQuestion(questionId === selectedQuestion ? null : questionId)
  }

  const handleCreateSession = async () => {
    if (!selectedContact || (!selectedQuestion && !customQuestion.trim())) return

    setCreating(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    try {
      // Determine question text
      let questionText = ''
      let questionId = selectedQuestion
      
      if (customQuestion.trim()) {
        // Save custom question to question bank first
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
        
        questionId = savedQuestion?.id || null
        questionText = customQuestion.trim()
      } else {
        const question = questions.find(q => q.id === selectedQuestion)
        questionText = question?.question_text || ''
      }
      
      const { data: session, error: sessionError } = await supabase
        .from('interview_sessions')
        .insert({
          user_id: user.id,
          contact_id: selectedContact.id,
          title: sessionTitle || `Interview with ${selectedContact.full_name}`,
          status: 'pending',
        })
        .select()
        .single()

      if (sessionError) throw sessionError

      // Add single question to session
      await supabase.from('session_questions').insert({
        session_id: session.id,
        question_id: questionId,
        question_text: questionText,
        sort_order: 0,
      })

      // Reset and close
      closeModal()
      loadData()
    } catch (error) {
      console.error('Error creating session:', error)
      alert('Failed to create interview session')
    } finally {
      setCreating(false)
    }
  }

  const closeModal = () => {
    setShowNewSession(false)
    setStep('contact')
    setSelectedContact(null)
    setSelectedQuestion(null)
    setSelectedCategory(null)
    setSessionTitle('')
    setCustomQuestion('')
  }

  const copyLink = (token: string, sessionId: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/interview/${token}`)
    setCopied(sessionId)
    setTimeout(() => setCopied(null), 2000)
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-[#406A56]/10 text-[#406A56]'
      case 'recording': return 'bg-blue-50 text-blue-600'
      case 'sent': return 'bg-[#D9C61A]/10 text-[#9a8c12]'
      default: return 'bg-gray-100 text-gray-500'
    }
  }

  return (
    <div className="min-h-screen bg-[#F2F1E5]">
      {/* Header */}
      <header className="px-6 py-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard" 
              className="p-2.5 bg-white/80 backdrop-blur-sm rounded-xl text-[#406A56] hover:bg-white transition-all shadow-sm"
            >
              <ChevronLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-[#2d2d2d]">Video Journalist</h1>
              <p className="text-[#666] text-sm">Capture family stories remotely</p>
            </div>
          </div>

          <button
            onClick={() => setShowNewSession(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#C35F33] hover:bg-[#a54d28] text-white rounded-xl transition-all shadow-md"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">New Interview</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 pb-12">
        <div className="max-w-4xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-[#666]">Loading...</div>
            </div>
          ) : sessions.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 text-center shadow-sm">
              <div className="w-16 h-16 bg-[#4A3552]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Video size={32} className="text-[#4A3552]" />
              </div>
              <h3 className="text-lg font-semibold text-[#2d2d2d] mb-2">No interviews yet</h3>
              <p className="text-[#666] mb-6 max-w-md mx-auto">
                Send a question to family or friends, and they can record a video response from anywhere.
              </p>
              <button
                onClick={() => setShowNewSession(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C35F33] hover:bg-[#a54d28] text-white rounded-xl transition-all"
              >
                <Plus size={18} />
                Start your first interview
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#4A3552] to-[#6b4a7a] flex items-center justify-center text-white font-semibold">
                        {session.contact?.full_name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <h3 className="text-[#2d2d2d] font-semibold">{session.title}</h3>
                        <p className="text-[#888] text-sm">with {session.contact?.full_name}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${getStatusStyle(session.status)}`}>
                            {session.status}
                          </span>
                          {session.video_responses?.length > 0 && (
                            <span className="text-[#406A56] text-xs flex items-center gap-1">
                              <CheckCircle size={12} />
                              Answered
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {session.status === 'pending' && (
                        <button
                          onClick={() => copyLink(session.access_token, session.id)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-[#D9C61A]/10 hover:bg-[#D9C61A]/20 text-[#9a8c12] text-sm rounded-lg transition-all"
                        >
                          <ExternalLink size={14} />
                          {copied === session.id ? 'Copied!' : 'Copy Link'}
                        </button>
                      )}
                      {(session.status === 'sent' || session.status === 'completed') && (
                        <Link
                          href={`/dashboard/journalist/${session.id}?followup=true`}
                          className="flex items-center gap-2 px-3 py-1.5 bg-[#4A3552] hover:bg-[#5d4466] text-white text-sm rounded-lg transition-all"
                        >
                          <Plus size={14} />
                          Ask More
                        </Link>
                      )}
                      <Link
                        href={`/dashboard/journalist/${session.id}`}
                        className="flex items-center gap-2 px-3 py-1.5 bg-[#406A56]/10 hover:bg-[#406A56]/20 text-[#406A56] text-sm rounded-lg transition-all"
                      >
                        View
                      </Link>
                    </div>
                  </div>

                  {/* Show question */}
                  {session.session_questions?.[0] && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-sm text-[#666] italic">
                        "{session.session_questions[0].question_text}"
                      </p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* New Interview Modal */}
      <AnimatePresence>
        {showNewSession && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#F2F1E5] rounded-2xl max-w-lg w-full max-h-[85vh] overflow-hidden shadow-xl"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E7DC]">
                <div>
                  <h2 className="text-lg font-semibold text-[#2d2d2d]">New Interview</h2>
                  <p className="text-sm text-[#888]">
                    {step === 'contact' ? 'Choose who to interview' : 'Pick a question to ask'}
                  </p>
                </div>
                <button onClick={closeModal} className="p-2 hover:bg-white/50 rounded-lg transition-all">
                  <X size={20} className="text-[#666]" />
                </button>
              </div>

              {/* Step 1: Select Contact */}
              {step === 'contact' && (
                <div className="p-6">
                  {contacts.length === 0 ? (
                    <div className="text-center py-8">
                      <User size={40} className="text-[#888] mx-auto mb-3" />
                      <p className="text-[#666] mb-4">No contacts yet</p>
                      <Link href="/dashboard/contacts" className="text-[#C35F33] hover:underline">
                        Add contacts first →
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {contacts.map((contact) => (
                        <button
                          key={contact.id}
                          onClick={() => handleSelectContact(contact)}
                          className="w-full flex items-center gap-4 p-4 bg-white/70 hover:bg-white rounded-xl transition-all text-left"
                        >
                          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#4A3552] to-[#6b4a7a] flex items-center justify-center text-white font-medium">
                            {contact.full_name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-[#2d2d2d] font-medium">{contact.full_name}</p>
                            <p className="text-[#888] text-sm">{contact.phone || contact.email || 'No contact info'}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Select Question */}
              {step === 'question' && selectedContact && (
                <div className="flex flex-col h-[calc(85vh-80px)]">
                  {/* Contact pill + back */}
                  <div className="flex items-center justify-between px-6 py-3 bg-white/50">
                    <button
                      onClick={() => { setStep('contact'); setSelectedCategory(null); setSelectedQuestion(null); setCustomQuestion('') }}
                      className="text-[#C35F33] text-sm hover:underline"
                    >
                      ← Change person
                    </button>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-[#4A3552]/10 rounded-full">
                      <User size={14} className="text-[#4A3552]" />
                      <span className="text-[#4A3552] text-sm font-medium">{selectedContact.full_name}</span>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto">
                    {/* 1. Custom Question at TOP */}
                    <div className="px-6 pt-4 pb-3">
                      <label className="block text-sm font-medium text-[#2d2d2d] mb-2">
                        Write your own question:
                      </label>
                      <textarea
                        value={customQuestion}
                        onChange={(e) => { setCustomQuestion(e.target.value); setSelectedQuestion(null); setSelectedCategory(null) }}
                        placeholder="What's a story from your childhood that shaped who you are today?"
                        rows={2}
                        className="w-full px-4 py-3 bg-white border border-[#E8E7DC] rounded-xl text-[#2d2d2d] placeholder-[#aaa] focus:outline-none focus:ring-2 focus:ring-[#406A56] resize-none"
                      />
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-3 px-6 py-2">
                      <div className="flex-1 h-px bg-[#E8E7DC]" />
                      <span className="text-[#888] text-xs">or browse by category</span>
                      <div className="flex-1 h-px bg-[#E8E7DC]" />
                    </div>

                    {/* 2. Horizontal Scrollable Categories */}
                    <div className="px-6 py-3">
                      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
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
                    </div>

                    {/* 3. Questions List (when category selected) */}
                    {selectedCategory && (
                      <div className="px-6 pb-4">
                        {filteredQuestions.length === 0 ? (
                          <div className="text-center py-6 text-[#888] text-sm">
                            No questions in this category yet
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {filteredQuestions.map((q) => (
                              <button
                                key={q.id}
                                onClick={() => { handleSelectQuestion(q.id); setCustomQuestion('') }}
                                className={`w-full flex items-start gap-3 p-4 rounded-xl transition-all text-left ${
                                  selectedQuestion === q.id
                                    ? 'bg-[#406A56]/10 ring-2 ring-[#406A56]'
                                    : 'bg-white/70 hover:bg-white'
                                }`}
                              >
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                  selectedQuestion === q.id
                                    ? 'border-[#406A56] bg-[#406A56]'
                                    : 'border-[#ccc]'
                                }`}>
                                  {selectedQuestion === q.id && (
                                    <CheckCircle size={12} className="text-white" />
                                  )}
                                </div>
                                <p className="text-[#2d2d2d] text-sm leading-relaxed">{q.question_text}</p>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Create Button - show when custom question OR selected question */}
                  {(customQuestion.trim() || selectedQuestion) && (
                    <div className="px-6 py-4 border-t border-[#E8E7DC] bg-white/50">
                      <div className="mb-3">
                        <input
                          type="text"
                          value={sessionTitle}
                          onChange={(e) => setSessionTitle(e.target.value)}
                          placeholder={`Interview with ${selectedContact.full_name}`}
                          className="w-full px-4 py-2.5 bg-white border border-[#E8E7DC] rounded-xl text-[#2d2d2d] placeholder-[#aaa] focus:outline-none focus:ring-2 focus:ring-[#406A56]"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[#888] text-sm">
                          <Clock size={14} />
                          <span>~2-3 min to answer</span>
                        </div>
                        <button
                          onClick={handleCreateSession}
                          disabled={creating}
                          className="flex items-center gap-2 px-5 py-2.5 bg-[#406A56] hover:bg-[#4a7a64] disabled:opacity-50 text-white rounded-xl transition-all"
                        >
                          {creating ? 'Creating...' : 'Create Interview'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
