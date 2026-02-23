# YoursTruly v2 Marketplace Integration Research

## Executive Summary

This document analyzes the existing marketplace integrations in the YoursTruly Laravel codebase and provides recommendations for v2 implementation. The current system supports three main marketplace providers: **Floristone** (flowers/gifts), **Doba** (dropshipping), and **Printful** (print-on-demand).

---

## 1. Existing Integration Analysis

### 1.1 Floristone (Flowers & Gifts)

**Service File:** `app/Services/FloristoneService.php`

#### API Endpoints Used
| Endpoint | URL | Purpose |
|----------|-----|---------|
| getproducts | `https://www.floristone.com/api/rest/flowershop/getproducts` | Fetch flower products |
| gettotal | `https://www.floristone.com/api/rest/flowershop/gettotal` | Get product totals |
| getauthorizenetkey | `https://www.floristone.com/api/rest/flowershop/getauthorizenetkey` | Payment auth |
| placeorder | `https://www.floristone.com/api/rest/flowershop/placeorder` | Submit orders |

#### Authentication
- Basic Auth using `apiKey` and `apiPass`
- Config keys: `app.floristone_api_key`, `app.floristone_password`

#### Product Sync Mechanism
- **No local caching** - Real-time API calls for product listings
- Supports category filtering (all, occasions, price ranges)
- Supports keyword search (fetches all products, filters locally)
- Product codes used as identifiers (e.g., `CODE` field)

#### Order Flow
1. Products added to cart with `GIFT_DELIVERY` or `IMMEDIATE_DELIVERY` type
2. Shipping/tax calculated via `getOrderTotal` endpoint
3. Orders created via `OrdersController::createFloristoneOrder()`
4. Order payload includes:
   - Customer details
   - Products array with recipient info
   - Delivery date
   - CC info (Auth.net token)

#### Pricing Markup Strategy
- **No markup** - Prices passed through as-is from Floristone
- Revenue from affiliate/wholesale pricing

#### Flower Categories Supported
```php
[
    'Occasions' => ['bs', 'ao', 'bd', 'an', 'lr', 'gw', 'nb', 'ty', 'sy'],
    'Product Types' => ['c', 'o', 'v', 'r', 'x', 'p', 'b'],
    'Prices' => ['u60', '60t80', '80t100', 'a100']
]
```

---

### 1.2 Doba (Dropshipping)

**Service File:** `app/Services/DobaService.php`

#### API Endpoints Used
| Endpoint | URL | Purpose |
|----------|-----|---------|
| categories | `http://openapi.doba.com/api/category/doba/list` | Get category tree |
| products | `https://openapi.doba.com/api/goods/doba/spu/list` | Product listings |
| tagList | `https://openapi.doba.com/api/inventory/doba/queryTagList` | Get tags |
| productsByTag | `https://openapi.doba.com/api/inventory/doba/querySpuIdByTag` | Tag-based search |
| details | `https://openapi.doba.com/api/goods/doba/spu/detail` | Product details |
| shipping | `https://openapi.doba.com/api/shipping/doba/cost/goods` | Shipping rates |
| createOrder | `https://openapi.doba.com/api/order/doba/importOrder` | Create orders |
| orderDetails | `https://openapi.doba.com/api/order/doba/queryOrder` | Order status |
| paymentCards | `https://openapi.doba.com/api/pay/payManage/doba/queryPaymentCardList` | Payment methods |
| orderPayment | `https://api.pay/payment/doba/submit` | Submit payment |
| orderShipment | `https://openapi.doba.com/api/order/doba/queryLogisTrack` | Tracking |

#### Authentication
- RSA-SHA256 signature-based auth
- Headers required:
  - `appKey`
  - `signType`: rsa2
  - `timestamp`: Milliseconds
  - `sign`: Base64 encoded RSA signature

#### Product Sync Mechanism
- **Cached for 1 day** using Laravel Cache (`Cache::remember`)
- SPU (Standard Product Unit) IDs as primary identifiers
- Category mapping stored in `ProductCategory` model via `doba_id` field
- Tag-based categorization via `doba_tag` field

#### Order Flow
1. Items added to cart with `item_number` (stock keeping unit)
2. Shipping rates fetched via `shipping` endpoint
3. Tax calculated: `(total + shipping) * 0.03` (3% rate)
4. Orders submitted via `createDobaOrder()`
5. Payment processed separately via `orderPayment()`

