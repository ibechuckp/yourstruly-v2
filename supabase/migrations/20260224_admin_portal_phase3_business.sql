-- Migration: Admin Portal Phase 3 - Business Features
-- Description: Adds billing, marketplace admin, and AI config tables
-- Date: 2026-02-24

-- ============================================================================
-- BILLING & SUBSCRIPTIONS
-- ============================================================================

-- Billing Plans Table
CREATE TABLE billing_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'USD',
  interval TEXT NOT NULL CHECK (interval IN ('month', 'year', 'lifetime')),
  stripe_price_id TEXT,
  stripe_product_id TEXT,
  features JSONB DEFAULT '[]',
  limits JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on billing_plans
ALTER TABLE billing_plans ENABLE ROW LEVEL SECURITY;

-- Everyone can read active plans
CREATE POLICY "Anyone can read active billing plans" ON billing_plans
  FOR SELECT USING (is_active = true);

-- Admins can manage all plans
CREATE POLICY "Admins can manage billing plans" ON billing_plans
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = true
    )
  );

-- Coupons/Promo Codes Table
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value INTEGER NOT NULL,
  currency TEXT DEFAULT 'USD',
  max_redemptions INTEGER,
  redemptions_count INTEGER DEFAULT 0,
  min_purchase_cents INTEGER,
  applicable_plans UUID[] DEFAULT '{}',
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on coupons
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Everyone can read active coupons (for validation)
CREATE POLICY "Anyone can read active coupons" ON coupons
  FOR SELECT USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));

-- Admins can manage coupons
CREATE POLICY "Admins can manage coupons" ON coupons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = true
    )
  );

-- Subscriptions Table (extends existing subscriptions with more admin fields)
CREATE TABLE subscription_admin_view (
  id UUID PRIMARY KEY REFERENCES subscriptions(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_payment_method_id TEXT,
  billing_address JSONB,
  payment_status TEXT DEFAULT 'active' CHECK (payment_status IN ('active', 'past_due', 'canceled', 'unpaid', 'trialing')),
  cancel_at_period_end BOOLEAN DEFAULT false,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on subscription_admin_view
ALTER TABLE subscription_admin_view ENABLE ROW LEVEL SECURITY;

-- Admins can view all subscriptions
CREATE POLICY "Admins can view subscription details" ON subscription_admin_view
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = true
    )
  );

-- Users can view their own subscription details
CREATE POLICY "Users can view own subscription" ON subscription_admin_view
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM subscriptions s WHERE s.id = subscription_admin_view.id AND s.user_id = auth.uid()
    )
  );

-- ============================================================================
-- MARKETPLACE ADMIN
-- ============================================================================

-- Marketplace Provider Settings Table
CREATE TABLE marketplace_providers (
  id TEXT PRIMARY KEY CHECK (id IN ('prodigi', 'spocket', 'floristone')),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT false,
  api_key_encrypted TEXT,
  api_endpoint TEXT,
  webhook_url TEXT,
  webhook_secret TEXT,
  rate_limit_per_minute INTEGER DEFAULT 60,
  timeout_seconds INTEGER DEFAULT 30,
  markup_percentage DECIMAL(5,2) DEFAULT 0.00,
  settings JSONB DEFAULT '{}',
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on marketplace_providers
ALTER TABLE marketplace_providers ENABLE ROW LEVEL SECURITY;

-- Admins can manage providers
CREATE POLICY "Admins can manage marketplace providers" ON marketplace_providers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = true
    )
  );

-- Marketplace Categories Table (for admin management)
CREATE TABLE marketplace_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  provider TEXT REFERENCES marketplace_providers(id),
  parent_id TEXT REFERENCES marketplace_categories(id),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on marketplace_categories
ALTER TABLE marketplace_categories ENABLE ROW LEVEL SECURITY;

-- Everyone can read active categories
CREATE POLICY "Anyone can read active categories" ON marketplace_categories
  FOR SELECT USING (is_active = true);

-- Admins can manage categories
CREATE POLICY "Admins can manage categories" ON marketplace_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = true
    )
  );

