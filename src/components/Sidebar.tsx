'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { 
  User as UserIcon, 
  Users, 
  Heart,
  Home,
  Settings,
  LogOut,
  Camera,
  MessageSquare,
  Gift,
  Plane,
  Bot,
  FolderOpen
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
  { href: '/dashboard/contacts', label: 'Contacts', icon: Users },
  { href: '/dashboard/pets', label: 'Pets', icon: Heart },
  // Phase 2
  { href: '/dashboard/memories', label: 'Memories', icon: Camera },
  { href: '/dashboard/albums', label: 'Albums', icon: FolderOpen },
  // Phase 3
  { href: '/dashboard/journalist', label: 'Video Journalist', icon: MessageSquare },
  // Phase 4+
  { href: '/dashboard/avatar', label: 'AI Avatar', icon: Bot, disabled: true },
  { href: '/dashboard/postscripts', label: 'PostScripts', icon: Gift, disabled: true },
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
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-2xl font-bold text-white">YoursTruly</h1>
        <p className="text-xs text-gray-400 mt-1">Document your legacy</p>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-semibold">
            {profile?.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {profile?.full_name || 'Welcome!'}
            </p>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          const isDisabled = item.disabled

          return (
            <Link
              key={item.href}
              href={isDisabled ? '#' : item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-purple-600 text-white'
                  : isDisabled
                  ? 'text-gray-600 cursor-not-allowed'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
              onClick={(e) => isDisabled && e.preventDefault()}
            >
              <Icon size={20} />
              <span className="text-sm font-medium">{item.label}</span>
              {isDisabled && (
                <span className="ml-auto text-xs bg-gray-800 px-2 py-0.5 rounded">Soon</span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-gray-800 space-y-1">
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <Settings size={20} />
          <span className="text-sm font-medium">Settings</span>
        </Link>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-red-400 transition-colors"
        >
          <LogOut size={20} />
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
