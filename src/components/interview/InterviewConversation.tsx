'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Keyboard, Check, Loader2, Video } from 'lucide-react';
import { MediaRecorder } from '../conversation/MediaRecorder';
import { TranscriptionPreview } from '../conversation/TranscriptionPreview';

interface InterviewQuestion {
  id: string;
  question_text: string;
  status: string;
}

interface Exchange {
  question: string;
  response: string;
  audioUrl?: string;
}

interface InterviewConversationProps {
  sessionId: string;
  accessToken: string;
  userId: string;
  question: InterviewQuestion;
  contactName: string;
  onComplete: () => void;
  onClose: () => void;
}

type ViewState = 'recording' | 'transcribing' | 'confirming' | 'generating' | 'review' | 'saving' | 'complete';
type InputMode = 'voice' | 'text';

export function InterviewConversation({
  sessionId,
  accessToken,
  userId,
  question,
  contactName,
  onComplete,
  onClose,
}: InterviewConversationProps) {
  const [viewState, setViewState] = useState<ViewState>('recording');
  const [inputMode, setInputMode] = useState<InputMode>('voice');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isGeneratingFollowup, setIsGeneratingFollowup] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Current question (starts with the initial, then AI follow-ups)
  const [currentQuestion, setCurrentQuestion] = useState(question.question_text);
  
  // All exchanges in this conversation
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  
  // Recording data
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingType, setRecordingType] = useState<'video' | 'audio' | null>(null);
  
  // Transcription
  const [pendingResponse, setPendingResponse] = useState<{
    text: string;
    audioBlob?: Blob;
  } | null>(null);
  
  // Text input
  const [textInput, setTextInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea in text mode
  useEffect(() => {
    if (inputMode === 'text' && textareaRef.current && viewState === 'recording') {
      textareaRef.current.focus();
    }
  }, [inputMode, viewState]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (viewState === 'confirming') {
          setPendingResponse(null);
          setViewState('recording');
        } else if (exchanges.length > 0) {
          // If we have exchanges, go to review instead of closing
          setViewState('review');
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, viewState, exchanges.length]);

  // Generate AI follow-up question
  const generateFollowUp = useCallback(async (allExchanges: Exchange[]): Promise<string | null> => {
    try {
      setIsGeneratingFollowup(true);
      setViewState('generating');
      
      const response = await fetch('/api/conversation/follow-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exchanges: allExchanges,
          promptType: 'interview',
          originalPrompt: question.question_text,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate follow-up');
      }

      const data = await response.json();
      return data.shouldEnd ? null : data.followUpQuestion;
    } catch (err) {
      console.error('Error generating follow-up:', err);
      return null;
    } finally {
      setIsGeneratingFollowup(false);
    }
  }, [question.question_text]);

  // Handle recording complete - transcribe via API
  const handleRecordingComplete = useCallback(async (blob: Blob, duration: number, type: 'video' | 'audio') => {
    setIsTranscribing(true);
    setRecordedBlob(blob);
    setRecordingDuration(duration);
    setRecordingType(type);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('audio', blob, 'recording.webm');

      const response = await fetch('/api/conversation/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      const data = await response.json();
      const transcribedText = data.transcription || '';
      
      setPendingResponse({
        text: transcribedText,
        audioBlob: blob,
      });
      setViewState('confirming');
      
    } catch (err) {
      console.error('Error processing recording:', err);
      // Allow user to type manually if transcription fails
      setPendingResponse({
        text: '',
        audioBlob: blob,
      });
      setViewState('confirming');
      setError('Transcription failed. You can type your response instead.');
    } finally {
      setIsTranscribing(false);
    }
  }, []);

  // Handle text input submit
  const handleTextSubmit = useCallback(() => {
    if (!textInput.trim()) return;
    
    setPendingResponse({ text: textInput });
    setViewState('confirming');
  }, [textInput]);

  // Handle re-record
  const handleReRecord = useCallback(() => {
    setPendingResponse(null);
    setRecordedBlob(null);
    setViewState('recording');
    setError(null);
  }, []);

  // Handle user confirming their response
  const handleConfirmResponse = useCallback(async (confirmedText: string) => {
    if (!confirmedText.trim()) {
      setError('Please enter a response before continuing.');
      return;
    }

    // Add to exchanges
    const newExchange: Exchange = {
      question: currentQuestion,
      response: confirmedText,
      audioUrl: undefined, // We'll upload when saving
    };

    const updatedExchanges = [...exchanges, newExchange];
    setExchanges(updatedExchanges);
    setPendingResponse(null);
    setTextInput('');

    // Check if we've reached minimum exchanges (5) - offer to continue or finish
    if (updatedExchanges.length >= 5) {
      setViewState('review');
      return;
    }

    // Generate follow-up question
    const followUp = await generateFollowUp(updatedExchanges);
    
    if (followUp) {
      setCurrentQuestion(followUp);
      setViewState('recording');
      setRecordedBlob(null);
      setRecordingType(null);
    } else {
      // AI says we're done
      setViewState('review');
    }
  }, [currentQuestion, exchanges, generateFollowUp]);

  // Handle skip (go to review if we have exchanges)
  const handleSkip = useCallback(() => {
    if (exchanges.length > 0) {
      setViewState('review');
    } else {
      onClose();
    }
  }, [exchanges.length, onClose]);

  // Continue from review (get more follow-ups)
  const handleContinue = useCallback(async () => {
    const followUp = await generateFollowUp(exchanges);
    
    if (followUp) {
      setCurrentQuestion(followUp);
      setViewState('recording');
      setRecordedBlob(null);
      setRecordingType(null);
    } else {
      setError('No more follow-up questions. Ready to save.');
    }
  }, [exchanges, generateFollowUp]);

  // Save all responses
  const handleSave = useCallback(async () => {
    setViewState('saving');
    setError(null);

    try {
      // Save the complete conversation as one interview response
      const saveResponse = await fetch('/api/interviews/save-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          questionId: question.id,
          accessToken,
          exchanges,
          originalQuestion: question.question_text,
        }),
      });

      if (!saveResponse.ok) {
        const errorData = await saveResponse.json();
        throw new Error(errorData.details || errorData.error || 'Failed to save');
      }

      setViewState('complete');
      
      setTimeout(() => {
        onComplete();
      }, 2000);

    } catch (err: any) {
      console.error('Save error:', err);
      setError(err.message || 'Failed to save. Please try again.');
      setViewState('review');
    }
  }, [sessionId, question.id, question.question_text, accessToken, exchanges, onComplete]);

  return (
    <div className="interview-conversation">
      {/* Header */}
      <div className="interview-conversation-header">
        <div className="interview-conversation-progress">
          {exchanges.length} response{exchanges.length !== 1 ? 's' : ''} captured
        </div>
        <button
          onClick={exchanges.length > 0 ? () => setViewState('review') : onClose}
          className="interview-conversation-close"
          aria-label="Close"
        >
          <X size={20} />
        </button>
      </div>

      {/* Question Display */}
      <div className="interview-conversation-question">
        <div className="interview-question-label">
          <Sparkles size={16} />
          <span>Question for {contactName}</span>
        </div>
        <h2 className="interview-question-text">{currentQuestion}</h2>
      </div>

      {/* Recording State */}
      {viewState === 'recording' && (
        <div className="interview-conversation-recording">
          {/* Input mode toggle - Record or Type */}
          <div className="interview-input-toggle">
            <button
              onClick={() => setInputMode('voice')}
              className={`interview-mode-btn ${inputMode === 'voice' ? 'active' : ''}`}
            >
              <Video size={16} />
              Record
            </button>
            <button
              onClick={() => setInputMode('text')}
              className={`interview-mode-btn ${inputMode === 'text' ? 'active' : ''}`}
            >
              <Keyboard size={16} />
              Type
            </button>
          </div>

          {/* Video/Voice input */}
          {inputMode === 'voice' && (
            isTranscribing ? (
              <div className="interview-transcribing">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles size={32} className="text-[#4A7C59]" />
                </motion.div>
                <p>Transcribing your response...</p>
              </div>
            ) : (
              <MediaRecorder
                onRecordingComplete={handleRecordingComplete}
                onSkip={handleSkip}
                isLoading={false}
                allowVideo={true}
                defaultMode="voice"
              />
            )
          )}

          {/* Text input */}
          {inputMode === 'text' && (
            <div className="interview-text-input">
              <textarea
                ref={textareaRef}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Type your response here..."
                className="interview-textarea"
                rows={5}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    handleTextSubmit();
                  }
                }}
              />
              <div className="interview-text-actions">
                <button onClick={handleSkip} className="interview-btn-secondary">
                  {exchanges.length > 0 ? 'Review & Save' : 'Skip'}
                </button>
                <button
                  onClick={handleTextSubmit}
                  disabled={!textInput.trim()}
                  className="interview-btn-primary"
                >
                  Continue (⌘↵)
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirming State */}
      {viewState === 'confirming' && pendingResponse && (
        <div className="interview-conversation-confirming">
          <TranscriptionPreview
            text={pendingResponse.text}
            onEdit={(newText) => setPendingResponse({ ...pendingResponse, text: newText })}
            onContinue={() => handleConfirmResponse(pendingResponse.text)}
            onReRecord={handleReRecord}
            showReRecord={!!pendingResponse.audioBlob}
          />
        </div>
      )}

      {/* Generating Follow-up State */}
      {viewState === 'generating' && (
        <div className="interview-conversation-generating">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Sparkles size={48} className="text-[#406A56]" />
          </motion.div>
          <p>Thinking of a follow-up question...</p>
        </div>
      )}

      {/* Review State - Show all exchanges and offer to continue or save */}
      {viewState === 'review' && (
        <div className="interview-conversation-review">
          <h3>Your Responses</h3>
          <div className="interview-exchanges-list">
            {exchanges.map((exchange, index) => (
              <div key={index} className="interview-exchange-item">
                <div className="interview-exchange-q">Q: {exchange.question}</div>
                <div className="interview-exchange-a">A: {exchange.response}</div>
              </div>
            ))}
          </div>
          <div className="interview-review-actions">
            <button onClick={handleContinue} className="interview-btn-secondary" disabled={isGeneratingFollowup}>
              {isGeneratingFollowup ? 'Generating...' : 'Add More'}
            </button>
            <button onClick={handleSave} className="interview-btn-primary">
              Save Responses
            </button>
          </div>
        </div>
      )}

      {/* Saving State */}
      {viewState === 'saving' && (
        <div className="interview-conversation-saving">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Loader2 size={48} className="text-[#406A56]" />
          </motion.div>
          <p>Saving your responses...</p>
        </div>
      )}

      {/* Complete State */}
      {viewState === 'complete' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="interview-conversation-complete"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 15 }}
            className="interview-complete-icon"
          >
            <Check size={32} />
          </motion.div>
          <h2>Responses Saved!</h2>
          <p>{exchanges.length} responses captured</p>
        </motion.div>
      )}

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="interview-conversation-error"
        >
          {error}
        </motion.div>
      )}
    </div>
  );
}
