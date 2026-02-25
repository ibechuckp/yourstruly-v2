/**
 * Spocket API Service
 * Curated dropship products from US/EU suppliers
 * Modern REST API with fast shipping options
 * 
 * Products: home decor, accessories, jewelry, toys, gifts
 * Default markup: 30%
 */

import type {
  Product,
  ProductVariant,
  Category,
  PaginatedProducts,
  ShippingRate,
  ShippingAddress,
  ShippingItem,
} from '../types';
import { getMarketplaceCache, setMarketplaceCache } from '../cache';

// Spocket API configuration
const SPOCKET_API_URL = 'https://api.spocket.co/v1';

// 30% markup on Spocket prices
const SPOCKET_MARKUP_RATE = 0.30;

// Spocket product structure
interface SpocketProduct {
  id: string;
  title: string;
  description: string;
  tags: string[];
  images: {
    id: string;
    src: string;
    position: number;
  }[];
  price: number;
  comparePrice?: number;
  currency: string;
  sku: string;
  inventory: number;
  supplier: {
    id: string;
    name: string;
    location: string;
    shippingFrom: string;
    processingTime: string;
  };
  variants?: SpocketVariant[];
  shipping?: {
    cost: number;
    timeMin: number;
    timeMax: number;
    countries: string[];
  }[];
  category: {
    id: string;
    name: string;
    parentId?: string;
  };
  collections?: string[];
  ratings?: {
    average: number;
    count: number;
  };
  isAvailable: boolean;
  updatedAt: string;
}

interface SpocketVariant {
  id: string;
  title: string;
  sku: string;
  price: number;
  comparePrice?: number;
  inventory: number;
  options: {
    name: string;
    value: string;
  }[];
  image?: string;
  isAvailable: boolean;
}

interface SpocketCategory {
  id: string;
  name: string;
  parentId?: string;
  productCount: number;
  subcategories?: SpocketCategory[];
}

interface SpocketShippingRate {
  countryCode: string;
  shippingCost: number;
  shippingTimeMin: number;
  shippingTimeMax: number;
  carrier: string;
}

interface SpocketPaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    perPage: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
  };
}

/**
 * Apply 30% markup to Spocket price
 */
function applyMarkup(price: number): number {
  return Math.round((price + price * SPOCKET_MARKUP_RATE) * 100) / 100;
}

/**
 * Get API headers with Bearer token
 */
