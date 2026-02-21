'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useEngagementPrompts } from '@/hooks/useEngagementPrompts'
import { RefreshCw, Sparkles, X, Type, Send, SkipForward, MicOff, Mic, Camera, Plus, Upload, Image } from 'lucide-react'
import Link from 'next/link'
import CommandBar from '@/components/dashboard/CommandBar'
import '@/styles/home.css'
import '@/styles/engagement.css'

// Suggestions for interests/skills/hobbies
const INTEREST_SUGGESTIONS = ['Travel', 'Music', 'Sports', 'Reading', 'Gaming', 'Cooking', 'Art', 'Photography', 'Fitness', 'Movies', 'Nature', 'Technology']
const SKILL_SUGGESTIONS = ['Leadership', 'Writing', 'Public Speaking', 'Problem Solving', 'Teaching', 'Coding', 'Design', 'Marketing', 'Negotiation', 'Management']
const HOBBY_SUGGESTIONS = ['Gardening', 'Hiking', 'Painting', 'Yoga', 'Chess', 'Fishing', 'Knitting', 'Woodworking', 'Baking', 'Cycling']

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
  update_profile: { icon: '✏️', label: 'About You', color: 'blue', xp: 0 },
  photo_dump: { icon: '📷', label: 'Photo Dump', color: 'yellow', xp: 0 },
}

// Fixed tile positions (no reflow on expand)
const TILE_POSITIONS = [
  { col: 0, row: 0, rotate: 0 },
  { col: 1, row: 0, rotate: 0 },
  { col: 2, row: 0, rotate: 0 },
  { col: 0, row: 1, rotate: 0 },
  { col: 1, row: 1, rotate: 0 },
]

