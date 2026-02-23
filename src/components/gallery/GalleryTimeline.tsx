'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { Search } from 'lucide-react'
import gsap from 'gsap'

interface MediaItem {
  id: string
  file_url: string
  file_type: string
  location_lat: number | null
  location_lng: number | null
  taken_at: string | null
  memory_id: string
  memory?: {
    id: string
    title: string
    location_name: string
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
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const cardsContainerRef = useRef<HTMLDivElement>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const dragState = useRef({ startX: 0, scrollLeft: 0, moved: false })

  // Group by year
  const yearGroups = useMemo(() => {
    const groups: Record<number, MediaItem[]> = {}
    media.forEach(item => {
      if (item.taken_at) {
        const year = new Date(item.taken_at).getFullYear()
        if (!groups[year]) groups[year] = []
        groups[year].push(item)
      }
    })
    return groups
  }, [media])

  const years = useMemo(() => 
    Object.keys(yearGroups).map(Number).sort((a, b) => b - a),
    [yearGroups]
  )

  // Display cards
  const displayCards = useMemo(() => {
    const targetMedia = selectedYear ? (yearGroups[selectedYear] || []) : media
    
    const filtered = searchQuery 
      ? targetMedia.filter(m => 
          m.memory?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.memory?.location_name?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : targetMedia

    // Group by memory
    const cardMap = new Map<string, { items: MediaItem[], title: string, location: string }>()
    filtered.forEach(item => {
      const key = item.memory_id || item.id
      if (!cardMap.has(key)) {
        cardMap.set(key, {
          items: [],
          title: item.memory?.title || 'Memory',
          location: item.memory?.location_name || ''
        })
      }
      cardMap.get(key)!.items.push(item)
    })

    return Array.from(cardMap.values()).slice(0, 12)
  }, [media, selectedYear, yearGroups, searchQuery])

  // GSAP scroll-based 3D effect
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const updateCards = () => {
      const cards = container.querySelectorAll('.tl-card') as NodeListOf<HTMLElement>
      const containerRect = container.getBoundingClientRect()
      const containerCenter = containerRect.left + containerRect.width / 2

      cards.forEach((card) => {
        const cardRect = card.getBoundingClientRect()
        const cardCenter = cardRect.left + cardRect.width / 2
        const distance = cardCenter - containerCenter
        const maxDistance = containerRect.width / 2
        const progress = Math.max(-1, Math.min(1, distance / maxDistance))

        // 3D transforms based on position
        const rotateY = progress * 25
        const translateZ = (1 - Math.abs(progress)) * 50
        const scale = 1 - Math.abs(progress) * 0.12
        const opacity = 1 - Math.abs(progress) * 0.35

        gsap.set(card, {
          rotateY,
          z: translateZ,
          scale,
          opacity,
          transformPerspective: 1000,
          transformOrigin: 'center center'
        })
      })
    }

    // Initial + scroll updates
    updateCards()
    container.addEventListener('scroll', updateCards)
    window.addEventListener('resize', updateCards)

    return () => {
      container.removeEventListener('scroll', updateCards)
      window.removeEventListener('resize', updateCards)
    }
  }, [displayCards])

  // Drag to scroll
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return
    setIsDragging(true)
    dragState.current = {
      startX: e.pageX - scrollContainerRef.current.offsetLeft,
      scrollLeft: scrollContainerRef.current.scrollLeft,
      moved: false
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return
    e.preventDefault()
    const x = e.pageX - scrollContainerRef.current.offsetLeft
    const walk = (x - dragState.current.startX) * 1.5
    if (Math.abs(walk) > 5) dragState.current.moved = true
    scrollContainerRef.current.scrollLeft = dragState.current.scrollLeft - walk
  }

  const handleMouseUp = () => setIsDragging(false)

  const handleCardClick = (item: MediaItem) => {
    if (!dragState.current.moved) {
      onMediaClick(item)
    }
    dragState.current.moved = false
  }

  return (
    <div className="tl-section">
      {/* Header */}
      <div className="tl-header">
        <h2 className="tl-title">My Timeline</h2>
        
        <div className="tl-header-right">
          {showSearch ? (
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search memories..."
              className="tl-search-input"
              autoFocus
              onBlur={() => !searchQuery && setShowSearch(false)}
            />
          ) : (
            <button onClick={() => setShowSearch(true)} className="tl-search-btn">
              <Search size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Cards Carousel */}
      <div 
        ref={scrollContainerRef}
        className="tl-scroll-container"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div ref={cardsContainerRef} className="tl-cards-track">
          {/* Spacer for centering */}
          <div className="tl-spacer" />
          
          {displayCards.map((card, index) => {
            const coverImage = card.items[0]
            return (
              <div
                key={coverImage.id}
                className="tl-card"
                onClick={() => handleCardClick(coverImage)}
              >
                {/* Card Content */}
                <div className="tl-card-inner">
                  {coverImage.file_type === 'video' ? (
                    <video
                      src={coverImage.file_url}
                      className="tl-card-media"
                      muted
                      playsInline
                      loop
                      onMouseEnter={(e) => e.currentTarget.play()}
                      onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0 }}
                    />
                  ) : (
                    <img
                      src={coverImage.file_url}
                      alt={card.title}
                      className="tl-card-media"
                      draggable={false}
                    />
                  )}
                  
                  {/* Gradient overlay */}
                  <div className="tl-card-overlay" />
                  
                  {/* Count badge */}
                  {card.items.length > 1 && (
                    <div className="tl-card-badge">+{card.items.length - 1}</div>
                  )}
                  
                  {/* Label */}
                  <div className="tl-card-label">
                    <span className="tl-card-title">{card.title}</span>
                    {card.location && (
                      <span className="tl-card-location">{card.location}</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
          
          {/* Spacer for centering */}
          <div className="tl-spacer" />
        </div>
      </div>

      {/* Year Selector Bar */}
      <div className="tl-years-bar">
        <div className="tl-years-track">
          <button
            onClick={() => onYearSelect(null)}
            className={`tl-year-btn ${selectedYear === null ? 'active' : ''}`}
          >
            All
          </button>
          {years.map(year => (
            <button
              key={year}
              onClick={() => onYearSelect(year === selectedYear ? null : year)}
              className={`tl-year-btn ${selectedYear === year ? 'active' : ''}`}
            >
              {year}
              {selectedYear === year && <span className="tl-year-dot" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
