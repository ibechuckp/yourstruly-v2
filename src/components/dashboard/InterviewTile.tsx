'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Video, MoreVertical, Send, MessageSquare, CheckCircle, 
  Clock, ChevronDown, Plus, X, Mic, Type, Sparkles,
  Mail, Smartphone, User, Play, Pause, Trash2, Copy,
  ExternalLink, RefreshCw
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

// Types
interface SessionQuestion {
  id: string
  question_text: string
  status: 'pending' | 'answered' | 'skipped'
  sort_order: number
  video_response?: {
    id: string
    video_url: string
    audio_url: string
    text_response: string
    duration: number
    answer_type: 'video' | 'voice' | 'text'
    ai_summary: string
    created_at: string
  }
}

interface InterviewSession {
  id: string
  title: string
  status: 'pending' | 'sent' | 'recording' | 'completed' | 'expired'
  access_token: string
  contact: {
    id: string
    full_name: string
    email: string
    phone: string
  }
  session_questions: SessionQuestion[]
  created_at: string
  completed_at: string
  allow_followup_questions: boolean
  followup_count: number
}

interface InterviewTileProps {
  session: InterviewSession
  onUpdate: () => void
  onDelete: () => void
}

interface QuestionBankItem {
  id: string
  question_text: string
  category: string
  is_favorite: boolean
}

