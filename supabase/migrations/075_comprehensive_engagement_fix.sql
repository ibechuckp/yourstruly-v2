-- Migration 075: Comprehensive Engagement Fix
-- Restores photo-based prompts, adds memory-based follow-ups
-- Focuses on happy/positive moments, avoids difficult topics

-- ============================================
-- STEP 1: Add photo task templates
-- ============================================
INSERT INTO prompt_templates (id, type, category, prompt_text, priority_boost, is_active) VALUES
-- Photo backstory prompts
('photo_story_001', 'photo_backstory', 'photos', 'What''s the story behind this photo?', 10, true),
('photo_story_002', 'photo_backstory', 'photos', 'Tell me about this moment - where were you and who were you with?', 10, true),
('photo_story_003', 'photo_backstory', 'photos', 'What makes this photo special to you?', 10, true),
('photo_story_004', 'photo_backstory', 'photos', 'I''d love to hear the story behind this picture!', 10, true),
('photo_story_005', 'photo_backstory', 'photos', 'What happy memory does this photo bring back?', 10, true),
('photo_story_006', 'photo_backstory', 'photos', 'Who took this photo? What was the occasion?', 9, true),
('photo_story_007', 'photo_backstory', 'photos', 'What were you feeling in this moment?', 9, true),
('photo_story_008', 'photo_backstory', 'photos', 'Is there a fun story behind this picture?', 9, true),

-- Face tagging prompts
('face_tag_001', 'tag_person', 'photos', 'Who is this person in the photo?', 8, true),
('face_tag_002', 'tag_person', 'photos', 'Do you recognize who this is?', 8, true),
('face_tag_003', 'tag_person', 'photos', 'Help me learn - who is this?', 8, true)
ON CONFLICT (id) DO UPDATE SET prompt_text = EXCLUDED.prompt_text, is_active = true;

-- ============================================
-- STEP 2: Add contact story templates (positive focus)
-- ============================================
INSERT INTO prompt_templates (id, type, category, prompt_text, priority_boost, is_active) VALUES
('contact_happy_001', 'contact_story', 'relationships', 'What''s your happiest memory with {{contact_name}}?', 8, true),
('contact_happy_002', 'contact_story', 'relationships', 'What do you love most about {{contact_name}}?', 8, true),
('contact_happy_003', 'contact_story', 'relationships', 'What''s the funniest thing that happened with {{contact_name}}?', 7, true),
('contact_happy_004', 'contact_story', 'relationships', 'What adventure have you had with {{contact_name}}?', 7, true),
('contact_happy_005', 'contact_story', 'relationships', 'What makes {{contact_name}} special to you?', 8, true),
('contact_happy_006', 'contact_story', 'relationships', 'Tell me a fun story about you and {{contact_name}}', 7, true),
('contact_happy_007', 'contact_story', 'relationships', 'What''s something {{contact_name}} taught you?', 7, true),
('contact_happy_008', 'contact_story', 'relationships', 'What celebration or special occasion did you share with {{contact_name}}?', 6, true)
ON CONFLICT (id) DO UPDATE SET prompt_text = EXCLUDED.prompt_text, is_active = true;

-- ============================================
-- STEP 3: Add memory follow-up templates (elaborating on existing memories)
-- ============================================
INSERT INTO prompt_templates (id, type, category, prompt_text, priority_boost, is_active) VALUES
('memory_followup_001', 'memory_elaboration', 'memories', 'You mentioned {{memory_snippet}} - tell me more about that happy time!', 9, true),
('memory_followup_002', 'memory_elaboration', 'memories', 'I''d love to hear more about {{memory_snippet}}', 9, true),
('memory_followup_003', 'memory_elaboration', 'memories', 'That sounds wonderful! What else do you remember about {{memory_snippet}}?', 8, true),
('memory_followup_004', 'memory_elaboration', 'memories', 'What other happy moments came from {{memory_snippet}}?', 8, true),
('memory_followup_005', 'memory_elaboration', 'memories', 'Who else was part of {{memory_snippet}}?', 7, true)
ON CONFLICT (id) DO UPDATE SET prompt_text = EXCLUDED.prompt_text, is_active = true;

