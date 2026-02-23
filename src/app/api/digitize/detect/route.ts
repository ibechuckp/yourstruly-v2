import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import sharp from 'sharp'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { 
  DetectedPhoto, 
  DetectionResult,
  regionsFromGaps,
  mergeOverlappingRegions,
  isValidPhotoRegion,
  addPadding,
  parseAIVisionResponse
} from '@/lib/photoDigitize'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

/**
 * Detect individual photos in a scanned image
 * Uses a combination of histogram analysis and AI vision
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('image') as File
    const useAI = formData.get('useAI') === 'true'
    
    if (!file) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Get image metadata
    const metadata = await sharp(buffer).metadata()
    const width = metadata.width || 0
    const height = metadata.height || 0
    
    if (!width || !height) {
      return NextResponse.json({ error: 'Invalid image' }, { status: 400 })
    }

    let detectedPhotos: DetectedPhoto[] = []

    // Method 1: AI Vision Detection (more accurate for irregular layouts)
    if (useAI) {
      try {
        const base64Image = buffer.toString('base64')
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })
        
        const prompt = `Analyze this image which contains one or more printed photographs that have been photographed or scanned.

Your task is to identify the boundaries of each individual printed photo in the image.

Return ONLY a JSON array with the bounding boxes of each photo found. Each object should have:
- x: left position in pixels (from 0)
- y: top position in pixels (from 0)  
- width: width in pixels
- height: height in pixels

The image dimensions are ${width}x${height} pixels.

Example response:
[{"x": 50, "y": 30, "width": 400, "height": 300}, {"x": 500, "y": 30, "width": 400, "height": 300}]

Important:
- Detect ALL individual photos, even if they overlap slightly
- Don't include the background/gaps between photos
- Be precise with boundaries
- If there's only one photo that fills most of the frame, return a single bounding box
- Return empty array [] if no distinct photos are detected`

        const result = await model.generateContent([
          {
            inlineData: {
              mimeType: file.type || 'image/jpeg',
              data: base64Image
            }
          },
          prompt
        ])
        
        const response = result.response.text()
        detectedPhotos = parseAIVisionResponse(response)
        
        // Validate and adjust regions
        detectedPhotos = detectedPhotos
          .filter(p => isValidPhotoRegion(p, width, height, 50, 0.98))
          .map(p => addPadding(p, width, height, 0.01))
        
      } catch (aiError) {
        console.error('AI detection failed, falling back to histogram:', aiError)
      }
    }

    // Method 2: Histogram-based gap detection (fallback or if AI disabled)
    if (detectedPhotos.length === 0) {
      // Resize for faster processing
      const analysisSize = 800
      const scale = Math.min(1, analysisSize / Math.max(width, height))
      const analysisWidth = Math.round(width * scale)
      const analysisHeight = Math.round(height * scale)
      
      const { data: pixelData } = await sharp(buffer)
        .resize(analysisWidth, analysisHeight)
        .raw()
        .toBuffer({ resolveWithObject: true })

      // Detect grid lines using brightness histogram
      const horizontalGaps: number[] = []
      const verticalGaps: number[] = []
      
      // Row brightness analysis
      const rowBrightness: number[] = []
      for (let y = 0; y < analysisHeight; y++) {
        let sum = 0
        for (let x = 0; x < analysisWidth; x++) {
          const idx = (y * analysisWidth + x) * 3
          sum += (pixelData[idx] + pixelData[idx + 1] + pixelData[idx + 2]) / 3
        }
        rowBrightness.push(sum / analysisWidth)
      }
      
      // Column brightness analysis
      const colBrightness: number[] = []
      for (let x = 0; x < analysisWidth; x++) {
        let sum = 0
        for (let y = 0; y < analysisHeight; y++) {
          const idx = (y * analysisWidth + x) * 3
          sum += (pixelData[idx] + pixelData[idx + 1] + pixelData[idx + 2]) / 3
        }
        colBrightness.push(sum / analysisHeight)
      }
      
      // Find gaps (bright regions > threshold)
      const threshold = 235
      const minGapSize = Math.floor(analysisHeight * 0.02)
      
      let gapStart = -1
      for (let i = 0; i < rowBrightness.length; i++) {
        if (rowBrightness[i] > threshold) {
          if (gapStart === -1) gapStart = i
        } else {
          if (gapStart !== -1 && i - gapStart >= minGapSize) {
            horizontalGaps.push(Math.floor(((gapStart + i) / 2) / scale))
          }
          gapStart = -1
        }
      }
      
      gapStart = -1
      for (let i = 0; i < colBrightness.length; i++) {
        if (colBrightness[i] > threshold) {
          if (gapStart === -1) gapStart = i
        } else {
          if (gapStart !== -1 && i - gapStart >= minGapSize) {
            verticalGaps.push(Math.floor(((gapStart + i) / 2) / scale))
          }
          gapStart = -1
        }
      }
      
      // Generate regions from gaps
      detectedPhotos = regionsFromGaps(width, height, horizontalGaps, verticalGaps, 100)
      
      // If no grid detected, check if single photo fills the frame
      if (detectedPhotos.length === 0) {
        // Detect content bounds by finding non-white edges
        let contentTop = 0, contentLeft = 0
        let contentBottom = height, contentRight = width
        
        // Simple edge detection - find first non-white rows/cols
        const edgeThreshold = 230
        
        for (let y = 0; y < analysisHeight; y++) {
          let hasContent = false
          for (let x = 0; x < analysisWidth; x++) {
            const idx = (y * analysisWidth + x) * 3
            const brightness = (pixelData[idx] + pixelData[idx + 1] + pixelData[idx + 2]) / 3
            if (brightness < edgeThreshold) {
              hasContent = true
              break
            }
          }
          if (hasContent) {
            contentTop = Math.floor(y / scale)
            break
          }
        }
        
        for (let y = analysisHeight - 1; y >= 0; y--) {
          let hasContent = false
          for (let x = 0; x < analysisWidth; x++) {
            const idx = (y * analysisWidth + x) * 3
            const brightness = (pixelData[idx] + pixelData[idx + 1] + pixelData[idx + 2]) / 3
            if (brightness < edgeThreshold) {
              hasContent = true
              break
            }
          }
          if (hasContent) {
            contentBottom = Math.floor(y / scale)
            break
          }
        }
        
        for (let x = 0; x < analysisWidth; x++) {
          let hasContent = false
          for (let y = 0; y < analysisHeight; y++) {
            const idx = (y * analysisWidth + x) * 3
            const brightness = (pixelData[idx] + pixelData[idx + 1] + pixelData[idx + 2]) / 3
            if (brightness < edgeThreshold) {
              hasContent = true
              break
            }
          }
          if (hasContent) {
            contentLeft = Math.floor(x / scale)
            break
          }
        }
        
        for (let x = analysisWidth - 1; x >= 0; x--) {
          let hasContent = false
          for (let y = 0; y < analysisHeight; y++) {
            const idx = (y * analysisWidth + x) * 3
            const brightness = (pixelData[idx] + pixelData[idx + 1] + pixelData[idx + 2]) / 3
            if (brightness < edgeThreshold) {
              hasContent = true
              break
            }
          }
          if (hasContent) {
            contentRight = Math.floor(x / scale)
            break
          }
        }
        
        const contentWidth = contentRight - contentLeft
        const contentHeight = contentBottom - contentTop
        
        if (contentWidth > 100 && contentHeight > 100) {
          detectedPhotos = [{
            id: 'photo_0',
            x: contentLeft,
            y: contentTop,
            width: contentWidth,
            height: contentHeight,
            confidence: 0.7
          }]
        }
      }
    }
    
    // Filter and clean up detections
    detectedPhotos = detectedPhotos
      .filter(p => isValidPhotoRegion(p, width, height, 100, 0.98))
    
    detectedPhotos = mergeOverlappingRegions(detectedPhotos, 0.5)
    
    // Generate preview crops for each detected photo
    const photosWithPreviews = await Promise.all(
      detectedPhotos.map(async (photo) => {
        try {
          const cropBuffer = await sharp(buffer)
            .extract({
              left: Math.max(0, photo.x),
              top: Math.max(0, photo.y),
              width: Math.min(photo.width, width - photo.x),
              height: Math.min(photo.height, height - photo.y)
            })
            .resize(200, 200, { fit: 'inside' })
            .jpeg({ quality: 60 })
            .toBuffer()
          
          return {
            ...photo,
            preview: `data:image/jpeg;base64,${cropBuffer.toString('base64')}`
          }
        } catch {
          return photo
        }
      })
    )
    
    const result: DetectionResult = {
      success: true,
      photos: photosWithPreviews,
      originalWidth: width,
      originalHeight: height
    }
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('Photo detection error:', error)
    return NextResponse.json(
      { success: false, error: 'Detection failed', photos: [], originalWidth: 0, originalHeight: 0 },
      { status: 500 }
    )
  }
}
