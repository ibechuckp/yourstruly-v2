'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Image, Users, Mail, FolderOpen, Mic } from 'lucide-react'
import Link from 'next/link'

interface Stats {
  memories: number
  contacts: number
  postscripts: number
  albums: number
  interviews: number
}

export default function StatsWidget() {
  const [stats, setStats] = useState<Stats>({ memories: 0, contacts: 0, postscripts: 0, albums: 0, interviews: 0 })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [mem, con, ps, alb, int] = await Promise.all([
      supabase.from('memories').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('postscripts').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('memory_albums').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('interview_sessions').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    ])

    setStats({
      memories: mem.count || 0,
      contacts: con.count || 0,
      postscripts: ps.count || 0,
      albums: alb.count || 0,
      interviews: int.count || 0,
    })
    setLoading(false)
  }

  const items = [
    { label: 'Memories', count: stats.memories, icon: Image, href: '/dashboard/memories', color: 'text-blue-400' },
    { label: 'Contacts', count: stats.contacts, icon: Users, href: '/dashboard/contacts', color: 'text-green-400' },
    { label: 'PostScripts', count: stats.postscripts, icon: Mail, href: '/dashboard/postscripts', color: 'text-purple-400' },
    { label: 'Gallery', count: stats.albums, icon: FolderOpen, href: '/dashboard/gallery', color: 'text-amber-400' },
    { label: 'Interviews', count: stats.interviews, icon: Mic, href: '/dashboard/journalist', color: 'text-pink-400' },
  ]

  if (loading) {
    return (
      <div className="bg-gray-900/90 rounded-2xl p-5 border border-white/10">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-8 bg-white/5 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-900/90 rounded-2xl p-5 border border-white/10">
      <h3 className="text-white font-medium mb-4">Your Life Data</h3>
      <div className="space-y-2">
        {items.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <item.icon size={18} className={item.color} />
              <span className="text-white/70 text-sm group-hover:text-white transition-colors">
                {item.label}
              </span>
            </div>
            <span className="text-white font-medium">{item.count}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
