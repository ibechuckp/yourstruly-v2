'use client'

import { useCallback, useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Video, VideoOff, Camera, Loader2 } from 'lucide-react'
import { useMemoryVoiceChat } from '@/hooks/useMemoryVoiceChat'
import { useVideoRecorder } from '@/hooks/useVideoRecorder'
import { VoiceChatUI } from './VoiceChatUI'
import { createClient } from '@/lib/supabase/client'
import type { 
  Voice, 
  VoiceSessionType, 
  PersonaConfig,
  VoiceSessionResult,
} from '@/types/voice'
import { JOURNALIST_PERSONA, FRIEND_PERSONA, LIFE_STORY_PERSONA } from '@/types/voice'

export interface VoiceVideoChatProps {
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
  /** Called when session completes */
  onComplete?: (result: VoiceSessionResult & { videoUrl?: string }) => void
  /** Called when memory is saved */
  onMemorySaved?: (memoryId: string, videoUrl?: string) => void
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
  onComplete,
  onMemorySaved,
  onError,
  showTranscript = true,
  className = '',
}: VoiceVideoChatProps) {
  const supabase = createClient()
  const [isUploadingVideo, setIsUploadingVideo] = useState(false)
  const [videoEnabled, setVideoEnabled] = useState(enableVideo)
  const [showVideoPreview, setShowVideoPreview] = useState(false)
  const savedMemoryIdRef = useRef<string | null>(null)

  // Get persona
  const selectedPersona = persona || getPersonaByName(personaName)

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

  // Voice chat hook
  const {
    state,
    isConnected,
    transcript,
    currentUserText,
    currentAiText,
    questionCount,
    sessionDuration,
    canSave,
    error,
    isSupported,
    start: startVoice,
    stop: stopVoice,
    saveMemory: saveVoiceMemory,
    abort,
    reset: resetVoice,
  } = useMemoryVoiceChat({
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
      {/* Video Preview */}
      <AnimatePresence>
        {videoEnabled && videoActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="mb-4"
          >
            <div className="relative aspect-video bg-black rounded-2xl overflow-hidden shadow-xl">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover mirror"
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
