'use client';

import { useState, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { Save, Trash2, Sparkles, Edit2, Check, ChevronDown, ChevronUp, Image, X, Plus } from 'lucide-react';

interface Exchange {
  question: string;
  response: string;
  audioUrl?: string;
  transcription?: string;
}

interface ReviewScreenProps {
  exchanges: Exchange[];
  promptType: string;
  expectedXp?: number;
  onSave: (summary: string, photos?: File[]) => void;
  onDiscard: () => void;
  isSaving?: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  photo_backstory: 'Photo Story',
  tag_person: 'Person Tag',
  missing_info: 'Contact Info',
  memory_prompt: 'Memory',
  knowledge: 'Knowledge',
  connect_dots: 'Connection',
  highlight: 'Highlight',
  quick_question: 'Quick Answer',
  postscript: 'Future Message',
  favorites_firsts: 'Favorites & Firsts',
  recipes_wisdom: 'Recipe or Wisdom',
};

export function ReviewScreen({ 
  exchanges, 
  promptType,
  expectedXp = 15,
  onSave, 
  onDiscard,
  isSaving = false 
}: ReviewScreenProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedSummary, setEditedSummary] = useState('');
  const [expandedExchanges, setExpandedExchanges] = useState<number[]>([]);
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newPhotos = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    setPhotos(prev => [...prev, ...newPhotos].slice(0, 5)); // Max 5 photos
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  // Generate a combined summary from all exchanges
  const generatedSummary = useMemo(() => {
    return exchanges.map((exchange, index) => {
      if (index === 0) {
        return exchange.response;
      }
      return exchange.response;
    }).join('\n\n');
  }, [exchanges]);

  // Initialize edited summary on first render
  useState(() => {
    setEditedSummary(generatedSummary);
  });

  const handleSave = () => {
    const photoFiles = photos.map(p => p.file);
    onSave(isEditing ? editedSummary : generatedSummary, photoFiles.length > 0 ? photoFiles : undefined);
  };

  const toggleExchange = (index: number) => {
    setExpandedExchanges(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const typeLabel = TYPE_LABELS[promptType] || 'Memory';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="review-screen"
    >
      {/* Header */}
      <div className="review-header">
        <div className="review-header-icon">
          <Sparkles size={24} />
        </div>
        <div>
          <h2 className="review-title">Review Your Story</h2>
          <p className="review-subtitle">
            {typeLabel} • {exchanges.length} {exchanges.length === 1 ? 'exchange' : 'exchanges'}
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="review-content">
        {/* Summary/Edit view */}
        <div className="review-summary-section">
          <div className="review-summary-header">
            <h3>Your Complete Story</h3>
            <button
              onClick={() => {
                if (isEditing) {
                  setIsEditing(false);
                } else {
                  setEditedSummary(generatedSummary);
                  setIsEditing(true);
                }
              }}
              className="review-edit-btn"
            >
              {isEditing ? (
                <>
                  <Check size={14} />
                  Done Editing
                </>
              ) : (
                <>
                  <Edit2 size={14} />
                  Edit
                </>
              )}
            </button>
          </div>

          {isEditing ? (
            <textarea
              value={editedSummary}
              onChange={(e) => setEditedSummary(e.target.value)}
              className="review-textarea"
              rows={8}
              aria-label="Edit your story"
            />
          ) : (
            <div className="review-summary-text">
              {generatedSummary.split('\n\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          )}
        </div>

        {/* Exchange breakdown */}
        <div className="review-exchanges">
          <h3 className="review-exchanges-title">Conversation Details</h3>
          {exchanges.map((exchange, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="review-exchange-item"
            >
              <button
                onClick={() => toggleExchange(index)}
                className="review-exchange-header"
              >
                <span>Question {index + 1}</span>
                {expandedExchanges.includes(index) ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </button>
              
              {expandedExchanges.includes(index) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="review-exchange-content"
                >
                  <p className="review-exchange-question">
                    <strong>Q:</strong> {exchange.question}
                  </p>
                  <p className="review-exchange-answer">
                    <strong>A:</strong> {exchange.response}
                  </p>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Tags suggestion */}
      <div className="review-tags">
        <span className="review-tags-label">Suggested tags:</span>
        <div className="review-tags-list">
          <span className="review-tag">{typeLabel}</span>
          <span className="review-tag">Voice Memory</span>
          <span className="review-tag">AI-Assisted</span>
        </div>
      </div>

      {/* Optional Photo Upload */}
      <div className="review-photos">
        <div className="review-photos-header">
          <Image size={16} />
          <span>Add Photos (Optional)</span>
        </div>
        <p className="review-photos-hint">Add up to 5 photos to accompany this memory</p>
        
        <div className="review-photos-grid">
          {photos.map((photo, index) => (
            <div key={index} className="review-photo-item">
              <img src={photo.preview} alt="" />
              <button 
                onClick={() => removePhoto(index)}
                className="review-photo-remove"
              >
                <X size={14} />
              </button>
            </div>
          ))}
          
          {photos.length < 5 && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="review-photo-add"
            >
              <Plus size={20} />
              <span>Add</span>
            </button>
          )}
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handlePhotoSelect}
          className="hidden"
        />
      </div>

      {/* Actions */}
      <div className="review-actions">
        <button
          onClick={onDiscard}
          disabled={isSaving}
          className="review-btn review-btn-discard"
        >
          <Trash2 size={16} />
          Discard
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="review-btn review-btn-save"
        >
          {isSaving ? (
            <>
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles size={16} />
              </motion.span>
              Saving...
            </>
          ) : (
            <>
              <Save size={16} />
              Save Memory
              <span className="review-xp-badge">+{expectedXp} XP</span>
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}