-- ============================================
-- STEP 4: Add wisdom follow-up templates
-- ============================================
INSERT INTO prompt_templates (id, type, category, prompt_text, priority_boost, is_active) VALUES
('wisdom_followup_001', 'wisdom_elaboration', 'wisdom', 'You shared that {{wisdom_snippet}} - what experience taught you that?', 8, true),
('wisdom_followup_002', 'wisdom_elaboration', 'wisdom', 'That''s beautiful wisdom! Can you share a story that illustrates {{wisdom_snippet}}?', 8, true),
('wisdom_followup_003', 'wisdom_elaboration', 'wisdom', 'How did you come to learn {{wisdom_snippet}}?', 7, true)
ON CONFLICT (id) DO UPDATE SET prompt_text = EXCLUDED.prompt_text, is_active = true;

-- ============================================
-- STEP 5: Deactivate sad/difficult topics
-- ============================================
UPDATE prompt_templates 
SET is_active = false 
WHERE prompt_text ILIKE '%hardest%'
   OR prompt_text ILIKE '%difficult%'
   OR prompt_text ILIKE '%tough time%'
   OR prompt_text ILIKE '%struggle%'
   OR prompt_text ILIKE '%hard chapter%'
   OR prompt_text ILIKE '%loss%'
   OR prompt_text ILIKE '%grief%'
   OR prompt_text ILIKE '%passed away%'
   OR prompt_text ILIKE '%miss someone%'
   OR prompt_text ILIKE '%regret%'
   OR prompt_text ILIKE '%failure%'
   OR prompt_text ILIKE '%fear%'
   OR prompt_text ILIKE '%afraid%'
   OR prompt_text ILIKE '%divorce%'
   OR prompt_text ILIKE '%separation%'
   OR prompt_text ILIKE '%death%';

-- Keep some positive growth prompts but reframe them
UPDATE prompt_templates 
SET prompt_text = 'What challenge helped you grow into who you are today?', is_active = true
WHERE id = 'deep_exp_004';

UPDATE prompt_templates 
SET prompt_text = 'What did a past experience teach you about yourself?', is_active = true
WHERE id = 'life_change_002';

-- ============================================
-- STEP 6: Create views for photo and contact tasks
-- ============================================

-- View: Photos needing stories (not yet in a memory)
CREATE OR REPLACE VIEW photos_needing_backstory AS
SELECT 
  mm.id as media_id,
  mm.user_id,
  mm.file_url,
  mm.thumbnail_url,
  mm.created_at,
  mm.ai_description
FROM memory_media mm
WHERE mm.memory_id IS NULL
  AND mm.file_type LIKE 'image/%'
  AND NOT EXISTS (
    SELECT 1 FROM engagement_prompts ep 
    WHERE ep.photo_id = mm.id 
    AND ep.status IN ('answered', 'pending')
    AND ep.created_at > NOW() - INTERVAL '30 days'
  )
ORDER BY mm.created_at DESC
LIMIT 50;

-- View: Untagged faces in photos
CREATE OR REPLACE VIEW untagged_faces AS
SELECT 
  f.id as face_id,
  f.media_id,
  mm.user_id,
  f.bbox_x,
  f.bbox_y,
  f.bbox_width,
  f.bbox_height,
  f.suggested_contact_id,
  c.full_name as suggested_contact_name
FROM media_faces f
JOIN memory_media mm ON mm.id = f.media_id
LEFT JOIN contacts c ON c.id = f.suggested_contact_id
WHERE f.contact_id IS NULL
  AND f.is_ignored = false
  AND NOT EXISTS (
    SELECT 1 FROM engagement_prompts ep 
    WHERE ep.photo_id = f.media_id 
    AND ep.type = 'tag_person'
    AND ep.status IN ('answered', 'pending')
    AND ep.created_at > NOW() - INTERVAL '14 days'
  )
ORDER BY mm.created_at DESC
LIMIT 30;

-- View: Contacts we can ask about (have photos together or recent interaction)
CREATE OR REPLACE VIEW contacts_for_stories AS
SELECT 
  c.id as contact_id,
  c.user_id,
  c.full_name,
  c.avatar_url,
  c.relationship_type,
  c.how_met,
  COUNT(DISTINCT mf.media_id) as shared_photos,
  MAX(m.created_at) as last_memory_together
FROM contacts c
LEFT JOIN media_faces mf ON mf.contact_id = c.id
LEFT JOIN memories m ON m.id IN (
  SELECT DISTINCT memory_id FROM memory_media mm 
  JOIN media_faces f ON f.media_id = mm.id 
  WHERE f.contact_id = c.id
)
WHERE c.full_name IS NOT NULL
  AND c.full_name != ''
  AND NOT EXISTS (
    SELECT 1 FROM engagement_prompts ep 
    WHERE ep.contact_id = c.id 
    AND ep.type = 'contact_story'
    AND ep.status IN ('answered', 'pending')
    AND ep.created_at > NOW() - INTERVAL '60 days'
  )
