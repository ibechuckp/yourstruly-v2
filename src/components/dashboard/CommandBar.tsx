'use client'

import { useState } from 'react'
import { Mic, Send, Sparkles } from 'lucide-react'

const PROMPTS = [
  'My credo',
  'Life goals', 
  'Create memory',
  'Add contact',
  'Tell me about myself'
]

export default function CommandBar() {
  const [input, setInput] = useState('')
  const [micEnabled, setMicEnabled] = useState(false)

  const handleSubmit = () => {
    if (!input.trim()) return
    // TODO: Handle AI command
    console.log('Command:', input)
    setInput('')
  }

  const handlePrompt = (prompt: string) => {
    setInput(prompt)
  }

  return (
    <div className="p-4 border-t border-white/10">
      {/* Suggested Prompts */}
      <div className="flex items-center gap-2 mb-3 justify-center">
        <span className="text-white/50 text-sm">Suggested prompts</span>
        {PROMPTS.slice(0, 3).map((prompt) => (
          <button
            key={prompt}
            onClick={() => handlePrompt(prompt)}
            className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white/70 text-sm rounded-full transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 px-4 py-3 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20">
          <button className="text-white/50 hover:text-white transition-colors">
            <Sparkles size={20} />
          </button>
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="Type here"
            className="flex-1 bg-transparent text-white placeholder-white/40 focus:outline-none text-sm"
          />

          <button className="text-white/50 hover:text-white transition-colors">
            📋
          </button>

          <button 
            onClick={() => setMicEnabled(!micEnabled)}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-colors ${
              micEnabled ? 'bg-red-500 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            <Mic size={14} />
            Mic {micEnabled ? 'On' : 'Off'}
          </button>

          <button 
            onClick={handleSubmit}
            className="w-8 h-8 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center text-white hover:opacity-90 transition-opacity"
          >
            <Send size={14} />
          </button>
        </div>

        <p className="text-center text-white/30 text-xs mt-2">
          ⓘ AI personal assistant can make mistakes. Check important info.
        </p>
      </div>
    </div>
  )
}
