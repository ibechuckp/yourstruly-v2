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
  const [direction, setDirection] = useState<1 | -1>(1)

  useEffect(() => {
    // Going to home = slide from left (-1), going away = slide from right (1)
    if (pathname === '/dashboard') {
      setDirection(-1)
    } else {
      setDirection(1)
    }
    prevPath.current = pathname
  }, [pathname])

  return (
    <div className="ml-56 min-h-screen overflow-hidden">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={pathname}
          initial={{ 
            x: direction * 50,
            opacity: 0 
          }}
          animate={{ 
            x: 0,
            opacity: 1 
          }}
          exit={{ 
            x: direction * -50,
            opacity: 0 
          }}
          transition={{
            duration: 0.25,
            ease: 'easeOut',
          }}
          className="min-h-screen"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
