'use client'

import { useEffect, useCallback } from 'react'
import { useVoiceChat, Voice } from '@/hooks/useVoiceChat'
import { VoiceChatUI } from './VoiceChatUI'

export interface VoiceChatProps {
  systemPrompt: string
  questions?: string[]
  voice?: Voice
  onTranscript?: (userText: string, aiText: string) => void
  onComplete?: (fullTranscript: { role: 'user' | 'assistant', text: string }[]) => void
  onError?: (error: Error) => void
  maxDurationSeconds?: number
  showTranscript?: boolean
  className?: string
}

/**
 * VoiceChat - OpenAI Realtime Voice Chat Component
 * 
 * A reusable voice chat component using OpenAI's Realtime API.
 * Supports guided conversations with optional questions, real-time
 * transcription, and interruption handling.
 * 
 * Usage:
 * ```tsx
 * <VoiceChat
 *   systemPrompt="You are a helpful interviewer..."
 *   questions={["What's your name?", "Tell me about yourself"]}
 *   voice="nova"
 *   onComplete={(transcript) => console.log(transcript)}
 * />
 * ```
 */
export function VoiceChat({
  systemPrompt,
  questions,
  voice = 'nova',
  onTranscript,
  onComplete,
  onError,
  maxDurationSeconds,
  showTranscript = true,
  className,
}: VoiceChatProps) {
  const {
    state,
    transcript,
    currentUserText,
    currentAiText,
    error,
    isSupported,
    start,
    stop,
    abort,
  } = useVoiceChat({
    systemPrompt,
    questions,
    voice,
    maxDurationSeconds,
    onTranscript,
    onComplete,
    onError,
  })

  // Auto-start if questions are provided
  useEffect(() => {
    if (questions && questions.length > 0 && state === 'idle') {
      // Don't auto-start - let user initiate
    }
  }, [questions, state])

  const handleStart = useCallback(async () => {
    await start()
  }, [start])

  const handleStop = useCallback(() => {
    stop()
  }, [stop])

  if (!isSupported) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-center">
        <p className="text-red-600 font-medium">
          Voice chat is not supported in this browser.
        </p>
        <p className="text-red-500 text-sm mt-2">
          Please use Chrome, Safari, or Firefox with WebRTC support.
        </p>
      </div>
    )
  }

  return (
    <VoiceChatUI
      state={state}
      transcript={transcript}
      currentUserText={currentUserText}
      currentAiText={currentAiText}
      error={error}
      onStart={handleStart}
      onStop={handleStop}
      onAbort={abort}
      showTranscript={showTranscript}
      className={className}
    />
  )
}
