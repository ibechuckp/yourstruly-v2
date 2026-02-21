# Engagement Bubbles — Micro-Interaction System

*Spec v1.0 — 2026-02-20*

---

## Overview

Floating glassmorphism widgets that appear on the dashboard, prompting users to contribute small pieces of content. Each bubble is a self-contained micro-interaction that captures memories, fills data gaps, or extracts wisdom — without feeling like work.

**Goals:**
- Increase daily active users (DAU) through low-friction engagement
- Organically fill in profile/contact data gaps
- Capture memories in bite-sized pieces
- Extract knowledge, wisdom, and life lessons for the Digital Twin
- Make the experience feel like a conversation, not a form

---

## Bubble Types

### 1. 📸 Photo Backstory
**Purpose:** Add context to uploaded photos without metadata or descriptions.

| Field | Value |
|-------|-------|
| Trigger | Photo exists without description/memory link |
| Prompt | "What's the story here?" / "Who were you with?" / "Where was this?" |
| Display | Photo thumbnail + prompt text |
| Input | Voice (primary), text (secondary) |
| Output | Creates/links to memory, extracts date/location/people |

**Example Prompts:**
- "This looks fun — what was happening?"
- "I see some faces! Who's in this photo?"
- "Where was this taken?"

---

### 2. 👤 Tag Person
**Purpose:** Connect unidentified faces in photos to contacts.

| Field | Value |
|-------|-------|
| Trigger | Face detected in photo, not matched to contact |
| Prompt | "Who's this?" |
| Display | Cropped face + prompt |
| Input | Contact picker (searchable dropdown) / "Add new contact" |
| Output | Links face to contact, improves future face recognition |

**Smart Features:**
- Show most likely matches based on other photos
- "Is this [Contact Name]?" for high-confidence guesses
- Learn from corrections

---

### 3. 🎂 Missing Info
**Purpose:** Fill gaps in contact profiles.

| Field | Value |
|-------|-------|
| Trigger | Contact missing key field (DOB, relationship, email, etc.) |
| Prompt | "When's [Name]'s birthday?" / "What's your relationship to [Name]?" |
| Display | Contact avatar + name + specific question |
| Input | Date picker / relationship dropdown / text field |
| Output | Updates contact record |

**Priority Fields:**
1. Relationship type (if blank)
2. Birthday
3. How you met
4. Phone/email (for delivery features)

---

### 4. 💭 Memory Prompt
**Purpose:** Capture new memories through guided prompts.

| Field | Value |
|-------|-------|
| Trigger | Scheduled/random, weighted by uncovered life stages |
| Prompt | Specific memory question |
| Display | Prompt text + optional related photo/context |
| Input | Voice (primary), text, photo upload |
| Output | Creates new memory record |

**Prompt Categories:**
- Childhood: "What games did you play as a kid?"
- School: "Who was your favorite teacher and why?"
- Career: "What was your first job like?"
- Relationships: "How did you meet your best friend?"
- Milestones: "Describe your wedding day"
- Senses: "What smell takes you back to childhood?"

**Smart Selection:**
- Track which life stages have coverage
- Prioritize gaps
- Seasonal relevance (holidays, seasons)
- Anniversary prompts (memory from this date X years ago)

---

### 5. 🔗 Connect Dots
**Purpose:** Link related memories, contacts, and events.

| Field | Value |
|-------|-------|
| Trigger | AI detects potential connections |
| Prompt | "Is this the same [person/place/event] as...?" |
| Display | Two items side-by-side |
| Input | Yes / No / Not Sure |
| Output | Creates relationship links in data model |

**Connection Types:**
- Same person in different photos
- Same location across memories
- Same event mentioned in multiple stories
- Potential duplicate contacts

---

### 6. ⭐ Highlight
**Purpose:** Surface important memories for featuring.

| Field | Value |
|-------|-------|
| Trigger | Random sampling of memories |
| Prompt | "Is this one of your most precious memories?" |
| Display | Memory card preview |
| Input | Star / Skip |
| Output | Marks as featured, increases visibility for family |

---

### 7. 🧠 Knowledge Prompt ⭐ NEW
**Purpose:** Capture wisdom, expertise, life lessons, and advice for the Digital Twin.

