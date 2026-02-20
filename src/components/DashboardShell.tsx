'use client'

import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useRef, useEffect, useState } from 'react'

interface DashboardShellProps {
  children: React.ReactNode
}

export default function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname()
  const prevPathRef = useRef(pathname)
  const [slideDirection, setSlideDirection] = useState(1)

  useEffect(() => {
    const prevPath = prevPathRef.current
    const isGoingHome = pathname === '/dashboard' && prevPath !== '/dashboard'
    
    // Slide right (direction = 1) when going home
    // Slide left (direction = -1) when navigating deeper
    setSlideDirection(isGoingHome ? 1 : -1)
    prevPathRef.current = pathname
  }, [pathname])

  return (
    <div className="ml-56 min-h-screen overflow-hidden">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={pathname}
          initial={{ 
            opacity: 0, 
            x: slideDirection * -80  // Enter from opposite direction
          }}
          animate={{ 
            opacity: 1, 
            x: 0 
          }}
          exit={{ 
            opacity: 0, 
            x: slideDirection * 80  // Exit in the direction
          }}
          transition={{ 
            duration: 0.3,
            ease: [0.4, 0, 0.2, 1]  // Smooth easing
          }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
