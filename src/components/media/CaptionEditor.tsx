'use client'

import { useState, useEffect } from 'react'
import { Sparkles, Check, ChevronDown, ChevronUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface CaptionEditorProps {
  mediaId: string
  onXPEarned?: (amount: number, action: string) => void
}

interface Backstory {
  caption?: string
  backstory?: string
  mood?: string
  significance?: string
  people_mentioned?: string[]
  xp_awarded?: number
}

const MOODS = [
  'happy', 'nostalgic', 'peaceful', 'excited', 'grateful', 
  'proud', 'adventurous', 'cozy', 'bittersweet', 'silly'
]

export default function CaptionEditor({ mediaId, onXPEarned }: CaptionEditorProps) {
  const [backstory, setBackstory] = useState<Backstory>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    loadBackstory()
  }, [mediaId])

  const loadBackstory = async () => {
    const res = await fetch(`/api/media/${mediaId}/caption`)
    if (res.ok) {
      const data = await res.json()
      if (data.backstory) {
        setBackstory(data.backstory)
      }
    }
    setLoading(false)
  }

  const saveBackstory = async () => {
    setSaving(true)
    
    const res = await fetch(`/api/media/${mediaId}/caption`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        caption: backstory.caption,
        backstory: backstory.backstory,
        mood: backstory.mood,
        significance: backstory.significance,
        peopleMentioned: backstory.people_mentioned,
      }),
    })

    if (res.ok) {
      const data = await res.json()
      if (data.xpAwarded && onXPEarned) {
        onXPEarned(data.xpAwarded, backstory.backstory ? 'Added backstory' : 'Added caption')
      }
      setHasChanges(false)
      
      // Update local XP tracking
      setBackstory(prev => ({
        ...prev,
        xp_awarded: (prev.xp_awarded || 0) + data.xpAwarded,
      }))
    }

    setSaving(false)
  }

  const updateField = (field: keyof Backstory, value: any) => {
    setBackstory(prev => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }

  // Calculate potential XP - only backstory earns XP
  const currentXP = backstory.xp_awarded || 0
  const potentialXP = backstory.backstory && backstory.backstory.length > 20 ? 15 : 0
  const xpToEarn = Math.max(0, potentialXP - currentXP)

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-10 bg-gray-800 rounded-lg" />
        <div className="h-24 bg-gray-800 rounded-lg" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Caption (short) - no XP for caption */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm text-white/70">Caption</label>
        </div>
        <input
          type="text"
          value={backstory.caption || ''}
          onChange={(e) => updateField('caption', e.target.value)}
          placeholder="A brief caption for this moment..."
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          maxLength={280}
        />
        <div className="text-xs text-white/30 text-right mt-1">
          {(backstory.caption?.length || 0)}/280
        </div>
      </div>

      {/* Backstory (long) */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm text-white/70">The Story Behind It</label>
          {currentXP < 15 && backstory.backstory && backstory.backstory.length > 20 && (
            <span className="text-xs text-amber-500 flex items-center gap-1">
              <Sparkles size={10} />
              +{15 - currentXP} XP
            </span>
          )}
        </div>
        <textarea
          value={backstory.backstory || ''}
          onChange={(e) => updateField('backstory', e.target.value)}
          placeholder="What was happening? Why does this moment matter? What do you want to remember about it?"
          rows={4}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
        />
      </div>

      {/* Advanced fields toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-2 text-sm text-white/50 hover:text-white/70"
      >
        {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        More details
      </button>

      {/* Advanced fields */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 overflow-hidden"
          >
            {/* Mood */}
            <div>
              <label className="text-sm text-white/70 block mb-2">How did you feel?</label>
              <div className="flex flex-wrap gap-2">
                {MOODS.map(mood => (
                  <button
                    key={mood}
                    onClick={() => updateField('mood', backstory.mood === mood ? null : mood)}
                    className={`px-3 py-1.5 rounded-full text-sm capitalize transition-colors ${
                      backstory.mood === mood
                        ? 'bg-amber-600 text-white'
                        : 'bg-gray-800 text-white/50 hover:text-white'
                    }`}
                  >
                    {mood}
                  </button>
                ))}
              </div>
            </div>

            {/* Significance */}
            <div>
              <label className="text-sm text-white/70 block mb-1">Why does this matter?</label>
              <textarea
                value={backstory.significance || ''}
                onChange={(e) => updateField('significance', e.target.value)}
                placeholder="Why is this moment important to you?"
                rows={2}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save button */}
      <div className="flex items-center justify-between pt-2">
        <div className="text-sm">
          {xpToEarn > 0 ? (
            <span className="text-amber-500 flex items-center gap-1">
              <Sparkles size={14} />
              Save to earn +{xpToEarn} XP
            </span>
          ) : currentXP > 0 ? (
            <span className="text-green-500 flex items-center gap-1">
              <Check size={14} />
              {currentXP} XP earned
            </span>
          ) : null}
        </div>
        
        <button
          onClick={saveBackstory}
          disabled={!hasChanges || saving}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            hasChanges
              ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white'
              : 'bg-gray-700 text-white/50 cursor-not-allowed'
          }`}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  )
}