| Field | Value |
|-------|-------|
| Trigger | Scheduled, rotating through categories |
| Prompt | Wisdom/advice question |
| Display | Prompt text + category icon |
| Input | Voice (primary), text |
| Output | Creates knowledge record, tagged by category |

**Knowledge Categories:**

#### Life Lessons
- "What's the most important lesson life has taught you?"
- "What do you wish you knew at 20?"
- "What mistake taught you the most?"
- "What's the best advice you ever received?"
- "What advice would you give your younger self?"

#### Values & Beliefs
- "What do you believe that most people don't?"
- "What principles guide your decisions?"
- "What does success mean to you?"
- "What matters most in life?"
- "How has your faith/spirituality shaped you?"

#### Relationships
- "What makes a good marriage/partnership?"
- "How do you maintain lifelong friendships?"
- "What's the key to resolving conflicts?"
- "How do you show love to the people you care about?"
- "What do you wish you'd said to someone who's gone?"

#### Parenting & Family
- "What's the most important thing to teach children?"
- "What family traditions do you cherish?"
- "How do you balance work and family?"
- "What do you hope your kids remember about you?"
- "What's one thing every parent should know?"

#### Career & Work
- "What's the best career advice you'd give?"
- "How do you handle failure?"
- "What does meaningful work look like?"
- "How do you make tough decisions?"
- "What skill has served you most in life?"

#### Health & Wellbeing
- "How do you stay mentally healthy?"
- "What's your secret to happiness?"
- "How do you handle stress?"
- "What daily habits have made a difference?"
- "What would you tell someone going through a hard time?"

#### Practical Wisdom
- "What's a skill everyone should learn?"
- "What's your best money advice?"
- "How do you stay organized?"
- "What recipes or traditions must be passed down?"
- "What's something you learned to fix/make yourself?"

#### Legacy
- "How do you want to be remembered?"
- "What do you hope to leave behind?"
- "What are you most proud of?"
- "If you could only pass on one piece of wisdom, what would it be?"
- "What gives your life meaning?"

---

### 8. 🎯 Quick Question
**Purpose:** Simple yes/no or multiple choice for fast engagement.

| Field | Value |
|-------|-------|
| Trigger | Mixed in for variety, data validation |
| Prompt | Simple binary/choice question |
| Display | Question + 2-4 buttons |
| Input | Tap to select |
| Output | Updates relevant record |

**Examples:**
- "Is [Contact] still living?" → Yes / No / Skip
- "Have you been to [Location] more than once?" → Yes / No
- "What season was this?" → Spring / Summer / Fall / Winter
- "Is this memory happy or bittersweet?" → 😊 / 😢 / Both

---

## Data Model

### `engagement_prompts` Table

```sql
CREATE TABLE engagement_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Prompt definition
  type TEXT NOT NULL, -- 'photo_backstory', 'tag_person', 'missing_info', 'memory_prompt', 'connect_dots', 'highlight', 'knowledge', 'quick_question'
  category TEXT, -- For knowledge prompts: 'life_lessons', 'values', 'relationships', etc.
  prompt_text TEXT NOT NULL,
  
  -- Related entities (nullable based on type)
  photo_id UUID REFERENCES photos(id),
  contact_id UUID REFERENCES contacts(id),
  memory_id UUID REFERENCES memories(id),
  face_id UUID REFERENCES detected_faces(id),
  
  -- State
  status TEXT DEFAULT 'pending', -- 'pending', 'shown', 'answered', 'skipped', 'dismissed'
  priority INTEGER DEFAULT 50, -- 1-100, higher = more important
  
  -- Timing
  created_at TIMESTAMPTZ DEFAULT NOW(),
  shown_at TIMESTAMPTZ,
  answered_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ, -- Optional expiration
  
  -- Response
  response_type TEXT, -- 'voice', 'text', 'selection', 'photo'
  response_text TEXT,
  response_audio_url TEXT,
  response_data JSONB, -- Flexible storage for different response types
  
  -- Metadata
  source TEXT, -- 'system', 'ai_detected', 'scheduled'
  metadata JSONB
);

-- Index for fetching active prompts
CREATE INDEX idx_prompts_user_status ON engagement_prompts(user_id, status);
CREATE INDEX idx_prompts_priority ON engagement_prompts(user_id, status, priority DESC);
```