#### Pricing Markup Strategy
```php
private $dobaMarkupRate = 0.4; // 40% markup

// Price calculation:
$price = $dobaProduct->minPrice + ($dobaProduct->minPrice * $this->dobaMarkupRate);
// OR for variants:
$price = $sellingPrice + ($sellingPrice * $this->dobaMarkupRate);
```

**Key Doba Categories Mapped:**
- Sports
- Toys, Kids & Baby
- Pets
- Electronics
- Card Stock & Card Filing
- Arts & Crafts
- Entertainment

---

### 1.3 Printful (Print-on-Demand)

**Service File:** `app/Services/PrintfulService.php`

#### API Endpoints Used
| Endpoint | URL | Purpose |
|----------|-----|---------|
| categories | `https://api.printful.com/categories/{id}` | Category info |
| products | `https://api.printful.com/products` | Product catalog |
| product details | `https://api.printful.com/products/{id}` | Product details |
| sizes | `https://api.printful.com/products/{id}/sizes` | Size charts |
| templates | `https://api.printful.com/mockup-generator/templates/{id}` | Design templates |
| orders | `https://api.printful.com/orders` | Create orders |
| estimate-costs | `https://api.printful.com/orders/estimate-costs` | Cost estimation |
| shipping/rates | `https://api.printful.com/shipping/rates` | Shipping rates |
| tax/rates | `https://api.printful.com/tax/rates` | Tax calculation |

#### Authentication
- Bearer token auth via `Authorization: Bearer {token}` header
- Config key: `services.printful.api_key`

#### Product Sync Mechanism
- **Cached for 1-4 hours** depending on endpoint
- Products fetched by category ID
- Variants have unique IDs for ordering
- Templates fetched for mockup generation

#### Order Flow
1. User designs product in `PrintfulBuilder` component
2. Design elements stored in `additional_data` as JSON:
   ```json
   {
     "variant": {"id": 123, ...},
     "elements": {"front": {"url": "...", "top": 0, "left": 0, "width": 200, ...}},
     "template": {"print_area_width": 1800, "print_area_height": 2400},
     "options": {"option_id": "value"}
   }
   ```
3. Shipping/tax estimated via Printful API
4. Orders created via `createPrintfulOrder()`
5. Files uploaded as URLs with positioning data

#### Pricing Markup Strategy
- **No hardcoded markup** in code
- Printful prices passed through with margin added at product level
- Cost estimation endpoint used for real-time pricing

#### Current Printful Product Types Supported
Based on code analysis:
- Apparel (t-shirts, hoodies, etc.) with color/size variants
- Products with placement areas (front, back, etc.)
- Products supporting image uploads with positioning

---

## 2. Database Schema Analysis

### Key Tables

#### `products` (Custom Products)
| Field | Type | Notes |
|-------|------|-------|
| id | bigint | Primary key |
| vendor_id | bigint | For vendor marketplace |
| category_id | bigint | Links to product_categories |
| title | string | Product name |
| slug | string | URL slug |
| description | text | HTML description |
| price | decimal | Base price |
| quantity | int | Stock level |
| color | string | CSV of colors |
| size | string | CSV of sizes |
| material | string | Material type |
| type | string | Product type |
| model | string | Model info |
| visibility | boolean | Show/hide |

#### `carts`
| Field | Type | Notes |
|-------|------|-------|
| id | bigint | Primary key |
| user_id | bigint | Nullable for guests |
| session_id | string | For guest users |
| market | string | custom/offer/doba/floristone/printful |
| category | string | Category slug |
| product_id | string | Provider's product ID |
| title | string | Product title |
| image | string | Image URL |
| price | float | Unit price |
| quantity | int | Qty in cart |
| total | float | Line total |
| color | string | Selected color |
| size | string | Selected size |
| item_number | string | Doba SKU |
| offer_id | bigint | For bundle offers |
| additional_data | json | Printful designs, etc. |
| delivery_details | json | Shipping method selected |
| shipping_methods | json | Available shipping options |
| custom_delivery | json | Gift delivery config |

