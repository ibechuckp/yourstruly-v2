'use client'

import React, { useEffect, useState } from 'react'

/**
 * Available torn paper edge variants from brand assets
 * Variant 4 is the most horizontal (455x218) - best for horizontal edges
 */
type EdgeVariant = 1 | 2 | 3 | 4 | 5 | 6

interface TornPaperEdgeProps {
  /** Which torn edge variant to use (1-6). Default 4 (horizontal) */
  variant?: EdgeVariant
  /** Position of the torn edge */
  position?: 'top' | 'bottom'
  /** Color to fill the torn edge area */
  color?: string
  /** Height of the edge element in pixels */
  height?: number
  /** Additional classes */
  className?: string
  /** Mirror the edge horizontally for variety */
  flip?: boolean
}

/**
 * TornPaperEdge - Renders torn paper effect using brand SVG assets
 * 
 * Uses CSS mask-image with the actual brand SVG files.
 * The SVGs are black silhouettes with irregular torn edges at the top.
 */
export default function TornPaperEdge({
  variant = 4,
  position = 'bottom',
  color = '#F2F1E5',
  height = 20,
  className = '',
  flip = false,
}: TornPaperEdgeProps) {
  const maskUrl = `/assets/brand/blackpaper${variant}.svg`
  
  // For bottom position, flip the mask so torn edge shows at bottom
  // For top position, show as-is (torn edge at top of SVG)
  const isBottom = position === 'bottom'
  
  // Build transform string
  const transforms: string[] = []
  if (isBottom) {
    transforms.push('scaleY(-1)')
  }
  if (flip) {
    transforms.push('scaleX(-1)')
  }

  return (
    <div 
      className={`w-full overflow-hidden pointer-events-none ${className}`}
      aria-hidden="true"
      style={{
        height,
        backgroundColor: color,
        // Mask properties - black areas of SVG = visible
        maskImage: `url("${maskUrl}")`,
        WebkitMaskImage: `url("${maskUrl}")`,
        // Size: full width, auto height maintains aspect ratio
        maskSize: '100% auto',
        WebkitMaskSize: '100% auto',
        // Repeat horizontally if needed
        maskRepeat: 'repeat-x',
        WebkitMaskRepeat: 'repeat-x',
        // Position at top to show the torn edge portion
        maskPosition: 'top center',
        WebkitMaskPosition: 'top center',
        // Transform for position and flip
        transform: transforms.length > 0 ? transforms.join(' ') : undefined,
      }}
    />
  )
}

/**
 * InlineTornEdge - Alternative approach using inline SVG for maximum reliability
 * This directly embeds the SVG path and clips it to show just the torn edge
 */
export function InlineTornEdge({
  position = 'bottom',
  color = '#E8DFD0',
  height = 20,
  className = '',
}: {
  position?: 'top' | 'bottom'
  color?: string
  height?: number
  className?: string
}) {
  // Simplified torn edge path that works well at any width
  // This is a repeating pattern that tiles nicely
  const tornPath = `
    M0,${height} 
    L0,${height * 0.6} 
    Q5,${height * 0.3} 10,${height * 0.5} 
    T20,${height * 0.4} 
    T30,${height * 0.65} 
    T40,${height * 0.35} 
    T50,${height * 0.55} 
    T60,${height * 0.4} 
    T70,${height * 0.6} 
    T80,${height * 0.3} 
    T90,${height * 0.5} 
    T100,${height * 0.4}
    L100,${height}
    Z
  `

  return (
    <svg 
      className={`w-full block ${className}`}
      viewBox={`0 0 100 ${height}`}
      preserveAspectRatio="none"
      style={{
        height,
        transform: position === 'top' ? 'scaleY(-1)' : undefined,
      }}
      aria-hidden="true"
    >
      <path d={tornPath} fill={color} />
    </svg>
  )
}

/**
 * TornPaperDivider - A decorative torn paper divider between sections
 */
export function TornPaperDivider({
  variant = 4,
  topColor = '#FFFEF9',
  bottomColor = '#F2F1E5',
  height = 24,
  className = '',
}: {
  variant?: EdgeVariant
  topColor?: string
  bottomColor?: string
  height?: number
  className?: string
}) {
  return (
    <div className={`relative ${className}`} style={{ height }}>
      <div 
        className="absolute inset-0"
        style={{ backgroundColor: topColor }}
      />
      <TornPaperEdge 
        variant={variant}
        position="bottom"
        color={bottomColor}
        height={height}
        className="absolute inset-0"
      />
    </div>
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
  topVariant = 4,
  bottomVariant = 4,
  paperColor = '#FFFEF9',
  edgeColor = '#E8DFD0',
  edgeHeight = 16,
}: {
  children: React.ReactNode
  className?: string
  tornTop?: boolean
  tornBottom?: boolean
  topVariant?: EdgeVariant
  bottomVariant?: EdgeVariant
  paperColor?: string
  edgeColor?: string
  edgeHeight?: number
}) {
  return (
    <div className={`relative ${className}`}>
      {tornTop && (
        <TornPaperEdge 
          variant={topVariant} 
          position="top" 
          color={edgeColor}
          height={edgeHeight}
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
          height={edgeHeight}
        />
      )}
    </div>
  )
}
