'use client'

import { motion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

interface PageTransitionProps {
  children: React.ReactNode
}

export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname()
  const prevPathRef = useRef(pathname)
  
  // Determine slide direction based on navigation
  const isGoingHome = pathname === '/dashboard' && prevPathRef.current !== '/dashboard'
  const isLeavingHome = prevPathRef.current === '/dashboard' && pathname !== '/dashboard'
  
  useEffect(() => {
    prevPathRef.current = pathname
  }, [pathname])

  // Slide from right when going deeper, slide from left when going back to home
  const variants = {
    initial: {
      x: isGoingHome ? -100 : 100,
      opacity: 0,
    },
    animate: {
      x: 0,
      opacity: 1,
    },
    exit: {
      x: isGoingHome ? 100 : -100,
      opacity: 0,
    },
  }

  return (
    <motion.div
      key={pathname}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
        duration: 0.3,
      }}
      className="min-h-screen"
    >
      {children}
    </motion.div>
  )
}
