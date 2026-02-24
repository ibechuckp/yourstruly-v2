'use client'

import { useState, useEffect, useRef, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Video, Mic, Square, Play, ChevronRight, Check, Loader2, AlertCircle,
  MicOff, Type, ChevronLeft, Clock, Heart, Sparkles, Send
} from 'lucide-react'
import '@/styles/interview.css'

// YT Brand Colors
const BRAND_COLORS = {
  green: '#406A56',
  terraCotta: '#C35F33',
  yellow: '#D9C61A',
  purple: '#4A3552',
  offWhite: '#F2F1E5',
}

interface SessionQuestion {
  id: string
  question_text: string
  status: string
  sort_order: number
}

interface Session {
  id: string
  title: string
  status: string
  user_id: string
  contact: {
    full_name: string
  }
  session_questions: SessionQuestion[]
  voice_enabled: boolean
  allow_text_answers: boolean
}

export default function InterviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [uploading, setUploading] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [permissionGranted, setPermissionGranted] = useState(false)
  const [answerMode, setAnswerMode] = useState<'video' | 'voice' | 'text' | null>(null)
  const [textAnswer, setTextAnswer] = useState('')
  const [recordingTime, setRecordingTime] = useState(0)
  const [showWelcome, setShowWelcome] = useState(true)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)
  
  const supabase = createClient()

  useEffect(() => {
    loadSession()
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
      }
    }
  }, [token])

  const loadSession = async () => {
    try {
      const { data, error } = await supabase
        .from('interview_sessions')
        .select(`
          id, title, status, user_id, voice_enabled, allow_text_answers,
          contact:contacts(full_name),
          session_questions(id, question_text, status, sort_order)
        `)
        .eq('access_token', token)
        .single()

      if (error || !data) {
        setError('Interview not found or link expired')
        setLoading(false)
        return
      }

      // Check if expired
      const { data: sessionData } = await supabase
        .from('interview_sessions')
        .select('expires_at')
        .eq('id', data.id)
        .single()

      if (sessionData && new Date(sessionData.expires_at) < new Date()) {
        setError('This interview link has expired')
        setLoading(false)
        return
      }

      // Sort questions
      data.session_questions.sort((a, b) => a.sort_order - b.sort_order)
      
      // Fix contact type
      const formattedSession = {
        ...data,
        contact: Array.isArray(data.contact) ? data.contact[0] : data.contact
      }
      
      setSession(formattedSession as Session)

      // Mark as opened
      await supabase
        .from('interview_sessions')
        .update({ 
          status: data.status === 'pending' ? 'sent' : data.status,
          opened_at: new Date().toISOString() 
        })
        .eq('id', data.id)

      setLoading(false)
    } catch (e) {
      setError('Failed to load interview')
      setLoading(false)
    }
  }

  const requestPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      })
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      
      setPermissionGranted(true)
    } catch (e) {
      setError('Camera/microphone access denied. Please allow access to record.')
    }
  }

  const startRecording = async (mode: 'video' | 'voice') => {
    if (!streamRef.current && mode === 'video') {
      await requestPermission()
    }

    chunksRef.current = []
    
    let stream: MediaStream
    if (mode === 'voice') {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } else {
      stream = streamRef.current!
    }
    
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: mode === 'video' ? 'video/webm;codecs=vp9' : 'audio/webm'
    })

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data)
      }
    }

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { 
        type: mode === 'video' ? 'video/webm' : 'audio/webm' 
      })
      setRecordedBlob(blob)
    }

    mediaRecorderRef.current = mediaRecorder
    mediaRecorder.start(1000)
    setIsRecording(true)
    setRecordingTime(0)
    
    // Start timer
    recordingTimerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1)
    }, 1000)

    // Update session status
    if (session) {
      supabase
        .from('interview_sessions')
        .update({ status: 'recording', started_at: new Date().toISOString() })
        .eq('id', session.id)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
      }
    }
  }

  const uploadAndNext = async () => {
    if (!recordedBlob || !session) return

    setUploading(true)

    try {
      const question = session.session_questions[currentQuestion]
      const isVoice = answerMode === 'voice'
      const fileExt = isVoice ? 'webm' : 'webm'
      const fileName = `${session.id}/${question.id}-${Date.now()}.${fileExt}`
      const bucket = isVoice ? 'audio' : 'videos'

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, recordedBlob, {
          contentType: isVoice ? 'audio/webm' : 'video/webm',
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName)

      // Create response record
      const responseData: any = {
        session_id: session.id,
        session_question_id: question.id,
        user_id: session.user_id,
        video_url: isVoice ? null : publicUrl,
        video_key: isVoice ? null : fileName,
        audio_url: isVoice ? publicUrl : null,
        audio_key: isVoice ? fileName : null,
        duration: recordingTime,
        answer_type: answerMode,
      }

      await supabase.from('video_responses').insert(responseData)

      // Mark question as answered
      await supabase
        .from('session_questions')
        .update({ status: 'answered' })
        .eq('id', question.id)

      // Move to next question or complete
      if (currentQuestion < session.session_questions.length - 1) {
        setCurrentQuestion(prev => prev + 1)
        setRecordedBlob(null)
        setAnswerMode(null)
        setRecordingTime(0)
      } else {
        await supabase
          .from('interview_sessions')
          .update({ status: 'completed', completed_at: new Date().toISOString() })
          .eq('id', session.id)
        setCompleted(true)
      }
    } catch (e) {
      console.error('Upload error:', e)
      alert('Failed to save. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const submitTextAnswer = async () => {
    if (!textAnswer.trim() || !session) return

    setUploading(true)

    try {
      const question = session.session_questions[currentQuestion]

      await supabase.from('video_responses').insert({
        session_id: session.id,
        session_question_id: question.id,
        user_id: session.user_id,
        text_response: textAnswer,
        answer_type: 'text',
        duration: 0,
      })

      await supabase
        .from('session_questions')
        .update({ status: 'answered' })
        .eq('id', question.id)

      if (currentQuestion < session.session_questions.length - 1) {
        setCurrentQuestion(prev => prev + 1)
        setTextAnswer('')
        setAnswerMode(null)
      } else {
        await supabase
          .from('interview_sessions')
          .update({ status: 'completed', completed_at: new Date().toISOString() })
          .eq('id', session.id)
        setCompleted(true)
      }
    } catch (e) {
      console.error('Submit error:', e)
      alert('Failed to save. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const skipQuestion = async () => {
    if (!session) return

    const question = session.session_questions[currentQuestion]
    
    await supabase
      .from('session_questions')
      .update({ status: 'skipped' })
      .eq('id', question.id)

    if (currentQuestion < session.session_questions.length - 1) {
      setCurrentQuestion(prev => prev + 1)
      setRecordedBlob(null)
      setAnswerMode(null)
      setTextAnswer('')
    } else {
      await supabase
        .from('interview_sessions')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', session.id)
      setCompleted(true)
    }
  }

  const retakeRecording = () => {
    setRecordedBlob(null)
    setRecordingTime(0)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="interview-page">
        <div className="interview-loading">
          <Loader2 size={40} className="animate-spin" />
          <p>Loading your interview...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="interview-page">
        <div className="interview-error">
          <div className="interview-error-icon">
            <AlertCircle size={48} />
          </div>
          <h1>Oops!</h1>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  if (completed) {
    return (
      <div className="interview-page">
        <div className="interview-completed">
          <div className="interview-success-icon">
            <Check size={48} />
          </div>
          <h1>Thank you!</h1>
          <p>
            Your responses have been recorded and sent to your loved one. 
            They will treasure these memories forever.
          </p>
          <div className="interview-completed-hearts">
            <Heart className="heart-1" fill="#C35F33" />
            <Heart className="heart-2" fill="#406A56" />
            <Heart className="heart-3" fill="#D9C61A" />
          </div>
        </div>
      </div>
    )
  }

  if (!session) return null

  const question = session.session_questions[currentQuestion]

  // Welcome screen
  if (showWelcome) {
    return (
      <div className="interview-page">
        <div className="interview-welcome">
          <div className="interview-welcome-content">
            <div className="interview-welcome-icon">
              <Sparkles size={40} />
            </div>
            <h1>{session.title}</h1>
            <p className="interview-welcome-subtitle">
              Someone special wants to hear your story
            </p>
            
            <div className="interview-welcome-card">
              <p className="interview-welcome-text">
                Hi! {session.contact?.full_name || 'Someone'} has invited you to share 
                some memories and stories. This is a gift that will be treasured 
                for generations.
              </p>
              
              <div className="interview-welcome-details">
                <div className="interview-welcome-detail">
                  <Clock size={18} />
                  <span>{session.session_questions.length} questions</span>
                </div>
                <div className="interview-welcome-detail">
                  <Video size={18} />
                  <span>Video, voice, or text answers</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setShowWelcome(false)
                requestPermission()
              }}
              className="interview-btn interview-btn-primary"
            >
              Let's Begin
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="interview-page">
      {/* Progress Bar */}
      <div className="interview-progress">
        <div className="interview-progress-info">
          <span>Question {currentQuestion + 1} of {session.session_questions.length}</span>
          <span>{Math.round(((currentQuestion + 1) / session.session_questions.length) * 100)}%</span>
        </div>
        <div className="interview-progress-bar">
          <div 
            className="interview-progress-fill"
            style={{ width: `${((currentQuestion + 1) / session.session_questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Content */}
      <main className="interview-main">
        <div className="interview-container">
          {/* Question Card */}
          <div className="interview-question-card">
            <div className="interview-question-number">
              Question {currentQuestion + 1}
            </div>
            <h2 className="interview-question-text">
              {question.question_text}
            </h2>
          </div>

          {/* Answer Mode Selection */}
          {!answerMode && !recordedBlob && (
            <div className="interview-mode-selection">
              <p className="interview-mode-title">How would you like to answer?</p>
              <div className="interview-modes">
                <button
                  onClick={() => setAnswerMode('video')}
                  className="interview-mode-btn"
                >
                  <div className="interview-mode-icon interview-mode-video">
                    <Video size={28} />
                  </div>
                  <span>Video</span>
                  <small>Record with camera</small>
                </button>
                
                {session.voice_enabled !== false && (
                  <button
                    onClick={() => setAnswerMode('voice')}
                    className="interview-mode-btn"
                  >
                    <div className="interview-mode-icon interview-mode-voice">
                      <Mic size={28} />
                    </div>
                    <span>Voice</span>
                    <small>Audio only</small>
                  </button>
                )}
                
                {session.allow_text_answers && (
                  <button
                    onClick={() => setAnswerMode('text')}
                    className="interview-mode-btn"
                  >
                    <div className="interview-mode-icon interview-mode-text">
                      <Type size={28} />
                    </div>
                    <span>Text</span>
                    <small>Type your answer</small>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Recording Area */}
          {(answerMode === 'video' || answerMode === 'voice') && (
            <div className="interview-recording-area">
              {!permissionGranted && answerMode === 'video' ? (
                <div className="interview-permission-request">
                  <Video size={48} />
                  <p>Camera access required</p>
                  <button
                    onClick={requestPermission}
                    className="interview-btn interview-btn-primary"
                  >
                    <Video size={20} />
                    Enable Camera
                  </button>
                </div>
              ) : recordedBlob ? (
                <div className="interview-preview">
                  {answerMode === 'video' ? (
                    <video
                      src={URL.createObjectURL(recordedBlob)}
                      controls
                      className="interview-preview-video"
                    />
                  ) : (
                    <div className="interview-preview-audio">
                      <audio
                        src={URL.createObjectURL(recordedBlob)}
                        controls
                      />
                      <div className="interview-preview-audio-icon">
                        <Mic size={48} />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className={`interview-recorder ${answerMode}`}>
                  {answerMode === 'video' && (
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      className="interview-camera"
                    />
                  )}
                  
                  {isRecording && (
                    <div className="interview-recording-indicator">
                      <div className="interview-recording-dot" />
                      <span>Recording</span>
                      <span className="interview-recording-time">
                        {formatTime(recordingTime)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Text Answer Area */}
          {answerMode === 'text' && !recordedBlob && (
            <div className="interview-text-area">
              <textarea
                value={textAnswer}
                onChange={(e) => setTextAnswer(e.target.value)}
                placeholder="Type your answer here..."
                className="interview-textarea"
                rows={6}
              />
            </div>
          )}

          {/* Controls */}
          <div className="interview-controls">
            {recordedBlob ? (
              // After recording - review options
              <>
                <button
                  onClick={retakeRecording}
                  className="interview-btn interview-btn-secondary"
                >
                  Retake
                </button>
                <button
                  onClick={uploadAndNext}
                  disabled={uploading}
                  className="interview-btn interview-btn-primary"
                >
                  {uploading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      Save & Continue
                      <ChevronRight size={20} />
                    </>
                  )}
                </button>
              </>
            ) : answerMode === 'text' ? (
              // Text answer controls
              <>
                <button
                  onClick={() => {
                    setAnswerMode(null)
                    setTextAnswer('')
                  }}
                  className="interview-btn interview-btn-ghost"
                >
                  <ChevronLeft size={18} />
                  Back
                </button>
                <button
                  onClick={submitTextAnswer}
                  disabled={!textAnswer.trim() || uploading}
                  className="interview-btn interview-btn-primary"
                >
                  {uploading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <>
                      <Send size={18} />
                      Submit Answer
                    </>
                  )}
                </button>
              </>
            ) : answerMode ? (
              // Recording controls
              <>
                <button
                  onClick={() => {
                    setAnswerMode(null)
                    if (streamRef.current) {
                      streamRef.current.getTracks().forEach(track => track.stop())
                      streamRef.current = null
                    }
                    setPermissionGranted(false)
                  }}
                  className="interview-btn interview-btn-ghost"
                >
                  <ChevronLeft size={18} />
                  Back
                </button>
                
                {isRecording ? (
                  <button
                    onClick={stopRecording}
                    className="interview-btn interview-btn-stop"
                  >
                    <Square size={20} fill="currentColor" />
                    Stop
                  </button>
                ) : (
                  <button
                    onClick={() => startRecording(answerMode)}
                    className="interview-btn interview-btn-record"
                  >
                    {answerMode === 'video' ? <Video size={20} /> : <Mic size={20} />}
                    Start Recording
                  </button>
                )}
              </>
            ) : (
              // Initial state - skip option
              <button
                onClick={skipQuestion}
                className="interview-btn interview-btn-ghost"
              >
                Skip this question
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="interview-footer">
        <p>Powered by <span className="interview-brand">YoursTruly</span></p>
      </footer>
    </div>
  )
}
