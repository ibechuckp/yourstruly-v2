'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Mic, 
  MicOff, 
  PhoneOff, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle,
  Loader2,
  Volume2,
  Radio,
  User,
  Bot
} from 'lucide-react'
import { VoiceChatState } from '@/hooks/useVoiceChat'

interface VoiceChatUIProps {
  state: VoiceChatState
  transcript: { role: 'user' | 'assistant', text: string, timestamp: number }[]
  currentUserText: string
  currentAiText: string
  error: Error | null
  onStart: () => void
  onStop: () => void
  onAbort: () => void
  showTranscript?: boolean
  className?: string
}

/**
 * VoiceChatUI - Styled UI component for voice chat
 * 
 * Features:
 * - Big microphone button with pulse animation
 * - Waveform/pulse animation when speaking
 * - "AI is thinking..." state
 * - "AI is speaking..." state with audio visualization
 * - Collapsible transcript panel
 * - End session button
 */
export function VoiceChatUI({
  state,
  transcript,
  currentUserText,
  currentAiText,
  error,
  onStart,
  onStop,
  onAbort,
  showTranscript = true,
  className = '',
}: VoiceChatUIProps) {
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false)

  const isActive = state !== 'idle' && state !== 'error'
  const isListening = state === 'listening'
  const isThinking = state === 'thinking'
  const isAiSpeaking = state === 'aiSpeaking'
  const isConnecting = state === 'connecting' || state === 'requesting'

  return (
    <div className={`relative ${className}`}>
      {/* Main Voice Chat Container */}
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-[#406A56]/10 shadow-lg overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#406A56]/10">
          <div className="flex items-center gap-2">
            <div className={`
              w-2 h-2 rounded-full
              ${isActive ? 'bg-green-500' : 'bg-gray-400'}
              ${isActive && 'animate-pulse'}
            `} />
            <span className="text-sm font-medium text-[#406A56]">
              {state === 'idle' && 'Voice Chat'}
              {state === 'requesting' && 'Getting ready...'}
              {state === 'connecting' && 'Connecting...'}
              {state === 'connected' && 'Connected - Ready'}
              {state === 'listening' && 'Listening...'}
              {state === 'thinking' && 'AI is thinking...'}
              {state === 'aiSpeaking' && 'AI is speaking...'}
              {state === 'error' && 'Error'}
            </span>
          </div>

          {isActive && (
            <button
              onClick={onStop}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-full transition-colors"
            >
              <PhoneOff size={12} />
              End
            </button>
          )}
        </div>

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 py-3 bg-red-50 border-b border-red-100"
            >
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-red-600">{error.message}</p>
                  <button
                    onClick={onAbort}
                    className="text-xs text-red-500 hover:text-red-700 underline mt-1"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <div className="p-6 flex flex-col items-center">
          
          {/* Status Icon / Microphone Button */}
          <div className="relative mb-6">
            {/* Pulse rings when active */}
            <AnimatePresence>
              {isListening && (
                <>
                  <motion.div
                    initial={{ scale: 1, opacity: 0.5 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute inset-0 rounded-full bg-[#406A56]"
                  />
                  <motion.div
                    initial={{ scale: 1, opacity: 0.3 }}
                    animate={{ scale: 1.8, opacity: 0 }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                    className="absolute inset-0 rounded-full bg-[#406A56]"
                  />
                </>
              )}
            </AnimatePresence>

            {/* Main Button */}
            <motion.button
              onClick={state === 'idle' ? onStart : state === 'error' ? onStart : onStop}
              disabled={isConnecting}
              className={`
                relative w-24 h-24 rounded-full flex items-center justify-center
                transition-all duration-300 shadow-lg
                ${isConnecting 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : isListening
                    ? 'bg-[#406A56] text-white shadow-[#406A56]/30'
                    : isAiSpeaking
                      ? 'bg-[#D9C61A] text-white shadow-[#D9C61A]/30'
                      : isActive
                        ? 'bg-[#406A56]/10 text-[#406A56] hover:bg-[#406A56]/20'
                        : 'bg-[#406A56] text-white hover:bg-[#4a7a64]'
                }
              `}
              whileTap={{ scale: 0.95 }}
            >
              {isConnecting ? (
                <Loader2 size={32} className="animate-spin" />
              ) : isListening ? (
                <Mic size={32} />
              ) : isAiSpeaking ? (
                <Volume2 size={32} />
              ) : isActive ? (
                <Radio size={32} />
              ) : (
                <Mic size={32} />
              )}
            </motion.button>

            {/* Status indicator badge */}
            <AnimatePresence>
              {isListening && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
                >
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Status Text */}
          <div className="text-center mb-4">
            <AnimatePresence mode="wait">
              {isConnecting ? (
                <motion.p
                  key="connecting"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-[#406A56]/60 text-sm"
                >
                  Connecting to AI voice assistant...
                </motion.p>
              ) : isListening ? (
                <motion.p
                  key="listening"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-[#406A56] font-medium"
                >
                  Listening... Speak now
                </motion.p>
              ) : isThinking ? (
                <motion.div
                  key="thinking"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2 justify-center"
                >
                  <Loader2 size={16} className="animate-spin text-[#406A56]" />
                  <span className="text-[#406A56] font-medium">AI is thinking...</span>
                </motion.div>
              ) : isAiSpeaking ? (
                <motion.div
                  key="speaking"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col items-center gap-2"
                >
                  <span className="text-[#D9C61A] font-medium">AI is speaking...</span>
                  {/* Audio visualization bars */}
                  <div className="flex items-end gap-1 h-8">
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-1.5 bg-[#D9C61A] rounded-full"
                        animate={{
                          height: [8, 24, 12, 32, 16],
                        }}
                        transition={{
                          duration: 0.8,
                          repeat: Infinity,
                          delay: i * 0.1,
                          ease: "easeInOut",
                        }}
                      />
                    ))}
                  </div>
                </motion.div>
              ) : isActive ? (
                <motion.p
                  key="connected"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-[#406A56]/60 text-sm"
                >
                  Connected - Waiting for you to speak
                </motion.p>
              ) : (
                <motion.p
                  key="idle"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-[#406A56]/60 text-sm"
                >
                  Click the microphone to start
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Current Text Display (Live) */}
          <AnimatePresence>
            {(currentUserText || currentAiText) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="w-full max-w-md space-y-3"
              >
                {/* User text */}
                {currentUserText && (
                  <div className="flex items-start gap-2 p-3 bg-[#406A56]/5 rounded-xl">
                    <User size={16} className="text-[#406A56] mt-0.5 shrink-0" />
                    <p className="text-[#406A56] text-sm">{currentUserText}</p>
                  </div>
                )}
                
                {/* AI text */}
                {currentAiText && (
                  <div className="flex items-start gap-2 p-3 bg-[#D9C61A]/10 rounded-xl">
                    <Bot size={16} className="text-[#D9C61A] mt-0.5 shrink-0" />
                    <p className="text-[#406A56] text-sm">{currentAiText}</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Transcript Panel (Collapsible) */}
        {showTranscript && transcript.length > 0 && (
          <div className="border-t border-[#406A56]/10">
            <button
              onClick={() => setIsTranscriptOpen(!isTranscriptOpen)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-[#406A56]/70 hover:bg-[#406A56]/5 transition-colors"
            >
              <span>Transcript ({transcript.length} messages)</span>
              {isTranscriptOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            <AnimatePresence>
              {isTranscriptOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="max-h-64 overflow-y-auto p-4 space-y-3">
                    {transcript.map((entry, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: entry.role === 'user' ? -10 : 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`
                          flex gap-2 p-3 rounded-xl
                          ${entry.role === 'user' 
                            ? 'bg-[#406A56]/5 ml-4' 
                            : 'bg-[#D9C61A]/10 mr-4'
                          }
                        `}
                      >
                        <div className="shrink-0">
                          {entry.role === 'user' ? (
                            <div className="w-6 h-6 rounded-full bg-[#406A56]/20 flex items-center justify-center">
                              <User size={12} className="text-[#406A56]" />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-[#D9C61A]/30 flex items-center justify-center">
                              <Bot size={12} className="text-[#D9C61A]" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-[#406A56]/50 mb-0.5">
                            {entry.role === 'user' ? 'You' : 'AI'}
                          </p>
                          <p className="text-sm text-[#406A56]">{entry.text}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Footer hint */}
        {isActive && (
          <div className="px-4 py-2 bg-[#406A56]/5 text-center">
            <p className="text-xs text-[#406A56]/50">
              The AI will automatically detect when you finish speaking
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
