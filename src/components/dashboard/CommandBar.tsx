'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Mic, Send, Sparkles, X, Loader2, ChevronUp, ChevronDown } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const QUICK_COMMANDS = [
  { label: 'Add a memory', command: 'I want to create a new memory' },
  { label: 'My contacts', command: 'Show me my contacts' },
  { label: 'PostScripts', command: 'Take me to PostScripts' },
  { label: 'Life summary', command: 'Give me a summary of my life so far' },
]

export default function CommandBar() {
  const [input, setInput] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [isListening, setIsListening] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && isExpanded) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isExpanded])

  // Handle keyboard shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsExpanded(true)
        setTimeout(() => inputRef.current?.focus(), 100)
      }
      if (e.key === 'Escape' && isExpanded) {
        setIsExpanded(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isExpanded])

  const handleSubmit = async () => {
    const trimmedInput = input.trim()
    if (!trimmedInput || isLoading) return

    // Add user message
    const userMessage: Message = { role: 'user', content: trimmedInput }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setIsExpanded(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmedInput,
          history: messages.slice(-10), // Keep last 10 messages for context
        }),
      })

      const data = await res.json()

      if (data.error) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `Sorry, I encountered an error: ${data.error}` 
        }])
      } else {
        // Add assistant response
        if (data.response) {
          setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
        }

        // Handle actions
        if (data.action) {
          handleAction(data.action)
        }
      }
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I couldn\'t connect to the AI service.' 
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleAction = (action: { action: string; path?: string; type?: string }) => {
    if (action.action === 'navigate' && action.path) {
      router.push(action.path)
    } else if (action.action === 'create') {
      if (action.type === 'memory') {
        router.push('/dashboard/memories?create=true')
      } else if (action.type === 'contact') {
        router.push('/dashboard/contacts?create=true')
      } else if (action.type === 'postscript') {
        router.push('/dashboard/postscripts?create=true')
      }
    }
  }

  const handleQuickCommand = (command: string) => {
    setInput(command)
    setTimeout(() => handleSubmit(), 100)
  }

  const toggleVoice = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice input is not supported in this browser.')
      return
    }

    if (isListening) {
      setIsListening(false)
      return
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setInput(transcript)
      setIsListening(false)
    }

    recognition.start()
  }

  const clearChat = () => {
    setMessages([])
  }

  return (
    <div className={`fixed bottom-0 left-56 right-0 z-40 transition-all duration-300 ${
      isExpanded ? 'h-96' : 'h-auto'
    }`}>
      {/* Expanded Chat Area */}
      {isExpanded && (
        <div className="absolute bottom-full left-0 right-0 h-80 bg-gray-950/95 backdrop-blur-xl border-t border-white/10 overflow-hidden flex flex-col">
          {/* Chat Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
            <div className="flex items-center gap-2 text-white/70 text-sm">
              <Sparkles size={14} className="text-amber-500" />
              AI Assistant
            </div>
            <div className="flex items-center gap-2">
              {messages.length > 0 && (
                <button 
                  onClick={clearChat}
                  className="text-white/40 hover:text-white/70 text-xs"
                >
                  Clear
                </button>
              )}
              <button 
                onClick={() => setIsExpanded(false)}
                className="text-white/40 hover:text-white/70"
              >
                <ChevronDown size={18} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <Sparkles size={32} className="mx-auto text-amber-500/50 mb-3" />
                <p className="text-white/50 text-sm mb-4">Ask me anything about your life data</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {QUICK_COMMANDS.map((cmd) => (
                    <button
                      key={cmd.label}
                      onClick={() => handleQuickCommand(cmd.command)}
                      className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/60 text-sm rounded-lg transition-colors"
                    >
                      {cmd.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-2.5 rounded-2xl ${
                      msg.role === 'user'
                        ? 'bg-amber-500 text-white'
                        : 'bg-white/10 text-white/90'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/10 px-4 py-2.5 rounded-2xl">
                  <Loader2 size={16} className="animate-spin text-amber-500" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      {/* Input Bar */}
      <div className="p-3 sm:p-4 border-t border-white/10 bg-gray-950/90 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 bg-gray-900/90 rounded-xl sm:rounded-2xl border border-white/10 focus-within:border-amber-500/50 transition-colors">
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-white/50 hover:text-amber-500 transition-colors"
            >
              {isExpanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
            </button>
            
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              onFocus={() => setIsExpanded(true)}
              placeholder="Ask me anything... (⌘K)"
              className="flex-1 bg-transparent text-white placeholder-white/40 focus:outline-none text-sm min-w-0"
            />

            <button 
              onClick={toggleVoice}
              className={`flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm transition-colors whitespace-nowrap ${
                isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-800 text-white/70 hover:text-white'
              }`}
            >
              <Mic size={14} />
              <span className="hidden sm:inline">{isListening ? 'Listening...' : 'Voice'}</span>
            </button>

            <button 
              onClick={handleSubmit}
              disabled={isLoading || !input.trim()}
              className="w-8 h-8 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full flex items-center justify-center text-white flex-shrink-0 disabled:opacity-50 transition-opacity"
            >
              {isLoading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Send size={14} />
              )}
            </button>
          </div>

          <p className="text-center text-white/30 text-xs mt-2 hidden sm:block">
            Press ⌘K to open · Ask questions, navigate, or create content
          </p>
        </div>
      </div>
    </div>
  )
}
