import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { analyzeImage } from '@/lib/aws/rekognition'

// POST /api/memories/[id]/media - Upload media to memory
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: memoryId } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify memory belongs to user
  const { data: memory } = await supabase
    .from('memories')
    .select('id')
    .eq('id', memoryId)
    .eq('user_id', user.id)
    .single()

  if (!memory) {
    return NextResponse.json({ error: 'Memory not found' }, { status: 404 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File
  
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const fileType = file.type.startsWith('image/') ? 'image' : 
                   file.type.startsWith('video/') ? 'video' : null

  if (!fileType) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
  }

  // Upload to Supabase Storage
  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const fileName = `${user.id}/${memoryId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const { error: uploadError } = await supabase.storage
    .from('memories')
    .upload(fileName, buffer, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    console.error('Upload error:', uploadError)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }

  const { data: { publicUrl } } = supabase.storage
    .from('memories')
    .getPublicUrl(fileName)

  // Run AI analysis for images
  let aiData = {
    ai_labels: [],
    ai_faces: [],
    ai_text: [],
    ai_processed: false,
  }

  if (fileType === 'image') {
    try {
      const analysis = await analyzeImage(buffer)
      
      aiData = {
        ai_labels: analysis.labels as any,
        ai_faces: analysis.faces as any,
        ai_text: analysis.text as any,
        ai_processed: true,
      }

      // Update memory with AI insights if this is the first media
      const { data: existingMedia } = await supabase
        .from('memory_media')
        .select('id')
        .eq('memory_id', memoryId)
        .limit(1)

      if (!existingMedia?.length) {
        await supabase
          .from('memories')
          .update({
            ai_summary: analysis.summary.description,
            ai_mood: analysis.summary.mood,
            ai_category: analysis.summary.category,
            ai_labels: analysis.summary.dominantLabels,
          })
          .eq('id', memoryId)
      }
    } catch (e) {
      console.error('AI analysis failed:', e)
      // Continue without AI data
    }
  }

  // Get image dimensions (for images)
  let width = null
  let height = null

  if (fileType === 'image') {
    // Simple dimension detection from buffer header
    // For production, use sharp or similar
    try {
      const dimensions = getImageDimensions(buffer)
      width = dimensions.width
      height = dimensions.height
    } catch (e) {
      // Ignore dimension errors
    }
  }

  // Check if this should be cover
  const { count } = await supabase
    .from('memory_media')
    .select('id', { count: 'exact', head: true })
    .eq('memory_id', memoryId)

  const isCover = count === 0

  // Create media record
  const { data: media, error: mediaError } = await supabase
    .from('memory_media')
    .insert({
      memory_id: memoryId,
      user_id: user.id,
      file_url: publicUrl,
      file_key: fileName,
      file_type: fileType,
      mime_type: file.type,
      file_size: file.size,
      width,
      height,
      is_cover: isCover,
      ...aiData,
    })
    .select()
    .single()

  if (mediaError) {
    console.error('Media record error:', mediaError)
    return NextResponse.json({ error: 'Failed to save media' }, { status: 500 })
  }

  return NextResponse.json({ 
    media,
    analysis: aiData.ai_processed ? {
      labels: aiData.ai_labels,
      faces: aiData.ai_faces,
      text: aiData.ai_text,
    } : null,
  })
}

// Simple dimension detection (JPEG/PNG only)
function getImageDimensions(buffer: Buffer): { width: number; height: number } {
  // PNG
  if (buffer[0] === 0x89 && buffer[1] === 0x50) {
    return {
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20),
    }
  }
  
  // JPEG
  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2
    while (offset < buffer.length) {
      if (buffer[offset] !== 0xff) break
      const marker = buffer[offset + 1]
      if (marker === 0xc0 || marker === 0xc2) {
        return {
          height: buffer.readUInt16BE(offset + 5),
          width: buffer.readUInt16BE(offset + 7),
        }
      }
      const length = buffer.readUInt16BE(offset + 2)
      offset += 2 + length
    }
  }

  return { width: 0, height: 0 }
}
