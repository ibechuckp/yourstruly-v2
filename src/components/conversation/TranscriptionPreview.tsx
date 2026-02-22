'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Edit2, Check, ArrowRight, RotateCcw, X } from 'lucide-react';

interface TranscriptionPreviewProps {
  text: string;
  onEdit: (newText: string) => void;
  onContinue: () => void;
  onReRecord?: () => void;
  showReRecord?: boolean;
}

export function TranscriptionPreview({ 
  text, 
  onEdit, 
  onContinue, 
  onReRecord,
  showReRecord = false 
}: TranscriptionPreviewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(text);
  const [displayText, setDisplayText] = useState('');
  const [typingComplete, setTypingComplete] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevTextRef = useRef(text);

  // Update edited text when prop changes
  useEffect(() => {
    setEditedText(text);
  }, [text]);

  // Typing animation effect - only for fresh transcriptions
  useEffect(() => {
    if (isEditing) {
      setDisplayText(text);
      setTypingComplete(true);
      return;
    }
    
    // Skip animation if text hasn't changed significantly (was just edited)
    // or if we've already animated this response
    if (hasAnimated && Math.abs(text.length - prevTextRef.current.length) < 10) {
      setDisplayText(text);
      setTypingComplete(true);
      prevTextRef.current = text;
      return;
    }
    
    prevTextRef.current = text;
    setHasAnimated(true);
    
    let index = 0;
    setDisplayText('');
    setTypingComplete(false);
    
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayText(text.slice(0, index + 1));
        index++;
      } else {
        setTypingComplete(true);
        clearInterval(interval);
      }
    }, 15); // Faster typing

    return () => clearInterval(interval);
  }, [text, isEditing, hasAnimated]);

  // Focus textarea when entering edit mode (only on isEditing change)
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      // Move cursor to end only on initial focus
      const len = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(len, len);
    }
  }, [isEditing]); // Only trigger on edit mode change, not text changes

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditing) return;
      
      // Enter to continue (when typing is done)
      if (e.key === 'Enter' && typingComplete) {
        e.preventDefault();
        onContinue();
      }
      // E to edit
      if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        setIsEditing(true);
      }
      // R to re-record
      if ((e.key === 'r' || e.key === 'R') && showReRecord && onReRecord) {
        e.preventDefault();
        onReRecord();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, typingComplete, onContinue, onReRecord, showReRecord]);

  const handleSaveEdit = () => {
    onEdit(editedText);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedText(text);
    setIsEditing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="transcription-preview"
    >
      <div className="transcription-header">
        <h3 className="transcription-title">
          Your Response
        </h3>
        <div className="transcription-header-actions">
          {!isEditing && showReRecord && onReRecord && (
            <button
              onClick={onReRecord}
              className="transcription-rerecord-btn"
              aria-label="Re-record"
              title="Re-record (R)"
            >
              <RotateCcw size={14} />
              Re-record
            </button>
          )}
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="transcription-edit-btn"
              aria-label="Edit transcription"
              title="Edit (E)"
            >
              <Edit2 size={14} />
              Edit
            </button>
          )}
        </div>
      </div>

      <div className="transcription-content">
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            className="transcription-textarea"
            rows={5}
            aria-label="Edit your response"
            placeholder="Type your response..."
          />
        ) : (
          <div className="transcription-text" aria-live="polite">
            {displayText}
            {!typingComplete && (
              <span className="transcription-cursor" />
            )}
          </div>
        )}
      </div>

      {/* Accuracy notice */}
      {!isEditing && typingComplete && (
        <p className="transcription-hint">
          Does this look right? Edit if needed, or continue to the next question.
        </p>
      )}

      <div className="transcription-actions">
        {isEditing ? (
          <>
            <button
              onClick={handleCancelEdit}
              className="transcription-btn transcription-btn-secondary"
            >
              <X size={16} />
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              className="transcription-btn transcription-btn-primary"
              disabled={!editedText.trim()}
            >
              <Check size={16} />
              Save Changes
            </button>
          </>
        ) : (
          <>
            {/* Keyboard hints */}
            <div className="transcription-shortcuts">
              <kbd>E</kbd> edit
              {showReRecord && <><kbd>R</kbd> re-record</>}
              <kbd>↵</kbd> continue
            </div>
            <button
              onClick={onContinue}
              disabled={!typingComplete || !text.trim()}
              className="transcription-btn transcription-btn-primary"
            >
              Looks Good
              <ArrowRight size={16} />
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}
