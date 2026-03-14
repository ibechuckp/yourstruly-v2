-- ============================================================================
-- Smart family and location prompts with conditional logic
-- Created: 2026-03-13
-- Purpose: Add prompts that respect known relationship status and gather complete family/location history
-- ============================================================================

-- ============================================================================
-- FAMILY BACKGROUND PROMPTS (always safe to ask)
-- ============================================================================

INSERT INTO prompt_templates (id, type, category, prompt_text, priority_boost, is_active) VALUES

-- Siblings
('family_siblings_001', 'memory_prompt', 'childhood', 'Do you have any siblings? Tell me about them.', 15, TRUE),
('family_siblings_names_001', 'memory_prompt', 'childhood', 'What are your siblings'' names and how old are they?', 10, TRUE),
('family_siblings_relationship_001', 'memory_prompt', 'childhood', 'What was your relationship like with your siblings growing up?', 10, TRUE),
('family_siblings_now_001', 'memory_prompt', 'relationships', 'How would you describe your relationship with your siblings now?', 5, TRUE),
('family_birth_order_001', 'memory_prompt', 'childhood', 'Are you the oldest, youngest, middle child, or only child?', 10, TRUE),

-- Who you grew up with
('family_grew_up_001', 'memory_prompt', 'childhood', 'Who did you grow up with? Parents, grandparents, other relatives?', 15, TRUE),
('family_household_001', 'memory_prompt', 'childhood', 'What was your household like growing up? Who lived with you?', 10, TRUE),
('family_parents_001', 'memory_prompt', 'childhood', 'Tell me about your parents. What were they like?', 15, TRUE),
('family_grandparents_001', 'memory_prompt', 'childhood', 'Did you know your grandparents? What were they like?', 10, TRUE),
('family_extended_001', 'memory_prompt', 'childhood', 'Were you close with any extended family members? Aunts, uncles, cousins?', 5, TRUE),

-- Family dynamics
('family_traditions_001', 'memory_prompt', 'childhood', 'What family traditions did you have growing up?', 10, TRUE),
('family_gatherings_001', 'memory_prompt', 'childhood', 'What were family gatherings like in your childhood?', 5, TRUE),
('family_values_001', 'knowledge', 'wisdom', 'What values did your family instill in you?', 10, TRUE)

ON CONFLICT (id) DO UPDATE SET 
  prompt_text = EXCLUDED.prompt_text,
  priority_boost = EXCLUDED.priority_boost,
  is_active = EXCLUDED.is_active;

-- ============================================================================
-- LOCATION HISTORY PROMPTS
-- ============================================================================

INSERT INTO prompt_templates (id, type, category, prompt_text, priority_boost, is_active) VALUES

-- Comprehensive location history
('location_all_places_001', 'memory_prompt', 'life_moments', 'What are all the places you''ve lived in your life? List each city and state.', 20, TRUE),
('location_timeline_001', 'memory_prompt', 'life_moments', 'Can you give me a timeline of where you lived and when? Start from birth.', 15, TRUE),

-- Childhood homes
('location_childhood_home_001', 'memory_prompt', 'childhood', 'What''s the address of the first home you remember? What did it look like?', 15, TRUE),
('location_childhood_street_001', 'memory_prompt', 'childhood', 'What street did you grow up on? Describe the neighborhood.', 10, TRUE),
('location_childhood_city_001', 'memory_prompt', 'childhood', 'What city and state did you spend most of your childhood in?', 15, TRUE),

-- Teen/young adult
('location_highschool_001', 'memory_prompt', 'teenage', 'Where did you live during high school? Same place as childhood or different?', 10, TRUE),
('location_college_001', 'memory_prompt', 'college', 'Where did you live during college? Dorm address? Apartment?', 10, TRUE),

-- Adult homes
('location_first_own_001', 'memory_prompt', 'jobs_career', 'What was the address of the first place you lived on your own?', 10, TRUE),
('location_longest_001', 'memory_prompt', 'life_moments', 'What place have you lived the longest? What''s special about it?', 10, TRUE),
('location_favorite_001', 'memory_prompt', 'life_moments', 'What''s your favorite place you''ve ever lived and why?', 10, TRUE),

-- Current
('location_current_001', 'memory_prompt', 'life_moments', 'What''s your current address? How long have you lived there?', 15, TRUE),

-- Memories tied to places
('location_memories_001', 'memory_prompt', 'life_moments', 'What''s your favorite memory from [LOCATION]?', 5, TRUE),
('location_neighbors_001', 'memory_prompt', 'relationships', 'Who were your neighbors at [LOCATION]? Any good stories?', 5, TRUE),
('location_why_moved_001', 'memory_prompt', 'life_moments', 'Why did you move from [LOCATION]? What prompted the change?', 5, TRUE)

