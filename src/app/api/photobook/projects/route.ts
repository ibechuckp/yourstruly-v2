import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/photobook/projects - List user's photobook projects
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = parseInt(searchParams.get('offset') || '0')
  const status = searchParams.get('status') // draft, complete, ordered

  let query = supabase
    .from('photobook_projects')
    .select(`
      id,
      title,
      description,
      cover_image_url,
      product_sku,
      product_name,
      page_count,
      status,
      created_at,
      updated_at
    `)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    console.error('Photobook projects list error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ projects: data })
}

// POST /api/photobook/projects - Create new project
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const {
    title,
    description,
    product_sku,
    product_name,
    cover_type, // hardcover, softcover
    size, // e.g., '8x8', '8x10', '10x10'
    page_count = 20, // default minimum pages
  } = body

  if (!title || !product_sku) {
    return NextResponse.json(
      { error: 'Title and product SKU are required' },
      { status: 400 }
    )
  }

  // Create the project
  const { data: project, error: projectError } = await supabase
    .from('photobook_projects')
    .insert({
      user_id: user.id,
      title,
      description,
      product_sku,
      product_name,
      cover_type,
      size,
      page_count,
      status: 'draft',
    })
    .select()
    .single()

  if (projectError) {
    console.error('Photobook project creation error:', projectError)
    return NextResponse.json({ error: projectError.message }, { status: 500 })
  }

  // Create initial pages (front cover, back cover, and content pages)
  const initialPages = [
    { project_id: project.id, page_number: 0, page_type: 'front_cover', layout: 'cover' },
    ...Array.from({ length: page_count }, (_, i) => ({
      project_id: project.id,
      page_number: i + 1,
      page_type: 'content',
      layout: 'single_photo', // default layout
    })),
    { project_id: project.id, page_number: page_count + 1, page_type: 'back_cover', layout: 'cover' },
  ]

  const { error: pagesError } = await supabase
    .from('photobook_pages')
    .insert(initialPages)

  if (pagesError) {
    console.error('Photobook pages creation error:', pagesError)
    // Clean up the project if pages failed
    await supabase.from('photobook_projects').delete().eq('id', project.id)
    return NextResponse.json({ error: 'Failed to create project pages' }, { status: 500 })
  }

  return NextResponse.json({ project }, { status: 201 })
}
