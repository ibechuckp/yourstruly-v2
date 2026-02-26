-- ============================================================================
-- Marketplace Cart and Orders Tables
-- Created: 2026-02-25
-- Description: Database schema for marketplace shopping cart and order management
-- ============================================================================

-- ============================================================================
-- MARKETPLACE CARTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS marketplace_carts (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    items JSONB DEFAULT '[]'::JSONB,
    subtotal DECIMAL(10, 2) DEFAULT 0,
    tax DECIMAL(10, 2) DEFAULT 0,
    shipping DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2) DEFAULT 0,
    shipping_address JSONB,
    estimated_delivery TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_user_cart UNIQUE (user_id)
);

-- Create index for user lookups
CREATE INDEX IF NOT EXISTS idx_marketplace_carts_user_id ON marketplace_carts(user_id);

-- Enable RLS
ALTER TABLE marketplace_carts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for marketplace_carts
CREATE POLICY "Users can view their own cart"
    ON marketplace_carts
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cart"
    ON marketplace_carts
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cart"
    ON marketplace_carts
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cart"
    ON marketplace_carts
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- ============================================================================
-- MARKETPLACE ORDERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS marketplace_orders (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
    items JSONB NOT NULL DEFAULT '[]'::JSONB,
    
    -- Pricing
    subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
    tax DECIMAL(10, 2) DEFAULT 0,
    shipping DECIMAL(10, 2) DEFAULT 0,
    discount DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL DEFAULT 0,
    
    -- Addresses
    shipping_address JSONB,
    billing_address JSONB,
    
    -- Gift options
    is_gift BOOLEAN DEFAULT FALSE,
    gift_message TEXT,
    scheduled_delivery_date DATE,
    
    -- Stripe integration
    stripe_session_id TEXT,
    stripe_payment_intent_id TEXT,
    
    -- Provider fulfillment
    provider_order_ids JSONB,
    tracking_info JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    shipped_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_user_id ON marketplace_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_status ON marketplace_orders(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_created_at ON marketplace_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_stripe_session ON marketplace_orders(stripe_session_id);

-- Enable RLS
ALTER TABLE marketplace_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for marketplace_orders
CREATE POLICY "Users can view their own orders"
    ON marketplace_orders
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders"
    ON marketplace_orders
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own orders"
    ON marketplace_orders
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Service role can do everything (for webhooks)
CREATE POLICY "Service role full access to carts"
    ON marketplace_carts
    FOR ALL
    TO service_role
    USING (TRUE)
    WITH CHECK (TRUE);

CREATE POLICY "Service role full access to orders"
    ON marketplace_orders
    FOR ALL
    TO service_role
    USING (TRUE)
    WITH CHECK (TRUE);

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_marketplace_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_marketplace_carts_updated_at
    BEFORE UPDATE ON marketplace_carts
    FOR EACH ROW
    EXECUTE FUNCTION update_marketplace_updated_at();

CREATE TRIGGER trigger_marketplace_orders_updated_at
    BEFORE UPDATE ON marketplace_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_marketplace_updated_at();

-- ============================================================================
-- ADMIN VIEW (for admin portal)
-- ============================================================================

-- Admins can view all orders
CREATE POLICY "Admins can view all orders"
    ON marketplace_orders
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.id = auth.uid()
            AND admin_users.is_active = true
        )
    );

-- Admins can update all orders
CREATE POLICY "Admins can update all orders"
    ON marketplace_orders
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.id = auth.uid()
            AND admin_users.is_active = true
        )
    );

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE marketplace_carts IS 'User shopping carts for the marketplace';
COMMENT ON TABLE marketplace_orders IS 'Completed and pending orders from the marketplace';

COMMENT ON COLUMN marketplace_carts.items IS 'JSON array of CartItem objects';
COMMENT ON COLUMN marketplace_orders.items IS 'JSON array of CartItem objects (snapshot at order time)';
COMMENT ON COLUMN marketplace_orders.provider_order_ids IS 'Map of provider type to their order ID';
COMMENT ON COLUMN marketplace_orders.tracking_info IS 'Tracking numbers and shipping info by provider';
