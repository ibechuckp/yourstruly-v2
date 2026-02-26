/**
 * OAuth Popup Callback Handler
 * 
 * This page handles the OAuth redirect from Google when using popup mode.
 * It receives the authorization code and posts it to the parent window.
 */

'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function GoogleOAuthCallbackPage() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    if (window.opener) {
      if (error) {
        window.opener.postMessage(
          { 
            type: 'GOOGLE_OAUTH_ERROR', 
            error: errorDescription || error 
          },
          window.location.origin
        )
      } else if (code && state) {
        window.opener.postMessage(
          { 
            type: 'GOOGLE_OAUTH_CALLBACK', 
            code, 
            state 
          },
          window.location.origin
        )
      }
      
      // Close the popup after a brief delay
      setTimeout(() => window.close(), 500)
    }
  }, [searchParams])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F2F1E5]">
      <Loader2 size={48} className="text-[#406A56] animate-spin mb-4" />
      <p className="text-[#666]">Completing authorization...</p>
      <p className="text-sm text-[#888] mt-2">You can close this window if it doesn&apos;t close automatically</p>
    </div>
  )
}
