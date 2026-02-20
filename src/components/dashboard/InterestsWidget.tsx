'use client'

import { useState } from 'react'
import { Plane, Plus, X } from 'lucide-react'
import Modal from '@/components/ui/Modal'

const SUGGESTIONS = [
  'Travel', 'Music', 'Sports', 'Reading', 'Gaming',
  'Cooking', 'Art', 'Photography', 'Fitness', 'Movies',
  'Nature', 'Technology', 'Fashion', 'Food', 'Pets',
  'Theater', 'Beach', 'Hiking', 'Singing', 'Dancing',
  'Writing', 'Meditation', 'Cars', 'Spirituality', 'Home Decor',
  'Culture', 'Investing', 'Self-improvement', 'Volunteering', 'Events'
]

interface InterestsWidgetProps {
  interests: string[]
  onUpdate: (interests: string[]) => void
}

export default function InterestsWidget({ interests, onUpdate }: InterestsWidgetProps) {
  const [showModal, setShowModal] = useState(false)
  const [customInput, setCustomInput] = useState('')

  const addInterest = (interest: string) => {
    if (!interests.includes(interest)) {
      onUpdate([...interests, interest])
    }
  }

  const removeInterest = (interest: string) => {
    onUpdate(interests.filter(i => i !== interest))
  }

  const addCustom = () => {
    if (customInput.trim() && !interests.includes(customInput.trim())) {
      onUpdate([...interests, customInput.trim()])
      setCustomInput('')
    }
  }

  const availableSuggestions = SUGGESTIONS.filter(s => !interests.includes(s))

  return (
    <>
      <div 
        className="bg-gray-900/90 rounded-2xl border border-white/10 p-4 cursor-pointer transition-all duration-300"
        onClick={() => setShowModal(true)}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Plane size={16} className="text-white/70" />
            <span className="text-white font-medium text-sm">Interests</span>
          </div>
          <span className="text-xs px-2 py-1 bg-blue-500/30 text-blue-300 rounded-full whitespace-nowrap">⚡ 100 XP</span>
        </div>

        {interests.length > 0 ? (
          <div className="flex flex-wrap gap-2 mb-2">
            {interests.slice(0, 4).map((interest) => (
              <span 
                key={interest}
                className="px-3 py-1 bg-gradient-to-r from-orange-500/30 to-yellow-500/30 text-white text-xs rounded-full flex items-center gap-1"
              >
                {interest}
                <button 
                  onClick={(e) => { e.stopPropagation(); removeInterest(interest); }}
                  className="hover:text-red-400"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
            {interests.length > 4 && (
              <span className="px-2 py-1 text-white/50 text-xs">+{interests.length - 4} more</span>
            )}
          </div>
        ) : (
          <div className="text-white/40 text-sm flex items-center gap-2">
            <Plus size={16} />
            Share your interests
          </div>
        )}

        <button
          onClick={(e) => { e.stopPropagation(); setShowModal(true); }}
          className="w-full mt-2 py-2 border border-dashed border-white/10 rounded-lg text-white/50 text-sm hover:bg-gray-900/80 hover:text-white/70 transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={14} />
          Add Interests
        </button>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Interests">
        {/* Custom Input */}
        <div className="flex gap-2 mb-5">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCustom()}
            placeholder="Type custom interest..."
            className="flex-1 px-4 py-2.5 bg-gray-900/80 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <button onClick={addCustom} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm transition-colors">Add</button>
        </div>

        {/* Current selections */}
        {interests.length > 0 && (
          <div className="mb-5">
            <p className="text-gray-400 text-xs mb-2 uppercase tracking-wide">Selected ({interests.length})</p>
            <div className="flex flex-wrap gap-2">
              {interests.map((interest) => (
                <span 
                  key={interest}
                  className="px-3 py-1.5 bg-amber-600/30 text-amber-200 text-sm rounded-full flex items-center gap-2"
                >
                  {interest}
                  <button onClick={() => removeInterest(interest)} className="hover:text-red-400 transition-colors">
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Suggestions */}
        <div>
          <p className="text-gray-400 text-xs mb-2 uppercase tracking-wide">Suggestions</p>
          <div className="flex flex-wrap gap-2">
            {availableSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => addInterest(suggestion)}
                className="px-3 py-1.5 bg-gray-900/80 hover:bg-gray-700 text-gray-300 hover:text-white text-sm rounded-full transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </>
  )
}
