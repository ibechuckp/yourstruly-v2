'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type {
  VoiceChatState,
  Voice,
  TranscriptEntry,
  VoiceSessionType,
  VoiceSessionResult,
  PersonaConfig,
  JOURNALIST_PERSONA,
  MemoryCaptureConfig,
} from '@/types/voice'
import { JOURNALIST_PERSONA as DEFAULT_PERSONA } from '@/types/voice'

// Re-export types for convenience
export type { VoiceChatState, Voice, TranscriptEntry }

export interface UseMemoryVoiceChatOptions {
  /** Session type - defaults to memory_capture */
  sessionType?: VoiceSessionType
  /** Optional topic to guide the conversation */
  topic?: string
  /** Optional contact ID if memory is about a specific person */
  contactId?: string
  /** Voice to use - defaults to 'coral' */
  voice?: Voice
  /** Persona configuration - defaults to journalist */
  persona?: PersonaConfig
  /** Max questions before suggesting save (default: 5) */
  maxQuestions?: number
  /** Min duration in seconds before save allowed (default: 30) */
  minDurationSeconds?: number
  /** Max duration before auto-end (default: 600 = 10 min) */
  maxDurationSeconds?: number
  /** Callback when session completes */
  onComplete?: (result: VoiceSessionResult) => void
  /** Callback on error */
  onError?: (error: Error) => void
  /** Callback when memory is saved */
  onMemorySaved?: (memoryId: string) => void
}

export interface UseMemoryVoiceChatReturn {
  // State
  state: VoiceChatState
  isConnected: boolean
  isListening: boolean
  isAiSpeaking: boolean
  isSaving: boolean
  
  // Transcript
  transcript: TranscriptEntry[]
  currentUserText: string
  currentAiText: string
  questionCount: number
  sessionDuration: number
  
  // Session info
  sessionId: string | null
  suggestedSummary: string | null
  canSave: boolean
  
  // Error handling
  error: Error | null
  isSupported: boolean | null
  
  // Actions
  start: () => Promise<void>
  stop: () => Promise<void>
  saveMemory: () => Promise<void>
  continueSession: () => void
  abort: () => void
  reset: () => void
}

/**
 * useMemoryVoiceChat - Enhanced voice chat hook for memory capture
 * 
 * Features:
 * - Journalist/biographer persona with warm, natural questions
 * - Automatic turn detection via VAD
 * - Tracks question count and suggests save after ~5 exchanges
 * - Generates memory title and content from transcript
 * - Integrates with Supabase for memory storage
 */
