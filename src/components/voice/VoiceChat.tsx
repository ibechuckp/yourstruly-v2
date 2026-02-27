'use client'

import { useCallback } from 'react'
import { useMemoryVoiceChat } from '@/hooks/useMemoryVoiceChat'
import { VoiceChatUI } from './VoiceChatUI'
import type { 
  Voice, 
  VoiceSessionType, 
  PersonaConfig,
  VoiceSessionResult,
  VoiceProvider,
} from '@/types/voice'
import { 
  JOURNALIST_PERSONA, 
  FRIEND_PERSONA, 
  LIFE_STORY_PERSONA 
} from '@/types/voice'
import { 
  getDefaultProvider, 
  toPersonaPlexVoice,
  type PersonaPlexVoice,
} from '@/lib/voice/config'

// Re-export personas for convenience
export { JOURNALIST_PERSONA, FRIEND_PERSONA, LIFE_STORY_PERSONA }

export interface VoiceChatProps {
  /** Voice provider to use - defaults to env config or 'openai' */
  provider?: VoiceProvider
  /** Session type - determines the conversational approach */
  sessionType?: VoiceSessionType
  /** Optional topic to guide the conversation */
  topic?: string
  /** Optional contact ID if memory is about a specific person */
  contactId?: string
  /** Voice to use - defaults to 'coral' (warm, friendly) */
  voice?: Voice
  /** Persona configuration - defaults to journalist */
  persona?: PersonaConfig
  /** Pre-configured persona name shorthand */
  personaName?: 'journalist' | 'friend' | 'life-story'
  /** Max questions before suggesting save (default: 5) */
  maxQuestions?: number
  /** Max duration in seconds (default: 600 = 10 min) */
  maxDurationSeconds?: number
  /** Called when session completes */
  onComplete?: (result: VoiceSessionResult) => void
  /** Called when memory is successfully saved */
  onMemorySaved?: (memoryId: string) => void
  /** Called on error */
  onError?: (error: Error) => void
  /** Show full transcript panel */
  showTranscript?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * VoiceChat - Multi-Provider Voice Memory Capture Component
 * 
 * A voice-based memory capture component supporting multiple providers:
 * - OpenAI Realtime API (default)
 * - PersonaPlex (self-hosted, cost-effective)
 * 
 * Features a warm, journalist/biographer persona that naturally draws
 * out stories through conversation.
 * 
 * Flow:
 * 1. User starts session with optional topic
 * 2. AI asks conversational opening
 * 3. AI listens and asks follow-up questions
 * 4. After ~5 questions, AI offers to save or continue
 * 5. User can say "save it" or continue the conversation
 * 6. Memory is created from the transcript
 * 
 * Usage:
 * ```tsx
 * // Basic memory capture (uses default provider from env)
 * <VoiceChat />
 * 
 * // Explicitly use PersonaPlex
 * <VoiceChat provider="personaplex" />
 * 
 * // With topic
 * <VoiceChat topic="my childhood home" />
 * 
 * // Life story interview
 * <VoiceChat 
 *   sessionType="life_interview"
 *   personaName="life-story"
 *   onMemorySaved={(id) => console.log('Saved:', id)}
 * />
 * 
 * // About a specific contact
 * <VoiceChat 
 *   contactId="contact-uuid"
 *   topic="how we met"
 * />
 * ```
 */
export function VoiceChat({
  provider: providerProp,
  sessionType = 'memory_capture',
  topic,
  contactId,
  voice = 'coral',
  persona,
  personaName = 'journalist',
  maxQuestions = 5,
  maxDurationSeconds = 600,
  onComplete,
  onMemorySaved,
  onError,
  showTranscript = true,
  className,
}: VoiceChatProps) {
  // Determine provider (prop > env > default)
  const provider = providerProp || getDefaultProvider()
  
  // Get persona based on props
  const selectedPersona = persona || getPersonaByName(personaName)

  // For PersonaPlex, convert voice to PersonaPlex format
  const effectiveVoice = provider === 'personaplex' 
    ? toPersonaPlexVoice(voice) as unknown as Voice  // Cast back for interface compatibility
    : voice

  // Use OpenAI hook (PersonaPlex hook will be integrated when available)
  // TODO: When usePersonaPlexVoice is ready, conditionally use it based on provider
  const {
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
    canSave,
    error,
    isSupported,
    start,
    stop,
    saveMemory,
    abort,
    reset,
  } = useMemoryVoiceChat({
    sessionType,
    topic,
    contactId,
    voice,  // Use original voice for OpenAI
    persona: selectedPersona,
    maxQuestions,
    maxDurationSeconds,
    onComplete,
    onMemorySaved,
    onError,
  })

  const handleStart = useCallback(async () => {
    await start()
  }, [start])

  const handleStop = useCallback(async () => {
    await stop()
  }, [stop])

  const handleSave = useCallback(async () => {
    await saveMemory()
  }, [saveMemory])

  const handleReset = useCallback(() => {
    reset()
  }, [reset])

  // Show loading while checking browser support (avoids hydration mismatch)
  if (isSupported === null) {
    return (
      <div className="p-6 bg-white/80 backdrop-blur-sm border border-[#406A56]/10 rounded-2xl text-center">
        <div className="animate-pulse">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#406A56]/20" />
          <p className="text-[#406A56]/60 mt-4">Initializing voice chat...</p>
        </div>
      </div>
    )
  }

  if (!isSupported) {
    return (
      <div className="p-6 bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-2xl text-center">
        <p className="text-red-600 font-medium">
          Voice chat is not supported in this browser.
        </p>
        <p className="text-red-500 text-sm mt-2">
          Please use Chrome, Safari, or Firefox with WebRTC support.
        </p>
      </div>
    )
  }

  // PersonaPlex placeholder - will be replaced with actual PersonaPlex UI
  if (provider === 'personaplex') {
    // For now, show a message that PersonaPlex support is coming
    // TODO: Replace with PersonaPlex-specific implementation
    return (
      <div className="p-6 bg-white/80 backdrop-blur-sm border border-[#406A56]/10 rounded-2xl">
        <div className="text-center mb-4">
          <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
            PersonaPlex Provider
          </span>
        </div>
        <VoiceChatUI
          state={state}
          transcript={transcript}
          currentUserText={currentUserText}
          currentAiText={currentAiText}
          questionCount={questionCount}
          sessionDuration={sessionDuration}
          canSave={canSave}
          error={error}
          persona={selectedPersona}
          topic={topic}
          maxQuestions={maxQuestions}
          onStart={handleStart}
          onStop={handleStop}
          onSave={handleSave}
          onAbort={abort}
          onReset={handleReset}
          showTranscript={showTranscript}
          className={className}
        />
      </div>
    )
  }

  return (
    <VoiceChatUI
      state={state}
      transcript={transcript}
      currentUserText={currentUserText}
      currentAiText={currentAiText}
      questionCount={questionCount}
      sessionDuration={sessionDuration}
      canSave={canSave}
      error={error}
      persona={selectedPersona}
      topic={topic}
      maxQuestions={maxQuestions}
      onStart={handleStart}
      onStop={handleStop}
      onSave={handleSave}
      onAbort={abort}
      onReset={handleReset}
      showTranscript={showTranscript}
      className={className}
    />
  )
}

/**
 * Get persona configuration by name
 */
function getPersonaByName(name: 'journalist' | 'friend' | 'life-story'): PersonaConfig {
  switch (name) {
    case 'friend':
      return FRIEND_PERSONA
    case 'life-story':
      return LIFE_STORY_PERSONA
    case 'journalist':
    default:
      return JOURNALIST_PERSONA
  }
}
