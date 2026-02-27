import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStripeServer } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    const { projectId, productId, amount, shippingAddress } = body
    
    if (!projectId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Verify project belongs to user
    const { data: project, error: projectError } = await supabase
      .from('photobook_projects')
      .select('id, title, page_count')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()
    
    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }
    
    // Update project with shipping address
    await supabase
      .from('photobook_projects')
      .update({
        delivery_address: shippingAddress,
        estimated_price: amount / 100,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
    
    // Create Stripe checkout session
    const session = await getStripeServer().checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: project.title || 'Custom Photobook',
              description: `${project.page_count} page photobook with QR-linked memories`,
              images: ['https://yourstruly.love/photobook-preview.jpg'], // Placeholder
            },
            unit_amount: amount, // Already in cents
          },
          quantity: 1,
        },
      ],
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'GB', 'AU', 'DE', 'FR'],
      },
      metadata: {
        projectId,
        productId,
        userId: user.id,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/photobook/${projectId}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/photobook/create?step=checkout&projectId=${projectId}`,
    })
    
    return NextResponse.json({ url: session.url })
    
  } catch (error: unknown) {
    // Better error logging for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    
    console.error('Photobook checkout error:', {
      message: errorMessage,
      stack: errorStack,
      stripeKeySet: !!process.env.STRIPE_SECRET_KEY,
      appUrlSet: !!process.env.NEXT_PUBLIC_APP_URL,
    })
    
    // Return more specific error for Stripe issues
    if (errorMessage.includes('Invalid API Key') || errorMessage.includes('api_key')) {
      return NextResponse.json(
        { error: 'Payment configuration error. Please contact support.' },
        { status: 500 }
      )
    }
    
    if (errorMessage.includes('url')) {
      return NextResponse.json(
        { error: 'Redirect URL configuration error. Please contact support.' },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: errorMessage || 'Internal server error' },
      { status: 500 }
    )
  }
}
