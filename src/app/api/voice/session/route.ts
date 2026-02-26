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
      voice = 'nova',
      instructions,
      model = 'gpt-4o-realtime-preview',
    } = body

    // Validate voice option
    const validVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer', 'marin']
    if (!validVoices.includes(voice)) {
      return NextResponse.json(
        { error: `Invalid voice. Must be one of: ${validVoices.join(', ')}` },
        { status: 400 }
      )
    }

    // Request ephemeral token from OpenAI
    const response = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session: {
          type: 'realtime',
          model,
          voice: voice,
          ...(instructions && { instructions }),
        },
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

    // Return the ephemeral token and client secret
    return NextResponse.json({
      clientSecret: data.client_secret,
      expiresAt: data.expires_at,
      voice,
      model,
    })

  } catch (error) {
    console.error('Voice session error:', error)
    return NextResponse.json(
      { error: 'Failed to create voice session' },
      { status: 500 }
    )
  }
}
