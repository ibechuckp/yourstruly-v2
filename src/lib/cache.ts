/**
 * Simple in-memory cache for dashboard widgets
 * Persists across route changes within the same session
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
}

const cache = new Map<string, CacheEntry<unknown>>()

// Default cache duration: 5 minutes
const DEFAULT_TTL = 5 * 60 * 1000

export function getCache<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined
  if (!entry) return null
  
  // Check if expired
  if (Date.now() - entry.timestamp > DEFAULT_TTL) {
    cache.delete(key)
    return null
  }
  
  return entry.data
}

export function setCache<T>(key: string, data: T): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  })
}

export function invalidateCache(key: string): void {
  cache.delete(key)
}

export function invalidateCachePrefix(prefix: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key)
    }
  }
}

// Cache keys
export const CACHE_KEYS = {
  CONTACTS: 'contacts',
  CONTACTS_COUNT: 'contacts_count',
  PROFILE: 'profile',
  STATS: 'stats',
  MEMORIES: 'memories',
  ON_THIS_DAY: 'on_this_day',
} as const
