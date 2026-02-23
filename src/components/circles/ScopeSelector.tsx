'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Lock, Users, Check, Sparkles } from 'lucide-react'

// Mock circle data - will be replaced with API data
const MOCK_CIRCLES = [
  { id: 'circle-1', name: 'Family', memberCount: 8, color: '#F59E0B' },
  { id: 'circle-2', name: 'Close Friends', memberCount: 5, color: '#10B981' },
  { id: 'circle-3', name: 'Grandkids', memberCount: 3, color: '#8B5CF6' },
  { id: 'circle-4', name: 'Book Club', memberCount: 12, color: '#EC4899' },
]

export interface Circle {
  id: string
  name: string
  memberCount?: number
  color?: string
}

export interface ScopeSelection {
  isPrivate: boolean
  circleIds: string[]
}

interface ScopeSelectorProps {
  isOpen: boolean
  onClose: () => void
  onSave: (selection: ScopeSelection) => void
  initialSelection?: ScopeSelection
  contentType?: 'memory' | 'knowledge' | 'conversation'
  title?: string
}

export function ScopeSelector({
  isOpen,
  onClose,
  onSave,
  initialSelection,
  contentType = 'memory',
  title = 'Where should this live?'
}: ScopeSelectorProps) {
  const [isPrivate, setIsPrivate] = useState(true)
  const [selectedCircles, setSelectedCircles] = useState<string[]>([])
  const [circles] = useState<Circle[]>(MOCK_CIRCLES) // TODO: Replace with API hook
  
  // Initialize from props
  useEffect(() => {
    if (initialSelection) {
      setIsPrivate(initialSelection.isPrivate)
      setSelectedCircles(initialSelection.circleIds)
    } else {
      // Default to private
      setIsPrivate(true)
      setSelectedCircles([])
    }
  }, [initialSelection, isOpen])

  // Handle ESC to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleDismiss()
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen])

  const handleDismiss = useCallback(() => {
    // Dismissed without explicit save → default to private
    onSave({ isPrivate: true, circleIds: [] })
    onClose()
  }, [onSave, onClose])

  const handlePrivateToggle = useCallback(() => {
    setIsPrivate(true)
    setSelectedCircles([])
  }, [])

  const handleCircleToggle = useCallback((circleId: string) => {
    setSelectedCircles(prev => {
      const newSelection = prev.includes(circleId)
        ? prev.filter(id => id !== circleId)
        : [...prev, circleId]
      
      // If any circles selected, not private
      if (newSelection.length > 0) {
        setIsPrivate(false)
      }
      return newSelection
    })
  }, [])

  const handleSave = useCallback(() => {
    onSave({
      isPrivate: isPrivate || selectedCircles.length === 0,
      circleIds: selectedCircles
    })
    onClose()
  }, [isPrivate, selectedCircles, onSave, onClose])

  const getContentLabel = () => {
    switch (contentType) {
      case 'memory': return 'memory'
      case 'knowledge': return 'insight'
      case 'conversation': return 'story'
      default: return 'content'
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] p-4"
        onClick={handleDismiss}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-md overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <Sparkles size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">{title}</h3>
                <p className="text-gray-400 text-sm">Choose who sees this {getContentLabel()}</p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>

          {/* Options */}
          <div className="p-5 space-y-3">
            {/* Private Option */}
            <button
              onClick={handlePrivateToggle}
              className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all text-left ${
                isPrivate && selectedCircles.length === 0
                  ? 'bg-amber-600/20 border-2 border-amber-500/50'
                  : 'bg-gray-800 hover:bg-gray-700 border-2 border-transparent'
              }`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                isPrivate && selectedCircles.length === 0
                  ? 'bg-amber-600'
                  : 'bg-gray-700'
              }`}>
                <Lock size={20} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">Private</p>
                <p className="text-gray-400 text-sm">Just for me</p>
              </div>
              {isPrivate && selectedCircles.length === 0 && (
                <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
                  <Check size={14} className="text-white" />
                </div>
              )}
            </button>

            {/* Circles Section */}
            {circles.length > 0 && (
              <>
                <div className="flex items-center gap-2 pt-2">
                  <Users size={14} className="text-gray-500" />
                  <span className="text-gray-500 text-xs uppercase tracking-wider">
                    Share with Circles
                  </span>
                </div>

                {circles.map(circle => (
                  <button
                    key={circle.id}
                    onClick={() => handleCircleToggle(circle.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all text-left ${
                      selectedCircles.includes(circle.id)
                        ? 'bg-amber-600/20 border-2 border-amber-500/50'
                        : 'bg-gray-800 hover:bg-gray-700 border-2 border-transparent'
                    }`}
                  >
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: circle.color || '#6B7280' }}
                    >
                      <Users size={20} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{circle.name}</p>
                      {circle.memberCount && (
                        <p className="text-gray-400 text-sm">
                          {circle.memberCount} {circle.memberCount === 1 ? 'member' : 'members'}
                        </p>
                      )}
                    </div>
                    {selectedCircles.includes(circle.id) && (
                      <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
                        <Check size={14} className="text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-gray-800 flex gap-3">
            <button
              onClick={handleDismiss}
              className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl font-medium transition-all"
            >
              Save
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default ScopeSelector
