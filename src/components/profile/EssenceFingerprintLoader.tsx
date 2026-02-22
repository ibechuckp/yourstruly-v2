'use client'

import dynamic from 'next/dynamic'
import { EssenceVector } from '@/lib/essence'

// Dynamic import to avoid SSR issues with Three.js
const EssenceFingerprint = dynamic(
  () => import('./EssenceFingerprint'),
  { 
    ssr: false,
    loading: () => (
      <div className="relative" style={{ width: 200, height: 200 }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full border-2 border-[#406A56]/20 border-t-[#406A56] animate-spin" />
        </div>
        <div 
          className="absolute inset-0 rounded-full opacity-20 blur-xl"
          style={{
            background: 'radial-gradient(circle, #406A5640 0%, transparent 70%)'
          }}
        />
      </div>
    )
  }
)

interface Props {
  essenceVector: EssenceVector
  size?: number
  className?: string
}

export default function EssenceFingerprintLoader({ essenceVector, size = 200, className = '' }: Props) {
  return <EssenceFingerprint essenceVector={essenceVector} size={size} className={className} />
}
