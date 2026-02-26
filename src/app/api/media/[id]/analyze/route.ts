import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { generateSmartTags } from '@/lib/ai/smartTags'

/**
 * POST /api/media/[id]/analyze - Analyze image and generate smart tags
 * 
 * Can be called:
 * 1. Immediately after upload (from client)
 * 2. As background job for pending images
 * 3. Manually by user to re-analyze
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: mediaId } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get media record
  const { data: media, error: mediaError } = await supabase
    .from('memory_media')
    .select('id, file_url, file_key, file_type, mime_type, ai_processed, ai_labels')
    .eq('id', mediaId)
    .eq('user_id', user.id)
    .single()

  if (mediaError || !media) {
    return NextResponse.json({ error: 'Media not found' }, { status: 404 })
  }

  // Only process images
  if (media.file_type !== 'image') {
    return NextResponse.json({ 
      success: false, 
      reason: 'Only images can be analyzed' 
    })
  }

  try {
    // Fetch the image from storage
    const imageResponse = await fetch(media.file_url)
    if (!imageResponse.ok) {
      throw new Error('Failed to fetch image from storage')
    }
    
    const arrayBuffer = await imageResponse.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Generate smart tags
    const tags = await generateSmartTags(buffer, media.mime_type || 'image/jpeg')
    
    // Store in database - using existing ai_labels field with structured data
    const { error: updateError } = await supabase
      .from('memory_media')
      .update({
        ai_labels: {
          scene: tags.scene,
          setting: tags.setting,
          activities: tags.activities,
          objects: tags.objects,
          people: tags.people,
          mood: tags.mood,
          weather: tags.weather,
          allTags: tags.allTags,
          caption: tags.caption,
          category: tags.category,
          analyzedAt: new Date().toISOString(),
        },
        ai_processed: true,
      })
      .eq('id', mediaId)

    if (updateError) {
      console.error('Failed to save tags:', updateError)
      return NextResponse.json({ error: 'Failed to save analysis' }, { status: 500 })
    }

    // Also update parent memory with AI category/mood if not set
    const { data: memoryMedia } = await supabase
      .from('memory_media')
      .select('memory_id')
      .eq('id', mediaId)
      .single()

    if (memoryMedia?.memory_id) {
      const { data: memory } = await supabase
        .from('memories')
        .select('ai_category, ai_mood, ai_summary')
        .eq('id', memoryMedia.memory_id)
        .single()

      const updates: Record<string, string> = {}
      if (!memory?.ai_category && tags.category) {
        updates.ai_category = tags.category
      }
      if (!memory?.ai_mood && tags.mood.length > 0) {
        updates.ai_mood = tags.mood[0]
      }
      if (!memory?.ai_summary && tags.caption) {
        updates.ai_summary = tags.caption
      }

      if (Object.keys(updates).length > 0) {
        await supabase
          .from('memories')
          .update(updates)
          .eq('id', memoryMedia.memory_id)
      }
    }

    return NextResponse.json({
      success: true,
      tags,
    })
  } catch (error) {
    console.error('Image analysis error:', error)
    return NextResponse.json({ 
      error: 'Analysis failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
