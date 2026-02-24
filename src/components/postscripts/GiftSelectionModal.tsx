'use client'

import React, { useState, useEffect } from 'react'
import { 
  X, Gift, Search, ShoppingBag, Heart, Calendar,
  ChevronRight, Clock, Package, Sparkles, Loader2,
  CheckCircle2, AlertCircle
} from 'lucide-react'
import Image from 'next/image'

export type ProductProvider = 'floristone' | 'doba' | 'printful'

export interface GiftProduct {
  id: string
  name: string
  description: string
  price: number
  originalPrice?: number
  currency: string
  images: string[]
  thumbnail: string
  provider: ProductProvider
  category?: string
  inStock: boolean
  variants?: Array<{
    id: string
    name: string
    price: number
    inStock: boolean
  }>
}

export interface GiftSelection {
  product: GiftProduct
  variantId?: string
  quantity: number
  deliveryTiming: 'with_postscript' | 'specific_date' | 'relative_event'
  deliveryDate?: string
  deliveryEvent?: string
  deliveryOffsetDays?: number
}

interface GiftSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (selection: GiftSelection) => void
  preselectedContactId?: string
  preselectedContactName?: string
}

// Holiday options for relative delivery
const HOLIDAY_OPTIONS = [
  { key: 'christmas', label: 'Christmas', icon: '🎄' },
  { key: 'easter', label: 'Easter', icon: '🐰' },
  { key: 'thanksgiving', label: 'Thanksgiving', icon: '🦃' },
  { key: 'mothers_day', label: "Mother's Day", icon: '💐' },
  { key: 'fathers_day', label: "Father's Day", icon: '👔' },
  { key: 'valentines', label: "Valentine's Day", icon: '❤️' },
]

// Event options for relative delivery
const EVENT_OPTIONS = [
  { key: 'birthday', label: 'Birthday', icon: '🎂' },
  { key: 'anniversary', label: 'Anniversary', icon: '💕' },
  { key: 'wedding', label: 'Wedding', icon: '💒' },
  { key: 'graduation', label: 'Graduation', icon: '🎓' },
]

// Delivery timing options
const TIMING_OPTIONS = [
  {
    key: 'with_postscript',
    label: 'With Message',
    description: 'Gift delivered at the same time as your PostScript',
    icon: Clock
  },
  {
    key: 'specific_date',
    label: 'Specific Date',
    description: 'Choose a specific calendar date for delivery',
    icon: Calendar
  },
  {
    key: 'relative_event',
    label: 'Special Occasion',
    description: 'Deliver for holidays or life events',
    icon: Sparkles
  }
]

// Mock products for demo - in production, these would come from the marketplace API
const MOCK_PRODUCTS: GiftProduct[] = [
  {
    id: 'FL-001',
    name: 'Dozen Red Roses',
    description: 'Classic long-stem red roses, perfect for expressing love and appreciation',
    price: 49.99,
    originalPrice: 39.99,
    currency: 'USD',
    images: ['https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400'],
    thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=200',
    provider: 'floristone',
    category: 'flowers',
    inStock: true
  },
  {
    id: 'FL-002',
    name: 'Spring Tulip Bouquet',
    description: 'Colorful mixed tulips arranged beautifully',
    price: 39.99,
    currency: 'USD',
    images: ['https://images.unsplash.com/photo-1520763185298-1b434c919102?w=400'],
    thumbnail: 'https://images.unsplash.com/photo-1520763185298-1b434c919102?w=200',
    provider: 'floristone',
    category: 'flowers',
    inStock: true
  },
  {
    id: 'FL-003',
    name: 'Orchid Plant',
    description: 'Elegant white orchid in decorative pot',
    price: 59.99,
    currency: 'USD',
    images: ['https://images.unsplash.com/photo-1566638761605-9f7b4385a5e0?w=400'],
    thumbnail: 'https://images.unsplash.com/photo-1566638761605-9f7b4385a5e0?w=200',
    provider: 'floristone',
    category: 'plants',
    inStock: true
  },
  {
    id: 'DO-001',
    name: 'Premium Chocolate Box',
    description: 'Assorted gourmet chocolates in elegant packaging',
    price: 34.99,
    currency: 'USD',
    images: ['https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=400'],
    thumbnail: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=200',
    provider: 'doba',
    category: 'gourmet',
    inStock: true
  },
  {
    id: 'DO-002',
    name: 'Cozy Throw Blanket',
    description: 'Soft knitted blanket, perfect for relaxing',
    price: 45.99,
    currency: 'USD',
    images: ['https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400'],
    thumbnail: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=200',
    provider: 'doba',
    category: 'home',
    inStock: true
  },
  {
    id: 'PF-001',
    name: 'Custom Photo Mug',
    description: 'Personalized ceramic mug with your photo',
    price: 24.99,
    currency: 'USD',
    images: ['https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400'],
    thumbnail: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=200',
    provider: 'printful',
    category: 'photo_gifts',
    inStock: true
  },
]

