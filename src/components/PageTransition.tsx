'use client'

import { useRef, useEffect, ReactNode } from 'react'
import gsap from 'gsap'

interface PageTransitionProps {
  children: ReactNode
  className?: string
}

export default function PageTransition({ children, className = '' }: PageTransitionProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return

    // Animate cards/elements within the page with stagger
    const cards = ref.current.querySelectorAll('[data-animate]')
    
    if (cards.length > 0) {
      gsap.fromTo(cards,
        { 
          opacity: 0, 
          y: 30,
          scale: 0.95
        },
        { 
          opacity: 1, 
          y: 0, 
          scale: 1,
          duration: 0.5,
          stagger: 0.08,
          ease: 'power3.out',
        }
      )
    }
  }, [])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}

// Hook for animating individual elements
export function useGsapFadeIn(delay = 0) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return

    gsap.fromTo(ref.current,
      { opacity: 0, y: 20 },
      { 
        opacity: 1, 
        y: 0, 
        duration: 0.5, 
        delay,
        ease: 'power2.out' 
      }
    )
  }, [delay])

  return ref
}

// Hook for hover effects
export function useGsapHover() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const el = ref.current

    const handleEnter = () => {
      gsap.to(el, { 
        scale: 1.02, 
        duration: 0.3, 
        ease: 'power2.out' 
      })
    }

    const handleLeave = () => {
      gsap.to(el, { 
        scale: 1, 
        duration: 0.3, 
        ease: 'power2.out' 
      })
    }

    el.addEventListener('mouseenter', handleEnter)
    el.addEventListener('mouseleave', handleLeave)

    return () => {
      el.removeEventListener('mouseenter', handleEnter)
      el.removeEventListener('mouseleave', handleLeave)
    }
  }, [])

  return ref
}
