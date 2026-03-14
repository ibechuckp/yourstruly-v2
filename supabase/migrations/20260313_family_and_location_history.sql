-- ============================================================================
-- Add family information and location history tracking
-- Created: 2026-03-13
-- Purpose: Capture complete family background and places lived for better prompts
-- ============================================================================

-- Add family fields to profiles
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS relationship_status TEXT, -- single, married, divorced, widowed, partnered
  ADD COLUMN IF NOT EXISTS siblings_count INTEGER,
  ADD COLUMN IF NOT EXISTS birth_order TEXT, -- oldest, middle, youngest, only_child
  ADD COLUMN IF NOT EXISTS grew_up_with TEXT[]; -- parents, grandparents, siblings, foster, etc.

COMMENT ON COLUMN profiles.relationship_status IS 'Current relationship status to avoid inappropriate prompts';
COMMENT ON COLUMN profiles.siblings_count IS 'Number of siblings user has';
COMMENT ON COLUMN profiles.birth_order IS 'Birth order among siblings';
COMMENT ON COLUMN profiles.grew_up_with IS 'Who the user grew up with (family structure)';

-- Create location_history table for places lived
CREATE TABLE IF NOT EXISTS location_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Address details
  street_address TEXT,
  city TEXT NOT NULL,
  state TEXT,
  country TEXT NOT NULL DEFAULT 'United States',
  postal_code TEXT,
  
  -- Geographic coordinates for Mapbox
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Time period
  moved_in_date DATE, -- When they moved in
  moved_out_date DATE, -- When they moved out (null if current)
  is_current_residence BOOLEAN DEFAULT FALSE,
  
  -- Context
  life_stage TEXT, -- childhood, college, early_career, family_years, retirement, etc.
  notable_memories TEXT, -- Why this place was significant
  address_type TEXT, -- house, apartment, dorm, military_base, etc.
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_location_history_user ON location_history(user_id);
CREATE INDEX IF NOT EXISTS idx_location_history_dates ON location_history(user_id, moved_in_date, moved_out_date);
CREATE INDEX IF NOT EXISTS idx_location_history_current ON location_history(user_id, is_current_residence) WHERE is_current_residence = TRUE;

COMMENT ON TABLE location_history IS 'Complete history of places user has lived';
COMMENT ON COLUMN location_history.latitude IS 'For Mapbox animation of life journey';
COMMENT ON COLUMN location_history.longitude IS 'For Mapbox animation of life journey';
COMMENT ON COLUMN location_history.life_stage IS 'What period of life this residence represents';

-- RLS for location_history
ALTER TABLE location_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own location history"
  ON location_history
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_location_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER location_history_updated_at
  BEFORE UPDATE ON location_history
  FOR EACH ROW
  EXECUTE FUNCTION update_location_history_updated_at();
