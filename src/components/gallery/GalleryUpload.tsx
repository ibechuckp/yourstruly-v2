'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, Image as ImageIcon, Video, X, Loader2, Check, MapPin, Calendar } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import exifr from 'exifr'

interface UploadingFile {
  file: File
  preview: string
  status: 'pending' | 'uploading' | 'complete' | 'error'
  progress: number
  exif?: {
    date?: Date
    lat?: number
    lng?: number
    camera?: string
  }
  error?: string
}

interface GalleryUploadProps {
  onUploadComplete: () => void
}

export default function GalleryUpload({ onUploadComplete }: GalleryUploadProps) {
  const [files, setFiles] = useState<UploadingFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  // Extract EXIF data from file
  const extractExif = async (file: File) => {
    try {
      if (!file.type.startsWith('image/')) return {}

      const exif = await exifr.parse(file, {
        gps: true,
        pick: ['DateTimeOriginal', 'CreateDate', 'latitude', 'longitude', 'Make', 'Model']
      })

      if (!exif) return {}

      return {
        date: exif.DateTimeOriginal || exif.CreateDate,
        lat: exif.latitude,
        lng: exif.longitude,
        camera: exif.Make && exif.Model ? `${exif.Make} ${exif.Model}` : undefined
      }
    } catch (err) {
      console.log('EXIF extraction failed:', err)
      return {}
    }
  }

  // Handle file selection
  const handleFileSelect = useCallback(async (selectedFiles: File[]) => {
    const validFiles = selectedFiles.filter(
      f => f.type.startsWith('image/') || f.type.startsWith('video/')
    )

    const newFiles: UploadingFile[] = await Promise.all(
      validFiles.map(async file => {
        const exif = await extractExif(file)
        return {
          file,
          preview: URL.createObjectURL(file),
          status: 'pending' as const,
          progress: 0,
          exif
        }
      })
    )

    setFiles(prev => [...prev, ...newFiles])
  }, [])

  // Handle drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFiles = Array.from(e.dataTransfer.files)
    handleFileSelect(droppedFiles)
  }, [handleFileSelect])

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    handleFileSelect(selectedFiles)
  }, [handleFileSelect])

  // Remove file
  const removeFile = (index: number) => {
    setFiles(prev => {
      const newFiles = [...prev]
      URL.revokeObjectURL(newFiles[index].preview)
      newFiles.splice(index, 1)
      return newFiles
    })
  }

  // Upload all files
  const uploadFiles = async () => {
    if (files.length === 0) return

    setIsUploading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      alert('Please sign in to upload')
      setIsUploading(false)
      return
    }

    for (let i = 0; i < files.length; i++) {
      const uploadFile = files[i]
      if (uploadFile.status !== 'pending') continue

      // Update status to uploading
      setFiles(prev => {
        const newFiles = [...prev]
        newFiles[i].status = 'uploading'
        return newFiles
      })

      try {
        // 1. Create a memory for this media
        const memoryRes = await fetch('/api/memories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: uploadFile.file.name.replace(/\.[^/.]+$/, ''), // Remove extension
            memory_date: uploadFile.exif?.date 
              ? new Date(uploadFile.exif.date).toISOString().split('T')[0]
              : new Date().toISOString().split('T')[0],
            memory_type: 'moment',
            location_lat: uploadFile.exif?.lat,
            location_lng: uploadFile.exif?.lng,
          }),
        })

        const { memory } = await memoryRes.json()
        if (!memory?.id) throw new Error('Failed to create memory')

        // 2. Upload the file
        const formData = new FormData()
        formData.append('file', uploadFile.file)
        
        // Include EXIF data for the API to store
        if (uploadFile.exif) {
          formData.append('exif_lat', uploadFile.exif.lat?.toString() || '')
          formData.append('exif_lng', uploadFile.exif.lng?.toString() || '')
          formData.append('taken_at', uploadFile.exif.date?.toISOString() || '')
          formData.append('camera', uploadFile.exif.camera || '')
        }

        const uploadRes = await fetch(`/api/memories/${memory.id}/media`, {
          method: 'POST',
          body: formData,
        })

        if (!uploadRes.ok) throw new Error('Upload failed')

        // Update status to complete
        setFiles(prev => {
          const newFiles = [...prev]
          newFiles[i].status = 'complete'
          newFiles[i].progress = 100
          return newFiles
        })

      } catch (err) {
        console.error('Upload error:', err)
        setFiles(prev => {
          const newFiles = [...prev]
          newFiles[i].status = 'error'
          newFiles[i].error = err instanceof Error ? err.message : 'Upload failed'
          return newFiles
        })
      }
    }

    setIsUploading(false)
    
    // Check if all uploads completed
    const allComplete = files.every(f => f.status === 'complete' || f.status === 'error')
    if (allComplete) {
      // Clear completed files after a delay
      setTimeout(() => {
        setFiles(prev => {
          prev.forEach(f => URL.revokeObjectURL(f.preview))
          return []
        })
        onUploadComplete()
      }, 1500)
    }
  }

  const pendingCount = files.filter(f => f.status === 'pending').length
  const completedCount = files.filter(f => f.status === 'complete').length

  return (
    <div className="glass-card-page p-6 mb-6">
      {/* Upload Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => fileInputRef.current?.click()}
        className={`gallery-upload-zone ${isDragging ? 'dragging' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={handleInputChange}
          className="hidden"
        />
        <div className="gallery-upload-icon">
          <Upload size={28} />
        </div>
        <p className="gallery-upload-title">Drop photos & videos here</p>
        <p className="gallery-upload-subtitle">or click to browse • EXIF data will be extracted automatically</p>
      </div>

      {/* File Previews */}
      {files.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-[#666]">
              {completedCount} of {files.length} uploaded
            </p>
            {pendingCount > 0 && !isUploading && (
              <button
                onClick={uploadFiles}
                className="btn-primary"
              >
                <Upload size={16} />
                Upload {pendingCount} {pendingCount === 1 ? 'file' : 'files'}
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {files.map((f, i) => (
              <div key={i} className="relative group">
                <div className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                  {f.file.type.startsWith('video/') ? (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <Video size={24} className="text-gray-400" />
                    </div>
                  ) : (
                    <img
                      src={f.preview}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  )}

                  {/* Status Overlay */}
                  {f.status === 'uploading' && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Loader2 size={24} className="text-[#D9C61A] animate-spin" />
                    </div>
                  )}
                  {f.status === 'complete' && (
                    <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                      <Check size={24} className="text-green-500" />
                    </div>
                  )}
                  {f.status === 'error' && (
                    <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                      <X size={24} className="text-red-500" />
                    </div>
                  )}

                  {/* Remove Button */}
                  {f.status === 'pending' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); removeFile(i) }}
                      className="absolute top-1 right-1 p-1 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={14} className="text-white" />
                    </button>
                  )}
                </div>

                {/* EXIF Info */}
                {f.exif && (f.exif.date || f.exif.lat) && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {f.exif.date && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#406A56]/10 rounded text-[9px] text-[#406A56]">
                        <Calendar size={8} />
                        {new Date(f.exif.date).toLocaleDateString()}
                      </span>
                    )}
                    {f.exif.lat && f.exif.lng && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#D9C61A]/10 rounded text-[9px] text-[#8a7c08]">
                        <MapPin size={8} />
                        GPS
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
