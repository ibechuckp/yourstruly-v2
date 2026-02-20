'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

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
    <div 
      className="flex-1 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-4 cursor-pointer hover:bg-white/15 transition-colors"
      onClick={() => setShowModal(true)}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-white font-medium text-sm">Religion</span>
        <span className="text-xs px-2 py-0.5 bg-blue-500/30 text-blue-300 rounded-full">⚡ 10 XP</span>
      </div>

      {selected ? (
        <div className="flex items-center gap-2">
          <span className="text-2xl">{selected.icon}</span>
          <span className="text-white/70 text-sm">{selected.label}</span>
        </div>
      ) : (
        <div className="text-white/40 text-sm">+ no religion yet</div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Religion / Beliefs</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {RELIGIONS.map((r) => (
                <button
                  key={r.id}
                  onClick={() => toggle(r.id)}
                  className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-colors ${
                    religions.includes(r.id) ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <span className="text-2xl">{r.icon}</span>
                  <span className="text-xs">{r.label}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setShowModal(false)} className="w-full mt-4 py-2 bg-purple-600 text-white rounded-lg">Done</button>
          </div>
        </div>
      )}
    </div>
  )
}
