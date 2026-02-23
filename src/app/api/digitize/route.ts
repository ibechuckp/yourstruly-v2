import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import sharp from 'sharp'
import { DetectedPhoto } from '@/lib/photoDigitize'

/**
 * Main digitization endpoint
 * Takes the original image and detection results, crops and optionally enhances each photo,
 * then saves them as individual images to storage
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const imageFile = formData.get('image') as File
    const photosJson = formData.get('photos') as string
    const enhance = formData.get('enhance') === 'true'
    const memoryId = formData.get('memoryId') as string | null
    
    if (!imageFile || !photosJson) {
      return NextResponse.json({ error: 'Missing image or detection data' }, { status: 400 })
    }

    const photos: DetectedPhoto[] = JSON.parse(photosJson)
    
    if (photos.length === 0) {
      return NextResponse.json({ error: 'No photos to process' }, { status: 400 })
    }

    const bytes = await imageFile.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Get original image metadata
    const metadata = await sharp(buffer).metadata()
    const imgWidth = metadata.width || 0
    const imgHeight = metadata.height || 0
    
    const savedPhotos: any[] = []
    const errors: string[] = []

    // If no memory ID provided, create a new memory for these digitized photos
    let targetMemoryId = memoryId
    if (!targetMemoryId) {
      const { data: newMemory, error: memoryError } = await supabase
        .from('memories')
        .insert({
          user_id: user.id,
          title: `Digitized Photos - ${new Date().toLocaleDateString()}`,
          memory_date: new Date().toISOString().split('T')[0],
          memory_type: 'moment',
          notes: 'Photos digitized from printed photographs'
        })
        .select('id')
        .single()
      
      if (memoryError || !newMemory) {
        return NextResponse.json({ error: 'Failed to create memory' }, { status: 500 })
      }
      targetMemoryId = newMemory.id
    }

    // Process each detected photo
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i]
      
      try {
        // Validate crop region
        const left = Math.max(0, Math.min(photo.x, imgWidth - 1))
        const top = Math.max(0, Math.min(photo.y, imgHeight - 1))
        const width = Math.min(photo.width, imgWidth - left)
        const height = Math.min(photo.height, imgHeight - top)
        
        if (width < 50 || height < 50) {
          errors.push(`Photo ${i + 1}: Too small after cropping`)
          continue
        }

        // Crop the photo
        let croppedBuffer = await sharp(buffer)
          .extract({ left, top, width, height })
          .toBuffer()
        
        // Enhance if requested
        if (enhance) {
          // Use Sharp for basic enhancement (Replicate would require separate API call)
          croppedBuffer = await sharp(croppedBuffer)
            // Upscale 2x with high quality
            .resize(width * 2, height * 2, {
              kernel: 'lanczos3',
              withoutEnlargement: false
            })
            .normalize()
            .sharpen({ sigma: 1, m1: 0.5, m2: 0.5 })
            .modulate({ brightness: 1.02, saturation: 1.1 })
            .jpeg({ quality: 90 })
            .toBuffer()
        } else {
          // Just convert to JPEG
          croppedBuffer = await sharp(croppedBuffer)
            .jpeg({ quality: 90 })
            .toBuffer()
        }
        
        // Generate unique filename
        const timestamp = Date.now()
        const fileName = `${user.id}/${targetMemoryId}/digitized-${timestamp}-${i}.jpg`
        
        // Upload to storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('memories')
          .upload(fileName, croppedBuffer, {
            contentType: 'image/jpeg',
            upsert: false
          })
        
        if (uploadError) {
          errors.push(`Photo ${i + 1}: Upload failed - ${uploadError.message}`)
          continue
        }
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('memories')
          .getPublicUrl(fileName)
        
        // Get final image metadata
        const finalMetadata = await sharp(croppedBuffer).metadata()
        
        // Create media record
        const { data: mediaRecord, error: mediaError } = await supabase
          .from('memory_media')
          .insert({
            memory_id: targetMemoryId,
            user_id: user.id,
            file_url: publicUrl,
            file_key: fileName,
            file_type: 'image',
            mime_type: 'image/jpeg',
            file_size: croppedBuffer.length,
            width: finalMetadata.width,
            height: finalMetadata.height,
            is_cover: savedPhotos.length === 0 && i === 0,
            notes: `Digitized from printed photo (region ${i + 1})`
          })
          .select()
          .single()
        
        if (mediaError) {
          errors.push(`Photo ${i + 1}: Failed to create record - ${mediaError.message}`)
          continue
        }
        
        savedPhotos.push({
          ...mediaRecord,
          cropRegion: photo,
          enhanced: enhance
        })
        
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        errors.push(`Photo ${i + 1}: ${message}`)
      }
    }
    
    return NextResponse.json({
      success: true,
      memoryId: targetMemoryId,
      savedPhotos,
      totalDetected: photos.length,
      totalSaved: savedPhotos.length,
      errors: errors.length > 0 ? errors : undefined
    })
    
  } catch (error) {
    console.error('Digitization error:', error)
    return NextResponse.json(
      { success: false, error: 'Digitization failed' },
      { status: 500 }
    )
  }
}
