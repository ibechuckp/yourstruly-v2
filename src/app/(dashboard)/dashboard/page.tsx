'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useEngagementPrompts } from '@/hooks/useEngagementPrompts'
import { RefreshCw, Sparkles, X, Type, Send, SkipForward, MicOff, Mic, Camera, Plus } from 'lucide-react'
import Link from 'next/link'
import CommandBar from '@/components/dashboard/CommandBar'
import '@/styles/home.css'

// Type configs with color scheme
const TYPE_CONFIG: Record<string, { icon: string; label: string; color: 'yellow' | 'green' | 'red' | 'blue' | 'purple'; xp: number }> = {
  photo_backstory: { icon: '📸', label: 'Photo Story', color: 'yellow', xp: 15 },
  tag_person: { icon: '👤', label: 'Tag Person', color: 'blue', xp: 5 },
  missing_info: { icon: '📝', label: 'Contact', color: 'green', xp: 5 },
  quick_question: { icon: '👤', label: 'Contact', color: 'green', xp: 5 },
  memory_prompt: { icon: '💭', label: 'Memory', color: 'purple', xp: 20 },
  knowledge: { icon: '🧠', label: 'Wisdom', color: 'red', xp: 15 },
  connect_dots: { icon: '🔗', label: 'Connect', color: 'blue', xp: 10 },
  highlight: { icon: '⭐', label: 'Highlight', color: 'yellow', xp: 5 },
  postscript: { icon: '💌', label: 'Future', color: 'purple', xp: 20 },
  favorites_firsts: { icon: '🏆', label: 'Favorites', color: 'red', xp: 10 },
  recipes_wisdom: { icon: '📖', label: 'Recipes', color: 'yellow', xp: 15 },
  update_profile: { icon: '✏️', label: 'Update Profile', color: 'blue', xp: 0 },
}

// Fixed tile positions (no reflow on expand)
const TILE_POSITIONS = [
  { col: 0, row: 0, rotate: -2 },
  { col: 1, row: 0, rotate: 1.5 },
  { col: 2, row: 0, rotate: -1 },
  { col: 0, row: 1, rotate: 2 },
  { col: 1, row: 1, rotate: -1.5 },
]

