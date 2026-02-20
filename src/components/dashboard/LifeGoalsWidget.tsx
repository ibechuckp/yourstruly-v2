'use client'

import { useState } from 'react'
import { Target, Pencil, X } from 'lucide-react'
import Modal from '@/components/ui/Modal'

const SUGGESTIONS = [
  'Start a family', 'Travel the world', 'Write a book', 'Learn a new language',
  'Start a business', 'Buy a house', 'Get healthier', 'Make a difference',
  'Master a skill', 'Build lasting relationships', 'Achieve financial freedom',
  'Live abroad', 'Run a marathon', 'Learn an instrument', 'Give back to community'
]

interface LifeGoalsWidgetProps {
  goals: string[]
  onUpdate: (goals: string[]) => void
}

export default function LifeGoalsWidget({ goals, onUpdate }: LifeGoalsWidgetProps) {
  const [showModal, setShowModal] = useState(false)
  const [customInput, setCustomInput] = useState('')

  const addGoal = (goal: string) => {
    if (!goals.includes(goal)) onUpdate([...goals, goal])
  }

  const removeGoal = (goal: string) => {
    onUpdate(goals.filter(g => g !== goal))
  }

  const addCustom = () => {
    if (customInput.trim()) {
      addGoal(customInput.trim())
      setCustomInput('')
    }
  }

  return (
    <>
      <div 
        className="bg-gradient-to-br from-amber-500/20 to-orange-500/10 backdrop-blur-md rounded-2xl border border-amber-500/30 p-4 cursor-pointer transition-all duration-300"
        onClick={() => setShowModal(true)}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Target size={16} className="text-amber-400" />
            <span className="text-white font-medium text-sm">Life goals</span>
          </div>
          <Pencil size={14} className="text-white/50" />
        </div>

        {goals.length > 0 ? (
          <p className="text-white/80 text-sm">{goals[0]}{goals.length > 1 && <span className="text-white/50"> +{goals.length - 1} more</span>}</p>
        ) : (
          <p className="text-white/40 text-sm">What are your dreams?</p>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Life Goals">
        <div className="flex gap-2 mb-5">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCustom()}
            placeholder="Add a goal..."
            className="flex-1 px-4 py-2.5 bg-gray-900/80 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <button onClick={addCustom} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm transition-colors">Add</button>
        </div>

        {goals.length > 0 && (
          <div className="mb-5">
            <p className="text-gray-400 text-xs mb-2 uppercase tracking-wide">Your Goals ({goals.length})</p>
            <div className="space-y-2">
              {goals.map((goal) => (
                <div key={goal} className="flex items-center justify-between px-4 py-3 bg-amber-600/20 rounded-lg">
                  <span className="text-white text-sm">{goal}</span>
                  <button onClick={() => removeGoal(goal)} className="text-white/50 hover:text-red-400 transition-colors"><X size={18} /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="text-gray-400 text-xs mb-2 uppercase tracking-wide">Suggestions</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.filter(s => !goals.includes(s)).map((s) => (
              <button key={s} onClick={() => addGoal(s)} className="px-3 py-1.5 bg-gray-900/80 hover:bg-gray-700 text-gray-300 hover:text-white text-sm rounded-full transition-colors">{s}</button>
            ))}
          </div>
        </div>
      </Modal>
    </>
  )
}