function getApiHeaders(): Record<string, string> {
  const apiKey = process.env.SPOCKET_API_KEY;
  
  if (!apiKey) {
    throw new Error('Spocket API key not configured');
  }
  
  return {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
}

/**
 * Convert Spocket product to unified Product type
 */
function normalizeProduct(sProduct: SpocketProduct): Product {
  const originalPrice = sProduct.price;
  const markedUpPrice = applyMarkup(originalPrice);
  
  return {
    id: sProduct.id,
    name: sProduct.title,
    description: sProduct.description,
    price: markedUpPrice,
    originalPrice: originalPrice,
    comparePrice: sProduct.comparePrice,
    currency: sProduct.currency || 'USD',
    images: sProduct.images?.map(img => img.src) || [],
    thumbnail: sProduct.images?.[0]?.src,
    provider: 'spocket',
    category: sProduct.category?.id,
    subcategory: sProduct.category?.name,
    tags: sProduct.tags,
    inStock: sProduct.isAvailable && sProduct.inventory > 0,
    quantity: sProduct.inventory,
    providerData: {
      supplier: sProduct.supplier,
      sku: sProduct.sku,
      ratings: sProduct.ratings,
      shippingOptions: sProduct.shipping,
      updatedAt: sProduct.updatedAt,
    },
  };
}

/**
 * Convert Spocket product detail to unified Product with variants
 */
function normalizeProductDetail(sProduct: SpocketProduct): Product {
  const baseProduct = normalizeProduct(sProduct);
  
  // Add variants
  if (sProduct.variants && sProduct.variants.length > 0) {
    baseProduct.variants = sProduct.variants.map((variant): ProductVariant => {
      const originalPrice = variant.price;
      const markedUpPrice = applyMarkup(originalPrice);
      
      // Convert options array to attributes object
      const attributes: Record<string, string> = {};
      variant.options?.forEach(opt => {
        attributes[opt.name] = opt.value;
      });
      
      return {
        id: variant.id,
        name: variant.title,
        price: markedUpPrice,
        originalPrice: originalPrice,
        sku: variant.sku,
        attributes,
        inStock: variant.isAvailable && variant.inventory > 0,
        quantity: variant.inventory,
        image: variant.image,
      };
    });
  }
  
  return baseProduct;
}

/**
 * Convert Spocket category to unified Category type
 */
function normalizeCategory(sCategory: SpocketCategory, parentId?: string): Category {
  return {
    id: sCategory.id,
    name: sCategory.name,
    parentId: parentId || sCategory.parentId,
    children: sCategory.subcategories?.map(child => 
      normalizeCategory(child, sCategory.id)
    ),
  };
}

/**
 * Get categories from Spocket
 */
export async function getCategories(): Promise<Category[]> {
  const cacheKey = 'categories';
  
  // Try cache first
  let categories = getMarketplaceCache<Category[]>('spocket', cacheKey);
  
  if (!categories) {
    const url = `${SPOCKET_API_URL}/categories`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getApiHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Spocket categories API error: ${response.status} ${response.statusText}`);
    }
    
    const data: SpocketPaginatedResponse<SpocketCategory> = await response.json();
    const rawCategories: SpocketCategory[] = data.data || [];
    categories = rawCategories.map(cat => normalizeCategory(cat));
    
    setMarketplaceCache('spocket', cacheKey, categories);
  }
  
  return categories;
}

/**
 * Get products from Spocket
 * Supports category filtering and search
 */
export async function getProducts(
  categoryId?: string,
  searchQuery?: string,
  page: number = 1,
  perPage: number = 50
): Promise<PaginatedProducts> {
  const cacheKey = `products:${categoryId || 'all'}:${searchQuery || 'all'}:${page}`;
  
  // Try cache first
  let result = getMarketplaceCache<PaginatedProducts>('spocket', cacheKey);
  
  if (!result) {
    const url = new URL(`${SPOCKET_API_URL}/products`);
    url.searchParams.append('page', page.toString());
    url.searchParams.append('per_page', perPage.toString());
    
    if (categoryId) {
      url.searchParams.append('category_id', categoryId);
    }
    
    if (searchQuery) {
      url.searchParams.append('search', searchQuery);
    }
    
    // Filter for high-quality products
    url.searchParams.append('available', 'true');
    url.searchParams.append('min_inventory', '1');
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: getApiHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Spocket products API error: ${response.status} ${response.statusText}`);
    }
    
    const data: SpocketPaginatedResponse<SpocketProduct> = await response.json();
    const rawProducts: SpocketProduct[] = data.data || [];
    const pagination = data.pagination;
    
    result = {
      products: rawProducts.map(normalizeProduct),
      total: pagination?.totalItems || rawProducts.length,
      page,
      perPage,
      hasMore: pagination?.hasNextPage || page * perPage < (pagination?.totalItems || 0),
    };
    
    setMarketplaceCache('spocket', cacheKey, result);
  }
  
  return result;
}

/**
 * Get product details by ID
 */
export async function getProductDetails(productId: string): Promise<Product | null> {
  const cacheKey = `product:${productId}`;
  
  let product = getMarketplaceCache<Product>('spocket', cacheKey);
  
  if (!product) {
    const url = `${SPOCKET_API_URL}/products/${productId}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getApiHeaders(),
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Spocket product details API error: ${response.status}`);
    }
    
    const data: SpocketProduct = await response.json();
    
    if (!data) {
      return null;
    }
    
    product = normalizeProductDetail(data);
    setMarketplaceCache('spocket', cacheKey, product);
  }
  
  return product;
}

/**
 * Calculate shipping rates for Spocket products
 * Spocket provides shipping rates per product and destination
 */
