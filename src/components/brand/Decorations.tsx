'use client'

import React from 'react'
import Image from 'next/image'

/**
 * Brand decorative elements - hand-drawn style icons
 */

interface DecorationProps {
  size?: number
  className?: string
  style?: React.CSSProperties
}

export function YellowFlower({ size = 40, className = '', style }: DecorationProps) {
  return (
    <Image
      src="/assets/brand/yellowflower.png"
      alt=""
      width={size}
      height={size}
      className={`pointer-events-none select-none ${className}`}
      style={style}
    />
  )
}

export function BlueHeart({ size = 40, className = '', style }: DecorationProps) {
  return (
    <Image
      src="/assets/brand/blueheart.png"
      alt=""
      width={size}
      height={size}
      className={`pointer-events-none select-none ${className}`}
      style={style}
    />
  )
}

export function OrangeStar({ size = 40, className = '', style }: DecorationProps) {
  return (
    <Image
      src="/assets/brand/orangestar.png"
      alt=""
      width={size}
      height={size}
      className={`pointer-events-none select-none ${className}`}
      style={style}
    />
  )
}

export function OrangeCutout({ size = 40, className = '', style }: DecorationProps) {
  return (
    <Image
      src="/assets/brand/orangesutout.png"
      alt=""
      width={size}
      height={size}
      className={`pointer-events-none select-none ${className}`}
      style={style}
    />
  )
}

/**
 * BrownTape - Decorative masking tape element
 * Great for "taping" photos or notes to a surface
 */
export function BrownTape({ 
  variant = 1,
  width = 120,
  rotation = -15,
  className = '',
  style,
}: {
  variant?: 1 | 2
  width?: number
  rotation?: number
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <Image
      src={`/assets/brand/browntape${variant}.png`}
      alt=""
      width={width}
      height={width * 0.4}
      className={`pointer-events-none select-none ${className}`}
      style={{
        transform: `rotate(${rotation}deg)`,
        ...style,
      }}
    />
  )
}

/**
 * TornPaperPiece - Colored torn paper piece
 * Available colors: green, grey, lightblue, lightgreen, lightpurple
 */
type PaperColor = 'green' | 'grey' | 'lightblue' | 'lightgreen' | 'lightpurple' | 'lightpurple2'

const PAPER_FILES: Record<PaperColor, string> = {
  green: 'greenpaper.png',
  grey: 'greypaper1.png',
  lightblue: 'lightbluepaper.png',
  lightgreen: 'lightgreenpaper.png',
  lightpurple: 'lightpurplepaper.png',
  lightpurple2: 'lightpurplepaper2.png',
}

export function TornPaperPiece({
  color = 'lightgreen',
  width = 200,
  rotation = 0,
  className = '',
  style,
}: {
  color?: PaperColor
  width?: number
  rotation?: number
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <Image
      src={`/assets/brand/${PAPER_FILES[color]}`}
      alt=""
      width={width}
      height={width * 0.6}
      className={`pointer-events-none select-none ${className}`}
      style={{
        transform: rotation !== 0 ? `rotate(${rotation}deg)` : undefined,
        ...style,
      }}
    />
  )
}

/**
 * ScrapbookCorner - A decorative corner element with tape and decoration
 */
export function ScrapbookCorner({
  position = 'top-right',
  decoration = 'flower',
  className = '',
}: {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  decoration?: 'flower' | 'star' | 'heart' | 'none'
  className?: string
}) {
  const positionClasses = {
    'top-left': 'top-0 left-0',
    'top-right': 'top-0 right-0',
    'bottom-left': 'bottom-0 left-0',
    'bottom-right': 'bottom-0 right-0',
  }

  const tapeRotations = {
    'top-left': 45,
    'top-right': -45,
    'bottom-left': -45,
    'bottom-right': 45,
  }

  const DecorationComponent = {
    flower: YellowFlower,
    star: OrangeStar,
    heart: BlueHeart,
    none: null,
  }[decoration]

  return (
    <div className={`absolute ${positionClasses[position]} ${className}`}>
      <BrownTape 
        width={60} 
        rotation={tapeRotations[position]}
        className="absolute -translate-x-1/2 -translate-y-1/2"
      />
      {DecorationComponent && (
        <DecorationComponent 
          size={24} 
          className="absolute top-2 left-2"
        />
      )}
    </div>
  )
}

/**
 * Colored Paper Background - Used behind category labels and section headers
 */
interface ColoredPaperProps {
  color: 'green' | 'grey' | 'lightblue' | 'lightgreen' | 'lightpurple'
  className?: string
  children?: React.ReactNode
}

const PAPER_MAP = {
  green: '/assets/brand/greenpaper.png',
  grey: '/assets/brand/greypaper1.png',
  lightblue: '/assets/brand/lightbluepaper.png',
  lightgreen: '/assets/brand/lightgreenpaper.png',
  lightpurple: '/assets/brand/lightpurplepaper.png',
}

export function ColoredPaper({ color, className = '', children }: ColoredPaperProps) {
  return (
    <div 
      className={`relative inline-block ${className}`}
      style={{
        backgroundImage: `url(${PAPER_MAP[color]})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {children}
    </div>
  )
}

/**
 * Category Badge with colored paper background
 * For use in messages, memory lists, profile sections
 */
interface CategoryBadgeProps {
  category: string
  icon?: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const CATEGORY_COLORS: Record<string, 'green' | 'grey' | 'lightblue' | 'lightgreen' | 'lightpurple'> = {
  family: 'lightgreen',
  travel: 'lightblue',
  celebration: 'lightpurple',
  food: 'green',
  nature: 'lightgreen',
  wisdom: 'lightpurple',
  everyday: 'grey',
  work: 'grey',
  health: 'lightblue',
  creative: 'lightpurple',
}

export function CategoryBadge({ category, icon, size = 'md' }: CategoryBadgeProps) {
  const color = CATEGORY_COLORS[category.toLowerCase()] || 'grey'
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-3 py-1 text-xs',
    lg: 'px-4 py-1.5 text-sm',
  }

  return (
    <div 
      className={`inline-flex items-center gap-1.5 rounded-full font-medium text-gray-700 ${sizeClasses[size]}`}
      style={{
        backgroundImage: `url(${PAPER_MAP[color]})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {icon}
      <span className="capitalize">{category}</span>
    </div>
  )
}
