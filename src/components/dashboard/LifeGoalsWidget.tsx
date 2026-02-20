'use client'

import { useState } from 'react'
import { Target, Pencil, Plus, X } from 'lucide-react'

const SUGGESTIONS = [
  'Start a family', 'Travel the world', 'Write a book', 'Learn a new language',
  'Start a business', 'Buy a house', 'Get healthier', 'Make a difference',
  'Master a skill', 'Build lasting relationships', 'Achieve financial freedom',
  'Live abroad', 'Run a marathon', 'Learn an instrument', 'Give back to community'
]

interface LifeGoalsWidgetProps {
  goals: string[]
  onUpdate: (goals: string[]) => void
  isActive: boolean
  onToggle: () => void
}

export default function LifeGoalsWidget({ goals, onUpdate, isActive, onToggle }: LifeGoalsWidgetProps) {
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
    <div 
      className={`bg-gradient-to-br from-purple-500/20 to-pink-500/10 backdrop-blur-xl rounded-2xl border border-purple-500/30 p-4 cursor-pointer transition-all duration-300 ${isActive ? 'ring-2 ring-purple-500/50' : 'hover:bg-white/15'}`}
      onClick={() => !showModal && onToggle()}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Target size={16} className="text-purple-400" />
          <span className="text-white font-medium text-sm">Life goals</span>
        </div>
        <button onClick={(e) => { e.stopPropagation(); setShowModal(true); }} className="text-white/50 hover:text-white">
          <Pencil size={14} />
        </button>
      </div>

      {goals.length > 0 ? (
        <p className="text-white/80 text-sm">{goals[0]}{goals.length > 1 && <span className="text-white/50"> +{goals.length - 1} more</span>}</p>
      ) : (
        <p className="text-white/40 text-sm">What are your dreams?</p>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700 w-full max-w-md max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-white font-semibold text-lg mb-4">Life Goals</h3>
            
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCustom()}
                placeholder="Add a goal..."
                className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none"
              />
              <button onClick={addCustom} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm">Add</button>
            </div>

            {goals.length > 0 && (
              <div className="mb-4">
                <p className="text-gray-400 text-xs mb-2">Your goals:</p>
                <div className="space-y-2">
                  {goals.map((goal) => (
                    <div key={goal} className="flex items-center justify-between px-3 py-2 bg-purple-600/20 rounded-lg">
                      <span className="text-white text-sm">{goal}</span>
                      <button onClick={() => removeGoal(goal)} className="text-white/50 hover:text-red-400"><X size={16} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-gray-400 text-xs mb-2">Suggestions:</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.filter(s => !goals.includes(s)).map((s) => (
                <button key={s} onClick={() => addGoal(s)} className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-full">{s}</button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
