'use client'

import { useState, useRef, useCallback } from 'react'
import { X, Upload, Calendar, MapPin, Sparkles, Loader2, Image as ImageIcon, Check } from 'lucide-react'
import Modal from '@/components/ui/Modal'

interface CreateMemoryModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated: () => void
}

interface UploadedFile {
  file: File
  preview: string
  uploading: boolean
  uploaded: boolean
  analysis?: {
    labels: any[]
    faces: any[]
  }
}

const MEMORY_TYPES = [
  { id: 'moment', label: 'Moment' },
  { id: 'milestone', label: 'Milestone' },
  { id: 'trip', label: 'Trip' },
  { id: 'celebration', label: 'Celebration' },
  { id: 'everyday', label: 'Everyday' },
]

export default function CreateMemoryModal({ isOpen, onClose, onCreated }: CreateMemoryModalProps) {
  const [step, setStep] = useState(1)
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [memoryDate, setMemoryDate] = useState('')
  const [memoryType, setMemoryType] = useState('moment')
  const [locationName, setLocationName] = useState('')
  const [creating, setCreating] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<{
    title?: string
    description?: string
    category?: string
  } | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    
    const newFiles: UploadedFile[] = selectedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      uploading: false,
      uploaded: false,
    }))

    setFiles(prev => [...prev, ...newFiles])
  }, [])

  const removeFile = (index: number) => {
    setFiles(prev => {
      const newFiles = [...prev]
      URL.revokeObjectURL(newFiles[index].preview)
      newFiles.splice(index, 1)
      return newFiles
    })
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      f => f.type.startsWith('image/') || f.type.startsWith('video/')
    )
    
    const newFiles: UploadedFile[] = droppedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      uploading: false,
      uploaded: false,
    }))

    setFiles(prev => [...prev, ...newFiles])
  }, [])

  const handleCreate = async () => {
    if (files.length === 0) return

    setCreating(true)

    try {
      // 1. Create the memory
      const memoryRes = await fetch('/api/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || aiSuggestions?.title || 'Untitled Memory',
          description: description || aiSuggestions?.description,
          memory_date: memoryDate || new Date().toISOString().split('T')[0],
          memory_type: memoryType,
          location_name: locationName,
        }),
      })

      const { memory } = await memoryRes.json()
      if (!memory?.id) throw new Error('Failed to create memory')

      // 2. Upload each file
      for (let i = 0; i < files.length; i++) {
        setFiles(prev => {
          const newFiles = [...prev]
          newFiles[i].uploading = true
          return newFiles
        })

        const formData = new FormData()
        formData.append('file', files[i].file)

        const uploadRes = await fetch(`/api/memories/${memory.id}/media`, {
          method: 'POST',
          body: formData,
        })

        const { analysis } = await uploadRes.json()

        setFiles(prev => {
          const newFiles = [...prev]
          newFiles[i].uploading = false
          newFiles[i].uploaded = true
          newFiles[i].analysis = analysis
          return newFiles
        })

        // Get AI suggestions from first image
        if (i === 0 && analysis) {
          const topLabels = analysis.labels?.slice(0, 3).map((l: any) => l.name) || []
          setAiSuggestions({
            title: topLabels.length > 0 ? topLabels.join(', ') : undefined,
            category: analysis.labels?.[0]?.categories?.[0],
          })
        }
      }

      // 3. Done!
      onCreated()
      resetForm()
    } catch (error) {
      console.error('Error creating memory:', error)
      alert('Failed to create memory')
    } finally {
      setCreating(false)
    }
  }

  const resetForm = () => {
    files.forEach(f => URL.revokeObjectURL(f.preview))
    setFiles([])
    setTitle('')
    setDescription('')
    setMemoryDate('')
    setMemoryType('moment')
    setLocationName('')
    setStep(1)
    setAiSuggestions(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create Memory" maxWidth="max-w-2xl" showDone={false}>
      {step === 1 ? (
        /* Step 1: Upload Photos */
        <div>
          {/* Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-700 rounded-xl p-8 text-center cursor-pointer hover:border-amber-500/50 transition-colors"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <Upload size={32} className="mx-auto text-gray-500 mb-3" />
            <p className="text-white font-medium mb-1">Drop photos or videos here</p>
            <p className="text-gray-400 text-sm">or click to browse</p>
          </div>

          {/* Preview Grid */}
          {files.length > 0 && (
            <div className="grid grid-cols-4 gap-2 mt-4">
              {files.map((file, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden group">
                  <img
                    src={file.preview}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  {file.uploading && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Loader2 size={24} className="text-amber-500 animate-spin" />
                    </div>
                  )}
                  {file.uploaded && (
                    <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                      <Check size={24} className="text-green-500" />
                    </div>
                  )}
                  {!file.uploading && !file.uploaded && (
                    <button
                      onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                      className="absolute top-1 right-1 p-1 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={14} className="text-white" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Continue Button */}
          {files.length > 0 && (
            <button
              onClick={() => setStep(2)}
              className="w-full mt-4 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-medium transition-colors"
            >
              Continue ({files.length} {files.length === 1 ? 'file' : 'files'})
            </button>
          )}
        </div>
      ) : (
        /* Step 2: Details */
        <div className="space-y-4">
          {/* Preview */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {files.slice(0, 5).map((file, i) => (
              <img
                key={i}
                src={file.preview}
                alt=""
                className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
              />
            ))}
            {files.length > 5 && (
              <div className="w-16 h-16 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm">+{files.length - 5}</span>
              </div>
            )}
          </div>

          {/* AI Suggestions */}
          {aiSuggestions && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
              <div className="flex items-center gap-2 text-amber-500 text-sm mb-2">
                <Sparkles size={14} />
                AI Suggestions
              </div>
              {aiSuggestions.title && !title && (
                <button
                  onClick={() => setTitle(aiSuggestions.title!)}
                  className="text-sm text-white/70 hover:text-white"
                >
                  Title: "{aiSuggestions.title}" — <span className="text-amber-500">use this</span>
                </button>
              )}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-gray-400 text-sm mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give this memory a name..."
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-gray-400 text-sm mb-1">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What happened? How did you feel?"
              rows={3}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
            />
          </div>

          {/* Date & Type Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-400 text-sm mb-1">Date</label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="date"
                  value={memoryDate}
                  onChange={(e) => setMemoryDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">Type</label>
              <select
                value={memoryType}
                onChange={(e) => setMemoryType(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {MEMORY_TYPES.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-gray-400 text-sm mb-1">Location (optional)</label>
            <div className="relative">
              <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="Where was this?"
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-800">
            <button
              onClick={() => setStep(1)}
              className="flex-1 py-3 text-gray-400 hover:text-white transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleCreate}
              disabled={creating}
              className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              {creating ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Create Memory
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
