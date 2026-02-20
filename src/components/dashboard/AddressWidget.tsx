'use client'

import { useState, useEffect, useRef } from 'react'
import { MapPin, Search, X } from 'lucide-react'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

interface AddressWidgetProps {
  address: string
  city: string
  state: string
  country: string
  onUpdate: (field: string, value: string) => void
}

export default function AddressWidget({ address, city, state, country, onUpdate }: AddressWidgetProps) {
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ address, city, state, country })
  const [coordinates, setCoordinates] = useState<[number, number] | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)

  const fullAddress = [city, state, country].filter(Boolean).join(', ')

  // Geocode address to get coordinates
  useEffect(() => {
    if (fullAddress) {
      fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(fullAddress)}.json?access_token=${MAPBOX_TOKEN}&limit=1`)
        .then(res => res.json())
        .then(data => {
          if (data.features?.[0]?.center) {
            setCoordinates(data.features[0].center as [number, number])
          }
        })
        .catch(console.error)
    }
  }, [fullAddress])

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || !coordinates) return
    if (typeof window === 'undefined') return

    // Dynamically import mapbox
    import('mapbox-gl').then((mapboxgl) => {
      mapboxgl.default.accessToken = MAPBOX_TOKEN

      if (mapRef.current) {
        mapRef.current.setCenter(coordinates)
        return
      }

      mapRef.current = new mapboxgl.default.Map({
        container: mapContainerRef.current!,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: coordinates,
        zoom: 10,
        interactive: false
      })

      new mapboxgl.default.Marker({ color: '#8B5CF6' })
        .setLngLat(coordinates)
        .addTo(mapRef.current)
    })

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [coordinates])

  const save = () => {
    onUpdate('address', form.address)
    onUpdate('city', form.city)
    onUpdate('state', form.state)
    onUpdate('country', form.country)
    setShowModal(false)
  }

  return (
    <div 
      className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-4 cursor-pointer hover:bg-white/15 transition-colors"
      onClick={() => { setForm({ address, city, state, country }); setShowModal(true); }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MapPin size={16} className="text-white/70" />
          <span className="text-white font-medium text-sm">Address</span>
        </div>
        <button className="text-white/50 hover:text-white">
          <Search size={16} />
        </button>
      </div>

      {/* Map */}
      <div 
        ref={mapContainerRef}
        className="w-full h-24 bg-gray-800/50 rounded-lg mb-3 overflow-hidden"
      >
        {!coordinates && (
          <div className="w-full h-full flex items-center justify-center text-white/30 text-xs">
            🗺️ Map
          </div>
        )}
      </div>

      {fullAddress ? (
        <div className="flex items-start gap-2">
          <MapPin size={14} className="text-white/50 mt-0.5 shrink-0" />
          <p className="text-white/70 text-sm leading-tight">
            {address && `${address}, `}{fullAddress}
          </p>
        </div>
      ) : (
        <p className="text-white/40 text-sm">Search your address</p>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Your Address</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Street address"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="City"
                  className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none"
                />
                <input
                  type="text"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  placeholder="State"
                  className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none"
                />
              </div>
              <input
                type="text"
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                placeholder="Country"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-400">Cancel</button>
              <button onClick={save} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
