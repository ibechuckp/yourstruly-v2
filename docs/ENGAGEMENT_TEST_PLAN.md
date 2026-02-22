# Engagement Bubbles Memory Creation Test Plan

## Overview
This test plan covers the memory creation flow from engagement bubbles, including voice/text input, progress tracking, XP awards, and milestone celebrations.

## Related Files
- `src/app/api/engagement/prompts/[id]/route.ts` - Answer endpoint
- `src/components/engagement/EngagementBubbles.tsx` - Main bubbles component
- `src/components/engagement/Bubble.tsx` - Individual bubble UI
- `src/hooks/useEngagementPrompts.ts` - Data fetching hook
- `supabase/migrations/026_memories_voice_tags.sql` - Recent migration for audio_url/tags

---

## Test Checklist

### 1. Memory Creation by Prompt Type

#### 1.1 Knowledge Prompts (`knowledge`)
- [ ] Text response creates memory with `tags: ['wisdom', <interest>, <skill>]`
- [ ] Memory title is prompt text truncated to 100 chars
- [ ] Description is the full response text
- [ ] `result_memory_id` is updated on the engagement_prompts record
- [ ] Personalization context (interest/skill) is included in tags

#### 1.2 Photo Backstory (`photo_backstory`)
- [ ] Text response creates memory with `tags: ['photo story']`
- [ ] Memory description is the response text
- [ ] Photo is linked via `memory_media.memory_id` update
- [ ] Photo description is updated with response text
- [ ] `result_memory_id` is updated on the prompt

#### 1.3 Memory Prompt (`memory_prompt`)
- [ ] Text response creates memory with `tags: ['memory prompt']`
- [ ] Memory title is prompt text (truncated)
- [ ] Memory description is response text

#### 1.4 Favorites & Firsts (`favorites_firsts`)
- [ ] Text response creates memory with `tags: ['favorites firsts']`
- [ ] Memory description contains response

#### 1.5 Recipes & Wisdom (`recipes_wisdom`)
- [ ] Text response creates memory with `tags: ['recipes wisdom']`
- [ ] Memory description contains response

#### 1.6 Postscript (`postscript`)
- [ ] Text response creates memory with `tags: ['postscript']`
- [ ] Memory description contains response

#### 1.7 Missing Info (`missing_info`) - NO MEMORY CREATED
- [ ] Text response does NOT create memory
- [ ] Contact field is updated (birth_date, phone, email, etc.)
- [ ] `contactUpdated` returned as true

#### 1.8 Tag Person (`tag_person`) - NO MEMORY CREATED
- [ ] Selection response does NOT create memory
- [ ] `detected_faces.matched_contact_id` is updated
- [ ] `detected_faces.manually_verified` set to true

#### 1.9 Quick Question (`quick_question`) - NO MEMORY CREATED
- [ ] Text response does NOT create memory
- [ ] Contact field is updated

---

### 2. Voice Recording Flow

#### 2.1 Voice Input UI
- [ ] Voice button shows "Voice recording coming soon" placeholder
- [ ] Link to "Type your response instead" works
- [ ] No actual recording functionality currently implemented

#### 2.2 Voice Upload → Memory Creation (Future)
- [ ] Audio file upload to storage bucket
- [ ] Audio URL passed as `responseAudioUrl`
- [ ] Memory created with `audio_url` populated
- [ ] Memory description shows "🎤 Voice memory recorded" placeholder
- [ ] `tags` array includes appropriate prompt type tag

#### 2.3 Migration Verification
- [ ] `memories.audio_url` column exists (migration 026)
- [ ] `memories.tags` column exists as TEXT[]
- [ ] GIN index on tags exists

---

### 3. Text Input Flow

#### 3.1 Basic Text Submission
- [ ] Text area expands properly
- [ ] Enter key submits (Shift+Enter for new line)
- [ ] Submit button disabled when empty
- [ ] Loading state shows "Saving..."
- [ ] Success removes bubble from view

