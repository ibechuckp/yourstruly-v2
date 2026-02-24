/**
 * Marketplace Components
 * Export all marketplace-related components for easy imports
 */

// Components
export { default as ProductCard } from './ProductCard';
export { default as ProductGrid, ProductList } from './ProductGrid';
export { default as ProviderTabs, ProviderTabsScrollable } from './ProviderTabs';
export { default as CategorySidebar, CategorySheet, CategoryChips } from './CategorySidebar';
export { 
  default as GiftSelectionModal, 
  InlineGiftSelector 
} from './GiftSelectionModal';

// Mock data (for development)
export {
  allProducts,
  flowerProducts,
  giftProducts,
  printProducts,
  providerConfigs,
  giftRecommendations,
  getProductsByProvider,
  getProductsByCategory,
  getProductById,
  searchProducts,
  filterProducts,
} from './mockData';
