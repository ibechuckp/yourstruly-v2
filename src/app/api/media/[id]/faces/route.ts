import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { findAllMatches } from '@/lib/ai/faceDetection'

// Helper to parse embedding from Supabase (could be string or array)
function parseEmbedding(embedding: any): number[] | null {
  if (!embedding) return null
  if (Array.isArray(embedding)) return embedding
  if (typeof embedding === 'string') {
    try {
      // pgvector returns as "[0.1,0.2,...]" string
      const parsed = JSON.parse(embedding.replace(/^\[|\]$/g, '').split(',').map(Number))
      return Array.isArray(parsed) ? parsed : null
    } catch {
      return null
    }
  }
  return null
}

/**
 * GET /api/media/[id]/faces - Get all faces in a photo with tag suggestions
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: mediaId } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get faces for this media
  const { data: faces } = await supabase
    .from('memory_face_tags')
    .select(`
      id,
      box_left,
      box_top,
      box_width,
      box_height,
      confidence,
      face_embedding,
      contact_id,
      is_confirmed,
      age,
      gender,
      expression,
      contacts (
        id,
        full_name,
        photo_url
      )
    `)
    .eq('media_id', mediaId)
    .eq('user_id', user.id)

  if (!faces) {
    return NextResponse.json({ faces: [] })
  }

  // Get all known faces for this user (for suggestions)
  const { data: knownFaces } = await supabase
    .from('memory_face_tags')
    .select('face_embedding, contact_id')
    .eq('user_id', user.id)
    .eq('is_confirmed', true)
    .not('contact_id', 'is', null)

  // Create a map of contact_id -> embeddings
  const knownFaceMap = new Map<string, number[]>()
  for (const kf of knownFaces || []) {
    const embedding = parseEmbedding(kf.face_embedding)
    if (kf.contact_id && embedding && !knownFaceMap.has(kf.contact_id)) {
      knownFaceMap.set(kf.contact_id, embedding)
    }
  }

  const knownForMatching = Array.from(knownFaceMap.entries()).map(([id, embedding]) => ({
    id,
    embedding,
  }))

  // Get contact details for suggestions
  const contactIds = Array.from(knownFaceMap.keys())
  const { data: contacts } = contactIds.length > 0
    ? await supabase
        .from('contacts')
        .select('id, full_name, photo_url')
        .in('id', contactIds)
    : { data: [] }

  const contactMap = new Map(contacts?.map(c => [c.id, c]) || [])

  // Build response with suggestions
  const facesWithSuggestions = faces.map(face => {
    let suggestions: Array<{ contact: any; confidence: number }> = []

    // If not tagged yet, find matches
    const faceEmbedding = parseEmbedding(face.face_embedding)
    if (!face.is_confirmed && faceEmbedding && knownForMatching.length > 0) {
      const matches = findAllMatches(faceEmbedding, knownForMatching, 3)
      suggestions = matches.map(m => ({
        contact: contactMap.get(m.contactId),
        confidence: m.confidence,
      })).filter(s => s.contact)
    }

    return {
      id: face.id,
      boundingBox: {
        x: face.box_left,
        y: face.box_top,
        width: face.box_width,
        height: face.box_height,
      },
      confidence: face.confidence,
      age: face.age,
      gender: face.gender,
      expression: face.expression,
      tagged: face.is_confirmed,
      contact: face.contacts,
      suggestions,
    }
  })

  return NextResponse.json({ faces: facesWithSuggestions })
}
