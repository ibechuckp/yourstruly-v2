'use client'

import { useState } from 'react'
import { Plane, Plus, X } from 'lucide-react'

const SUGGESTIONS = [
  '✈️ Travel', '🎵 Music', '⚽ Sports', '📚 Reading', '🎮 Gaming',
  '🍳 Cooking', '🎨 Art', '📷 Photography', '💪 Fitness', '🎬 Movies',
  '🌿 Nature', '💻 Technology', '👗 Fashion', '🍕 Food', '🐕 Pets',
  '🎭 Theater', '🏖️ Beach', '⛰️ Hiking', '🎤 Singing', '💃 Dancing',
  '📝 Writing', '🧘 Meditation', '🚗 Cars', '✨ Spirituality', '🏠 Home Decor',
  '🌍 Culture', '📈 Investing', '🎯 Self-improvement', '🤝 Volunteering', '🎪 Events'
]

interface InterestsWidgetProps {
  interests: string[]
  onUpdate: (interests: string[]) => void
  isActive: boolean
  onToggle: () => void
}

export default function InterestsWidget({ interests, onUpdate, isActive, onToggle }: InterestsWidgetProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
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
    <div 
      className={`bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-4 cursor-pointer transition-all duration-300 ${isActive ? 'ring-2 ring-orange-500/50' : 'hover:bg-white/15'}`}
      onClick={() => !showSuggestions && onToggle()}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Plane size={16} className="text-white/70" />
          <span className="text-white font-medium text-sm">Interests</span>
        </div>
        <span className="text-xs px-2 py-1 bg-blue-500/30 text-blue-300 rounded-full">⚡ 100 XP</span>
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
          Feel free to share your interests or add new ones here!
        </div>
      )}

      {/* Add Button */}
      <button
        onClick={(e) => { e.stopPropagation(); setShowSuggestions(true); }}
        className="w-full mt-2 py-2 border border-dashed border-white/20 rounded-lg text-white/50 text-sm hover:bg-white/10 hover:text-white/70 transition-colors flex items-center justify-center gap-2"
      >
        <Plus size={14} />
        Add Interests
      </button>

      {/* Suggestions Modal */}
      {showSuggestions && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowSuggestions(false)}>
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700 w-full max-w-md max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-lg">Add Interests</h3>
              <button onClick={() => setShowSuggestions(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            {/* Custom Input */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCustom()}
                placeholder="Type custom interest..."
                className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button onClick={addCustom} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm">Add</button>
            </div>

            {/* Current */}
            {interests.length > 0 && (
              <div className="mb-4">
                <p className="text-gray-400 text-xs mb-2">Selected:</p>
                <div className="flex flex-wrap gap-2">
                  {interests.map((interest) => (
                    <span 
                      key={interest}
                      className="px-3 py-1 bg-purple-600/30 text-purple-300 text-sm rounded-full flex items-center gap-1"
                    >
                      {interest}
                      <button onClick={() => removeInterest(interest)} className="hover:text-red-400">
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions */}
            <p className="text-gray-400 text-xs mb-2">Suggestions:</p>
            <div className="flex flex-wrap gap-2">
              {availableSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => addInterest(suggestion)}
                  className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-full transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
