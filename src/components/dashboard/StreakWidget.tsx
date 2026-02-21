'use client'

import { useXP } from '@/hooks/useXP'
import { Flame, Zap, Trophy } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function StreakWidget() {
  const { streak, longestStreak, totalXP, level, loading } = useXP()

  if (loading) {
    return (
      <div className="bg-gray-900/90 rounded-2xl border border-white/10 p-4 animate-pulse">
        <div className="h-20 bg-white/5 rounded-xl" />
      </div>
    )
  }

  const streakColor = streak >= 7 
    ? 'from-orange-500 to-red-500' 
    : streak >= 3 
      ? 'from-yellow-500 to-orange-500'
      : 'from-gray-500 to-gray-400'

  const isOnFire = streak >= 3

  return (
    <div className="bg-gray-900/90 rounded-2xl border border-white/10 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`relative ${isOnFire ? 'animate-pulse' : ''}`}>
            <Flame 
              size={20} 
              className={`${isOnFire ? 'text-orange-500' : 'text-gray-500'}`}
              fill={isOnFire ? 'currentColor' : 'none'}
            />
            {isOnFire && (
              <motion.div
                className="absolute -inset-1 bg-orange-500/30 rounded-full blur-md"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
          </div>
          <span className="text-white font-medium text-sm">Streak</span>
        </div>
        <span className="text-xs px-2 py-1 bg-gradient-to-r from-orange-500/30 to-red-500/30 text-orange-300 rounded-full">
          🔥 {streak} days
        </span>
      </div>

      {/* Streak Display */}
      <div className="flex items-center justify-center py-4">
        <div className="relative">
          <motion.div
            className={`text-5xl font-bold bg-gradient-to-r ${streakColor} bg-clip-text text-transparent`}
            key={streak}
            initial={{ scale: 1.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            {streak}
          </motion.div>
          {isOnFire && (
            <AnimatePresence>
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute text-2xl"
                  initial={{ opacity: 0, y: 0, x: -10 + i * 10 }}
                  animate={{ 
                    opacity: [0, 1, 0], 
                    y: -30,
                    x: -10 + i * 10 + (Math.random() * 10 - 5)
                  }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: Infinity, 
                    delay: i * 0.3 
                  }}
                  style={{ top: '50%', left: '50%' }}
                >
                  🔥
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2 mt-2">
        <div className="text-center p-2 bg-white/5 rounded-xl">
          <div className="flex items-center justify-center gap-1 text-yellow-500 mb-1">
            <Zap size={12} />
          </div>
          <div className="text-lg font-bold text-white">{totalXP.toLocaleString()}</div>
          <div className="text-xs text-white/50">Total XP</div>
        </div>
        <div className="text-center p-2 bg-white/5 rounded-xl">
          <div className="flex items-center justify-center gap-1 text-purple-500 mb-1">
            <Trophy size={12} />
          </div>
          <div className="text-lg font-bold text-white">{level}</div>
          <div className="text-xs text-white/50">Level</div>
        </div>
        <div className="text-center p-2 bg-white/5 rounded-xl">
          <div className="flex items-center justify-center gap-1 text-orange-500 mb-1">
            <Flame size={12} />
          </div>
          <div className="text-lg font-bold text-white">{longestStreak}</div>
          <div className="text-xs text-white/50">Best</div>
        </div>
      </div>

      {/* Motivation Text */}
      <p className="text-center text-xs text-white/40 mt-3">
        {streak === 0 && "Start your streak today!"}
        {streak === 1 && "Great start! Keep it going!"}
        {streak >= 2 && streak < 7 && `${7 - streak} more days to weekly bonus!`}
        {streak >= 7 && streak < 30 && `🔥 On fire! ${30 - streak} days to monthly bonus!`}
        {streak >= 30 && "🏆 Legendary streak!"}
      </p>
    </div>
  )
}
