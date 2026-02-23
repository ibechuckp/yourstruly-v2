'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { 
  User as UserIcon, 
  Users, 
  Home,
  Settings,
  LogOut,
  Camera,
  MessageSquare,
  Send,
  Plane,
  Bot,
  Image,
  BookOpen
} from 'lucide-react'

interface Profile {
  full_name?: string
  avatar_url?: string
}

interface SidebarProps {
  user: User
  profile: Profile | null
}

const navItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/dashboard/profile', label: 'My Profile', icon: UserIcon },
  { href: '/dashboard/contacts', label: 'Contacts & Pets', icon: Users },
  { href: '/dashboard/circles', label: 'Circles', icon: Users },
  // Phase 2
  { href: '/dashboard/memories', label: 'Memories', icon: Camera },
  { href: '/dashboard/wisdom', label: 'Wisdom', icon: BookOpen },
  { href: '/dashboard/gallery', label: 'Gallery', icon: Image },
  // Phase 3
  { href: '/dashboard/journalist', label: 'Video Journalist', icon: MessageSquare },
  // Phase 4+
  { href: '/dashboard/avatar', label: 'AI Avatar', icon: Bot, disabled: true },
  { href: '/dashboard/postscripts', label: 'Future Messages', icon: Send },
  { href: '/dashboard/trips', label: 'Trip Planning', icon: Plane, disabled: true },
]

export default function Sidebar({ user, profile }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-56 bg-gray-950/95 backdrop-blur-xl flex flex-col z-50">
      {/* Logo */}
      <div className="p-5 border-b border-white/10">
        <h1 className="text-xl font-bold text-white tracking-wide">YoursTruly</h1>
        <p className="text-xs text-white/50 mt-0.5">Document your legacy</p>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-semibold text-sm">
            {profile?.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {profile?.full_name || 'Welcome!'}
            </p>
            <p className="text-xs text-white/40 truncate">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          const isDisabled = item.disabled

          return (
            <Link
              key={item.href}
              href={isDisabled ? '#' : item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400'
                  : isDisabled
                  ? 'text-white/30 cursor-not-allowed'
                  : 'text-white/60 hover:bg-white/5 hover:text-white/90'
              }`}
              onClick={(e) => isDisabled && e.preventDefault()}
            >
              <Icon size={18} />
              <span className="text-sm font-medium">{item.label}</span>
              {isDisabled && (
                <span className="ml-auto text-[10px] bg-white/10 text-white/40 px-1.5 py-0.5 rounded">Soon</span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-white/10 space-y-0.5">
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/50 hover:bg-white/5 hover:text-white/80 transition-all"
        >
          <Settings size={18} />
          <span className="text-sm font-medium">Settings</span>
        </Link>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/50 hover:bg-red-500/10 hover:text-red-400 transition-all"
        >
          <LogOut size={18} />
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
