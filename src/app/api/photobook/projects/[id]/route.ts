import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET /api/photobook/projects/[id] - Get project details with pages
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

  const { data: project, error } = await supabase
    .from('photobook_projects')
    .select(`
      *,
      photobook_pages (
        id,
        page_number,
        page_type,
        layout,
        content,
        background_color,
        background_image_url,
        created_at,
        updated_at
      )
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    console.error('Photobook project fetch error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Sort pages by page_number
  if (project.photobook_pages) {
    project.photobook_pages.sort((a: { page_number: number }, b: { page_number: number }) => 
      a.page_number - b.page_number
    )
  }

  return NextResponse.json({ project })
}

// PUT /api/photobook/projects/[id] - Update project
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

  // Verify ownership
  const { data: existing } = await supabase
    .from('photobook_projects')
    .select('id, status')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!existing) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  if (existing.status === 'ordered') {
    return NextResponse.json(
      { error: 'Cannot modify an ordered project' },
      { status: 400 }
    )
  }

  const body = await request.json()
  const {
    title,
    description,
    cover_image_url,
    status,
  } = body

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (title !== undefined) updates.title = title
  if (description !== undefined) updates.description = description
  if (cover_image_url !== undefined) updates.cover_image_url = cover_image_url
  if (status !== undefined && ['draft', 'complete'].includes(status)) {
    updates.status = status
  }

  const { data: project, error } = await supabase
    .from('photobook_projects')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Photobook project update error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ project })
}

// DELETE /api/photobook/projects/[id] - Delete project
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  const { id } = await context.params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify ownership and check status
  const { data: existing } = await supabase
    .from('photobook_projects')
    .select('id, status')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!existing) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  if (existing.status === 'ordered') {
    return NextResponse.json(
      { error: 'Cannot delete an ordered project' },
      { status: 400 }
    )
  }

  // Delete pages first (cascade should handle this, but being explicit)
  await supabase
    .from('photobook_pages')
    .delete()
    .eq('project_id', id)

  // Delete the project
  const { error } = await supabase
    .from('photobook_projects')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Photobook project delete error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
