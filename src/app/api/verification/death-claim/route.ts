import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { headers } from 'next/headers'
import { extractDeathCertificateData } from '@/lib/verification/document-ai'
import { calculateConfidenceScore } from '@/lib/verification/confidence'

// Rate limiting: Store in memory (in production, use Redis)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(ip)
  
  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }
  
  if (record.count >= RATE_LIMIT_MAX) {
    return false
  }
  
  record.count++
  return true
}

// POST /api/verification/death-claim - Submit new death verification claim
export async function POST(request: NextRequest) {
  try {
    // Get IP for rate limiting
    const headersList = await headers()
    const forwardedFor = headersList.get('x-forwarded-for')
    const ip = forwardedFor?.split(',')[0]?.trim() || 'unknown'
    const userAgent = headersList.get('user-agent') || 'unknown'
    
    // Rate limit check
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const formData = await request.formData()
    
    // Extract form fields
    const claimantName = formData.get('claimant_name') as string
    const claimantEmail = formData.get('claimant_email') as string
    const claimantPhone = formData.get('claimant_phone') as string | null
    const claimantRelationship = formData.get('claimant_relationship') as string
    const claimantRelationshipOther = formData.get('claimant_relationship_other') as string | null
    const deceasedName = formData.get('deceased_name') as string
    const deceasedDob = formData.get('deceased_dob') as string | null
    const deceasedDateOfDeath = formData.get('deceased_date_of_death') as string
    const documentType = formData.get('document_type') as string
    const obituaryUrl = formData.get('obituary_url') as string | null
    const claimedUserEmail = formData.get('claimed_user_email') as string | null
    const deathCertificate = formData.get('death_certificate') as File | null

    // Validation
    if (!claimantName || !claimantEmail || !claimantRelationship || 
        !deceasedName || !deceasedDateOfDeath || !documentType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(claimantEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate relationship
    const validRelationships = ['spouse', 'child', 'sibling', 'parent', 'executor', 'other']
    if (!validRelationships.includes(claimantRelationship)) {
      return NextResponse.json(
        { error: 'Invalid relationship type' },
        { status: 400 }
      )
    }

    // Validate document type
    const validDocTypes = ['death_certificate', 'obituary_link', 'both']
    if (!validDocTypes.includes(documentType)) {
      return NextResponse.json(
        { error: 'Invalid document type' },
        { status: 400 }
      )
    }

    // Require death certificate for death_certificate or both types
    if ((documentType === 'death_certificate' || documentType === 'both') && !deathCertificate) {
      return NextResponse.json(
        { error: 'Death certificate file is required' },
        { status: 400 }
      )
    }

    // Require obituary URL for obituary_link or both types
    if ((documentType === 'obituary_link' || documentType === 'both') && !obituaryUrl) {
      return NextResponse.json(
        { error: 'Obituary URL is required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()
    
    // Try to find the claimed user by email if provided
    let claimedUserId: string | null = null
    let profileData: any = null
    
    if (claimedUserEmail) {
      // Look up user by email
      const { data: authUser } = await supabase.auth.admin.listUsers()
      const foundUser = authUser?.users?.find(u => u.email === claimedUserEmail)
      
      if (foundUser) {
        claimedUserId = foundUser.id
        
        // Get profile data for confidence scoring
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, date_of_birth')
          .eq('id', foundUser.id)
          .single()
        
        profileData = profile
      }
    }

    // Upload death certificate if provided
    let documentUrl: string | null = null
    let aiExtractionData: any = {}
    let aiConfidenceScore: number | null = null
    
    if (deathCertificate) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(deathCertificate.type)) {
        return NextResponse.json(
          { error: 'Invalid file type. Allowed: PDF, JPEG, PNG, WebP' },
          { status: 400 }
        )
      }

      // Validate file size (10MB max)
      if (deathCertificate.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'File too large. Maximum size is 10MB' },
          { status: 400 }
        )
      }

      // Generate unique filename
      const fileExt = deathCertificate.name.split('.').pop()
      const timestamp = Date.now()
      const randomId = Math.random().toString(36).substring(2, 11)
      const fileName = `death-claims/${timestamp}-${randomId}.${fileExt}`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('verification-documents')
        .upload(fileName, deathCertificate, {
          contentType: deathCertificate.type,
          upsert: false
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        return NextResponse.json(
          { error: 'Failed to upload document' },
          { status: 500 }
        )
      }

      documentUrl = uploadData.path

      // Process document with AI to extract data
      try {
        const fileBuffer = Buffer.from(await deathCertificate.arrayBuffer())
        aiExtractionData = await extractDeathCertificateData(
          fileBuffer,
          deathCertificate.type
        )

        // Calculate confidence score if we have profile data
        if (profileData && aiExtractionData) {
          aiConfidenceScore = calculateConfidenceScore(
            {
              name: deceasedName,
              dob: deceasedDob,
              dateOfDeath: deceasedDateOfDeath,
            },
            profileData,
            aiExtractionData
          )
        }
      } catch (aiError) {
        console.error('AI extraction error:', aiError)
        // Continue without AI data - admin can review manually
        aiExtractionData = { error: 'AI extraction failed', manual_review_required: true }
      }
    }

    // Create the verification record
    const { data: verification, error: insertError } = await supabase
      .from('death_verifications')
      .insert({
        claimed_user_id: claimedUserId,
        claimant_name: claimantName,
        claimant_email: claimantEmail,
        claimant_phone: claimantPhone,
        claimant_relationship: claimantRelationship,
        claimant_relationship_other: claimantRelationshipOther,
        deceased_name: deceasedName,
        deceased_dob: deceasedDob || null,
        deceased_date_of_death: deceasedDateOfDeath,
        document_type: documentType,
        document_url: documentUrl,
        obituary_url: obituaryUrl,
        ai_confidence_score: aiConfidenceScore,
        ai_extraction_data: aiExtractionData,
        ai_processed_at: aiExtractionData ? new Date().toISOString() : null,
        status: 'pending',
        submission_ip: ip,
        submission_user_agent: userAgent,
      })
      .select('id, created_at, status')
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to submit verification request' },
        { status: 500 }
      )
    }

    // TODO: Send confirmation email to claimant
    // await sendVerificationSubmittedEmail(claimantEmail, claimantName, verification.id)

    return NextResponse.json({
      success: true,
      message: 'Death verification claim submitted successfully. Our team will review your request within 3-5 business days.',
      reference_id: verification.id,
    }, { status: 201 })

  } catch (error) {
    console.error('Death claim submission error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
