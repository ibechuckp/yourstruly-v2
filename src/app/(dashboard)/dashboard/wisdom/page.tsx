'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Lightbulb, Heart, Star, BookOpen, Quote, Play, ChevronRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface WisdomEntry {
  id: string;
  title: string;
  description: string;
  audio_url?: string;
  tags: string[];
  created_at: string;
  category?: string;
}

interface WisdomStats {
  total: number;
  categories: Record<string, number>;
  traits: {
    name: string;
    score: number;
    description: string;
  }[];
}

// Wisdom categories for the radar chart
const WISDOM_CATEGORIES = [
  { key: 'life_lessons', label: 'Life Lessons', icon: Lightbulb, color: '#D9C61A' },
  { key: 'relationships', label: 'Relationships', icon: Heart, color: '#C35F33' },
  { key: 'career', label: 'Career', icon: Star, color: '#406A56' },
  { key: 'values', label: 'Values', icon: Brain, color: '#4A3552' },
  { key: 'family', label: 'Family', icon: BookOpen, color: '#8DACAB' },
];

export default function WisdomPage() {
  const [entries, setEntries] = useState<WisdomEntry[]>([]);
  const [stats, setStats] = useState<WisdomStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<WisdomEntry | null>(null);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  
  const supabase = createClient();

  useEffect(() => {
    loadWisdom();
  }, []);

  const loadWisdom = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get all memories tagged as 'wisdom'
    const { data: memories, error } = await supabase
      .from('memories')
      .select('*')
      .eq('user_id', user.id)
      .contains('tags', ['wisdom'])
      .order('created_at', { ascending: false });

    if (memories) {
      setEntries(memories);
      
      // Calculate stats
      const categoryCount: Record<string, number> = {};
      memories.forEach(m => {
        (m.tags || []).forEach((tag: string) => {
          if (tag !== 'wisdom') {
            categoryCount[tag] = (categoryCount[tag] || 0) + 1;
          }
        });
      });

      // Generate personality traits based on wisdom content
      const traits = analyzeTraits(memories);

      setStats({
        total: memories.length,
        categories: categoryCount,
        traits,
      });
    }
    
    setIsLoading(false);
  };

  // Analyze wisdom entries to extract personality traits
  const analyzeTraits = (wisdomEntries: WisdomEntry[]) => {
    const traits = [
      { name: 'Reflective', score: 0, description: 'Thinks deeply about experiences' },
      { name: 'Empathetic', score: 0, description: 'Values human connections' },
      { name: 'Resilient', score: 0, description: 'Learns from challenges' },
      { name: 'Curious', score: 0, description: 'Always seeking to learn' },
      { name: 'Generous', score: 0, description: 'Eager to share knowledge' },
    ];

    // Simple scoring based on content length and engagement
    const totalEntries = wisdomEntries.length;
    if (totalEntries === 0) return traits;

    // Base scores on participation
    traits[0].score = Math.min(100, totalEntries * 10); // Reflective - more entries = more reflective
    traits[4].score = Math.min(100, totalEntries * 12); // Generous - sharing wisdom
    
    // Check for relationship/family keywords
    const relationshipEntries = wisdomEntries.filter(e => 
      e.tags?.some(t => ['relationships', 'family', 'friends'].includes(t)) ||
      e.description?.toLowerCase().includes('love') ||
      e.description?.toLowerCase().includes('family')
    );
    traits[1].score = Math.min(100, (relationshipEntries.length / Math.max(1, totalEntries)) * 150);

    // Check for challenge/growth keywords
    const resilienceEntries = wisdomEntries.filter(e =>
      e.description?.toLowerCase().includes('learn') ||
      e.description?.toLowerCase().includes('mistake') ||
      e.description?.toLowerCase().includes('challenge') ||
      e.description?.toLowerCase().includes('overcome')
    );
    traits[2].score = Math.min(100, (resilienceEntries.length / Math.max(1, totalEntries)) * 150);

    // Voice entries show curiosity and engagement
    const voiceEntries = wisdomEntries.filter(e => e.audio_url);
    traits[3].score = Math.min(100, 30 + (voiceEntries.length / Math.max(1, totalEntries)) * 100);

    return traits;
  };

  const playAudio = (url: string) => {
    if (playingAudio === url) {
      setPlayingAudio(null);
    } else {
      setPlayingAudio(url);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
          <Brain size={32} className="text-[#4A3552]" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F2F1E5] via-[#FAF7E8] to-[#F5EFE0] p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#4A3552] flex items-center gap-3">
            <Brain size={32} />
            Your Wisdom
          </h1>
          <p className="text-gray-600 mt-2">Life lessons, insights, and knowledge you've shared</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Total Wisdom */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#4A3552]/10 flex items-center justify-center">
                <Lightbulb size={28} className="text-[#4A3552]" />
              </div>
              <div>
                <div className="text-3xl font-bold text-[#4A3552]">{stats?.total || 0}</div>
                <div className="text-sm text-gray-500">Wisdom Entries</div>
              </div>
            </div>
          </motion.div>

          {/* Personality Radar */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-sm lg:col-span-2"
          >
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Your Wisdom Profile
            </h3>
            <div className="flex flex-wrap gap-4">
              {stats?.traits.map((trait, i) => (
                <div key={trait.name} className="flex-1 min-w-[140px]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{trait.name}</span>
                    <span className="text-xs text-[#4A3552] font-bold">{Math.round(trait.score)}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${trait.score}%` }}
                      transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
                      className="h-full rounded-full"
                      style={{ 
                        background: `linear-gradient(90deg, #4A3552, #8DACAB)` 
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{trait.description}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Category Breakdown - Spider Chart Visual */}
        {stats && Object.keys(stats.categories).length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 shadow-sm mb-8"
          >
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Wisdom by Category
            </h3>
            <div className="flex flex-wrap gap-3">
              {Object.entries(stats.categories).map(([category, count]) => {
                const catConfig = WISDOM_CATEGORIES.find(c => c.key === category);
                return (
                  <div 
                    key={category}
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-sm"
                    style={{ 
                      backgroundColor: `${catConfig?.color || '#406A56'}15`,
                      color: catConfig?.color || '#406A56'
                    }}
                  >
                    <span className="font-medium">{category.replace(/_/g, ' ')}</span>
                    <span className="bg-white/50 px-2 py-0.5 rounded-full text-xs font-bold">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Wisdom Entries */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
            <Quote size={20} className="text-[#D9C61A]" />
            Your Wisdom Collection
          </h3>
          
          {entries.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center">
              <Sparkles size={48} className="mx-auto mb-4 text-[#D9C61A]/50" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No wisdom yet</h3>
              <p className="text-gray-400 mb-6">Share your life lessons and insights to build your wisdom collection</p>
              <Link 
                href="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#4A3552] text-white rounded-xl hover:bg-[#5a4562] transition-colors"
              >
                <Brain size={18} />
                Share Wisdom
              </Link>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {entries.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedEntry(entry)}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#4A3552]/10 flex items-center justify-center flex-shrink-0">
                      <Brain size={20} className="text-[#4A3552]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-800 mb-1 line-clamp-1">{entry.title}</h4>
                      <p className="text-sm text-gray-500 line-clamp-2">{entry.description}</p>
                      
                      {/* Audio indicator */}
                      {entry.audio_url && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            playAudio(entry.audio_url!);
                          }}
                          className="mt-2 flex items-center gap-2 text-xs text-[#406A56] hover:text-[#4a7a64]"
                        >
                          <Play size={14} className={playingAudio === entry.audio_url ? 'text-[#C35F33]' : ''} />
                          {playingAudio === entry.audio_url ? 'Playing...' : 'Listen'}
                        </button>
                      )}
                      
                      {/* Tags */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {entry.tags?.filter(t => t !== 'wisdom').slice(0, 3).map(tag => (
                          <span 
                            key={tag} 
                            className="text-xs px-2 py-0.5 bg-[#4A3552]/10 text-[#4A3552] rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-gray-300 flex-shrink-0" />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Hidden audio player */}
        {playingAudio && (
          <audio
            src={playingAudio}
            autoPlay
            onEnded={() => setPlayingAudio(null)}
            className="hidden"
          />
        )}

        {/* Entry Detail Modal */}
        <AnimatePresence>
          {selectedEntry && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
              onClick={() => setSelectedEntry(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-[#4A3552]/10 flex items-center justify-center">
                    <Brain size={24} className="text-[#4A3552]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">{selectedEntry.title}</h2>
                    <p className="text-xs text-gray-400">
                      {new Date(selectedEntry.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <p className="text-gray-600 whitespace-pre-wrap mb-4">{selectedEntry.description}</p>
                
                {selectedEntry.audio_url && (
                  <div className="bg-[#4A3552]/5 rounded-xl p-4 mb-4">
                    <p className="text-xs text-gray-500 mb-2">Voice Recording</p>
                    <audio src={selectedEntry.audio_url} controls className="w-full" />
                  </div>
                )}
                
                <div className="flex flex-wrap gap-2">
                  {selectedEntry.tags?.map(tag => (
                    <span 
                      key={tag} 
                      className="text-xs px-3 py-1 bg-[#4A3552]/10 text-[#4A3552] rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                
                <button
                  onClick={() => setSelectedEntry(null)}
                  className="mt-6 w-full py-2 bg-[#4A3552] text-white rounded-xl hover:bg-[#5a4562]"
                >
                  Close
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
