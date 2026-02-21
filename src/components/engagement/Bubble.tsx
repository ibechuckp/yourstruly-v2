'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, Type, SkipForward, Send, MicOff, Sparkles, User, Phone, Mail, Calendar, MapPin } from 'lucide-react';
import type { EngagementPrompt, PromptResponse } from '@/types/engagement';

interface BubbleProps {
  prompt: EngagementPrompt;
  index: number;
  isExpanded: boolean;
  onClick: () => void;
  onAnswer: (response: PromptResponse) => void;
  onSkip: () => void;
  onDismiss: () => void;
  onClose: () => void;
  rotation?: number;
}

const TYPE_CONFIG: Record<string, { icon: string; label: string; xp: number }> = {
  photo_backstory: { icon: '📸', label: 'Photo Story', xp: 15 },
  tag_person: { icon: '👤', label: 'Tag Person', xp: 5 },
  missing_info: { icon: '📝', label: 'Contact Info', xp: 5 },
  memory_prompt: { icon: '💭', label: 'Memory', xp: 20 },
  knowledge: { icon: '🧠', label: 'Knowledge', xp: 15 },
  connect_dots: { icon: '🔗', label: 'Connect', xp: 10 },
  highlight: { icon: '⭐', label: 'Highlight', xp: 5 },
  quick_question: { icon: '👤', label: 'Contact Info', xp: 5 },
  postscript: { icon: '💌', label: 'Future Message', xp: 20 },
  favorites_firsts: { icon: '🏆', label: 'Favorites', xp: 10 },
  recipes_wisdom: { icon: '📖', label: 'Wisdom', xp: 15 },
};

// Contact fields to display when expanded
const CONTACT_FIELDS = [
  { key: 'phone', label: 'Phone', icon: Phone },
  { key: 'email', label: 'Email', icon: Mail },
  { key: 'date_of_birth', label: 'Birthday', icon: Calendar },
  { key: 'address', label: 'Address', icon: MapPin },
];

