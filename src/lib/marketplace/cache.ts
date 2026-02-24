/**
 * Marketplace Cache Utility
 * Simple in-memory cache for marketplace product listings with provider-specific TTLs
 */

import { DEFAULT_CACHE_DURATIONS, type ProductProvider } from './types';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // TTL in milliseconds
}

const cache = new Map<string, CacheEntry<unknown>>();

/**
 * Generate a cache key for a provider and query
 */
export function generateCacheKey(provider: ProductProvider, ...parts: (string | undefined)[]): string {
  const validParts = parts.filter((p): p is string => !!p);
  return `marketplace:${provider}:${validParts.join(':')}`;
}

/**
 * Get cached data for a provider
 */
export function getMarketplaceCache<T>(provider: ProductProvider, key: string): T | null {
  const cacheKey = generateCacheKey(provider, key);
  const entry = cache.get(cacheKey) as CacheEntry<T> | undefined;
  
  if (!entry) return null;
  
  // Check if expired
  if (Date.now() - entry.timestamp > entry.ttl) {
    cache.delete(cacheKey);
    return null;
  }
  
  return entry.data;
}

/**
 * Set cached data for a provider with provider-specific TTL
 */
export function setMarketplaceCache<T>(
  provider: ProductProvider,
  key: string,
  data: T
): void {
  const ttlSeconds = DEFAULT_CACHE_DURATIONS[provider] || 3600;
  const cacheKey = generateCacheKey(provider, key);
  
  cache.set(cacheKey, {
    data,
    timestamp: Date.now(),
    ttl: ttlSeconds * 1000, // Convert to milliseconds
  });
}

/**
 * Invalidate cache for a specific provider
 */
export function invalidateProviderCache(provider: ProductProvider): void {
  const prefix = `marketplace:${provider}:`;
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}

/**
 * Invalidate all marketplace cache
 */
export function invalidateAllMarketplaceCache(): void {
  for (const key of cache.keys()) {
    if (key.startsWith('marketplace:')) {
      cache.delete(key);
    }
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { total: number; byProvider: Record<string, number> } {
  const stats: { total: number; byProvider: Record<string, number> } = {
    total: 0,
    byProvider: {},
  };
  
  for (const key of cache.keys()) {
    if (key.startsWith('marketplace:')) {
      stats.total++;
      const provider = key.split(':')[1];
      stats.byProvider[provider] = (stats.byProvider[provider] || 0) + 1;
    }
  }
  
  return stats;
}
