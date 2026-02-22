'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Pause, Square, Quote, Calendar, Tag, Lightbulb, Volume2, SkipForward, Sparkles } from 'lucide-react';
import Link from 'next/link';
import '@/styles/home.css';

interface WisdomEntry {
  id: string;
  title: string;
  description: string;
  ai_summary?: string;
  audio_url?: string;
  tags: string[];
  memory_type: string;
  memory_date?: string;
  created_at: string;
}

interface ParsedExchange {
  question: string;
  answer: string;
  audioUrl?: string;
}

export default function WisdomDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [entry, setEntry] = useState<WisdomEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Audio playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentExchangeIndex, setCurrentExchangeIndex] = useState(-1);
  const [playingPart, setPlayingPart] = useState<'question' | 'answer' | null>(null);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const exchangesRef = useRef<ParsedExchange[]>([]);

  const supabase = createClient();

  useEffect(() => {
    loadWisdomEntry();
    return () => {
      stopPlayback();
    };
  }, [params.id]);

  const loadWisdomEntry = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const { data, error } = await supabase
      .from('memories')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      console.error('Error loading wisdom:', error);
      router.push('/dashboard/wisdom');
      return;
    }

    setEntry(data);
    setIsLoading(false);
  };

  // Parse the description to extract Q&A pairs and audio URLs
  const parseContent = (description: string) => {
    const parts = description.split('## Conversation');
    const summaryPart = parts[0]?.replace('## Summary', '').trim();
    
    const qaSection = parts[1] || '';
    const exchanges: ParsedExchange[] = [];
    
    // Split by --- separator first
    const qaPairs = qaSection.split(/\n\n---\n\n/).filter(s => s.trim());
    
    for (const pair of qaPairs) {
      // Extract question
      const qMatch = pair.match(/\*\*Q\d+:\*\*\s*(.+?)(?=\n\n\*\*A)/s);
      // Extract answer
      const aMatch = pair.match(/\*\*A\d+:\*\*\s*(.+?)(?=\n\n🎙️|$)/s);
      // Extract audio URL
      const audioMatch = pair.match(/🎙️ \[Audio\]\((.+?)\)/);
      
      if (qMatch && aMatch) {
        exchanges.push({
          question: qMatch[1]?.trim() || '',
          answer: aMatch[1]?.trim() || '',
          audioUrl: audioMatch?.[1]?.trim(),
        });
      }
    }

    exchangesRef.current = exchanges;
    return { summary: summaryPart, exchanges };
  };

  // Stop all playback
  const stopPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    speechRef.current = null;
    setIsPlaying(false);
    setCurrentExchangeIndex(-1);
    setPlayingPart(null);
    setPlaybackProgress(0);
  }, []);

  // Speak text using browser TTS
  const speakText = useCallback((text: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => 
        v.name.includes('Samantha') || 
        v.name.includes('Google US English') ||
        v.name.includes('Karen') ||
        (v.lang.startsWith('en') && v.localService)
      ) || voices.find(v => v.lang.startsWith('en-US')) || voices[0];
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = (e) => reject(e);

      speechRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    });
  }, []);

  // Play audio from URL
  const playAudioUrl = useCallback((url: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const audio = new Audio(url);
      audioRef.current = audio;
      
      audio.onended = () => {
        audioRef.current = null;
        resolve();
      };
      audio.onerror = () => {
        audioRef.current = null;
        reject(new Error('Audio playback failed'));
      };
      
      audio.play().catch(reject);
    });
  }, []);

  // Play all exchanges in sequence
  const playAllExchanges = useCallback(async () => {
    const exchanges = exchangesRef.current;
    if (exchanges.length === 0) return;

    setIsPlaying(true);
    
    try {
      for (let i = 0; i < exchanges.length; i++) {
        // Check if stopped
        if (!isPlaying && i > 0) break;
        
        const exchange = exchanges[i];
        setCurrentExchangeIndex(i);
        setPlaybackProgress(((i) / exchanges.length) * 100);

        // Play question (TTS)
        setPlayingPart('question');
        try {
          await speakText(exchange.question);
        } catch (e) {
          console.log('TTS failed for question, skipping:', e);
        }
        
        // Small pause between question and answer
        await new Promise(r => setTimeout(r, 400));

        // Play answer (audio URL if available, else TTS)
        setPlayingPart('answer');
        if (exchange.audioUrl) {
          try {
            await playAudioUrl(exchange.audioUrl);
          } catch (e) {
            console.log('Audio URL failed, trying TTS:', e);
            await speakText(exchange.answer);
          }
        } else {
          await speakText(exchange.answer);
        }

        // Pause between exchanges
        if (i < exchanges.length - 1) {
          await new Promise(r => setTimeout(r, 600));
        }
      }
      
      setPlaybackProgress(100);
    } catch (error) {
      console.error('Playback error:', error);
    } finally {
      setIsPlaying(false);
      setCurrentExchangeIndex(-1);
      setPlayingPart(null);
    }
  }, [speakText, playAudioUrl]);

  // Toggle play/stop
  const togglePlayback = () => {
    if (isPlaying) {
      stopPlayback();
    } else {
      playAllExchanges();
    }
  };

  // Skip to next exchange
  const skipToNext = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen relative">
        <div className="home-background">
          <div className="home-blob home-blob-1" />
          <div className="home-blob home-blob-2" />
        </div>
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-8 h-8 border-2 border-[#4A3552] border-t-transparent rounded-full"
          />
        </div>
      </div>
    );
  }

  if (!entry) return null;

  const { summary, exchanges } = parseContent(entry.description || '');
  const displayTags = (entry.tags || []).filter(t => !['conversation', 'wisdom', 'knowledge'].includes(t));

  return (
    <div className="min-h-screen relative pb-24">
      {/* Warm background with blobs */}
      <div className="home-background">
        <div className="home-blob home-blob-1" />
        <div className="home-blob home-blob-2" />
        <div className="home-blob home-blob-3" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Back link */}
        <div className="max-w-3xl mx-auto px-6 py-6">
          <Link 
            href="/dashboard/wisdom"
            className="inline-flex items-center gap-2 text-[#4A3552] hover:text-[#6a4572] transition-colors font-medium"
          >
            <ArrowLeft size={20} />
            <span>Back to Wisdom</span>
          </Link>
        </div>

        <div className="max-w-3xl mx-auto px-6">
          {/* Main Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg overflow-hidden"
          >
            {/* Header */}
            <div className="p-8 border-b border-gray-100">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#4A3552]/20 to-[#D9C61A]/20 flex items-center justify-center flex-shrink-0">
                  <Lightbulb size={28} className="text-[#4A3552]" />
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl font-semibold text-[#2d2d2d] mb-2">
                    {entry.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={14} />
                      {new Date(entry.created_at).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    {displayTags.length > 0 && (
                      <div className="flex items-center gap-2">
                        {displayTags.map(tag => (
                          <span 
                            key={tag}
                            className="px-2.5 py-0.5 bg-[#4A3552]/10 text-[#4A3552] rounded-full text-xs font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Stitched Audio Player */}
              {exchanges.length > 0 && (
                <div className="mt-6">
                  <button
                    onClick={togglePlayback}
                    className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-[#4A3552]/5 to-[#D9C61A]/5 hover:from-[#4A3552]/10 hover:to-[#D9C61A]/10 rounded-2xl transition-all w-full border border-[#4A3552]/10"
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isPlaying ? 'bg-[#4A3552]' : 'bg-[#4A3552]/20'}`}>
                      {isPlaying ? (
                        <Square size={18} className="text-white" fill="white" />
                      ) : (
                        <Play size={20} className="text-[#4A3552] ml-0.5" />
                      )}
                    </div>
                    <div className="text-left flex-1">
                      <span className="text-[#2d2d2d] font-medium">
                        {isPlaying 
                          ? `Playing ${playingPart === 'question' ? 'Question' : 'Response'} ${currentExchangeIndex + 1}/${exchanges.length}`
                          : 'Play Full Conversation'
                        }
                      </span>
                      <p className="text-xs text-gray-500">
                        {isPlaying 
                          ? 'Tap to stop'
                          : `${exchanges.length} exchanges • AI questions + your responses`
                        }
                      </p>
                    </div>
                    {isPlaying && (
                      <button
                        onClick={(e) => { e.stopPropagation(); skipToNext(); }}
                        className="p-2 hover:bg-[#4A3552]/10 rounded-full transition-colors"
                        title="Skip to next"
                      >
                        <SkipForward size={20} className="text-[#4A3552]" />
                      </button>
                    )}
                  </button>
                  
                  {/* Progress bar */}
                  {isPlaying && (
                    <div className="mt-2 h-1 bg-[#4A3552]/10 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-[#4A3552]"
                        initial={{ width: 0 }}
                        animate={{ width: `${playbackProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* AI Insights */}
            {entry.ai_summary && (
              <div className="p-8 bg-gradient-to-br from-[#4A3552]/5 to-[#D9C61A]/5 border-b border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles size={18} className="text-[#4A3552]" />
                  <h3 className="text-sm font-semibold text-[#4A3552] uppercase tracking-wide">AI Insights</h3>
                </div>
                <div className="prose prose-sm max-w-none text-[#2d2d2d]">
                  {entry.ai_summary.split('\n').map((line, i) => {
                    // Parse bullet points with bold headers
                    const match = line.match(/^-\s*\*\*(.+?)\*\*:\s*(.+)$/);
                    if (match) {
                      return (
                        <div key={i} className="flex items-start gap-3 mb-3">
                          <div className="w-2 h-2 rounded-full bg-[#D9C61A] mt-2 flex-shrink-0" />
                          <div>
                            <span className="font-semibold text-[#4A3552]">{match[1]}:</span>
                            <span className="text-gray-700 ml-1">{match[2]}</span>
                          </div>
                        </div>
                      );
                    }
                    // Regular lines
                    if (line.trim()) {
                      return <p key={i} className="text-gray-700 mb-2">{line}</p>;
                    }
                    return null;
                  })}
                </div>
              </div>
            )}

            {/* Quick Summary */}
            {summary && (
              <div className="p-8 bg-gradient-to-br from-[#D9C61A]/5 to-transparent">
                <div className="flex items-start gap-4">
                  <Quote size={24} className="text-[#D9C61A] flex-shrink-0 mt-1" />
                  <p className="text-[#2d2d2d] leading-relaxed text-lg italic">
                    {summary.length > 200 ? summary.slice(0, 200) + '...' : summary}
                  </p>
                </div>
              </div>
            )}

            {/* Q&A Exchanges */}
            {exchanges.length > 0 && (
              <div className="p-8">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-6 flex items-center gap-2">
                  <Volume2 size={16} />
                  The Conversation
                </h2>
                
                <div className="space-y-6">
                  {exchanges.map((exchange, index) => (
                    <div 
                      key={index} 
                      className={`space-y-3 transition-all duration-300 ${
                        currentExchangeIndex === index 
                          ? 'scale-[1.02] opacity-100' 
                          : currentExchangeIndex >= 0 
                            ? 'opacity-50' 
                            : 'opacity-100'
                      }`}
                    >
                      {/* Question */}
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                          currentExchangeIndex === index && playingPart === 'question'
                            ? 'bg-[#406A56] text-white'
                            : 'bg-[#406A56]/10 text-[#406A56]'
                        }`}>
                          <span className="text-xs font-bold">Q</span>
                        </div>
                        <p className={`pt-1.5 font-medium transition-colors ${
                          currentExchangeIndex === index && playingPart === 'question'
                            ? 'text-[#406A56]'
                            : 'text-gray-600'
                        }`}>
                          {exchange.question}
                        </p>
                      </div>
                      
                      {/* Answer */}
                      <div className="ml-11">
                        <div className={`rounded-2xl p-5 transition-colors ${
                          currentExchangeIndex === index && playingPart === 'answer'
                            ? 'bg-[#4A3552]/10 border border-[#4A3552]/20'
                            : 'bg-[#F2F1E5]'
                        }`}>
                          <p className="text-[#2d2d2d] leading-relaxed">
                            {exchange.answer}
                          </p>
                          {/* Individual play button */}
                          {exchange.audioUrl && (
                            <button
                              onClick={() => playAudioUrl(exchange.audioUrl!)}
                              className="mt-3 flex items-center gap-2 text-sm text-[#4A3552] hover:text-[#6a4572] transition-colors"
                            >
                              <Play size={14} fill="currentColor" />
                              <span>Play this response</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fallback if no parsed content */}
            {!summary && exchanges.length === 0 && entry.description && (
              <div className="p-8">
                <p className="text-[#2d2d2d] leading-relaxed whitespace-pre-wrap">
                  {entry.description}
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
