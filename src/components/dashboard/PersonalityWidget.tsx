'use client'

import { useState } from 'react'
import { Smile, Plus, X } from 'lucide-react'

const SUGGESTIONS = [
  'Introvert', 'Extrovert', 'Ambivert', 'Calm', 'Energetic',
  'Creative', 'Analytical', 'Empathetic', 'Adventurous', 'Optimistic',
  'Practical', 'Idealistic', 'Spontaneous', 'Organized', 'Curious',
  'Patient', 'Ambitious', 'Humble', 'Confident', 'Caring',
  'Independent', 'Loyal', 'Honest', 'Funny', 'Thoughtful'
]

interface PersonalityWidgetProps {
  traits: string[]
  onUpdate: (traits: string[]) => void
  isActive: boolean
  onToggle: () => void
}

export default function PersonalityWidget({ traits, onUpdate, isActive, onToggle }: PersonalityWidgetProps) {
  const [showModal, setShowModal] = useState(false)

  const toggle = (trait: string) => {
    if (traits.includes(trait)) {
      onUpdate(traits.filter(t => t !== trait))
    } else {
      onUpdate([...traits, trait])
    }
  }

  return (
    <div 
      className={`bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-4 cursor-pointer transition-all duration-300 ${isActive ? 'ring-2 ring-green-500/50' : 'hover:bg-white/15'}`}
      onClick={() => !showModal && onToggle()}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Smile size={16} className="text-white/70" />
          <span className="text-white font-medium text-sm">Personality</span>
        </div>
        <button onClick={(e) => { e.stopPropagation(); setShowModal(true); }} className="text-white/50 hover:text-white">
          <Plus size={16} />
        </button>
      </div>

      {traits.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {traits.slice(0, 3).map((trait) => (
            <span key={trait} className="px-3 py-1 bg-green-500/30 text-green-200 text-xs rounded-full">{trait}</span>
          ))}
          {traits.length > 3 && <span className="text-white/50 text-xs">+{traits.length - 3}</span>}
        </div>
      ) : (
        <div className="text-white/40 text-sm flex items-center gap-2">
          <Plus size={16} />
          Select what type of personality you are
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-lg">Personality Traits</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <p className="text-gray-400 text-sm mb-4">Select traits that describe you:</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((trait) => (
                <button
                  key={trait}
                  onClick={() => toggle(trait)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    traits.includes(trait) 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {trait}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
