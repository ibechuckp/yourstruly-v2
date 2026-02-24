/**
 * Curated Marketplace Catalog
 * 
 * Static product catalog for YoursTruly Marketplace.
 * Products selected for emotional, sentimental, keepsake value.
 * Works as fallback when provider APIs are unavailable.
 */

import type { Product, Category } from './types';

export interface CuratedProduct extends Product {
  curatedScore: number; // 0-100, alignment with brand values
  collections: ('staff-picks' | 'perfect-for-memories' | 'heirloom-quality' | 'thoughtful-gestures')[];
  whyWeLoveIt: string;
  occasions: string[];
  emotionalImpact: 'high' | 'medium' | 'low';
  pairingSuggestions?: string[];
}

// =============================================================================
// CURATED CATEGORIES
// =============================================================================

export const CURATED_CATEGORIES: Category[] = [
  {
    id: 'photobooks-memory-books',
    name: 'Photobooks & Memory Books',
    description: 'Preserve your precious moments in beautifully crafted books',
    image: '/images/categories/photobooks.jpg',
  },
  {
    id: 'wall-art-canvas',
    name: 'Wall Art & Canvas Prints',
    description: 'Turn memories into timeless art for your home',
    image: '/images/categories/wall-art.jpg',
  },
  {
    id: 'keepsake-gifts',
    name: 'Keepsake Gifts',
    description: 'Heirloom-quality items that tell a story',
    image: '/images/categories/keepsakes.jpg',
  },
  {
    id: 'photo-calendars',
    name: 'Photo Calendars',
    description: 'Celebrate your year in photos, month by month',
    image: '/images/categories/calendars.jpg',
  },
  {
    id: 'greeting-cards',
    name: 'Greeting Cards',
    description: 'Personalized cards for every meaningful occasion',
    image: '/images/categories/cards.jpg',
  },
  {
    id: 'flowers-occasions',
    name: 'Flowers for Occasions',
    description: 'Fresh flowers to accompany your heartfelt messages',
    image: '/images/categories/flowers.jpg',
  },
];

// =============================================================================
// PRODIGI PRODUCTS (Print-on-demand)
// =============================================================================

export const PRODIGI_PRODUCTS: CuratedProduct[] = [
  // PHOTOBOOKS
  {
    id: 'hardcover-memory-book',
    name: 'Hardcover Memory Book',
    description: 'A timeless hardcover photobook with premium layflat pages. Perfect for wedding albums, baby books, and anniversary gifts.',
    price: 45.00,
    currency: 'USD',
    images: ['/images/products/hardcover-photobook.jpg'],
    thumbnail: '/images/products/hardcover-photobook-thumb.jpg',
    provider: 'prodigi',
    category: 'photobooks-memory-books',
    inStock: true,
    curatedScore: 95,
    collections: ['staff-picks', 'perfect-for-memories', 'heirloom-quality'],
    whyWeLoveIt: 'Layflat pages create a truly immersive experience - photos flow seamlessly across spreads.',
    occasions: ['anniversary', 'wedding', 'baby', 'mothers-day', 'fathers-day', 'birthday'],
    emotionalImpact: 'high',
    pairingSuggestions: ['Add a handwritten note on the first page', 'Pair with a preserved flower'],
    variants: [
      { id: '8x8-20', name: '8x8" - 20 pages', price: 45.00, attributes: { size: '8x8', pages: '20' }, inStock: true },
      { id: '10x10-40', name: '10x10" - 40 pages', price: 75.00, attributes: { size: '10x10', pages: '40' }, inStock: true },
      { id: '12x12-60', name: '12x12" - 60 pages', price: 115.00, attributes: { size: '12x12', pages: '60' }, inStock: true },
    ],
  },
  {
    id: 'softcover-story-book',
    name: 'Softcover Story Book',
    description: 'A lightweight, flexible photobook perfect for everyday memories. Easy to share and enjoy casually.',
    price: 25.00,
    currency: 'USD',
    images: ['/images/products/softcover-photobook.jpg'],
    thumbnail: '/images/products/softcover-photobook-thumb.jpg',
    provider: 'prodigi',
    category: 'photobooks-memory-books',
    inStock: true,
    curatedScore: 85,
    collections: ['perfect-for-memories'],
    whyWeLoveIt: 'Accessible price point - create one for each year, trip, or chapter.',
    occasions: ['birthday', 'travel', 'family', 'graduation'],
    emotionalImpact: 'medium',
  },
  
  // CANVAS PRINTS
  {
    id: 'gallery-canvas-print',
    name: 'Gallery-Wrapped Canvas Print',
    description: 'Museum-quality canvas prints stretched over solid wood frames. Image wraps around edges for a contemporary look.',
    price: 65.00,
    currency: 'USD',
    images: ['/images/products/canvas-gallery.jpg'],
    thumbnail: '/images/products/canvas-gallery-thumb.jpg',
    provider: 'prodigi',
    category: 'wall-art-canvas',
    inStock: true,
    curatedScore: 92,
    collections: ['staff-picks', 'perfect-for-memories', 'heirloom-quality'],
    whyWeLoveIt: 'Canvas transforms photos into art. Timeless gallery pieces.',
    occasions: ['anniversary', 'housewarming', 'mothers-day', 'christmas', 'birthday'],
    emotionalImpact: 'high',
    variants: [
      { id: '12x16', name: '12x16"', price: 65.00, attributes: { size: '12x16' }, inStock: true },
      { id: '16x20', name: '16x20"', price: 95.00, attributes: { size: '16x20' }, inStock: true },
      { id: '20x30', name: '20x30"', price: 145.00, attributes: { size: '20x30' }, inStock: true },
    ],
  },
  
  // CALENDARS
  {
    id: 'premium-photo-calendar',
    name: 'Premium Photo Calendar',
    description: '12-month wall calendar featuring your photos. Heavy cardstock with wire binding and hanging hook.',
    price: 28.00,
    currency: 'USD',
    images: ['/images/products/photo-calendar.jpg'],
    thumbnail: '/images/products/photo-calendar-thumb.jpg',
    provider: 'prodigi',
    category: 'photo-calendars',
    inStock: true,
    curatedScore: 87,
    collections: ['perfect-for-memories'],
    whyWeLoveIt: 'A year of memories, month by month. Grandparents love these.',
    occasions: ['christmas', 'new-year', 'grandparents-day'],
    emotionalImpact: 'medium',
    pairingSuggestions: ['Mark important family dates before gifting'],
  },
  
  // GREETING CARDS
  {
    id: 'personalized-cards-set',
    name: 'Personalized Greeting Cards - Set of 10',
    description: 'Custom greeting cards featuring your photos. Flat cards with envelopes, perfect for thank you notes.',
    price: 24.00,
    currency: 'USD',
    images: ['/images/products/greeting-cards.jpg'],
    thumbnail: '/images/products/greeting-cards-thumb.jpg',
    provider: 'prodigi',
    category: 'greeting-cards',
    inStock: true,
    curatedScore: 85,
    collections: ['thoughtful-gestures'],
    whyWeLoveIt: 'Nothing says "I care" like a handwritten note on a card with a shared memory.',
    occasions: ['thank-you', 'birthday', 'just-because', 'sympathy'],
    emotionalImpact: 'medium',
  },
];

