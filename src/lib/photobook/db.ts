/**
 * Photobook Database Operations
 * 
 * Functions for loading products, templates, and pricing from the database.
 * Falls back to hardcoded defaults if database tables don't exist.
 */

import { createClient } from '@/lib/supabase/client';
import { LayoutTemplate, LayoutSlot, LAYOUT_TEMPLATES } from './templates';

// ============================================================================
// TYPES
// ============================================================================

export interface DbProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  size: string;
  base_price: number;
  price_per_page: number;
  min_pages: number;
  max_pages: number;
  binding: 'hardcover' | 'softcover' | 'layflat';
  prodigi_sku: string | null;
  features: string[];
  image_url: string | null;
  sort_order: number;
  is_enabled: boolean;
}

export interface DbTemplate {
  id: string;
  template_id: string;
  name: string;
  description: string | null;
  category: 'single' | 'multi' | 'special';
  min_photos: number;
  max_photos: number;
  slots: LayoutSlot[];
  background: string | null;
  thumbnail_url: string | null;
  sort_order: number;
  is_enabled: boolean;
}

export interface DbCoverDesign {
  id: string;
  name: string;
  description: string | null;
  cover_type: 'front' | 'back' | 'spine';
  thumbnail_url: string | null;
  background: string;
  elements: CoverElement[];
  text_placeholders: Record<string, string>;
  sort_order: number;
  is_enabled: boolean;
}

export interface CoverElement {
  type: 'photo' | 'text' | 'qr';
  id: string;
  position: { x: number; y: number; width: number; height: number };
  style?: Record<string, unknown>;
}

export interface DbPricing {
  id: string;
  name: string;
  pricing_type: 'markup' | 'shipping' | 'discount' | 'addon';
  markup_percentage: number | null;
  region: string | null;
  flat_rate: number | null;
  per_item_rate: number | null;
  free_threshold: number | null;
  discount_code: string | null;
  discount_percentage: number | null;
  discount_amount: number | null;
  is_enabled: boolean;
}

// ============================================================================
// PRODUCT OPERATIONS
// ============================================================================

/**
 * Fetch all enabled products from the database
 * Falls back to empty array if table doesn't exist
 */
export async function getEnabledProducts(): Promise<DbProduct[]> {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('photobook_products')
      .select('*')
      .eq('is_enabled', true)
      .order('sort_order', { ascending: true });
    
    if (error) {
      console.warn('Could not fetch photobook products:', error.message);
      return [];
    }
    
    return data || [];
  } catch {
    console.warn('photobook_products table may not exist yet');
    return [];
  }
}

/**
 * Get a product by slug
 */
export async function getProductBySlug(slug: string): Promise<DbProduct | null> {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('photobook_products')
      .select('*')
      .eq('slug', slug)
      .eq('is_enabled', true)
      .single();
    
    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

// ============================================================================
// TEMPLATE OPERATIONS
// ============================================================================

/**
 * Fetch all enabled templates from the database
 * Falls back to code-based templates if table doesn't exist
 */
export async function getEnabledTemplates(): Promise<LayoutTemplate[]> {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('photobook_templates')
      .select('*')
      .eq('is_enabled', true)
      .order('category', { ascending: true })
      .order('sort_order', { ascending: true });
    
    if (error) {
      console.warn('Could not fetch photobook templates:', error.message);
      return LAYOUT_TEMPLATES; // Fall back to code-based templates
    }
    
    if (!data || data.length === 0) {
      return LAYOUT_TEMPLATES; // Fall back if no data
    }
    
    // Convert DB format to LayoutTemplate format
    return data.map((t: DbTemplate): LayoutTemplate => ({
      id: t.template_id,
      name: t.name,
      description: t.description || '',
      category: t.category,
      minPhotos: t.min_photos,
      maxPhotos: t.max_photos,
      slots: t.slots,
      background: t.background || undefined,
      thumbnail: t.thumbnail_url || `/templates/${t.template_id}.svg`,
    }));
  } catch {
    console.warn('photobook_templates table may not exist yet');
    return LAYOUT_TEMPLATES;
  }
}

/**
 * Get templates by category
 */
export async function getTemplatesByCategory(): Promise<{
  single: LayoutTemplate[];
  multi: LayoutTemplate[];
  special: LayoutTemplate[];
}> {
  const templates = await getEnabledTemplates();
  
  return {
    single: templates.filter(t => t.category === 'single'),
    multi: templates.filter(t => t.category === 'multi'),
    special: templates.filter(t => t.category === 'special'),
  };
}

