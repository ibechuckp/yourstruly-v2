'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import GlassCard from '@/components/ui/GlassCard'
import { 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  BookOpen, 
  Image as ImageIcon, 
  Layout, 
  Eye, 
  CreditCard,
  Plus,
  Trash2,
  QrCode,
  Wand2,
  GripVertical,
  X,
  ArrowLeft,
  Loader2,
  Package,
  Sparkles
} from 'lucide-react'
import { 
  LAYOUT_TEMPLATES, 
  TEMPLATES_BY_CATEGORY, 
  getTemplateById,
  LayoutTemplate 
} from '@/lib/photobook/templates'
import { PRODIGI_PHOTOBOOK_SKUS } from '@/components/photobook/types'

// ============================================================================
// TYPES
// ============================================================================

interface Product {
  id: string
  name: string
  description: string
  size: string
  basePrice: number
  pricePerPage: number
  minPages: number
  maxPages: number
  binding: 'hardcover' | 'softcover' | 'layflat'
  icon: React.ReactNode
  features: string[]
}

interface Memory {
  id: string
  title: string
  description?: string
  memory_date?: string
  created_at: string
  memory_media: {
    id: string
    file_url: string
    file_type: string
    is_cover: boolean
  }[]
}

interface PageData {
  id: string
  pageNumber: number
  layoutId: string
  slots: {
    slotId: string
    type: 'photo' | 'text' | 'qr'
    memoryId?: string
    mediaId?: string
    fileUrl?: string
    text?: string
    qrMemoryId?: string
  }[]
}

interface ShippingAddress {
  name: string
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country: string
}

// ============================================================================
// PRODUCTS
// ============================================================================

const PRODUCTS: Product[] = [
  {
    id: '8x8_hardcover',
    name: '8×8" Hardcover',
    description: 'Classic square format, perfect for family albums',
    size: '8×8"',
    basePrice: 24.99,
    pricePerPage: 0.50,
    minPages: 20,
    maxPages: 100,
    binding: 'hardcover',
    icon: <BookOpen className="w-8 h-8" />,
    features: ['Lay-flat pages', 'Premium matte paper', 'Dust jacket included']
  },
  {
    id: '10x10_hardcover',
    name: '10×10" Hardcover',
    description: 'Large format for stunning photo displays',
    size: '10×10"',
    basePrice: 34.99,
    pricePerPage: 0.75,
    minPages: 20,
    maxPages: 100,
    binding: 'hardcover',
    icon: <BookOpen className="w-8 h-8" />,
    features: ['Lay-flat pages', 'Premium matte paper', 'Padded cover']
  },
  {
    id: '11x8_landscape',
    name: '11×8" Landscape',
    description: 'Wide format ideal for panoramic shots',
    size: '11×8"',
    basePrice: 29.99,
    pricePerPage: 0.60,
    minPages: 20,
    maxPages: 80,
    binding: 'hardcover',
    icon: <BookOpen className="w-8 h-8" />,
    features: ['Landscape orientation', 'Premium glossy paper', 'Presentation box']
  },
  {
    id: '8x8_softcover',
    name: '8×8" Softcover',
    description: 'Affordable option with professional quality',
    size: '8×8"',
    basePrice: 14.99,
    pricePerPage: 0.35,
    minPages: 20,
    maxPages: 60,
    binding: 'softcover',
    icon: <Package className="w-8 h-8" />,
    features: ['Flexible cover', 'Standard matte paper', 'Quick production']
  },
  {
    id: '12x12_layflat',
    name: '12×12" Layflat Premium',
    description: 'Our finest photobook with seamless spreads',
    size: '12×12"',
    basePrice: 54.99,
    pricePerPage: 1.25,
    minPages: 20,
    maxPages: 50,
    binding: 'layflat',
    icon: <Sparkles className="w-8 h-8" />,
    features: ['180° lay-flat binding', 'Archival quality', 'Gift box packaging']
  },
  {
    id: 'calendar_wall',
    name: 'Wall Calendar',
    description: '12-month custom photo calendar',
    size: '11×8.5"',
    basePrice: 19.99,
    pricePerPage: 0,
    minPages: 13,
    maxPages: 13,
    binding: 'softcover',
    icon: <Layout className="w-8 h-8" />,
    features: ['Wire-O binding', 'Hanging hook', 'US holidays included']
  }
]

// ============================================================================
// STEP COMPONENTS
// ============================================================================

