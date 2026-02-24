'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Mic, Loader2, Check, AlertCircle, X, Shield, Sparkles } from 'lucide-react'

// Minimum 3 minutes of voice needed for cloning
const MIN_VOICE_DURATION_SECONDS = 180

interface VoiceCloneStatus {
  status: 'none' | 'pending' | 'processing' | 'ready' | 'failed'
  totalDuration: number
  consentGiven: boolean
  errorMessage?: string
}

export default function VoiceCloneButton() {
  const [status, setStatus] = useState<VoiceCloneStatus>({
    status: 'none',
    totalDuration: 0,
    consentGiven: false
  })
  const [loading, setLoading] = useState(true)
  const [showConsentModal, setShowConsentModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadVoiceStatus()
  }, [])

  const loadVoiceStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Check existing voice clone
      const { data: voiceClone } = await supabase
        .from('voice_clones')
        .select('status, consent_given_at, error_message')
        .eq('user_id', user.id)
        .single()

      // Get voice duration from memories with audio
      const { count } = await supabase
        .from('memories')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .not('audio_url', 'is', null)

      // Estimate ~30 seconds per voice recording
      const estimatedDuration = (count || 0) * 30

      setStatus({
        status: voiceClone?.status || 'none',
        totalDuration: estimatedDuration,
        consentGiven: !!voiceClone?.consent_given_at,
        errorMessage: voiceClone?.error_message
      })
    } catch (err) {
      console.error('Error loading voice status:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCloneVoice = async () => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/voice/clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consent: true,
          userAgent: navigator.userAgent
        })
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to start voice cloning')
      }

      setShowConsentModal(false)
      setStatus(s => ({ ...s, status: 'processing', consentGiven: true }))
      
      // Poll for completion
      setTimeout(loadVoiceStatus, 5000)
    } catch (err: any) {
      console.error('Voice clone error:', err)
      setStatus(s => ({ ...s, errorMessage: err.message }))
    } finally {
      setSubmitting(false)
    }
  }

  const hasEnoughVoice = status.totalDuration >= MIN_VOICE_DURATION_SECONDS
  const progressPercent = Math.min(100, (status.totalDuration / MIN_VOICE_DURATION_SECONDS) * 100)

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-[#406A56]/50">
        <Loader2 size={16} className="animate-spin" />
        <span className="text-xs">Loading voice status...</span>
      </div>
    )
  }

  // Already cloned
  if (status.status === 'ready') {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-600 rounded-full">
        <Check size={16} />
        <span className="text-sm font-medium">Voice Cloned</span>
        <Sparkles size={14} className="text-emerald-400" />
      </div>
    )
  }

  // Processing
  if (status.status === 'processing') {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-600 rounded-full">
        <Loader2 size={16} className="animate-spin" />
        <span className="text-sm font-medium">Cloning in progress...</span>
      </div>
    )
  }

  // Failed
  if (status.status === 'failed') {
    return (
      <button 
        onClick={() => setShowConsentModal(true)}
        className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-600 rounded-full hover:bg-red-500/20 transition-colors"
      >
        <AlertCircle size={16} />
        <span className="text-sm font-medium">Clone Failed - Retry</span>
      </button>
    )
  }

  // Not enough voice yet
  if (!hasEnoughVoice) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2 px-4 py-2 bg-[#406A56]/10 text-[#406A56]/60 rounded-full">
          <Mic size={16} />
          <span className="text-sm">Clone My Voice</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-24 h-1.5 bg-[#406A56]/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#406A56] transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-[10px] text-[#666]">
            {Math.floor(status.totalDuration / 60)}m / 3m needed
          </span>
        </div>
      </div>
    )
  }

  // Ready to clone
  return (
    <>
      <button 
        onClick={() => setShowConsentModal(true)}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#406A56] to-[#5A8A72] text-white rounded-full hover:shadow-lg transition-all hover:scale-105"
      >
        <Mic size={16} />
        <span className="text-sm font-medium">Clone My Voice</span>
        <Sparkles size={14} className="text-white/70" />
      </button>

      {/* Privacy Consent Modal */}
      {showConsentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#406A56]/10 flex items-center justify-center">
                  <Shield className="text-[#406A56]" size={20} />
                </div>
                <h3 className="text-lg font-bold text-[#2d2d2d]">Voice Clone Consent</h3>
              </div>
              <button 
                onClick={() => setShowConsentModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <p className="text-[#666] text-sm">
                By proceeding, you consent to creating a digital voice clone using your recorded voice memories. This voice will be used for:
              </p>
              
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Check size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span><strong>AI Twin Feature</strong> — Your digital self can speak in your voice to loved ones</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span><strong>PostScript Messages</strong> — Future messages can include your voice</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span><strong>Memory Narration</strong> — Your stories told in your own voice</span>
                </li>
              </ul>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-800">
                  <strong>Privacy:</strong> Your voice data is processed securely and only used within YoursTruly. 
                  You can delete your voice clone at any time from settings.
                </p>
              </div>

              <div className="p-3 bg-[#406A56]/5 border border-[#406A56]/20 rounded-lg">
                <p className="text-xs text-[#406A56]">
                  <strong>Using:</strong> {Math.floor(status.totalDuration / 60)} minutes of your voice recordings 
                  ({Math.ceil(status.totalDuration / 30)} memories with audio)
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConsentModal(false)}
                className="flex-1 px-4 py-2.5 border border-[#406A56]/30 text-[#406A56] rounded-xl hover:bg-[#406A56]/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCloneVoice}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-[#406A56] text-white rounded-xl hover:bg-[#4a7a64] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Mic size={16} />
                    I Consent — Clone My Voice
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
