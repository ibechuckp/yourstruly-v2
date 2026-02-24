/**
 * Prodigi API Service
 * Print-on-demand and fulfillment integration
 * API Documentation: https://www.prodigi.com/print-api/docs/
 * Authentication: X-API-Key header
 * 
 * NOTE: Prodigi is fulfillment-only - we provide PDF/images, they print
 * Key products: photobooks (soft/hard cover), wall art, canvas, calendars, cards, posters
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

// Prodigi API configuration
const PRODIGI_API_URL = process.env.PRODIGI_SANDBOX === 'true'
  ? 'https://api.sandbox.prodigi.com/v4'
  : 'https://api.prodigi.com/v4';

// Prodigi product structure
interface ProdigiProduct {
  id: string;
  name: string;
  description: string;
  productCategory: string;
  featured?: boolean;
  image: {
    url: string;
    description?: string;
  };
  dummyPrice?: {
    amount: string;
    currency: string;
  };
  variants: ProdigiVariant[];
  contentLayers: {
    name: string;
    fileName: string;
    pages: number;
    spotColourPages?: number;
    position?: {
      x: number;
      y: number;
      width: number;
      height: number;
      rotation: number;
    };
  }[];
  supportedDestinations?: {
    name: string;
    isoCode: string;
  }[];
  creationParameters?: {
    type: string;
    description: string;
    required: boolean;
  }[];
}

interface ProdigiVariant {
  id: string;
  name: string;
  label: string;
  sku: string;
  image: {
    url: string;
  };
  shipments?: {
    carrier: {
      name: string;
      service: string;
    };
    fulfillmentLocation: {
      countryCode: string;
      labCode: string;
    };
    cost: {
      amount: string;
      currency: string;
    };
  }[];
  attributes: {
    size?: string;
    color?: string;
    paperType?: string;
    finish?: string;
    orientation?: string;
    coverType?: string; // 'Softcover' | 'Hardcover'
    pageCount?: number;
  };
  price?: {
    amount: string;
    currency: string;
  };
  size?: {
    width: number;
    height: number;
    units: string;
  };
}

interface ProdigiShippingOption {
  courier: string;
  service: string;
  estimate: {
    minDays: number;
    maxDays: number;
  };
  cost: {
    amount: string;
    currency: string;
  };
}

interface ProdigiQuotation {
  shipmentOptions: ProdigiShippingOption[];
  items: {
    sku: string;
    copies: number;
    unitPrice: {
      amount: string;
      currency: string;
    };
  }[];
  totalCost: {
    amount: string;
    currency: string;
  };
}

interface ProdigiOrderResponse {
  order: {
    id: string;
    status: {
      stage: string;
      issues?: {
        objectId: string;
        errorCode: string;
        description: string;
      }[];
    };
    costs: {
      shipping: {
        amount: string;
        currency: string;
      };
      products: {
        amount: string;
        currency: string;
      };
      total: {
        amount: string;
        currency: string;
      };
    };
    shipments: {
      id: string;
      carrier: {
        name: string;
        service: string;
      };
      tracking?: {
        number: string;
        url: string;
      };
      items: {
        sku: string;
        copies: number;
      }[];
    }[];
  };
}

// Product category mapping
const PRODIGI_CATEGORIES: Category[] = [
  { id: 'photobooks', name: 'Photobooks' },
  { id: 'wall-art', name: 'Wall Art' },
  { id: 'canvas', name: 'Canvas Prints' },
  { id: 'calendars', name: 'Calendars' },
  { id: 'cards', name: 'Cards' },
  { id: 'posters', name: 'Posters' },
  { id: 'apparel', name: 'Apparel' },
  { id: 'home', name: 'Home & Living' },
];

/**
 * Get API headers with X-API-Key
 */
