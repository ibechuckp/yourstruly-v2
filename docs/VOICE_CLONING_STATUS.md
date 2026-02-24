# Voice Cloning Status - YoursTruly V2

Last updated: 2024-02-24

## Overview

Voice cloning in YoursTruly V2 allows users to create a digital clone of their voice using ElevenLabs API. This voice can then be used for:
- AI Twin feature (speak to loved ones in user's voice)
- PostScript messages
- Memory narration

## Current Status: 🟡 IMPLEMENTED BUT NOT CONFIGURED

### What Was Found

1. **No ElevenLabs API key** - `.env.local` was missing `ELEVENLABS_API_KEY`
2. **No ElevenLabs integration code** - API route had TODO comments instead of actual implementation
3. **No ElevenLabs SDK** - Not using SDK, using REST API directly (which is fine)

### What Was Fixed

1. ✅ Created `/src/lib/voice/elevenlabs.ts` - Full ElevenLabs integration library:
   - `cloneVoice()` - Create voice clone from audio samples
   - `textToSpeech()` - Generate speech using cloned voice
   - `deleteVoice()` - Remove voice from ElevenLabs
   - `getVoiceInfo()` - Check voice status
   - `isElevenLabsConfigured()` - Check if API key exists

2. ✅ Updated `/src/app/api/voice/clone/route.ts`:
   - Now actually calls ElevenLabs API
   - Properly handles errors and updates status
   - Returns helpful error codes for UI

3. ✅ Created `/src/app/api/voice/speak/route.ts`:
   - New endpoint to generate speech using cloned voice
   - Requires user to have ready voice clone
   - Returns audio/mpeg stream

4. ✅ Updated `/src/components/profile/VoiceCloneButton.tsx`:
   - Shows "Coming Soon" when ElevenLabs not configured
   - Better error handling for unconfigured state
   - Uses API endpoint for status (more reliable)

5. ✅ Updated `.env.example` with ElevenLabs documentation

## What Still Needs Work

### Required: Add ElevenLabs API Key

Add to `.env.local`:
```
ELEVENLABS_API_KEY=your-key-here
```

Get key from: https://elevenlabs.io/app/settings/api-keys

**Important:** Voice cloning requires ElevenLabs **Creator plan** ($22/mo) or higher for Instant Voice Cloning feature.

### Optional Improvements

1. **Better duration tracking** - Currently estimates 30s per recording. Could store actual duration in memories table.

2. **Background processing** - Voice cloning could be moved to a background job for better UX (currently synchronous).

3. **Voice preview** - Add ability to preview/test cloned voice before using in features.

4. **Integration with AI Twin** - Connect cloned voice to the AI chat feature.

5. **Pre-existing build error** - `resend` module missing (unrelated to voice cloning).

## File Locations

| File | Purpose |
|------|---------|
| `/src/lib/voice/elevenlabs.ts` | ElevenLabs API integration |
| `/src/app/api/voice/clone/route.ts` | Clone creation/status/deletion |
| `/src/app/api/voice/speak/route.ts` | TTS with cloned voice |
| `/src/components/profile/VoiceCloneButton.tsx` | UI button on profile page |
| `/supabase/migrations/046_voice_clones.sql` | Database schema |

## Database Schema

```sql
-- voice_clones table
- id (UUID)
- user_id (UUID) - links to profiles
- status (pending/processing/ready/failed)
- elevenlabs_voice_id (VARCHAR) - ElevenLabs voice ID
- total_audio_duration_seconds (INT)
- sample_count (INT)
- consent_given_at (TIMESTAMP)
- consent_ip (VARCHAR)
- consent_user_agent (TEXT)
- error_message (TEXT)
- cloned_at (TIMESTAMP)

-- voice_clone_samples table
- id (UUID)
- voice_clone_id (UUID) - links to voice_clones
- memory_id (UUID) - links to memories
- audio_url (TEXT)
- duration_seconds (INT)
```

## API Endpoints

### POST /api/voice/clone
Start voice cloning process

**Body:**
```json
{
  "consent": true,
  "userAgent": "Mozilla/5.0..."
}
```

**Response:**
```json
{
  "success": true,
  "voiceCloneId": "uuid",
  "status": "ready",
  "samplesUsed": 6,
  "estimatedDuration": 180
}
```

### GET /api/voice/clone
Get voice clone status

**Response:**
```json
{
  "voiceClone": { ... },
  "voiceMemoryCount": 6,
  "estimatedDuration": 180,
  "minimumRequired": 180,
  "canClone": true,
  "isConfigured": true
}
```

### DELETE /api/voice/clone
Delete voice clone (from ElevenLabs and database)

### POST /api/voice/speak
Generate speech using cloned voice

**Body:**
```json
{
  "text": "Hello, this is my cloned voice!",
  "stability": 0.5,
  "similarityBoost": 0.75
}
```

**Response:** Audio stream (audio/mpeg)

## Testing

1. Add `ELEVENLABS_API_KEY` to `.env.local`
2. Create a test user with 6+ voice memories (3+ minutes)
3. Go to Profile page
4. Click "Clone My Voice"
5. Accept consent
6. Wait for cloning to complete
7. Test speak endpoint with cloned voice
