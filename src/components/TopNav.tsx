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
  Menu,
  X,
  Lightbulb,
  Mail,
  BookOpen,
  UsersRound,
  Wrench,
  ShoppingBag
} from 'lucide-react'

interface Profile {
  full_name?: string
  avatar_url?: string
}

interface TopNavProps {
  user: User
  profile: Profile | null
}

// Top-level nav items
const primaryNav = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/dashboard/messages', label: 'Messages', icon: Mail },
  { href: '/dashboard/profile', label: 'Profile', icon: UserIcon },
  { href: '/marketplace', label: 'Shop', icon: ShoppingBag },
]

// My Story dropdown - content about you
const myStoryItems = [
  { href: '/dashboard/memories', label: 'Memories', icon: Camera },
  { href: '/dashboard/wisdom', label: 'Wisdom', icon: Lightbulb },
  { href: '/dashboard/gallery', label: 'Gallery', icon: FolderOpen },
  { href: '/dashboard/postscripts', label: 'PostScripts', icon: Gift },
]

// People dropdown - who you share with
const peopleItems = [
  { href: '/dashboard/contacts', label: 'Contacts', icon: Users },
  { href: '/dashboard/circles', label: 'Circles', icon: UsersRound },
]

// Tools dropdown - utilities
const toolsItems = [
  { href: '/dashboard/journalist', label: 'Video Journalist', icon: MessageSquare },
  { href: '/dashboard/avatar', label: 'AI Avatar', icon: Bot, disabled: true },
  { href: '/dashboard/trips', label: 'Trip Planning', icon: Plane, disabled: true },
]

