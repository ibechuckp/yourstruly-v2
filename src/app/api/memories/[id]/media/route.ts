import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { detectFaces, getDominantExpression } from '@/lib/ai/faceDetection'

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

  // Extract EXIF data from form (sent by client after extraction)
  const exifLat = formData.get('exif_lat') as string | null
  const exifLng = formData.get('exif_lng') as string | null
  const takenAt = formData.get('taken_at') as string | null
  const camera = formData.get('camera') as string | null

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

  // Run face detection for images (open source)
  let detectedFaces: Array<{
    boundingBox: { x: number; y: number; width: number; height: number }
    confidence: number
    embedding: number[]
    age?: number
    gender?: string
    expression?: string
  }> = []

  if (fileType === 'image') {
    try {
      const faces = await detectFaces(buffer)
      detectedFaces = faces.map(f => ({
        boundingBox: f.boundingBox,
        confidence: f.confidence,
        embedding: f.embedding,
        age: f.age,
        gender: f.gender,
        expression: f.expressions ? getDominantExpression(f.expressions) : undefined,
      }))
    } catch (e) {
      console.error('Face detection failed:', e)
      // Continue without face data
    }
  }

  // No XP for photo upload - only backstory earns XP

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

  // Create media record with EXIF data
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
      // EXIF data
      exif_lat: exifLat ? parseFloat(exifLat) : null,
      exif_lng: exifLng ? parseFloat(exifLng) : null,
      taken_at: takenAt || null,
      camera_make: camera?.split(' ')[0] || null,
      camera_model: camera?.split(' ').slice(1).join(' ') || null,
      // AI analysis
      ai_faces: detectedFaces.map(f => ({
        boundingBox: f.boundingBox,
        confidence: f.confidence,
        age: f.age,
        gender: f.gender,
        expression: f.expression,
      })),
      ai_processed: detectedFaces.length > 0,
    })
    .select()
    .single()

  if (mediaError) {
    console.error('Media record error:', mediaError)
    return NextResponse.json({ error: 'Failed to save media' }, { status: 500 })
  }

  // Store face embeddings for recognition (if faces detected)
  if (detectedFaces.length > 0) {
    const faceRecords = detectedFaces.map((face) => ({
      media_id: media.id,
      user_id: user.id,
      box_left: face.boundingBox.x,
      box_top: face.boundingBox.y,
      box_width: face.boundingBox.width,
      box_height: face.boundingBox.height,
      confidence: Math.round(face.confidence * 100),
      face_embedding: face.embedding,
      age: face.age,
      gender: face.gender,
      expression: face.expression,
      is_auto_detected: true,
      is_confirmed: false,
    }))

    await supabase.from('memory_face_tags').insert(faceRecords)
  }

  return NextResponse.json({ 
    media,
    faces: detectedFaces.map(f => ({
      boundingBox: f.boundingBox,
      age: f.age,
      gender: f.gender,
      expression: f.expression,
    })),
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
