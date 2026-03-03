-- Fix marketplace_products table (handles partial migration state)
-- This creates the table if it doesn't exist

-- Create marketplace_products if missing
CREATE TABLE IF NOT EXISTS marketplace_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  provider TEXT,
  category_id TEXT,
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
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS if not already enabled
ALTER TABLE marketplace_products ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies (safe)
DROP POLICY IF EXISTS "Anyone can read active products" ON marketplace_products;
CREATE POLICY "Anyone can read active products" ON marketplace_products
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage products" ON marketplace_products;
CREATE POLICY "Admins can manage products" ON marketplace_products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

-- Create indexes if not exist
CREATE INDEX IF NOT EXISTS idx_marketplace_products_provider ON marketplace_products(provider);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_is_curated ON marketplace_products(is_curated) WHERE is_curated = true;
CREATE INDEX IF NOT EXISTS idx_marketplace_products_is_active ON marketplace_products(is_active);

-- Updated at trigger (safe create)
CREATE OR REPLACE FUNCTION update_marketplace_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_marketplace_products_updated_at ON marketplace_products;
CREATE TRIGGER update_marketplace_products_updated_at 
  BEFORE UPDATE ON marketplace_products
  FOR EACH ROW
  EXECUTE FUNCTION update_marketplace_products_updated_at();

