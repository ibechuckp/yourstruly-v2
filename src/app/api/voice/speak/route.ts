import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { textToSpeech, isElevenLabsConfigured } from '@/lib/voice/elevenlabs'

/**
 * POST /api/voice/speak - Generate speech using user's cloned voice
 * 
 * Body:
 *   - text: string (required) - Text to convert to speech
 *   - stability?: number (0-1) - Voice stability
 *   - similarityBoost?: number (0-1) - How much to boost similarity to original
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isElevenLabsConfigured()) {
    return NextResponse.json({ 
      error: 'Voice service not configured',
      code: 'ELEVENLABS_NOT_CONFIGURED'
    }, { status: 503 })
  }

  const body = await request.json()
  const { text, stability, similarityBoost } = body

  if (!text || typeof text !== 'string') {
    return NextResponse.json({ error: 'Text is required' }, { status: 400 })
  }

  if (text.length > 5000) {
    return NextResponse.json({ error: 'Text too long (max 5000 chars)' }, { status: 400 })
  }

  // Get user's cloned voice
  const { data: voiceClone, error } = await supabase
    .from('voice_clones')
    .select('elevenlabs_voice_id, status')
    .eq('user_id', user.id)
    .single()

  if (error || !voiceClone) {
    return NextResponse.json({ 
      error: 'No voice clone found. Please create a voice clone first.',
      code: 'NO_VOICE_CLONE'
    }, { status: 404 })
  }

  if (voiceClone.status !== 'ready' || !voiceClone.elevenlabs_voice_id) {
    return NextResponse.json({ 
      error: 'Voice clone is not ready yet',
      status: voiceClone.status,
      code: 'VOICE_NOT_READY'
    }, { status: 400 })
  }

  // Generate speech
  const result = await textToSpeech(
    voiceClone.elevenlabs_voice_id,
    text,
    {
      stability: stability ?? 0.5,
      similarityBoost: similarityBoost ?? 0.75,
    }
  )

  if (!result.success || !result.audioBuffer) {
    console.error('TTS failed:', result.error)
    return NextResponse.json({ 
      error: result.error || 'Speech generation failed',
      code: 'TTS_FAILED'
    }, { status: 500 })
  }

  // Return audio
  return new NextResponse(result.audioBuffer, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'private, max-age=3600',
    },
  })
}

/**
 * GET /api/voice/speak - Check if voice is available for TTS
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: voiceClone } = await supabase
    .from('voice_clones')
    .select('status, elevenlabs_voice_id')
    .eq('user_id', user.id)
    .single()

  return NextResponse.json({
    available: voiceClone?.status === 'ready' && !!voiceClone?.elevenlabs_voice_id,
    status: voiceClone?.status || 'none',
    configured: isElevenLabsConfigured()
  })
}
