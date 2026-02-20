import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { User, Users, Heart, Camera, CheckCircle2 } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id)
    .single()

  const { count: contactsCount } = await supabase
    .from('contacts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user?.id)

  const { count: petsCount } = await supabase
    .from('pets')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user?.id)

  // Calculate profile completion
  const profileFields = [
    profile?.full_name,
    profile?.date_of_birth,
    profile?.biography,
    profile?.personal_motto,
    profile?.interests?.length > 0,
    profile?.skills?.length > 0,
    profile?.life_goals?.length > 0,
  ]
  const completedFields = profileFields.filter(Boolean).length
  const completionPercent = Math.round((completedFields / profileFields.length) * 100)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">
          Welcome back, {profile?.full_name?.split(' ')[0] || 'Friend'}! 👋
        </h1>
        <p className="text-gray-400 mt-1">Let&apos;s continue documenting your life story.</p>
      </div>

      {/* Profile Completion Card */}
      {completionPercent < 100 && (
        <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-2xl p-6 border border-purple-500/30">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-white">Complete Your Profile</h2>
              <p className="text-purple-200 text-sm">Help us understand who you are</p>
            </div>
            <div className="text-3xl font-bold text-purple-400">{completionPercent}%</div>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
          <Link
            href="/dashboard/profile"
            className="inline-block mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Continue Setup →
          </Link>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/dashboard/profile" className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-purple-500/50 transition-colors group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-600/20 flex items-center justify-center">
              <User className="text-purple-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-400">Profile</p>
              <p className="text-2xl font-bold text-white group-hover:text-purple-400 transition-colors">
                {completionPercent}%
              </p>
            </div>
          </div>
        </Link>

        <Link href="/dashboard/contacts" className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-blue-500/50 transition-colors group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center">
              <Users className="text-blue-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-400">Contacts</p>
              <p className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">
                {contactsCount || 0}
              </p>
            </div>
          </div>
        </Link>

        <Link href="/dashboard/pets" className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-pink-500/50 transition-colors group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-pink-600/20 flex items-center justify-center">
              <Heart className="text-pink-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-400">Pets</p>
              <p className="text-2xl font-bold text-white group-hover:text-pink-400 transition-colors">
                {petsCount || 0}
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Getting Started Checklist */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <h2 className="text-xl font-semibold text-white mb-4">Getting Started</h2>
        <div className="space-y-3">
          {[
            { done: !!profile?.full_name, label: 'Add your name', href: '/dashboard/profile' },
            { done: !!profile?.biography, label: 'Write a short bio', href: '/dashboard/profile' },
            { done: !!profile?.personal_motto, label: 'Set your personal motto', href: '/dashboard/profile' },
            { done: (profile?.interests?.length || 0) > 0, label: 'Add your interests', href: '/dashboard/profile' },
            { done: (contactsCount || 0) > 0, label: 'Add a family member or friend', href: '/dashboard/contacts' },
            { done: (petsCount || 0) > 0, label: 'Add a pet (if you have one)', href: '/dashboard/pets' },
          ].map((item, i) => (
            <Link
              key={i}
              href={item.href}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                item.done ? 'bg-green-500/10' : 'bg-gray-800 hover:bg-gray-700'
              }`}
            >
              <CheckCircle2 
                size={20} 
                className={item.done ? 'text-green-400' : 'text-gray-600'} 
              />
              <span className={item.done ? 'text-green-400 line-through' : 'text-white'}>
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Coming Soon */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <h2 className="text-xl font-semibold text-white mb-4">Coming Soon</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Camera, label: 'Memories', color: 'blue' },
            { icon: '📹', label: 'Video Journalist', color: 'purple' },
            { icon: '🤖', label: 'AI Avatar', color: 'green' },
            { icon: '✈️', label: 'Trip Planning', color: 'orange' },
          ].map((item, i) => (
            <div key={i} className="bg-gray-800/50 rounded-lg p-4 text-center">
              <div className="text-3xl mb-2">
                {typeof item.icon === 'string' ? item.icon : <item.icon className="mx-auto text-gray-500" />}
              </div>
              <p className="text-sm text-gray-400">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
