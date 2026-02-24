/**
 * Floristone API Service
 * Flower and gift product marketplace integration
 * API Documentation: https://www.floristone.com/api/
 */

import type {
  Product,
  PaginatedProducts,
  ShippingRate,
  ShippingAddress,
  ShippingItem,
} from '../types';
import { getMarketplaceCache, setMarketplaceCache } from '../cache';

// Floristone API configuration
const FLORISTONE_API_URL = 'https://www.floristone.com/api/rest/flowershop';

// Floristone category codes
export const FLORISTONE_CATEGORIES = {
  occasions: {
    bestSellers: 'bs',
    allOccasions: 'ao',
    birthday: 'bd',
    anniversary: 'an',
    loveRomance: 'lr',
    getWell: 'gw',
    newBaby: 'nb',
    thankYou: 'ty',
    sympathy: 'sy',
  },
  productTypes: {
    centerpieces: 'c',
    oneSided: 'o',
    vases: 'v',
    roses: 'r',
    mixedArrangements: 'x',
    plants: 'p',
    bouquets: 'b',
  },
  priceRanges: {
    under60: 'u60',
    sixtyToEighty: '60t80',
    eightyToHundred: '80t100',
    aboveHundred: 'a100',
  },
} as const;

interface FloristoneProduct {
  CODE: string;
  NAME: string;
  DESCRIPTION: string;
  PRICE: string;
  SMALL: string;
  LARGE: string;
  CATEGORY: string;
  APISERVICE: 'floristone';
}

interface FloristoneShippingRate {
  code: string;
  name: string;
  price: number;
}

/**
 * Get Basic Auth header for Floristone API
 */
function getAuthHeader(): string {
  const apiKey = process.env.FLORISTONE_API_KEY;
  const apiPass = process.env.FLORISTONE_API_PASSWORD;
  
  if (!apiKey || !apiPass) {
    throw new Error('Floristone API credentials not configured');
  }
  
  const credentials = Buffer.from(`${apiKey}:${apiPass}`).toString('base64');
  return `Basic ${credentials}`;
}

/**
 * Convert Floristone product to unified Product type
 */
function normalizeProduct(fProduct: FloristoneProduct): Product {
  return {
    id: fProduct.CODE,
    name: fProduct.NAME,
    description: fProduct.DESCRIPTION,
    price: parseFloat(fProduct.PRICE),
    currency: 'USD',
    images: [fProduct.LARGE],
    thumbnail: fProduct.SMALL,
    provider: 'floristone',
    category: fProduct.CATEGORY,
    inStock: true, // Floristone products are generally available
    providerData: {
      code: fProduct.CODE,
      apiService: fProduct.APISERVICE,
    },
  };
}

/**
 * Fetch products from Floristone API
 */
async function fetchFloristoneProducts(
  category?: string,
  search?: string
): Promise<FloristoneProduct[]> {
  const url = new URL(`${FLORISTONE_API_URL}/getproducts`);
  
  if (category) {
    url.searchParams.append('category', category);
  }
  
  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Authorization': getAuthHeader(),
      'Accept': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Floristone API error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  
  // Handle different response formats
  let products: FloristoneProduct[] = [];
  if (Array.isArray(data)) {
    products = data;
  } else if (data.products && Array.isArray(data.products)) {
    products = data.products;
  } else if (data.PRODUCTS && Array.isArray(data.PRODUCTS)) {
    products = data.PRODUCTS;
  }
  
  // Apply local search filtering if search term provided
  if (search && search.trim()) {
    const searchLower = search.toLowerCase();
    products = products.filter((p: FloristoneProduct) =>
      p.NAME?.toLowerCase().includes(searchLower) ||
      p.DESCRIPTION?.toLowerCase().includes(searchLower) ||
      p.CODE?.toLowerCase().includes(searchLower)
    );
  }
  
  return products.map((p: FloristoneProduct) => ({
    ...p,
    APISERVICE: 'floristone',
  }));
}

/**
 * Get products from Floristone
 * Caches results for 1 hour
 */
