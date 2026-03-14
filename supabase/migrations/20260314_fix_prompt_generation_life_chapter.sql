-- ============================================================================
-- Fix: Assign life_chapter when generating prompts from templates
-- Problem: generate_engagement_prompts doesn't set life_chapter field
-- Solution: Add helper function to map category → life_chapter, use in INSERT
-- ============================================================================

-- Helper function to map template category to life_chapter
CREATE OR REPLACE FUNCTION map_category_to_life_chapter(p_category TEXT, p_type TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE 
    -- Childhood
    WHEN p_category IN ('childhood', 'early_life') THEN 'childhood'
    WHEN p_category LIKE '%child%' THEN 'childhood'
    
    -- Teenage
    WHEN p_category IN ('teenage') THEN 'teenage'
    WHEN p_category LIKE '%teen%' THEN 'teenage'
    
    -- High School
    WHEN p_category IN ('high_school', 'school') THEN 'high_school'
    
    -- College
    WHEN p_category IN ('college', 'university', 'education') THEN 'college'
    
    -- Career
    WHEN p_category IN ('career', 'jobs_career', 'work') THEN 'jobs_career'
    
    -- Relationships
    WHEN p_category IN ('relationships', 'marriage', 'family', 'parenting') THEN 'relationships'
    
    -- Travel
    WHEN p_category IN ('travel', 'places_lived', 'location') THEN 'travel'
    
    -- Spirituality
    WHEN p_category IN ('spirituality', 'faith', 'religion') THEN 'spirituality'
    
    -- Wisdom & Legacy
    WHEN p_category IN ('wisdom_legacy', 'wisdom', 'legacy', 'life_lessons', 'values') THEN 'wisdom_legacy'
    WHEN p_type = 'knowledge' THEN 'wisdom_legacy'
    
    -- Life Moments (catch-all for significant events)
    WHEN p_category IN ('life_moments', 'milestones', 'celebration', 'memories', 'firsts') THEN 'life_moments'
    
    -- Interests/hobbies go to life_moments
    WHEN p_category IN ('interests', 'hobbies', 'skills', 'languages') THEN 'life_moments'
    
    -- Default
    ELSE 'life_moments'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update existing prompts to have correct life_chapter
UPDATE engagement_prompts ep
SET life_chapter = map_category_to_life_chapter(
  COALESCE(pt.category, ep.category),
  ep.type::TEXT
)
FROM prompt_templates pt
WHERE ep.prompt_template_id = pt.id
  AND ep.life_chapter IS NULL;

-- Also update prompts without template_id (system-generated)
UPDATE engagement_prompts
SET life_chapter = map_category_to_life_chapter(category, type::TEXT)
WHERE life_chapter IS NULL
  AND category IS NOT NULL;

-- Set default for any remaining
UPDATE engagement_prompts
SET life_chapter = 'life_moments'
WHERE life_chapter IS NULL;

-- Verify
SELECT 
  life_chapter, 
  COUNT(*) as count
FROM engagement_prompts
WHERE status = 'pending'
GROUP BY life_chapter
ORDER BY count DESC;
