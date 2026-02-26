import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { generateSmartTags } from '@/lib/ai/smartTags'

/**
 * POST /api/media/process-pending - Process all unanalyzed images
 * 
 * Processes images that haven't been smart-tagged yet.
 * Limited to 20 per call to avoid timeouts.
 * 
 * Query params:
 * - limit: max images to process (default 20, max 50)
 * - forceReprocess: if true, reprocess even already-processed images
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
  const forceReprocess = searchParams.get('forceReprocess') === 'true'

  // Find images that need processing
  let query = supabase
    .from('memory_media')
    .select('id, file_url, file_type, mime_type, memory_id')
    .eq('user_id', user.id)
    .eq('file_type', 'image')
    .limit(limit)

  if (!forceReprocess) {
    // Only get images where ai_labels is empty/null or doesn't have allTags
    query = query.or('ai_processed.is.false,ai_processed.is.null')
  }

  const { data: pendingImages, error } = await query

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch pending images' }, { status: 500 })
  }

  if (!pendingImages || pendingImages.length === 0) {
    return NextResponse.json({ 
      processed: 0, 
      remaining: 0,
      message: 'No images pending analysis' 
    })
  }

  const results = {
    processed: 0,
    failed: 0,
    errors: [] as string[],
  }

  // Process each image
  for (const media of pendingImages) {
    try {
      // Fetch image
      const response = await fetch(media.file_url)
      if (!response.ok) {
        results.failed++
        results.errors.push(`${media.id}: Failed to fetch`)
        continue
      }

      const buffer = Buffer.from(await response.arrayBuffer())
      const tags = await generateSmartTags(buffer, media.mime_type || 'image/jpeg')

      // Save tags
      await supabase
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
        .eq('id', media.id)

      // Update parent memory
      if (media.memory_id) {
        const { data: memory } = await supabase
          .from('memories')
          .select('ai_category, ai_mood, ai_summary')
          .eq('id', media.memory_id)
          .single()

        const updates: Record<string, string> = {}
        if (!memory?.ai_category && tags.category) {
          updates.ai_category = tags.category
        }
        if (!memory?.ai_mood && tags.mood[0]) {
          updates.ai_mood = tags.mood[0]
        }
        if (!memory?.ai_summary && tags.caption) {
          updates.ai_summary = tags.caption
        }

        if (Object.keys(updates).length > 0) {
          await supabase.from('memories').update(updates).eq('id', media.memory_id)
        }
      }

      results.processed++
    } catch (err) {
      results.failed++
      results.errors.push(`${media.id}: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }

    // Small delay between images to avoid rate limits
    await new Promise(r => setTimeout(r, 300))
  }

  // Count remaining
  const { count: remaining } = await supabase
    .from('memory_media')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('file_type', 'image')
    .or('ai_processed.is.false,ai_processed.is.null')

  return NextResponse.json({
    ...results,
    remaining: remaining || 0,
    message: results.processed > 0 
      ? `Processed ${results.processed} images${remaining ? `, ${remaining} remaining` : ''}`
      : 'No images were processed',
  })
}

/**
 * GET /api/media/process-pending - Get count of unprocessed images
 */
export async function GET() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { count: pending } = await supabase
    .from('memory_media')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('file_type', 'image')
    .or('ai_processed.is.false,ai_processed.is.null')

  const { count: total } = await supabase
    .from('memory_media')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('file_type', 'image')

  return NextResponse.json({
    pending: pending || 0,
    total: total || 0,
    processed: (total || 0) - (pending || 0),
  })
}