#### `orders`
| Field | Type | Notes |
|-------|------|-------|
| id | bigint | Primary key |
| user_id | bigint | Customer |
| session_id | string | Guest tracking |
| order_number | string | Formatted: CU-/DO-/FL-/PR- prefix |
| delivery_details | json | Address + contact |
| billing_details | json | Billing address |
| payment_details | json | Stripe payment info |
| delivery_date | date | Scheduled delivery |
| status | string | pending/processing/delivered/canceled |
| market | string | Source marketplace |
| market_number | string | External order ID |
| subtotal | float | Before tax/shipping |
| delivery | float | Shipping cost |
| tax | float | Tax amount |
| total | float | Final total |
| custom_delivery | json | Gift metadata |

#### `order_items`
| Field | Type | Notes |
|-------|------|-------|
| id | bigint | Primary key |
| order_id | bigint | Parent order |
| product_id | string | Provider product ID |
| market | string | Source marketplace |
| category | string | Category slug |
| title | string | Product name |
| price | float | Unit price paid |
| original_price | float | Pre-discount price |
| quantity | int | Qty ordered |
| total | float | Line total |
| details | json | Color, size, image, link |
| additional_data | json | Printful design data |
| market_item_no | string | Doba item number |
| market_order_details | json | External order response |
| delivery_details | json | Shipping method used |

#### `postscript_gifts`
| Field | Type | Notes |
|-------|------|-------|
| id | bigint | Primary key |
| postscript_id | bigint | Linked PostScript |
| code | string | Product code |
| title | string | Gift title |
| image | string | Image URL |
| price | decimal | Gift price |
| qty | int | Quantity |
| info | json | Additional metadata |
| ispaid | boolean | Payment status |
| paid_at | datetime | Payment timestamp |
| order_id | string | Linked order |

---

## 3. PostScript Gift Integration

### How Gifts Attach to PostScripts

**File:** `app/Http/Livewire/Postscriptum/Gifts.php`

1. **Gift Selection Flow:**
   - User creates/edits a PostScript
   - Opens gift selection modal (Livewire component)
   - Can choose between:
     - **Flowers** (Floristone) - 9000+ products
     - **Products** (Doba) - Categories: Sports, Toys, Pets, Electronics, Arts & Crafts, Entertainment

2. **Gift Data Structure:**
   ```php
   $gift = [
       'CODE' => 'product_code',
       'NAME' => 'Product Name',
       'PRICE' => 49.99,
       'SMALL' => 'thumbnail_url',
       'LARGE' => 'image_url',
       'DESCRIPTION' => 'Product description',
       'APISERVICE' => 'floristone|doba',
       'CATEGORY' => 'flowers|category_slug'
   ];
   ```

3. **Cart Integration:**
   - Gifts added to cart via `CartService::addProduct()`
   - Special `custom_delivery` metadata marks items as gifts:
     ```php
     $customDelivery = [
         'id' => 'GIFT_DELIVERY',
         'contact_id' => $postScript->contact_id,
         'post_script_id' => $postScript->id,
         'delivery_date' => $calculatedDate,
         'event_id' => $postScript->event_key,
         'event_title' => $eventLabel,
         'after_years' => $years // for death-relative events
     ];
     ```

4. **Gift Delivery Triggers:**
   - **Date-based:** Specific calendar date (Birthdays, Anniversaries, etc.)
   - **Event-based:** Relative to user's death (Day of death, Next day off, etc.)
   - **Holiday-based:** Easter, Christmas, Thanksgiving (calculated dynamically)

5. **Order Processing:**
   - `CreateExternalOrdersJob` runs periodically
   - Checks for deceased users with pending gift orders
   - Calculates delivery dates based on event rules
   - Submits orders when trigger date is reached

---

## 4. Printful Deep Dive for v2

### Current Implementation Gaps

The existing Printful integration focuses on **apparel with image uploads**. For YoursTruly v2's "Keepsakes & Gifts" vision, we need to expand to:

### 4.1 Recommended Printful Products for v2

Based on Printful's catalog and YoursTruly's use case:

| Product Category | Use Case | API Endpoint |
|------------------|----------|--------------|
| **Photo Books** | Memory compilations | Not currently in Printful API |
| **Wall Art** | Canvas prints, posters | `/products` (category filtering) |
| **Calendars** | Family photo calendars | `/products` (calendar category) |
| **Mugs** | Photo mugs | `/products` |
| **Pillows** | Photo pillows | `/products` |
| **Blankets** | Photo blankets | `/products` |
| **Phone Cases** | Photo cases | `/products` |
| **Cards** | Greeting cards, postcards | `/products` |

