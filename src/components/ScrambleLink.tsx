'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'

interface ScrambleLinkProps {
  href: string
  children: string
  isActive?: boolean
  onClick?: () => void
  className?: string
}

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

export default function ScrambleLink({ 
  href, 
  children, 
  isActive = false, 
  onClick,
  className = ''
}: ScrambleLinkProps) {
  const [displayText, setDisplayText] = useState(children)
  const [isHovering, setIsHovering] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const originalText = children

  const scramble = useCallback(() => {
    let iteration = 0
    const totalIterations = originalText.length * 2

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    intervalRef.current = setInterval(() => {
      setDisplayText(
        originalText
          .split('')
          .map((char, index) => {
            // Keep spaces as spaces
            if (char === ' ') return ' '
            
            // Characters before the "reveal point" show the original
            if (index < iteration / 2) {
              return originalText[index]
            }
            
            // Characters at or after reveal point show random
            return CHARS[Math.floor(Math.random() * CHARS.length)]
          })
          .join('')
      )

      iteration += 1

      if (iteration >= totalIterations) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
        setDisplayText(originalText)
      }
    }, 30) // Speed of scramble
  }, [originalText])

  const handleMouseEnter = () => {
    setIsHovering(true)
    scramble()
  }

  const handleMouseLeave = () => {
    setIsHovering(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    setDisplayText(originalText)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  // Reset display text if children change
  useEffect(() => {
    setDisplayText(children)
  }, [children])

  return (
    <Link
      href={href}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`scramble-link ${isActive ? 'active' : ''} ${className}`}
    >
      <span className="scramble-text">{displayText}</span>
      <span className="scramble-underline" />
    </Link>
  )
}
