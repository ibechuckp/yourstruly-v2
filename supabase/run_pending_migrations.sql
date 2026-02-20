-- Combined migrations 005-007 for YoursTruly V2
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/ffgetlejrwhpwvwtviqm/sql/new

-- ============================================
-- MIGRATION 005: Memory Sharing
-- ============================================

CREATE TABLE IF NOT EXISTS memory_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    memory_id UUID NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    share_token UUID DEFAULT gen_random_uuid(),
    can_comment BOOLEAN DEFAULT TRUE,
    can_add_media BOOLEAN DEFAULT TRUE,
    notify_email TEXT,
    notify_phone TEXT,
    invitation_sent_at TIMESTAMPTZ,
    first_viewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(memory_id, contact_id)
);

CREATE TABLE IF NOT EXISTS memory_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    memory_id UUID NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    contact_name TEXT,
    content TEXT NOT NULL,
    is_hidden BOOLEAN DEFAULT FALSE,
    hidden_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS memory_shared_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    memory_id UUID NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    contact_name TEXT,
    file_url TEXT NOT NULL,
    file_key TEXT NOT NULL,
    file_type TEXT NOT NULL,
    mime_type TEXT,
    file_size INTEGER,
    caption TEXT,
    is_approved BOOLEAN DEFAULT FALSE,
    is_hidden BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_memory_shares_memory ON memory_shares(memory_id);
CREATE INDEX IF NOT EXISTS idx_memory_shares_contact ON memory_shares(contact_id);
CREATE INDEX IF NOT EXISTS idx_memory_shares_token ON memory_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_memory_shares_owner ON memory_shares(owner_id);
CREATE INDEX IF NOT EXISTS idx_memory_comments_memory ON memory_comments(memory_id);
CREATE INDEX IF NOT EXISTS idx_memory_comments_contact ON memory_comments(contact_id);
CREATE INDEX IF NOT EXISTS idx_memory_shared_media_memory ON memory_shared_media(memory_id);
CREATE INDEX IF NOT EXISTS idx_memory_shared_media_contact ON memory_shared_media(contact_id);

-- RLS
ALTER TABLE memory_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_shared_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can manage memory shares" ON memory_shares;
CREATE POLICY "Owners can manage memory shares" ON memory_shares FOR ALL USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Memory owners can manage comments" ON memory_comments;
CREATE POLICY "Memory owners can manage comments" ON memory_comments FOR ALL USING (
    EXISTS (SELECT 1 FROM memories WHERE id = memory_id AND user_id = auth.uid())
);

DROP POLICY IF EXISTS "Memory owners can manage shared media" ON memory_shared_media;
CREATE POLICY "Memory owners can manage shared media" ON memory_shared_media FOR ALL USING (
    EXISTS (SELECT 1 FROM memories WHERE id = memory_id AND user_id = auth.uid())
);

-- Triggers
DROP TRIGGER IF EXISTS memory_comments_updated_at ON memory_comments;
CREATE TRIGGER memory_comments_updated_at BEFORE UPDATE ON memory_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Add counts to memories
ALTER TABLE memories ADD COLUMN IF NOT EXISTS shared_with_count INTEGER DEFAULT 0;
ALTER TABLE memories ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0;
ALTER TABLE memories ADD COLUMN IF NOT EXISTS shared_media_count INTEGER DEFAULT 0;

-- ============================================
-- MIGRATION 006: Contact Address
-- ============================================

ALTER TABLE contacts ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS zipcode TEXT;

-- ============================================
-- MIGRATION 007: PostScripts
-- ============================================

CREATE TABLE IF NOT EXISTS postscripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    recipient_name TEXT NOT NULL,
    recipient_email TEXT,
    recipient_phone TEXT,
    title TEXT NOT NULL,
    message TEXT,
    video_url TEXT,
    delivery_type TEXT NOT NULL DEFAULT 'date',
    delivery_date DATE,
    delivery_event TEXT,
    delivery_recurring BOOLEAN DEFAULT FALSE,
    requires_confirmation BOOLEAN DEFAULT FALSE,
    confirmation_contacts UUID[],
    has_gift BOOLEAN DEFAULT FALSE,
    gift_type TEXT,
    gift_details JSONB,
    gift_budget DECIMAL(10, 2),
    status TEXT DEFAULT 'scheduled',
    sent_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS postscript_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    postscript_id UUID NOT NULL REFERENCES postscripts(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_key TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_name TEXT,
    file_size INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_postscripts_user ON postscripts(user_id);
CREATE INDEX IF NOT EXISTS idx_postscripts_status ON postscripts(status);
CREATE INDEX IF NOT EXISTS idx_postscripts_delivery ON postscripts(delivery_date) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_postscripts_recipient ON postscripts(recipient_contact_id);

-- RLS
ALTER TABLE postscripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE postscript_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own postscripts" ON postscripts;
CREATE POLICY "Users can manage own postscripts" ON postscripts FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own postscript attachments" ON postscript_attachments;
CREATE POLICY "Users can manage own postscript attachments" ON postscript_attachments FOR ALL USING (
    EXISTS (SELECT 1 FROM postscripts WHERE id = postscript_id AND user_id = auth.uid())
);

-- Triggers
DROP TRIGGER IF EXISTS postscripts_updated_at ON postscripts;
CREATE TRIGGER postscripts_updated_at BEFORE UPDATE ON postscripts FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Add settings to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';

-- ============================================
-- Done!
-- ============================================
SELECT 'Migrations 005-007 applied successfully!' as status;
