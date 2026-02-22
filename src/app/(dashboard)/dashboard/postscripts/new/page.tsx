'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { 
  ChevronLeft, ChevronRight, User, Users, Calendar, Gift,
  MessageSquare, Send, Check, X, Search, Mail, Phone, ImagePlus, Trash2
} from 'lucide-react'
import Link from 'next/link'
import '@/styles/home.css'

interface Contact {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  relationship_type: string | null
  profile_photo_url: string | null
}

interface Attachment {
  id: string
  file: File
  preview: string
  uploading?: boolean
}

interface FormData {
  // Recipient
  recipient_contact_id: string | null
  recipient_name: string
  recipient_email: string
  recipient_phone: string
  // Occasion
  delivery_type: 'date' | 'event' | 'after_passing'
  delivery_date: string
  delivery_event: string
  delivery_recurring: boolean
  requires_confirmation: boolean
  // Message
  title: string
  message: string
  video_url: string
  attachments: Attachment[]
}

const EVENT_OPTIONS = [
  { key: 'birthday', label: 'Birthday', icon: '🎂' },
  { key: 'wedding', label: 'Wedding', icon: '💒' },
  { key: 'graduation', label: 'Graduation', icon: '🎓' },
  { key: 'anniversary', label: 'Anniversary', icon: '💕' },
  { key: 'first_child', label: 'First Child', icon: '👶' },
  { key: '18th_birthday', label: '18th Birthday', icon: '🎉' },
  { key: '21st_birthday', label: '21st Birthday', icon: '🍾' },
  { key: 'retirement', label: 'Retirement', icon: '🏖️' },
  { key: 'tough_times', label: 'When Times Are Tough', icon: '💪' },
  { key: 'proud_moment', label: 'When You\'re Proud', icon: '⭐' },
  { key: 'christmas', label: 'Christmas', icon: '🎄' },
  { key: 'new_year', label: 'New Year', icon: '🎊' },
]

const STEPS = [
  { id: 1, title: 'Recipient', icon: User },
  { id: 2, title: 'Occasion', icon: Calendar },
  { id: 3, title: 'Message', icon: MessageSquare },
  { id: 4, title: 'Review', icon: Check }
]