-- Admin Product Catalog Table (curated products)
CREATE TABLE marketplace_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  provider TEXT REFERENCES marketplace_providers(id),
  category_id TEXT REFERENCES marketplace_categories(id),
  base_price_cents INTEGER NOT NULL,
  sale_price_cents INTEGER,
  cost_price_cents INTEGER,
  currency TEXT DEFAULT 'USD',
  images JSONB DEFAULT '[]',
  variants JSONB DEFAULT '[]',
  attributes JSONB DEFAULT '{}',
  in_stock BOOLEAN DEFAULT true,
  stock_quantity INTEGER,
  fulfillment_time_days INTEGER DEFAULT 3,
  shipping_weight_oz INTEGER,
  is_curated BOOLEAN DEFAULT false,
  curated_score INTEGER CHECK (curated_score >= 0 AND curated_score <= 100),
  collections TEXT[] DEFAULT '{}',
  occasions TEXT[] DEFAULT '{}',
  emotional_impact TEXT CHECK (emotional_impact IN ('high', 'medium', 'low')),
  pairing_suggestions TEXT[] DEFAULT '{}',
  why_we_love_it TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on marketplace_products
ALTER TABLE marketplace_products ENABLE ROW LEVEL SECURITY;

-- Everyone can read active products
CREATE POLICY "Anyone can read active products" ON marketplace_products
  FOR SELECT USING (is_active = true);

-- Admins can manage products
CREATE POLICY "Admins can manage products" ON marketplace_products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = true
    )
  );

-- Marketplace Orders Admin View
CREATE VIEW marketplace_orders_admin AS
SELECT 
  o.id,
  o.order_number,
  o.user_id,
  p.email as user_email,
  o.status,
  o.subtotal_cents,
  o.tax_cents,
  o.shipping_cents,
  o.discount_cents,
  o.total_cents,
  o.currency,
  o.shipping_address,
  o.is_gift,
  o.gift_message,
  o.scheduled_delivery_date,
  o.provider_order_ids,
  o.created_at,
  o.updated_at,
  jsonb_array_length(o.items) as item_count
FROM orders o
LEFT JOIN profiles p ON o.user_id = p.id;

-- ============================================================================
-- AI CONFIGURATION
-- ============================================================================

-- AI Model Configurations Table
CREATE TABLE ai_model_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  use_case TEXT NOT NULL CHECK (use_case IN ('interview', 'chat', 'rag', 'image_generation', 'voice_generation', 'embeddings')),
  provider TEXT NOT NULL CHECK (provider IN ('anthropic', 'openai', 'google', 'ollama', 'elevenlabs')),
  model TEXT NOT NULL,
  api_key_env_var TEXT,
  temperature DECIMAL(3,2) DEFAULT 0.70 CHECK (temperature >= 0.00 AND temperature <= 2.00),
  max_tokens INTEGER DEFAULT 2000,
  top_p DECIMAL(3,2) DEFAULT 1.00,
  frequency_penalty DECIMAL(3,2) DEFAULT 0.00,
  presence_penalty DECIMAL(3,2) DEFAULT 0.00,
  timeout_ms INTEGER DEFAULT 30000,
  retry_attempts INTEGER DEFAULT 3,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on ai_model_configs
ALTER TABLE ai_model_configs ENABLE ROW LEVEL SECURITY;

-- Admins can manage AI configs
CREATE POLICY "Admins can manage AI configs" ON ai_model_configs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = true
    )
  );

-- System Prompts Table
CREATE TABLE system_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  use_case TEXT NOT NULL CHECK (use_case IN ('interview', 'chat', 'rag', 'memory_creation', 'wisdom_extraction', 'postscript_generation')),
  name TEXT NOT NULL,
  description TEXT,
  prompt_text TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  parent_id UUID REFERENCES system_prompts(id),
  variables TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  created_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on system_prompts
ALTER TABLE system_prompts ENABLE ROW LEVEL SECURITY;

-- Admins can manage system prompts
CREATE POLICY "Admins can manage system prompts" ON system_prompts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = true
    )
  );

