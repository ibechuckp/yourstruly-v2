# Multi-Step Engagement Prompts

## Concept

Instead of one question → one answer, tiles can have a **conversation flow** that progressively gathers richer context. Each answer can trigger a contextual follow-up.

## User Experience

```
┌─────────────────────────────────────┐
│ 📸 PHOTO STORY              +15 XP  │
│                                     │
│ Who taught you photography?         │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ My grandfather                  │ │
│ └─────────────────────────────────┘ │
│                          [Next →]   │
└─────────────────────────────────────┘

        ↓ After answering...

┌─────────────────────────────────────┐
│ 📸 PHOTO STORY              +15 XP  │
│                                     │
│ ✓ "My grandfather"                  │  ← Previous answer (collapsed)
│                                     │
│ What's a favorite memory with your  │
│ grandfather and photography?        │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ He let me use his old Nikon...  │ │
│ └─────────────────────────────────┘ │
│                          [Next →]   │
└─────────────────────────────────────┘

        ↓ After answering...

┌─────────────────────────────────────┐
│ 📸 PHOTO STORY              +15 XP  │
│                                     │
│ ✓ "My grandfather"                  │
│ ✓ "He let me use his old Nikon..."  │
│                                     │
│ Do you have a photo from that time? │
│                                     │
│  [📷 Add Photo]  [Skip]  [Done ✓]   │
└─────────────────────────────────────┘
```

## Data Structure

```typescript
interface EngagementPrompt {
  id: string;
  type: string;
  
  // Multi-step support
  steps: PromptStep[];
  currentStep: number;
  
  // Accumulated answers
  responses: StepResponse[];
}

interface PromptStep {
  id: string;
  question: string;
  inputType: 'text' | 'voice' | 'photo' | 'date' | 'select';
  required: boolean;
  
  // Dynamic follow-up generation
  generateFollowUp?: (previousAnswer: string) => string | null;
  
  // Predefined follow-ups based on keywords
  conditionalFollowUps?: {
    keywords: string[];
    followUp: string;
  }[];
}

interface StepResponse {
  stepId: string;
  answer: string;
  mediaUrl?: string;
  answeredAt: string;
}
```

## Step Generation Strategies

### 1. Template-Based Steps
Pre-defined step sequences for common topics:

```typescript
const PHOTOGRAPHY_INTEREST_STEPS = [
  { question: "Who taught you photography?", inputType: 'text' },
  { question: "What's a favorite memory with {{answer1}} and photography?", inputType: 'text' },
  { question: "Do you have a photo from that time?", inputType: 'photo', required: false },
];
```

### 2. AI-Generated Follow-ups
Use the AI to generate contextual follow-ups based on the answer:

```typescript
// After user answers "My grandfather taught me"
const followUp = await generateFollowUp({
  topic: "photography",
  previousQuestion: "Who taught you photography?",
  previousAnswer: "My grandfather",
  userProfile: { /* interests, contacts, etc */ }
});
// Returns: "What's your favorite memory of learning from your grandfather?"
```

### 3. Entity Extraction + Smart Follow-up
Extract entities from answers and ask about them:

```typescript
// User answer: "My grandfather, he had an old Nikon F2"
// Extracted: { person: "grandfather", object: "Nikon F2" }

// Generated follow-ups:
// - "Tell me more about your grandfather"
// - "Do you still have that Nikon F2?"
// - "What's your favorite photo taken with that camera?"
```

## Final Memory Creation

When the conversation completes, combine all answers into one rich memory:

```typescript
// Accumulated responses:
// Step 1: "My grandfather"
// Step 2: "He let me use his old Nikon on a camping trip. I was maybe 10."
// Step 3: [photo uploaded]

// Created Memory:
{
  title: "Learning Photography from Grandpa",
  description: `My grandfather taught me photography. He let me use his old Nikon on a camping trip. I was maybe 10.`,
  tags: ["photography", "grandfather", "childhood", "learning"],
  memory_media: [uploaded_photo],
  related_contacts: [grandfather_contact_id], // if linked
}
```

## UI States

### Tile States
1. **Initial** - First question, empty input
2. **In Progress** - Has answered 1+ steps, showing current step
3. **Optional Step** - Current step can be skipped
4. **Complete** - All steps answered, ready to save

### Progress Indicator
Show dots or progress bar for multi-step:
```
● ● ○ ○  Step 2 of 4
```

## Skip & Back Behavior

- **Skip**: Move to next step (if current is optional) or finish early
- **Back**: Go to previous step to edit answer
- **Done**: Save current progress even if not all steps complete

## XP Rewards

Reward completion depth:
- Complete step 1: +5 XP
- Complete step 2: +5 XP  
- Complete step 3: +5 XP
- Upload photo: +5 XP
- **Bonus for full completion: +5 XP**

Total possible: 25 XP for a rich, complete memory

## Implementation Priority

### Phase 1: Simple Follow-ups
- Add `followUpQuestion` field to prompts
- After answering, check if follow-up exists
- Show follow-up in same tile
- Combine answers into memory

### Phase 2: Dynamic Generation
- AI-generated follow-ups based on answer content
- Entity extraction for smarter questions
- Context-aware branching

### Phase 3: Full Conversation
- Multi-step templates for different topics
- Progress tracking across sessions
- Resume incomplete conversations
