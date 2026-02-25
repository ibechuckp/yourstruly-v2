'use client'

import React from 'react'

/**
 * Available torn paper edge variants from brand assets
 * blackpaper1-6: SVG silhouettes for use as masks
 */
type EdgeVariant = 1 | 2 | 3 | 4 | 5 | 6

interface TornPaperEdgeProps {
  /** Which torn edge variant to use (1-6) */
  variant?: EdgeVariant
  /** Position of the torn edge */
  position?: 'top' | 'bottom' | 'left' | 'right'
  /** Color to fill the torn edge area (uses brand paper colors) */
  color?: string
  /** Height of the edge element */
  height?: number
  /** Additional classes */
  className?: string
  /** Mirror the edge horizontally */
  flip?: boolean
}

/**
 * TornPaperEdge - Uses brand SVG masks for realistic torn paper effect
 */
export default function TornPaperEdge({
  variant = 1,
  position = 'bottom',
  color = '#F2F1E5', // Brand off-white
  height = 24,
  className = '',
  flip = false,
}: TornPaperEdgeProps) {
  const maskUrl = `/assets/brand/blackpaper${variant}.svg`
  
  // Calculate transforms based on position
  const getTransform = () => {
    const transforms: string[] = []
    
    if (position === 'top') {
      transforms.push('scaleY(-1)')
    }
    if (position === 'left') {
      transforms.push('rotate(-90deg)')
    }
    if (position === 'right') {
      transforms.push('rotate(90deg)')
    }
    if (flip) {
      transforms.push('scaleX(-1)')
    }
    
    return transforms.length > 0 ? transforms.join(' ') : undefined
  }

  return (
    <div 
      className={`w-full overflow-hidden ${className}`}
      style={{
        height,
        backgroundColor: color,
        maskImage: `url(${maskUrl})`,
        WebkitMaskImage: `url(${maskUrl})`,
        maskSize: 'cover',
        WebkitMaskSize: 'cover',
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
        maskPosition: position === 'top' ? 'bottom' : 'top',
        WebkitMaskPosition: position === 'top' ? 'bottom' : 'top',
        transform: getTransform(),
      }}
    />
  )
}

/**
 * TornPaperCard - Card with torn paper edges using brand assets
 */
export function TornPaperCard({
  children,
  className = '',
  tornTop = false,
  tornBottom = true,
  topVariant = 1,
  bottomVariant = 2,
  paperColor = '#FFFEF9',
  edgeColor = '#F2F1E5',
}: {
  children: React.ReactNode
  className?: string
  tornTop?: boolean
  tornBottom?: boolean
  topVariant?: EdgeVariant
  bottomVariant?: EdgeVariant
  paperColor?: string
  edgeColor?: string
}) {
  return (
    <div className={`relative ${className}`}>
      {tornTop && (
        <TornPaperEdge 
          variant={topVariant} 
          position="top" 
          color={edgeColor}
          height={20}
        />
      )}
      
      <div style={{ backgroundColor: paperColor }}>
        {children}
      </div>
      
      {tornBottom && (
        <TornPaperEdge 
          variant={bottomVariant} 
          position="bottom" 
          color={edgeColor}
          height={20}
        />
      )}
    </div>
  )
}