### `knowledge_entries` Table

```sql
CREATE TABLE knowledge_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Content
  category TEXT NOT NULL, -- 'life_lessons', 'values', 'relationships', 'parenting', 'career', 'health', 'practical', 'legacy'
  prompt_text TEXT NOT NULL, -- The question asked
  response_text TEXT, -- Transcribed/written response
  audio_url TEXT, -- Original voice recording
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- For Digital Twin RAG
  embedding VECTOR(1536), -- For semantic search
  is_featured BOOLEAN DEFAULT FALSE,
  
  -- Linking
  related_contacts UUID[], -- Contacts mentioned
  related_memories UUID[], -- Memories referenced
  
  -- Quality
  word_count INTEGER,
  duration_seconds INTEGER -- For audio
);

-- Index for RAG queries
CREATE INDEX idx_knowledge_embedding ON knowledge_entries USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_knowledge_category ON knowledge_entries(user_id, category);
```

---

## Queue Logic

### Prompt Generation

```typescript
interface PromptGenerator {
  // Run daily or on-demand to populate queue
  generatePrompts(userId: string): Promise<EngagementPrompt[]>;
}

const PROMPT_DISTRIBUTION = {
  photo_backstory: 0.20,   // 20% - high value, uses existing content
  tag_person: 0.15,        // 15% - important for connections
  missing_info: 0.10,      // 10% - fills data gaps
  memory_prompt: 0.20,     // 20% - core value prop
  knowledge: 0.20,         // 20% - crucial for digital twin
  connect_dots: 0.05,      // 5%  - refinement
  highlight: 0.05,         // 5%  - engagement
  quick_question: 0.05,    // 5%  - easy wins
};
```

### Priority Scoring

```typescript
function calculatePriority(prompt: EngagementPrompt): number {
  let score = 50; // Base score
  
  // Recency boost for new photos
  if (prompt.type === 'photo_backstory') {
    const daysSinceUpload = daysSince(prompt.photo.uploadedAt);
    if (daysSinceUpload < 1) score += 30;
    else if (daysSinceUpload < 7) score += 20;
    else if (daysSinceUpload < 30) score += 10;
  }
  
  // Contact importance
  if (prompt.contact?.relationshipType) {
    const importance = RELATIONSHIP_IMPORTANCE[prompt.contact.relationshipType];
    score += importance * 10; // Close family > friends > professional
  }
  
  // Life stage coverage gaps
  if (prompt.type === 'memory_prompt') {
    const stageCompletion = getLifeStageCompletion(prompt.category);
    score += (100 - stageCompletion) * 0.3; // Bigger gaps = higher priority
  }
  
  // Knowledge category balance
  if (prompt.type === 'knowledge') {
    const categoryCount = getKnowledgeCount(prompt.category);
    if (categoryCount === 0) score += 25; // New category
    else if (categoryCount < 3) score += 15;
    else if (categoryCount < 5) score += 5;
  }
  
  // Seasonal relevance
  if (isSeasonallyRelevant(prompt)) score += 15;
  
  // Anniversary prompts
  if (isAnniversaryPrompt(prompt)) score += 20;
  
  return Math.min(100, Math.max(1, score));
}
```

### Display Selection

```typescript
async function getPromptsForDisplay(userId: string, count: number = 5): Promise<EngagementPrompt[]> {
  const prompts = await db.engagement_prompts
    .where({ user_id: userId, status: 'pending' })
    .orderBy('priority', 'desc')
    .limit(count * 2); // Fetch extra for variety
  
  // Ensure type diversity
  const selected: EngagementPrompt[] = [];
  const usedTypes = new Set<string>();
  
  for (const prompt of prompts) {
    if (selected.length >= count) break;
    
    // Allow max 2 of same type
    const typeCount = selected.filter(p => p.type === prompt.type).length;
    if (typeCount < 2) {
      selected.push(prompt);
    }
  }
  
  return selected;
}
```

---

## UI/UX Specification

### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                         DASHBOARD                                │
│                                                                  │
│  ┌────────────┐    ┌────────────┐    ┌────────────┐            │
│  │   📸       │    │    👤      │    │    🧠      │            │
│  │            │    │   [face]   │    │            │            │
│  │  [photo]   │    │            │    │  What's    │            │
│  │            │    │  Who's     │    │  the best  │            │
│  │ What's the │    │  this?     │    │  advice    │            │
│  │ story?     │    │            │    │  you've    │            │
│  │            │    │            │    │  received? │            │
│  └────────────┘    └────────────┘    └────────────┘            │
│                                                                  │
│       ┌────────────┐    ┌────────────┐                         │
│       │    🎂      │    │    💭      │                         │
│       │            │    │            │                         │
│       │  When's    │    │  Tell me   │                         │
│       │  Sarah's   │    │  about     │                         │
│       │  birthday? │    │  your      │                         │
│       │            │    │  first pet │                         │
│       └────────────┘    └────────────┘                         │
│                                                                  │
│                   [ 🎲 Shuffle ]                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Bubble Component

```
┌─────────────────────────────┐
│  🧠  Knowledge              │  ← Type icon + label
├─────────────────────────────┤
│                             │
│  What's the most            │  ← Prompt text
│  important lesson           │
│  life has taught you?       │
│                             │
├─────────────────────────────┤
│  🎤 Speak    ⌨️ Type        │  ← Input options
└─────────────────────────────┘
```

### Expanded State (Voice Input)

```
┌─────────────────────────────────────┐
│  🧠  Knowledge                   ✕  │
├─────────────────────────────────────┤
│                                     │
│  What's the most important          │
│  lesson life has taught you?        │
│                                     │
├─────────────────────────────────────┤
│                                     │
│         ◉ Recording...              │
│         ━━━━━━━━━━━━━━              │
│         0:23                        │
│                                     │
│    [ ⏹ Stop ]    [ ▶ Play ]        │
│                                     │
├─────────────────────────────────────┤
│        [ Save ]    [ Redo ]         │
└─────────────────────────────────────┘
```

### Expanded State (Photo Backstory)

```
┌─────────────────────────────────────┐
│  📸  Photo Story                 ✕  │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐   │
│  │                             │   │
│  │         [PHOTO]             │   │
│  │                             │   │
│  └─────────────────────────────┘   │
│                                     │
│  What's happening in this photo?    │
│                                     │
├─────────────────────────────────────┤
│  🎤 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                     │
│  👥 Tag people   📍 Add location    │
│  📅 Set date     🏷️ Add tags        │
│                                     │
├─────────────────────────────────────┤
│              [ Save ]               │
└─────────────────────────────────────┘
```

### Animations

**Appear:**
```css
@keyframes bubbleAppear {
  0% {
    opacity: 0;
    transform: scale(0.3) translateY(20px);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* Stagger children */
.bubble:nth-child(1) { animation-delay: 0ms; }
.bubble:nth-child(2) { animation-delay: 80ms; }
.bubble:nth-child(3) { animation-delay: 160ms; }
.bubble:nth-child(4) { animation-delay: 240ms; }
.bubble:nth-child(5) { animation-delay: 320ms; }
```

**Idle Float:**
```css
@keyframes gentleFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

.bubble {
  animation: gentleFloat 4s ease-in-out infinite;
}
```

**Complete/Implode:**
```css
@keyframes bubbleComplete {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  30% {
    transform: scale(1.1);
  }
  100% {
    opacity: 0;
    transform: scale(0);
    filter: blur(4px);
  }
}

/* Plus sparkle particles - use Framer Motion or CSS particles */
```

**Skip/Dismiss:**
```css
@keyframes bubbleDismiss {
  0% {
    opacity: 1;
    transform: translateX(0);
  }
  100% {
    opacity: 0;
    transform: translateX(50px);
  }
}
```

---

## Glassmorphism Styling

