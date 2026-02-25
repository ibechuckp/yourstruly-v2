'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Heart, 
  MapPin, 
  Calendar, 
  Lock, 
  AlertCircle,
  User,
  Play,
  Pause,
  Volume2,
  Gift,
  Sparkles,
  ArrowRight,
  Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface PublicMemoryViewProps {
  token: string
  data: {
    error?: string
    message?: string
    reason?: string
    access?: string
    contentType?: 'memory' | 'wisdom'
    content?: any
    sharedBy?: {
      full_name: string
      avatar_url: string
    }
    viewer?: {
      isLoggedIn: boolean
      userId: string | null
    }
  }
}

const MOOD_COLORS: Record<string, string> = {
  joyful: 'from-yellow-500/20 to-orange-500/20',
  peaceful: 'from-blue-500/20 to-cyan-500/20',
  adventurous: 'from-green-500/20 to-emerald-500/20',
  nostalgic: 'from-purple-500/20 to-pink-500/20',
  excited: 'from-red-500/20 to-orange-500/20',
  neutral: 'from-gray-500/20 to-gray-600/20',
}

const MOOD_ICONS: Record<string, string> = {
  joyful: '😊',
  peaceful: '😌',
  adventurous: '🏔️',
  nostalgic: '🌅',
  excited: '🎉',
  neutral: '📸',
}