### 4.2 Photobook Alternatives

**Important Finding:** Printful does NOT currently offer photobooks via API. Recommended alternatives:

1. **Prodigi** (prodigi.com)
   - Offers photo book API
   - Soft and hard cover options
   - Global dropshipping

2. **Pwinty**
   - Premium photo book API
   - Global print network

3. **Lulu**
   - Book printing API
   - Good for memory books

4. **Print API (printapi.io)**
   - Photo book focused
   - European provider

### 4.3 Printful Order Structure for Photo Products

Current implementation in `PrintfulService::estimateOrder()`:

```php
$printfulOrderData = [
    'recipient' => [
        'name' => $deliveryContact->name,
        'address1' => $deliveryAddress->street,
        'city' => $deliveryAddress->city,
        'state_code' => $deliveryAddress->state,
        'country_code' => 'US',
        'zip' => $deliveryAddress->zip,
        'phone' => $deliveryContact->phone,
        'email' => $deliveryContact->email,
    ],
    'items' => [
        [
            'variant_id' => $variant['id'],
            'quantity' => $quantity,
            'name' => $title,
            'files' => [
                [
                    'url' => $imageUrl,
                    'type' => 'front', // placement
                    'position' => [
                        'area_width' => 1800,
                        'area_height' => 2400,
                        'width' => 600,
                        'height' => 600,
                        'top' => 0,
                        'left' => 0,
                    ],
                ]
            ],
            'options' => [
                ['id' => 'option_key', 'value' => 'option_value']
            ],
        ]
    ],
    'shipping' => 'STANDARD',
    'confirm' => false,
    'gift' => false,
];
```

---

## 5. Design Recommendations for YoursTruly v2

### 5.1 Keepsakes & Gifts Marketplace Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    KEEPSAKES & GIFTS MARKETPLACE                 │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────┐ │
│  │   Custom    │  │   Doba      │  │ Floristone  │  │ Printful│ │
│  │  Products   │  │ Dropship    │  │   Flowers   │  │   POD   │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────┘ │
│         │                │                │              │       │
│         └────────────────┴────────────────┴──────────────┘       │
│                              │                                   │
│                    ┌─────────┴─────────┐                         │
│                    │  Unified Product  │                         │
│                    │     Interface     │                         │
│                    └─────────┬─────────┘                         │
│                              │                                   │
│         ┌────────────────────┼────────────────────┐              │
│         ▼                    ▼                    ▼              │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐        │
│  │   Memory    │     │  Event      │     │  Direct     │        │
│  │   Books     │     │  Books      │     │  Purchase   │        │
│  └─────────────┘     └─────────────┘     └─────────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 PostScript Physical Gift Attachment

**Current Flow:**
```
PostScript Creation → Gift Selection → Cart Addition → Scheduled Delivery
```

**Recommended v2 Enhancements:**

1. **Gift Recommendations Engine:**
   - Based on contact relationship type
   - Based on event type (Birthday vs Memorial)
   - Budget-based suggestions

2. **Gift Templates:**
   - Pre-curated gift bundles
   - "Sympathy Package" - Flowers + Memorial Book
   - "Birthday Memory" - Photo Book + Gift

3. **Multi-Gift PostScripts:**
   - Allow multiple gifts per PostScript
   - Staggered delivery (immediate + scheduled)

4. **Gift Preview:**
   - Show gift mockup with recipient's photos
   - Preview memory book layouts

### 5.3 Print-on-Demand Workflow for Photo Products

**Recommended Architecture:**

```php
// New Service: PhotobookService
class PhotobookService {
    // Integrates with Printful (for prints) + Prodigi (for books)
    
    public function createMemoryBook($memoryId, $layoutTemplate) {
        // 1. Fetch memory from API
        // 2. Apply layout template
        // 3. Generate PDF/Images
        // 4. Upload to provider
        // 5. Return product for cart
    }
    
    public function createEventBook($eventId, $template) {
        // Similar flow for events
    }
    
    public function createCalendar($memoryIds, $year) {
        // Generate calendar with photo highlights
    }
}
```

