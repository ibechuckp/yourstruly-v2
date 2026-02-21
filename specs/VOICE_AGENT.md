# Voice Agent Specification

*Last updated: 2026-02-21*

---

## Overview

YoursTruly's voice agent is the primary interface. The AI companion **speaks** to users — typing is secondary.

### Core Philosophy
- Voice-first, not voice-enabled
- Warm, patient, comforting — like talking to a trusted friend
- Senior-friendly: clear pronunciation, moderate pace, natural pauses
- Emotionally intelligent: can express care, enthusiasm, gentle humor

---

## Technology Stack

| Component | Technology | Why |
|-----------|------------|-----|
| **TTS Engine** | Chatterbox (self-hosted) | Open source, voice cloning, emotion control |
| **STT Engine** | Deepgram | Fast, accurate, streaming |
| **LLM** | Claude | Best reasoning, safety, tone control |
| **Voice Cloning** | Chatterbox | Same engine, Phase 2 Digital Twin |

---

## Voice Requirements

### AI Companion Voice (Default)

**Characteristics:**
- Warm and approachable (not robotic, not overly perky)
- Clear diction (seniors need to understand every word)
- Moderate pace (~140-160 WPM for comfort)
- Natural emotional range (can sound caring, encouraging, gently humorous)
- Slight maturity (30s-50s feel, not too young, not elderly)

**Anti-patterns:**
- ❌ Siri/Alexa robotic tone
- ❌ Overly enthusiastic "assistant" energy
- ❌ Monotone narration
- ❌ Too fast or breathless
- ❌ Heavy accent that reduces clarity

### Voice Options

We'll offer a choice during onboarding:

1. **Default voices** (2-3 curated options per gender)
2. **User's own voice** (Phase 2 — Digital Twin feature)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client (Mobile)                       │
├─────────────────────────────────────────────────────────────┤
│  [Mic] ──→ AudioRecorder ──→ WebSocket ──→ [Server]         │
│  [Speaker] ←── AudioPlayer ←── Stream ←── [Server]          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Voice Server (Fly.io)                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. STT (Deepgram)                                          │
│     - Streaming transcription                                │
│     - Interim results for responsiveness                    │
│     - Final transcript → LLM                                │
│                                                              │
│  2. LLM (Claude)                                            │
│     - Context: user profile, memories, conversation         │
│     - System prompt: warmth, patience, guidance             │
│     - Response: text + emotion hints                        │
│                                                              │
│  3. TTS (Chatterbox)                                        │
│     - Text → Speech with selected voice                     │
│     - Emotion tags: [warm], [encouraging], [gentle]         │
│     - Streaming output for low latency                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Chatterbox Integration

### Setup (Self-hosted)

```bash
# Install
pip install chatterbox-tts

# Or Docker (recommended for production)
docker pull resembleai/chatterbox:latest
```

### Voice Reference Management

```typescript
// src/lib/voice/voices.ts

export interface VoiceProfile {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'neutral';
  description: string;
  referenceClipPath: string;
  characteristics: {
    warmth: number;      // 1-10
    clarity: number;     // 1-10
    pace: 'slow' | 'moderate' | 'fast';
    age: 'young' | 'middle' | 'mature';
  };
}

export const DEFAULT_VOICES: VoiceProfile[] = [
  {
    id: 'aria',
    name: 'Aria',
    gender: 'female',
    description: 'Warm and nurturing, like a caring friend',
    referenceClipPath: '/voices/aria-reference.wav',
    characteristics: {
      warmth: 9,
      clarity: 9,
      pace: 'moderate',
      age: 'middle'
    }
  },
  {
    id: 'james',
    name: 'James',
    gender: 'male',
    description: 'Calm and reassuring, gentle strength',
    referenceClipPath: '/voices/james-reference.wav',
    characteristics: {
      warmth: 8,
      clarity: 9,
      pace: 'moderate',
      age: 'middle'
    }
  },
  // ... more voices
];
```

### TTS Service