-- Now seed products (only if table is empty)
INSERT INTO marketplace_products (
  name,
  description,
  provider,
  base_price_cents,
  images,
  in_stock,
  is_curated,
  curated_score,
  occasions,
  emotional_impact,
  why_we_love_it,
  is_active
)
SELECT * FROM (VALUES
-- Premium Gifts ($100+)
(
  'Brooklinen Luxe Core Sheet Set',
  'Hotel-quality 480 thread count sateen sheets that feel like sleeping on a cloud. Perfect for creating lasting comfort.',
  'goody',
  19900,
  '["https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800"]'::jsonb,
  true,
  true,
  95,
  ARRAY['wedding', 'housewarming', 'anniversary', 'birthday'],
  'high',
  'Nothing says "I want you to rest well" like luxury bedding. These sheets last for years and become more comfortable over time.',
  true
),
(
  'Apple AirPods Pro (2nd Gen)',
  'Premium wireless earbuds with active noise cancellation and spatial audio. A gift that improves daily life.',
  'goody',
  24900,
  '["https://images.unsplash.com/photo-1606220838315-056192d5e927?w=800"]'::jsonb,
  true,
  true,
  92,
  ARRAY['birthday', 'graduation', 'congratulations', 'christmas'],
  'high',
  'Tech gifts that people actually use every day are the best kind. These become indispensable.',
  true
),
(
  'Bose SoundLink Flex Bluetooth Speaker',
  'Waterproof portable speaker with rich, room-filling sound. Perfect for outdoor adventures or relaxing at home.',
  'goody',
  14900,
  '["https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800"]'::jsonb,
  true,
  true,
  88,
  ARRAY['birthday', 'housewarming', 'graduation', 'congratulations'],
  'medium',
  'Music brings people together. This speaker goes anywhere and sounds amazing.',
  true
),
-- Mid-Range Gifts ($50-100)
(
  'YETI Rambler 20oz Tumbler',
  'Vacuum-insulated stainless steel tumbler that keeps drinks hot or cold for hours. Virtually indestructible.',
  'goody',
  3800,
  '["https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800"]'::jsonb,
  true,
  true,
  90,
  ARRAY['birthday', 'congratulations', 'thank you', 'christmas'],
  'medium',
  'A daily companion that reminds someone of you every time they take a sip. The YETI quality is legendary.',
  true
),
(
  'Godiva Signature Chocolate Tower',
  'Luxurious assortment of Godiva''s finest chocolates in an elegant gift tower. 45+ pieces of pure indulgence.',
  'goody',
  7500,
  '["https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=800"]'::jsonb,
  true,
  true,
  85,
  ARRAY['birthday', 'anniversary', 'sympathy', 'thank you', 'congratulations'],
  'high',
  'Chocolate is the universal language of love. This tower makes any moment feel special.',
  true
),
(
  'Voluspa Candle Gift Set',
  'Set of 3 hand-poured candles in elegant textured glass. Luxurious fragrances that transform any space.',
  'goody',
  6500,
  '["https://images.unsplash.com/photo-1602607745657-71f5e0f8f8f2?w=800"]'::jsonb,
  true,
  true,
  87,
  ARRAY['housewarming', 'birthday', 'sympathy', 'thank you'],
  'medium',
  'Candles create atmosphere and memories. These burn clean and smell absolutely divine.',
  true
),
(
  'Le Creuset Stoneware Mug Set',
  'Set of 4 iconic stoneware mugs in classic colors. Chip-resistant and perfect for morning rituals.',
  'goody',
  8500,
  '["https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800"]'::jsonb,
  true,
  true,
  86,
  ARRAY['housewarming', 'wedding', 'christmas', 'birthday'],
  'medium',
  'These mugs become family heirlooms. Every morning coffee becomes a small luxury.',
  true
),
-- Thoughtful Gifts ($25-50)
(
  'Rifle Paper Co. Floral Journal Set',
  'Beautiful hardcover journals with gold foil details and lay-flat binding. Perfect for capturing thoughts and memories.',
  'goody',
  4200,
  '["https://images.unsplash.com/photo-1544816155-12df9643f363?w=800"]'::jsonb,
  true,
  true,
  82,
  ARRAY['birthday', 'graduation', 'congratulations', 'sympathy'],
  'high',
  'Writing is therapy. These journals are too beautiful to leave blank.',
  true
),
(
  'Anthropologie Monogram Mug',
  'Hand-painted stoneware mug with a gilded letter. Personal yet universally loved.',
  'goody',
  1600,
  '["https://images.unsplash.com/photo-1577937927133-66ef06acdf18?w=800"]'::jsonb,
  true,
  true,
  80,
  ARRAY['birthday', 'thank you', 'christmas', 'housewarming'],
  'medium',
  'Simple personalization goes a long way. This becomes their favorite mug.',
  true
),
(
  'Spa Luxetique Bath Bomb Gift Set',
  '12 handcrafted bath bombs with essential oils. Transform bath time into a spa experience.',
  'goody',
  2800,
  '["https://images.unsplash.com/photo-1570194065650-d99fb4b38b15?w=800"]'::jsonb,
  true,
  true,
  78,
  ARRAY['birthday', 'sympathy', 'thank you', 'self-care'],
  'medium',
  'Everyone deserves a moment of relaxation. These make self-care feel luxurious.',
  true
),
(
  'Harry & David Classic Pear Box',
  'Famous Royal Riviera Pears, hand-picked at peak ripeness. A classic gift that never disappoints.',
  'goody',
  3900,
  '["https://images.unsplash.com/photo-1514756331096-242fdeb70d4a?w=800"]'::jsonb,
  true,
  true,
  84,
  ARRAY['thank you', 'sympathy', 'congratulations', 'birthday'],
  'medium',
  'Fresh fruit gifts are unexpectedly delightful. These pears are legendary for a reason.',
  true
),
-- Budget-Friendly ($15-25)
(
  'Burt''s Bees Tips and Toes Kit',
  'Essential collection of Burt''s Bees favorites including hand salve, lip balm, and cuticle cream.',
  'goody',
  1500,
  '["https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=800"]'::jsonb,
  true,
  true,
  75,
  ARRAY['birthday', 'thank you', 'christmas', 'self-care'],
  'low',
  'Natural skincare that actually works. Perfect for anyone who needs a little pampering.',
  true
),
(
  'Starbucks Reserve Coffee Collection',
  'Premium whole bean coffee duo featuring rare, small-lot coffees from around the world.',
  'goody',
  2400,
  '["https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800"]'::jsonb,
  true,
  true,
  79,
  ARRAY['birthday', 'thank you', 'christmas', 'congratulations'],
  'medium',
  'For the coffee lover who thinks they''ve tried everything. These rare beans are a revelation.',
  true
),
(
  'Sugarfina Sweet & Sparkling Bento Box',
  'Curated collection of Sugarfina''s champagne-inspired candies in a beautiful bento-style box.',
  'goody',
  2800,
  '["https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=800"]'::jsonb,
  true,
  true,
  81,
  ARRAY['birthday', 'congratulations', 'anniversary', 'thank you'],
  'medium',
  'Grown-up candy for grown-up celebrations. These make any moment feel like a toast.',
  true
)
) AS v(name, description, provider, base_price_cents, images, in_stock, is_curated, curated_score, occasions, emotional_impact, why_we_love_it, is_active)
WHERE NOT EXISTS (SELECT 1 FROM marketplace_products LIMIT 1);