// Step 1: Choose Product
function ProductStep({ 
  selectedProduct, 
  onSelect 
}: { 
  selectedProduct: Product | null
  onSelect: (product: Product) => void 
}) {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-[#406A56] mb-2">Choose Your Product</h2>
        <p className="text-[#406A56]/60">Select the perfect format for your memories</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {PRODUCTS.map((product) => {
          const isSelected = selectedProduct?.id === product.id
          const displayPrice = (product.basePrice * 1.3).toFixed(2) // 30% markup
          
          return (
            <motion.div
              key={product.id}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
            >
              <GlassCard
                variant="warm"
                padding="none"
                hover
                onClick={() => onSelect(product)}
                className={`cursor-pointer overflow-hidden transition-all ${
                  isSelected 
                    ? 'ring-2 ring-[#406A56] ring-offset-2 ring-offset-[#E8E4D6]' 
                    : ''
                }`}
              >
                {/* Product Icon Header */}
                <div className={`p-6 ${
                  isSelected 
                    ? 'bg-gradient-to-br from-[#406A56] to-[#4a7a64]' 
                    : 'bg-gradient-to-br from-[#406A56]/10 to-[#406A56]/5'
                }`}>
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-white text-[#406A56]'
                  }`}>
                    {product.icon}
                  </div>
                </div>
                
                {/* Product Details */}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-[#406A56]">{product.name}</h3>
                      <p className="text-sm text-[#406A56]/60">{product.size}</p>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-[#406A56] flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                  
                  <p className="text-sm text-[#406A56]/70 mb-4">{product.description}</p>
                  
                  {/* Features */}
                  <ul className="space-y-1 mb-4">
                    {product.features.map((feature, i) => (
                      <li key={i} className="text-xs text-[#406A56]/60 flex items-center gap-2">
                        <Check className="w-3 h-3 text-[#406A56]/40" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  {/* Price */}
                  <div className="pt-4 border-t border-[#406A56]/10">
                    <div className="flex items-baseline justify-between">
                      <span className="text-2xl font-bold text-[#406A56]">${displayPrice}</span>
                      <span className="text-xs text-[#406A56]/50">
                        {product.minPages}-{product.maxPages} pages
                      </span>
                    </div>
                    {product.pricePerPage > 0 && (
                      <p className="text-xs text-[#406A56]/50 mt-1">
                        +${(product.pricePerPage * 1.3).toFixed(2)}/additional page
                      </p>
                    )}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

// Step 2: Select Content (Memory Selector)
function ContentStep({
  memories,
  selectedMemoryIds,
  onToggle,
  minPages,
  maxPages,
  isLoading
}: {
  memories: Memory[]
  selectedMemoryIds: Set<string>
  onToggle: (memoryId: string) => void
  minPages: number
  maxPages: number
  isLoading: boolean
}) {
  const selectedCount = selectedMemoryIds.size
  const minRequired = Math.ceil(minPages / 2) // Rough estimate: 2 photos per page
  const maxAllowed = maxPages * 4 // Max 4 photos per page
  
  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-[#406A56] mb-2">Select Your Memories</h2>
        <p className="text-[#406A56]/60">Choose the photos and memories to include in your book</p>
      </div>
      
      {/* Selection Status Bar */}
      <GlassCard variant="warm" padding="md" className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`px-4 py-2 rounded-xl font-medium ${
              selectedCount >= minRequired 
                ? 'bg-green-100 text-green-700' 
                : 'bg-amber-100 text-amber-700'
            }`}>
              {selectedCount} selected
            </div>
            <div className="text-sm text-[#406A56]/60">
              {selectedCount < minRequired ? (
                <span>Select at least <strong>{minRequired - selectedCount}</strong> more</span>
              ) : selectedCount > maxAllowed ? (
                <span className="text-red-600">Too many selected (max {maxAllowed})</span>
              ) : (
                <span className="text-green-600">✓ Ready to continue</span>
              )}
            </div>
          </div>
          <div className="text-sm text-[#406A56]/50">
            Recommended: {minRequired}–{Math.ceil(maxPages / 2)} memories
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-4 h-2 bg-[#406A56]/10 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${
              selectedCount >= minRequired ? 'bg-green-500' : 'bg-amber-500'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((selectedCount / minRequired) * 100, 100)}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </GlassCard>
      
      {/* Memory Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#406A56]" />
        </div>
      ) : memories.length === 0 ? (
        <GlassCard variant="warm" padding="lg" className="text-center">
          <ImageIcon className="w-16 h-16 mx-auto text-[#406A56]/30 mb-4" />
          <h3 className="text-lg font-semibold text-[#406A56] mb-2">No Memories Yet</h3>
          <p className="text-[#406A56]/60 mb-4">Create some memories first to build your photobook</p>
          <button
            onClick={() => window.location.href = '/dashboard/memories'}
            className="px-4 py-2 bg-[#406A56] text-white rounded-xl hover:bg-[#4a7a64] transition-colors"
          >
            Go to Memories
          </button>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {memories.map((memory) => {
            const isSelected = selectedMemoryIds.has(memory.id)
            const coverMedia = memory.memory_media?.find(m => m.is_cover) || memory.memory_media?.[0]
            
            return (
              <motion.div
                key={memory.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onToggle(memory.id)}
                className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer ring-2 transition-all ${
                  isSelected 
                    ? 'ring-[#406A56] ring-offset-2' 
                    : 'ring-transparent hover:ring-[#406A56]/30'
                }`}
              >
                {coverMedia?.file_url ? (
                  <img
                    src={coverMedia.file_url}
                    alt={memory.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#406A56]/10 flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-[#406A56]/30" />
                  </div>
                )}
                
                {/* Overlay */}
                <div className={`absolute inset-0 transition-all ${
                  isSelected 
                    ? 'bg-[#406A56]/40' 
                    : 'bg-black/0 hover:bg-black/20'
                }`} />
                
                {/* Selection indicator */}
                <div className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                  isSelected 
                    ? 'bg-[#406A56] text-white' 
                    : 'bg-white/80 text-transparent'
                }`}>
                  <Check className="w-4 h-4" />
                </div>
                
                {/* Title */}
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                  <p className="text-white text-xs font-medium truncate">{memory.title}</p>
                  {memory.memory_date && (
                    <p className="text-white/70 text-xs">
                      {new Date(memory.memory_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
                
                {/* Photo count badge */}
                {memory.memory_media && memory.memory_media.length > 1 && (
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/50 rounded text-white text-xs">
                    {memory.memory_media.length} photos
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Step 3: Arrange Pages
function ArrangeStep({
  pages,
  setPages,
  selectedMemories,
  onAutoArrange
}: {
  pages: PageData[]
  setPages: (pages: PageData[]) => void
  selectedMemories: Memory[]
  onAutoArrange: () => void
}) {
  const [selectedPageId, setSelectedPageId] = useState<string | null>(pages[0]?.id || null)
  const [showLayoutPicker, setShowLayoutPicker] = useState(false)
  const [showQRPicker, setShowQRPicker] = useState(false)
  const [showPhotoPicker, setShowPhotoPicker] = useState(false)
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null)
  
  const selectedPage = pages.find(p => p.id === selectedPageId)
  const selectedTemplate = selectedPage ? getTemplateById(selectedPage.layoutId) : null
  
  // Get all available photos from selected memories
  const availablePhotos = useMemo(() => {
    const photos: { memoryId: string; mediaId: string; fileUrl: string; memoryTitle: string }[] = []
    selectedMemories.forEach(memory => {
      memory.memory_media?.forEach(media => {
        if (media.file_type?.startsWith('image')) {
          photos.push({
            memoryId: memory.id,
            mediaId: media.id,
            fileUrl: media.file_url,
            memoryTitle: memory.title
          })
        }
      })
    })
    return photos
  }, [selectedMemories])
  
  // Get photos already used on pages
  const usedMediaIds = useMemo(() => {
    const used = new Set<string>()
    pages.forEach(page => {
      page.slots.forEach(slot => {
        if (slot.mediaId) used.add(slot.mediaId)
      })
    })
    return used
  }, [pages])
  
  const addPage = (layoutId: string = 'full-photo') => {
    const newPage: PageData = {
      id: `page-${Date.now()}`,
      pageNumber: pages.length + 1,
      layoutId,
      slots: []
    }
    setPages([...pages, newPage])
    setSelectedPageId(newPage.id)
    setShowLayoutPicker(false)
  }
  
  const removePage = (pageId: string) => {
    const newPages = pages.filter(p => p.id !== pageId)
    // Renumber pages
    newPages.forEach((p, i) => p.pageNumber = i + 1)
    setPages(newPages)
    if (selectedPageId === pageId) {
      setSelectedPageId(newPages[0]?.id || null)
    }
  }
  
  const updatePageLayout = (pageId: string, layoutId: string) => {
    setPages(pages.map(p => 
      p.id === pageId ? { ...p, layoutId, slots: [] } : p
    ))
  }
  
  const assignPhotoToSlot = (pageId: string, slotId: string, photo: typeof availablePhotos[0] | null) => {
    setPages(pages.map(p => {
      if (p.id !== pageId) return p
      
      const existingSlotIndex = p.slots.findIndex(s => s.slotId === slotId)
      const newSlot = photo ? {
        slotId,
        type: 'photo' as const,
        memoryId: photo.memoryId,
        mediaId: photo.mediaId,
        fileUrl: photo.fileUrl
      } : null
      
      if (existingSlotIndex >= 0) {
        if (newSlot) {
          const newSlots = [...p.slots]
          newSlots[existingSlotIndex] = newSlot
          return { ...p, slots: newSlots }
        } else {
          return { ...p, slots: p.slots.filter((_, i) => i !== existingSlotIndex) }
        }
      } else if (newSlot) {
        return { ...p, slots: [...p.slots, newSlot] }
      }
      return p
    }))
  }
  
  const addQRToPage = (pageId: string, memoryId: string) => {
    setPages(pages.map(p => {
      if (p.id !== pageId) return p
      return {
        ...p,
        slots: [...p.slots.filter(s => s.type !== 'qr'), {
          slotId: 'qr-code',
          type: 'qr' as const,
          qrMemoryId: memoryId
        }]
      }
    }))
    setShowQRPicker(false)
  }
  
  return (
    <div className="flex gap-6 h-[calc(100vh-280px)] min-h-[600px]">
      {/* Left Sidebar - Page Thumbnails */}
      <div className="w-48 flex-shrink-0 bg-[#F2F1E5]/50 rounded-2xl p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[#406A56] text-sm">Pages</h3>
          <span className="text-xs text-[#406A56]/50">{pages.length}</span>
        </div>
        
        <Reorder.Group
          axis="y"
          values={pages}
          onReorder={(newPages) => {
            newPages.forEach((p, i) => p.pageNumber = i + 1)
            setPages(newPages)
          }}
          className="space-y-3"
        >
          {pages.map((page) => {
            const template = getTemplateById(page.layoutId)
            const firstPhoto = page.slots.find(s => s.type === 'photo')
            
            return (
              <Reorder.Item
                key={page.id}
                value={page}
                className={`group relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                  selectedPageId === page.id
                    ? 'border-[#406A56] ring-2 ring-[#406A56]/20'
                    : 'border-[#406A56]/10 hover:border-[#406A56]/30'
                }`}
                onClick={() => setSelectedPageId(page.id)}
              >
                <div className="aspect-square bg-white">
                  {firstPhoto?.fileUrl ? (
                    <img
                      src={firstPhoto.fileUrl}
                      alt={`Page ${page.pageNumber}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-[#406A56]/30">
                      <span className="text-2xl font-bold">{page.pageNumber}</span>
                      <span className="text-xs">{template?.name || 'Empty'}</span>
                    </div>
                  )}
                </div>
                
                {/* Drag handle */}
                <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical className="w-4 h-4 text-white drop-shadow-lg" />
                </div>
                
                {/* Page number */}
                <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-black/50 rounded text-white text-xs">
                  {page.pageNumber}
                </div>
                
                {/* Delete button */}
                <button
                  onClick={(e) => { e.stopPropagation(); removePage(page.id) }}
                  className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-red-500 rounded text-white hover:bg-red-600"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
                
                {/* QR indicator */}
                {page.slots.some(s => s.type === 'qr') && (
                  <div className="absolute bottom-1 left-1 p-1 bg-[#406A56] rounded">
                    <QrCode className="w-3 h-3 text-white" />
                  </div>
                )}
              </Reorder.Item>
            )
          })}
        </Reorder.Group>
        
        {/* Add Page Button */}
        <button
          onClick={() => setShowLayoutPicker(true)}
          className="w-full mt-4 aspect-square rounded-lg border-2 border-dashed border-[#406A56]/30 hover:border-[#406A56]/50 hover:bg-[#406A56]/5 flex flex-col items-center justify-center text-[#406A56]/50 hover:text-[#406A56] transition-all"
        >
          <Plus className="w-6 h-6" />
          <span className="text-xs mt-1">Add Page</span>
        </button>
        
        {/* Auto-Arrange Button */}
        <button
          onClick={onAutoArrange}
          className="w-full mt-3 py-2 rounded-lg bg-[#406A56]/10 hover:bg-[#406A56]/20 text-[#406A56] text-sm font-medium flex items-center justify-center gap-2 transition-colors"
        >
          <Wand2 className="w-4 h-4" />
          Auto-Arrange
        </button>
      </div>
      
      {/* Main Editor */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowLayoutPicker(true)}
              className="px-3 py-2 bg-[#406A56]/10 hover:bg-[#406A56]/20 rounded-lg text-[#406A56] text-sm font-medium flex items-center gap-2"
            >
              <Layout className="w-4 h-4" />
              Change Layout
            </button>
            <button
              onClick={() => setShowQRPicker(true)}
              className="px-3 py-2 bg-[#406A56]/10 hover:bg-[#406A56]/20 rounded-lg text-[#406A56] text-sm font-medium flex items-center gap-2"
            >
              <QrCode className="w-4 h-4" />
              Add QR Code
            </button>
          </div>
          <div className="text-sm text-[#406A56]/60">
            {availablePhotos.length - usedMediaIds.size} photos available
          </div>
        </div>
        
        {/* Page Canvas */}
        <div className="flex-1 bg-[#406A56]/5 rounded-2xl p-8 flex items-center justify-center">
          {selectedPage && selectedTemplate ? (
            <div 
              className="relative bg-white shadow-2xl"
              style={{ 
                width: '100%',
                maxWidth: 500,
                aspectRatio: '1/1'
              }}
            >
              {/* Render slots */}
              {selectedTemplate.slots.map((slot) => {
                const pageSlot = selectedPage.slots.find(s => s.slotId === slot.id)
                const style: React.CSSProperties = {
                  position: 'absolute',
                  left: `${slot.position.x}%`,
                  top: `${slot.position.y}%`,
                  width: `${slot.position.width}%`,
                  height: `${slot.position.height}%`,
                }
                
                if (slot.type === 'photo') {
                  return (
                    <div
                      key={slot.id}
                      style={style}
                      className="bg-[#f0f0f0] cursor-pointer hover:ring-2 hover:ring-[#406A56] transition-all overflow-hidden group"
                      onClick={() => {
                        // Open photo picker for this slot
                        setActiveSlotId(slot.id)
                        setShowPhotoPicker(true)
                      }}
                    >
                      {pageSlot?.fileUrl ? (
                        <>
                          <img
                            src={pageSlot.fileUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                          {/* Auto QR Code - bottom right corner */}
                          {pageSlot.memoryId && (
                            <div className="absolute bottom-2 right-2 bg-white p-1 rounded shadow-lg">
                              <QrCode className="w-8 h-8 text-[#406A56]" />
                            </div>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              assignPhotoToSlot(selectedPage.id, slot.id, null)
                            }}
                            className="absolute top-2 right-2 p-1 bg-red-500 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4 text-white" />
                          </button>
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-[#406A56]/40">
                          <Plus className="w-8 h-8" />
                          <span className="text-xs mt-1">Click to add</span>
                        </div>
                      )}
                    </div>
                  )
                }
                
                if (slot.type === 'text') {
                  return (
                    <div
                      key={slot.id}
                      style={style}
                      className="flex items-center justify-center p-2"
                    >
                      <textarea
                        placeholder={slot.placeholder || 'Add text...'}
                        className="w-full h-full resize-none bg-transparent text-center text-[#406A56] focus:outline-none"
                        style={{
                          fontSize: slot.style?.fontSize === 'xl' ? '1.5rem' : 
                                   slot.style?.fontSize === 'lg' ? '1.25rem' : 
                                   slot.style?.fontSize === '2xl' ? '2rem' : '1rem'
                        }}
                      />
                    </div>
                  )
                }
                
                if (slot.type === 'qr') {
                  const qrSlot = selectedPage.slots.find(s => s.type === 'qr')
                  return (
                    <div
                      key={slot.id}
                      style={style}
                      className="flex items-center justify-center bg-[#f0f0f0]"
                    >
                      {qrSlot ? (
                        <div className="text-center">
                          <QrCode className="w-16 h-16 text-[#406A56] mx-auto" />
                          <span className="text-xs text-[#406A56]/60 mt-2 block">QR Code</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowQRPicker(true)}
                          className="text-[#406A56]/40 hover:text-[#406A56]"
                        >
                          <QrCode className="w-12 h-12" />
                        </button>
                      )}
                    </div>
                  )
                }
                
                return null
              })}
            </div>
          ) : (
            <div className="text-center text-[#406A56]/40">
              <Layout className="w-16 h-16 mx-auto mb-4" />
              <p>Select a page to edit</p>
            </div>
          )}
        </div>
        
        {/* Available Photos Strip */}
        <div className="mt-4">
          <h4 className="text-sm font-medium text-[#406A56] mb-2">Available Photos</h4>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {availablePhotos.filter(p => !usedMediaIds.has(p.mediaId)).slice(0, 20).map((photo) => (
              <div
                key={photo.mediaId}
                className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-[#406A56] transition-all"
                draggable
                title={photo.memoryTitle}
              >
                <img
                  src={photo.fileUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
            {availablePhotos.filter(p => !usedMediaIds.has(p.mediaId)).length > 20 && (
              <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-[#406A56]/10 flex items-center justify-center text-[#406A56] text-xs">
                +{availablePhotos.filter(p => !usedMediaIds.has(p.mediaId)).length - 20}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Layout Picker Modal */}
      <AnimatePresence>
        {showLayoutPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowLayoutPicker(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#F2F1E5] rounded-2xl p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-[#406A56]">Choose Layout</h3>
                <button
                  onClick={() => setShowLayoutPicker(false)}
                  className="p-2 hover:bg-[#406A56]/10 rounded-lg"
                >
                  <X className="w-5 h-5 text-[#406A56]" />
                </button>
              </div>
              
              {Object.entries(TEMPLATES_BY_CATEGORY).map(([category, templates]) => (
                <div key={category} className="mb-6">
                  <h4 className="text-sm font-semibold text-[#406A56]/70 uppercase tracking-wide mb-3">
                    {category === 'single' ? 'Single Photo' : 
                     category === 'multi' ? 'Multiple Photos' : 'Special'}
                  </h4>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                    {templates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => {
                          if (selectedPage) {
                            updatePageLayout(selectedPage.id, template.id)
                          } else {
                            addPage(template.id)
                          }
                          setShowLayoutPicker(false)
                        }}
                        className="aspect-square bg-white rounded-xl p-3 hover:ring-2 hover:ring-[#406A56] transition-all group"
                      >
                        {/* Mini layout preview */}
                        <div className="w-full h-full relative bg-[#f5f5f5] rounded">
                          {template.slots.filter(s => s.type === 'photo').slice(0, 4).map((slot, i) => (
                            <div
                              key={i}
                              className="absolute bg-[#406A56]/20 rounded-sm"
                              style={{
                                left: `${slot.position.x}%`,
                                top: `${slot.position.y}%`,
                                width: `${slot.position.width}%`,
                                height: `${slot.position.height}%`,
                              }}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-[#406A56] mt-2 text-center group-hover:font-medium">
                          {template.name}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* QR Memory Picker Modal */}
      <AnimatePresence>
        {showQRPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowQRPicker(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#F2F1E5] rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-[#406A56]">Add QR Code</h3>
                  <p className="text-sm text-[#406A56]/60">Link to a memory's digital content</p>
                </div>
                <button
                  onClick={() => setShowQRPicker(false)}
                  className="p-2 hover:bg-[#406A56]/10 rounded-lg"
                >
                  <X className="w-5 h-5 text-[#406A56]" />
                </button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {selectedMemories.map((memory) => {
                  const coverMedia = memory.memory_media?.find(m => m.is_cover) || memory.memory_media?.[0]
                  
                  return (
                    <button
                      key={memory.id}
                      onClick={() => selectedPage && addQRToPage(selectedPage.id, memory.id)}
                      className="text-left bg-white rounded-xl overflow-hidden hover:ring-2 hover:ring-[#406A56] transition-all"
                    >
                      <div className="aspect-video bg-[#406A56]/10">
                        {coverMedia?.file_url ? (
                          <img
                            src={coverMedia.file_url}
                            alt={memory.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="w-8 h-8 text-[#406A56]/30" />
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="font-medium text-[#406A56] text-sm truncate">{memory.title}</p>
                        <p className="text-xs text-[#406A56]/50">
                          {memory.memory_media?.length || 0} photos
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Photo Picker Modal */}
      <AnimatePresence>
        {showPhotoPicker && activeSlotId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => { setShowPhotoPicker(false); setActiveSlotId(null) }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#F2F1E5] rounded-2xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-[#406A56]">Select Photo</h3>
                  <p className="text-sm text-[#406A56]/60">Choose a photo for this slot</p>
                </div>
                <button
                  onClick={() => { setShowPhotoPicker(false); setActiveSlotId(null) }}
                  className="p-2 hover:bg-[#406A56]/10 rounded-lg"
                >
                  <X className="w-5 h-5 text-[#406A56]" />
                </button>
              </div>
              
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {availablePhotos.map((photo) => {
                  const isUsed = usedMediaIds.has(photo.mediaId)
                  
                  return (
                    <button
                      key={photo.mediaId}
                      onClick={() => {
                        if (selectedPage && activeSlotId) {
                          assignPhotoToSlot(selectedPage.id, activeSlotId, photo)
                          setShowPhotoPicker(false)
                          setActiveSlotId(null)
                        }
                      }}
                      disabled={isUsed}
                      className={`relative aspect-square rounded-xl overflow-hidden transition-all ${
                        isUsed 
                          ? 'opacity-40 cursor-not-allowed' 
                          : 'hover:ring-2 hover:ring-[#406A56] cursor-pointer'
                      }`}
                    >
                      <img
                        src={photo.fileUrl}
                        alt={photo.memoryTitle}
                        className="w-full h-full object-cover"
                      />
                      {isUsed && (
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <Check className="w-8 h-8 text-white" />
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                        <p className="text-white text-xs truncate">{photo.memoryTitle}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
              
              {availablePhotos.length === 0 && (
                <div className="text-center py-12 text-[#406A56]/50">
                  <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No photos available</p>
                  <p className="text-sm">Select memories with photos in Step 2</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Step 4: Preview
function PreviewStep({
  pages,
  selectedMemories
}: {
  pages: PageData[]
  selectedMemories: Memory[]
}) {
  const [currentSpread, setCurrentSpread] = useState(0)
  const totalSpreads = Math.ceil(pages.length / 2)
  
  const leftPage = pages[currentSpread * 2]
  const rightPage = pages[currentSpread * 2 + 1]
  
  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-[#406A56] mb-2">Preview Your Book</h2>
        <p className="text-[#406A56]/60">
          Spread {currentSpread + 1} of {totalSpreads}
        </p>
      </div>
      
      {/* Book Preview */}
      <div className="relative">
        {/* Navigation */}
        <button
          onClick={() => setCurrentSpread(Math.max(0, currentSpread - 1))}
          disabled={currentSpread === 0}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 p-3 bg-[#406A56] text-white rounded-full disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#4a7a64] transition-colors z-10"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        
        <button
          onClick={() => setCurrentSpread(Math.min(totalSpreads - 1, currentSpread + 1))}
          disabled={currentSpread === totalSpreads - 1}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 p-3 bg-[#406A56] text-white rounded-full disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#4a7a64] transition-colors z-10"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
        
        {/* Book Spread */}
        <div className="flex justify-center gap-1 perspective-1000">
          {/* Left Page */}
          <motion.div
            key={`left-${currentSpread}`}
            initial={{ rotateY: -30, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            className="w-[300px] aspect-square bg-white shadow-xl rounded-l-sm"
          >
            {leftPage ? (
              <PagePreview page={leftPage} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#406A56]/30">
                <BookOpen className="w-12 h-12" />
              </div>
            )}
          </motion.div>
          
          {/* Spine */}
          <div className="w-2 bg-gradient-to-r from-[#406A56]/20 to-[#406A56]/10" />
          
          {/* Right Page */}
          <motion.div
            key={`right-${currentSpread}`}
            initial={{ rotateY: 30, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            className="w-[300px] aspect-square bg-white shadow-xl rounded-r-sm"
          >
            {rightPage ? (
              <PagePreview page={rightPage} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#406A56]/30">
                {pages.length % 2 === 1 ? (
                  <span className="text-sm">Back Cover</span>
                ) : (
                  <BookOpen className="w-12 h-12" />
                )}
              </div>
            )}
          </motion.div>
        </div>
        
        {/* Page indicators */}
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalSpreads }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSpread(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentSpread 
                  ? 'w-6 bg-[#406A56]' 
                  : 'bg-[#406A56]/30 hover:bg-[#406A56]/50'
              }`}
            />
          ))}
        </div>
      </div>
      
      {/* Page summary */}
      <GlassCard variant="warm" padding="md" className="mt-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BookOpen className="w-6 h-6 text-[#406A56]" />
            <div>
              <p className="font-medium text-[#406A56]">{pages.length} pages total</p>
              <p className="text-sm text-[#406A56]/60">
                {pages.filter(p => p.slots.some(s => s.type === 'qr')).length} pages with QR codes
              </p>
            </div>
          </div>
          <div className="text-sm text-[#406A56]/60">
            {selectedMemories.length} memories included
          </div>
        </div>
      </GlassCard>
    </div>
  )
}

// Generate QR code URL for a memory
const getQRCodeUrl = (memoryId: string) => {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://yourstruly.love'
  const viewUrl = `${baseUrl}/view/${memoryId}`
  return `https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent(viewUrl)}&format=png&margin=1`
}

// Page Preview Component
function PagePreview({ page }: { page: PageData }) {
  const template = getTemplateById(page.layoutId)
  
  if (!template) {
    return (
      <div className="w-full h-full flex items-center justify-center text-[#406A56]/30">
        <span className="text-sm">Unknown layout</span>
      </div>
    )
  }
  
  return (
    <div className="relative w-full h-full" style={{ background: template.background || '#ffffff' }}>
      {template.slots.map((slot) => {
        const pageSlot = page.slots.find(s => s.slotId === slot.id)
        const style: React.CSSProperties = {
          position: 'absolute',
          left: `${slot.position.x}%`,
          top: `${slot.position.y}%`,
          width: `${slot.position.width}%`,
          height: `${slot.position.height}%`,
        }
        
        if (slot.type === 'photo') {
          return (
            <div key={slot.id} style={style} className="overflow-hidden relative">
              {pageSlot?.fileUrl ? (
                <>
                  <img
                    src={pageSlot.fileUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  {/* Auto QR Code - bottom right corner of each photo */}
                  {pageSlot.memoryId && (
                    <div className="absolute bottom-1 right-1 bg-white p-0.5 rounded shadow-sm">
                      <img
                        src={getQRCodeUrl(pageSlot.memoryId)}
                        alt="QR"
                        className="w-6 h-6"
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-full bg-[#f0f0f0]" />
              )}
            </div>
          )
        }
        
        if (slot.type === 'qr') {
          const qrSlot = page.slots.find(s => s.type === 'qr')
          return (
            <div key={slot.id} style={style} className="flex items-center justify-center">
              {qrSlot?.qrMemoryId ? (
                <img
                  src={getQRCodeUrl(qrSlot.qrMemoryId)}
                  alt="QR Code"
                  className="w-16 h-16"
                />
              ) : (
                <QrCode className="w-12 h-12 text-[#406A56]/30" />
              )}
            </div>
          )
        }
        
        return null
      })}
    </div>
  )
}

// Step 5: Checkout
function CheckoutStep({
  product,
  pages,
  address,
  setAddress,
  onSubmit,
  isSubmitting
}: {
  product: Product
  pages: PageData[]
  address: ShippingAddress
  setAddress: (address: ShippingAddress) => void
  onSubmit: () => void
  isSubmitting: boolean
}) {
  // Calculate price with 30% markup
  const pageCount = pages.length
  const basePrice = product.basePrice
  const additionalPages = Math.max(0, pageCount - product.minPages)
  const additionalCost = additionalPages * product.pricePerPage
  const subtotal = basePrice + additionalCost
  const markup = subtotal * 0.3
  const total = subtotal + markup
  const shipping = 5.99
  const finalTotal = total + shipping
  
  const isAddressComplete = address.name && address.line1 && address.city && address.postalCode && address.country
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-[#406A56] mb-2">Complete Your Order</h2>
        <p className="text-[#406A56]/60">Enter your shipping details to receive your photobook</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Shipping Form */}
        <div className="lg:col-span-3">
          <GlassCard variant="warm" padding="lg">
            <h3 className="text-lg font-semibold text-[#406A56] mb-6">Shipping Address</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#406A56]/80 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={address.name}
                  onChange={(e) => setAddress({ ...address, name: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-[#406A56]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#406A56]/30 text-[#406A56]"
                  placeholder="John Doe"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#406A56]/80 mb-1">
                  Address Line 1 *
                </label>
                <input
                  type="text"
                  value={address.line1}
                  onChange={(e) => setAddress({ ...address, line1: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-[#406A56]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#406A56]/30 text-[#406A56]"
                  placeholder="123 Main Street"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#406A56]/80 mb-1">
                  Address Line 2
                </label>
                <input
                  type="text"
                  value={address.line2 || ''}
                  onChange={(e) => setAddress({ ...address, line2: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-[#406A56]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#406A56]/30 text-[#406A56]"
                  placeholder="Apt 4B (optional)"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#406A56]/80 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-[#406A56]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#406A56]/30 text-[#406A56]"
                    placeholder="New York"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#406A56]/80 mb-1">
                    State/Province
                  </label>
                  <input
                    type="text"
                    value={address.state}
                    onChange={(e) => setAddress({ ...address, state: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-[#406A56]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#406A56]/30 text-[#406A56]"
                    placeholder="NY"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#406A56]/80 mb-1">
                    Postal Code *
                  </label>
                  <input
                    type="text"
                    value={address.postalCode}
                    onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-[#406A56]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#406A56]/30 text-[#406A56]"
                    placeholder="10001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#406A56]/80 mb-1">
                    Country *
                  </label>
                  <select
                    value={address.country}
                    onChange={(e) => setAddress({ ...address, country: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-[#406A56]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#406A56]/30 text-[#406A56]"
                  >
                    <option value="">Select country</option>
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="GB">United Kingdom</option>
                    <option value="AU">Australia</option>
                    <option value="DE">Germany</option>
                    <option value="FR">France</option>
                  </select>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
        
        {/* Order Summary */}
        <div className="lg:col-span-2">
          <GlassCard variant="warm" padding="lg" className="sticky top-24">
            <h3 className="text-lg font-semibold text-[#406A56] mb-6">Order Summary</h3>
            
            <div className="space-y-4">
              {/* Product */}
              <div className="flex items-center gap-4 pb-4 border-b border-[#406A56]/10">
                <div className="w-16 h-16 rounded-xl bg-[#406A56]/10 flex items-center justify-center text-[#406A56]">
                  {product.icon}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-[#406A56]">{product.name}</p>
                  <p className="text-sm text-[#406A56]/60">{pageCount} pages</p>
                </div>
              </div>
              
              {/* Price breakdown */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-[#406A56]/70">
                  <span>Base price ({product.minPages} pages)</span>
                  <span>${(basePrice * 1.3).toFixed(2)}</span>
                </div>
                {additionalPages > 0 && (
                  <div className="flex justify-between text-[#406A56]/70">
                    <span>Additional pages ({additionalPages})</span>
                    <span>${(additionalCost * 1.3).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#406A56]/70">
                  <span>Shipping</span>
                  <span>${shipping.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-4 border-t border-[#406A56]/10 text-lg font-bold text-[#406A56]">
                  <span>Total</span>
                  <span>${finalTotal.toFixed(2)}</span>
                </div>
              </div>
              
              {/* Pay Button */}
              <button
                onClick={onSubmit}
                disabled={!isAddressComplete || isSubmitting}
                className="w-full py-4 bg-gradient-to-r from-[#406A56] to-[#4a7a64] text-white font-semibold rounded-xl hover:from-[#4a7a64] hover:to-[#5a8a74] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Pay ${finalTotal.toFixed(2)}
                  </>
                )}
              </button>
              
              <p className="text-xs text-center text-[#406A56]/50 mt-4">
                Secure payment powered by Stripe
              </p>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

const STEPS = [
  { id: 'product', label: 'Choose Product', icon: BookOpen },
  { id: 'content', label: 'Select Content', icon: ImageIcon },
  { id: 'arrange', label: 'Arrange Pages', icon: Layout },
  { id: 'preview', label: 'Preview', icon: Eye },
  { id: 'checkout', label: 'Checkout', icon: CreditCard },
]

export default function CreatePhotobookPage() {
  const router = useRouter()
  const supabase = createClient()
  
  // Step state
  const [currentStep, setCurrentStep] = useState(0)
  
  // Data state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [memories, setMemories] = useState<Memory[]>([])
  const [selectedMemoryIds, setSelectedMemoryIds] = useState<Set<string>>(new Set())
  const [pages, setPages] = useState<PageData[]>([])
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    name: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US'
  })
  
  // UI state
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [projectId, setProjectId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  
  // Load user and memories
  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUserId(user.id)
      
      // Load memories with media
      const { data: memoriesData } = await supabase
        .from('memories')
        .select(`
          id,
          title,
          description,
          memory_date,
          created_at,
          memory_media (
            id,
            file_url,
            file_type,
            is_cover
          )
        `)
        .eq('user_id', user.id)
        .order('memory_date', { ascending: false })
      
      setMemories(memoriesData || [])
      setIsLoading(false)
    }
    
    loadData()
  }, [])
  
  // Get selected memories
  const selectedMemories = useMemo(() => 
    memories.filter(m => selectedMemoryIds.has(m.id)),
    [memories, selectedMemoryIds]
  )
  
  // Toggle memory selection
  const toggleMemory = useCallback((memoryId: string) => {
    setSelectedMemoryIds(prev => {
      const next = new Set(prev)
      if (next.has(memoryId)) {
        next.delete(memoryId)
      } else {
        next.add(memoryId)
      }
      return next
    })
  }, [])
  
  // Auto-arrange pages
  const autoArrange = useCallback(() => {
    if (!selectedProduct) return
    
    // Get all photos from selected memories
    const allPhotos: { memoryId: string; mediaId: string; fileUrl: string }[] = []
    selectedMemories.forEach(memory => {
      memory.memory_media?.forEach(media => {
        if (media.file_type?.startsWith('image')) {
          allPhotos.push({
            memoryId: memory.id,
            mediaId: media.id,
            fileUrl: media.file_url
          })
        }
      })
    })
    
    // Create pages with photos
    const newPages: PageData[] = []
    let photoIndex = 0
    
    // Title page
    newPages.push({
      id: `page-${Date.now()}-0`,
      pageNumber: 1,
      layoutId: 'title-page',
      slots: allPhotos[0] ? [{
        slotId: 'photo-1',
        type: 'photo',
        memoryId: allPhotos[0].memoryId,
        mediaId: allPhotos[0].mediaId,
        fileUrl: allPhotos[0].fileUrl
      }] : []
    })
    photoIndex++
    
    // Content pages
    while (photoIndex < allPhotos.length && newPages.length < selectedProduct.maxPages) {
      const remainingPhotos = allPhotos.length - photoIndex
      
      let layoutId = 'full-photo'
      let photosForPage = 1
      
      if (remainingPhotos >= 4 && Math.random() > 0.7) {
        layoutId = 'grid-4'
        photosForPage = 4
      } else if (remainingPhotos >= 3 && Math.random() > 0.6) {
        layoutId = 'feature-2-small'
        photosForPage = 3
      } else if (remainingPhotos >= 2 && Math.random() > 0.5) {
        layoutId = 'two-horizontal'
        photosForPage = 2
      }
      
      const pageSlots: PageData['slots'] = []
      for (let i = 0; i < photosForPage && photoIndex < allPhotos.length; i++) {
        pageSlots.push({
          slotId: `photo-${i + 1}`,
          type: 'photo',
          memoryId: allPhotos[photoIndex].memoryId,
          mediaId: allPhotos[photoIndex].mediaId,
          fileUrl: allPhotos[photoIndex].fileUrl
        })
        photoIndex++
      }
      
      newPages.push({
        id: `page-${Date.now()}-${newPages.length}`,
        pageNumber: newPages.length + 1,
        layoutId,
        slots: pageSlots
      })
    }
    
    // Add QR page at the end if we have memories
    if (selectedMemories.length > 0) {
      newPages.push({
        id: `page-${Date.now()}-qr`,
        pageNumber: newPages.length + 1,
        layoutId: 'qr-page',
        slots: [{
          slotId: 'qr-code',
          type: 'qr',
          qrMemoryId: selectedMemories[0].id
        }]
      })
    }
    
    setPages(newPages)
  }, [selectedProduct, selectedMemories])
  
  // Save project to database
  const saveProject = useCallback(async () => {
    if (!userId || !selectedProduct) return null
    
    try {
      // Create or update project
      const projectData = {
        user_id: userId,
        title: `${selectedProduct.name} - ${new Date().toLocaleDateString()}`,
        status: 'draft',
        page_count: pages.length,
        print_config: {
          size: selectedProduct.size,
          binding: selectedProduct.binding,
          copies: 1
        },
        delivery_address: shippingAddress,
        estimated_price: calculateTotal()
      }
      
      let project
      if (projectId) {
        const { data, error } = await supabase
          .from('photobook_projects')
          .update(projectData)
          .eq('id', projectId)
          .select()
          .single()
        if (error) throw error
        project = data
      } else {
        const { data, error } = await supabase
          .from('photobook_projects')
          .insert(projectData)
          .select()
          .single()
        if (error) throw error
        project = data
        setProjectId(project.id)
      }
      
      // Save pages
      if (project) {
        // Delete existing pages
        await supabase
          .from('photobook_pages')
          .delete()
          .eq('project_id', project.id)
        
        // Insert new pages
        const pageInserts = pages.map((page, i) => ({
          project_id: project.id,
          page_number: i + 1,
          page_type: i === 0 ? 'cover' : 'content',
          layout_type: page.layoutId.split('-')[0] || 'single',
          content_json: {
            photos: page.slots.filter(s => s.type === 'photo').map(s => ({
              memory_id: s.memoryId,
              media_id: s.mediaId,
              file_url: s.fileUrl
            })),
            qr_code: page.slots.find(s => s.type === 'qr') ? {
              memory_id: page.slots.find(s => s.type === 'qr')?.qrMemoryId
            } : undefined
          }
        }))
        
        if (pageInserts.length > 0) {
          await supabase.from('photobook_pages').insert(pageInserts)
        }
        
        // Save memory selections
        await supabase
          .from('photobook_memory_selections')
          .delete()
          .eq('project_id', project.id)
        
        const selectionInserts = Array.from(selectedMemoryIds).map((memoryId, i) => ({
          project_id: project.id,
          memory_id: memoryId,
          sort_order: i
        }))
        
        if (selectionInserts.length > 0) {
          await supabase.from('photobook_memory_selections').insert(selectionInserts)
        }
      }
      
      return project
    } catch (error) {
      console.error('Error saving project:', error)
      return null
    }
  }, [userId, selectedProduct, pages, shippingAddress, projectId, selectedMemoryIds])
  
  // Calculate total price
  const calculateTotal = () => {
    if (!selectedProduct) return 0
    const pageCount = pages.length
    const basePrice = selectedProduct.basePrice
    const additionalPages = Math.max(0, pageCount - selectedProduct.minPages)
    const additionalCost = additionalPages * selectedProduct.pricePerPage
    const subtotal = basePrice + additionalCost
    const markup = subtotal * 0.3
    const shipping = 5.99
    return subtotal + markup + shipping
  }
  
  // Handle checkout
  const handleCheckout = async () => {
    setIsSubmitting(true)
    
    try {
      // Save project first
      const project = await saveProject()
      if (!project) throw new Error('Failed to save project')
      
      // Create Stripe checkout session
      const response = await fetch('/api/photobook/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          productId: selectedProduct?.id,
          amount: Math.round(calculateTotal() * 100), // cents
          shippingAddress
        })
      })
      
      if (!response.ok) throw new Error('Checkout failed')
      
      const { url } = await response.json()
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Checkout failed. Please try again.')
    }
    
    setIsSubmitting(false)
  }
  
  // Step validation
  const canProceed = () => {
    switch (currentStep) {
      case 0: return selectedProduct !== null
      case 1: {
        // Need at least 1 memory selected
        return selectedMemoryIds.size >= 1
      }
      case 2: {
        // Need at least 1 page created
        return pages.length >= 1
      }
      case 3: return true
      case 4: return shippingAddress.name && shippingAddress.line1 && shippingAddress.city && shippingAddress.postalCode && shippingAddress.country
      default: return false
    }
  }
  
  // Navigate steps
  const goToStep = (step: number) => {
    if (step < currentStep || canProceed()) {
      // Auto-save when leaving arrange step
      if (currentStep === 2 && step > currentStep) {
        saveProject()
      }
      // Auto-arrange when entering arrange step for first time
      if (step === 2 && pages.length === 0) {
        setTimeout(autoArrange, 100)
      }
      setCurrentStep(step)
    }
  }
  
  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <div className="sticky top-14 z-40 bg-[#E8E4D6]/95 backdrop-blur-sm border-b border-[#406A56]/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 text-[#406A56]/70 hover:text-[#406A56]"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>
            <h1 className="text-xl font-bold text-[#406A56]">Create Photobook</h1>
            <div className="w-32" /> {/* Spacer */}
          </div>
          
          {/* Step Progress */}
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const Icon = step.icon
              const isActive = index === currentStep
              const isComplete = index < currentStep
              const isClickable = index < currentStep || (index === currentStep + 1 && canProceed())
              
              return (
                <button
                  key={step.id}
                  onClick={() => isClickable && goToStep(index)}
                  disabled={!isClickable && index > currentStep}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                    isActive 
                      ? 'bg-[#406A56] text-white' 
                      : isComplete 
                        ? 'bg-[#406A56]/10 text-[#406A56]' 
                        : 'text-[#406A56]/40'
                  } ${isClickable ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed'}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isComplete ? 'bg-[#406A56] text-white' : ''
                  }`}>
                    {isComplete ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>
                  <span className="hidden md:inline font-medium">{step.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {currentStep === 0 && (
              <ProductStep
                selectedProduct={selectedProduct}
                onSelect={setSelectedProduct}
              />
            )}
            
            {currentStep === 1 && (
              <ContentStep
                memories={memories}
                selectedMemoryIds={selectedMemoryIds}
                onToggle={toggleMemory}
                minPages={selectedProduct?.minPages || 20}
                maxPages={selectedProduct?.maxPages || 100}
                isLoading={isLoading}
              />
            )}
            
            {currentStep === 2 && (
              <ArrangeStep
                pages={pages}
                setPages={setPages}
                selectedMemories={selectedMemories}
                onAutoArrange={autoArrange}
              />
            )}
            
            {currentStep === 3 && (
              <PreviewStep
                pages={pages}
                selectedMemories={selectedMemories}
              />
            )}
            
            {currentStep === 4 && selectedProduct && (
              <CheckoutStep
                product={selectedProduct}
                pages={pages}
                address={shippingAddress}
                setAddress={setShippingAddress}
                onSubmit={handleCheckout}
                isSubmitting={isSubmitting}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Bottom Navigation */}
      {currentStep < 4 && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#E8E4D6]/95 backdrop-blur-sm border-t border-[#406A56]/10 p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <button
              onClick={() => goToStep(currentStep - 1)}
              disabled={currentStep === 0}
              className="px-6 py-3 text-[#406A56] hover:bg-[#406A56]/10 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <ChevronLeft className="w-5 h-5" />
              Back
            </button>
            
            <button
              onClick={() => goToStep(currentStep + 1)}
              disabled={!canProceed()}
              className="px-8 py-3 bg-gradient-to-r from-[#406A56] to-[#4a7a64] text-white font-semibold rounded-xl hover:from-[#4a7a64] hover:to-[#5a8a74] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {currentStep === 3 ? 'Proceed to Checkout' : 'Continue'}
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
