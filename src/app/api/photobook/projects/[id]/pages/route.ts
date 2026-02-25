import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET /api/photobook/projects/[id]/pages - List pages
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  const { id } = await context.params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify project ownership
  const { data: project } = await supabase
    .from('photobook_projects')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  const { data: pages, error } = await supabase
    .from('photobook_pages')
    .select('*')
    .eq('project_id', id)
    .order('page_number', { ascending: true })

  if (error) {
    console.error('Photobook pages list error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ pages })
}

// POST /api/photobook/projects/[id]/pages - Add page
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  const { id } = await context.params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify project ownership and status
  const { data: project } = await supabase
    .from('photobook_projects')
    .select('id, status, page_count')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  if (project.status === 'ordered') {
    return NextResponse.json(
      { error: 'Cannot modify an ordered project' },
      { status: 400 }
    )
  }

  const body = await request.json()
  const {
    insert_after, // page_number to insert after (content pages only)
    layout = 'single_photo',
    content,
    background_color,
    background_image_url,
  } = body

  // Get current pages to determine new page number
  const { data: existingPages } = await supabase
    .from('photobook_pages')
    .select('page_number, page_type')
    .eq('project_id', id)
    .order('page_number', { ascending: true })

  if (!existingPages) {
    return NextResponse.json({ error: 'Failed to fetch pages' }, { status: 500 })
  }

  // Find the back cover to insert before it
  const backCover = existingPages.find(p => p.page_type === 'back_cover')
  const contentPages = existingPages.filter(p => p.page_type === 'content')
  
  let newPageNumber: number
  
  if (insert_after !== undefined) {
    // Insert after specific page
    newPageNumber = insert_after + 1
  } else {
    // Insert at end (before back cover)
    newPageNumber = backCover ? backCover.page_number : contentPages.length + 1
  }

  // Shift subsequent pages
  const pagesToShift = existingPages.filter(p => p.page_number >= newPageNumber)
  for (const page of pagesToShift) {
    await supabase
      .from('photobook_pages')
      .update({ page_number: page.page_number + 1 })
      .eq('project_id', id)
      .eq('page_number', page.page_number)
  }

  // Insert new page
  const { data: newPage, error } = await supabase
    .from('photobook_pages')
    .insert({
      project_id: id,
      page_number: newPageNumber,
      page_type: 'content',
      layout,
      content,
      background_color,
      background_image_url,
    })
    .select()
    .single()

  if (error) {
    console.error('Photobook page creation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Update project page count
  await supabase
    .from('photobook_projects')
    .update({ 
      page_count: contentPages.length + 1,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  return NextResponse.json({ page: newPage }, { status: 201 })
}

// PUT /api/photobook/projects/[id]/pages - Reorder pages (bulk update)
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  const { id } = await context.params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify project ownership
  const { data: project } = await supabase
    .from('photobook_projects')
    .select('id, status')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  if (project.status === 'ordered') {
    return NextResponse.json(
      { error: 'Cannot modify an ordered project' },
      { status: 400 }
    )
  }

  const body = await request.json()
  const { page_order } = body // Array of { id, page_number }

  if (!Array.isArray(page_order)) {
    return NextResponse.json(
      { error: 'page_order must be an array of { id, page_number }' },
      { status: 400 }
    )
  }

  // Verify all pages belong to this project
  const pageIds = page_order.map(p => p.id)
  const { data: existingPages } = await supabase
    .from('photobook_pages')
    .select('id, page_type')
    .eq('project_id', id)
    .in('id', pageIds)

  if (!existingPages || existingPages.length !== pageIds.length) {
    return NextResponse.json(
      { error: 'Some pages do not belong to this project' },
      { status: 400 }
    )
  }

  // Don't allow reordering cover pages
  const coverPageIds = existingPages
    .filter(p => p.page_type === 'front_cover' || p.page_type === 'back_cover')
    .map(p => p.id)
  
  const reorderingCovers = page_order.some(p => coverPageIds.includes(p.id))
  if (reorderingCovers) {
    return NextResponse.json(
      { error: 'Cover pages cannot be reordered' },
      { status: 400 }
    )
  }

  // Use temporary page numbers to avoid conflicts
  const tempOffset = 10000
  
  // First, set all to temporary numbers
  for (const pageUpdate of page_order) {
    await supabase
      .from('photobook_pages')
      .update({ page_number: pageUpdate.page_number + tempOffset })
      .eq('id', pageUpdate.id)
  }

  // Then set to final numbers
  for (const pageUpdate of page_order) {
    await supabase
      .from('photobook_pages')
      .update({ page_number: pageUpdate.page_number })
      .eq('id', pageUpdate.id)
  }

  // Update project timestamp
  await supabase
    .from('photobook_projects')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', id)

  return NextResponse.json({ success: true })
}
