/**
 * PersonaPlex Protocol Types and Codec
 * 
 * Binary protocol for communicating with PersonaPlex server.
 * Based on NVIDIA's PersonaPlex client implementation.
 */

// ============================================================================
// Message Types
// ============================================================================

export type MessageType =
  | 'handshake'
  | 'audio'
  | 'text'
  | 'control'
  | 'metadata'
  | 'error'
  | 'ping'

export type ControlAction = 'start' | 'endTurn' | 'pause' | 'restart'

export type SocketStatus = 'connected' | 'disconnected' | 'connecting'

// ============================================================================
// Message Definitions
// ============================================================================

export type WSMessage =
  | { type: 'handshake'; version: number; model: number }
  | { type: 'audio'; data: Uint8Array }
  | { type: 'text'; data: string }
  | { type: 'control'; action: ControlAction }
  | { type: 'metadata'; data: unknown }
  | { type: 'error'; data: string }
  | { type: 'ping' }

// ============================================================================
// Protocol Constants
// ============================================================================

export const VERSIONS_MAP = {
  0: 0b00000000,
} as const

export const MODELS_MAP = {
  0: 0b00000000,
} as const

export const CONTROL_MESSAGES_MAP: Record<ControlAction, number> = {
  start: 0b00000000,
  endTurn: 0b00000001,
  pause: 0b00000010,
  restart: 0b00000011,
}

export const MESSAGE_TYPE_MAP: Record<number, MessageType> = {
  0x00: 'handshake',
  0x01: 'audio',
  0x02: 'text',
  0x03: 'control',
  0x04: 'metadata',
  0x05: 'error',
  0x06: 'ping',
}

// ============================================================================
// Encoder
// ============================================================================

export function encodeMessage(message: WSMessage): Uint8Array {
  switch (message.type) {
    case 'handshake':
      return new Uint8Array([
        0x00,
        VERSIONS_MAP[message.version as keyof typeof VERSIONS_MAP] ?? 0,
        MODELS_MAP[message.model as keyof typeof MODELS_MAP] ?? 0,
      ])

    case 'audio': {
      const result = new Uint8Array(1 + message.data.length)
      result[0] = 0x01
      result.set(message.data, 1)
      return result
    }

    case 'text': {
      const textBytes = new TextEncoder().encode(message.data)
      const result = new Uint8Array(1 + textBytes.length)
      result[0] = 0x02
      result.set(textBytes, 1)
      return result
    }

    case 'control':
      return new Uint8Array([0x03, CONTROL_MESSAGES_MAP[message.action]])

    case 'metadata': {
      const metaBytes = new TextEncoder().encode(JSON.stringify(message.data))
      const result = new Uint8Array(1 + metaBytes.length)
      result[0] = 0x04
      result.set(metaBytes, 1)
      return result
    }

    case 'error': {
      const errorBytes = new TextEncoder().encode(message.data)
      const result = new Uint8Array(1 + errorBytes.length)
      result[0] = 0x05
      result.set(errorBytes, 1)
      return result
    }

    case 'ping':
      return new Uint8Array([0x06])

    default:
      throw new Error(`Unknown message type: ${(message as any).type}`)
  }
}

// ============================================================================
// Decoder
// ============================================================================

export function decodeMessage(data: Uint8Array): WSMessage {
  if (data.length === 0) {
    throw new Error('Empty message')
  }

  const type = data[0]
  const payload = data.slice(1)

  switch (type) {
    case 0x00: // handshake
      return {
        type: 'handshake',
        version: payload[0] ?? 0,
        model: payload[1] ?? 0,
      }

    case 0x01: // audio
      return {
        type: 'audio',
        data: payload,
      }

    case 0x02: // text
      return {
        type: 'text',
        data: new TextDecoder().decode(payload),
      }

    case 0x03: { // control
      const actionEntry = Object.entries(CONTROL_MESSAGES_MAP).find(
        ([, value]) => value === payload[0]
      )
      if (!actionEntry) {
        throw new Error(`Unknown control action: ${payload[0]}`)
      }
      return {
        type: 'control',
        action: actionEntry[0] as ControlAction,
      }
    }

    case 0x04: // metadata
      return {
        type: 'metadata',
        data: JSON.parse(new TextDecoder().decode(payload)),
      }

    case 0x05: // error
      return {
        type: 'error',
        data: new TextDecoder().decode(payload),
      }

    case 0x06: // ping
      return { type: 'ping' }

    default:
      throw new Error(`Unknown message type: ${type}`)
  }
}

// ============================================================================
// URL Builder
// ============================================================================

export interface PersonaPlexConnectionParams {
  serverUrl: string
  textPrompt: string
  voicePrompt: string
  textTemperature?: number
  textTopk?: number
  audioTemperature?: number
  audioTopk?: number
  padMult?: number
  repetitionPenalty?: number
  repetitionPenaltyContext?: number
  textSeed?: number
  audioSeed?: number
  email?: string
  workerAuthId?: string
}

export function buildWebSocketUrl(params: PersonaPlexConnectionParams): string {
  const url = new URL(params.serverUrl)

  // Required params
  url.searchParams.set('text_prompt', params.textPrompt)
  url.searchParams.set('voice_prompt', params.voicePrompt)

  // Optional params with defaults
  url.searchParams.set('text_temperature', (params.textTemperature ?? 0.7).toString())
  url.searchParams.set('text_topk', (params.textTopk ?? 25).toString())
  url.searchParams.set('audio_temperature', (params.audioTemperature ?? 0.8).toString())
  url.searchParams.set('audio_topk', (params.audioTopk ?? 250).toString())
  url.searchParams.set('pad_mult', (params.padMult ?? 1.0).toString())
  url.searchParams.set('repetition_penalty', (params.repetitionPenalty ?? 1.0).toString())
  url.searchParams.set('repetition_penalty_context', (params.repetitionPenaltyContext ?? 100).toString())

  // Random seeds
  url.searchParams.set('text_seed', (params.textSeed ?? Math.round(Math.random() * 1000000)).toString())
  url.searchParams.set('audio_seed', (params.audioSeed ?? Math.round(Math.random() * 1000000)).toString())

  // Optional auth params
  if (params.email) {
    url.searchParams.set('email', params.email)
  }
  if (params.workerAuthId) {
    url.searchParams.set('worker_auth_id', params.workerAuthId)
  }

  return url.toString()
}
