'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Lightbulb, Heart, Star, BookOpen, Quote, Play, ChevronRight, Sparkles, Search, X, ChevronLeft, GraduationCap, Briefcase, Users, Utensils, Compass, Share2, Baby, Activity, Palette, Moon, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import '@/styles/home.css';
import '@/styles/page-styles.css';
import '@/styles/engagement.css';
import { getCategoryIcon } from '@/lib/dashboard/icons';
import { QuestionPromptBar, type WisdomQuestion } from '@/components/wisdom/QuestionPromptBar';
import { ConversationView } from '@/components/conversation';
import type { EngagementPrompt } from '@/types/engagement';

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

interface SharedWisdomEntry extends WisdomEntry {
  shared_by?: {
    full_name: string;
  };
  shared_at?: string;
}

interface WisdomStats {
  total: number;
  categories: Record<string, number>;
}

type TabMode = 'mine' | 'shared';

// Enhanced wisdom categories with icons, colors, and descriptions
const WISDOM_CATEGORIES = [
  { key: 'life_lessons', label: 'Life Lessons', icon: Lightbulb, color: '#D9C61A', bgColor: '#FDF9E3', description: 'Hard-earned wisdom and insights' },
  { key: 'relationships', label: 'Relationships', icon: Heart, color: '#C35F33', bgColor: '#FCEEE8', description: 'Love, friendship, and connection' },
  { key: 'family', label: 'Family', icon: Users, color: '#406A56', bgColor: '#E8F2ED', description: 'Family traditions and values' },
  { key: 'career', label: 'Career', icon: Briefcase, color: '#4A3552', bgColor: '#EDE8F0', description: 'Professional wisdom and advice' },
  { key: 'parenting', label: 'Parenting', icon: Baby, color: '#8DACAB', bgColor: '#EBF2F1', description: 'Raising children with love' },
  { key: 'health', label: 'Health', icon: Activity, color: '#5B8A72', bgColor: '#E6F0EB', description: 'Physical and mental wellbeing' },
  { key: 'spirituality', label: 'Spirituality', icon: Moon, color: '#6B5B95', bgColor: '#EFEAF5', description: 'Faith, purpose, and meaning' },
  { key: 'creativity', label: 'Creativity', icon: Palette, color: '#E07C52', bgColor: '#FCF0EA', description: 'Art, expression, imagination' },
  { key: 'values', label: 'Values', icon: Compass, color: '#3D7068', bgColor: '#E4EDEC', description: 'What matters most to you' },
  { key: 'recipes', label: 'Recipes', icon: Utensils, color: '#C35F33', bgColor: '#FCEEE8', description: 'Family recipes and traditions' },
  { key: 'advice', label: 'Advice', icon: GraduationCap, color: '#D9C61A', bgColor: '#FDF9E3', description: 'Guidance for loved ones' },
  { key: 'other', label: 'Other', icon: HelpCircle, color: '#888888', bgColor: '#F5F5F5', description: 'Everything else' },
];

// Get category config by key
const getCategoryConfig = (key: string) => {
  return WISDOM_CATEGORIES.find(c => c.key === key) || WISDOM_CATEGORIES[WISDOM_CATEGORIES.length - 1];
};

