'use client'

import { useState } from 'react'
import { ConversationView } from '@/components/conversation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

// Sample prompts for testing
const TEST_PROMPTS = [
  {
    id: 'test-memory-1',
    type: 'memory_prompt',
    promptText: 'What was your most memorable family vacation?',
    category: 'memories',
  },
  {
    id: 'test-wisdom-1', 
    type: 'knowledge',
    promptText: 'What life lesson took you the longest to learn?',
    category: 'life_lessons',
  },
  {
    id: 'test-photo-1',
    type: 'photo_backstory',
    promptText: 'Tell the story behind this moment',
    category: 'memories',
    photoUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=640',
  },
]

export default function ConversationTestPage() {
  const [selectedPrompt, setSelectedPrompt] = useState<typeof TEST_PROMPTS[0] | null>(null)
  const [completedPrompts, setCompletedPrompts] = useState<string[]>([])

  const handleComplete = (result: {
    exchanges: Array<{ question: string; response: string; audioUrl?: string }>;
    summary: string;
    knowledgeEntryId?: string;
    memoryId?: string;
    xpAwarded: number;
  }) => {
    if (selectedPrompt) {
      setCompletedPrompts(prev => [...prev, selectedPrompt.id])
      console.log('Conversation completed:', result)
    }
    setSelectedPrompt(null)
  }

  const handleClose = () => {
    setSelectedPrompt(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] to-[#16213e] p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link 
            href="/dashboard"
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <ArrowLeft size={20} className="text-white" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Conversation View Test</h1>
            <p className="text-white/60">Test the voice recording, transcription, and AI follow-up flow</p>
          </div>
        </div>

        {/* Prompt Selection */}
        {!selectedPrompt && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-white/80 mb-4">Select a prompt to test:</h2>
            
            {TEST_PROMPTS.map((prompt) => {
              const isCompleted = completedPrompts.includes(prompt.id)
              
              return (
                <button
                  key={prompt.id}
                  onClick={() => !isCompleted && setSelectedPrompt(prompt)}
                  disabled={isCompleted}
                  className={`w-full p-6 rounded-2xl text-left transition-all ${
                    isCompleted 
                      ? 'bg-green-500/20 border border-green-500/30 cursor-default'
                      : 'bg-white/10 hover:bg-white/20 border border-white/10 hover:border-white/30'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {prompt.photoUrl && (
                      <img 
                        src={prompt.photoUrl} 
                        alt="" 
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          prompt.type === 'knowledge' 
                            ? 'bg-red-500/20 text-red-300'
                            : prompt.type === 'photo_backstory'
                            ? 'bg-yellow-500/20 text-yellow-300'
                            : 'bg-purple-500/20 text-purple-300'
                        }`}>
                          {prompt.type === 'knowledge' ? '🧠 Wisdom' : 
                           prompt.type === 'photo_backstory' ? '📸 Photo Story' : 
                           '💭 Memory'}
                        </span>
                        {isCompleted && (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-300">
                            ✓ Completed
                          </span>
                        )}
                      </div>
                      <p className="text-white text-lg">{prompt.promptText}</p>
                    </div>
                  </div>
                </button>
              )
            })}
            
            {completedPrompts.length > 0 && (
              <button
                onClick={() => setCompletedPrompts([])}
                className="mt-4 px-4 py-2 text-sm text-white/60 hover:text-white transition-colors"
              >
                Reset completed prompts
              </button>
            )}
          </div>
        )}

        {/* Conversation View */}
        {selectedPrompt && (
          <ConversationView
            prompt={selectedPrompt as any}
            onComplete={handleComplete}
            onClose={handleClose}
          />
        )}

        {/* Instructions */}
        <div className="mt-12 p-6 rounded-2xl bg-white/5 border border-white/10">
          <h3 className="text-white font-medium mb-3">How to test:</h3>
          <ol className="space-y-2 text-white/70 text-sm">
            <li>1. Click a prompt above to start</li>
            <li>2. <strong>Record</strong> your answer using the microphone button</li>
            <li>3. Recording will <strong>auto-transcribe</strong> when you stop</li>
            <li>4. <strong>Edit</strong> the transcription if needed</li>
            <li>5. AI will generate <strong>follow-up questions</strong> based on your answer</li>
            <li>6. Continue the conversation or <strong>Finish</strong> when done</li>
            <li>7. <strong>Review</strong> all your responses before saving</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
