'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft, Image as ImageIcon, MapPin, Plus, Users, PawPrint, Upload, Scan, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import TimelineRuler from '@/components/gallery/TimelineRuler'
import DigitizeModal from '@/components/gallery/DigitizeModal'
import PhotoMetadataModal from '@/components/gallery/PhotoMetadataModal'
import PhotoPreviewPanel from '@/components/gallery/PhotoPreviewPanel'
import OrbitalCarousel from '@/components/gallery/OrbitalCarousel'
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
  const [previewMedia, setPreviewMedia] = useState<MediaItem | null>(null)
  const [uploading, setUploading] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showDigitizeModal, setShowDigitizeModal] = useState(false)
  const [editingMedia, setEditingMedia] = useState<MediaItem | null>(null)
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

  // Auto-albums based on locations, dates, etc.
  const autoAlbums = useMemo(() => {
    const albums: Array<{ name: string; count: number; cover: string; type: 'location' | 'time' | 'recent' }> = []
    
    // 1. Location-based albums
    const locationAlbums: Record<string, MediaItem[]> = {}
    media.forEach(m => {
      if (m.memory?.location_name) {
        const loc = m.memory.location_name
        if (!locationAlbums[loc]) locationAlbums[loc] = []
        locationAlbums[loc].push(m)
      }
    })
    
    Object.entries(locationAlbums)
      .filter(([_, items]) => items.length >= 2)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 4)
      .forEach(([name, items]) => {
        albums.push({
          name,
          count: items.length,
          cover: items[0].file_url,
          type: 'location'
        })
      })
    
    // 2. Year-based albums (if we have dated photos)
    const yearAlbums: Record<number, MediaItem[]> = {}
    media.forEach(m => {
      if (m.taken_at) {
        const year = new Date(m.taken_at).getFullYear()
        if (!yearAlbums[year]) yearAlbums[year] = []
        yearAlbums[year].push(m)
      }
    })
    
    Object.entries(yearAlbums)
      .filter(([_, items]) => items.length >= 3)
      .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
      .slice(0, 3)
      .forEach(([year, items]) => {
        albums.push({
          name: `Year ${year}`,
          count: items.length,
          cover: items[0].file_url,
          type: 'time'
        })
      })
    
    // 3. Recent Photos album (always show if we have any media)
    if (media.length >= 3 && albums.length < 6) {
      albums.push({
        name: 'Recent Photos',
        count: Math.min(media.length, 20),
        cover: media[0].file_url,
        type: 'recent'
      })
    }
    
    return albums.slice(0, 6)
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
    setPreviewMedia(item)
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

  const handleSaveMetadata = async (updates: { taken_at?: string; exif_lat?: number; exif_lng?: number; location_name?: string }) => {
    if (!editingMedia) return
    
    console.log('Saving metadata for media:', editingMedia.id, updates)
    
    const res = await fetch(`/api/media/${editingMedia.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    
    const result = await res.json()
    console.log('Save result:', result)
    
    if (!res.ok) {
      console.error('Save failed:', result)
      throw new Error('Failed to save')
    }
    
    // Reload media to show updated data
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
            className="glass-card w-14 h-14 flex items-center justify-center cursor-pointer hover:bg-white/90 transition-all self-start"
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
          <div className="glass-card p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-[#406A56]/10 rounded-full flex items-center justify-center">
              <ImageIcon size={32} className="text-[#406A56]/50" />
            </div>
            <h3 className="text-lg font-semibold text-[#2d2d2d] mb-2">No photos yet</h3>
            <p className="text-[#666]">Upload your first photos to see them on the globe</p>
          </div>
        ) : (
          <>
            {/* Globe - Full Width */}
            <div className="glass-card p-0 overflow-hidden mb-5">
              <GalleryGlobe
                media={media}
                selectedTimeframe={selectedYearRange ? { yearRange: selectedYearRange } : null}
                onSelectMedia={handleGlobeSelect}
              />
            </div>

            {/* All Photos Grid */}
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[#2d2d2d]">All Photos</h3>
                <p className="text-xs text-[#666]">{media.length} photos</p>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {media.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleGlobeSelect(item)}
                    className="bubble-tile aspect-square rounded-xl overflow-hidden cursor-pointer hover:ring-2 hover:ring-[#406A56] transition-all relative group"
                  >
                    <img
                      src={item.file_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    {/* Edit button on hover */}
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingMedia(item); }}
                      className="absolute top-2 right-2 w-6 h-6 bg-black/50 backdrop-blur rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                      title="Edit date & location"
                    >
                      <span className="text-white text-xs">✏️</span>
                    </button>
                    {/* Missing data indicator */}
                    {(!item.taken_at || (!item.exif_lat && !item.location_lat)) && (
                      <div className="absolute top-2 left-2 w-5 h-5 bg-amber-500/90 backdrop-blur rounded-full flex items-center justify-center" title="Missing date or location">
                        <span className="text-white text-[10px]">!</span>
                      </div>
                    )}
                    {(item.location_lat && item.location_lng) || (item.exif_lat && item.exif_lng) ? (
                      <div className="absolute bottom-2 right-2 w-5 h-5 bg-white/80 backdrop-blur rounded-full flex items-center justify-center">
                        <MapPin size={10} className="text-[#406A56]" />
                      </div>
                    ) : null}
                    {item.taken_at && (
                      <div className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-black/50 backdrop-blur rounded text-[8px] text-white">
                        {new Date(item.taken_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Orbital Album Carousel - Show with 2+ albums */}
            {autoAlbums.length >= 2 && (
              <div className="glass-card p-5 mt-5 overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-[#2d2d2d]">Your Albums</h3>
                  <p className="text-xs text-[#666]">Drag or click to explore</p>
                </div>

                <OrbitalCarousel
                  albums={autoAlbums.map((album, i) => ({
                    id: `album-${i}`,
                    name: album.name,
                    cover: album.cover,
                    count: album.count,
                    type: album.type,
                    images: album.type === 'location'
                      ? media.filter(m => m.memory?.location_name === album.name).map(m => m.file_url)
                      : album.type === 'time'
                      ? media.filter(m => m.taken_at && new Date(m.taken_at).getFullYear().toString() === album.name.replace('Year ', '')).map(m => m.file_url)
                      : media.slice(0, 20).map(m => m.file_url)
                  }))}
                  onAlbumClick={(album) => console.log('Album clicked:', album)}
                />
              </div>
            )}

            {/* Smart Albums Grid (fallback for fewer albums) */}
            {autoAlbums.length > 0 && autoAlbums.length < 3 && (
              <div className="glass-card p-5 mt-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-[#2d2d2d]">Smart Albums</h3>
                  <p className="text-xs text-[#666]">Auto-generated from your photos</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  {autoAlbums.map((album, i) => (
                    <div
                      key={i}
                      className="bubble-tile glass-card group cursor-pointer overflow-hidden"
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
                  <div className="bubble-tile glass-card group cursor-pointer opacity-50 overflow-hidden">
                    <div className="aspect-square rounded-xl bg-[#4A3552]/10 flex flex-col items-center justify-center mb-2">
                      <Users size={28} className="text-[#4A3552]/40 mb-2" />
                      <p className="text-[#4A3552]/60 text-xs">People</p>
                      <p className="text-[#4A3552]/40 text-[10px]">Coming soon</p>
                    </div>
                  </div>

                  {/* Pets Album Placeholder */}
                  <div className="bubble-tile glass-card group cursor-pointer opacity-50 overflow-hidden">
                    <div className="aspect-square rounded-xl bg-[#C35F33]/10 flex flex-col items-center justify-center mb-2">
                      <PawPrint size={28} className="text-[#C35F33]/40 mb-2" />
                      <p className="text-[#C35F33]/60 text-xs">Pets</p>
                      <p className="text-[#C35F33]/40 text-[10px]">Coming soon</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Empty state for no albums */}
            {autoAlbums.length === 0 && (
              <div className="glass-card p-5 mt-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-[#2d2d2d]">Smart Albums</h3>
                  <p className="text-xs text-[#666]">Add location data to photos to create albums</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bubble-tile glass-card aspect-square flex flex-col items-center justify-center">
                    <MapPin size={24} className="text-[#406A56]/30 mb-1" />
                    <p className="text-[#666] text-xs">Locations</p>
                  </div>
                  <div className="bubble-tile glass-card aspect-square flex flex-col items-center justify-center">
                    <Users size={24} className="text-[#4A3552]/30 mb-1" />
                    <p className="text-[#666] text-xs">People</p>
                  </div>
                  <div className="bubble-tile glass-card aspect-square flex flex-col items-center justify-center">
                    <PawPrint size={24} className="text-[#C35F33]/30 mb-1" />
                    <p className="text-[#666] text-xs">Pets</p>
                  </div>
                </div>
              </div>
            )}
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
              className="glass-card p-6 w-full max-w-sm relative"
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

      {/* Photo Metadata Editor */}
      {editingMedia && (
        <PhotoMetadataModal
          media={editingMedia}
          onClose={() => setEditingMedia(null)}
          onSave={handleSaveMetadata}
        />
      )}

      {/* Photo Preview Panel */}
      {previewMedia && (
        <PhotoPreviewPanel
          media={previewMedia}
          allMedia={media}
          onClose={() => setPreviewMedia(null)}
          onNavigate={(m) => setPreviewMedia(m)}
          onEdit={(m) => {
            setPreviewMedia(null)
            setEditingMedia(m)
          }}
        />
      )}
    </div>
  )
}
