'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

export type VoiceChatState = 
  | 'idle' 
  | 'requesting' 
  | 'connecting' 
  | 'connected' 
  | 'listening' 
  | 'thinking' 
  | 'aiSpeaking' 
  | 'error'

export type Voice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' | 'marin'

interface TranscriptEntry {
  role: 'user' | 'assistant'
  text: string
  timestamp: number
}

interface UseVoiceChatOptions {
  systemPrompt?: string
  voice?: Voice
  questions?: string[]
  maxDurationSeconds?: number
  onTranscript?: (userText: string, aiText: string) => void
  onComplete?: (fullTranscript: TranscriptEntry[]) => void
  onError?: (error: Error) => void
}

interface UseVoiceChatReturn {
  state: VoiceChatState
  transcript: TranscriptEntry[]
  currentUserText: string
  currentAiText: string
  error: Error | null
  isSupported: boolean
  start: () => Promise<void>
  stop: () => void
  abort: () => void
}

export function useVoiceChat(options: UseVoiceChatOptions = {}): UseVoiceChatReturn {
  const {
    systemPrompt,
    voice = 'nova',
    questions,
    maxDurationSeconds,
    onTranscript,
    onComplete,
    onError,
  } = options

  // State
  const [state, setState] = useState<VoiceChatState>('idle')
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([])
  const [currentUserText, setCurrentUserText] = useState('')
  const [currentAiText, setCurrentAiText] = useState('')
  const [error, setError] = useState<Error | null>(null)

  // Refs for WebRTC
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const dataChannelRef = useRef<RTCDataChannel | null>(null)
  const audioStreamRef = useRef<MediaStream | null>(null)
  const ephemeralTokenRef = useRef<string | null>(null)
  const sessionStartTimeRef = useRef<number | null>(null)
  const currentUserTextRef = useRef('')
  const currentAiTextRef = useRef('')
  const questionsRef = useRef(questions)
  const questionIndexRef = useRef(0)

  // Check browser support
  const isSupported = typeof window !== 'undefined' && 
    !!(window.RTCPeerConnection && (navigator.mediaDevices?.getUserMedia))

  // Update refs when state changes
  useEffect(() => {
    questionsRef.current = questions
  }, [questions])

  // Cleanup function
  const cleanup = useCallback(() => {
    // Stop audio stream
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop())
      audioStreamRef.current = null
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

  // Handle session timeout
  useEffect(() => {
    if (!maxDurationSeconds || state !== 'connected' && state !== 'listening' && state !== 'aiSpeaking') {
      return
    }

    const checkTimeout = () => {
      if (sessionStartTimeRef.current && 
          Date.now() - sessionStartTimeRef.current > maxDurationSeconds * 1000) {
        stop()
      }
    }

    const interval = setInterval(checkTimeout, 1000)
    return () => clearInterval(interval)
  }, [state, maxDurationSeconds])

  // Start voice chat session
  const start = useCallback(async () => {
    if (!isSupported) {
      const err = new Error('WebRTC is not supported in this browser')
      setError(err)
      onError?.(err)
      return
    }

    setState('requesting')
    setError(null)
    setTranscript([])
    setCurrentUserText('')
    setCurrentAiText('')
    currentUserTextRef.current = ''
    currentAiTextRef.current = ''
    questionIndexRef.current = 0

    try {
      // 1. Get ephemeral token from our API
      const sessionResponse = await fetch('/api/voice/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voice,
          instructions: systemPrompt,
        }),
      })

      if (!sessionResponse.ok) {
        const errorData = await sessionResponse.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to get session token')
      }

      const sessionData = await sessionResponse.json()
      ephemeralTokenRef.current = sessionData.clientSecret.value

      // 2. Get microphone access
      setState('connecting')
      
      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        audioStreamRef.current = stream
      } catch (micError) {
        throw new Error('Microphone access denied. Please allow microphone access to use voice chat.')
      }

      // 3. Create WebRTC peer connection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      })
      peerConnectionRef.current = pc

      // 4. Add audio track
      stream.getAudioTracks().forEach(track => {
        pc.addTrack(track, stream)
      })

      // 5. Create data channel for events
      const dc = pc.createDataChannel('oai-events')
      dataChannelRef.current = dc

      // Handle data channel events
      dc.onopen = () => {
        console.log('Data channel opened')
        
        // Send session update with system prompt
        if (systemPrompt) {
          dc.send(JSON.stringify({
            type: 'session.update',
            session: {
              instructions: systemPrompt,
              turn_detection: {
                type: 'server_vad',
                threshold: 0.5,
                prefix_padding_ms: 300,
                silence_duration_ms: 500,
              },
            },
          }))
        }

        // If we have guided questions, send the first one
        if (questionsRef.current && questionsRef.current.length > 0) {
          setTimeout(() => {
            sendQuestion(dc, questionsRef.current![0])
          }, 1000)
        }

        setState('connected')
        sessionStartTimeRef.current = Date.now()
      }

      dc.onmessage = (event) => {
        handleDataChannelMessage(event.data)
      }

      dc.onerror = (error) => {
        console.error('Data channel error:', error)
      }

      // 6. Create and set local description (offer)
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      // Wait for ICE gathering to complete
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
          
          // Timeout after 3 seconds
          setTimeout(() => {
            pc.removeEventListener('icegatheringstatechange', checkState)
            resolve()
          }, 3000)
        }
      })

      // 7. Send SDP to OpenAI
      const sdpResponse = await fetch('https://api.openai.com/v1/realtime/calls', {
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

      // 8. Set remote description
      await pc.setRemoteDescription({
        type: 'answer',
        sdp: answerSdp,
      })

      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        console.log('Connection state:', pc.connectionState)
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
  }, [isSupported, voice, systemPrompt, onError])

  // Send a guided question
  const sendQuestion = (dc: RTCDataChannel, question: string) => {
    if (dc.readyState !== 'open') return

    dc.send(JSON.stringify({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'assistant',
        content: [{ type: 'input_text', text: question }],
      },
    }))

    dc.send(JSON.stringify({ type: 'response.create' }))
    
    setCurrentAiText(question)
    currentAiTextRef.current = question
  }

  // Handle data channel messages from OpenAI
  const handleDataChannelMessage = (data: string) => {
    try {
      const event = JSON.parse(data)
      console.log('Received event:', event.type)

      switch (event.type) {
        case 'input_audio_buffer.speech_started':
          setState('listening')
          // Clear current user text when new speech starts
          setCurrentUserText('')
          currentUserTextRef.current = ''
          break

        case 'input_audio_buffer.speech_stopped':
          setState('thinking')
          break

        case 'conversation.item.input_audio_transcription.completed':
          if (event.transcript) {
            const text = event.transcript
            setCurrentUserText(text)
            currentUserTextRef.current = text
            
            // Add to transcript
            const entry: TranscriptEntry = {
              role: 'user',
              text,
              timestamp: Date.now(),
            }
            setTranscript(prev => [...prev, entry])
          }
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
            setCurrentAiText(event.text)
            currentAiTextRef.current = event.text
            
            // Add to transcript
            const entry: TranscriptEntry = {
              role: 'assistant',
              text: event.text,
              timestamp: Date.now(),
            }
            setTranscript(prev => [...prev, entry])
            
            // Call onTranscript callback
            const userText = currentUserTextRef.current
            if (userText) {
              onTranscript?.(userText, event.text)
            }
          }
          break

        case 'response.audio_transcript.delta':
          // Audio transcript delta (if different from text)
          break

        case 'response.audio_transcript.done':
          // Audio transcript completed
          break

        case 'response.output_item.added':
          if (event.item?.content) {
            setState('aiSpeaking')
          }
          break

        case 'response.done':
          // Response complete, check for next question
          if (questionsRef.current && questionIndexRef.current < questionsRef.current.length - 1) {
            questionIndexRef.current++
            const nextQuestion = questionsRef.current[questionIndexRef.current]
            
            // Small delay before asking next question
            setTimeout(() => {
              if (dataChannelRef.current?.readyState === 'open') {
                sendQuestion(dataChannelRef.current, nextQuestion)
              }
            }, 1500)
          } else {
            setState('connected')
          }
          break

        case 'error':
          console.error('OpenAI error:', event.error)
          if (event.error?.message?.includes('rate limit')) {
            // Ignore rate limit errors during normal operation
          } else {
            const error = new Error(event.error?.message || 'Unknown error from OpenAI')
            setError(error)
            onError?.(error)
          }
          break

        case 'conversation.item.created':
          // Item created successfully
          break

        default:
          // console.log('Unhandled event type:', event.type)
          break
      }
    } catch (err) {
      console.error('Error parsing message:', err)
    }
  }

  // Stop the session gracefully
  const stop = useCallback(() => {
    // Save final transcript
    const finalTranscript = [...transcript]
    
    // Add any pending text
    if (currentUserTextRef.current) {
      finalTranscript.push({
        role: 'user',
        text: currentUserTextRef.current,
        timestamp: Date.now(),
      })
    }
    if (currentAiTextRef.current) {
      finalTranscript.push({
        role: 'assistant',
        text: currentAiTextRef.current,
        timestamp: Date.now(),
      })
    }

    if (finalTranscript.length > 0) {
      onComplete?.(finalTranscript)
    }

    cleanup()
    setState('idle')
    setCurrentUserText('')
    setCurrentAiText('')
  }, [transcript, onComplete, cleanup])

  // Abort immediately without saving
  const abort = useCallback(() => {
    cleanup()
    setState('idle')
    setCurrentUserText('')
    setCurrentAiText('')
    setTranscript([])
  }, [cleanup])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  return {
    state,
    transcript,
    currentUserText,
    currentAiText,
    error,
    isSupported,
    start,
    stop,
    abort,
  }
}
