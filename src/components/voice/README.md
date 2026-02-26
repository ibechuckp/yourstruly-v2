# Voice Chat Component - OpenAI Realtime API

A sophisticated voice-based memory capture system using OpenAI's Realtime API with WebSocket connections for ~300ms latency.

## Features

- **Journalist/Biographer Persona**: Warm, thoughtful AI that draws out stories naturally
- **Voice Activity Detection (VAD)**: Automatic turn detection for natural conversation
- **Memory Capture Flow**: Guided conversation that suggests saving after ~5 exchanges
- **Multiple Personas**: Choose between journalist, friend, or life-story interviewer
- **Real-time Transcription**: Live transcript display with conversation history
- **Supabase Integration**: Automatic memory creation from voice transcripts

## Usage

### Basic Memory Capture

```tsx
import { VoiceChat } from '@/components/voice'

export default function MemoryCapturePage() {
  return (
    <VoiceChat 
      onMemorySaved={(memoryId) => {
        console.log('Memory saved:', memoryId)
        // Redirect to memory or show success
      }}
    />
  )
}
```

### With Topic

```tsx
<VoiceChat 
  topic="my childhood home"
  onComplete={(result) => {
    console.log('Session completed:', result)
  }}
/>
```

### Life Story Interview

```tsx
<VoiceChat 
  sessionType="life_interview"
  personaName="life-story"
  maxQuestions={10}
  maxDurationSeconds={900}
/>
```

### About a Specific Contact

```tsx
<VoiceChat 
  contactId="contact-uuid-here"
  topic="how we first met"
/>
```

### Friend Mode (Casual)

```tsx
<VoiceChat 
  personaName="friend"
  topic="that trip to Italy"
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `sessionType` | `'memory_capture' \| 'life_interview' \| 'onboarding' \| 'engagement' \| 'freeform'` | `'memory_capture'` | Type of voice session |
| `topic` | `string` | - | Optional topic to guide the conversation |
| `contactId` | `string` | - | Optional contact ID if memory is about someone |
| `voice` | `'alloy' \| 'echo' \| 'fable' \| 'onyx' \| 'nova' \| 'shimmer' \| 'marin'` | `'nova'` | Voice to use |
| `persona` | `PersonaConfig` | - | Custom persona configuration |
| `personaName` | `'journalist' \| 'friend' \| 'life-story'` | `'journalist'` | Pre-configured persona |
| `maxQuestions` | `number` | `5` | Questions before suggesting save |
| `maxDurationSeconds` | `number` | `600` | Max session duration (10 min) |
| `onComplete` | `(result: VoiceSessionResult) => void` | - | Called when session ends |
| `onMemorySaved` | `(memoryId: string) => void` | - | Called when memory is saved |
| `onError` | `(error: Error) => void` | - | Called on error |
| `showTranscript` | `boolean` | `true` | Show transcript panel |
| `className` | `string` | - | Additional CSS classes |

## Personas

### Journalist (Default)
- Warm, thoughtful biographer
- Asks well-phrased, engaging questions
- Professional but intimate tone
- System prompt emphasizes storytelling

### Friend
- Casual, supportive conversation
- Natural follow-up questions
- Celebrates joys, acknowledges struggles
- Like chatting with a close friend

### Life Story Guide
- Professional life story interviewer
- Purposeful, legacy-focused questions
- Helps organize thoughts chronologically
- Respectful of emotional moments

## Voice Commands

During the conversation, users can say:
- **"Save it"** or **"Save this"** - Save the memory and end session
- **"Keep going"** or **"Continue"** - Continue the conversation
- **"That's enough"** - Save and end

## API Routes

### `POST /api/voice/session`
Generates an ephemeral token for OpenAI Realtime API connection.

Request body:
```json
{
  "voice": "nova",
  "instructions": "System prompt...",
  "model": "gpt-4o-realtime-preview"
}
```

### `POST /api/voice/memory`
Creates a memory from the conversation transcript.

Request body:
```json
{
  "transcript": [{"role": "user", "text": "...", "timestamp": 1234567890}],
  "topic": "optional topic",
  "contactId": "optional-contact-id",
  "durationSeconds": 120,
  "questionCount": 5,
  "generateTitle": true
}
```

## Hooks

### `useMemoryVoiceChat`
The core hook for voice memory capture.

```tsx
const {
  state,              // Current state: 'idle' | 'listening' | 'aiSpeaking' | etc.
  isConnected,        // Boolean - is WebRTC connected
  isListening,        // Boolean - is AI listening
  isAiSpeaking,       // Boolean - is AI speaking
  transcript,         // Array of conversation entries
  questionCount,      // Number of questions asked
  sessionDuration,    // Duration in seconds
  canSave,            // Boolean - is memory ready to save
  start,              // Start the session
  stop,               // Stop the session
  saveMemory,         // Save the memory
  abort,              // Abort without saving
  reset,              // Reset to initial state
} = useMemoryVoiceChat(options)
```

## Technical Details

### WebRTC Connection Flow
1. Get ephemeral token from `/api/voice/session`
2. Request microphone access
3. Create RTCPeerConnection
4. Add audio track from microphone
5. Create data channel for events
6. Send SDP offer to OpenAI
7. Set remote description from SDP answer
8. Data channel opens - send session config with VAD
9. AI sends opening message
10. Conversation begins

### Voice Activity Detection (VAD)
- Type: `server_vad`
- Threshold: 0.5
- Prefix padding: 300ms
- Silence duration: 600ms

### Turn Detection
The AI automatically detects when the user stops speaking using server-side VAD, then processes the audio and responds.

## Environment Variables

```bash
# OpenAI Realtime API
OPENAI_API_KEY=sk-proj-...

# Gemini (for title generation)
GEMINI_API_KEY=AIzaSy...
```

## Styling

The component uses Tailwind CSS with:
- Primary color: `#406A56` (sage green)
- Accent color: `#D9C61A` (warm yellow)
- Glassmorphism effects with `backdrop-blur`
- Framer Motion animations

## Browser Support

Requires WebRTC support:
- Chrome 60+
- Safari 14+
- Firefox 60+
- Edge 79+

## Memory Schema

Memories are stored in Supabase with:
- `title`: Generated from content or topic
- `content`: User's story (extracted from transcript)
- `type`: 'voice'
- `metadata`: Including full transcript, duration, question count
- `contact_id`: Optional - if memory is about a specific person