```css
.engagement-bubble {
  /* Glass effect */
  background: linear-gradient(
    135deg,
    rgba(255, 140, 50, 0.12) 0%,
    rgba(255, 100, 50, 0.06) 100%
  );
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  
  /* Border */
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  
  /* Shadow */
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  
  /* Size */
  width: 180px;
  min-height: 160px;
  padding: 16px;
  
  /* Interaction */
  cursor: pointer;
  transition: all 0.3s ease;
}

.engagement-bubble:hover {
  transform: translateY(-4px) scale(1.02);
  border-color: rgba(255, 255, 255, 0.25);
  box-shadow: 
    0 12px 40px rgba(0, 0, 0, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

.engagement-bubble.expanded {
  width: 340px;
  min-height: 300px;
  z-index: 100;
}

/* Type-specific accent colors */
.bubble-photo { --accent: #f59e0b; }
.bubble-tag { --accent: #3b82f6; }
.bubble-info { --accent: #10b981; }
.bubble-memory { --accent: #8b5cf6; }
.bubble-knowledge { --accent: #ec4899; }
.bubble-connect { --accent: #06b6d4; }
```

---

## Component Structure

```
src/
├── components/
│   └── engagement/
│       ├── EngagementBubbles.tsx      # Container, layout, shuffle
│       ├── Bubble.tsx                  # Base bubble component
│       ├── bubbles/
│       │   ├── PhotoBackstoryBubble.tsx
│       │   ├── TagPersonBubble.tsx
│       │   ├── MissingInfoBubble.tsx
│       │   ├── MemoryPromptBubble.tsx
│       │   ├── KnowledgeBubble.tsx
│       │   ├── ConnectDotsBubble.tsx
│       │   ├── HighlightBubble.tsx
│       │   └── QuickQuestionBubble.tsx
│       ├── inputs/
│       │   ├── VoiceInput.tsx
│       │   ├── TextInput.tsx
│       │   ├── ContactPicker.tsx
│       │   ├── DatePicker.tsx
│       │   └── PhotoUpload.tsx
│       └── animations/
│           ├── BubbleAnimations.ts
│           └── Particles.tsx
├── hooks/
│   └── useEngagementPrompts.ts
├── lib/
│   └── engagement/
│       ├── promptGenerator.ts
│       ├── priorityScorer.ts
│       └── responseProcessor.ts
└── types/
    └── engagement.ts
```

---

## API Endpoints

```typescript
// GET /api/engagement/prompts
// Returns 5 prompts for display
interface GetPromptsResponse {
  prompts: EngagementPrompt[];
  stats: {
    totalAnswered: number;
    streakDays: number;
    knowledgeEntries: number;
  };
}

// POST /api/engagement/prompts/:id/respond
interface RespondRequest {
  responseType: 'voice' | 'text' | 'selection' | 'photo';
  responseText?: string;
  responseAudioUrl?: string;
  responseData?: Record<string, any>;
}

// POST /api/engagement/prompts/:id/skip
// Mark as skipped, won't show again for X days

// POST /api/engagement/prompts/:id/dismiss
// Mark as dismissed, won't show again

// POST /api/engagement/shuffle
// Get new set of prompts (refreshes queue)
```

---

## Metrics & Analytics

Track for optimization:

| Metric | Description |
|--------|-------------|
| Bubble impression | Shown to user |
| Bubble tap rate | % that get tapped/expanded |
| Completion rate | % that get answered |
| Skip rate | % explicitly skipped |
| Dismiss rate | % dismissed |
| Time to answer | Seconds from expand to save |
| Voice vs text | Preferred input method |
| Shuffle rate | How often users request new prompts |
| Session depth | Prompts answered per session |
| Category completion | Coverage by prompt type |

---

## Profile-Aware Personalization

Prompts should feel personal, not generic. Use profile data (interests, skills, hobbies, religion) to generate contextual prompts.

### Data Sources

```typescript
interface UserProfile {
  interests: string[];      // ['Reading', 'Music', 'Cooking', 'Singing']
  skills: string[];         // ['Leadership', 'Communication', 'Creativity']
  hobbies: string[];        // ['Golf', 'Woodworking', 'Photography']
  personality: string[];    // ['Introvert', 'Energetic', 'Optimistic']
  religion: string;         // 'Hindu', 'Christian', 'Jewish', 'Muslim', 'Buddhist', 'None', etc.
  life_goals: string[];     // ['Start a family', 'Travel the world']
  credo: string;            // 'Never stop learning'
}
```

### Personalized Prompt Templates

#### By Hobby/Interest

