'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Zap } from 'lucide-react'

interface XPToastProps {
  amount: number
  message?: string
  onComplete?: () => void
}

export default function XPToast({ amount, message, onComplete }: XPToastProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      onComplete?.()
    }, 2500)

    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-amber-600 to-orange-600 rounded-full shadow-lg shadow-amber-500/30">
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Zap size={20} className="text-white fill-white" />
            </motion.div>
            <span className="text-white font-bold text-lg">+{amount} XP</span>
            {message && (
              <span className="text-white/80 text-sm">{message}</span>
            )}
          </div>
          
          {/* Sparkle particles */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 pointer-events-none"
          >
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: '50%', 
                  y: '50%',
                  scale: 0,
                  opacity: 1,
                }}
                animate={{ 
                  x: `${50 + (Math.random() - 0.5) * 100}%`,
                  y: `${50 + (Math.random() - 0.5) * 100}%`,
                  scale: [0, 1, 0],
                  opacity: [1, 1, 0],
                }}
                transition={{ 
                  duration: 0.8,
                  delay: 0.1 + i * 0.05,
                  ease: 'easeOut',
                }}
                className="absolute"
              >
                <Sparkles size={12} className="text-yellow-300" />
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Hook for managing XP toasts
export function useXPToast() {
  const [toasts, setToasts] = useState<Array<{ id: number; amount: number; message?: string }>>([])
  let nextId = 0

  const showXP = (amount: number, message?: string) => {
    const id = nextId++
    setToasts(prev => [...prev, { id, amount, message }])
  }

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  const ToastContainer = () => (
    <>
      {toasts.map(toast => (
        <XPToast
          key={toast.id}
          amount={toast.amount}
          message={toast.message}
          onComplete={() => removeToast(toast.id)}
        />
      ))}
    </>
  )

  return { showXP, ToastContainer }
}
