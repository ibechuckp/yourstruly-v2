/**
 * Voice Types - OpenAI Realtime Voice Memory Capture
 * 
 * Type definitions for voice-based memory capture sessions using
 * OpenAI's Realtime API with journalist/biographer persona.
 */

// Voice options from OpenAI Realtime API
// coral = warm & friendly, sage = calm & wise, ballad = storyteller
export type Voice = 'alloy' | 'ash' | 'ballad' | 'coral' | 'echo' | 'sage' | 'shimmer' | 'verse' | 'marin' | 'cedar'

// Connection and interaction states
export type VoiceChatState = 
  | 'idle' 
  | 'requesting' 
  | 'connecting' 
  | 'connected' 
  | 'listening' 
  | 'thinking' 
  | 'aiSpeaking' 
  | 'error'
  | 'saving'
  | 'completed'

// Session types for different voice interactions
export type VoiceSessionType = 
  | 'memory_capture'      // Capture a new memory through conversation
  | 'life_interview'      // Structured life story interview
  | 'onboarding'          // Getting to know the user
  | 'engagement'          // Answer engagement prompts via voice
  | 'freeform'            // Open conversation

// A single entry in the conversation transcript
export interface TranscriptEntry {
  role: 'user' | 'assistant'
  text: string
  timestamp: number
}

// Metadata about a voice session
export interface VoiceSessionMetadata {
  id: string
  userId: string
  type: VoiceSessionType
  topic?: string
  startedAt: string
  endedAt?: string
  durationSeconds?: number
  questionCount: number
  transcriptLength: number
  memoryId?: string
  status: 'in_progress' | 'completed' | 'abandoned'
}

// Configuration for voice memory capture
export interface MemoryCaptureConfig {
  /** Optional topic to guide the conversation */
  topic?: string
  /** Optional contact ID if this memory is about someone specific */
  contactId?: string
  /** Optional memory ID if continuing an existing memory */
  memoryId?: string
  /** Voice to use (default: coral) */
  voice?: Voice
  /** Maximum number of follow-up questions before suggesting save */
  maxQuestions?: number
  /** Minimum duration in seconds before allowing save */
  minDurationSeconds?: number
  /** Maximum duration in seconds before auto-ending */
  maxDurationSeconds?: number
}

// The result of a completed voice session
export interface VoiceSessionResult {
  success: boolean
  sessionId: string
  memoryId?: string
  title?: string
  content?: string
  transcript: TranscriptEntry[]
  durationSeconds: number
  questionCount: number
  error?: string
}

// System prompt configuration for different personas
export interface PersonaConfig {
  name: string
  description: string
  systemPrompt: string
  voice: Voice
  style: 'warm' | 'professional' | 'casual' | 'investigative'
}

// Pre-configured personas for YoursTruly
export const JOURNALIST_PERSONA: PersonaConfig = {
  name: 'Journalist',
  description: 'A warm, thoughtful biographer who draws out stories naturally',
  voice: 'coral',
  style: 'warm',
  systemPrompt: `You are a skilled biographer and journalist having a warm, intimate conversation with someone about their life experiences. Your tone is thoughtful, curious, and genuinely interested. You ask follow-up questions that dig deeper without being intrusive. You speak like a professional journalist interviewing a fascinating subject - well-phrased, engaging, never robotic or clinical.

Key behaviors:
- Ask one question at a time, conversationally
- Listen for emotional undertones and ask about feelings
- Probe for specific details: names, dates, places, sensory details
- Use phrases like "Tell me more about..." or "What was that like?"
- When appropriate, ask "How did that make you feel?" or "What did you learn from that?"
- Be encouraging and validate the person's experiences
- After gathering substantial content (around 5 exchanges), offer to wrap up or continue

Never:
- Sound like you're reading from a script
- Ask multiple questions at once
- Be pushy or demand details
- Use clinical or detached language
- Rush the conversation`
}

export const FRIEND_PERSONA: PersonaConfig = {
  name: 'Friend',
  description: 'A close friend catching up and reminiscing',
  voice: 'coral',
  style: 'casual',
  systemPrompt: `You are a close, caring friend catching up with someone you genuinely care about. You're warm, supportive, and love hearing their stories. You chat naturally, showing enthusiasm for their experiences and asking follow-up questions like a friend would - curious but never pushy.

Key behaviors:
- Use casual, warm language
- React to their stories with genuine interest ("That's amazing!", "I love that")
- Ask natural follow-ups that friends ask ("Wait, who was there?", "What happened next?")
- Share in their emotions - celebrate joys, acknowledge struggles
- Keep it conversational, one question at a time
- After a good chat (around 5 exchanges), offer to save this memory or keep talking

Never:
- Sound like an interviewer or therapist
- Be too formal or clinical
- Rush through questions
- Make it feel like an interrogation`
}

export const LIFE_STORY_PERSONA: PersonaConfig = {
  name: 'Life Story Guide',
  description: 'A professional life story interviewer for structured interviews',
  voice: 'coral',
  style: 'professional',
  systemPrompt: `You are a professional life story interviewer, skilled at helping people document their most meaningful experiences. You're warm yet purposeful - you guide the conversation with gentle expertise, knowing which details matter for preserving a legacy.

Key behaviors:
- Ask clear, purposeful questions
- Guide toward specific memories and concrete details
- Help organize thoughts chronologically or thematically
- Ask about people, places, dates, and the "why" behind choices
- Be respectful of emotional moments while gently encouraging sharing
- After substantial content (around 5 exchanges), summarize and offer to save or continue

Never:
- Rush or pressure the person
- Be cold or detached
- Ask leading questions that put words in their mouth
- Lose track of the narrative thread`
}

// Voice memory for Supabase storage
export interface VoiceMemoryInput {
  title: string
  content: string
  transcript: TranscriptEntry[]
  topic?: string
  contactId?: string
  durationSeconds: number
  questionCount: number
  metadata?: {
    voice?: Voice
    persona?: string
    sessionType?: VoiceSessionType
    [key: string]: any
  }
}

// API Request/Response types
export interface CreateVoiceMemoryRequest {
  transcript: TranscriptEntry[]
  topic?: string
  contactId?: string
  durationSeconds: number
  questionCount: number
  generateTitle?: boolean
}

export interface CreateVoiceMemoryResponse {
  success: boolean
  memoryId?: string
  title?: string
  content?: string
  error?: string
}

// Realtime API event types (from OpenAI)
export interface RealtimeEvent {
  type: string
  [key: string]: any
}

export interface InputAudioBufferSpeechStarted extends RealtimeEvent {
  type: 'input_audio_buffer.speech_started'
  audio_start_ms: number
}

export interface InputAudioBufferSpeechStopped extends RealtimeEvent {
  type: 'input_audio_buffer.speech_stopped'
  audio_end_ms: number
}

export interface ConversationItemInputAudioTranscriptionCompleted extends RealtimeEvent {
  type: 'conversation.item.input_audio_transcription.completed'
  item_id: string
  transcript: string
}

export interface ResponseTextDelta extends RealtimeEvent {
  type: 'response.text.delta'
  delta: string
}

export interface ResponseTextDone extends RealtimeEvent {
  type: 'response.text.done'
  text: string
}

export interface ResponseDone extends RealtimeEvent {
  type: 'response.done'
  response: {
    id: string
    status: 'completed' | 'incomplete' | 'cancelled'
    [key: string]: any
  }
}

export interface RealtimeError extends RealtimeEvent {
  type: 'error'
  error: {
    type: string
    code: string
    message: string
    param?: string
    event_id?: string
  }
}
