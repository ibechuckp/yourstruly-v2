'use client'

import { VoiceChat } from '@/components/voice'
import { useRouter } from 'next/navigation'

export default function VoiceDemoPage() {
  const router = useRouter()
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8faf9] to-[#eef2f0]">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-[#406A56] mb-3">
            Voice Memory Capture
          </h1>
          <p className="text-[#406A56]/70 max-w-lg mx-auto">
            Share your story naturally through voice. Our AI biographer will ask thoughtful 
            questions and help you capture memories worth keeping.
          </p>
        </div>

        {/* Voice Chat Component */}
        <VoiceChat 
          onMemorySaved={(memoryId) => {
            console.log('Memory saved:', memoryId)
            // Could redirect to the memory page
            // router.push(`/memories/${memoryId}`)
          }}
          onComplete={(result) => {
            console.log('Session completed:', result)
          }}
          onError={(error) => {
            console.error('Voice chat error:', error)
          }}
        />

        {/* Tips */}
        <div className="mt-10 bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-[#406A56]/10">
          <h3 className="text-sm font-semibold text-[#406A56] mb-3 uppercase tracking-wide">
            Tips for a Great Memory
          </h3>
          <ul className="space-y-2 text-sm text-[#406A56]/70">
            <li className="flex items-start gap-2">
              <span className="text-[#D9C61A]">•</span>
              Speak naturally - the AI will detect when you pause
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#D9C61A]">•</span>
              Include details like names, dates, and places
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#D9C61A]">•</span>
              Say "save it" when you're ready to save your memory
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#D9C61A]">•</span>
              The AI will suggest saving after about 5 exchanges
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
