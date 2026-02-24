# YoursTruly Marketplace UI Components

A scrapbook-inspired marketplace UI for browsing flowers, gifts, and personalized print products.

## Components

### ProductCard
Grid card displaying product image, title, price, and provider badge.

```tsx
import { ProductCard } from '@/components/marketplace';

<ProductCard 
  product={product}
  variant="polaroid" // 'default' | 'compact' | 'polaroid'
  onAddToCart={(product) => {...}}
  onToggleFavorite={(productId) => {...}}
  isFavorite={false}
/>
```

### ProductGrid
Responsive grid layout for ProductCards with loading and empty states.

```tsx
import { ProductGrid } from '@/components/marketplace';

<ProductGrid
  products={products}
  variant="polaroid"
  columns={4}
  gap="md"
  onAddToCart={handleAddToCart}
  onToggleFavorite={handleToggleFavorite}
  favoriteIds={['fl-001', 'gf-002']}
  isLoading={false}
/>
```

### ProviderTabs
Tab navigation for switching between Flowers, Gifts, and Prints.

```tsx
import { ProviderTabs } from '@/components/marketplace';

<ProviderTabs
  activeProvider="flowers" // 'flowers' | 'gifts' | 'prints' | 'all'
  onChange={(provider) => setProvider(provider)}
  counts={{ all: 100, flowers: 40, gifts: 35, prints: 25 }}
  variant="pills" // 'pills' | 'cards' | 'minimal'
/>
```

### CategorySidebar
Collapsible category navigation sidebar.

```tsx
import { CategorySidebar, CategorySheet, CategoryChips } from '@/components/marketplace';

// Desktop sidebar
<CategorySidebar
  selectedCategory="birthday"
  onSelectCategory={(cat) => setCategory(cat)}
  activeProvider="flowers"
/>

// Mobile sheet
<CategorySheet
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  selectedCategory={category}
  onSelectCategory={setCategory}
  activeProvider={provider}
/>

// Horizontal chips
<CategoryChips
  selectedCategory={category}
  onSelectCategory={setCategory}
  activeProvider={provider}
/>
```

### GiftSelectionModal
Modal for selecting gifts from the PostScript editor.

```tsx
import { GiftSelectionModal, InlineGiftSelector } from '@/components/marketplace';

// Full modal
<GiftSelectionModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onSelectGift={(product) => {...}}
  context={{
    eventType: 'birthday',
    budget: { min: 20, max: 100 },
    contactId: '123',
    postscriptId: '456'
  }}
  title="Choose a Birthday Gift"
/>

// Compact inline selector
<InlineGiftSelector
  selectedGift={attachedGift}
  onSelectGift={setAttachedGift}
  onRemoveGift={() => setAttachedGift(null)}
/>
```

## Pages

### /marketplace
Main marketplace browsing page with:
- Provider tabs (Flowers | Gifts | Prints)
- Category sidebar with filters
- Product grid with polaroid-style cards
- Search functionality
- Mobile-responsive design

### /marketplace/[provider]/[productId]
Product detail page with:
- Image gallery with thumbnail strip
- Product information and pricing
- Variant selection
- Quantity selector
- Add to cart button
- "Send as Gift" option (links to PostScript flow)

## Types

All marketplace types are exported from `@/types/marketplace`:

```tsx
import { 
  Product, 
  ProductVariant, 
  CartItem, 
  Cart, 
  ProviderType, 
  ProductCategory,
  Category,
  GiftSelectionContext 
} from '@/types/marketplace';
```

## Mock Data

Mock products are available for development:

```tsx
import { 
  allProducts,
  flowerProducts,
  giftProducts,
  printProducts,
  getProductById,
  searchProducts 
} from '@/components/marketplace';
```

## Styling

The marketplace uses the existing YoursTruly design system:
- **Colors**: Warm cream background (#F2F1E5), green accent (#406A56), red for flowers (#C35F33), purple for prints (#4A3552)
- **Fonts**: Caveat (handwritten) for accents, Playfair Display for titles
- **Cards**: Polaroid-style with tape decorations for keepsake feel

Add the marketplace styles to your globals.css:
```css
@import "../styles/marketplace.css";
```

## Integration with PostScript

To add gift selection to a PostScript:

```tsx
import { InlineGiftSelector } from '@/components/marketplace';
import { Product } from '@/types/marketplace';

function PostScriptEditor() {
  const [attachedGift, setAttachedGift] = useState<Product | null>(null);

  return (
    <form>
      {/* ... message editor ... */}
      
      <InlineGiftSelector
        selectedGift={attachedGift}
        onSelectGift={setAttachedGift}
        onRemoveGift={() => setAttachedGift(null)}
      />
      
      <button type="submit">Save PostScript</button>
    </form>
  );
}
```

## Future API Integration

The components are designed to work with real APIs. Replace the mock data imports with API calls:

```tsx
// Instead of:
import { allProducts } from '@/components/marketplace/mockData';

// Use:
const { data: products } = useSWR('/api/marketplace/products', fetcher);
```
