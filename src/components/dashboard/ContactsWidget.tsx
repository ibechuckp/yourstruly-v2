'use client'

import { useState, useEffect } from 'react'
import { Users, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function ContactsWidget() {
  const [contacts, setContacts] = useState<{ id: string; full_name: string }[]>([])
  const [count, setCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    loadContacts()
  }, [])

  const loadContacts = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, count } = await supabase
      .from('contacts')
      .select('id, full_name', { count: 'exact' })
      .eq('user_id', user.id)
      .limit(4)

    setContacts(data || [])
    setCount(count || 0)
  }

  return (
    <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-white/70" />
          <span className="text-white font-medium text-sm">Contacts</span>
        </div>
        <Link href="/dashboard/contacts" className="text-white/50 hover:text-white">
          <Plus size={16} />
        </Link>
      </div>

      {contacts.length > 0 ? (
        <div className="flex items-center gap-1 mb-3">
          {contacts.slice(0, 4).map((contact, i) => (
            <div 
              key={contact.id}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium border-2 border-gray-900"
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

      <button className="w-full flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg text-white/70 text-sm hover:bg-white/20 transition-colors">
        <span className="text-lg">🔗</span>
        Import Google contacts
        <span className="ml-auto text-white/30">›</span>
      </button>
    </div>
  )
}
