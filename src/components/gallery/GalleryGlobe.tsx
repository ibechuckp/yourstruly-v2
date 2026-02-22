'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

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

interface GalleryGlobeProps {
  media: MediaItem[]
  onSelectMedia?: (media: MediaItem) => void
  selectedTimeframe?: { year?: number; month?: number } | null
}

export default function GalleryGlobe({ media, onSelectMedia, selectedTimeframe }: GalleryGlobeProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])
  const [loaded, setLoaded] = useState(false)

  // Filter media by timeframe
  const filteredMedia = selectedTimeframe
    ? media.filter(m => {
        if (!m.taken_at) return false
        const date = new Date(m.taken_at)
        if (selectedTimeframe.year && date.getFullYear() !== selectedTimeframe.year) return false
        if (selectedTimeframe.month && date.getMonth() + 1 !== selectedTimeframe.month) return false
        return true
      })
    : media

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      projection: 'globe',
      zoom: 1.5,
      center: [0, 20],
      pitch: 0,
    })

    map.current.on('style.load', () => {
      map.current?.setFog({
        color: 'rgb(20, 20, 30)',
        'high-color': 'rgb(40, 40, 60)',
        'horizon-blend': 0.1,
        'space-color': 'rgb(10, 10, 15)',
        'star-intensity': 0.6,
      })
      setLoaded(true)
    })

    // Slow rotation
    const secondsPerRevolution = 240
    const maxSpinZoom = 5
    let userInteracting = false
    let spinEnabled = true

    function spinGlobe() {
      if (!map.current) return
      const zoom = map.current.getZoom()
      if (spinEnabled && !userInteracting && zoom < maxSpinZoom) {
        let distancePerSecond = 360 / secondsPerRevolution
        if (zoom > maxSpinZoom - 1) {
          distancePerSecond *= (maxSpinZoom - zoom)
        }
        const center = map.current.getCenter()
        center.lng -= distancePerSecond / 60
        map.current.easeTo({ center, duration: 1000, easing: (n) => n })
      }
    }

    map.current.on('mousedown', () => { userInteracting = true })
    map.current.on('mouseup', () => { userInteracting = false; spinGlobe() })
    map.current.on('dragend', () => { userInteracting = false; spinGlobe() })
    map.current.on('pitchend', spinGlobe)
    map.current.on('rotateend', spinGlobe)
    map.current.on('moveend', spinGlobe)

    spinGlobe()

    return () => {
      map.current?.remove()
      map.current = null
    }
  }, [])

  // Simple clustering function
  const clusterMedia = useCallback((items: MediaItem[]) => {
    const mediaWithLocation = items.filter(m => m.location_lat && m.location_lng)
    const clusters: { center: [number, number]; items: MediaItem[] }[] = []
    const used = new Set<string>()

    // Simple distance-based clustering
    const clusterRadius = 5 // degrees

    mediaWithLocation.forEach(item => {
      if (used.has(item.id)) return

      const cluster = {
        center: [item.location_lng!, item.location_lat!] as [number, number],
        items: [item]
      }

      // Find nearby items
      mediaWithLocation.forEach(other => {
        if (used.has(other.id) || other.id === item.id) return

        const dist = Math.sqrt(
          Math.pow(item.location_lat! - other.location_lat!, 2) +
          Math.pow(item.location_lng! - other.location_lng!, 2)
        )

        if (dist < clusterRadius) {
          cluster.items.push(other)
          used.add(other.id)
        }
      })

      used.add(item.id)
      clusters.push(cluster)
    })

    return clusters
  }, [])

  // Add markers when media changes
  useEffect(() => {
    if (!map.current || !loaded) return

    // Remove existing markers
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    const clusters = clusterMedia(filteredMedia)

    clusters.forEach((cluster) => {
      const coverItem = cluster.items[0]
      const isCluster = cluster.items.length > 1

      // Create custom marker element
      const el = document.createElement('div')
      el.className = 'gallery-marker'
      el.style.cssText = `
        width: ${isCluster ? '50px' : '44px'};
        height: ${isCluster ? '50px' : '44px'};
        border-radius: 50%;
        border: 3px solid ${isCluster ? '#D9C61A' : '#406A56'};
        background-size: cover;
        background-position: center;
        cursor: pointer;
        box-shadow: 0 4px 15px rgba(0,0,0,0.4);
        transition: transform 0.2s, box-shadow 0.2s;
        position: relative;
      `

      if (coverItem.file_url) {
        el.style.backgroundImage = `url(${coverItem.file_url})`
      } else {
        el.style.backgroundColor = '#1f2937'
        el.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:18px;">📍</div>'
      }

      // Cluster count badge
      if (isCluster) {
        const badge = document.createElement('div')
        badge.style.cssText = `
          position: absolute;
          top: -6px;
          right: -6px;
          width: 22px;
          height: 22px;
          background: #D9C61A;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          color: #1a1a2e;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        `
        badge.textContent = cluster.items.length > 99 ? '99+' : cluster.items.length.toString()
        el.appendChild(badge)
      }

      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.2)'
        el.style.boxShadow = '0 8px 25px rgba(0,0,0,0.5)'
        el.style.zIndex = '100'
      })
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)'
        el.style.boxShadow = '0 4px 15px rgba(0,0,0,0.4)'
        el.style.zIndex = '1'
      })
      el.addEventListener('click', () => {
        if (isCluster && cluster.items.length <= 5) {
          // For small clusters, show first item
          onSelectMedia?.(cluster.items[0])
        } else {
          onSelectMedia?.(coverItem)
        }
      })

      // Create popup
      const popupContent = isCluster
        ? `
          <div style="padding: 8px; min-width: 120px;">
            <p style="font-weight: 600; color: white; margin: 0 0 4px 0;">${cluster.items.length} Photos</p>
            <p style="font-size: 12px; color: #9ca3af; margin: 0;">Click to view</p>
          </div>
        `
        : `
          <div style="padding: 8px; max-width: 200px;">
            <p style="font-weight: 600; color: white; margin: 0 0 4px 0;">${coverItem.memory?.title || 'Photo'}</p>
            <p style="font-size: 12px; color: #9ca3af; margin: 0;">${coverItem.memory?.location_name || ''}</p>
            ${coverItem.taken_at ? `<p style="font-size: 11px; color: #6b7280; margin: 4px 0 0 0;">${new Date(coverItem.taken_at).toLocaleDateString()}</p>` : ''}
          </div>
        `

      const popup = new mapboxgl.Popup({ offset: 25, closeButton: false })
        .setHTML(popupContent)

      const marker = new mapboxgl.Marker(el)
        .setLngLat(cluster.center)
        .setPopup(popup)
        .addTo(map.current!)

      markersRef.current.push(marker)
    })

  }, [filteredMedia, loaded, onSelectMedia, clusterMedia])

  // Stats
  const mediaWithLocation = filteredMedia.filter(m => m.location_lat && m.location_lng)
  const uniqueLocations = new Set(mediaWithLocation.map(m => `${m.location_lat?.toFixed(1)},${m.location_lng?.toFixed(1)}`))

  return (
    <div className="gallery-globe-section">
      <div ref={mapContainer} className="w-full h-full" />
      <div className="gallery-globe-overlay" />

      {/* Stats overlay */}
      <div className="globe-stats-overlay">
        <div className="globe-stat-card">
          <div className="globe-stat-value">{mediaWithLocation.length}</div>
          <div className="globe-stat-label">Photos on Map</div>
        </div>
        <div className="globe-stat-card">
          <div className="globe-stat-value">{uniqueLocations.size}</div>
          <div className="globe-stat-label">Locations</div>
        </div>
        <div className="globe-stat-card">
          <div className="globe-stat-value">{filteredMedia.length - mediaWithLocation.length}</div>
          <div className="globe-stat-label">No Location</div>
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2">
        <p className="text-white/60 text-xs">Drag to explore • Click markers to view</p>
      </div>
    </div>
  )
}