```typescript
// src/lib/voice/tts-service.ts

import { spawn } from 'child_process';

interface TTSOptions {
  text: string;
  voiceId: string;
  emotion?: 'neutral' | 'warm' | 'encouraging' | 'gentle' | 'excited';
  exaggeration?: number;  // 0-1, default 0.5
}

export class ChatterboxTTS {
  private modelPath: string;
  private voicesPath: string;

  constructor(config: { modelPath: string; voicesPath: string }) {
    this.modelPath = config.modelPath;
    this.voicesPath = config.voicesPath;
  }

  async synthesize(options: TTSOptions): Promise<Buffer> {
    const voice = DEFAULT_VOICES.find(v => v.id === options.voiceId);
    if (!voice) throw new Error(`Voice not found: ${options.voiceId}`);

    // Add emotion tags to text
    const textWithTags = this.addEmotionTags(options.text, options.emotion);

    // Call Chatterbox
    return this.runChatterbox({
      text: textWithTags,
      referenceClip: voice.referenceClipPath,
      exaggeration: options.exaggeration ?? 0.5
    });
  }

  private addEmotionTags(text: string, emotion?: string): string {
    // Chatterbox supports paralinguistic tags
    const emotionPrefixes: Record<string, string> = {
      warm: '',  // Natural warmth from reference
      encouraging: '[smile] ',
      gentle: '',
      excited: '[laugh] '
    };
    
    return (emotionPrefixes[emotion ?? 'neutral'] ?? '') + text;
  }

  private async runChatterbox(params: {
    text: string;
    referenceClip: string;
    exaggeration: number;
  }): Promise<Buffer> {
    // Implementation uses Python subprocess or HTTP API
    // See chatterbox-server.py below
  }
}
```

### Chatterbox Server (Python)

```python
# voice-server/chatterbox_server.py

from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import torchaudio as ta
from chatterbox.tts_turbo import ChatterboxTurboTTS
import io
import torch

app = FastAPI()
model = None

@app.on_event("startup")
async def load_model():
    global model
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model = ChatterboxTurboTTS.from_pretrained(device=device)

class TTSRequest(BaseModel):
    text: str
    voice_reference_path: str
    exaggeration: float = 0.5

@app.post("/synthesize")
async def synthesize(request: TTSRequest):
    if not model:
        raise HTTPException(500, "Model not loaded")
    
    try:
        wav = model.generate(
            request.text,
            audio_prompt_path=request.voice_reference_path,
            exaggeration=request.exaggeration
        )
        
        # Convert to bytes
        buffer = io.BytesIO()
        ta.save(buffer, wav, model.sr, format="wav")
        buffer.seek(0)
        
        return StreamingResponse(
            buffer,
            media_type="audio/wav"
        )
    except Exception as e:
        raise HTTPException(500, str(e))

@app.get("/health")
async def health():
    return {"status": "ok", "model_loaded": model is not None}
```

---

## Voice Sample Sources

For reference clips, we need royalty-free, high-quality voice samples.

### Recommended Sources

1. **LibriVox** (Public Domain)
   - Audiobook recordings
   - Many voice types
   - Clean audio quality varies

2. **Common Voice** (Mozilla, CC0)
   - Diverse voices
   - Short clips (~5-10s)
   - Good for finding natural voices

3. **VCTK Corpus** (Academic, free for research)
   - Professional quality
   - 110 speakers
   - British/Scottish accents

4. **LJ Speech** (Public Domain)
   - Single female voice
   - Very clean, professional
   - Good baseline

5. **Custom Recording**
   - Best quality control
   - Hire voice actors via Fiverr/Voices.com
   - Full rights ownership

### Sample Requirements

For Chatterbox reference clips:
- **Duration:** 5-15 seconds (10s optimal)
- **Format:** WAV, 16kHz+ sample rate
- **Content:** Natural speech, conversational tone
- **Quality:** Clean, no background noise, no music

---

## Deepgram Integration (STT)

```typescript
// src/lib/voice/stt-service.ts

import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk';

export class DeepgramSTT {
  private client;
  
  constructor(apiKey: string) {
    this.client = createClient(apiKey);
  }

  createLiveStream(onTranscript: (text: string, isFinal: boolean) => void) {
    const connection = this.client.listen.live({
      model: 'nova-2',
      language: 'en-US',
      smart_format: true,
      interim_results: true,
      utterance_end_ms: 1000,
      vad_events: true,
    });

    connection.on(LiveTranscriptionEvents.Transcript, (data) => {
      const transcript = data.channel.alternatives[0]?.transcript;
      if (transcript) {
        onTranscript(transcript, data.is_final);
      }
    });

    return connection;
  }
}
```

