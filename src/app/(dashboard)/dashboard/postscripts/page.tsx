'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Plus, Gift, Calendar, Clock, Heart, Send, 
  ChevronLeft, Edit2, Trash2, X, User, Mail, Phone
} from 'lucide-react'
import Link from 'next/link'

interface Contact {
  id: string
  full_name: string
  email: string
  phone: string
}

interface PostScript {
  id: string
  title: string
  message: string
  recipient_name: string
  recipient_email: string
  delivery_type: string
  delivery_date: string
  delivery_event: string
  delivery_recurring: boolean
  has_gift: boolean
  gift_type: string
  status: string
  created_at: string
  recipient_contact?: Contact
}

const DELIVERY_EVENTS = [
  { id: 'birthday', label: 'Birthday' },
  { id: 'anniversary', label: 'Anniversary' },
  { id: 'christmas', label: 'Christmas' },
  { id: 'new_year', label: 'New Year' },
  { id: 'mothers_day', label: "Mother's Day" },
  { id: 'fathers_day', label: "Father's Day" },
  { id: 'valentines', label: "Valentine's Day" },
  { id: 'graduation', label: 'Graduation' },
  { id: 'custom', label: 'Custom Date' },
]

export default function PostScriptsPage() {
  const [postscripts, setPostscripts] = useState<PostScript[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [psRes, contactsRes] = await Promise.all([
      supabase.from('postscripts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('contacts').select('id, full_name, email, phone').eq('user_id', user.id).order('full_name'),
    ])

    setPostscripts(psRes.data || [])
    setContacts(contactsRes.data || [])
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this PostScript?')) return
    await supabase.from('postscripts').delete().eq('id', id)
    setPostscripts(postscripts.filter(p => p.id !== id))
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500/20 text-blue-400'
      case 'sent': return 'bg-green-500/20 text-green-400'
      case 'cancelled': return 'bg-gray-500/20 text-gray-400'
      default: return 'bg-amber-500/20 text-amber-400'
    }
  }

  const formatDelivery = (ps: PostScript) => {
    if (ps.delivery_type === 'passing') return 'After passing'
    if (ps.delivery_type === 'event') {
      const event = DELIVERY_EVENTS.find(e => e.id === ps.delivery_event)
      return event?.label || ps.delivery_event
    }
    if (ps.delivery_date) {
      return new Date(ps.delivery_date).toLocaleDateString('en-US', { 
        month: 'short', day: 'numeric', year: 'numeric' 
      })
    }
    return 'Not set'
  }

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 bg-gray-900/90 rounded-xl text-white/70 hover:text-white transition-all border border-white/10">
              <ChevronLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">PostScripts</h1>
              <p className="text-white/50 text-sm">Messages and gifts for the future</p>
            </div>
          </div>

          <button
            onClick={() => { setEditingId(null); setShowCreateModal(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl transition-all"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">New PostScript</span>
          </button>
        </div>
      </header>

      {/* Content */}
      <main>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-white/60">Loading...</div>
          </div>
        ) : postscripts.length === 0 ? (
          <div className="bg-gray-900/90 rounded-2xl p-12 border border-white/10 text-center">
            <Gift size={48} className="text-white/20 mb-4 mx-auto" />
            <h3 className="text-lg font-medium text-white mb-2">No PostScripts yet</h3>
            <p className="text-white/50 mb-4 max-w-md mx-auto">
              Create messages and schedule gifts to be delivered to your loved ones on special occasions or after you're gone.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl transition-all mx-auto"
            >
              <Plus size={18} />
              Create your first PostScript
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {postscripts.map((ps) => (
              <div
                key={ps.id}
                className="bg-gray-900/90 rounded-2xl p-5 border border-white/10 hover:border-white/20 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${ps.has_gift ? 'bg-purple-500/20' : 'bg-amber-500/20'}`}>
                      {ps.has_gift ? <Gift size={20} className="text-purple-400" /> : <Mail size={20} className="text-amber-400" />}
                    </div>
                    <div>
                      <h3 className="text-white font-medium">{ps.title}</h3>
                      <p className="text-white/50 text-sm">To: {ps.recipient_name}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${getStatusBadge(ps.status)}`}>
                    {ps.status}
                  </span>
                </div>

                {ps.message && (
                  <p className="text-white/60 text-sm mb-3 line-clamp-2">{ps.message}</p>
                )}

                <div className="flex items-center gap-4 text-white/40 text-xs mb-4">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {formatDelivery(ps)}
                  </span>
                  {ps.delivery_recurring && (
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      Recurring
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => { setEditingId(ps.id); setShowCreateModal(true); }}
                    className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-white/70 rounded-lg text-sm transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(ps.id)}
                    className="p-2 bg-gray-800 hover:bg-red-500/20 text-white/50 hover:text-red-400 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <PostScriptModal
          postscriptId={editingId}
          contacts={contacts}
          onClose={() => setShowCreateModal(false)}
          onSave={() => { setShowCreateModal(false); loadData(); }}
        />
      )}
    </div>
  )
}

// Modal Component
function PostScriptModal({ 
  postscriptId, 
  contacts, 
  onClose, 
  onSave 
}: { 
  postscriptId: string | null
  contacts: Contact[]
  onClose: () => void
  onSave: () => void 
}) {
  const [form, setForm] = useState({
    title: '',
    message: '',
    recipient_contact_id: '',
    recipient_name: '',
    recipient_email: '',
    recipient_phone: '',
    delivery_type: 'date',
    delivery_date: '',
    delivery_event: '',
    delivery_recurring: false,
    has_gift: false,
    gift_type: '',
    gift_details: '',
  })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (postscriptId) {
      loadPostScript()
    }
  }, [postscriptId])

  const loadPostScript = async () => {
    const { data } = await supabase
      .from('postscripts')
      .select('*')
      .eq('id', postscriptId)
      .single()

    if (data) {
      setForm({
        title: data.title || '',
        message: data.message || '',
        recipient_contact_id: data.recipient_contact_id || '',
        recipient_name: data.recipient_name || '',
        recipient_email: data.recipient_email || '',
        recipient_phone: data.recipient_phone || '',
        delivery_type: data.delivery_type || 'date',
        delivery_date: data.delivery_date || '',
        delivery_event: data.delivery_event || '',
        delivery_recurring: data.delivery_recurring || false,
        has_gift: data.has_gift || false,
        gift_type: data.gift_type || '',
        gift_details: data.gift_details ? JSON.stringify(data.gift_details) : '',
      })
    }
  }

  const handleContactSelect = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId)
    if (contact) {
      setForm({
        ...form,
        recipient_contact_id: contactId,
        recipient_name: contact.full_name,
        recipient_email: contact.email || '',
        recipient_phone: contact.phone || '',
      })
    }
  }

  const handleSave = async () => {
    if (!form.title || !form.recipient_name) return
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const payload = {
      user_id: user.id,
      title: form.title,
      message: form.message || null,
      recipient_contact_id: form.recipient_contact_id || null,
      recipient_name: form.recipient_name,
      recipient_email: form.recipient_email || null,
      recipient_phone: form.recipient_phone || null,
      delivery_type: form.delivery_type,
      delivery_date: form.delivery_type === 'date' ? form.delivery_date : null,
      delivery_event: form.delivery_type === 'event' ? form.delivery_event : null,
      delivery_recurring: form.delivery_recurring,
      has_gift: form.has_gift,
      gift_type: form.has_gift ? form.gift_type : null,
    }

    if (postscriptId) {
      await supabase.from('postscripts').update(payload).eq('id', postscriptId)
    } else {
      await supabase.from('postscripts').insert(payload)
    }

    setSaving(false)
    onSave()
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900/95 rounded-2xl p-6 border border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">
            {postscriptId ? 'Edit PostScript' : 'New PostScript'}
          </h2>
          <button onClick={onClose} className="p-2 text-white/50 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm text-white/50 mb-1">Title *</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g., Birthday wishes for Sarah"
              className="w-full px-4 py-3 bg-gray-800 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          {/* Recipient */}
          <div>
            <label className="block text-sm text-white/50 mb-1">Recipient</label>
            <select
              value={form.recipient_contact_id}
              onChange={(e) => handleContactSelect(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 mb-2"
            >
              <option value="">Select a contact or enter manually</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>{c.full_name}</option>
              ))}
            </select>
            <input
              value={form.recipient_name}
              onChange={(e) => setForm({ ...form, recipient_name: e.target.value })}
              placeholder="Recipient name *"
              className="w-full px-4 py-3 bg-gray-800 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm text-white/50 mb-1">Message</label>
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Your heartfelt message..."
              rows={4}
              className="w-full px-4 py-3 bg-gray-800 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
            />
          </div>

          {/* Delivery Type */}
          <div>
            <label className="block text-sm text-white/50 mb-2">When to deliver</label>
            <div className="flex gap-2 mb-3">
              {['date', 'event', 'passing'].map((type) => (
                <button
                  key={type}
                  onClick={() => setForm({ ...form, delivery_type: type })}
                  className={`flex-1 py-2 rounded-xl text-sm capitalize transition-all ${
                    form.delivery_type === type
                      ? 'bg-amber-500 text-white'
                      : 'bg-gray-800 text-white/60 hover:text-white'
                  }`}
                >
                  {type === 'passing' ? 'After Passing' : type}
                </button>
              ))}
            </div>

            {form.delivery_type === 'date' && (
              <input
                type="date"
                value={form.delivery_date}
                onChange={(e) => setForm({ ...form, delivery_date: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            )}

            {form.delivery_type === 'event' && (
              <select
                value={form.delivery_event}
                onChange={(e) => setForm({ ...form, delivery_event: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              >
                <option value="">Select event...</option>
                {DELIVERY_EVENTS.map((e) => (
                  <option key={e.id} value={e.id}>{e.label}</option>
                ))}
              </select>
            )}

            {form.delivery_type === 'passing' && (
              <p className="text-white/40 text-sm">
                This message will be delivered after your passing is confirmed by designated contacts.
              </p>
            )}
          </div>

          {/* Recurring */}
          {form.delivery_type === 'event' && (
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.delivery_recurring}
                onChange={(e) => setForm({ ...form, delivery_recurring: e.target.checked })}
                className="w-5 h-5 rounded bg-gray-800 border-white/20 text-amber-500 focus:ring-amber-500"
              />
              <span className="text-white">Repeat every year</span>
            </label>
          )}

          {/* Gift Toggle */}
          <label className="flex items-center gap-3 cursor-pointer p-4 bg-gray-800/50 rounded-xl">
            <input
              type="checkbox"
              checked={form.has_gift}
              onChange={(e) => setForm({ ...form, has_gift: e.target.checked })}
              className="w-5 h-5 rounded bg-gray-800 border-white/20 text-purple-500 focus:ring-purple-500"
            />
            <div>
              <span className="text-white flex items-center gap-2">
                <Gift size={16} className="text-purple-400" />
                Include a gift
              </span>
              <span className="text-white/40 text-sm">Attach a gift to this message</span>
            </div>
          </label>

          {form.has_gift && (
            <div>
              <label className="block text-sm text-white/50 mb-1">Gift Type</label>
              <select
                value={form.gift_type}
                onChange={(e) => setForm({ ...form, gift_type: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              >
                <option value="">Select type...</option>
                <option value="digital">Digital Gift Card</option>
                <option value="physical">Physical Gift</option>
                <option value="donation">Charitable Donation</option>
                <option value="experience">Experience/Activity</option>
              </select>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6 pt-4 border-t border-white/10">
          <button onClick={onClose} className="flex-1 py-3 text-white/50 hover:text-white">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.title || !form.recipient_name}
            className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl disabled:opacity-50 transition-all"
          >
            {saving ? 'Saving...' : 'Save PostScript'}
          </button>
        </div>
      </div>
    </div>
  )
}
