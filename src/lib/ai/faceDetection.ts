/**
 * Face Detection Service (Open Source)
 * 
 * Uses @vladmandic/face-api (face-api.js fork) for:
 * - Face detection
 * - Face embeddings (128-dim descriptors)
 * - Face matching/recognition
 * 
 * Models are loaded from /public/models/face-api/
 */

import * as faceapi from '@vladmandic/face-api'
import { Canvas, Image, ImageData } from 'canvas'
import * as path from 'path'
import * as fs from 'fs'

// Monkey-patch for Node.js environment
// @ts-ignore
faceapi.env.monkeyPatch({ Canvas, Image, ImageData })

// Track if models are loaded
let modelsLoaded = false
let modelsLoading: Promise<void> | null = null

// Models directory (relative to project root in production, or use env var)
const MODELS_DIR = process.env.FACE_MODELS_PATH || path.join(process.cwd(), 'public', 'models', 'face-api')

/**
 * Load face detection models (only once)
 */
export async function loadModels(): Promise<void> {
  if (modelsLoaded) return
  if (modelsLoading) return modelsLoading

  modelsLoading = (async () => {
    // Check if models directory exists
    if (!fs.existsSync(MODELS_DIR)) {
      console.warn(`Face models not found at ${MODELS_DIR}. Face detection disabled.`)
      return
    }

    try {
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromDisk(MODELS_DIR),
        faceapi.nets.faceLandmark68Net.loadFromDisk(MODELS_DIR),
        faceapi.nets.faceRecognitionNet.loadFromDisk(MODELS_DIR),
        faceapi.nets.ageGenderNet.loadFromDisk(MODELS_DIR),
        faceapi.nets.faceExpressionNet.loadFromDisk(MODELS_DIR),
      ])
      modelsLoaded = true
      console.log('✅ Face detection models loaded')
    } catch (e) {
      console.error('Failed to load face models:', e)
    }
  })()

  return modelsLoading
}

// ============================================
// INTERFACES
// ============================================

export interface DetectedFace {
  boundingBox: {
    x: number
    y: number
    width: number
    height: number
  }
  confidence: number
  embedding: number[] // 128-dimensional descriptor
  age?: number
  gender?: string
  genderProbability?: number
  expressions?: Record<string, number>
}

export interface FaceMatch {
  contactId: string
  distance: number
  confidence: number
}

// ============================================
// FACE DETECTION
// ============================================

/**
 * Detect all faces in an image and extract embeddings
 */
export async function detectFaces(imageBuffer: Buffer): Promise<DetectedFace[]> {
  await loadModels()
  if (!modelsLoaded) return []

  try {
    // Load image using canvas
    const img = await loadImage(imageBuffer)
    
    // Detect faces with all attributes
    const detections = await faceapi
      .detectAllFaces(img as any)
      .withFaceLandmarks()
      .withFaceDescriptors()
      .withAgeAndGender()
      .withFaceExpressions()

    return detections.map(det => {
      const box = det.detection.box
      
      return {
        boundingBox: {
          x: box.x / img.width,
          y: box.y / img.height,
          width: box.width / img.width,
          height: box.height / img.height,
        },
        confidence: det.detection.score,
        embedding: Array.from(det.descriptor), // 128-dim Float32Array -> number[]
        age: Math.round(det.age),
        gender: det.gender,
        genderProbability: det.genderProbability,
        expressions: det.expressions as unknown as Record<string, number>,
      }
    })
  } catch (e) {
    console.error('Face detection error:', e)
    return []
  }
}

/**
 * Detect single face (best for profile photos)
 */
export async function detectSingleFace(imageBuffer: Buffer): Promise<DetectedFace | null> {
  const faces = await detectFaces(imageBuffer)
  if (faces.length === 0) return null
  
  // Return face with highest confidence
  return faces.reduce((best, face) => 
    face.confidence > best.confidence ? face : best
  )
}

// ============================================
// FACE MATCHING
// ============================================

/**
 * Calculate Euclidean distance between two face embeddings
 * Lower distance = more similar (0 = identical)
 */
export function calculateFaceDistance(embedding1: number[], embedding2: number[]): number {
  if (embedding1.length !== 128 || embedding2.length !== 128) {
    throw new Error('Embeddings must be 128-dimensional')
  }

  let sum = 0
  for (let i = 0; i < 128; i++) {
    const diff = embedding1[i] - embedding2[i]
    sum += diff * diff
  }
  return Math.sqrt(sum)
}

/**
 * Convert distance to confidence percentage
 * Distance 0.6 is typical threshold for face-api.js
 */
export function distanceToConfidence(distance: number): number {
  // distance 0 = 100% match, distance 0.6 = ~60%, distance 1.2+ = ~0%
  const confidence = Math.max(0, Math.min(100, (1 - distance / 1.2) * 100))
  return Math.round(confidence * 10) / 10
}

/**
 * Match a face against a set of known faces
 */
export function matchFace(
  faceEmbedding: number[],
  knownFaces: Array<{ id: string; embedding: number[] }>,
  threshold = 0.6
): FaceMatch | null {
  let bestMatch: FaceMatch | null = null
  let bestDistance = Infinity

  for (const known of knownFaces) {
    const distance = calculateFaceDistance(faceEmbedding, known.embedding)
    
    if (distance < threshold && distance < bestDistance) {
      bestDistance = distance
      bestMatch = {
        contactId: known.id,
        distance,
        confidence: distanceToConfidence(distance),
      }
    }
  }

  return bestMatch
}

/**
 * Find all matches for a face (sorted by confidence)
 */
export function findAllMatches(
  faceEmbedding: number[],
  knownFaces: Array<{ id: string; embedding: number[] }>,
  maxResults = 5,
  threshold = 0.8 // More lenient for suggestions
): FaceMatch[] {
  const matches: FaceMatch[] = []

  for (const known of knownFaces) {
    const distance = calculateFaceDistance(faceEmbedding, known.embedding)
    
    if (distance < threshold) {
      matches.push({
        contactId: known.id,
        distance,
        confidence: distanceToConfidence(distance),
      })
    }
  }

  return matches
    .sort((a, b) => a.distance - b.distance)
    .slice(0, maxResults)
}

// ============================================
// UTILITIES
// ============================================

/**
 * Load image from buffer using canvas
 */
async function loadImage(buffer: Buffer): Promise<Image> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = (err) => reject(err)
    img.src = buffer
  })
}

/**
 * Get dominant expression from face
 */
export function getDominantExpression(expressions: Record<string, number>): string {
  const sorted = Object.entries(expressions).sort((a, b) => b[1] - a[1])
  return sorted[0]?.[0] || 'neutral'
}

/**
 * Check if models are available
 */
export function isAvailable(): boolean {
  return modelsLoaded
}

/**
 * Ensure models are loaded (for startup)
 */
export async function ensureModels(): Promise<boolean> {
  await loadModels()
  return modelsLoaded
}
