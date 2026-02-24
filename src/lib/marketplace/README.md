# Marketplace API Services

Unified marketplace integration for YoursTruly V2. Supports three providers:

| Provider | Type | Key Differentiator |
|----------|------|-------------------|
| **Prodigi** | Print-on-Demand | **PHOTOBOOKS** + Wall Art + Calendars |
| **Spocket** | Dropshipping | US/EU suppliers, curated quality gifts |
| **Floristone** | Flowers | Same-day flower delivery |

## Configuration

Add the following environment variables to `.env.local`:

```bash
# Floristone (Flowers & Gifts)
FLORISTONE_API_KEY=your-floristone-api-key
FLORISTONE_API_PASSWORD=your-floristone-api-password

# Spocket (Curated Dropshipping)
SPOCKET_API_KEY=your-spocket-api-key

# Prodigi (Print-on-Demand + PHOTOBOOKS)
PRODIGI_API_KEY=your-prodigi-api-key
PRODIGI_SANDBOX=true  # Set to 'false' for production
```

## API Routes

### GET /api/marketplace/products

Get products from a marketplace provider.

**Query Parameters:**
- `provider` (required): `'floristone' | 'spocket' | 'prodigi'`
- `category`: Category ID (provider-specific)
- `search`: Search term (Floristone & Spocket)
- `page`: Page number (default: 1)
- `perPage`: Items per page (default: 50, max: 100)
- `featured`: If true, returns featured products from all providers

**Examples:**

```bash
# Get Prodigi photobooks (PRIORITY)
GET /api/marketplace/products?provider=prodigi&category=photobooks

# Get Floristone birthday flowers
GET /api/marketplace/products?provider=floristone&category=bd&search=roses

# Get Spocket curated gifts
GET /api/marketplace/products?provider=spocket&category=jewelry

# Get featured products from all providers
GET /api/marketplace/products?featured=true
```

**Response:**
```json
{
  "provider": "prodigi",
  "products": [
    {
      "id": "GLOBAL-PHOT-8X8",
      "name": "8x8" Softcover Photobook",
      "description": "Beautiful softcover photo book with premium paper...",
      "price": 24.99,
      "currency": "USD",
      "images": [],
      "thumbnail": "",
      "provider": "prodigi",
      "category": "photobooks",
      "inStock": true,
      "providerData": {
        "sku": "GLOBAL-PHOT-8X8",
        "isPhotobook": true
      }
    }
  ],
  "total": 8,
  "page": 1,
  "perPage": 50,
  "hasMore": false
}
```

### GET /api/marketplace/products/[id]

Get details for a specific product.

**Query Parameters:**
- `provider` (required): `'floristone' | 'spocket' | 'prodigi'`

**Example:**
```bash
GET /api/marketplace/products/GLOBAL-PHOT-8X8?provider=prodigi
```

### GET /api/marketplace/categories

Get categories from marketplace providers.

**Query Parameters:**
- `provider` (optional): Specific provider, or omit to get all

**Example:**
```bash
GET /api/marketplace/categories?provider=prodigi
```

### POST /api/marketplace/shipping

Calculate shipping rates for items.

**Request Body:**
```json
{
  "provider": "prodigi",
  "items": [
    {
      "productId": "GLOBAL-PHOT-8X8",
      "quantity": 1
    }
  ],
  "address": {
    "name": "John Doe",
    "address1": "123 Main St",
    "city": "New York",
    "stateCode": "NY",
    "zip": "10001",
    "countryCode": "US"
  }
}
```

**Response:**
```json
{
  "provider": "prodigi",
  "rates": [
    {
      "id": "Standard",
      "name": "Standard Shipping",
      "price": 5.99,
      "currency": "USD",
      "minDays": 3,
      "maxDays": 7,
      "provider": "prodigi"
    }
  ],
  "estimate": {
    "subtotal": 24.99,
    "shipping": 5.99,
    "tax": 0,
    "total": 30.98,
    "currency": "USD"
  }
}
```

## Client Usage

### Using the MarketplaceService

