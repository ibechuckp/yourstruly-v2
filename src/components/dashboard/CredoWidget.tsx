'use client'

import { useState, useEffect } from 'react'
import { Quote, Pencil } from 'lucide-react'
import Modal from '@/components/ui/Modal'

const SUGGESTIONS = [
  "Be the change you want to see in the world.",
  "Live each day as if it were your last.",
  "Kindness costs nothing.",
  "Family first, always.",
  "Never stop learning.",
  "Leave the world better than you found it.",
  "Do what you love, love what you do.",
  "Integrity is everything.",
  "Progress, not perfection.",
  "Stay hungry, stay foolish.",
]

interface CredoWidgetProps {
  credo: string
  onUpdate: (credo: string) => void
}

export default function CredoWidget({ credo, onUpdate }: CredoWidgetProps) {
  const [showModal, setShowModal] = useState(false)
  const [tempValue, setTempValue] = useState(credo)

  useEffect(() => {
    if (showModal) setTempValue(credo)
  }, [showModal, credo])

  const save = () => {
    onUpdate(tempValue)
    setShowModal(false)
  }

  return (
    <>
      <div 
        className="bg-gradient-to-br from-amber-500/20 to-orange-500/10 backdrop-blur-md rounded-2xl border border-amber-500/30 p-4 cursor-pointer transition-all duration-300"
        onClick={() => setShowModal(true)}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Quote size={16} className="text-amber-400" />
            <span className="text-white font-medium text-sm">My credo</span>
          </div>
          <Pencil size={14} className="text-white/50" />
        </div>

        <p className="text-white/80 text-sm italic">
          {credo || <span className="text-white/40 not-italic">What do you live by?</span>}
        </p>
      </div>

      <Modal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        title="Your Personal Credo"
        showDone={false}
      >
        <textarea
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          placeholder="What's your life motto?"
          rows={3}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none mb-4"
        />
        
        <p className="text-gray-400 text-xs mb-3 uppercase tracking-wide">Or pick one:</p>
        <div className="space-y-2 mb-5">
          {SUGGESTIONS.map((s) => (
            <button 
              key={s} 
              onClick={() => setTempValue(s)} 
              className={`block w-full text-left px-4 py-3 rounded-lg text-sm transition-colors ${
                tempValue === s ? 'bg-amber-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              &ldquo;{s}&rdquo;
            </button>
          ))}
        </div>
        
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
          <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">
            Cancel
          </button>
          <button onClick={save} className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors">
            Save
          </button>
        </div>
      </Modal>
    </>
  )
}