export async function getProducts(
  category?: string,
  search?: string,
  page: number = 1,
  perPage: number = 50
): Promise<PaginatedProducts> {
  const cacheKey = `products:${category || 'all'}:${search || 'all'}`;
  
  // Try cache first
  let products = getMarketplaceCache<Product[]>('floristone', cacheKey);
  
  if (!products) {
    const rawProducts = await fetchFloristoneProducts(category, search);
    products = rawProducts.map(normalizeProduct);
    setMarketplaceCache('floristone', cacheKey, products);
  }
  
  // Paginate
  const total = products.length;
  const start = (page - 1) * perPage;
  const end = start + perPage;
  const paginatedProducts = products.slice(start, end);
  
  return {
    products: paginatedProducts,
    total,
    page,
    perPage,
    hasMore: end < total,
  };
}

/**
 * Get product details by code
 * Note: Floristone doesn't have a specific "get product by ID" endpoint,
 * so we fetch all and filter (with caching)
 */
export async function getProductDetails(code: string): Promise<Product | null> {
  const cacheKey = `product:${code}`;
  
  // Try cache first
  let product = getMarketplaceCache<Product>('floristone', cacheKey);
  
  if (!product) {
    // Fetch all products and find the one we need
    // This is inefficient but Floristone API doesn't have a direct lookup
    const rawProducts = await fetchFloristoneProducts();
    const found = rawProducts.find((p: FloristoneProduct) => p.CODE === code);
    
    if (!found) {
      return null;
    }
    
    product = normalizeProduct(found);
    
    // Cache individual product
    setMarketplaceCache('floristone', cacheKey, product);
  }
  
  return product;
}

/**
 * Calculate shipping rates for Floristone products
 */
export async function calculateShipping(
  items: ShippingItem[],
  address: ShippingAddress
): Promise<ShippingRate[]> {
  // Floristone requires a separate API call per product for shipping
  // We'll make calls for each unique product
  const uniqueProducts = [...new Set(items.map(item => item.productId))];
  
  const shippingPromises = uniqueProducts.map(async (productId) => {
    const url = new URL(`${FLORISTONE_API_URL}/gettotal`);
    url.searchParams.append('products', productId);
    url.searchParams.append('zipcode', address.zip);
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': getAuthHeader(),
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Floristone shipping API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Parse shipping options from response
    // Floristone typically returns same-day and next-day options
    const rates: ShippingRate[] = [];
    
    if (data.SHIPPING && Array.isArray(data.SHIPPING)) {
      data.SHIPPING.forEach((ship: { CODE: string; PRICE: string }) => {
        const code = ship.CODE?.toLowerCase() || '';
        const price = parseFloat(ship.PRICE) || 0;
        
        if (code.includes('same') || code.includes('today')) {
          rates.push({
            id: `${productId}:same-day`,
            name: 'Same Day Delivery',
            description: 'Delivered today',
            price,
            currency: 'USD',
            minDays: 0,
            maxDays: 0,
            provider: 'floristone',
          });
        } else if (code.includes('next')) {
          rates.push({
            id: `${productId}:next-day`,
            name: 'Next Day Delivery',
            description: 'Delivered tomorrow',
            price,
            currency: 'USD',
            minDays: 1,
            maxDays: 1,
            provider: 'floristone',
          });
        }
      });
    }
    
    return rates;
  });
  
  const allRates = await Promise.all(shippingPromises);
  
  // Combine and deduplicate rates by name, taking highest price (worst case)
  const rateMap = new Map<string, ShippingRate>();
  
  allRates.flat().forEach(rate => {
    const existing = rateMap.get(rate.name);
    if (!existing || existing.price < rate.price) {
      rateMap.set(rate.name, rate);
    }
  });
  
  return Array.from(rateMap.values());
}

/**
 * Check if Floristone API is configured
 */
export function isConfigured(): boolean {
  return !!process.env.FLORISTONE_API_KEY && !!process.env.FLORISTONE_API_PASSWORD;
}
