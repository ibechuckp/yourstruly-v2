import {
  RekognitionClient,
  DetectLabelsCommand,
  DetectFacesCommand,
  DetectTextCommand,
  IndexFacesCommand,
  SearchFacesByImageCommand,
  CreateCollectionCommand,
  ListCollectionsCommand,
  DeleteFacesCommand,
} from '@aws-sdk/client-rekognition'

// Check if AWS is configured
const isAwsConfigured = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)

// Only create client if credentials exist
const rekognition = isAwsConfigured ? new RekognitionClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
}) : null

const BUCKET = process.env.AWS_S3_BUCKET || process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0] + '.supabase.co'

// ============================================
// LABEL DETECTION (Scene Understanding)
// ============================================

export interface DetectedLabel {
  name: string
  confidence: number
  categories: string[]
  parents: string[]
}

export async function detectLabels(
  imageBytes: Buffer | Uint8Array,
  maxLabels = 20,
  minConfidence = 70
): Promise<DetectedLabel[]> {
  if (!rekognition) return []

  const command = new DetectLabelsCommand({
    Image: { Bytes: imageBytes },
    MaxLabels: maxLabels,
    MinConfidence: minConfidence,
    Features: ['GENERAL_LABELS'],
  })

  const response = await rekognition.send(command)

  return (response.Labels || []).map(label => ({
    name: label.Name || '',
    confidence: label.Confidence || 0,
    categories: label.Categories?.map(c => c.Name || '') || [],
    parents: label.Parents?.map(p => p.Name || '') || [],
  }))
}

// ============================================
// FACE DETECTION
// ============================================

export interface DetectedFace {
  boundingBox: {
    left: number
    top: number
    width: number
    height: number
  }
  confidence: number
  emotions: { type: string; confidence: number }[]
  ageRange: { low: number; high: number } | null
  gender: { value: string; confidence: number } | null
  smile: boolean
  eyeglasses: boolean
  sunglasses: boolean
}

export async function detectFaces(
  imageBytes: Buffer | Uint8Array
): Promise<DetectedFace[]> {
  if (!rekognition) return []

  const command = new DetectFacesCommand({
    Image: { Bytes: imageBytes },
    Attributes: ['ALL'],
  })

  const response = await rekognition.send(command)

  return (response.FaceDetails || []).map(face => ({
    boundingBox: {
      left: face.BoundingBox?.Left || 0,
      top: face.BoundingBox?.Top || 0,
      width: face.BoundingBox?.Width || 0,
      height: face.BoundingBox?.Height || 0,
    },
    confidence: face.Confidence || 0,
    emotions: (face.Emotions || []).map(e => ({
      type: e.Type || '',
      confidence: e.Confidence || 0,
    })),
    ageRange: face.AgeRange ? { low: face.AgeRange.Low || 0, high: face.AgeRange.High || 0 } : null,
    gender: face.Gender ? { value: face.Gender.Value || '', confidence: face.Gender.Confidence || 0 } : null,
    smile: face.Smile?.Value || false,
    eyeglasses: face.Eyeglasses?.Value || false,
    sunglasses: face.Sunglasses?.Value || false,
  }))
}

// ============================================
// TEXT DETECTION (OCR)
// ============================================

export interface DetectedText {
  text: string
  type: 'LINE' | 'WORD'
  confidence: number
  boundingBox: {
    left: number
    top: number
    width: number
    height: number
  } | null
}

export async function detectText(
  imageBytes: Buffer | Uint8Array
): Promise<DetectedText[]> {
  if (!rekognition) return []

  const command = new DetectTextCommand({
    Image: { Bytes: imageBytes },
  })

  const response = await rekognition.send(command)

  return (response.TextDetections || []).map(text => ({
    text: text.DetectedText || '',
    type: (text.Type as 'LINE' | 'WORD') || 'WORD',
    confidence: text.Confidence || 0,
    boundingBox: text.Geometry?.BoundingBox ? {
      left: text.Geometry.BoundingBox.Left || 0,
      top: text.Geometry.BoundingBox.Top || 0,
      width: text.Geometry.BoundingBox.Width || 0,
      height: text.Geometry.BoundingBox.Height || 0,
    } : null,
  }))
}