/**
 * Get a template by ID
 */
export async function getTemplateById(templateId: string): Promise<LayoutTemplate | null> {
  const templates = await getEnabledTemplates();
  return templates.find(t => t.id === templateId) || null;
}

// ============================================================================
// COVER DESIGN OPERATIONS
// ============================================================================

/**
 * Fetch all enabled cover designs
 */
export async function getEnabledCoverDesigns(): Promise<DbCoverDesign[]> {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('photobook_cover_designs')
      .select('*')
      .eq('is_enabled', true)
      .order('cover_type', { ascending: true })
      .order('sort_order', { ascending: true });
    
    if (error) {
      console.warn('Could not fetch cover designs:', error.message);
      return [];
    }
    
    return data || [];
  } catch {
    console.warn('photobook_cover_designs table may not exist yet');
    return [];
  }
}

/**
 * Get cover designs by type
 */
export async function getCoverDesignsByType(coverType: 'front' | 'back' | 'spine'): Promise<DbCoverDesign[]> {
  const covers = await getEnabledCoverDesigns();
  return covers.filter(c => c.cover_type === coverType);
}

// ============================================================================
// PRICING OPERATIONS
// ============================================================================

/**
 * Get the current markup percentage (default 30%)
 */
export async function getMarkupPercentage(): Promise<number> {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('photobook_pricing')
      .select('markup_percentage')
      .eq('pricing_type', 'markup')
      .eq('is_enabled', true)
      .single();
    
    if (error || !data) {
      return 30; // Default 30% markup
    }
    
    return data.markup_percentage || 30;
  } catch {
    return 30;
  }
}

/**
 * Get shipping rate for a region
 */
export async function getShippingRate(region: string): Promise<{
  flatRate: number;
  perItemRate: number;
  freeThreshold: number | null;
} | null> {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('photobook_pricing')
      .select('flat_rate, per_item_rate, free_threshold')
      .eq('pricing_type', 'shipping')
      .eq('region', region)
      .eq('is_enabled', true)
      .single();
    
    if (error || !data) return null;
    
    return {
      flatRate: data.flat_rate || 0,
      perItemRate: data.per_item_rate || 0,
      freeThreshold: data.free_threshold,
    };
  } catch {
    return null;
  }
}

/**
 * Validate and apply a discount code
 */
export async function validateDiscountCode(code: string): Promise<{
  valid: boolean;
  discountPercentage?: number;
  discountAmount?: number;
  minOrderValue?: number;
} | null> {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('photobook_pricing')
      .select('*')
      .eq('pricing_type', 'discount')
      .eq('discount_code', code.toUpperCase())
      .eq('is_enabled', true)
      .single();
    
    if (error || !data) {
      return { valid: false };
    }
    
    // Check max uses
    if (data.max_uses && data.current_uses >= data.max_uses) {
      return { valid: false };
    }
    
    // Check validity dates
    const now = new Date();
    if (data.valid_from && new Date(data.valid_from) > now) {
      return { valid: false };
    }
    if (data.valid_until && new Date(data.valid_until) < now) {
      return { valid: false };
    }
    
    return {
      valid: true,
      discountPercentage: data.discount_percentage || undefined,
      discountAmount: data.discount_amount || undefined,
      minOrderValue: data.min_order_value || undefined,
    };
  } catch {
    return { valid: false };
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate final price for a photobook
 */
export async function calculatePhotobookPrice(
  basePrice: number,
  pricePerPage: number,
  pageCount: number,
  discountCode?: string
): Promise<{
  subtotal: number;
  markup: number;
  discount: number;
  total: number;
}> {
  // Base calculation
  const additionalPages = Math.max(0, pageCount - 24); // 24 pages included in base
  const subtotal = basePrice + (additionalPages * pricePerPage);
  
  // Get markup
  const markupPercent = await getMarkupPercentage();
  const markup = subtotal * (markupPercent / 100);
  
  // Apply discount if provided
  let discount = 0;
  if (discountCode) {
    const discountResult = await validateDiscountCode(discountCode);
    if (discountResult?.valid) {
      if (discountResult.discountPercentage) {
        discount = (subtotal + markup) * (discountResult.discountPercentage / 100);
      } else if (discountResult.discountAmount) {
        discount = discountResult.discountAmount;
      }
    }
  }
  
  const total = subtotal + markup - discount;
  
  return {
    subtotal,
    markup,
    discount,
    total: Math.max(0, total),
  };
}
