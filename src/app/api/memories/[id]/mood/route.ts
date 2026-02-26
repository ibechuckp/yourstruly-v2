import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { analyzeMood, MoodType } from '@/lib/ai/moodAnalysis'

const VALID_MOODS: MoodType[] = ['joyful', 'proud', 'grateful', 'bittersweet', 'peaceful', 'nostalgic', 'loving']

// GET /api/memories/[id]/mood - Get or analyze mood
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: memoryId } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get memory
  const { data: memory, error } = await supabase
    .from('memories')
    .select('id, title, description, memory_type, ai_labels, mood, mood_confidence, mood_override')
    .eq('id', memoryId)
    .eq('user_id', user.id)
    .single()

  if (error || !memory) {
    return NextResponse.json({ error: 'Memory not found' }, { status: 404 })
  }

  // If mood exists and was manually set or analyzed, return it
  if (memory.mood) {
    return NextResponse.json({
      mood: memory.mood,
      confidence: memory.mood_confidence,
      isOverride: memory.mood_override,
      source: memory.mood_override ? 'manual' : 'ai'
    })
  }

  // Analyze mood with AI
  const analysis = await analyzeMood(
    memory.title || '',
    memory.description,
    memory.memory_type,
    memory.ai_labels || []
  )

  // Save the analyzed mood
  await supabase
    .from('memories')
    .update({
      mood: analysis.mood,
      mood_confidence: analysis.confidence,
      mood_override: false
    })
    .eq('id', memoryId)

  return NextResponse.json({
    mood: analysis.mood,
    confidence: analysis.confidence,
    reasoning: analysis.reasoning,
    isOverride: false,
    source: 'ai'
  })
}

// PUT /api/memories/[id]/mood - Update mood (manual override)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: memoryId } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { mood } = body

  // Validate mood
  if (!mood || !VALID_MOODS.includes(mood)) {
    return NextResponse.json({ 
      error: 'Invalid mood', 
      validMoods: VALID_MOODS 
    }, { status: 400 })
  }

  // Update memory with manual mood
  const { data, error } = await supabase
    .from('memories')
    .update({
      mood: mood,
      mood_confidence: 1.0, // Manual override = 100% confidence
      mood_override: true
    })
    .eq('id', memoryId)
    .eq('user_id', user.id)
    .select('id, mood, mood_confidence, mood_override')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: 'Memory not found' }, { status: 404 })
  }

  return NextResponse.json({
    mood: data.mood,
    confidence: data.mood_confidence,
    isOverride: true,
    source: 'manual'
  })
}

// DELETE /api/memories/[id]/mood - Clear mood (reset to AI)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: memoryId } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Clear mood and re-analyze
  const { data: memory, error } = await supabase
    .from('memories')
    .update({
      mood: null,
      mood_confidence: null,
      mood_override: false
    })
    .eq('id', memoryId)
    .eq('user_id', user.id)
    .select('id, title, description, memory_type, ai_labels')
    .single()

  if (error || !memory) {
    return NextResponse.json({ error: 'Memory not found' }, { status: 404 })
  }

  // Re-analyze with AI
  const analysis = await analyzeMood(
    memory.title || '',
    memory.description,
    memory.memory_type,
    memory.ai_labels || []
  )

  // Save the new mood
  await supabase
    .from('memories')
    .update({
      mood: analysis.mood,
      mood_confidence: analysis.confidence,
      mood_override: false
    })
    .eq('id', memoryId)

  return NextResponse.json({
    mood: analysis.mood,
    confidence: analysis.confidence,
    reasoning: analysis.reasoning,
    isOverride: false,
    source: 'ai'
  })
}