// ============================================
// FACE INDEXING (for recognition)
// ============================================

function getCollectionId(userId: string): string {
  return `yt2_user_${userId}_faces`
}

export async function ensureCollection(userId: string): Promise<void> {
  if (!rekognition) return

  const collectionId = getCollectionId(userId)
  
  try {
    const listCommand = new ListCollectionsCommand({})
    const response = await rekognition.send(listCommand)
    
    if (response.CollectionIds?.includes(collectionId)) {
      return // Already exists
    }
  } catch (e) {
    // Ignore list errors
  }

  try {
    const createCommand = new CreateCollectionCommand({
      CollectionId: collectionId,
    })
    await rekognition.send(createCommand)
  } catch (e: any) {
    if (e.name !== 'ResourceAlreadyExistsException') {
      throw e
    }
  }
}

export interface IndexedFace {
  faceId: string
  boundingBox: {
    left: number
    top: number
    width: number
    height: number
  }
}

export async function indexFace(
  userId: string,
  contactId: string,
  imageBytes: Buffer | Uint8Array
): Promise<IndexedFace | null> {
  if (!rekognition) return null

  await ensureCollection(userId)

  const command = new IndexFacesCommand({
    CollectionId: getCollectionId(userId),
    ExternalImageId: contactId,
    Image: { Bytes: imageBytes },
    DetectionAttributes: ['DEFAULT'],
    MaxFaces: 1,
    QualityFilter: 'AUTO',
  })

  const response = await rekognition.send(command)

  const face = response.FaceRecords?.[0]?.Face
  if (!face?.FaceId) return null

  return {
    faceId: face.FaceId,
    boundingBox: {
      left: face.BoundingBox?.Left || 0,
      top: face.BoundingBox?.Top || 0,
      width: face.BoundingBox?.Width || 0,
      height: face.BoundingBox?.Height || 0,
    },
  }
}

export interface FaceMatch {
  contactId: string
  faceId: string
  confidence: number
  boundingBox: {
    left: number
    top: number
    width: number
    height: number
  }
}

export async function searchFaces(
  userId: string,
  imageBytes: Buffer | Uint8Array,
  threshold = 85
): Promise<FaceMatch[]> {
  if (!rekognition) return []

  await ensureCollection(userId)

  try {
    const command = new SearchFacesByImageCommand({
      CollectionId: getCollectionId(userId),
      Image: { Bytes: imageBytes },
      FaceMatchThreshold: threshold,
      MaxFaces: 10,
    })

    const response = await rekognition.send(command)

    return (response.FaceMatches || []).map(match => ({
      contactId: match.Face?.ExternalImageId || '',
      faceId: match.Face?.FaceId || '',
      confidence: match.Similarity || 0,
      boundingBox: {
        left: match.Face?.BoundingBox?.Left || 0,
        top: match.Face?.BoundingBox?.Top || 0,
        width: match.Face?.BoundingBox?.Width || 0,
        height: match.Face?.BoundingBox?.Height || 0,
      },
    }))
  } catch (e: any) {
    if (e.message?.includes('no faces')) {
      return []
    }
    throw e
  }
}

export async function deleteFaceFromIndex(
  userId: string,
  faceId: string
): Promise<void> {
  if (!rekognition) return

  const command = new DeleteFacesCommand({
    CollectionId: getCollectionId(userId),
    FaceIds: [faceId],
  })

  await rekognition.send(command)
}

// ============================================
// SMART ANALYSIS (combines all detection)
// ============================================

export interface ImageAnalysis {
  labels: DetectedLabel[]
  faces: DetectedFace[]
  text: DetectedText[]
  summary: {
    category: string
    mood: string
    description: string
    peopleCount: number
    hasText: boolean
    dominantLabels: string[]
  }
}