```typescript
import { MarketplaceService, isValidProvider } from '@/lib/marketplace';

// Create service instance
const service = new MarketplaceService('prodigi');

// Get photobooks (PRIORITY feature)
const photobooks = await service.getProducts('photobooks', undefined, undefined, 1, 20);

// Get product details
const product = await service.getProductDetails('GLOBAL-PHOT-8X8');

// Calculate shipping
const rates = await service.calculateShipping(
  [{ productId: 'GLOBAL-PHOT-8X8', quantity: 1 }],
  {
    name: 'John Doe',
    address1: '123 Main St',
    city: 'New York',
    stateCode: 'NY',
    zip: '10001',
    countryCode: 'US'
  }
);

// Get photobook-specific data
const photobookData = await service.getPhotobookData();
// Returns: { sizes, bindings, pages }
```

### Helper Functions

```typescript
import { 
  getEnabledProviders, 
  getFeaturedProducts,
  searchAllProviders,
  getAllCategories,
  getPhotobooks,
  getWallArt,
} from '@/lib/marketplace';

// Get all enabled providers
const providers = getEnabledProviders();

// Get featured products from all providers
const featured = await getFeaturedProducts(10);

// Search across all providers
const results = await searchAllProviders('birthday');

// Get all categories from all providers
const allCategories = await getAllCategories();

// Get photobooks specifically (key YoursTruly feature)
const photobooks = await getPhotobooks(1, 20);

// Get wall art and canvas
const wallArt = await getWallArt(1, 20);
```

## Provider-Specific Features

### Prodigi (PRIORITY) - Photobooks & Print-on-Demand

**Key Products:**
- **Photobooks** (key differentiator): 8x8", 8x10", 10x10", 12x12", Layflat
- Canvas Prints: 16x20", 20x30", 24x36"
- Wall Calendars & Desk Calendars
- Greeting Cards & Postcards
- Apparel, Mugs, Gifts

**API Features:**
- Quote endpoint for real-time pricing
- SKU-based product identification
- Sandbox environment for testing
- Multiple assets per item (for photobooks)

**Photobook Configuration:**
```typescript
const attributes = {
  sizes: [
    { id: '8X8', name: '8x8" Square', dimensions: '8x8"' },
    { id: '8X10', name: '8x10" Portrait', dimensions: '8x10"' },
    { id: '10X10', name: '10x10" Square', dimensions: '10x10"' },
    { id: '12X12', name: '12x12" Square', dimensions: '12x12"' },
  ],
  bindings: [
    { id: 'softcover', name: 'Softcover' },
    { id: 'hardcover', name: 'Hardcover' },
    { id: 'layflat', name: 'Layflat Premium' },
  ],
  pages: { min: 20, max: 200, default: 40 }
};
```

### Spocket - Curated Dropshipping

**Categories:**
- Home Decor
- Jewelry & Accessories
- Tech Gadgets
- Apparel
- Kids & Baby
- Pet Supplies
- Beauty & Personal Care
- Sports & Outdoors

**Features:**
- 25% markup (lower than Doba due to better quality)
- US/EU suppliers = faster shipping
- Curated product selection
- Trending products endpoint
- Supplier location info (for "Ships from US/EU" badges)

### Floristone - Flowers

**Categories:**
- Best Sellers (bs)
- Birthday (bd)
- Anniversary (an)
- Love & Romance (lr)
- Get Well (gw)
- New Baby (nb)
- Thank You (ty)
- Sympathy (sy)

**Features:**
- Same-day delivery option
- Next-day delivery option
- Keyword search (client-side filtering)
- No markup (pass-through pricing)

## Caching

Product listings are cached with provider-specific TTLs:
- **Floristone**: 1 hour
- **Spocket**: 1 day
- **Prodigi**: 4 hours

## Types

```typescript
import type { 
  Product, 
  ProductVariant,
  Category,
  ShippingRate,
  ShippingAddress,
  ProductProvider 
} from '@/lib/marketplace';
```

See `src/lib/marketplace/types.ts` for complete type definitions.

## Migration Notes

**Previous providers:**
- ❌ Doba → **Spocket** (better quality, faster shipping)
- ❌ Printful → **Prodigi** (photobooks support!)

**Why the change?**
1. **Prodigi** is the only major POD provider with photobook API support
2. **Spocket** offers curated US/EU suppliers vs Doba's commodity products
3. Faster shipping times improve gift delivery experience
