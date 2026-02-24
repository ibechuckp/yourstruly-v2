-- System Settings Table for storing admin configuration
-- Includes AI config, feature flags, and other global settings

CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);

-- RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can read/write system settings
DROP POLICY IF EXISTS "Admins can manage system settings" ON system_settings;
CREATE POLICY "Admins can manage system settings" ON system_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = true
    )
  );

-- Seed default AI settings
INSERT INTO system_settings (key, value, category, description) VALUES
  ('chat_model', 'claude-sonnet-4-20250514', 'ai', 'Primary chat model'),
  ('embedding_model', 'gemini-embedding-001', 'ai', 'Embedding model for semantic search'),
  ('embedding_provider', 'gemini', 'ai', 'Provider for embeddings'),
  ('chat_provider', 'claude', 'ai', 'Provider for chat'),
  ('embedding_dimensions', '768', 'ai', 'Vector dimensions for embeddings'),
  ('system_prompt', 'You are a warm, thoughtful AI companion for YoursTruly - a digital legacy platform where people document their lives, memories, and relationships.', 'ai', 'Main chat system prompt'),
  ('interview_prompt', 'You are conducting a warm, thoughtful interview to capture someone''s life stories and memories for the YoursTruly platform.', 'ai', 'Interview mode system prompt'),
  ('voice_model', 'eleven_multilingual_v2', 'ai', 'Voice synthesis model'),
  ('voice_stability', '75', 'ai', 'Voice clone stability (0-100)')
ON CONFLICT (key) DO NOTHING;

COMMENT ON TABLE system_settings IS 'Global system configuration including AI settings';