| Interest | Memory Prompt | Knowledge Prompt |
|----------|---------------|------------------|
| **Cooking** | "What's a dish that reminds you of home?" | "What recipe absolutely must be passed down?" |
| **Music** | "What song takes you back to a specific moment?" | "How has music shaped who you are?" |
| **Reading** | "What book changed how you see the world?" | "What story would you want your grandkids to read?" |
| **Photography** | "What's the story behind your favorite photo you took?" | "What makes a moment worth capturing?" |
| **Golf** | "Tell me about your best round ever" | "What has golf taught you about patience?" |
| **Woodworking** | "What's the most meaningful thing you've built?" | "What do you love about creating with your hands?" |
| **Gardening** | "What's growing in your garden right now?" | "What has gardening taught you about life?" |
| **Fishing** | "Tell me about the one that got away" | "Why do you find peace on the water?" |
| **Travel** | "What place changed your perspective?" | "What do you learn from experiencing other cultures?" |
| **Sports** | "What's your greatest athletic memory?" | "What has competition taught you?" |
| **Art** | "What piece of art has moved you most?" | "How do you express yourself creatively?" |
| **Writing** | "What story have you always wanted to tell?" | "Why do words matter to you?" |

#### By Skill

| Skill | Knowledge Prompt |
|-------|------------------|
| **Leadership** | "What makes a good leader?" / "How do you inspire others?" |
| **Communication** | "How do you handle difficult conversations?" |
| **Problem Solving** | "Walk me through how you approach a tough problem" |
| **Creativity** | "Where do your best ideas come from?" |
| **Teaching** | "What's the secret to helping someone learn?" |
| **Listening** | "Why is listening more important than talking?" |
| **Negotiation** | "How do you find common ground in conflict?" |
| **Public Speaking** | "How did you overcome fear of speaking?" |

#### By Religion/Spirituality

Respectful, opt-in prompts based on declared faith:

| Faith | Memory Prompt | Knowledge Prompt |
|-------|---------------|------------------|
| **Hindu** | "Tell me about a meaningful puja or festival" | "How has dharma guided your decisions?" / "What does karma mean in your daily life?" |
| **Christian** | "Tell me about a moment your faith carried you" | "How has your faith shaped who you are?" / "What scripture speaks to you most?" |
| **Jewish** | "What's your favorite Shabbat memory?" | "How do you pass down traditions to the next generation?" / "What does tikkun olam mean to you?" |
| **Muslim** | "Tell me about a meaningful Ramadan" | "How does your faith guide your daily life?" / "What has the Quran taught you?" |
| **Buddhist** | "Tell me about a moment of true mindfulness" | "How do you practice compassion daily?" / "What has meditation taught you?" |
| **Sikh** | "Tell me about a meaningful langar experience" | "How do you practice seva in your life?" |
| **Spiritual (non-religious)** | "Tell me about a transcendent moment in nature" | "Where do you find meaning?" / "What do you believe happens after we die?" |
| **Atheist/Agnostic** | "Tell me about a moment of profound wonder" | "Where do you find purpose without religion?" / "What gives your life meaning?" |
| **None/Skip** | *(Skip religion-specific prompts)* | *(Skip religion-specific prompts)* |

**Important:** Religion prompts should be:
- Opt-in (only if user has set religion in profile)
- Respectful and non-presumptuous
- Focused on personal experience, not doctrine
- Skippable without judgment

#### By Personality

| Trait | Prompt Style |
|-------|--------------|
| **Introvert** | More reflective, written prompts / "What do you treasure about quiet moments?" |
| **Extrovert** | More social, story-based / "Tell me about your favorite party or gathering" |
| **Optimistic** | Future-focused / "What are you most hopeful about?" |
| **Analytical** | Problem-solving / "What's the most complex thing you figured out?" |
| **Creative** | Open-ended / "If you could create anything, what would it be?" |
| **Practical** | Skill-based / "What's a skill you're glad you learned?" |

### Prompt Generation Logic

