/**
 * Test fixtures for engagement-related components and hooks
 */

import type { 
  EngagementPrompt, 
  KnowledgeEntry, 
  EngagementStats,
  PromptTemplate 
} from '@/types/engagement';

// ============================================================================
// ENGAGEMENT PROMPTS
// ============================================================================

export const mockPrompts: EngagementPrompt[] = [
  {
    id: 'prompt-001',
    userId: 'user-123',
    type: 'photo_backstory',
    category: 'photos',
    promptText: "What's the story behind this photo?",
    status: 'pending',
    priority: 75,
    photoUrl: 'https://images.unsplash.com/photo-1529543544277-590748c03378?w=400',
    photoId: 'photo-001',
    createdAt: '2026-02-20T10:00:00Z',
  },
  {
    id: 'prompt-002',
    userId: 'user-123',
    type: 'tag_person',
    category: 'faces',
    promptText: "Who is this?",
    status: 'pending',
    priority: 70,
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    photoId: 'photo-002',
    metadata: {
      face_id: 'face-001',
      bbox: { x: 0.3, y: 0.2, w: 0.2, h: 0.3 },
      suggested_contact_id: 'contact-001',
      suggested_contact_name: 'Marcus Johnson',
    },
    createdAt: '2026-02-20T10:01:00Z',
  },
  {
    id: 'prompt-003',
    userId: 'user-123',
    type: 'missing_info',
    category: 'contact_info',
    promptText: "When is Sarah's birthday?",
    status: 'pending',
    priority: 65,
    contactId: 'contact-003',
    contactName: 'Sarah Patterson-Chen',
    contactPhotoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    missingField: 'birth_date',
    createdAt: '2026-02-20T10:02:00Z',
  },
  {
    id: 'prompt-004',
    userId: 'user-123',
    type: 'memory_prompt',
    category: 'childhood',
    promptText: 'What games did you play as a kid?',
    status: 'pending',
    priority: 60,
    createdAt: '2026-02-20T10:03:00Z',
  },
  {
    id: 'prompt-005',
    userId: 'user-123',
    type: 'knowledge',
    category: 'life_lessons',
    promptText: "What's the most important lesson life has taught you?",
    status: 'pending',
    priority: 80,
    personalizationContext: {
      interest: 'cooking',
    },
    createdAt: '2026-02-20T10:04:00Z',
  },
  {
    id: 'prompt-006',
    userId: 'user-123',
    type: 'quick_question',
    category: 'verification',
    promptText: 'Is this memory happy or bittersweet?',
    status: 'pending',
    priority: 40,
    memoryId: 'memory-001',
    metadata: {
      options: ['Happy', 'Sad', 'Bittersweet', 'Both'],
    },
    createdAt: '2026-02-20T10:05:00Z',
  },
  {
    id: 'prompt-007',
    userId: 'user-123',
    type: 'knowledge',
    category: 'faith',
    promptText: 'How has dharma guided your decisions?',
    status: 'pending',
    priority: 75,
    personalizationContext: {
      religion: 'Hindu',
    },
    createdAt: '2026-02-20T10:06:00Z',
  },
  {
    id: 'prompt-008',
    userId: 'user-123',
    type: 'connect_dots',
    category: 'connections',
    promptText: 'Is this the same trip as your Barcelona memory?',
    status: 'pending',
    priority: 50,
    photoUrl: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=400',
    compareMemoryTitle: 'Study abroad in Barcelona',
    createdAt: '2026-02-20T10:07:00Z',
  },
];

// ============================================================================
// KNOWLEDGE ENTRIES
// ============================================================================