-- RAG Configuration Table
CREATE TABLE rag_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'default',
  embedding_model TEXT NOT NULL DEFAULT 'gemini-embedding-001',
  embedding_dimensions INTEGER DEFAULT 768,
  chunk_size INTEGER DEFAULT 1000,
  chunk_overlap INTEGER DEFAULT 200,
  retrieval_count INTEGER DEFAULT 5,
  similarity_threshold DECIMAL(3,2) DEFAULT 0.70,
  reranking_enabled BOOLEAN DEFAULT false,
  reranking_model TEXT,
  context_window_tokens INTEGER DEFAULT 4000,
  max_context_chunks INTEGER DEFAULT 3,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on rag_settings
ALTER TABLE rag_settings ENABLE ROW LEVEL SECURITY;

-- Admins can manage RAG settings
CREATE POLICY "Admins can manage RAG settings" ON rag_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = true
    )
  );

-- Voice Clone Configuration Table
CREATE TABLE voice_clone_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  elevenlabs_voice_id TEXT NOT NULL UNIQUE,
  description TEXT,
  gender TEXT CHECK (gender IN ('male', 'female', 'neutral')),
  age_group TEXT CHECK (age_group IN ('child', 'young', 'middle', 'senior')),
  accent TEXT,
  use_case TEXT CHECK (use_case IN ('narration', 'chat', 'interview', 'memories')),
  sample_url TEXT,
  settings JSONB DEFAULT '{"stability": 0.5, "similarity_boost": 0.75, "style": 0.0, "speaker_boost": true}',
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  created_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on voice_clone_configs
ALTER TABLE voice_clone_configs ENABLE ROW LEVEL SECURITY;

-- Admins can manage voice configs
CREATE POLICY "Admins can manage voice configs" ON voice_clone_configs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = true
    )
  );

-- ============================================================================
-- STRIPE WEBHOOK LOGS (for admin visibility)
-- ============================================================================

CREATE TABLE stripe_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  data JSONB NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processed', 'failed', 'ignored')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on stripe_webhook_logs
ALTER TABLE stripe_webhook_logs ENABLE ROW LEVEL SECURITY;

-- Admins can read webhook logs
CREATE POLICY "Admins can read webhook logs" ON stripe_webhook_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = true
    )
  );

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Billing indexes
CREATE INDEX idx_billing_plans_slug ON billing_plans(slug);
CREATE INDEX idx_billing_plans_is_active ON billing_plans(is_active);
CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_is_active ON coupons(is_active) WHERE is_active = true;
CREATE INDEX idx_coupons_expires_at ON coupons(expires_at);

-- Marketplace indexes
CREATE INDEX idx_marketplace_providers_is_active ON marketplace_providers(is_active);
CREATE INDEX idx_marketplace_categories_provider ON marketplace_categories(provider);
CREATE INDEX idx_marketplace_products_provider ON marketplace_products(provider);
CREATE INDEX idx_marketplace_products_category ON marketplace_products(category_id);
CREATE INDEX idx_marketplace_products_is_curated ON marketplace_products(is_curated) WHERE is_curated = true;
CREATE INDEX idx_marketplace_products_is_active ON marketplace_products(is_active);

