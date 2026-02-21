# YoursTruly v2 — Database Migrations

## Overview

These migrations add the Engagement Bubbles system — floating micro-interaction prompts that help users capture memories, fill data gaps, and share wisdom.

## Migrations

| File | Description |
|------|-------------|
| `20260220_001_engagement_prompts.sql` | Core tables: `engagement_prompts`, `knowledge_entries`, `prompt_templates`, `engagement_stats` |
| `20260220_002_prompt_templates_seed.sql` | 100+ predefined prompt templates for all bubble types |
| `20260220_003_contacts_extension.sql` | Contact sharing fields + `detected_faces` table for face tagging |
| `20260220_004_pet_species_and_profile.sql` | Pet species dropdown fix + profile personalization fields |
| `20260220_005_engagement_helpers.sql` | Views and functions for prompt generation |

## How to Run

### Option 1: Supabase CLI (Recommended)

```bash
cd yourstruly-v2

# Run all migrations
npx supabase db push

# Or run specific migration
npx supabase db push --include-seed
```

### Option 2: Supabase Dashboard

1. Go to your project at https://supabase.com/dashboard
2. Navigate to **SQL Editor**
3. Run each migration file in order (001 → 002 → 003 → 004 → 005)

### Option 3: Direct psql

```bash
# Connect to your database
psql "postgres://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Run migrations
\i supabase/migrations/20260220_001_engagement_prompts.sql
\i supabase/migrations/20260220_002_prompt_templates_seed.sql
\i supabase/migrations/20260220_003_contacts_extension.sql
\i supabase/migrations/20260220_004_pet_species_and_profile.sql
\i supabase/migrations/20260220_005_engagement_helpers.sql
```

## New Tables

### `engagement_prompts`
Micro-interaction prompts shown as floating bubbles on dashboard.

```typescript
type EngagementPrompt = {
  id: string;
  user_id: string;
  type: 'photo_backstory' | 'tag_person' | 'missing_info' | 'memory_prompt' | 'knowledge' | 'connect_dots' | 'highlight' | 'quick_question';
  prompt_text: string;
  status: 'pending' | 'shown' | 'answered' | 'skipped' | 'dismissed';
  priority: number; // 1-100
  // ... related entities, responses, etc.
}
```

### `knowledge_entries`
Captured wisdom, advice, and life lessons for the Digital Twin.

```typescript
type KnowledgeEntry = {
  id: string;
  user_id: string;
  category: 'life_lessons' | 'values' | 'relationships' | 'parenting' | 'career' | 'health' | 'practical' | 'legacy' | 'faith' | 'interests' | 'skills' | 'hobbies' | 'goals';
  prompt_text: string;
  response_text: string;
  audio_url?: string;
  embedding?: number[]; // For RAG/semantic search
}
```

### `prompt_templates`
Library of 100+ predefined prompts, including:
- General memory & knowledge prompts
- Interest-based (cooking, music, reading, etc.)
- Hobby-based (golf, woodworking, fishing, etc.)
- Skill-based (leadership, communication, etc.)
- Religion-based (Hindu, Christian, Jewish, Muslim, Buddhist, etc.)
- Seasonal (holidays, summer, back-to-school)

### `detected_faces`
Faces detected in photos for tagging to contacts.

### `pet_species`, `interest_options`, `skill_options`, `religion_options`, `personality_options`
Dropdown options for profile and pet forms.

## New Functions

### `generate_engagement_prompts(user_id, count)`
Generates personalized prompts based on user's profile (interests, skills, religion, etc.) and data gaps (missing contact info, untagged photos, etc.).

### `shuffle_engagement_prompts(user_id, count, regenerate)`
Returns a shuffled set of prompts with type diversity (max 2 of same type).

### `answer_prompt(prompt_id, response_type, response_text, audio_url, data)`
Marks prompt as answered and updates engagement stats/streaks.

### `skip_prompt(prompt_id, cooldown_days)`
Skips prompt with configurable cooldown before it shows again.

## Views

| View | Purpose |
|------|---------|
| `photos_needing_backstory` | Photos without descriptions |
| `contacts_missing_info` | Contacts missing DOB, relationship, etc. |
| `untagged_faces` | Detected faces not yet matched |
| `life_stage_coverage` | Memory coverage by life stage |
| `knowledge_coverage` | Knowledge entries by category |

## Usage Example

```typescript
// Get 5 personalized prompts
const { data: prompts } = await supabase
  .rpc('shuffle_engagement_prompts', { 
    p_user_id: userId, 
    p_count: 5 
  });

// Answer a prompt
const { data: answered } = await supabase
  .rpc('answer_prompt', {
    p_prompt_id: promptId,
    p_response_type: 'voice',
    p_response_text: transcription,
    p_response_audio_url: audioUrl
  });

// Skip a prompt (7 day cooldown)
const { data: skipped } = await supabase
  .rpc('skip_prompt', {
    p_prompt_id: promptId,
    p_cooldown_days: 7
  });
```

## Profile Personalization Fields

After running migrations, profiles table will have:

```sql
interests TEXT[]      -- ['Reading', 'Music', 'Cooking']
skills TEXT[]         -- ['Leadership', 'Communication']
hobbies TEXT[]        -- ['Golf', 'Woodworking']
personality TEXT[]    -- ['Introvert', 'Optimistic']
religion TEXT         -- 'Hindu', 'Christian', etc.
life_goals TEXT[]     -- ['Start a family', 'Travel the world']
credo TEXT            -- 'Never stop learning'
```

These are used to generate personalized prompts.

## Notes

- Migrations are idempotent (safe to run multiple times)
- RLS policies are included for all new tables
- pgvector index for `knowledge_entries.embedding` is commented out — uncomment after enabling pgvector extension and having enough rows
- pg_cron scheduled job for daily prompt generation is commented out — uncomment if pg_cron is available