function getApiHeaders(): Record<string, string> {
  const apiKey = process.env.PRODIGI_API_KEY;
  
  if (!apiKey) {
    throw new Error('Prodigi API key not configured');
  }
  
  return {
    'X-API-Key': apiKey,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
}

/**
 * Convert Prodigi product to unified Product type
 */
function normalizeProduct(pProduct: ProdigiProduct): Product {
  // Get base price from first variant or dummy price
  const baseVariant = pProduct.variants?.[0];
  const price = baseVariant?.price?.amount 
    ? parseFloat(baseVariant.price.amount)
    : pProduct.dummyPrice?.amount 
      ? parseFloat(pProduct.dummyPrice.amount)
      : 0;
  
  const currency = baseVariant?.price?.currency || pProduct.dummyPrice?.currency || 'USD';
  
  // Map category
  const categoryMap: Record<string, string> = {
    'photobooks': 'photobooks',
    'photobook': 'photobooks',
    'wall-art': 'wall-art',
    'canvas': 'canvas',
    'calendars': 'calendars',
    'calendar': 'calendars',
    'cards': 'cards',
    'greeting-cards': 'cards',
    'posters': 'posters',
    'poster': 'posters',
    'apparel': 'apparel',
    'clothing': 'apparel',
    'home': 'home',
    'home-and-living': 'home',
  };
  
  return {
    id: pProduct.id,
    name: pProduct.name,
    description: pProduct.description,
    price: price,
    currency: currency,
    images: [pProduct.image?.url].filter(Boolean) as string[],
    thumbnail: pProduct.image?.url,
    provider: 'prodigi',
    category: categoryMap[pProduct.productCategory?.toLowerCase()] || pProduct.productCategory,
    inStock: pProduct.variants && pProduct.variants.length > 0,
    providerData: {
      productCategory: pProduct.productCategory,
      contentLayers: pProduct.contentLayers,
      supportedDestinations: pProduct.supportedDestinations,
      creationParameters: pProduct.creationParameters,
      variantCount: pProduct.variants?.length || 0,
    },
  };
}

/**
 * Convert Prodigi product detail to unified Product with variants
 */
function normalizeProductDetail(pProduct: ProdigiProduct): Product {
  const baseProduct = normalizeProduct(pProduct);
  
  // Add variants
  if (pProduct.variants && pProduct.variants.length > 0) {
    baseProduct.variants = pProduct.variants.map((variant): ProductVariant => {
      return {
        id: variant.id,
        name: variant.name || variant.label,
        price: variant.price?.amount ? parseFloat(variant.price.amount) : baseProduct.price,
        sku: variant.sku,
        attributes: variant.attributes || {},
        inStock: true, // Prodigi variants are typically in stock
        image: variant.image?.url,
      };
    });
  }
  
  return baseProduct;
}

/**
 * Get categories from Prodigi
 * Returns predefined categories as Prodigi doesn't have a dedicated categories endpoint
 */
export async function getCategories(): Promise<Category[]> {
  const cacheKey = 'categories';
  
  // Try cache first
  let categories = getMarketplaceCache<Category[]>('prodigi', cacheKey);
  
  if (!categories) {
    categories = PRODIGI_CATEGORIES;
    setMarketplaceCache('prodigi', cacheKey, categories);
  }
  
  return categories;
}

/**
 * Get products from Prodigi
 * Uses the /products endpoint
 */
export async function getProducts(
  categoryId?: string,
  page: number = 1,
  perPage: number = 50
): Promise<PaginatedProducts> {
  const cacheKey = `products:${categoryId || 'all'}:${page}`;
  
  // Try cache first
  let result = getMarketplaceCache<PaginatedProducts>('prodigi', cacheKey);
  
  if (!result) {
    const url = new URL(`${PRODIGI_API_URL}/products`);
    url.searchParams.append('offset', ((page - 1) * perPage).toString());
    url.searchParams.append('limit', perPage.toString());
    
    if (categoryId) {
      url.searchParams.append('category', categoryId);
    }
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: getApiHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Prodigi products API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    const rawProducts: ProdigiProduct[] = data.products || [];
    const total = data.total || rawProducts.length;
    
    result = {
      products: rawProducts.map(normalizeProduct),
      total,
      page,
      perPage,
      hasMore: page * perPage < total,
    };
    
    setMarketplaceCache('prodigi', cacheKey, result);
  }
  
  return result;
}

/**
 * Get product details by ID
 */
export async function getProductDetails(productId: string): Promise<Product | null> {
  const cacheKey = `product:${productId}`;
  
  let product = getMarketplaceCache<Product>('prodigi', cacheKey);
  
  if (!product) {
    const url = `${PRODIGI_API_URL}/products/${productId}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getApiHeaders(),
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Prodigi product details API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.product) {
      return null;
    }
    
    product = normalizeProductDetail(data.product);
    setMarketplaceCache('prodigi', cacheKey, product);
  }
  
  return product;
}

/**
 * Estimate order costs for Prodigi products
 * Includes product costs and shipping options
 */
export async function estimateOrder(
  items: ShippingItem[],
  address: ShippingAddress
): Promise<{
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  currency: string;
  rates: ShippingRate[];
}> {
  const url = `${PRODIGI_API_URL}/quotes`;
  
  const body = {
    shippingMethod: 'standard',
    destinationCountryCode: address.countryCode,
    destinationPostcode: address.zip,
    items: items.map(item => ({
      sku: item.variantId || item.productId,
      copies: item.quantity,
      attributes: item.attributes || {},
    })),
  };
  
  const response = await fetch(url, {
    method: 'POST',
    headers: getApiHeaders(),
    body: JSON.stringify(body),
  });
  
  if (!response.ok) {
    throw new Error(`Prodigi quote API error: ${response.status}`);
  }
  
  const data = await response.json();
  const quotation: ProdigiQuotation = data.quotation;
  
  // Convert shipping options to rates
  const rates: ShippingRate[] = quotation.shipmentOptions.map((option): ShippingRate => ({
    id: `${option.courier}-${option.service}`,
    name: `${option.courier} ${option.service}`,
    price: parseFloat(option.cost.amount),
    currency: option.cost.currency,
    minDays: option.estimate.minDays,
    maxDays: option.estimate.maxDays,
    provider: 'prodigi',
  }));
  
  // Get cheapest shipping
  const cheapestShipping = rates.length > 0 
    ? Math.min(...rates.map(r => r.price))
    : 0;
  
  const currency = quotation.totalCost.currency;
  const subtotal = parseFloat(quotation.totalCost.amount) - cheapestShipping;
  
  return {
    subtotal,
    shipping: cheapestShipping,
    tax: 0, // Prodigi includes tax in their pricing
    total: parseFloat(quotation.totalCost.amount),
    currency,
    rates,
  };
}

/**
 * Create a Prodigi order
 * Requires PDF/image assets to be provided for fulfillment
 */
export async function createOrder(params: {
  items: {
    sku: string;
    copies: number;
    assets: {
      printArea: string;
      url: string;
      md5Hash?: string;
      filename?: string;
    }[];
    attributes?: Record<string, unknown>;
  }[];
  recipient: {
    name: string;
    address: {
      line1: string;
      line2?: string;
      townOrCity: string;
      stateOrCounty?: string;
      postalOrZipCode: string;
      countryCode: string;
    };
    email?: string;
    phoneNumber?: string;
  };
  shippingMethod?: 'standard' | 'express' | 'overnight';
  merchantReference?: string;
  idempotencyKey?: string;
}): Promise<ProdigiOrderResponse['order']> {
  const url = `${PRODIGI_API_URL}/orders`;
  
  const body = {
    shippingMethod: params.shippingMethod || 'standard',
    recipient: params.recipient,
    items: params.items.map(item => ({
      sku: item.sku,
      copies: item.copies,
      assets: item.assets.map(asset => ({
        printArea: asset.printArea,
        url: asset.url,
        md5Hash: asset.md5Hash,
        filename: asset.filename,
      })),
      attributes: item.attributes,
    })),
    merchantReference: params.merchantReference,
  };
  
  const headers = getApiHeaders();
  
  // Add idempotency key if provided
  if (params.idempotencyKey) {
    headers['Idempotency-Key'] = params.idempotencyKey;
  }
  
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Prodigi order API error: ${response.status} - ${errorData.message || 'Unknown error'}`);
  }
  
  const data: ProdigiOrderResponse = await response.json();
  return data.order;
}

