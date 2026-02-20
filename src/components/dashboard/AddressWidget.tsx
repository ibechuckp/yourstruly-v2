'use client'

import { useState, useEffect, useRef } from 'react'
import { MapPin, Search, X } from 'lucide-react'
import Modal from '@/components/ui/Modal'

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
        interactive: false,
        attributionControl: false, // Hide attribution
        logoPosition: 'bottom-left'
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

  useEffect(() => {
    if (showModal) setForm({ address, city, state, country })
  }, [showModal, address, city, state, country])

  const save = () => {
    onUpdate('address', form.address)
    onUpdate('city', form.city)
    onUpdate('state', form.state)
    onUpdate('country', form.country)
    setShowModal(false)
  }

  return (
    <>
      <div 
        className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-4 cursor-pointer transition-colors"
        onClick={() => setShowModal(true)}
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

        {/* Map - hide all Mapbox branding */}
        <div 
          ref={mapContainerRef}
          className="w-full h-24 bg-gray-900/50 rounded-lg mb-3 overflow-hidden relative [&_.mapboxgl-ctrl]:!hidden [&_.mapboxgl-ctrl-logo]:!hidden [&_.mapboxgl-ctrl-attrib]:!hidden"
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
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Your Address" showDone={false}>
        <div className="space-y-4">
          <input
            type="text"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="Street address"
            className="w-full px-4 py-3 bg-gray-900/80 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              placeholder="City"
              className="px-4 py-3 bg-gray-900/80 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <input
              type="text"
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              placeholder="State"
              className="px-4 py-3 bg-gray-900/80 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <input
            type="text"
            value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
            placeholder="Country"
            className="w-full px-4 py-3 bg-gray-900/80 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-800">
          <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">
            Cancel
          </button>
          <button onClick={save} className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors">
            Save
          </button>
        </div>
      </Modal>
    </>
  )
}
