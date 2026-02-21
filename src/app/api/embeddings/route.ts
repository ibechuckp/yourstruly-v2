import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { generateEmbedding, checkProviderConfig } from '@/lib/ai/providers'

// Build embedding text for different content types
function buildEmbeddingText(type: string, data: any): string {
  switch (type) {
    case 'memory':
      return [
        `Memory: ${data.title || 'Untitled memory'}`,
        data.description,
        data.memory_date ? `Date: ${data.memory_date}` : '',
        data.location_name ? `Location: ${data.location_name}` : '',
        data.ai_category ? `Category: ${data.ai_category}` : '',
        data.ai_mood ? `Mood: ${data.ai_mood}` : '',
        data.ai_summary,
      ].filter(Boolean).join(' | ')

    case 'contact':
      return [
        `Person: ${data.full_name}`,
        data.relationship_type ? `Relationship: ${data.relationship_type}` : '',
        data.nickname ? `Also known as: ${data.nickname}` : '',
        data.date_of_birth ? `Birthday: ${data.date_of_birth}` : '',
        data.city || data.state || data.country 
          ? `Lives in: ${[data.city, data.state, data.country].filter(Boolean).join(', ')}`
          : '',
        data.notes ? `Notes: ${data.notes}` : '',
        data.relationship_details,
      ].filter(Boolean).join(' | ')

    case 'postscript':
      return [
        `PostScript message: ${data.title || 'Untitled'}`,
        data.recipient_name ? `Written for: ${data.recipient_name}` : '',
        data.deliver_on ? `To be delivered: ${data.deliver_on}` : '',
        data.message,
      ].filter(Boolean).join(' | ')

    case 'pet':
      return [
        `Pet: ${data.name}`,
        data.species ? `Species: ${data.species}` : '',
        data.breed ? `Breed: ${data.breed}` : '',
        data.date_of_birth ? `Birthday: ${data.date_of_birth}` : '',
        data.personality ? `Personality: ${data.personality}` : '',
        data.favorite_things?.length ? `Favorite things: ${data.favorite_things.join(', ')}` : '',
        data.medical_notes ? `Medical notes: ${data.medical_notes}` : '',
      ].filter(Boolean).join(' | ')

    case 'profile':
      return [
        `User Profile: ${data.full_name || 'User'}`,
        data.occupation ? `Works as: ${data.occupation}` : '',
        data.biography ? `Bio: ${data.biography}` : '',
        data.interests?.length ? `Interests: ${data.interests.join(', ')}` : '',
        data.skills?.length ? `Skills: ${data.skills.join(', ')}` : '',
        data.personality_traits?.length ? `Personality: ${data.personality_traits.join(', ')}` : '',
        data.life_goals?.length ? `Life goals: ${data.life_goals.join(', ')}` : '',
        data.personal_motto ? `Personal motto: ${data.personal_motto}` : '',
      ].filter(Boolean).join(' | ')

    default:
      return JSON.stringify(data)
  }
}

// POST - Generate and save embedding for a single item
export async function POST(request: NextRequest) {
  try {
    // Check provider config
    const config = checkProviderConfig()
    if (!config.embeddings) {
      return NextResponse.json({ 
        error: `Embeddings not configured: ${config.errors.join(', ')}` 
      }, { status: 503 })
    }

    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { type, id, data } = await request.json()

    if (!type || !id) {
      return NextResponse.json({ error: 'Type and ID required' }, { status: 400 })
    }

    // Map type to table
    const tableMap: Record<string, string> = {
      memory: 'memories',
      contact: 'contacts',
      postscript: 'postscripts',
      pet: 'pets',
      profile: 'profiles',
    }

    const table = tableMap[type]
    if (!table) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    // If data not provided, fetch it
    let contentData = data
    if (!contentData) {
      const { data: fetchedData, error } = await supabase
        .from(table)
        .select('*')
        .eq('id', id)
        .single()

      if (error || !fetchedData) {
        return NextResponse.json({ error: 'Content not found' }, { status: 404 })
      }
      contentData = fetchedData
    }

    // Build embedding text
    const embeddingText = buildEmbeddingText(type, contentData)

    // Generate embedding
    const embedding = await generateEmbedding(embeddingText)

    // Save embedding to database
    // pgvector expects the embedding as an array, not a string
    const { error: updateError } = await supabase
      .from(table)
      .update({
        embedding: embedding,
        embedding_text: embeddingText,
      })
      .eq('id', id)

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json({ error: 'Failed to save embedding' }, { status: 500 })
    }

    return NextResponse.json({ success: true, type, id })

  } catch (error) {
    console.error('Embedding error:', error)
    return NextResponse.json({ error: 'Failed to generate embedding' }, { status: 500 })
  }
}

// PUT - Batch generate embeddings for all user content
export async function PUT(request: NextRequest) {
  try {
    // Check provider config
    const config = checkProviderConfig()
    if (!config.embeddings) {
      return NextResponse.json({ 
        error: `Embeddings not configured: ${config.errors.join(', ')}` 
      }, { status: 503 })
    }

    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { type } = body
    const results = { processed: 0, errors: 0, details: [] as string[] }

    // Process based on type or all
    const types = type ? [type] : ['memory', 'contact', 'postscript', 'pet', 'profile']

    for (const contentType of types) {
      const tableMap: Record<string, string> = {
        memory: 'memories',
        contact: 'contacts',
        postscript: 'postscripts',
        pet: 'pets',
        profile: 'profiles',
      }
      const table = tableMap[contentType]
      if (!table) continue

      // Fetch items without embeddings (or all items to refresh)
      // Profiles use 'id' as user identifier, others use 'user_id'
      const query = supabase.from(table).select('*')
      if (contentType === 'profile') {
        query.eq('id', user.id)
      } else {
        query.eq('user_id', user.id)
      }
      const { data: items } = await query.limit(100)

      if (!items?.length) continue

      for (const item of items) {
        try {
          const embeddingText = buildEmbeddingText(contentType, item)
          
          // Skip if text is too short
          if (embeddingText.length < 10) continue
          
          const embedding = await generateEmbedding(embeddingText)

          await supabase
            .from(table)
            .update({
              embedding: embedding,
              embedding_text: embeddingText,
            })
            .eq('id', item.id)

          results.processed++
          
          // Small delay to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 100))
          
        } catch (e: any) {
          console.error(`Error embedding ${contentType} ${item.id}:`, e)
          results.errors++
          results.details.push(`${contentType}/${item.id}: ${e.message}`)
        }
      }
    }

    return NextResponse.json(results)

  } catch (error: any) {
    console.error('Batch embedding error:', error)
    return NextResponse.json({ 
      error: 'Failed to batch generate embeddings',
      details: error.message,
    }, { status: 500 })
  }
}
