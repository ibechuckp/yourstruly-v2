'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, Play, Pause, SkipBack, SkipForward, 
  Download, Volume2, VolumeX, Maximize, Minimize,
  Music, ChevronLeft, ChevronRight
} from 'lucide-react'

interface SlideItem {
  id: string
  url: string
  title?: string
  description?: string
  date?: string
}

interface SlideshowPlayerProps {
  items: SlideItem[]
  title?: string
  isOpen: boolean
  onClose: () => void
  // Audio options
  voiceRecordingUrl?: string
  backgroundMusicUrl?: string
  // Settings
  autoPlay?: boolean
  slideDuration?: number // seconds
  showDownload?: boolean
  logoUrl?: string
}

// Default background music tracks
const AMBIENT_TRACKS = [
  '/audio/ambient-piano.mp3',
  '/audio/soft-strings.mp3',
  '/audio/gentle-acoustic.mp3',
]

export default function SlideshowPlayer({
  items,
  title,
  isOpen,
  onClose,
  voiceRecordingUrl,
  backgroundMusicUrl,
  autoPlay = true,
  slideDuration = 5,
  showDownload = true,
  logoUrl = '/images/yourstruly-logo.svg',
}: SlideshowPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [progress, setProgress] = useState(0)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const voiceRef = useRef<HTMLAudioElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const progressRef = useRef<NodeJS.Timeout | null>(null)

  // Total slides including final logo slide
  const totalSlides = items.length + 1
  const isLastSlide = currentIndex === items.length

  // Handle slide progression
  useEffect(() => {
    if (!isOpen || !isPlaying) return

    // Clear any existing timers
    if (timerRef.current) clearTimeout(timerRef.current)
    if (progressRef.current) clearInterval(progressRef.current)

    // Progress bar animation
    setProgress(0)
    const progressStep = 100 / (slideDuration * 20) // Update 20 times per second
    progressRef.current = setInterval(() => {
      setProgress(prev => Math.min(prev + progressStep, 100))
    }, 50)

    // Auto-advance timer
    timerRef.current = setTimeout(() => {
      if (currentIndex < items.length) {
        setCurrentIndex(prev => prev + 1)
      } else {
        // End of slideshow - loop or stop
        setIsPlaying(false)
      }
    }, slideDuration * 1000)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (progressRef.current) clearInterval(progressRef.current)
    }
  }, [currentIndex, isPlaying, isOpen, slideDuration, items.length])

  // Handle audio playback
  useEffect(() => {
    if (!isOpen) return

    // Play voice recording if available, otherwise background music
    const audio = voiceRecordingUrl ? voiceRef.current : audioRef.current
    if (audio) {
      audio.muted = isMuted
      if (isPlaying) {
        audio.play().catch(() => {})
      } else {
        audio.pause()
      }
    }
  }, [isOpen, isPlaying, isMuted, voiceRecordingUrl])

  // Cleanup on close
  useEffect(() => {
    if (!isOpen) {
      setCurrentIndex(0)
      setProgress(0)
      setIsPlaying(autoPlay)
      if (audioRef.current) audioRef.current.pause()
      if (voiceRef.current) voiceRef.current.pause()
    }
  }, [isOpen, autoPlay])

  // Keyboard controls
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case ' ':
          e.preventDefault()
          setIsPlaying(prev => !prev)
          break
        case 'ArrowLeft':
          goToPrevious()
          break
        case 'ArrowRight':
          goToNext()
          break
        case 'm':
          setIsMuted(prev => !prev)
          break
        case 'f':
          toggleFullscreen()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const goToPrevious = useCallback(() => {
    setCurrentIndex(prev => Math.max(0, prev - 1))
    setProgress(0)
  }, [])

  const goToNext = useCallback(() => {
    setCurrentIndex(prev => Math.min(items.length, prev + 1))
    setProgress(0)
  }, [items.length])

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }, [])

  const handleDownload = useCallback(async () => {
    // TODO: Generate and download video slideshow
    // For now, download current image
    const currentItem = items[currentIndex]
    if (currentItem && !isLastSlide) {
      const link = document.createElement('a')
      link.href = currentItem.url
      link.download = `${title || 'slideshow'}-${currentIndex + 1}.jpg`
      link.click()
    }
  }, [currentIndex, items, isLastSlide, title])

  if (!isOpen) return null

  const currentItem = items[currentIndex]

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black flex flex-col"
    >
      {/* Audio Elements */}
      {backgroundMusicUrl && (
        <audio ref={audioRef} src={backgroundMusicUrl} loop />
      )}
      {voiceRecordingUrl && (
        <audio ref={voiceRef} src={voiceRecordingUrl} />
      )}

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X size={20} />
            </button>
            {title && (
              <h2 className="text-white font-semibold">{title}</h2>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-white/70 text-sm">
              {currentIndex + 1} / {totalSlides}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        <AnimatePresence mode="wait">
          {isLastSlide ? (
            // Final Logo Slide
            <motion.div
              key="logo"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center justify-center gap-6"
            >
              <img 
                src={logoUrl} 
                alt="YoursTruly" 
                className="w-48 h-auto opacity-90"
              />
              <p className="text-white/60 text-lg">Document Your Life</p>
              <p className="text-white/40 text-sm">yourstruly.love</p>
            </motion.div>
          ) : (
            // Photo Slide
            <motion.div
              key={currentItem?.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.4 }}
              className="relative w-full h-full flex items-center justify-center p-8"
            >
              <img
                src={currentItem?.url}
                alt={currentItem?.title || ''}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              />
              
              {/* Photo Info Overlay */}
              {(currentItem?.title || currentItem?.date) && (
                <div className="absolute bottom-16 left-0 right-0 px-8">
                  <div className="bg-black/40 backdrop-blur-sm rounded-lg p-4 max-w-md mx-auto text-center">
                    {currentItem?.title && (
                      <h3 className="text-white font-semibold mb-1">{currentItem.title}</h3>
                    )}
                    {currentItem?.date && (
                      <p className="text-white/70 text-sm">{currentItem.date}</p>
                    )}
                    {currentItem?.description && (
                      <p className="text-white/60 text-sm mt-2">{currentItem.description}</p>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Arrows */}
        <button
          onClick={goToPrevious}
          disabled={currentIndex === 0}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft size={24} />
        </button>
        <button
          onClick={goToNext}
          disabled={isLastSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-20 left-8 right-8">
        <div className="flex gap-1">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <div 
              key={i}
              className="flex-1 h-1 rounded-full bg-white/20 overflow-hidden cursor-pointer"
              onClick={() => {
                setCurrentIndex(i)
                setProgress(0)
              }}
            >
              <div 
                className="h-full bg-white transition-all duration-100"
                style={{ 
                  width: i < currentIndex ? '100%' : i === currentIndex ? `${progress}%` : '0%'
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={goToPrevious}
            disabled={currentIndex === 0}
            className="p-2 rounded-full hover:bg-white/10 text-white disabled:opacity-30 transition-colors"
          >
            <SkipBack size={20} />
          </button>
          
          <button
            onClick={() => setIsPlaying(prev => !prev)}
            className="p-4 rounded-full bg-white text-black hover:bg-white/90 transition-colors"
          >
            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
          </button>
          
          <button
            onClick={goToNext}
            disabled={isLastSlide}
            className="p-2 rounded-full hover:bg-white/10 text-white disabled:opacity-30 transition-colors"
          >
            <SkipForward size={20} />
          </button>

          <div className="w-px h-6 bg-white/20 mx-2" />

          <button
            onClick={() => setIsMuted(prev => !prev)}
            className="p-2 rounded-full hover:bg-white/10 text-white transition-colors"
          >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-full hover:bg-white/10 text-white transition-colors"
          >
            {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
          </button>

          {showDownload && (
            <button
              onClick={handleDownload}
              className="p-2 rounded-full hover:bg-white/10 text-white transition-colors"
              title="Download"
            >
              <Download size={20} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

/**
 * PlayButton overlay component for albums/memories
 */
export function PlayButtonOverlay({
  onClick,
  size = 'md',
  className = '',
}: {
  onClick: () => void
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const sizes = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
  }

  const iconSizes = {
    sm: 16,
    md: 24,
    lg: 32,
  }

  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={`
        absolute inset-0 flex items-center justify-center 
        bg-black/30 opacity-0 hover:opacity-100 
        transition-opacity duration-200
        ${className}
      `}
    >
      <div className={`
        ${sizes[size]} 
        rounded-full bg-white/90 backdrop-blur-sm 
        flex items-center justify-center
        shadow-lg hover:scale-110 transition-transform
      `}>
        <Play size={iconSizes[size]} className="text-[#406A56] ml-1" />
      </div>
    </button>
  )
}
