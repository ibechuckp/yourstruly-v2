'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Video, Plus, Send, Clock, CheckCircle, 
  MessageSquare, ChevronLeft, User, Play,
  Sparkles, FileText, ExternalLink
} from 'lucide-react'
import Link from 'next/link'
import Modal from '@/components/ui/Modal'

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
  times_used: number
}

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
  }
  session_questions: {
    id: string
    question_text: string
    status: string
  }[]
  video_responses: {
    id: string
    duration: number
    transcript: string
    ai_summary: string
  }[]
}

const CATEGORIES = [
  { id: 'all', label: 'All Questions' },
  { id: 'childhood', label: 'Childhood' },
  { id: 'career', label: 'Career' },
  { id: 'relationships', label: 'Relationships' },
  { id: 'wisdom', label: 'Wisdom' },
  { id: 'general', label: 'General' },
  { id: 'custom', label: 'My Questions' },
]

export default function JournalistPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewSession, setShowNewSession] = useState(false)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([])
  const [questionCategory, setQuestionCategory] = useState('all')
  const [sessionTitle, setSessionTitle] = useState('')
  const [creating, setCreating] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Load sessions
    const { data: sessionsData } = await supabase
      .from('interview_sessions')
      .select(`
        *,
        contact:contacts(id, full_name),
        session_questions(id, question_text, status),
        video_responses(id, duration, transcript, ai_summary)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    setSessions(sessionsData || [])

    // Load contacts
    const { data: contactsData } = await supabase
      .from('contacts')
      .select('id, full_name, phone, email')
      .eq('user_id', user.id)
      .order('full_name')

    setContacts(contactsData || [])

    // Load questions
    const { data: questionsData } = await supabase
      .from('interview_questions')
      .select('*')
      .or(`user_id.eq.${user.id},is_system.eq.true`)
      .order('category')

    setQuestions(questionsData || [])
    setLoading(false)
  }

  const filteredQuestions = questions.filter(q => 
    questionCategory === 'all' || 
    (questionCategory === 'custom' ? !q.is_system : q.category === questionCategory)
  )

  const toggleQuestion = (id: string) => {
    setSelectedQuestions(prev => 
      prev.includes(id) ? prev.filter(q => q !== id) : [...prev, id]
    )
  }

  const handleCreateSession = async () => {
    if (!selectedContact || selectedQuestions.length === 0) return

    setCreating(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    try {
      // Create session
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

      // Add questions to session
      const sessionQuestions = selectedQuestions.map((qId, i) => {
        const question = questions.find(q => q.id === qId)
        return {
          session_id: session.id,
          question_id: qId,
          question_text: question?.question_text || '',
          sort_order: i,
        }
      })

      await supabase.from('session_questions').insert(sessionQuestions)

      // Update question usage counts
      for (const qId of selectedQuestions) {
        await supabase.rpc('increment_question_usage', { question_id: qId })
      }

      setShowNewSession(false)
      setSelectedContact(null)
      setSelectedQuestions([])
      setSessionTitle('')
      loadData()
    } catch (error) {
      console.error('Error creating session:', error)
      alert('Failed to create interview session')
    } finally {
      setCreating(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-500 bg-green-500/10'
      case 'recording': return 'text-blue-500 bg-blue-500/10'
      case 'sent': return 'text-amber-500 bg-amber-500/10'
      default: return 'text-gray-400 bg-gray-500/10'
    }
  }

  const getInterviewLink = (token: string) => {
    return `${window.location.origin}/interview/${token}`
  }

  const copyLink = (token: string) => {
    navigator.clipboard.writeText(getInterviewLink(token))
    alert('Link copied to clipboard!')
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gray-950/90 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
              <ChevronLeft size={20} className="text-gray-400" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-white">Video Journalist</h1>
              <p className="text-sm text-gray-400">Capture family stories remotely</p>
            </div>
          </div>

          <button
            onClick={() => setShowNewSession(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">New Interview</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-400">Loading...</div>
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Video size={48} className="text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No interviews yet</h3>
            <p className="text-gray-400 mb-4 max-w-md">
              Send questions to your family and friends, and they can record video responses from anywhere.
            </p>
            <button
              onClick={() => setShowNewSession(true)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
            >
              <Plus size={18} />
              Start your first interview
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="bg-gray-900 rounded-xl p-4 hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-amber-600/20 flex items-center justify-center">
                      <User size={24} className="text-amber-500" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">{session.title}</h3>
                      <p className="text-gray-400 text-sm">with {session.contact?.full_name}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${getStatusColor(session.status)}`}>
                          {session.status}
                        </span>
                        <span className="text-gray-500 text-xs">
                          {session.session_questions?.length} questions
                        </span>
                        {session.video_responses?.length > 0 && (
                          <span className="text-green-500 text-xs flex items-center gap-1">
                            <Play size={12} />
                            {session.video_responses.length} responses
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {session.status === 'pending' && (
                      <button
                        onClick={() => copyLink(session.access_token)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-sm rounded-lg transition-colors"
                      >
                        <ExternalLink size={14} />
                        Copy Link
                      </button>
                    )}
                    <Link
                      href={`/dashboard/journalist/${session.id}`}
                      className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors"
                    >
                      View
                    </Link>
                  </div>
                </div>

                {/* Video previews */}
                {session.video_responses?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-800">
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {session.video_responses.slice(0, 4).map((video) => (
                        <div
                          key={video.id}
                          className="flex-shrink-0 w-32 p-3 bg-gray-800 rounded-lg"
                        >
                          <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
                            <Play size={12} />
                            {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                          </div>
                          {video.ai_summary && (
                            <p className="text-gray-300 text-xs line-clamp-2">{video.ai_summary}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* New Interview Modal */}
      <Modal 
        isOpen={showNewSession} 
        onClose={() => setShowNewSession(false)} 
        title="New Interview" 
        maxWidth="max-w-2xl"
        showDone={false}
      >
        {!selectedContact ? (
          /* Step 1: Select Contact */
          <div>
            <p className="text-gray-400 text-sm mb-4">Who do you want to interview?</p>
            {contacts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No contacts yet</p>
                <Link href="/dashboard/contacts" className="text-amber-500 hover:underline">
                  Add contacts first
                </Link>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {contacts.map((contact) => (
                  <button
                    key={contact.id}
                    onClick={() => setSelectedContact(contact)}
                    className="w-full flex items-center gap-4 p-4 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-amber-600 flex items-center justify-center text-white font-medium">
                      {contact.full_name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-white font-medium">{contact.full_name}</p>
                      <p className="text-gray-400 text-sm">{contact.phone || contact.email || 'No contact info'}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Step 2: Select Questions */
          <div>
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setSelectedContact(null)}
                className="text-amber-500 text-sm hover:underline"
              >
                ← Change person
              </button>
              <div className="flex items-center gap-2">
                <User size={16} className="text-amber-500" />
                <span className="text-white text-sm">{selectedContact.full_name}</span>
              </div>
            </div>

            {/* Session Title */}
            <div className="mb-4">
              <input
                type="text"
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
                placeholder={`Interview with ${selectedContact.full_name}`}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Category Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setQuestionCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                    questionCategory === cat.id
                      ? 'bg-amber-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Questions List */}
            <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
              {filteredQuestions.map((q) => (
                <button
                  key={q.id}
                  onClick={() => toggleQuestion(q.id)}
                  className={`w-full flex items-start gap-3 p-3 rounded-xl transition-colors text-left ${
                    selectedQuestions.includes(q.id)
                      ? 'bg-amber-600/20 border border-amber-500/50'
                      : 'bg-gray-800 hover:bg-gray-700 border border-transparent'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    selectedQuestions.includes(q.id)
                      ? 'border-amber-500 bg-amber-500'
                      : 'border-gray-600'
                  }`}>
                    {selectedQuestions.includes(q.id) && (
                      <CheckCircle size={12} className="text-white" />
                    )}
                  </div>
                  <div>
                    <p className="text-white text-sm">{q.question_text}</p>
                    <p className="text-gray-500 text-xs capitalize mt-1">{q.category}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Selected count & Create */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-800">
              <span className="text-gray-400 text-sm">
                {selectedQuestions.length} questions selected
              </span>
              <button
                onClick={handleCreateSession}
                disabled={selectedQuestions.length === 0 || creating}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                {creating ? 'Creating...' : 'Create Interview'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
