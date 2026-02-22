'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft, Image as ImageIcon, X, MapPin, Calendar, Camera } from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import GalleryUpload from '@/components/gallery/GalleryUpload'
import GalleryTimelineFilter from '@/components/gallery/GalleryTimelineFilter'
import GalleryTimeline from '@/components/gallery/GalleryTimeline'
import '@/styles/page-styles.css'
import '@/styles/gallery.css'

// Dynamic import for globe to avoid SSR issues with mapbox
const GalleryGlobe = dynamic(() => import('@/components/gallery/GalleryGlobe'), {
  ssr: false,
  loading: () => (
    <div className="gallery-globe-section flex items-center justify-center">
      <div className="text-white/50">Loading globe...</div>
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

interface PreviewMedia extends MediaItem {
  prevId?: string
  nextId?: string
}

export default function GalleryPage() {
  const [media, setMedia] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTimeframe, setSelectedTimeframe] = useState<{ year?: number; month?: number } | null>(null)
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [previewMedia, setPreviewMedia] = useState<PreviewMedia | null>(null)
  const supabase = createClient()

  const loadMedia = useCallback(async () => {
    setLoading(true)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('memory_media')
      .select(`
        id,
        file_url,
        file_type,
        exif_lat,
        exif_lng,
        taken_at,
        memory_id,
        memory:memories(id, title, location_name, location_lat, location_lng)
      `)
      .eq('user_id', user.id)
      .order('taken_at', { ascending: false, nullsFirst: false })

    if (error) {
      console.error('Error loading media:', error)
      setLoading(false)
      return
    }

    // Transform data to include location from either EXIF or memory
    const transformedMedia: MediaItem[] = (data || []).map(item => ({
      ...item,
      memory: item.memory ? (Array.isArray(item.memory) ? item.memory[0] : item.memory) : undefined,
      location_lat: item.exif_lat || (item.memory as any)?.location_lat || null,
      location_lng: item.exif_lng || (item.memory as any)?.location_lng || null,
    }))

    setMedia(transformedMedia)
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    loadMedia()
  }, [loadMedia])

  // Handle media click for preview
  const handleMediaClick = (item: MediaItem) => {
    const currentIndex = media.findIndex(m => m.id === item.id)
    setPreviewMedia({
      ...item,
      prevId: currentIndex > 0 ? media[currentIndex - 1].id : undefined,
      nextId: currentIndex < media.length - 1 ? media[currentIndex + 1].id : undefined,
    })
  }

  // Navigate preview
  const navigatePreview = (direction: 'prev' | 'next') => {
    if (!previewMedia) return
    const targetId = direction === 'prev' ? previewMedia.prevId : previewMedia.nextId
    if (!targetId) return
    
    const targetMedia = media.find(m => m.id === targetId)
    if (targetMedia) {
      handleMediaClick(targetMedia)
    }
  }

  // Sync timeline filter with globe
  const handleTimeframeSelect = (tf: { year?: number; month?: number } | null) => {
    setSelectedTimeframe(tf)
    // Also update year selection in timeline
    setSelectedYear(tf?.year || null)
  }

  // Stats
  const mediaWithLocation = media.filter(m => m.location_lat && m.location_lng)
  const yearsCount = new Set(media.filter(m => m.taken_at).map(m => new Date(m.taken_at!).getFullYear())).size

  return (
    <div className="page-container">
      {/* Background */}
      <div className="page-background">
        <div className="page-blob page-blob-1" />
        <div className="page-blob page-blob-2" />
        <div className="page-blob page-blob-3" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="page-header-back">
                <ChevronLeft size={20} />
              </Link>
              <div>
                <h1 className="page-header-title">Gallery</h1>
                <p className="page-header-subtitle">
                  {media.length} photos & videos • {mediaWithLocation.length} with location • {yearsCount} years
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Upload Section */}
        <GalleryUpload onUploadComplete={loadMedia} />

        {/* Timeline Filter */}
        {!loading && media.length > 0 && (
          <GalleryTimelineFilter
            media={media}
            selectedTimeframe={selectedTimeframe}
            onTimeframeSelect={handleTimeframeSelect}
          />
        )}

        {/* Main Content */}
        {loading ? (
          <div className="loading-container">
            <div className="loading-text">Loading gallery...</div>
          </div>
        ) : media.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <ImageIcon size={32} className="text-[#406A56]/50" />
            </div>
            <h3 className="empty-state-title">No photos yet</h3>
            <p className="empty-state-text">
              Upload your first photos to see them on the globe
            </p>
          </div>
        ) : (
          <>
            {/* Globe View */}
            <GalleryGlobe
              media={media}
              selectedTimeframe={selectedTimeframe}
              onSelectMedia={handleMediaClick}
            />

            {/* Dribbble-style Timeline */}
            <GalleryTimeline
              media={media}
              selectedYear={selectedYear}
              onYearSelect={setSelectedYear}
              onMediaClick={handleMediaClick}
            />
          </>
        )}
      </div>

      {/* Preview Modal */}
      {previewMedia && (
        <div 
          className="gallery-preview-modal"
          onClick={() => setPreviewMedia(null)}
        >
          <div 
            className="gallery-preview-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewMedia(null)}
              className="gallery-preview-close"
            >
              <X size={20} />
            </button>

            {/* Navigation buttons */}
            {previewMedia.prevId && (
              <button
                onClick={() => navigatePreview('prev')}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-all"
              >
                <ChevronLeft size={24} />
              </button>
            )}
            {previewMedia.nextId && (
              <button
                onClick={() => navigatePreview('next')}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-all rotate-180"
              >
                <ChevronLeft size={24} />
              </button>
            )}

            {previewMedia.file_type === 'video' ? (
              <video
                src={previewMedia.file_url}
                className="gallery-preview-image"
                controls
                autoPlay
              />
            ) : (
              <img
                src={previewMedia.file_url}
                alt=""
                className="gallery-preview-image"
              />
            )}

            <div className="gallery-preview-info">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">
                  {previewMedia.memory?.title || 'Photo'}
                </h3>
                {previewMedia.memory?.id && (
                  <Link
                    href={`/dashboard/memories/${previewMedia.memory.id}`}
                    className="text-sm text-[#D9C61A] hover:underline"
                  >
                    View Memory →
                  </Link>
                )}
              </div>
              
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-white/70">
                {previewMedia.taken_at && (
                  <span className="flex items-center gap-1">
                    <Calendar size={14} />
                    {new Date(previewMedia.taken_at).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                )}
                {previewMedia.memory?.location_name && (
                  <span className="flex items-center gap-1">
                    <MapPin size={14} />
                    {previewMedia.memory.location_name}
                  </span>
                )}
                {previewMedia.location_lat && previewMedia.location_lng && (
                  <span className="flex items-center gap-1 text-[#D9C61A]">
                    <Camera size={14} />
                    GPS: {previewMedia.location_lat.toFixed(4)}, {previewMedia.location_lng.toFixed(4)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
