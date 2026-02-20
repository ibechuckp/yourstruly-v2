'use client'

import { useState } from 'react'
import { Quote, Pencil } from 'lucide-react'

const SUGGESTIONS = [
  "Be the change you want to see in the world.",
  "Live each day as if it were your last.",
  "Kindness costs nothing.",
  "Family first, always.",
  "Never stop learning.",
  "Leave the world better than you found it.",
  "Do what you love, love what you do.",
  "Integrity is everything.",
]

interface CredoWidgetProps {
  credo: string
  onUpdate: (credo: string) => void
  isActive: boolean
  onToggle: () => void
}

export default function CredoWidget({ credo, onUpdate, isActive, onToggle }: CredoWidgetProps) {
  const [showModal, setShowModal] = useState(false)
  const [tempValue, setTempValue] = useState(credo)

  const save = () => {
    onUpdate(tempValue)
    setShowModal(false)
  }

  return (
    <div 
      className={`bg-gradient-to-br from-amber-500/20 to-orange-500/10 backdrop-blur-xl rounded-2xl border border-amber-500/30 p-4 cursor-pointer transition-all duration-300 ${isActive ? 'ring-2 ring-amber-500/50' : 'hover:bg-white/15'}`}
      onClick={() => !showModal && onToggle()}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Quote size={16} className="text-amber-400" />
          <span className="text-white font-medium text-sm">My credo</span>
        </div>
        <button onClick={(e) => { e.stopPropagation(); setTempValue(credo); setShowModal(true); }} className="text-white/50 hover:text-white">
          <Pencil size={14} />
        </button>
      </div>

      <p className="text-white/80 text-sm italic">
        {credo || <span className="text-white/40 not-italic">What do you live by?</span>}
      </p>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-white font-semibold text-lg mb-4">Your Personal Credo</h3>
            <textarea
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              placeholder="What's your life motto?"
              rows={3}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none mb-4"
            />
            <p className="text-gray-400 text-xs mb-3">Or pick one:</p>
            <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => setTempValue(s)} className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${tempValue === s ? 'bg-amber-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
                  "{s}"
                </button>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-400">Cancel</button>
              <button onClick={save} className="px-4 py-2 bg-amber-600 text-white rounded-lg">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