export default function PublicMemoryView({ token, data }: PublicMemoryViewProps) {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  
  // Handle error states
  if (data.error) {
    return <AccessDeniedView error={data.error} message={data.message} reason={data.reason} />
  }
  
  if (!data.content || data.access !== 'granted') {
    return <AccessDeniedView error="unknown" message="Unable to load this memory" />
  }
  
  const content = data.content
  const sharedBy = data.sharedBy
  const isMemory = data.contentType === 'memory'
  
  const media = isMemory ? content.memory_media || [] : []
  const currentMedia = media[currentMediaIndex]
  
  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }
  
  const moodGradient = isMemory ? MOOD_COLORS[content.ai_mood] || MOOD_COLORS.neutral : MOOD_COLORS.nostalgic
  const moodEmoji = isMemory ? MOOD_ICONS[content.ai_mood] || MOOD_ICONS.neutral : '💎'
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Heart className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="text-white font-semibold text-lg">YoursTruly</span>
          </Link>
          
          {!data.viewer?.isLoggedIn && (
            <Link href="/auth/login">
              <Button variant="ghost" size="sm" className="text-white/80 hover:text-white">
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Shared By Banner */}
        {sharedBy && (
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 border border-white/10">
              {sharedBy.avatar_url ? (
                <img 
                  src={sharedBy.avatar_url} 
                  alt={sharedBy.full_name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-amber-500/50"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border-2 border-amber-500/50">
                  <User className="w-5 h-5 text-amber-400" />
                </div>
              )}
              <div className="text-left">
                <p className="text-white/60 text-sm">This memory was shared with you by</p>
                <p className="text-white font-medium">{sharedBy.full_name}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Memory Card */}
        <Card className="bg-gray-800/50 border-white/10 overflow-hidden">
          {/* Media Section */}
          {currentMedia && (
            <div className="relative aspect-video bg-black">
              {currentMedia.file_type === 'video' ? (
                <div className="relative w-full h-full">
                  <video
                    src={currentMedia.file_url}
                    className="w-full h-full object-contain"
                    controls
                    poster={media.find((m: { file_type: string; file_url: string }) => m.file_type === 'image')?.file_url}
                  />
                </div>
              ) : (
                <img
                  src={currentMedia.file_url}
                  alt={content.title || 'Memory'}
                  className="w-full h-full object-contain"
                />
              )}
              
              {/* Media Navigation */}
              {media.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentMediaIndex(i => Math.max(0, i - 1))}
                    disabled={currentMediaIndex === 0}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white disabled:opacity-30 hover:bg-black/70 transition-colors"
                  >
                    ←
                  </button>
                  <button
                    onClick={() => setCurrentMediaIndex(i => Math.min(media.length - 1, i + 1))}
                    disabled={currentMediaIndex === media.length - 1}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white disabled:opacity-30 hover:bg-black/70 transition-colors"
                  >
                    →
                  </button>
                  
                  {/* Dots */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {media.map((_: unknown, i: number) => (
                      <button
                        key={i}
                        onClick={() => setCurrentMediaIndex(i)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          i === currentMediaIndex ? 'bg-white' : 'bg-white/40'
                        }`}
                      />
                    ))}
                  </div>
                  
                  {/* Counter */}
                  <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-sm">
                    {currentMediaIndex + 1} / {media.length}
                  </div>
                </>
              )}
            </div>
          )}
          
          {/* Content Section */}
          <CardContent className="p-6 md:p-8">
            {/* Title & Meta */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{moodEmoji}</span>
                {content.ai_category && (
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-sm font-medium">
                    {content.ai_category}
                  </span>
                )}
                {content.memory_type && (
                  <span className="px-3 py-1 rounded-full bg-white/10 text-white/70 text-sm capitalize">
                    {content.memory_type}
                  </span>
                )}
              </div>
              
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                {content.title || 'Untitled Memory'}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 text-white/60 text-sm">
                {content.memory_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(content.memory_date)}
                  </span>
                )}
                {content.location_name && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {content.location_name}
                  </span>
                )}
                {content.view_count > 0 && (
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-4 h-4" />
                    {content.view_count} views
                  </span>
                )}
              </div>
            </div>
            
            {/* Description */}
            {(content.description || content.ai_summary) && (
              <div className="mb-6">
                <p className="text-white/80 text-lg leading-relaxed whitespace-pre-wrap">
                  {content.description || content.ai_summary}
                </p>
              </div>
            )}
            
            {/* AI Labels */}
            {content.ai_labels && content.ai_labels.length > 0 && (
              <div className="mb-6">
                <p className="text-white/40 text-xs uppercase tracking-wider mb-2">AI Detected</p>
                <div className="flex flex-wrap gap-2">
                  {content.ai_labels.slice(0, 8).map((label: string, i: number) => (
                    <span 
                      key={i}
                      className="px-2 py-1 rounded bg-white/5 text-white/60 text-xs"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* CTA Section */}
        {!data.viewer?.isLoggedIn && (
          <div className="mt-8 text-center">
            <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
              <CardContent className="p-8">
                <Gift className="w-12 h-12 text-amber-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  Preserve Your Own Memories
                </h3>
                <p className="text-white/70 mb-6 max-w-md mx-auto">
                  Join {sharedBy?.full_name || 'thousands of others'} on YoursTruly to capture, 
                  preserve, and share your life's precious moments.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/auth/signup">
                    <Button 
                      size="lg"
                      className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
                    >
                      Create Your Account
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                  <Link href="/auth/login">
                    <Button 
                      variant="outline" 
                      size="lg"
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      Sign In
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Footer */}
        <footer className="mt-12 text-center text-white/40 text-sm">
          <p>Powered by YoursTruly — Preserve your legacy for generations</p>
        </footer>
      </main>
    </div>
  )
}

function AccessDeniedView({ 
  error, 
  message, 
  reason 
}: { 
  error: string
  message?: string
  reason?: string 
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4">
      <Card className="max-w-md w-full bg-gray-800/50 border-white/10">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-red-400" />
          </div>
          
          <h1 className="text-xl font-semibold text-white mb-2">
            Access Denied
          </h1>
          
          <p className="text-white/70 mb-6">
            {message || 'You do not have permission to view this content.'}
          </p>
          
          {reason && (
            <div className="mb-6 p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 text-amber-400 text-sm mb-1">
                <AlertCircle className="w-4 h-4" />
                <span className="font-medium">Why am I seeing this?</span>
              </div>
              <p className="text-white/60 text-sm">
                {reason === 'Not authorized' 
                  ? 'This memory was shared with specific people. If you believe you should have access, please contact the person who shared the QR code with you.'
                  : reason
                }
              </p>
            </div>
          )}
          
          <div className="flex flex-col gap-3">
            <Link href="/">
              <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white">
                Go to YoursTruly
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                Sign In with Different Account
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
