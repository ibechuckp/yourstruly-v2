-- ============================================================================
-- Update prompt generation to respect conditional_query
-- Created: 2026-03-13
-- Purpose: Don't show prompts that assume things (like marriage) when we don't have that data
-- ============================================================================

CREATE OR REPLACE FUNCTION check_prompt_condition(
  p_user_id UUID,
  p_conditional_query TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_result BOOLEAN;
BEGIN
  -- If no condition, always show prompt
  IF p_conditional_query IS NULL OR p_conditional_query = '' THEN
    RETURN TRUE;
  END IF;
  
  -- Execute the conditional query with user_id as parameter
  EXECUTE p_conditional_query INTO v_result USING p_user_id;
  
  RETURN COALESCE(v_result, FALSE);
EXCEPTION
  WHEN OTHERS THEN
    -- If query fails, don't show the prompt (fail safe)
    RAISE WARNING 'Conditional query failed for user %: %', p_user_id, SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_prompt_condition IS 'Evaluates conditional query to determine if prompt should be shown to user';

-- Update generate_engagement_prompts to use conditional check
CREATE OR REPLACE FUNCTION generate_engagement_prompts(
  p_user_id UUID,
  p_count INTEGER DEFAULT 20
)
RETURNS INTEGER AS $$
DECLARE
  v_profile profiles%ROWTYPE;
  v_prompt_count INTEGER := 0;
  v_template prompt_templates%ROWTYPE;
  v_photo RECORD;
  v_contact RECORD;
  v_face RECORD;
  v_current_month INTEGER;
  v_condition_met BOOLEAN;
BEGIN
  -- Get user profile
  SELECT * INTO v_profile FROM profiles WHERE id = p_user_id;
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  v_current_month := EXTRACT(MONTH FROM NOW())::INTEGER;
  
  -- 1. Generate photo backstory prompts (20%)
  FOR v_photo IN 
    SELECT * FROM photos_needing_backstory 
    WHERE user_id = p_user_id 
    LIMIT (p_count * 0.2)::INTEGER
  LOOP
    INSERT INTO engagement_prompts (user_id, type, photo_id, prompt_text, priority, source)
    VALUES (
      p_user_id, 
      'photo_backstory', 
      v_photo.media_id,
      'What''s the story behind this photo?',
      60 + (EXTRACT(EPOCH FROM (NOW() - v_photo.created_at)) / 86400)::INTEGER,
      'system'
    )
    ON CONFLICT DO NOTHING;
    v_prompt_count := v_prompt_count + 1;
  END LOOP;
  
  -- 2. Generate tag person prompts (15%)
  FOR v_face IN 
    SELECT * FROM untagged_faces 
    WHERE user_id = p_user_id 
    LIMIT (p_count * 0.15)::INTEGER
  LOOP
    INSERT INTO engagement_prompts (user_id, type, photo_id, prompt_text, priority, source, metadata)
    VALUES (
      p_user_id,
      'tag_person',
      v_face.media_id,
      'Who is this person?',
      70,
      'system',
      jsonb_build_object(
        'face_id', v_face.face_id,
        'bbox', jsonb_build_object('x', v_face.bbox_x, 'y', v_face.bbox_y, 'w', v_face.bbox_width, 'h', v_face.bbox_height),
        'suggested_contact_id', v_face.suggested_contact_id,
        'suggested_contact_name', v_face.suggested_contact_name
      )
    )
    ON CONFLICT DO NOTHING;
    v_prompt_count := v_prompt_count + 1;
  END LOOP;
  
  -- 3. Generate missing info prompts (10%)
  FOR v_contact IN 
    SELECT * FROM contacts_missing_info 
    WHERE user_id = p_user_id 
    LIMIT (p_count * 0.1)::INTEGER
  LOOP
    SELECT * INTO v_template 
    FROM prompt_templates 
    WHERE type = 'missing_info' 
      AND target_field = v_contact.missing_field
      AND is_active = TRUE
    LIMIT 1;
    
    IF FOUND THEN
      -- Check conditional query
      v_condition_met := check_prompt_condition(p_user_id, v_template.conditional_query);
      
      IF v_condition_met THEN
        INSERT INTO engagement_prompts (user_id, type, contact_id, prompt_text, priority, source, missing_field)
        VALUES (
          p_user_id,
          'missing_info',
          v_contact.contact_id,
          REPLACE(v_template.prompt_text, '{{contact_name}}', v_contact.name),
          v_contact.priority,
          'system',
          v_contact.missing_field
        )
        ON CONFLICT DO NOTHING;
        v_prompt_count := v_prompt_count + 1;
      END IF;
    END IF;
  END LOOP;
  
  -- 4. Generate prompts from templates (remaining 55%)
  -- Prioritize: religion-based > interest-based > general memory prompts > knowledge
  
  -- Religion-based (if profile has religion set)
  IF v_profile.religion IS NOT NULL THEN
    FOR v_template IN 
      SELECT * FROM prompt_templates 
      WHERE is_active = TRUE
        AND target_religion = v_profile.religion
      ORDER BY priority_boost DESC, RANDOM()
      LIMIT (p_count * 0.15)::INTEGER
    LOOP
      -- Check conditional query
      v_condition_met := check_prompt_condition(p_user_id, v_template.conditional_query);
      
      IF v_condition_met THEN
        -- Check if we already have a similar prompt pending
        IF NOT EXISTS (
          SELECT 1 FROM engagement_prompts
          WHERE user_id = p_user_id
            AND prompt_template_id = v_template.id
            AND status = 'pending'
        ) THEN
          INSERT INTO engagement_prompts (
            user_id, type, category, prompt_text, prompt_template_id, 
            priority, source
          )
          VALUES (
            p_user_id,
            v_template.type,
            v_template.category,
            v_template.prompt_text,
            v_template.id,
            50 + v_template.priority_boost,
            'template'
          )
          ON CONFLICT DO NOTHING;
          v_prompt_count := v_prompt_count + 1;
        END IF;
      END IF;
    END LOOP;
  END IF;
  
  -- Interest-based prompts
  FOR v_template IN 
    SELECT * FROM prompt_templates 
    WHERE is_active = TRUE
      AND target_interest IS NOT NULL
      AND target_interest = ANY(v_profile.interests)
    ORDER BY priority_boost DESC, RANDOM()
    LIMIT (p_count * 0.1)::INTEGER
  LOOP
    v_condition_met := check_prompt_condition(p_user_id, v_template.conditional_query);
    
    IF v_condition_met THEN
      IF NOT EXISTS (
        SELECT 1 FROM engagement_prompts
        WHERE user_id = p_user_id
          AND prompt_template_id = v_template.id
          AND status = 'pending'
      ) THEN
        INSERT INTO engagement_prompts (
          user_id, type, category, prompt_text, prompt_template_id,
          priority, source
        )
        VALUES (
          p_user_id,
          v_template.type,
          v_template.category,
          v_template.prompt_text,
          v_template.id,
          45 + v_template.priority_boost,
          'template'
        )
        ON CONFLICT DO NOTHING;
        v_prompt_count := v_prompt_count + 1;
      END IF;
    END IF;
  END LOOP;
  
  -- General prompts (memory_prompt, knowledge, etc.)
  FOR v_template IN 
    SELECT * FROM prompt_templates 
    WHERE is_active = TRUE
      AND target_religion IS NULL
      AND target_interest IS NULL
      AND type IN ('memory_prompt', 'favorites_firsts', 'knowledge')
    ORDER BY priority_boost DESC, RANDOM()
    LIMIT (p_count * 0.3)::INTEGER
  LOOP
    v_condition_met := check_prompt_condition(p_user_id, v_template.conditional_query);
    
    IF v_condition_met THEN
      IF NOT EXISTS (
        SELECT 1 FROM engagement_prompts
        WHERE user_id = p_user_id
          AND prompt_template_id = v_template.id
          AND status = 'pending'
      ) THEN
        INSERT INTO engagement_prompts (
          user_id, type, category, prompt_text, prompt_template_id,
          priority, source
        )
        VALUES (
          p_user_id,
          v_template.type,
          v_template.category,
          v_template.prompt_text,
          v_template.id,
          40 + v_template.priority_boost,
          'template'
        )
        ON CONFLICT DO NOTHING;
        v_prompt_count := v_prompt_count + 1;
      END IF;
    END IF;
  END LOOP;
  
  RETURN v_prompt_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_engagement_prompts IS 'Generate diverse engagement prompts with conditional logic to avoid assuming user relationships/status';