// =============================================================================
// SPOCKET PRODUCTS (Dropship keepsakes)
// =============================================================================

export const SPOCKET_PRODUCTS: CuratedProduct[] = [
  {
    id: 'wooden-memory-box',
    name: 'Engraved Wooden Memory Box',
    description: 'Handcrafted solid wood box with custom engraving. Perfect for storing letters, photos, and small treasures.',
    price: 48.00,
    originalPrice: 36.92,
    currency: 'USD',
    images: ['/images/products/memory-box.jpg'],
    thumbnail: '/images/products/memory-box-thumb.jpg',
    provider: 'spocket',
    category: 'keepsake-gifts',
    inStock: true,
    curatedScore: 94,
    collections: ['staff-picks', 'heirloom-quality'],
    whyWeLoveIt: 'The modern shoebox under the bed - but beautiful enough to display.',
    occasions: ['wedding', 'anniversary', 'birthday', 'mothers-day', 'valentines-day'],
    emotionalImpact: 'high',
    pairingSuggestions: ['Fill with printed photos before gifting', 'Include a handwritten letter'],
  },
  {
    id: 'memory-jar-led',
    name: 'Memory Jar with LED Lights',
    description: 'Glass jar filled with fairy lights - store written memories, tickets, and small keepsakes that glow softly.',
    price: 28.00,
    originalPrice: 21.54,
    currency: 'USD',
    images: ['/images/products/memory-jar.jpg'],
    thumbnail: '/images/products/memory-jar-thumb.jpg',
    provider: 'spocket',
    category: 'keepsake-gifts',
    inStock: true,
    curatedScore: 88,
    collections: ['thoughtful-gestures'],
    whyWeLoveIt: 'A beautiful ritual: write memories on slips and watch the jar fill with glowing moments.',
    occasions: ['anniversary', 'valentines-day', 'birthday'],
    emotionalImpact: 'high',
    pairingSuggestions: ['Pre-fill with memories you\'ve shared together'],
  },
  {
    id: 'leather-photo-album',
    name: 'Genuine Leather Photo Album',
    description: 'Handcrafted leather album with refillable pages. Develops a beautiful patina over time.',
    price: 68.00,
    originalPrice: 52.31,
    currency: 'USD',
    images: ['/images/products/leather-album.jpg'],
    thumbnail: '/images/products/leather-album-thumb.jpg',
    provider: 'spocket',
    category: 'photobooks-memory-books',
    inStock: true,
    curatedScore: 93,
    collections: ['staff-picks', 'heirloom-quality'],
    whyWeLoveIt: 'Real leather tells its own story as it ages. Gets better with time.',
    occasions: ['wedding', 'anniversary', 'milestone-birthday'],
    emotionalImpact: 'high',
  },
  {
    id: 'heart-hand-sculpture',
    name: 'Hand Holding Heart Sculpture',
    description: 'Elegant ceramic sculpture of hands cradling a heart. Meaningful gift for loved ones.',
    price: 42.00,
    originalPrice: 32.31,
    currency: 'USD',
    images: ['/images/products/heart-sculpture.jpg'],
    thumbnail: '/images/products/heart-sculpture-thumb.jpg',
    provider: 'spocket',
    category: 'keepsake-gifts',
    inStock: true,
    curatedScore: 86,
    collections: ['thoughtful-gestures'],
    whyWeLoveIt: 'A beautiful reminder that love is meant to be held gently.',
    occasions: ['mothers-day', 'anniversary', 'sympathy', 'thank-you'],
    emotionalImpact: 'high',
  },
];