**Workflow Steps:**

1. **Content Selection**
   - User selects memories/events to include
   - AI-assisted "best photo" selection
   - Auto-arrange by date/theme

2. **Template Selection**
   - Memory Book templates (Chronological, Thematic, Highlights)
   - Event Book templates (Wedding, Graduation, Birthday)
   - Calendar layouts

3. **Layout Editor**
   - Drag-drop photo arrangement
   - Text captions
   - Theme customization (colors, fonts)

4. **Preview & Approve**
   - Full book preview
   - Page-by-page editing
   - Cover customization

5. **Order Placement**
   - Add to cart as custom product
   - Stored as `additional_data` JSON
   - Processed via appropriate provider

### 5.4 Pricing and Margin Strategies

**Current Markup Structure:**
| Provider | Markup | Notes |
|----------|--------|-------|
| Doba | 40% | Hardcoded in MarketplaceController |
| Floristone | 0% | Pass-through pricing |
| Printful | Variable | Set at product level |

**Recommended v2 Strategy:**

```php
// Unified pricing service
class PricingService {
    protected $markupRules = [
        'doba' => 0.40,           // 40% markup
        'floristone' => 0.15,     // 15% markup
        'printful' => 0.30,       // 30% markup
        'prodigi_books' => 0.35,  // 35% markup
        'custom_products' => 0.50, // 50% markup
    ];
    
    protected $categoryAdjustments = [
        'flowers' => -0.05,      // Competitive category
        'photobooks' => 0.10,    // Premium category
        'keepsakes' => 0.15,     // High-value category
    ];
    
    public function calculatePrice($baseCost, $provider, $category) {
        $markup = $this->markupRules[$provider] ?? 0.30;
        $adjustment = $this->categoryAdjustments[$category] ?? 0;
        
        return $baseCost * (1 + $markup + $adjustment);
    }
}
```

**Dynamic Pricing Factors:**
- Membership tier discounts
- Bulk order discounts (multiple books)
- Seasonal promotions
- Loyalty rewards

### 5.5 UX Flow for Creating Photobooks from Memories

```
┌─────────────────────────────────────────────────────────────────┐
│           MEMORY TO PHOTOBOOK WORKFLOW                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  STEP 1: SELECT CONTENT                                          │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  [ ] Select All Memories                                │    │
│  │  [ ] Select by Tag: #family #vacation #milestones      │    │
│  │  [ ] Select by Date Range                               │    │
│  │  [ ] AI Suggest Best Photos                             │    │
│  └─────────────────────────────────────────────────────────┘    │
│                          │                                       │
│                          ▼                                       │
│  STEP 2: CHOOSE FORMAT                                           │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  [Memory Book]  [Event Book]  [Calendar]  [Prints]     │    │
│  │                                                         │    │
│  │  Size: [8x8\"] [10x10\"] [12x12\"]                      │    │
│  │  Cover: [Soft] [Hard] [Leather] [Linen]                │    │
│  │  Pages: [20] [40] [60] [80]                            │    │
│  └─────────────────────────────────────────────────────────┘    │
│                          │                                       │
│                          ▼                                       │
│  STEP 3: APPLY TEMPLATE                                          │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  [Chronological] [Thematic] [Highlights] [Collage]     │    │
│  │                                                         │    │
│  │  Auto-arrange by: [Date] [People] [Location] [Mood]    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                          │                                       │
│                          ▼                                       │
│  STEP 4: EDIT LAYOUT                                             │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  [Visual Page Editor - Drag/Drop Photos]               │    │
│  │  [Add Captions] [Add Quotes] [Add Dates]               │    │
│  │  [Change Layout] [Reorder Pages] [Delete Page]         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                          │                                       │
│                          ▼                                       │
│  STEP 5: PREVIEW & ORDER                                         │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  [Flip Through Book Preview]                           │    │
│  │  Price: $XX.XX | Est. Delivery: X days                 │    │
│  │                                                         │    │
│  │  [Add to Cart] [Save for Later] [Share Preview]        │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Technical Implementation Recommendations

### 6.1 New Database Tables

```sql
-- Photobook layouts/templates
CREATE TABLE book_templates (
    id bigint PRIMARY KEY,
    name varchar(255),
    category varchar(50), -- memory, event, calendar
    layout_json json, -- page layout definitions
    thumbnail varchar(255),
    provider varchar(50), -- prodigi, printful, etc.
    base_cost decimal(10,2),
    enabled boolean
);

