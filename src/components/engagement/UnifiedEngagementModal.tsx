'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Mic, Video, VideoOff, Camera, Loader2, Sparkles, StopCircle } from 'lucide-react'
import { VoiceVideoChat } from '@/components/voice'
import type { PersonaConfig } from '@/types/voice'

interface UnifiedEngagementModalProps {
  prompt: {
    id: string
    type: string
    promptText: string
    photoUrl?: string
    contactName?: string
    contactId?: string
    metadata?: Record<string, any>
  }
  expectedXp?: number
  onComplete: (result: {
    memoryId?: string
    responseText?: string
    xpAwarded: number
  }) => void
  onClose: () => void
}

type InputMode = 'text' | 'voice' | 'video'

/**
 * UnifiedEngagementModal - Single modal for all engagement response types
 * 
 * Starts with text input by default, with voice and video options available.
 * When voice/video is selected, switches to the VoiceVideoChat component.
 */
export function UnifiedEngagementModal({
  prompt,
  expectedXp = 25,
  onComplete,
  onClose,
}: UnifiedEngagementModalProps) {
  const [inputMode, setInputMode] = useState<InputMode>('text')
  const [textValue, setTextValue] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [completed, setCompleted] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Focus textarea on mount
  useEffect(() => {
    if (inputMode === 'text' && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [inputMode])

  // Build custom persona with the actual prompt question
  const buildPersona = useCallback((): PersonaConfig => {
    const questionText = prompt.metadata?.question_text || prompt.promptText
    const contactContext = prompt.contactName ? ` about ${prompt.contactName}` : ''
    
    return {
      name: 'Interviewer',
      description: 'A warm interviewer gathering your story',
      voice: 'coral',
      style: 'warm',
      systemPrompt: `You are a warm, thoughtful interviewer helping someone share a meaningful story or memory. 

The user is responding to this specific question: "${questionText}"${contactContext}

Your job:
1. Start by acknowledging their response and asking a natural follow-up about the SPECIFIC topic
2. Ask one question at a time
3. Dig for details: who, what, when, where, how it felt
4. After about 5 exchanges, offer to save: "This is wonderful - we have a great memory here. Would you like to save this, or keep exploring?"

IMPORTANT: Stay focused on the topic "${questionText}". Don't change subjects.

Never:
- Ask about unrelated topics
- Sound robotic or scripted
- Rush the conversation`
    }
  }, [prompt])

  // Handle text submission
  const handleTextSubmit = async () => {
    if (!textValue.trim() || isSubmitting) return
    
    setIsSubmitting(true)
    
    try {
      // Save as a memory or knowledge entry
      const response = await fetch('/api/engagement/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promptId: prompt.id,
          promptType: prompt.type,
          responseType: 'text',
          responseText: textValue,
          contactId: prompt.contactId,
        }),
      })

      const result = await response.json()
      
      setCompleted(true)
      setTimeout(() => {
        onComplete({
          memoryId: result.memoryId,
          responseText: textValue,
          xpAwarded: result.xpAwarded || expectedXp,
        })
      }, 1000)
    } catch (error) {
      console.error('Failed to save response:', error)
      setIsSubmitting(false)
    }
  }

  // Handle voice/video memory saved
  const handleMemorySaved = useCallback((memoryId: string) => {
    setCompleted(true)
    setTimeout(() => {
      onComplete({
        memoryId,
        xpAwarded: expectedXp,
      })
    }, 1000)
  }, [onComplete, expectedXp])

  // Switch to voice mode
  const startVoice = () => {
    setInputMode('voice')
  }

  // Switch to video mode  
  const startVideo = () => {
    setInputMode('video')
  }

  // Go back to text mode
  const backToText = () => {
    setInputMode('text')
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="w-full max-w-2xl bg-gradient-to-b from-white to-[#F9F7F3] rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#406A56]/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D9C61A] to-[#c4b118] flex items-center justify-center shadow-md">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-[#406A56]">Share Your Story</h2>
              <p className="text-sm text-[#406A56]/60">
                +{expectedXp} XP
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 text-[#406A56]/60 hover:text-[#406A56] hover:bg-[#406A56]/10 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Prompt Display */}
        <div className="px-5 py-4 bg-[#406A56]/5 border-b border-[#406A56]/10">
          <p className="text-[#406A56] font-medium leading-relaxed">
            {prompt.promptText}
          </p>
          
          {/* Photo preview */}
          {prompt.photoUrl && (
            <div className="mt-3 relative inline-block">
              <img
                src={prompt.photoUrl}
                alt="Photo context"
                className="w-24 h-24 object-cover rounded-lg shadow-md"
              />
            </div>
          )}
          
          {/* Contact info */}
          {prompt.contactName && (
            <p className="mt-2 text-sm text-[#406A56]/70">
              About: <span className="font-medium">{prompt.contactName}</span>
            </p>
          )}
        </div>

        {/* Content Area */}
        <div className="p-5">
          {inputMode === 'text' ? (
            /* Text Input Mode */
            <div className="space-y-4">
              <textarea
                ref={textareaRef}
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                placeholder="Type your response here..."
                rows={4}
                className="w-full p-4 bg-white border border-[#406A56]/20 rounded-xl text-gray-800 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-[#406A56]/30 focus:border-[#406A56]"
              />
              
              {/* Action Buttons */}
              <div className="flex items-center justify-between">
                {/* Voice/Video Options */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#406A56]/50">Or use:</span>
                  <button
                    onClick={startVoice}
                    className="flex items-center gap-1.5 px-3 py-2 bg-[#406A56]/10 hover:bg-[#406A56]/20 text-[#406A56] text-sm font-medium rounded-lg transition-colors"
                  >
                    <Mic size={16} />
                    Voice
                  </button>
                  <button
                    onClick={startVideo}
                    className="flex items-center gap-1.5 px-3 py-2 bg-[#406A56]/10 hover:bg-[#406A56]/20 text-[#406A56] text-sm font-medium rounded-lg transition-colors"
                  >
                    <Video size={16} />
                    Video
                  </button>
                </div>
                
                {/* Submit Button */}
                <button
                  onClick={handleTextSubmit}
                  disabled={!textValue.trim() || isSubmitting}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#406A56] hover:bg-[#4a7a64] text-white font-medium rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                  {isSubmitting ? 'Saving...' : 'Submit'}
                </button>
              </div>
            </div>
          ) : (
            /* Voice/Video Mode */
            <div className="space-y-4">
              {/* Back to text button */}
              <button
                onClick={backToText}
                className="text-sm text-[#406A56]/60 hover:text-[#406A56] flex items-center gap-1"
              >
                ← Back to text input
              </button>
              
              {/* Voice/Video Chat */}
              <VoiceVideoChat
                sessionType={prompt.type === 'knowledge' ? 'memory_capture' : 'engagement'}
                topic={prompt.metadata?.question_text || prompt.promptText}
                contactId={prompt.contactId}
                persona={buildPersona()}
                enableVideo={inputMode === 'video'}
                videoQuality="medium"
                maxQuestions={5}
                onMemorySaved={handleMemorySaved}
                onError={(error) => console.error('Voice error:', error)}
                showTranscript={true}
              />
            </div>
          )}
        </div>

        {/* Success overlay */}
        <AnimatePresence>
          {completed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-white/95 backdrop-blur-sm rounded-3xl"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 15 }}
                className="text-center"
              >
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/30">
                  <Sparkles size={36} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-[#406A56]">Saved!</h3>
                <p className="text-[#406A56]/70 mt-2">+{expectedXp} XP earned</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}
