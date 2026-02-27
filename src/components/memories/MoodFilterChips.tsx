'use client'

import { MOOD_DEFINITIONS, MoodType } from '@/lib/ai/moodAnalysis'

interface MoodFilterChipsProps {
  selectedMood: MoodType | null
  onMoodSelect: (mood: MoodType | null) => void
  moodCounts?: Record<string, number>
}

export default function MoodFilterChips({
  selectedMood,
  onMoodSelect,
  moodCounts = {}
}: MoodFilterChipsProps) {
  const moods: MoodType[] = ['joyful', 'proud', 'grateful', 'bittersweet', 'peaceful', 'nostalgic', 'loving']

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {/* All moods button */}
      <button
        onClick={() => onMoodSelect(null)}
        className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
          selectedMood === null
            ? 'bg-[#406A56] text-white'
            : 'bg-white/80 text-[#406A56] hover:bg-white border border-[#406A56]/20'
        }`}
      >
        All Moods
      </button>

      {/* Individual mood chips */}
      {moods.map((mood) => {
        const def = MOOD_DEFINITIONS[mood]
        const count = moodCounts[mood] || 0
        const isSelected = selectedMood === mood

        return (
          <button
            key={mood}
            onClick={() => onMoodSelect(isSelected ? null : mood)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              isSelected
                ? 'text-white'
                : 'bg-white/80 hover:bg-white border border-[#406A56]/20'
            }`}
            style={{
              backgroundColor: isSelected ? def.color : undefined,
              color: isSelected ? 'white' : def.color
            }}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: isSelected ? 'white' : def.color }} />
            <span>{def.label}</span>
            {count > 0 && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-xs ${
                  isSelected ? 'bg-white/20' : 'bg-current/10'
                }`}
              >
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
