'use client'

import { useState } from 'react'
import { Calendar, Plus, Pencil } from 'lucide-react'

interface Profile {
  full_name: string
  date_of_birth: string
  occupation: string
  biography: string
  avatar_url: string
  gender: string
}

interface ProfileCardProps {
  profile: Profile | null
  onUpdate: (field: string, value: string) => void
}

export default function ProfileCard({ profile, onUpdate }: ProfileCardProps) {
  const [editingField, setEditingField] = useState<string | null>(null)
  const [tempValue, setTempValue] = useState('')

  const startEdit = (field: string, value: string) => {
    setEditingField(field)
    setTempValue(value || '')
  }

  const saveEdit = () => {
    if (editingField) {
      onUpdate(editingField, tempValue)
      setEditingField(null)
    }
  }

  const formatDate = (date: string) => {
    if (!date) return null
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  const genderIcon = profile?.gender === 'Male' ? '♂' : profile?.gender === 'Female' ? '♀' : '⚥'

  return (
    <div className="w-80 bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-xl rounded-3xl border border-white/20 p-6 shadow-2xl">
      {/* Gender Icon */}
      {profile?.gender && (
        <div className="flex justify-center mb-2">
          <span className="text-white/60 text-2xl">{genderIcon}</span>
        </div>
      )}

      {/* Birthday */}
      <button 
        onClick={() => startEdit('date_of_birth', profile?.date_of_birth || '')}
        className="flex items-center justify-center gap-2 w-full py-2 text-white/70 hover:text-white transition-colors"
      >
        <Calendar size={16} />
        <span className="text-sm">
          {profile?.date_of_birth ? formatDate(profile.date_of_birth) : 'add your birthday'}
        </span>
      </button>

      {/* Avatar */}
      <div className="flex justify-center my-4">
        <div className="relative">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-white/20 to-white/5 border-4 border-white/30 flex items-center justify-center overflow-hidden">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center text-white/50">
                <Plus size={24} className="mx-auto mb-1" />
                <span className="text-xs">Upload Photo</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Name */}
      {editingField === 'full_name' ? (
        <input
          type="text"
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          onBlur={saveEdit}
          onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
          autoFocus
          className="w-full text-center text-2xl font-semibold text-white bg-transparent border-b border-white/30 focus:outline-none focus:border-white/60 pb-1"
        />
      ) : (
        <h2 
          onClick={() => startEdit('full_name', profile?.full_name || '')}
          className="text-center text-2xl font-semibold text-white cursor-pointer hover:text-white/80"
        >
          {profile?.full_name || 'Your Name'}
        </h2>
      )}

      {/* Job Title */}
      {editingField === 'occupation' ? (
        <input
          type="text"
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          onBlur={saveEdit}
          onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
          autoFocus
          className="w-full text-center text-sm text-white/70 bg-transparent border-b border-white/30 focus:outline-none mt-2"
        />
      ) : (
        <button 
          onClick={() => startEdit('occupation', profile?.occupation || '')}
          className="block mx-auto mt-2 px-4 py-1 bg-white/10 rounded-full text-white/70 text-sm hover:bg-white/20 transition-colors"
        >
          {profile?.occupation || 'Job Name'}
        </button>
      )}

      {/* Bio */}
      <div className="mt-6">
        <div className="bg-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/70 text-sm font-medium">Bio</span>
            <button 
              onClick={() => startEdit('biography', profile?.biography || '')}
              className="text-white/50 hover:text-white"
            >
              <Pencil size={14} />
            </button>
          </div>
          {editingField === 'biography' ? (
            <textarea
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              onBlur={saveEdit}
              autoFocus
              rows={4}
              className="w-full text-sm text-white/80 bg-transparent border border-white/20 rounded-lg p-2 focus:outline-none focus:border-white/40 resize-none"
            />
          ) : (
            <p className="text-sm text-white/80 leading-relaxed">
              {profile?.biography || (
                <span className="text-white/40 flex items-center justify-center gap-2">
                  <Plus size={16} />
                  Add your bio
                </span>
              )}
            </p>
          )}
        </div>
      </div>

      {/* Date Edit Modal */}
      {editingField === 'date_of_birth' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setEditingField(null)}>
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-700" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-white font-semibold mb-4">Your Birthday</h3>
            <input
              type="date"
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setEditingField(null)} className="px-4 py-2 text-gray-400">Cancel</button>
              <button onClick={saveEdit} className="px-4 py-2 bg-purple-600 text-white rounded-lg">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
