'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useEngagementPrompts } from '@/hooks/useEngagementPrompts'
import { RefreshCw, Sparkles, X, Send, Gift } from 'lucide-react'
import Link from 'next/link'
import { ConversationView } from '@/components/conversation'
import '@/styles/home.css'
import '@/styles/engagement.css'
import '@/styles/conversation.css'
import CommandBar from '@/components/dashboard/CommandBar'
import ActivityFeed from '@/components/dashboard/ActivityFeed'
// import { PersonalityDashboard } from '@/components/personality/PersonalityDashboard' // TODO: Re-enable when analyzing real data

// Type configs with color scheme
const TYPE_CONFIG: Record<string, { icon: string; label: string; color: 'yellow' | 'green' | 'red' | 'blue' | 'purple'; xp: number }> = {
  photo_backstory: { icon: '📸', label: 'Photo Story', color: 'yellow', xp: 15 },
  tag_person: { icon: '👤', label: 'Tag Person', color: 'blue', xp: 5 },
  missing_info: { icon: '📝', label: 'Contact', color: 'green', xp: 5 },
  quick_question: { icon: '👤', label: 'Contact', color: 'green', xp: 5 },
  contact_info: { icon: '✏️', label: 'Complete Info', color: 'green', xp: 10 },
  memory_prompt: { icon: '💭', label: 'Memory', color: 'purple', xp: 20 },
  knowledge: { icon: '🧠', label: 'Wisdom', color: 'red', xp: 15 },
  connect_dots: { icon: '🔗', label: 'Connect', color: 'blue', xp: 10 },
  highlight: { icon: '⭐', label: 'Highlight', color: 'yellow', xp: 5 },
  postscript: { icon: '💌', label: 'Future', color: 'purple', xp: 20 },
  favorites_firsts: { icon: '🏆', label: 'Favorites', color: 'red', xp: 10 },
  recipes_wisdom: { icon: '📖', label: 'Recipes', color: 'yellow', xp: 15 },
}

// Prompt types that should use ConversationView (multi-turn voice/text)
const CONVERSATION_TYPES = [
  'photo_backstory',
  'memory_prompt', 
  'knowledge',
  'favorites_firsts',
  'recipes_wisdom',
  'postscript',
  'connect_dots',
  'highlight',
]

// Prompt types that should use simple inline input
const INLINE_INPUT_TYPES = [
  'quick_question',
  'missing_info',
  'tag_person',
  'contact_info',
]

// Fixed tile positions: 2x2 grid on left + 1 tall tile on right for photos
// Layout:  [0] [1] [4-tall]
//          [2] [3]
const TILE_POSITIONS = [
  { col: 0, row: 0 },  // top-left
  { col: 1, row: 0 },  // top-right of 2x2
  { col: 0, row: 1 },  // bottom-left
  { col: 1, row: 1 },  // bottom-right of 2x2
  { col: 2, row: 0, tall: true },  // right side, spans full height
]