-- User-created books (before ordering)
CREATE TABLE user_books (
    id bigint PRIMARY KEY,
    user_id bigint,
    template_id bigint,
    title varchar(255),
    content_ids json, -- memory/event IDs included
    layout_data json, -- user's custom layout
    preview_images json, -- generated preview URLs
    status varchar(50), -- draft, ready, ordered
    final_price decimal(10,2),
    created_at timestamp
);

-- Provider integration settings
CREATE TABLE marketplace_providers (
    id bigint PRIMARY KEY,
    name varchar(50), -- printful, doba, floristone, prodigi
    enabled boolean,
    config json, -- API keys, settings
    markup_percent decimal(5,2),
    categories json -- supported product categories
);
```

### 6.2 Service Architecture

```php
// New services to implement

interface KeepsakeProviderInterface {
    public function getProducts($category);
    public function calculateShipping($items, $address);
    public function createOrder($orderData);
    public function getOrderStatus($orderId);
}

class ProdigiService implements KeepsakeProviderInterface {
    // Photobook-specific integration
}

class EnhancedPrintfulService implements KeepsakeProviderInterface {
    // Extended for wall art, calendars, etc.
}

class KeepsakeOrchestratorService {
    // Routes orders to appropriate provider
    // Handles fallback providers
    // Manages pricing
}
```

### 6.3 API Endpoints for v2

```php
// New routes to add

// Memory to Book conversion
POST /api/memories/{id}/create-book
GET  /api/books/templates
POST /api/books/{id}/save-layout
POST /api/books/{id}/generate-preview

// Enhanced marketplace
GET  /api/marketplace/keepsakes
GET  /api/marketplace/gifts/recommended
POST /api/marketplace/gifts/attach-to-postscript

// Gift management
GET  /api/postscripts/{id}/gifts
POST /api/postscripts/{id}/gifts/bulk-add
PUT  /api/postscripts/{id}/gifts/{giftId}/schedule
```

---

## 7. Summary of Key Findings

### Strengths of Current Implementation
1. **Flexible cart system** - Handles multiple providers in single order
2. **Gift delivery scheduling** - Sophisticated date/event-based triggers
3. **Provider abstraction** - Clean service classes for each integration
4. **PostScript integration** - Gifts tied to meaningful lifecycle events

### Gaps for v2
1. **No photobook provider** - Printful doesn't support books; need Prodigi/Lulu
2. **Limited Printful usage** - Only apparel, not wall art/calendars
3. **Hardcoded markups** - Should be configurable per category
4. **No AI-assisted layout** - Manual design only
5. **Single-image focus** - No multi-photo products like books

### Priority Recommendations
1. **High:** Integrate Prodigi or similar for photobooks
2. **High:** Expand Printful to wall art, calendars, mugs
3. **Medium:** Build memory-to-book workflow with templates
4. **Medium:** Implement dynamic pricing service
5. **Low:** AI-powered photo selection and layout

---

## Appendix: Code Locations

### Key Files Referenced
- `app/Services/FloristoneService.php` - Flower integration
- `app/Services/DobaService.php` - Dropshipping integration
- `app/Services/PrintfulService.php` - Print-on-demand integration
- `app/Services/MarketplaceService.php` - Common utilities
- `app/Services/CartService.php` - Cart and order processing
- `app/Services/DeliveryService.php` - Shipping calculations
- `app/Http/Controllers/MarketplaceController.php` - Product browsing
- `app/Http/Controllers/OrdersController.php` - Order management
- `app/Http/Controllers/CartController.php` - Cart management
- `app/Http/Livewire/Postscriptum/Gifts.php` - Gift selection UI
- `app/Http/Livewire/User/Printful/PrintfulBuilder.php` - Design tool
- `app/Jobs/CreateExternalOrdersJob.php` - Scheduled gift processing
- `app/Models/Cart.php` - Cart model
- `app/Models/Order.php` - Order model
- `app/Models/OrderItem.php` - Order line items
- `app/Models/PostscriptGift.php` - Gift model
