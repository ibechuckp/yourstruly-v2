import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/circles - List user's circles (where they're a member)
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = parseInt(searchParams.get('offset') || '0')

  const { data: circles, error } = await supabase
    .from('circle_members')
    .select(`
      role,
      joined_at,
      circle:circles (
        id,
        name,
        description,
        created_by,
        is_private,
        created_at,
        updated_at
      )
    `)
    .eq('user_id', user.id)
    .eq('invite_status', 'accepted')
    .order('joined_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('List circles error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Flatten the response (circle is an array from Supabase join)
  const flatCircles = circles?.map(cm => {
    const circle = Array.isArray(cm.circle) ? cm.circle[0] : cm.circle
    return {
      ...circle,
      my_role: cm.role,
      joined_at: cm.joined_at
    }
  }).filter(c => c?.id) || []

  return NextResponse.json({ circles: flatCircles })
}

// POST /api/circles - Create new circle (user becomes owner)
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { name, description, is_private = true } = body

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  if (name.length > 100) {
    return NextResponse.json({ error: 'Name must be 100 characters or less' }, { status: 400 })
  }

  const { data: circle, error } = await supabase
    .from('circles')
    .insert({
      name: name.trim(),
      description: description?.trim() || null,
      created_by: user.id,
      is_private
    })
    .select()
    .single()

  if (error) {
    console.error('Create circle error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Explicitly create owner membership (trigger may fail due to RLS)
  const { error: memberError } = await supabase
    .from('circle_members')
    .insert({
      circle_id: circle.id,
      user_id: user.id,
      role: 'owner',
      invited_by: user.id,
      invite_status: 'accepted',
      joined_at: new Date().toISOString()
    })

  if (memberError) {
    console.error('Create owner membership error:', memberError)
    // Don't fail circle creation, but log the error
    // The trigger might have created it, or we have a real issue
  }

  return NextResponse.json({ 
    circle: {
      ...circle,
      my_role: 'owner'
    }
  }, { status: 201 })
}