export function GiftSelectionModal({ 
  isOpen, 
  onClose, 
  onSelect,
  preselectedContactId,
  preselectedContactName 
}: GiftSelectionModalProps) {
  const [step, setStep] = useState<'browse' | 'configure' | 'confirm'>('browse')
  const [selectedProduct, setSelectedProduct] = useState<GiftProduct | null>(null)
  const [selectedVariant, setSelectedVariant] = useState<string | undefined>()
  const [quantity, setQuantity] = useState(1)
  const [deliveryTiming, setDeliveryTiming] = useState<'with_postscript' | 'specific_date' | 'relative_event'>('with_postscript')
  const [deliveryDate, setDeliveryDate] = useState('')
  const [deliveryEvent, setDeliveryEvent] = useState('')
  const [deliveryOffsetDays, setDeliveryOffsetDays] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep('browse')
      setSelectedProduct(null)
      setSelectedVariant(undefined)
      setQuantity(1)
      setDeliveryTiming('with_postscript')
      setDeliveryDate('')
      setDeliveryEvent('')
      setDeliveryOffsetDays(0)
      setSearchQuery('')
      setSelectedCategory(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  const filteredProducts = MOCK_PRODUCTS.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !selectedCategory || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const categories = Array.from(new Set(MOCK_PRODUCTS.map(p => p.category)))

  const handleProductSelect = (product: GiftProduct) => {
    setSelectedProduct(product)
    setStep('configure')
  }

  const handleConfirm = async () => {
    if (!selectedProduct) return
    
    setIsLoading(true)
    
    const selection: GiftSelection = {
      product: selectedProduct,
      variantId: selectedVariant,
      quantity,
      deliveryTiming,
      deliveryDate: deliveryDate || undefined,
      deliveryEvent: deliveryEvent || undefined,
      deliveryOffsetDays: deliveryOffsetDays || undefined
    }
    
    await onSelect(selection)
    setIsLoading(false)
    onClose()
  }

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(price)
  }

  const getProviderLabel = (provider: ProductProvider) => {
    switch (provider) {
      case 'floristone': return 'Flowers'
      case 'doba': return 'Gifts'
      case 'printful': return 'Custom'
      default: return provider
    }
  }

  const getProviderColor = (provider: ProductProvider) => {
    switch (provider) {
      case 'floristone': return 'bg-pink-100 text-pink-700'
      case 'doba': return 'bg-blue-100 text-blue-700'
      case 'printful': return 'bg-purple-100 text-purple-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-[#C35F33]/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C35F33] flex items-center justify-center">
              <Gift className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {step === 'browse' && 'Choose a Gift'}
                {step === 'configure' && 'Configure Gift'}
                {step === 'confirm' && 'Confirm Gift'}
              </h2>
              {preselectedContactName && (
                <p className="text-sm text-gray-500">
                  For {preselectedContactName}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'browse' && (
            <div className="space-y-6">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search gifts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl
                           focus:ring-2 focus:ring-[#C35F33]/20 focus:border-[#C35F33] outline-none"
                />
              </div>

              {/* Categories */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all
                    ${!selectedCategory 
                      ? 'bg-[#C35F33] text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  All Gifts
                </button>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat || null)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all capitalize
                      ${selectedCategory === cat 
                        ? 'bg-[#C35F33] text-white' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    {cat?.replace('_', ' ')}
                  </button>
                ))}
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts.map(product => (
                  <button
                    key={product.id}
                    onClick={() => handleProductSelect(product)}
                    className="group text-left bg-white border border-gray-200 rounded-xl overflow-hidden
                             hover:border-[#C35F33]/50 hover:shadow-lg transition-all"
                  >
                    <div className="aspect-square bg-gray-100 relative overflow-hidden">
                      <img
                        src={product.thumbnail}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium
                                     ${getProviderColor(product.provider)}`}>
                        {getProviderLabel(product.provider)}
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{product.name}</h3>
                      <p className="text-sm text-gray-500 mb-3 line-clamp-2">{product.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-[#C35F33]">
                          {formatPrice(product.price, product.currency)}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <ShoppingBag className="w-3 h-3" />
                          Select
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {filteredProducts.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500">No gifts found matching your search</p>
                </div>
              )}
            </div>
          )}

          {step === 'configure' && selectedProduct && (
            <div className="space-y-6">
              {/* Product Summary */}
              <div className="flex gap-4 p-4 bg-gray-50 rounded-xl">
                <img
                  src={selectedProduct.thumbnail}
                  alt={selectedProduct.name}
                  className="w-24 h-24 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{selectedProduct.name}</h3>
                  <p className="text-sm text-gray-500 mb-2">{selectedProduct.description}</p>
                  <span className="text-lg font-bold text-[#C35F33]">
                    {formatPrice(selectedProduct.price, selectedProduct.currency)}
                  </span>
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center
                             hover:bg-gray-50 transition-colors"
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-semibold text-lg">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center
                             hover:bg-gray-50 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Delivery Timing */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">When should this be delivered?</label>
                <div className="space-y-3">
                  {TIMING_OPTIONS.map(option => {
                    const Icon = option.icon
                    return (
                      <button
                        key={option.key}
                        onClick={() => setDeliveryTiming(option.key as typeof deliveryTiming)}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all
                          ${deliveryTiming === option.key
                            ? 'border-[#C35F33] bg-[#C35F33]/5'
                            : 'border-gray-200 hover:border-gray-300'
                          }`}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center
                                       ${deliveryTiming === option.key ? 'bg-[#C35F33] text-white' : 'bg-gray-100 text-gray-500'}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{option.label}</p>
                          <p className="text-sm text-gray-500">{option.description}</p>
                        </div>
                        {deliveryTiming === option.key && (
                          <CheckCircle2 className="w-5 h-5 text-[#C35F33]" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Delivery Date Picker */}
              {deliveryTiming === 'specific_date' && (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Select Delivery Date
                  </label>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg
                             focus:ring-2 focus:ring-[#C35F33]/20 focus:border-[#C35F33] outline-none"
                  />
                </div>
              )}

              {/* Relative Event Selector */}
              {deliveryTiming === 'relative_event' && (
                <div className="space-y-4">
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      <Sparkles className="w-4 h-4 inline mr-1" />
                      Select Occasion
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[...EVENT_OPTIONS, ...HOLIDAY_OPTIONS].map(event => (
                        <button
                          key={event.key}
                          onClick={() => setDeliveryEvent(event.key)}
                          className={`p-3 rounded-lg border text-left transition-all
                            ${deliveryEvent === event.key
                              ? 'border-[#C35F33] bg-[#C35F33]/10'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                        >
                          <span className="text-lg mr-1">{event.icon}</span>
                          <span className="text-sm font-medium">{event.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-xl">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Delivery Timing
                    </label>
                    <div className="flex items-center gap-3">
                      <select
                        value={deliveryOffsetDays}
                        onChange={(e) => setDeliveryOffsetDays(Number(e.target.value))}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-lg
                                 focus:ring-2 focus:ring-[#C35F33]/20 focus:border-[#C35F33] outline-none"
                      >
                        <option value={0}>On the day</option>
                        <option value={-1}>1 day before</option>
                        <option value={-2}>2 days before</option>
                        <option value={-3}>3 days before</option>
                        <option value={1}>1 day after</option>
                        <option value={2}>2 days after</option>
                      </select>
                      <span className="text-sm text-gray-500">
                        of the occasion
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Back Button */}
              <button
                onClick={() => setStep('browse')}
                className="text-[#C35F33] hover:underline text-sm"
              >
                ← Choose a different gift
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
          {step === 'browse' && (
            <p className="text-sm text-gray-500 text-center">
              Choose from our curated selection of gifts for your loved ones
            </p>
          )}
          
          {step === 'configure' && selectedProduct && (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-2xl font-bold text-[#C35F33]">
                  {formatPrice(selectedProduct.price * quantity, selectedProduct.currency)}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep('browse')}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isLoading || (deliveryTiming === 'specific_date' && !deliveryDate) || 
                           (deliveryTiming === 'relative_event' && !deliveryEvent)}
                  className="px-6 py-2 bg-[#C35F33] text-white rounded-lg font-medium
                           hover:bg-[#A84E2A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                           flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Gift className="w-4 h-4" />
                      Attach Gift
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default GiftSelectionModal
