'use client'

import { cn } from '@/lib/utils'

interface WashiTapeProps {
  color?: 'brown' | 'blue' | 'green' | 'yellow'
  position?: 'top' | 'top-left' | 'top-right' | 'center'
  rotation?: number
  className?: string
  width?: number
}

const colorMap = {
  brown: '/images/washi-tape.svg',
  blue: '/images/washi-tape-blue.svg',
  green: '/images/washi-tape.svg', // TODO: create green variant
  yellow: '/images/washi-tape.svg', // TODO: create yellow variant
}

const positionStyles = {
  'top': 'top-[-8px] left-1/2 -translate-x-1/2',
  'top-left': 'top-[-6px] left-[10px]',
  'top-right': 'top-[-6px] right-[10px]',
  'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
}

export function WashiTape({ 
  color = 'brown', 
  position = 'top',
  rotation = -2,
  className,
  width = 100
}: WashiTapeProps) {
  return (
    <div 
      className={cn(
        'absolute pointer-events-none z-10',
        positionStyles[position],
        className
      )}
      style={{
        width: `${width}px`,
        height: '20px',
        backgroundImage: `url(${colorMap[color]})`,
        backgroundSize: '100% 100%',
        transform: `rotate(${rotation}deg)`,
      }}
    />
  )
}

// Inline tape highlight for text
interface TapeHighlightProps {
  children: React.ReactNode
  color?: 'brown' | 'blue' | 'yellow' | 'green'
  className?: string
}

const highlightColors = {
  brown: 'rgba(201, 168, 108, 0.3)',
  blue: 'rgba(141, 172, 171, 0.35)',
  yellow: 'rgba(217, 198, 26, 0.25)',
  green: 'rgba(64, 106, 86, 0.25)',
}

export function TapeHighlight({ children, color = 'brown', className }: TapeHighlightProps) {
  return (
    <span 
      className={cn('relative inline', className)}
      style={{
        backgroundImage: `linear-gradient(to right, ${highlightColors[color]}, ${highlightColors[color]})`,
        backgroundPosition: '0 50%',
        backgroundSize: '100% 70%',
        backgroundRepeat: 'no-repeat',
        padding: '0 4px',
      }}
    >
      {children}
    </span>
  )
}
