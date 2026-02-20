'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'

const RELIGIONS = [
  { id: 'Christianity', icon: '✝️', label: 'Christian' },
  { id: 'Catholicism', icon: '⛪', label: 'Catholic' },
  { id: 'Islam', icon: '☪️', label: 'Muslim' },
  { id: 'Judaism', icon: '✡️', label: 'Jewish' },
  { id: 'Buddhism', icon: '☸️', label: 'Buddhist' },
  { id: 'Hinduism', icon: '🕉️', label: 'Hindu' },
  { id: 'Sikhism', icon: '🪯', label: 'Sikh' },
  { id: 'Spiritual', icon: '✨', label: 'Spiritual' },
  { id: 'Agnostic', icon: '🤔', label: 'Agnostic' },
  { id: 'Atheist', icon: '🔬', label: 'Atheist' },
  { id: 'Other', icon: '🙏', label: 'Other' },
]

interface ReligionWidgetProps {
  religions: string[]
  onUpdate: (religions: string[]) => void
}

export default function ReligionWidget({ religions, onUpdate }: ReligionWidgetProps) {
  const [showModal, setShowModal] = useState(false)

  const selected = RELIGIONS.find(r => religions.includes(r.id))

  const toggle = (id: string) => {
    if (religions.includes(id)) {
      onUpdate(religions.filter(r => r !== id))
    } else {
      onUpdate([...religions, id])
    }
  }

  return (
    <>
      <div 
        className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl border border-white/20 p-4 cursor-pointer transition-colors"
        onClick={() => setShowModal(true)}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-white font-medium text-sm">Religion</span>
          <span className="text-xs px-2 py-0.5 bg-blue-500/30 text-blue-300 rounded-full whitespace-nowrap">⚡10 XP</span>
        </div>

        {selected ? (
          <div className="flex items-center gap-2">
            <span className="text-2xl">{selected.icon}</span>
            <span className="text-white/70 text-sm">{selected.label}</span>
          </div>
        ) : (
          <div className="text-white/40 text-sm">+ Select religion</div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Religion / Beliefs" maxWidth="max-w-sm">
        <div className="grid grid-cols-3 gap-2">
          {RELIGIONS.map((r) => (
            <button
              key={r.id}
              onClick={() => toggle(r.id)}
              className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-all ${
                religions.includes(r.id) ? 'bg-amber-600 text-white ring-2 ring-amber-400' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <span className="text-2xl">{r.icon}</span>
              <span className="text-xs">{r.label}</span>
            </button>
          ))}
        </div>
        {religions.length > 0 && (
          <p className="text-gray-500 text-xs mt-4">{religions.length} selected</p>
        )}
      </Modal>
    </>
  )
}
