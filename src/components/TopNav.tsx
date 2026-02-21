'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { useState, useRef, useEffect } from 'react'
import { 
  User as UserIcon, 
  Users, 
  Home,
  Settings,
  LogOut,
  Camera,
  MessageSquare,
  Gift,
  Plane,
  Bot,
  FolderOpen,
  ChevronDown,
  MoreHorizontal,
  Menu,
  X
} from 'lucide-react'

interface Profile {
  full_name?: string
  avatar_url?: string
}

interface TopNavProps {
  user: User
  profile: Profile | null
}

const primaryNav = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/dashboard/profile', label: 'Profile', icon: UserIcon },
  { href: '/dashboard/contacts', label: 'Contacts', icon: Users },
  { href: '/dashboard/memories', label: 'Memories', icon: Camera },
  { href: '/dashboard/albums', label: 'Albums', icon: FolderOpen },
]

const moreItems = [
  { href: '/dashboard/journalist', label: 'Video Journalist', icon: MessageSquare },
  { href: '/dashboard/avatar', label: 'AI Avatar', icon: Bot, disabled: true },
  { href: '/dashboard/postscripts', label: 'PostScripts', icon: Gift },
  { href: '/dashboard/trips', label: 'Trip Planning', icon: Plane, disabled: true },
]

export default function TopNav({ user, profile }: TopNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [moreOpen, setMoreOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false)
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 h-14 bg-gray-950/80 backdrop-blur-xl z-50 px-4">
        <div className="h-full max-w-[1800px] mx-auto flex items-center justify-between">
          
          {/* Left: Logo + Primary Nav */}
          <div className="flex items-center gap-1">
            <Link href="/dashboard" className="mr-4 flex-shrink-0">
              <h1 className="text-lg font-bold text-white tracking-wide">YoursTruly</h1>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-0.5">
              {primaryNav.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'text-white/60 hover:bg-white/5 hover:text-white/90'
                    }`}
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </Link>
                )
              })}

              {/* Divider */}
              <div className="w-px h-5 bg-white/20 mx-2" />

              {/* More Dropdown */}
              <div ref={moreRef} className="relative">
                <button
                  onClick={() => setMoreOpen(!moreOpen)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    moreItems.some(i => pathname === i.href)
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'text-white/60 hover:bg-white/5 hover:text-white/90'
                  }`}
                >
                  <MoreHorizontal size={16} />
                  <span>More</span>
                  <ChevronDown size={14} className={`transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {moreOpen && (
                  <div className="absolute top-full left-0 mt-1 w-52 bg-gray-950/95 backdrop-blur-xl border border-white/10 rounded-xl p-1.5 shadow-xl">
                    {moreItems.map((item) => {
                      const Icon = item.icon
                      const isActive = pathname === item.href
                      return (
                        <Link
                          key={item.href}
                          href={item.disabled ? '#' : item.href}
                          onClick={(e) => {
                            if (item.disabled) e.preventDefault()
                            else setMoreOpen(false)
                          }}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                            isActive
                              ? 'bg-amber-500/20 text-amber-400'
                              : item.disabled
                              ? 'text-white/30 cursor-not-allowed'
                              : 'text-white/60 hover:bg-white/5 hover:text-white/90'
                          }`}
                        >
                          <Icon size={16} />
                          <span>{item.label}</span>
                          {item.disabled && (
                            <span className="ml-auto text-[10px] bg-white/10 text-white/40 px-1.5 py-0.5 rounded">Soon</span>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: User Menu */}
          <div className="flex items-center gap-2">
            {/* Settings - Desktop */}
            <Link
              href="/dashboard/settings"
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-white/50 hover:bg-white/5 hover:text-white/80 transition-all"
            >
              <Settings size={16} />
            </Link>

            {/* User Dropdown */}
            <div ref={userRef} className="relative">
              <button
                onClick={() => setUserOpen(!userOpen)}
                className="flex items-center gap-2 px-2 py-1 rounded-lg text-white/60 hover:bg-white/5 transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-semibold text-sm">
                  {profile?.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                </div>
                <span className="hidden xl:block text-sm font-medium text-white/80 max-w-[120px] truncate">
                  {profile?.full_name || 'Welcome'}
                </span>
                <ChevronDown size={14} className={`transition-transform ${userOpen ? 'rotate-180' : ''}`} />
              </button>

              {userOpen && (
                <div className="absolute top-full right-0 mt-1 w-56 bg-gray-950/95 backdrop-blur-xl border border-white/10 rounded-xl p-1.5 shadow-xl">
                  <div className="px-3 py-2 border-b border-white/10 mb-1">
                    <p className="text-sm font-medium text-white truncate">{profile?.full_name || 'Welcome!'}</p>
                    <p className="text-xs text-white/40 truncate">{user.email}</p>
                  </div>
                  <Link
                    href="/dashboard/profile"
                    onClick={() => setUserOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/60 hover:bg-white/5 hover:text-white/90 transition-all"
                  >
                    <UserIcon size={16} />
                    <span>My Profile</span>
                  </Link>
                  <Link
                    href="/dashboard/settings"
                    onClick={() => setUserOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/60 hover:bg-white/5 hover:text-white/90 transition-all"
                  >
                    <Settings size={16} />
                    <span>Settings</span>
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400/80 hover:bg-red-500/10 hover:text-red-400 transition-all"
                  >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg text-white/60 hover:bg-white/5 transition-all"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 top-14 bg-gray-950/98 backdrop-blur-xl z-40 overflow-y-auto">
          <div className="p-4 space-y-1">
            {[...primaryNav, ...moreItems].map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              const isDisabled = 'disabled' in item && item.disabled
              return (
                <Link
                  key={item.href}
                  href={isDisabled ? '#' : item.href}
                  onClick={(e) => {
                    if (isDisabled) e.preventDefault()
                    else setMobileOpen(false)
                  }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base transition-all ${
                    isActive
                      ? 'bg-amber-500/20 text-amber-400'
                      : isDisabled
                      ? 'text-white/30'
                      : 'text-white/60 hover:bg-white/5 hover:text-white/90'
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                  {isDisabled && (
                    <span className="ml-auto text-xs bg-white/10 text-white/40 px-2 py-0.5 rounded">Soon</span>
                  )}
                </Link>
              )
            })}
            <div className="border-t border-white/10 my-3" />
            <Link
              href="/dashboard/settings"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-base text-white/60 hover:bg-white/5 hover:text-white/90 transition-all"
            >
              <Settings size={20} />
              <span>Settings</span>
            </Link>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-base text-red-400/80 hover:bg-red-500/10 hover:text-red-400 transition-all"
            >
              <LogOut size={20} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </>
  )
}
