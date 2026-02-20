'use client'

import { useState } from 'react'
import { Mic, Send, Sparkles } from 'lucide-react'

const PROMPTS = [
  'My credo',
  'Life goals', 
  'Create memory',
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
    <div className="p-3 sm:p-4 border-t border-white/10 sticky bottom-0 bg-black/20 backdrop-blur-sm">
      {/* Suggested Prompts - hidden on mobile */}
      <div className="hidden sm:flex items-center gap-2 mb-3 justify-center">
        <span className="text-white/50 text-sm">Suggested prompts</span>
        {PROMPTS.map((prompt) => (
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
        <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl border border-white/20">
          <button className="text-white/50 hover:text-white transition-colors hidden sm:block">
            <Sparkles size={20} />
          </button>
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="Type here"
            className="flex-1 bg-transparent text-white placeholder-white/40 focus:outline-none text-sm min-w-0"
          />

          <button 
            onClick={() => setMicEnabled(!micEnabled)}
            className={`flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm transition-colors whitespace-nowrap ${
              micEnabled ? 'bg-red-500 text-white' : 'bg-white/10 text-white/70'
            }`}
          >
            <Mic size={14} />
            <span className="hidden sm:inline">Mic {micEnabled ? 'On' : 'Off'}</span>
          </button>

          <button 
            onClick={handleSubmit}
            className="w-8 h-8 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center text-white flex-shrink-0"
          >
            <Send size={14} />
          </button>
        </div>

        <p className="text-center text-white/30 text-xs mt-2 hidden sm:block">
          ⓘ AI personal assistant can make mistakes. Check important info.
        </p>
      </div>
    </div>
  )
}
