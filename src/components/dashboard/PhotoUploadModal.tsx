'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Image as ImageIcon, X, Upload, Check, Clock, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface PhotoUploadModalProps {
  isOpen: boolean
  onClose: () => void
}

type UploadState = 'select' | 'uploading' | 'preview' | 'creating'

export default function PhotoUploadModal({ isOpen, onClose }: PhotoUploadModalProps) {
  const [uploadState, setUploadState] = useState<UploadState>('select')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploadedMedia, setUploadedMedia] = useState<{ id: string; memoryId: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setUploadState('uploading')

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => setPreviewUrl(e.target?.result as string)
    reader.readAsDataURL(file)

    try {
      // Create a memory first
      const memoryRes = await fetch('/api/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
          memory_date: new Date().toISOString().split('T')[0],
          memory_type: 'moment',
        }),
      })

      if (!memoryRes.ok) {
        throw new Error('Failed to create memory')
      }

      const { memory } = await memoryRes.json()
      if (!memory?.id) {
        throw new Error('No memory ID returned')
      }

      // Upload the photo
      const formData = new FormData()
      formData.append('file', file)
      
      const uploadRes = await fetch(`/api/memories/${memory.id}/media`, {
        method: 'POST',
        body: formData,
      })

      if (!uploadRes.ok) {
        throw new Error('Failed to upload photo')
      }

      const { media } = await uploadRes.json()
      setUploadedMedia({ id: media?.id, memoryId: memory.id })
      setUploadState('preview')

    } catch (err) {
      console.error('Upload error:', err)
      setError(err instanceof Error ? err.message : 'Upload failed')
      setUploadState('select')
    }
  }

  const handleUseInMemory = () => {
    if (!uploadedMedia) return
    setUploadState('creating')
    // Navigate to the memory editor
    router.push(`/dashboard/memories/${uploadedMedia.memoryId}`)
    handleClose()
  }

  const handleLater = () => {
    // Just close - memory already created with the photo
    handleClose()
  }

  const handleClose = () => {
    setUploadState('select')
    setPreviewUrl(null)
    setUploadedMedia(null)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-[#FDF8F3] rounded-2xl p-6 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-[#406A56]">
                {uploadState === 'preview' ? 'Photo Uploaded!' : 'Add Photos'}
              </h3>
              <button 
                onClick={handleClose} 
                className="p-2 hover:bg-[#406A56]/10 rounded-lg transition-colors"
              >
                <X size={20} className="text-[#406A56]" />
              </button>
            </div>

            {/* Content based on state */}
            {uploadState === 'select' && (
              <>
                <p className="text-[#406A56]/70 mb-4">Upload a photo to create a new memory</p>
                
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                    {error}
                  </div>
                )}
                
                <div className="border-2 border-dashed border-[#406A56]/30 rounded-xl p-8 text-center hover:border-[#406A56]/50 transition-colors cursor-pointer">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="photo-upload-input"
                    onChange={handleFileSelect}
                  />
                  <label htmlFor="photo-upload-input" className="cursor-pointer">
                    <ImageIcon size={48} className="mx-auto text-[#406A56]/40 mb-3" />
                    <p className="text-[#406A56] font-medium">Click to upload a photo</p>
                    <p className="text-sm text-[#406A56]/50 mt-1">JPG, PNG, HEIC supported</p>
                  </label>
                </div>
              </>
            )}

            {uploadState === 'uploading' && (
              <div className="py-8 text-center">
                <Loader2 size={48} className="mx-auto text-[#406A56] animate-spin mb-4" />
                <p className="text-[#406A56] font-medium">Uploading photo...</p>
                {previewUrl && (
                  <div className="mt-4 rounded-xl overflow-hidden max-h-48">
                    <img src={previewUrl} alt="Preview" className="w-full h-48 object-cover opacity-50" />
                  </div>
                )}
              </div>
            )}

            {uploadState === 'preview' && previewUrl && (
              <>
                {/* Photo Preview */}
                <div className="rounded-xl overflow-hidden mb-4 shadow-lg">
                  <img src={previewUrl} alt="Uploaded" className="w-full h-64 object-cover" />
                </div>

                {/* Question */}
                <p className="text-center text-[#406A56] font-medium mb-4">
                  Would you like to add details to this memory?
                </p>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleLater}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-[#406A56]/20 text-[#406A56] rounded-xl hover:bg-[#406A56]/5 transition-colors font-medium"
                  >
                    <Clock size={18} />
                    Later
                  </button>
                  <button
                    onClick={handleUseInMemory}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#406A56] text-white rounded-xl hover:bg-[#4a7a64] transition-colors font-medium"
                  >
                    <Check size={18} />
                    Add Details
                  </button>
                </div>
              </>
            )}

            {uploadState === 'creating' && (
              <div className="py-8 text-center">
                <Loader2 size={48} className="mx-auto text-[#406A56] animate-spin mb-4" />
                <p className="text-[#406A56] font-medium">Opening memory editor...</p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
