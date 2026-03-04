-- Account Deletion System
-- Handles proper deletion flow with postscript preservation and family plan transfers

-- Add soft delete columns to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

-- Add orphaned flag to postscripts (for when user deletes but keeps postscripts)
ALTER TABLE postscripts
ADD COLUMN IF NOT EXISTS orphaned BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS orphaned_at TIMESTAMPTZ;

-- Account deletion requests table
CREATE TABLE IF NOT EXISTS account_deletion_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  
  -- Postscript handling
  postscript_action TEXT CHECK (postscript_action IN ('keep', 'cancel')),
  
  -- Refund information (if cancelling postscripts)
  refund_method TEXT CHECK (refund_method IN ('original', 'check', 'other')),
  refund_details TEXT,
  refund_amount DECIMAL(10,2),
  refund_processed_at TIMESTAMPTZ,
  
  -- Family plan handling
  new_admin_id UUID REFERENCES auth.users(id),
  notify_members BOOLEAN DEFAULT TRUE,
  
  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for admin queries
CREATE INDEX IF NOT EXISTS idx_deletion_requests_status ON account_deletion_requests(status);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_user ON account_deletion_requests(user_id);

-- RLS
ALTER TABLE account_deletion_requests ENABLE ROW LEVEL SECURITY;

-- Users can create and view their own requests
CREATE POLICY "Users can create own deletion requests"
  ON account_deletion_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own deletion requests"
  ON account_deletion_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can manage all requests
CREATE POLICY "Admins can manage deletion requests"
  ON account_deletion_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    )
  );

-- Add transferred_at to subscriptions
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS transferred_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS transferred_from UUID REFERENCES auth.users(id);

-- Function to check if orphaned postscripts should still be delivered
-- (They should be delivered even if user account is deleted)
CREATE OR REPLACE FUNCTION should_deliver_postscript(postscript_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM postscripts 
    WHERE id = postscript_id 
    AND status IN ('scheduled', 'pending')
    AND (orphaned = FALSE OR orphaned IS NULL OR orphaned = TRUE)
    -- Orphaned postscripts are still valid for delivery
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE account_deletion_requests IS 'Tracks account deletion requests with postscript and family plan handling';
