'use client'

import { useState, useCallback } from 'react'
import { 
  Image as ImageIcon, 
  Type, 
  Trash2, 
  Move,
  QrCode,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { PhotobookPage, PhotobookMemorySelection, LAYOUT_TEMPLATES } from './types'

interface PageEditorProps {
  page: PhotobookPage
  availableMemories: PhotobookMemorySelection[]
  onUpdate: (pageId: string, updates: Partial<PhotobookPage>) => Promise<void>
}

interface PhotoSlot {
  id: string
  x: number
  y: number
  width: number
  height: number
}

// Generate QR code URL (uses a simple API for now, will be server-rendered for print)
const getQRCodeUrl = (memoryId: string) => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://yourstruly.love'
  const viewUrl = `${baseUrl}/view/${memoryId}`
  return `https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(viewUrl)}&format=png&margin=2`
}

export default function PageEditor({ page, availableMemories, onUpdate }: PageEditorProps) {
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null)
  const [showPhotoPicker, setShowPhotoPicker] = useState(false)
  const [caption, setCaption] = useState(page.content_json.text?.content || '')
  
  const template = LAYOUT_TEMPLATES.find(t => t.id === page.layout_type) || LAYOUT_TEMPLATES[0]
  
  // Get slot positions based on layout
  const getSlotPositions = (): PhotoSlot[] => {
    switch (page.layout_type) {
      case 'single':
      case 'full-bleed':
        return [{ id: '0', x: 0, y: 0, width: 100, height: 100 }]
      
      case 'two-horizontal':
        return [
          { id: '0', x: 0, y: 0, width: 100, height: 48 },
          { id: '1', x: 0, y: 52, width: 100, height: 48 }
        ]
      
      case 'two-vertical':
        return [
          { id: '0', x: 0, y: 0, width: 48, height: 100 },
          { id: '1', x: 52, y: 0, width: 48, height: 100 }
        ]
      
      case 'three-top-heavy':
        return [
          { id: '0', x: 0, y: 0, width: 100, height: 60 },
          { id: '1', x: 0, y: 62, width: 48, height: 38 },
          { id: '2', x: 52, y: 62, width: 48, height: 38 }
        ]
      
      case 'three-bottom-heavy':
        return [
          { id: '0', x: 0, y: 0, width: 48, height: 38 },
          { id: '1', x: 52, y: 0, width: 48, height: 38 },
          { id: '2', x: 0, y: 40, width: 100, height: 60 }
        ]
      
      case 'grid-2x2':
        return [
          { id: '0', x: 0, y: 0, width: 48, height: 48 },
          { id: '1', x: 52, y: 0, width: 48, height: 48 },
          { id: '2', x: 0, y: 52, width: 48, height: 48 },
          { id: '3', x: 52, y: 52, width: 48, height: 48 }
        ]
      
      case 'collage-5':
        return [
          { id: '0', x: 0, y: 0, width: 64, height: 48 },
          { id: '1', x: 66, y: 0, width: 34, height: 48 },
          { id: '2', x: 0, y: 52, width: 32, height: 48 },
          { id: '3', x: 34, y: 52, width: 32, height: 48 },
          { id: '4', x: 68, y: 52, width: 32, height: 48 }
        ]
      
      case 'hero-left':
        return [
          { id: '0', x: 0, y: 0, width: 64, height: 100 },
          { id: '1', x: 66, y: 0, width: 34, height: 48 },
          { id: '2', x: 66, y: 52, width: 34, height: 48 }
        ]
      
      case 'hero-right':
        return [
          { id: '0', x: 0, y: 0, width: 34, height: 48 },
          { id: '1', x: 0, y: 52, width: 34, height: 48 },
          { id: '2', x: 36, y: 0, width: 64, height: 100 }
        ]
      
      case 'text-left':
        return [
          { id: '0', x: 50, y: 0, width: 50, height: 100 }
        ]
      
      case 'text-bottom':
        return [
          { id: '0', x: 0, y: 0, width: 100, height: 70 }
        ]
      
      default:
        return [{ id: '0', x: 0, y: 0, width: 100, height: 100 }]
    }
  }
  
  const slots = getSlotPositions()
  const photos = page.content_json.photos || []
  
  // Handle photo selection from picker
  const handlePhotoSelect = async (memorySelection: PhotobookMemorySelection, mediaUrl: string, mediaId: string) => {
    if (selectedSlot === null) return
    
    const newPhotos = [...photos]
    newPhotos[selectedSlot] = {
      file_url: mediaUrl,
      media_id: mediaId,
      memory_id: memorySelection.memory_id,
      position: selectedSlot
    }
    
    await onUpdate(page.id, {
      content_json: {
        ...page.content_json,
        photos: newPhotos
      }
    })
    
    setShowPhotoPicker(false)
    setSelectedSlot(null)
  }
  
  // Handle photo removal
  const handleRemovePhoto = async (slotIndex: number) => {
    const newPhotos = photos.filter((_, i) => i !== slotIndex)
    await onUpdate(page.id, {
      content_json: {
        ...page.content_json,
        photos: newPhotos
      }
    })
  }
  
  // Handle caption update
  const handleCaptionBlur = async () => {
    await onUpdate(page.id, {
      content_json: {
        ...page.content_json,
        text: {
          ...page.content_json.text,
          content: caption
        }
      }
    })
  }
  
  const hasTextArea = template.hasTextArea
  
  return (
    <div className="h-full flex flex-col items-center justify-center p-8">
      {/* Page Preview */}
      <div 
        className="relative bg-white rounded-lg shadow-2xl overflow-hidden"
        style={{ 
          width: '500px', 
          height: '625px', // 4:5 aspect ratio
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
      >
        {/* Photo Slots */}
        <div className={`absolute ${hasTextArea && page.layout_type === 'text-bottom' ? 'inset-x-0 top-0 bottom-[30%]' : 'inset-0'}`}>
          {slots.map((slot, index) => {
            const photo = photos[index]
            
            return (
              <div
                key={slot.id}
                onClick={() => {
                  setSelectedSlot(index)
                  setShowPhotoPicker(true)
                }}
                className={`absolute cursor-pointer transition-all group ${
                  photo ? '' : 'bg-gray-100 hover:bg-gray-200'
                }`}
                style={{
                  left: `${slot.x}%`,
                  top: `${slot.y}%`,
                  width: `${slot.width}%`,
                  height: `${slot.height}%`,
                  padding: page.layout_type === 'full-bleed' ? 0 : '4px'
                }}
              >
                <div className="relative w-full h-full overflow-hidden rounded">
                  {photo ? (
                    <>
                      <img
                        src={photo.file_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Auto QR Code Overlay - Bottom Right Corner */}
                      {photo.memory_id && (
                        <div className="absolute bottom-2 right-2 bg-white p-1 rounded shadow-lg opacity-90">
                          <img
                            src={getQRCodeUrl(photo.memory_id)}
                            alt="QR Code"
                            className="w-10 h-10"
                          />
                        </div>
                      )}
                      
                      {/* Hover Controls */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-white hover:bg-white/20"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedSlot(index)
                            setShowPhotoPicker(true)
                          }}
                        >
                          <ImageIcon className="w-4 h-4 mr-1" />
                          Replace
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:bg-red-500/20"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRemovePhoto(index)
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-300 rounded">
                      <ImageIcon className="w-8 h-8 mb-2" />
                      <span className="text-sm">Click to add photo</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        
        {/* Text Area (if applicable) */}
        {hasTextArea && (
          <div 
            className={`absolute ${
              page.layout_type === 'text-left' 
                ? 'left-0 top-0 w-1/2 h-full p-6 flex flex-col justify-center'
                : 'bottom-0 left-0 right-0 h-[30%] p-6 flex flex-col justify-center'
            }`}
          >
            <Textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              onBlur={handleCaptionBlur}
              placeholder="Add a caption or quote..."
              className="bg-transparent border-0 text-gray-800 text-center resize-none focus-visible:ring-0 placeholder:text-gray-400"
              style={{
                fontSize: page.layout_type === 'text-left' ? '14px' : '16px',
                lineHeight: '1.6'
              }}
            />
          </div>
        )}
        
        {/* Page Number */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-gray-400 text-xs">
          {page.page_number}
        </div>
      </div>
      
      {/* Layout Info */}
      <div className="mt-4 text-center">
        <span className="text-white/60 text-sm">
          Layout: <span className="text-white">{template.name}</span>
        </span>
      </div>
      
      {/* Photo Picker Modal */}
      {showPhotoPicker && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="text-white font-semibold">Select Photo</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowPhotoPicker(false)
                  setSelectedSlot(null)
                }}
                className="text-white/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {availableMemories.length === 0 ? (
                <div className="text-center py-12 text-white/40">
                  <ImageIcon className="w-12 h-12 mx-auto mb-3" />
                  <p>No memories added yet.</p>
                  <p className="text-sm mt-1">Add memories using the "Add Memories" button in the sidebar.</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-3">
                  {availableMemories.map((selection) => {
                    const memory = selection.memory as any
                    const media = memory?.memory_media || []
                    
                    return media.map((m: any) => (
                      <button
                        key={m.id}
                        onClick={() => handlePhotoSelect(selection, m.file_url, m.id)}
                        className="relative aspect-square rounded-lg overflow-hidden group hover:ring-2 hover:ring-amber-500"
                      >
                        <img
                          src={m.file_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        {/* Show memory title */}
                        <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-white text-xs truncate">{memory?.title || 'Untitled'}</p>
                        </div>
                        
                        {/* QR indicator */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-white/90 p-1 rounded">
                            <QrCode className="w-3 h-3 text-gray-800" />
                          </div>
                        </div>
                      </button>
                    ))
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
