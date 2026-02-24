'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'
import { WashiTape } from './WashiTape'

interface PhotoCardProps {
  src: string
  alt: string
  caption?: string
  variant?: 'polaroid' | 'taped' | 'plain'
  tilt?: 1 | 2 | 3 | 4 | 5 | 0
  tapeColor?: 'brown' | 'blue'
  className?: string
  aspectRatio?: 'square' | 'portrait' | 'landscape'
  onClick?: () => void
}

const tiltStyles = {
  0: '',
  1: 'rotate-[-2deg]',
  2: 'rotate-[1.5deg]',
  3: 'rotate-[-1deg]',
  4: 'rotate-[2.5deg]',
  5: 'rotate-[-3deg]',
}

const aspectStyles = {
  square: 'aspect-square',
  portrait: 'aspect-[3/4]',
  landscape: 'aspect-[4/3]',
}

export function PhotoCard({
  src,
  alt,
  caption,
  variant = 'plain',
  tilt = 0,
  tapeColor = 'brown',
  className,
  aspectRatio = 'square',
  onClick,
}: PhotoCardProps) {
  if (variant === 'polaroid') {
    return (
      <div 
        className={cn(
          'bg-white p-3 pb-12 shadow-md relative',
          tiltStyles[tilt],
          className
        )}
        onClick={onClick}
        style={{ cursor: onClick ? 'pointer' : 'default' }}
      >
        <div className={cn('relative overflow-hidden', aspectStyles[aspectRatio])}>
          <Image
            src={src}
            alt={alt}
            fill
            className="object-cover"
          />
        </div>
        {caption && (
          <p className="absolute bottom-3 left-3 right-3 text-center font-handwritten text-gray-700 text-lg">
            {caption}
          </p>
        )}
      </div>
    )
  }

  if (variant === 'taped') {
    return (
      <div 
        className={cn(
          'bg-white p-2 shadow-md relative',
          tiltStyles[tilt],
          className
        )}
        onClick={onClick}
        style={{ cursor: onClick ? 'pointer' : 'default' }}
      >
        <WashiTape color={tapeColor} position="top" rotation={-3 + Math.random() * 6} />
        <div className={cn('relative overflow-hidden', aspectStyles[aspectRatio])}>
          <Image
            src={src}
            alt={alt}
            fill
            className="object-cover"
          />
        </div>
        {caption && (
          <p className="mt-2 text-center font-handwritten text-gray-600 text-sm">
            {caption}
          </p>
        )}
      </div>
    )
  }

  // Plain variant
  return (
    <div 
      className={cn(
        'bg-white p-2 shadow-md relative overflow-hidden',
        tiltStyles[tilt],
        className
      )}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className={cn('relative', aspectStyles[aspectRatio])}>
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
        />
      </div>
    </div>
  )
}

// Album cover with stacked effect
interface AlbumCoverProps {
  images: string[]
  title: string
  className?: string
  onClick?: () => void
}

export function AlbumCover({ images, title, className, onClick }: AlbumCoverProps) {
  const mainImage = images[0] || '/placeholder.jpg'
  
  return (
    <div 
      className={cn('relative cursor-pointer group', className)}
      onClick={onClick}
    >
      {/* Stacked layers behind */}
      <div className="absolute inset-0 bg-[#f5f5f0] rounded-sm transform -rotate-3 translate-x-1 translate-y-1 shadow-sm" />
      <div className="absolute inset-0 bg-[#ebebeb] rounded-sm transform rotate-2 -translate-x-1 translate-y-2 shadow-sm" />
      
      {/* Main photo */}
      <div className="relative bg-white p-2 shadow-md">
        <div className="relative aspect-square overflow-hidden">
          <Image
            src={mainImage}
            alt={title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
          />
        </div>
      </div>
      
      {/* Title */}
      <p className="mt-3 text-center font-handwritten text-lg text-gray-700">
        {title}
      </p>
    </div>
  )
}
