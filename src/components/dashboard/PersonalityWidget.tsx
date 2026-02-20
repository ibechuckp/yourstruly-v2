'use client'

import { useState } from 'react'
import { Smile, Plus } from 'lucide-react'
import Modal from '@/components/ui/Modal'

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
}

export default function PersonalityWidget({ traits, onUpdate }: PersonalityWidgetProps) {
  const [showModal, setShowModal] = useState(false)

  const toggle = (trait: string) => {
    if (traits.includes(trait)) {
      onUpdate(traits.filter(t => t !== trait))
    } else {
      onUpdate([...traits, trait])
    }
  }

  return (
    <>
      <div 
        className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-4 cursor-pointer transition-all duration-300"
        onClick={() => setShowModal(true)}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Smile size={16} className="text-white/70" />
            <span className="text-white font-medium text-sm">Personality</span>
          </div>
          <Plus size={16} className="text-white/50" />
        </div>

        {traits.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {traits.slice(0, 3).map((trait) => (
              <span key={trait} className="px-3 py-1 bg-amber-500/30 text-amber-200 text-xs rounded-full">{trait}</span>
            ))}
            {traits.length > 3 && <span className="text-white/50 text-xs">+{traits.length - 3}</span>}
          </div>
        ) : (
          <div className="text-white/40 text-sm flex items-center gap-2">
            <Plus size={16} />
            Select your personality traits
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Personality Traits">
        <p className="text-gray-400 text-sm mb-4">Select traits that describe you:</p>
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((trait) => (
            <button
              key={trait}
              onClick={() => toggle(trait)}
              className={`px-4 py-2 rounded-full text-sm transition-all ${
                traits.includes(trait) 
                  ? 'bg-amber-600 text-white ring-2 ring-amber-400' 
                  : 'bg-gray-900/80 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {trait}
            </button>
          ))}
        </div>
        {traits.length > 0 && (
          <p className="text-gray-500 text-xs mt-4">{traits.length} selected</p>
        )}
      </Modal>
    </>
  )
}