GROUP BY c.id, c.user_id, c.full_name, c.avatar_url, c.relationship_type, c.how_met
ORDER BY shared_photos DESC, last_memory_together DESC NULLS LAST
LIMIT 30;

-- View: Memories with positive sentiment to elaborate on
CREATE OR REPLACE VIEW memories_for_elaboration AS
SELECT 
  m.id as memory_id,
  m.user_id,
  m.title,
  COALESCE(m.ai_summary, LEFT(m.description, 100)) as snippet,
  m.memory_date,
  m.ai_sentiment,
  m.ai_category
FROM memories m
WHERE m.ai_sentiment IN ('positive', 'joyful', 'nostalgic', 'grateful', 'proud', 'loving')
  AND (m.ai_summary IS NOT NULL OR m.description IS NOT NULL)
  AND NOT EXISTS (
    SELECT 1 FROM engagement_prompts ep 
    WHERE ep.memory_id = m.id 
    AND ep.type = 'memory_elaboration'
    AND ep.status IN ('answered', 'pending')
    AND ep.created_at > NOW() - INTERVAL '90 days'
  )
ORDER BY m.created_at DESC
LIMIT 30;

-- View: Wisdom entries to elaborate on
CREATE OR REPLACE VIEW wisdom_for_elaboration AS
SELECT 
  w.id as wisdom_id,
  w.user_id,
  w.title,
  LEFT(w.content, 100) as snippet,
  w.ai_category
FROM wisdom w
WHERE w.content IS NOT NULL
  AND LENGTH(w.content) > 20
  AND NOT EXISTS (
    SELECT 1 FROM engagement_prompts ep 
    WHERE ep.metadata->>'wisdom_id' = w.id::text 
    AND ep.type = 'wisdom_elaboration'
    AND ep.status IN ('answered', 'pending')
    AND ep.created_at > NOW() - INTERVAL '90 days'
  )
ORDER BY w.created_at DESC
LIMIT 20;

-- ============================================
-- STEP 7: Comprehensive prompt generation function
-- ============================================
CREATE OR REPLACE FUNCTION generate_engagement_prompts(
  p_user_id UUID,
  p_count INTEGER DEFAULT 20
)
RETURNS INTEGER AS $$
DECLARE
  v_profile profiles%ROWTYPE;
  v_prompt_count INTEGER := 0;
  v_template RECORD;
  v_photo RECORD;
  v_contact RECORD;
  v_memory RECORD;
  v_wisdom RECORD;
  v_face RECORD;
  v_prompt_text TEXT;
  v_skill TEXT;
  v_interest TEXT;
  v_hobby TEXT;
