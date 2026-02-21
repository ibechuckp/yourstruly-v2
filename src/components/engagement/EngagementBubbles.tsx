'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEngagementPrompts } from '@/hooks/useEngagementPrompts';
import { Bubble } from './Bubble';
import { RefreshCw, Sparkles } from 'lucide-react';
import type { EngagementPrompt } from '@/types/engagement';

interface CompletedTile {
  id: string;
  type: string;
  icon: string;
  photoUrl?: string;
  contactName?: string;
  contactPhotoUrl?: string;
}

interface EngagementBubblesProps {
  className?: string;
  maxBubbles?: number;
}

const TYPE_ICONS: Record<string, string> = {
  photo_backstory: '📸',
  tag_person: '👤',
  missing_info: '📝',
  memory_prompt: '💭',
  knowledge: '🧠',
  connect_dots: '🔗',
  highlight: '⭐',
  quick_question: '📝',
  postscript: '💌',
  favorites_firsts: '🏆',
  recipes_wisdom: '📖',
};

// Scrapbook-style rotations - subtle
function getRotation(index: number): number {
  const rotations = [-1.5, 1, -0.8, 1.2, -1, 1.5, -0.5, 0.8, -1.2, 0.6];
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
  } = useEngagementPrompts(maxBubbles);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [completedTiles, setCompletedTiles] = useState<CompletedTile[]>([]);
  const [animatingTileId, setAnimatingTileId] = useState<string | null>(null);

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

  const handleAnswer = useCallback(async (promptId: string, response: any) => {
    // Find the prompt before removing it
    const prompt = prompts.find(p => p.id === promptId);
    if (!prompt) return;

    try {
      // Start animation
      setAnimatingTileId(promptId);
      setExpandedId(null);

      // Wait for shrink animation
      await new Promise(resolve => setTimeout(resolve, 300));

      // Add to completed tiles (at the beginning - newest first)
      const completedTile: CompletedTile = {
        id: promptId,
        type: prompt.type,
        icon: TYPE_ICONS[prompt.type] || '✓',
        photoUrl: prompt.photoUrl,
        contactName: prompt.contactName,
        contactPhotoUrl: prompt.contactPhotoUrl,
      };
      setCompletedTiles(prev => [completedTile, ...prev]);

      // Actually submit the answer
      await answerPrompt(promptId, response);
      
    } catch (err) {
      console.error('Failed to answer:', err);
      // Remove from completed if it failed
      setCompletedTiles(prev => prev.filter(t => t.id !== promptId));
    } finally {
      setAnimatingTileId(null);
    }
  }, [prompts, answerPrompt]);

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
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      {/* Progress tracker - shows completed tiles */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="progress-tracker"
      >
        <span className="progress-tracker-label">
          ✓ Done
        </span>
        {completedTiles.length === 0 ? (
          <span className="progress-tracker-empty">
            Answer prompts to build your progress
          </span>
        ) : (
          <AnimatePresence mode="popLayout">
            {completedTiles.map((tile, index) => (
              <motion.div
                key={tile.id}
                initial={{ scale: 0, opacity: 0, x: -20 }}
                animate={{ scale: 1, opacity: 1, x: 0 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ 
                  type: 'spring', 
                  stiffness: 500, 
                  damping: 30,
                  delay: index === 0 ? 0.1 : 0
                }}
                className="progress-tile"
                title={tile.contactName || tile.type}
              >
                {tile.photoUrl ? (
                  <img src={tile.photoUrl} alt="" />
                ) : tile.contactPhotoUrl ? (
                  <img src={tile.contactPhotoUrl} alt="" />
                ) : tile.contactName ? (
                  <div className="progress-tile-avatar">
                    {tile.contactName.charAt(0).toUpperCase()}
                  </div>
                ) : (
                  <span>{tile.icon}</span>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </motion.div>

      {/* Grid of bubbles */}
      <div className="engagement-masonry">
        <AnimatePresence mode="popLayout">
          {prompts
            .filter(p => p.id !== animatingTileId)
            .map((prompt, index) => (
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
