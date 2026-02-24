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
    <div className="min-h-screen bg-[#F2F1E5]">
      {/* Header Section */}
      <div className="relative bg-white border-b border-[#406A56]/10">
        {/* Warm gradient background */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            background: 'linear-gradient(135deg, #F2F1E5 0%, #FAF7E8 50%, #F5EFE0 100%)',
          }}
        />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Title and cart */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-playfair text-3xl md:text-4xl font-bold text-[#2d2d2d] mb-2">
                Keepsakes & Gifts
              </h1>
              <p className="text-gray-600 font-handwritten text-lg">
                Thoughtful gifts to accompany your messages
              </p>
            </div>
            
            {/* Cart button */}
            <button className="relative p-3 bg-white rounded-xl shadow-sm border border-[#406A56]/10 hover:shadow-md transition-shadow">
              <ShoppingBag size={24} className="text-[#406A56]" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#C35F33] text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>

          {/* Search bar */}
          <div className="relative max-w-2xl">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for flowers, gifts, or personalized prints..."
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-[#406A56]/20 rounded-xl text-[#2d2d2d] placeholder:text-gray-400 focus:outline-none focus:border-[#406A56] focus:ring-2 focus:ring-[#406A56]/10 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Provider Tabs - Mobile */}
      <div className="lg:hidden bg-white border-b border-[#406A56]/10 px-4 py-3">
        <ProviderTabs
          activeProvider={activeProvider}
          onChange={setActiveProvider}
          counts={providerCounts}
          variant="pills"
        />
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-8">
          {/* Sidebar - Desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24">
              {/* Provider Cards */}
              <div className="mb-6">
                <h2 className="font-handwritten text-xl text-[#406A56] mb-3">Browse By</h2>
                <ProviderTabs
                  activeProvider={activeProvider}
                  onChange={(provider) => {
                    setActiveProvider(provider);
                    setSelectedCategory(undefined);
                  }}
                  counts={providerCounts}
                  variant="cards"
                />
              </div>

              {/* Category Sidebar */}
              <div className="bg-white rounded-2xl border border-[#406A56]/10 p-4 shadow-sm">
                <CategorySidebar
                  selectedCategory={selectedCategory}
                  onSelectCategory={setSelectedCategory}
                  activeProvider={activeProvider}
                />
              </div>
            </div>
          </aside>

          {/* Product Grid */}
          <main className="flex-1 min-w-0">
            {/* Filter bar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <h2 className="font-playfair text-xl font-semibold text-[#2d2d2d]">
                  {searchQuery ? 'Search Results' : selectedCategory ? 'Category' : 'All Products'}
                </h2>
                <span className="text-sm text-gray-500">
                  {filteredProducts.length} items
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Mobile filter button */}
                <button
                  onClick={() => setIsMobileFilterOpen(true)}
                  className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white border border-[#406A56]/20 rounded-lg text-sm font-medium text-[#406A56] hover:bg-[#406A56]/5 transition-colors"
                >
                  <SlidersHorizontal size={16} />
                  Filters
                </button>

                {/* Clear filters */}
                {(activeProvider !== 'all' || selectedCategory || searchQuery) && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-[#406A56] transition-colors"
                  >
                    <X size={14} />
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Category chips - Mobile */}
            <div className="lg:hidden mb-4">
              <CategoryChips
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                activeProvider={activeProvider}
              />
            </div>

            {/* Active filters */}
            {(activeProvider !== 'all' || selectedCategory) && (
              <div className="flex flex-wrap items-center gap-2 mb-6">
                {activeProvider !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#406A56]/10 text-[#406A56] rounded-full text-sm">
                    {activeProvider.charAt(0).toUpperCase() + activeProvider.slice(1)}
                    <button
                      onClick={() => setActiveProvider('all')}
                      className="ml-1 p-0.5 hover:bg-[#406A56]/20 rounded-full"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}
                {selectedCategory && (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#C35F33]/10 text-[#C35F33] rounded-full text-sm">
                    {selectedCategory.replace(/-/g, ' ')}
                    <button
                      onClick={() => setSelectedCategory(undefined)}
                      className="ml-1 p-0.5 hover:bg-[#C35F33]/20 rounded-full"
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
              columns={3}
              onAddToCart={handleAddToCart}
              onToggleFavorite={handleToggleFavorite}
              favoriteIds={favorites}
              emptyState={{
                title: 'No products found',
                description: 'Try adjusting your filters or search for something else.',
                action: (
                  <button
                    onClick={clearFilters}
                    className="px-6 py-2 bg-[#406A56] text-white rounded-xl font-medium hover:bg-[#355a48] transition-colors"
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