export function Bubble({
  prompt,
  index,
  isExpanded,
  onClick,
  onAnswer,
  onSkip,
  onDismiss,
  onClose,
  rotation = 0,
}: BubbleProps) {
  const [inputMode, setInputMode] = useState<'voice' | 'text' | null>(null);
  const [textValue, setTextValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const config = TYPE_CONFIG[prompt.type] || TYPE_CONFIG.memory_prompt;
  
  // Determine if this is a contact-related prompt
  const isContactPrompt = prompt.type === 'quick_question' || prompt.type === 'missing_info';
  
  // For contact prompts, generate a better prompt text if we have contact name
  const getDisplayText = (name: string | null) => {
    if (isContactPrompt && name) {
      if (prompt.missingField) {
        // Missing info prompt - ask about specific field
        const fieldLabels: Record<string, string> = {
          phone: 'phone number',
          email: 'email address',
          date_of_birth: 'birthday',
          address: 'address',
          relationship: 'relationship to you',
        };
        const fieldLabel = fieldLabels[prompt.missingField] || prompt.missingField;
        return `What is ${name}'s ${fieldLabel}?`;
      }
      // Generic contact update
      return `Update ${name}'s information`;
    }
    // Replace template variables for other prompt types
    return prompt.promptText
      .replace(/\{\{contact_name\}\}/g, name || 'this person')
      .replace(/\{\{suggested_location\}\}/g, '...')
      .replace(/\{\{.*?\}\}/g, '');
  };

  const handleTextSubmit = useCallback(async () => {
    if (!textValue.trim()) return;
    setIsSubmitting(true);
    try {
      await onAnswer({ type: 'text', text: textValue });
      setTextValue('');
      setInputMode(null);
    } catch (err) {
      console.error('Failed to submit:', err);
    }
    setIsSubmitting(false);
  }, [textValue, onAnswer]);

  const handleQuickAnswer = useCallback(async (value: string) => {
    setIsSubmitting(true);
    try {
      await onAnswer({ type: 'selection', data: { value } });
    } catch (err) {
      console.error('Failed to submit:', err);
    }
    setIsSubmitting(false);
  }, [onAnswer]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTextSubmit();
    }
  };

  const selectTextMode = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setInputMode('text');
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, []);

  const selectVoiceMode = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setInputMode('voice');
  }, []);

  const cancelInput = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setInputMode(null);
    setTextValue('');
  }, []);

  const hasPhoto = prompt.photoUrl && 
    (prompt.type === 'photo_backstory' || prompt.type === 'tag_person');

  // Get contact metadata for expanded view
  const contactMeta = prompt.metadata?.contact || {};

  // Get display name with fallback
  const getContactDisplayName = () => {
    if (prompt.contactName) return prompt.contactName;
    if (prompt.metadata?.contact?.name) return prompt.metadata.contact.name;
    if (prompt.metadata?.suggested_contact_name) return prompt.metadata.suggested_contact_name;
    return null;
  };
  
  const contactDisplayName = getContactDisplayName();
  const displayText = getDisplayText(contactDisplayName);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0, rotate: isExpanded ? 0 : rotation }}
      exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 400, damping: 30, delay: index * 0.03 }}
      onClick={!isExpanded ? onClick : undefined}
      data-type={prompt.type}
      className={`bubble-card ${isExpanded ? 'expanded' : ''} ${!isExpanded ? 'cursor-pointer' : ''}`}
    >
      {/* XP Badge */}
      {!isExpanded && (
        <div className="bubble-xp-badge">
          <Sparkles size={10} />
          +{config.xp} XP
        </div>
      )}

      {/* Close button when expanded */}
      {isExpanded && (
        <button 
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="bubble-close-btn"
        >
          <X size={14} className="text-gray-500" />
        </button>
      )}

      {/* Main content */}
      <div className="p-4 pt-5">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">{config.icon}</span>
          <span className="bubble-type-label">{config.label}</span>
        </div>

        {/* Contact card (collapsed view - always show for contact prompts) */}
        {isContactPrompt && contactDisplayName && !isExpanded && (
          <div className="bubble-contact-card">
            <div className="bubble-contact-avatar">
              {prompt.contactPhotoUrl ? (
                <img src={prompt.contactPhotoUrl} alt="" />
              ) : (
                contactDisplayName.charAt(0).toUpperCase()
              )}
            </div>
            <div className="bubble-contact-info">
              <p className="bubble-contact-name">{contactDisplayName}</p>
              <p className="bubble-contact-subtitle">
                {prompt.missingField ? `Add ${prompt.missingField.replace('_', ' ')}` : 'Update their info'}
              </p>
            </div>
          </div>
        )}

        {/* Expanded contact info */}
        {isContactPrompt && contactDisplayName && isExpanded && (
          <div className="bubble-contact-expanded">
            {/* Large avatar header */}
            <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-100">
              <div className="w-16 h-16 rounded-full bg-[var(--yt-green-light)] text-[var(--yt-green)] flex items-center justify-center text-2xl font-bold">
                {prompt.contactPhotoUrl ? (
                  <img src={prompt.contactPhotoUrl} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  contactDisplayName.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{contactDisplayName}</h3>
                <p className="text-sm text-[var(--yt-green)]">{contactMeta.relationship || 'Family member'}</p>
              </div>
            </div>

            {/* Contact fields */}
            {CONTACT_FIELDS.map(({ key, label, icon: Icon }) => {
              const value = contactMeta[key];
              const isMissing = !value || key === prompt.missingField;
              return (
                <div key={key} className={`bubble-contact-field ${isMissing && key === prompt.missingField ? 'missing' : ''}`}>
                  <span className="bubble-contact-field-label flex items-center gap-2">
                    <Icon size={14} className="text-gray-400" />
                    {label}
                  </span>
                  <span className="bubble-contact-field-value">
                    {key === prompt.missingField ? '← Fill this in' : (value || '—')}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Photo preview */}
        {hasPhoto && (
          <img 
            src={prompt.photoUrl} 
            alt="" 
            className="bubble-photo"
          />
        )}

        {/* Prompt text (non-contact prompts or as subtitle) */}
        {!isContactPrompt && (
          <p className="bubble-prompt-text">{displayText}</p>
        )}

        {/* Collapsed hint */}
        {!isExpanded && (
          <p className="bubble-hint">tap to answer →</p>
        )}
      </div>

      {/* Expanded input area */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="px-4 pb-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Prompt text when expanded (for contact prompts, show as question) */}
            {isContactPrompt && (
              <p className="bubble-prompt-text mb-4">{displayText}</p>
            )}

            {/* Quick question buttons (Yes/No style) */}
            {prompt.metadata?.options && (
              <div className="bubble-quick-answers">
                {prompt.metadata.options.map((option: string) => (
                  <button
                    key={option}
                    onClick={() => handleQuickAnswer(option)}
                    disabled={isSubmitting}
                    className="bubble-quick-btn"
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}

            {/* Text/Voice input (for prompts without predefined options) */}
            {!prompt.metadata?.options && (
              <>
                {inputMode === null ? (
                  <div className="bubble-input-buttons">
                    <button onClick={selectVoiceMode} className="bubble-input-btn">
                      <Mic size={16} />
                      <span>Speak</span>
                    </button>
                    <button onClick={selectTextMode} className="bubble-input-btn">
                      <Type size={16} />
                      <span>Type</span>
                    </button>
                  </div>
                ) : inputMode === 'text' ? (
                  <div className="mb-3">
                    <textarea
                      ref={textareaRef}
                      value={textValue}
                      onChange={(e) => setTextValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onClick={(e) => e.stopPropagation()}
                      placeholder={isContactPrompt ? "Enter the info..." : "Share your memory..."}
                      rows={3}
                      className="bubble-textarea"
                    />
                    <div className="flex items-center justify-between mt-3">
                      <button onClick={cancelInput} className="bubble-action-btn">
                        Cancel
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleTextSubmit(); }}
                        disabled={!textValue.trim() || isSubmitting}
                        className="bubble-submit-btn"
                      >
                        <Send size={14} />
                        {isSubmitting ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 bg-gray-50 rounded-xl text-center mb-3">
                    <MicOff size={24} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-400 text-sm mb-3">Voice recording coming soon</p>
                    <button onClick={selectTextMode} className="text-sm text-[var(--yt-green)] font-medium">
                      Type your response instead
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Footer */}
            <div className="bubble-footer">
              <button onClick={(e) => { e.stopPropagation(); onSkip(); }} className="bubble-action-btn">
                <SkipForward size={12} />
                Skip for now
              </button>
              <button onClick={(e) => { e.stopPropagation(); onDismiss(); }} className="bubble-action-btn">
                Don't ask again
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
