# OpenAI Realtime Voice Chat

A reusable voice chat component for YoursTruly V2 using OpenAI's Realtime API.

## Components

### 1. Server Endpoint
**File:** `src/app/api/voice/session/route.ts`

Generates ephemeral client tokens for secure browser WebRTC connections.

```typescript
POST /api/voice/session
{
  "voice": "nova",  // optional, defaults to "nova"
  "instructions": "System prompt...",  // optional
  "model": "gpt-4o-realtime-preview"  // optional
}
```

### 2. useVoiceChat Hook
**File:** `src/hooks/useVoiceChat.ts`

Encapsulates WebRTC logic and OpenAI Realtime API communication.

```typescript
const {
  state,           // 'idle' | 'requesting' | 'connecting' | 'connected' | 'listening' | 'thinking' | 'aiSpeaking' | 'error'
  transcript,      // Full conversation transcript
  currentUserText, // Current user speech (live)
  currentAiText,   // Current AI response (live)
  error,           // Error object if any
  isSupported,     // Boolean - WebRTC support check
  start,           // Start voice session
  stop,            // Stop and save transcript
  abort,           // Abort without saving
} = useVoiceChat({
  systemPrompt: 'You are...',
  questions: ['Q1?', 'Q2?'],  // Optional guided questions
  voice: 'nova',
  maxDurationSeconds: 300,
  onTranscript: (user, ai) => {},
  onComplete: (transcript) => {},
  onError: (error) => {},
})
```

### 3. VoiceChat Component
**File:** `src/components/voice/VoiceChat.tsx`

Main reusable component combining the hook and UI.

```typescript
<VoiceChat
  systemPrompt="You are a helpful interviewer..."
  questions={[
    "What's your name?",
    "Tell me about yourself"
  ]}
  voice="nova"
  onTranscript={(userText, aiText) => console.log(userText, aiText)}
  onComplete={(transcript) => console.log(transcript)}
  onError={(error) => console.error(error)}
  maxDurationSeconds={300}
  showTranscript={true}
/>
```

### 4. VoiceChatUI Component
**File:** `src/components/voice/VoiceChatUI.tsx`

Styled UI component with:
- Big microphone button with pulse animation
- Waveform/pulse animation when speaking
- "AI is thinking..." state
- "AI is speaking..." state with audio visualization
- Collapsible transcript panel
- End session button

## Voice Options

- `alloy` - Neutral
- `echo` - Male
- `fable` - British accent
- `onyx` - Deep male
- `nova` - Warm, friendly (default)
- `shimmer` - Young female
- `marin` - Professional female

## Usage Examples

### Basic Usage
```tsx
import { VoiceChat } from '@/components/voice'

function MyComponent() {
  return (
    <VoiceChat
      systemPrompt="You are a helpful assistant."
    />
  )
}
```

### Guided Interview
```tsx
<VoiceChat
  systemPrompt="You are conducting a life story interview."
  questions={[
    "What is your earliest childhood memory?",
    "Who was the most influential person in your life?",
    "What are you most proud of?"
  ]}
  voice="nova"
  onComplete={(transcript) => {
    // Save to database
    console.log('Interview complete:', transcript)
  }}
/>
```

### Custom Styling
```tsx
<VoiceChat
  systemPrompt="Custom prompt..."
  className="max-w-2xl mx-auto"
/>
```

## Test Page

Visit `/dashboard/voice-test` to test different conversation modes:
- Onboarding Interview
- Life Story Interview  
- Daily Engagement
- Free Conversation

## Environment Variables

Make sure `OPENAI_API_KEY` is set in your `.env.local` file.

## Browser Support

Requires WebRTC support:
- Chrome 60+
- Safari 14+
- Firefox 60+

Microphone permission is required.

## How It Works

1. **Token Generation:** Client requests ephemeral token from `/api/voice/session`
2. **WebRTC Setup:** Browser creates peer connection and gets microphone access
3. **SDP Exchange:** Offer sent to OpenAI, answer received and applied
4. **Data Channel:** Real-time events (speech detection, transcription, responses)
5. **Auto VAD:** Server-side voice activity detection handles turn-taking
6. **Guided Questions:** If provided, AI asks questions in sequence

## Features

- ✅ Real-time voice conversation
- ✅ Automatic speech detection (VAD)
- ✅ Interruption handling
- ✅ Live transcription display
- ✅ Guided question sequences
- ✅ Session timeout control
- ✅ Browser compatibility check
- ✅ Error handling with user feedback
- ✅ Collapsible transcript panel
- ✅ Graceful session termination
