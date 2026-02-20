'use client'

import { useState } from 'react'
import { Lightbulb, Plus, X } from 'lucide-react'

const SUGGESTIONS = [
  'Leadership', 'Communication', 'Creativity', 'Problem-solving', 'Teamwork',
  'Writing', 'Design', 'Coding', 'Marketing', 'Public Speaking',
  'Project Management', 'Data Analysis', 'Sales', 'Negotiation', 'Teaching',
  'Research', 'Strategic Planning', 'Customer Service', 'Financial Analysis', 'Networking',
  'Time Management', 'Critical Thinking', 'Adaptability', 'Empathy', 'Organization'
]

interface SkillsWidgetProps {
  skills: string[]
  onUpdate: (skills: string[]) => void
  isActive: boolean
  onToggle: () => void
}

export default function SkillsWidget({ skills, onUpdate, isActive, onToggle }: SkillsWidgetProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [customInput, setCustomInput] = useState('')

  const addSkill = (skill: string) => {
    if (!skills.includes(skill)) {
      onUpdate([...skills, skill])
    }
  }

  const removeSkill = (skill: string) => {
    onUpdate(skills.filter(s => s !== skill))
  }

  const addCustom = () => {
    if (customInput.trim() && !skills.includes(customInput.trim())) {
      onUpdate([...skills, customInput.trim()])
      setCustomInput('')
    }
  }

  const availableSuggestions = SUGGESTIONS.filter(s => !skills.includes(s))

  return (
    <div 
      className={`bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-4 cursor-pointer transition-all duration-300 ${isActive ? 'ring-2 ring-blue-500/50' : 'hover:bg-white/15'}`}
      onClick={() => !showSuggestions && onToggle()}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Lightbulb size={16} className="text-white/70" />
          <span className="text-white font-medium text-sm">Skills</span>
        </div>
        <span className="text-xs px-2 py-1 bg-blue-500/30 text-blue-300 rounded-full">⚡ 100 XP</span>
      </div>

      {skills.length > 0 ? (
        <div className="flex flex-wrap gap-2 mb-2">
          {skills.slice(0, 3).map((skill) => (
            <span 
              key={skill}
              className="px-3 py-1 bg-blue-500/30 text-blue-200 text-xs rounded-full flex items-center gap-1"
            >
              {skill}
              <button 
                onClick={(e) => { e.stopPropagation(); removeSkill(skill); }}
                className="hover:text-red-400"
              >
                <X size={12} />
              </button>
            </span>
          ))}
          {skills.length > 3 && (
            <span className="px-2 py-1 text-white/50 text-xs">+{skills.length - 3} more</span>
          )}
        </div>
      ) : (
        <div className="text-white/40 text-sm flex items-center gap-2">
          <Plus size={16} />
          Feel free to add your skills here!
        </div>
      )}

      <button
        onClick={(e) => { e.stopPropagation(); setShowSuggestions(true); }}
        className="w-full mt-2 py-2 border border-dashed border-white/20 rounded-lg text-white/50 text-sm hover:bg-white/10 hover:text-white/70 transition-colors flex items-center justify-center gap-2"
      >
        <Plus size={14} />
        Add Skills
      </button>

      {showSuggestions && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowSuggestions(false)}>
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700 w-full max-w-md max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-lg">Add Skills</h3>
              <button onClick={() => setShowSuggestions(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCustom()}
                placeholder="Type custom skill..."
                className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button onClick={addCustom} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Add</button>
            </div>

            {skills.length > 0 && (
              <div className="mb-4">
                <p className="text-gray-400 text-xs mb-2">Selected:</p>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <span key={skill} className="px-3 py-1 bg-blue-600/30 text-blue-300 text-sm rounded-full flex items-center gap-1">
                      {skill}
                      <button onClick={() => removeSkill(skill)} className="hover:text-red-400"><X size={12} /></button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <p className="text-gray-400 text-xs mb-2">Suggestions:</p>
            <div className="flex flex-wrap gap-2">
              {availableSuggestions.map((s) => (
                <button key={s} onClick={() => addSkill(s)} className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-full transition-colors">{s}</button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
