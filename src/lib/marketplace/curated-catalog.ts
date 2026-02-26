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
  {
    id: 'sympathy-memorial',
    name: 'Sympathy & Memorial',
    description: 'Thoughtful arrangements to honor memories and comfort loved ones',
    image: '/images/categories/sympathy.jpg',
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
// Curated for YoursTruly's emotional occasions: sympathy, anniversaries, 
// milestones, and scheduled postscript deliveries
// =============================================================================

export const FLORISTONE_PRODUCTS: CuratedProduct[] = [
  // ===== SYMPATHY - Most important for legacy platform =====
  {
    id: 'T228-3A',
    name: 'Peaceful White Lilies',
    description: 'An elegant expression of sympathy featuring stunning white lilies, white roses, and lush greenery in a glass vase. A peaceful tribute to honor a life well-lived.',
    price: 89.95,
    currency: 'USD',
    images: ['https://cdn.floristone.com/large/T228-3A_d1.jpg'],
    thumbnail: 'https://cdn.floristone.com/small/T228-3A_t1.jpg',
    provider: 'floristone',
    category: 'flowers-occasions',
    inStock: true,
    curatedScore: 96,
    collections: ['staff-picks', 'thoughtful-gestures'],
    whyWeLoveIt: 'White lilies symbolize the restored innocence of the soul. A gentle comfort during difficult times.',
    occasions: ['sympathy', 'memorial', 'loss', 'condolence'],
    emotionalImpact: 'high',
    providerData: { code: 'T228-3A' },
  },
  {
    id: 'S5-4448',
    name: 'Loving Tribute Heart',
    description: 'A beautiful heart-shaped arrangement of all-white flowers including roses, carnations, and stock. Expresses deep love and lasting memories.',
    price: 174.95,
    currency: 'USD',
    images: ['https://cdn.floristone.com/large/S5-4448_d1.jpg'],
    thumbnail: 'https://cdn.floristone.com/small/S5-4448_t1.jpg',
    provider: 'floristone',
    category: 'flowers-occasions',
    inStock: true,
    curatedScore: 94,
    collections: ['heirloom-quality'],
    whyWeLoveIt: 'The heart shape speaks when words fail. A powerful symbol of eternal love.',
    occasions: ['sympathy', 'memorial', 'funeral', 'loss'],
    emotionalImpact: 'high',
    providerData: { code: 'S5-4448' },
  },
  {
    id: 'S38-4509',
    name: 'Serenity Orchid Plant',
    description: 'A graceful white phalaenopsis orchid in a decorative planter. Unlike cut flowers, orchids provide lasting beauty for months as a living memorial.',
    price: 84.95,
    currency: 'USD',
    images: ['https://cdn.floristone.com/large/S38-4509_d1.jpg'],
    thumbnail: 'https://cdn.floristone.com/small/S38-4509_t1.jpg',
    provider: 'floristone',
    category: 'flowers-occasions',
    inStock: true,
    curatedScore: 93,
    collections: ['staff-picks', 'heirloom-quality'],
    whyWeLoveIt: 'A living gift that blooms for months. Each flower is a reminder of love that endures.',
    occasions: ['sympathy', 'memorial', 'condolence', 'thank-you'],
    emotionalImpact: 'high',
    providerData: { code: 'S38-4509' },
  },

  // ===== LOVE & ANNIVERSARY - Perfect for scheduled postscripts =====
  {
    id: 'E2-4305',
    name: 'Classic Red Rose Bouquet',
    description: 'One dozen premium long-stemmed red roses, hand-tied with elegant greenery. The timeless expression of deep, romantic love.',
    price: 89.95,
    currency: 'USD',
    images: ['https://cdn.floristone.com/large/E2-4305_d1.jpg'],
    thumbnail: 'https://cdn.floristone.com/small/E2-4305_t1.jpg',
    provider: 'floristone',
    category: 'flowers-occasions',
    inStock: true,
    curatedScore: 95,
    collections: ['staff-picks'],
    whyWeLoveIt: 'Red roses have meant "I love you" for centuries. Some messages never need updating.',
    occasions: ['anniversary', 'valentines-day', 'love', 'romance', 'proposal'],
    emotionalImpact: 'high',
    providerData: { code: 'E2-4305' },
  },
  {
    id: 'T5-1A',
    name: 'Enchanted Pink Roses',
    description: 'Beautiful pink roses arranged with spray roses, waxflower, and lush greenery in a clear glass vase. Sweet, romantic, and elegant.',
    price: 79.95,
    currency: 'USD',
    images: ['https://cdn.floristone.com/large/T5-1A_d1.jpg'],
    thumbnail: 'https://cdn.floristone.com/small/T5-1A_t1.jpg',
    provider: 'floristone',
    category: 'flowers-occasions',
    inStock: true,
    curatedScore: 91,
    collections: ['perfect-for-memories'],
    whyWeLoveIt: 'Pink roses represent gratitude and admiration. Perfect for showing appreciation.',
    occasions: ['anniversary', 'mothers-day', 'thank-you', 'birthday'],
    emotionalImpact: 'high',
    providerData: { code: 'T5-1A' },
  },

  // ===== BIRTHDAY & CELEBRATION =====
  {
    id: 'T34-1A',
    name: 'Once Upon a Daisy',
    description: 'Cheerful yellow and white gerbera daisies with spray roses and greenery. Brings instant joy and celebration to any room.',
    price: 74.95,
    currency: 'USD',
    images: ['https://cdn.floristone.com/large/T34-1A_d1.jpg'],
    thumbnail: 'https://cdn.floristone.com/small/T34-1A_t1.jpg',
    provider: 'floristone',
    category: 'flowers-occasions',
    inStock: true,
    curatedScore: 90,
    collections: ['thoughtful-gestures'],
    whyWeLoveIt: 'Daisies radiate pure joy. Perfect for making someone smile on their special day.',
    occasions: ['birthday', 'celebration', 'congratulations', 'just-because'],
    emotionalImpact: 'high',
    providerData: { code: 'T34-1A' },
  },
  {
    id: 'T163-1A',
    name: 'Ocean Devotion',
    description: 'Stunning blue hydrangea, green roses, white dahlias and snapdragons in a striking cobalt vase. Unique and unforgettable.',
    price: 79.95,
    currency: 'USD',
    images: ['https://cdn.floristone.com/large/T163-1A_d1.jpg'],
    thumbnail: 'https://cdn.floristone.com/small/T163-1A_t1.jpg',
    provider: 'floristone',
    category: 'flowers-occasions',
    inStock: true,
    curatedScore: 89,
    collections: ['staff-picks'],
    whyWeLoveIt: 'Blue flowers are rare and extraordinary - just like the person receiving them.',
    occasions: ['birthday', 'anniversary', 'mothers-day', 'thank-you'],
    emotionalImpact: 'high',
    providerData: { code: 'T163-1A' },
  },

  // ===== MOTHER'S DAY =====
  {
    id: 'T4-1A',
    name: 'Make Me Blush',
    description: 'Romantic arrangement featuring pink roses, pink alstroemeria, and lavender stock in a charming glass vase with ribbon accent.',
    price: 89.95,
    currency: 'USD',
    images: ['https://cdn.floristone.com/large/T4-1A_d1.jpg'],
    thumbnail: 'https://cdn.floristone.com/small/T4-1A_t1.jpg',
    provider: 'floristone',
    category: 'flowers-occasions',
    inStock: true,
    curatedScore: 92,
    collections: ['staff-picks', 'perfect-for-memories'],
    whyWeLoveIt: 'Soft pinks honor a mother\'s gentle strength. A beautiful "thank you" for everything.',
    occasions: ['mothers-day', 'birthday', 'thank-you', 'grandparents-day'],
    emotionalImpact: 'high',
    providerData: { code: 'T4-1A' },
  },

  // ===== GET WELL & THINKING OF YOU =====
  {
    id: 'C3-4793',
    name: 'Sunny Sentiments',
    description: 'Bright yellow sunflowers, orange roses, and cheerful daisies arranged in a charming container. Like sending a ray of sunshine.',
    price: 74.95,
    currency: 'USD',
    images: ['https://cdn.floristone.com/large/C3-4793_d1.jpg'],
    thumbnail: 'https://cdn.floristone.com/small/C3-4793_t1.jpg',
    provider: 'floristone',
    category: 'flowers-occasions',
    inStock: true,
    curatedScore: 88,
    collections: ['thoughtful-gestures'],
    whyWeLoveIt: 'Sunshine colors have proven mood-lifting effects. The perfect pick-me-up.',
    occasions: ['get-well', 'thinking-of-you', 'cheer-up', 'encouragement'],
    emotionalImpact: 'high',
    providerData: { code: 'C3-4793' },
  },

  // ===== NEW BABY =====
  {
    id: 'D7-4904',
    name: 'Girls Are Great!',
    description: 'Sweet pink roses, pink carnations, and delicate baby\'s breath in a precious keepsake vase with ribbon. Welcome a baby girl in style.',
    price: 74.95,
    currency: 'USD',
    images: ['https://cdn.floristone.com/large/D7-4904_d1.jpg'],
    thumbnail: 'https://cdn.floristone.com/small/D7-4904_t1.jpg',
    provider: 'floristone',
    category: 'flowers-occasions',
    inStock: true,
    curatedScore: 87,
    collections: ['thoughtful-gestures'],
    whyWeLoveIt: 'Welcoming a new life deserves something special. The keepsake vase becomes a memory itself.',
    occasions: ['new-baby', 'baby-girl', 'congratulations'],
    emotionalImpact: 'high',
    providerData: { code: 'D7-4904' },
  },
  {
    id: 'D7-4903',
    name: 'Boys Are Best!',
    description: 'Cheerful blue hydrangea, white roses, and blue delphinium in a classic vase with blue ribbon. A joyful celebration for a new baby boy.',
    price: 74.95,
    currency: 'USD',
    images: ['https://cdn.floristone.com/large/D7-4903_d1.jpg'],
    thumbnail: 'https://cdn.floristone.com/small/D7-4903_t1.jpg',
    provider: 'floristone',
    category: 'flowers-occasions',
    inStock: true,
    curatedScore: 87,
    collections: ['thoughtful-gestures'],
    whyWeLoveIt: 'Blue flowers symbolize serenity and calm - exactly what new parents need!',
    occasions: ['new-baby', 'baby-boy', 'congratulations'],
    emotionalImpact: 'high',
    providerData: { code: 'D7-4903' },
  },

  // ===== THANK YOU =====
  {
    id: 'FAA-126',
    name: 'Gathered With Love',
    description: 'A bountiful garden arrangement featuring roses, lilies, hydrangea, and seasonal blooms. Hand-tied and wrapped in natural burlap.',
    price: 129.95,
    currency: 'USD',
    images: ['https://cdn.floristone.com/large/FAA-126_d1.jpg'],
    thumbnail: 'https://cdn.floristone.com/small/FAA-126_t1.jpg',
    provider: 'floristone',
    category: 'flowers-occasions',
    inStock: true,
    curatedScore: 90,
    collections: ['staff-picks', 'perfect-for-memories'],
    whyWeLoveIt: 'Like gathering flowers from a loved one\'s garden. Personal, warm, unforgettable.',
    occasions: ['thank-you', 'gratitude', 'appreciation', 'hostess'],
    emotionalImpact: 'high',
    providerData: { code: 'FAA-126' },
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
