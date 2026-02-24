/**
 * YoursTruly Marketplace Types
 * Types for products, cart, and marketplace browsing
 */

// ============================================================================
// PRODUCT TYPES
// ============================================================================

export type ProviderType = 'flowers' | 'gifts' | 'prints';

export type ProductCategory = 
  // Flowers categories
  | 'occasions' | 'birthday' | 'anniversary' | 'sympathy' | 'get-well' | 'congratulations' | 'love-romance' | 'thank-you' | 'new-baby'
  // Gifts categories  
  | 'sports' | 'toys-kids' | 'pets' | 'electronics' | 'arts-crafts' | 'entertainment' | 'home' | 'fashion' | 'food'
  // Prints categories
  | 'wall-art' | 'canvas' | 'posters' | 'mugs' | 'pillows' | 'blankets' | 'phone-cases' | 'calendars' | 'cards';

export interface Product {
  id: string;
  code: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number; // For showing discounts
  provider: ProviderType;
  category: ProductCategory;
  subcategory?: string;
  
  // Images
  thumbnail: string;
  image: string;
  images?: string[]; // Gallery images for detail view
  
  // Product details
  inStock: boolean;
  stockQuantity?: number;
  
  // For flowers
  deliveryType?: 'same-day' | 'next-day' | 'scheduled';
  
  // For prints (POD)
  variants?: ProductVariant[];
  customizable?: boolean;
  
  // For gifts (Doba)
  sku?: string;
  brand?: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: 'in' | 'cm';
  };
  
  // Metadata
  rating?: number;
  reviewCount?: number;
  tags?: string[];
  isNew?: boolean;
  isBestseller?: boolean;
  
  // External API data (stored as JSON)
  rawData?: Record<string, any>;
}

export interface ProductVariant {
  id: string;
  name: string;
  price?: number;
  inStock: boolean;
  options: Record<string, string>; // { color: 'red', size: 'large' }
  image?: string;
}

// ============================================================================
// CART TYPES
// ============================================================================

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  
  // Selected options
  selectedVariant?: ProductVariant;
  selectedColor?: string;
  selectedSize?: string;
  
  // For customizable products (Printful)
  customization?: {
    designUrl?: string;
    text?: string;
    elements?: CustomizationElement[];
  };
  
  // For gift delivery
  isGift: boolean;
  giftMessage?: string;
  giftWrap?: boolean;
  
  // PostScript integration
  postscriptId?: string;
  scheduledDeliveryDate?: string;
  deliveryEvent?: {
    type: 'birthday' | 'anniversary' | 'holiday' | 'custom';
    yearsAfter?: number; // For death-relative events
  };
  
  // Pricing at time of add
  priceAtAdd: number;
  total: number;
}

export interface CustomizationElement {
  type: 'image' | 'text';
  url?: string;
  text?: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation?: number;
}

export interface Cart {
  id: string;
  userId?: string;
  sessionId?: string;
  items: CartItem[];
  
  // Totals
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  
  // Shipping estimate
  shippingAddress?: ShippingAddress;
  estimatedDelivery?: string;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

export interface ShippingAddress {
  name: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
  email?: string;
}

// ============================================================================
// CATEGORY TYPES
// ============================================================================

export interface Category {
  id: string;
  name: string;
  slug: ProductCategory;
  provider: ProviderType;
  description?: string;
  icon?: string;
  image?: string;
  productCount?: number;
  children?: Category[];
}

export interface ProviderConfig {
  id: ProviderType;
  name: string;
  description: string;
  icon: string;
  color: string;
  categories: Category[];
}

// ============================================================================
// FILTER & SEARCH TYPES
// ============================================================================

export interface ProductFilter {
  provider?: ProviderType;
  category?: ProductCategory;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sortBy?: 'price-asc' | 'price-desc' | 'newest' | 'bestselling' | 'rating';
  searchQuery?: string;
}

export interface SearchSuggestion {
  id: string;
  type: 'product' | 'category' | 'popular';
  text: string;
  image?: string;
  url?: string;
}

// ============================================================================
// GIFT SELECTION TYPES
// ============================================================================

export interface GiftSelectionContext {
  postscriptId?: string;
  contactId?: string;
  eventType?: string;
  eventDate?: string;
  budget?: {
    min: number;
    max: number;
  };
  relationship?: string;
}

export interface GiftRecommendation {
  product: Product;
  reason: string;
  matchScore: number;
}

// ============================================================================
// ORDER TYPES (for reference)
// ============================================================================

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  
  items: CartItem[];
  
  // Pricing
  subtotal: number;
  tax: number;
  shipping: number;
  discount?: number;
  total: number;
  
  // Delivery
  shippingAddress: ShippingAddress;
  billingAddress: ShippingAddress;
  
  // For scheduled gifts
  scheduledDeliveryDate?: string;
  isGift: boolean;
  giftMessage?: string;
  
  // Provider order IDs
  providerOrderIds?: Record<ProviderType, string>;
  
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ProductListResponse {
  products: Product[];
  total: number;
  page: number;
  perPage: number;
  filters: ProductFilter;
}

export interface CategoryListResponse {
  categories: Category[];
  providers: ProviderConfig[];
}
