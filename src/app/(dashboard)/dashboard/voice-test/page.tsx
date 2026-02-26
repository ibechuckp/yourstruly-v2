'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { VoiceChat } from '@/components/voice/VoiceChat'
import { Sparkles, MessageCircle, Mic, BookOpen } from 'lucide-react'

/**
 * Voice Test Page
 * 
 * Demo page for testing the OpenAI Realtime Voice Chat component
 * with different use cases:
 * - Engagement voice tasks
 * - Interviews
 * - Onboarding questions
 * - 5-question AI interactions
 */
export default function VoiceTestPage() {
  const [activeMode, setActiveMode] = useState<string | null>(null)
  const [lastTranscript, setLastTranscript] = useState<{ role: 'user' | 'assistant', text: string }[] | null>(null)

  const modes = [
    {
      id: 'onboarding',
      title: 'Onboarding Interview',
      description: 'Help new users set up their profile through a friendly voice conversation',
      icon: <BookOpen size={20} />,
      systemPrompt: `You are a warm, friendly onboarding assistant for YoursTruly, a digital legacy platform.

Your goal is to help the user set up their profile through a natural conversation. Ask about:
- Their name and how they'd like to be addressed
- Their occupation or main life focus
- One meaningful memory they'd like to preserve
- Someone special in their life

Be conversational and warm. Listen carefully and ask follow-up questions. Keep responses concise and natural.`,
      questions: [
        "Hi there! I'm here to help you set up your YoursTruly profile. First, what name would you like me to call you?",
        "Great to meet you! What do you do for work, or what's your main focus in life right now?",
        "What's one meaningful memory you'd like to make sure is preserved for the future?",
        "Tell me about someone special in your life - what's their name and how do you know each other?"
      ]
    },
    {
      id: 'interview',
      title: 'Life Story Interview',
      description: 'Conduct a guided interview about life experiences and memories',
      icon: <Mic size={20} />,
      systemPrompt: `You are a thoughtful, empathetic interviewer helping someone document their life story for YoursTruly.

Your style is:
- Warm and encouraging
- Patient - give the person time to think and share
- Curious - ask meaningful follow-up questions
- Respectful of emotions that may arise

Guide them through sharing meaningful memories and experiences. Help them reflect on what matters most.`,
      questions: [
        "I'd love to hear about a moment in your life that you're really proud of. Can you tell me about it?",
        "Think back to your childhood. What's a memory that always makes you smile?",
        "Who has been the most influential person in your life, and why?",
        "What's a lesson you've learned that you'd want to pass on to future generations?"
      ]
    },
    {
      id: 'engagement',
      title: 'Daily Engagement',
      description: 'Quick daily prompts to capture memories and thoughts',
      icon: <Sparkles size={20} />,
      systemPrompt: `You are a friendly, engaging AI companion helping someone document their daily life on YoursTruly.

Your goal is to:
- Ask engaging, thoughtful questions
- Help them reflect on their day or recent experiences
- Capture small but meaningful moments
- Keep the conversation light and positive

Be encouraging and make it easy for them to share.`,
      questions: [
        "What's something that made you smile today?",
        "Did you have any interesting conversations today? Who with and what about?",
        "What's one small thing you appreciated today that you might forget in a week?"
      ]
    },
    {
      id: 'free',
      title: 'Free Conversation',
      description: 'Open-ended conversation with no guided questions',
      icon: <MessageCircle size={20} />,
      systemPrompt: `You are a warm, attentive AI companion on YoursTruly, a platform for documenting life stories and memories.

Your role is to:
- Listen attentively to whatever the user wants to share
- Ask thoughtful follow-up questions
- Help them explore their thoughts and memories
- Be supportive and encouraging

Respond naturally as a caring friend would. Keep your responses conversational and concise.`,
      questions: undefined // No guided questions
    }
  ]

  const handleComplete = () => {
    console.log('Voice chat completed')
    setActiveMode(null)
  }

  const handleTranscript = (transcript: { role: 'user' | 'assistant', text: string, timestamp: number }[]) => {
    console.log('Transcript:', transcript)
    setLastTranscript(transcript)
  }

  return (
    <div className="min-h-screen bg-[#F2F1E5] p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-[#406A56] mb-2">
            Voice Chat Testing
          </h1>
          <p className="text-[#406A56]/70">
            Test the OpenAI Realtime Voice Chat component with different conversation modes
          </p>
        </motion.div>

        {/* Mode Selection */}
        {!activeMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
          >
            {modes.map((mode, index) => (
              <motion.button
                key={mode.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setActiveMode(mode.id)}
                className="text-left p-6 bg-white/70 backdrop-blur rounded-2xl border border-[#406A56]/10 shadow-sm hover:shadow-md hover:border-[#406A56]/30 transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#406A56]/10 flex items-center justify-center text-[#406A56] group-hover:bg-[#406A56] group-hover:text-white transition-colors">
                    {mode.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#406A56] mb-1">{mode.title}</h3>
                    <p className="text-sm text-[#406A56]/60">{mode.description}</p>
                    {mode.questions && (
                      <p className="text-xs text-[#406A56]/40 mt-2">
                        {mode.questions.length} guided questions
                      </p>
                    )}
                  </div>
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}

        {/* Active Voice Chat */}
        {activeMode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto"
          >
            {(() => {
              const mode = modes.find(m => m.id === activeMode)!
              return (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-[#406A56]">{mode.title}</h2>
                      <p className="text-sm text-[#406A56]/60">{mode.description}</p>
                    </div>
                    <button
                      onClick={() => setActiveMode(null)}
                      className="px-4 py-2 text-sm text-[#406A56] hover:bg-[#406A56]/10 rounded-lg transition-colors"
                    >
                      Back to Modes
                    </button>
                  </div>

                  <VoiceChat
                    sessionType={mode.id === 'onboarding' ? 'onboarding' : 
                                mode.id === 'interview' ? 'life_interview' : 
                                mode.id === 'engagement' ? 'engagement' : 'freeform'}
                    topic={mode.title}
                    personaName={mode.id === 'interview' ? 'life-story' : 'journalist'}
                    voice="coral"
                    maxQuestions={5}
                    maxDurationSeconds={300}
                    onComplete={(result) => {
                      handleComplete()
                      handleTranscript(result.transcript)
                    }}
                    onMemorySaved={(memoryId) => console.log('Memory saved:', memoryId)}
                    onError={(error) => console.error('Voice chat error:', error)}
                    showTranscript={true}
                  />
                </>
              )
            })()}
          </motion.div>
        )}

        {/* Last Transcript Display */}
        {lastTranscript && !activeMode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 p-6 bg-white/70 backdrop-blur rounded-2xl border border-[#406A56]/10"
          >
            <h3 className="text-lg font-semibold text-[#406A56] mb-4">Last Conversation</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {lastTranscript.map((entry, index) => (
                <div
                  key={index}
                  className={`
                    p-3 rounded-xl
                    ${entry.role === 'user' 
                      ? 'bg-[#406A56]/5 ml-8' 
                      : 'bg-[#D9C61A]/10 mr-8'
                    }
                  `}
                >
                  <p className="text-xs text-[#406A56]/50 mb-1">
                    {entry.role === 'user' ? 'You' : 'AI'}
                  </p>
                  <p className="text-sm text-[#406A56]">{entry.text}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => setLastTranscript(null)}
              className="mt-4 text-sm text-[#406A56]/60 hover:text-[#406A56] underline"
            >
              Clear
            </button>
          </motion.div>
        )}

        {/* Usage Instructions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-12 p-6 bg-[#406A56]/5 rounded-2xl"
        >
          <h3 className="text-lg font-semibold text-[#406A56] mb-3">How to Use</h3>
          <ul className="space-y-2 text-sm text-[#406A56]/70">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#406A56] mt-2" />
              <span>Select a conversation mode above to start testing</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#406A56] mt-2" />
              <span>Click the microphone button and allow microphone access when prompted</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#406A56] mt-2" />
              <span>The AI will automatically detect when you start and stop speaking</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#406A56] mt-2" />
              <span>Use the transcript panel to review the conversation</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#406A56] mt-2" />
              <span>Click "End" or close the page to finish the session</span>
            </li>
          </ul>
        </motion.div>
      </div>
    </div>
  )
}