export default function InterviewTile({ session, onUpdate, onDelete }: InterviewTileProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showFollowupModal, setShowFollowupModal] = useState(false)
  const [showCustomQuestion, setShowCustomQuestion] = useState(false)
  const [customQuestion, setCustomQuestion] = useState('')
  const [questionBank, setQuestionBank] = useState<QuestionBankItem[]>([])
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [playingVideo, setPlayingVideo] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Calculate stats
  const answeredCount = session.session_questions.filter(q => q.status === 'answered').length
  const pendingCount = session.session_questions.filter(q => q.status === 'pending').length
  const progress = session.session_questions.length > 0 
    ? Math.round((answeredCount / session.session_questions.length) * 100) 
    : 0

  const getInterviewLink = () => {
    if (typeof window === 'undefined') return ''
    return `${window.location.origin}/interview/${session.access_token}`
  }

  const copyLink = async () => {
    await navigator.clipboard.writeText(getInterviewLink())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
      // Filter out questions already in session
      const existingQuestionTexts = session.session_questions.map(q => q.question_text)
      setQuestionBank(data.filter(q => !existingQuestionTexts.includes(q.question_text)))
    }
  }

  const handleOpenFollowup = () => {
    loadQuestionBank()
    setShowFollowupModal(true)
    setShowMenu(false)
  }

  const toggleQuestionSelection = (questionId: string) => {
    setSelectedQuestions(prev => 
      prev.includes(questionId) 
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    )
  }

  const sendFollowupQuestions = async () => {
    if (selectedQuestions.length === 0 && !customQuestion.trim()) return

    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    try {
      const startOrder = session.session_questions.length

      // Add preset questions
      for (let i = 0; i < selectedQuestions.length; i++) {
        const question = questionBank.find(q => q.id === selectedQuestions[i])
        if (question) {
          await supabase.from('session_questions').insert({
            session_id: session.id,
            question_id: question.id,
            question_text: question.question_text,
            sort_order: startOrder + i,
            status: 'pending'
          })
        }
      }

      // Add custom question if provided
      if (customQuestion.trim()) {
        // Save custom question for reuse
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

        await supabase.from('session_questions').insert({
          session_id: session.id,
          question_id: savedQuestion?.id,
          question_text: customQuestion.trim(),
          sort_order: startOrder + selectedQuestions.length,
          status: 'pending'
        })
      }

      // Update session followup count
      await supabase
        .from('interview_sessions')
        .update({ 
          followup_count: session.followup_count + 1,
          status: 'sent'
        })
        .eq('id', session.id)

      // Send notification to interviewee
      await sendNotification()

      setShowFollowupModal(false)
      setSelectedQuestions([])
      setCustomQuestion('')
      onUpdate()
    } catch (error) {
      console.error('Error sending followup:', error)
      alert('Failed to send follow-up questions')
    } finally {
      setLoading(false)
    }
  }

  const sendNotification = async () => {
    // Call the notification API
    try {
      await fetch('/api/interviews/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          type: 'followup',
          contactEmail: session.contact.email,
          contactPhone: session.contact.phone,
          contactName: session.contact.full_name
        })
      })
    } catch (error) {
      console.error('Failed to send notification:', error)
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getStatusColor = () => {
    switch (session.status) {
      case 'completed': return 'bg-green-500'
      case 'recording': return 'bg-blue-500'
      case 'sent': return 'bg-amber-500'
      default: return 'bg-gray-400'
    }
  }

  return (
    <>
      {/* Main Tile */}
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`bubble-tile interview-tile ${isExpanded ? 'expanded' : ''}`}
        data-type="interview"
      >
        {/* XP Badge */}
        <div className="bubble-xp bubble-xp-purple">
          <Sparkles size={12} />
          {answeredCount * 25} XP
        </div>

        <div className="bubble-content">
          {/* Type Label with Torn Edge */}
          <div className="bubble-type bubble-type-purple">
            Video Interview
          </div>

          {/* Contact Card */}
          <div className="bubble-contact">
            <div className="bubble-contact-avatar">
              {session.contact.full_name.charAt(0)}
            </div>
            <div>
              <p className="bubble-contact-name">{session.contact.full_name}</p>
              <p className="bubble-contact-sub">
                {answeredCount} of {session.session_questions.length} answered
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="interview-progress-mini">
            <div className="interview-progress-mini-bar">
              <div 
                className="interview-progress-mini-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="interview-progress-mini-text">{progress}%</span>
          </div>

          {/* Status */}
          <div className="interview-status-row">
            <span className={`interview-status-dot ${getStatusColor()}`} />
            <span className="interview-status-text capitalize">{session.status}</span>
            {session.followup_count > 0 && (
              <span className="interview-followup-badge">
                {session.followup_count} follow-up{session.followup_count > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Quick Actions */}
          <div className="interview-quick-actions">
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="interview-quick-btn"
            >
              {isExpanded ? 'Hide' : 'View'}
            </button>
            
            {/* Primary Ask Follow-up Button - visible directly on tile */}
            {(session.status === 'sent' || session.status === 'completed' || session.status === 'recording') && 
             session.allow_followup_questions !== false && (
              <button 
                onClick={handleOpenFollowup}
                className="interview-quick-btn interview-followup-btn"
              >
                <Plus size={16} />
                Ask More
              </button>
            )}
            
            <div className="relative" ref={menuRef}>
              <button 
                onClick={() => setShowMenu(!showMenu)}
                className="interview-menu-btn"
              >
                <MoreVertical size={18} />
              </button>
              
              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    className="interview-dropdown"
                  >
                    <button onClick={handleOpenFollowup} className="interview-dropdown-item">
                      <Plus size={16} />
                      Add Follow-up Questions
                    </button>
                    <button onClick={copyLink} className="interview-dropdown-item">
                      {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                      {copied ? 'Copied!' : 'Copy Interview Link'}
                    </button>
                    <a 
                      href={getInterviewLink()} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="interview-dropdown-item"
                    >
                      <ExternalLink size={16} />
                      Open Interview Page
                    </a>
                    <hr className="interview-dropdown-divider" />
                    <button onClick={onDelete} className="interview-dropdown-item danger">
                      <Trash2 size={16} />
                      Delete Interview
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Expanded View - Responses */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="interview-expanded"
            >
              <div className="interview-responses">
                <h4 className="interview-responses-title">
                  <MessageSquare size={16} />
                  Questions & Responses
                </h4>
                
                {session.session_questions.map((question, index) => (
                  <div 
                    key={question.id} 
                    className={`interview-question-item ${question.status}`}
                  >
                    <div className="interview-question-header">
                      <span className="interview-question-number">{index + 1}</span>
                      <p className="interview-question-text">{question.question_text}</p>
                      {question.status === 'answered' && (
                        <CheckCircle size={16} className="interview-answered-icon" />
                      )}
                      {question.status === 'pending' && (
                        <Clock size={16} className="interview-pending-icon" />
                      )}
                    </div>
                    
                    {question.video_response && (
                      <div className="interview-response-preview">
                        {question.video_response.answer_type === 'video' && question.video_response.video_url && (
                          <div className="interview-video-thumb">
                            <video
                              src={question.video_response.video_url}
                              className="interview-video-player"
                              onPlay={() => setPlayingVideo(question.video_response!.id)}
                              onPause={() => setPlayingVideo(null)}
                              controls
                            />
                          </div>
                        )}
                        
                        {question.video_response.answer_type === 'voice' && (
                          <div className="interview-audio-response">
                            <Mic size={16} />
                            <audio 
                              src={question.video_response.audio_url} 
                              controls 
                              className="interview-audio-player"
                            />
                            <span>{formatDuration(question.video_response.duration)}</span>
                          </div>
                        )}
                        
                        {question.video_response.answer_type === 'text' && (
                          <div className="interview-text-response">
                            <p>"{question.video_response.text_response}"</p>
                          </div>
                        )}
                        
                        {question.video_response.ai_summary && (
                          <div className="interview-ai-summary">
                            <Sparkles size={12} />
                            <span>{question.video_response.ai_summary}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Follow-up Modal */}
      <AnimatePresence>
        {showFollowupModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="interview-modal-overlay"
            onClick={() => setShowFollowupModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="interview-modal"
              onClick={e => e.stopPropagation()}
            >
              <div className="interview-modal-header">
                <h3>Add Follow-up Questions</h3>
                <button 
                  onClick={() => setShowFollowupModal(false)}
                  className="interview-modal-close"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="interview-modal-body">
                {/* Custom Question Input */}
                <div className="interview-custom-question">
                  <label>Or ask your own question:</label>
                  <textarea
                    value={customQuestion}
                    onChange={(e) => setCustomQuestion(e.target.value)}
                    placeholder="Type your custom question here..."
                    rows={2}
                  />
                  <p className="interview-custom-hint">
                    This will be saved to your question bank for future use
                  </p>
                </div>

                {/* Question Bank */}
                <div className="interview-question-bank">
                  <label>Choose from question bank:</label>
                  <div className="interview-question-list">
                    {questionBank.slice(0, 10).map((question) => (
                      <button
                        key={question.id}
                        onClick={() => toggleQuestionSelection(question.id)}
                        className={`interview-bank-item ${
                          selectedQuestions.includes(question.id) ? 'selected' : ''
                        }`}
                      >
                        <div className="interview-bank-checkbox">
                          {selectedQuestions.includes(question.id) && (
                            <CheckCircle size={16} />
                          )}
                        </div>
                        <span>{question.question_text}</span>
                        {question.is_favorite && (
                          <Sparkles size={14} className="interview-favorite-icon" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notification Preview */}
                <div className="interview-notification-preview">
                  <h4>
                    <Mail size={14} />
                    Notification Preview
                  </h4>
                  <div className="interview-notification-content">
                    <p><strong>Subject:</strong> New questions from {session.contact.full_name}</p>
                    <p className="interview-notification-body">
                      Hi! {session.contact.full_name} has sent you {selectedQuestions.length + (customQuestion ? 1 : 0)} new 
                      question{selectedQuestions.length + (customQuestion ? 1 : 0) !== 1 ? 's' : ''} to answer. 
                      Click here to respond: <a href={getInterviewLink()}>Open Interview</a>
                    </p>
                  </div>
                </div>
              </div>

              <div className="interview-modal-footer">
                <button 
                  onClick={() => setShowFollowupModal(false)}
                  className="interview-btn interview-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={sendFollowupQuestions}
                  disabled={loading || (selectedQuestions.length === 0 && !customQuestion.trim())}
                  className="interview-btn interview-btn-primary"
                >
                  {loading ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Send {selectedQuestions.length + (customQuestion ? 1 : 0)} Question
                      {selectedQuestions.length + (customQuestion ? 1 : 0) !== 1 ? 's' : ''}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
