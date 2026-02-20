'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'

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

  const selectGender = (id: string) => {
    onUpdate(id)
    setShowModal(false)
  }

  return (
    <>
      <div 
        className="bg-gray-900/90 rounded-2xl border border-white/10 p-4 cursor-pointer transition-colors"
        onClick={() => setShowModal(true)}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-white font-medium text-sm">Gender</span>
          <span className="text-xs px-2 py-0.5 bg-blue-500/30 text-blue-300 rounded-full whitespace-nowrap">⚡10 XP</span>
        </div>

        {selected ? (
          <div className="flex items-center gap-2">
            <span className="text-2xl">{selected.icon}</span>
            <span className="text-white/70 text-sm">{selected.label}</span>
          </div>
        ) : (
          <div className="text-white/40 text-sm">+ Select gender</div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Gender" maxWidth="max-w-xs" showDone={false}>
        <div className="grid grid-cols-2 gap-3">
          {GENDERS.map((g) => (
            <button
              key={g.id}
              onClick={() => selectGender(g.id)}
              className={`p-5 rounded-xl flex flex-col items-center gap-2 transition-all ${
                gender === g.id ? 'bg-amber-600 text-white ring-2 ring-amber-400' : 'bg-gray-900/80 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <span className="text-4xl">{g.icon}</span>
              <span className="text-sm font-medium">{g.label}</span>
            </button>
          ))}
        </div>
      </Modal>
    </>
  )
}
