'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useEngagementPrompts } from '@/hooks/useEngagementPrompts'
import { RefreshCw, Sparkles, X, Type, Send, SkipForward, MicOff, Mic, Camera, Plus, Upload, Image, Heart, Gift, Award } from 'lucide-react'
import Link from 'next/link'
import CommandBar from '@/components/dashboard/CommandBar'
import '@/styles/home.css'
import '@/styles/engagement.css'
import '@/styles/conversation.css'

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
  
  // Multi-step conversation state
  const [conversationState, setConversationState] = useState<Record<string, {
    currentStep: number;
    responses: Array<{ question: string; answer: string; mediaUrl?: string }>;
  }>>({})
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [bulkPhotos, setBulkPhotos] = useState<File[]>([])
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  
  // Voice recording state
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  
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
  
  // Greeting state
  const [greeting, setGreeting] = useState('')
  const [totalXp, setTotalXp] = useState(0)
  const [xpAnimating, setXpAnimating] = useState(false)
  const [lastXpGain, setLastXpGain] = useState(0)
  const [tilesKey, setTilesKey] = useState(0) // For re-triggering stagger animation
  const [flyingTile, setFlyingTile] = useState<{id: string; startX: number; startY: number} | null>(null)
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
  
  // Load completed tiles and XP from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('yt_completed_tiles')
    const savedXp = localStorage.getItem('yt_total_xp')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          // Deduplicate by id, photoId, AND photoUrl
          const seen = new Set<string>()
          const seenPhotos = new Set<string>()
          const seenPhotoUrls = new Set<string>()
          const deduped = parsed.filter((tile: any) => {
            if (seen.has(tile.id)) return false
            if (tile.photoId && seenPhotos.has(tile.photoId)) return false
            if (tile.photoUrl && seenPhotoUrls.has(tile.photoUrl)) return false
            seen.add(tile.id)
            if (tile.photoId) seenPhotos.add(tile.photoId)
            if (tile.photoUrl) seenPhotoUrls.add(tile.photoUrl)
            return true
          })
          setCompletedTiles(deduped)
          // Update localStorage if we removed duplicates
          if (deduped.length !== parsed.length) {
            localStorage.setItem('yt_completed_tiles', JSON.stringify(deduped))
          }
        }
      } catch (e) {
        console.error('Failed to parse completed tiles:', e)
      }
    }
    if (savedXp) {
      setTotalXp(parseInt(savedXp, 10) || 0)
    }
  }, [])
  
  // Save completed tiles to localStorage when changed
  useEffect(() => {
    if (completedTiles.length > 0) {
      localStorage.setItem('yt_completed_tiles', JSON.stringify(completedTiles))
    }
  }, [completedTiles])
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
  const { prompts: rawPrompts, isLoading, shuffle, answerPrompt, skipPrompt, dismissPrompt, stats: engagementStats } = useEngagementPrompts(8) // Fetch more to filter

  // Filter to ensure no duplicate prompts
  // Rules: same prompt text = duplicate, max 2 contact prompts
  const contactTypes = ['quick_question', 'missing_info', 'tag_person']
  const seenTexts = new Set<string>()
  let contactCount = 0
  
  const uniquePrompts = rawPrompts.filter(prompt => {
    // Skip if we've seen this exact text
    if (seenTexts.has(prompt.promptText)) return false
    seenTexts.add(prompt.promptText)
    
    // For contact prompts, limit to max 2 total
    if (contactTypes.includes(prompt.type)) {
      if (contactCount >= 2) return false
      contactCount++
    }
    
    return true
  })

  // Add special prompts (profile update, photo dump)
  const prompts = [...uniquePrompts.slice(0, 5)] // Limit to 5 after filtering
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
    loadUpcomingEvents()
    generateGreeting()
  }, [])
  
  // Generate personalized greeting based on time of day
  const generateGreeting = () => {
    const hour = new Date().getHours()
    let timeGreeting = ''
    let emoji = ''
    
    if (hour < 12) {
      timeGreeting = 'Good morning'
      emoji = '☀️'
    } else if (hour < 17) {
      timeGreeting = 'Good afternoon'
      emoji = '👋'
    } else if (hour < 21) {
      timeGreeting = 'Good evening'
      emoji = '🌅'
    } else {
      timeGreeting = 'Good night'
      emoji = '🌙'
    }
    
    setGreeting(`${timeGreeting} ${emoji}`)
  }
  
  // Load upcoming birthdays/anniversaries
  const loadUpcomingEvents = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    
    const today = new Date()
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    
    // Get contacts with birthdays
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
        
        // If birthday already passed this year, check next year
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
      
      // Sort by days until
      events.sort((a, b) => a.daysUntil - b.daysUntil)
      setUpcomingEvents(events)
    }
  }
  
  // Track previous stats to detect CHANGES (not just loads)
  const prevStatsRef = useRef<{ memories: number; contacts: number; xp: number } | null>(null)
  
  // Check for milestones only when stats INCREASE (not on page load)
  useEffect(() => {
    const prev = prevStatsRef.current
    
    // On first load, just record current values, don't check milestones
    if (prev === null) {
      prevStatsRef.current = { memories: stats.memories, contacts: stats.contacts, xp: totalXp }
      return
    }
    
    // Only check milestones if values actually increased
    const memoriesIncreased = stats.memories > prev.memories
    const contactsIncreased = stats.contacts > prev.contacts
    const xpIncreased = totalXp > prev.xp
    
    if (memoriesIncreased || contactsIncreased || xpIncreased) {
      checkMilestones()
    }
    
    // Update ref
    prevStatsRef.current = { memories: stats.memories, contacts: stats.contacts, xp: totalXp }
  }, [stats, totalXp])
  
  const checkMilestones = () => {
    // Get already shown milestones from localStorage
    const shownMilestones = JSON.parse(localStorage.getItem('yt_shown_milestones') || '[]')
    
    // Check memory milestones
    const memoryMilestones = [10, 25, 50, 100, 250, 500]
    for (const m of memoryMilestones) {
      const key = `memories_${m}`
      if (stats.memories >= m && !shownMilestones.includes(key)) {
        setMilestone({
          type: 'memories',
          value: m,
          message: `You've captured ${m} memories! 🎉`
        })
        localStorage.setItem('yt_shown_milestones', JSON.stringify([...shownMilestones, key]))
        return
      }
    }
    
    // Check XP milestones
    const xpMilestones = [100, 250, 500, 1000, 2500, 5000]
    for (const x of xpMilestones) {
      const key = `xp_${x}`
      if (totalXp >= x && !shownMilestones.includes(key)) {
        setMilestone({
          type: 'xp',
          value: x,
          message: `You've earned ${x} XP! Keep going! ⭐`
        })
        localStorage.setItem('yt_shown_milestones', JSON.stringify([...shownMilestones, key]))
        return
      }
    }
    
    // Check contacts milestones
    const contactMilestones = [10, 25, 50, 100]
    for (const c of contactMilestones) {
      const key = `contacts_${c}`
      if (stats.contacts >= c && !shownMilestones.includes(key)) {
        setMilestone({
          type: 'contacts',
          value: c,
          message: `${c} people documented in your story! 👥`
        })
        localStorage.setItem('yt_shown_milestones', JSON.stringify([...shownMilestones, key]))
        return
      }
    }
  }

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

  const handleAnswer = async (promptId: string, tileElement?: HTMLElement | null, skipFollowUp?: boolean, directText?: string) => {
    const answerText = directText !== undefined ? directText : textValue
    
    // Find the prompt to add to completed tiles
    const prompt = prompts.find(p => p.id === promptId)
    if (!prompt) return
    
    const currentStep = getCurrentStep(promptId)
    const responses = getResponses(promptId)
    
    // Allow finishing with just previous responses (Finish button without current step)
    const hasCurrentAnswer = answerText.trim() || mediaFile
    const hasPreviousResponses = responses.length > 0
    
    // Must have either current answer or previous responses
    if (!hasCurrentAnswer && !hasPreviousResponses) return
    
    const currentQuestion = currentStep === 0 ? getPromptText(prompt) : 
      (generateFollowUp(prompt, responses[currentStep - 1]?.answer || '', currentStep - 1)?.question || '')
    
    // Check if there's a follow-up question (unless skipping or no current answer)
    const followUp = (!skipFollowUp && hasCurrentAnswer) ? generateFollowUp(prompt, answerText, currentStep) : null
    
    if (followUp && followUp.inputType !== 'photo') {
      // Save current response and show follow-up
      setConversationState(prev => ({
        ...prev,
        [promptId]: {
          currentStep: currentStep + 1,
          responses: [...responses, { 
            question: currentQuestion, 
            answer: answerText,
            mediaUrl: mediaFile ? URL.createObjectURL(mediaFile) : undefined
          }]
        }
      }))
      setTextValue('')
      setMediaFile(null)
      return // Don't close tile, show follow-up
    }
    
    // If follow-up is photo type, we'll still complete but offer photo option
    // For now, complete the conversation
    
    // Combine all responses into final answer - only add current if we have one
    const allResponses = hasCurrentAnswer 
      ? [...responses, { question: currentQuestion, answer: answerText }]
      : responses
    const combinedText = allResponses.map(r => `${r.question}\n${r.answer}`).join('\n\n')
    
    setIsSubmitting(true)
    try {
      const config = TYPE_CONFIG[prompt?.type || 'memory_prompt'] || TYPE_CONFIG.memory_prompt
      const xpGained = config.xp + (allResponses.length - 1) * 5 // Bonus XP for follow-ups
      
      console.log('handleAnswer - completing with responses:', allResponses)
      
      // Start flying animation if we have the element position
      if (tileElement && prompt) {
        const rect = tileElement.getBoundingClientRect()
        setFlyingTile({ id: prompt.id, startX: rect.left, startY: rect.top })
      }
      
      // Call API FIRST to get the memoryId
      const result = await answerPrompt(promptId, { 
        type: 'text', 
        text: combinedText, // Combined multi-step responses
        data: mediaFile ? { hasMedia: true } : undefined
      }) as { memoryId?: string } | undefined
      
      console.log('Answer result with memoryId:', result)
      
      // Now add to completed tiles WITH the memoryId from the result
      if (prompt) {
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
        
        // Small delay for flying animation, but tile gets correct memoryId
        setTimeout(() => {
          setCompletedTiles(prev => {
            // Prevent duplicates
            if (prev.some(t => t.id === prompt.id)) return prev
            if (prompt.photoId && prev.some(t => t.photoId === prompt.photoId)) return prev
            if (prompt.photoUrl && prev.some(t => t.photoUrl === prompt.photoUrl)) return prev
            
            // Capture IDs from both prompt and API result
            const finalContactId = prompt.contactId || (result as any)?.contactId
            const finalMemoryId = result?.memoryId || prompt.memoryId || prompt.metadata?.resultMemoryId
            
            console.log('Adding completed tile:', {
              type: prompt.type,
              contactId: finalContactId,
              memoryId: finalMemoryId,
            })
            
            return [{
              id: prompt.id,
              type: prompt.type,
              icon: config.icon,
              title,
              xp: xpGained,
              photoUrl: prompt.photoUrl,
              contactName,
              contactId: finalContactId,
              memoryId: prompt.memoryId,
              photoId: prompt.photoId,
              knowledgeId: prompt.metadata?.knowledgeId,
              resultMemoryId: finalMemoryId,
              answeredAt: new Date().toISOString(),
            }, ...prev]
          })
          setFlyingTile(null)
          
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
        }, 300)
      }
      
      setTextValue('')
      setMediaFile(null)
      setInputMode(null)
      setExpandedId(null)
      // Clear conversation state for this prompt
      setConversationState(prev => {
        const { [promptId]: _, ...rest } = prev
        return rest
      })
    } catch (err: any) {
      console.error('handleAnswer error:', err)
      setFlyingTile(null)
      // Remove from completed if failed
      if (prompt) {
        setCompletedTiles(prev => prev.filter(t => t.id !== promptId))
      }
      // Show error to user
      alert(err?.message || 'Failed to save. Please try again.')
    }
    setIsSubmitting(false)
  }

  const handleSkip = async (promptId: string) => {
    if (promptId.startsWith('update_profile') || promptId === 'photo_dump') {
      setExpandedId(null)
      setEditingField(null)
      setBulkPhotos([])
      setTextValue('')
      setMediaFile(null)
      return
    }
    await skipPrompt(promptId)
    setExpandedId(null)
    setInputMode(null)
    setTextValue('')
    setMediaFile(null)
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
      setTextValue('')
      setMediaFile(null)
      return
    }
    await dismissPrompt(promptId)
    setExpandedId(null)
    setInputMode(null)
    setTextValue('')
    setMediaFile(null)
  }
  
  const getSuggestions = (field: 'interests' | 'skills' | 'hobbies') => {
    const suggestions = field === 'interests' ? INTEREST_SUGGESTIONS : field === 'skills' ? SKILL_SUGGESTIONS : HOBBY_SUGGESTIONS
    return suggestions.filter(s => !localTags[field].includes(s))
  }

  const isContactPrompt = (type: string) => type === 'quick_question' || type === 'missing_info'
  
  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setAudioBlob(audioBlob)
        setAudioUrl(URL.createObjectURL(audioBlob))
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorder.start()
      setIsRecording(true)
    } catch (err) {
      console.error('Failed to start recording:', err)
      alert('Could not access microphone. Please check permissions.')
    }
  }
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }
  
  const clearRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }
    setAudioBlob(null)
    setAudioUrl(null)
  }
  
  // Generate follow-up question based on prompt type and previous answer
  // These should be EMOTIONALLY REFLECTIVE, not just factual
  const generateFollowUp = (prompt: any, previousAnswer: string, stepIndex: number): { question: string; inputType: string } | null => {
    const type = prompt.type
    const contactName = getContactName(prompt, 0)
    
    // Photo backstory - emotional, reflective follow-ups
    if (type === 'photo_backstory') {
      if (stepIndex === 0) {
        return { 
          question: "What feelings does this photo bring back when you look at it?", 
          inputType: 'text' 
        }
      }
      if (stepIndex === 1) {
        return { 
          question: "If you could go back to this moment, what would you tell yourself?", 
          inputType: 'text' 
        }
      }
    }
    
    // Memory prompts - dig deeper emotionally
    if (type === 'memory_prompt') {
      if (stepIndex === 0) {
        return { 
          question: "Why does this memory stay with you? What does it mean to you now?", 
          inputType: 'text' 
        }
      }
      if (stepIndex === 1) {
        return { 
          question: "Who would you want to share this story with someday?", 
          inputType: 'text' 
        }
      }
    }
    
    // Wisdom/knowledge - make it legacy-focused
    if (type === 'knowledge') {
      if (stepIndex === 0) {
        return { 
          question: "How did you learn this lesson? Was there a moment it clicked?", 
          inputType: 'text' 
        }
      }
      if (stepIndex === 1) {
        return { 
          question: "Who do you hope hears this wisdom someday?", 
          inputType: 'text' 
        }
      }
    }
    
    // Favorites/firsts - emotional context
    if (type === 'favorites_firsts') {
      if (stepIndex === 0) {
        return { 
          question: "What feelings come up when you think about this?", 
          inputType: 'text' 
        }
      }
    }
    
    // No more follow-ups
    return null
  }
  
  // Get current step for a prompt
  const getCurrentStep = (promptId: string) => {
    return conversationState[promptId]?.currentStep || 0
  }
  
  // Get responses for a prompt
  const getResponses = (promptId: string) => {
    return conversationState[promptId]?.responses || []
  }
  
  // Handle shuffle with animation reset
  const handleShuffle = () => {
    setTilesKey(prev => prev + 1) // Reset stagger animation
    shuffle()
  }
  
  // Get helpful description based on prompt type
  const getPromptDescription = (prompt: any) => {
    const type = prompt.type
    switch (type) {
      case 'photo_backstory':
        return 'Share the story behind this photo — who was there, what happened, why it matters'
      case 'tag_person':
        return 'Help us identify people in your photos to connect memories'
      case 'missing_info':
      case 'quick_question':
        return 'Keep your contact info up to date for future messages'
      case 'memory_prompt':
        return 'Capture this memory in your own words — every detail counts'
      case 'knowledge':
        return 'Share your wisdom and life lessons for future generations'
      case 'postscript':
        return 'Write a message to be delivered in the future'
      case 'favorites_firsts':
        return 'Document your favorites and firsts — the things that define you'
      case 'recipes_wisdom':
        return 'Pass down family recipes and traditions'
      default:
        return 'Share your story'
    }
  }

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
      </div>

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
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="milestone-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="milestone-icon">
                {milestone.type === 'memories' && '📚'}
                {milestone.type === 'xp' && '⭐'}
                {milestone.type === 'contacts' && '👥'}
                {milestone.type === 'streak' && '🔥'}
              </div>
              <h2 className="milestone-title">Milestone Reached!</h2>
              <p className="milestone-message">{milestone.message}</p>
              <div className="milestone-confetti">🎉</div>
              <button 
                onClick={() => setMilestone(null)}
                className="milestone-button"
              >
                Keep Going!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                      animate={xpAnimating ? { 
                        scale: [1, 1.2, 1],
                      } : {}}
                      transition={{ duration: 0.4 }}
                    >
                      <Sparkles size={14} className="text-[#D9C61A]" />
                      <span className="xp-value">{totalXp}</span>
                      <span className="xp-label">XP</span>
                    </motion.div>
                    
                    {/* XP gain popup - inline, not absolute */}
                    <AnimatePresence>
                      {xpAnimating && lastXpGain > 0 && (
                        <motion.div
                          initial={{ opacity: 0, x: -10, scale: 0.8 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          exit={{ opacity: 0, x: 10, scale: 0.8 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
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
                        {completedTiles.map((tile, index) => {
                          const handleTileClick = () => {
                            console.log('Tile clicked:', tile)
                            
                            // Contact prompts -> contact detail page
                            if (tile.type === 'quick_question' || tile.type === 'missing_info') {
                              if (tile.contactId) {
                                window.location.assign(`/dashboard/contacts/${tile.contactId}`)
                              } else {
                                window.location.assign('/dashboard/contacts')
                              }
                              return
                            }
                            
                            // Wisdom prompts -> wisdom page (has its own analytics)
                            if (tile.type === 'knowledge') {
                              window.location.assign('/dashboard/wisdom')
                              return
                            }
                            
                            // Photo/memory prompts -> specific memory detail
                            if (tile.resultMemoryId) {
                              window.location.assign(`/dashboard/memories/${tile.resultMemoryId}`)
                            } else if (tile.memoryId) {
                              window.location.assign(`/dashboard/memories/${tile.memoryId}`)
                            } else {
                              // Fallback based on type
                              if (tile.type === 'photo_backstory') {
                                window.location.assign('/dashboard/memories')
                              } else {
                                console.warn('No memoryId found for tile:', tile)
                                window.location.assign('/dashboard/memories')
                              }
                            }
                          }
                          
                          return (
                            <motion.div
                              key={`${tile.id}-${tile.answeredAt}`}
                              initial={{ scale: 0, opacity: 0, x: -30 }}
                              animate={{ scale: 1, opacity: 1, x: 0 }}
                              exit={{ scale: 0, opacity: 0 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 25, delay: index === 0 ? 0.3 : 0 }}
                              className="progress-tile cursor-pointer hover:ring-2 hover:ring-[#406A56]/30 hover:scale-110 transition-transform"
                              title={`${tile.title}${tile.xp ? ` (+${tile.xp} XP)` : ''}`}
                              onClick={handleTileClick}
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
                  </div>
                </motion.div>
                
                {/* Flying tile animation */}
                <AnimatePresence>
                  {flyingTile && (
                    <motion.div
                      className="flying-tile"
                      initial={{ 
                        position: 'fixed',
                        left: flyingTile.startX,
                        top: flyingTile.startY,
                        width: 240,
                        height: 210,
                        opacity: 1,
                        scale: 1,
                        zIndex: 100,
                      }}
                      animate={{ 
                        left: 100,
                        top: 150,
                        width: 40,
                        height: 40,
                        opacity: 0.8,
                        scale: 0.3,
                        borderRadius: 8,
                      }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4, ease: 'easeInOut' }}
                    />
                  )}
                </AnimatePresence>
              </div>

              {/* Fixed-position tile grid (no reflow) - centered */}
              <div className="relative mx-auto" style={{ width: 816, height: 400, marginTop: 8 }}>
                <AnimatePresence mode="popLayout">
                  {prompts.slice(0, 5).map((prompt, i) => {
                    const config = TYPE_CONFIG[prompt.type] || TYPE_CONFIG.memory_prompt
                    const isExpanded = expandedId === prompt.id
                    const pos = TILE_POSITIONS[i] || { col: i % 3, row: Math.floor(i / 3), rotate: 0 }
                    const hasPhoto = prompt.photoUrl && (prompt.type === 'photo_backstory' || prompt.type === 'tag_person')
                    const contactName = getContactName(prompt, i)
                    const isContact = isContactPrompt(prompt.type)
                    const description = getPromptDescription(prompt)

                    // Fixed position based on grid
                    const tileWidth = 240
                    const tileHeight = 185
                    const gap = 24
                    const left = pos.col * (tileWidth + gap)
                    const top = pos.row * (tileHeight + gap)
                    
                    // Stagger delay based on position
                    const staggerDelay = i * 0.08

                    return (
                      <motion.div
                        key={`${tilesKey}-${prompt.id}`}
                        initial={{ opacity: 0, scale: 0.3, y: 50 }}
                        animate={{ 
                          opacity: 1, 
                          scale: 1,
                          y: 0,
                          rotate: isExpanded ? 0 : pos.rotate,
                          zIndex: isExpanded ? 50 : 1,
                          x: isExpanded ? -left + 200 : 0,
                        }}
                        exit={{ opacity: 0, scale: 0.5, y: -30 }}
                        transition={{ 
                          type: 'spring', 
                          stiffness: 400, 
                          damping: 25,
                          delay: isExpanded ? 0 : staggerDelay,
                        }}
                        onClick={() => !isExpanded && setExpandedId(prompt.id)}
                        draggable={false}
                        data-prompt-id={prompt.id}
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
                            onClick={(e) => { e.stopPropagation(); setExpandedId(null); setInputMode(null); setTextValue(''); setMediaFile(null); }}
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

                          {/* Previous answers in conversation */}
                          {isExpanded && getResponses(prompt.id).length > 0 && (
                            <div className="conversation-history">
                              {getResponses(prompt.id).map((resp, idx) => (
                                <div key={idx} className="conversation-response">
                                  <span className="conversation-checkmark">✓</span>
                                  <span className="conversation-answer">{resp.answer}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Current question - either initial or follow-up */}
                          <p className="bubble-text">
                            {getCurrentStep(prompt.id) === 0 
                              ? getPromptText(prompt) 
                              : (generateFollowUp(prompt, getResponses(prompt.id)[getCurrentStep(prompt.id) - 1]?.answer || '', getCurrentStep(prompt.id) - 1)?.question || getPromptText(prompt))
                            }
                          </p>
                          
                          {/* Step indicator for multi-step */}
                          {isExpanded && getCurrentStep(prompt.id) > 0 && (
                            <div className="step-indicator">
                              Step {getCurrentStep(prompt.id) + 1}
                            </div>
                          )}
                          
                          {/* Description - only when expanded and on first step */}
                          {isExpanded && getCurrentStep(prompt.id) === 0 && (
                            <p className="bubble-description">{description}</p>
                          )}

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
                                      <button onClick={() => { setExpandedId(null); setInputMode(null); setTextValue(''); setMediaFile(null); }} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
                                      <button
                                        onClick={(e) => {
                                          const tileEl = (e.target as HTMLElement).closest('[data-prompt-id]') as HTMLElement
                                          handleAnswer(prompt.id, tileEl)
                                        }}
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
                                    
                                    <div className="flex justify-between items-center mt-3">
                                      <button onClick={() => { setInputMode(null); setMediaFile(null); }} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
                                      
                                      <div className="flex items-center gap-2">
                                        {/* Show "Finish" option if we have previous responses - can finish without current answer */}
                                        {getResponses(prompt.id).length > 0 && (
                                          <button
                                            onClick={(e) => {
                                              const tileEl = (e.target as HTMLElement).closest('[data-prompt-id]') as HTMLElement
                                              // Finish with whatever we have - include current text if present
                                              handleAnswer(prompt.id, tileEl, true, textValue.trim() || undefined)
                                            }}
                                            disabled={isSubmitting}
                                            className="px-3 py-2 text-sm text-[#406A56] hover:bg-[#406A56]/10 font-medium rounded-lg transition-colors"
                                          >
                                            Finish
                                          </button>
                                        )}
                                        
                                        <button
                                          onClick={(e) => {
                                            const tileEl = (e.target as HTMLElement).closest('[data-prompt-id]') as HTMLElement
                                            handleAnswer(prompt.id, tileEl)
                                          }}
                                          disabled={!textValue.trim() || isSubmitting}
                                          className="flex items-center gap-2 px-4 py-2 bg-[#406A56] hover:bg-[#4a7a64] text-white text-sm font-medium rounded-lg disabled:opacity-50"
                                        >
                                          <Send size={14} />
                                          {isSubmitting ? 'Saving...' : (generateFollowUp(prompt, textValue, getCurrentStep(prompt.id)) ? 'Next' : 'Done')}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="voice-recorder">
                                    {!audioUrl ? (
                                      <>
                                        <motion.button
                                          onClick={isRecording ? stopRecording : startRecording}
                                          animate={isRecording ? { scale: [1, 1.1, 1] } : {}}
                                          transition={{ repeat: Infinity, duration: 1 }}
                                          className={`voice-record-btn ${isRecording ? 'recording' : ''}`}
                                        >
                                          <Mic size={32} />
                                        </motion.button>
                                        <p className="voice-status">
                                          {isRecording ? '🔴 Recording... Tap to stop' : 'Tap to start recording'}
                                        </p>
                                        <button 
                                          onClick={() => setInputMode('text')} 
                                          className="text-xs text-[#406A56]/60 hover:text-[#406A56] mt-4"
                                        >
                                          Or type instead
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <div className="voice-playback">
                                          <audio src={audioUrl} controls className="w-full" />
                                        </div>
                                        <div className="flex gap-3 mt-4">
                                          <button
                                            onClick={() => {
                                              clearRecording()
                                              setInputMode('voice') // Stay in voice mode
                                            }}
                                            className="flex-1 py-2 text-sm text-gray-500 hover:text-gray-700"
                                          >
                                            Re-record
                                          </button>
                                          <button
                                            onClick={async (e) => {
                                              if (!audioBlob || !profile) return
                                              setIsSubmitting(true)
                                              
                                              try {
                                                // Upload audio to Supabase storage
                                                const fileName = `${profile.id}/voice/${Date.now()}.webm`
                                                const { error: uploadError } = await supabase.storage
                                                  .from('memories')
                                                  .upload(fileName, audioBlob, {
                                                    contentType: 'audio/webm',
                                                  })
                                                
                                                if (uploadError) {
                                                  throw new Error(`Upload failed: ${uploadError.message}`)
                                                }
                                                
                                                // Get public URL
                                                const { data: { publicUrl } } = supabase.storage
                                                  .from('memories')
                                                  .getPublicUrl(fileName)
                                                
                                                console.log('Audio uploaded:', publicUrl)
                                                
                                                const tileEl = (e.target as HTMLElement).closest('[data-prompt-id]') as HTMLElement
                                                
                                                // Call API directly with audioUrl so it can be saved to memory
                                                const config = TYPE_CONFIG[prompt?.type || 'memory_prompt'] || TYPE_CONFIG.memory_prompt
                                                const res = await fetch(`/api/engagement/prompts/${prompt.id}`, {
                                                  method: 'POST',
                                                  headers: { 'Content-Type': 'application/json' },
                                                  credentials: 'include', // Include auth cookies
                                                  body: JSON.stringify({
                                                    responseType: 'voice',
                                                    responseText: '🎤 Voice memory recorded',
                                                    responseAudioUrl: publicUrl,
                                                  }),
                                                })
                                                
                                                if (!res.ok) {
                                                  const error = await res.json()
                                                  throw new Error(error.details || error.error || 'Failed to save')
                                                }
                                                
                                                const result = await res.json()
                                                console.log('Voice save result:', result)
                                                
                                                // Add to completed tiles with the memoryId
                                                setCompletedTiles(prev => {
                                                  if (prev.some(t => t.id === prompt.id)) return prev
                                                  return [{
                                                    id: prompt.id,
                                                    type: prompt.type,
                                                    icon: config.icon,
                                                    title: prompt.promptText?.substring(0, 40) || 'Voice memory',
                                                    xp: config.xp,
                                                    photoUrl: prompt.photoUrl,
                                                    contactName: getContactName(prompt, 0),
                                                    contactId: prompt.contactId,
                                                    resultMemoryId: result.memoryId,
                                                    answeredAt: new Date().toISOString(),
                                                  }, ...prev]
                                                })
                                                
                                                // XP animation
                                                setLastXpGain(config.xp)
                                                setXpAnimating(true)
                                                setTotalXp(prev => {
                                                  const newXp = prev + config.xp
                                                  localStorage.setItem('yt_total_xp', String(newXp))
                                                  return newXp
                                                })
                                                setTimeout(() => setXpAnimating(false), 1500)
                                                
                                                // Remove prompt from list and cleanup
                                                await shuffle()
                                                clearRecording()
                                                setInputMode(null)
                                                setExpandedId(null)
                                              } catch (err: any) {
                                                console.error('Failed to save recording:', err)
                                                alert(err?.message || 'Failed to save recording. Please try again.')
                                              }
                                              setIsSubmitting(false)
                                            }}
                                            disabled={isSubmitting || !audioBlob}
                                            className="flex-1 py-2 bg-[#406A56] hover:bg-[#4a7a64] text-white text-sm font-medium rounded-lg disabled:opacity-50"
                                          >
                                            {isSubmitting ? 'Uploading...' : 'Save Recording'}
                                          </button>
                                        </div>
                                      </>
                                    )}
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
              <button onClick={handleShuffle} className="home-refresh-btn mt-4">
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