// =============================================================================
// FLORISTONE PRODUCTS (Flowers)
// =============================================================================

export const FLORISTONE_PRODUCTS: CuratedProduct[] = [
  {
    id: 'classic-romance-bouquet',
    name: 'Classic Romance Bouquet',
    description: 'One dozen long-stemmed red roses with baby\'s breath and elegant greenery. The timeless expression of love.',
    price: 89.95,
    currency: 'USD',
    images: ['/images/products/red-roses.jpg'],
    thumbnail: '/images/products/red-roses-thumb.jpg',
    provider: 'floristone',
    category: 'flowers-occasions',
    inStock: true,
    curatedScore: 92,
    collections: ['staff-picks'],
    whyWeLoveIt: 'Red roses are classic for a reason. When words aren\'t enough, these speak volumes.',
    occasions: ['anniversary', 'valentines-day', 'love', 'im-sorry'],
    emotionalImpact: 'high',
  },
  {
    id: 'orchid-elegance',
    name: 'Orchid Elegance',
    description: 'Stunning phalaenopsis orchid plant in decorative ceramic pot. Lasts for months with proper care.',
    price: 84.95,
    currency: 'USD',
    images: ['/images/products/orchid.jpg'],
    thumbnail: '/images/products/orchid-thumb.jpg',
    provider: 'floristone',
    category: 'flowers-occasions',
    inStock: true,
    curatedScore: 91,
    collections: ['staff-picks', 'heirloom-quality'],
    whyWeLoveIt: 'Unlike cut flowers, orchids last for months. A gift that keeps giving.',
    occasions: ['mothers-day', 'anniversary', 'housewarming', 'thank-you'],
    emotionalImpact: 'high',
  },
  {
    id: 'sunshine-get-well',
    name: 'Sunshine Get Well Basket',
    description: 'Bright yellow sunflowers and daisies in a cheerful basket. Like sending a ray of sunshine.',
    price: 59.95,
    currency: 'USD',
    images: ['/images/products/sunflowers.jpg'],
    thumbnail: '/images/products/sunflowers-thumb.jpg',
    provider: 'floristone',
    category: 'flowers-occasions',
    inStock: true,
    curatedScore: 87,
    collections: ['thoughtful-gestures'],
    whyWeLoveIt: 'Yellow flowers scientifically boost mood. Perfect medicine for someone feeling down.',
    occasions: ['get-well', 'thinking-of-you', 'cheer-up'],
    emotionalImpact: 'high',
  },
];

// =============================================================================
// COMBINED CATALOG
// =============================================================================

export const CURATED_CATALOG: CuratedProduct[] = [
  ...PRODIGI_PRODUCTS,
  ...SPOCKET_PRODUCTS,
  ...FLORISTONE_PRODUCTS,
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function getProductsByCollection(
  collection: 'staff-picks' | 'perfect-for-memories' | 'heirloom-quality' | 'thoughtful-gestures'
): CuratedProduct[] {
  return CURATED_CATALOG.filter(p => p.collections.includes(collection))
    .sort((a, b) => b.curatedScore - a.curatedScore);
}

export function getProductsByCategory(categoryId: string): CuratedProduct[] {
  return CURATED_CATALOG.filter(p => p.category === categoryId)
    .sort((a, b) => b.curatedScore - a.curatedScore);
}

export function getProductsByOccasion(occasion: string): CuratedProduct[] {
  return CURATED_CATALOG.filter(p => p.occasions.includes(occasion))
    .sort((a, b) => b.curatedScore - a.curatedScore);
}

export function getStaffPicks(limit = 8): CuratedProduct[] {
  return getProductsByCollection('staff-picks').slice(0, limit);
}

export function getHighEmotionalImpact(limit = 10): CuratedProduct[] {
  return CURATED_CATALOG.filter(p => p.emotionalImpact === 'high')
    .sort((a, b) => b.curatedScore - a.curatedScore)
    .slice(0, limit);
}
