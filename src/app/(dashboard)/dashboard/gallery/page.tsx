'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft, Image as ImageIcon, MapPin, Plus, Users, PawPrint, Upload, Scan, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import GalleryStatsPanel from '@/components/gallery/GalleryStatsPanel'
import TimelineRuler from '@/components/gallery/TimelineRuler'
import DigitizeModal from '@/components/gallery/DigitizeModal'
import '@/styles/page-styles.css'
import '@/styles/gallery.css'

const GalleryGlobe = dynamic(() => import('@/components/gallery/GalleryGlobe'), {
  ssr: false,
  loading: () => (
    <div className="gallery-globe-section flex items-center justify-center">
      <div className="text-[#406A56]/50">Loading globe...</div>
    </div>
  )
})

interface MediaItem {
  id: string
  file_url: string
  file_type: string
  location_lat: number | null
  location_lng: number | null
  taken_at: string | null
  exif_lat: number | null
  exif_lng: number | null
  memory_id: string
  memory?: {
    id: string
    title: string
    location_name: string
    location_lat: number | null
    location_lng: number | null
  }
}

export default function GalleryPage() {
  const [media, setMedia] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedYearRange, setSelectedYearRange] = useState<[number, number] | null>(null)
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null)
  const [relatedMedia, setRelatedMedia] = useState<MediaItem[]>([])
  const [uploading, setUploading] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showDigitizeModal, setShowDigitizeModal] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  // Generate year range from earliest photo to current year (ascending for ruler)
  const yearRange = useMemo(() => {
    const currentYear = new Date().getFullYear()
    let minYear = currentYear
    let maxYear = currentYear
    
    media.forEach(m => {
      if (m.taken_at) {
        const year = new Date(m.taken_at).getFullYear()
        if (year < minYear) minYear = year
        if (year > maxYear) maxYear = year
      }
    })
    
    // If no photos have dates, show last 5 years
    if (minYear === currentYear && media.length > 0) {
      minYear = currentYear - 5
    }
    
    // Create array from minYear to maxYear (ascending)
    const years: number[] = []
    for (let y = Math.max(minYear, currentYear - 15); y <= maxYear; y++) {
      years.push(y)
    }
    return years
  }, [media])

  // Count photos per year
  const yearCounts = useMemo(() => {
    const counts: Record<number, number> = {}
    media.forEach(m => {
      if (m.taken_at) {
        const year = new Date(m.taken_at).getFullYear()
        counts[year] = (counts[year] || 0) + 1
      }
    })
    return counts
  }, [media])

  // Auto-albums based on locations, etc.
  const autoAlbums = useMemo(() => {
    const locationAlbums: Record<string, MediaItem[]> = {}
    
    media.forEach(m => {
      if (m.memory?.location_name) {
        const loc = m.memory.location_name
        if (!locationAlbums[loc]) locationAlbums[loc] = []
        locationAlbums[loc].push(m)
      }
    })

    return Object.entries(locationAlbums)
      .filter(([_, items]) => items.length >= 2)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 6)
      .map(([name, items]) => ({
        name,
        count: items.length,
        cover: items[0].file_url,
        type: 'location' as const
      }))
  }, [media])

  const loadMedia = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data } = await supabase
      .from('memory_media')
      .select(`
        id, file_url, file_type, exif_lat, exif_lng, taken_at, memory_id,
        memory:memories(id, title, location_name, location_lat, location_lng)
      `)
      .eq('user_id', user.id)
      .order('taken_at', { ascending: false, nullsFirst: false })

    const transformed: MediaItem[] = (data || []).map(item => ({
      ...item,
      memory: item.memory ? (Array.isArray(item.memory) ? item.memory[0] : item.memory) : undefined,
      location_lat: item.exif_lat || (item.memory as any)?.location_lat || null,
      location_lng: item.exif_lng || (item.memory as any)?.location_lng || null,
    }))

    setMedia(transformed)
    setLoading(false)
  }, [supabase])

  useEffect(() => { loadMedia() }, [loadMedia])

  const handleGlobeSelect = (item: MediaItem) => {
    const related = media.filter(m => 
      m.id !== item.id && (
        m.memory_id === item.memory_id ||
        (m.memory?.location_name && m.memory.location_name === item.memory?.location_name)
      )
    )
    setRelatedMedia([item, ...related])
    setSelectedMedia(item)
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    
    setUploading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setUploading(false); return }

    for (const file of Array.from(files)) {
      try {
        const memoryRes = await fetch('/api/memories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: file.name.replace(/\.[^/.]+$/, ''),
            memory_date: new Date().toISOString().split('T')[0],
            memory_type: 'moment',
          }),
        })
        const { memory } = await memoryRes.json()
        if (!memory?.id) continue

        const formData = new FormData()
        formData.append('file', file)
        await fetch(`/api/memories/${memory.id}/media`, { method: 'POST', body: formData })
      } catch (err) {
        console.error('Upload error:', err)
      }
    }
    
    setUploading(false)
    loadMedia()
  }

  return (
    <div className="page-container">
      <div className="page-background">
        <div className="page-blob page-blob-1" />
        <div className="page-blob page-blob-2" />
        <div className="page-blob page-blob-3" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="page-header mb-5">
          <Link href="/dashboard" className="page-header-back">
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="page-header-title">Gallery</h1>
            <p className="page-header-subtitle">Your visual memories around the world</p>
          </div>
        </header>

        {/* Year Timeline Ruler + Upload */}
        <div className="grid grid-cols-[1fr_auto] gap-4 mb-5">
          {/* Timeline Ruler */}
          <TimelineRuler
            years={yearRange}
            yearCounts={yearCounts}
            selectedRange={selectedYearRange}
            onRangeChange={setSelectedYearRange}
          />

          {/* Upload Button - Square */}
          <button
            onClick={() => setShowUploadModal(true)}
            disabled={uploading}
            className="glass-card-page w-14 h-14 flex items-center justify-center cursor-pointer hover:bg-white/90 transition-all self-start"
          >
            {uploading ? (
              <div className="w-6 h-6 border-2 border-[#8a7c08] border-t-transparent rounded-full animate-spin" />
            ) : (
              <Plus size={26} className="text-[#8a7c08]" />
            )}
          </button>
          
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleUpload}
            className="hidden"
            disabled={uploading}
          />
        </div>

        {/* Main Content */}
        {loading ? (
          <div className="glass-card-page p-12 text-center">
            <p className="text-[#666]">Loading gallery...</p>
          </div>
        ) : media.length === 0 ? (
          <div className="glass-card-page p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-[#406A56]/10 rounded-full flex items-center justify-center">
              <ImageIcon size={32} className="text-[#406A56]/50" />
            </div>
            <h3 className="text-lg font-semibold text-[#2d2d2d] mb-2">No photos yet</h3>
            <p className="text-[#666]">Upload your first photos to see them on the globe</p>
          </div>
        ) : (
          <>
            {/* Globe + Stats Split */}
            <div className="gallery-split-view mb-5">
              <div className="gallery-globe-half">
                <GalleryGlobe
                  media={media}
                  selectedTimeframe={selectedYearRange ? { yearRange: selectedYearRange } : null}
                  onSelectMedia={handleGlobeSelect}
                />
              </div>
              <div className="gallery-stats-half">
                <GalleryStatsPanel
                  media={media}
                  selectedMedia={selectedMedia}
                  relatedMedia={relatedMedia}
                  onClose={() => { setSelectedMedia(null); setRelatedMedia([]) }}
                  onNavigate={(m) => setSelectedMedia(m as MediaItem)}
                />
              </div>
            </div>

            {/* Auto Albums Row */}
            <div className="glass-card-page p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[#2d2d2d]">Smart Albums</h3>
                <p className="text-xs text-[#666]">Auto-generated from your photos</p>
              </div>
              
              {autoAlbums.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  {autoAlbums.map((album, i) => (
                    <div 
                      key={i}
                      className="group cursor-pointer"
                    >
                      <div className="aspect-square rounded-xl overflow-hidden mb-2 relative">
                        <img 
                          src={album.cover} 
                          alt={album.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-2 left-2 right-2">
                          <p className="text-white text-sm font-medium truncate">{album.name}</p>
                          <p className="text-white/60 text-xs">{album.count} photos</p>
                        </div>
                        <div className="absolute top-2 right-2 w-6 h-6 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
                          <MapPin size={12} className="text-white" />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* People Album Placeholder */}
                  <div className="group cursor-pointer opacity-50">
                    <div className="aspect-square rounded-xl bg-[#4A3552]/10 flex flex-col items-center justify-center mb-2">
                      <Users size={28} className="text-[#4A3552]/40 mb-2" />
                      <p className="text-[#4A3552]/60 text-xs">People</p>
                      <p className="text-[#4A3552]/40 text-[10px]">Coming soon</p>
                    </div>
                  </div>
                  
                  {/* Pets Album Placeholder */}
                  <div className="group cursor-pointer opacity-50">
                    <div className="aspect-square rounded-xl bg-[#C35F33]/10 flex flex-col items-center justify-center mb-2">
                      <PawPrint size={28} className="text-[#C35F33]/40 mb-2" />
                      <p className="text-[#C35F33]/60 text-xs">Pets</p>
                      <p className="text-[#C35F33]/40 text-[10px]">Coming soon</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  <div className="aspect-square rounded-xl bg-[#406A56]/5 flex flex-col items-center justify-center">
                    <MapPin size={24} className="text-[#406A56]/30 mb-1" />
                    <p className="text-[#666] text-xs">Locations</p>
                  </div>
                  <div className="aspect-square rounded-xl bg-[#4A3552]/5 flex flex-col items-center justify-center">
                    <Users size={24} className="text-[#4A3552]/30 mb-1" />
                    <p className="text-[#666] text-xs">People</p>
                  </div>
                  <div className="aspect-square rounded-xl bg-[#C35F33]/5 flex flex-col items-center justify-center">
                    <PawPrint size={24} className="text-[#C35F33]/30 mb-1" />
                    <p className="text-[#666] text-xs">Pets</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowUploadModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card-page p-6 w-full max-w-sm relative"
            >
              {/* Close button */}
              <button
                onClick={() => setShowUploadModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg bg-[#406A56]/10 hover:bg-[#406A56]/20 transition-colors"
              >
                <X size={18} className="text-[#406A56]" />
              </button>

              <h2 className="text-lg font-semibold text-[#2d2d2d] mb-2">Add Photos</h2>
              <p className="text-sm text-[#666] mb-6">Choose how you want to add photos to your gallery</p>

              <div className="space-y-3">
                {/* Upload from Device */}
                <button
                  onClick={() => {
                    setShowUploadModal(false)
                    fileInputRef.current?.click()
                  }}
                  className="w-full p-4 rounded-xl bg-[#406A56]/10 hover:bg-[#406A56]/20 transition-all group text-left flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#406A56]/20 flex items-center justify-center group-hover:bg-[#406A56]/30 transition-colors">
                    <Upload size={24} className="text-[#406A56]" />
                  </div>
                  <div>
                    <p className="font-medium text-[#2d2d2d]">Upload from Device</p>
                    <p className="text-sm text-[#666]">Select photos from your phone or computer</p>
                  </div>
                </button>

                {/* Digitize Printed Photos */}
                <button
                  onClick={() => {
                    setShowUploadModal(false)
                    setShowDigitizeModal(true)
                  }}
                  className="w-full p-4 rounded-xl bg-[#D9C61A]/10 hover:bg-[#D9C61A]/20 transition-all group text-left flex items-center gap-4 relative overflow-hidden"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#D9C61A]/20 flex items-center justify-center group-hover:bg-[#D9C61A]/30 transition-colors">
                    <Scan size={24} className="text-[#8a7c08]" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-[#2d2d2d]">Digitize Printed Photos</p>
                    <p className="text-sm text-[#666]">Scan, detect grid, and enhance old photographs</p>
                  </div>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Digitize Modal */}
      <DigitizeModal
        isOpen={showDigitizeModal}
        onClose={() => setShowDigitizeModal(false)}
        onComplete={(memoryId, count) => {
          setShowDigitizeModal(false)
          loadMedia()
        }}
      />
    </div>
  )
}
