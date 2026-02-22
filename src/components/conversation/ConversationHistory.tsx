'use client';

import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, User, Bot } from 'lucide-react';
import { useState } from 'react';

interface Exchange {
  question: string;
  response: string;
  audioUrl?: string;
  transcription?: string;
}

interface ConversationHistoryProps {
  exchanges: Exchange[];
}

function AudioPlayer({ audioUrl }: { audioUrl: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="conversation-history-audio">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      <button
        onClick={togglePlay}
        className="conversation-history-playbtn"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? <Pause size={14} /> : <Play size={14} />}
      </button>
      <div className="conversation-history-progress">
        <div 
          className="conversation-history-progressbar"
          style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
        />
      </div>
      <span className="conversation-history-time">
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>
    </div>
  );
}

function ExchangeItem({ exchange, index }: { exchange: Exchange; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="conversation-history-item"
    >
      {/* AI Question */}
      <div className="conversation-history-message conversation-history-ai">
        <div className="conversation-history-avatar conversation-history-avatar-ai">
          <Bot size={16} />
        </div>
        <div className="conversation-history-bubble conversation-history-bubble-ai">
          <p>{exchange.question}</p>
        </div>
      </div>

      {/* User Response */}
      <div className="conversation-history-message conversation-history-user">
        <div className="conversation-history-bubble conversation-history-bubble-user">
          <p>{exchange.response}</p>
          {exchange.audioUrl && (
            <AudioPlayer audioUrl={exchange.audioUrl} />
          )}
        </div>
        <div className="conversation-history-avatar conversation-history-avatar-user">
          <User size={16} />
        </div>
      </div>
    </motion.div>
  );
}

export function ConversationHistory({ exchanges }: ConversationHistoryProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new exchanges are added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [exchanges]);

  if (exchanges.length === 0) return null;

  return (
    <div 
      ref={scrollRef}
      className="conversation-history"
      aria-label="Conversation history"
    >
      {exchanges.map((exchange, index) => (
        <ExchangeItem 
          key={index} 
          exchange={exchange} 
          index={index}
        />
      ))}
    </div>
  );
}
