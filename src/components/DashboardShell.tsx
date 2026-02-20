'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { useRef, useEffect, useState } from 'react'

interface DashboardShellProps {
  children: React.ReactNode
}

export default function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname()
  const prevPath = useRef(pathname)
  const [direction, setDirection] = useState<'left' | 'right'>('left')

  useEffect(() => {
    // Going to home = slide right, going away from home = slide left
    if (pathname === '/dashboard' && prevPath.current !== '/dashboard') {
      setDirection('right')
    } else if (prevPath.current === '/dashboard' && pathname !== '/dashboard') {
      setDirection('left')
    } else {
      // Default: slide left (deeper navigation)
      setDirection('left')
    }
    prevPath.current = pathname
  }, [pathname])

  const variants = {
    enter: (dir: 'left' | 'right') => ({
      x: dir === 'left' ? 80 : -80,
      opacity: 0.5,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: 'left' | 'right') => ({
      x: dir === 'left' ? -40 : 40,
      opacity: 0.5,
    }),
  }

  return (
    <div className="ml-56 min-h-screen overflow-hidden isolate">
      <AnimatePresence mode="popLayout" custom={direction}>
        <motion.div
          key={pathname}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            type: 'tween',
            ease: [0.25, 0.1, 0.25, 1], // Smooth ease-out
            duration: 0.35,
          }}
          className="min-h-screen"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