#### 3.2 Text Input Edge Cases
- [ ] Whitespace-only input is rejected/trimmed
- [ ] Very long text (1000+ chars) handled properly
- [ ] Special characters (emoji, quotes, newlines) preserved
- [ ] Empty submission shows error/validation

---

### 4. Progress Tracker Navigation

#### 4.1 Completed Tile Display
- [ ] Completed tile appears in progress tracker after submission
- [ ] Tile shows appropriate icon or photo/contact avatar
- [ ] Animation: scale from 0 with spring effect
- [ ] Tiles ordered by completion (newest first)

#### 4.2 Navigation - Memory Prompts
- [ ] Clicking completed memory tile navigates to `/memories/{memoryId}`
- [ ] `memoryId` from API response is stored in tile state
- [ ] Console logs show memoryId from answer result

#### 4.3 Navigation - Contact Prompts
- [ ] Clicking `missing_info` tile navigates to `/contacts/{contactId}`
- [ ] Clicking `tag_person` tile navigates to `/contacts/{contactId}`
- [ ] `contactId` from prompt or API response used

#### 4.4 Fallback Navigation
- [ ] If no memoryId, navigates to `/memories` list
- [ ] Console warning shown when navigation data missing

---

### 5. XP Increment on Completion

#### 5.1 XP Values by Type (from Bubble.tsx TYPE_CONFIG)
| Type | XP | Tested |
|------|-----|--------|
| photo_backstory | 15 | [ ] |
| tag_person | 5 | [ ] |
| missing_info | 5 | [ ] |
| memory_prompt | 20 | [ ] |
| knowledge | 15 | [ ] |
| connect_dots | 10 | [ ] |
| highlight | 5 | [ ] |
| quick_question | 5 | [ ] |
| postscript | 20 | [ ] |
| favorites_firsts | 10 | [ ] |
| recipes_wisdom | 15 | [ ] |

#### 5.2 XP Award Verification
- [ ] XP badge shows correct amount on bubble
- [ ] XP is awarded via `award_xp` RPC call (if implemented in API)
- [ ] ⚠️ **CRITICAL**: XP is NOT currently awarded in the answer endpoint

> **Issue Found**: The answer endpoint does NOT call `award_xp` or `recordActivity`. XP is only defined in the Bubble component UI but never actually awarded.

---

### 6. Milestone Celebrations

#### 6.1 Streak Milestones (from 014_xp_system.sql)
- [ ] 7-day streak: 50 XP bonus
- [ ] 30-day streak: 200 XP bonus
- [ ] 100-day streak: 500 XP bonus
- [ ] 365-day streak: 2000 XP bonus

#### 6.2 Daily Activity Recording
- [ ] `record_daily_activity` RPC called on engagement
- [ ] Daily XP (10 base + 5 streak bonus) awarded
- [ ] Duplicate activity on same day handled (no double XP)

#### 6.3 Level Progression
- [ ] Level calculated as `FLOOR(total_xp / 1000) + 1`
- [ ] Level updates in real-time after XP award

> **Issue Found**: No milestone celebration UI exists. Streak milestones only award XP, no visual celebration.

---

### 7. Edge Cases

#### 7.1 Empty/Invalid Input
- [ ] Empty text submission blocked (button disabled)
- [ ] Whitespace-only input trimmed to empty and blocked
- [ ] Cancel button returns to input mode selection

#### 7.2 Network Errors
- [ ] Network failure during submission shows error
- [ ] Bubble remains open on error (not removed)
- [ ] Retry mechanism available (can click Save again)
- [ ] Console error logged with details

#### 7.3 Duplicate Submissions
- [ ] Rapid double-clicking doesn't create duplicate memories
- [ ] `isSubmitting` state prevents double submission
- [ ] Button disabled during submission

#### 7.4 Authentication Errors
- [ ] 401 returned if user not authenticated
- [ ] Proper error message shown

#### 7.5 Prompt Not Found
- [ ] 404 returned if prompt doesn't exist or belongs to another user
- [ ] Proper error message shown

