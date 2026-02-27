'use client'

import { useCallback, useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Video, VideoOff, Camera, Loader2 } from 'lucide-react'
import { useMemoryVoiceChat } from '@/hooks/useMemoryVoiceChat'
import { usePersonaPlexVoice, type PersonaPlexVoice } from '@/hooks/usePersonaPlexVoice'
import { useVideoRecorder } from '@/hooks/useVideoRecorder'
import { VoiceChatUI } from './VoiceChatUI'
import { createClient } from '@/lib/supabase/client'
import type { 
  Voice, 
  VoiceSessionType, 
  PersonaConfig,
  VoiceSessionResult,
  VoiceProvider,
} from '@/types/voice'
import { JOURNALIST_PERSONA, FRIEND_PERSONA, LIFE_STORY_PERSONA } from '@/types/voice'
import { getDefaultProvider, toPersonaPlexVoice } from '@/lib/voice/config'

export interface VoiceVideoChatProps {
  /** Voice provider - defaults to env config */
  provider?: VoiceProvider
  /** Session type */
  sessionType?: VoiceSessionType
  /** Optional topic */
  topic?: string
  /** Optional contact ID */
  contactId?: string
  /** Voice to use */
  voice?: Voice
  /** Persona name shorthand */
  personaName?: 'journalist' | 'friend' | 'life-story'
  /** Custom persona config */
  persona?: PersonaConfig
  /** Max questions before suggesting save */
  maxQuestions?: number
  /** Max duration in seconds */
  maxDurationSeconds?: number
  /** Enable video capture */
  enableVideo?: boolean
  /** Video quality */
  videoQuality?: 'low' | 'medium' | 'high'
  /** Auto-start the conversation immediately */
  autoStart?: boolean
  /** Called when session completes */
  onComplete?: (result: VoiceSessionResult & { videoUrl?: string }) => void
  /** Called when memory is saved */
  onMemorySaved?: (memoryId: string, videoUrl?: string) => void
  /** Called with extracted entities (people, places) after save */
  onEntitiesExtracted?: (entities: { people: string[]; places: string[] }) => void
  /** Called on error */
  onError?: (error: Error) => void
  /** Show transcript */
  showTranscript?: boolean
  /** Additional CSS */
  className?: string
}

/**
 * VoiceVideoChat - Combined voice + video memory capture
 * 
 * Extends VoiceChat to optionally record video alongside the audio conversation.
 * Video is uploaded to Supabase storage and linked to the memory.
 */
