import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Force dynamic to avoid build-time evaluation of canvas/face-api
export const dynamic = 'force-dynamic'

// Lazy import to avoid build-time issues with native modules
const getFaceDetection = () => import('@/lib/ai/faceDetection')

/**
 * POST /api/media/[id]/detect-faces - Run face detection on a photo
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
    .select('id, file_url, file_type, user_id')
    .eq('id', mediaId)
    .eq('user_id', user.id)
    .single()

  if (mediaError || !media) {
    return NextResponse.json({ error: 'Media not found' }, { status: 404 })
  }

  if (!media.file_type?.includes('image')) {
    return NextResponse.json({ error: 'Not an image' }, { status: 400 })
  }

  // Load face detection module and ensure models are ready
  const { detectFaces, ensureModels } = await getFaceDetection()
  const modelsReady = await ensureModels()
  if (!modelsReady) {
    return NextResponse.json({ 
      error: 'Face detection models not available',
      hint: 'Run scripts/download-face-models.sh to download models'
    }, { status: 503 })
  }

  try {
    // Fetch the image
    const imageResponse = await fetch(media.file_url)
    if (!imageResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch image' }, { status: 500 })
    }
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer())

    // Detect faces
    const faces = await detectFaces(imageBuffer)

    if (faces.length === 0) {
      return NextResponse.json({ 
        success: true, 
        faces: [],
        message: 'No faces detected in this image'
      })
    }

    // Delete existing unconfirmed face tags for this media
    await supabase
      .from('memory_face_tags')
      .delete()
      .eq('media_id', mediaId)
      .eq('user_id', user.id)
      .eq('is_confirmed', false)

    // Insert new detected faces
    const faceRecords = faces.map(face => ({
      media_id: mediaId,
      user_id: user.id,
      box_left: face.boundingBox.x,
      box_top: face.boundingBox.y,
      box_width: face.boundingBox.width,
      box_height: face.boundingBox.height,
      confidence: face.confidence,
      face_embedding: JSON.stringify(face.embedding),
      age: face.age,
      gender: face.gender,
      expression: face.expressions ? Object.entries(face.expressions).sort((a, b) => b[1] - a[1])[0]?.[0] : null,
      is_confirmed: false,
    }))

    const { data: insertedFaces, error: insertError } = await supabase
      .from('memory_face_tags')
      .insert(faceRecords)
      .select('id')

    if (insertError) {
      console.error('Failed to insert faces:', insertError)
      return NextResponse.json({ error: 'Failed to save detected faces' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      facesDetected: faces.length,
      faces: faces.map((f, i) => ({
        id: insertedFaces?.[i]?.id,
        boundingBox: f.boundingBox,
        confidence: f.confidence,
        age: f.age,
        gender: f.gender,
      })),
    })

  } catch (error) {
    console.error('Face detection error:', error)
    return NextResponse.json({ 
      error: 'Face detection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
