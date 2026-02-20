'use client'

import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

interface DashboardShellProps {
  children: React.ReactNode
}

export default function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname()
  const [displayChildren, setDisplayChildren] = useState(children)
  const [transitionStage, setTransitionStage] = useState('enter')

  // Track navigation depth for slide direction
  const getDepth = (path: string) => {
    const segments = path.split('/').filter(Boolean)
    return segments.length
  }

  const [prevDepth, setPrevDepth] = useState(getDepth(pathname))
  const currentDepth = getDepth(pathname)
  const slideDirection = currentDepth > prevDepth ? -1 : 1 // -1 = slide left (going deeper), 1 = slide right (going back)

  useEffect(() => {
    setTransitionStage('exit')
    const timer = setTimeout(() => {
      setDisplayChildren(children)
      setPrevDepth(currentDepth)
      setTransitionStage('enter')
    }, 150)
    return () => clearTimeout(timer)
  }, [pathname])

  return (
    <div className="ml-56 min-h-screen overflow-x-hidden">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, x: slideDirection * -50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: slideDirection * 50 }}
        transition={{ 
          duration: 0.25,
          ease: [0.25, 0.1, 0.25, 1]
        }}
      >
        {children}
      </motion.div>
    </div>
  )
}
