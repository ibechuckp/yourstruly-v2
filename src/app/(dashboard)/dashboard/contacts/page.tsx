'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Edit2, Trash2, X, Users, ChevronLeft, Calendar, MapPin, Phone, Mail, Heart } from 'lucide-react'
import Link from 'next/link'

// ============================================
// TYPES
// ============================================
interface Contact {
  id: string
  full_name: string
  nickname?: string
  email?: string
  phone?: string
  relationship_type: string
  relationship_details?: string
  date_of_birth?: string
  city?: string
  state?: string
  country?: string
  notes?: string
}

interface Pet {
  id: string
  name: string
  species: string
  breed?: string
  date_of_birth?: string
  adoption_date?: string
  color?: string
  personality?: string
  favorite_things?: string[]
  medical_notes?: string
  is_deceased: boolean
  date_of_passing?: string
}

// ============================================
// CONSTANTS
// ============================================
const RELATIONSHIP_OPTIONS = [
  { category: 'Family', options: [
    { id: 'mother', label: 'Mother' },
    { id: 'father', label: 'Father' },
    { id: 'spouse', label: 'Spouse' },
    { id: 'partner', label: 'Partner' },
    { id: 'son', label: 'Son' },
    { id: 'daughter', label: 'Daughter' },
    { id: 'brother', label: 'Brother' },
    { id: 'sister', label: 'Sister' },
    { id: 'grandmother', label: 'Grandmother' },
    { id: 'grandfather', label: 'Grandfather' },
    { id: 'grandson', label: 'Grandson' },
    { id: 'granddaughter', label: 'Granddaughter' },
    { id: 'aunt', label: 'Aunt' },
    { id: 'uncle', label: 'Uncle' },
    { id: 'cousin', label: 'Cousin' },
    { id: 'niece', label: 'Niece' },
    { id: 'nephew', label: 'Nephew' },
    { id: 'in_law', label: 'In-Law' },
  ]},
  { category: 'Friends', options: [
    { id: 'best_friend', label: 'Best Friend' },
    { id: 'close_friend', label: 'Close Friend' },
    { id: 'friend', label: 'Friend' },
    { id: 'childhood_friend', label: 'Childhood Friend' },
  ]},
  { category: 'Professional', options: [
    { id: 'colleague', label: 'Colleague' },
    { id: 'boss', label: 'Boss' },
    { id: 'mentor', label: 'Mentor' },
    { id: 'business_partner', label: 'Business Partner' },
  ]},
  { category: 'Other', options: [
    { id: 'neighbor', label: 'Neighbor' },
    { id: 'other', label: 'Other' },
  ]},
]

const SPECIES_OPTIONS = ['Dog', 'Cat', 'Bird', 'Fish', 'Rabbit', 'Hamster', 'Guinea Pig', 'Turtle', 'Snake', 'Lizard', 'Horse', 'Other']

