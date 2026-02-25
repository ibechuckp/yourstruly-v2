import { createClient } from '@/lib/supabase/server'
import { generateQRCode } from '@/lib/photobook/qr-generator'
import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

/**
 * POST /api/qr/generate
 * Generate a QR code for a memory or wisdom entry
 * 
 * Body:
 *   - memory_id?: string - UUID of the memory
 *   - wisdom_id?: string - UUID of the wisdom entry
 *   - format?: 'png' | 'svg' | 'dataurl' | 'json' (default: 'png')
 *   - size?: number (default: 200)
 *   - expires_at?: string (ISO date, optional)
 *   - max_views?: number (optional, 0 = unlimited)
 *   - allowed_contact_ids?: string[] (optional, restrict to specific contacts)
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const {
      memory_id,
      wisdom_id,
      format = 'png',
      size = 200,
      expires_at,
      max_views = 0,
      allowed_contact_ids
    } = body

    // Must provide either memory_id or wisdom_id
    if (!memory_id && !wisdom_id) {
      return NextResponse.json(
        { error: 'Must provide either memory_id or wisdom_id' },
        { status: 400 }
      )
    }

    if (memory_id && wisdom_id) {
      return NextResponse.json(
        { error: 'Can only provide one of memory_id or wisdom_id' },
        { status: 400 }
      )
    }

    // Verify user owns the memory/wisdom
    if (memory_id) {
      const { data: memory, error: memoryError } = await supabase
        .from('memories')
        .select('id, user_id')
        .eq('id', memory_id)
        .single()

      if (memoryError || !memory) {
        return NextResponse.json(
          { error: 'Memory not found' },
          { status: 404 }
        )
      }

      if (memory.user_id !== user.id) {
        return NextResponse.json(
          { error: 'Not authorized to create QR for this memory' },
          { status: 403 }
        )
      }
    }

    if (wisdom_id) {
      const { data: wisdom, error: wisdomError } = await supabase
        .from('wisdom_entries')
        .select('id, user_id')
        .eq('id', wisdom_id)
        .single()

      if (wisdomError || !wisdom) {
        return NextResponse.json(
          { error: 'Wisdom entry not found' },
          { status: 404 }
        )
      }

      if (wisdom.user_id !== user.id) {
        return NextResponse.json(
          { error: 'Not authorized to create QR for this wisdom entry' },
          { status: 403 }
        )
      }
    }

    // Generate unique token
    const token = generateSecureToken()

    // Create qr_access_token record
    const tokenRecord: {
      token: string
      created_by_user_id: string
      memory_id?: string
      wisdom_id?: string
      expires_at?: string
      max_views: number
      allowed_contact_ids?: string[]
    } = {
      token,
      created_by_user_id: user.id,
      max_views
    }

    if (memory_id) tokenRecord.memory_id = memory_id
    if (wisdom_id) tokenRecord.wisdom_id = wisdom_id
    if (expires_at) tokenRecord.expires_at = expires_at
    if (allowed_contact_ids?.length) tokenRecord.allowed_contact_ids = allowed_contact_ids

    const { data: insertedToken, error: insertError } = await supabase
      .from('qr_access_tokens')
      .insert(tokenRecord)
      .select()
      .single()

    if (insertError) {
      console.error('Error creating QR token:', insertError)
      return NextResponse.json(
        { error: 'Failed to create QR token' },
        { status: 500 }
      )
    }

    // Generate QR code
    const qrResult = await generateQRCode(token, {
      size,
      includeLogo: true,
      errorCorrectionLevel: 'H'
    })

    // Return based on format
    switch (format) {
      case 'svg':
        return new NextResponse(qrResult.svg, {
          headers: {
            'Content-Type': 'image/svg+xml',
            'Content-Disposition': `inline; filename="qr-${token.slice(0, 8)}.svg"`
          }
        })

      case 'dataurl':
        return NextResponse.json({
          token,
          url: qrResult.url,
          dataUrl: qrResult.dataUrl,
          id: insertedToken.id
        })

      case 'json':
        return NextResponse.json({
          token,
          url: qrResult.url,
          dataUrl: qrResult.dataUrl,
          svg: qrResult.svg,
          id: insertedToken.id,
          expires_at: insertedToken.expires_at,
          max_views: insertedToken.max_views
        })

      case 'png':
      default:
        return new NextResponse(new Uint8Array(qrResult.pngBuffer), {
          headers: {
            'Content-Type': 'image/png',
            'Content-Disposition': `inline; filename="qr-${token.slice(0, 8)}.png"`,
            'X-QR-Token': token,
            'X-QR-URL': qrResult.url
          }
        })
    }

  } catch (error) {
    console.error('QR generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate QR code' },
      { status: 500 }
    )
  }
}

/**
 * Generate a secure, URL-safe token
 * Format: yt_XXXXXXXXXXXXXXXXXX (16 random chars)
 */
function generateSecureToken(): string {
  const bytes = randomBytes(12)
  const base64 = bytes.toString('base64url')
  return `yt_${base64}`
}