BEGIN
  -- Get user profile
  SELECT * INTO v_profile FROM profiles WHERE id = p_user_id;
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- ============================================
  -- 1. PHOTO TASKS (20% - most engaging visually)
  -- ============================================
  
  -- Photo backstory prompts
  FOR v_photo IN 
    SELECT * FROM photos_needing_backstory 
    WHERE user_id = p_user_id 
    LIMIT GREATEST(2, (p_count * 0.1)::INTEGER)
  LOOP
    SELECT prompt_text INTO v_prompt_text
    FROM prompt_templates 
    WHERE type = 'photo_backstory' AND is_active = TRUE
    ORDER BY RANDOM() LIMIT 1;
    
    INSERT INTO engagement_prompts (user_id, type, category, photo_id, prompt_text, priority, source)
    VALUES (p_user_id, 'photo_backstory', 'photos', v_photo.media_id, 
            COALESCE(v_prompt_text, 'What''s the story behind this photo?'),
            75, 'system')
    ON CONFLICT DO NOTHING;
    v_prompt_count := v_prompt_count + 1;
  END LOOP;
  
  -- Face tagging prompts
  FOR v_face IN 
    SELECT * FROM untagged_faces 
    WHERE user_id = p_user_id 
    LIMIT GREATEST(1, (p_count * 0.05)::INTEGER)
  LOOP
    INSERT INTO engagement_prompts (user_id, type, category, photo_id, prompt_text, priority, source, metadata)
    VALUES (p_user_id, 'tag_person', 'photos', v_face.media_id,
            'Who is this person in the photo?', 70, 'system',
            jsonb_build_object('face_id', v_face.face_id, 
              'suggested_contact_id', v_face.suggested_contact_id,
              'suggested_contact_name', v_face.suggested_contact_name))
    ON CONFLICT DO NOTHING;
    v_prompt_count := v_prompt_count + 1;
  END LOOP;
  
  -- ============================================
  -- 2. CONTACT STORY PROMPTS (15% - relationship focused)
  -- ============================================
  FOR v_contact IN 
    SELECT * FROM contacts_for_stories 
    WHERE user_id = p_user_id 
    LIMIT GREATEST(2, (p_count * 0.15)::INTEGER)
  LOOP
    SELECT prompt_text INTO v_prompt_text
    FROM prompt_templates 
    WHERE type = 'contact_story' AND is_active = TRUE
    ORDER BY RANDOM() LIMIT 1;
    
    v_prompt_text := REPLACE(COALESCE(v_prompt_text, 'What''s your happiest memory with {{contact_name}}?'), 
                             '{{contact_name}}', v_contact.full_name);
    
    INSERT INTO engagement_prompts (user_id, type, category, contact_id, prompt_text, priority, source, 
      metadata, personalization_context)
    VALUES (p_user_id, 'contact_story', 'relationships', v_contact.contact_id, v_prompt_text, 68, 'profile_based',
      jsonb_build_object('contact_name', v_contact.full_name, 'contact_photo', v_contact.avatar_url),
      jsonb_build_object('contact_id', v_contact.contact_id, 'relationship', v_contact.relationship_type))
    ON CONFLICT DO NOTHING;
    v_prompt_count := v_prompt_count + 1;
  END LOOP;
  
  -- ============================================
  -- 3. MEMORY ELABORATION PROMPTS (10% - building on existing memories)
  -- ============================================
  FOR v_memory IN 
    SELECT * FROM memories_for_elaboration 
    WHERE user_id = p_user_id 
    LIMIT GREATEST(1, (p_count * 0.1)::INTEGER)
  LOOP
    SELECT prompt_text INTO v_prompt_text
    FROM prompt_templates 
    WHERE type = 'memory_elaboration' AND is_active = TRUE
    ORDER BY RANDOM() LIMIT 1;
    
    v_prompt_text := REPLACE(COALESCE(v_prompt_text, 'Tell me more about {{memory_snippet}}'), 
                             '{{memory_snippet}}', COALESCE(v_memory.title, v_memory.snippet));
    
    INSERT INTO engagement_prompts (user_id, type, category, memory_id, prompt_text, priority, source,
      personalization_context)
    VALUES (p_user_id, 'memory_elaboration', 'memories', v_memory.memory_id, v_prompt_text, 65, 'profile_based',
      jsonb_build_object('memory_title', v_memory.title, 'memory_date', v_memory.memory_date))
    ON CONFLICT DO NOTHING;
    v_prompt_count := v_prompt_count + 1;
  END LOOP;
  
  -- ============================================
  -- 4. WISDOM ELABORATION PROMPTS (5%)
  -- ============================================
  FOR v_wisdom IN 
    SELECT * FROM wisdom_for_elaboration 
    WHERE user_id = p_user_id 
    LIMIT GREATEST(1, (p_count * 0.05)::INTEGER)
  LOOP
    SELECT prompt_text INTO v_prompt_text
    FROM prompt_templates 
    WHERE type = 'wisdom_elaboration' AND is_active = TRUE
    ORDER BY RANDOM() LIMIT 1;
    
    v_prompt_text := REPLACE(COALESCE(v_prompt_text, 'What experience taught you {{wisdom_snippet}}?'), 
                             '{{wisdom_snippet}}', v_wisdom.snippet);
    
    INSERT INTO engagement_prompts (user_id, type, category, prompt_text, priority, source,
      metadata)
    VALUES (p_user_id, 'wisdom_elaboration', 'wisdom', v_prompt_text, 62, 'profile_based',
      jsonb_build_object('wisdom_id', v_wisdom.wisdom_id, 'wisdom_title', v_wisdom.title))
    ON CONFLICT DO NOTHING;
    v_prompt_count := v_prompt_count + 1;
  END LOOP;
  
  -- ============================================
  -- 5. SKILL-BASED PROMPTS (10%)
  -- ============================================
  IF v_profile.skills IS NOT NULL AND array_length(v_profile.skills, 1) > 0 THEN
    FOREACH v_skill IN ARRAY v_profile.skills
    LOOP
      FOR v_template IN 
        SELECT * FROM prompt_templates 
        WHERE is_active = TRUE 
          AND (prompt_text LIKE '%{{skill}}%' OR LOWER(target_skill) = LOWER(v_skill))
        ORDER BY RANDOM()
        LIMIT 1
      LOOP
        v_prompt_text := REPLACE(COALESCE(v_template.prompt_text, ''), '{{skill}}', v_skill);
        
        INSERT INTO engagement_prompts (user_id, type, category, prompt_text, priority, source, personalization_context)
        VALUES (p_user_id, v_template.type, COALESCE(v_template.category, 'skills'), v_prompt_text, 
                60 + COALESCE(v_template.priority_boost, 0), 'profile_based',
                jsonb_build_object('skill', v_skill))
        ON CONFLICT DO NOTHING;
        v_prompt_count := v_prompt_count + 1;
        EXIT WHEN v_prompt_count >= p_count * 0.4;
      END LOOP;
      EXIT WHEN v_prompt_count >= p_count * 0.4;
    END LOOP;
  END IF;
  
  -- ============================================
  -- 6. INTEREST-BASED PROMPTS (15%)
  -- ============================================
  IF v_profile.interests IS NOT NULL AND array_length(v_profile.interests, 1) > 0 THEN
    FOREACH v_interest IN ARRAY v_profile.interests
    LOOP
      FOR v_template IN 
        SELECT * FROM prompt_templates 
        WHERE is_active = TRUE 
          AND (prompt_text LIKE '%{{interest}}%' OR LOWER(target_interest) = LOWER(v_interest))
        ORDER BY RANDOM()
        LIMIT 1
      LOOP
        v_prompt_text := REPLACE(COALESCE(v_template.prompt_text, ''), '{{interest}}', v_interest);
        
        INSERT INTO engagement_prompts (user_id, type, category, prompt_text, priority, source, personalization_context)
        VALUES (p_user_id, v_template.type, COALESCE(v_template.category, 'interests'), v_prompt_text,
                58 + COALESCE(v_template.priority_boost, 0), 'profile_based',
                jsonb_build_object('interest', v_interest))
        ON CONFLICT DO NOTHING;
        v_prompt_count := v_prompt_count + 1;
        EXIT WHEN v_prompt_count >= p_count * 0.55;
      END LOOP;
      EXIT WHEN v_prompt_count >= p_count * 0.55;
    END LOOP;
  END IF;
  
  -- ============================================
  -- 7. HOBBY-BASED PROMPTS (10%)
  -- ============================================
  IF v_profile.hobbies IS NOT NULL AND array_length(v_profile.hobbies, 1) > 0 THEN
    FOREACH v_hobby IN ARRAY v_profile.hobbies
    LOOP
      FOR v_template IN 
        SELECT * FROM prompt_templates 
        WHERE is_active = TRUE 
          AND (prompt_text LIKE '%{{hobby}}%' OR LOWER(target_hobby) = LOWER(v_hobby))
        ORDER BY RANDOM()
        LIMIT 1
      LOOP
        v_prompt_text := REPLACE(COALESCE(v_template.prompt_text, ''), '{{hobby}}', v_hobby);
        
        INSERT INTO engagement_prompts (user_id, type, category, prompt_text, priority, source, personalization_context)
        VALUES (p_user_id, v_template.type, COALESCE(v_template.category, 'hobbies'), v_prompt_text,
                56 + COALESCE(v_template.priority_boost, 0), 'profile_based',
                jsonb_build_object('hobby', v_hobby))
        ON CONFLICT DO NOTHING;
        v_prompt_count := v_prompt_count + 1;
        EXIT WHEN v_prompt_count >= p_count * 0.65;
      END LOOP;
      EXIT WHEN v_prompt_count >= p_count * 0.65;
    END LOOP;
  END IF;
  
  -- ============================================
  -- 8. POSITIVE REFLECTION PROMPTS (fill remaining)
  -- ============================================
  FOR v_template IN 
    SELECT * FROM prompt_templates 
    WHERE is_active = TRUE 
      AND type IN ('knowledge', 'memory_prompt')
      AND category IN ('self', 'relationships', 'experiences', 'wisdom', 'childhood', 'legacy', 'career')
      AND target_skill IS NULL 
      AND target_interest IS NULL
      AND target_hobby IS NULL
      AND prompt_text NOT LIKE '%{{%'
      -- Ensure positive focus
      AND prompt_text NOT ILIKE '%hardest%'
      AND prompt_text NOT ILIKE '%difficult%'
      AND prompt_text NOT ILIKE '%fear%'
      AND prompt_text NOT ILIKE '%regret%'
    ORDER BY priority_boost DESC, RANDOM()
    LIMIT GREATEST(0, p_count - v_prompt_count)
  LOOP
    INSERT INTO engagement_prompts (user_id, type, category, prompt_text, priority, source)
    VALUES (p_user_id, v_template.type, v_template.category, v_template.prompt_text,
            50 + COALESCE(v_template.priority_boost, 0), 'system')
    ON CONFLICT DO NOTHING;
    v_prompt_count := v_prompt_count + 1;
  END LOOP;
  
  RETURN v_prompt_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 8: Update shuffle to prioritize visual prompts
