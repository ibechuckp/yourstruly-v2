import { useState, useEffect, useCallback } from 'react';
import { Product, ProviderType, GiftSelectionContext } from '@/types/marketplace';

interface UseMarketplaceProductsOptions {
  provider?: ProviderType | 'all';
  category?: string;
  search?: string;
  page?: number;
  perPage?: number;
  enabled?: boolean;
}

interface UseMarketplaceProductsReturn {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  total: number;
  refetch: () => void;
  loadMore: () => void;
}

// Map our ProviderType to API provider names
const providerMap: Record<ProviderType | 'all', string> = {
  flowers: 'floristone',
  gifts: 'spocket',
  prints: 'prodigi',
  all: 'all',
};

/**
 * Hook to fetch products from the marketplace API
 */
export function useMarketplaceProducts({
  provider = 'all',
  category,
  search,
  page = 1,
  perPage = 50,
  enabled = true,
}: UseMarketplaceProductsOptions): UseMarketplaceProductsReturn {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(page);

  const fetchProducts = useCallback(async (pageNum: number, append: boolean = false) => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      
      if (provider !== 'all') {
        params.append('provider', providerMap[provider]);
      }
      if (category) {
        params.append('category', category);
      }
      if (search) {
        params.append('search', search);
      }
      params.append('page', pageNum.toString());
      params.append('perPage', perPage.toString());

      const response = await fetch(`/api/marketplace/products?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch products');
      }

      const data = await response.json();
      
      if (provider === 'all' && data.featured) {
        // Flatten featured products from all providers
        const allProducts = data.featured.flatMap((p: { products: Product[] }) => p.products);
        setProducts(allProducts);
        setTotal(allProducts.length);
        setHasMore(false);
      } else {
        // Regular products response
        const newProducts = data.products || [];
        setProducts(prev => append ? [...prev, ...newProducts] : newProducts);
        setTotal(data.total || 0);
        setHasMore(data.hasMore || false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Marketplace fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [provider, category, search, perPage, enabled]);

  // Reset and fetch when filters change
  useEffect(() => {
    setCurrentPage(1);
    setProducts([]);
    fetchProducts(1, false);
  }, [provider, category, search, fetchProducts]);

  const refetch = useCallback(() => {
    setCurrentPage(1);
    fetchProducts(1, false);
  }, [fetchProducts]);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchProducts(nextPage, true);
    }
  }, [isLoading, hasMore, currentPage, fetchProducts]);

  return {
    products,
    isLoading,
    error,
    hasMore,
    total,
    refetch,
    loadMore,
  };
}

interface UseGiftSuggestionsOptions {
  context?: GiftSelectionContext;
  enabled?: boolean;
}

interface UseGiftSuggestionsReturn {
  suggestions: Product[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to get AI-powered gift suggestions based on context
 */
export function useGiftSuggestions({
  context,
  enabled = true,
}: UseGiftSuggestionsOptions): UseGiftSuggestionsReturn {
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !context?.eventType) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/marketplace/suggestions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ context }),
        });

        if (!response.ok) {
          // If suggestions API fails, fall back to featured products
          const featuredResponse = await fetch('/api/marketplace/products?featured=true&perProvider=6');
          if (featuredResponse.ok) {
            const data = await featuredResponse.json();
            const allProducts = data.featured?.flatMap((p: { products: Product[] }) => p.products) || [];
            setSuggestions(allProducts.slice(0, 6));
          }
          return;
        }

        const data = await response.json();
        setSuggestions(data.suggestions || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Gift suggestions error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, [context, enabled]);

  return {
    suggestions,
    isLoading,
    error,
  };
}

interface UseCategoriesOptions {
  provider?: ProviderType | 'all';
  enabled?: boolean;
}

interface UseCategoriesReturn {
  categories: { id: string; name: string; provider?: string }[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to fetch categories from marketplace providers
 */
export function useCategories({
  provider = 'all',
  enabled = true,
}: UseCategoriesOptions): UseCategoriesReturn {
  const [categories, setCategories] = useState<{ id: string; name: string; provider?: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const fetchCategories = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (provider !== 'all') {
          params.append('provider', providerMap[provider]);
        }

        const response = await fetch(`/api/marketplace/categories?${params}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch categories');
        }

        const data = await response.json();
        
        if (provider === 'all' && data.categories) {
          // Flatten categories from all providers
          const allCategories = data.categories.flatMap((c: { provider: string; categories: { id: string; name: string }[] }) =>
            c.categories.map((cat: { id: string; name: string }) => ({ ...cat, provider: c.provider }))
          );
          setCategories(allCategories);
        } else {
          setCategories(data.categories || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Categories fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, [provider, enabled]);

  return {
    categories,
    isLoading,
    error,
  };
}
