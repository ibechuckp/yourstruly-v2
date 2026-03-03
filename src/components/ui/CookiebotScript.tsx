'use client'

import { useEffect } from 'react'

/**
 * Cookiebot GDPR Cookie Consent Script
 * Only loads in production (Cookiebot doesn't work on localhost)
 * Client component to avoid SSR hydration mismatches
 */
export function CookiebotScript() {
  useEffect(() => {
    // Only load in production and in browser
    if (process.env.NODE_ENV !== 'production') return
    if (typeof window === 'undefined') return
    
    // Check if already loaded
    if (document.getElementById('Cookiebot')) return
    
    const script = document.createElement('script')
    script.id = 'Cookiebot'
    script.src = 'https://consent.cookiebot.com/uc.js'
    script.setAttribute('data-cbid', '4c3722ae-6bc8-454a-9330-fdad835a58cc')
    script.setAttribute('data-blockingmode', 'auto')
    script.type = 'text/javascript'
    script.async = true
    
    document.head.appendChild(script)
    
    return () => {
      // Cleanup on unmount (unlikely in layout but good practice)
      const existingScript = document.getElementById('Cookiebot')
      if (existingScript) {
        existingScript.remove()
      }
    }
  }, [])
  
  return null
}
