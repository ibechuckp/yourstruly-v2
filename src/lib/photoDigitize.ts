/**
 * Photo Digitization Library
 * 
 * Handles detection and extraction of individual photos from scanned images,
 * including grid layouts (2x2, 3x3, etc.) and scattered photos.
 */

export interface DetectedPhoto {
  id: string
  x: number
  y: number
  width: number
  height: number
  confidence: number
  preview?: string // base64 cropped preview
}

export interface DetectionResult {
  success: boolean
  photos: DetectedPhoto[]
  originalWidth: number
  originalHeight: number
  error?: string
}

export interface EnhancementResult {
  success: boolean
  enhancedUrl?: string
  originalUrl?: string
  error?: string
}

/**
 * Simple grid detection using histogram analysis
 * Finds horizontal and vertical gaps in the image that likely separate photos
 */
export function detectGridLines(
  imageData: Uint8ClampedArray,
  width: number,
  height: number,
  threshold: number = 240 // near-white threshold
): { horizontalGaps: number[], verticalGaps: number[] } {
  // Calculate average brightness per row
  const rowBrightness: number[] = []
  for (let y = 0; y < height; y++) {
    let sum = 0
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      sum += (imageData[idx] + imageData[idx + 1] + imageData[idx + 2]) / 3
    }
    rowBrightness.push(sum / width)
  }

  // Calculate average brightness per column
  const colBrightness: number[] = []
  for (let x = 0; x < width; x++) {
    let sum = 0
    for (let y = 0; y < height; y++) {
      const idx = (y * width + x) * 4
      sum += (imageData[idx] + imageData[idx + 1] + imageData[idx + 2]) / 3
    }
    colBrightness.push(sum / height)
  }

  // Find gaps (runs of bright pixels)
  const findGaps = (brightness: number[], minGapSize: number = 10): number[] => {
    const gaps: number[] = []
    let gapStart = -1
    
    for (let i = 0; i < brightness.length; i++) {
      if (brightness[i] > threshold) {
        if (gapStart === -1) gapStart = i
      } else {
        if (gapStart !== -1 && i - gapStart >= minGapSize) {
          gaps.push(Math.floor((gapStart + i) / 2))
        }
        gapStart = -1
      }
    }
    
    return gaps
  }

  return {
    horizontalGaps: findGaps(rowBrightness, Math.floor(height * 0.02)),
    verticalGaps: findGaps(colBrightness, Math.floor(width * 0.02))
  }
}

/**
 * Generate photo regions from detected gaps
 */
export function regionsFromGaps(
  width: number,
  height: number,
  horizontalGaps: number[],
  verticalGaps: number[],
  minSize: number = 100
): DetectedPhoto[] {
  const regions: DetectedPhoto[] = []
  
  // Add image boundaries
  const yBounds = [0, ...horizontalGaps, height]
  const xBounds = [0, ...verticalGaps, width]
  
  let id = 0
  for (let yi = 0; yi < yBounds.length - 1; yi++) {
    for (let xi = 0; xi < xBounds.length - 1; xi++) {
      const x = xBounds[xi]
      const y = yBounds[yi]
      const w = xBounds[xi + 1] - x
      const h = yBounds[yi + 1] - y
      
      // Skip tiny regions
      if (w < minSize || h < minSize) continue
      
      regions.push({
        id: `photo_${id++}`,
        x,
        y,
        width: w,
        height: h,
        confidence: 0.8
      })
    }
  }
  
  return regions
}

/**
 * Check if a bounding box is valid (not too small, not the entire image)
 */
export function isValidPhotoRegion(
  region: DetectedPhoto,
  imageWidth: number,
  imageHeight: number,
  minDimension: number = 100,
  maxCoverage: number = 0.95
): boolean {
  if (region.width < minDimension || region.height < minDimension) return false
  
  const coverage = (region.width * region.height) / (imageWidth * imageHeight)
  if (coverage > maxCoverage) return false
  
  return true
}

/**
 * Merge overlapping regions
 */
export function mergeOverlappingRegions(
  regions: DetectedPhoto[],
  overlapThreshold: number = 0.3
): DetectedPhoto[] {
  if (regions.length <= 1) return regions
  
  const merged: DetectedPhoto[] = []
  const used = new Set<number>()
  
  for (let i = 0; i < regions.length; i++) {
    if (used.has(i)) continue
    
    let current = { ...regions[i] }
    
    for (let j = i + 1; j < regions.length; j++) {
      if (used.has(j)) continue
      
      const other = regions[j]
      const overlapX = Math.max(0, Math.min(current.x + current.width, other.x + other.width) - Math.max(current.x, other.x))
      const overlapY = Math.max(0, Math.min(current.y + current.height, other.y + other.height) - Math.max(current.y, other.y))
      const overlapArea = overlapX * overlapY
      const minArea = Math.min(current.width * current.height, other.width * other.height)
      
      if (overlapArea / minArea > overlapThreshold) {
        // Merge: take bounding box of both
        const newX = Math.min(current.x, other.x)
        const newY = Math.min(current.y, other.y)
        const newRight = Math.max(current.x + current.width, other.x + other.width)
        const newBottom = Math.max(current.y + current.height, other.y + other.height)
        
        current = {
          ...current,
          x: newX,
          y: newY,
          width: newRight - newX,
          height: newBottom - newY,
          confidence: Math.max(current.confidence, other.confidence)
        }
        used.add(j)
      }
    }
    
    merged.push(current)
  }
  
  return merged
}

/**
 * Add padding to crop region (helps with edge detection artifacts)
 */
export function addPadding(
  region: DetectedPhoto,
  imageWidth: number,
  imageHeight: number,
  paddingPercent: number = 0.02
): DetectedPhoto {
  const padX = Math.floor(region.width * paddingPercent)
  const padY = Math.floor(region.height * paddingPercent)
  
  const newX = Math.max(0, region.x - padX)
  const newY = Math.max(0, region.y - padY)
  const newWidth = Math.min(imageWidth - newX, region.width + padX * 2)
  const newHeight = Math.min(imageHeight - newY, region.height + padY * 2)
  
  return {
    ...region,
    x: newX,
    y: newY,
    width: newWidth,
    height: newHeight
  }
}

/**
 * Parse AI vision response for photo bounding boxes
 * Expected format: JSON with array of {x, y, width, height} or similar
 */
export function parseAIVisionResponse(response: string): DetectedPhoto[] {
  try {
    // Try to find JSON in the response
    const jsonMatch = response.match(/\[[\s\S]*\]/) || response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return []
    
    const parsed = JSON.parse(jsonMatch[0])
    const items = Array.isArray(parsed) ? parsed : [parsed]
    
    return items.map((item: any, idx: number) => ({
      id: `ai_photo_${idx}`,
      x: item.x || item.left || 0,
      y: item.y || item.top || 0,
      width: item.width || item.w || 100,
      height: item.height || item.h || 100,
      confidence: item.confidence || 0.9
    })).filter(p => p.width > 0 && p.height > 0)
  } catch {
    return []
  }
}