ON CONFLICT (id) DO UPDATE SET 
  prompt_text = EXCLUDED.prompt_text,
  priority_boost = EXCLUDED.priority_boost,
  is_active = EXCLUDED.is_active;

-- ============================================================================
-- RELATIONSHIP PROMPTS (conditional on having spouse/partner contact)
-- ============================================================================

-- Update existing relationship prompts to only appear if user has a spouse/partner contact

-- Mark old unsafe prompts as inactive
UPDATE prompt_templates
SET is_active = FALSE,
    updated_at = NOW()
WHERE id IN (
  'relationship_proposal_001', -- Don't assume they got married
  'relationship_wedding_001',   -- Don't assume they had a wedding
  'relationship_anniversary_001' -- Don't assume married
)
AND is_active = TRUE;

-- Add new conditional relationship prompts (only shown if spouse/partner exists in contacts)
INSERT INTO prompt_templates (id, type, category, prompt_text, priority_boost, is_active, conditional_query) VALUES

('relationship_how_met_001', 'memory_prompt', 'relationships', 'How did you meet your spouse/partner? Tell me the story.', 15, TRUE,
  'SELECT EXISTS(SELECT 1 FROM contacts WHERE user_id = $1 AND relationship_type IN (''spouse'', ''partner'', ''significant_other''))'),

('relationship_first_date_001', 'memory_prompt', 'relationships', 'What was your first date with your spouse/partner like?', 10, TRUE,
  'SELECT EXISTS(SELECT 1 FROM contacts WHERE user_id = $1 AND relationship_type IN (''spouse'', ''partner'', ''significant_other''))'),

('relationship_proposal_002', 'memory_prompt', 'relationships', 'Tell me about the proposal. Who proposed and how?', 15, TRUE,
  'SELECT EXISTS(SELECT 1 FROM contacts WHERE user_id = $1 AND relationship_type = ''spouse'')'),

('relationship_wedding_002', 'memory_prompt', 'relationships', 'Tell me about your wedding day. Where was it? Who was there?', 10, TRUE,
  'SELECT EXISTS(SELECT 1 FROM contacts WHERE user_id = $1 AND relationship_type = ''spouse'')'),

('relationship_why_love_001', 'memory_prompt', 'relationships', 'What do you love most about your spouse/partner?', 10, TRUE,
  'SELECT EXISTS(SELECT 1 FROM contacts WHERE user_id = $1 AND relationship_type IN (''spouse'', ''partner'', ''significant_other''))'),

('relationship_challenges_001', 'memory_prompt', 'relationships', 'What challenges have you and your spouse/partner overcome together?', 5, TRUE,
  'SELECT EXISTS(SELECT 1 FROM contacts WHERE user_id = $1 AND relationship_type IN (''spouse'', ''partner'', ''significant_other''))'),

('relationship_favorite_memory_001', 'memory_prompt', 'relationships', 'What''s your favorite memory with your spouse/partner?', 10, TRUE,
  'SELECT EXISTS(SELECT 1 FROM contacts WHERE user_id = $1 AND relationship_type IN (''spouse'', ''partner'', ''significant_other''))'),

-- Children prompts (conditional on having child contacts)
('relationship_kids_001', 'memory_prompt', 'relationships', 'Tell me about your children. What are their names and ages?', 15, TRUE,
  'SELECT EXISTS(SELECT 1 FROM contacts WHERE user_id = $1 AND relationship_type IN (''son'', ''daughter'', ''child''))'),

('relationship_parenting_001', 'memory_prompt', 'relationships', 'What has being a parent taught you?', 10, TRUE,
  'SELECT EXISTS(SELECT 1 FROM contacts WHERE user_id = $1 AND relationship_type IN (''son'', ''daughter'', ''child''))')

ON CONFLICT (id) DO UPDATE SET 
  prompt_text = EXCLUDED.prompt_text,
  priority_boost = EXCLUDED.priority_boost,
  is_active = EXCLUDED.is_active,
  conditional_query = EXCLUDED.conditional_query;

-- ============================================================================
-- Add conditional_query column if it doesn't exist
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prompt_templates' 
    AND column_name = 'conditional_query'
  ) THEN
    ALTER TABLE prompt_templates 
      ADD COLUMN conditional_query TEXT;
      
    COMMENT ON COLUMN prompt_templates.conditional_query IS 'SQL query to check if prompt should be shown. Should return boolean. $1 = user_id';
  END IF;
END
$$;
