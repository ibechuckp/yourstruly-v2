'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, X, QrCode } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PhotobookPage, PhotobookMemorySelection } from './types'
import { 
  TEMPLATES_BY_ID, 
  getPhotoSlots, 
  getTextSlots,
  LAYOUT_TEMPLATES as RICH_TEMPLATES
} from '@/lib/photobook/templates'

interface PhotobookPreviewProps {
  pages: PhotobookPage[]
  projectTitle: string
  onClose: () => void
}

// Map old layout types to new template IDs
const LAYOUT_ID_MAP: Record<string, string> = {
  'single': 'full-photo',
  'full-bleed': 'full-photo',
  'two-horizontal': 'two-horizontal',
  'two-vertical': 'two-vertical',
  'three-top-heavy': 'feature-2-small',
  'three-bottom-heavy': 'feature-2-small',
  'grid-2x2': 'grid-4',
  'collage-5': 'collage-3',
  'hero-left': 'feature-2-small',
  'hero-right': 'feature-2-small',
  'text-left': 'photo-with-caption',
  'text-bottom': 'photo-with-caption',
}

// Font size in pixels
const FONT_SIZE_PX: Record<string, number> = {
  'sm': 12,
  'md': 16,
  'lg': 20,
  'xl': 28,
  '2xl': 36,
}

// Generate QR code URL
const getQRCodeUrl = (memoryId: string) => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://yourstruly.love'
  const viewUrl = `${baseUrl}/view/${memoryId}`
  return `https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(viewUrl)}&format=png&margin=2`
}

export default function PhotobookPreview({ pages, projectTitle, onClose }: PhotobookPreviewProps) {
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  
  const currentPage = pages[currentPageIndex]
  if (!currentPage) return null
  
  const templateId = LAYOUT_ID_MAP[currentPage.layout_type] || currentPage.layout_type
  const template = TEMPLATES_BY_ID[templateId] || RICH_TEMPLATES[0]
  
  const photoSlots = getPhotoSlots(template)
  const textSlots = getTextSlots(template)
  const photos = currentPage.content_json.photos || []
  
  // Get text content and styles
  const getTextContent = (slotId: string): string => {
    // Try new slots structure first
    if (currentPage.content_json.slots?.[slotId]?.value) {
      return currentPage.content_json.slots[slotId].value
    }
    // Fallback to old text.content
    if (textSlots[0]?.id === slotId && currentPage.content_json.text?.content) {
      return currentPage.content_json.text.content
    }
    return ''
  }
  
  const getTextStyle = (slotId: string) => {
    const stored = currentPage.content_json.textStyles?.[slotId] ||
                   currentPage.content_json.slots?.[slotId]?.style ||
                   (textSlots[0]?.id === slotId ? currentPage.content_json.text : null)
    
    return {
      fontFamily: stored?.fontFamily || 'Georgia, serif',
      fontSize: FONT_SIZE_PX[stored?.fontSize || 'md'] || 16,
      fontWeight: stored?.fontWeight || 'normal',
      fontStyle: stored?.fontStyle || 'normal',
      textAlign: (stored?.textAlign || stored?.alignment || 'center') as 'left' | 'center' | 'right',
      color: stored?.color || '#333333',
    }
  }
  
  // Get background
  const background = currentPage.content_json.background?.gradient ||
                     currentPage.content_json.background?.color ||
                     template.background ||
                     '#ffffff'
  
  const goToPrevPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1)
    }
  }
  
  const goToNextPage = () => {
    if (currentPageIndex < pages.length - 1) {
      setCurrentPageIndex(currentPageIndex + 1)
    }
  }
  
  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div>
          <h2 className="text-white font-semibold">{projectTitle}</h2>
          <p className="text-white/50 text-sm">
            Page {currentPageIndex + 1} of {pages.length}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-white/60 hover:text-white"
        >
          <X className="w-6 h-6" />
        </Button>
      </div>
      
      {/* Page Preview */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="flex items-center gap-8">
          {/* Previous Button */}
          <Button
            variant="ghost"
            size="lg"
            onClick={goToPrevPage}
            disabled={currentPageIndex === 0}
            className="text-white/60 hover:text-white disabled:opacity-30"
          >
            <ChevronLeft className="w-10 h-10" />
          </Button>
          
          {/* Page */}
          <div
            className="relative rounded-lg shadow-2xl overflow-hidden"
            style={{
              width: '500px',
              height: '625px',
              background: background,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* Render photo slots */}
            {photoSlots.map((slot, index) => {
              const photo = photos[index]
              
              return (
                <div
                  key={slot.id}
                  className="absolute overflow-hidden"
                  style={{
                    left: `${slot.position.x}%`,
                    top: `${slot.position.y}%`,
                    width: `${slot.position.width}%`,
                    height: `${slot.position.height}%`,
                    padding: '4px',
                  }}
                >
                  <div 
                    className="relative w-full h-full overflow-hidden"
                    style={{
                      borderRadius: slot.style?.borderRadius 
                        ? `${slot.style.borderRadius}%` 
                        : '4px',
                    }}
                  >
                    {photo ? (
                      <>
                        <img
                          src={photo.file_url}
                          alt=""
                          className="w-full h-full"
                          style={{ 
                            objectFit: slot.style?.objectFit || 'cover' 
                          }}
                        />
                        {/* QR Code Overlay */}
                        {photo.memory_id && (
                          <div className="absolute bottom-2 right-2 bg-white p-1 rounded shadow-lg opacity-90">
                            <img
                              src={getQRCodeUrl(photo.memory_id)}
                              alt="QR Code"
                              className="w-10 h-10"
                            />
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                        <span>No photo</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            
            {/* Render text slots */}
            {textSlots.map((slot) => {
              const content = getTextContent(slot.id)
              const style = getTextStyle(slot.id)
              
              return (
                <div
                  key={slot.id}
                  className="absolute flex items-center p-4"
                  style={{
                    left: `${slot.position.x}%`,
                    top: `${slot.position.y}%`,
                    width: `${slot.position.width}%`,
                    height: `${slot.position.height}%`,
                  }}
                >
                  <div 
                    className="w-full"
                    style={{
                      fontFamily: style.fontFamily,
                      fontSize: `${style.fontSize}px`,
                      fontWeight: style.fontWeight,
                      fontStyle: style.fontStyle,
                      textAlign: style.textAlign,
                      color: style.color,
                      lineHeight: 1.5,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {content || (
                      <span className="text-gray-400 italic">
                        {slot.placeholder || 'No text'}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
            
            {/* Page Number */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-gray-500 text-xs">
              {currentPage.page_number}
            </div>
          </div>
          
          {/* Next Button */}
          <Button
            variant="ghost"
            size="lg"
            onClick={goToNextPage}
            disabled={currentPageIndex === pages.length - 1}
            className="text-white/60 hover:text-white disabled:opacity-30"
          >
            <ChevronRight className="w-10 h-10" />
          </Button>
        </div>
      </div>
      
      {/* Page Navigation Dots */}
      <div className="flex justify-center gap-2 pb-8">
        {pages.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentPageIndex(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentPageIndex 
                ? 'bg-amber-500 w-4' 
                : 'bg-white/30 hover:bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