export default function DashboardPage() {
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState({ memories: 0, contacts: 0, postscripts: 0 })
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [inputMode, setInputMode] = useState<'text' | 'voice' | null>(null)
  const [textValue, setTextValue] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const supabase = createClient()
  const { prompts: rawPrompts, isLoading, shuffle, answerPrompt, skipPrompt, dismissPrompt, stats: engagementStats } = useEngagementPrompts(5)

  // Add profile update prompt if user has interests/skills/hobbies to update
  const prompts = [...rawPrompts]
  if (profile && rawPrompts.length > 0 && rawPrompts.length < 5) {
    // Add interests/skills/hobbies update task occasionally
    const showUpdateTask = Math.random() < 0.3 // 30% chance
    if (showUpdateTask) {
      prompts.push({
        id: 'update_profile_interests',
        type: 'update_profile',
        promptText: 'Update your interests, skills, or hobbies',
        category: 'profile',
        status: 'pending',
        priority: 30,
        userId: profile.id,
        createdAt: new Date().toISOString(),
        metadata: {
          fields: ['interests', 'skills', 'hobbies'],
          current: {
            interests: profile.interests || [],
            skills: profile.skills || [],
            hobbies: profile.hobbies || [],
          }
        }
      } as any)
    }
  }

  useEffect(() => {
    loadProfile()
    loadStats()
  }, [])

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(data)
  }

  const loadStats = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [mem, con, ps] = await Promise.all([
      supabase.from('memories').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('postscripts').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    ])
    setStats({ memories: mem.count || 0, contacts: con.count || 0, postscripts: ps.count || 0 })
  }

  const handleAnswer = async (promptId: string) => {
    if (!textValue.trim() && !mediaFile) return
    setIsSubmitting(true)
    try {
      await answerPrompt(promptId, { 
        type: 'text', 
        text: textValue,
        data: mediaFile ? { hasMedia: true } : undefined
      })
      setTextValue('')
      setMediaFile(null)
      setInputMode(null)
      setExpandedId(null)
    } catch (err) {
      console.error(err)
    }
    setIsSubmitting(false)
  }

  const handleSkip = async (promptId: string) => {
    if (promptId.startsWith('update_profile')) {
      setExpandedId(null)
      return
    }
    await skipPrompt(promptId)
    setExpandedId(null)
    setInputMode(null)
  }

  const handleDismiss = async (promptId: string) => {
    if (promptId.startsWith('update_profile')) {
      setExpandedId(null)
      return
    }
    await dismissPrompt(promptId)
    setExpandedId(null)
    setInputMode(null)
  }

  const isContactPrompt = (type: string) => type === 'quick_question' || type === 'missing_info'

  // Generate proper prompt text with contact name
  const getPromptText = (prompt: any) => {
    // For contact prompts, always show the contact name prominently
    if (isContactPrompt(prompt.type)) {
      const contactName = prompt.contactName || prompt.metadata?.contact?.name || 'this contact'
      if (prompt.missingField) {
        const labels: Record<string, string> = { 
          phone: 'phone number', 
          email: 'email address', 
          date_of_birth: 'birthday',
          birth_date: 'birthday',
          address: 'address',
          how_met: 'how you met',
          relationship: 'relationship'
        }
        return `What is ${contactName}'s ${labels[prompt.missingField] || prompt.missingField}?`
      }
      // Generic contact update
      return `Tell us more about ${contactName}`
    }
    
    // For other prompts, replace template variables
    const text = prompt.promptText || ''
    return text
      .replace(/\{\{contact_name\}\}/g, prompt.contactName || 'this person')
      .replace(/\{\{.*?\}\}/g, '')
  }

  // Get contact name for display
  const getContactName = (prompt: any) => {
    return prompt.contactName || prompt.metadata?.contact?.name || null
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Warm gradient background with blobs */}
      <div className="home-background">
        <div className="home-blob home-blob-1" />
        <div className="home-blob home-blob-2" />
        <div className="home-blob home-blob-3" />
        <div className="home-blob home-blob-4" />
      </div>

      {/* Profile card - fixed left */}
      <div className="home-profile hidden lg:block">
        <div className="glass-card glass-card-strong profile-card">
          <div className="profile-avatar">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl text-[#406A56]/50">
                {profile?.full_name?.charAt(0) || '?'}
              </div>
            )}
          </div>
          <h2 className="profile-name">{profile?.full_name || 'Your Name'}</h2>
          <p className="profile-title">{profile?.occupation || 'Your Story'}</p>
          
          <div className="profile-stats">
            <Link href="/dashboard/memories" className="profile-stat hover:opacity-70 transition-opacity">
              <div className="profile-stat-value">{stats.memories}</div>
              <div className="profile-stat-label">Memories</div>
            </Link>
            <Link href="/dashboard/contacts" className="profile-stat hover:opacity-70 transition-opacity">
              <div className="profile-stat-value">{stats.contacts}</div>
              <div className="profile-stat-label">People</div>
            </Link>
            <Link href="/dashboard/postscripts" className="profile-stat hover:opacity-70 transition-opacity">
              <div className="profile-stat-value">{stats.postscripts}</div>
              <div className="profile-stat-label">Messages</div>
            </Link>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="home-content">
        <div className="home-bubbles">
          {isLoading ? (
            <div className="flex flex-col items-center gap-4">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
                <Sparkles size={28} className="text-[#D9C61A]" />
              </motion.div>
              <span className="text-[#406A56]/60">Loading prompts...</span>
            </div>
          ) : prompts.length === 0 ? (
            <div className="home-empty">
              <div className="home-empty-icon">
                <Sparkles size={32} className="text-[#D9C61A]" />
              </div>
              <h3>All caught up!</h3>
              <p>You've answered all your prompts. Generate more to keep capturing memories.</p>
              <button onClick={() => shuffle()} className="home-refresh-btn">
                <RefreshCw size={16} />
                Generate More
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6">
              {/* Stats */}
              {engagementStats && (engagementStats.currentStreakDays > 0 || engagementStats.totalAnswered > 0) && (
                <div className="flex gap-4">
                  {engagementStats.currentStreakDays > 0 && (
                    <div className="home-stat-pill">🔥 <strong>{engagementStats.currentStreakDays}</strong> day streak</div>
                  )}
                  {engagementStats.totalAnswered > 0 && (
                    <div className="home-stat-pill">✅ <strong>{engagementStats.totalAnswered}</strong> answered</div>
                  )}
                </div>
              )}

              {/* Fixed-position tile grid (no reflow) */}
              <div className="relative" style={{ width: 720, height: 420 }}>
                <AnimatePresence>
                  {prompts.slice(0, 5).map((prompt, i) => {
                    const config = TYPE_CONFIG[prompt.type] || TYPE_CONFIG.memory_prompt
                    const isExpanded = expandedId === prompt.id
                    const pos = TILE_POSITIONS[i] || { col: i % 3, row: Math.floor(i / 3), rotate: 0 }
                    const hasPhoto = prompt.photoUrl && (prompt.type === 'photo_backstory' || prompt.type === 'tag_person')
                    const contactName = getContactName(prompt)
                    const isContact = isContactPrompt(prompt.type)

                    // Fixed position based on grid
                    const tileWidth = 210
                    const tileHeight = 180
                    const gap = 20
                    const left = pos.col * (tileWidth + gap)
                    const top = pos.row * (tileHeight + gap)

                    return (
                      <motion.div
                        key={prompt.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ 
                          opacity: 1, 
                          scale: 1,
                          rotate: isExpanded ? 0 : pos.rotate,
                          zIndex: isExpanded ? 50 : 1,
                          x: isExpanded ? -left + 200 : 0,
                          y: isExpanded ? -top + 80 : 0,
                        }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        onClick={() => !isExpanded && setExpandedId(prompt.id)}
                        className={`bubble-tile absolute cursor-pointer ${isExpanded ? 'shadow-2xl' : ''}`}
                        style={{ 
                          left, 
                          top,
                          width: isExpanded ? 320 : tileWidth,
                          minHeight: isExpanded ? 'auto' : tileHeight,
                        }}
                      >
                        {/* Colored accent bar */}
                        <div className={`bubble-accent bubble-accent-${config.color}`} />

                        {/* XP badge */}
                        {!isExpanded && config.xp > 0 && (
                          <div className={`bubble-xp bubble-xp-${config.color}`}>
                            <Sparkles size={10} />
                            +{config.xp}
                          </div>
                        )}

                        {/* Close button */}
                        {isExpanded && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); setExpandedId(null); setInputMode(null); }}
                            className="absolute top-3 right-3 p-1.5 bg-black/5 hover:bg-black/10 rounded-full z-10"
                          >
                            <X size={14} className="text-gray-500" />
                          </button>
                        )}

                        <div className="bubble-content">
                          {/* Header */}
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">{config.icon}</span>
                            <span className={`bubble-type bubble-type-${config.color}`}>{config.label}</span>
                          </div>

                          {/* Contact card - ALWAYS show name for contact prompts */}
                          {isContact && (
                            <div className="bubble-contact">
                              <div className="bubble-contact-avatar">
                                {prompt.contactPhotoUrl || prompt.metadata?.contact?.photo_url ? (
                                  <img src={prompt.contactPhotoUrl || prompt.metadata?.contact?.photo_url} alt="" />
                                ) : (
                                  (contactName || 'C').charAt(0).toUpperCase()
                                )}
                              </div>
                              <div>
                                <div className="bubble-contact-name">
                                  {contactName || 'Unknown Contact'}
                                </div>
                                <div className="bubble-contact-sub">
                                  {prompt.missingField 
                                    ? `Add ${prompt.missingField.replace(/_/g, ' ')}` 
                                    : prompt.metadata?.contact?.relationship || 'Update info'}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Photo */}
                          {hasPhoto && (
                            <img src={prompt.photoUrl} alt="" className="bubble-photo" />
                          )}

                          {/* Prompt text */}
                          <p className="bubble-text">{getPromptText(prompt)}</p>

                          {/* Tap hint */}
                          {!isExpanded && <p className="bubble-hint">tap to answer →</p>}

                          {/* Expanded input */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-4"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {/* Profile update task */}
                                {prompt.type === 'update_profile' ? (
                                  <div className="space-y-3">
                                    <Link 
                                      href="/dashboard/profile"
                                      className="block w-full py-3 bg-[#406A56] hover:bg-[#4a7a64] text-white text-center text-sm font-medium rounded-xl"
                                    >
                                      Go to Profile Settings
                                    </Link>
                                    <p className="text-xs text-gray-400 text-center">
                                      Current: {profile?.interests?.length || 0} interests, {profile?.skills?.length || 0} skills, {profile?.hobbies?.length || 0} hobbies
                                    </p>
                                  </div>
                                ) : inputMode === null ? (
                                  <div className="space-y-3">
                                    {/* Input mode buttons */}
                                    <div className="flex gap-3">
                                      <button 
                                        onClick={() => setInputMode('voice')}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#406A56]/5 hover:bg-[#406A56]/10 rounded-xl transition-colors"
                                      >
                                        <Mic size={16} className="text-[#406A56]" />
                                        <span className="text-sm text-[#406A56]">Speak</span>
                                      </button>
                                      <button 
                                        onClick={() => setInputMode('text')}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#406A56]/5 hover:bg-[#406A56]/10 rounded-xl transition-colors"
                                      >
                                        <Type size={16} className="text-[#406A56]" />
                                        <span className="text-sm text-[#406A56]">Type</span>
                                      </button>
                                    </div>
                                    
                                    {/* Optional media upload */}
                                    <button 
                                      onClick={() => fileInputRef.current?.click()}
                                      className="w-full flex items-center justify-center gap-2 py-2 border border-dashed border-[#406A56]/20 hover:border-[#406A56]/40 rounded-xl transition-colors"
                                    >
                                      <Camera size={14} className="text-[#406A56]/50" />
                                      <span className="text-xs text-[#406A56]/50">Add photo/video (optional)</span>
                                    </button>
                                    <input 
                                      ref={fileInputRef}
                                      type="file" 
                                      accept="image/*,video/*"
                                      onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
                                      className="hidden"
                                    />
                                  </div>
                                ) : inputMode === 'text' ? (
                                  <div>
                                    <textarea
                                      value={textValue}
                                      onChange={(e) => setTextValue(e.target.value)}
                                      placeholder="Share your memory..."
                                      rows={3}
                                      autoFocus
                                      className="w-full p-3 bg-[#406A56]/5 border border-[#406A56]/10 rounded-xl text-gray-800 placeholder-gray-400 resize-none focus:outline-none focus:border-[#406A56]/30"
                                    />
                                    
                                    {/* Media preview */}
                                    {mediaFile && (
                                      <div className="mt-2 flex items-center gap-2 p-2 bg-[#406A56]/5 rounded-lg">
                                        <Camera size={14} className="text-[#406A56]" />
                                        <span className="text-xs text-[#406A56] flex-1 truncate">{mediaFile.name}</span>
                                        <button onClick={() => setMediaFile(null)} className="text-gray-400 hover:text-gray-600">
                                          <X size={14} />
                                        </button>
                                      </div>
                                    )}
                                    
                                    {/* Add media button */}
                                    {!mediaFile && (
                                      <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="mt-2 flex items-center gap-2 text-xs text-[#406A56]/50 hover:text-[#406A56]"
                                      >
                                        <Plus size={12} />
                                        Add photo/video
                                      </button>
                                    )}
                                    
                                    <div className="flex justify-between mt-3">
                                      <button onClick={() => { setInputMode(null); setMediaFile(null); }} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
                                      <button
                                        onClick={() => handleAnswer(prompt.id)}
                                        disabled={!textValue.trim() || isSubmitting}
                                        className="flex items-center gap-2 px-4 py-2 bg-[#406A56] hover:bg-[#4a7a64] text-white text-sm font-medium rounded-lg disabled:opacity-50"
                                      >
                                        <Send size={14} />
                                        {isSubmitting ? 'Saving...' : 'Save'}
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="p-6 bg-gray-50 rounded-xl text-center">
                                    <MicOff size={24} className="mx-auto mb-2 text-gray-300" />
                                    <p className="text-sm text-gray-400 mb-2">Voice coming soon</p>
                                    <button onClick={() => setInputMode('text')} className="text-sm text-[#406A56] font-medium">Type instead</button>
                                  </div>
                                )}

                                {/* Footer actions */}
                                <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
                                  <button onClick={() => handleSkip(prompt.id)} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600">
                                    <SkipForward size={12} />
                                    Skip
                                  </button>
                                  <button onClick={() => handleDismiss(prompt.id)} className="text-xs text-gray-300 hover:text-gray-500">
                                    Don't ask again
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>

              {/* Refresh */}
              <button onClick={() => shuffle()} className="home-refresh-btn mt-4">
                <RefreshCw size={16} />
                Shuffle
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Command Bar */}
      <CommandBar />
    </div>
  )
}
