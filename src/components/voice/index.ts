// Voice Chat Components - OpenAI Realtime Voice Memory Capture
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
export { useMemoryVoiceChat } from '@/hooks/useMemoryVoiceChat'
export { useVideoRecorder } from '@/hooks/useVideoRecorder'
