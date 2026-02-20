'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Edit2, Trash2, X, Heart } from 'lucide-react'

interface Pet {
  id: string
  name: string
  species: string
  breed?: string
  date_of_birth?: string
  adoption_date?: string
  color?: string
  personality?: string
  favorite_things?: string[]
  medical_notes?: string
  is_deceased: boolean
  date_of_passing?: string
}

const speciesOptions = ['Dog', 'Cat', 'Bird', 'Fish', 'Rabbit', 'Hamster', 'Guinea Pig', 'Turtle', 'Snake', 'Lizard', 'Horse', 'Other']

const speciesEmoji: Record<string, string> = {
  Dog: '🐕',
  Cat: '🐈',
  Bird: '🐦',
  Fish: '🐟',
  Rabbit: '🐰',
  Hamster: '🐹',
  'Guinea Pig': '🐹',
  Turtle: '🐢',
  Snake: '🐍',
  Lizard: '🦎',
  Horse: '🐴',
  Other: '🐾',
}

export default function PetsPage() {
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingPet, setEditingPet] = useState<Pet | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadPets()
  }, [])

  const loadPets = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('pets')
      .select('*')
      .eq('user_id', user.id)
      .order('name')

    setPets(data || [])
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this pet?')) return
    await supabase.from('pets').delete().eq('id', id)
    setPets(pets.filter(p => p.id !== id))
  }

  const openEdit = (pet: Pet) => {
    setEditingPet(pet)
    setShowModal(true)
  }

  const openNew = () => {
    setEditingPet(null)
    setShowModal(true)
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">Loading pets...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Pets</h1>
          <p className="text-gray-400 mt-1">Your furry, feathered, and scaly family members.</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-medium transition-colors"
        >
          <Plus size={18} />
          Add Pet
        </button>
      </div>

      {/* Pets Grid */}
      {pets.length === 0 ? (
        <div className="bg-gray-900 rounded-xl p-12 border border-gray-800 text-center">
          <Heart className="mx-auto text-gray-600 mb-4" size={48} />
          <h3 className="text-xl font-semibold text-white mb-2">No pets yet</h3>
          <p className="text-gray-400 mb-4">Add your beloved pets to your life story.</p>
          <button
            onClick={openNew}
            className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-medium transition-colors"
          >
            Add Your First Pet
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pets.map(pet => (
            <div 
              key={pet.id} 
              className={`bg-gray-900 rounded-xl p-5 border ${pet.is_deceased ? 'border-gray-700 opacity-75' : 'border-gray-800 hover:border-pink-500/50'} transition-colors`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-600 to-orange-600 flex items-center justify-center text-2xl">
                    {speciesEmoji[pet.species] || '🐾'}
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{pet.name}</h3>
                    <p className="text-gray-400 text-sm">{pet.species}{pet.breed ? ` · ${pet.breed}` : ''}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(pet)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(pet.id)} className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="space-y-1 text-sm">
                {pet.color && <p className="text-gray-400">Color: {pet.color}</p>}
                {pet.personality && <p className="text-gray-400">{pet.personality}</p>}
                {pet.is_deceased && (
                  <p className="text-gray-500 italic">
                    🌈 Rainbow Bridge {pet.date_of_passing ? `· ${new Date(pet.date_of_passing).toLocaleDateString()}` : ''}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <PetModal
          pet={editingPet}
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); loadPets() }}
        />
      )}
    </div>
  )
}

function PetModal({
  pet,
  onClose,
  onSave,
}: {
  pet: Pet | null
  onClose: () => void
  onSave: () => void
}) {
  const [form, setForm] = useState({
    name: pet?.name || '',
    species: pet?.species || '',
    breed: pet?.breed || '',
    date_of_birth: pet?.date_of_birth || '',
    adoption_date: pet?.adoption_date || '',
    color: pet?.color || '',
    personality: pet?.personality || '',
    favorite_things: pet?.favorite_things?.join(', ') || '',
    medical_notes: pet?.medical_notes || '',
    is_deceased: pet?.is_deceased || false,
    date_of_passing: pet?.date_of_passing || '',
  })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const handleSave = async () => {
    if (!form.name || !form.species) return
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const data = {
      name: form.name,
      species: form.species,
      breed: form.breed || null,
      date_of_birth: form.date_of_birth || null,
      adoption_date: form.adoption_date || null,
      color: form.color || null,
      personality: form.personality || null,
      favorite_things: form.favorite_things ? form.favorite_things.split(',').map(s => s.trim()).filter(Boolean) : [],
      medical_notes: form.medical_notes || null,
      is_deceased: form.is_deceased,
      date_of_passing: form.is_deceased ? (form.date_of_passing || null) : null,
    }

    if (pet) {
      await supabase.from('pets').update(data).eq('id', pet.id)
    } else {
      await supabase.from('pets').insert({ ...data, user_id: user.id })
    }

    setSaving(false)
    onSave()
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-700 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">
            {pet ? 'Edit Pet' : 'Add Pet'}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Name *</label>
              <input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="Buddy"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Species *</label>
              <select
                value={form.species}
                onChange={e => setForm({ ...form, species: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                <option value="">Select...</option>
                {speciesOptions.map(s => (
                  <option key={s} value={s}>{speciesEmoji[s]} {s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Breed</label>
              <input
                value={form.breed}
                onChange={e => setForm({ ...form, breed: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="Golden Retriever"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Color</label>
              <input
                value={form.color}
                onChange={e => setForm({ ...form, color: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="Golden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Date of Birth</label>
              <input
                type="date"
                value={form.date_of_birth}
                onChange={e => setForm({ ...form, date_of_birth: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Adoption Date</label>
              <input
                type="date"
                value={form.adoption_date}
                onChange={e => setForm({ ...form, adoption_date: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Personality</label>
            <textarea
              value={form.personality}
              onChange={e => setForm({ ...form, personality: e.target.value })}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
              rows={2}
              placeholder="Playful, loves belly rubs..."
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Favorite Things (comma-separated)</label>
            <input
              value={form.favorite_things}
              onChange={e => setForm({ ...form, favorite_things: e.target.value })}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="Treats, squeaky toys, naps"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Medical Notes</label>
            <textarea
              value={form.medical_notes}
              onChange={e => setForm({ ...form, medical_notes: e.target.value })}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
              rows={2}
              placeholder="Allergies, medications, vet info..."
            />
          </div>

          <div className="p-4 bg-gray-800/50 rounded-lg">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_deceased}
                onChange={e => setForm({ ...form, is_deceased: e.target.checked })}
                className="w-5 h-5 rounded border-gray-700 bg-gray-800 text-pink-500 focus:ring-pink-500"
              />
              <span className="text-gray-300">This pet has passed away 🌈</span>
            </label>
            {form.is_deceased && (
              <div className="mt-3">
                <label className="block text-sm text-gray-400 mb-1">Date of Passing</label>
                <input
                  type="date"
                  value={form.date_of_passing}
                  onChange={e => setForm({ ...form, date_of_passing: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.name || !form.species}
            className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Pet'}
          </button>
        </div>
      </div>
    </div>
  )
}