export function VoiceVideoChat({
  provider: providerProp,
  sessionType = 'memory_capture',
  topic,
  contactId,
  voice = 'coral',
  personaName = 'journalist',
  persona,
  maxQuestions = 5,
  maxDurationSeconds = 600,
  enableVideo = false,
  videoQuality = 'medium',
  autoStart = false,
  onComplete,
  onMemorySaved,
  onEntitiesExtracted,
  onError,
  showTranscript = true,
  className = '',
}: VoiceVideoChatProps) {
  const supabase = createClient()
  const [isUploadingVideo, setIsUploadingVideo] = useState(false)
  const [videoEnabled, setVideoEnabled] = useState(enableVideo)
  const [showVideoPreview, setShowVideoPreview] = useState(false)
  const [hasAutoStarted, setHasAutoStarted] = useState(false)
  const savedMemoryIdRef = useRef<string | null>(null)
  
  // Determine provider (prop > env > default)
  const provider = providerProp || getDefaultProvider()
  const isPersonaPlex = provider === 'personaplex'

  // Get persona
  const selectedPersona = persona || getPersonaByName(personaName)
  
  // PersonaPlex voice conversion
  const ppVoice = toPersonaPlexVoice(voice) as PersonaPlexVoice

  // Video recorder hook
  const {
    isSupported: videoSupported,
    isActive: videoActive,
    isRecording: videoRecording,
    videoRef,
    recordedBlob,
    startCamera,
    stopCamera,
    startRecording: startVideoRecording,
    stopRecording: stopVideoRecording,
    reset: resetVideo,
  } = useVideoRecorder({
    quality: videoQuality,
    maxDurationSeconds,
    onError,
  })

  // Track PersonaPlex session state
  const [ppQuestionCount, setPpQuestionCount] = useState(0)
  const [ppSessionDuration, setPpSessionDuration] = useState(0)
  const [ppIsSaving, setPpIsSaving] = useState(false)

  // PersonaPlex hook (only active when provider is personaplex)
  const personaPlex = usePersonaPlexVoice({
    serverUrl: process.env.NEXT_PUBLIC_PERSONAPLEX_URL,
    systemPrompt: selectedPersona.systemPrompt,
    voice: ppVoice,
    enableRecording: true,
    onTranscript: (userText, aiText) => {
      if (aiText && aiText.includes('?')) {
        setPpQuestionCount(prev => prev + 1)
      }
    },
    onError,
  })

  // OpenAI hook (only active when provider is openai)
  const openAI = useMemoryVoiceChat({
    sessionType,
    topic,
    contactId,
    voice,
    persona: selectedPersona,
    maxQuestions,
    maxDurationSeconds,
    onComplete: async (result) => {
      // If video was recorded, include it
      if (recordedBlob && savedMemoryIdRef.current) {
        const videoUrl = await uploadVideo(savedMemoryIdRef.current, recordedBlob)
        onComplete?.({ ...result, videoUrl })
      } else {
        onComplete?.(result)
      }
    },
    onMemorySaved: async (memoryId) => {
      savedMemoryIdRef.current = memoryId
      
      // Stop video recording
      if (videoRecording) {
        stopVideoRecording()
      }

      // Extract people and places from transcript
      const extractedEntities = extractEntities(transcript)
      if (extractedEntities.people.length > 0 || extractedEntities.places.length > 0) {
        onEntitiesExtracted?.(extractedEntities)
      }

      // Upload video if we have one
      if (recordedBlob) {
        const videoUrl = await uploadVideo(memoryId, recordedBlob)
        onMemorySaved?.(memoryId, videoUrl)
      } else {
        onMemorySaved?.(memoryId)
      }
    },
    onError,
  })

  // Unified state - select from active provider
  const state = isPersonaPlex ? personaPlex.state : openAI.state
  const isConnected = isPersonaPlex 
    ? ['connected', 'listening', 'thinking', 'aiSpeaking'].includes(personaPlex.state)
    : openAI.isConnected
  const transcript = isPersonaPlex ? personaPlex.transcript : openAI.transcript
  const currentUserText = isPersonaPlex ? personaPlex.currentUserText : openAI.currentUserText
  const currentAiText = isPersonaPlex ? personaPlex.currentAiText : openAI.currentAiText
  const questionCount = isPersonaPlex ? ppQuestionCount : openAI.questionCount
  const sessionDuration = isPersonaPlex ? ppSessionDuration : openAI.sessionDuration
  const canSave = isPersonaPlex ? transcript.length >= 2 : openAI.canSave
  const error = isPersonaPlex ? personaPlex.error : openAI.error
  const isSupported = isPersonaPlex ? personaPlex.isSupported : openAI.isSupported
  const isSaving = isPersonaPlex ? ppIsSaving : false // OpenAI tracks this internally

  // Unified actions
  const startVoice = useCallback(async () => {
    if (isPersonaPlex) {
      await personaPlex.start()
    } else {
      await openAI.start()
    }
  }, [isPersonaPlex, personaPlex, openAI])

  const stopVoice = useCallback(async () => {
    if (isPersonaPlex) {
      personaPlex.stop()
    } else {
      await openAI.stop()
    }
  }, [isPersonaPlex, personaPlex, openAI])

  const saveVoiceMemory = useCallback(async () => {
    if (isPersonaPlex) {
      setPpIsSaving(true)
      // TODO: Implement PersonaPlex memory save
      // For now, we have the transcript and recording blob
      console.log('PersonaPlex save:', personaPlex.transcript, personaPlex.recordingBlob)
      setPpIsSaving(false)
    } else {
      await openAI.saveMemory()
    }
  }, [isPersonaPlex, personaPlex, openAI])

  const abort = useCallback(() => {
    if (isPersonaPlex) {
      personaPlex.abort()
    } else {
      openAI.abort()
    }
  }, [isPersonaPlex, personaPlex, openAI])

  const resetVoice = useCallback(() => {
    if (isPersonaPlex) {
      personaPlex.abort()
      setPpQuestionCount(0)
      setPpSessionDuration(0)
    } else {
      openAI.reset()
    }
  }, [isPersonaPlex, personaPlex, openAI])

  // Auto-start when component mounts if autoStart is true
  useEffect(() => {
    if (autoStart && !hasAutoStarted && isSupported) {
      setHasAutoStarted(true)
      // Small delay to ensure component is fully mounted
      const timer = setTimeout(() => {
        handleStart()
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [autoStart, hasAutoStarted, isSupported])

  // Upload video to Supabase
  const uploadVideo = async (memoryId: string, blob: Blob): Promise<string | undefined> => {
    setIsUploadingVideo(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const fileName = `${user.id}/${memoryId}/video_${Date.now()}.webm`
      
      const { data, error: uploadError } = await supabase.storage
        .from('memory-media')
        .upload(fileName, blob, {
          contentType: 'video/webm',
          upsert: false,
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('memory-media')
        .getPublicUrl(fileName)

      const videoUrl = urlData.publicUrl

      // Link video to memory
      await supabase.from('memory_media').insert({
        memory_id: memoryId,
        file_url: videoUrl,
        file_type: 'video',
        file_name: `video_${Date.now()}.webm`,
        mime_type: 'video/webm',
        file_size: blob.size,
      })

      return videoUrl
    } catch (err) {
      console.error('Video upload error:', err)
      onError?.(err instanceof Error ? err : new Error('Video upload failed'))
      return undefined
    } finally {
      setIsUploadingVideo(false)
    }
  }

  // Combined start function
  const handleStart = useCallback(async () => {
    // Start camera if video enabled
    if (videoEnabled && videoSupported) {
      await startCamera()
      startVideoRecording()
    }
    
    // Start voice
    await startVoice()
  }, [videoEnabled, videoSupported, startCamera, startVideoRecording, startVoice])

  // Combined stop function
  const handleStop = useCallback(async () => {
    if (videoRecording) {
      stopVideoRecording()
    }
    await stopVoice()
  }, [videoRecording, stopVideoRecording, stopVoice])

  // Combined save function
  const handleSave = useCallback(async () => {
    // Video will be handled in the onMemorySaved callback
    await saveVoiceMemory()
  }, [saveVoiceMemory])

  // Combined reset function
  const handleReset = useCallback(() => {
    resetVideo()
    resetVoice()
    savedMemoryIdRef.current = null
    setShowVideoPreview(false)
  }, [resetVideo, resetVoice])

  // Toggle video
  const toggleVideo = useCallback(async () => {
    if (videoEnabled) {
      stopCamera()
      setVideoEnabled(false)
    } else {
      setVideoEnabled(true)
      if (isConnected) {
        await startCamera()
        startVideoRecording()
      }
    }
  }, [videoEnabled, isConnected, startCamera, stopCamera, startVideoRecording])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (videoActive) {
        stopCamera()
      }
    }
  }, [videoActive, stopCamera])

  // Loading state
  if (isSupported === null) {
    return (
      <div className="p-6 bg-white/80 backdrop-blur-sm border border-[#406A56]/10 rounded-2xl text-center">
        <div className="animate-pulse">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#406A56]/20" />
          <p className="text-[#406A56]/60 mt-4">Initializing...</p>
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
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {/* Video Preview - always render when videoEnabled so the ref is available for startCamera */}
      {videoEnabled && (
        <div className={`mb-4 transition-all duration-300 ${videoActive ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: videoActive ? 1 : 0, scale: videoActive ? 1 : 0.95 }}
            className="relative aspect-video bg-black rounded-2xl overflow-hidden shadow-xl"
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }} // Mirror for selfie cam
            />
            
            {/* Recording indicator */}
            {videoRecording && (
              <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-red-500 text-white text-sm font-medium rounded-full">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                Recording
              </div>
            )}
            
            {/* Video toggle */}
            <button
              onClick={toggleVideo}
              className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
              title="Turn off camera"
            >
              <VideoOff size={18} />
            </button>
          </motion.div>
        </div>
      )}

      {/* Enable video button when not active */}
      {!videoEnabled && videoSupported && state === 'idle' && (
        <div className="mb-4 flex justify-center">
          <button
            onClick={() => setVideoEnabled(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-[#406A56] bg-[#406A56]/10 hover:bg-[#406A56]/20 rounded-full transition-colors"
          >
            <Camera size={16} />
            Enable video recording
          </button>
        </div>
      )}

      {/* Main Voice UI */}
      <VoiceChatUI
        state={isUploadingVideo ? 'saving' : state}
        transcript={transcript}
        currentUserText={currentUserText}
        currentAiText={currentAiText}
        questionCount={questionCount}
        sessionDuration={sessionDuration}
        canSave={canSave && !isUploadingVideo}
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
      />

      {/* Video upload indicator */}
      <AnimatePresence>
        {isUploadingVideo && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-3xl"
          >
            <div className="text-center">
              <Loader2 size={32} className="animate-spin text-[#406A56] mx-auto mb-3" />
              <p className="text-[#406A56] font-medium">Uploading video...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function getPersonaByName(name: 'journalist' | 'friend' | 'life-story'): PersonaConfig {
  switch (name) {
    case 'friend':
      return FRIEND_PERSONA
    case 'life-story':
      return LIFE_STORY_PERSONA
    default:
      return JOURNALIST_PERSONA
  }
}

/**
 * Extract people names from transcript
 * More conservative extraction - only obvious name patterns
 */
function extractEntities(transcript: Array<{ role: string; text: string }>): { people: string[]; places: string[] } {
  const people = new Set<string>()
  const places = new Set<string>()
  
  // Very strict exclusion list - common words that look like names
  const excludeWords = new Set([
    // Pronouns and common words
    'i', 'the', 'this', 'that', 'what', 'when', 'where', 'who', 'how', 'why',
    'my', 'your', 'his', 'her', 'its', 'our', 'their', 'we', 'you', 'he', 'she', 'it', 'they',
    'and', 'but', 'or', 'so', 'if', 'then', 'now', 'just', 'really', 'very', 'always',
    'would', 'could', 'should', 'will', 'can', 'may', 'might', 'must',
    'was', 'were', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'about', 'after', 'before', 'because', 'while', 'during', 'through',
    'with', 'from', 'into', 'over', 'under', 'again', 'further', 'once',
    // Family terms
    'mom', 'dad', 'mother', 'father', 'grandma', 'grandpa', 'grandmother', 'grandfather',
    'sister', 'brother', 'aunt', 'uncle', 'cousin', 'wife', 'husband', 'son', 'daughter',
    // Common nouns that might be capitalized
    'recipe', 'family', 'kitchen', 'house', 'home', 'food', 'time', 'day', 'year',
    'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday',
    'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august',
    'september', 'october', 'november', 'december', 'christmas', 'thanksgiving',
  ])
  
  // Only very specific patterns for names
  const namePatterns = [
    // "named X" or "called X" - most reliable
    /(?:named|called)\s+([A-Z][a-z]{2,})/gi,
    // "my friend/neighbor X" with explicit name following
    /my\s+(?:friend|neighbor|colleague)\s+([A-Z][a-z]{2,})/gi,
    // "X taught me" or "X showed me" - name as subject
    /([A-Z][a-z]{2,})\s+(?:taught|showed|told)\s+me/gi,
  ]
  
  // Combine all text (both user and AI to catch when AI repeats names)
  const allText = transcript.map(t => t.text).join(' ')
  
  // Extract names with strict filtering
  for (const pattern of namePatterns) {
    let match
    pattern.lastIndex = 0 // Reset regex state
    while ((match = pattern.exec(allText)) !== null) {
      const name = match[1]?.trim()
      // Must be 3+ chars, not in exclude list, and look like a proper name
      if (name && 
          name.length >= 3 && 
          !excludeWords.has(name.toLowerCase()) &&
          /^[A-Z][a-z]+$/.test(name)) {
        people.add(name)
      }
    }
  }
  
  return {
    people: Array.from(people),
    places: Array.from(places)
  }
}