-- ============================================
CREATE OR REPLACE FUNCTION shuffle_engagement_prompts(
  p_user_id UUID,
  p_count INTEGER DEFAULT 5,
  p_regenerate BOOLEAN DEFAULT FALSE
)
RETURNS SETOF engagement_prompts AS $$
DECLARE
  v_pending_count INTEGER;
  v_recently_shown TEXT[];
BEGIN
  -- Get prompts shown in last 24 hours to avoid repetition
  SELECT ARRAY_AGG(prompt_text) INTO v_recently_shown
  FROM engagement_prompts
  WHERE user_id = p_user_id
    AND shown_at > NOW() - INTERVAL '24 hours';
  
  -- Check how many pending prompts exist
  SELECT COUNT(*) INTO v_pending_count
  FROM engagement_prompts
  WHERE user_id = p_user_id
    AND status = 'pending'
    AND (cooldown_until IS NULL OR cooldown_until < NOW())
    AND (v_recently_shown IS NULL OR prompt_text != ALL(v_recently_shown));
  
  -- Generate more if needed
  IF v_pending_count < p_count * 2 OR p_regenerate THEN
    PERFORM generate_engagement_prompts(p_user_id, 30);
  END IF;
  
  -- Return shuffled prompts with type diversity
  RETURN QUERY
  WITH 
  available AS (
    SELECT ep.*
    FROM engagement_prompts ep
    WHERE ep.user_id = p_user_id
      AND ep.status = 'pending'
      AND (ep.cooldown_until IS NULL OR ep.cooldown_until < NOW())
      AND (v_recently_shown IS NULL OR ep.prompt_text != ALL(v_recently_shown))
  ),
  ranked AS (
    SELECT 
      a.*,
      ROW_NUMBER() OVER (PARTITION BY a.type ORDER BY a.priority DESC, RANDOM()) AS type_rank
    FROM available a
  )
  SELECT r.id, r.user_id, r.type, r.category, r.prompt_text, r.prompt_template_id,
         r.photo_id, r.contact_id, r.memory_id, r.compare_photo_id, r.compare_contact_id,
         r.compare_memory_id, r.missing_field, r.status, r.priority, r.created_at,
         r.shown_at, r.answered_at, r.skipped_at, r.expires_at, r.cooldown_until,
         r.response_type, r.response_text, r.response_audio_url, r.response_data,
         r.result_memory_id, r.result_knowledge_id, r.source, r.personalization_context,
         r.metadata, r.updated_at
  FROM ranked r
  WHERE r.type_rank <= 2  -- Max 2 of same type for variety
  ORDER BY 
    -- Prioritize visual/interactive prompts
    CASE 
      WHEN r.type IN ('photo_backstory', 'tag_person') THEN 0  -- Photos first
      WHEN r.type = 'contact_story' THEN 1  -- Then contact stories
      WHEN r.type IN ('memory_elaboration', 'wisdom_elaboration') THEN 2  -- Then follow-ups
      ELSE 3 
    END,
    r.priority DESC,
    RANDOM()
  LIMIT p_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 9: Clear old prompts for fresh generation
-- ============================================
DELETE FROM engagement_prompts WHERE status = 'pending';

COMMENT ON FUNCTION generate_engagement_prompts IS 'Generates diverse prompts including photos, contacts, memories, wisdom, and profile-based questions. Focuses on positive/happy topics.';
