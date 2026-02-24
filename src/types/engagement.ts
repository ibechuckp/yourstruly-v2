export interface PromptTemplate {
  id: string;
  type: string;
  category: string | null;
  subcategory: string | null;
  prompt_text: string;
  prompt_variations: string[] | null;
  target_interest: string | null;
  target_skill: string | null;
  target_hobby: string | null;
  target_religion: string | null;
  target_field: string | null;
  is_active: boolean;
  priority_boost: number;
  cooldown_days: number;
  seasonal_months: number[] | null;
  anniversary_based: boolean;
  created_at: string;
  updated_at: string;
}

export interface PromptTemplateFormData {
  id: string;
  type: string;
  category: string;
  subcategory: string;
  prompt_text: string;
  prompt_variations: string[];
  target_interest: string;
  target_skill: string;
  target_hobby: string;
  target_religion: string;
  target_field: string;
  is_active: boolean;
  priority_boost: number;
  cooldown_days: number;
  seasonal_months: number[];
  anniversary_based: boolean;
}

export const PROMPT_TYPES = [
  { value: 'photo_backstory', label: 'Photo Backstory', description: 'Ask about the story behind a photo' },
  { value: 'tag_person', label: 'Tag Person', description: 'Identify people in photos' },
  { value: 'missing_info', label: 'Missing Info', description: 'Fill in missing contact or memory details' },
  { value: 'memory_prompt', label: 'Memory Prompt', description: 'General memory questions' },
  { value: 'knowledge', label: 'Knowledge', description: 'Capture wisdom and life lessons' },
  { value: 'connect_dots', label: 'Connect Dots', description: 'Compare photos, contacts, or memories' },
  { value: 'highlight', label: 'Highlight', description: 'Featured or important prompts' },
  { value: 'quick_question', label: 'Quick Question', description: 'Short, easy questions' },
];

export const KNOWLEDGE_CATEGORIES = [
  'life_lessons',
  'values',
  'relationships',
  'parenting',
  'career',
  'health',
  'practical',
  'legacy',
  'faith',
  'interests',
  'skills',
  'hobbies',
  'goals',
];

export const INTERESTS = [
  'cooking', 'golf', 'travel', 'music', 'art', 'sports', 'reading', 'gardening',
  'photography', 'technology', 'fashion', 'fitness', 'gaming', 'movies', 'nature',
];

export const SKILLS = [
  'leadership', 'communication', 'problem_solving', 'creativity', 'teaching',
  'writing', 'public_speaking', 'negotiation', 'mentoring', 'planning',
];

export const RELIGIONS = [
  'christianity', 'islam', 'judaism', 'hinduism', 'buddhism', 'sikhism',
  'spiritual', 'agnostic', 'atheist', 'other',
];

export const MISSING_INFO_FIELDS = [
  { value: 'birth_date', label: 'Birth Date' },
  { value: 'relationship_type', label: 'Relationship Type' },
  { value: 'email', label: 'Email Address' },
  { value: 'phone', label: 'Phone Number' },
  { value: 'address', label: 'Address' },
  { value: 'location', label: 'Location' },
  { value: 'date', label: 'Event Date' },
];
