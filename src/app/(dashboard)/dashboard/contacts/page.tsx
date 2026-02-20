'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Edit2, Trash2, X, Users } from 'lucide-react'

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

interface RelationshipType {
  id: string
  label: string
  category: string
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [relationshipTypes, setRelationshipTypes] = useState<RelationshipType[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [contactsRes, typesRes] = await Promise.all([
      supabase.from('contacts').select('*').eq('user_id', user.id).order('full_name'),
      supabase.from('relationship_types').select('*').order('sort_order'),
    ])

    setContacts(contactsRes.data || [])
    setRelationshipTypes(typesRes.data || [])
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

  const groupedTypes = relationshipTypes.reduce((acc, type) => {
    if (!acc[type.category]) acc[type.category] = []
    acc[type.category].push(type)
    return acc
  }, {} as Record<string, RelationshipType[]>)

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">Loading contacts...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Contacts</h1>
          <p className="text-gray-400 mt-1">Family, friends, and important people in your life.</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
        >
          <Plus size={18} />
          Add Contact
        </button>
      </div>

      {/* Contacts Grid */}
      {contacts.length === 0 ? (
        <div className="bg-gray-900 rounded-xl p-12 border border-gray-800 text-center">
          <Users className="mx-auto text-gray-600 mb-4" size={48} />
          <h3 className="text-xl font-semibold text-white mb-2">No contacts yet</h3>
          <p className="text-gray-400 mb-4">Start adding the important people in your life.</p>
          <button
            onClick={openNew}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
          >
            Add Your First Contact
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contacts.map(contact => (
            <div key={contact.id} className="bg-gray-900 rounded-xl p-5 border border-gray-800 hover:border-purple-500/50 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-semibold text-lg">
                    {contact.full_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{contact.full_name}</h3>
                    {contact.nickname && <p className="text-gray-400 text-sm">&quot;{contact.nickname}&quot;</p>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(contact)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(contact.id)} className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <p className="text-purple-400">
                  {relationshipTypes.find(t => t.id === contact.relationship_type)?.label || contact.relationship_type}
                </p>
                {contact.email && <p className="text-gray-400">{contact.email}</p>}
                {contact.phone && <p className="text-gray-400">{contact.phone}</p>}
                {(contact.city || contact.country) && (
                  <p className="text-gray-500">{[contact.city, contact.state, contact.country].filter(Boolean).join(', ')}</p>
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
          relationshipTypes={groupedTypes}
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); loadData() }}
        />
      )}
    </div>
  )
}

function ContactModal({
  contact,
  relationshipTypes,
  onClose,
  onSave,
}: {
  contact: Contact | null
  relationshipTypes: Record<string, RelationshipType[]>
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
    if (!form.full_name || !form.relationship_type) return
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (contact) {
      await supabase.from('contacts').update(form).eq('id', contact.id)
    } else {
      await supabase.from('contacts').insert({ ...form, user_id: user.id })
    }

    setSaving(false)
    onSave()
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-700 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">
            {contact ? 'Edit Contact' : 'Add Contact'}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Full Name *</label>
            <input
              value={form.full_name}
              onChange={e => setForm({ ...form, full_name: e.target.value })}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Relationship *</label>
            <select
              value={form.relationship_type}
              onChange={e => setForm({ ...form, relationship_type: e.target.value })}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select relationship...</option>
              {Object.entries(relationshipTypes).map(([category, types]) => (
                <optgroup key={category} label={category.charAt(0).toUpperCase() + category.slice(1)}>
                  {types.map(t => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Nickname</label>
            <input
              value={form.nickname}
              onChange={e => setForm({ ...form, nickname: e.target.value })}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Optional"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Date of Birth</label>
            <input
              type="date"
              value={form.date_of_birth}
              onChange={e => setForm({ ...form, date_of_birth: e.target.value })}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">City</label>
              <input
                value={form.city}
                onChange={e => setForm({ ...form, city: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">State</label>
              <input
                value={form.state}
                onChange={e => setForm({ ...form, state: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Country</label>
              <input
                value={form.country}
                onChange={e => setForm({ ...form, country: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">How do you know them?</label>
            <textarea
              value={form.relationship_details}
              onChange={e => setForm({ ...form, relationship_details: e.target.value })}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              rows={2}
              placeholder="How you met, shared memories..."
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              rows={2}
              placeholder="Any additional notes..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.full_name || !form.relationship_type}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Contact'}
          </button>
        </div>
      </div>
    </div>
  )
}
