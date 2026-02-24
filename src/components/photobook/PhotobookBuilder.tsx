'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Save,
  ShoppingCart,
  Eye,
  Settings,
  Image as ImageIcon,
  MoreVertical,
  BookOpen,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'
import { PhotobookProject, PhotobookPage, PhotobookMemorySelection, LAYOUT_TEMPLATES } from './types'
import PageEditor from './PageEditor'
import LayoutTemplates from './LayoutTemplates'
import QRCodeGenerator from './QRCodeGenerator'
import MemorySelector from './MemorySelector'

interface PhotobookBuilderProps {
  project?: PhotobookProject
  userId: string
}

export default function PhotobookBuilder({ project, userId }: PhotobookBuilderProps) {
  const router = useRouter()
  const supabase = createClient()
  
  // State
  const [currentProject, setCurrentProject] = useState<PhotobookProject | null>(project || null)
  const [pages, setPages] = useState<PhotobookPage[]>([])
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null)
  const [selectedMemories, setSelectedMemories] = useState<PhotobookMemorySelection[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showMemorySelector, setShowMemorySelector] = useState(false)
  const [showLayoutSelector, setShowLayoutSelector] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [projectTitle, setProjectTitle] = useState(project?.title || 'Untitled Photobook')
  
  // Load project data
  useEffect(() => {
    if (project?.id) {
      loadPages()
      loadSelections()
    }
  }, [project?.id])
  
  const loadPages = async () => {
    if (!project?.id) return
    
    const { data, error } = await supabase
      .from('photobook_pages')
      .select('*')
      .eq('project_id', project.id)
      .order('page_number')
    
    if (error) {
      console.error('Failed to load pages:', error)
      return
    }
    
    setPages(data || [])
    if (data && data.length > 0 && !selectedPageId) {
      setSelectedPageId(data[0].id)
    }
  }
  
  const loadSelections = async () => {
    if (!project?.id) return
    
    const { data, error } = await supabase
      .from('photobook_memory_selections')
      .select(`
        *,
        memory:memory_id (
          id,
          title,
          description,
          memory_date,
          memory_media (
            id,
            file_url,
            file_type,
            is_cover
          )
        )
      `)
      .eq('project_id', project.id)
      .order('sort_order')
    
    if (error) {
      console.error('Failed to load selections:', error)
      return
    }
    
    setSelectedMemories(data || [])
  }
  
  // Create new project
  const createProject = async () => {
    setIsLoading(true)
    
    const { data, error } = await supabase
      .from('photobook_projects')
      .insert({
        user_id: userId,
        title: projectTitle,
        status: 'draft'
      })
      .select()
      .single()
    
    setIsLoading(false)
    
    if (error) {
      console.error('Failed to create project:', error)
      return
    }
    
    setCurrentProject(data)
    router.push(`/dashboard/photobooks/${data.id}`)
  }
  
  // Add a new page
  const addPage = async (layoutType: string = 'single') => {
    if (!currentProject?.id) return
    
    const nextPageNumber = pages.length + 1
    
    const { data, error } = await supabase
      .from('photobook_pages')
      .insert({
        project_id: currentProject.id,
        page_number: nextPageNumber,
        page_type: nextPageNumber === 1 ? 'cover' : 'content',
        layout_type: layoutType,
        content_json: {
          photos: [],
          text: { position: 'bottom' },
          background: { color: '#ffffff' }
        }
      })
      .select()
      .single()
    
    if (error) {
      console.error('Failed to add page:', error)
      return
    }
    
    setPages([...pages, data])
    setSelectedPageId(data.id)
    setShowLayoutSelector(false)
  }
  
  // Delete a page
  const deletePage = async (pageId: string) => {
    const { error } = await supabase
      .from('photobook_pages')
      .delete()
      .eq('id', pageId)
    
    if (error) {
      console.error('Failed to delete page:', error)
      return
    }
    
    const updatedPages = pages.filter(p => p.id !== pageId)
    setPages(updatedPages)
    
    if (selectedPageId === pageId) {
      setSelectedPageId(updatedPages[0]?.id || null)
    }
  }
  
  // Update page content
  const updatePage = async (pageId: string, updates: Partial<PhotobookPage>) => {
    const { error } = await supabase
      .from('photobook_pages')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', pageId)
    
    if (error) {
      console.error('Failed to update page:', error)
      return
    }
    
    setPages(pages.map(p => p.id === pageId ? { ...p, ...updates } : p))
  }
  
  // Save project
  const saveProject = async () => {
    if (!currentProject?.id) return
    
    setIsSaving(true)
    
    const { error } = await supabase
      .from('photobook_projects')
      .update({
        title: projectTitle,
        updated_at: new Date().toISOString()
      })
      .eq('id', currentProject.id)
    
    setIsSaving(false)
    
    if (error) {
      console.error('Failed to save project:', error)
    }
  }
  
  // Add memories to project
  const handleAddMemories = async (memoryIds: string[]) => {
    if (!currentProject?.id) return
    
    const newSelections = memoryIds.map((memoryId, index) => ({
      project_id: currentProject.id,
      memory_id: memoryId,
      sort_order: selectedMemories.length + index
    }))
    
    const { error } = await supabase
      .from('photobook_memory_selections')
      .insert(newSelections)
    
    if (error) {
      console.error('Failed to add memories:', error)
      return
    }
    
    await loadSelections()
    setShowMemorySelector(false)
  }
  
  // Get selected page
  const selectedPage = pages.find(p => p.id === selectedPageId)
  
  // If no project exists, show creation UI
  if (!currentProject) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Card className="bg-gray-800/50 border-white/10">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Create New Photobook
              </h1>
              <p className="text-white/60">
                Preserve your memories in a beautiful printed book with QR codes linking to digital content
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-white/80">Photobook Title</Label>
                <Input
                  id="title"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder="e.g., Summer Vacation 2024"
                  className="bg-gray-700/50 border-white/10 text-white mt-2"
                />
              </div>
              
              <Button
                onClick={createProject}
                disabled={isLoading || !projectTitle.trim()}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
                size="lg"
              >
                {isLoading ? 'Creating...' : 'Create Photobook'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="h-[calc(100vh-64px)] flex">
      {/* Left Sidebar - Pages */}
      <div className="w-64 bg-gray-900/50 border-r border-white/10 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-3">
            <Input
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              onBlur={saveProject}
              className="bg-transparent border-0 text-white font-semibold p-0 focus-visible:ring-0"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={saveProject}
              disabled={isSaving}
              className="text-white/60 hover:text-white"
            >
              <Save className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-white/40 text-xs">{pages.length} pages • {selectedMemories.length} memories</p>
        </div>
        
        {/* Page List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {pages.map((page, index) => (
            <div
              key={page.id}
              onClick={() => setSelectedPageId(page.id)}
              className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                selectedPageId === page.id
                  ? 'border-amber-500 ring-2 ring-amber-500/20'
                  : 'border-white/10 hover:border-white/30'
              }`}
            >
              {/* Page Thumbnail */}
              <div className="aspect-[4/5] bg-gray-800 flex items-center justify-center">
                {page.content_json.photos?.[0]?.file_url ? (
                  <img
                    src={page.content_json.photos[0].file_url}
                    alt={`Page ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-4">
                    <span className="text-white/40 text-2xl">{index + 1}</span>
                    <p className="text-white/30 text-xs mt-1 capitalize">{page.layout_type}</p>
                  </div>
                )}
              </div>
              
              {/* Page Number */}
              <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 rounded text-white text-xs">
                {index + 1}
              </div>
              
              {/* Actions */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 bg-black/60 hover:bg-black/80 text-white"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-gray-800 border-white/10">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        deletePage(page.id)
                      }}
                      className="text-red-400 focus:text-red-400 focus:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
          
          {/* Add Page Button */}
          <Dialog open={showLayoutSelector} onOpenChange={setShowLayoutSelector}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full h-24 border-dashed border-2 border-white/20 hover:border-amber-500/50 hover:bg-amber-500/5 text-white/60 hover:text-white"
              >
                <Plus className="w-6 h-6 mr-2" />
                Add Page
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-800 border-white/10 max-w-3xl">
              <DialogHeader>
                <DialogTitle className="text-white">Choose Layout</DialogTitle>
              </DialogHeader>
              <LayoutTemplates onSelect={addPage} />
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Bottom Actions */}
        <div className="p-4 border-t border-white/10 space-y-2">
          <Button
            variant="outline"
            className="w-full border-white/20 text-white hover:bg-white/10"
            onClick={() => setShowMemorySelector(true)}
          >
            <ImageIcon className="w-4 h-4 mr-2" />
            Add Memories ({selectedMemories.length})
          </Button>
          
          <Button
            variant="outline"
            className="w-full border-white/20 text-white hover:bg-white/10"
            onClick={() => setShowPreview(true)}
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          
          <Button
            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
            onClick={() => router.push(`/dashboard/photobooks/${currentProject.id}/order`)}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Order Book
          </Button>
        </div>
      </div>
      
      {/* Main Editor */}
      <div className="flex-1 bg-gray-900/30 overflow-auto">
        {selectedPage ? (
          <PageEditor
            page={selectedPage}
            availableMemories={selectedMemories}
            onUpdate={updatePage}
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-white/40">
              <BookOpen className="w-16 h-16 mx-auto mb-4" />
              <p>Select a page to edit or add a new one</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Memory Selector Dialog */}
      <Dialog open={showMemorySelector} onOpenChange={setShowMemorySelector}>
        <DialogContent className="bg-gray-800 border-white/10 max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-white">Select Memories</DialogTitle>
          </DialogHeader>
          <MemorySelector
            userId={userId}
            selectedIds={selectedMemories.map(s => s.memory_id)}
            onSelect={handleAddMemories}
            onClose={() => setShowMemorySelector(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
