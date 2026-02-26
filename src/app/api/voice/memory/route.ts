import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import type { TranscriptEntry } from '@/types/voice'

/**
 * POST /api/voice/memory
 * Creates a memory from a voice conversation transcript
 * 
 * Body:
 *   - transcript: TranscriptEntry[] - The conversation transcript
 *   - topic?: string - Optional topic
 *   - contactId?: string - Optional contact ID
 *   - durationSeconds: number - Session duration
 *   - questionCount: number - Number of questions asked
 *   - generateTitle?: boolean - Whether to generate a title
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      transcript,
      topic,
      contactId,
      durationSeconds,
      questionCount,
      generateTitle = true,
    } = body as {
      transcript: TranscriptEntry[]
      topic?: string
      contactId?: string
      durationSeconds: number
      questionCount: number
      generateTitle?: boolean
    }

    // Validate transcript
    if (!transcript || !Array.isArray(transcript) || transcript.length < 2) {
      return NextResponse.json(
        { error: 'Invalid transcript - at least one exchange required' },
        { status: 400 }
      )
    }

    // Build memory content from transcript
    const memoryContent = buildMemoryContent(transcript)
    
    // Generate title if requested
    let title = topic || 'Voice Memory'
    if (generateTitle) {
      try {
        title = await generateMemoryTitle(transcript, topic)
      } catch (err) {
        console.error('Title generation failed:', err)
        // Fall back to topic or default
        title = topic || extractFallbackTitle(transcript)
      }
    }

    // Create the memory
    const { data: memory, error: memoryError } = await supabase
      .from('memories')
      .insert({
        user_id: user.id,
        title,
        description: memoryContent,
        memory_type: 'voice',
        memory_date: new Date().toISOString().split('T')[0],
        ai_labels: {
          transcript,
          duration_seconds: durationSeconds,
          question_count: questionCount,
          topic,
          voice_session: true,
          contact_id: contactId || null,
        },
      })
      .select('id')
      .single()

    if (memoryError) {
      console.error('Memory creation error:', memoryError)
      return NextResponse.json(
        { error: 'Failed to create memory', details: memoryError.message },
        { status: 500 }
      )
    }

    // Award XP for creating a memory via voice
    try {
      await supabase.rpc('award_xp', {
        p_user_id: user.id,
        p_action: 'create_memory_voice',
        p_metadata: { memory_id: memory.id, duration_seconds: durationSeconds },
      })
    } catch (xpError) {
      console.error('XP award error:', xpError)
      // Non-fatal, continue
    }

    return NextResponse.json({
      success: true,
      memoryId: memory.id,
      title,
      description: memoryContent,
    })

  } catch (error) {
    console.error('Voice memory creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Build memory content from transcript
 * Extracts user responses and formats them as a coherent narrative
 */
function buildMemoryContent(transcript: TranscriptEntry[]): string {
  // Extract just the user responses for the main content
  const userResponses = transcript
    .filter(entry => entry.role === 'user')
    .map(entry => entry.text.trim())
    .filter(text => text.length > 0)

  if (userResponses.length === 0) {
    return 'No content captured'
  }

  // Format as a narrative
  const paragraphs = userResponses.map(response => {
    // Ensure proper punctuation
    let text = response
    if (!text.endsWith('.') && !text.endsWith('!') && !text.endsWith('?')) {
      text += '.'
    }
    return text
  })

  return paragraphs.join('\n\n')
}

/**
 * Generate a memory title using Gemini
 */
async function generateMemoryTitle(
  transcript: TranscriptEntry[],
  topic?: string
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('Gemini API key not configured')
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

  // Extract user content for title generation
  const userContent = transcript
    .filter(t => t.role === 'user')
    .map(t => t.text)
    .join(' ')
    .substring(0, 1000) // Limit context

  const prompt = `Based on this memory, create a short, evocative title (3-7 words) that captures the essence of the story. Be warm and personal, not clinical.

${topic ? `Topic: ${topic}\n` : ''}Memory: ${userContent}

Title:`

  const result = await model.generateContent(prompt)
  const title = result.response.text().trim()
  
  // Clean up the title
  return title
    .replace(/["']/g, '')
    .replace(/\.$/, '')
    .substring(0, 100) // Max length
}

/**
 * Extract a fallback title from the first substantial user message
 */
function extractFallbackTitle(transcript: TranscriptEntry[]): string {
  const firstUserMessage = transcript.find(t => t.role === 'user')
  if (!firstUserMessage) return 'Voice Memory'
  
  const words = firstUserMessage.text.split(' ').slice(0, 5).join(' ')
  return words + (firstUserMessage.text.split(' ').length > 5 ? '...' : '')
}
