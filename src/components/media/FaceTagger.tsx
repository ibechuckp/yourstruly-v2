'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User, Check, X, Sparkles, Plus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Face {
  id: string
  boundingBox: {
    x: number
    y: number
    width: number
    height: number
  }
  confidence: number
  age?: number
  gender?: string
  expression?: string
  tagged: boolean
  contact?: {
    id: string
    full_name: string
    photo_url?: string
  }
  suggestions: Array<{
    contact: {
      id: string
      full_name: string
      photo_url?: string
    }
    confidence: number
  }>
}

interface Contact {
  id: string
  full_name: string
  photo_url?: string
}

interface FaceTaggerProps {
  mediaId: string
  imageUrl: string
  onXPEarned?: (amount: number, action: string) => void
}

export default function FaceTagger({ mediaId, imageUrl, onXPEarned }: FaceTaggerProps) {
  const [faces, setFaces] = useState<Face[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFace, setSelectedFace] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAllContacts, setShowAllContacts] = useState(false)
  
  const supabase = createClient()

  useEffect(() => {
    loadFaces()
    loadContacts()
  }, [mediaId])

  const loadFaces = async () => {
    const res = await fetch(`/api/media/${mediaId}/faces`)
    if (res.ok) {
      const data = await res.json()
      setFaces(data.faces || [])
    }
    setLoading(false)
  }

  const loadContacts = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('contacts')
      .select('id, full_name, photo_url')
      .eq('user_id', user.id)
      .order('full_name')

    setContacts(data || [])
  }

  const tagFace = async (faceId: string, contactId: string) => {
    const res = await fetch(`/api/media/${mediaId}/tag`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ faceId, contactId }),
    })

    if (res.ok) {
      const data = await res.json()
      if (data.xpAwarded && onXPEarned) {
        onXPEarned(data.xpAwarded, 'Tagged a person')
      }
      
      // Update local state
      setFaces(prev => prev.map(f => {
        if (f.id === faceId) {
          const contact = contacts.find(c => c.id === contactId)
          return { ...f, tagged: true, contact, suggestions: [] }
        }
        return f
      }))
      setSelectedFace(null)
      setSearchQuery('')
      setShowAllContacts(false)
    }
  }

  const untagFace = async (faceId: string) => {
    const res = await fetch(`/api/media/${mediaId}/tag`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ faceId }),
    })

    if (res.ok) {
      await loadFaces() // Reload to get fresh suggestions
    }
  }

  const filteredContacts = contacts.filter(c =>
    c.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const untaggedFaces = faces.filter(f => !f.tagged)
  const taggedFaces = faces.filter(f => f.tagged)

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Photo with face boxes */}
      <div className="relative rounded-xl overflow-hidden bg-black">
        <img src={imageUrl} alt="" className="w-full" />
        
        {/* Face bounding boxes */}
        {faces.map(face => (
          <div
            key={face.id}
            className={`absolute border-2 rounded cursor-pointer transition-all ${
              face.tagged 
                ? 'border-green-500 bg-green-500/10' 
                : selectedFace === face.id
                  ? 'border-amber-500 bg-amber-500/20'
                  : 'border-white/50 hover:border-amber-400'
            }`}
            style={{
              left: `${face.boundingBox.x * 100}%`,
              top: `${face.boundingBox.y * 100}%`,
              width: `${face.boundingBox.width * 100}%`,
              height: `${face.boundingBox.height * 100}%`,
            }}
            onClick={() => !face.tagged && setSelectedFace(face.id === selectedFace ? null : face.id)}
          >
            {/* Tag label */}
            {face.tagged && face.contact && (
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <span className="px-2 py-0.5 bg-green-600 text-white text-xs rounded-full">
                  {face.contact.full_name}
                </span>
              </div>
            )}
            
            {/* Untagged indicator */}
            {!face.tagged && face.suggestions.length > 0 && (
              <div className="absolute -top-2 -right-2">
                <div className="w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                  <Sparkles size={10} className="text-white" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Face tagging panel */}
      <AnimatePresence>
        {selectedFace && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="bg-gray-900 rounded-xl p-4 border border-gray-800"
          >
            {(() => {
              const face = faces.find(f => f.id === selectedFace)
              if (!face) return null

              return (
                <div className="space-y-3">
                  {/* Face info */}
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-white/70">
                      {face.age && <span>~{face.age} years</span>}
                      {face.gender && <span className="ml-2">• {face.gender}</span>}
                      {face.expression && <span className="ml-2">• {face.expression}</span>}
                    </div>
                    <button
                      onClick={() => setSelectedFace(null)}
                      className="p-1 text-white/50 hover:text-white"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Suggestions */}
                  {face.suggestions.length > 0 && !showAllContacts && (
                    <div className="space-y-2">
                      <p className="text-xs text-amber-500 flex items-center gap-1">
                        <Sparkles size={12} />
                        Suggested matches
                      </p>
                      {face.suggestions.map(s => (
                        <button
                          key={s.contact.id}
                          onClick={() => tagFace(face.id, s.contact.id)}
                          className="w-full flex items-center gap-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <div className="w-8 h-8 rounded-full bg-amber-600/30 flex items-center justify-center overflow-hidden">
                            {s.contact.photo_url ? (
                              <img src={s.contact.photo_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <User size={16} className="text-amber-500" />
                            )}
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-white text-sm">{s.contact.full_name}</p>
                            <p className="text-white/50 text-xs">{Math.round(s.confidence)}% match</p>
                          </div>
                          <Check size={16} className="text-green-500" />
                        </button>
                      ))}
                      <button
                        onClick={() => setShowAllContacts(true)}
                        className="w-full text-center text-sm text-amber-500 hover:text-amber-400 py-2"
                      >
                        Show all contacts
                      </button>
                    </div>
                  )}

                  {/* All contacts search */}
                  {(face.suggestions.length === 0 || showAllContacts) && (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search contacts..."
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                        autoFocus
                      />
                      <div className="max-h-48 overflow-y-auto space-y-1">
                        {filteredContacts.map(contact => (
                          <button
                            key={contact.id}
                            onClick={() => tagFace(face.id, contact.id)}
                            className="w-full flex items-center gap-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                          >
                            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                              {contact.photo_url ? (
                                <img src={contact.photo_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-white/50 text-sm">
                                  {contact.full_name.charAt(0)}
                                </span>
                              )}
                            </div>
                            <span className="text-white text-sm">{contact.full_name}</span>
                          </button>
                        ))}
                        {filteredContacts.length === 0 && (
                          <p className="text-center text-white/50 text-sm py-4">
                            No contacts found
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary */}
      {faces.length > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/50">
            {taggedFaces.length} of {faces.length} people tagged
          </span>
          {untaggedFaces.length > 0 && (
            <span className="text-amber-500">
              +{untaggedFaces.length * 5} XP available
            </span>
          )}
        </div>
      )}

      {/* Tagged people list */}
      {taggedFaces.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {taggedFaces.map(face => (
            <div
              key={face.id}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-full group"
            >
              <div className="w-5 h-5 rounded-full bg-green-600/30 flex items-center justify-center overflow-hidden">
                {face.contact?.photo_url ? (
                  <img src={face.contact.photo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User size={12} className="text-green-500" />
                )}
              </div>
              <span className="text-white text-sm">{face.contact?.full_name}</span>
              <button
                onClick={() => untagFace(face.id)}
                className="opacity-0 group-hover:opacity-100 text-white/50 hover:text-red-400 transition-opacity"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* No faces detected */}
      {faces.length === 0 && (
        <div className="text-center py-8 text-white/50">
          <User size={32} className="mx-auto mb-2 opacity-50" />
          <p>No faces detected in this photo</p>
        </div>
      )}
    </div>
  )
}
