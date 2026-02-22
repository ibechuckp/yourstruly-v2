'use client'

import { useState, useMemo } from 'react'
import { Calendar, MapPin, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface MediaItem {
  id: string
  file_url: string
  file_type: string
  location_lat: number | null
  location_lng: number | null
  exif_lat: number | null
  exif_lng: number | null
  taken_at: string | null
  memory_id: string
  memory?: {
    id: string
    title: string
    location_name: string
    location_lat: number | null
    location_lng: number | null
  }
}

interface GalleryTimelineProps {
  media: MediaItem[]
  selectedYear: number | null
  onYearSelect: (year: number | null) => void
  onMediaClick: (media: MediaItem) => void
}

export default function GalleryTimeline({ 
  media, 
  selectedYear, 
  onYearSelect,
  onMediaClick 
}: GalleryTimelineProps) {
  const [hoveredMedia, setHoveredMedia] = useState<MediaItem | null>(null)

  // Group media by year with counts
  const yearGroups = useMemo(() => {
    const groups: Record<number, MediaItem[]> = {}
    const currentYear = new Date().getFullYear()
    
    // Initialize years from 2010 to current
    for (let y = 2010; y <= currentYear; y++) {
      groups[y] = []
    }

    media.forEach(item => {
      if (item.taken_at) {
        const year = new Date(item.taken_at).getFullYear()
        if (!groups[year]) groups[year] = []
        groups[year].push(item)
      }
    })

    return groups
  }, [media])

  // Get sorted years with photos
  const yearsWithPhotos = useMemo(() => {
    return Object.entries(yearGroups)
      .filter(([_, items]) => items.length > 0)
      .sort(([a], [b]) => parseInt(b) - parseInt(a))
      .map(([year, items]) => ({
        year: parseInt(year),
        count: items.length,
        items
      }))
  }, [yearGroups])

  // Calculate max count for bar height scaling
  const maxCount = useMemo(() => {
    return Math.max(...yearsWithPhotos.map(y => y.count), 1)
  }, [yearsWithPhotos])

  // Get media for selected year (or all if none selected)
  const displayMedia = useMemo(() => {
    if (selectedYear === null) {
      return media.slice(0, 50) // Show first 50 when no year selected
    }
    return yearGroups[selectedYear] || []
  }, [media, selectedYear, yearGroups])

  return (
    <div className="gallery-photo-timeline">
      {/* Header */}
      <div className="gallery-timeline-header">
        <div>
          <h2 className="gallery-timeline-title">
            {selectedYear ? `Photos from ${selectedYear}` : 'Photo Timeline'}
          </h2>
          <p className="gallery-timeline-subtitle">
            {selectedYear 
              ? `${displayMedia.length} photos`
              : `${media.length} photos across ${yearsWithPhotos.length} years`
            }
          </p>
        </div>
        {selectedYear && (
          <button
            onClick={() => onYearSelect(null)}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
          >
            <X size={16} />
            Show All
          </button>
        )}
      </div>

      {/* Year Selector Bar - Dribbble style */}
      <div className="year-selector-bar">
        {yearsWithPhotos.map(({ year, count }) => {
          const heightPercent = Math.max((count / maxCount) * 100, 10)
          const isActive = selectedYear === year
          
          return (
            <motion.div
              key={year}
              className={`year-bar ${isActive ? 'active' : ''}`}
              onClick={() => onYearSelect(isActive ? null : year)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (new Date().getFullYear() - year) * 0.02 }}
            >
              <div 
                className="year-bar-stack"
                style={{ height: `${heightPercent}px`, minHeight: '20px', maxHeight: '100px' }}
              >
                {/* Mini photo stack preview */}
                {count > 0 && (
                  <div className="absolute inset-x-1 top-1 bottom-1 overflow-hidden rounded">
                    {yearGroups[year].slice(0, 3).map((item, i) => (
                      <div
                        key={item.id}
                        className="absolute inset-0 bg-cover bg-center opacity-20"
                        style={{
                          backgroundImage: `url(${item.file_url})`,
                          transform: `translateY(${i * 10}%)`,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
              <span className="year-bar-label">{year}</span>
              <span className="text-[9px] text-white/30 mt-1">{count}</span>
            </motion.div>
          )
        })}
      </div>

      {/* Photo Grid */}
      {displayMedia.length > 0 ? (
        <div className="gallery-photo-grid">
          <AnimatePresence mode="popLayout">
            {displayMedia.map((item, index) => (
              <motion.div
                key={item.id}
                className="gallery-photo-card"
                onClick={() => onMediaClick(item)}
                onMouseEnter={() => setHoveredMedia(item)}
                onMouseLeave={() => setHoveredMedia(null)}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: index * 0.02, duration: 0.2 }}
                layout
              >
                {item.file_type === 'video' ? (
                  <video
                    src={item.file_url}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                  />
                ) : (
                  <img
                    src={item.file_url}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                )}

                {/* Video indicator */}
                {item.file_type === 'video' && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center">
                    <div className="w-0 h-0 border-l-[6px] border-l-white border-y-[4px] border-y-transparent ml-0.5" />
                  </div>
                )}

                {/* Hover overlay */}
                <div className="gallery-photo-card-overlay">
                  {item.taken_at && (
                    <div className="gallery-photo-date">
                      <Calendar size={10} />
                      {new Date(item.taken_at).toLocaleDateString()}
                    </div>
                  )}
                  {item.memory?.location_name && (
                    <div className="gallery-photo-location">
                      <MapPin size={10} />
                      {item.memory.location_name}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4">
            <Calendar size={24} className="text-white/40" />
          </div>
          <p className="text-white/60">No photos for this period</p>
          <button
            onClick={() => onYearSelect(null)}
            className="mt-4 text-sm text-[#D9C61A] hover:underline"
          >
            Show all photos
          </button>
        </div>
      )}
    </div>
  )
}