/**
 * Get order status from Prodigi
 */
export async function getOrderStatus(orderId: string): Promise<{
  id: string;
  status: string;
  issues?: unknown[];
  tracking?: {
    number: string;
    url: string;
  }[];
}> {
  const url = `${PRODIGI_API_URL}/orders/${orderId}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: getApiHeaders(),
  });
  
  if (!response.ok) {
    throw new Error(`Prodigi order status API error: ${response.status}`);
  }
  
  const data: ProdigiOrderResponse = await response.json();
  
  return {
    id: data.order.id,
    status: data.order.status.stage,
    issues: data.order.status.issues,
    tracking: data.order.shipments
      ?.filter(s => s.tracking)
      .map(s => ({
        number: s.tracking!.number,
        url: s.tracking!.url,
      })),
  };
}

/**
 * Validate that assets meet Prodigi requirements
 * Returns validation results for each asset
 */
export async function validateAssets(
  productId: string,
  variantId: string,
  assets: {
    printArea: string;
    url: string;
  }[]
): Promise<{
  valid: boolean;
  errors?: {
    printArea: string;
    error: string;
  }[];
}> {
  // Get product details to check content layer requirements
  const product = await getProductDetails(productId);
  
  if (!product) {
    return { valid: false, errors: [{ printArea: 'general', error: 'Product not found' }] };
  }
  
  const contentLayers = product.providerData?.contentLayers as Array<{
    name: string;
    fileName: string;
  }>;
  
  if (!contentLayers || contentLayers.length === 0) {
    return { valid: true };
  }
  
  const requiredPrintAreas = contentLayers.map(layer => layer.name);
  const providedPrintAreas = assets.map(a => a.printArea);
  
  const missing = requiredPrintAreas.filter(
    required => !providedPrintAreas.includes(required)
  );
  
  if (missing.length > 0) {
    return {
      valid: false,
      errors: missing.map(m => ({
        printArea: m,
        error: `Missing required asset for print area: ${m}`,
      })),
    };
  }
  
  return { valid: true };
}

/**
 * Check if Prodigi API is configured
 */
export function isConfigured(): boolean {
  return !!process.env.PRODIGI_API_KEY;
}
