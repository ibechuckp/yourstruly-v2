'use client'

import { useState } from 'react'
import { Camera, Image, Video, Heart, Users, Calendar, Sparkles, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import TimelineScroller from '@/components/ui/TimelineScroller'
import CategoryBadge, { CategoryGrid } from '@/components/ui/CategoryBadge'
import GlassCard, { StatsGlassCard, PhotoGlassCard } from '@/components/ui/GlassCard'
import VoiceInput, { VoiceInputButton } from '@/components/ui/VoiceInput'
import '@/styles/page-styles.css'

// Demo data
const DEMO_CATEGORIES = [
  { name: 'travel', count: 625, coverUrl: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400' },
  { name: 'family', count: 342, coverUrl: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400' },
  { name: 'food', count: 189, coverUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400' },
  { name: 'celebration', count: 156, coverUrl: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400' },
  { name: 'pets', count: 98, coverUrl: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400' },
  { name: 'vacation', count: 234, coverUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400' },
  { name: 'kids', count: 445, coverUrl: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400' },
  { name: 'birthday', count: 67, coverUrl: 'https://images.unsplash.com/photo-1464349153735-7db50ed83c84?w=400' },
]

const DEMO_MEMORIES = [
  { id: '1', title: 'Summer in Barcelona', date: 'Aug 15, 2025', category: 'travel', imageUrl: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=400' },
  { id: '2', title: 'Emma\'s 5th Birthday', date: 'Jul 22, 2025', category: 'birthday', imageUrl: 'https://images.unsplash.com/photo-1558636508-e0db3814bd1d?w=400' },
  { id: '3', title: 'Sunday Brunch', date: 'Jul 14, 2025', category: 'food', imageUrl: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=400' },
]

export default function ExplorePage() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [voiceQuery, setVoiceQuery] = useState('')

  const handleVoiceInput = (text: string) => {
    setVoiceQuery(text)
    // In real app, this would trigger a search or action
    console.log('Voice input:', text)
  }

  return (
    <div className="page-container">
      {/* Warm gradient background with blobs */}
      <div className="page-background">
        <div className="page-blob page-blob-1" />
        <div className="page-blob page-blob-2" />
        <div className="page-blob page-blob-3" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="mb-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="page-header-back">
              <ChevronLeft size={20} />
            </Link>
            <div>
              <p className="text-[#406A56]/60 text-sm">Welcome back,</p>
              <h1 className="page-header-title">Good Afternoon</h1>
            </div>
          </div>
        </header>

        {/* Timeline Scroller */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-[#406A56] mb-4">Browse by Time</h2>
          <GlassCard variant="warm" padding="sm">
            <TimelineScroller
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              startDate={new Date(2020, 0, 1)}
            />
          </GlassCard>
          <p className="text-sm text-[#406A56]/60 mt-2 text-center">
            Viewing: {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </section>

        {/* Voice Input */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-[#406A56] mb-4 flex items-center gap-2">
            <Sparkles size={20} className="text-[#D9C61A]" />
            Ask YoursTruly
          </h2>
          <VoiceInput
            onTranscript={handleVoiceInput}
            placeholder="Find memories with my family from last summer..."
          />
          {voiceQuery && (
            <GlassCard variant="light" padding="md" className="mt-4">
              <p className="text-sm text-[#406A56]/60">You asked:</p>
              <p className="text-[#406A56]">"{voiceQuery}"</p>
            </GlassCard>
          )}
        </section>

        {/* Stats */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-[#406A56] mb-4">Your Memory Stats</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatsGlassCard
              icon={<Image size={20} />}
              label="Photos"
              value="2,456"
              trend={{ value: 12, label: 'this month' }}
            />
            <StatsGlassCard
              icon={<Video size={20} />}
              label="Videos"
              value="89"
            />
            <StatsGlassCard
              icon={<Users size={20} />}
              label="People"
              value="34"
            />
            <StatsGlassCard
              icon={<Heart size={20} />}
              label="Favorites"
              value="156"
            />
          </div>
        </section>

        {/* Categories with badges */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-[#406A56] mb-4">Browse by Category</h2>
          <CategoryGrid categories={DEMO_CATEGORIES} />
        </section>

        {/* Recent memories */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-[#406A56] mb-4">Recent Memories</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {DEMO_MEMORIES.map((memory) => (
              <PhotoGlassCard
                key={memory.id}
                imageUrl={memory.imageUrl}
                title={memory.title}
                date={memory.date}
                category={memory.category}
              />
            ))}
          </div>
        </section>

        {/* Standalone badges demo */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-[#406A56] mb-4">Category Badges</h2>
          <GlassCard variant="warm" padding="md">
            <div className="flex flex-wrap gap-2">
              <CategoryBadge category="travel" count={625} variant="standalone" />
              <CategoryBadge category="family" count={342} variant="standalone" />
              <CategoryBadge category="food" count={189} variant="standalone" />
              <CategoryBadge category="celebration" count={156} variant="standalone" />
              <CategoryBadge category="pets" count={98} variant="standalone" />
              <CategoryBadge category="vacation" count={234} variant="standalone" />
            </div>
          </GlassCard>
        </section>
      </div>

      {/* Compact voice button */}
      <div className="fixed bottom-6 right-6 z-20">
        <GlassCard variant="warm" padding="sm" className="flex items-center gap-3">
          <span className="text-sm text-[#406A56]">Voice search</span>
          <VoiceInputButton onTranscript={handleVoiceInput} />
        </GlassCard>
      </div>
    </div>
  )
}