export default function NewPostScriptPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [step, setStep] = useState(1)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [form, setForm] = useState<FormData>({
    recipient_contact_id: null,
    recipient_name: '',
    recipient_email: '',
    recipient_phone: '',
    delivery_type: 'date',
    delivery_date: '',
    delivery_event: '',
    delivery_recurring: false,
    requires_confirmation: false,
    title: '',
    message: '',
    video_url: '',
    attachments: []
  })

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    
    const newAttachments: Attachment[] = []
    Array.from(files).forEach(file => {
      if (form.attachments.length + newAttachments.length >= 5) return
      const id = Math.random().toString(36).substr(2, 9)
      newAttachments.push({
        id,
        file,
        preview: URL.createObjectURL(file)
      })
    })
    
    setForm({ ...form, attachments: [...form.attachments, ...newAttachments] })
  }

  const removeAttachment = (id: string) => {
    const att = form.attachments.find(a => a.id === id)
    if (att?.preview) URL.revokeObjectURL(att.preview)
    setForm({ ...form, attachments: form.attachments.filter(a => a.id !== id) })
  }

  useEffect(() => {
    fetchContacts()
  }, [])

  async function fetchContacts() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    
    const { data, error } = await supabase
      .from('contacts')
      .select('id, full_name, email, phone, relationship_type, profile_photo_url')
      .eq('user_id', user.id)
      .order('full_name')
    
    if (error) {
      console.error('Error fetching contacts:', error)
    }
    if (data) setContacts(data)
  }

  function selectContact(contact: Contact) {
    setForm({
      ...form,
      recipient_contact_id: contact.id,
      recipient_name: contact.full_name,
      recipient_email: contact.email || '',
      recipient_phone: contact.phone || ''
    })
  }

  function clearContact() {
    setForm({
      ...form,
      recipient_contact_id: null,
      recipient_name: '',
      recipient_email: '',
      recipient_phone: ''
    })
  }

  const filteredContacts = contacts.filter(c => 
    c.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  function canProceed(): boolean {
    switch (step) {
      case 1:
        return form.recipient_name.trim().length > 0
      case 2:
        if (form.delivery_type === 'date') {
          return form.delivery_date.length > 0
        } else if (form.delivery_type === 'event') {
          return form.delivery_event.length > 0
        }
        return true
      case 3:
        return form.title.trim().length > 0 && form.message.trim().length > 0
      default:
        return true
    }
  }

  async function handleSave(status: 'draft' | 'scheduled') {
    setSaving(true)
    setError(null)

    try {
      // Upload attachments first if any
      const uploadedAttachments: Array<{ file_url: string; file_type: string; file_name: string; file_size: number }> = []
      
      for (const att of form.attachments) {
        const formData = new FormData()
        formData.append('file', att.file)
        formData.append('bucket', 'memories')
        
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })
        
        if (uploadRes.ok) {
          const { url } = await uploadRes.json()
          uploadedAttachments.push({
            file_url: url,
            file_type: att.file.type,
            file_name: att.file.name,
            file_size: att.file.size
          })
        }
      }

      const res = await fetch('/api/postscripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient_contact_id: form.recipient_contact_id,
          recipient_name: form.recipient_name,
          recipient_email: form.recipient_email,
          recipient_phone: form.recipient_phone,
          delivery_type: form.delivery_type,
          delivery_date: form.delivery_date,
          delivery_event: form.delivery_event,
          delivery_recurring: form.delivery_recurring,
          requires_confirmation: form.requires_confirmation,
          title: form.title,
          message: form.message,
          video_url: form.video_url,
          attachments: uploadedAttachments,
          status
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save')
      }

      router.push('/dashboard/postscripts')
    } catch (err: any) {
      setError(err.message)
      setSaving(false)
    }
  }

  // Step 1: Recipient Selection
  function renderRecipientStep() {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-[#C35F33]/10 flex items-center justify-center mx-auto mb-4">
            <Users size={32} className="text-[#C35F33]" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Who is this message for?</h2>
          <p className="text-gray-600 mt-1">Select from your contacts or enter details manually</p>
        </div>

        {/* Selected Contact */}
        {form.recipient_contact_id && (
          <div className="bg-[#C35F33]/5 border border-[#C35F33]/20 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#C35F33] text-white flex items-center justify-center font-medium">
                {form.recipient_name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-gray-900">{form.recipient_name}</p>
                <p className="text-sm text-gray-500">{form.recipient_email || 'No email'}</p>
              </div>
            </div>
            <button onClick={clearContact} className="p-2 hover:bg-gray-100 rounded-full">
              <X size={18} className="text-gray-500" />
            </button>
          </div>
        )}

        {/* Search Contacts */}
        {!form.recipient_contact_id && (
          <>
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl 
                         focus:ring-2 focus:ring-[#C35F33]/20 focus:border-[#C35F33] outline-none text-gray-900 placeholder:text-gray-400"
              />
            </div>

            {/* Contact List */}
            <div className="max-h-60 overflow-y-auto space-y-2">
              {contacts.length === 0 ? (
                <p className="text-center text-gray-400 py-4 text-sm">Loading contacts...</p>
              ) : filteredContacts.length === 0 ? (
                <p className="text-center text-gray-400 py-4 text-sm">No contacts found for "{searchQuery}"</p>
              ) : (
                filteredContacts.map(contact => (
                  <button
                    key={contact.id}
                    onClick={() => selectContact(contact)}
                    className="w-full flex items-center gap-3 p-3 bg-white border border-gray-200 
                             rounded-xl hover:border-[#C35F33] hover:bg-[#C35F33]/5 transition-all text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#C35F33]/10 text-[#C35F33] flex items-center justify-center font-semibold">
                      {contact.full_name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{contact.full_name}</p>
                      <p className="text-sm text-gray-600">{contact.relationship_type || 'Contact'}</p>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Manual Entry */}
            <div className="border-t pt-6">
              <p className="text-sm text-gray-500 mb-4">Or enter details manually:</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={form.recipient_name}
                    onChange={(e) => setForm({ ...form, recipient_name: e.target.value })}
                    placeholder="Enter recipient name"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl 
                             focus:ring-2 focus:ring-[#C35F33]/20 focus:border-[#C35F33] outline-none text-gray-900 placeholder:text-gray-400"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        value={form.recipient_email}
                        onChange={(e) => setForm({ ...form, recipient_email: e.target.value })}
                        placeholder="email@example.com"
                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl 
                                 focus:ring-2 focus:ring-[#C35F33]/20 focus:border-[#C35F33] outline-none text-gray-900 placeholder:text-gray-400"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="tel"
                        value={form.recipient_phone}
                        onChange={(e) => setForm({ ...form, recipient_phone: e.target.value })}
                        placeholder="+1234567890"
                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl 
                                 focus:ring-2 focus:ring-[#C35F33]/20 focus:border-[#C35F33] outline-none text-gray-900 placeholder:text-gray-400"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    )
  }

  // Step 2: Occasion Selection
  function renderOccasionStep() {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-[#D9C61A]/20 flex items-center justify-center mx-auto mb-4">
            <Calendar size={32} className="text-[#D9C61A]" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">When should this be delivered?</h2>
          <p className="text-gray-600 mt-1">Choose a specific date or life event</p>
        </div>

        {/* Delivery Type Tabs */}
        <div className="flex bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setForm({ ...form, delivery_type: 'date' })}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all
              ${form.delivery_type === 'date' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
          >
            Specific Date
          </button>
          <button
            onClick={() => setForm({ ...form, delivery_type: 'event' })}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all
              ${form.delivery_type === 'event' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
          >
            Life Event
          </button>
          <button
            onClick={() => setForm({ ...form, delivery_type: 'after_passing', requires_confirmation: true })}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all
              ${form.delivery_type === 'after_passing' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
          >
            After I'm Gone
          </button>
        </div>

        {/* Date Picker */}
        {form.delivery_type === 'date' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Date</label>
              <input
                type="date"
                value={form.delivery_date}
                onChange={(e) => setForm({ ...form, delivery_date: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl 
                         focus:ring-2 focus:ring-[#C35F33]/20 focus:border-[#C35F33] outline-none text-gray-900 placeholder:text-gray-400"
              />
            </div>
            <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={form.delivery_recurring}
                onChange={(e) => setForm({ ...form, delivery_recurring: e.target.checked })}
                className="w-5 h-5 rounded text-[#C35F33] focus:ring-[#C35F33]"
              />
              <div>
                <p className="font-medium text-gray-900">Repeat annually</p>
                <p className="text-sm text-gray-500">Send this message every year on this date</p>
              </div>
            </label>
          </div>
        )}

        {/* Event Selection */}
        {form.delivery_type === 'event' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {EVENT_OPTIONS.map(event => (
              <button
                key={event.key}
                onClick={() => setForm({ ...form, delivery_event: event.key })}
                className={`p-4 rounded-xl border-2 text-center transition-all
                  ${form.delivery_event === event.key 
                    ? 'border-[#C35F33] bg-[#C35F33]/5' 
                    : 'border-gray-100 hover:border-gray-200'}`}
              >
                <span className="text-2xl block mb-1">{event.icon}</span>
                <span className="text-sm font-medium text-gray-700">{event.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* After Passing Info */}
        {form.delivery_type === 'after_passing' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-amber-800 text-sm">
              <strong>Note:</strong> This message will be delivered after your passing. 
              You'll need to designate trusted contacts who can confirm delivery.
            </p>
          </div>
        )}
      </div>
    )
  }

  // Step 3: Message Composition
  function renderMessageStep() {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-[#8DACAB]/20 flex items-center justify-center mx-auto mb-4">
            <MessageSquare size={32} className="text-[#8DACAB]" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Write your message</h2>
          <p className="text-gray-600 mt-1">What do you want to say to {form.recipient_name}?</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g., Happy 18th Birthday!"
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl 
                       focus:ring-2 focus:ring-[#C35F33]/20 focus:border-[#C35F33] outline-none text-gray-900 placeholder:text-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Your Message *</label>
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Write from the heart..."
              rows={8}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl 
                       focus:ring-2 focus:ring-[#C35F33]/20 focus:border-[#C35F33] outline-none resize-none text-gray-900 placeholder:text-gray-400"
            />
          </div>

          {/* Photo Attachments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Attach Photos <span className="text-gray-400 font-normal">(optional, max 5)</span>
            </label>
            
            {/* Photo Grid */}
            <div className="grid grid-cols-3 gap-3 mb-3">
              {form.attachments.map(att => (
                <div key={att.id} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                  <img src={att.preview} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeAttachment(att.id)}
                    className="absolute top-1 right-1 p-1.5 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                  >
                    <Trash2 size={12} className="text-white" />
                  </button>
                </div>
              ))}
              
              {form.attachments.length < 5 && (
                <label className="aspect-square rounded-xl border-2 border-dashed border-gray-300 
                                 hover:border-[#C35F33] hover:bg-[#C35F33]/5 
                                 flex flex-col items-center justify-center cursor-pointer transition-all">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                  <ImagePlus size={24} className="text-gray-400 mb-1" />
                  <span className="text-xs text-gray-400">Add Photo</span>
                </label>
              )}
            </div>
          </div>

          {/* Future: Video Recording */}
          <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-4 text-center">
            <Gift size={24} className="mx-auto text-gray-400 mb-1" />
            <p className="text-gray-500 text-xs">Video recording coming soon</p>
          </div>
        </div>
      </div>
    )
  }

  // Step 4: Review
  function renderReviewStep() {
    const eventLabel = EVENT_OPTIONS.find(e => e.key === form.delivery_event)?.label

    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <Check size={32} className="text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Review & Schedule</h2>
          <p className="text-gray-600 mt-1">Make sure everything looks right</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100">
          {/* Recipient */}
          <div className="p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">To</p>
            <p className="font-medium text-gray-900">{form.recipient_name}</p>
            {form.recipient_email && <p className="text-sm text-gray-500">{form.recipient_email}</p>}
          </div>

          {/* Delivery */}
          <div className="p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Delivery</p>
            <p className="font-medium text-gray-900">
              {form.delivery_type === 'date' && form.delivery_date && 
                new Date(form.delivery_date).toLocaleDateString('en-US', { 
                  weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' 
                })
              }
              {form.delivery_type === 'event' && eventLabel}
              {form.delivery_type === 'after_passing' && 'After I\'m gone'}
            </p>
            {form.delivery_recurring && (
              <p className="text-sm text-amber-600">🔄 Repeats annually</p>
            )}
          </div>

          {/* Message */}
          <div className="p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Message</p>
            <p className="font-semibold text-gray-900 mb-2">{form.title}</p>
            <p className="text-gray-700 whitespace-pre-wrap text-sm">{form.message}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative pb-32">
      {/* Warm background */}
      <div className="home-background">
        <div className="home-blob home-blob-1" />
        <div className="home-blob home-blob-2" />
        <div className="home-blob home-blob-3" />
      </div>

      <div className="relative z-10 p-6 max-w-lg mx-auto">
        {/* Header */}
        <header className="flex items-center gap-4 mb-6">
          <Link 
            href="/dashboard/postscripts" 
            className="p-2 bg-white/80 rounded-xl hover:bg-white transition-colors"
          >
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Create PostScript</h1>
            <p className="text-sm text-gray-500">Step {step} of 4</p>
          </div>
        </header>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {STEPS.map(s => (
            <div 
              key={s.id}
              className={`flex-1 h-1 rounded-full transition-colors
                ${s.id <= step ? 'bg-[#C35F33]' : 'bg-gray-200'}`}
            />
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-sm">
          {step === 1 && renderRecipientStep()}
          {step === 2 && renderOccasionStep()}
          {step === 3 && renderMessageStep()}
          {step === 4 && renderReviewStep()}
        </div>

        {/* Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 p-4">
          <div className="max-w-lg mx-auto flex gap-3">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="flex-1 py-3 px-6 bg-gray-100 text-gray-700 rounded-xl font-medium 
                         hover:bg-gray-200 transition-colors"
              >
                Back
              </button>
            )}
            
            {step < 4 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="flex-1 py-3 px-6 bg-[#C35F33] text-white rounded-xl font-medium 
                         hover:bg-[#A84E2A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2"
              >
                Continue
                <ChevronRight size={18} />
              </button>
            ) : (
              <div className="flex-1 flex gap-3">
                <button
                  onClick={() => handleSave('draft')}
                  disabled={saving}
                  className="flex-1 py-3 px-6 bg-gray-100 text-gray-700 rounded-xl font-medium 
                           hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Save Draft
                </button>
                <button
                  onClick={() => handleSave('scheduled')}
                  disabled={saving}
                  className="flex-1 py-3 px-6 bg-[#C35F33] text-white rounded-xl font-medium 
                           hover:bg-[#A84E2A] transition-colors disabled:opacity-50
                           flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <span className="animate-spin">⏳</span>
                  ) : (
                    <>
                      <Send size={18} />
                      Schedule
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
