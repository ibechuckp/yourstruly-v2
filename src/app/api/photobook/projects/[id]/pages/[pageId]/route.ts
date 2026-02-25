import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface RouteContext {
  params: Promise<{ id: string; pageId: string }>
}

// PUT /api/photobook/projects/[id]/pages/[pageId] - Update page content/layout
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  const { id, pageId } = await context.params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify project ownership and status
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

  // Verify page exists and belongs to project
  const { data: existingPage } = await supabase
    .from('photobook_pages')
    .select('id, page_type')
    .eq('id', pageId)
    .eq('project_id', id)
    .single()

  if (!existingPage) {
    return NextResponse.json({ error: 'Page not found' }, { status: 404 })
  }

  const body = await request.json()
  const {
    layout,
    content, // JSON object with photo positions, text, etc.
    background_color,
    background_image_url,
  } = body

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  
  // Allow layout changes for content pages only
  if (layout !== undefined) {
    if (existingPage.page_type !== 'content' && layout !== 'cover') {
      return NextResponse.json(
        { error: 'Cover pages can only use cover layout' },
        { status: 400 }
      )
    }
    updates.layout = layout
  }
  
  if (content !== undefined) updates.content = content
  if (background_color !== undefined) updates.background_color = background_color
  if (background_image_url !== undefined) updates.background_image_url = background_image_url

  const { data: page, error } = await supabase
    .from('photobook_pages')
    .update(updates)
    .eq('id', pageId)
    .select()
    .single()

  if (error) {
    console.error('Photobook page update error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Update project timestamp
  await supabase
    .from('photobook_projects')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', id)

  return NextResponse.json({ page })
}

// DELETE /api/photobook/projects/[id]/pages/[pageId] - Remove page
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  const { id, pageId } = await context.params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify project ownership and status
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

  // Verify page exists and get its info
  const { data: pageToDelete } = await supabase
    .from('photobook_pages')
    .select('id, page_number, page_type')
    .eq('id', pageId)
    .eq('project_id', id)
    .single()

  if (!pageToDelete) {
    return NextResponse.json({ error: 'Page not found' }, { status: 404 })
  }

  // Don't allow deleting cover pages
  if (pageToDelete.page_type === 'front_cover' || pageToDelete.page_type === 'back_cover') {
    return NextResponse.json(
      { error: 'Cover pages cannot be deleted' },
      { status: 400 }
    )
  }

  // Get count of content pages
  const { count } = await supabase
    .from('photobook_pages')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', id)
    .eq('page_type', 'content')

  // Enforce minimum page count (e.g., 10 pages minimum for most photobooks)
  const MIN_PAGES = 10
  if (count && count <= MIN_PAGES) {
    return NextResponse.json(
      { error: `Cannot delete page. Minimum ${MIN_PAGES} pages required.` },
      { status: 400 }
    )
  }

  // Delete the page
  const { error: deleteError } = await supabase
    .from('photobook_pages')
    .delete()
    .eq('id', pageId)

  if (deleteError) {
    console.error('Photobook page delete error:', deleteError)
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  // Renumber subsequent pages
  const { data: subsequentPages } = await supabase
    .from('photobook_pages')
    .select('id, page_number')
    .eq('project_id', id)
    .gt('page_number', pageToDelete.page_number)
    .order('page_number', { ascending: true })

  if (subsequentPages) {
    for (const page of subsequentPages) {
      await supabase
        .from('photobook_pages')
        .update({ page_number: page.page_number - 1 })
        .eq('id', page.id)
    }
  }

  // Update project page count and timestamp
  await supabase
    .from('photobook_projects')
    .update({ 
      page_count: (count || MIN_PAGES) - 1,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  return NextResponse.json({ success: true })
}
