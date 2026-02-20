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
      x: dir === 'left' ? '100%' : '-100%',
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: 'left' | 'right') => ({
      x: dir === 'left' ? '-30%' : '30%',
      opacity: 0,
    }),
  }

  return (
    <div className="ml-56 min-h-screen overflow-hidden isolate">
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={pathname}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: 'spring', stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 },
          }}
          className="min-h-screen"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
