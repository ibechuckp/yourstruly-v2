'use client'

import { useState, useEffect } from 'react'
import { Users, Plus, X, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Modal from '@/components/ui/Modal'

interface Contact {
  id: string
  full_name: string
  relationship: string
  email: string
  phone: string
}

export default function ContactsWidget() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [count, setCount] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newContact, setNewContact] = useState({ full_name: '', relationship: '', email: '', phone: '' })
  const supabase = createClient()

  useEffect(() => {
    loadContacts()
  }, [])

  const loadContacts = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, count } = await supabase
      .from('contacts')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    setContacts(data || [])
    setCount(count || 0)
  }

  const addContact = async () => {
    if (!newContact.full_name.trim()) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('contacts').insert({
      user_id: user.id,
      ...newContact
    })

    setNewContact({ full_name: '', relationship: '', email: '', phone: '' })
    setShowAddForm(false)
    loadContacts()
  }

  const deleteContact = async (id: string) => {
    await supabase.from('contacts').delete().eq('id', id)
    loadContacts()
  }

  return (
    <>
      <div 
        className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl border border-white/20 p-4 cursor-pointer transition-colors"
        onClick={() => setShowModal(true)}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-white/70" />
            <span className="text-white font-medium text-sm">Contacts</span>
          </div>
          <Plus size={16} className="text-white/50" />
        </div>

        {contacts.length > 0 ? (
          <div className="flex items-center gap-1 mb-3">
            {contacts.slice(0, 4).map((contact, i) => (
              <div 
                key={contact.id}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-sm font-medium border-2 border-gray-900"
                style={{ marginLeft: i > 0 ? '-8px' : 0 }}
                title={contact.full_name}
              >
                {contact.full_name.charAt(0)}
              </div>
            ))}
            {count > 4 && (
              <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white text-xs font-medium border-2 border-gray-900" style={{ marginLeft: '-8px' }}>
                +{count - 4}
              </div>
            )}
          </div>
        ) : (
          <p className="text-white/40 text-sm mb-3">You have no contacts yet</p>
        )}

        <div className="w-full flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg text-white/70 text-sm">
          <span className="text-lg">🔗</span>
          Import Google contacts
          <span className="ml-auto text-white/30">›</span>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Contacts" showDone={false}>
        {/* Add Contact Form */}
        {showAddForm ? (
          <div className="mb-5 p-4 bg-gray-800/50 rounded-xl">
            <div className="space-y-3">
              <input
                type="text"
                value={newContact.full_name}
                onChange={(e) => setNewContact({ ...newContact, full_name: e.target.value })}
                placeholder="Name *"
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <input
                type="text"
                value={newContact.relationship}
                onChange={(e) => setNewContact({ ...newContact, relationship: e.target.value })}
                placeholder="Relationship (Friend, Family, etc.)"
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="email"
                  value={newContact.email}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  placeholder="Email"
                  className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <input
                  type="tel"
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  placeholder="Phone"
                  className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowAddForm(false)} className="px-4 py-2 text-gray-400">Cancel</button>
              <button onClick={addContact} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors">Add Contact</button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full mb-5 py-3 border border-dashed border-gray-600 rounded-xl text-gray-400 flex items-center justify-center gap-2 hover:border-gray-500 hover:text-gray-300 transition-colors"
          >
            <Plus size={18} />
            Add Contact
          </button>
        )}

        {/* Contacts List */}
        {contacts.length > 0 ? (
          <div className="space-y-2">
            {contacts.map((contact) => (
              <div key={contact.id} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-medium">
                  {contact.full_name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate">{contact.full_name}</p>
                  {contact.relationship && <p className="text-gray-400 text-xs">{contact.relationship}</p>}
                </div>
                <button 
                  onClick={() => deleteContact(contact.id)}
                  className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">No contacts yet. Add your first contact above!</p>
        )}

        {/* Import Button */}
        <button className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 rounded-xl text-gray-300 hover:bg-gray-700 transition-colors">
          <span>🔗</span>
          Import Google Contacts
        </button>
      </Modal>
    </>
  )
}
