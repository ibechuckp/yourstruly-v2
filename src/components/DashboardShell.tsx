'use client'

import { usePathname } from 'next/navigation'
import { useRef, useEffect, useState, useLayoutEffect } from 'react'
import gsap from 'gsap'
import CommandBar from '@/components/dashboard/CommandBar'

interface DashboardShellProps {
  children: React.ReactNode
}

export default function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname()
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const prevPathRef = useRef(pathname)
  const [displayedChildren, setDisplayedChildren] = useState(children)
  const isAnimating = useRef(false)

  useEffect(() => {
    // Skip animation on first render
    if (prevPathRef.current === pathname || isAnimating.current) {
      prevPathRef.current = pathname
      setDisplayedChildren(children)
      return
    }

    isAnimating.current = true
    const isGoingHome = pathname === '/dashboard'
    const slideDistance = 100
    
    // Determine direction: going home slides right, going deeper slides left
    const exitX = isGoingHome ? slideDistance : -slideDistance
    const enterX = isGoingHome ? -slideDistance : slideDistance

    // Create timeline for smooth transition
    const tl = gsap.timeline({
      onComplete: () => {
        isAnimating.current = false
        prevPathRef.current = pathname
      }
    })

    // Exit animation - slower for visibility
    tl.to(contentRef.current, {
      x: exitX,
      opacity: 0,
      duration: 0.4,
      ease: 'power2.inOut',
      onComplete: () => {
        setDisplayedChildren(children)
      }
    })

    // Enter animation - smooth and visible
    tl.fromTo(contentRef.current, 
      { x: enterX, opacity: 0 },
      { 
        x: 0, 
        opacity: 1, 
        duration: 0.5,
        ease: 'power3.out',
      }
    )

  }, [pathname, children])

  // Initial animation on mount
  useLayoutEffect(() => {
    if (contentRef.current) {
      gsap.fromTo(contentRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
      )
    }
  }, [])

  return (
    <div ref={containerRef} className="ml-56 min-h-screen relative">
      <div ref={contentRef} className="will-change-transform pb-28">
        {displayedChildren}
      </div>
      <CommandBar />
    </div>
  )
}