#### 7.6 RPC Fallback
- [ ] If `answer_prompt` RPC fails, direct table update is attempted
- [ ] Fallback properly updates prompt status
- [ ] Error details returned if both fail

#### 7.7 Memory Creation Failure
- [ ] If memory insert fails, prompt is still marked answered
- [ ] Error logged but user sees success
- [ ] Memory can be manually created later

---

### 8. Integration Tests

#### 8.1 Full Flow: Photo Backstory
```
1. User clicks photo_backstory bubble
2. Enters text story
3. Clicks Save
4. API creates memory
5. Photo linked to memory
6. Tile appears in progress tracker
7. Click tile → navigates to memory
8. XP awarded (if implemented)
```

#### 8.2 Full Flow: Missing Info
```
1. User clicks missing_info bubble
2. Enters contact info
3. Clicks Save
4. Contact updated
5. No memory created
6. Tile appears in progress tracker
7. Click tile → navigates to contact
```

---

## Issues Identified

### 🔴 Critical Issues

1. **XP Not Actually Awarded**
   - Location: `route.ts` answer endpoint
   - Issue: XP amounts are shown in UI (`TYPE_CONFIG`) but never awarded
   - Fix: Add XP award calls in the API:
   ```typescript
   // After successful answer
   await supabase.rpc('award_xp', {
     p_user_id: user.id,
     p_amount: XP_REWARDS[prompt.type],
     p_action: 'answer_prompt',
     p_description: `Answered ${prompt.type} prompt`,
     p_reference_type: 'prompt',
     p_reference_id: promptId
   });
   
   await supabase.rpc('record_daily_activity', {
     p_user_id: user.id,
     p_activity_type: 'engagement_prompt'
   });
   ```

2. **Voice Recording Not Implemented**
   - Location: `Bubble.tsx`
   - Issue: Voice button shows "coming soon" placeholder
   - Impact: Audio memory creation flow cannot be tested

3. **Knowledge Entries Not Created**
   - Location: `route.ts` 
   - Issue: `knowledgeEntry` always returns null, no code path creates knowledge entries
   - The `knowledge_entries` table exists but is never populated by prompts

### 🟡 Medium Issues

4. **No Milestone Celebration UI**
   - Streak milestones award XP but have no visual feedback
   - No animations, confetti, or celebration components

5. **Missing RPC Result Handling**
   - `answerPrompt` in hook doesn't return RPC result properly typed
   - Some edge cases may not propagate memoryId correctly

### 🟢 Low Issues

6. **Type Safety**
   - `memoryId` is typed as `string | undefined` in response but could be `null`
   - Inconsistent null vs undefined handling

---

## SQL Verification Commands

```sql
-- Check migration 026 was applied
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'memories' 
AND column_name IN ('audio_url', 'tags');

-- Check engagement prompts have result_memory_id
SELECT id, type, status, result_memory_id 
FROM engagement_prompts 
WHERE status = 'answered' 
LIMIT 5;

-- Check memories created from prompts
SELECT m.id, m.title, m.tags, m.audio_url, m.created_at
FROM memories m
JOIN engagement_prompts ep ON ep.result_memory_id = m.id
ORDER BY m.created_at DESC
LIMIT 5;

-- Check XP was awarded
SELECT * FROM xp_transactions 
WHERE action = 'answer_prompt'
ORDER BY created_at DESC
LIMIT 5;
```

---

## Success Criteria

- [ ] All prompt types that should create memories do so correctly
- [ ] Progress tracker tiles navigate to correct memory/contact pages
- [ ] Memory records include proper tags and audio_url when applicable
- [ ] XP is awarded for each prompt completion
- [ ] Streaks are tracked and milestone bonuses awarded
- [ ] No duplicate memories created on double-submit
- [ ] Graceful error handling for network failures

---

## Post-Migration Checklist

After applying migration 026:
- [ ] Verify `audio_url` column exists on memories table
- [ ] Verify `tags` column exists as TEXT[] array
- [ ] Verify GIN index on tags exists
- [ ] Test voice memory creation (once voice recording implemented)
- [ ] Test tag-based memory search
