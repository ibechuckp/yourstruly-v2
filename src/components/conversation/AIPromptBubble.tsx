'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Bot, Volume2, VolumeX, Play, Square } from 'lucide-react';

interface AIPromptBubbleProps {
  question: string;
  isNew?: boolean;
  isLoading?: boolean;
  enableTTS?: boolean;
}

export function AIPromptBubble({ 
  question, 
  isNew = false, 
  isLoading = false,
  enableTTS = false 
}: AIPromptBubbleProps) {
  const [displayText, setDisplayText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(enableTTS);
  const [typingDone, setTypingDone] = useState(false);
  const hasSpokenRef = useRef(false);
  const questionRef = useRef(question);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Track question changes
  useEffect(() => {
    if (question !== questionRef.current) {
      questionRef.current = question;
      hasSpokenRef.current = false;
      setTypingDone(false);
    }
  }, [question]);

  // Text-to-speech using multiple fallbacks
  const speakText = useCallback(async (text: string) => {
    // Stop any current audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // Try browser speech synthesis first
    if ('speechSynthesis' in window) {
      const voices = window.speechSynthesis.getVoices();
      
      if (voices.length > 0) {
        console.log('TTS: Using browser voices');
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.95;
        utterance.pitch = 1;
        utterance.volume = 1;
        
        const preferredVoice = voices.find(v => 
          v.name.includes('Samantha') || 
          v.name.includes('Google US English') ||
          v.name.includes('Karen') ||
          (v.lang.startsWith('en') && v.localService)
        ) || voices.find(v => v.lang.startsWith('en-US')) || voices[0];
        
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
        return;
      }
    }

    // Fallback: Use our TTS proxy API
    console.log('TTS: Using TTS proxy API');
    try {
      setIsSpeaking(true);
      
      // Split long text into chunks (TTS has a limit)
      const maxLen = 200;
      const chunks: string[] = [];
      let remaining = text;
      
      while (remaining.length > 0) {
        if (remaining.length <= maxLen) {
          chunks.push(remaining);
          break;
        }
        let breakPoint = remaining.lastIndexOf(' ', maxLen);
        if (breakPoint === -1) breakPoint = maxLen;
        chunks.push(remaining.slice(0, breakPoint));
        remaining = remaining.slice(breakPoint).trim();
      }

      // Play chunks sequentially
      for (const chunk of chunks) {
        const url = `/api/tts?text=${encodeURIComponent(chunk)}`;
        
        await new Promise<void>((resolve, reject) => {
          const audio = new Audio(url);
          audioRef.current = audio;
          
          audio.onended = () => resolve();
          audio.onerror = () => reject(new Error('Audio playback failed'));
          
          audio.play().catch(reject);
        });
      }
      
      setIsSpeaking(false);
    } catch (err) {
      console.error('TTS proxy failed:', err);
      setIsSpeaking(false);
    }
  }, []);

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  // Typing animation for new questions
  useEffect(() => {
    if (!isNew) {
      setDisplayText(question);
      setTypingDone(true);
      return;
    }

    setDisplayText('');
    setTypingDone(false);
    let index = 0;
    
    const interval = setInterval(() => {
      if (index < question.length) {
        setDisplayText(question.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
        setTypingDone(true);
      }
    }, 25);

    return () => clearInterval(interval);
  }, [question, isNew]);

  // Speak immediately when TTS is enabled (don't wait for typing)
  useEffect(() => {
    if (ttsEnabled && !hasSpokenRef.current && isNew && question) {
      hasSpokenRef.current = true;
      // Small delay to ensure audio context is ready
      setTimeout(() => speakText(question), 100);
    }
  }, [ttsEnabled, question, isNew, speakText]);

  // Stop speaking on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, [stopSpeaking]);

  // Toggle TTS
  const toggleTTS = () => {
    if (isSpeaking) {
      stopSpeaking();
    }
    setTtsEnabled(!ttsEnabled);
  };

  // Manual play/stop button
  const handlePlayStop = () => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      speakText(question);
    }
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="ai-prompt-bubble ai-prompt-bubble-loading"
      >
        <div className="ai-prompt-avatar">
          <Bot size={20} />
        </div>
        <div className="ai-prompt-content">
          <div className="ai-prompt-typing">
            <motion.span
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <motion.span
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
            />
            <motion.span
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
            />
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="ai-prompt-bubble"
    >
      <div className="ai-prompt-avatar">
        <Bot size={20} />
        {isSpeaking && (
          <motion.div
            className="ai-prompt-speaking-indicator"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          />
        )}
      </div>
      <div className="ai-prompt-content">
        <div className="ai-prompt-text">
          {displayText}
          {isNew && displayText.length < question.length && (
            <span className="ai-prompt-cursor" />
          )}
        </div>
      </div>
      <div className="ai-prompt-tts-controls">
        {/* Play/Stop button - always visible when typing is done */}
        {typingDone && (
          <button
            onClick={handlePlayStop}
            className={`ai-prompt-play-btn ${isSpeaking ? 'speaking' : ''}`}
            aria-label={isSpeaking ? 'Stop' : 'Play question'}
            title={isSpeaking ? 'Stop' : 'Play question'}
          >
            {isSpeaking ? (
              <Square size={12} fill="currentColor" />
            ) : (
              <Play size={14} fill="currentColor" />
            )}
          </button>
        )}
        {/* TTS toggle */}
        <button
          onClick={toggleTTS}
          className={`ai-prompt-tts-btn ${ttsEnabled ? 'enabled' : ''}`}
          aria-label={ttsEnabled ? 'Auto-speak on' : 'Auto-speak off'}
          title={ttsEnabled ? 'Auto-speak: ON' : 'Auto-speak: OFF'}
        >
          {ttsEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>
      </div>
    </motion.div>
  );
}