export default function DashboardPage() {
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState({ memories: 0, contacts: 0, postscripts: 0 })
  const [userContacts, setUserContacts] = useState<Array<{id: string; full_name: string; avatar_url?: string}>>([])
  
  // Conversation state - for full ConversationView modal
  const [conversationPrompt, setConversationPrompt] = useState<any | null>(null)
  
  // Inline input state - for quick contact updates
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [textValue, setTextValue] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Milestone celebration state
  const [milestone, setMilestone] = useState<{
    type: 'memories' | 'streak' | 'xp' | 'contacts' | null;
    value: number;
    message: string;
  } | null>(null)
  
  // Upcoming events (birthdays, etc.)
  const [upcomingEvents, setUpcomingEvents] = useState<Array<{
    type: 'birthday' | 'anniversary';
    contactName: string;
    contactId: string;
    date: string;
    daysUntil: number;
  }>>([])
  
  // XP and progress state
  const [totalXp, setTotalXp] = useState(0)
  const [xpAnimating, setXpAnimating] = useState(false)
  const [lastXpGain, setLastXpGain] = useState(0)
  const [tilesKey, setTilesKey] = useState(0)
  const [completedTiles, setCompletedTiles] = useState<Array<{
    id: string;
    type: string;
    icon: string;
    title: string;
    xp?: number;
    photoUrl?: string;
    contactName?: string;
    contactId?: string;
    memoryId?: string;
    photoId?: string;
    knowledgeId?: string;
    resultMemoryId?: string;
    answeredAt: string;
  }>>([])
  
  const supabase = createClient()
  const { prompts: rawPrompts, isLoading, shuffle, answerPrompt, skipPrompt } = useEngagementPrompts(8)
  
  // Track locally answered prompts (to remove from display without full refetch)
  const [answeredPromptIds, setAnsweredPromptIds] = useState<string[]>([])

  // Filter to ensure no duplicate prompts and exclude answered ones
  const contactTypes = ['quick_question', 'missing_info', 'tag_person']
  const seenTexts = new Set<string>()
  let contactCount = 0
  
  const uniquePrompts = rawPrompts.filter(prompt => {
    // Skip if already answered locally
    if (answeredPromptIds.includes(prompt.id)) return false
    if (seenTexts.has(prompt.promptText)) return false
    seenTexts.add(prompt.promptText)
    if (contactTypes.includes(prompt.type)) {
      if (contactCount >= 2) return false
      contactCount++
    }
    return true
  })

  // Note: incompleteContactPrompts is computed below after incompleteContacts state is declared

  const prompts = uniquePrompts.slice(0, 5)

  // Load saved state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('yt_completed_tiles')
    const savedXp = localStorage.getItem('yt_total_xp')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          const seen = new Set<string>()
          const deduped = parsed.filter((tile: any) => {
            if (seen.has(tile.id)) return false
            seen.add(tile.id)
            return true
          })
          setCompletedTiles(deduped)
        }
      } catch (e) {
        console.error('Failed to parse completed tiles:', e)
      }
    }
    if (savedXp) {
      setTotalXp(parseInt(savedXp, 10) || 0)
    }
  }, [])
  
  // Save completed tiles to localStorage
  useEffect(() => {
    if (completedTiles.length > 0) {
      localStorage.setItem('yt_completed_tiles', JSON.stringify(completedTiles))
    }
  }, [completedTiles])

  useEffect(() => {
    loadProfile()
    loadStats()
    loadContacts()
    loadUpcomingEvents()
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

  const [incompleteContacts, setIncompleteContacts] = useState<Array<{
    id: string
    full_name: string
    avatar_url?: string
    missingFields: string[]
  }>>([])

  const loadContacts = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('contacts')
      .select('id, full_name, avatar_url, email, phone, date_of_birth, how_met, notes')
      .eq('user_id', user.id)
      .order('full_name')
    if (data) {
      setUserContacts(data)
      // Find contacts with missing essential info
      const incomplete = data
        .map(c => {
          const missing: string[] = []
          if (!c.email) missing.push('email')
          if (!c.phone) missing.push('phone')
          if (!c.date_of_birth) missing.push('birthday')
          if (!c.how_met) missing.push('how_met')
          return { ...c, missingFields: missing }
        })
        .filter(c => c.missingFields.length > 0)
        .slice(0, 3) // Max 3 incomplete contact prompts
      setIncompleteContacts(incomplete)
    }
  }

  const loadUpcomingEvents = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    
    const today = new Date()
    const { data: contacts } = await supabase
      .from('contacts')
      .select('id, full_name, birth_date')
      .eq('user_id', user.id)
      .not('birth_date', 'is', null)
    
    if (contacts) {
      const events: typeof upcomingEvents = []
      contacts.forEach(contact => {
        if (!contact.birth_date) return
        const birthDate = new Date(contact.birth_date)
        const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate())
        if (thisYearBirthday < today) {
          thisYearBirthday.setFullYear(today.getFullYear() + 1)
        }
        const daysUntil = Math.ceil((thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        if (daysUntil <= 7) {
          events.push({
            type: 'birthday',
            contactName: contact.full_name,
            contactId: contact.id,
            date: contact.birth_date,
            daysUntil
          })
        }
      })
      events.sort((a, b) => a.daysUntil - b.daysUntil)
      setUpcomingEvents(events)
    }
  }

  // Handle tile click - either open ConversationView or inline input
  const handleTileClick = useCallback((prompt: any) => {
    if (CONVERSATION_TYPES.includes(prompt.type)) {
      // Open full ConversationView modal
      setConversationPrompt(prompt)
    } else if (INLINE_INPUT_TYPES.includes(prompt.type)) {
      // Use simple inline expansion
      setExpandedId(prompt.id)
    }
  }, [])

  // Handle ConversationView completion
  const handleConversationComplete = useCallback(async (result: {
    exchanges: Array<{ question: string; response: string; audioUrl?: string }>;
    summary: string;
    knowledgeEntryId?: string;
    memoryId?: string;
    xpAwarded: number;
  }) => {
    if (!conversationPrompt) return
    
    const config = TYPE_CONFIG[conversationPrompt.type] || TYPE_CONFIG.memory_prompt
    const xpGained = result.xpAwarded || config.xp
    
    // Add to completed tiles
    setCompletedTiles(prev => {
      if (prev.some(t => t.id === conversationPrompt.id)) return prev
      return [{
        id: conversationPrompt.id,
        type: conversationPrompt.type,
        icon: config.icon,
        title: conversationPrompt.promptText?.substring(0, 40) || config.label,
        xp: xpGained,
        photoUrl: conversationPrompt.photoUrl,
        contactName: conversationPrompt.contactName,
        contactId: conversationPrompt.contactId,
        memoryId: result.memoryId,
        knowledgeId: result.knowledgeEntryId,
        resultMemoryId: result.memoryId,
        answeredAt: new Date().toISOString(),
      }, ...prev]
    })

    // XP animation
    if (xpGained > 0) {
      setLastXpGain(xpGained)
      setXpAnimating(true)
      setTotalXp(prev => {
        const newXp = prev + xpGained
        localStorage.setItem('yt_total_xp', String(newXp))
        return newXp
      })
      setTimeout(() => setXpAnimating(false), 1500)
    }

    // Close conversation modal
    setConversationPrompt(null)
    
    // Mark prompt as answered locally (removes from tile grid)
    setAnsweredPromptIds(prev => [...prev, conversationPrompt.id])
    
    // Refresh stats
    loadStats()
  }, [conversationPrompt])

  // Handle inline answer (for contact prompts)
  const handleInlineAnswer = useCallback(async (promptId: string) => {
    const prompt = prompts.find(p => p.id === promptId)
    if (!prompt || !textValue.trim()) return
    
    setIsSubmitting(true)
    try {
      const result = await answerPrompt(promptId, { 
        type: 'text', 
        text: textValue 
      }) as { memoryId?: string; contactId?: string } | undefined

      const config = TYPE_CONFIG[prompt.type] || TYPE_CONFIG.memory_prompt
      
      // Add to completed tiles
      setCompletedTiles(prev => {
        if (prev.some(t => t.id === promptId)) return prev
        return [{
          id: promptId,
          type: prompt.type,
          icon: config.icon,
          title: prompt.contactName || config.label,
          xp: config.xp,
          contactName: prompt.contactName,
          contactId: prompt.contactId || result?.contactId,
          answeredAt: new Date().toISOString(),
        }, ...prev]
      })

      // XP animation
      if (config.xp > 0) {
        setLastXpGain(config.xp)
        setXpAnimating(true)
        setTotalXp(prev => {
          const newXp = prev + config.xp
          localStorage.setItem('yt_total_xp', String(newXp))
          return newXp
        })
        setTimeout(() => setXpAnimating(false), 1500)
      }

      setTextValue('')
      setExpandedId(null)
    } catch (err) {
      console.error('Error answering prompt:', err)
    }
    setIsSubmitting(false)
  }, [prompts, textValue, answerPrompt])

  // Handle shuffle
  const handleShuffle = () => {
    setTilesKey(prev => prev + 1)
    shuffle()
  }

  const isContactPrompt = (type: string) => type === 'quick_question' || type === 'missing_info'

  const getContactName = (prompt: any, index: number = 0) => {
    const fromPrompt = prompt.contactName 
      || prompt.contact_name
      || prompt.metadata?.contact?.name 
      || prompt.metadata?.contact?.full_name
    if (fromPrompt) return fromPrompt
    if (isContactPrompt(prompt.type) && userContacts.length > 0) {
      const contactIdx = prompt.id ? prompt.id.charCodeAt(0) % userContacts.length : index % userContacts.length
      return userContacts[contactIdx]?.full_name || null
    }
    return null
  }

  const getPromptText = (prompt: any) => {
    if (isContactPrompt(prompt.type)) {
      const contactName = prompt.contactName || prompt.metadata?.contact?.name || 'this contact'
      if (prompt.missingField) {
        const labels: Record<string, string> = { 
          phone: 'phone number', 
          email: 'email address', 
          date_of_birth: 'birthday',
          birth_date: 'birthday',
          how_met: 'story of how you met',
          relationship: 'relationship to you',
          nickname: 'nickname',
          notes: 'story',
          address: 'address',
          company: 'workplace',
          job_title: 'job title',
        }
        // Use better phrasing for narrative fields
        if (prompt.missingField === 'how_met') {
          return `How did you meet ${contactName}?`
        }
        if (prompt.missingField === 'relationship') {
          return `What is your relationship to ${contactName}?`
        }
        if (prompt.missingField === 'notes') {
          return `Tell us about ${contactName}`
        }
        return `What is ${contactName}'s ${labels[prompt.missingField] || prompt.missingField.replace(/_/g, ' ')}?`
      }
      return `Tell us more about ${contactName}`
    }
    return prompt.promptText || ''
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Background */}
      <div className="home-background">
        <div className="home-blob home-blob-1" />
        <div className="home-blob home-blob-2" />
        <div className="home-blob home-blob-3" />
        <div className="home-blob home-blob-4" />
      </div>

      {/* ConversationView Modal */}
      <AnimatePresence>
        {conversationPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-2xl max-h-[90vh] overflow-auto"
            >
              <ConversationView
                prompt={conversationPrompt}
                expectedXp={TYPE_CONFIG[conversationPrompt.type]?.xp || 15}
                onComplete={handleConversationComplete}
                onClose={() => setConversationPrompt(null)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Milestone Celebration Modal */}
      <AnimatePresence>
        {milestone && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="milestone-overlay"
            onClick={() => setMilestone(null)}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="milestone-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="milestone-icon">
                {milestone.type === 'memories' && '📚'}
                {milestone.type === 'xp' && '⭐'}
                {milestone.type === 'contacts' && '👥'}
              </div>
              <h2 className="milestone-title">Milestone Reached!</h2>
              <p className="milestone-message">{milestone.message}</p>
              <button onClick={() => setMilestone(null)} className="milestone-button">
                Keep Going!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
          
          {/* Upcoming Birthdays */}
          {upcomingEvents.length > 0 && (
            <div className="profile-events">
              {upcomingEvents.slice(0, 2).map((event) => (
                <Link 
                  key={event.contactId}
                  href={`/dashboard/contacts/${event.contactId}`}
                  className="profile-event"
                >
                  <Gift size={12} />
                  <span>
                    {event.contactName}
                    {event.daysUntil === 0 ? ' 🎂 Today!' : 
                     event.daysUntil === 1 ? ' tomorrow' : 
                     ` in ${event.daysUntil}d`}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
        
        {/* Personality/Essence Graph - TODO: Add back when properly analyzing data */}
        
        {/* Activity Feed - In left column, below profile card, same width */}
        <div className="mt-6" style={{ width: 280 }}>
          <ActivityFeed />
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
              <button onClick={handleShuffle} className="home-refresh-btn">
                <RefreshCw size={16} />
                Generate More
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              {/* Progress Tracker with XP Counter */}
              <div className="w-full" style={{ maxWidth: 816 }}>
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="progress-tracker"
                >
                  {/* XP Counter */}
                  <div className="flex items-center gap-3">
                    <motion.div
                      className="xp-counter"
                      animate={xpAnimating ? { scale: [1, 1.2, 1] } : {}}
                      transition={{ duration: 0.4 }}
                    >
                      <Sparkles size={14} className="text-[#D9C61A]" />
                      <span className="xp-value">{totalXp}</span>
                      <span className="xp-label">XP</span>
                    </motion.div>
                    
                    <AnimatePresence>
                      {xpAnimating && lastXpGain > 0 && (
                        <motion.div
                          initial={{ opacity: 0, x: -10, scale: 0.8 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          exit={{ opacity: 0, x: 10, scale: 0.8 }}
                          className="xp-gain-popup"
                        >
                          +{lastXpGain} 🎉
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  <div className="progress-tracker-divider" />
                  
                  {/* Completed tiles */}
                  <div className="progress-tiles-container">
                    {completedTiles.length === 0 ? (
                      <span className="progress-tracker-empty">Answer prompts to earn XP</span>
                    ) : (
                      <AnimatePresence mode="popLayout">
                        {completedTiles.map((tile, index) => (
                          <motion.div
                            key={`${tile.id}-${tile.answeredAt}`}
                            initial={{ scale: 0, opacity: 0, x: -30 }}
                            animate={{ scale: 1, opacity: 1, x: 0 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 25, delay: index === 0 ? 0.3 : 0 }}
                            className="progress-tile cursor-pointer hover:ring-2 hover:ring-[#406A56]/30 hover:scale-110 transition-transform"
                            title={`${tile.title}${tile.xp ? ` (+${tile.xp} XP)` : ''}`}
                            onClick={() => {
                              if (tile.type === 'quick_question' || tile.type === 'missing_info') {
                                if (tile.contactId) window.location.assign(`/dashboard/contacts/${tile.contactId}`)
                                else window.location.assign('/dashboard/contacts')
                              } else if (tile.type === 'knowledge') {
                                // Link to dedicated wisdom detail page
                                if (tile.resultMemoryId || tile.memoryId) {
                                  window.location.assign(`/dashboard/wisdom/${tile.resultMemoryId || tile.memoryId}`)
                                } else {
                                  window.location.assign('/dashboard/wisdom')
                                }
                              } else if (tile.resultMemoryId || tile.memoryId) {
                                window.location.assign(`/dashboard/memories/${tile.resultMemoryId || tile.memoryId}`)
                              } else {
                                window.location.assign('/dashboard/memories')
                              }
                            }}
                          >
                            {tile.photoUrl ? (
                              <img src={tile.photoUrl} alt={tile.title} />
                            ) : tile.contactName ? (
                              <div className="progress-tile-avatar">{tile.contactName.charAt(0).toUpperCase()}</div>
                            ) : (
                              <span>{tile.icon}</span>
                            )}
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    )}
                  </div>
                </motion.div>
              </div>

              {/* Tile grid: 2x2 + 1 tall on right */}
              <div className="relative mx-auto" style={{ width: 720, height: 400, marginTop: 16 }}>
                <AnimatePresence mode="popLayout">
                  {(() => {
                    // Reorder prompts: photo tasks go to position 4 (tall tile)
                    const sortedPrompts = [...prompts.slice(0, 5)]
                    const photoIndex = sortedPrompts.findIndex(p => 
                      p.photoUrl && (p.type === 'photo_backstory' || p.type === 'tag_person')
                    )
                    if (photoIndex !== -1 && photoIndex !== 4) {
                      // Move photo task to position 4
                      const [photoPrompt] = sortedPrompts.splice(photoIndex, 1)
                      if (sortedPrompts.length >= 4) {
                        sortedPrompts.splice(4, 0, photoPrompt)
                      } else {
                        sortedPrompts.push(photoPrompt)
                      }
                    }
                    return sortedPrompts
                  })().map((prompt, i) => {
                    const config = TYPE_CONFIG[prompt.type] || TYPE_CONFIG.memory_prompt
                    const isExpanded = expandedId === prompt.id
                    const pos = TILE_POSITIONS[i] || { col: i % 2, row: Math.floor(i / 2) }
                    const hasPhoto = prompt.photoUrl && (prompt.type === 'photo_backstory' || prompt.type === 'tag_person')
                    const contactName = getContactName(prompt, i)
                    const isContact = isContactPrompt(prompt.type)
                    const isTall = (pos as any).tall === true || (i === 4 && hasPhoto)

                    const tileWidth = 210
                    const tileHeight = 175
                    const tallHeight = tileHeight * 2 + 24  // Full height for photo tiles
                    const gap = 24
                    const left = pos.col * (tileWidth + gap)
                    const top = isTall ? 0 : pos.row * (tileHeight + gap)
                    const staggerDelay = i * 0.08

                    return (
                      <motion.div
                        key={`${tilesKey}-${prompt.id}`}
                        initial={{ opacity: 0, scale: 0.3, y: 50 }}
                        animate={{ 
                          opacity: 1, 
                          scale: 1,
                          y: 0,
                          zIndex: isExpanded ? 50 : 1,
                          x: isExpanded ? -left + 150 : 0,
                        }}
                        exit={{ opacity: 0, scale: 0.5, y: -30 }}
                        transition={{ 
                          type: 'spring', 
                          stiffness: 400, 
                          damping: 25,
                          delay: isExpanded ? 0 : staggerDelay,
                        }}
                        onClick={() => !isExpanded && handleTileClick(prompt)}
                        className={`bubble-tile absolute ${isExpanded ? 'shadow-2xl' : ''}`}
                        style={{ 
                          left, 
                          top,
                          width: isExpanded ? 340 : tileWidth,
                          minHeight: isExpanded ? 'auto' : (isTall ? tallHeight : tileHeight),
                          cursor: isExpanded ? 'default' : 'pointer',
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

                        {/* Close button for inline expanded */}
                        {isExpanded && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); setExpandedId(null); setTextValue(''); }}
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

                          {/* Contact card */}
                          {isContact && (
                            <div className="bubble-contact">
                              <div className="bubble-contact-avatar">
                                {(contactName || 'C').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="bubble-contact-name">{contactName || 'Unknown Contact'}</div>
                                <div className="bubble-contact-sub">
                                  {prompt.missingField 
                                    ? `Add ${prompt.missingField === 'how_met' ? 'how met' : prompt.missingField.replace(/_/g, ' ')}` 
                                    : 'Update info'}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Photo */}
                          {hasPhoto && (
                            <img 
                              src={prompt.photoUrl} 
                              alt="" 
                              className="bubble-photo"
                              style={{ height: isTall ? 200 : 100 }}
                            />
                          )}

                          {/* Question text */}
                          <p className="bubble-text">{getPromptText(prompt)}</p>

                          {/* Inline input for contact prompts */}
                          {isExpanded && isContact && (
                            <div className="mt-4 space-y-3">
                              {prompt.missingField === 'birth_date' || prompt.missingField === 'date_of_birth' ? (
                                <input
                                  type="date"
                                  value={textValue}
                                  onChange={(e) => setTextValue(e.target.value)}
                                  className="w-full p-3 bg-[#406A56]/5 border border-[#406A56]/10 rounded-xl text-gray-800 focus:outline-none focus:border-[#406A56]/30"
                                />
                              ) : prompt.missingField === 'phone' ? (
                                <input
                                  type="tel"
                                  value={textValue}
                                  onChange={(e) => setTextValue(e.target.value)}
                                  placeholder="(555) 123-4567"
                                  className="w-full p-3 bg-[#406A56]/5 border border-[#406A56]/10 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#406A56]/30"
                                />
                              ) : prompt.missingField === 'email' ? (
                                <input
                                  type="email"
                                  value={textValue}
                                  onChange={(e) => setTextValue(e.target.value)}
                                  placeholder="email@example.com"
                                  className="w-full p-3 bg-[#406A56]/5 border border-[#406A56]/10 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#406A56]/30"
                                />
                              ) : (
                                <textarea
                                  value={textValue}
                                  onChange={(e) => setTextValue(e.target.value)}
                                  placeholder={`Enter ${prompt.missingField?.replace(/_/g, ' ') || 'info'}...`}
                                  rows={2}
                                  autoFocus
                                  className="w-full p-3 bg-[#406A56]/5 border border-[#406A56]/10 rounded-xl text-gray-800 placeholder-gray-400 resize-none focus:outline-none focus:border-[#406A56]/30"
                                />
                              )}
                              
                              <div className="flex justify-between">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setExpandedId(null); setTextValue(''); }} 
                                  className="text-xs text-gray-400 hover:text-gray-600"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleInlineAnswer(prompt.id); }}
                                  disabled={!textValue.trim() || isSubmitting}
                                  className="flex items-center gap-2 px-4 py-2 bg-[#406A56] hover:bg-[#4a7a64] text-white text-sm font-medium rounded-lg disabled:opacity-50"
                                >
                                  <Send size={14} />
                                  {isSubmitting ? 'Saving...' : 'Save'}
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Skip button for non-expanded tiles */}
                          {!isExpanded && (
                            <button
                              onClick={(e) => { e.stopPropagation(); skipPrompt(prompt.id); }}
                              className="absolute bottom-3 right-3 text-xs text-gray-400 hover:text-gray-600"
                            >
                              Skip
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>

              {/* Shuffle button */}
              <button
                onClick={handleShuffle}
                className="mt-4 flex items-center gap-2 px-4 py-2 text-[#406A56]/60 hover:text-[#406A56] transition-colors"
              >
                <RefreshCw size={16} />
                <span className="text-sm">Shuffle prompts</span>
              </button>
            </div>
          )}
        </div>
        
      </div>
      
      {/* CommandBar - RAG interface */}
      <CommandBar />
    </div>
  )
}
