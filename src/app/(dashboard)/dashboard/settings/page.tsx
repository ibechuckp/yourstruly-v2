'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft, User, Bell, Shield, Download, Trash2, LogOut, Sparkles, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Settings {
  email_notifications: boolean
  memory_reminders: boolean
  share_notifications: boolean
  public_profile: boolean
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    email_notifications: true,
    memory_reminders: true,
    share_notifications: true,
    public_profile: false,
  })
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [generatingEmbeddings, setGeneratingEmbeddings] = useState(false)
  const [embeddingStats, setEmbeddingStats] = useState<{ processed: number; errors: number } | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setEmail(user.email || '')
      // Load settings from profile or create defaults
      const { data } = await supabase
        .from('profiles')
        .select('settings')
        .eq('id', user.id)
        .single()
      
      if (data?.settings) {
        setSettings({ ...settings, ...data.settings })
      }
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('profiles')
      .update({ settings })
      .eq('id', user.id)

    if (error) {
      setMessage('Failed to save settings')
    } else {
      setMessage('Settings saved!')
      setTimeout(() => setMessage(''), 3000)
    }
    setSaving(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This cannot be undone.')) return
    if (!confirm('This will permanently delete all your memories, contacts, and data. Type "DELETE" to confirm.')) return

    // In production, this would call a secure API endpoint
    alert('Account deletion requested. Please contact support to complete this process.')
  }

  const handleGenerateEmbeddings = async () => {
    setGeneratingEmbeddings(true)
    setEmbeddingStats(null)
    setMessage('Generating AI embeddings for your content...')

    try {
      const res = await fetch('/api/embeddings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}), // Process all types
      })

      const data = await res.json()

      if (data.error) {
        setMessage(`Error: ${data.error}`)
      } else {
        setEmbeddingStats(data)
        setMessage(`AI indexing complete! Processed ${data.processed} items.`)
      }
    } catch (error) {
      setMessage('Failed to generate embeddings. Check your OpenAI API key.')
    } finally {
      setGeneratingEmbeddings(false)
      setTimeout(() => setMessage(''), 5000)
    }
  }

  const handleExportData = async () => {
    setMessage('Preparing export...')
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Fetch all user data
    const [profileRes, memoriesRes, contactsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('memories').select('*').eq('user_id', user.id),
      supabase.from('contacts').select('*').eq('user_id', user.id),
    ])

    const exportData = {
      exported_at: new Date().toISOString(),
      profile: profileRes.data,
      memories: memoriesRes.data,
      contacts: contactsRes.data,
    }

    // Download as JSON
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `yourstruly-export-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)

    setMessage('Export downloaded!')
    setTimeout(() => setMessage(''), 3000)
  }

  return (
    <div className="min-h-screen p-6 max-w-2xl">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2 bg-gray-900/90 rounded-xl text-white/70 hover:text-white transition-all border border-white/10">
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Settings</h1>
            <p className="text-white/50 text-sm">Manage your account and preferences</p>
          </div>
        </div>
      </header>

      {message && (
        <div className={`mb-6 p-4 rounded-xl ${message.includes('Failed') ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
          {message}
        </div>
      )}

      <div className="space-y-6">
        {/* Account Section */}
        <section className="bg-gray-900/90 rounded-2xl p-6 border border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <User size={20} className="text-amber-500" />
            <h2 className="text-lg font-semibold text-white">Account</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-white/50 mb-1">Email</label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full px-4 py-3 bg-gray-800/50 border border-white/10 rounded-xl text-white/70 cursor-not-allowed"
              />
              <p className="text-xs text-white/30 mt-1">Contact support to change email</p>
            </div>
          </div>
        </section>

        {/* Notifications Section */}
        <section className="bg-gray-900/90 rounded-2xl p-6 border border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <Bell size={20} className="text-amber-500" />
            <h2 className="text-lg font-semibold text-white">Notifications</h2>
          </div>
          
          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-white">Email Notifications</p>
                <p className="text-sm text-white/50">Receive updates via email</p>
              </div>
              <input
                type="checkbox"
                checked={settings.email_notifications}
                onChange={(e) => setSettings({ ...settings, email_notifications: e.target.checked })}
                className="w-5 h-5 rounded bg-gray-800 border-white/20 text-amber-500 focus:ring-amber-500"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-white">Memory Reminders</p>
                <p className="text-sm text-white/50">"On this day" memories from past years</p>
              </div>
              <input
                type="checkbox"
                checked={settings.memory_reminders}
                onChange={(e) => setSettings({ ...settings, memory_reminders: e.target.checked })}
                className="w-5 h-5 rounded bg-gray-800 border-white/20 text-amber-500 focus:ring-amber-500"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-white">Share Notifications</p>
                <p className="text-sm text-white/50">When contacts interact with shared memories</p>
              </div>
              <input
                type="checkbox"
                checked={settings.share_notifications}
                onChange={(e) => setSettings({ ...settings, share_notifications: e.target.checked })}
                className="w-5 h-5 rounded bg-gray-800 border-white/20 text-amber-500 focus:ring-amber-500"
              />
            </label>
          </div>
        </section>

        {/* Privacy Section */}
        <section className="bg-gray-900/90 rounded-2xl p-6 border border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <Shield size={20} className="text-amber-500" />
            <h2 className="text-lg font-semibold text-white">Privacy</h2>
          </div>
          
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-white">Public Profile</p>
              <p className="text-sm text-white/50">Allow others to view your profile</p>
            </div>
            <input
              type="checkbox"
              checked={settings.public_profile}
              onChange={(e) => setSettings({ ...settings, public_profile: e.target.checked })}
              className="w-5 h-5 rounded bg-gray-800 border-white/20 text-amber-500 focus:ring-amber-500"
            />
          </label>
        </section>

        {/* Save Button */}
        <button
          onClick={saveSettings}
          disabled={saving}
          className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl font-medium transition-all disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>

        {/* Data Section */}
        <section className="bg-gray-900/90 rounded-2xl p-6 border border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <Download size={20} className="text-amber-500" />
            <h2 className="text-lg font-semibold text-white">Your Data</h2>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={handleExportData}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors"
            >
              <Download size={18} />
              Export All Data
            </button>
          </div>
        </section>

        {/* AI Features Section */}
        <section className="bg-gray-900/90 rounded-2xl p-6 border border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles size={20} className="text-amber-500" />
            <h2 className="text-lg font-semibold text-white">AI Features</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="text-white mb-1">AI-Powered Search</p>
              <p className="text-sm text-white/50 mb-3">
                Generate AI embeddings to enable semantic search across all your memories, contacts, and life data. 
                This allows the AI assistant to understand and recall your content naturally.
              </p>
              <button
                onClick={handleGenerateEmbeddings}
                disabled={generatingEmbeddings}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl font-medium transition-all disabled:opacity-50"
              >
                {generatingEmbeddings ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Index My Content for AI
                  </>
                )}
              </button>
              {embeddingStats && (
                <p className="text-sm text-green-400 mt-2">
                  ✓ Indexed {embeddingStats.processed} items
                  {embeddingStats.errors > 0 && ` (${embeddingStats.errors} errors)`}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="bg-red-950/30 rounded-2xl p-6 border border-red-500/20">
          <h2 className="text-lg font-semibold text-red-400 mb-4">Danger Zone</h2>
          
          <div className="space-y-3">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors"
            >
              <LogOut size={18} />
              Sign Out
            </button>

            <button
              onClick={handleDeleteAccount}
              className="w-full flex items-center justify-center gap-2 py-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-xl transition-colors"
            >
              <Trash2 size={18} />
              Delete Account
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