-- AI indexes
CREATE INDEX idx_ai_model_configs_use_case ON ai_model_configs(use_case);
CREATE INDEX idx_ai_model_configs_is_default ON ai_model_configs(is_default) WHERE is_default = true;
CREATE INDEX idx_system_prompts_use_case ON system_prompts(use_case);
CREATE INDEX idx_system_prompts_is_default ON system_prompts(is_default) WHERE is_default = true;
CREATE INDEX idx_stripe_webhook_logs_event_type ON stripe_webhook_logs(event_type);
CREATE INDEX idx_stripe_webhook_logs_status ON stripe_webhook_logs(processing_status);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at triggers
CREATE TRIGGER update_billing_plans_updated_at BEFORE UPDATE ON billing_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON coupons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_admin_view_updated_at BEFORE UPDATE ON subscription_admin_view
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketplace_providers_updated_at BEFORE UPDATE ON marketplace_providers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketplace_categories_updated_at BEFORE UPDATE ON marketplace_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketplace_products_updated_at BEFORE UPDATE ON marketplace_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_model_configs_updated_at BEFORE UPDATE ON ai_model_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_prompts_updated_at BEFORE UPDATE ON system_prompts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rag_settings_updated_at BEFORE UPDATE ON rag_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_voice_clone_configs_updated_at BEFORE UPDATE ON voice_clone_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Default billing plans
INSERT INTO billing_plans (name, slug, description, price_cents, interval, features, limits, is_active, is_default, display_order) VALUES
  ('Free', 'free', 'Get started with basic memory capture', 0, 'month', '["Up to 50 memories", "Basic AI chat", "1 voice clone"]', '{"max_memories": 50, "max_voice_clones": 1, "max_storage_mb": 100}', true, true, 1),
  ('Premium', 'premium', 'Unlock advanced features for serious memory keepers', 999, 'month', '["Unlimited memories", "Advanced AI chat", "5 voice clones", "Priority support", "Family sharing"]', '{"max_memories": -1, "max_voice_clones": 5, "max_storage_mb": 1000, "family_sharing": true}', true, false, 2),
  ('Premium Annual', 'premium-yearly', 'Save 20% with annual billing', 9590, 'year', '["Unlimited memories", "Advanced AI chat", "5 voice clones", "Priority support", "Family sharing", "2 months free"]', '{"max_memories": -1, "max_voice_clones": 5, "max_storage_mb": 1000, "family_sharing": true}', true, false, 3);

-- Default marketplace providers
INSERT INTO marketplace_providers (id, name, description, is_active, api_endpoint, markup_percentage) VALUES
  ('prodigi', 'Prodigi', 'Print-on-demand products worldwide', false, 'https://api.prodigi.com/v4', 15.00),
  ('spocket', 'Spocket', 'US/EU dropshipping for quality gifts', false, 'https://api.spocket.co', 20.00),
  ('floristone', 'Floristone', 'Same-day flower delivery network', false, 'https://www.floristone.com/api/rest', 10.00);

-- Default marketplace categories
INSERT INTO marketplace_categories (id, name, slug, description, provider, display_order) VALUES
  ('photobooks-memory-books', 'Photobooks & Memory Books', 'photobooks-memory-books', 'Preserve your precious moments in beautifully crafted books', 'prodigi', 1),
  ('wall-art-canvas', 'Wall Art & Canvas Prints', 'wall-art-canvas', 'Turn memories into timeless art for your home', 'prodigi', 2),
  ('keepsake-gifts', 'Keepsake Gifts', 'keepsake-gifts', 'Heirloom-quality items that tell a story', 'spocket', 3),
  ('photo-calendars', 'Photo Calendars', 'photo-calendars', 'Celebrate your year in photos, month by month', 'prodigi', 4),
  ('greeting-cards', 'Greeting Cards', 'greeting-cards', 'Personalized cards for every meaningful occasion', 'prodigi', 5),
  ('flowers-occasions', 'Flowers for Occasions', 'flowers-occasions', 'Fresh flowers to accompany your heartfelt messages', 'floristone', 6);

-- Default AI model configs
INSERT INTO ai_model_configs (name, use_case, provider, model, temperature, max_tokens, is_active, is_default, display_order) VALUES
  ('Claude Interview', 'interview', 'anthropic', 'claude-sonnet-4-20250514', 0.80, 2000, true, true, 1),
  ('Claude Chat', 'chat', 'anthropic', 'claude-sonnet-4-20250514', 0.70, 1500, true, true, 2),
  ('Claude RAG', 'rag', 'anthropic', 'claude-sonnet-4-20250514', 0.60, 2500, true, true, 3),
  ('Gemini Embeddings', 'embeddings', 'google', 'gemini-embedding-001', 0.00, 0, true, true, 4);

-- Default RAG settings
INSERT INTO rag_settings (embedding_model, embedding_dimensions, chunk_size, chunk_overlap, retrieval_count, similarity_threshold, context_window_tokens, max_context_chunks) VALUES
  ('gemini-embedding-001', 768, 1000, 200, 5, 0.70, 4000, 3);

-- Enable realtime for relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE billing_plans;
ALTER PUBLICATION supabase_realtime ADD TABLE coupons;
ALTER PUBLICATION supabase_realtime ADD TABLE marketplace_products;
ALTER PUBLICATION supabase_realtime ADD TABLE stripe_webhook_logs;
