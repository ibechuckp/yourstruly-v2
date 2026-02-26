import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/voice/session
 * Generates an ephemeral client token for OpenAI Realtime API WebRTC connection
 * 
 * Body:
 *   - voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' | 'marin'
 *   - instructions?: string - System instructions for the AI
 *   - model?: string - Model to use (default: gpt-4o-realtime-preview)
 */
export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const {
      voice = 'coral', // Warm, friendly voice for biographer persona
      instructions,
      model = 'gpt-4o-realtime-preview-2024-12-17',
    } = body

    // Validate voice option - OpenAI Realtime voices
    const validVoices = ['alloy', 'ash', 'ballad', 'coral', 'echo', 'sage', 'shimmer', 'verse', 'marin', 'cedar']
    if (!validVoices.includes(voice)) {
      return NextResponse.json(
        { error: `Invalid voice. Must be one of: ${validVoices.join(', ')}` },
        { status: 400 }
      )
    }

    // Request ephemeral token from OpenAI Realtime API
    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        voice,
        ...(instructions && { instructions }),
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('OpenAI session error:', error)
      return NextResponse.json(
        { error: 'Failed to create session with OpenAI' },
        { status: 500 }
      )
    }

    const data = await response.json()

    // Return the ephemeral token and session info
    return NextResponse.json({
      clientSecret: data.client_secret?.value,
      expiresAt: data.client_secret?.expires_at,
      sessionId: data.id,
      voice: data.voice,
      model: data.model,
    })

  } catch (error) {
    console.error('Voice session error:', error)
    return NextResponse.json(
      { error: 'Failed to create voice session' },
      { status: 500 }
    )
  }
}