export function useMemoryVoiceChat(
  options: UseMemoryVoiceChatOptions = {}
): UseMemoryVoiceChatReturn {
  const {
    sessionType = 'memory_capture',
    topic,
    contactId,
    voice = 'coral',
    persona = DEFAULT_PERSONA,
    maxQuestions = 5,
    minDurationSeconds = 30,
    maxDurationSeconds = 600,
    onComplete,
    onError,
    onMemorySaved,
  } = options

  const supabase = createClient()

  // Generate unique session ID
  const [sessionId, setSessionId] = useState<string | null>(null)
  
  // Connection state
  const [state, setState] = useState<VoiceChatState>('idle')
  const [error, setError] = useState<Error | null>(null)
  
  // Transcript state
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([])
  const [currentUserText, setCurrentUserText] = useState('')
  const [currentAiText, setCurrentAiText] = useState('')
  
  // Session tracking
  const [questionCount, setQuestionCount] = useState(0)
  const [sessionDuration, setSessionDuration] = useState(0)
  const [suggestedSummary, setSuggestedSummary] = useState<string | null>(null)
  
  // Refs for WebRTC and WebSocket
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const dataChannelRef = useRef<RTCDataChannel | null>(null)
  const audioStreamRef = useRef<MediaStream | null>(null)
  const audioOutputRef = useRef<HTMLAudioElement | null>(null)
  const ephemeralTokenRef = useRef<string | null>(null)
  const sessionStartTimeRef = useRef<number | null>(null)
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const currentUserTextRef = useRef('')
  const currentAiTextRef = useRef('')
  const questionCountRef = useRef(0)
  const isExpectingResponseRef = useRef(false)
  const hasOfferedSaveRef = useRef(false)

  // Check browser support - delay until after mount to avoid hydration mismatch
  const [isSupported, setIsSupported] = useState<boolean | null>(null)
  
  useEffect(() => {
    setIsSupported(
      typeof window !== 'undefined' && 
      !!(window.RTCPeerConnection && navigator.mediaDevices?.getUserMedia)
    )
  }, [])

  // Computed states
  const isConnected = state === 'connected' || state === 'listening' || 
                      state === 'thinking' || state === 'aiSpeaking'
  const isListening = state === 'listening'
  const isAiSpeaking = state === 'aiSpeaking'
  const isSaving = state === 'saving'
  const canSave = transcript.length >= 2 && 
                  sessionDuration >= minDurationSeconds && 
                  !isSaving && 
                  state !== 'saving'

  // Generate session ID on mount
  useEffect(() => {
    setSessionId(`voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
  }, [])

  // Cleanup function
  const cleanup = useCallback(() => {
    // Stop duration tracking
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current)
      durationIntervalRef.current = null
    }

    // Stop audio input stream
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop())
      audioStreamRef.current = null
    }

    // Stop audio output
    if (audioOutputRef.current) {
      audioOutputRef.current.pause()
      audioOutputRef.current.srcObject = null
      audioOutputRef.current = null
    }

    // Close data channel
    if (dataChannelRef.current) {
      dataChannelRef.current.close()
      dataChannelRef.current = null
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }

    ephemeralTokenRef.current = null
  }, [])

  // Update duration timer
  useEffect(() => {
    if (isConnected && sessionStartTimeRef.current) {
      durationIntervalRef.current = setInterval(() => {
        const duration = Math.floor(
          (Date.now() - sessionStartTimeRef.current!) / 1000
        )
        setSessionDuration(duration)

        // Auto-end if max duration reached
        if (duration >= maxDurationSeconds) {
          stop()
        }
      }, 1000)
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current)
      }
    }
  }, [isConnected, maxDurationSeconds])

  // Generate opening message based on topic
  const generateOpeningMessage = useCallback((): string => {
    if (topic) {
      const openings = [
        `I'd love to hear about ${topic}. What comes to mind when you think about it?`,
        `Tell me about ${topic}. What's the story there?`,
        `Let's talk about ${topic}. How did that come about?`,
        `I'm curious about ${topic}. Would you share what you remember?`,
      ]
      return openings[Math.floor(Math.random() * openings.length)]
    }
    
    const generalOpenings = [
      "What's on your mind today? I'd love to hear your thoughts.",
      "Tell me something worth remembering. What story would you like to share?",
      "I'm here to listen. What would you like to talk about?",
      "What's a memory that's been on your mind lately?",
    ]
    return generalOpenings[Math.floor(Math.random() * generalOpenings.length)]
  }, [topic])

  // Generate save offer message
  const generateSaveOfferMessage = useCallback((): string => {
    // Extract a brief summary from the transcript
    const userMessages = transcript
      .filter(t => t.role === 'user')
      .map(t => t.text)
      .join(' ')
      .split('.')[0] // First sentence only
    
    const summary = userMessages.length > 100 
      ? userMessages.substring(0, 100) + '...'
      : userMessages

    return `This has been wonderful — I have a beautiful memory here about "${summary}". If you'd like to keep exploring this, I'm happy to dig deeper. Or we can save this and start fresh whenever you're ready. Just say "save it" or "let's continue."`
  }, [transcript])

  // Send a message via data channel
  const sendMessage = useCallback((dc: RTCDataChannel, message: object) => {
    if (dc.readyState === 'open') {
      dc.send(JSON.stringify(message))
    }
  }, [])

  // Send conversation item and trigger response
  const sendConversationItem = useCallback((dc: RTCDataChannel, text: string) => {
    sendMessage(dc, {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'assistant',
        content: [{ type: 'text', text }],
      },
    })
    sendMessage(dc, { type: 'response.create' })
    
    setCurrentAiText(text)
    currentAiTextRef.current = text
    setState('aiSpeaking')
    isExpectingResponseRef.current = true
  }, [sendMessage])

  // Handle data channel messages from OpenAI
  const handleDataChannelMessage = useCallback((data: string) => {
    try {
      const event = JSON.parse(data)
      console.log('Realtime event:', event.type)

      switch (event.type) {
        case 'input_audio_buffer.speech_started':
          setState('listening')
          setCurrentUserText('')
          currentUserTextRef.current = ''
          break

        case 'input_audio_buffer.speech_stopped':
          setState('thinking')
          break

        case 'conversation.item.input_audio_transcription.completed':
          if (event.transcript) {
            const text = event.transcript.trim()
            if (text) {
              setCurrentUserText(text)
              currentUserTextRef.current = text
              
              const entry: TranscriptEntry = {
                role: 'user',
                text,
                timestamp: Date.now(),
              }
              setTranscript(prev => [...prev, entry])
              
              // Check for save command
              const saveKeywords = ['save it', 'save this', "that's enough", 'save the memory']
              const continueKeywords = ['keep going', "let's continue", 'dig deeper', 'tell me more', 'continue']
              
              const lowerText = text.toLowerCase()
              
              if (saveKeywords.some(kw => lowerText.includes(kw))) {
                // User wants to save
                setTimeout(() => saveMemory(), 500)
                return
              }
              
              if (continueKeywords.some(kw => lowerText.includes(kw))) {
                // User wants to continue - reset the offer flag
                hasOfferedSaveRef.current = false
                return
              }
            }
          }
          break

        case 'response.audio_transcript.delta':
          // AI is speaking - update current text
          setState('aiSpeaking')
          if (event.delta) {
            const newText = currentAiTextRef.current + event.delta
            setCurrentAiText(newText)
            currentAiTextRef.current = newText
          }
          break

        case 'response.audio_transcript.done':
          // AI finished speaking
          if (event.transcript) {
            const text = event.transcript.trim()
            setCurrentAiText(text)
            currentAiTextRef.current = text
            
            const entry: TranscriptEntry = {
              role: 'assistant',
              text,
              timestamp: Date.now(),
            }
            setTranscript(prev => [...prev, entry])
            
            // Increment question count
            questionCountRef.current += 1
            setQuestionCount(questionCountRef.current)
            
            // Mark that we can offer save after enough exchanges
            if (questionCountRef.current >= maxQuestions) {
              hasOfferedSaveRef.current = true
            }
          }
          // Reset for next user input
          currentAiTextRef.current = ''
          break

        case 'response.text.delta':
          if (event.delta) {
            const newText = currentAiTextRef.current + event.delta
            setCurrentAiText(newText)
            currentAiTextRef.current = newText
          }
          break

        case 'response.text.done':
          if (event.text) {
            const text = event.text.trim()
            setCurrentAiText(text)
            currentAiTextRef.current = text
            
            const entry: TranscriptEntry = {
              role: 'assistant',
              text,
              timestamp: Date.now(),
            }
            setTranscript(prev => [...prev, entry])
            
            // Increment question count
            questionCountRef.current += 1
            setQuestionCount(questionCountRef.current)
            isExpectingResponseRef.current = false
            
            // Mark that we can offer save after enough exchanges
            // (The AI handles this via system prompt, we just track for UI)
            if (questionCountRef.current >= maxQuestions) {
              hasOfferedSaveRef.current = true
            }
          }
          break

        case 'response.created':
          // New response starting
          setState('aiSpeaking')
          currentAiTextRef.current = ''
          setCurrentAiText('')
          break

        case 'response.done':
          // Response complete, ready for user input
          setState('connected')
          break

        case 'error':
          console.error('OpenAI error:', event.error)
          // Only show non-rate-limit errors
          if (!event.error?.message?.includes('rate limit')) {
            const error = new Error(event.error?.message || 'Voice session error')
            setError(error)
            onError?.(error)
          }
          break

        default:
          break
      }
    } catch (err) {
      console.error('Error parsing message:', err)
    }
  }, [maxQuestions, onError])

  // Start voice session
  const start = useCallback(async () => {
    if (isSupported === null) {
      return // Still checking support
    }
    if (!isSupported) {
      const err = new Error('Voice chat is not supported in this browser')
      setError(err)
      onError?.(err)
      return
    }

    setState('requesting')
    setError(null)
    setTranscript([])
    setCurrentUserText('')
    setCurrentAiText('')
    setQuestionCount(0)
    setSessionDuration(0)
    setSuggestedSummary(null)
    currentUserTextRef.current = ''
    currentAiTextRef.current = ''
    questionCountRef.current = 0
    isExpectingResponseRef.current = false
    hasOfferedSaveRef.current = false

    try {
      // 1. Get ephemeral token
      const sessionResponse = await fetch('/api/voice/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voice,
          instructions: persona.systemPrompt,
        }),
      })

      if (!sessionResponse.ok) {
        const errorData = await sessionResponse.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to get session token')
      }

      const sessionData = await sessionResponse.json()
      ephemeralTokenRef.current = sessionData.clientSecret

      // 2. Get microphone access
      setState('connecting')
      
      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          }
        })
        audioStreamRef.current = stream
      } catch (micError) {
        throw new Error('Microphone access denied. Please allow microphone access to use voice chat.')
      }

      // 3. Create peer connection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      })
      peerConnectionRef.current = pc

      // 4. Set up audio output for AI voice
      pc.ontrack = (event) => {
        console.log('Received remote audio track')
        if (event.streams && event.streams[0]) {
          // Create audio element if needed
          if (!audioOutputRef.current) {
            audioOutputRef.current = new Audio()
            audioOutputRef.current.autoplay = true
          }
          audioOutputRef.current.srcObject = event.streams[0]
          audioOutputRef.current.play().catch(err => {
            console.error('Audio playback error:', err)
          })
        }
      }

      // 5. Add audio track from microphone
      stream.getAudioTracks().forEach(track => {
        pc.addTrack(track, stream)
      })

      // 5. Create data channel
      const dc = pc.createDataChannel('oai-events')
      dataChannelRef.current = dc

      dc.onopen = () => {
        console.log('Data channel opened')
        
        // Build instructions with the topic embedded prominently
        let instructions = persona.systemPrompt
        if (topic) {
          instructions = `${persona.systemPrompt}

CRITICAL INSTRUCTION: Your FIRST question must be about: "${topic}"

Examples of good opening questions:
- "I'd love to hear about ${topic}. What comes to mind?"
- "Tell me about ${topic}. What's the story there?"
- "Let's talk about ${topic}. What do you remember?"

DO NOT start with generic greetings or ask about unrelated topics. Go directly to the topic.`
        }

        // Configure session with VAD and system instructions
        sendMessage(dc, {
          type: 'session.update',
          session: {
            instructions,
            turn_detection: {
              type: 'server_vad',
              threshold: 0.7, // Higher = less sensitive to background noise
              prefix_padding_ms: 400,
              silence_duration_ms: 800, // Longer pause before AI responds
            },
            input_audio_transcription: {
              model: 'whisper-1',
            },
          },
        })

        // Trigger the AI to start the conversation
        setTimeout(() => {
          sendMessage(dc, { type: 'response.create' })
        }, 500)

        setState('connected')
        sessionStartTimeRef.current = Date.now()
      }

      dc.onmessage = (event) => {
        handleDataChannelMessage(event.data)
      }

      dc.onerror = (error) => {
        console.error('Data channel error:', error)
      }

      // 6. Create offer
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      // Wait for ICE gathering
      await new Promise<void>((resolve) => {
        if (pc.iceGatheringState === 'complete') {
          resolve()
        } else {
          const checkState = () => {
            if (pc.iceGatheringState === 'complete') {
              pc.removeEventListener('icegatheringstatechange', checkState)
              resolve()
            }
          }
          pc.addEventListener('icegatheringstatechange', checkState)
          setTimeout(() => {
            pc.removeEventListener('icegatheringstatechange', checkState)
            resolve()
          }, 3000)
        }
      })

      // 7. Connect to OpenAI Realtime
      const sdpResponse = await fetch('https://api.openai.com/v1/realtime', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ephemeralTokenRef.current}`,
          'Content-Type': 'application/sdp',
        },
        body: pc.localDescription?.sdp,
      })

      if (!sdpResponse.ok) {
        const errorText = await sdpResponse.text()
        throw new Error(`Failed to connect to OpenAI: ${errorText}`)
      }

      const answerSdp = await sdpResponse.text()
      await pc.setRemoteDescription({
        type: 'answer',
        sdp: answerSdp,
      })

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
          stop()
        }
      }

    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      console.error('Voice chat start error:', error)
      setError(error)
      setState('error')
      onError?.(error)
      cleanup()
    }
  }, [isSupported, voice, persona, handleDataChannelMessage, sendMessage, onError, cleanup])

  // Stop session
  const stop = useCallback(async () => {
    const finalTranscript = [...transcript]
    
    // Add any pending text
    if (currentUserTextRef.current) {
      finalTranscript.push({
        role: 'user',
        text: currentUserTextRef.current,
        timestamp: Date.now(),
      })
    }
    if (currentAiTextRef.current && !finalTranscript.find(t => t.text === currentAiTextRef.current)) {
      finalTranscript.push({
        role: 'assistant',
        text: currentAiTextRef.current,
        timestamp: Date.now(),
      })
    }

    const duration = sessionStartTimeRef.current 
      ? Math.floor((Date.now() - sessionStartTimeRef.current) / 1000)
      : 0

    cleanup()
    setState('completed')

    const result: VoiceSessionResult = {
      success: finalTranscript.length >= 2,
      sessionId: sessionId || '',
      transcript: finalTranscript,
      durationSeconds: duration,
      questionCount: questionCountRef.current,
    }

    onComplete?.(result)
  }, [transcript, sessionId, cleanup, onComplete])

  // Save memory to database
  const saveMemory = useCallback(async () => {
    if (!canSave || state === 'saving') return

    setState('saving')

    try {
      const duration = sessionStartTimeRef.current 
        ? Math.floor((Date.now() - sessionStartTimeRef.current) / 1000)
        : sessionDuration

      const response = await fetch('/api/voice/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          topic,
          contactId,
          durationSeconds: duration,
          questionCount: questionCountRef.current,
          generateTitle: true,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to save memory')
      }

      const result = await response.json()

      if (result.success && result.memoryId) {
        onMemorySaved?.(result.memoryId)
        
        // Stop listening and clean up immediately
        cleanup()
        setState('completed')
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      console.error('Save memory error:', error)
      setError(error)
      setState('error')
    }
  }, [canSave, state, transcript, topic, contactId, sessionDuration, onMemorySaved, cleanup])

  // Continue session after save offer
  const continueSession = useCallback(() => {
    hasOfferedSaveRef.current = false
    // Just reset the flag - the conversation continues naturally
  }, [])

  // Abort without saving
  const abort = useCallback(() => {
    cleanup()
    setState('idle')
    setTranscript([])
    setCurrentUserText('')
    setCurrentAiText('')
    setQuestionCount(0)
    setSessionDuration(0)
    setSuggestedSummary(null)
  }, [cleanup])

  // Reset to initial state
  const reset = useCallback(() => {
    abort()
    setError(null)
    setSessionId(`voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
  }, [abort])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  return {
    state,
    isConnected,
    isListening,
    isAiSpeaking,
    isSaving,
    transcript,
    currentUserText,
    currentAiText,
    questionCount,
    sessionDuration,
    sessionId,
    suggestedSummary,
    canSave,
    error,
    isSupported,
    start,
    stop,
    saveMemory,
    continueSession,
    abort,
    reset,
  }
}
