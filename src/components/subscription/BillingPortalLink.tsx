'use client'

import { useState } from 'react'
import { ExternalLink, Loader2, CreditCard } from 'lucide-react'

interface BillingPortalLinkProps {
  className?: string
  children?: React.ReactNode
}

export function BillingPortalLink({ className = '', children }: BillingPortalLinkProps) {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      if (!res.ok) throw new Error('Failed to create portal session')
      const { url } = await res.json()
      if (url) window.location.href = url
    } catch (err) {
      console.error('Portal error:', err)
      alert('Failed to open billing portal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 ${className}`}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <CreditCard size={16} />
      )}
      {children || 'Manage Billing'}
      <ExternalLink size={14} className="opacity-50" />
    </button>
  )
}
