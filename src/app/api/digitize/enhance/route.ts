import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import sharp from 'sharp'

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN

/**
 * Enhance/upscale a cropped photo using AI
 * Uses Replicate's Real-ESRGAN model for upscaling
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { imageBase64, scale = 2, faceEnhance = true } = body
    
    if (!imageBase64) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    // Extract base64 data
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '')
    const imageBuffer = Buffer.from(base64Data, 'base64')
    
    // Get original dimensions
    const metadata = await sharp(imageBuffer).metadata()
    const originalWidth = metadata.width || 0
    const originalHeight = metadata.height || 0

    let enhancedImageUrl: string
    let enhancedBuffer: Buffer

    // Try Replicate Real-ESRGAN if API key is available
    if (REPLICATE_API_TOKEN) {
      try {
        // Convert to PNG for best quality
        const pngBuffer = await sharp(imageBuffer)
          .png()
          .toBuffer()
        const pngBase64 = `data:image/png;base64,${pngBuffer.toString('base64')}`
        
        // Call Replicate API
        const response = await fetch('https://api.replicate.com/v1/predictions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            // nightmareai/real-esrgan with face enhancement
            version: 'f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa',
            input: {
              image: pngBase64,
              scale: Math.min(scale, 4), // Max 4x
              face_enhance: faceEnhance
            }
          })
        })
        
        if (!response.ok) {
          throw new Error(`Replicate API error: ${response.status}`)
        }
        
        const prediction = await response.json()
        
        // Poll for completion
        let result = prediction
        const maxAttempts = 60 // 60 seconds max
        let attempts = 0
        
        while (result.status !== 'succeeded' && result.status !== 'failed' && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          const statusResponse = await fetch(result.urls.get, {
            headers: { 'Authorization': `Bearer ${REPLICATE_API_TOKEN}` }
          })
          result = await statusResponse.json()
          attempts++
        }
        
        if (result.status === 'succeeded' && result.output) {
          enhancedImageUrl = result.output
          
          // Download the enhanced image
          const enhancedResponse = await fetch(enhancedImageUrl)
          enhancedBuffer = Buffer.from(await enhancedResponse.arrayBuffer())
        } else {
          throw new Error(result.error || 'Enhancement failed')
        }
        
      } catch (replicateError) {
        console.error('Replicate enhancement failed:', replicateError)
        // Fall back to Sharp enhancement
        enhancedBuffer = await enhanceWithSharp(imageBuffer, scale)
        enhancedImageUrl = ''
      }
    } else {
      // No Replicate API key, use Sharp for basic enhancement
      enhancedBuffer = await enhanceWithSharp(imageBuffer, scale)
      enhancedImageUrl = ''
    }
    
    // Get enhanced dimensions
    const enhancedMetadata = await sharp(enhancedBuffer).metadata()
    
    // Convert to base64 for response
    const enhancedBase64 = `data:image/jpeg;base64,${enhancedBuffer.toString('base64')}`
    
    return NextResponse.json({
      success: true,
      enhancedImage: enhancedBase64,
      enhancedUrl: enhancedImageUrl || undefined,
      originalWidth,
      originalHeight,
      enhancedWidth: enhancedMetadata.width,
      enhancedHeight: enhancedMetadata.height,
      method: REPLICATE_API_TOKEN ? 'replicate' : 'sharp'
    })
    
  } catch (error) {
    console.error('Enhancement error:', error)
    return NextResponse.json(
      { success: false, error: 'Enhancement failed' },
      { status: 500 }
    )
  }
}

/**
 * Basic enhancement using Sharp when Replicate is not available
 * Applies: resize, sharpen, color correction, contrast boost
 */
async function enhanceWithSharp(buffer: Buffer, scale: number = 2): Promise<Buffer> {
  const metadata = await sharp(buffer).metadata()
  const width = metadata.width || 800
  const height = metadata.height || 600
  
  return await sharp(buffer)
    // Upscale with lanczos3 (best quality)
    .resize(width * scale, height * scale, {
      kernel: 'lanczos3',
      withoutEnlargement: false
    })
    // Normalize/auto-levels
    .normalize()
    // Slight sharpening
    .sharpen({
      sigma: 1,
      m1: 0.5,
      m2: 0.5
    })
    // Slight contrast and saturation boost (good for old photos)
    .modulate({
      brightness: 1.02,
      saturation: 1.1
    })
    // Output as high-quality JPEG
    .jpeg({ quality: 92 })
    .toBuffer()
}
