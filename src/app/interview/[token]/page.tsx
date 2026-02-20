'use client'

import { useState, useEffect, useRef, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Video, Mic, Square, Play, ChevronRight, Check, Loader2, AlertCircle } from 'lucide-react'

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
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  
  const supabase = createClient()

  useEffect(() => {
    loadSession()
    return () => {
      // Cleanup stream on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [token])

  const loadSession = async () => {
    try {
      const { data, error } = await supabase
        .from('interview_sessions')
        .select(`
          id, title, status, user_id,
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
      
      // Fix contact type (Supabase returns array for single relations)
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

  const startRecording = () => {
    if (!streamRef.current) return

    chunksRef.current = []
    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType: 'video/webm;codecs=vp9'
    })

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data)
      }
    }

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' })
      setRecordedBlob(blob)
    }

    mediaRecorderRef.current = mediaRecorder
    mediaRecorder.start(1000)
    setIsRecording(true)

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
    }
  }

  const uploadAndNext = async () => {
    if (!recordedBlob || !session) return

    setUploading(true)

    try {
      const question = session.session_questions[currentQuestion]
      const fileName = `${session.id}/${question.id}-${Date.now()}.webm`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(fileName, recordedBlob, {
          contentType: 'video/webm',
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(fileName)

      // Create video response record
      await supabase.from('video_responses').insert({
        session_id: session.id,
        session_question_id: question.id,
        user_id: session.user_id,
        contact_id: session.contact?.full_name ? undefined : session.user_id, // Fix this
        video_url: publicUrl,
        video_key: fileName,
        duration: Math.round(recordedBlob.size / 50000), // Rough estimate
      })

      // Mark question as answered
      await supabase
        .from('session_questions')
        .update({ status: 'answered' })
        .eq('id', question.id)

      // Move to next question or complete
      if (currentQuestion < session.session_questions.length - 1) {
        setCurrentQuestion(prev => prev + 1)
        setRecordedBlob(null)
      } else {
        // All done!
        await supabase
          .from('interview_sessions')
          .update({ status: 'completed', completed_at: new Date().toISOString() })
          .eq('id', session.id)
        setCompleted(true)
      }
    } catch (e) {
      console.error('Upload error:', e)
      alert('Failed to save video. Please try again.')
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
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 size={32} className="text-amber-500 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-white mb-2">Oops!</h1>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    )
  }

  if (completed) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check size={40} className="text-green-500" />
          </div>
          <h1 className="text-2xl font-semibold text-white mb-2">Thank you!</h1>
          <p className="text-gray-400 mb-6">
            Your responses have been recorded and sent to your loved one. 
            They will treasure these memories forever.
          </p>
          <p className="text-amber-500 text-sm">You can close this page now.</p>
        </div>
      </div>
    )
  }

  if (!session) return null

  const question = session.session_questions[currentQuestion]

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <header className="p-4 border-b border-gray-800">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-white font-medium">{session.title}</h1>
            <p className="text-gray-400 text-sm">
              Question {currentQuestion + 1} of {session.session_questions.length}
            </p>
          </div>
          <div className="w-24 h-2 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-amber-500 transition-all"
              style={{ width: `${((currentQuestion + 1) / session.session_questions.length) * 100}%` }}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          {/* Question */}
          <div className="text-center mb-8">
            <p className="text-2xl md:text-3xl font-medium text-white leading-relaxed">
              {question.question_text}
            </p>
          </div>

          {/* Video Area */}
          <div className="relative aspect-video bg-gray-900 rounded-2xl overflow-hidden mb-6">
            {!permissionGranted ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Video size={48} className="text-gray-600 mb-4" />
                <p className="text-gray-400 mb-4">Camera access required</p>
                <button
                  onClick={requestPermission}
                  className="flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition-colors"
                >
                  <Video size={20} />
                  Enable Camera
                </button>
              </div>
            ) : recordedBlob ? (
              <video
                src={URL.createObjectURL(recordedBlob)}
                className="w-full h-full object-cover"
                controls
              />
            ) : (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            )}

            {/* Recording indicator */}
            {isRecording && (
              <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-red-500 rounded-full">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="text-white text-sm font-medium">Recording</span>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            {!permissionGranted ? null : recordedBlob ? (
              <>
                <button
                  onClick={retakeRecording}
                  className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors"
                >
                  Retake
                </button>
                <button
                  onClick={uploadAndNext}
                  disabled={uploading}
                  className="flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl transition-colors"
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
            ) : (
              <>
                <button
                  onClick={skipQuestion}
                  className="px-6 py-3 text-gray-400 hover:text-white transition-colors"
                >
                  Skip
                </button>
                {isRecording ? (
                  <button
                    onClick={stopRecording}
                    className="flex items-center gap-2 px-8 py-4 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors"
                  >
                    <Square size={20} />
                    Stop Recording
                  </button>
                ) : (
                  <button
                    onClick={startRecording}
                    className="flex items-center gap-2 px-8 py-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition-colors"
                  >
                    <Video size={20} />
                    Start Recording
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center">
        <p className="text-gray-500 text-sm">
          Powered by <span className="text-amber-500">YoursTruly</span>
        </p>
      </footer>
    </div>
  )
}