export default function WisdomPage() {
  const [entries, setEntries] = useState<WisdomEntry[]>([]);
  const [sharedEntries, setSharedEntries] = useState<SharedWisdomEntry[]>([]);
  const [stats, setStats] = useState<WisdomStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingShared, setLoadingShared] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<WisdomEntry | null>(null);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [tabMode, setTabMode] = useState<TabMode>('mine');
  const [showExploreSection, setShowExploreSection] = useState(true);
  
  // Conversation modal state for answering instant questions
  const [conversationPrompt, setConversationPrompt] = useState<EngagementPrompt | null>(null);
  
  const supabase = createClient();

  useEffect(() => {
    loadWisdom();
    loadSharedWisdom();
  }, []);

  // Calculate category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    entries.forEach(entry => {
      const cat = entry.category || entry.ai_category || 'other';
      // Normalize category key
      const normalizedCat = cat.toLowerCase().replace(/\s+/g, '_');
      counts[normalizedCat] = (counts[normalizedCat] || 0) + 1;
    });
    return counts;
  }, [entries]);

  // Filter entries based on search and category
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const matchesSearch = !searchQuery || 
        entry.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const entryCategory = (entry.category || entry.ai_category || '').toLowerCase().replace(/\s+/g, '_');
      const matchesCategory = !selectedCategory ||
        entry.tags?.includes(selectedCategory) ||
        entryCategory === selectedCategory;
      
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
      
      // Calculate stats by category
      const categoryCount: Record<string, number> = {};
      memories.forEach(m => {
        const cat = m.category || m.ai_category || 'other';
        const normalizedCat = cat.toLowerCase().replace(/\s+/g, '_');
        categoryCount[normalizedCat] = (categoryCount[normalizedCat] || 0) + 1;
      });

      setStats({
        total: memories.length,
        categories: categoryCount,
      });
    }
    
    setIsLoading(false);
  };

  const loadSharedWisdom = async () => {
    setLoadingShared(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get wisdom shared with current user
    const { data: shares, error } = await supabase
      .from('knowledge_shares')
      .select(`
        knowledge_id,
        created_at,
        owner_id,
        knowledge_entries!inner(
          id,
          title,
          description,
          audio_url,
          tags,
          created_at,
          category,
          ai_category
        ),
        contacts!inner(
          shared_with_user_id,
          full_name
        )
      `)
      .eq('contacts.shared_with_user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading shared wisdom:', error);
      setLoadingShared(false);
      return;
    }

    // Transform the data
    const transformedEntries: SharedWisdomEntry[] = (shares || []).map((share: any) => ({
      ...share.knowledge_entries,
      shared_by: { full_name: share.contacts?.full_name || 'Someone' },
      shared_at: share.created_at,
    }));

    setSharedEntries(transformedEntries);
    setLoadingShared(false);
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

  // Get bubble size based on count (relative to max count)
  const getBubbleSize = (count: number, maxCount: number) => {
    if (maxCount === 0) return 1;
    const ratio = count / maxCount;
    // Scale between 0.7 and 1.3
    return 0.7 + (ratio * 0.6);
  };

  const maxCategoryCount = Math.max(...Object.values(categoryCounts), 1);

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
    <div className="page-container min-h-screen p-6 lg:p-8">
      {/* Background */}
      <div className="page-background">
        <div className="page-blob page-blob-1" />
        <div className="page-blob page-blob-2" />
        <div className="page-blob page-blob-3" />
      </div>
      
      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header with Search */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/dashboard" className="glass-card p-2 hover:bg-white/90 transition-all">
              <ChevronLeft size={20} className="text-gray-600" />
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-[#4A3552] flex items-center gap-3">
                <Brain size={28} />
                Your Wisdom
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                {tabMode === 'mine' 
                  ? `${filteredEntries.length} of ${entries.length} entries`
                  : `${sharedEntries.length} shared with you`
                }
              </p>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => setTabMode('mine')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                tabMode === 'mine' 
                  ? 'bg-[#4A3552] text-white' 
                  : 'bg-white/80 text-[#4A3552] hover:bg-white border border-[#4A3552]/20'
              }`}
            >
              <Brain size={16} />
              My Wisdom
              {entries.length > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                  tabMode === 'mine' ? 'bg-white/20' : 'bg-[#4A3552]/10'
                }`}>
                  {entries.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setTabMode('shared')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                tabMode === 'shared' 
                  ? 'bg-[#4A3552] text-white' 
                  : 'bg-white/80 text-[#4A3552] hover:bg-white border border-[#4A3552]/20'
              }`}
            >
              <Share2 size={16} />
              Shared with Me
              {sharedEntries.length > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                  tabMode === 'shared' ? 'bg-white/20' : 'bg-[#4A3552]/10'
                }`}>
                  {sharedEntries.length}
                </span>
              )}
            </button>
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

        {/* Question Prompt Bar - suggest unanswered wisdom questions */}
        {tabMode === 'mine' && (
          <QuestionPromptBar 
            onCreateWisdom={(question: WisdomQuestion) => {
              const prompt: EngagementPrompt = {
                id: question.id,
                userId: '',
                type: 'knowledge',
                category: question.category,
                promptText: question.question_text,
                status: 'pending',
                priority: 1,
                metadata: {
                  question_text: question.question_text,
                  source: 'instant_question',
                },
                createdAt: new Date().toISOString(),
              };
              setConversationPrompt(prompt);
            }} 
          />
        )}

        {/* ✨ Explore by Topic Section - Visual Category Clusters */}
        {tabMode === 'mine' && entries.length > 0 && showExploreSection && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#4A3552] flex items-center gap-2">
                <Sparkles size={20} className="text-[#D9C61A]" />
                Explore by Topic
              </h2>
              <button
                onClick={() => setShowExploreSection(false)}
                className="text-sm text-gray-400 hover:text-gray-600"
              >
                Hide
              </button>
            </div>
            
            {/* Category Bubbles Grid */}
            <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
              {WISDOM_CATEGORIES.map(cat => {
                const count = categoryCounts[cat.key] || 0;
                if (count === 0) return null;
                
                const Icon = cat.icon;
                const scale = getBubbleSize(count, maxCategoryCount);
                const isSelected = selectedCategory === cat.key;
                
                return (
                  <motion.button
                    key={cat.key}
                    onClick={() => setSelectedCategory(isSelected ? null : cat.key)}
                    whileHover={{ scale: scale * 1.05 }}
                    whileTap={{ scale: scale * 0.95 }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    className={`relative flex flex-col items-center justify-center p-4 rounded-2xl transition-all cursor-pointer ${
                      isSelected 
                        ? 'ring-2 ring-offset-2 shadow-lg' 
                        : 'hover:shadow-md'
                    }`}
                    style={{ 
                      backgroundColor: cat.bgColor,
                      minWidth: `${80 + (count * 5)}px`,
                      minHeight: `${80 + (count * 5)}px`,
                      maxWidth: '140px',
                      maxHeight: '140px',
                      ringColor: isSelected ? cat.color : undefined,
                    }}
                  >
                    {/* Count Badge */}
                    <div 
                      className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm"
                      style={{ backgroundColor: cat.color }}
                    >
                      {count}
                    </div>
                    
                    {/* Icon */}
                    <Icon 
                      size={24 + (count * 2)} 
                      style={{ color: cat.color }}
                      className="mb-1"
                    />
                    
                    {/* Label */}
                    <span 
                      className="text-xs font-medium text-center leading-tight"
                      style={{ color: cat.color }}
                    >
                      {cat.label}
                    </span>
                  </motion.button>
                );
              })}
              
              {/* "All" bubble */}
              <motion.button
                onClick={() => setSelectedCategory(null)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl transition-all cursor-pointer ${
                  !selectedCategory 
                    ? 'bg-[#4A3552] text-white ring-2 ring-offset-2 ring-[#4A3552] shadow-lg' 
                    : 'bg-white/80 text-[#4A3552] hover:bg-white hover:shadow-md border border-gray-200'
                }`}
                style={{ 
                  minWidth: '80px',
                  minHeight: '80px',
                }}
              >
                <BookOpen size={24} className="mb-1" />
                <span className="text-xs font-medium">All</span>
                <span className="text-[10px] opacity-70">{entries.length}</span>
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Category Filter Pills (compact) - only show when explore section hidden */}
        {tabMode === 'mine' && !showExploreSection && (
          <div className="mb-6">
            <button
              onClick={() => setShowExploreSection(true)}
              className="text-sm text-[#4A3552] hover:underline mb-3 flex items-center gap-1"
            >
              <Sparkles size={14} />
              Show topic explorer
            </button>
            <div className="flex flex-wrap gap-2">
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
                const count = categoryCounts[cat.key] || 0;
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
          </div>
        )}

        {/* Clear Filters */}
        {tabMode === 'mine' && (searchQuery || selectedCategory) && (
          <div className="mb-4">
            <button 
              onClick={clearFilters}
              className="text-[#C35F33] hover:text-[#a84d28] text-sm font-medium flex items-center gap-1"
            >
              <X size={14} />
              Clear filters
            </button>
          </div>
        )}

        {/* Analytics Grid - only show for My Wisdom tab */}
        {tabMode === 'mine' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-4"
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
            className="glass-card p-4"
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
            className="glass-card p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#406A56]/10 flex items-center justify-center">
                <Compass size={20} className="text-[#406A56]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[#406A56]">
                  {Object.keys(categoryCounts).length}
                </div>
                <div className="text-xs text-gray-500">Topics Covered</div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-card p-4"
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
        )}

        {/* Wisdom Entries */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
            <Quote size={20} className="text-[#D9C61A]" />
            {tabMode === 'mine' 
              ? selectedCategory 
                ? `${getCategoryConfig(selectedCategory).label} Wisdom`
                : 'Your Wisdom Collection'
              : 'Shared with You'
            }
          </h3>

          {/* Shared with Me Tab Content */}
          {tabMode === 'shared' ? (
            loadingShared ? (
              <div className="glass-card p-12 text-center">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
                  <Brain size={32} className="text-[#4A3552] mx-auto" />
                </motion.div>
                <p className="text-gray-400 mt-4">Loading shared wisdom...</p>
              </div>
            ) : sharedEntries.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <img src={getCategoryIcon('wisdom')} alt="" className="w-12 h-12 opacity-50" />
                </div>
                <h3 className="empty-state-title">No shared wisdom yet</h3>
                <p className="empty-state-text">When someone shares their wisdom with you, it will appear here</p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {sharedEntries.map((entry, index) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className="glass-card p-5 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => window.location.assign(`/dashboard/wisdom/${entry.id}`)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#4A3552]/10 flex items-center justify-center flex-shrink-0">
                        <Brain size={20} className="text-[#4A3552]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-800 mb-1 line-clamp-1">{entry.title}</h4>
                        <p className="text-sm text-gray-500 line-clamp-2">{entry.description}</p>
                        
                        {/* Shared by indicator */}
                        <div className="flex items-center gap-2 mt-2 text-xs text-[#4A3552]">
                          <Users size={12} />
                          <span>Shared by {entry.shared_by?.full_name || 'Unknown'}</span>
                          {entry.shared_at && (
                            <span className="text-gray-400">
                              · {new Date(entry.shared_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        
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
            )
          ) : filteredEntries.length === 0 && entries.length > 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Search size={32} className="text-[#4A3552]/50" />
              </div>
              <h3 className="empty-state-title">No matches found</h3>
              <p className="empty-state-text mb-4">Try a different search term or category</p>
              <button 
                onClick={clearFilters}
                className="btn-primary"
              >
                Clear filters
              </button>
            </div>
          ) : entries.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <img src={getCategoryIcon('wisdom')} alt="" className="w-12 h-12 opacity-50" />
              </div>
              <h3 className="empty-state-title">No wisdom yet</h3>
              <p className="empty-state-text mb-4">Share your life lessons and insights to build your wisdom collection</p>
              <Link 
                href="/dashboard"
                className="btn-primary inline-flex"
              >
                <Brain size={18} />
                Share Wisdom
              </Link>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredEntries.map((entry, index) => {
                const catKey = (entry.category || entry.ai_category || 'other').toLowerCase().replace(/\s+/g, '_');
                const catConfig = getCategoryConfig(catKey);
                const CatIcon = catConfig.icon;
                
                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className="glass-card p-5 hover:shadow-md transition-shadow cursor-pointer group"
                    onClick={() => window.location.assign(`/dashboard/wisdom/${entry.id}`)}
                  >
                    <div className="flex items-start gap-4">
                      {/* Category Icon */}
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                        style={{ backgroundColor: catConfig.bgColor }}
                      >
                        <CatIcon size={20} style={{ color: catConfig.color }} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        {/* Category Badge */}
                        <div className="flex items-center gap-2 mb-1">
                          <span 
                            className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full"
                            style={{ 
                              backgroundColor: catConfig.bgColor, 
                              color: catConfig.color 
                            }}
                          >
                            {catConfig.label}
                          </span>
                        </div>
                        
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
                          {entry.tags?.filter(t => !['wisdom', 'conversation', 'knowledge', entry.category, entry.ai_category].includes(t)).slice(0, 3).map(tag => (
                            <span 
                              key={tag} 
                              className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <ChevronRight size={20} className="text-gray-300 flex-shrink-0 group-hover:text-gray-400 transition-colors" />
                    </div>
                  </motion.div>
                );
              })}
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

        {/* Conversation View Modal - for answering instant wisdom questions */}
        {conversationPrompt && (
          <ConversationView
            prompt={conversationPrompt}
            expectedXp={100}
            onComplete={(result) => {
              loadWisdom();
              setConversationPrompt(null);
            }}
            onClose={() => setConversationPrompt(null)}
          />
        )}
      </div>
    </div>
  );
}
