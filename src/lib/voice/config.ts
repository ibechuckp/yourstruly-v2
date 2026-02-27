/**
 * Voice Provider Configuration
 * 
 * Abstraction layer for voice providers (OpenAI, PersonaPlex).
 * Handles voice mapping and provider selection.
 */

import type { Voice } from '@/types/voice'

// ============================================================================
// Voice Provider Types
// ============================================================================

export type VoiceProvider = 'openai' | 'personaplex'

// PersonaPlex voice IDs
export type PersonaPlexVoice = 
  | 'NATF0' | 'NATF1' | 'NATF2'  // Female voices
  | 'NATM0' | 'NATM1' | 'NATM2'  // Male voices

// ============================================================================
// Voice Mapping
// ============================================================================

/**
 * Map OpenAI voices to PersonaPlex equivalents
 * Based on voice characteristics (warm/neutral, male/female)
 */
export const OPENAI_TO_PERSONAPLEX: Record<Voice, PersonaPlexVoice> = {
  // Female voices
  'alloy': 'NATF0',    // Alloy → NATF0 (neutral female)
  'nova': 'NATF1',     // Nova → NATF1 (warm female)
  'shimmer': 'NATF2',  // Shimmer → NATF2 (bright female)
  'coral': 'NATF1',    // Coral → NATF1 (warm female, YT default)
  'sage': 'NATF2',     // Sage → NATF2 (calm female)
  'marin': 'NATF0',    // Marin → NATF0 (neutral female)
  
  // Male voices
  'echo': 'NATM0',     // Echo → NATM0 (neutral male)
  'fable': 'NATM1',    // Fable → NATM1 (expressive male)
  'onyx': 'NATM2',     // Onyx → NATM2 (deep male)
  'ash': 'NATM0',      // Ash → NATM0 (neutral male)
  'ballad': 'NATM1',   // Ballad → NATM1 (storyteller male)
  'cedar': 'NATM2',    // Cedar → NATM2 (deep male)
  'verse': 'NATM1',    // Verse → NATM1 (expressive male)
}

/**
 * Map PersonaPlex voices back to OpenAI equivalents
 * (for display purposes or fallback)
 */
export const PERSONAPLEX_TO_OPENAI: Record<PersonaPlexVoice, Voice> = {
  'NATF0': 'alloy',
  'NATF1': 'coral',   // Default warm female
  'NATF2': 'shimmer',
  'NATM0': 'echo',
  'NATM1': 'fable',
  'NATM2': 'onyx',
}

// ============================================================================
// Provider Configuration
// ============================================================================

export interface VoiceProviderConfig {
  provider: VoiceProvider
  openaiApiUrl: string
  personaplexUrl: string
}

/**
 * Get voice provider configuration from environment
 */
export function getVoiceProviderConfig(): VoiceProviderConfig {
  const provider = (process.env.NEXT_PUBLIC_VOICE_PROVIDER as VoiceProvider) || 'openai'
  
  return {
    provider,
    openaiApiUrl: 'https://api.openai.com/v1/realtime',
    personaplexUrl: process.env.NEXT_PUBLIC_PERSONAPLEX_URL || 'https://100.97.242.10:8998',
  }
}

/**
 * Get the default voice provider from environment
 */
export function getDefaultProvider(): VoiceProvider {
  return (process.env.NEXT_PUBLIC_VOICE_PROVIDER as VoiceProvider) || 'openai'
}

/**
 * Check if PersonaPlex is available (URL configured)
 */
export function isPersonaPlexAvailable(): boolean {
  return !!process.env.NEXT_PUBLIC_PERSONAPLEX_URL
}

// ============================================================================
// Voice Conversion Utilities
// ============================================================================

/**
 * Convert an OpenAI voice to the equivalent PersonaPlex voice
 */
export function toPersonaPlexVoice(openaiVoice: Voice): PersonaPlexVoice {
  return OPENAI_TO_PERSONAPLEX[openaiVoice] || 'NATF1' // Default to warm female
}

/**
 * Convert a PersonaPlex voice to the equivalent OpenAI voice
 */
export function toOpenAIVoice(personaplexVoice: PersonaPlexVoice): Voice {
  return PERSONAPLEX_TO_OPENAI[personaplexVoice] || 'coral' // Default to coral
}

/**
 * Get the voice ID for a specific provider
 */
export function getProviderVoice(voice: Voice, provider: VoiceProvider): string {
  if (provider === 'personaplex') {
    return toPersonaPlexVoice(voice)
  }
  return voice
}

// ============================================================================
// Voice Metadata
// ============================================================================

export interface VoiceInfo {
  id: string
  name: string
  description: string
  gender: 'female' | 'male'
  tone: 'warm' | 'neutral' | 'bright' | 'deep'
}

export const PERSONAPLEX_VOICES: Record<PersonaPlexVoice, VoiceInfo> = {
  'NATF0': { id: 'NATF0', name: 'Natural Female 0', description: 'Neutral, clear female voice', gender: 'female', tone: 'neutral' },
  'NATF1': { id: 'NATF1', name: 'Natural Female 1', description: 'Warm, friendly female voice', gender: 'female', tone: 'warm' },
  'NATF2': { id: 'NATF2', name: 'Natural Female 2', description: 'Bright, energetic female voice', gender: 'female', tone: 'bright' },
  'NATM0': { id: 'NATM0', name: 'Natural Male 0', description: 'Neutral, clear male voice', gender: 'male', tone: 'neutral' },
  'NATM1': { id: 'NATM1', name: 'Natural Male 1', description: 'Warm, expressive male voice', gender: 'male', tone: 'warm' },
  'NATM2': { id: 'NATM2', name: 'Natural Male 2', description: 'Deep, resonant male voice', gender: 'male', tone: 'deep' },
}

export const OPENAI_VOICES: Record<Voice, VoiceInfo> = {
  'alloy': { id: 'alloy', name: 'Alloy', description: 'Neutral, versatile voice', gender: 'female', tone: 'neutral' },
  'ash': { id: 'ash', name: 'Ash', description: 'Calm, balanced voice', gender: 'male', tone: 'neutral' },
  'ballad': { id: 'ballad', name: 'Ballad', description: 'Storytelling voice', gender: 'male', tone: 'warm' },
  'coral': { id: 'coral', name: 'Coral', description: 'Warm, friendly voice (YT default)', gender: 'female', tone: 'warm' },
  'echo': { id: 'echo', name: 'Echo', description: 'Clear, direct voice', gender: 'male', tone: 'neutral' },
  'fable': { id: 'fable', name: 'Fable', description: 'Expressive, animated voice', gender: 'male', tone: 'warm' },
  'marin': { id: 'marin', name: 'Marin', description: 'Gentle, soothing voice', gender: 'female', tone: 'neutral' },
  'nova': { id: 'nova', name: 'Nova', description: 'Warm, engaging voice', gender: 'female', tone: 'warm' },
  'onyx': { id: 'onyx', name: 'Onyx', description: 'Deep, authoritative voice', gender: 'male', tone: 'deep' },
  'sage': { id: 'sage', name: 'Sage', description: 'Calm, wise voice', gender: 'female', tone: 'neutral' },
  'shimmer': { id: 'shimmer', name: 'Shimmer', description: 'Bright, upbeat voice', gender: 'female', tone: 'bright' },
  'cedar': { id: 'cedar', name: 'Cedar', description: 'Grounded, steady voice', gender: 'male', tone: 'deep' },
  'verse': { id: 'verse', name: 'Verse', description: 'Poetic, expressive voice', gender: 'male', tone: 'warm' },
}
