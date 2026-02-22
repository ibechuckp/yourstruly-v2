// ============================================================================
// ENGAGEMENT PROMPT TYPES
// ============================================================================

export type PromptType =
  | 'photo_backstory'
  | 'tag_person'
  | 'missing_info'
  | 'memory_prompt'
  | 'knowledge'
  | 'connect_dots'
  | 'highlight'
  | 'quick_question'
  | 'postscript'
  | 'favorites_firsts'
  | 'recipes_wisdom';

export type PromptStatus =
  | 'pending'
  | 'shown'
  | 'answered'
  | 'skipped'
  | 'dismissed';

export type ResponseType =
  | 'voice'
  | 'text'
  | 'selection'
  | 'photo'
  | 'date'
  | 'contact';

export type KnowledgeCategory =
  | 'life_lessons'
  | 'values'
  | 'relationships'
  | 'parenting'
  | 'career'
  | 'health'
  | 'practical'
  | 'legacy'
  | 'faith'
  | 'interests'
  | 'skills'
  | 'hobbies'
  | 'goals';

// ============================================================================
// ENGAGEMENT PROMPT
// ============================================================================

export interface EngagementPrompt {
  id: string;
  userId: string;
  type: PromptType;
  category?: string;
  promptText: string;
  status: PromptStatus;
  priority: number;
  
  // Related entities
  photoUrl?: string;
  photoId?: string;
  contactId?: string;
  contactName?: string;
  contactPhotoUrl?: string;
  memoryId?: string;
  missingField?: string;
  
  // For connect_dots type
  comparePhotoUrl?: string;
  compareContactName?: string;
  compareMemoryTitle?: string;
  
  // Personalization
  personalizationContext?: {
    interest?: string;
    skill?: string;
    hobby?: string;
    religion?: string;
  };
  
  // Metadata
  metadata?: {
    bbox?: { x: number; y: number; w: number; h: number };
    suggested_contact_id?: string;
    suggested_contact_name?: string;
    options?: string[];
    // Contact info for missing_info prompts
    contact?: {
      name?: string;
      photo_url?: string;
      relationship?: string;
      phone?: string;
      email?: string;
      date_of_birth?: string;
      address?: string;
    };
    [key: string]: any;
  };
  
  // Multi-step conversation support
  steps?: PromptStep[];
  currentStep?: number;
  responses?: StepResponse[];
  
  createdAt: string;
}

// Multi-step prompt support
export interface PromptStep {
  id: string;
  question: string;
  inputType: 'text' | 'voice' | 'photo' | 'date' | 'select';
  placeholder?: string;
  required: boolean;
  options?: string[]; // For select type
}

export interface StepResponse {
  stepId: string;
  question: string;
  answer: string;
  mediaUrl?: string;
  answeredAt: string;
}

// ============================================================================
// PROMPT RESPONSE
// ============================================================================

export interface PromptResponse {
  type: ResponseType;
  text?: string;
  audioUrl?: string;
  data?: Record<string, any>;
}

// ============================================================================
// KNOWLEDGE ENTRY
// ============================================================================

export interface KnowledgeEntry {
  id: string;
  userId: string;
  category: KnowledgeCategory;
  subcategory?: string;
  promptText: string;
  responseText?: string;
  audioUrl?: string;
  videoUrl?: string;
  
  // Personalization context
  relatedInterest?: string;
  relatedSkill?: string;
  relatedHobby?: string;
  relatedReligion?: string;
  
  // Metadata
  wordCount?: number;
  durationSeconds?: number;
  isFeatured: boolean;
  qualityScore?: number;
  
  // Relations
  relatedContacts?: string[];
  relatedMemories?: string[];
  tags?: string[];
  
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// ENGAGEMENT STATS
// ============================================================================

export interface EngagementStats {
  totalAnswered: number;
  totalSkipped: number;
  currentStreakDays: number;
  longestStreakDays: number;
  knowledgeEntries: number;
  preferredInputType?: ResponseType;
  lastEngagementDate?: string;
  
  // By type
  byType?: {
    photoBackstory: number;
    tagPerson: number;
    missingInfo: number;
    memoryPrompt: number;
    knowledge: number;
  };
}

// ============================================================================
// PROMPT TEMPLATE
// ============================================================================

export interface PromptTemplate {
  id: string;
  type: PromptType;
  category?: string;
  subcategory?: string;
  promptText: string;
  promptVariations?: string[];
  
  // Targeting
  targetInterest?: string;
  targetSkill?: string;
  targetHobby?: string;
  targetReligion?: string;
  targetPersonality?: string;
  targetField?: string; // For missing_info type
  
  // Behavior
  isActive: boolean;
  priorityBoost: number;
  cooldownDays: number;
  
  // Seasonal
  seasonalMonths?: number[];
  anniversaryBased?: boolean;
}

// ============================================================================
// API TYPES
// ============================================================================

export interface GetPromptsResponse {
  prompts: EngagementPrompt[];
  stats: EngagementStats;
}

export interface AnswerPromptRequest {
  responseType: ResponseType;
  responseText?: string;
  responseAudioUrl?: string;
  responseData?: Record<string, any>;
}

export interface AnswerPromptResponse {
  success: boolean;
  prompt: EngagementPrompt;
  knowledgeEntry?: KnowledgeEntry; // If a knowledge entry was created
  memoryCreated?: boolean;
  memoryId?: string; // ID of created memory (for photo backstory, memory prompts)
  contactId?: string; // ID of contact (for contact prompts)
  contactUpdated?: boolean;
}

export interface ShufflePromptsRequest {
  count?: number;
  regenerate?: boolean;
}
