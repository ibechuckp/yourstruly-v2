'use client'

import { useState, useRef, useCallback, useEffect, useMemo } from 'react'

interface TimelineRulerProps {
  years: number[]
  yearCounts: Record<number, number>
  selectedRange: [number, number] | null
  onRangeChange: (range: [number, number] | null) => void
}

export default function TimelineRuler({ 
  years, 
  yearCounts, 
  selectedRange, 
  onRangeChange 
}: TimelineRulerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState<'left' | 'right' | 'range' | null>(null)
  const [dragStartX, setDragStartX] = useState(0)
  const [dragStartRange, setDragStartRange] = useState<[number, number] | null>(null)
  
  // Sort years ascending for the ruler
  const sortedYears = useMemo(() => [...years].sort((a, b) => a - b), [years])
  const minYear = sortedYears[0]
  const maxYear = sortedYears[sortedYears.length - 1]
  
  // Calculate max photo count for dot sizing
  const maxCount = useMemo(() => Math.max(...Object.values(yearCounts), 1), [yearCounts])
  
  // Convert year to position percentage
  const yearToPercent = useCallback((year: number) => {
    if (sortedYears.length <= 1) return 50
    return ((year - minYear) / (maxYear - minYear)) * 100
  }, [sortedYears, minYear, maxYear])
  
  // Convert position percentage to nearest year
  const percentToYear = useCallback((percent: number) => {
    const exactYear = minYear + (percent / 100) * (maxYear - minYear)
    // Snap to nearest year
    return Math.round(Math.max(minYear, Math.min(maxYear, exactYear)))
  }, [minYear, maxYear])
  
  // Handle mouse/touch down on handles
  const handleMouseDown = useCallback((e: React.MouseEvent | React.TouchEvent, type: 'left' | 'right' | 'range') => {
    e.preventDefault()
    e.stopPropagation()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    setIsDragging(type)
    setDragStartX(clientX)
    setDragStartRange(selectedRange)
  }, [selectedRange])
  
  // Handle mouse/touch move
  useEffect(() => {
    if (!isDragging || !trackRef.current || !dragStartRange) return
    
    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const rect = trackRef.current!.getBoundingClientRect()
      const trackWidth = rect.width
      const deltaX = clientX - dragStartX
      const deltaPercent = (deltaX / trackWidth) * 100
      const deltaYears = Math.round(deltaPercent / 100 * (maxYear - minYear))
      
      let newStart = dragStartRange[0]
      let newEnd = dragStartRange[1]
      
      if (isDragging === 'left') {
        newStart = Math.max(minYear, Math.min(dragStartRange[1] - 1, dragStartRange[0] + deltaYears))
      } else if (isDragging === 'right') {
        newEnd = Math.min(maxYear, Math.max(dragStartRange[0] + 1, dragStartRange[1] + deltaYears))
      } else if (isDragging === 'range') {
        const rangeSize = dragStartRange[1] - dragStartRange[0]
        newStart = Math.max(minYear, Math.min(maxYear - rangeSize, dragStartRange[0] + deltaYears))
        newEnd = newStart + rangeSize
      }
      
      onRangeChange([newStart, newEnd])
    }
    
    const handleUp = () => {
      setIsDragging(null)
    }
    
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    window.addEventListener('touchmove', handleMove)
    window.addEventListener('touchend', handleUp)
    
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
      window.removeEventListener('touchmove', handleMove)
      window.removeEventListener('touchend', handleUp)
    }
  }, [isDragging, dragStartX, dragStartRange, minYear, maxYear, onRangeChange])
  
  // Click on track to set single year or move range
  const handleTrackClick = useCallback((e: React.MouseEvent) => {
    if (!trackRef.current) return
    const rect = trackRef.current.getBoundingClientRect()
    const percent = ((e.clientX - rect.left) / rect.width) * 100
    const year = percentToYear(percent)
    
    if (!selectedRange) {
      // Set new single-year selection
      onRangeChange([year, year])
    } else {
      // Expand or move to clicked year
      if (year < selectedRange[0]) {
        onRangeChange([year, selectedRange[1]])
      } else if (year > selectedRange[1]) {
        onRangeChange([selectedRange[0], year])
      }
    }
  }, [selectedRange, percentToYear, onRangeChange])
  
  // Clear selection
  const handleClear = useCallback(() => {
    onRangeChange(null)
  }, [onRangeChange])
  
  // Year markers with tick marks
  const yearMarkers = useMemo(() => {
    const markers: { year: number; percent: number; major: boolean }[] = []
    
    sortedYears.forEach(year => {
      markers.push({
        year,
        percent: yearToPercent(year),
        major: true
      })
    })
    
    return markers
  }, [sortedYears, yearToPercent])

  const selectedStart = selectedRange ? yearToPercent(selectedRange[0]) : 0
  const selectedEnd = selectedRange ? yearToPercent(selectedRange[1]) : 0
  const selectedWidth = selectedEnd - selectedStart
  
  // Count photos in selected range
  const selectedCount = useMemo(() => {
    if (!selectedRange) return 0
    return sortedYears
      .filter(y => y >= selectedRange[0] && y <= selectedRange[1])
      .reduce((sum, y) => sum + (yearCounts[y] || 0), 0)
  }, [selectedRange, sortedYears, yearCounts])

  return (
    <div 
      ref={containerRef}
      className="timeline-ruler-container"
    >
      {/* Header */}
      <div className="timeline-ruler-header">
        <div className="timeline-ruler-title">
          <span className="timeline-ruler-icon">📅</span>
          <span>Timeline</span>
        </div>
        {selectedRange && (
          <div className="timeline-ruler-selection-info">
            <span className="timeline-ruler-range-text">
              {selectedRange[0] === selectedRange[1] 
                ? selectedRange[0] 
                : `${selectedRange[0]} – ${selectedRange[1]}`}
            </span>
            <span className="timeline-ruler-count">{selectedCount} photos</span>
            <button 
              onClick={handleClear}
              className="timeline-ruler-clear"
              title="Clear selection"
            >
              ✕
            </button>
          </div>
        )}
        {!selectedRange && (
          <span className="timeline-ruler-hint">Click or drag to select years</span>
        )}
      </div>
      
      {/* Ruler Track */}
      <div className="timeline-ruler-track-container">
        <div 
          ref={trackRef}
          className="timeline-ruler-track"
          onClick={handleTrackClick}
        >
          {/* Background tick marks */}
          <div className="timeline-ruler-ticks">
            {yearMarkers.map(({ year, percent }) => (
              <div 
                key={year}
                className="timeline-ruler-tick"
                style={{ left: `${percent}%` }}
              >
                <div className="timeline-ruler-tick-line" />
              </div>
            ))}
          </div>
          
          {/* Year labels */}
          <div className="timeline-ruler-labels">
            {yearMarkers.map(({ year, percent }) => {
              const count = yearCounts[year] || 0
              const isSelected = selectedRange && year >= selectedRange[0] && year <= selectedRange[1]
              const hasPhotos = count > 0
              
              return (
                <div 
                  key={year}
                  className={`timeline-ruler-label ${isSelected ? 'selected' : ''} ${hasPhotos ? 'has-photos' : ''}`}
                  style={{ left: `${percent}%` }}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (selectedRange && selectedRange[0] === year && selectedRange[1] === year) {
                      onRangeChange(null)
                    } else {
                      onRangeChange([year, year])
                    }
                  }}
                >
                  <span className="timeline-ruler-year">{year}</span>
                  {/* Photo count dots */}
                  {hasPhotos && (
                    <div className="timeline-ruler-dots">
                      {Array.from({ length: Math.min(5, Math.ceil(count / (maxCount / 5))) }).map((_, i) => (
                        <div key={i} className="timeline-ruler-dot" />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          
          {/* Selection overlay */}
          {selectedRange && (
            <div 
              className={`timeline-ruler-selection ${isDragging ? 'dragging' : ''}`}
              style={{ 
                left: `${selectedStart}%`, 
                width: `${Math.max(selectedWidth, 2)}%` 
              }}
            >
              {/* Left handle */}
              <div 
                className="timeline-ruler-handle timeline-ruler-handle-left"
                onMouseDown={(e) => handleMouseDown(e, 'left')}
                onTouchStart={(e) => handleMouseDown(e, 'left')}
              >
                <div className="timeline-ruler-handle-grip" />
              </div>
              
              {/* Draggable range area */}
              <div 
                className="timeline-ruler-selection-area"
                onMouseDown={(e) => handleMouseDown(e, 'range')}
                onTouchStart={(e) => handleMouseDown(e, 'range')}
              />
              
              {/* Right handle */}
              <div 
                className="timeline-ruler-handle timeline-ruler-handle-right"
                onMouseDown={(e) => handleMouseDown(e, 'right')}
                onTouchStart={(e) => handleMouseDown(e, 'right')}
              >
                <div className="timeline-ruler-handle-grip" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
