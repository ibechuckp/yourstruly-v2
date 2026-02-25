'use client'

import { QRCodeSVG } from 'qrcode.react'

interface QRCodeGeneratorProps {
  memoryId: string
  size?: number
  includeMargin?: boolean
}

// Generate the authenticated view URL for a memory
export function getMemoryViewUrl(memoryId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://yourstruly.love'
  return `${baseUrl}/view/${memoryId}`
}

// Simple QR code component for embedding in photobook pages
export default function QRCodeGenerator({ 
  memoryId, 
  size = 80, 
  includeMargin = true 
}: QRCodeGeneratorProps) {
  const url = getMemoryViewUrl(memoryId)
  
  return (
    <div className="bg-white p-1 rounded shadow-sm">
      <QRCodeSVG
        value={url}
        size={size}
        level="M"
        includeMargin={includeMargin}
        style={{ display: 'block' }}
      />
    </div>
  )
}

// URL-based QR code for server-side rendering (for print)
export function getQRCodeImageUrl(memoryId: string, size: number = 80): string {
  const viewUrl = getMemoryViewUrl(memoryId)
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(viewUrl)}&format=png&margin=2`
}
