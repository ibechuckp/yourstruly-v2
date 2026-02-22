# Engagement Bubbles Audit - Key Findings

## Audit Date: 2026-02-21
## Auditor: Subagent

---

## Summary

The engagement bubbles memory creation flow has been audited. The migration 026_memories_voice_tags.sql successfully adds the required `audio_url` and `tags` columns to the memories table. However, **several critical issues were identified** that need attention.

---

## 🔴 Critical Issues

### 1. XP Is NOT Actually Being Awarded

**Location:** `src/app/api/engagement/prompts/[id]/route.ts`

**Problem:** While the Bubble component shows XP badges (e.g., "+15 XP") in the UI, the answer endpoint never actually calls `award_xp` or `record_daily_activity`. Users see XP promises but never receive them.

**Code Evidence:**
- `Bubble.tsx` line 24-35: `TYPE_CONFIG` defines XP values
- `route.ts`: No XP-related RPC calls anywhere in the 200+ line file
- XP only exists as a UI decoration, not a real game mechanic

**Fix Required:**
```typescript
// Add to route.ts after successful prompt answer
const XP_REWARDS: Record<string, number> = {
  photo_backstory: 15,
  tag_person: 5,
  missing_info: 5,
  memory_prompt: 20,
  knowledge: 15,
  connect_dots: 10,
  highlight: 5,
  quick_question: 5,
  postscript: 20,
  favorites_firsts: 10,
  recipes_wisdom: 15,
};

// Award XP
await supabase.rpc('award_xp', {
  p_user_id: user.id,
  p_amount: XP_REWARDS[prompt.type] || 10,
  p_action: 'answer_prompt',
  p_description: `Answered ${prompt.type} prompt`,
  p_reference_type: 'prompt',
  p_reference_id: promptId
});

// Record for streaks
await supabase.rpc('record_daily_activity', {
  p_user_id: user.id,
  p_activity_type: 'engagement_prompt'
});
```

---

### 2. Voice Recording Is Not Implemented

**Location:** `src/components/engagement/Bubble.tsx` lines 275-283

**Problem:** The voice input button shows a placeholder "Voice recording coming soon" with no actual functionality. The audio_url column exists but cannot be populated.

**Current Code:**
```tsx
<div className="p-6 bg-gray-50 rounded-xl text-center mb-3">
  <MicOff size={24} className="mx-auto mb-3 text-gray-300" />
  <p className="text-gray-400 text-sm mb-3">Voice recording coming soon</p>
  <button onClick={selectTextMode} className="text-sm text-[var(--yt-green)] font-medium">
    Type your response instead
  </button>
</div>
```

**Impact:** Users cannot create voice memories even though the database schema supports it.

---

### 3. Knowledge Entries Table Is Never Populated

**Location:** `src/app/api/engagement/prompts/[id]/route.ts`

**Problem:** The `knowledge_entries` table (defined in migration 017) exists but is never populated. The `knowledge` prompt type creates a regular memory, not a knowledge entry.

**Current Behavior:**
- `knowledge` prompts create memories with tags `['wisdom', ...]`
- No records in `knowledge_entries` table
- Digital Twin RAG cannot access this data

**Expected vs Actual:**
- Expected: `knowledge` prompts populate `knowledge_entries` with embeddings
- Actual: Creates regular memories like other prompt types

---

## 🟡 Medium Issues

### 4. No Milestone Celebration UI

The streak milestone system (7/30/100/365 days) awards XP bonuses but has **zero visual feedback**. Users receive XP but don't know they've hit a milestone.

**Database Function:** `record_daily_activity` in 014_xp_system.sql handles milestones
**Missing:** Celebration component, confetti, badges, or notifications

---

### 5. Missing Prompt Types in Database Enum

The TypeScript types define:
```typescript
type PromptType = 'photo_backstory' | 'tag_person' | 'missing_info' | 
  'memory_prompt' | 'knowledge' | 'connect_dots' | 'highlight' | 
  'quick_question' | 'postscript' | 'favorites_firsts' | 'recipes_wisdom';
```

But the PostgreSQL enum in migration 017 only includes:
```sql
CREATE TYPE prompt_type AS ENUM (
  'photo_backstory',
  'tag_person',
  'missing_info',
  'memory_prompt',
  'knowledge',
  'connect_dots',
  'highlight',
  'quick_question'
);
```

**Missing:** `postscript`, `favorites_firsts`, `recipes_wisdom`

**Fix:**
```sql
ALTER TYPE prompt_type ADD VALUE 'postscript';
ALTER TYPE prompt_type ADD VALUE 'favorites_firsts';
ALTER TYPE prompt_type ADD VALUE 'recipes_wisdom';
```

---

## ✅ What's Working

### 1. Memory Creation (Text Input)
- ✅ All memory-creating prompt types work correctly
- ✅ `result_memory_id` is properly stored on prompts
- ✅ Tags are correctly assigned based on prompt type
- ✅ Photo backstory properly links photos to memories

### 2. Progress Tracker Navigation
- ✅ Completed tiles appear with animation
- ✅ Memory prompts navigate to `/memories/{memoryId}`
- ✅ Contact prompts navigate to `/contacts/{contactId}`
- ✅ `memoryId` properly flows from API → Hook → Component state

### 3. Migration 026 Applied Successfully
- ✅ `audio_url` TEXT column exists
- ✅ `tags` TEXT[] array column exists
- ✅ GIN index on tags exists

### 4. Error Handling
- ✅ RPC fallback works if `answer_prompt` fails
- ✅ Direct table update attempted on RPC failure
- ✅ Proper error responses for 401, 404, 500

### 5. Contact Updates
- ✅ `missing_info` updates contact fields correctly
- ✅ `tag_person` updates `detected_faces` correctly
- ✅ No memory created for these (correct behavior)

---

## 🧪 Testing Recommendations

### Priority 1 (Critical)
1. Add XP award calls to answer endpoint
2. Implement voice recording UI + upload flow
3. Test each prompt type creates correct memory with proper tags

### Priority 2 (High)
4. Add milestone celebration UI
5. Update PostgreSQL enum to include missing prompt types
6. Decide: Should `knowledge` prompts create knowledge_entries?

### Priority 3 (Medium)
7. Add e2e tests for full flows
8. Test network error handling
9. Verify streak tracking works across days

---

## Files Modified During This Audit
- Created: `docs/ENGAGEMENT_TEST_PLAN.md` (comprehensive test checklist)
- Created: `docs/ENGAGEMENT_AUDIT_FINDINGS.md` (this file)

---

## Migration Status

| Migration | Status | Notes |
|-----------|--------|-------|
| 026_memories_voice_tags.sql | ✅ Applied | audio_url and tags columns added |
| 017_engagement_prompts.sql | ⚠️ Partial | Missing enum values for new prompt types |
| 014_xp_system.sql | ✅ Applied | XP functions exist but not called |

---

## Next Steps

1. **Immediate:** Add XP awarding to answer endpoint
2. **Short-term:** Implement voice recording flow
3. **Medium-term:** Add milestone celebration UI
4. **Long-term:** E2E test coverage for all prompt types