export const mockKnowledgeEntries: KnowledgeEntry[] = [
  {
    id: 'knowledge-001',
    userId: 'user-123',
    category: 'life_lessons',
    promptText: "What's the most important lesson life has taught you?",
    responseText: "That time is the only resource you can't get back. I spent too many years chasing promotions and missed too many of Emma's soccer games. Now I know: be present. The work will always be there. The moments won't.",
    wordCount: 47,
    isFeatured: true,
    tags: ['time', 'family', 'work-life-balance'],
    createdAt: '2026-02-15T10:00:00Z',
    updatedAt: '2026-02-15T10:00:00Z',
  },
  {
    id: 'knowledge-002',
    userId: 'user-123',
    category: 'relationships',
    promptText: 'What makes a good marriage?',
    responseText: "Jennifer and I have been together 15 years. The secret? There is no secret. It's showing up every day. It's choosing each other when you're tired, angry, or just want to be alone.",
    audioUrl: 'https://storage.example.com/audio/knowledge-002.webm',
    wordCount: 45,
    durationSeconds: 35,
    isFeatured: true,
    relatedContacts: ['contact-009'],
    tags: ['marriage', 'love', 'commitment'],
    createdAt: '2026-02-16T14:30:00Z',
    updatedAt: '2026-02-16T14:30:00Z',
  },
  {
    id: 'knowledge-003',
    userId: 'user-123',
    category: 'practical',
    subcategory: 'cooking',
    promptText: 'What recipe absolutely must be passed down?',
    responseText: "Grandma Helen's apple pie. The secret is sharp cheddar cheese in the crust - sounds crazy, but trust me. She taught me when I was 12.",
    relatedInterest: 'Cooking',
    wordCount: 32,
    isFeatured: true,
    relatedContacts: ['contact-007'],
    tags: ['recipe', 'grandma', 'tradition'],
    createdAt: '2026-02-18T09:00:00Z',
    updatedAt: '2026-02-18T09:00:00Z',
  },
  {
    id: 'knowledge-004',
    userId: 'user-123',
    category: 'faith',
    promptText: 'How has dharma guided your decisions?',
    responseText: "My parents raised us Hindu, and while I'm not as devout as they were, dharma - doing the right thing, fulfilling your duty - has shaped everything.",
    relatedReligion: 'Hindu',
    wordCount: 35,
    isFeatured: false,
    tags: ['dharma', 'hinduism', 'values'],
    createdAt: '2026-02-19T20:00:00Z',
    updatedAt: '2026-02-19T20:00:00Z',
  },
];

// ============================================================================
// ENGAGEMENT STATS
// ============================================================================

export const mockEngagementStats: EngagementStats = {
  totalAnswered: 47,
  totalSkipped: 12,
  currentStreakDays: 14,
  longestStreakDays: 21,
  knowledgeEntries: 10,
  preferredInputType: 'voice',
  lastEngagementDate: '2026-02-20',
  byType: {
    photoBackstory: 15,
    tagPerson: 8,
    missingInfo: 6,
    memoryPrompt: 12,
    knowledge: 10,
  },
};

// ============================================================================
// CONTACTS
// ============================================================================

export const mockContacts = [
  {
    id: 'contact-001',
    name: 'Marcus Johnson',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    relationshipType: 'best_friend',
    email: 'marcus.j@email.com',
    phone: '+1-919-555-0111',
    birthDate: '1986-01-15',
    howMet: 'Best friend since high school',
    isDeceased: false,
  },
  {
    id: 'contact-002',
    name: 'Robert Patterson Sr.',
    photoUrl: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=400',
    relationshipType: 'father',
    email: 'bob.patterson@email.com',
    phone: '+1-919-555-0102',
    birthDate: '1955-07-22',
    howMet: null,
    isDeceased: false,
  },
  {
    id: 'contact-003',
    name: 'Sarah Patterson-Chen',
    photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    relationshipType: 'sister',
    email: 'sarah.chen@email.com',
    phone: '+1-415-555-0103',
    birthDate: null, // Missing - for testing
    howMet: null,
    isDeceased: false,
  },
  {
    id: 'contact-007',
    name: 'Grandma Helen',
    photoUrl: 'https://images.unsplash.com/photo-1581579438747-104c53d7fbc4?w=400',
    relationshipType: 'grandmother',
    email: null,
    phone: '+1-919-555-0107',
    birthDate: '1937-12-01',
    howMet: null,
    isDeceased: false,
  },
  {
    id: 'contact-009',
    name: 'Jennifer Patterson',
    photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
    relationshipType: 'spouse',
    email: 'jen.patterson@email.com',
    phone: '+1-919-555-0109',
    birthDate: '1987-09-23',
    howMet: 'Halloween party 2010',
    isDeceased: false,
  },
];

// ============================================================================
// MEMORIES
// ============================================================================

