'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal, ShoppingBag, Heart, X } from 'lucide-react';
import ProductGrid from '@/components/marketplace/ProductGrid';
import ProviderTabs from '@/components/marketplace/ProviderTabs';
import CategorySidebar, { CategorySheet, CategoryChips } from '@/components/marketplace/CategorySidebar';
import { allProducts } from '@/components/marketplace/mockData';
import { ProviderType, Product } from '@/types/marketplace';

export default function MarketplacePage() {
  const [activeProvider, setActiveProvider] = useState<ProviderType | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [cartCount, setCartCount] = useState(0);

  // Filter products based on active filters
  const filteredProducts = useMemo(() => {
    let products = allProducts;

    // Filter by provider
    if (activeProvider !== 'all') {
      products = products.filter((p) => p.provider === activeProvider);
    }

    // Filter by category
    if (selectedCategory) {
      products = products.filter((p) => p.category === selectedCategory);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.tags?.some((t) => t.toLowerCase().includes(query))
      );
    }

    return products;
  }, [activeProvider, selectedCategory, searchQuery]);

  // Get product counts by provider
  const providerCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allProducts.length };
    (['flowers', 'gifts', 'prints'] as ProviderType[]).forEach((provider) => {
      counts[provider] = allProducts.filter((p) => p.provider === provider).length;
    });
    return counts;
  }, []);

  const handleAddToCart = (product: Product) => {
    setCartCount((prev) => prev + 1);
    // TODO: Implement actual cart logic
    console.log('Added to cart:', product.name);
  };

  const handleToggleFavorite = (productId: string) => {
    setFavorites((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const clearFilters = () => {
    setActiveProvider('all');
    setSelectedCategory(undefined);
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen relative z-10">
      {/* Header Section */}
      <div className="glass-warm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Title and cart */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-playfair text-3xl md:text-4xl font-bold text-white mb-2">
                Keepsakes & Gifts
              </h1>
              <p className="text-white/60 font-handwritten text-lg">
                Thoughtful gifts to accompany your messages
              </p>
            </div>
            
            {/* Cart button */}
            <button className="relative p-3 glass rounded-xl hover:bg-white/15 transition-colors">
              <ShoppingBag size={24} className="text-[#d4a574]" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#C35F33] text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>

          {/* Search bar */}
          <div className="relative max-w-2xl mb-6">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for flowers, gifts, or personalized prints..."
              className="w-full pl-12 pr-4 py-3.5 glass rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#d4a574]/30 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Horizontal Category Tabs */}
          <div className="flex flex-wrap gap-2">
            <ProviderTabs
              activeProvider={activeProvider}
              onChange={(provider) => {
                setActiveProvider(provider);
                setSelectedCategory(undefined);
              }}
              counts={providerCounts}
              variant="pills"
            />
          </div>
        </div>
      </div>

      {/* Horizontal Categories Bar */}
      <div className="glass-subtle border-b border-white/5 sticky top-14 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <CategoryChips
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            activeProvider={activeProvider}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-8">
          {/* No sidebar - categories are horizontal now */}

          {/* Product Grid - Full Width */}
          <main className="flex-1 min-w-0 w-full">
            {/* Filter bar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <h2 className="font-playfair text-xl font-semibold text-white">
                  {searchQuery ? 'Search Results' : selectedCategory ? selectedCategory.replace(/-/g, ' ') : 'All Products'}
                </h2>
                <span className="text-sm text-white/50">
                  {filteredProducts.length} items
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Clear filters */}
                {(activeProvider !== 'all' || selectedCategory || searchQuery) && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1 px-3 py-2 text-sm text-white/60 hover:text-white transition-colors"
                  >
                    <X size={14} />
                    Clear filters
                  </button>
                )}
              </div>
            </div>

            {/* Active filters */}
            {(activeProvider !== 'all' || selectedCategory) && (
              <div className="flex flex-wrap items-center gap-2 mb-6">
                {activeProvider !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 glass text-white rounded-full text-sm">
                    {activeProvider.charAt(0).toUpperCase() + activeProvider.slice(1)}
                    <button
                      onClick={() => setActiveProvider('all')}
                      className="ml-1 p-0.5 hover:bg-white/20 rounded-full"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}
                {selectedCategory && (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#d4a574]/20 text-[#d4a574] rounded-full text-sm">
                    {selectedCategory.replace(/-/g, ' ')}
                    <button
                      onClick={() => setSelectedCategory(undefined)}
                      className="ml-1 p-0.5 hover:bg-[#d4a574]/30 rounded-full"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}
              </div>
            )}

            {/* Products */}
            <ProductGrid
              products={filteredProducts}
              variant="polaroid"
              columns={4}
              onAddToCart={handleAddToCart}
              onToggleFavorite={handleToggleFavorite}
              favoriteIds={favorites}
              emptyState={{
                title: 'No products found',
                description: 'Try adjusting your filters or search for something else.',
                action: (
                  <button
                    onClick={clearFilters}
                    className="px-6 py-2 bg-[#d4a574] text-[#1a1512] rounded-xl font-medium hover:bg-[#c9886d] transition-colors"
                  >
                    Clear all filters
                  </button>
                ),
              }}
            />
          </main>
        </div>
      </div>

      {/* Mobile Filter Sheet */}
      <CategorySheet
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          setIsMobileFilterOpen(false);
        }}
        activeProvider={activeProvider}
      />
    </div>
  );
}
