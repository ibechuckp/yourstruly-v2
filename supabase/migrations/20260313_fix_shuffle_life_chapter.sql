-- Fix shuffle_engagement_prompts to include life_chapter field
-- Bug: life_chapter was added but not included in the RPC SELECT

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
  
  -- Return a diverse set with GUARANTEED photo slot if available
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
  -- 1. Pick the best photo prompt (guaranteed slot)
  photo_pick AS (
    SELECT a.*, 1 AS slot_group
    FROM available a
    WHERE a.photo_id IS NOT NULL
      AND a.type IN ('photo_backstory'::prompt_type, 'tag_person'::prompt_type)
    ORDER BY a.priority DESC, RANDOM()
    LIMIT 1
  ),
  -- 2. Pick a contact prompt (missing info or story)
  contact_pick AS (
    SELECT a.*, 2 AS slot_group
    FROM available a
    WHERE a.contact_id IS NOT NULL
      AND a.id NOT IN (SELECT id FROM photo_pick)
    ORDER BY a.priority DESC, RANDOM()
    LIMIT 1
  ),
  -- 3. Fill remaining with diverse prompts (no more than 1 per category)
  remaining AS (
    SELECT a.*, 3 AS slot_group,
      ROW_NUMBER() OVER (PARTITION BY a.category ORDER BY a.priority DESC, RANDOM()) AS cat_rank
    FROM available a
    WHERE a.id NOT IN (SELECT id FROM photo_pick)
      AND a.id NOT IN (SELECT id FROM contact_pick)
  ),
  fill_picks AS (
    SELECT * FROM remaining
    WHERE cat_rank = 1  -- Max 1 per category for variety
    ORDER BY 
      CASE WHEN source = 'profile_based' THEN 0 ELSE 1 END,  -- Prefer personalized
      priority DESC,
      RANDOM()
    LIMIT GREATEST(0, p_count - (SELECT COUNT(*) FROM photo_pick) - (SELECT COUNT(*) FROM contact_pick))
  ),
  -- Combine all picks (NOW INCLUDING life_chapter)
  combined AS (
    SELECT id, user_id, type, category, life_chapter, prompt_text, prompt_template_id,
           photo_id, contact_id, memory_id, compare_photo_id, compare_contact_id,
           compare_memory_id, missing_field, status, priority, created_at,
           shown_at, answered_at, skipped_at, expires_at, cooldown_until,
           response_type, response_text, response_audio_url, response_data,
           result_memory_id, result_knowledge_id, source, personalization_context,
           metadata, updated_at, slot_group
    FROM photo_pick
    UNION ALL
    SELECT id, user_id, type, category, life_chapter, prompt_text, prompt_template_id,
           photo_id, contact_id, memory_id, compare_photo_id, compare_contact_id,
           compare_memory_id, missing_field, status, priority, created_at,
           shown_at, answered_at, skipped_at, expires_at, cooldown_until,
           response_type, response_text, response_audio_url, response_data,
           result_memory_id, result_knowledge_id, source, personalization_context,
           metadata, updated_at, slot_group
    FROM contact_pick
    UNION ALL
    SELECT id, user_id, type, category, life_chapter, prompt_text, prompt_template_id,
           photo_id, contact_id, memory_id, compare_photo_id, compare_contact_id,
           compare_memory_id, missing_field, status, priority, created_at,
           shown_at, answered_at, skipped_at, expires_at, cooldown_until,
           response_type, response_text, response_audio_url, response_data,
           result_memory_id, result_knowledge_id, source, personalization_context,
           metadata, updated_at, slot_group
    FROM fill_picks
  )
  -- Final SELECT now includes life_chapter
  SELECT id, user_id, type, category, life_chapter, prompt_text, prompt_template_id,
         photo_id, contact_id, memory_id, compare_photo_id, compare_contact_id,
         compare_memory_id, missing_field, status, priority, created_at,
         shown_at, answered_at, skipped_at, expires_at, cooldown_until,
         response_type, response_text, response_audio_url, response_data,
         result_memory_id, result_knowledge_id, source, personalization_context,
         metadata, updated_at
  FROM combined
  ORDER BY slot_group, priority DESC;

  -- Mark as shown
  UPDATE engagement_prompts
  SET shown_at = NOW()
  WHERE id IN (SELECT id FROM combined);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION shuffle_engagement_prompts IS 'Get diverse prompts with life_chapter field included';
