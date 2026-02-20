'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

const GENDERS = [
  { id: 'Male', icon: '♂', label: 'Man' },
  { id: 'Female', icon: '♀', label: 'Woman' },
  { id: 'Non-binary', icon: '⚧', label: 'Non-binary' },
  { id: 'Other', icon: '⚥', label: 'Other' },
]

interface GenderWidgetProps {
  gender: string
  onUpdate: (gender: string) => void
}

export default function GenderWidget({ gender, onUpdate }: GenderWidgetProps) {
  const [showModal, setShowModal] = useState(false)

  const selected = GENDERS.find(g => g.id === gender)

  return (
    <div 
      className="flex-1 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-4 cursor-pointer hover:bg-white/15 transition-colors"
      onClick={() => setShowModal(true)}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-white font-medium text-sm">Gender</span>
        <span className="text-xs px-2 py-0.5 bg-blue-500/30 text-blue-300 rounded-full">⚡ 10 XP</span>
      </div>

      {selected ? (
        <div className="flex items-center gap-2">
          <span className="text-3xl">{selected.icon}</span>
          <span className="text-white/70 text-sm">{selected.label}</span>
        </div>
      ) : (
        <div className="text-white/40 text-sm">+ What is your gender?</div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700 w-full max-w-xs" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Gender</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {GENDERS.map((g) => (
                <button
                  key={g.id}
                  onClick={() => { onUpdate(g.id); setShowModal(false); }}
                  className={`p-4 rounded-xl flex flex-col items-center gap-2 transition-colors ${
                    gender === g.id ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <span className="text-3xl">{g.icon}</span>
                  <span className="text-sm">{g.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
