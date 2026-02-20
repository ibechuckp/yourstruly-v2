'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Edit2, Trash2, X, Users, ChevronLeft, Calendar, MapPin, Phone, Mail } from 'lucide-react'
import Link from 'next/link'

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

// Relationship options
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

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadContacts()
  }, [])

  const loadContacts = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', user.id)
      .order('full_name')

    setContacts(data || [])
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return
    await supabase.from('contacts').delete().eq('id', id)
    setContacts(contacts.filter(c => c.id !== id))
  }

  const openEdit = (contact: Contact) => {
    setEditingContact(contact)
    setShowModal(true)
  }

  const openNew = () => {
    setEditingContact(null)
    setShowModal(true)
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
        <div className="text-white/60">Loading contacts...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard" 
            className="p-2 bg-white/10 backdrop-blur-md rounded-xl text-white/70 hover:bg-white/20 hover:text-white transition-all"
          >
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Contacts</h1>
            <p className="text-white/50 text-sm">Family, friends, and important people</p>
          </div>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-orange-500/25"
        >
          <Plus size={18} />
          Add Contact
        </button>
      </div>

      {/* Contacts Grid */}
      {contacts.length === 0 ? (
        <div className="isolate bg-white/10 backdrop-blur-md rounded-2xl p-12 border border-white/20 text-center">
          <Users className="mx-auto text-white/30 mb-4" size={48} />
          <h3 className="text-xl font-semibold text-white mb-2">No contacts yet</h3>
          <p className="text-white/50 mb-6">Start adding the important people in your life.</p>
          <button
            onClick={openNew}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-medium transition-all hover:shadow-lg hover:shadow-orange-500/25"
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
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-semibold text-lg shadow-lg shadow-orange-500/25">
                    {contact.full_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{contact.full_name}</h3>
                    <p className="text-amber-400 text-sm">{getRelationshipLabel(contact.relationship_type)}</p>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(contact)} className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(contact.id)} className="p-2 text-white/50 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                {contact.date_of_birth && (
                  <div className="flex items-center gap-2 text-white/60">
                    <Calendar size={14} />
                    <span>{new Date(contact.date_of_birth).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</span>
                  </div>
                )}
                {contact.email && (
                  <div className="flex items-center gap-2 text-white/60">
                    <Mail size={14} />
                    <span className="truncate">{contact.email}</span>
                  </div>
                )}
                {contact.phone && (
                  <div className="flex items-center gap-2 text-white/60">
                    <Phone size={14} />
                    <span>{contact.phone}</span>
                  </div>
                )}
                {(contact.city || contact.country) && (
                  <div className="flex items-center gap-2 text-white/50">
                    <MapPin size={14} />
                    <span>{[contact.city, contact.state, contact.country].filter(Boolean).join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <ContactModal
          contact={editingContact}
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); loadContacts() }}
        />
      )}
    </div>
  )
}

function ContactModal({
  contact,
  onClose,
  onSave,
}: {
  contact: Contact | null
  onClose: () => void
  onSave: () => void
}) {
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
    // Only name and relationship are required
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
          <h2 className="text-xl font-semibold text-white">
            {contact ? 'Edit Contact' : 'Add Contact'}
          </h2>
          <button onClick={onClose} className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Required Fields */}
          <div>
            <label className="block text-sm text-white/60 mb-1.5">Full Name *</label>
            <input
              value={form.full_name}
              onChange={e => setForm({ ...form, full_name: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-1.5">Relationship *</label>
            <select
              value={form.relationship_type}
              onChange={e => setForm({ ...form, relationship_type: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50"
            >
              <option value="">Select relationship...</option>
              {RELATIONSHIP_OPTIONS.map(group => (
                <optgroup key={group.category} label={group.category}>
                  {group.options.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Optional Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-1.5">Nickname</label>
              <input
                value={form.nickname}
                onChange={e => setForm({ ...form, nickname: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1.5">Birthday</label>
              <input
                type="date"
                value={form.date_of_birth}
                onChange={e => setForm({ ...form, date_of_birth: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1.5">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm text-white/60 mb-1.5">Address</label>
            <div className="grid grid-cols-3 gap-3">
              <input
                value={form.city}
                onChange={e => setForm({ ...form, city: e.target.value })}
                className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                placeholder="City"
              />
              <input
                value={form.state}
                onChange={e => setForm({ ...form, state: e.target.value })}
                className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                placeholder="State"
              />
              <input
                value={form.country}
                onChange={e => setForm({ ...form, country: e.target.value })}
                className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                placeholder="Country"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-1.5">How do you know them?</label>
            <textarea
              value={form.relationship_details}
              onChange={e => setForm({ ...form, relationship_details: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
              rows={2}
              placeholder="How you met, shared memories..."
            />
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-1.5">Notes</label>
            <textarea
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
              rows={2}
              placeholder="Additional notes..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
          <button onClick={onClose} className="px-5 py-2.5 text-white/60 hover:text-white transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.full_name || !form.relationship_type}
            className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Contact'}
          </button>
        </div>
      </div>
    </div>
  )
}
