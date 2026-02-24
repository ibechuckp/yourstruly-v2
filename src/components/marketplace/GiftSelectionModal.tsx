'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Gift, Sparkles, Filter, ShoppingBag, Check } from 'lucide-react';
import { createPortal } from 'react-dom';
import { Product, ProviderType, GiftSelectionContext } from '@/types/marketplace';
import { allProducts, giftRecommendations } from './mockData';
import ProductCard from './ProductCard';
import ProviderTabs from './ProviderTabs';
import { CategoryChips } from './CategorySidebar';

interface GiftSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGift: (product: Product) => void;
  context?: GiftSelectionContext;
  title?: string;
  maxWidth?: string;
}

export default function GiftSelectionModal({
  isOpen,
  onClose,
  onSelectGift,
  context,
  title = 'Select a Gift',
  maxWidth = 'max-w-5xl',
}: GiftSelectionModalProps) {
  const [activeProvider, setActiveProvider] = useState<ProviderType | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);

  // Get recommendations based on context
  const recommendations = useMemo(() => {
    if (!context?.eventType) return [];
    return giftRecommendations[context.eventType] || [];
  }, [context?.eventType]);

  // Filter products
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

    // Filter by budget if provided
    if (context?.budget) {
      products = products.filter(
        (p) => p.price >= context.budget!.min && p.price <= context.budget!.max
      );
    }

    return products;
  }, [activeProvider, selectedCategory, searchQuery, context?.budget]);

  const handleToggleFavorite = (productId: string) => {
    setFavorites((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleConfirmSelection = () => {
    if (selectedProduct) {
      onSelectGift(selectedProduct);
      onClose();
    }
  };

  if (!isOpen) return null;

  const modal = (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />

      {/* Modal content */}
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={`relative w-full ${maxWidth} max-h-[90vh] sm:max-h-[85vh] bg-[#F2F1E5] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#406A56]/10 bg-white/50">
          <div>
            <h3 className="font-playfair text-xl font-semibold text-[#2d2d2d] flex items-center gap-2">
              <Gift size={22} className="text-[#406A56]" />
              {title}
            </h3>
            {context && (
              <p className="text-sm text-gray-500 mt-1">
                {context.eventType && (
                  <span className="capitalize">{context.eventType}</span>
                )}
                {context.budget && (
                  <span className="ml-2">
                    • Budget: ${context.budget.min}-${context.budget.max}
                  </span>
                )}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#406A56]/10 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search and filters */}
        <div className="p-4 space-y-4 bg-white/30 border-b border-[#406A56]/10">
          {/* Search bar */}
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search gifts..."
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#406A56] transition-colors"
            />
          </div>

          {/* Provider tabs */}
          <ProviderTabs
            activeProvider={activeProvider}
            onChange={setActiveProvider}
            variant="minimal"
          />

          {/* Category chips */}
          <div className="flex items-center justify-between">
            <CategoryChips
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              activeProvider={activeProvider}
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-colors ${
                showFilters ? 'bg-[#406A56] text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Filter size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Recommendations section */}
          {recommendations.length > 0 && !searchQuery && !selectedCategory && activeProvider === 'all' && (
            <section>
              <h4 className="font-handwritten text-lg text-[#406A56] mb-3 flex items-center gap-2">
                <Sparkles size={16} />
                Recommended for this occasion
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {recommendations.map(({ product, reason }) => (
                  <motion.div
                    key={product.id}
                    onClick={() => handleSelectProduct(product)}
                    className={`cursor-pointer ${selectedProduct?.id === product.id ? 'ring-2 ring-[#406A56] rounded-2xl' : ''}`}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <ProductCard
                      product={product}
                      variant="compact"
                      onToggleFavorite={handleToggleFavorite}
                      isFavorite={favorites.includes(product.id)}
                    />
                    <p className="text-xs text-[#406A56] mt-1 text-center font-handwritten">{reason}</p>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* All products */}
          <section>
            <h4 className="font-handwritten text-lg text-[#406A56] mb-3">
              {searchQuery ? 'Search Results' : 'All Gifts'}
            </h4>
            
            {filteredProducts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No gifts found matching your criteria</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {filteredProducts.map((product) => (
                  <motion.div
                    key={product.id}
                    onClick={() => handleSelectProduct(product)}
                    className={`cursor-pointer ${selectedProduct?.id === product.id ? 'ring-2 ring-[#406A56] rounded-2xl' : ''}`}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <ProductCard
                      product={product}
                      variant="compact"
                      onToggleFavorite={handleToggleFavorite}
                      isFavorite={favorites.includes(product.id)}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Selected product preview */}
        <AnimatePresence>
          {selectedProduct && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="p-4 bg-white border-t border-[#406A56]/10"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  <img
                    src={selectedProduct.thumbnail}
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-playfair font-semibold text-[#2d2d2d] truncate">
                    {selectedProduct.name}
                  </h4>
                  <p className="text-[#406A56] font-bold">${selectedProduct.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="px-4 py-2 text-gray-500 hover:text-[#2d2d2d] transition-colors"
                  >
                    Cancel
                  </button>
                  <motion.button
                    onClick={handleConfirmSelection}
                    className="flex items-center gap-2 px-6 py-2 bg-[#406A56] text-white rounded-xl font-medium"
                    whileTap={{ scale: 0.98 }}
                  >
                    <Check size={16} />
                    Select Gift
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );

  if (typeof window === 'undefined') return null;
  return createPortal(modal, document.body);
}

// Compact inline gift selector for PostScript editor
interface InlineGiftSelectorProps {
  onSelectGift: (product: Product) => void;
  selectedGift?: Product | null;
  onRemoveGift?: () => void;
}

export function InlineGiftSelector({
  onSelectGift,
  selectedGift,
  onRemoveGift,
}: InlineGiftSelectorProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (selectedGift) {
    return (
      <div className="flex items-center gap-3 p-3 bg-[#406A56]/10 rounded-xl border border-[#406A56]/20">
        <div className="w-14 h-14 rounded-lg overflow-hidden bg-white flex-shrink-0">
          <img
            src={selectedGift.thumbnail}
            alt={selectedGift.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-handwritten text-[#406A56] text-sm">Attached Gift</p>
          <h4 className="font-playfair font-semibold text-[#2d2d2d] truncate text-sm">
            {selectedGift.name}
          </h4>
          <p className="text-[#406A56] font-bold text-sm">${selectedGift.price.toFixed(2)}</p>
        </div>
        <button
          onClick={onRemoveGift}
          className="p-2 text-gray-400 hover:text-[#C35F33] transition-colors"
        >
          <X size={18} />
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="w-full flex items-center gap-3 p-4 border-2 border-dashed border-[#406A56]/30 rounded-xl text-[#406A56] hover:bg-[#406A56]/5 hover:border-[#406A56]/50 transition-all"
      >
        <div className="w-10 h-10 rounded-full bg-[#406A56]/10 flex items-center justify-center">
          <Gift size={20} />
        </div>
        <div className="text-left">
          <p className="font-medium">Add a Gift</p>
          <p className="text-sm opacity-70">Attach a physical gift to this PostScript</p>
        </div>
      </button>

      <GiftSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectGift={(product) => {
          onSelectGift(product);
          setIsModalOpen(false);
        }}
        title="Choose a Gift"
        maxWidth="max-w-4xl"
      />
    </>
  );
}
