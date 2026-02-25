'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, Sparkles, Lightbulb, Heart, Users, Briefcase, Compass, Utensils, GraduationCap } from 'lucide-react';

export interface WisdomQuestion {
  id: string;
  question_text: string;
  category: string;
}

// Category styling - backgrounds and accent colors
const CATEGORY_STYLES: Record<string, { 
  bg: string; 
  accent: string; 
  icon: React.ComponentType<{ size?: number; className?: string }>;
}> = {
  life_lessons: { 
    bg: 'linear-gradient(135deg, #F5ECD7 0%, #F0E6C8 100%)', 
    accent: '#D9C61A',
    icon: Lightbulb 
  },
  relationships: { 
    bg: 'linear-gradient(135deg, #F5DFD0 0%, #F0D5C2 100%)', 
    accent: '#C35F33',
    icon: Heart 
  },
  family: { 
    bg: 'linear-gradient(135deg, #E0EBE5 0%, #D5E4DC 100%)', 
    accent: '#406A56',
    icon: Users 
  },
  career: { 
    bg: 'linear-gradient(135deg, #E8E0EC 0%, #DFD5E5 100%)', 
    accent: '#4A3552',
    icon: Briefcase 
  },
  values: { 
    bg: 'linear-gradient(135deg, #E8F0EF 0%, #DEE8E7 100%)', 
    accent: '#8DACAB',
    icon: Compass 
  },
  recipes: { 
    bg: 'linear-gradient(135deg, #F5DFD0 0%, #F0D5C2 100%)', 
    accent: '#C35F33',
    icon: Utensils 
  },
  advice: { 
    bg: 'linear-gradient(135deg, #F5ECD7 0%, #F0E6C8 100%)', 
    accent: '#D9C61A',
    icon: GraduationCap 
  },
  wisdom: { 
    bg: 'linear-gradient(135deg, #E8E0EC 0%, #DFD5E5 100%)', 
    accent: '#4A3552',
    icon: Lightbulb 
  },
};

// Categories to fetch questions for
const WISDOM_CATEGORIES = ['life_lessons', 'relationships', 'family', 'career', 'values', 'recipes', 'advice', 'wisdom'];

interface QuestionPromptBarProps {
  onCreateWisdom: (question: WisdomQuestion) => void;
}

export function QuestionPromptBar({ onCreateWisdom }: QuestionPromptBarProps) {
  const [questions, setQuestions] = useState<WisdomQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    loadUnansweredQuestions();
  }, []);

  // Update scroll button states
  const updateScrollButtons = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    const container = scrollRef.current;
    if (container) {
      container.addEventListener('scroll', updateScrollButtons);
      // Initial check
      updateScrollButtons();
      return () => container.removeEventListener('scroll', updateScrollButtons);
    }
  }, [questions]);

  const loadUnansweredQuestions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get wisdom-related questions that user hasn't answered yet
    const { data: allQuestions } = await supabase
      .from('interview_questions')
      .select('id, question_text, category')
      .or('is_system.eq.true,user_id.eq.' + user.id)
      .in('category', WISDOM_CATEGORIES)
      .limit(50);

    // Get user's existing wisdom entries to filter out answered questions
    const { data: existingWisdom } = await supabase
      .from('memories')
      .select('title, metadata')
      .eq('user_id', user.id)
      .eq('memory_type', 'wisdom');

    // Filter out questions that have already been answered
    const answeredQuestionTexts = new Set(
      existingWisdom?.map(w => w.metadata?.question_text || w.title) || []
    );

    const unanswered = (allQuestions || []).filter(
      q => !answeredQuestionTexts.has(q.question_text)
    );

    // Shuffle and take first 12 for variety
    const shuffled = unanswered.sort(() => Math.random() - 0.5).slice(0, 12);
    setQuestions(shuffled);
    setLoading(false);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const getCategoryStyle = (category: string) => {
    return CATEGORY_STYLES[category] || CATEGORY_STYLES.wisdom;
  };

  if (loading) {
    return (
      <div className="instant-questions-bar mb-6">
        <div className="instant-questions-header">
          <div className="instant-questions-title">
            <Sparkles size={16} className="text-[#D9C61A]" />
            <span>Instant Questions</span>
          </div>
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4].map(i => (
            <div 
              key={i} 
              className="flex-shrink-0 w-[240px] h-[160px] rounded-t-2xl bg-gray-100 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (questions.length === 0) return null;

  return (
    <div className="instant-questions-bar mb-6">
      {/* Header */}
      <div className="instant-questions-header">
        <div className="instant-questions-title">
          <Sparkles size={16} className="text-[#D9C61A]" />
          <span>Instant Questions</span>
          <span className="instant-questions-xp">+100 XP each</span>
        </div>
        <div className="instant-questions-nav">
          <button 
            onClick={() => scroll('left')} 
            className={`instant-questions-nav-btn ${!canScrollLeft ? 'opacity-30 cursor-not-allowed' : ''}`}
            disabled={!canScrollLeft}
          >
            <ChevronLeft size={18} />
          </button>
          <button 
            onClick={() => scroll('right')} 
            className={`instant-questions-nav-btn ${!canScrollRight ? 'opacity-30 cursor-not-allowed' : ''}`}
            disabled={!canScrollRight}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Scrollable Cards Container */}
      <div 
        className="instant-questions-scroll" 
        ref={scrollRef}
      >
        <div className="instant-questions-cards">
          <AnimatePresence mode="popLayout">
            {questions.map((question, index) => {
              const style = getCategoryStyle(question.category);
              const Icon = style.icon;
              
              return (
                <motion.button
                  key={question.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => onCreateWisdom(question)}
                  className="instant-question-card group"
                  style={{ 
                    background: style.bg,
                  }}
                >
                  {/* Category icon badge */}
                  <div 
                    className="instant-question-category"
                    style={{ backgroundColor: `${style.accent}15`, color: style.accent }}
                  >
                    <Icon size={14} />
                    <span>{question.category.replace(/_/g, ' ')}</span>
                  </div>

                  {/* Question text */}
                  <p className="instant-question-text">
                    {question.question_text}
                  </p>

                  {/* Answer button */}
                  <div className="instant-question-footer">
                    <span 
                      className="instant-question-btn"
                      style={{ 
                        backgroundColor: style.accent,
                        color: 'white' 
                      }}
                    >
                      <Plus size={14} />
                      Answer
                    </span>
                  </div>

                  {/* Torn edge effect at bottom - uses CSS clip-path */}
                  <div className="instant-question-torn-edge" />
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
