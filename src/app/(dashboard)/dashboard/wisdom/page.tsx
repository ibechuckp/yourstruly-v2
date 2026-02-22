'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Lightbulb, Heart, Star, BookOpen, Quote, Play, ChevronRight, Sparkles, Search, X, ChevronLeft, GraduationCap, Briefcase, Users, Utensils, Compass } from 'lucide-react';
import Link from 'next/link';

interface WisdomEntry {
  id: string;
  title: string;
  description: string;
  audio_url?: string;
  tags: string[];
  created_at: string;
  category?: string;
  ai_category?: string;
}

interface WisdomStats {
  total: number;
  categories: Record<string, number>;
}

// Better wisdom categories with icons and colors
const WISDOM_CATEGORIES = [
  { key: 'life_lessons', label: 'Life Lessons', icon: Lightbulb, color: '#D9C61A', description: 'Hard-earned wisdom and insights' },
  { key: 'relationships', label: 'Relationships', icon: Heart, color: '#C35F33', description: 'Love, friendship, and connection' },
  { key: 'family', label: 'Family', icon: Users, color: '#406A56', description: 'Family traditions and values' },
  { key: 'career', label: 'Career & Work', icon: Briefcase, color: '#4A3552', description: 'Professional wisdom and advice' },
  { key: 'values', label: 'Values & Beliefs', icon: Compass, color: '#8DACAB', description: 'What matters most to you' },
  { key: 'recipes', label: 'Recipes & Traditions', icon: Utensils, color: '#C35F33', description: 'Family recipes and culinary wisdom' },
  { key: 'advice', label: 'Advice for Others', icon: GraduationCap, color: '#D9C61A', description: 'Guidance for loved ones' },
];

export default function WisdomPage() {
  const [entries, setEntries] = useState<WisdomEntry[]>([]);
  const [stats, setStats] = useState<WisdomStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<WisdomEntry | null>(null);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const supabase = createClient();

  useEffect(() => {
    loadWisdom();
  }, []);

  // Filter entries based on search and category
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const matchesSearch = !searchQuery || 
        entry.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = !selectedCategory ||
        entry.tags?.includes(selectedCategory) ||
        entry.ai_category === selectedCategory ||
        entry.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [entries, searchQuery, selectedCategory]);

  const loadWisdom = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get all wisdom memories (by memory_type)
    const { data: memories, error } = await supabase
      .from('memories')
      .select('*')
      .eq('user_id', user.id)
      .eq('memory_type', 'wisdom')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching wisdom:', error);
    }

    if (memories) {
      setEntries(memories);
      
      // Calculate stats by analyzing tags and categories
      const categoryCount: Record<string, number> = {};
      memories.forEach(m => {
        // Count by tags
        (m.tags || []).forEach((tag: string) => {
          if (tag !== 'wisdom') {
            const normalizedTag = tag.toLowerCase().replace(/_/g, ' ');
            categoryCount[normalizedTag] = (categoryCount[normalizedTag] || 0) + 1;
          }
        });
        // Also count by ai_category if present
        if (m.ai_category) {
          categoryCount[m.ai_category] = (categoryCount[m.ai_category] || 0) + 1;
        }
      });

      setStats({
        total: memories.length,
        categories: categoryCount,
      });
    }
    
    setIsLoading(false);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory(null);
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
        {/* Header with Search */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/dashboard" className="p-2 bg-white/80 backdrop-blur-sm rounded-xl hover:bg-white transition-all border border-gray-200">
              <ChevronLeft size={20} className="text-gray-600" />
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-[#4A3552] flex items-center gap-3">
                <Brain size={28} />
                Your Wisdom
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                {filteredEntries.length} of {entries.length} entries
              </p>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4A3552]/40" />
              <input
                type="text"
                placeholder="Search your wisdom..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-10 py-3 bg-white border border-gray-200 rounded-xl 
                         focus:ring-2 focus:ring-[#4A3552]/20 focus:border-[#4A3552] outline-none
                         text-gray-800 placeholder:text-gray-400"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all
              ${!selectedCategory 
                ? 'bg-[#4A3552] text-white' 
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}
          >
            All ({entries.length})
          </button>
          {WISDOM_CATEGORIES.map(cat => {
            const count = entries.filter(e => 
              e.tags?.includes(cat.key) || 
              e.ai_category === cat.key ||
              e.category === cat.key
            ).length;
            if (count === 0) return null;
            const Icon = cat.icon;
            return (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(selectedCategory === cat.key ? null : cat.key)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2
                  ${selectedCategory === cat.key
                    ? 'text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}
                style={selectedCategory === cat.key ? { backgroundColor: cat.color } : {}}
              >
                <Icon size={14} />
                {cat.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Clear Filters */}
        {(searchQuery || selectedCategory) && (
          <div className="mb-4">
            <button 
              onClick={clearFilters}
              className="text-[#C35F33] hover:text-[#a84d28] text-sm font-medium"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Analytics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#4A3552]/10 flex items-center justify-center">
                <Lightbulb size={20} className="text-[#4A3552]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[#4A3552]">{stats?.total || 0}</div>
                <div className="text-xs text-gray-500">Total Entries</div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white rounded-2xl p-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#C35F33]/10 flex items-center justify-center">
                <Play size={20} className="text-[#C35F33]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[#C35F33]">
                  {entries.filter(e => e.audio_url).length}
                </div>
                <div className="text-xs text-gray-500">Voice Entries</div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#406A56]/10 flex items-center justify-center">
                <Users size={20} className="text-[#406A56]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[#406A56]">
                  {Object.keys(stats?.categories || {}).length}
                </div>
                <div className="text-xs text-gray-500">Topics Covered</div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl p-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#D9C61A]/10 flex items-center justify-center">
                <Star size={20} className="text-[#D9C61A]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[#D9C61A]">
                  {entries.length > 0 
                    ? Math.round(entries.reduce((acc, e) => acc + (e.description?.length || 0), 0) / entries.length)
                    : 0}
                </div>
                <div className="text-xs text-gray-500">Avg. Length</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Wisdom Entries */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
            <Quote size={20} className="text-[#D9C61A]" />
            Your Wisdom Collection
          </h3>
          
          {filteredEntries.length === 0 && entries.length > 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center">
              <Search size={48} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No matches found</h3>
              <p className="text-gray-400 mb-6">Try a different search term or category</p>
              <button 
                onClick={clearFilters}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#4A3552] text-white rounded-xl hover:bg-[#5a4562] transition-colors"
              >
                Clear filters
              </button>
            </div>
          ) : entries.length === 0 ? (
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
              {filteredEntries.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => window.location.assign(`/dashboard/wisdom/${entry.id}`)}
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