export const mockMemories = [
  {
    id: 'memory-001',
    userId: 'user-123',
    title: 'Learning to ride a bike',
    description: "Dad taught me to ride my red Schwinn in the driveway. I fell at least 20 times but he never let me give up.",
    date: '1992-06-15',
    location: '5126 Bur Oak Circle, Raleigh, NC',
    locationLat: 35.7796,
    locationLng: -78.6382,
    mediaUrl: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=800',
    tags: ['childhood', 'dad', 'milestone'],
    sharedWith: ['contact-002'],
    isPublic: false,
    createdAt: '2026-02-10T10:00:00Z',
  },
  {
    id: 'memory-002',
    userId: 'user-123',
    title: 'Wedding day',
    description: 'June 13, 2015. The Umstead in Cary. Marcus as best man. Sarah cried during her toast.',
    date: '2015-06-13',
    location: 'The Umstead Hotel, Cary, NC',
    locationLat: 35.8484,
    locationLng: -78.8755,
    mediaUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800',
    tags: ['love', 'jennifer', 'wedding', 'milestone'],
    sharedWith: ['contact-001', 'contact-003', 'contact-009'],
    isPublic: true,
    createdAt: '2026-02-12T14:00:00Z',
  },
  {
    id: 'memory-003',
    userId: 'user-123',
    title: 'Emma was born',
    description: "February 14, 2018. Valentine's Day baby. When they put her in my arms, everything else disappeared.",
    date: '2018-02-14',
    location: 'Duke University Hospital, Durham, NC',
    locationLat: 35.9940,
    locationLng: -78.9400,
    mediaUrl: 'https://images.unsplash.com/photo-1544126592-807ade215a0b?w=800',
    tags: ['kids', 'emma', 'birth', 'milestone'],
    sharedWith: ['contact-009'],
    isPublic: false,
    createdAt: '2026-02-14T09:00:00Z',
  },
];

// ============================================================================
// NOTIFICATION PREFERENCES
// ============================================================================

export const mockNotificationPreferences = {
  enabled: true,
  dailyReflectionTime: '09:00',
  timezone: 'America/New_York',
  dailyReflection: true,
  streakReminders: true,
  anniversaries: true,
  birthdays: true,
  familyDigest: true,
  milestones: true,
  reEngagement: true,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  maxPerDay: 3,
};

// ============================================================================
// USER PROFILE
// ============================================================================

export const mockUserProfile = {
  id: 'user-123',
  email: 'chuck@example.com',
  fullName: 'Chuck Patterson',
  avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
  bio: 'Hard working fool',
  birthDate: '1986-07-07',
  gender: 'Male',
  religion: 'Hindu',
  interests: ['Reading', 'Music', 'Cooking', 'Singing'],
  skills: ['Leadership', 'Communication', 'Creativity'],
  hobbies: ['Golf', 'Woodworking'],
  personality: ['Introvert', 'Energetic', 'Optimistic'],
  lifeGoals: ['Start a family', 'Travel the world'],
  credo: 'Never stop learning.',
  createdAt: '2026-02-06T10:00:00Z',
};

// ============================================================================
// PROMPT TEMPLATES (subset)
// ============================================================================

export const mockPromptTemplates: PromptTemplate[] = [
  {
    id: 'memory_childhood_001',
    type: 'memory_prompt',
    category: 'childhood',
    promptText: 'What games did you play as a kid?',
    promptVariations: [
      'What was your favorite childhood game?',
      'How did you spend summer days as a child?',
    ],
    isActive: true,
    priorityBoost: 0,
    cooldownDays: 30,
  },
  {
    id: 'knowledge_life_001',
    type: 'knowledge',
    category: 'life_lessons',
    promptText: "What's the most important lesson life has taught you?",
    isActive: true,
    priorityBoost: 10,
    cooldownDays: 60,
  },
  {
    id: 'knowledge_cooking_001',
    type: 'knowledge',
    category: 'interests',
    promptText: 'What recipe absolutely must be passed down?',
    targetInterest: 'Cooking',
    isActive: true,
    priorityBoost: 10,
    cooldownDays: 90,
  },
  {
    id: 'knowledge_hindu_001',
    type: 'knowledge',
    category: 'faith',
    promptText: 'How has dharma guided your decisions?',
    targetReligion: 'Hindu',
    isActive: true,
    priorityBoost: 10,
    cooldownDays: 60,
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getRandomPrompts(count: number = 5): EngagementPrompt[] {
  const shuffled = [...mockPrompts].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function getPromptByType(type: EngagementPrompt['type']): EngagementPrompt | undefined {
  return mockPrompts.find(p => p.type === type);
}

export function getContactById(id: string) {
  return mockContacts.find(c => c.id === id);
}

export function getMemoryById(id: string) {
  return mockMemories.find(m => m.id === id);
}

export function getKnowledgeByCategory(category: string) {
  return mockKnowledgeEntries.filter(k => k.category === category);
}