// ============================================
// MAIN PAGE
// ============================================
export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(true)
  const [showContactModal, setShowContactModal] = useState(false)
  const [showPetModal, setShowPetModal] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [editingPet, setEditingPet] = useState<Pet | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [contactsRes, petsRes] = await Promise.all([
      supabase.from('contacts').select('*').eq('user_id', user.id).order('full_name'),
      supabase.from('pets').select('*').eq('user_id', user.id).order('name'),
    ])

    setContacts(contactsRes.data || [])
    setPets(petsRes.data || [])
    setLoading(false)
  }

  const handleDeleteContact = async (id: string) => {
    if (!confirm('Delete this contact?')) return
    await supabase.from('contacts').delete().eq('id', id)
    setContacts(contacts.filter(c => c.id !== id))
  }

  const handleDeletePet = async (id: string) => {
    if (!confirm('Delete this pet?')) return
    await supabase.from('pets').delete().eq('id', id)
    setPets(pets.filter(p => p.id !== id))
  }

  const getRelationshipLabel = (id: string) => {
    for (const group of RELATIONSHIP_OPTIONS) {
      const found = group.options.find(o => o.id === id)
      if (found) return found.label
    }
    return id
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-white/60">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link 
          href="/dashboard" 
          className="p-2 bg-white/10 backdrop-blur-md rounded-xl text-white/70 hover:bg-white/20 hover:text-white transition-all"
        >
          <ChevronLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Contacts & Pets</h1>
          <p className="text-white/50 text-sm">People and companions in your life</p>
        </div>
      </div>

      {/* Contacts Section */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Users size={20} className="text-amber-400" />
            <h2 className="text-lg font-semibold text-white">People</h2>
            <span className="text-white/40 text-sm">({contacts.length})</span>
          </div>
          <button
            onClick={() => { setEditingContact(null); setShowContactModal(true) }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl text-sm font-medium transition-all"
          >
            <Plus size={16} />
            Add Contact
          </button>
        </div>

        {contacts.length === 0 ? (
          <div className="isolate bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 text-center">
            <p className="text-white/50 mb-4">No contacts yet</p>
            <button
              onClick={() => { setEditingContact(null); setShowContactModal(true) }}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl text-sm font-medium"
            >
              Add Your First Contact
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contacts.map(contact => (
              <div 
                key={contact.id} 
                className="isolate bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 hover:bg-white/15 hover:border-amber-500/30 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-semibold">
                      {contact.full_name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">{contact.full_name}</h3>
                      <p className="text-amber-400 text-sm">{getRelationshipLabel(contact.relationship_type)}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditingContact(contact); setShowContactModal(true) }} className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDeleteContact(contact.id)} className="p-2 text-white/50 hover:text-red-400 hover:bg-red-500/10 rounded-lg">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5 text-sm">
                  {contact.date_of_birth && (
                    <div className="flex items-center gap-2 text-white/60">
                      <Calendar size={13} />
                      <span>{new Date(contact.date_of_birth).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                  )}
                  {contact.email && (
                    <div className="flex items-center gap-2 text-white/60">
                      <Mail size={13} />
                      <span className="truncate">{contact.email}</span>
                    </div>
                  )}
                  {contact.phone && (
                    <div className="flex items-center gap-2 text-white/60">
                      <Phone size={13} />
                      <span>{contact.phone}</span>
                    </div>
                  )}
                  {(contact.city || contact.country) && (
                    <div className="flex items-center gap-2 text-white/50">
                      <MapPin size={13} />
                      <span>{[contact.city, contact.state, contact.country].filter(Boolean).join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Pets Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Heart size={20} className="text-pink-400" />
            <h2 className="text-lg font-semibold text-white">Pets</h2>
            <span className="text-white/40 text-sm">({pets.length})</span>
          </div>
          <button
            onClick={() => { setEditingPet(null); setShowPetModal(true) }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white rounded-xl text-sm font-medium transition-all"
          >
            <Plus size={16} />
            Add Pet
          </button>
        </div>

        {pets.length === 0 ? (
          <div className="isolate bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 text-center">
            <p className="text-white/50 mb-4">No pets yet</p>
            <button
              onClick={() => { setEditingPet(null); setShowPetModal(true) }}
              className="px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-xl text-sm font-medium"
            >
              Add Your First Pet
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pets.map(pet => (
              <div 
                key={pet.id} 
                className={`isolate bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 hover:bg-white/15 transition-all group ${pet.is_deceased ? 'opacity-70' : 'hover:border-pink-500/30'}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white font-semibold">
                      {pet.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">{pet.name}</h3>
                      <p className="text-pink-400 text-sm">{pet.species}{pet.breed ? ` - ${pet.breed}` : ''}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditingPet(pet); setShowPetModal(true) }} className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDeletePet(pet.id)} className="p-2 text-white/50 hover:text-red-400 hover:bg-red-500/10 rounded-lg">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5 text-sm">
                  {pet.color && <p className="text-white/60">Color: {pet.color}</p>}
                  {pet.personality && <p className="text-white/50 line-clamp-1">{pet.personality}</p>}
                  {pet.is_deceased && (
                    <p className="text-white/40 italic">
                      Passed {pet.date_of_passing ? new Date(pet.date_of_passing).toLocaleDateString() : ''}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Contact Modal */}
      {showContactModal && (
        <ContactModal
          contact={editingContact}
          onClose={() => setShowContactModal(false)}
          onSave={() => { setShowContactModal(false); loadData() }}
        />
      )}

      {/* Pet Modal */}
      {showPetModal && (
        <PetModal
          pet={editingPet}
          onClose={() => setShowPetModal(false)}
          onSave={() => { setShowPetModal(false); loadData() }}
        />
      )}
    </div>
  )
}

// ============================================
// CONTACT MODAL
// ============================================
function ContactModal({ contact, onClose, onSave }: { contact: Contact | null; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({
    full_name: contact?.full_name || '',
    nickname: contact?.nickname || '',
    email: contact?.email || '',
    phone: contact?.phone || '',
    relationship_type: contact?.relationship_type || '',
    relationship_details: contact?.relationship_details || '',
    date_of_birth: contact?.date_of_birth || '',
    city: contact?.city || '',
    state: contact?.state || '',
    country: contact?.country || '',
    notes: contact?.notes || '',
  })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const handleSave = async () => {
    if (!form.full_name || !form.relationship_type) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const payload = {
      full_name: form.full_name,
      relationship_type: form.relationship_type,
      nickname: form.nickname || null,
      email: form.email || null,
      phone: form.phone || null,
      relationship_details: form.relationship_details || null,
      date_of_birth: form.date_of_birth || null,
      city: form.city || null,
      state: form.state || null,
      country: form.country || null,
      notes: form.notes || null,
    }

    if (contact) {
      await supabase.from('contacts').update(payload).eq('id', contact.id)
    } else {
      await supabase.from('contacts').insert({ ...payload, user_id: user.id })
    }
    setSaving(false)
    onSave()
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900/95 backdrop-blur-xl rounded-2xl p-6 border border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">{contact ? 'Edit Contact' : 'Add Contact'}</h2>
          <button onClick={onClose} className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg"><X size={20} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-1.5">Full Name *</label>
            <input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50" placeholder="John Doe" />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1.5">Relationship *</label>
            <select value={form.relationship_type} onChange={e => setForm({ ...form, relationship_type: e.target.value })} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50">
              <option value="">Select...</option>
              {RELATIONSHIP_OPTIONS.map(group => (
                <optgroup key={group.category} label={group.category}>
                  {group.options.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                </optgroup>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-1.5">Nickname</label>
              <input value={form.nickname} onChange={e => setForm({ ...form, nickname: e.target.value })} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1.5">Birthday</label>
              <input type="date" value={form.date_of_birth} onChange={e => setForm({ ...form, date_of_birth: e.target.value })} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-1.5">Email</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1.5">Phone</label>
              <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1.5">Address</label>
            <div className="grid grid-cols-3 gap-3">
              <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50" placeholder="City" />
              <input value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50" placeholder="State" />
              <input value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50" placeholder="Country" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1.5">Notes</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none" rows={2} />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
          <button onClick={onClose} className="px-5 py-2.5 text-white/60 hover:text-white">Cancel</button>
          <button onClick={handleSave} disabled={saving || !form.full_name || !form.relationship_type} className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-medium disabled:opacity-50">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// PET MODAL
// ============================================
function PetModal({ pet, onClose, onSave }: { pet: Pet | null; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({
    name: pet?.name || '',
    species: pet?.species || '',
    breed: pet?.breed || '',
    date_of_birth: pet?.date_of_birth || '',
    adoption_date: pet?.adoption_date || '',
    color: pet?.color || '',
    personality: pet?.personality || '',
    medical_notes: pet?.medical_notes || '',
    is_deceased: pet?.is_deceased || false,
    date_of_passing: pet?.date_of_passing || '',
  })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const handleSave = async () => {
    if (!form.name || !form.species) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const payload = {
      name: form.name,
      species: form.species,
      breed: form.breed || null,
      date_of_birth: form.date_of_birth || null,
      adoption_date: form.adoption_date || null,
      color: form.color || null,
      personality: form.personality || null,
      medical_notes: form.medical_notes || null,
      is_deceased: form.is_deceased,
      date_of_passing: form.is_deceased ? (form.date_of_passing || null) : null,
    }

    if (pet) {
      await supabase.from('pets').update(payload).eq('id', pet.id)
    } else {
      await supabase.from('pets').insert({ ...payload, user_id: user.id })
    }
    setSaving(false)
    onSave()
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900/95 backdrop-blur-xl rounded-2xl p-6 border border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">{pet ? 'Edit Pet' : 'Add Pet'}</h2>
          <button onClick={onClose} className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg"><X size={20} /></button>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-1.5">Name *</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50" placeholder="Buddy" />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1.5">Species *</label>
              <select value={form.species} onChange={e => setForm({ ...form, species: e.target.value })} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50">
                <option value="">Select...</option>
                {SPECIES_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-1.5">Breed</label>
              <input value={form.breed} onChange={e => setForm({ ...form, breed: e.target.value })} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50" placeholder="Golden Retriever" />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1.5">Color</label>
              <input value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-1.5">Date of Birth</label>
              <input type="date" value={form.date_of_birth} onChange={e => setForm({ ...form, date_of_birth: e.target.value })} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50" />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1.5">Adoption Date</label>
              <input type="date" value={form.adoption_date} onChange={e => setForm({ ...form, adoption_date: e.target.value })} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1.5">Personality</label>
            <textarea value={form.personality} onChange={e => setForm({ ...form, personality: e.target.value })} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50 resize-none" rows={2} placeholder="Playful, loves belly rubs..." />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1.5">Medical Notes</label>
            <textarea value={form.medical_notes} onChange={e => setForm({ ...form, medical_notes: e.target.value })} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50 resize-none" rows={2} />
          </div>
          <div className="p-4 bg-white/5 rounded-xl">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.is_deceased} onChange={e => setForm({ ...form, is_deceased: e.target.checked })} className="w-5 h-5 rounded border-white/20 bg-white/5 text-pink-500 focus:ring-pink-500" />
              <span className="text-white/70">This pet has passed away</span>
            </label>
            {form.is_deceased && (
              <div className="mt-3">
                <label className="block text-sm text-white/60 mb-1.5">Date of Passing</label>
                <input type="date" value={form.date_of_passing} onChange={e => setForm({ ...form, date_of_passing: e.target.value })} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50" />
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
          <button onClick={onClose} className="px-5 py-2.5 text-white/60 hover:text-white">Cancel</button>
          <button onClick={handleSave} disabled={saving || !form.name || !form.species} className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-xl font-medium disabled:opacity-50">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
