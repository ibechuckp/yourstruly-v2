'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Mic,
  Square,
  Loader2,
  Bookmark,
  BookOpen,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  createInitialState,
  EngineState,
  ConversationContext,
} from '@/lib/conversation-engine/types';

// Speech Recognition types
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}
interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}
interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

// Use existing Window augmentation if available, otherwise declare
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface WindowWithSpeechRecognition {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}

interface ConversationEngineProps {
  context: ConversationContext;
  userName: string;
  userProfile?: {
    interests?: string[];
    religion?: string;
    location?: string;
    whyHere?: string;
  };
  initialMessage?: string; // optional first AI message
  onComplete?: (state: EngineState) => void;
  onSkip?: () => void;
  showSkip?: boolean;
  maxHeight?: string; // e.g. '400px' or '60vh'
}

export function ConversationEngine({
  context,
  userName,
  userProfile,
  initialMessage,
  onComplete,
  onSkip,
  showSkip = false,
  maxHeight = '400px',
}: ConversationEngineProps) {
  const [engineState, setEngineState] = useState<EngineState>(
    createInitialState(),
  );
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveReady, setSaveReady] = useState(false);
  const [saveType, setSaveType] = useState<'memory' | 'wisdom' | undefined>();
  const [savedMessage, setSavedMessage] = useState('');

  // Voice
  const [isRecording, setIsRecording] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [useFallback, setUseFallback] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // TTS
  const [isMuted, setIsMuted] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Display messages from engine state
  const messages = engineState.messages;

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when ready
  useEffect(() => {
    if (!isSending && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSending, messages]);

  // Set initial message if provided
  useEffect(() => {
    if (initialMessage && messages.length === 0) {
      setEngineState((prev) => ({
        ...prev,
        messages: [{ role: 'assistant', content: initialMessage }],
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMessage]);

  // TTS for assistant messages
  const speakMessage = useCallback(
    (text: string) => {
      if (isMuted || !('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(
        (v) =>
          v.name.includes('Samantha') ||
          v.name.includes('Google') ||
          v.name.includes('Natural'),
      );
      if (preferred) utterance.voice = preferred;
      window.speechSynthesis.speak(utterance);
    },
    [isMuted],
  );

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last?.role === 'assistant' && !isSending) {
      speakMessage(last.content);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, isSending, speakMessage]);

  // Send message to engine
  const handleSend = async () => {
    if (!input.trim() || isSending) return;
    const userMessage = input.trim();
    setInput('');
    setIsSending(true);

    // Optimistically add user message
    setEngineState((prev) => ({
      ...prev,
      messages: [
        ...prev.messages,
        { role: 'user' as const, content: userMessage },
      ],
    }));

    try {
      const res = await fetch('/api/conversation-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          engineState,
          context,
          userName,
          userProfile,
        }),
      });

      if (!res.ok) throw new Error('Engine error');
      const data = await res.json();

      setEngineState(data.engineState);
      setSaveReady(data.saveReady);
      setSaveType(data.saveType);
    } catch (error) {
      console.error('Engine error:', error);
      // Fallback response
      setEngineState((prev) => ({
        ...prev,
        messages: [
          ...prev.messages,
          {
            role: 'assistant',
            content: `That's really interesting, ${userName}. Tell me more about that.`,
          },
        ],
      }));
    } finally {
      setIsSending(false);
    }
  };

  // Save memory/wisdom
  const handleSave = async () => {
    if (!saveType || isSaving) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/conversation-engine/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ engineState, saveType }),
      });
      if (res.ok) {
        setSavedMessage(
          saveType === 'wisdom' ? '💡 Wisdom saved!' : '✨ Memory saved!',
        );
        setSaveReady(false);
        // Clear the active candidate after saving
        setEngineState((prev) => ({
          ...prev,
          activeCandidate: null,
          pastCandidates: prev.activeCandidate
            ? [...prev.pastCandidates, prev.activeCandidate]
            : prev.pastCandidates,
        }));
        setTimeout(() => setSavedMessage(''), 3000);
      }
    } catch (e) {
      console.error('Save error:', e);
    } finally {
      setIsSaving(false);
    }
  };

  // Voice: Web Speech API with MediaRecorder fallback
  const startFallbackRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setIsTranscribing(true);
        try {
          const blob = new Blob(audioChunksRef.current, {
            type: 'audio/webm',
          });
          const fd = new FormData();
          fd.append('audio', blob, 'recording.webm');
          const res = await fetch('/api/conversation/transcribe', {
            method: 'POST',
            body: fd,
          });
          if (res.ok) {
            const d = await res.json();
            const text = d.transcription || d.text || '';
            if (text) setInput((prev) => prev + (prev ? ' ' : '') + text);
          }
        } catch (e) {
          console.error('Transcription error:', e);
        } finally {
          setIsTranscribing(false);
        }
      };
      recorder.start();
      setIsRecording(true);
      setLiveTranscript('Recording... tap stop to transcribe');
    } catch (e) {
      console.error('Mic error:', e);
      alert('Could not access microphone.');
    }
  };

  const startRecording = () => {
    if (useFallback) {
      startFallbackRecording();
      return;
    }
    try {
      const w = window as unknown as WindowWithSpeechRecognition;
      const API = w.SpeechRecognition || w.webkitSpeechRecognition;
      if (!API) {
        setUseFallback(true);
        startFallbackRecording();
        return;
      }
      const recognition = new API();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      let networkError = false;
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = '',
          final_ = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal)
            final_ += event.results[i][0].transcript;
          else interim += event.results[i][0].transcript;
        }
        if (final_) setInput((prev) => prev + (prev ? ' ' : '') + final_);
        setLiveTranscript(interim);
      };
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        if (
          event.error === 'network' ||
          event.error === 'service-not-allowed'
        ) {
          networkError = true;
          setUseFallback(true);
          recognition.stop();
          setIsRecording(false);
          setLiveTranscript('');
          startFallbackRecording();
        } else {
          setIsRecording(false);
          setLiveTranscript('');
        }
      };
      recognition.onend = () => {
        if (!networkError) {
          setIsRecording(false);
          setLiveTranscript('');
        }
      };
      recognitionRef.current = recognition;
      recognition.start();
      setIsRecording(true);
    } catch {
      setUseFallback(true);
      startFallbackRecording();
    }
  };

  const stopRecording = () => {
    if (useFallback) {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        setLiveTranscript('');
      }
      return;
    }
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setIsRecording(false);
      setLiveTranscript('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="conversation-engine">
      {/* Chat Messages */}
      <div className="ce-messages" style={{ maxHeight, overflowY: 'auto' }}>
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`ce-msg ${msg.role === 'user' ? 'ce-msg-user' : 'ce-msg-ai'}`}
            >
              <div
                className={`ce-bubble ${msg.role === 'user' ? 'ce-bubble-user' : 'ce-bubble-ai'}`}
              >
                <p>{msg.content}</p>
              </div>
              {/* Show classification badge on user messages */}
              {msg.role === 'user' && msg.classification && (
                <span
                  className={`ce-badge ce-badge-${msg.classification.toLowerCase()}`}
                >
                  {msg.classification === 'MEMORY'
                    ? '📖'
                    : msg.classification === 'WISDOM'
                      ? '💡'
                      : msg.classification === 'INTEREST'
                        ? '✨'
                        : '💬'}
                </span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {isSending && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="ce-msg ce-msg-ai"
          >
            <div className="ce-bubble ce-bubble-ai">
              <div className="ce-typing">
                <span />
                <span />
                <span />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Save Banner */}
      <AnimatePresence>
        {saveReady && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="ce-save-banner"
          >
            <div className="ce-save-content">
              {saveType === 'wisdom' ? (
                <>
                  <BookOpen size={18} />
                  <span>Wisdom captured</span>
                </>
              ) : (
                <>
                  <Bookmark size={18} />
                  <span>Memory ready to save</span>
                </>
              )}
            </div>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="ce-save-btn"
            >
              {isSaving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Sparkles size={14} />
              )}
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Saved confirmation */}
      <AnimatePresence>
        {savedMessage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="ce-saved-toast"
          >
            {savedMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live transcript */}
      {isRecording && liveTranscript && (
        <div className="ce-live-transcript">
          {liveTranscript}
          {!useFallback && '...'}
        </div>
      )}

      {/* Input Area */}
      <div className="ce-input-area">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isTranscribing ? 'Transcribing...' : 'Share your thoughts...'
          }
          className="ce-textarea"
          rows={2}
          disabled={isSending || isTranscribing}
        />

        <div className="ce-input-actions">
          {/* Mute toggle */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="ce-icon-btn ce-mute-btn"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>

          {/* Mic */}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isSending || isTranscribing}
            className={`ce-icon-btn ${isRecording ? 'ce-recording' : ''}`}
            title={isRecording ? 'Stop' : 'Record'}
          >
            {isRecording ? (
              <Square size={18} />
            ) : isTranscribing ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Mic size={18} />
            )}
          </button>

          {/* Send */}
          <button
            onClick={handleSend}
            disabled={!input.trim() || isSending}
            className="ce-send-btn"
          >
            <Send size={18} />
          </button>
        </div>
      </div>

      {/* Skip / Complete */}
      {(showSkip || onComplete) && (
        <div className="ce-footer">
          {showSkip && onSkip && (
            <button onClick={onSkip} className="ce-skip-btn">
              Skip for now
            </button>
          )}
          {onComplete &&
            messages.filter((m) => m.role === 'user').length >= 1 && (
              <button
                onClick={() => onComplete(engineState)}
                className="ce-complete-btn"
              >
                Done <Sparkles size={14} />
              </button>
            )}
        </div>
      )}

      <style jsx>{`
        .conversation-engine {
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .ce-messages {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .ce-msg {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }
        .ce-msg-user {
          align-items: flex-end;
        }
        .ce-bubble {
          max-width: 85%;
          padding: 12px 16px;
          border-radius: 18px;
          font-size: 14px;
          line-height: 1.5;
        }
        .ce-bubble p {
          margin: 0;
        }
        .ce-bubble-user {
          background: #406a56;
          color: white;
          border-bottom-right-radius: 6px;
        }
        .ce-bubble-ai {
          background: white;
          color: #2d2d2d;
          border: 1px solid rgba(64, 106, 86, 0.12);
          border-bottom-left-radius: 6px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        }
        .ce-badge {
          font-size: 10px;
          margin-top: 4px;
          opacity: 0.5;
        }
        .ce-typing {
          display: flex;
          gap: 4px;
          padding: 4px 0;
        }
        .ce-typing span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(64, 106, 86, 0.3);
          animation: ce-bounce 1.2s infinite;
        }
        .ce-typing span:nth-child(2) {
          animation-delay: 0.15s;
        }
        .ce-typing span:nth-child(3) {
          animation-delay: 0.3s;
        }
        @keyframes ce-bounce {
          0%,
          60%,
          100% {
            transform: translateY(0);
          }
          30% {
            transform: translateY(-4px);
          }
        }
        .ce-save-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 16px;
          margin: 0 16px;
          background: linear-gradient(
            135deg,
            rgba(64, 106, 86, 0.08),
            rgba(141, 172, 171, 0.08)
          );
          border: 1px solid rgba(64, 106, 86, 0.15);
          border-radius: 12px;
        }
        .ce-save-content {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #406a56;
          font-size: 13px;
          font-weight: 600;
        }
        .ce-save-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: #406a56;
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        .ce-save-btn:hover {
          background: #355948;
        }
        .ce-save-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .ce-saved-toast {
          text-align: center;
          padding: 8px;
          color: #406a56;
          font-size: 13px;
          font-weight: 600;
        }
        .ce-live-transcript {
          padding: 4px 16px;
          font-size: 12px;
          color: rgba(45, 45, 45, 0.4);
          font-style: italic;
        }
        .ce-input-area {
          display: flex;
          gap: 8px;
          padding: 12px 16px;
          border-top: 1px solid rgba(64, 106, 86, 0.08);
          align-items: flex-end;
        }
        .ce-textarea {
          flex: 1;
          padding: 10px 14px;
          border: 1.5px solid rgba(64, 106, 86, 0.15);
          border-radius: 14px;
          font-size: 14px;
          resize: none;
          color: #2d2d2d;
          background: white;
          font-family: inherit;
          transition: border-color 0.2s;
        }
        .ce-textarea:focus {
          outline: none;
          border-color: #406a56;
          box-shadow: 0 0 0 3px rgba(64, 106, 86, 0.08);
        }
        .ce-textarea::placeholder {
          color: rgba(45, 45, 45, 0.3);
        }
        .ce-input-actions {
          display: flex;
          gap: 4px;
          flex-shrink: 0;
        }
        .ce-icon-btn {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          border-radius: 12px;
          background: rgba(64, 106, 86, 0.06);
          color: rgba(45, 45, 45, 0.5);
          cursor: pointer;
          transition: all 0.15s;
        }
        .ce-icon-btn:hover {
          background: rgba(64, 106, 86, 0.12);
          color: #406a56;
        }
        .ce-icon-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .ce-recording {
          background: #ef4444 !important;
          color: white !important;
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
        .ce-mute-btn {
          width: 32px;
          height: 32px;
        }
        .ce-send-btn {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          border-radius: 12px;
          background: #406a56;
          color: white;
          cursor: pointer;
          transition: all 0.15s;
        }
        .ce-send-btn:hover {
          background: #355948;
        }
        .ce-send-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .ce-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 16px 12px;
        }
        .ce-skip-btn {
          font-size: 12px;
          color: rgba(45, 45, 45, 0.35);
          background: none;
          border: none;
          cursor: pointer;
          transition: color 0.2s;
        }
        .ce-skip-btn:hover {
          color: rgba(45, 45, 45, 0.6);
        }
        .ce-complete-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 20px;
          background: linear-gradient(135deg, #406a56, #8dacab);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }
        .ce-complete-btn:hover {
          box-shadow: 0 4px 12px rgba(64, 106, 86, 0.3);
        }
      `}</style>
    </div>
  );
}
