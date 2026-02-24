-- Migration: Admin Portal Foundation
-- Description: Creates admin_users, audit_logs, and feature_flags tables
-- Date: 2026-02-24

-- Create admin role enum
CREATE TYPE admin_role AS ENUM ('super_admin', 'admin', 'support', 'billing', 'content_moderator', 'readonly');

-- Admin Users Table
CREATE TABLE admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role admin_role NOT NULL DEFAULT 'support',
  permissions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on admin_users
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Admin users can read their own record
CREATE POLICY "Admin users can read own record" ON admin_users
  FOR SELECT USING (auth.uid() = id);

-- Super admins can read all admin records
CREATE POLICY "Super admins can manage all admin records" ON admin_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Audit Logs Table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  admin_email TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
CREATE POLICY "Admins can read audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = true
    )
  );

-- Only super admins can delete audit logs (for GDPR compliance)
CREATE POLICY "Super admins can delete audit logs" ON audit_logs
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Feature Flags Table
CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT false,
  targeting_type TEXT DEFAULT 'global',
  targeting_config JSONB DEFAULT '{}',
  rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES admin_users(id) ON DELETE SET NULL
);

-- Enable RLS on feature_flags
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- Admins can read feature flags
CREATE POLICY "Admins can read feature flags" ON feature_flags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = true
    )
  );

-- Admins can manage feature flags
CREATE POLICY "Admins can manage feature flags" ON feature_flags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = true
    )
  );

-- System Settings Table
CREATE TABLE system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES admin_users(id) ON DELETE SET NULL
);

-- Enable RLS on system_settings
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Admins can read system settings
CREATE POLICY "Admins can read system settings" ON system_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = true
    )
  );

-- Admins can manage system settings
CREATE POLICY "Admins can manage system settings" ON system_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = true
    )
  );

-- Create indexes for performance
CREATE INDEX idx_audit_logs_admin_id ON audit_logs(admin_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_feature_flags_key ON feature_flags(key);
CREATE INDEX idx_feature_flags_enabled ON feature_flags(enabled);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feature_flags_updated_at BEFORE UPDATE ON feature_flags
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
  p_admin_id UUID,
  p_admin_email TEXT,
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_old_values JSONB,
  p_new_values JSONB,
  p_ip_address INET,
  p_user_agent TEXT
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO audit_logs (
    admin_id,
    admin_email,
    action,
    entity_type,
    entity_id,
    old_values,
    new_values,
    ip_address,
    user_agent
  ) VALUES (
    p_admin_id,
    p_admin_email,
    p_action,
    p_entity_type,
    p_entity_id,
    p_old_values,
    p_new_values,
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default feature flags
INSERT INTO feature_flags (key, name, description, enabled, targeting_type) VALUES
  ('new_dashboard', 'New Dashboard Design', 'Enable the redesigned dashboard experience', false, 'global'),
  ('ai_chat_v2', 'AI Chat V2', 'Enable the improved AI chat interface', false, 'global'),
  ('marketplace_beta', 'Marketplace Beta', 'Enable marketplace for beta users', false, 'rollout'),
  ('advanced_analytics', 'Advanced Analytics', 'Enable advanced analytics features', false, 'global'),
  ('voice_mode', 'Voice Mode', 'Enable voice interaction mode', false, 'global');

-- Insert default system settings
INSERT INTO system_settings (key, value, description, category) VALUES
  ('maintenance_mode', '{"enabled": false, "message": "We''re performing maintenance. Please check back soon."}', 'Maintenance mode configuration', 'system'),
  ('user_registration', '{"enabled": true, "require_email_verification": true}', 'User registration settings', 'auth'),
  ('session_timeout', '{"minutes": 60}', 'Session timeout in minutes', 'security'),
  ('max_upload_size', '{"bytes": 10485760}', 'Maximum file upload size in bytes (10MB)', 'storage');

-- Create view for admin users with email from auth.users
CREATE VIEW admin_users_with_email AS
SELECT 
  au.id,
  au.role,
  au.permissions,
  au.is_active,
  au.last_login_at,
  au.created_at,
  au.updated_at,
  u.email,
  u.raw_user_meta_data->>'full_name' as full_name
FROM admin_users au
LEFT JOIN auth.users u ON au.id = u.id;

-- Enable realtime for audit_logs
ALTER PUBLICATION supabase_realtime ADD TABLE audit_logs;