---

## Voice Selection UI

```typescript
// src/components/onboarding/VoiceSelector.tsx

'use client';

import { useState } from 'react';
import { DEFAULT_VOICES, VoiceProfile } from '@/lib/voice/voices';

interface VoiceSelectorProps {
  onSelect: (voiceId: string) => void;
  currentVoiceId?: string;
}

export function VoiceSelector({ onSelect, currentVoiceId }: VoiceSelectorProps) {
  const [playing, setPlaying] = useState<string | null>(null);
  const [selected, setSelected] = useState(currentVoiceId);

  const playPreview = async (voice: VoiceProfile) => {
    setPlaying(voice.id);
    
    // Play a sample greeting in this voice
    const audio = new Audio(`/api/voice/preview?voiceId=${voice.id}`);
    audio.onended = () => setPlaying(null);
    await audio.play();
  };

  return (
    <div className="voice-selector">
      <h2>Choose Your Companion's Voice</h2>
      <p className="subtitle">
        This is who you'll be talking to every day. Pick someone you'd enjoy hearing from.
      </p>
      
      <div className="voice-grid">
        {DEFAULT_VOICES.map((voice) => (
          <button
            key={voice.id}
            className={`voice-card ${selected === voice.id ? 'selected' : ''}`}
            onClick={() => {
              setSelected(voice.id);
              onSelect(voice.id);
            }}
          >
            <div className="voice-avatar">
              {voice.gender === 'female' ? '👩' : '👨'}
            </div>
            <h3>{voice.name}</h3>
            <p>{voice.description}</p>
            
            <button
              className="preview-btn"
              onClick={(e) => {
                e.stopPropagation();
                playPreview(voice);
              }}
              disabled={playing === voice.id}
            >
              {playing === voice.id ? '🔊 Playing...' : '▶️ Preview'}
            </button>
          </button>
        ))}
      </div>
    </div>
  );
}
```

---

## Cost Analysis

### Chatterbox (Self-hosted)

| Resource | Cost | Notes |
|----------|------|-------|
| GPU Server (A10G) | ~$0.50/hr | Fly.io/Lambda Labs |
| Storage | ~$5/mo | Voice references |
| Bandwidth | ~$0.08/GB | Audio streaming |

**At 10K users, ~3 min/day average:**
- ~500 hours audio/month
- ~15,000 GPU hours needed
- Cost: ~$500-800/month (with batching optimizations)

### Deepgram (STT)

- Pay-as-you-go: $0.0043/minute (Nova-2)
- 10K users × 3 min/day × 30 days = 900K minutes
- Cost: ~$3,870/month

### Total Voice Infrastructure: ~$4,500-5,000/month at 10K users

*Can optimize with:*
- Spot/preemptible GPU instances
- Aggressive caching of common phrases
- Client-side VAD to reduce STT usage

---

## Next Steps

1. [ ] **Source voice reference clips** (3 female, 3 male)
2. [ ] **Set up Chatterbox server** (Docker on Fly.io)
3. [ ] **Integrate Deepgram** (streaming STT)
4. [ ] **Build voice selection UI** (onboarding flow)
5. [ ] **Create conversation loop** (STT → LLM → TTS)
6. [ ] **Optimize latency** (< 500ms response start)

---

## Voice Samples to Evaluate

See `/voice-samples/` directory for reference clips to test.

| ID | Name | Gender | Source | Notes |
|----|------|--------|--------|-------|
| TBD | TBD | Female | TBD | Warm, nurturing |
| TBD | TBD | Female | TBD | Professional, clear |
| TBD | TBD | Female | TBD | Friendly, upbeat |
| TBD | TBD | Male | TBD | Calm, reassuring |
| TBD | TBD | Male | TBD | Warm, fatherly |
| TBD | TBD | Male | TBD | Professional, clear |

---

*This spec will be updated as we select voices and tune the system.*