export default function DashboardPage() {
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState({ memories: 0, contacts: 0, postscripts: 0 })
  const [userContacts, setUserContacts] = useState<Array<{id: string; full_name: string; avatar_url?: string}>>([])
  const [contactIndex, setContactIndex] = useState(0)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [inputMode, setInputMode] = useState<'text' | 'voice' | null>(null)
  const [textValue, setTextValue] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [bulkPhotos, setBulkPhotos] = useState<File[]>([])
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const [completedTiles, setCompletedTiles] = useState<Array<{
    id: string;
    type: string;
    icon: string;
    title: string;
    photoUrl?: string;
    contactName?: string;
    contactId?: string;
    memoryId?: string;
  }>>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const bulkInputRef = useRef<HTMLInputElement>(null)
  
  // Profile update state
  const [editingField, setEditingField] = useState<'interests' | 'skills' | 'hobbies' | null>(null)
  const [tagInput, setTagInput] = useState('')
  const [localTags, setLocalTags] = useState<{ interests: string[]; skills: string[]; hobbies: string[] }>({
    interests: [],
    skills: [],
    hobbies: [],
  })
  
  const supabase = createClient()
  const { prompts: rawPrompts, isLoading, shuffle, answerPrompt, skipPrompt, dismissPrompt, stats: engagementStats } = useEngagementPrompts(5)

  // Add special prompts (profile update, photo dump)
  const prompts = [...rawPrompts]
  if (profile && rawPrompts.length > 0) {
    const rand = Math.random()
    
    // 25% chance: interests/skills/hobbies update
    if (rand < 0.25 && prompts.length < 5) {
      prompts.push({
        id: 'update_profile_interests',
        type: 'update_profile',
        promptText: 'What are you into lately?',
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
    
    // 20% chance: photo dump
    if (rand >= 0.25 && rand < 0.45 && prompts.length < 5) {
      prompts.push({
        id: 'photo_dump',
        type: 'photo_dump',
        promptText: 'Upload a batch of photos',
        category: 'memories',
        status: 'pending',
        priority: 25,
        userId: profile.id,
        createdAt: new Date().toISOString(),
      } as any)
    }
  }
  
  // Sync local tags when profile loads
  useEffect(() => {
    if (profile) {
      setLocalTags({
        interests: profile.interests || [],
        skills: profile.skills || [],
        hobbies: profile.hobbies || [],
      })
    }
  }, [profile])

  useEffect(() => {
    loadProfile()
    loadStats()
    loadContacts()
  }, [])

  const loadContacts = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('contacts')
      .select('id, full_name, avatar_url')
      .eq('user_id', user.id)
      .order('full_name')
    if (data) {
      setUserContacts(data)
    }
  }

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
    
    // Find the prompt to add to completed tiles
    const prompt = prompts.find(p => p.id === promptId)
    
    setIsSubmitting(true)
    try {
      // Add to completed tiles before removing
      if (prompt) {
        const config = TYPE_CONFIG[prompt.type] || TYPE_CONFIG.memory_prompt
        const promptIndex = prompts.findIndex(p => p.id === promptId)
        const contactName = getContactName(prompt, promptIndex)
        
        // Generate a meaningful title for the completed tile
        let title = ''
        if (contactName) {
          title = contactName
        } else if (prompt.type === 'photo_backstory' || prompt.type === 'tag_person') {
          title = 'Photo memory'
        } else if (prompt.type === 'memory_prompt') {
          title = prompt.promptText?.substring(0, 40) || 'Memory'
        } else if (prompt.type === 'knowledge') {
          title = prompt.promptText?.substring(0, 40) || 'Wisdom'
        } else {
          title = config.label
        }
        
        setCompletedTiles(prev => [{
          id: prompt.id,
          type: prompt.type,
          icon: config.icon,
          title,
          photoUrl: prompt.photoUrl,
          contactName,
          contactId: prompt.contactId,
          memoryId: prompt.memoryId,
        }, ...prev])
      }
      
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
      // Remove from completed if failed
      if (prompt) {
        setCompletedTiles(prev => prev.filter(t => t.id !== promptId))
      }
    }
    setIsSubmitting(false)
  }

  const handleSkip = async (promptId: string) => {
    if (promptId.startsWith('update_profile') || promptId === 'photo_dump') {
      setExpandedId(null)
      setEditingField(null)
      setBulkPhotos([])
      return
    }
    await skipPrompt(promptId)
    setExpandedId(null)
    setInputMode(null)
  }
  
  // Tag management for profile update
  const addTag = (field: 'interests' | 'skills' | 'hobbies', tag: string) => {
    if (tag.trim() && !localTags[field].includes(tag.trim())) {
      setLocalTags(prev => ({
        ...prev,
        [field]: [...prev[field], tag.trim()]
      }))
    }
    setTagInput('')
  }
  
  const removeTag = (field: 'interests' | 'skills' | 'hobbies', tag: string) => {
    setLocalTags(prev => ({
      ...prev,
      [field]: prev[field].filter(t => t !== tag)
    }))
  }
  
  const saveProfileTags = async () => {
    if (!profile) return
    setIsSubmitting(true)
    try {
      await supabase.from('profiles').update({
        interests: localTags.interests,
        skills: localTags.skills,
        hobbies: localTags.hobbies,
      }).eq('id', profile.id)
      
      setProfile((prev: any) => ({ ...prev, ...localTags }))
      setExpandedId(null)
      setEditingField(null)
    } catch (err) {
      console.error(err)
    }
    setIsSubmitting(false)
  }
  
  // Photo dump upload
  const handleBulkPhotos = (files: FileList | null) => {
    if (!files) return
    const newPhotos = Array.from(files).filter(f => f.type.startsWith('image/'))
    setBulkPhotos(prev => [...prev, ...newPhotos])
  }
  
  const uploadBulkPhotos = async () => {
    if (bulkPhotos.length === 0 || !profile) return
    setUploadingPhotos(true)
    
    try {
      for (const photo of bulkPhotos) {
        const fileExt = photo.name.split('.').pop()?.toLowerCase() || 'jpg'
        const fileName = `${profile.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
        
        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('memories')
          .upload(fileName, photo)
        
        if (uploadError) {
          console.error('Upload error:', uploadError)
          continue
        }
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('memories')
          .getPublicUrl(fileName)
        
        // Create media record
        await supabase.from('memory_media').insert({
          user_id: profile.id,
          file_url: publicUrl,
          file_type: 'image',
          file_name: photo.name,
          file_size: photo.size,
        })
      }
      
      setBulkPhotos([])
      setExpandedId(null)
      loadStats() // Refresh stats
    } catch (err) {
      console.error('Bulk upload error:', err)
    }
    setUploadingPhotos(false)
  }

  const handleDismiss = async (promptId: string) => {
    if (promptId.startsWith('update_profile') || promptId === 'photo_dump') {
      setExpandedId(null)
      setEditingField(null)
      setBulkPhotos([])
      return
    }
    await dismissPrompt(promptId)
    setExpandedId(null)
    setInputMode(null)
  }
  
  const getSuggestions = (field: 'interests' | 'skills' | 'hobbies') => {
    const suggestions = field === 'interests' ? INTEREST_SUGGESTIONS : field === 'skills' ? SKILL_SUGGESTIONS : HOBBY_SUGGESTIONS
    return suggestions.filter(s => !localTags[field].includes(s))
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

  // Get contact name for display - check all possible sources
  const getContactName = (prompt: any, index: number = 0) => {
    // First check prompt data
    const fromPrompt = prompt.contactName 
      || prompt.contact_name
      || prompt.metadata?.contact?.name 
      || prompt.metadata?.contact?.full_name
      || prompt.metadata?.suggested_contact_name;
    
    if (fromPrompt) return fromPrompt;
    
    // For contact-type prompts without a name, assign one from user's contacts
    if (isContactPrompt(prompt.type) && userContacts.length > 0) {
      // Use a deterministic index based on prompt id to assign consistent contact
      const contactIdx = prompt.id ? 
        prompt.id.charCodeAt(0) % userContacts.length : 
        index % userContacts.length;
      return userContacts[contactIdx]?.full_name || null;
    }
    
    return null;
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
            <div className="flex flex-col items-center gap-4">
              {/* Progress Tracker - aligned with tile grid */}
              <div className="w-full" style={{ maxWidth: 816 }}>
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="progress-tracker"
                >
                <span className="progress-tracker-label">Your Progress</span>
                {completedTiles.length === 0 ? (
                  <span className="progress-tracker-empty">Answer prompts to build your progress</span>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {completedTiles.map((tile, index) => {
                      // Determine navigation URL
                      const getNavigationUrl = () => {
                        if (tile.contactId) return `/dashboard/contacts/${tile.contactId}`
                        if (tile.memoryId) return `/dashboard/memories/${tile.memoryId}`
                        if (tile.type === 'knowledge') return `/dashboard/knowledge`
                        if (tile.type === 'photo_backstory' || tile.type === 'tag_person') return `/dashboard/memories`
                        return null
                      }
                      const navUrl = getNavigationUrl()
                      
                      return (
                        <motion.div
                          key={tile.id}
                          initial={{ scale: 0, opacity: 0, x: -20 }}
                          animate={{ scale: 1, opacity: 1, x: 0 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30, delay: index === 0 ? 0.1 : 0 }}
                          className={`progress-tile ${navUrl ? 'cursor-pointer hover:ring-2 hover:ring-[#406A56]/30' : ''}`}
                          title={tile.title}
                          onClick={() => navUrl && window.location.assign(navUrl)}
                        >
                          {tile.photoUrl ? (
                            <img src={tile.photoUrl} alt={tile.title} />
                          ) : tile.contactName ? (
                            <div className="progress-tile-avatar">{tile.contactName.charAt(0).toUpperCase()}</div>
                          ) : (
                            <span>{tile.icon}</span>
                          )}
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                )}
              </motion.div>
              </div>

              {/* Fixed-position tile grid (no reflow) - centered */}
              <div className="relative mx-auto" style={{ width: 816, height: 468, marginTop: 8 }}>
                <AnimatePresence>
                  {prompts.slice(0, 5).map((prompt, i) => {
                    const config = TYPE_CONFIG[prompt.type] || TYPE_CONFIG.memory_prompt
                    const isExpanded = expandedId === prompt.id
                    const pos = TILE_POSITIONS[i] || { col: i % 3, row: Math.floor(i / 3), rotate: 0 }
                    const hasPhoto = prompt.photoUrl && (prompt.type === 'photo_backstory' || prompt.type === 'tag_person')
                    const contactName = getContactName(prompt, i)
                    const isContact = isContactPrompt(prompt.type)

                    // Fixed position based on grid
                    const tileWidth = 240
                    const tileHeight = 210
                    const gap = 24
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
                        draggable={false}
                        className={`bubble-tile absolute ${isExpanded ? 'shadow-2xl' : ''}`}
                        style={{ 
                          left, 
                          top,
                          width: isExpanded ? 360 : tileWidth,
                          minHeight: isExpanded ? 'auto' : tileHeight,
                          cursor: isExpanded ? 'default' : 'pointer',
                          userSelect: 'none',
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
                                {/* Profile update task - inline editing */}
                                {prompt.type === 'update_profile' ? (
                                  <div className="space-y-4">
                                    {/* Field tabs */}
                                    <div className="flex gap-2">
                                      {(['interests', 'skills', 'hobbies'] as const).map(field => (
                                        <button
                                          key={field}
                                          onClick={() => setEditingField(field)}
                                          className={`flex-1 py-2 text-xs font-medium rounded-lg capitalize transition-colors ${
                                            editingField === field 
                                              ? 'bg-[#406A56] text-white' 
                                              : 'bg-[#406A56]/10 text-[#406A56] hover:bg-[#406A56]/20'
                                          }`}
                                        >
                                          {field} ({localTags[field].length})
                                        </button>
                                      ))}
                                    </div>
                                    
                                    {/* Tag editor */}
                                    {editingField && (
                                      <div className="space-y-3">
                                        {/* Input */}
                                        <div className="flex gap-2">
                                          <input
                                            type="text"
                                            value={tagInput}
                                            onChange={(e) => setTagInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && addTag(editingField, tagInput)}
                                            placeholder={`Add ${editingField.slice(0, -1)}...`}
                                            className="flex-1 px-3 py-2 bg-[#406A56]/5 border border-[#406A56]/10 rounded-lg text-sm focus:outline-none focus:border-[#406A56]/30"
                                          />
                                          <button 
                                            onClick={() => addTag(editingField, tagInput)}
                                            className="px-3 py-2 bg-[#406A56] text-white rounded-lg text-sm"
                                          >
                                            Add
                                          </button>
                                        </div>
                                        
                                        {/* Current tags */}
                                        {localTags[editingField].length > 0 && (
                                          <div className="flex flex-wrap gap-2">
                                            {localTags[editingField].map(tag => (
                                              <span key={tag} className="px-3 py-1 bg-[#406A56]/15 text-[#406A56] text-xs rounded-full flex items-center gap-1">
                                                {tag}
                                                <button onClick={() => removeTag(editingField, tag)} className="hover:text-red-500">
                                                  <X size={12} />
                                                </button>
                                              </span>
                                            ))}
                                          </div>
                                        )}
                                        
                                        {/* Suggestions */}
                                        <div>
                                          <p className="text-xs text-gray-400 mb-2">Suggestions</p>
                                          <div className="flex flex-wrap gap-1">
                                            {getSuggestions(editingField).slice(0, 8).map(s => (
                                              <button
                                                key={s}
                                                onClick={() => addTag(editingField, s)}
                                                className="px-2 py-1 bg-gray-100 hover:bg-[#406A56]/10 text-gray-600 text-xs rounded-full transition-colors"
                                              >
                                                + {s}
                                              </button>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                    
                                    {/* Save button */}
                                    <button
                                      onClick={saveProfileTags}
                                      disabled={isSubmitting}
                                      className="w-full py-2.5 bg-[#406A56] hover:bg-[#4a7a64] text-white text-sm font-medium rounded-xl disabled:opacity-50"
                                    >
                                      {isSubmitting ? 'Saving...' : 'Save Changes'}
                                    </button>
                                  </div>
                                ) : prompt.type === 'photo_dump' ? (
                                  /* Photo dump - bulk upload */
                                  <div className="space-y-4">
                                    {/* Drop zone */}
                                    <div 
                                      onClick={() => bulkInputRef.current?.click()}
                                      className="border-2 border-dashed border-[#D9C61A]/40 hover:border-[#D9C61A] rounded-xl p-6 text-center cursor-pointer transition-colors"
                                    >
                                      <Upload size={24} className="mx-auto mb-2 text-[#D9C61A]" />
                                      <p className="text-sm text-gray-600">Click to select photos</p>
                                      <p className="text-xs text-gray-400 mt-1">or drag & drop</p>
                                    </div>
                                    <input
                                      ref={bulkInputRef}
                                      type="file"
                                      accept="image/*"
                                      multiple
                                      onChange={(e) => handleBulkPhotos(e.target.files)}
                                      className="hidden"
                                    />
                                    
                                    {/* Preview */}
                                    {bulkPhotos.length > 0 && (
                                      <div>
                                        <p className="text-xs text-gray-500 mb-2">{bulkPhotos.length} photos selected</p>
                                        <div className="flex flex-wrap gap-2">
                                          {bulkPhotos.slice(0, 6).map((photo, i) => (
                                            <div key={i} className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                                              <img src={URL.createObjectURL(photo)} alt="" className="w-full h-full object-cover" />
                                              <button 
                                                onClick={() => setBulkPhotos(prev => prev.filter((_, j) => j !== i))}
                                                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center"
                                              >
                                                <X size={10} />
                                              </button>
                                            </div>
                                          ))}
                                          {bulkPhotos.length > 6 && (
                                            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                                              +{bulkPhotos.length - 6}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {/* Upload button */}
                                    <button
                                      onClick={uploadBulkPhotos}
                                      disabled={bulkPhotos.length === 0 || uploadingPhotos}
                                      className="w-full py-2.5 bg-[#D9C61A] hover:bg-[#c9b617] text-gray-900 text-sm font-medium rounded-xl disabled:opacity-50"
                                    >
                                      {uploadingPhotos ? `Uploading ${bulkPhotos.length} photos...` : `Upload ${bulkPhotos.length} Photos`}
                                    </button>
                                  </div>
                                ) : isContact && prompt.missingField ? (
                                  /* Contact missing info - show specific field input */
                                  <div className="space-y-3">
                                    <div className="text-sm text-gray-500 mb-2">
                                      Fill in {contactName}'s {prompt.missingField.replace(/_/g, ' ')}:
                                    </div>
                                    
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
                                    ) : prompt.missingField === 'contact_info' ? (
                                      <div className="space-y-2">
                                        <input
                                          type="tel"
                                          value={textValue.split('|')[0] || ''}
                                          onChange={(e) => setTextValue(e.target.value + '|' + (textValue.split('|')[1] || ''))}
                                          placeholder="Phone (optional)"
                                          className="w-full p-3 bg-[#406A56]/5 border border-[#406A56]/10 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#406A56]/30"
                                        />
                                        <input
                                          type="email"
                                          value={textValue.split('|')[1] || ''}
                                          onChange={(e) => setTextValue((textValue.split('|')[0] || '') + '|' + e.target.value)}
                                          placeholder="Email (optional)"
                                          className="w-full p-3 bg-[#406A56]/5 border border-[#406A56]/10 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#406A56]/30"
                                        />
                                      </div>
                                    ) : (
                                      <textarea
                                        value={textValue}
                                        onChange={(e) => setTextValue(e.target.value)}
                                        placeholder={`Enter ${prompt.missingField.replace(/_/g, ' ')}...`}
                                        rows={2}
                                        autoFocus
                                        className="w-full p-3 bg-[#406A56]/5 border border-[#406A56]/10 rounded-xl text-gray-800 placeholder-gray-400 resize-none focus:outline-none focus:border-[#406A56]/30"
                                      />
                                    )}
                                    
                                    <div className="flex justify-between mt-3">
                                      <button onClick={() => { setExpandedId(null); setTextValue(''); }} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
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
