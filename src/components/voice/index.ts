// Voice Chat Components - PersonaPlex Voice Memory Capture
export { VoiceChat } from './VoiceChat'
export { VoiceChatUI } from './VoiceChatUI'
export { VoiceVideoChat } from './VoiceVideoChat'

// Re-export types
export type { VoiceChatProps } from './VoiceChat'
export type { VoiceVideoChatProps } from './VoiceVideoChat'

// Re-export personas from types (they're const objects, not types)
export { 
  JOURNALIST_PERSONA,
  FRIEND_PERSONA, 
  LIFE_STORY_PERSONA 
} from '@/types/voice'

// Re-export hooks
export { usePersonaPlexVoice } from '@/hooks/usePersonaPlexVoice'
export { useVideoRecorder } from '@/hooks/useVideoRecorder'

// Re-export PersonaPlex voice types
export type { PersonaPlexVoice, PersonaPlexState } from '@/hooks/usePersonaPlexVoice'
