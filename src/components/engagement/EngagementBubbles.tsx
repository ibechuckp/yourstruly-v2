'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEngagementPrompts } from '@/hooks/useEngagementPrompts';
import { Bubble } from './Bubble';
import { RefreshCw, Sparkles } from 'lucide-react';
import type { EngagementPrompt } from '@/types/engagement';

interface EngagementBubblesProps {
  className?: string;
  maxBubbles?: number;
}

// Scrapbook-style rotations
function getRotation(index: number): number {
  const rotations = [-2.5, 1.8, -1.2, 2.2, -1.8, 2.5, -1, 1.5, -2, 1.2];
  return rotations[index % rotations.length];
}

export function EngagementBubbles({ 
  className = '', 
  maxBubbles = 5 
}: EngagementBubblesProps) {
  const { 
    prompts, 
    isLoading, 
    shuffle, 
    answerPrompt, 
    skipPrompt, 
    dismissPrompt,
    stats 
  } = useEngagementPrompts(maxBubbles);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExpandedId(null);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  const handleBubbleClick = (prompt: EngagementPrompt) => {
    setExpandedId(expandedId === prompt.id ? null : prompt.id);
  };

  const handleAnswer = async (promptId: string, response: any) => {
    try {
      await answerPrompt(promptId, response);
      setExpandedId(null);
    } catch (err) {
      console.error('Failed to answer:', err);
    }
  };

  const handleSkip = async (promptId: string) => {
    try {
      await skipPrompt(promptId);
      setExpandedId(null);
    } catch (err) {
      console.error('Failed to skip:', err);
    }
  };

  const handleDismiss = async (promptId: string) => {
    try {
      await dismissPrompt(promptId);
      setExpandedId(null);
    } catch (err) {
      console.error('Failed to dismiss:', err);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setExpandedId(null);
    await shuffle();
    setIsRefreshing(false);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-12">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Sparkles size={28} className="text-[#D9C61A]" />
        </motion.div>
        <span className="text-[var(--yt-green)]/60">Loading your prompts...</span>
      </div>
    );
  }

  if (prompts.length === 0) {
    return (
      <div className="engagement-empty">
        <div className="engagement-empty-icon">
          <Sparkles size={32} className="text-[#D9C61A]" />
        </div>
        <h3>All caught up!</h3>
        <p>You've answered all your prompts for now.</p>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="engagement-refresh-btn mt-6"
        >
          <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          Generate More
        </button>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center gap-6 ${className}`}>
      {/* Stats bar */}
      {stats && (stats.currentStreakDays > 0 || stats.totalAnswered > 0) && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="engagement-stats"
        >
          {stats.currentStreakDays > 0 && (
            <span className="engagement-stat">
              🔥 <strong>{stats.currentStreakDays}</strong> day streak
            </span>
          )}
          {stats.totalAnswered > 0 && (
            <span className="engagement-stat">
              ✅ <strong>{stats.totalAnswered}</strong> answered
            </span>
          )}
        </motion.div>
      )}

      {/* Masonry grid of bubbles */}
      <div className="engagement-masonry">
        <AnimatePresence mode="popLayout">
          {prompts.map((prompt, index) => (
            <Bubble
              key={prompt.id}
              prompt={prompt}
              index={index}
              isExpanded={expandedId === prompt.id}
              onClick={() => handleBubbleClick(prompt)}
              onAnswer={(response) => handleAnswer(prompt.id, response)}
              onSkip={() => handleSkip(prompt.id)}
              onDismiss={() => handleDismiss(prompt.id)}
              onClose={() => setExpandedId(null)}
              rotation={getRotation(index)}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Refresh button */}
      <motion.button
        onClick={handleRefresh}
        disabled={isRefreshing}
        className="engagement-refresh-btn"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
        Shuffle
      </motion.button>
    </div>
  );
}
