'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChevronRight, ChevronLeft, Camera, Users, Gift, Sparkles, Check } from 'lucide-react'

interface OnboardingProps {
  onComplete: () => void
}

const STEPS = [
  {
    title: 'Welcome to YoursTruly',
    subtitle: 'Document your legacy',
    description: 'Capture and preserve your life\'s most precious moments, stories, and wisdom for generations to come.',
    icon: Sparkles,
    color: 'from-amber-500 to-orange-600',
  },
  {
    title: 'Capture Memories',
    subtitle: 'Photos, videos, and stories',
    description: 'Upload photos and videos, add context with dates and locations. Our AI helps organize and describe your memories automatically.',
    icon: Camera,
    color: 'from-blue-500 to-cyan-600',
  },
  {
    title: 'Connect with Loved Ones',
    subtitle: 'Share what matters',
    description: 'Add your family and friends as contacts. Share memories, collect their stories, and build your family\'s history together.',
    icon: Users,
    color: 'from-green-500 to-emerald-600',
  },
  {
    title: 'PostScripts & Gifts',
    subtitle: 'Messages for the future',
    description: 'Schedule messages, videos, and gifts to be delivered on special occasions or after you\'re gone. Your love, preserved in time.',
    icon: Gift,
    color: 'from-purple-500 to-pink-600',
  },
]

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const isLastStep = currentStep === STEPS.length
  const step = STEPS[currentStep]

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('profiles')
      .update({ 
        full_name: name || undefined,
        onboarding_completed: true 
      })
      .eq('id', user.id)

    setSaving(false)
    onComplete()
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-lg">
        {/* Progress Dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentStep ? 'w-8 bg-amber-500' : i < currentStep ? 'bg-amber-500' : 'bg-white/20'
              }`}
            />
          ))}
          <div className={`w-2 h-2 rounded-full transition-all ${isLastStep ? 'w-8 bg-amber-500' : 'bg-white/20'}`} />
        </div>

        {/* Content */}
        <div className="bg-gray-900/90 rounded-3xl p-8 border border-white/10">
          {!isLastStep ? (
            <>
              {/* Icon */}
              <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-r ${step.color} flex items-center justify-center`}>
                <step.icon size={40} className="text-white" />
              </div>

              {/* Text */}
              <h2 className="text-2xl font-bold text-white text-center mb-2">{step.title}</h2>
              <p className="text-amber-500 text-center mb-4">{step.subtitle}</p>
              <p className="text-white/60 text-center leading-relaxed">{step.description}</p>
            </>
          ) : (
            <>
              {/* Final Step - Get Started */}
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 flex items-center justify-center">
                <Check size={40} className="text-white" />
              </div>

              <h2 className="text-2xl font-bold text-white text-center mb-2">You're All Set!</h2>
              <p className="text-amber-500 text-center mb-6">One last thing...</p>

              <div className="mb-6">
                <label className="block text-sm text-white/50 mb-2">What should we call you?</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-4 py-3 bg-gray-800 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  autoFocus
                />
              </div>

              <p className="text-white/40 text-sm text-center">
                You can always change this later in your profile.
              </p>
            </>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className={`flex items-center gap-2 px-4 py-2 text-white/60 hover:text-white transition-colors ${currentStep === 0 ? 'invisible' : ''}`}
            >
              <ChevronLeft size={18} />
              Back
            </button>

            {!isLastStep ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl font-medium transition-all"
              >
                Next
                <ChevronRight size={18} />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl font-medium transition-all disabled:opacity-50"
              >
                {saving ? 'Starting...' : 'Get Started'}
                <Sparkles size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Skip */}
        {!isLastStep && (
          <button
            onClick={() => setCurrentStep(STEPS.length)}
            className="block mx-auto mt-4 text-white/40 hover:text-white/60 text-sm transition-colors"
          >
            Skip introduction
          </button>
        )}
      </div>
    </div>
  )
}
