import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'

const MIN_VOICE_DURATION_SECONDS = 180 // 3 minutes minimum

// POST /api/voice/clone - Start voice cloning process
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { consent, userAgent } = body

  if (!consent) {
    return NextResponse.json({ error: 'Consent required' }, { status: 400 })
  }

  // Get user's voice recordings from memories
  const { data: voiceMemories, error: memoriesError } = await supabase
    .from('memories')
    .select('id, audio_url')
    .eq('user_id', user.id)
    .not('audio_url', 'is', null)

  if (memoriesError) {
    console.error('Error fetching voice memories:', memoriesError)
    return NextResponse.json({ error: 'Failed to fetch voice recordings' }, { status: 500 })
  }

  // Estimate duration (~30 seconds per recording)
  const estimatedDuration = (voiceMemories?.length || 0) * 30

  if (estimatedDuration < MIN_VOICE_DURATION_SECONDS) {
    return NextResponse.json({ 
      error: 'Not enough voice recordings',
      required: MIN_VOICE_DURATION_SECONDS,
      current: estimatedDuration
    }, { status: 400 })
  }

  // Get client IP from headers
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for')?.split(',')[0] || 
             headersList.get('x-real-ip') || 
             'unknown'

  // Check if voice clone already exists
  const { data: existing } = await supabase
    .from('voice_clones')
    .select('id, status')
    .eq('user_id', user.id)
    .single()

  let voiceCloneId: string

  if (existing) {
    // Update existing record
    const { data: updated, error: updateError } = await supabase
      .from('voice_clones')
      .update({
        status: 'processing',
        consent_given_at: new Date().toISOString(),
        consent_ip: ip,
        consent_user_agent: userAgent,
        total_audio_duration_seconds: estimatedDuration,
        sample_count: voiceMemories?.length || 0,
        error_message: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating voice clone:', updateError)
      return NextResponse.json({ error: 'Failed to update voice clone record' }, { status: 500 })
    }

    voiceCloneId = existing.id
  } else {
    // Create new record
    const { data: created, error: createError } = await supabase
      .from('voice_clones')
      .insert({
        user_id: user.id,
        status: 'processing',
        consent_given_at: new Date().toISOString(),
        consent_ip: ip,
        consent_user_agent: userAgent,
        total_audio_duration_seconds: estimatedDuration,
        sample_count: voiceMemories?.length || 0
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating voice clone:', createError)
      return NextResponse.json({ error: 'Failed to create voice clone record' }, { status: 500 })
    }

    voiceCloneId = created.id
  }

  // Store sample references
  if (voiceMemories && voiceMemories.length > 0) {
    const samples = voiceMemories.map(m => ({
      voice_clone_id: voiceCloneId,
      memory_id: m.id,
      audio_url: m.audio_url,
      duration_seconds: 30 // Estimated
    }))

    // Delete old samples first
    await supabase
      .from('voice_clone_samples')
      .delete()
      .eq('voice_clone_id', voiceCloneId)

    // Insert new samples
    const { error: samplesError } = await supabase
      .from('voice_clone_samples')
      .insert(samples)

    if (samplesError) {
      console.error('Error storing voice samples:', samplesError)
      // Non-fatal, continue
    }
  }

  // TODO: In production, trigger actual voice cloning via ElevenLabs API
  // For now, we'll simulate by setting status to 'pending' for manual processing
  // The actual cloning would be done by a background job or webhook
  
  // Simulate async processing
  // In production: await triggerElevenLabsCloning(voiceCloneId, voiceMemories)

  return NextResponse.json({
    success: true,
    voiceCloneId,
    status: 'processing',
    samplesUsed: voiceMemories?.length || 0,
    estimatedDuration
  })
}

// GET /api/voice/clone - Get voice clone status
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: voiceClone, error } = await supabase
    .from('voice_clones')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') { // Not found is ok
    console.error('Error fetching voice clone:', error)
    return NextResponse.json({ error: 'Failed to fetch voice clone status' }, { status: 500 })
  }

  // Get voice duration from memories
  const { count } = await supabase
    .from('memories')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .not('audio_url', 'is', null)

  const estimatedDuration = (count || 0) * 30

  return NextResponse.json({
    voiceClone: voiceClone || null,
    voiceMemoryCount: count || 0,
    estimatedDuration,
    minimumRequired: MIN_VOICE_DURATION_SECONDS,
    canClone: estimatedDuration >= MIN_VOICE_DURATION_SECONDS
  })
}

// DELETE /api/voice/clone - Delete voice clone
export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get existing clone
  const { data: voiceClone } = await supabase
    .from('voice_clones')
    .select('id, elevenlabs_voice_id')
    .eq('user_id', user.id)
    .single()

  if (!voiceClone) {
    return NextResponse.json({ error: 'No voice clone found' }, { status: 404 })
  }

  // TODO: In production, delete from ElevenLabs API if elevenlabs_voice_id exists
  // await deleteElevenLabsVoice(voiceClone.elevenlabs_voice_id)

  // Delete from database (cascade will delete samples)
  const { error } = await supabase
    .from('voice_clones')
    .delete()
    .eq('id', voiceClone.id)

  if (error) {
    console.error('Error deleting voice clone:', error)
    return NextResponse.json({ error: 'Failed to delete voice clone' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
