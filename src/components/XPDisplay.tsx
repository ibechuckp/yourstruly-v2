'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Flame, ChevronDown } from 'lucide-react'
import { useXP } from '@/hooks/useXP'

export default function XPDisplay() {
  const { totalXP, availableXP, level, streak, postscriptsAvailable, loading } = useXP()
  const [showDetails, setShowDetails] = useState(false)
  const [lastXP, setLastXP] = useState(totalXP)
  const [xpGain, setXpGain] = useState(0)

  // Animate XP gain
  useEffect(() => {
    if (totalXP > lastXP) {
      setXpGain(totalXP - lastXP)
      setTimeout(() => setXpGain(0), 2000)
    }
    setLastXP(totalXP)
  }, [totalXP, lastXP])

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full animate-pulse">
        <div className="w-16 h-4 bg-white/10 rounded" />
      </div>
    )
  }

  // XP progress to next level (1000 XP per level)
  const xpInCurrentLevel = totalXP % 1000
  const xpProgress = (xpInCurrentLevel / 1000) * 100

  return (
    <div className="relative">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 hover:from-yellow-500/30 hover:to-orange-500/30 border border-yellow-500/30 rounded-full transition-all"
      >
        {/* Streak indicator */}
        {streak > 0 && (
          <div className="flex items-center gap-1 text-orange-400">
            <Flame size={14} fill="currentColor" />
            <span className="text-xs font-medium">{streak}</span>
          </div>
        )}
        
        {/* XP display */}
        <div className="flex items-center gap-1 text-yellow-400">
          <Zap size={14} />
          <span className="text-sm font-bold">{availableXP.toLocaleString()}</span>
        </div>

        {/* Level badge */}
        <div className="flex items-center justify-center w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-white text-xs font-bold">
          {level}
        </div>

        <ChevronDown size={14} className={`text-white/50 transition-transform ${showDetails ? 'rotate-180' : ''}`} />

        {/* XP gain animation */}
        <AnimatePresence>
          {xpGain > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: -20 }}
              exit={{ opacity: 0 }}
              className="absolute -top-2 right-0 text-yellow-400 text-sm font-bold pointer-events-none"
            >
              +{xpGain} XP
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {/* Dropdown details */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-full right-0 mt-2 w-64 bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-xl z-50"
          >
            {/* Level progress */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-white/70">Level {level}</span>
                <span className="text-white/50">{xpInCurrentLevel}/1000 XP</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${xpProgress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/70 flex items-center gap-2">
                  <Zap size={14} className="text-yellow-500" />
                  Available XP
                </span>
                <span className="text-white font-medium">{availableXP.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/70 flex items-center gap-2">
                  <Zap size={14} className="text-yellow-500/50" />
                  Total Earned
                </span>
                <span className="text-white/60">{totalXP.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/70 flex items-center gap-2">
                  <Flame size={14} className="text-orange-500" />
                  Current Streak
                </span>
                <span className="text-white font-medium">{streak} days</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/70 flex items-center gap-2">
                  ✉️ PostScripts
                </span>
                <span className="text-white font-medium">{postscriptsAvailable}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 pt-3 border-t border-white/10">
              <button className="w-full py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                View XP History →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