export default function TopNav({ user, profile }: TopNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [myStoryOpen, setMyStoryOpen] = useState(false)
  const [peopleOpen, setPeopleOpen] = useState(false)
  const [toolsOpen, setToolsOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const myStoryRef = useRef<HTMLDivElement>(null)
  const peopleRef = useRef<HTMLDivElement>(null)
  const toolsRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (myStoryRef.current && !myStoryRef.current.contains(e.target as Node)) setMyStoryOpen(false)
      if (peopleRef.current && !peopleRef.current.contains(e.target as Node)) setPeopleOpen(false)
      if (toolsRef.current && !toolsRef.current.contains(e.target as Node)) setToolsOpen(false)
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 h-14 glass-nav z-50 px-4 font-inter-tight">
        <div className="h-full max-w-[1800px] mx-auto flex items-center justify-between">
          
          {/* Left: Logo + Primary Nav */}
          <div className="flex items-center gap-1">
            <Link href="/dashboard" className="mr-4 flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src="/images/logo-yours.svg" 
                alt="YoursTruly" 
                className="h-7 w-auto"
              />
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-0.5">
              {/* Primary items - simple underline hover like Webflow */}
              {primaryNav.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`nav-link-underline mx-3 text-sm font-medium ${isActive ? 'active' : ''}`}
                  >
                    {item.label}
                  </Link>
                )
              })}

              {/* Divider */}
              <div className="w-px h-5 bg-black/10 mx-4" />

              {/* My Story Dropdown */}
              <div ref={myStoryRef} className="relative">
                <button
                  onClick={() => { setMyStoryOpen(!myStoryOpen); setPeopleOpen(false); setToolsOpen(false) }}
                  className={`nav-link-underline mx-3 text-sm font-medium flex items-center gap-1 ${
                    myStoryItems.some(i => pathname === i.href) ? 'active' : ''
                  }`}
                >
                  <span>My Story</span>
                  <ChevronDown size={14} className={`transition-transform ${myStoryOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {myStoryOpen && (
                  <div className="absolute top-full left-0 mt-1 w-48 glass-modal rounded-refined p-1.5 dropdown-menu">
                    {myStoryItems.map((item) => {
                      const Icon = item.icon
                      const isActive = pathname === item.href
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMyStoryOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                            isActive
                              ? 'bg-[#C35F33]/15 text-[#C35F33]'
                              : 'text-gray-600 hover:bg-[#C35F33]/5 hover:text-[#C35F33]'
                          }`}
                        >
                          <Icon size={16} />
                          <span>{item.label}</span>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* People Dropdown */}
              <div ref={peopleRef} className="relative">
                <button
                  onClick={() => { setPeopleOpen(!peopleOpen); setMyStoryOpen(false); setToolsOpen(false) }}
                  className={`nav-link-underline mx-3 text-sm font-medium flex items-center gap-1 ${
                    peopleItems.some(i => pathname === i.href) ? 'active' : ''
                  }`}
                >
                  <span>People</span>
                  <ChevronDown size={14} className={`transition-transform ${peopleOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {peopleOpen && (
                  <div className="absolute top-full left-0 mt-1 w-44 glass-modal rounded-refined p-1.5 dropdown-menu">
                    {peopleItems.map((item) => {
                      const Icon = item.icon
                      const isActive = pathname === item.href
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setPeopleOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                            isActive
                              ? 'bg-[#C35F33]/15 text-[#C35F33]'
                              : 'text-gray-600 hover:bg-[#C35F33]/5 hover:text-[#C35F33]'
                          }`}
                        >
                          <Icon size={16} />
                          <span>{item.label}</span>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Tools Dropdown */}
              <div ref={toolsRef} className="relative">
                <button
                  onClick={() => { setToolsOpen(!toolsOpen); setMyStoryOpen(false); setPeopleOpen(false) }}
                  className={`nav-link-underline mx-3 text-sm font-medium flex items-center gap-1 ${
                    toolsItems.some(i => pathname === i.href) ? 'active' : ''
                  }`}
                >
                  <span>Tools</span>
                  <ChevronDown size={14} className={`transition-transform ${toolsOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {toolsOpen && (
                  <div className="absolute top-full left-0 mt-1 w-48 glass-modal rounded-refined p-1.5 dropdown-menu">
                    {toolsItems.map((item) => {
                      const Icon = item.icon
                      const isActive = pathname === item.href
                      const isDisabled = 'disabled' in item && item.disabled
                      return (
                        <Link
                          key={item.href}
                          href={isDisabled ? '#' : item.href}
                          onClick={(e) => {
                            if (isDisabled) e.preventDefault()
                            else setToolsOpen(false)
                          }}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                            isActive
                              ? 'bg-[#C35F33]/15 text-[#C35F33]'
                              : isDisabled
                              ? 'text-gray-400 cursor-not-allowed'
                              : 'text-gray-600 hover:bg-[#C35F33]/5 hover:text-[#C35F33]'
                          }`}
                        >
                          <Icon size={16} />
                          <span>{item.label}</span>
                          {isDisabled && (
                            <span className="ml-auto text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded">Soon</span>
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
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-[#C35F33]/5 hover:text-[#C35F33] transition-all"
            >
              <Settings size={16} />
            </Link>

            {/* User Dropdown */}
            <div ref={userRef} className="relative">
              <button
                onClick={() => setUserOpen(!userOpen)}
                className="flex items-center gap-2 px-2 py-1 rounded-lg text-gray-600 hover:bg-[#C35F33]/5 transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C35F33] to-[#D9C61A] flex items-center justify-center text-white font-semibold text-sm">
                  {profile?.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                </div>
                <span className="hidden xl:block text-sm font-medium text-gray-700 max-w-[120px] truncate">
                  {profile?.full_name || 'Welcome'}
                </span>
                <ChevronDown size={14} className={`transition-transform ${userOpen ? 'rotate-180' : ''}`} />
              </button>

              {userOpen && (
                <div className="absolute top-full right-0 mt-1 w-56 glass-modal rounded-refined p-1.5 dropdown-menu">
                  <div className="px-3 py-2 border-b border-[#C35F33]/10 mb-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{profile?.full_name || 'Welcome!'}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  <Link
                    href="/dashboard/profile"
                    onClick={() => setUserOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-[#C35F33]/5 hover:text-[#C35F33] transition-all"
                  >
                    <UserIcon size={16} />
                    <span>My Profile</span>
                  </Link>
                  <Link
                    href="/dashboard/settings"
                    onClick={() => setUserOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-[#C35F33]/5 hover:text-[#C35F33] transition-all"
                  >
                    <Settings size={16} />
                    <span>Settings</span>
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 hover:text-red-600 transition-all"
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
              className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg text-gray-600 hover:bg-[#C35F33]/5 transition-all"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 top-14 glass-modal z-40 overflow-y-auto">
          <div className="p-4 space-y-1">
            {/* Primary items */}
            {primaryNav.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base transition-all ${
                    isActive
                      ? 'bg-[#C35F33]/15 text-[#C35F33]'
                      : 'text-gray-600 hover:bg-[#C35F33]/5 hover:text-[#C35F33]'
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              )
            })}

            {/* My Story Section */}
            <div className="pt-3 pb-1">
              <p className="px-4 text-xs font-semibold text-[#C35F33]/60 uppercase tracking-wider">My Story</p>
            </div>
            {myStoryItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base transition-all ${
                    isActive
                      ? 'bg-[#C35F33]/15 text-[#C35F33]'
                      : 'text-gray-600 hover:bg-[#C35F33]/5 hover:text-[#C35F33]'
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              )
            })}

            {/* People Section */}
            <div className="pt-3 pb-1">
              <p className="px-4 text-xs font-semibold text-[#C35F33]/60 uppercase tracking-wider">People</p>
            </div>
            {peopleItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base transition-all ${
                    isActive
                      ? 'bg-[#C35F33]/15 text-[#C35F33]'
                      : 'text-gray-600 hover:bg-[#C35F33]/5 hover:text-[#C35F33]'
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              )
            })}

            {/* Tools Section */}
            <div className="pt-3 pb-1">
              <p className="px-4 text-xs font-semibold text-[#C35F33]/60 uppercase tracking-wider">Tools</p>
            </div>
            {toolsItems.map((item) => {
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
                      ? 'bg-[#C35F33]/15 text-[#C35F33]'
                      : isDisabled
                      ? 'text-gray-400'
                      : 'text-gray-600 hover:bg-[#C35F33]/5 hover:text-[#C35F33]'
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                  {isDisabled && (
                    <span className="ml-auto text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded">Soon</span>
                  )}
                </Link>
              )
            })}

            <div className="border-t border-[#C35F33]/10 my-3" />
            <Link
              href="/dashboard/settings"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-base text-gray-600 hover:bg-[#C35F33]/5 hover:text-[#C35F33] transition-all"
            >
              <Settings size={20} />
              <span>Settings</span>
            </Link>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-base text-red-500 hover:bg-red-50 hover:text-red-600 transition-all"
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