export async function calculateShipping(
  items: ShippingItem[],
  address: ShippingAddress
): Promise<ShippingRate[]> {
  if (items.length === 0) {
    return [];
  }
  
  const url = `${SPOCKET_API_URL}/shipping/rates`;
  
  const body = {
    countryCode: address.countryCode,
    stateCode: address.stateCode,
    zipCode: address.zip,
    items: items.map(item => ({
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
    })),
  };
  
  const response = await fetch(url, {
    method: 'POST',
    headers: getApiHeaders(),
    body: JSON.stringify(body),
  });
  
  if (!response.ok) {
    throw new Error(`Spocket shipping API error: ${response.status}`);
  }
  
  const data: SpocketPaginatedResponse<SpocketShippingRate> = await response.json();
  const rawRates: SpocketShippingRate[] = data.data || [];
  
  // Calculate total shipping cost for all items
  const totalShippingCost = rawRates.reduce((sum, rate) => sum + rate.shippingCost, 0);
  
  // Get min/max delivery times
  const minDays = Math.min(...rawRates.map(r => r.shippingTimeMin));
  const maxDays = Math.max(...rawRates.map(r => r.shippingTimeMax));
  
  // Return a consolidated shipping rate
  return [{
    id: 'spocket-standard',
    name: 'Standard Shipping (US/EU)',
    price: totalShippingCost,
    currency: 'USD',
    minDays,
    maxDays,
    provider: 'spocket',
  }];
}

/**
 * Get shipping rates for a specific product
 * Useful for displaying shipping info on product pages
 */
export async function getProductShippingRates(
  productId: string,
  countryCode: string
): Promise<{
  cost: number;
  timeMin: number;
  timeMax: number;
  countries: string[];
}[]> {
  const cacheKey = `shipping:${productId}:${countryCode}`;
  
  let rates = getMarketplaceCache<{ cost: number; timeMin: number; timeMax: number; countries: string[] }[]>('spocket', cacheKey);
  
  if (!rates) {
    const url = new URL(`${SPOCKET_API_URL}/products/${productId}/shipping`);
    url.searchParams.append('country_code', countryCode);
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: getApiHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Spocket product shipping API error: ${response.status}`);
    }
    
    const data = await response.json();
    rates = data.shippingOptions || [];
    
    setMarketplaceCache('spocket', cacheKey, rates);
  }
  
  return rates || [];
}

/**
 * Import a product to the store
 * This adds the product to the user's Spocket import list
 */
export async function importProduct(productId: string): Promise<{
  success: boolean;
  importId?: string;
  message?: string;
}> {
  const url = `${SPOCKET_API_URL}/products/${productId}/import`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: getApiHeaders(),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    return {
      success: false,
      message: errorData.message || `Import failed: ${response.status}`,
    };
  }
  
  const data = await response.json();
  
  return {
    success: true,
    importId: data.importId,
    message: 'Product imported successfully',
  };
}

/**
 * Get trending products
 * Popular items with fast shipping from US/EU
 */
export async function getTrendingProducts(
  limit: number = 20
): Promise<Product[]> {
  const cacheKey = `trending:${limit}`;
  
  let products = getMarketplaceCache<Product[]>('spocket', cacheKey);
  
  if (!products) {
    const url = new URL(`${SPOCKET_API_URL}/products/trending`);
    url.searchParams.append('limit', limit.toString());
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: getApiHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Spocket trending API error: ${response.status}`);
    }
    
    const data: SpocketPaginatedResponse<SpocketProduct> = await response.json();
    products = (data.data || []).map(normalizeProduct);
    
    setMarketplaceCache('spocket', cacheKey, products);
  }
  
  return products;
}

/**
 * Get products by supplier location
 * Useful for filtering by US or EU suppliers for faster shipping
 */
export async function getProductsByLocation(
  location: 'US' | 'EU' | 'ALL',
  page: number = 1,
  perPage: number = 50
): Promise<PaginatedProducts> {
  const cacheKey = `location:${location}:${page}`;
  
  let result = getMarketplaceCache<PaginatedProducts>('spocket', cacheKey);
  
  if (!result) {
    const url = new URL(`${SPOCKET_API_URL}/products`);
    url.searchParams.append('page', page.toString());
    url.searchParams.append('per_page', perPage.toString());
    url.searchParams.append('shipping_from', location);
    url.searchParams.append('available', 'true');
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: getApiHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Spocket location API error: ${response.status}`);
    }
    
    const data: SpocketPaginatedResponse<SpocketProduct> = await response.json();
    const rawProducts: SpocketProduct[] = data.data || [];
    const pagination = data.pagination;
    
    result = {
      products: rawProducts.map(normalizeProduct),
      total: pagination?.totalItems || rawProducts.length,
      page,
      perPage,
      hasMore: pagination?.hasNextPage || page * perPage < (pagination?.totalItems || 0),
    };
    
    setMarketplaceCache('spocket', cacheKey, result);
  }
  
  return result;
}

/**
 * Check if Spocket API is configured
 */
export function isConfigured(): boolean {
  return !!process.env.SPOCKET_API_KEY;
}