```typescript
function generatePersonalizedPrompts(user: UserProfile): EngagementPrompt[] {
  const prompts: EngagementPrompt[] = [];
  
  // 1. Interest-based memory prompts (40% of personalized)
  for (const interest of user.interests.slice(0, 3)) {
    const template = INTEREST_PROMPTS[interest.toLowerCase()];
    if (template) {
      prompts.push({
        type: 'memory_prompt',
        prompt_text: template.memory,
        category: 'interest',
        metadata: { interest }
      });
    }
  }
  
  // 2. Skill-based knowledge prompts (20%)
  for (const skill of user.skills.slice(0, 2)) {
    const template = SKILL_PROMPTS[skill.toLowerCase()];
    if (template) {
      prompts.push({
        type: 'knowledge',
        prompt_text: template,
        category: 'skills',
        metadata: { skill }
      });
    }
  }
  
  // 3. Religion-based prompts (if opted in) (10%)
  if (user.religion && user.religion !== 'None') {
    const template = RELIGION_PROMPTS[user.religion];
    if (template) {
      prompts.push({
        type: 'knowledge',
        prompt_text: template.knowledge,
        category: 'faith',
        metadata: { religion: user.religion }
      });
      prompts.push({
        type: 'memory_prompt', 
        prompt_text: template.memory,
        category: 'faith',
        metadata: { religion: user.religion }
      });
    }
  }
  
  // 4. Hobby-specific prompts (20%)
  for (const hobby of user.hobbies.slice(0, 2)) {
    const template = HOBBY_PROMPTS[hobby.toLowerCase()];
    if (template) {
      prompts.push({
        type: 'memory_prompt',
        prompt_text: template.memory,
        category: 'hobby',
        metadata: { hobby }
      });
      prompts.push({
        type: 'knowledge',
        prompt_text: template.knowledge,
        category: 'hobby',
        metadata: { hobby }
      });
    }
  }
  
  // 5. Life goals prompts (10%)
  for (const goal of user.life_goals) {
    prompts.push({
      type: 'knowledge',
      prompt_text: `You said you want to "${goal}" — why is this important to you?`,
      category: 'goals',
      metadata: { goal }
    });
  }
  
  return prompts;
}
```

### Prompt Refresh Strategy

```typescript
// Track which personalized prompts have been answered
interface PersonalizedPromptTracking {
  interest_prompts_answered: Record<string, string[]>; // interest -> prompt IDs
  skill_prompts_answered: Record<string, string[]>;
  religion_prompts_answered: string[];
  hobby_prompts_answered: Record<string, string[]>;
}

// Generate new prompts only for unanswered combinations
function getUnaskedPersonalizedPrompts(
  user: UserProfile, 
  tracking: PersonalizedPromptTracking
): EngagementPrompt[] {
  // Filter out already-asked combinations
  // Rotate through interests/hobbies over time
  // Ensure variety in prompt types
}
```

### Example Personalized Queue

For user with:
- **Interests:** Reading, Music, Cooking
- **Skills:** Leadership, Communication
- **Hobbies:** Golf, Woodworking
- **Religion:** Hindu

Generated bubbles might include:

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ 📚 Reading   │  │ 🎵 Music     │  │ 🏌️ Golf     │
│              │  │              │  │              │
│ What book    │  │ What song    │  │ Tell me      │
│ changed how  │  │ takes you    │  │ about your   │
│ you see the  │  │ back to a    │  │ best round   │
│ world?       │  │ moment?      │  │ ever         │
└──────────────┘  └──────────────┘  └──────────────┘

     ┌──────────────┐  ┌──────────────┐
     │ 🕉️ Faith     │  │ 🛠️ Skills    │
     │              │  │              │
     │ How has      │  │ What makes   │
     │ dharma       │  │ a good       │
     │ guided your  │  │ leader?      │
     │ decisions?   │  │              │
     └──────────────┘  └──────────────┘
```

---

## Future Enhancements

1. **AI-Generated Prompts** — Use Claude to generate personalized follow-up questions based on previous answers

2. **Collaborative Bubbles** — "Ask Sarah about this memory" — sends prompt to family member

3. **Time Capsule Mode** — "Answer this, reveal in 5 years"

4. **Mood-Based Prompts** — "I'm feeling nostalgic" generates warm memory prompts

5. **Voice Clone Playback** — After enough knowledge entries, play back wisdom in user's cloned voice

6. **Interview Mode** — Convert bubbles into guided video interview sessions

---

*This spec defines the Engagement Bubbles system. Update as we build and learn.*