const CATEGORY_MAPPINGS: Record<string, string[]> = {
  travel: ['Landmark', 'Beach', 'Mountain', 'City', 'Architecture', 'Tourism', 'Airport', 'Hotel'],
  family: ['Baby', 'Child', 'Family', 'Home', 'Living Room', 'Bedroom'],
  celebration: ['Party', 'Birthday', 'Wedding', 'Cake', 'Balloon', 'Gift', 'Christmas', 'Holiday'],
  nature: ['Nature', 'Landscape', 'Forest', 'Ocean', 'Lake', 'Garden', 'Flower', 'Animal', 'Pet'],
  food: ['Food', 'Restaurant', 'Meal', 'Drink', 'Kitchen', 'Cooking'],
  sports: ['Sport', 'Exercise', 'Fitness', 'Running', 'Swimming', 'Ball'],
  work: ['Office', 'Computer', 'Meeting', 'Business', 'Desk'],
  art: ['Art', 'Museum', 'Painting', 'Sculpture', 'Performance', 'Concert'],
}

function categorizeImage(labels: DetectedLabel[]): string {
  const labelNames = labels.map(l => l.name.toLowerCase())
  
  let bestCategory = 'everyday'
  let bestScore = 0

  for (const [category, keywords] of Object.entries(CATEGORY_MAPPINGS)) {
    const score = keywords.filter(kw => 
      labelNames.some(l => l.includes(kw.toLowerCase()))
    ).length
    
    if (score > bestScore) {
      bestScore = score
      bestCategory = category
    }
  }

  return bestCategory
}

function detectMood(faces: DetectedFace[], labels: DetectedLabel[]): string {
  if (faces.length === 0) {
    // Infer from labels
    const labelNames = labels.map(l => l.name.toLowerCase())
    if (labelNames.some(l => l.includes('sunset') || l.includes('peaceful'))) return 'peaceful'
    if (labelNames.some(l => l.includes('party') || l.includes('celebration'))) return 'joyful'
    if (labelNames.some(l => l.includes('mountain') || l.includes('adventure'))) return 'adventurous'
    return 'neutral'
  }

  // Get dominant emotion from faces
  const allEmotions: Record<string, number> = {}
  
  for (const face of faces) {
    for (const emotion of face.emotions) {
      if (emotion.confidence > 50) {
        allEmotions[emotion.type] = (allEmotions[emotion.type] || 0) + emotion.confidence
      }
    }
  }

  const sortedEmotions = Object.entries(allEmotions).sort((a, b) => b[1] - a[1])
  const topEmotion = sortedEmotions[0]?.[0]?.toLowerCase() || 'neutral'

  const moodMap: Record<string, string> = {
    happy: 'joyful',
    sad: 'nostalgic',
    angry: 'intense',
    surprised: 'excited',
    fear: 'dramatic',
    disgusted: 'candid',
    confused: 'candid',
    calm: 'peaceful',
  }

  return moodMap[topEmotion] || 'neutral'
}

function generateDescription(
  labels: DetectedLabel[],
  faces: DetectedFace[],
  category: string
): string {
  const topLabels = labels.slice(0, 5).map(l => l.name)
  const peopleCount = faces.length

  let desc = ''

  if (peopleCount > 0) {
    desc += peopleCount === 1 ? 'A person ' : `${peopleCount} people `
  }

  if (topLabels.length > 0) {
    const scene = topLabels.slice(0, 3).join(', ').toLowerCase()
    desc += desc ? `in a scene with ${scene}` : `A scene with ${scene}`
  }

  if (!desc) {
    desc = `A ${category} moment`
  }

  return desc
}

export async function analyzeImage(
  imageBytes: Buffer | Uint8Array
): Promise<ImageAnalysis> {
  // Return empty analysis if AWS is not configured
  if (!rekognition) {
    return {
      labels: [],
      faces: [],
      text: [],
      summary: {
        category: 'everyday',
        mood: 'neutral',
        description: 'A captured moment',
        peopleCount: 0,
        hasText: false,
        dominantLabels: [],
      },
    }
  }

  // Run all detections in parallel
  const [labels, faces, textResults] = await Promise.all([
    detectLabels(imageBytes).catch(() => []),
    detectFaces(imageBytes).catch(() => []),
    detectText(imageBytes).catch(() => []),
  ])

  const category = categorizeImage(labels)
  const mood = detectMood(faces, labels)
  const description = generateDescription(labels, faces, category)

  return {
    labels,
    faces,
    text: textResults,
    summary: {
      category,
      mood,
      description,
      peopleCount: faces.length,
      hasText: textResults.some(t => t.type === 'LINE'),
      dominantLabels: labels.slice(0, 10).map(l => l.name),
    },
  }
}
